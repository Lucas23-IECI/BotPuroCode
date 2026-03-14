import { Router, type Request, type Response } from "express";
import { prisma } from "../lib/prisma";
import { buscarEnOSM, getZonasDisponibles, getRubrosOSM } from "../services/osm.service";
import { checkPresencia } from "../services/presencia.service";
import { calcularScore } from "../services/scoring.service";

const router = Router();

// ─── GET /api/osm/zonas — Available zones ────────────────

router.get("/zonas", (_req: Request, res: Response) => {
  res.json(getZonasDisponibles());
});

// ─── GET /api/osm/rubros — Available OSM categories ─────

router.get("/rubros", (_req: Request, res: Response) => {
  res.json(getRubrosOSM());
});

// ─── POST /api/osm/buscar — Search & import from OSM ────

router.post("/buscar", async (req: Request, res: Response) => {
  try {
    const { rubro, comuna, importar } = req.body as {
      rubro: string;
      comuna: string;
      importar?: boolean;
    };

    if (!rubro || !comuna) {
      res.status(400).json({ error: "Se requiere rubro y comuna" });
      return;
    }

    const resultados = await buscarEnOSM(rubro, comuna);

    if (!importar) {
      res.json({ resultados, total: resultados.length });
      return;
    }

    // Import results
    let creados = 0;
    let duplicados = 0;

    for (const r of resultados) {
      const existing = await prisma.negocio.findFirst({
        where: { nombre: r.nombre, comuna: r.comuna },
      });

      if (existing) {
        duplicados++;
        continue;
      }

      const negocio = await prisma.negocio.create({
        data: {
          nombre: r.nombre,
          rubro: r.tipo,
          comuna: r.comuna ?? comuna,
          direccion: r.direccion,
          lat: r.lat,
          lng: r.lng,
          telefono: r.telefono,
          sitioWeb: r.sitioWeb,
          email: r.email,
          fuenteDescubrimiento: "osm",
        },
      });

      creados++;

      // Async presencia + score
      runPresenciaAndScore(negocio.id).catch(console.error);
    }

    res.json({
      encontrados: resultados.length,
      creados,
      duplicados,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

async function runPresenciaAndScore(negocioId: string) {
  const negocio = await prisma.negocio.findUnique({ where: { id: negocioId } });
  if (!negocio) return;

  const presencia = await checkPresencia(negocio.sitioWeb, negocio.instagram, negocio.facebook, negocio.linkExterno);

  await prisma.negocio.update({
    where: { id: negocioId },
    data: {
      estadoPresencia: presencia.estadoPresencia,
      tipoLinkExt: presencia.tipoLinkExt,
    },
  });

  const updated = await prisma.negocio.findUnique({ where: { id: negocioId } });
  if (!updated) return;

  const scoring = calcularScore(updated);

  await prisma.negocio.update({
    where: { id: negocioId },
    data: {
      score: scoring.score,
      nivelOportunidad: scoring.nivelOportunidad,
      razonesScore: scoring.razones,
    },
  });
}

export default router;
