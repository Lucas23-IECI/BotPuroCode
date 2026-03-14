import { Router, type Request, type Response } from "express";
import { prisma } from "../lib/prisma";
import { contactoCreateSchema } from "../types/schemas";

const router = Router();

// ─── POST /api/crm/contacto — Registrar contacto ────────

router.post("/contacto", async (req: Request, res: Response) => {
  try {
    const data = contactoCreateSchema.parse(req.body);

    const negocio = await prisma.negocio.findUnique({
      where: { id: data.negocioId },
    });

    if (!negocio) {
      res.status(404).json({ error: "Negocio no encontrado" });
      return;
    }

    const contacto = await prisma.contacto.create({ data });

    // Update negocio CRM state
    const updateData: Record<string, unknown> = {
      fechaUltimoContacto: new Date(),
    };

    if (negocio.estadoContacto === "NO_CONTACTADO") {
      updateData.estadoContacto = "CONTACTADO";
    }

    if (data.resultado === "PROPUESTA_ENVIADA") {
      updateData.estadoContacto = "PROPUESTA_ENVIADA";
    } else if (data.resultado === "INTERESADO") {
      updateData.estadoContacto = "NEGOCIANDO";
    } else if (data.resultado === "CERRADO") {
      updateData.estadoContacto = "CERRADO_GANADO";
    } else if (data.resultado === "NO_INTERESADO") {
      updateData.estadoContacto = "CERRADO_PERDIDO";
    }

    await prisma.negocio.update({
      where: { id: data.negocioId as string },
      data: updateData,
    });

    res.status(201).json(contacto);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

// ─── PATCH /api/crm/negocio/:id/estado — Cambiar estado ─

router.patch("/negocio/:id/estado", async (req: Request, res: Response) => {
  try {
    const { estadoContacto, notas, proximoSeguimiento } = req.body as {
      estadoContacto?: string;
      notas?: string;
      proximoSeguimiento?: string;
    };

    const updateData: Record<string, unknown> = {};
    if (estadoContacto) updateData.estadoContacto = estadoContacto;
    if (notas !== undefined) updateData.notas = notas;
    if (proximoSeguimiento) updateData.proximoSeguimiento = new Date(proximoSeguimiento);

    const negocio = await prisma.negocio.update({
      where: { id: req.params.id as string },
      data: updateData,
    });

    res.json(negocio);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

// ─── GET /api/crm/pipeline — Pipeline view ──────────────

router.get("/pipeline", async (_req: Request, res: Response) => {
  try {
    const estados = [
      "NO_CONTACTADO",
      "CONTACTADO",
      "PROPUESTA_ENVIADA",
      "NEGOCIANDO",
      "CERRADO_GANADO",
      "CERRADO_PERDIDO",
    ] as const;

    const pipeline: Record<string, unknown[]> = {};

    for (const estado of estados) {
      pipeline[estado] = await prisma.negocio.findMany({
        where: { estadoContacto: estado },
        orderBy: { score: "desc" },
        take: 50,
        select: {
          id: true,
          nombre: true,
          rubro: true,
          comuna: true,
          score: true,
          nivelOportunidad: true,
          fechaUltimoContacto: true,
          proximoSeguimiento: true,
          notas: true,
        },
      });
    }

    res.json(pipeline);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ─── GET /api/crm/seguimientos — Próximos seguimientos ──

router.get("/seguimientos", async (_req: Request, res: Response) => {
  try {
    const seguimientos = await prisma.negocio.findMany({
      where: {
        proximoSeguimiento: { not: null },
        estadoContacto: {
          notIn: ["CERRADO_GANADO", "CERRADO_PERDIDO"],
        },
      },
      orderBy: { proximoSeguimiento: "asc" },
      take: 30,
      select: {
        id: true,
        nombre: true,
        rubro: true,
        comuna: true,
        score: true,
        estadoContacto: true,
        proximoSeguimiento: true,
        notas: true,
        _count: { select: { contactos: true } },
      },
    });

    res.json(seguimientos);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ─── GET /api/crm/contactos/:negocioId — History ────────

router.get("/contactos/:negocioId", async (req: Request, res: Response) => {
  try {
    const contactos = await prisma.contacto.findMany({
      where: { negocioId: req.params.negocioId as string },
      orderBy: { createdAt: "desc" },
    });

    res.json(contactos);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
