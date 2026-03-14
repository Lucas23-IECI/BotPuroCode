"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Info, X } from "lucide-react";

const FACTORES = [
  { nombre: "Presencia Digital", max: 40, desc: "Sin web = 40pts, Solo RRSS = 30pts, Link externo = 20pts, Web básica = 10pts" },
  { nombre: "Calidad Técnica", max: 25, desc: "SSL, responsive, formulario, CTA, WhatsApp widget, favicon, meta tags" },
  { nombre: "Tecnología", max: 10, desc: "Sin tecnología o plantilla genérica suma puntos; web profesional resta" },
  { nombre: "Rubro Prioritario", max: 15, desc: "Barberías/peluquerías = 15pts, veterinarias/talleres = 12pts, otros = 8pts" },
  { nombre: "Actividad", max: 10, desc: "Reviews en Maps, rating, presencia en directorios" },
];

const NIVELES = [
  { key: "ALTA", label: "Alta", range: "80-100", desc: "Cliente ideal, sin presencia web", color: "bg-green-500", text: "text-green-400" },
  { key: "MEDIA_ALTA", label: "Media Alta", range: "60-79", desc: "Oportunidad clara de mejora", color: "bg-lime-500", text: "text-lime-400" },
  { key: "MEDIA", label: "Media", range: "40-59", desc: "Oportunidad moderada", color: "bg-yellow-500", text: "text-yellow-400" },
  { key: "BAJA", label: "Baja", range: "20-39", desc: "Poco probable que necesite web", color: "bg-orange-500", text: "text-orange-400" },
  { key: "NO_PRIORITARIO", label: "No Prioritario", range: "0-19", desc: "Ya tiene buena presencia digital", color: "bg-gray-500", text: "text-gray-400" },
];

interface ScoreTooltipProps {
  score: number;
  nivel: string;
  razones?: string[];
  className?: string;
}

export function ScoreTooltip({ score, nivel, razones, className }: ScoreTooltipProps) {
  const [open, setOpen] = useState(false);
  const nivelInfo = NIVELES.find((n) => n.key === nivel) ?? NIVELES[4];

  return (
    <div className={cn("relative inline-flex", className)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors hover:ring-2 hover:ring-ring"
        title="Ver detalles del score"
      >
        <span className={cn(
          "rounded-full px-2 py-0.5",
          score >= 80 ? "bg-green-500/20 text-green-400" :
          score >= 60 ? "bg-lime-500/20 text-lime-400" :
          score >= 40 ? "bg-yellow-500/20 text-yellow-400" :
          score >= 20 ? "bg-orange-500/20 text-orange-400" :
          "bg-gray-500/20 text-gray-400"
        )}>
          {score}
        </span>
        <Info className="h-3 w-3 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-border bg-card p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">{score}</span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className={cn("mb-3 rounded-lg px-3 py-1.5 text-xs font-medium", `${nivelInfo.color}/20`, nivelInfo.text)}>
              {nivelInfo.label} — {nivelInfo.desc}
            </div>

            {razones && razones.length > 0 && (
              <div className="mb-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Razones:</p>
                {razones.map((r, i) => (
                  <p key={i} className="text-xs text-foreground">• {r}</p>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Factores de evaluación:</p>
              {FACTORES.map((f) => (
                <div key={f.nombre}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{f.nombre}</span>
                    <span className="text-foreground">máx {f.max}</span>
                  </div>
                  <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-muted/50">
                    <div className="h-full rounded-full bg-primary/60" style={{ width: `${(f.max / 100) * 100}%` }} />
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function ScoreExplainerPanel() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Cómo funciona el Score
      </h3>

      <div className="mb-6 space-y-3">
        {FACTORES.map((f) => (
          <div key={f.nombre}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{f.nombre}</span>
              <span className="text-muted-foreground">{f.max} pts</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted/50">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(f.max / 100) * 100}%` }} />
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>

      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Niveles de Oportunidad
      </h4>
      <div className="space-y-2">
        {NIVELES.map((n) => (
          <div key={n.key} className="flex items-center gap-3 text-sm">
            <div className={cn("h-3 w-3 rounded-full", n.color)} />
            <span className="w-20 font-medium text-foreground">{n.range}</span>
            <span className={cn("w-24", n.text)}>{n.label}</span>
            <span className="text-xs text-muted-foreground">{n.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
