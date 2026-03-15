import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { signToken, requireAuth, requireAdmin } from "../middleware/auth";
import { z } from "zod";

const router = Router();

// ─── Login ──────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Email y contraseña requeridos" });
    return;
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.activo) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email, rol: user.rol });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
    },
  });
});

// ─── Registro (solo admin) ──────────────────────────────
const registerSchema = z.object({
  email: z.string().email(),
  nombre: z.string().min(1),
  password: z.string().min(6),
  rol: z.enum(["ADMIN", "VENDEDOR"]).default("VENDEDOR"),
});

router.post("/register", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten() });
    return;
  }

  const { email, nombre, password, rol } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "Email ya registrado" });
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, nombre, password: hash, rol },
    select: { id: true, email: true, nombre: true, rol: true, createdAt: true },
  });

  res.status(201).json(user);
});

// ─── Perfil actual ──────────────────────────────────────
router.get("/me", requireAuth, async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { id: true, email: true, nombre: true, rol: true, createdAt: true },
  });
  res.json(user);
});

// ─── Listar usuarios (admin) ────────────────────────────
router.get("/users", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, nombre: true, rol: true, activo: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(users);
});

// ─── Actualizar usuario (admin) ──────────────────────────
router.patch("/users/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { nombre, rol, activo } = req.body;

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(nombre !== undefined && { nombre }),
      ...(rol !== undefined && { rol }),
      ...(activo !== undefined && { activo }),
    },
    select: { id: true, email: true, nombre: true, rol: true, activo: true },
  });
  res.json(user);
});

// ─── Cambiar contraseña ─────────────────────────────────
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

router.patch("/me/password", requireAuth, async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Contraseña actual y nueva (mín 6 chars) requeridas" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!valid) {
    res.status(401).json({ error: "Contraseña actual incorrecta" });
    return;
  }

  const hash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { password: hash } });
  res.json({ message: "Contraseña actualizada" });
});

// ─── Seed inicial (crea admin si no existe) ─────────────
router.post("/seed", async (_req: Request, res: Response) => {
  const count = await prisma.user.count();
  if (count > 0) {
    res.status(400).json({ error: "Ya existen usuarios" });
    return;
  }

  const hash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.create({
    data: {
      email: "contactopurocode@purocode.com",
      nombre: "Lucas (Admin)",
      password: hash,
      rol: "ADMIN",
    },
    select: { id: true, email: true, nombre: true, rol: true },
  });

  res.status(201).json({ message: "Admin creado", user: admin });
});

export default router;
