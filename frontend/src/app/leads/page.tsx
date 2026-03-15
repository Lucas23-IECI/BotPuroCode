"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  getNegocios,
  triggerBatchAnalisis,
  deleteNegocio,
  type Negocio,
  type PaginatedResponse,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { ScoreTooltip } from "@/components/score-explainer";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  ExternalLink,
  ArrowUpDown,
  MessageCircle,
  Phone,
  Trash2,
} from "lucide-react";

const RUBROS = [
  "", "barbería", "peluquería", "salón de belleza", "veterinaria", "pet shop",
  "taller mecánico", "ferretería", "panadería", "pastelería", "cafetería",
  "restaurante", "florería", "farmacia", "dentista", "lavandería", "gimnasio",
];

const COMUNAS = [
  "", "concepción", "talcahuano", "hualpén", "san pedro de la paz",
  "chiguayante", "coronel", "penco", "tomé", "hualqui", "lota",
];

const ESTADOS_PRESENCIA = [
  "", "PENDIENTE", "SIN_WEB", "SOLO_RRSS", "LINK_EXTERNO",
  "WEB_BASICA", "WEB_MEDIA", "WEB_BUENA",
];

const NIVELES = [
  "", "ALTA", "MEDIA_ALTA", "MEDIA", "BAJA", "NO_PRIORITARIO", "NO_EVALUADO",
];

function PresenciaBadge({ estado }: { estado: string }) {
  const label: Record<string, string> = {
    PENDIENTE: "Pendiente",
    SIN_WEB: "Sin web",
    SOLO_RRSS: "Solo RRSS",
    LINK_EXTERNO: "Link ext.",
    WEB_BASICA: "Web básica",
    WEB_MEDIA: "Web media",
    WEB_BUENA: "Web buena",
  };

  const color: Record<string, string> = {
    SIN_WEB: "bg-green-500/20 text-green-400",
    SOLO_RRSS: "bg-lime-500/20 text-lime-400",
    LINK_EXTERNO: "bg-yellow-500/20 text-yellow-400",
    WEB_BASICA: "bg-orange-500/20 text-orange-400",
    WEB_MEDIA: "bg-red-400/20 text-red-400",
    WEB_BUENA: "bg-red-600/20 text-red-500",
    PENDIENTE: "bg-gray-500/20 text-gray-400",
  };

  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs", color[estado] ?? "bg-gray-500/20 text-gray-400")}>
      {label[estado] ?? estado}
    </span>
  );
}

const CRM_LABELS: Record<string, string> = {
  NO_CONTACTADO: "No Contactado",
  CONTACTADO: "Contactado",
  PROPUESTA_ENVIADA: "Propuesta",
  NEGOCIANDO: "Negociando",
  CERRADO_GANADO: "Ganado",
  CERRADO_PERDIDO: "Perdido",
  CERRADO_NO_EXISTE: "No Existe",
};

const CRM_COLORS: Record<string, string> = {
  NO_CONTACTADO: "bg-gray-500/20 text-gray-400",
  CONTACTADO: "bg-blue-500/20 text-blue-400",
  PROPUESTA_ENVIADA: "bg-purple-500/20 text-purple-400",
  NEGOCIANDO: "bg-yellow-500/20 text-yellow-400",
  CERRADO_GANADO: "bg-green-500/20 text-green-400",
  CERRADO_PERDIDO: "bg-red-500/20 text-red-400",
  CERRADO_NO_EXISTE: "bg-red-700/20 text-red-500",
};

const SCORE_BORDER: Record<string, string> = {
  high: "border-l-green-500",
  mid: "border-l-yellow-500",
  low: "border-l-red-500",
};

