"use client";

import { useEffect, useState } from "react";
import { getNegocios, getExportCSVUrl, type Negocio } from "@/lib/api";
import { Download, FileSpreadsheet, FileJson, Eye, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const ALL_COLUMNS: { key: keyof Negocio; label: string; default: boolean }[] = [
  { key: "nombre", label: "Nombre", default: true },
  { key: "rubro", label: "Rubro", default: true },
  { key: "comuna", label: "Comuna", default: true },
  { key: "direccion", label: "Dirección", default: true },
  { key: "telefono", label: "Teléfono", default: true },
  { key: "email", label: "Email", default: true },
  { key: "sitioWeb", label: "Sitio Web", default: true },
  { key: "instagram", label: "Instagram", default: true },
  { key: "facebook", label: "Facebook", default: false },
  { key: "score", label: "Score", default: true },
  { key: "nivelOportunidad", label: "Nivel", default: true },
  { key: "estadoPresencia", label: "Presencia", default: true },
  { key: "estadoContacto", label: "Estado CRM", default: true },
  { key: "fechaUltimoContacto", label: "Último contacto", default: false },
  { key: "proximoSeguimiento", label: "Seguimiento", default: false },
  { key: "notas", label: "Notas", default: false },
  { key: "createdAt", label: "Fecha creación", default: false },
];

export default function ExportPage() {
  const [preview, setPreview] = useState<Negocio[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedCols, setSelectedCols] = useState<Set<string>>(
    new Set(ALL_COLUMNS.filter((c) => c.default).map((c) => c.key))
  );

  /* Filters */
  const [scoreMin, setScoreMin] = useState(0);
  const [nivel, setNivel] = useState("");
  const [presencia, setPresencia] = useState("");
  const [estadoCRM, setEstadoCRM] = useState("");

  const toggleCol = (key: string) => {
    setSelectedCols((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const selectAll = () => setSelectedCols(new Set(ALL_COLUMNS.map((c) => c.key)));
  const selectMinimal = () => setSelectedCols(new Set(["nombre", "rubro", "comuna", "telefono", "score"]));

  const loadPreview = async () => {
    setLoadingPreview(true);
    try {
      const params: Record<string, string | number> = { limit: 10 };
      if (scoreMin > 0) params.scoreMin = scoreMin;
      if (nivel) params.nivelOportunidad = nivel;
      if (presencia) params.estadoPresencia = presencia;
      if (estadoCRM) params.estadoContacto = estadoCRM;
      const result = await getNegocios(params);
      setPreview(result.data);
      setShowPreview(true);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleCSVDownload = () => {
    window.open(getExportCSVUrl(), "_blank");
  };

  const handleJSONDownload = () => {
    const params = new URLSearchParams();
    if (scoreMin > 0) params.set("scoreMin", String(scoreMin));
    if (nivel) params.set("nivelOportunidad", nivel);
    if (presencia) params.set("estadoPresencia", presencia);
    if (estadoCRM) params.set("estadoContacto", estadoCRM);
    window.open(`${API_BASE}/export/json?${params.toString()}`, "_blank");
  };

  const handleClientCSVDownload = () => {
    const cols = ALL_COLUMNS.filter((c) => selectedCols.has(c.key));
    const header = cols.map((c) => c.label).join(",");
    const rows = preview.map((n) =>
      cols.map((c) => {
        const val = n[c.key];
        const str = val == null ? "" : Array.isArray(val) ? val.join("; ") : String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(",")
    );
    const blob = new Blob(["\uFEFF" + header + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_purocode_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Exportar Datos</h1>
        <p className="text-sm text-muted-foreground">
          Descarga tus leads en CSV o JSON, con filtros y selección de columnas
        </p>
      </div>

      {/* Quick download row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button onClick={handleCSVDownload}
          className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-5 text-left transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="rounded-lg bg-green-500/10 p-2.5"><FileSpreadsheet className="h-5 w-5 text-green-400" /></div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">CSV completo</p>
            <p className="text-xs text-muted-foreground">Todos los leads, compatible con Excel</p>
          </div>
          <Download className="h-5 w-5 text-muted-foreground" />
        </button>
        <button onClick={handleJSONDownload}
          className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-5 text-left transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="rounded-lg bg-blue-500/10 p-2.5"><FileJson className="h-5 w-5 text-blue-400" /></div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">JSON filtrado</p>
            <p className="text-xs text-muted-foreground">Con filtros activos</p>
          </div>
          <Download className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Filtros de exportación</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Score mínimo</label>
            <input type="number" min={0} max={100} value={scoreMin} onChange={(e) => setScoreMin(Number(e.target.value))}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground transition-all" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Nivel</label>
            <select value={nivel} onChange={(e) => setNivel(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground transition-all">
              <option value="">Todos</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA_ALTA">Media Alta</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Presencia</label>
            <select value={presencia} onChange={(e) => setPresencia(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground transition-all">
              <option value="">Todas</option>
              <option value="SIN_WEB">Sin Web</option>
              <option value="SOLO_RRSS">Solo RRSS</option>
              <option value="WEB_BASICA">Web Básica</option>
              <option value="WEB_MEDIA">Web Media</option>
              <option value="WEB_BUENA">Web Buena</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Estado CRM</label>
            <select value={estadoCRM} onChange={(e) => setEstadoCRM(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground transition-all">
              <option value="">Todos</option>
              <option value="NO_CONTACTADO">No Contactado</option>
              <option value="CONTACTADO">Contactado</option>
              <option value="PROPUESTA_ENVIADA">Propuesta Enviada</option>
              <option value="NEGOCIANDO">Negociando</option>
              <option value="CERRADO_GANADO">Ganado</option>
              <option value="CERRADO_PERDIDO">Perdido</option>
            </select>
          </div>
        </div>
      </div>

      {/* Column selector */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Columnas a exportar</h3>
          <div className="flex gap-2">
            <button onClick={selectAll} className="text-xs text-violet-500 hover:underline">Todas</button>
            <span className="text-xs text-muted-foreground">·</span>
            <button onClick={selectMinimal} className="text-xs text-violet-500 hover:underline">Mínimas</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {ALL_COLUMNS.map((col) => (
            <button
              key={col.key}
              onClick={() => toggleCol(col.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                selectedCols.has(col.key)
                  ? "bg-violet-500/15 text-violet-500"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {selectedCols.has(col.key) && <Check className="h-3 w-3" />}
              {col.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="flex items-center gap-3">
        <button onClick={loadPreview} disabled={loadingPreview}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-violet-500/20 hover:brightness-110 transition-all disabled:opacity-50">
          <Eye className="h-4 w-4" /> {loadingPreview ? "Cargando…" : "Previsualizar"}
        </button>
        {showPreview && (
          <span className="text-sm text-muted-foreground">{preview.length} registros (muestra)</span>
        )}
      </div>

      {showPreview && preview.length > 0 && (
        <div className="space-y-3">
          <div className="max-h-96 overflow-auto rounded-xl border border-border/60">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  {ALL_COLUMNS.filter((c) => selectedCols.has(c.key)).map((col) => (
                    <th key={col.key} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((n) => (
                  <tr key={n.id} className="border-t border-border hover:bg-muted/30">
                    {ALL_COLUMNS.filter((c) => selectedCols.has(c.key)).map((col) => {
                      const val = n[col.key];
                      const display = val == null ? "—" : Array.isArray(val) ? val.join(", ") : String(val);
                      return <td key={col.key} className="max-w-48 truncate px-3 py-2 text-foreground">{display}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={handleClientCSVDownload}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors">
            <Download className="h-4 w-4" /> Descargar preview como CSV
          </button>
        </div>
      )}
    </div>
  );
}
