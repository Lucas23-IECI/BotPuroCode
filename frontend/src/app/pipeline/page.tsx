"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getPipeline,
  getSeguimientos,
  updateEstadoContacto,
  getPlantillas,
  renderPlantilla,
  type Negocio,
  type Seguimiento,
  type Plantilla,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { ScoreTooltip } from "@/components/score-explainer";
import { Calendar, GripVertical, Phone, MessageCircle, MapPin, Copy, X } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface PipelineData {
  [estado: string]: Negocio[];
}

const COLUMNS = [
  { key: "NO_CONTACTADO", label: "No Contactado", color: "border-t-gray-500", bg: "bg-gray-500", tint: "bg-gray-500/5" },
  { key: "CONTACTADO", label: "Contactado", color: "border-t-blue-500", bg: "bg-blue-500", tint: "bg-blue-500/5" },
  { key: "PROPUESTA_ENVIADA", label: "Propuesta", color: "border-t-purple-500", bg: "bg-purple-500", tint: "bg-purple-500/5" },
  { key: "NEGOCIANDO", label: "Negociando", color: "border-t-yellow-500", bg: "bg-yellow-500", tint: "bg-yellow-500/5" },
  { key: "CERRADO_GANADO", label: "Ganado", color: "border-t-green-500", bg: "bg-green-500", tint: "bg-green-500/5" },
  { key: "CERRADO_PERDIDO", label: "Perdido", color: "border-t-red-500", bg: "bg-red-500", tint: "bg-red-500/5" },
];

function timeAgo(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days}d`;
  const months = Math.floor(days / 30);
  return `hace ${months}m`;
}

/* ─── Draggable Card ─────────────────────────────────────── */

function KanbanCard({ negocio, isDragOverlay, onQuickWa }: { negocio: Negocio; isDragOverlay?: boolean; onQuickWa?: (n: Negocio) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: negocio.id, data: { negocio } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const contactAge = timeAgo(negocio.fechaUltimoContacto);
  const whatsappLink = negocio.whatsapp
    ? `https://wa.me/${negocio.whatsapp.replace(/\D/g, "")}`
    : negocio.telefono
    ? `https://wa.me/${negocio.telefono.replace(/\D/g, "")}`
    : null;

  const content = (
    <div className={cn(
      "group rounded-xl border border-border bg-card p-3 transition-all hover:shadow-md",
      isDragging && "opacity-40",
      isDragOverlay && "shadow-2xl ring-2 ring-primary/50"
    )}>
      <div className="flex items-start gap-2">
        <button
          className="mt-0.5 cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <Link href={`/leads/${negocio.id}`} className="block text-sm font-medium text-foreground hover:underline truncate">
            {negocio.nombre}
          </Link>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground truncate">
            <MapPin className="h-3 w-3 shrink-0" />
            {negocio.rubro} · {negocio.comuna}
          </p>
        </div>
        {/* Presencia badge */}
        <span className={cn(
          "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
          negocio.estadoPresencia === "SIN_WEB" ? "bg-emerald-500/10 text-emerald-500" :
          negocio.estadoPresencia === "SOLO_RRSS" ? "bg-lime-500/10 text-lime-500" :
          "bg-muted text-muted-foreground"
        )}>
          {negocio.estadoPresencia === "SIN_WEB" ? "Sin web" :
           negocio.estadoPresencia === "SOLO_RRSS" ? "RRSS" :
           negocio.estadoPresencia?.replace(/_/g, " ").toLowerCase()}
        </span>
      </div>

      {/* Score bar */}
      <div className="mt-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/50">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              negocio.score >= 80 ? "bg-emerald-500" :
              negocio.score >= 60 ? "bg-lime-500" :
              negocio.score >= 40 ? "bg-amber-500" : "bg-rose-500"
            )}
            style={{ width: `${negocio.score}%` }}
          />
        </div>
        <ScoreTooltip
          score={negocio.score}
          nivel={negocio.nivelOportunidad}
          razones={negocio.razonesScore}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded p-1 text-green-400 hover:bg-green-500/10"
              title="WhatsApp directo"
              onClick={(e) => e.stopPropagation()}
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </a>
          )}
          {whatsappLink && onQuickWa && (
            <button
              onClick={(e) => { e.stopPropagation(); onQuickWa(negocio); }}
              className="rounded p-1 text-emerald-300 hover:bg-emerald-500/10"
              title="WhatsApp con plantilla"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          )}
          {negocio.telefono && (
            <a
              href={`tel:${negocio.telefono}`}
              className="rounded p-1 text-blue-400 hover:bg-blue-500/10"
              title="Llamar"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {contactAge && (
          <p className="text-[10px] text-muted-foreground">
            {contactAge}
          </p>
        )}
      </div>

      {/* Next follow-up */}
      {negocio.proximoSeguimiento && (
        <div className="mt-1.5 flex items-center gap-1 rounded-md bg-yellow-500/10 px-2 py-1 text-[10px] text-yellow-500">
          <Calendar className="h-3 w-3" />
          {new Date(negocio.proximoSeguimiento).toLocaleDateString("es-CL")}
        </div>
      )}
    </div>
  );

  if (isDragOverlay) return content;

  return (
    <div ref={setNodeRef} style={style}>
      {content}
    </div>
  );
}

