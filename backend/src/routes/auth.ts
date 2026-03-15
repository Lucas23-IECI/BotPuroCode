import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { signToken, requireAuth, requireAdmin } from "../middleware/auth";
import { logActivity } from "../lib/activity-logger";
import { enviarEmail } from "../services/notifications.service";
import { z } from "zod";
import rateLimit from "express-rate-limit";

const router = Router();

// Rate limiter: 10 intentos por IP cada 5 minutos
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Intenta de nuevo en 5 minutos." },
});

// ─── Login ──────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", authLimiter, async (req: Request, res: Response) => {
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

  // Update lastLoginAt
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  logActivity({ userId: user.id, accion: "LOGIN", detalle: `Inicio de sesión: ${user.email}` });

  const token = signToken({ userId: user.id, email: user.email, rol: user.rol });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      cargo: user.cargo,
      bio: user.bio,
      telefono: user.telefono,
      avatarBase64: user.avatarBase64,
      mustChangePassword: user.mustChangePassword,
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

router.post("/register", authLimiter, requireAuth, requireAdmin, async (req: Request, res: Response) => {
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

  logActivity({
    userId: req.user!.userId,
    accion: "REGISTER_USER",
    entidad: "User",
    entidadId: user.id,
    detalle: `Usuario creado: ${email} (${rol})`,
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
    select: {
      id: true, email: true, nombre: true, rol: true, createdAt: true,
      cargo: true, bio: true, telefono: true, avatarBase64: true,
      mustChangePassword: true, lastLoginAt: true,
    },
  });
  res.json(user);
});

// ─── Listar usuarios (admin) ────────────────────────────
router.get("/users", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true, email: true, nombre: true, rol: true, activo: true, createdAt: true,
      cargo: true, bio: true, telefono: true, avatarBase64: true, lastLoginAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
  res.json(users);
});

// ─── Ver perfil de otro usuario ─────────────────────────
router.get("/users/:id", requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id as string },
    select: {
      id: true, email: true, nombre: true, rol: true, createdAt: true,
      cargo: true, bio: true, telefono: true, avatarBase64: true, lastLoginAt: true,
    },
  });
  if (!user) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }
  res.json(user);
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

  const changes: string[] = [];
  if (rol !== undefined) changes.push(`rol→${rol}`);
  if (activo !== undefined) changes.push(activo ? "activado" : "desactivado");
  if (nombre !== undefined) changes.push(`nombre→${nombre}`);
  logActivity({
    userId: req.user!.userId,
    accion: "UPDATE_USER",
    entidad: "User",
    entidadId: id,
    detalle: `Usuario actualizado: ${changes.join(", ")}`,
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
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hash, mustChangePassword: false },
  });

  logActivity({ userId: user.id, accion: "CHANGE_PASSWORD", detalle: "Contraseña actualizada" });

  res.json({ message: "Contraseña actualizada" });
});

// ─── Actualizar perfil propio ───────────────────────────
const updateProfileSchema = z.object({
  nombre: z.string().min(1).optional(),
  cargo: z.string().max(100).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  telefono: z.string().max(20).optional().nullable(),
  avatarBase64: z.string().optional().nullable(),
});

router.patch("/me/profile", requireAuth, async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten() });
    return;
  }

  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) data[key] = value;
  }

  const user = await prisma.user.update({
    where: { id: req.user.userId },
    data,
    select: {
      id: true, email: true, nombre: true, rol: true,
      cargo: true, bio: true, telefono: true, avatarBase64: true,
    },
  });

  logActivity({
    userId: req.user.userId,
    accion: "UPDATE_PROFILE",
    detalle: `Perfil actualizado: ${Object.keys(data).join(", ")}`,
  });

  res.json(user);
});

