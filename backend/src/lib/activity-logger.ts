import { prisma } from "./prisma";

interface LogActivityParams {
  userId: string;
  accion: string;
  entidad?: string;
  entidadId?: string;
  detalle?: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: params.userId,
        accion: params.accion,
        entidad: params.entidad,
        entidadId: params.entidadId,
        detalle: params.detalle,
        metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
      },
    });
  } catch {
    // Activity logging should never break the main flow
    console.error("[ActivityLog] Error logging activity:", params.accion);
  }
}
