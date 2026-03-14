/**
 * Servicio de notificaciones y emails.
 * Crea notificaciones in-app y opcionalmente envía email.
 */

import { prisma } from "../lib/prisma";
import nodemailer from "nodemailer";
import type { TipoNotificacion } from "@prisma/client";

// Configurar transporter solo si hay SMTP configurado
const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

const FROM_EMAIL = process.env.SMTP_USER || "noreply@purocode.com";
const NOTIFICATION_EMAILS = (process.env.NOTIFICATION_EMAILS || "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

/**
 * Crea una notificación in-app para un usuario.
 */
export async function crearNotificacion(params: {
  userId: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.notificacion.create({
    data: {
      userId: params.userId,
      tipo: params.tipo,
      titulo: params.titulo,
      mensaje: params.mensaje,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });
}

/**
 * Envía un email (si SMTP está configurado).
 */
export async function enviarEmail(params: {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}) {
  if (!transporter) {
    console.log("[Email] SMTP no configurado, email omitido:", params.subject);
    return null;
  }

  const to = Array.isArray(params.to) ? params.to.join(", ") : params.to;

  return transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject: params.subject,
    text: params.text,
    html: params.html,
  });
}

/**
 * Notifica sobre seguimientos pendientes (vencidos o para hoy).
 */
export async function notificarSeguimientosPendientes() {
  const ahora = new Date();
  const finHoy = new Date(ahora);
  finHoy.setHours(23, 59, 59, 999);

  const pendientes = await prisma.negocio.findMany({
    where: {
      proximoSeguimiento: { lte: finHoy },
      estadoContacto: { notIn: ["CERRADO_GANADO", "CERRADO_PERDIDO", "CERRADO_NO_EXISTE"] },
    },
    include: { asignadoA: true },
    orderBy: { proximoSeguimiento: "asc" },
  });

  if (pendientes.length === 0) return { notified: 0 };

  // Agrupar por vendedor asignado
  const porVendedor = new Map<string, typeof pendientes>();
  for (const neg of pendientes) {
    const userId = neg.asignadoAId || "unassigned";
    const list = porVendedor.get(userId) || [];
    list.push(neg);
    porVendedor.set(userId, list);
  }

  let notified = 0;

  for (const [userId, negocios] of porVendedor) {
    if (userId === "unassigned") continue;

    const vencidos = negocios.filter((n) => n.proximoSeguimiento && n.proximoSeguimiento < ahora);
    const paraHoy = negocios.filter((n) => n.proximoSeguimiento && n.proximoSeguimiento >= ahora);

    const titulo = `${negocios.length} seguimiento(s) pendiente(s)`;
    const mensaje = [
      vencidos.length > 0 ? `⚠️ ${vencidos.length} vencido(s): ${vencidos.map((n) => n.nombre).join(", ")}` : "",
      paraHoy.length > 0 ? `📅 ${paraHoy.length} para hoy: ${paraHoy.map((n) => n.nombre).join(", ")}` : "",
    ].filter(Boolean).join("\n");

    await crearNotificacion({
      userId,
      tipo: "SEGUIMIENTO_PENDIENTE",
      titulo,
      mensaje,
    });
    notified++;
  }

  // También enviar email si está configurado
  if (transporter && NOTIFICATION_EMAILS.length > 0 && pendientes.length > 0) {
    const nombres = pendientes.slice(0, 10).map((n) => `- ${n.nombre} (${n.comuna})`).join("\n");
    await enviarEmail({
      to: NOTIFICATION_EMAILS,
      subject: `[BotPuroCode] ${pendientes.length} seguimiento(s) pendiente(s)`,
      text: `Hay ${pendientes.length} seguimiento(s) pendiente(s):\n\n${nombres}\n\nIngresa a BotPuroCode para ver los detalles.`,
    });
  }

  return { notified, total: pendientes.length };
}

/**
 * Notifica leads calientes nuevos (score > 70, creados en últimas 24h).
 */
export async function notificarLeadsCalientes() {
  const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const calientes = await prisma.negocio.findMany({
    where: {
      score: { gte: 70 },
      createdAt: { gte: hace24h },
    },
    orderBy: { score: "desc" },
    take: 20,
  });

  if (calientes.length === 0) return { notified: 0 };

  // Notificar a todos los admins
  const admins = await prisma.user.findMany({ where: { rol: "ADMIN", activo: true } });

  for (const admin of admins) {
    await crearNotificacion({
      userId: admin.id,
      tipo: "LEAD_CALIENTE",
      titulo: `🔥 ${calientes.length} lead(s) caliente(s) nuevo(s)`,
      mensaje: calientes.map((n) => `${n.nombre} (score: ${n.score})`).join(", "),
    });
  }

  return { notified: admins.length, leads: calientes.length };
}
