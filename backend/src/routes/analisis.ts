import { Router, type Request, type Response } from "express";
import { prisma } from "../lib/prisma";
import { analisisQueue } from "../lib/queue";
import { checkPresencia } from "../services/presencia.service";
import { analizarSitio } from "../services/analisis.service";
import { checkPageSpeed } from "../services/pagespeed.service";
import { calcularScore } from "../services/scoring.service";

const router = Router();

// ─── POST /api/analisis/:negocioId — Trigger full analysis ─

router.post("/:negocioId", async (req: Request, res: Response) => {
  try {
    const negocioId = req.params.negocioId as string;
    const negocio = await prisma.negocio.findUnique({ where: { id: negocioId } });

    if (!negocio) {
      res.status(404).json({ error: "Negocio no encontrado" });
      return;
    }

    // Queue the analysis
    analisisQueue.add(async () => {
      await runFullAnalysis(negocioId);
    });

    res.json({
      message: "Análisis encolado",
      queueSize: analisisQueue.size,
      pending: analisisQueue.pending,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ─── POST /api/analisis/batch — Analyze multiple ─────────

router.post("/batch", async (req: Request, res: Response) => {
  try {
    const { ids } = req.body as { ids?: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: "Se requiere un array de IDs" });
      return;
    }

    if (ids.length > 50) {
      res.status(400).json({ error: "Máximo 50 negocios por batch" });
      return;
    }

    const negocios = await prisma.negocio.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });

    for (const n of negocios) {
      analisisQueue.add(async () => {
        await runFullAnalysis(n.id);
      });
    }

    res.json({
      message: `${negocios.length} análisis encolados`,
      queueSize: analisisQueue.size,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ─── GET /api/analisis/queue — Queue status ──────────────

router.get("/queue", (_req: Request, res: Response) => {
  res.json({
    size: analisisQueue.size,
    pending: analisisQueue.pending,
  });
});

// ─── GET /api/analisis/:negocioId — Get analysis history ─

router.get("/:negocioId", async (req: Request, res: Response) => {
  try {
    const analisis = await prisma.analisis.findMany({
      where: { negocioId: req.params.negocioId as string },
      orderBy: { createdAt: "desc" },
    });

    res.json(analisis);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ─── Full analysis pipeline ─────────────────────────────

async function runFullAnalysis(negocioId: string) {
  const negocio = await prisma.negocio.findUnique({ where: { id: negocioId } });
  if (!negocio) return;

  // 1. Check presencia
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

  // 2. Technical analysis (only if there's a website)
  let analisisData: Record<string, unknown> = {
    negocioId,
    dominioExiste: presencia.dominioExiste,
    dominioResponde: presencia.dominioResponde,
    httpStatus: presencia.httpStatus,
    redirectUrl: presencia.redirectUrl,
  };

  const urlToAnalyze = presencia.redirectUrl ?? negocio.sitioWeb;

  if (urlToAnalyze && presencia.dominioResponde) {
    try {
      const tecnico = await analizarSitio(urlToAnalyze);

      analisisData = {
        ...analisisData,
        tieneSSL: tecnico.tieneSSL,
        esResponsive: tecnico.esResponsive,
        tecnologia: tecnico.tecnologia,
        plantillaGenerica: tecnico.plantillaGenerica,
        tieneFormulario: tecnico.tieneFormulario,
        tieneCTA: tecnico.tieneCTA,
        tieneWhatsappWidget: tecnico.tieneWhatsappWidget,
        tieneFavicon: tecnico.tieneFavicon,
        tieneTitle: tecnico.tieneTitle,
        titleText: tecnico.titleText,
        tieneMetaDesc: tecnico.tieneMetaDesc,
        metaDescText: tecnico.metaDescText,
        tieneH1: tecnico.tieneH1,
        tieneSitemap: tecnico.tieneSitemap,
        tieneRobotsTxt: tecnico.tieneRobotsTxt,
        errores: tecnico.errores,
      };

      // 3. PageSpeed (async, best effort)
      try {
        const speed = await checkPageSpeed(urlToAnalyze, process.env.PAGESPEED_API_KEY);
        if (speed) {
          analisisData.performanceScore = speed.performanceScore;
          analisisData.lcpMs = speed.lcpMs;
          analisisData.fcpMs = speed.fcpMs;
          analisisData.cls = speed.cls;
        }
      } catch {
        // PageSpeed failures are non-critical
      }
    } catch {
      (analisisData.errores as string[]) = ["Error al analizar sitio web"];
    }
  }

  // Save analysis
  const analisis = await prisma.analisis.create({
    data: analisisData as Parameters<typeof prisma.analisis.create>[0]["data"],
  });

  // 4. Recalculate score
  const updatedNegocio = await prisma.negocio.findUnique({ where: { id: negocioId } });
  if (!updatedNegocio) return;

  const scoring = calcularScore(updatedNegocio, analisis);

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
