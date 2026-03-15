"use client";

import { useEffect, useState } from "react";
import {
  getAutomatizaciones,
  createAutomatizacion,
  updateAutomatizacion,
  deleteAutomatizacion,
  type Automatizacion,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/toast";
import {
  Zap,
  Plus,
  X,
  Trash2,
  Power,
  PowerOff,
  Bell,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

const TRIGGERS = [
  { key: "CAMBIO_ESTADO", label: "Cambio de estado CRM" },
  { key: "NUEVO_LEAD", label: "Nuevo lead creado" },
  { key: "SCORE_MAYOR", label: "Score supera umbral" },
  { key: "SCORE_MENOR", label: "Score bajo umbral" },
] as const;

const ACCIONES = [
  { key: "CREAR_NOTIFICACION", label: "Crear notificación" },
  { key: "CAMBIAR_ESTADO", label: "Cambiar estado CRM" },
] as const;

const CRM_STATES = [
  "NO_CONTACTADO",
  "CONTACTADO",
  "PROPUESTA_ENVIADA",
  "NEGOCIANDO",
  "CERRADO_GANADO",
  "CERRADO_PERDIDO",
  "CERRADO_NO_EXISTE",
];

export default function AutomatizacionesPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Automatizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [nombre, setNombre] = useState("");
  const [trigger, setTrigger] = useState("CAMBIO_ESTADO");
  const [accion, setAccion] = useState("CREAR_NOTIFICACION");
  const [estadoAnterior, setEstadoAnterior] = useState("");
  const [estadoNuevo, setEstadoNuevo] = useState("");
  const [scoreUmbral, setScoreUmbral] = useState(70);
  const [notifTitulo, setNotifTitulo] = useState("");
  const [notifMensaje, setNotifMensaje] = useState("");
  const [nuevoEstado, setNuevoEstado] = useState("CONTACTADO");
  const [creating, setCreating] = useState(false);

  const fetchData = () => {
    getAutomatizaciones()
      .then(setItems)
      .catch(() => toast("Error al cargar automatizaciones", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const resetForm = () => {
    setNombre("");
    setTrigger("CAMBIO_ESTADO");
    setAccion("CREAR_NOTIFICACION");
    setEstadoAnterior("");
    setEstadoNuevo("");
    setScoreUmbral(70);
    setNotifTitulo("");
    setNotifMensaje("");
    setNuevoEstado("CONTACTADO");
  };

  const handleCreate = async () => {
    if (!nombre.trim()) return;
    setCreating(true);
    try {
      const condicion: Record<string, unknown> = {};
      if (trigger === "CAMBIO_ESTADO") {
        if (estadoAnterior) condicion.estadoContactoAnterior = estadoAnterior;
        if (estadoNuevo) condicion.estadoContactoNuevo = estadoNuevo;
      }
      if (trigger === "SCORE_MAYOR" || trigger === "SCORE_MENOR") {
        condicion.scoreUmbral = scoreUmbral;
      }

      const accionConfig: Record<string, unknown> = {};
      if (accion === "CREAR_NOTIFICACION") {
        accionConfig.titulo = notifTitulo || "Automatización: {nombre}";
        accionConfig.mensaje = notifMensaje || "Lead {nombre} de {comuna}";
      }
      if (accion === "CAMBIAR_ESTADO") {
        accionConfig.nuevoEstado = nuevoEstado;
      }

      await createAutomatizacion({ nombre, trigger, condicion, accion, accionConfig });
      toast("Automatización creada", "success");
      resetForm();
      setShowForm(false);
      fetchData();
    } catch {
      toast("Error al crear automatización", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (item: Automatizacion) => {
    try {
      await updateAutomatizacion(item.id, { activa: !item.activa });
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, activa: !i.activa } : i)));
      toast(item.activa ? "Desactivada" : "Activada", "success");
    } catch {
      toast("Error al actualizar", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAutomatizacion(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast("Eliminada", "success");
    } catch {
      toast("Error al eliminar", "error");
    }
  };

  const parseSafe = (json: string) => {
    try { return JSON.parse(json); } catch { return {}; }
  };

  const triggerLabel = (key: string) => TRIGGERS.find((t) => t.key === key)?.label ?? key;
  const accionLabel = (key: string) => ACCIONES.find((a) => a.key === key)?.label ?? key;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Automatizaciones</h1>
          <p className="text-sm text-muted-foreground">Reglas automáticas para gestión de leads</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancelar" : "Nueva Regla"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Nueva Automatización</h3>

          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Nombre</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Notificar cuando lead pasa a Contactado"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Trigger (Cuándo)</label>
              <select
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
              >
                {TRIGGERS.map((t) => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Acción (Qué hacer)</label>
              <select
                value={accion}
                onChange={(e) => setAccion(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
              >
                {ACCIONES.map((a) => (
                  <option key={a.key} value={a.key}>{a.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Trigger-specific conditions */}
          {trigger === "CAMBIO_ESTADO" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Estado anterior (opcional)</label>
                <select
                  value={estadoAnterior}
                  onChange={(e) => setEstadoAnterior(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="">Cualquiera</option>
                  {CRM_STATES.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Estado nuevo (opcional)</label>
                <select
                  value={estadoNuevo}
                  onChange={(e) => setEstadoNuevo(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="">Cualquiera</option>
                  {CRM_STATES.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {(trigger === "SCORE_MAYOR" || trigger === "SCORE_MENOR") && (
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Umbral de score</label>
              <input
                type="number"
                min={0}
                max={100}
                value={scoreUmbral}
                onChange={(e) => setScoreUmbral(Number(e.target.value))}
                className="w-40 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
          )}

          {/* Action-specific config */}
          {accion === "CREAR_NOTIFICACION" && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Título notificación</label>
                <input
                  value={notifTitulo}
                  onChange={(e) => setNotifTitulo(e.target.value)}
                  placeholder="Ej: Lead {nombre} cambió de estado"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Mensaje</label>
                <textarea
                  value={notifMensaje}
                  onChange={(e) => setNotifMensaje(e.target.value)}
                  placeholder="Ej: {nombre} de {comuna} ({rubro}) - Score: {score}"
                  rows={2}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
              <p className="text-xs text-muted-foreground">Variables: {"{nombre}"}, {"{rubro}"}, {"{comuna}"}, {"{score}"}</p>
            </div>
          )}

          {accion === "CAMBIAR_ESTADO" && (
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Nuevo estado</label>
              <select
                value={nuevoEstado}
                onChange={(e) => setNuevoEstado(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
              >
                {CRM_STATES.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={creating || !nombre.trim()}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Zap className="h-4 w-4" />
            {creating ? "Creando..." : "Crear Automatización"}
          </button>
        </div>
      )}

      {/* List */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Zap className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">No hay automatizaciones configuradas</p>
          <p className="text-xs text-muted-foreground">Crea tu primera regla para automatizar tu flujo de trabajo</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const cond = parseSafe(item.condicion);
            const config = parseSafe(item.accionConfig);
            return (
              <div
                key={item.id}
                className={cn(
                  "rounded-xl border bg-card p-4 transition-colors",
                  item.activa ? "border-border" : "border-border/50 opacity-60"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className={cn("rounded-lg p-1.5", item.activa ? "bg-green-500/10" : "bg-muted")}>
                        <Zap className={cn("h-4 w-4", item.activa ? "text-green-400" : "text-muted-foreground")} />
                      </div>
                      <h3 className="font-medium text-foreground">{item.nombre}</h3>
                      {!item.activa && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Inactiva</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-md bg-blue-500/10 px-2 py-1 text-blue-400">
                        <RefreshCw className="mr-1 inline h-3 w-3" />
                        {triggerLabel(item.trigger)}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="rounded-md bg-purple-500/10 px-2 py-1 text-purple-400">
                        <Bell className="mr-1 inline h-3 w-3" />
                        {accionLabel(item.accion)}
                      </span>
                    </div>
                    {/* Condition details */}
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {cond.estadoContactoAnterior && (
                        <span>De: {cond.estadoContactoAnterior.replace(/_/g, " ")}</span>
                      )}
                      {cond.estadoContactoNuevo && (
                        <span>A: {cond.estadoContactoNuevo.replace(/_/g, " ")}</span>
                      )}
                      {cond.scoreUmbral !== undefined && (
                        <span>Umbral: {cond.scoreUmbral}</span>
                      )}
                      {config.titulo && (
                        <span>Título: &quot;{config.titulo}&quot;</span>
                      )}
                      {config.nuevoEstado && (
                        <span>→ {config.nuevoEstado.replace(/_/g, " ")}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggle(item)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                      title={item.activa ? "Desactivar" : "Activar"}
                    >
                      {item.activa ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
