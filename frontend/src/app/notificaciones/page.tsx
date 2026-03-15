"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  getNotificaciones,
  marcarNotificacionLeida,
  marcarTodasLeidas,
  deleteNotificacion,
  type Notificacion,
} from "@/lib/api";
import { useToast } from "@/components/toast";
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  Star,
  Calendar,
  Info,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TIPO_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  SEGUIMIENTO_PENDIENTE: { icon: <Calendar className="h-4 w-4" />, color: "text-yellow-400" },
  LEAD_CALIENTE: { icon: <Star className="h-4 w-4" />, color: "text-orange-400" },
  PROPUESTA_ACEPTADA: { icon: <CheckCheck className="h-4 w-4" />, color: "text-green-400" },
  ALERTA: { icon: <AlertTriangle className="h-4 w-4" />, color: "text-red-400" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mes`;
}

export default function NotificacionesPage() {
  const { toast } = useToast();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchData = useCallback(async () => {
    try {
      const resp = await getNotificaciones();
      setNotificaciones(resp.notificaciones);
      setNoLeidas(resp.noLeidas);
    } catch {
      toast("Error al cargar notificaciones", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleMarkRead = async (id: string) => {
    await marcarNotificacionLeida(id);
    fetchData();
  };

  const handleMarkAllRead = async () => {
    await marcarTodasLeidas();
    toast("Todas marcadas como leídas", "success");
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await deleteNotificacion(id);
    toast("Notificación eliminada", "info");
    fetchData();
  };

  const filtered = filter === "unread"
    ? notificaciones.filter((n) => !n.leida)
    : notificaciones;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notificaciones</h1>
          <p className="text-sm text-muted-foreground">
            {noLeidas > 0 ? `${noLeidas} sin leer` : "Todas leídas"}
          </p>
        </div>
        {noLeidas > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            <CheckCheck className="h-4 w-4" /> Marcar todas leídas
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            filter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          Todas ({notificaciones.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            filter === "unread" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          Sin leer ({noLeidas})
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Bell className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">No hay notificaciones</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const cfg = TIPO_CONFIG[n.tipo] ?? { icon: <Info className="h-4 w-4" />, color: "text-muted-foreground" };
            return (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-4 transition-colors",
                  n.leida
                    ? "border-border bg-card"
                    : "border-primary/30 bg-primary/5"
                )}
              >
                <div className={cn("mt-0.5 shrink-0", cfg.color)}>{cfg.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-medium", n.leida ? "text-foreground" : "text-primary")}>
                      {n.titulo}
                    </span>
                    {!n.leida && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.mensaje}</p>
                  <span className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!n.leida && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Marcar como leída"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
