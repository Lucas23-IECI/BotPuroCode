"use client";

import { useEffect, useState } from "react";
import { getZonas, getRubrosOSM, buscarOSM } from "@/lib/api";
import { useToast } from "@/components/toast";
import {
  Search,
  MapPin,
  ExternalLink,
  CheckCircle2,
  Phone,
  Filter,
  Globe,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

interface OSMResult {
  nombre: string;
  tipo: string;
  comuna: string;
  direccion?: string;
  sitioWeb?: string;
  telefono?: string;
  email?: string;
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
  const [filterText, setFilterText] = useState("");
  const [filterSinWeb, setFilterSinWeb] = useState(false);
  const [showRubros, setShowRubros] = useState(true);
  const [showZonas, setShowZonas] = useState(true);
  const [selectedResult, setSelectedResult] = useState<OSMResult | null>(null);
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
    setSelectedResult(null);
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

  // Filter results
  const filtered = results.filter((r) => {
    if (filterText && !r.nombre.toLowerCase().includes(filterText.toLowerCase())) return false;
    if (filterSinWeb && r.sitioWeb) return false;
    return true;
  });

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Buscar en OpenStreetMap</h1>
        <p className="text-sm text-muted-foreground">
          Descubre negocios en el Gran Concepcion usando datos abiertos de OSM
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left Panel — Controls */}
        <div className="w-full shrink-0 space-y-4 lg:w-80">
          {/* Rubros */}
          <div className="rounded-2xl border border-border/60 bg-card">
            <button
              onClick={() => setShowRubros((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground"
            >
              <span>
                Rubros{" "}
                {selectedRubros.size > 0 && (
                  <span className="ml-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-xs text-violet-500">
                    {selectedRubros.size}
                  </span>
                )}
              </span>
              {showRubros ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {showRubros && (
              <div className="max-h-44 overflow-y-auto border-t border-border/60 px-2 py-2">
                {rubros.map((r) => (
                  <label
                    key={r}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
                  >
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
            )}
          </div>

          {/* Comunas */}
          <div className="rounded-2xl border border-border/60 bg-card">
            <button
              onClick={() => setShowZonas((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground"
            >
              <span>
                Comunas{" "}
                {selectedZonas.size > 0 && (
                  <span className="ml-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-xs text-violet-500">
                    {selectedZonas.size}
                  </span>
                )}
              </span>
              {showZonas ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {showZonas && (
              <div className="max-h-44 overflow-y-auto border-t border-border/60 px-2 py-2">
                {zonas.map((z) => (
                  <label
                    key={z}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
                  >
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
            )}
          </div>

          {/* Options + Search Button */}
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={importar}
                onChange={(e) => setImportar(e.target.checked)}
                className="rounded"
              />
              Importar automaticamente
            </label>

            <button
              onClick={handleSearch}
              disabled={searching}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-violet-500/20 hover:brightness-110 transition-all disabled:opacity-50"
            >
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {searching ? "Buscando..." : "Buscar"}
            </button>

            {/* Progress */}
            {searching && progress.total > 0 && (
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">{progress.label}</span>
                  <span className="shrink-0">
                    {progress.current}/{progress.total}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted/50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 to-blue-600 transition-all"
                    style={{
                      width: `${(progress.current / progress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel — Results */}
        <div className="min-w-0 flex-1">
          {results.length === 0 && !searching && (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 text-muted-foreground">
              <Search className="mb-2 h-8 w-8 text-violet-400/50" />
              <p className="text-sm">Selecciona rubros y comunas para buscar</p>
            </div>
          )}

          {results.length === 0 && searching && (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-border/60">
              <Loader2 className="mb-2 h-8 w-8 animate-spin text-violet-500" />
              <p className="text-sm text-muted-foreground">Buscando negocios...</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-4">
              {/* Filter bar */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1">
                  <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Filtrar resultados..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <button
                  onClick={() => setFilterSinWeb((v) => !v)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                    filterSinWeb
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Solo sin web
                </button>
                <span className="text-xs text-muted-foreground">
                  {filtered.length} de {results.length}
                </span>
              </div>

              {/* Cards grid */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((n, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedResult(n)}
                    className={`group rounded-2xl border p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5 ${
                      selectedResult === n
                        ? "border-violet-500/50 bg-violet-500/5"
                        : "border-border/60 bg-card hover:border-violet-500/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {n.nombre}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {n.tipo} &middot; {n.comuna}
                        </p>
                      </div>
                      {!n.sitioWeb ? (
                        <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
                          Sin web
                        </span>
                      ) : (
                        <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                    </div>
                    {n.direccion && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{n.direccion}</span>
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-3">
                      {n.telefono && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {n.telefono}
                        </span>
                      )}
                      {n.sitioWeb && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(n.sitioWeb, "_blank", "noopener,noreferrer");
                          }}
                          className="flex cursor-pointer items-center gap-1 text-xs text-blue-500 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Ver web
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Preview Panel — shows when result selected on large screens */}
        {selectedResult && (
          <div className="hidden w-72 shrink-0 rounded-2xl border border-border/60 bg-card p-5 xl:block">
            <h3 className="text-sm font-bold text-foreground">{selectedResult.nombre}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {selectedResult.tipo} &middot; {selectedResult.comuna}
            </p>

            <div className="mt-4 space-y-3">
              {selectedResult.direccion && (
                <div className="flex items-start gap-2 text-xs">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-foreground">{selectedResult.direccion}</span>
                </div>
              )}
              {selectedResult.telefono && (
                <div className="flex items-center gap-2 text-xs">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-foreground">{selectedResult.telefono}</span>
                </div>
              )}
              {selectedResult.sitioWeb && (
                <div className="flex items-center gap-2 text-xs">
                  <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <a
                    href={selectedResult.sitioWeb}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-blue-500 hover:underline"
                  >
                    {selectedResult.sitioWeb}
                  </a>
                </div>
              )}
              {selectedResult.email && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">@</span>
                  <span className="text-foreground">{selectedResult.email}</span>
                </div>
              )}
            </div>

            {!selectedResult.sitioWeb && (
              <div className="mt-4 rounded-xl bg-emerald-500/10 p-3 text-center text-xs text-emerald-500">
                <CheckCircle2 className="mx-auto mb-1 h-5 w-5" />
                Oportunidad: no tiene web
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
