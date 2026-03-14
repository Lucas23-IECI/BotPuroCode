import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "botpurocode-secret-change-me";

export interface AuthPayload {
  userId: string;
  email: string;
  rol: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/** Genera un JWT con 7 días de expiración */
export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/** Verifica y decodifica un JWT */
export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
}

/** Middleware: requiere autenticación (si AUTH está habilitado) */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Si no hay JWT_SECRET configurado, dejar pasar (backward-compatible)
  if (!process.env.JWT_SECRET) {
    return next();
  }

  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token requerido" });
    return;
  }

  try {
    const payload = verifyToken(header.slice(7));
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.activo) {
      res.status(401).json({ error: "Usuario inactivo o no encontrado" });
      return;
    }
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}

/** Middleware: requiere rol ADMIN */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!process.env.JWT_SECRET) return next();
  if (req.user?.rol !== "ADMIN") {
    res.status(403).json({ error: "Acceso solo para administradores" });
    return;
  }
  next();
}
