import { Router, type Request, type Response } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// ─── GET /api/export/csv — Export all negocios as CSV ────

router.get("/csv", async (_req: Request, res: Response) => {
  try {
    const negocios = await prisma.negocio.findMany({
      orderBy: { score: "desc" },
    });

    const headers = [
      "nombre", "rubro", "comuna", "direccion", "telefono", "email",
      "sitioWeb", "instagram", "facebook", "score", "nivelOportunidad",
      "estadoPresencia", "estadoContacto", "notas",
    ];

    const csvRows = [headers.join(",")];

    for (const n of negocios) {
      const row = headers.map((h) => {
        const val = (n as Record<string, unknown>)[h];
        if (val === null || val === undefined) return "";
        const str = String(val);
        // Escape CSV: wrap in quotes if contains comma, quote, or newline
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      csvRows.push(row.join(","));
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="leads_purocode_${Date.now()}.csv"`);
    res.send("\uFEFF" + csvRows.join("\n")); // BOM for Excel
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ─── GET /api/export/json — Export filtered as JSON ──────

router.get("/json", async (req: Request, res: Response) => {
  try {
    const { scoreMin, nivelOportunidad } = req.query as {
      scoreMin?: string;
      nivelOportunidad?: string;
    };

    const where: Record<string, unknown> = {};
    if (scoreMin) where.score = { gte: Number(scoreMin) };
    if (nivelOportunidad) where.nivelOportunidad = nivelOportunidad;

    const negocios = await prisma.negocio.findMany({
      where,
      orderBy: { score: "desc" },
      include: {
        analisis: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="leads_purocode_${Date.now()}.json"`);
    res.json(negocios);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ─── GET /api/export/report/:id — Mini-report per lead ──

router.get("/report/:id", async (req: Request, res: Response) => {
  try {
    const negocio = await prisma.negocio.findUnique({
      where: { id: req.params.id as string },
      include: {
        analisis: { orderBy: { createdAt: "desc" }, take: 1 },
        contactos: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!negocio) {
      res.status(404).json({ error: "Negocio no encontrado" });
      return;
    }

    const a = negocio.analisis[0];

    const report = {
      generadoEn: new Date().toISOString(),
      negocio: {
        nombre: negocio.nombre,
        rubro: negocio.rubro,
        comuna: negocio.comuna,
        direccion: negocio.direccion,
        telefono: negocio.telefono,
        sitioWeb: negocio.sitioWeb,
        instagram: negocio.instagram,
      },
      evaluacion: {
        score: negocio.score,
        nivel: negocio.nivelOportunidad,
        razones: negocio.razonesScore,
        estadoPresencia: negocio.estadoPresencia,
      },
      analisisTecnico: a
        ? {
            ssl: a.tieneSSL,
            responsive: a.esResponsive,
            tecnologia: a.tecnologia,
            performance: a.performanceScore,
            seo: {
              title: a.tieneTitle,
              metaDesc: a.tieneMetaDesc,
              h1: a.tieneH1,
              sitemap: a.tieneSitemap,
            },
            formulario: a.tieneFormulario,
            cta: a.tieneCTA,
            whatsapp: a.tieneWhatsappWidget,
          }
        : null,
      crm: {
        estado: negocio.estadoContacto,
        ultimoContacto: negocio.fechaUltimoContacto,
        totalContactos: negocio.contactos.length,
      },
    };

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
