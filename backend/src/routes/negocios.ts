import { Router, type Request, type Response } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma";
import {
  negocioCreateSchema,
  negocioUpdateSchema,
  negocioFilterSchema,
} from "../types/schemas";
import { parseCSV } from "../services/csv.service";
import { checkPresencia } from "../services/presencia.service";
import { calcularScore } from "../services/scoring.service";
import { calcularCalidadDatos } from "../services/calidad-datos.service";
import { enriquecerConGooglePlaces } from "../services/google-places.service";
import { evaluarAutomatizaciones } from "../services/automatizaciones.service";
import { requireAuth } from "../middleware/auth";
import { logActivity } from "../lib/activity-logger";

const router = Router();
router.use(requireAuth);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ─── GET /api/negocios — Listar con filtros y paginación ─

router.get("/", async (req: Request, res: Response) => {
  try {
    const filters = negocioFilterSchema.parse(req.query);
    const { page, limit, orderBy, order, busqueda, scoreMin, scoreMax, ...where } = filters;

    const prismaWhere: Record<string, unknown> = {};

    if (where.rubro) prismaWhere.rubro = where.rubro;
    if (where.comuna) prismaWhere.comuna = where.comuna;
    if (where.estadoPresencia) prismaWhere.estadoPresencia = where.estadoPresencia;
    if (where.estadoContacto) prismaWhere.estadoContacto = where.estadoContacto;
    if (where.nivelOportunidad) prismaWhere.nivelOportunidad = where.nivelOportunidad;
    if ((where as Record<string, unknown>).asignadoAId) prismaWhere.asignadoAId = (where as Record<string, unknown>).asignadoAId;

    if (scoreMin !== undefined || scoreMax !== undefined) {
      prismaWhere.score = {};
      if (scoreMin !== undefined) (prismaWhere.score as Record<string, number>).gte = scoreMin;
      if (scoreMax !== undefined) (prismaWhere.score as Record<string, number>).lte = scoreMax;
    }

    if (busqueda) {
      prismaWhere.nombre = { contains: busqueda, mode: "insensitive" };
    }

    const [data, total] = await Promise.all([
      prisma.negocio.findMany({
        where: prismaWhere,
        orderBy: { [orderBy]: order },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { analisis: true, contactos: true } } },
      }),
      prisma.negocio.count({ where: prismaWhere }),
    ]);

    res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

// ─── GET /api/negocios/stats — Estadísticas generales ────

router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [total, byPresencia, byContacto, byNivel, byRubro, byComuna, avgScore, nuevos7d, nuevos30d, topHot, seguimientosPendientes, ganadosPorComuna] = await Promise.all([
      prisma.negocio.count(),
      prisma.negocio.groupBy({ by: ["estadoPresencia"], _count: true }),
      prisma.negocio.groupBy({ by: ["estadoContacto"], _count: true }),
      prisma.negocio.groupBy({ by: ["nivelOportunidad"], _count: true }),
      prisma.negocio.groupBy({ by: ["rubro"], _count: true, orderBy: { _count: { rubro: "desc" } }, take: 20 }),
      prisma.negocio.groupBy({ by: ["comuna"], _count: true, orderBy: { _count: { comuna: "desc" } } }),
      prisma.negocio.aggregate({ _avg: { score: true } }),
      prisma.negocio.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.negocio.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.negocio.findMany({
        where: { nivelOportunidad: { in: ["ALTA", "MEDIA_ALTA"] }, estadoContacto: { notIn: ["CERRADO_GANADO", "CERRADO_PERDIDO", "CERRADO_NO_EXISTE"] } },
        orderBy: { score: "desc" },
        take: 10,
        select: { id: true, nombre: true, rubro: true, comuna: true, score: true, estadoPresencia: true, estadoContacto: true },
      }),
      prisma.negocio.count({ where: { proximoSeguimiento: { lte: now } } }),
      prisma.negocio.groupBy({ by: ["comuna"], where: { estadoContacto: "CERRADO_GANADO" }, _count: true }),
    ]);

    const byContactoMap = Object.fromEntries(byContacto.map((c) => [c.estadoContacto, c._count]));
    const ganados = byContactoMap["CERRADO_GANADO"] ?? 0;
    const contactados = (byContactoMap["CONTACTADO"] ?? 0) + (byContactoMap["PROPUESTA_ENVIADA"] ?? 0) + (byContactoMap["NEGOCIANDO"] ?? 0) + ganados + (byContactoMap["CERRADO_PERDIDO"] ?? 0);
    const tasaConversion = contactados > 0 ? Math.round((ganados / contactados) * 100) : 0;

    res.json({
      total,
      avgScore: Math.round(avgScore._avg.score ?? 0),
      byPresencia: Object.fromEntries(byPresencia.map((p) => [p.estadoPresencia, p._count])),
      byContacto: byContactoMap,
      byNivel: Object.fromEntries(byNivel.map((n) => [n.nivelOportunidad, n._count])),
      byRubro: byRubro.map((r) => ({ rubro: r.rubro, count: r._count })),
      byComuna: byComuna.map((c) => ({ comuna: c.comuna, count: c._count })),
      nuevos7d,
      nuevos30d,
      tasaConversion,
      ganados,
      topHot,
      seguimientosPendientes,
      conversionPorComuna: byComuna.map((c) => {
        const g = ganadosPorComuna.find((gc) => gc.comuna === c.comuna);
        return { comuna: c.comuna, total: c._count, ganados: g?._count ?? 0 };
      }).filter((c) => c.total >= 2).slice(0, 20),
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ─── GET /api/negocios/:id — Detalle con análisis ────────

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const negocio = await prisma.negocio.findUnique({
      where: { id: req.params.id as string },
      include: {
        analisis: { orderBy: { createdAt: "desc" }, take: 5 },
        contactos: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!negocio) {
      res.status(404).json({ error: "Negocio no encontrado" });
      return;
    }

    res.json(negocio);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ─── POST /api/negocios — Crear uno ─────────────────────

router.post("/", async (req: Request, res: Response) => {
  try {
    const data = negocioCreateSchema.parse(req.body);

    // Check duplicates by nombre + comuna
    const existing = await prisma.negocio.findFirst({
      where: { nombre: data.nombre, comuna: data.comuna },
    });
    if (existing) {
      res.status(409).json({ error: "Negocio ya existe", existingId: existing.id });
      return;
    }

    const negocio = await prisma.negocio.create({ data });

    // Async: check presencia and score
    runPresenciaAndScore(negocio.id).catch(console.error);

    // Auto-enrich with Google Places if API key is configured
    if (process.env.GOOGLE_PLACES_API_KEY) {
      enriquecerConGooglePlaces(negocio.id).catch(console.error);
    }

    // Trigger automations for new lead
    evaluarAutomatizaciones({ trigger: "NUEVO_LEAD", negocioId: negocio.id }).catch(console.error);

    if (req.user) {
      logActivity({
        userId: req.user.userId,
        accion: "CREATE_NEGOCIO",
        entidad: "Negocio",
        entidadId: negocio.id,
        detalle: `Lead creado: ${negocio.nombre}`,
      });
    }

    res.status(201).json(negocio);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

// ─── PATCH /api/negocios/:id — Actualizar ────────────────

router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const data = negocioUpdateSchema.parse(req.body);
    const bodyEstado = req.body.estadoContacto as string | undefined;

    // Fetch previous state for automation triggers
    const prev = bodyEstado
      ? await prisma.negocio.findUnique({ where: { id: req.params.id as string }, select: { estadoContacto: true } })
      : null;

    const negocio = await prisma.negocio.update({
      where: { id: req.params.id as string },
      data: { ...data, ...(bodyEstado ? { estadoContacto: bodyEstado as any } : {}) },
    });

    // Trigger automations if estado changed
    if (bodyEstado && prev && prev.estadoContacto !== bodyEstado) {
      evaluarAutomatizaciones({
        trigger: "CAMBIO_ESTADO",
        negocioId: negocio.id,
        estadoAnterior: prev.estadoContacto,
        estadoNuevo: bodyEstado,
      }).catch(console.error);
    }

    if (req.user) {
      logActivity({
        userId: req.user.userId,
        accion: "UPDATE_NEGOCIO",
        entidad: "Negocio",
        entidadId: negocio.id,
        detalle: `Lead actualizado: ${negocio.nombre}`,
        metadata: bodyEstado ? { estadoNuevo: bodyEstado } : undefined,
      });
    }

    res.json(negocio);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

// ─── DELETE /api/negocios/:id — Eliminar ─────────────────

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await prisma.negocio.delete({ where: { id: req.params.id as string } });
    res.json({ deleted: true });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

// ─── POST /api/negocios/csv — Importar CSV ──────────────

router.post("/csv", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No se envió archivo" });
      return;
    }

    const delimiter = (req.body.delimiter as string) || ",";
    const result = await parseCSV(req.file.buffer, delimiter);

    let creados = 0;
    let duplicados = 0;

    for (const row of result.validos) {
      const existing = await prisma.negocio.findFirst({
        where: { nombre: row.nombre, comuna: row.comuna },
      });

      if (existing) {
        duplicados++;
        continue;
      }

      const negocio = await prisma.negocio.create({
        data: {
          nombre: row.nombre,
          rubro: row.rubro,
          comuna: row.comuna,
          ciudad: row.ciudad,
          direccion: row.direccion,
          telefono: row.telefono,
          email: row.email,
          whatsapp: row.whatsapp,
          sitioWeb: row.sitioWeb,
          instagram: row.instagram,
          facebook: row.facebook,
          gmapsRating: row.gmapsRating ?? undefined,
          gmapsReviews: row.gmapsReviews ?? undefined,
          fuenteDescubrimiento: "csv",
        },
      });

      creados++;
      runPresenciaAndScore(negocio.id).catch(console.error);
    }

    res.json({
      creados,
      duplicados,
      errores: result.errores,
      total: result.total,
    });

    if (req.user) {
      logActivity({
        userId: req.user.userId,
        accion: "IMPORT_CSV",
        entidad: "Negocio",
        detalle: `Importación CSV: ${creados} creados, ${duplicados} duplicados`,
        metadata: { creados, duplicados, total: result.total },
      });
    }
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ─── POST /api/negocios/:id/enriquecer — Google Places ───

router.post("/:id/enriquecer", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const negocio = await prisma.negocio.findUnique({ where: { id } });
    if (!negocio) {
      res.status(404).json({ error: "Negocio no encontrado" });
      return;
    }
    const result = await enriquecerConGooglePlaces(id);
    if (!result) {
      res.json({ status: "skipped", reason: "Google Places API key no configurada o negocio no encontrado" });
      return;
    }
    res.json({ status: "ok", data: result });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ─── PATCH /api/negocios/:id/asignar — Asignar a usuario ─

router.patch("/:id/asignar", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { asignadoAId } = req.body;
    const negocio = await prisma.negocio.update({
      where: { id },
      data: { asignadoAId: asignadoAId || null },
    });

    if (req.user) {
      logActivity({
        userId: req.user.userId,
        accion: "ASSIGN_NEGOCIO",
        entidad: "Negocio",
        entidadId: id,
        detalle: `Lead asignado: ${negocio.nombre}`,
        metadata: { asignadoAId },
      });
    }

    res.json(negocio);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

// ─── Helper: run presencia + scoring async ───────────────

async function runPresenciaAndScore(negocioId: string) {
  const negocio = await prisma.negocio.findUnique({ where: { id: negocioId } });
  if (!negocio) return;

  const presencia = await checkPresencia(
    negocio.sitioWeb,
    negocio.instagram,
    negocio.facebook,
    negocio.linkExterno
  );

  await prisma.negocio.update({
    where: { id: negocioId },
    data: {
      estadoPresencia: presencia.estadoPresencia,
      tipoLinkExt: presencia.tipoLinkExt,
    },
  });

  // Re-fetch with updated presencia
  const updated = await prisma.negocio.findUnique({ where: { id: negocioId } });
  if (!updated) return;

  const scoring = calcularScore(updated);

  await prisma.negocio.update({
    where: { id: negocioId },
    data: {
      score: scoring.score,
      nivelOportunidad: scoring.nivelOportunidad,
      razonesScore: scoring.razones,
      calidadDatos: calcularCalidadDatos(updated),
    },
  });
}

export default router;