function scoreBorder(score: number) {
  if (score >= 70) return SCORE_BORDER.high;
  if (score >= 40) return SCORE_BORDER.mid;
  return SCORE_BORDER.low;
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}m`;
}

export default function LeadsPage() {
  const [data, setData] = useState<PaginatedResponse<Negocio> | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    busqueda: "",
    rubro: "",
    comuna: "",
    estadoPresencia: "",
    nivelOportunidad: "",
    page: 1,
    limit: 20,
    orderBy: "score" as string,
    order: "desc" as "asc" | "desc",
    asignadoAId: "" as string,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {};
      for (const [k, v] of Object.entries(filters)) {
        if (v !== "" && v !== undefined) params[k] = v;
      }
      const result = await getNegocios(params);
      setData(result);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (!data) return;
    if (selected.size === data.data.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data.data.map((n) => n.id)));
    }
  };

  const handleBatchAnalysis = async () => {
    if (selected.size === 0) return;
    await triggerBatchAnalisis([...selected]);
    toast(`Análisis iniciado para ${selected.size} leads`, "info");
    setSelected(new Set());
  };

  const handleBatchDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`¿Eliminar ${selected.size} negocio(s)? Esta acción no se puede deshacer.`)) return;
    const ids = [...selected];
    for (const nid of ids) {
      await deleteNegocio(nid);
    }
    toast(`${ids.length} negocio(s) eliminados`, "info");
    setSelected(new Set());
    fetchData();
  };

  const toggleSort = (col: string) => {
    setFilters((f) => ({
      ...f,
      orderBy: col,
      order: f.orderBy === col && f.order === "desc" ? "asc" : "desc",
      page: 1,
    }));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground">
            {data?.pagination.total ?? 0} negocios encontrados
          </p>
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchAnalysis}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <PlayCircle className="h-4 w-4" />
              Analizar {selected.size}
            </button>
            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-2 rounded-lg border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar {selected.size}
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={filters.busqueda}
            onChange={(e) => setFilters((f) => ({ ...f, busqueda: e.target.value, page: 1 }))}
            className="rounded-lg border border-input bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <select
          value={filters.rubro}
          onChange={(e) => setFilters((f) => ({ ...f, rubro: e.target.value, page: 1 }))}
          className="rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="">Todos los rubros</option>
          {RUBROS.filter(Boolean).map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <select
          value={filters.comuna}
          onChange={(e) => setFilters((f) => ({ ...f, comuna: e.target.value, page: 1 }))}
          className="rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="">Todas las comunas</option>
          {COMUNAS.filter(Boolean).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={filters.estadoPresencia}
          onChange={(e) => setFilters((f) => ({ ...f, estadoPresencia: e.target.value, page: 1 }))}
          className="rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="">Toda presencia</option>
          {ESTADOS_PRESENCIA.filter(Boolean).map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>

        <select
          value={filters.nivelOportunidad}
          onChange={(e) => setFilters((f) => ({ ...f, nivelOportunidad: e.target.value, page: 1 }))}
          className="rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="">Todo nivel</option>
          {NIVELES.filter(Boolean).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        <button
          onClick={() => {
            const stored = localStorage.getItem("botpurocode_user");
            const userId = stored ? JSON.parse(stored)?.id : "";
            setFilters((f) => ({
              ...f,
              asignadoAId: f.asignadoAId ? "" : userId,
              page: 1,
            }));
          }}
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            filters.asignadoAId
              ? "bg-primary text-primary-foreground"
              : "border border-input bg-card text-muted-foreground hover:bg-muted"
          )}
        >
          {filters.asignadoAId ? "Mis leads" : "Todos"}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-3 py-3 text-left">
                <input
                  type="checkbox"
                  checked={data ? selected.size === data.data.length && data.data.length > 0 : false}
                  onChange={selectAll}
                  className="rounded"
                />
              </th>
              <th className="px-3 py-3 text-left">
                <button onClick={() => toggleSort("nombre")} className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                  Nombre <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-3 py-3 text-left font-medium text-muted-foreground">Rubro</th>
              <th className="px-3 py-3 text-left font-medium text-muted-foreground">Comuna</th>
              <th className="px-3 py-3 text-left font-medium text-muted-foreground">Presencia</th>
              <th className="px-3 py-3 text-center">
                <button onClick={() => toggleSort("score")} className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground mx-auto">
                  Score <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-3 py-3 text-left font-medium text-muted-foreground">CRM</th>
              <th className="px-3 py-3 text-center font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-muted-foreground">
                  <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
                </td>
              </tr>
            ) : data?.data.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-muted-foreground">
                  No hay negocios que coincidan con los filtros
                </td>
              </tr>
            ) : (
              data?.data.map((n, idx) => (
                <tr
                  key={n.id}
                  className={cn(
                    "group border-b border-border border-l-4 transition-colors hover:bg-muted/30",
                    scoreBorder(n.score),
                    idx % 2 === 1 && "bg-muted/10"
                  )}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(n.id)}
                      onChange={() => toggleSelect(n.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                        {initials(n.nombre)}
                      </div>
                      <div>
                        <Link
                          href={`/leads/${n.id}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          {n.nombre}
                        </Link>
                        <p className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="rounded-md bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">{n.rubro}</span>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{n.comuna}</td>
                  <td className="px-3 py-3">
                    <PresenciaBadge estado={n.estadoPresencia} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <ScoreTooltip
                      score={n.score}
                      nivel={n.nivelOportunidad}
                      razones={n.razonesScore}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-xs",
                      CRM_COLORS[n.estadoContacto] ?? "bg-gray-500/20 text-gray-400"
                    )}>
                      {CRM_LABELS[n.estadoContacto] ?? n.estadoContacto}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {(n.whatsapp || n.telefono) && (
                        <a
                          href={`https://wa.me/${(n.whatsapp || n.telefono || "").replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded p-1 text-green-400 opacity-0 hover:bg-green-500/10 group-hover:opacity-100"
                          title="WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      )}
                      {n.telefono && (
                        <a
                          href={`tel:${n.telefono}`}
                          className="rounded p-1 text-blue-400 opacity-0 hover:bg-blue-500/10 group-hover:opacity-100"
                          title="Llamar"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                      {n.sitioWeb && (
                        <a
                          href={n.sitioWeb}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded p-1 text-muted-foreground hover:text-foreground"
                          title="Ver web"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {data.pagination.page} de {data.pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={data.pagination.page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              className="rounded-lg border border-input bg-card p-2 text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              disabled={data.pagination.page >= data.pagination.totalPages}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              className="rounded-lg border border-input bg-card p-2 text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
