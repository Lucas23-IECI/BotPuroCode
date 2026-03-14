"use client";

import { useState } from "react";
import { getReport, getExportCSVUrl } from "@/lib/api";
import { Download, FileJson, FileSpreadsheet, FileText, Search } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function ExportPage() {
  const [reportId, setReportId] = useState("");
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [scoreMin, setScoreMin] = useState(0);
  const [nivel, setNivel] = useState("");

  const handleCSVDownload = () => {
    window.open(getExportCSVUrl(), "_blank");
  };

  const handleJSONDownload = () => {
    const params = new URLSearchParams();
    if (scoreMin > 0) params.set("scoreMin", String(scoreMin));
    if (nivel) params.set("nivelOportunidad", nivel);
    window.open(`${API_BASE}/export/json?${params.toString()}`, "_blank");
  };

  const handleReport = async () => {
    if (!reportId.trim()) return;
    setLoadingReport(true);
    setReport(null);
    try {
      const data = await getReport(reportId.trim());
      setReport(data);
    } catch {
      setReport({ error: "No se encontró el negocio" });
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Exportar Datos</h1>
        <p className="text-sm text-muted-foreground">
          Descarga tus leads en diferentes formatos o genera reportes individuales
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* CSV Export */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2">
              <FileSpreadsheet className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Exportar CSV</h3>
              <p className="text-sm text-muted-foreground">Todos los leads, compatible con Excel</p>
            </div>
          </div>
          <button
            onClick={handleCSVDownload}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700"
          >
            <Download className="h-4 w-4" />
            Descargar CSV
          </button>
        </div>

        {/* JSON Export */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <FileJson className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Exportar JSON</h3>
              <p className="text-sm text-muted-foreground">Filtrado por score y nivel</p>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Score mínimo</label>
              <input
                type="number"
                min={0}
                max={100}
                value={scoreMin}
                onChange={(e) => setScoreMin(Number(e.target.value))}
                className="w-24 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Nivel</label>
              <select
                value={nivel}
                onChange={(e) => setNivel(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="">Todos</option>
                <option value="ALTA">Alta</option>
                <option value="MEDIA_ALTA">Media Alta</option>
                <option value="MEDIA">Media</option>
                <option value="BAJA">Baja</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleJSONDownload}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            Descargar JSON
          </button>
        </div>
      </div>

      {/* Mini-report */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-purple-500/10 p-2">
            <FileText className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Mini-Reporte por Lead</h3>
            <p className="text-sm text-muted-foreground">
              Ingresa el ID del negocio para generar un reporte completo
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="ID del negocio (ej: clxyz123...)"
            value={reportId}
            onChange={(e) => setReportId(e.target.value)}
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          />
          <button
            onClick={handleReport}
            disabled={loadingReport}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            <Search className="h-4 w-4" />
            {loadingReport ? "Generando…" : "Generar"}
          </button>
        </div>

        {report && (
          <pre className="mt-4 max-h-96 overflow-auto rounded-lg bg-muted/50 p-4 text-xs text-foreground">
            {JSON.stringify(report, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
