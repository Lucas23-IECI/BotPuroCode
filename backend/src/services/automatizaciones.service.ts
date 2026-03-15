/**
 * Servicio de automatizaciones.
 * Evalúa reglas y ejecuta acciones automáticas.
 */

import { prisma } from "../lib/prisma";
import { crearNotificacion } from "./notifications.service";

interface AutoCondicion {
  estadoContactoAnterior?: string;
  estadoContactoNuevo?: string;
  scoreUmbral?: number;
}

interface AutoAccionConfig {
  titulo?: string;
  mensaje?: string;
  nuevoEstado?: string;
  plantillaId?: string;
}

/**
 * Evalúa automatizaciones para un trigger dado.
 * Llama a esto cuando un lead cambia de estado, score, o se crea.
 */
export async function evaluarAutomatizaciones(params: {
  trigger: "CAMBIO_ESTADO" | "SCORE_MAYOR" | "SCORE_MENOR" | "NUEVO_LEAD";
  negocioId: string;
  estadoAnterior?: string;
  estadoNuevo?: string;
  score?: number;
}) {
  const autos = await prisma.automatizacion.findMany({
    where: { trigger: params.trigger, activa: true },
  });

  for (const auto of autos) {
    const condicion: AutoCondicion = JSON.parse(auto.condicion || "{}");
    const config: AutoAccionConfig = JSON.parse(auto.accionConfig || "{}");

    // Check conditions
    if (!matchCondicion(condicion, params)) continue;

    // Execute action
    await ejecutarAccion(auto.accion, config, params.negocioId);
  }
}

function matchCondicion(
  cond: AutoCondicion,
  params: {
    trigger: string;
    estadoAnterior?: string;
    estadoNuevo?: string;
    score?: number;
  }
): boolean {
  if (params.trigger === "CAMBIO_ESTADO") {
    if (cond.estadoContactoAnterior && cond.estadoContactoAnterior !== params.estadoAnterior) return false;
    if (cond.estadoContactoNuevo && cond.estadoContactoNuevo !== params.estadoNuevo) return false;
    return true;
  }

  if (params.trigger === "SCORE_MAYOR") {
    if (cond.scoreUmbral && (params.score ?? 0) < cond.scoreUmbral) return false;
    return true;
  }

  if (params.trigger === "SCORE_MENOR") {
    if (cond.scoreUmbral && (params.score ?? 0) > cond.scoreUmbral) return false;
    return true;
  }

  // NUEVO_LEAD — no extra conditions
  return true;
}

async function ejecutarAccion(accion: string, config: AutoAccionConfig, negocioId: string) {
  const negocio = await prisma.negocio.findUnique({ where: { id: negocioId } });
  if (!negocio) return;

  if (accion === "CREAR_NOTIFICACION") {
    // Notify all active users
    const users = await prisma.user.findMany({ where: { activo: true } });
    const titulo = replaceVars(config.titulo || "Automatización", negocio);
    const mensaje = replaceVars(config.mensaje || "", negocio);
    for (const user of users) {
      await crearNotificacion({
        userId: user.id,
        tipo: "GENERAL",
        titulo,
        mensaje,
        metadata: { negocioId },
      });
    }
  }

  if (accion === "CAMBIAR_ESTADO" && config.nuevoEstado) {
    await prisma.negocio.update({
      where: { id: negocioId },
      data: { estadoContacto: config.nuevoEstado as any },
    });
  }
}

function replaceVars(text: string, negocio: { nombre: string; rubro: string; comuna: string; score: number }): string {
  return text
    .replace(/\{nombre\}/g, negocio.nombre)
    .replace(/\{rubro\}/g, negocio.rubro)
    .replace(/\{comuna\}/g, negocio.comuna)
    .replace(/\{score\}/g, String(negocio.score));
}
