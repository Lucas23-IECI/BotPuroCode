"use client";

import { useEffect, useState } from "react";
import { getStats, type Stats, statsPresenciaArray, statsNivelArray, statsContactoArray, statsRubroArray, statsComunaArray } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Target,
  Calendar,
  Users,
  Award,
  Clock,
  MapPin,
} from "lucide-react";

/* ─── Reusable bar ────────────────────────────────────── */
function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 truncate text-sm text-muted-foreground">{label}</span>
      <div className="flex-1">
        <div className="h-5 overflow-hidden rounded-full bg-muted/50">
          <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="w-10 text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

/* ─── Donut Ring ──────────────────────────────────────── */
function DonutRing({ segments, size = 130 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;
  const r = (size - 20) / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((seg) => {
          const pct = seg.value / total;
          const dashLength = circumference * pct;
          const dashOffset = -offset;
          offset += dashLength;
          return (
            <circle key={seg.label} cx={size / 2} cy={size / 2} r={r}
              fill="none" stroke={seg.color} strokeWidth="14" strokeLinecap="butt"
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              className="transition-all duration-700" />
          );
        })}
        <text x={size / 2} y={size / 2 - 6} textAnchor="middle" className="fill-foreground text-xl font-bold">{total}</text>
        <text x={size / 2} y={size / 2 + 12} textAnchor="middle" className="fill-muted-foreground text-[10px]">total</text>
      </svg>
      <div className="space-y-1">
        {segments.filter((s) => s.value > 0).map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-xs">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-muted-foreground">{seg.label}</span>
            <span className="font-medium text-foreground">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Period filter ───────────────────────────────────── */
type Period = "all" | "7d" | "30d" | "90d";

export default function EstadisticasPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("all");

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
  const convComuna = (stats.conversionPorComuna ?? []).map((c) => ({
    ...c,
    tasa: c.total > 0 ? Math.round((c.ganados / c.total) * 100) : 0,
  })).sort((a, b) => b.tasa - a.tasa || b.ganados - a.ganados);

  const maxPresencia = Math.max(...porPresencia.map((p) => p._count), 1);
  const maxNivel = Math.max(...porNivel.map((p) => p._count), 1);
  const maxRubro = Math.max(...porRubro.map((p) => p._count), 1);
  const maxComuna = Math.max(...porComuna.map((p) => p._count), 1);
  const maxContacto = Math.max(...porEstadoContacto.map((p) => p._count), 1);

  const nuevos7d = stats.nuevos7d ?? 0;
  const nuevos30d = stats.nuevos30d ?? 0;
  const tasaConversion = stats.tasaConversion ?? 0;
  const ganados = stats.ganados ?? 0;
  const seguimientosPendientes = stats.seguimientosPendientes ?? 0;

  const sinWeb = porPresencia.find((p) => p.estadoPresencia === "SIN_WEB")?._count ?? 0;
  const oportunidadAlta = porNivel.find((n) => n.nivelOportunidad === "ALTA")?._count ?? 0;

  const presenciaColors: Record<string, string> = {
    SIN_WEB: "#22c55e", SOLO_RRSS: "#84cc16", LINK_EXTERNO: "#eab308",
    WEB_BASICA: "#f97316", WEB_MEDIA: "#f87171", WEB_BUENA: "#dc2626", PENDIENTE: "#6b7280",
  };

  const nivelColors: Record<string, string> = {
    ALTA: "#22c55e", MEDIA_ALTA: "#84cc16", MEDIA: "#eab308",
    BAJA: "#f97316", NO_PRIORITARIO: "#6b7280", NO_EVALUADO: "#4b5563",
  };

  const presenciaColorsClass: Record<string, string> = {
    SIN_WEB: "bg-green-500", SOLO_RRSS: "bg-lime-500", LINK_EXTERNO: "bg-yellow-500",
    WEB_BASICA: "bg-orange-500", WEB_MEDIA: "bg-red-400", WEB_BUENA: "bg-red-600", PENDIENTE: "bg-gray-500",
  };

  const nivelColorsClass: Record<string, string> = {
    ALTA: "bg-green-500", MEDIA_ALTA: "bg-lime-500", MEDIA: "bg-yellow-500",
    BAJA: "bg-orange-500", NO_PRIORITARIO: "bg-gray-500", NO_EVALUADO: "bg-gray-600",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Estadísticas</h1>
          <p className="text-sm text-muted-foreground">Resumen detallado de la base de leads</p>
        </div>
        {/* Period filter */}
        <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
          {([
            { key: "all" as Period, label: "Todo" },
            { key: "7d" as Period, label: "7 días" },
            { key: "30d" as Period, label: "30 días" },
            { key: "90d" as Period, label: "90 días" },
          ]).map((p) => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                period === p.key ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"
              )}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards — 2 rows */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Total", value: stats.total, icon: BarChart3, bg: "bg-primary/10", text: "text-primary" },
          { label: "Score Prom.", value: stats.avgScore.toFixed(1), icon: TrendingUp, bg: "bg-green-500/10", text: "text-green-400" },
          { label: "Oport. Alta", value: oportunidadAlta, icon: Target, bg: "bg-yellow-500/10", text: "text-yellow-400" },
          { label: "Sin Web", value: sinWeb, icon: PieChart, bg: "bg-blue-500/10", text: "text-blue-400" },
          { label: "Nuevos 7d", value: nuevos7d, icon: Calendar, bg: "bg-purple-500/10", text: "text-purple-400" },
          { label: "Nuevos 30d", value: nuevos30d, icon: Users, bg: "bg-indigo-500/10", text: "text-indigo-400" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2.5">
              <div className={cn("rounded-lg p-2", kpi.bg)}>
                <kpi.icon className={cn("h-4 w-4", kpi.text)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-xl font-bold text-foreground">{kpi.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Conversion + Seguimientos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2"><Award className="h-5 w-5 text-green-400" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Tasa de conversión</p>
              <p className="text-2xl font-bold text-foreground">{tasaConversion.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">{ganados} ganados</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-500/10 p-2"><Clock className="h-5 w-5 text-yellow-400" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Seguimientos pendientes</p>
              <p className="text-2xl font-bold text-foreground">{seguimientosPendientes}</p>
            </div>
          </div>
        </div>
        {/* Mini donut presencia */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Presencia</h3>
          <DonutRing segments={porPresencia.map((p) => ({
            label: p.estadoPresencia.replace(/_/g, " "),
            value: p._count,
            color: presenciaColors[p.estadoPresencia] ?? "#6b7280",
          }))} size={100} />
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Nivel donut + bars */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Nivel de Oportunidad
          </h3>
          <div className="mb-5 flex justify-center">
            <DonutRing segments={porNivel.map((n) => ({
              label: n.nivelOportunidad.replace(/_/g, " "),
              value: n._count,
              color: nivelColors[n.nivelOportunidad] ?? "#6b7280",
            }))} />
          </div>
        </div>

        {/* Presencia bars */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Presencia Digital
          </h3>
          <div className="space-y-3">
            {porPresencia.map((p) => (
              <Bar key={p.estadoPresencia} label={p.estadoPresencia.replace(/_/g, " ")}
                value={p._count} max={maxPresencia}
                color={presenciaColorsClass[p.estadoPresencia] ?? "bg-gray-500"} />
            ))}
          </div>
        </div>

        {/* Rubros */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Top Rubros</h3>
          <div className="space-y-3">
            {porRubro.slice(0, 12).map((r) => (
              <Bar key={r.rubro} label={r.rubro} value={r._count} max={maxRubro} color="bg-primary" />
            ))}
          </div>
        </div>

        {/* Comunas */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Top Comunas</h3>
          <div className="space-y-3">
            {porComuna.slice(0, 12).map((c) => (
              <Bar key={c.comuna} label={c.comuna} value={c._count} max={maxComuna} color="bg-blue-500" />
            ))}
          </div>
        </div>

        {/* Estado CRM */}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Estado CRM</h3>
          <div className="space-y-3">
            {porEstadoContacto.map((e) => (
              <Bar key={e.estadoContacto} label={e.estadoContacto.replace(/_/g, " ")}
                value={e._count} max={maxContacto} color="bg-purple-500" />
            ))}
          </div>
        </div>
      </div>

      {/* Conversion Heatmap by Zone */}
      {convComuna.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2"><MapPin className="h-5 w-5 text-emerald-400" /></div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Conversión por Zona</h3>
              <p className="text-xs text-muted-foreground">Comunas con mejor tasa de conversión (mín. 2 leads)</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 pr-4">Comuna</th>
                  <th className="pb-2 pr-4 text-center">Total</th>
                  <th className="pb-2 pr-4 text-center">Ganados</th>
                  <th className="pb-2 pr-4 text-center">Tasa</th>
                  <th className="pb-2">Conversión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {convComuna.map((c) => (
                  <tr key={c.comuna} className="group hover:bg-muted/30">
                    <td className="py-2 pr-4 font-medium text-foreground">{c.comuna}</td>
                    <td className="py-2 pr-4 text-center text-muted-foreground">{c.total}</td>
                    <td className="py-2 pr-4 text-center text-muted-foreground">{c.ganados}</td>
                    <td className="py-2 pr-4 text-center">
                      <span className={cn(
                        "inline-block rounded-full px-2 py-0.5 text-xs font-semibold",
                        c.tasa >= 50 ? "bg-green-500/20 text-green-400" :
                        c.tasa >= 25 ? "bg-yellow-500/20 text-yellow-400" :
                        c.tasa > 0 ? "bg-orange-500/20 text-orange-400" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {c.tasa}%
                      </span>
                    </td>
                    <td className="py-2">
                      <div className="h-3 w-full overflow-hidden rounded-full bg-muted/50">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            c.tasa >= 50 ? "bg-green-500" :
                            c.tasa >= 25 ? "bg-yellow-500" :
                            c.tasa > 0 ? "bg-orange-500" :
                            "bg-gray-500"
                          )}
                          style={{ width: `${c.tasa}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
