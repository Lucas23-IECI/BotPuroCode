import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { logActivity } from "../lib/activity-logger";

const router = Router();

// ─── Listar notificaciones del usuario ──────────────────
router.get("/", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    // Sin auth habilitado, devolver vacías
    res.json({ notificaciones: [], noLeidas: 0 });
    return;
  }

  const [notificaciones, noLeidas] = await Promise.all([
    prisma.notificacion.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.notificacion.count({
      where: { userId, leida: false },
    }),
  ]);

  logActivity({ userId, accion: "VIEW_NOTIFICACIONES", detalle: `${noLeidas} no leídas de ${notificaciones.length}` });

  res.json({ notificaciones, noLeidas });
});

// ─── Marcar como leída ──────────────────────────────────
router.patch("/:id/leer", requireAuth, async (req: Request, res: Response) => {
  const notif = await prisma.notificacion.update({
    where: { id: req.params.id as string },
    data: { leida: true },
  });

  logActivity({ userId: req.user!.userId, accion: "MARCAR_NOTIFICACION", entidadId: notif.id });

  res.json(notif);
});

// ─── Marcar todas como leídas ───────────────────────────
router.patch("/leer-todas", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.json({ count: 0 });
    return;
  }

  const result = await prisma.notificacion.updateMany({
    where: { userId: userId!, leida: false },
    data: { leida: true },
  });

  logActivity({ userId: userId!, accion: "MARCAR_TODAS_NOTIFICACIONES", detalle: `${result.count} marcadas como leídas` });

  res.json({ count: result.count });
});

// ─── Eliminar notificación ──────────────────────────────
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await prisma.notificacion.delete({ where: { id } });

  logActivity({ userId: req.user!.userId, accion: "ELIMINAR_NOTIFICACION", entidadId: id });

  res.json({ ok: true });
});

export default router;
