"use client";

import { useEffect, useState } from "react";
import { getZonas, getRubrosOSM, buscarOSM } from "@/lib/api";
import { useToast } from "@/components/toast";
import { Search, Download, MapPin, ExternalLink, CheckCircle2 } from "lucide-react";

interface OSMResult {
  nombre: string;
  tipo: string;
  comuna: string;
  direccion?: string;
  sitioWeb?: string;
}

export default function BuscarOSMPage() {
  const [zonas, setZonas] = useState<string[]>([]);
  const [rubros, setRubros] = useState<string[]>([]);
  const [selectedZonas, setSelectedZonas] = useState<Set<string>>(new Set());
  const [selectedRubros, setSelectedRubros] = useState<Set<string>>(new Set());
  const [importar, setImportar] = useState(true);
  const [results, setResults] = useState<OSMResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, label: "" });
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([getZonas(), getRubrosOSM()]).then(([z, r]) => {
      setZonas(z);
      setRubros(r);
    });
  }, []);

  const toggleItem = (set: Set<string>, item: string) => {
    const next = new Set(set);
    if (next.has(item)) next.delete(item);
    else next.add(item);
    return next;
  };

  const handleSearch = async () => {
    const rubroList = selectedRubros.size > 0 ? [...selectedRubros] : rubros.slice(0, 1);
    const zonaList = selectedZonas.size > 0 ? [...selectedZonas] : zonas.slice(0, 1);

    if (rubroList.length === 0 || zonaList.length === 0) {
      toast("Selecciona al menos un rubro y una comuna", "error");
      return;
    }

    setSearching(true);
    setResults([]);
    const total = rubroList.length * zonaList.length;
    let current = 0;
    let allResults: OSMResult[] = [];
    let totalCreados = 0;
    let totalDuplicados = 0;

    for (const rubro of rubroList) {
      for (const zona of zonaList) {
        current++;
        setProgress({ current, total, label: `${rubro} en ${zona}` });
        try {
          const data = await buscarOSM(rubro, zona, importar);
          if (data.resultados) {
            allResults = [...allResults, ...data.resultados];
          }
          if (data.creados !== undefined) {
            totalCreados += data.creados ?? 0;
            totalDuplicados += data.duplicados ?? 0;
          }
        } catch {
          // continue with other combinations
        }
      }
    }

    setResults(allResults);
    setProgress({ current: 0, total: 0, label: "" });
    setSearching(false);

    if (importar) {
      toast(`${totalCreados} importados, ${totalDuplicados} duplicados`, "success");
    } else {
      toast(`${allResults.length} negocios encontrados`, "info");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Buscar en OpenStreetMap</h1>
        <p className="text-sm text-muted-foreground">
          Descubre negocios en el Gran Concepción usando datos abiertos de OSM
        </p>
      </div>

      {/* Controls */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Rubros multi-select */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Rubros {selectedRubros.size > 0 && <span className="text-muted-foreground">({selectedRubros.size})</span>}
            </label>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-input bg-background p-2">
              {rubros.map((r) => (
                <label key={r} className="flex items-center gap-2 rounded px-2 py-1 text-sm text-foreground hover:bg-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedRubros.has(r)}
                    onChange={() => setSelectedRubros((s) => toggleItem(s, r))}
                    className="rounded"
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>

          {/* Comunas multi-select */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Comunas {selectedZonas.size > 0 && <span className="text-muted-foreground">({selectedZonas.size})</span>}
            </label>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-input bg-background p-2">
              {zonas.map((z) => (
                <label key={z} className="flex items-center gap-2 rounded px-2 py-1 text-sm text-foreground hover:bg-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedZonas.has(z)}
                    onChange={() => setSelectedZonas((s) => toggleItem(s, z))}
                    className="rounded"
                  />
                  {z}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={importar}
              onChange={(e) => setImportar(e.target.checked)}
              className="rounded"
            />
            Importar automáticamente
          </label>

          <button
            onClick={handleSearch}
            disabled={searching}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {searching ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {searching ? "Buscando…" : "Buscar"}
          </button>
        </div>

        {/* Progress indicator */}
        {searching && progress.total > 0 && (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>{progress.label}</span>
              <span>{progress.current}/{progress.total}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted/50">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="rounded-xl border border-border">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-medium text-foreground">
              {results.length} resultados
            </h3>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nombre</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rubro</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Comuna</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Dirección</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Web</th>
              </tr>
            </thead>
            <tbody>
              {results.map((n, i) => (
                <tr key={i} className="border-b border-border transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {n.nombre}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{n.tipo}</td>
                  <td className="px-4 py-3 text-muted-foreground">{n.comuna}</td>
                  <td className="px-4 py-3 text-muted-foreground">{n.direccion ?? "-"}</td>
                  <td className="px-4 py-3 text-center">
                    {n.sitioWeb ? (
                      <a href={n.sitioWeb} target="_blank" rel="noopener noreferrer" className="inline-flex text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : (
                      <span className="flex items-center justify-center gap-1 text-xs text-green-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Sin web
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
