import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// ─── Timeline de actividad (con filtros) ────────────────
router.get("/", async (req: Request, res: Response) => {
  const { userId, accion, entidad, limit = "50", offset = "0" } = req.query;

  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;
  if (accion) where.accion = accion;
  if (entidad) where.entidad = entidad;

  const [items, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: { user: { select: { id: true, nombre: true, avatarBase64: true } } },
      orderBy: { createdAt: "desc" },
      take: Math.min(Number(limit) || 50, 200),
      skip: Number(offset) || 0,
    }),
    prisma.activityLog.count({ where }),
  ]);

  res.json({ items, total });
});

// ─── Stats por usuario ──────────────────────────────────
router.get("/stats", async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    where: { activo: true },
    select: { id: true, nombre: true, avatarBase64: true },
  });

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const stats = await Promise.all(
    users.map(async (u) => {
      const [total, thisWeek, byAction] = await Promise.all([
        prisma.activityLog.count({ where: { userId: u.id } }),
        prisma.activityLog.count({
          where: { userId: u.id, createdAt: { gte: startOfWeek } },
        }),
        prisma.activityLog.groupBy({
          by: ["accion"],
          where: { userId: u.id },
          _count: true,
        }),
      ]);

      return {
        user: u,
        total,
        thisWeek,
        byAction: byAction.map((a) => ({ accion: a.accion, count: a._count })),
      };
    })
  );

  res.json(stats);
});

// ─── Heatmap (estilo GitHub) por usuario ─────────────────
router.get("/heatmap/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;
  const daysBack = Math.min(Number(req.query.days) || 365, 365);

  const since = new Date();
  since.setDate(since.getDate() - daysBack);
  since.setHours(0, 0, 0, 0);

  const logs = await prisma.activityLog.findMany({
    where: { userId: userId as string, createdAt: { gte: since } },
    select: { createdAt: true },
  });

  // Group by date string (YYYY-MM-DD)
  const heatmap: Record<string, number> = {};
  for (const log of logs) {
    const dateStr = log.createdAt.toISOString().split("T")[0];
    heatmap[dateStr] = (heatmap[dateStr] || 0) + 1;
  }

  res.json(heatmap);
});

export default router;
