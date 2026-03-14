"use client";

import { useEffect, useState } from "react";
import { getStats, type Stats, statsPresenciaArray, statsNivelArray, statsContactoArray, statsRubroArray, statsComunaArray } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Target,
} from "lucide-react";

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 truncate text-sm text-muted-foreground">{label}</span>
      <div className="flex-1">
        <div className="h-5 overflow-hidden rounded-full bg-muted/50">
          <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="w-10 text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export default function EstadisticasPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats().then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  if (!stats) return <p className="py-24 text-center text-muted-foreground">Error al cargar estadísticas</p>;

  const porPresencia = statsPresenciaArray(stats);
  const porNivel = statsNivelArray(stats);
  const porRubro = statsRubroArray(stats);
  const porComuna = statsComunaArray(stats);
  const porEstadoContacto = statsContactoArray(stats);

  const maxPresencia = Math.max(...porPresencia.map((p) => p._count), 1);
  const maxNivel = Math.max(...porNivel.map((p) => p._count), 1);
  const maxRubro = Math.max(...porRubro.map((p) => p._count), 1);
  const maxComuna = Math.max(...porComuna.map((p) => p._count), 1);
  const maxContacto = Math.max(...porEstadoContacto.map((p) => p._count), 1);

  const presenciaColors: Record<string, string> = {
    SIN_WEB: "bg-green-500",
    SOLO_RRSS: "bg-lime-500",
    LINK_EXTERNO: "bg-yellow-500",
    WEB_BASICA: "bg-orange-500",
    WEB_MEDIA: "bg-red-400",
    WEB_BUENA: "bg-red-600",
    PENDIENTE: "bg-gray-500",
  };

  const nivelColors: Record<string, string> = {
    ALTA: "bg-green-500",
    MEDIA_ALTA: "bg-lime-500",
    MEDIA: "bg-yellow-500",
    BAJA: "bg-orange-500",
    NO_PRIORITARIO: "bg-gray-500",
    NO_EVALUADO: "bg-gray-600",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Estadísticas</h1>
        <p className="text-sm text-muted-foreground">
          Resumen detallado de la base de leads
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Negocios</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Score Promedio</p>
              <p className="text-2xl font-bold text-foreground">{stats.avgScore.toFixed(1)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-500/10 p-2">
              <Target className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Oportunidad Alta</p>
              <p className="text-2xl font-bold text-foreground">
                {porNivel.find((n) => n.nivelOportunidad === "ALTA")?._count ?? 0}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <PieChart className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sin Web</p>
              <p className="text-2xl font-bold text-foreground">
                {porPresencia.find((p) => p.estadoPresencia === "SIN_WEB")?._count ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Presencia */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Distribución por Presencia Digital
          </h3>
          <div className="space-y-3">
            {porPresencia.map((p) => (
              <Bar
                key={p.estadoPresencia}
                label={p.estadoPresencia.replace(/_/g, " ")}
                value={p._count}
                max={maxPresencia}
                color={presenciaColors[p.estadoPresencia] ?? "bg-gray-500"}
              />
            ))}
          </div>
        </div>

        {/* Nivel */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Distribución por Nivel de Oportunidad
          </h3>
          <div className="space-y-3">
            {porNivel.map((n) => (
              <Bar
                key={n.nivelOportunidad}
                label={n.nivelOportunidad.replace(/_/g, " ")}
                value={n._count}
                max={maxNivel}
                color={nivelColors[n.nivelOportunidad] ?? "bg-gray-500"}
              />
            ))}
          </div>
        </div>

        {/* Rubros */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Top Rubros
          </h3>
          <div className="space-y-3">
            {porRubro.slice(0, 12).map((r) => (
              <Bar
                key={r.rubro}
                label={r.rubro}
                value={r._count}
                max={maxRubro}
                color="bg-primary"
              />
            ))}
          </div>
        </div>

        {/* Comunas */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Top Comunas
          </h3>
          <div className="space-y-3">
            {porComuna.slice(0, 12).map((c) => (
              <Bar
                key={c.comuna}
                label={c.comuna}
                value={c._count}
                max={maxComuna}
                color="bg-blue-500"
              />
            ))}
          </div>
        </div>

        {/* Estado Contacto */}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Estado CRM
          </h3>
          <div className="space-y-3">
            {porEstadoContacto.map((e) => (
              <Bar
                key={e.estadoContacto}
                label={e.estadoContacto.replace(/_/g, " ")}
                value={e._count}
                max={maxContacto}
                color="bg-purple-500"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