// ─── Olvidé mi contraseña ────────────────────────────────
router.post("/forgot-password", authLimiter, async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };
  if (!email) {
    res.status(400).json({ error: "Email requerido" });
    return;
  }

  // Always return success to prevent email enumeration
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.activo) {
    res.json({ message: "Si el email existe, recibirás un enlace de recuperación." });
    return;
  }

  // Invalidate previous unused tokens
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
    },
  });

  const frontendUrl = process.env.FRONTEND_URL?.replace(/\/+$/, "") || "http://localhost:3000";
  const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

  await enviarEmail({
    to: user.email,
    subject: "[BotPuroCode] Recuperación de contraseña",
    text: `Hola ${user.nombre},\n\nRecibimos una solicitud para restablecer tu contraseña.\n\nHaz clic en el siguiente enlace (válido por 30 minutos):\n${resetUrl}\n\nSi no solicitaste esto, ignora este email.\n\n— Equipo PuroCode`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#6d28d9">BotPuroCode</h2>
        <p>Hola <strong>${user.nombre}</strong>,</p>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p><a href="${resetUrl}" style="display:inline-block;background:#6d28d9;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Restablecer contraseña</a></p>
        <p style="color:#888;font-size:12px">Este enlace es válido por 30 minutos. Si no solicitaste esto, ignora este email.</p>
      </div>
    `,
  });

  res.json({ message: "Si el email existe, recibirás un enlace de recuperación." });
});

// ─── Restablecer contraseña con token ───────────────────
router.post("/reset-password", authLimiter, async (req: Request, res: Response) => {
  const schema = z.object({
    token: z.string().min(1),
    newPassword: z.string().min(6),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Token y nueva contraseña (mín 6 chars) requeridos" });
    return;
  }

  const { token, newPassword } = parsed.data;

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
    res.status(400).json({ error: "Token inválido o expirado" });
    return;
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hash, mustChangePassword: false },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    }),
  ]);

  logActivity({
    userId: resetToken.userId,
    accion: "RESET_PASSWORD",
    detalle: "Contraseña restablecida via email",
  });

  res.json({ message: "Contraseña actualizada. Ya puedes iniciar sesión." });
});

// ─── Admin: resetear contraseña de otro usuario ─────────
const adminResetSchema = z.object({
  password: z.string().min(6).optional(),
});

router.post("/admin-reset/:userId", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const parsed = adminResetSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Contraseña mínimo 6 caracteres" });
    return;
  }

  const targetId = req.params.userId as string;
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }

  // If no password provided, auto-generate
  const tempPassword = parsed.data?.password || crypto.randomBytes(6).toString("base64url").slice(0, 12);
  const hash = await bcrypt.hash(tempPassword, 12);

  await prisma.user.update({
    where: { id: targetId },
    data: { password: hash, mustChangePassword: true },
  });

  logActivity({
    userId: req.user!.userId,
    accion: "ADMIN_RESET_PASSWORD",
    entidad: "User",
    entidadId: targetId,
    detalle: `Contraseña reseteada para ${target.email}`,
  });

  res.json({ message: "Contraseña reseteada", tempPassword });
});

// ─── Seed inicial (crea 2 admins si no existen) ─────────
router.post("/seed", async (_req: Request, res: Response) => {
  const count = await prisma.user.count();
  if (count > 0) {
    res.status(400).json({ error: "Ya existen usuarios" });
    return;
  }

  const hash = await bcrypt.hash("changeme123", 12);

  const [lucas, diego] = await prisma.$transaction([
    prisma.user.create({
      data: {
        email: "lucas.mendez@purocode.com",
        nombre: "Lucas Méndez",
        password: hash,
        rol: "ADMIN",
        cargo: "Co-Fundador & Dev Lead",
        mustChangePassword: true,
      },
      select: { id: true, email: true, nombre: true, rol: true },
    }),
    prisma.user.create({
      data: {
        email: "diego.guzman@purocode.com",
        nombre: "Diego Guzmán",
        password: hash,
        rol: "ADMIN",
        cargo: "Co-Fundador & Estrategia",
        mustChangePassword: true,
      },
      select: { id: true, email: true, nombre: true, rol: true },
    }),
  ]);

  res.status(201).json({ message: "Equipo creado", users: [lucas, diego] });
});

export default router;
