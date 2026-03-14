/**
 * Cron jobs para tareas automáticas.
 * - Cada hora: verificar seguimientos pendientes
 * - Cada 6 horas: detectar leads calientes nuevos
 * - Cada 24 horas: recalcular calidad de datos
 */

import cron from "node-cron";
import { notificarSeguimientosPendientes, notificarLeadsCalientes } from "../services/notifications.service";
import { recalcularCalidadDatosBatch } from "../services/calidad-datos.service";

export function iniciarCronJobs() {
  // Cada hora en punto: seguimientos pendientes
  cron.schedule("0 * * * *", async () => {
    console.log("[Cron] Verificando seguimientos pendientes...");
    try {
      const result = await notificarSeguimientosPendientes();
      console.log(`[Cron] Seguimientos: ${result.total} pendientes, ${result.notified} notificados`);
    } catch (err) {
      console.error("[Cron] Error en seguimientos:", err);
    }
  });

  // Cada 6 horas: leads calientes
  cron.schedule("0 */6 * * *", async () => {
    console.log("[Cron] Verificando leads calientes...");
    try {
      const result = await notificarLeadsCalientes();
      console.log(`[Cron] Leads calientes: ${result.leads} leads, ${result.notified} notificados`);
    } catch (err) {
      console.error("[Cron] Error en leads calientes:", err);
    }
  });

  // Cada día a las 3 AM: recalcular calidad de datos
  cron.schedule("0 3 * * *", async () => {
    console.log("[Cron] Recalculando calidad de datos...");
    try {
      const result = await recalcularCalidadDatosBatch();
      console.log(`[Cron] Calidad datos: ${result.updated}/${result.total} actualizados`);
    } catch (err) {
      console.error("[Cron] Error en calidad datos:", err);
    }
  });

  console.log("[Cron] Jobs programados: seguimientos (1h), leads calientes (6h), calidad datos (24h)");
}
