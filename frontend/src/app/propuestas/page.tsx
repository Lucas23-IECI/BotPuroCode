"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  getNegocios,
  createPropuesta,
  getPropuestas,
  updatePropuesta,
  getPropuestaPDFUrl,
  type Propuesta,
  type Negocio,
  type PaginatedResponse,
} from "@/lib/api";
import { useToast } from "@/components/toast";
import {
  FileText,
  Plus,
  Download,
  Search,
  X,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TIPOS_SERVICIO = [
  { value: "landing", label: "Landing Page", precio: "$220.000" },
  { value: "corporativa", label: "Corporativa", precio: "$380.000" },
  { value: "ecommerce", label: "E-Commerce", precio: "$550.000" },
];

const ESTADOS = [
  { value: "BORRADOR", label: "Borrador", color: "bg-gray-500/20 text-gray-400" },
  { value: "ENVIADA", label: "Enviada", color: "bg-blue-500/20 text-blue-400" },
  { value: "ACEPTADA", label: "Aceptada", color: "bg-green-500/20 text-green-400" },
  { value: "RECHAZADA", label: "Rechazada", color: "bg-red-500/20 text-red-400" },
];

export default function PropuestasPage() {
  const { toast } = useToast();
  const [propuestas, setPropuestas] = useState<Propuesta[]>([]);
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchNegocio, setSearchNegocio] = useState("");
  const [selectedNegocio, setSelectedNegocio] = useState<Negocio | null>(null);
  const [tipoServicio, setTipoServicio] = useState("landing");
  const [descuento, setDescuento] = useState(0);
  const [creating, setCreating] = useState(false);
  const [filterEstado, setFilterEstado] = useState("");

  const fetchPropuestas = useCallback(async () => {
    try {
      // Fetch all negocios (first page, large limit) then get propuestas for each
      const negResp = await getNegocios({ limit: 500 });
      setNegocios(negResp.data);

      const allPropuestas: Propuesta[] = [];
      // Get propuestas for negocios that have proposals (batch approach)
      const results = await Promise.allSettled(
        negResp.data.map((n) => getPropuestas(n.id))
      );
      results.forEach((r) => {
        if (r.status === "fulfilled") allPropuestas.push(...r.value);
      });

      // Sort by newest
      allPropuestas.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPropuestas(allPropuestas);
    } catch {
      toast("Error al cargar propuestas", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchPropuestas(); }, [fetchPropuestas]);

  const handleCreate = async () => {
    if (!selectedNegocio) return;
    setCreating(true);
    try {
      await createPropuesta({
        negocioId: selectedNegocio.id,
        tipoServicio,
        descuento: descuento > 0 ? descuento : undefined,
      });
      toast("Propuesta creada", "success");
      setShowModal(false);
      setSelectedNegocio(null);
      setDescuento(0);
      fetchPropuestas();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error al crear propuesta", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleEstadoChange = async (propId: string, estado: string) => {
    try {
      await updatePropuesta(propId, estado);
      toast(`Estado actualizado a ${estado}`, "success");
      fetchPropuestas();
    } catch {
      toast("Error al actualizar estado", "error");
    }
  };

  const filtered = filterEstado
    ? propuestas.filter((p) => p.estado === filterEstado)
    : propuestas;

  const negocioMap = Object.fromEntries(negocios.map((n) => [n.id, n]));

  const filteredNegocios = searchNegocio
    ? negocios.filter((n) => n.nombre.toLowerCase().includes(searchNegocio.toLowerCase()))
    : negocios.slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600 dark:border-violet-900 dark:border-t-violet-400" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Propuestas</h1>
          <p className="text-sm text-muted-foreground">{propuestas.length} propuestas en total</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-violet-500/20 hover:brightness-110 transition-all"
        >
          <Plus className="h-4 w-4" /> Nueva Propuesta
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterEstado("")}
          className={cn(
            "rounded-xl px-3 py-1.5 text-xs font-medium transition-all",
            !filterEstado ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow" : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          Todas ({propuestas.length})
        </button>
        {ESTADOS.map((e) => {
          const count = propuestas.filter((p) => p.estado === e.value).length;
          return (
            <button
              key={e.value}
              onClick={() => setFilterEstado(e.value)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-medium transition-all",
                filterEstado === e.value ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow" : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {e.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Propuestas list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-violet-400/50" />
          <p className="mt-3 text-sm text-muted-foreground">
            {propuestas.length === 0 ? "No hay propuestas aún. ¡Crea la primera!" : "Sin resultados para este filtro."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const neg = negocioMap[p.negocioId];
            const estadoInfo = ESTADOS.find((e) => e.value === p.estado) ?? ESTADOS[0];
            return (
              <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 hover:shadow-md transition-all">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/leads/${p.negocioId}`} className="text-sm font-semibold text-foreground hover:text-violet-500 truncate">
                      {neg?.nombre ?? "Negocio"}
                    </Link>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs", estadoInfo.color)}>
                      {estadoInfo.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {TIPOS_SERVICIO.find((t) => t.value === p.tipoServicio)?.label ?? p.tipoServicio} — ${p.precioFinal.toLocaleString("es-CL")} CLP
                    {p.descuento > 0 && <span className="ml-1 text-green-400">(-{p.descuento}%)</span>}
                    {" · "}
                    {new Date(p.createdAt).toLocaleDateString("es-CL")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={p.estado}
                    onChange={(e) => handleEstadoChange(p.id, e.target.value)}
                    className="rounded-xl border border-input bg-background px-2 py-1.5 text-xs text-foreground transition-all"
                  >
                    {ESTADOS.map((e) => (
                      <option key={e.value} value={e.value}>{e.label}</option>
                    ))}
                  </select>
                  <a
                    href={getPropuestaPDFUrl(p.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-xl border border-input px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent/50 transition-colors"
                  >
                    <Download className="h-3 w-3" /> PDF
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Create Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md animate-scale-in rounded-2xl border border-border/50 bg-card p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Nueva Propuesta</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Select negocio */}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Negocio</label>
              {selectedNegocio ? (
                <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2.5 text-sm">
                  <span className="flex-1 text-foreground">{selectedNegocio.nombre}</span>
                  <button onClick={() => setSelectedNegocio(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchNegocio}
                      onChange={(e) => setSearchNegocio(e.target.value)}
                      placeholder="Buscar negocio..."
                      className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-all"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-input">
                    {filteredNegocios.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => { setSelectedNegocio(n); setSearchNegocio(""); }}
                        className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        {n.nombre} <span className="text-xs text-muted-foreground">— {n.comuna}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Type */}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Tipo de Servicio</label>
              <div className="grid grid-cols-3 gap-2">
                {TIPOS_SERVICIO.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTipoServicio(t.value)}
                    className={cn(
                      "rounded-xl border p-3 text-center text-sm transition-all",
                      tipoServicio === t.value
                        ? "border-violet-500/50 bg-violet-500/10 text-violet-500"
                        : "border-input bg-background text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <div className="font-medium">{t.label}</div>
                    <div className="text-xs">{t.precio}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Discount */}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Descuento (%)</label>
              <input
                type="number"
                min={0}
                max={50}
                value={descuento}
                onChange={(e) => setDescuento(Number(e.target.value))}
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground transition-all"
              />
            </div>

            <button
              onClick={handleCreate}
              disabled={!selectedNegocio || creating}
              className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-violet-500/20 hover:brightness-110 transition-all disabled:opacity-50"
            >
              {creating ? "Creando…" : "Crear Propuesta"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
