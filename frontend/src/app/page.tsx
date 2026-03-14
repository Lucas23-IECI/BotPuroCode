"use client";

import { useEffect, useState } from "react";
import { getStats, type Stats, getQueueStatus } from "@/lib/api";
import {
  Users,
  TrendingUp,
  Globe,
  Phone,
  AlertCircle,
} from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
  color = "text-foreground",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
    </div>
  );
}

function DistributionBar({
  items,
  colors,
}: {
  items: Record<string, number>;
  colors: Record<string, string>;
}) {
  const total = Object.values(items).reduce((a, b) => a + b, 0);
  if (total === 0) return <p className="text-sm text-muted-foreground">Sin datos</p>;

  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full">
        {Object.entries(items).map(([key, val]) => (
          <div
            key={key}
            className={`${colors[key] ?? "bg-muted"}`}
            style={{ width: `${(val / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
        {Object.entries(items)
          .filter(([, v]) => v > 0)
          .map(([key, val]) => (
            <span key={key} className="flex items-center gap-1">
              <span className={`inline-block h-2 w-2 rounded-full ${colors[key] ?? "bg-muted"}`} />
              {key}: {val}
            </span>
          ))}
      </div>
    </div>
  );
}

const PRESENCIA_COLORS: Record<string, string> = {
  SIN_WEB: "bg-green-500",
  SOLO_RRSS: "bg-lime-500",
  LINK_EXTERNO: "bg-yellow-500",
  WEB_BASICA: "bg-orange-500",
  WEB_MEDIA: "bg-red-400",
  WEB_BUENA: "bg-red-600",
  PENDIENTE: "bg-gray-500",
};

const NIVEL_COLORS: Record<string, string> = {
  ALTA: "bg-green-500",
  MEDIA_ALTA: "bg-lime-500",
  MEDIA: "bg-yellow-500",
  BAJA: "bg-orange-500",
  NO_PRIORITARIO: "bg-gray-500",
  NO_EVALUADO: "bg-gray-400",
};

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen general del motor de leads
        </p>
      </div>

      {(queue.size > 0 || queue.pending > 0) && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-400">
          Análisis en cola: {queue.size} pendientes, {queue.pending} en proceso
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Negocios" value={stats.total} icon={Users} />
        <StatCard
          label="Score Promedio"
          value={stats.avgScore}
          icon={TrendingUp}
          color={stats.avgScore >= 60 ? "text-green-500" : "text-yellow-500"}
        />
        <StatCard
          label="Sin Web"
          value={stats.byPresencia["SIN_WEB"] ?? 0}
          icon={Globe}
          color="text-green-500"
        />
        <StatCard label="Contactados" value={contactados} icon={Phone} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-medium text-foreground">
            Distribución por Presencia Digital
          </h3>
          <DistributionBar items={stats.byPresencia} colors={PRESENCIA_COLORS} />
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-medium text-foreground">
            Distribución por Nivel de Oportunidad
          </h3>
          <DistributionBar items={stats.byNivel} colors={NIVEL_COLORS} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-medium text-foreground">Top Rubros</h3>
          <div className="space-y-2">
            {stats.byRubro.slice(0, 10).map((r) => (
              <div key={r.rubro} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{r.rubro}</span>
                <span className="font-medium text-foreground">{r.count}</span>
              </div>
            ))}
            {stats.byRubro.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin datos aún</p>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-medium text-foreground">Por Comuna</h3>
          <div className="space-y-2">
            {stats.byComuna.map((c) => (
              <div key={c.comuna} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{c.comuna}</span>
                <span className="font-medium text-foreground">{c.count}</span>
              </div>
            ))}
            {stats.byComuna.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin datos aún</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