/* ─── Droppable Column ────────────────────────────────────── */

function KanbanColumn({
  col,
  items,
  onQuickWa,
}: {
  col: (typeof COLUMNS)[number];
  items: Negocio[];
  onQuickWa: (n: Negocio) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-w-[260px] flex-1 rounded-xl border border-border border-t-4 transition-colors",
        col.color,
        isOver ? "bg-primary/5 ring-2 ring-primary/30" : col.tint
      )}
    >
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full", col.bg)} />
          <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {items.length}
        </span>
      </div>

      <div className="space-y-2 p-2 min-h-[80px]">
        {items.length === 0 ? (
          <p className={cn(
            "py-8 text-center text-xs transition-colors",
            isOver ? "text-primary" : "text-muted-foreground"
          )}>
            {isOver ? "Soltar aquí" : "Sin leads"}
          </p>
        ) : (
          items.map((n) => <KanbanCard key={n.id} negocio={n} onQuickWa={onQuickWa} />)
        )}
      </div>
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────── */

export default function PipelinePage() {
  const [pipeline, setPipeline] = useState<PipelineData>({});
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNegocio, setActiveNegocio] = useState<Negocio | null>(null);
  const { toast } = useToast();

  // Quick WhatsApp modal state
  const [waModalNegocio, setWaModalNegocio] = useState<Negocio | null>(null);
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [selectedPlantilla, setSelectedPlantilla] = useState<string>("");
  const [renderedMsg, setRenderedMsg] = useState("");
  const [rendering, setRendering] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchAll = async () => {
    try {
      const [p, s] = await Promise.all([getPipeline(), getSeguimientos()]);
      setPipeline(p);
      setSeguimientos(s);
    } catch {
      toast("Error al cargar el pipeline", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    getPlantillas({ tipo: "WHATSAPP" }).then(setPlantillas).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const negocio = event.active.data.current?.negocio as Negocio | undefined;
    setActiveNegocio(negocio ?? null);
  };

  const openWaModal = (neg: Negocio) => {
    setWaModalNegocio(neg);
    setRenderedMsg("");
    setSelectedPlantilla("");
  };

  const handleRenderTemplate = async () => {
    if (!selectedPlantilla || !waModalNegocio) return;
    setRendering(true);
    try {
      const result = await renderPlantilla(selectedPlantilla, waModalNegocio.id);
      setRenderedMsg(result.cuerpo);
    } catch {
      toast("Error al renderizar plantilla", "error");
    } finally {
      setRendering(false);
    }
  };

  const handleCopyAndOpen = () => {
    if (!waModalNegocio) return;
    navigator.clipboard.writeText(renderedMsg);
    const phone = (waModalNegocio.whatsapp || waModalNegocio.telefono || "").replace(/\D/g, "");
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(renderedMsg)}`, "_blank");
    }
    toast("Mensaje copiado y WhatsApp abierto", "success");
    setWaModalNegocio(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveNegocio(null);
    const { active, over } = event;
    if (!over) return;

    const negocio = active.data.current?.negocio as Negocio | undefined;
    if (!negocio) return;

    // Find which column the card is currently in
    const currentCol = Object.keys(pipeline).find((key) =>
      pipeline[key]?.some((n) => n.id === negocio.id)
    );

    // Determine target column — over.id may be a column key OR a card id
    let targetCol = COLUMNS.find((c) => c.key === over.id)?.key;
    if (!targetCol) {
      // over.id is a card — find which column contains it
      targetCol = Object.keys(pipeline).find((key) =>
        pipeline[key]?.some((n) => n.id === over.id)
      );
    }

    if (!targetCol || targetCol === currentCol) return;

    // Optimistic update
    setPipeline((prev) => {
      const next = { ...prev };
      if (currentCol) {
        next[currentCol] = (next[currentCol] ?? []).filter((n) => n.id !== negocio.id);
      }
      next[targetCol] = [...(next[targetCol] ?? []), { ...negocio, estadoContacto: targetCol }];
      return next;
    });

    try {
      await updateEstadoContacto(negocio.id, targetCol);
      const colLabel = COLUMNS.find((c) => c.key === targetCol)?.label ?? targetCol;
      toast(`${negocio.nombre} → ${colLabel}`, "success");
    } catch {
      toast("Error al mover lead", "error");
      fetchAll(); // Revert
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pipeline CRM</h1>
        <p className="text-sm text-muted-foreground">
          Arrastra los leads entre columnas para actualizar su estado
        </p>
      </div>

      {/* Seguimientos pendientes */}
      {seguimientos.length > 0 && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-yellow-400">
            <Calendar className="h-4 w-4" />
            Seguimientos pendientes ({seguimientos.length})
          </h3>
          <div className="space-y-2">
            {seguimientos.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-card/50 px-3 py-2 text-sm">
                <div>
                  <Link href={`/leads/${s.id}`} className="font-medium text-foreground hover:underline">
                    {s.nombre}
                  </Link>
                  <span className="ml-2 text-muted-foreground">{s.rubro}</span>
                </div>
                <span className="text-xs text-yellow-400">
                  {s.proximoSeguimiento ? new Date(s.proximoSeguimiento).toLocaleDateString("es-CL") : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kanban Board with D&D */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.key}
              col={col}
              items={pipeline[col.key] ?? []}
              onQuickWa={openWaModal}
            />
          ))}
        </div>

        <DragOverlay>
          {activeNegocio ? (
            <div className="w-[260px]">
              <KanbanCard negocio={activeNegocio} isDragOverlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Quick WhatsApp Modal */}
      {waModalNegocio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                WhatsApp — {waModalNegocio.nombre}
              </h2>
              <button onClick={() => setWaModalNegocio(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Plantilla</label>
              <select
                value={selectedPlantilla}
                onChange={(e) => { setSelectedPlantilla(e.target.value); setRenderedMsg(""); }}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="">Seleccionar plantilla…</option>
                {plantillas.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>

            {selectedPlantilla && !renderedMsg && (
              <button
                onClick={handleRenderTemplate}
                disabled={rendering}
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {rendering ? "Generando…" : "Generar mensaje"}
              </button>
            )}

            {renderedMsg && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Mensaje</label>
                  <textarea
                    value={renderedMsg}
                    onChange={(e) => setRenderedMsg(e.target.value)}
                    rows={5}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <button
                  onClick={handleCopyAndOpen}
                  className="w-full rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-green-500/20 hover:scale-[1.02] transition-transform"
                >
                  <MessageCircle className="mr-2 inline h-4 w-4" />
                  Copiar y abrir WhatsApp
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
