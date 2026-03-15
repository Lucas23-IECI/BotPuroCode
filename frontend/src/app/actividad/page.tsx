"use client";

import { useState, useEffect, useMemo } from "react";
import {
  getActivity,
  getActivityStats,
  getActivityHeatmap,
  type ActivityLog,
  type ActivityStats,
} from "@/lib/api";
import {
  Activity,
  BarChart3,
  TrendingUp,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ACTION_LABELS: Record<string, string> = {
  LOGIN: "Inicio sesión",
  CHANGE_PASSWORD: "Cambio contraseña",
  UPDATE_PROFILE: "Perfil actualizado",
  CREATE_NEGOCIO: "Negocio creado",
  UPDATE_NEGOCIO: "Negocio actualizado",
  IMPORT_CSV: "Importación CSV",
  ASSIGN_NEGOCIO: "Negocio asignado",
  CREATE_CONTACTO: "Contacto creado",
  UPDATE_ESTADO: "Estado actualizado",
  IMPORT_OSM: "Importación OSM",
  CREATE_PROPUESTA: "Propuesta creada",
  UPDATE_PROPUESTA: "Propuesta actualizada",
  CREATE_PLANTILLA: "Plantilla creada",
  DELETE_PLANTILLA: "Plantilla eliminada",
  CREATE_AUTOMATIZACION: "Automatización creada",
  UPDATE_AUTOMATIZACION: "Automatización actualizada",
  DELETE_AUTOMATIZACION: "Automatización eliminada",
};

function actionLabel(a: string) {
  return ACTION_LABELS[a] ?? a;
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `hace ${days}d`;
  return new Date(iso).toLocaleDateString("es-CL", { day: "numeric", month: "short" });
}

/* ─── Heatmap ─── */
function Heatmap({ data }: { data: Record<string, number> }) {
  const weeks = 52;
  const today = new Date();
  const cells: { date: string; count: number; dayOfWeek: number }[] = [];

  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    cells.push({ date: key, count: data[key] ?? 0, dayOfWeek: d.getDay() });
  }

  const max = Math.max(...cells.map((c) => c.count), 1);

  function intensity(count: number) {
    if (count === 0) return "bg-muted/30";
    const ratio = count / max;
    if (ratio < 0.25) return "bg-violet-500/20";
    if (ratio < 0.5) return "bg-violet-500/40";
    if (ratio < 0.75) return "bg-violet-500/70";
    return "bg-violet-500";
  }

  // Group by week columns
  const weekCols: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weekCols.push(cells.slice(i, i + 7));
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-[3px]">
        {weekCols.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((cell) => (
              <div
                key={cell.date}
                title={`${cell.date}: ${cell.count} acciones`}
                className={`h-[11px] w-[11px] rounded-sm transition-colors ${intensity(cell.count)}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
        <span>Menos</span>
        <div className="h-[10px] w-[10px] rounded-sm bg-muted/30" />
        <div className="h-[10px] w-[10px] rounded-sm bg-violet-500/20" />
        <div className="h-[10px] w-[10px] rounded-sm bg-violet-500/40" />
        <div className="h-[10px] w-[10px] rounded-sm bg-violet-500/70" />
        <div className="h-[10px] w-[10px] rounded-sm bg-violet-500" />
        <span>Más</span>
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function ActividadPage() {
  const [stats, setStats] = useState<ActivityStats[]>([]);
  const [timeline, setTimeline] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [heatmaps, setHeatmaps] = useState<Record<string, Record<string, number>>>({});
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedHeatUser, setSelectedHeatUser] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;

  // Load stats + timeline
  useEffect(() => {
    getActivityStats().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    const params: Record<string, string | number> = { limit, offset: page * limit };
    if (selectedUser) params.userId = selectedUser;
    if (selectedAction) params.accion = selectedAction;
    getActivity(params).then((r) => {
      setTimeline(r.items);
      setTotal(r.total);
    }).catch(() => {});
  }, [page, selectedUser, selectedAction]);

  // Load heatmap when user is selected
  useEffect(() => {
    if (!selectedHeatUser) return;
    if (heatmaps[selectedHeatUser]) return;
    getActivityHeatmap(selectedHeatUser).then((data) =>
      setHeatmaps((prev) => ({ ...prev, [selectedHeatUser]: data }))
    ).catch(() => {});
  }, [selectedHeatUser, heatmaps]);

  // Auto-select first user for heatmap
  useEffect(() => {
    if (stats.length > 0 && !selectedHeatUser) {
      setSelectedHeatUser(stats[0].user.id);
    }
  }, [stats, selectedHeatUser]);

  // Unique actions for filter
  const allActions = useMemo(() => {
    const set = new Set<string>();
    stats.forEach((s) => s.byAction.forEach((a) => set.add(a.accion)));
    return Array.from(set).sort();
  }, [stats]);

  const totalPages = Math.ceil(total / limit);

  const totalTeamActions = stats.reduce((s, u) => s + u.total, 0);
  const totalWeekActions = stats.reduce((s, u) => s + u.thisWeek, 0);

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Panel de Actividad</h1>
        <p className="text-sm text-muted-foreground">Seguimiento del equipo y registro de acciones</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-4 transition-shadow hover:shadow-md">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <BarChart3 className="h-3.5 w-3.5 text-violet-500" />
            Total Acciones
          </div>
          <p className="text-2xl font-bold text-foreground">{totalTeamActions.toLocaleString("es-CL")}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-4 transition-shadow hover:shadow-md">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
            Esta Semana
          </div>
          <p className="text-2xl font-bold text-foreground">{totalWeekActions.toLocaleString("es-CL")}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-4 transition-shadow hover:shadow-md">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Activity className="h-3.5 w-3.5 text-green-500" />
            Miembros Activos
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.filter((s) => s.thisWeek > 0).length} / {stats.length}</p>
        </div>
      </div>

      {/* Comparison per user */}
      {stats.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 transition-shadow hover:shadow-md">
          <h3 className="text-sm font-semibold text-foreground">Comparativa por Miembro</h3>
          <div className="space-y-3">
            {stats.map((s) => {
              const pct = totalTeamActions > 0 ? (s.total / totalTeamActions) * 100 : 0;
              return (
                <div key={s.user.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {s.user.avatarBase64 ? (
                        <img src={s.user.avatarBase64} alt="" className="h-6 w-6 rounded-md object-cover" />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/10 text-violet-500 text-[10px] font-bold">
                          {s.user.nombre.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm text-foreground">{s.user.nombre}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{s.total} total</span>
                      <span className="text-violet-500 font-medium">{s.thisWeek} esta semana</span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted/30 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-600 to-blue-600 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {/* Top actions */}
                  <div className="flex flex-wrap gap-1">
                    {s.byAction.slice(0, 4).map((a) => (
                      <span key={a.accion} className="rounded-md bg-muted/30 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {actionLabel(a.accion)} ({a.count})
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Heatmap */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 transition-shadow hover:shadow-md">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Mapa de Actividad</h3>
          {stats.length > 1 && (
            <select
              value={selectedHeatUser}
              onChange={(e) => setSelectedHeatUser(e.target.value)}
              className="rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground"
            >
              {stats.map((s) => (
                <option key={s.user.id} value={s.user.id}>{s.user.nombre}</option>
              ))}
            </select>
          )}
        </div>
        {selectedHeatUser && heatmaps[selectedHeatUser] ? (
          <Heatmap data={heatmaps[selectedHeatUser]} />
        ) : (
          <p className="text-xs text-muted-foreground">Cargando…</p>
        )}
      </div>

      {/* Timeline with filters */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 transition-shadow hover:shadow-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-violet-500" />
            Línea de Tiempo
          </h3>
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={selectedUser}
              onChange={(e) => { setSelectedUser(e.target.value); setPage(0); }}
              className="rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground"
            >
              <option value="">Todos</option>
              {stats.map((s) => (
                <option key={s.user.id} value={s.user.id}>{s.user.nombre}</option>
              ))}
            </select>
            <select
              value={selectedAction}
              onChange={(e) => { setSelectedAction(e.target.value); setPage(0); }}
              className="rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground"
            >
              <option value="">Todas las acciones</option>
              {allActions.map((a) => (
                <option key={a} value={a}>{actionLabel(a)}</option>
              ))}
            </select>
          </div>
        </div>

        {timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Sin actividad registrada</p>
        ) : (
          <div className="space-y-1">
            {timeline.map((item) => (
              <div key={item.id} className="flex items-start gap-3 rounded-xl border border-border/30 p-3 transition-colors hover:bg-accent/30">
                {item.user.avatarBase64 ? (
                  <img src={item.user.avatarBase64} alt="" className="mt-0.5 h-7 w-7 rounded-md object-cover" />
                ) : (
                  <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/10 text-violet-500 text-[10px] font-bold">
                    {item.user.nombre.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{item.user.nombre}</span>
                    <span className="rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[10px] text-violet-500 font-medium">
                      {actionLabel(item.accion)}
                    </span>
                  </div>
                  {item.detalle && <p className="text-xs text-muted-foreground truncate">{item.detalle}</p>}
                </div>
                <span className="whitespace-nowrap text-[10px] text-muted-foreground/70">{relativeTime(item.createdAt)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">{total} resultados</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent/50 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 text-xs text-muted-foreground">{page + 1} / {totalPages}</span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent/50 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
