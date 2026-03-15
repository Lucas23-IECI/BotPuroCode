/**
 * Routes: /api/automatizaciones
 * CRUD para reglas de automatización.
 */

import { Router, type Request, type Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { logActivity } from "../lib/activity-logger";

const router = Router();
router.use(requireAuth);

// GET — List all
router.get("/", async (_req: Request, res: Response) => {
  try {
    const items = await prisma.automatizacion.findMany({ orderBy: { createdAt: "desc" } });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST — Create
router.post("/", async (req: Request, res: Response) => {
  try {
    const { nombre, trigger, condicion, accion, accionConfig } = req.body;
    if (!nombre || !trigger || !accion) {
      res.status(400).json({ error: "nombre, trigger y accion son requeridos" });
      return;
    }
    const item = await prisma.automatizacion.create({
      data: {
        nombre,
        trigger,
        condicion: condicion ? JSON.stringify(condicion) : "{}",
        accion,
        accionConfig: accionConfig ? JSON.stringify(accionConfig) : "{}",
      },
    });

    if (req.user) {
      logActivity({
        userId: req.user.userId,
        accion: "CREATE_AUTOMATIZACION",
        entidad: "Automatizacion",
        entidadId: item.id,
        detalle: `Automatización creada: ${nombre}`,
      });
    }

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// PATCH /:id — Update
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const data: Record<string, unknown> = {};
    if (req.body.nombre !== undefined) data.nombre = req.body.nombre;
    if (req.body.trigger !== undefined) data.trigger = req.body.trigger;
    if (req.body.accion !== undefined) data.accion = req.body.accion;
    if (req.body.activa !== undefined) data.activa = req.body.activa;
    if (req.body.condicion !== undefined) data.condicion = JSON.stringify(req.body.condicion);
    if (req.body.accionConfig !== undefined) data.accionConfig = JSON.stringify(req.body.accionConfig);

    const item = await prisma.automatizacion.update({ where: { id }, data });

    if (req.user) {
      logActivity({
        userId: req.user.userId,
        accion: "UPDATE_AUTOMATIZACION",
        entidad: "Automatizacion",
        entidadId: id,
        detalle: `Automatización actualizada: ${item.nombre}`,
      });
    }

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const item = await prisma.automatizacion.findUnique({ where: { id }, select: { nombre: true } });
    await prisma.automatizacion.delete({ where: { id } });

    if (req.user) {
      logActivity({
        userId: req.user.userId,
        accion: "DELETE_AUTOMATIZACION",
        entidad: "Automatizacion",
        entidadId: id,
        detalle: `Automatización eliminada: ${item?.nombre}`,
      });
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
