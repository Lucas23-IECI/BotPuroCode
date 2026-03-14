"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getPlantillas,
  createPlantilla,
  updatePlantilla,
  deletePlantilla,
  seedPlantillas,
  type Plantilla,
} from "@/lib/api";
import {
  MessageCircle,
  Mail,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Sparkles,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TipoFilter = "TODOS" | "WHATSAPP" | "EMAIL";

const CATEGORIAS = [
  { value: "primer_contacto", label: "Primer contacto" },
  { value: "seguimiento", label: "Seguimiento" },
  { value: "propuesta", label: "Propuesta" },
  { value: "recordatorio", label: "Recordatorio" },
  { value: "otro", label: "Otro" },
];

const VARIABLES = [
  { var: "{nombre}", desc: "Nombre del negocio" },
  { var: "{rubro}", desc: "Rubro" },
  { var: "{comuna}", desc: "Comuna" },
  { var: "{ciudad}", desc: "Ciudad" },
  { var: "{problema}", desc: "Problema detectado" },
  { var: "{seguidores}", desc: "Seguidores IG" },
  { var: "{rating}", desc: "Rating Google" },
  { var: "{url}", desc: "Sitio web" },
  { var: "{instagram}", desc: "Instagram" },
];

export default function PlantillasPage() {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>("TODOS");
  const [editing, setEditing] = useState<Plantilla | null>(null);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [formNombre, setFormNombre] = useState("");
  const [formTipo, setFormTipo] = useState<"WHATSAPP" | "EMAIL">("WHATSAPP");
  const [formAsunto, setFormAsunto] = useState("");
  const [formCuerpo, setFormCuerpo] = useState("");
  const [formCategoria, setFormCategoria] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (tipoFilter !== "TODOS") params.tipo = tipoFilter;
      const data = await getPlantillas(params);
      setPlantillas(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [tipoFilter]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setCreating(true);
    setFormNombre("");
    setFormTipo("WHATSAPP");
    setFormAsunto("");
    setFormCuerpo("");
    setFormCategoria("");
  }

  function openEdit(p: Plantilla) {
    setCreating(false);
    setEditing(p);
    setFormNombre(p.nombre);
    setFormTipo(p.tipo);
    setFormAsunto(p.asunto ?? "");
    setFormCuerpo(p.cuerpo);
    setFormCategoria(p.categoria ?? "");
  }

  function closeForm() {
    setEditing(null);
    setCreating(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      nombre: formNombre,
      tipo: formTipo,
      asunto: formTipo === "EMAIL" ? formAsunto : undefined,
      cuerpo: formCuerpo,
      categoria: formCategoria || undefined,
    };

    if (editing) {
      await updatePlantilla(editing.id, data);
    } else {
      await createPlantilla(data);
    }
    closeForm();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta plantilla?")) return;
    await deletePlantilla(id);
    load();
  }

  async function handleSeed() {
    try {
      await seedPlantillas();
      load();
    } catch {
      alert("Ya existen plantillas o hubo un error");
    }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  function insertVariable(v: string) {
    setFormCuerpo((prev) => prev + v);
  }

  const filtered = plantillas;
  const whatsappCount = plantillas.filter((p) => p.tipo === "WHATSAPP").length;
  const emailCount = plantillas.filter((p) => p.tipo === "EMAIL").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Plantillas</h1>
          <p className="text-sm text-muted-foreground">Mensajes predefinidos para WhatsApp y Email</p>
        </div>
        <div className="flex gap-2">
          {plantillas.length === 0 && !loading && (
            <button onClick={handleSeed} className="flex items-center gap-2 rounded-lg bg-yellow-500/20 px-4 py-2 text-sm font-medium text-yellow-400 hover:bg-yellow-500/30">
              <Sparkles className="h-4 w-4" /> Cargar por defecto
            </button>
          )}
          <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Nueva plantilla
          </button>
        </div>
      </div>

      {/* Type filter */}
      <div className="flex gap-2">
        {(["TODOS", "WHATSAPP", "EMAIL"] as TipoFilter[]).map((t) => (
          <button
            key={t}
            onClick={() => setTipoFilter(t)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              tipoFilter === t
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            {t === "WHATSAPP" && <MessageCircle className="h-3.5 w-3.5" />}
            {t === "EMAIL" && <Mail className="h-3.5 w-3.5" />}
            {t === "TODOS" ? `Todas (${plantillas.length})` : t === "WHATSAPP" ? `WhatsApp (${whatsappCount})` : `Email (${emailCount})`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Plantillas list */}
        <div className="space-y-3">
          {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}
          {filtered.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {p.tipo === "WHATSAPP" ? (
                    <MessageCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <Mail className="h-4 w-4 text-blue-400" />
                  )}
                  <h3 className="text-sm font-semibold text-foreground">{p.nombre}</h3>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => copyToClipboard(p.cuerpo, p.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" title="Copiar">
                    {copiedId === p.id ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" title="Editar">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-400" title="Eliminar">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {p.categoria && (
                <span className="mb-2 inline-block rounded-full bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
                  {CATEGORIAS.find((c) => c.value === p.categoria)?.label ?? p.categoria}
                </span>
              )}
              {p.tipo === "EMAIL" && p.asunto && (
                <p className="mb-1 text-xs text-muted-foreground">Asunto: {p.asunto}</p>
              )}
              <p className="whitespace-pre-wrap text-sm text-muted-foreground line-clamp-4">{p.cuerpo}</p>
            </div>
          ))}
          {!loading && filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No hay plantillas todavía</p>
          )}
        </div>

        {/* Editor panel */}
        {(creating || editing) && (
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {editing ? "Editar plantilla" : "Nueva plantilla"}
              </h2>
              <button onClick={closeForm} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Nombre</label>
                <input
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                  placeholder="WhatsApp - Primer contacto"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Tipo</label>
                  <select
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value as "WHATSAPP" | "EMAIL")}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="EMAIL">Email</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Categoría</label>
                  <select
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="">Sin categoría</option>
                    {CATEGORIAS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formTipo === "EMAIL" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Asunto</label>
                  <input
                    value={formAsunto}
                    onChange={(e) => setFormAsunto(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                    placeholder="Propuesta web para {nombre}"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Cuerpo del mensaje</label>
                <textarea
                  value={formCuerpo}
                  onChange={(e) => setFormCuerpo(e.target.value)}
                  required
                  rows={8}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                  placeholder="Hola! 👋 Soy Lucas de PuroCode..."
                />
              </div>

              {/* Variables */}
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Variables disponibles (clic para insertar)</p>
                <div className="flex flex-wrap gap-1.5">
                  {VARIABLES.map((v) => (
                    <button
                      key={v.var}
                      type="button"
                      onClick={() => insertVariable(v.var)}
                      className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                      title={v.desc}
                    >
                      {v.var}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button type="submit" className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  {editing ? "Guardar cambios" : "Crear plantilla"}
                </button>
                <button type="button" onClick={closeForm} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
