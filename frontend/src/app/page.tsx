"use client";

import { useEffect, useState } from "react";
import { getStats, type Stats, getQueueStatus } from "@/lib/api";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  Globe,
  Phone,
  AlertCircle,
  CalendarPlus,
  Trophy,
  Percent,
  Bell,
  Flame,
  ArrowUpRight,
  ArrowRight,
} from "lucide-react";

/* ─── KPI Card ──────────────────────────────── */

function KPICard({
  label,
  value,
  sub,
  icon: Icon,
  accent = "text-primary",
  iconBg = "bg-primary/10",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: string;
  iconBg?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className={`text-3xl font-bold ${accent}`}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className={`rounded-xl p-2.5 ${iconBg}`}>
          <Icon className={`h-5 w-5 ${accent}`} />
        </div>
      </div>
    </div>
  );
}

/* ─── Horizontal Bar Chart ──────────────────── */

function HorizontalBarChart({
  items,
  colorFn,
}: {
  items: Array<{ label: string; value: number }>;
  colorFn: (label: string) => string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-xs text-muted-foreground">
            {item.label}
          </span>
          <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-muted/50">
            <div
              className={`h-full rounded-full transition-all ${colorFn(item.label)}`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          <span className="w-8 text-right text-xs font-semibold text-foreground">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Funnel ────────────────────────────────── */

const FUNNEL_STEPS = [
  { key: "NO_CONTACTADO", label: "Sin contactar", color: "bg-zinc-500" },
  { key: "CONTACTADO", label: "Contactados", color: "bg-blue-500" },
  { key: "PROPUESTA_ENVIADA", label: "Propuesta", color: "bg-violet-500" },
  { key: "NEGOCIANDO", label: "Negociando", color: "bg-amber-500" },
  { key: "CERRADO_GANADO", label: "Ganados", color: "bg-emerald-500" },
];

function SalesFunnel({ data }: { data: Record<string, number> }) {
  const max = Math.max(...FUNNEL_STEPS.map((s) => data[s.key] ?? 0), 1);

  return (
    <div className="flex flex-col items-center gap-1.5">
      {FUNNEL_STEPS.map((step, i) => {
        const val = data[step.key] ?? 0;
        const widthPct = Math.max(20, (val / max) * 100);
        return (
          <div key={step.key} className="flex w-full items-center gap-3">
            <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">
              {step.label}
            </span>
            <div className="flex flex-1 justify-center">
              <div
                className={`flex h-8 items-center justify-center rounded-lg ${step.color} text-xs font-bold text-white transition-all`}
                style={{ width: `${widthPct}%` }}
              >
                {val}
              </div>
            </div>
            {i < FUNNEL_STEPS.length - 1 && (
              <span className="w-10 text-center text-[10px] text-muted-foreground">
                {val > 0
                  ? `${Math.round(((data[FUNNEL_STEPS[i + 1].key] ?? 0) / val) * 100)}%`
                  : "-"}
              </span>
            )}
            {i === FUNNEL_STEPS.length - 1 && <span className="w-10" />}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Score Ring ─────────────────────────────── */

function ScoreRing({ score }: { score: number }) {
  const pct = score;
  const color =
    score >= 80
      ? "text-emerald-500"
      : score >= 60
        ? "text-lime-500"
        : score >= 40
          ? "text-amber-500"
          : "text-red-500";
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="88" height="88" className="-rotate-90">
        <circle cx="44" cy="44" r={r} fill="none" strokeWidth="6" className="stroke-muted/30" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={`${color.replace("text-", "stroke-")} transition-all duration-700`}
        />
      </svg>
      <span className={`absolute text-lg font-bold ${color}`}>{score}</span>
    </div>
  );
}

/* ─── Presencia / Nivel colors ──────────────── */

const PRESENCIA_COLORS: Record<string, string> = {
  SIN_WEB: "bg-emerald-500",
  SOLO_RRSS: "bg-lime-500",
  LINK_EXTERNO: "bg-yellow-500",
  WEB_BASICA: "bg-orange-500",
  WEB_MEDIA: "bg-rose-400",
  WEB_BUENA: "bg-rose-600",
  PENDIENTE: "bg-zinc-500",
};

const PRESENCIA_LABELS: Record<string, string> = {
  SIN_WEB: "Sin web",
  SOLO_RRSS: "Solo RRSS",
  LINK_EXTERNO: "Link externo",
  WEB_BASICA: "Web basica",
  WEB_MEDIA: "Web media",
  WEB_BUENA: "Web buena",
  PENDIENTE: "Pendiente",
};

const NIVEL_COLORS: Record<string, string> = {
  ALTA: "bg-emerald-500",
  MEDIA_ALTA: "bg-lime-500",
  MEDIA: "bg-amber-500",
  BAJA: "bg-orange-500",
  NO_PRIORITARIO: "bg-zinc-500",
  NO_EVALUADO: "bg-zinc-400",
};

/* ─── Main Dashboard ───────────────────────── */

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [queue, setQueue] = useState({ size: 0, pending: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((e) => setError(e.message));

    getQueueStatus()
      .then(setQueue)
      .catch(() => {});

    const interval = setInterval(() => {
      getQueueStatus().then(setQueue).catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
        <AlertCircle className="h-5 w-5" />
        <span>Error conectando al backend: {error}</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  const contactados =
    (stats.byContacto["CONTACTADO"] ?? 0) +
    (stats.byContacto["PROPUESTA_ENVIADA"] ?? 0) +
    (stats.byContacto["NEGOCIANDO"] ?? 0) +
    (stats.byContacto["CERRADO_GANADO"] ?? 0);

  const sinWeb = stats.byPresencia["SIN_WEB"] ?? 0;
  const nuevos7d = stats.nuevos7d ?? 0;
  const nuevos30d = stats.nuevos30d ?? 0;
  const tasaConversion = stats.tasaConversion ?? 0;
  const ganados = stats.ganados ?? 0;
  const topHot = stats.topHot ?? [];
  const seguimientosPendientes = stats.seguimientosPendientes ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {stats.total} negocios registrados
          </p>
        </div>
        {(queue.size > 0 || queue.pending > 0) && (
          <div className="flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs text-blue-400">
            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
            {queue.size} en cola &middot; {queue.pending} procesando
          </div>
        )}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard
          label="Total Negocios"
          value={stats.total}
          sub={`+${nuevos7d} esta semana`}
          icon={Users}
          accent="text-blue-500"
          iconBg="bg-blue-500/10"
        />
        <KPICard
          label="Score Promedio"
          value={stats.avgScore}
          sub={stats.avgScore >= 60 ? "Buena oportunidad" : "Oportunidad media"}
          icon={TrendingUp}
          accent={stats.avgScore >= 60 ? "text-emerald-500" : "text-amber-500"}
          iconBg={stats.avgScore >= 60 ? "bg-emerald-500/10" : "bg-amber-500/10"}
        />
        <KPICard
          label="Sin Web"
          value={sinWeb}
          sub={`${stats.total > 0 ? Math.round((sinWeb / stats.total) * 100) : 0}% del total`}
          icon={Globe}
          accent="text-emerald-500"
          iconBg="bg-emerald-500/10"
        />
        <KPICard
          label="Contactados"
          value={contactados}
          icon={Phone}
          accent="text-violet-500"
          iconBg="bg-violet-500/10"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard
          label="Nuevos (30d)"
          value={nuevos30d}
          icon={CalendarPlus}
          accent="text-sky-500"
          iconBg="bg-sky-500/10"
        />
        <KPICard
          label="Tasa Conversion"
          value={`${tasaConversion}%`}
          icon={Percent}
          accent={tasaConversion >= 20 ? "text-emerald-500" : "text-amber-500"}
          iconBg={tasaConversion >= 20 ? "bg-emerald-500/10" : "bg-amber-500/10"}
        />
        <KPICard
          label="Ganados"
          value={ganados}
          icon={Trophy}
          accent="text-amber-500"
          iconBg="bg-amber-500/10"
        />
        <KPICard
          label="Seguimientos"
          value={seguimientosPendientes}
          sub={seguimientosPendientes > 0 ? "Vencidos" : "Ninguno pendiente"}
          icon={Bell}
          accent={seguimientosPendientes > 0 ? "text-rose-500" : "text-emerald-500"}
          iconBg={seguimientosPendientes > 0 ? "bg-rose-500/10" : "bg-emerald-500/10"}
        />
      </div>

      {/* Score Ring + Funnel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Score Overview */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-medium text-foreground">Score General</h3>
          <div className="flex flex-col items-center gap-3">
            <ScoreRing score={stats.avgScore} />
            <p className="text-xs text-muted-foreground">promedio global</p>
          </div>
          <div className="mt-4 space-y-1.5">
            {Object.entries(stats.byNivel)
              .filter(([, v]) => v > 0)
              .map(([key, val]) => (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <span className={`h-2 w-2 rounded-full ${NIVEL_COLORS[key] ?? "bg-muted"}`} />
                  <span className="flex-1 text-muted-foreground">{key.replace(/_/g, " ")}</span>
                  <span className="font-medium text-foreground">{val}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Funnel */}
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-medium text-foreground">Embudo de Ventas</h3>
          <SalesFunnel data={stats.byContacto} />
        </div>
      </div>

      {/* Presencia + Top Rubros + Comunas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Presencia Distribution */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-medium text-foreground">Presencia Digital</h3>
          <HorizontalBarChart
            items={Object.entries(stats.byPresencia)
              .filter(([, v]) => v > 0)
              .map(([k, v]) => ({ label: PRESENCIA_LABELS[k] ?? k, value: v }))}
            colorFn={(label) => {
              const key = Object.entries(PRESENCIA_LABELS).find(([, v]) => v === label)?.[0] ?? "";
              return PRESENCIA_COLORS[key] ?? "bg-muted";
            }}
          />
        </div>

        {/* Top Rubros */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-medium text-foreground">Top Rubros</h3>
          <HorizontalBarChart
            items={stats.byRubro.slice(0, 8).map((r) => ({ label: r.rubro, value: r.count }))}
            colorFn={() => "bg-blue-500"}
          />
          {stats.byRubro.length === 0 && (
            <p className="text-sm text-muted-foreground">Sin datos aun</p>
          )}
        </div>

        {/* Top Comunas */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-medium text-foreground">Por Comuna</h3>
          <HorizontalBarChart
            items={stats.byComuna.slice(0, 8).map((c) => ({ label: c.comuna, value: c.count }))}
            colorFn={() => "bg-violet-500"}
          />
          {stats.byComuna.length === 0 && (
            <p className="text-sm text-muted-foreground">Sin datos aun</p>
          )}
        </div>
      </div>

      {/* Top Hot Leads */}
      {topHot.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Flame className="h-4 w-4 text-orange-500" />
              Top Leads Calientes
            </h3>
            <Link
              href="/leads?nivelOportunidad=ALTA"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {topHot.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="group flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:border-orange-500/30 hover:bg-orange-500/5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-xs font-bold text-white">
                  {lead.score}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{lead.nombre}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {lead.rubro} &middot; {lead.comuna}
                  </p>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
