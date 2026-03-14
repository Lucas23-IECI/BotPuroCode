"use client";

import { useState, useRef } from "react";
import { createNegocio } from "@/lib/api";
import { useToast } from "@/components/toast";
import { Upload, Plus, FileDown } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const RUBROS = [
  "barbería", "peluquería", "salón de belleza", "veterinaria", "pet shop",
  "taller mecánico", "ferretería", "panadería", "pastelería", "cafetería",
  "restaurante", "florería", "farmacia", "dentista", "lavandería", "gimnasio",
  "óptica", "imprenta", "cerrajería", "zapatería", "joyería", "librería",
  "minimarket", "carnicería", "verdulería", "almacén", "bazar", "otro",
];

const COMUNAS = [
  "concepción", "talcahuano", "hualpén", "san pedro de la paz",
  "chiguayante", "coronel", "penco", "tomé", "hualqui", "lota",
];

export default function IngestaPage() {
  const [tab, setTab] = useState<"manual" | "csv">("manual");
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    rubro: RUBROS[0],
    comuna: COMUNAS[0],
    direccion: "",
    telefono: "",
    email: "",
    sitioWeb: "",
    instagram: "",
    facebook: "",
    linkExterno: "",
    fuente: "manual",
  });

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) { toast("El nombre es obligatorio", "error"); return; }
    setCreating(true);
    try {
      await createNegocio(form);
      toast(`"${form.nombre}" creado exitosamente`, "success");
      setForm((f) => ({ ...f, nombre: "", direccion: "", telefono: "", email: "", sitioWeb: "", instagram: "", facebook: "", linkExterno: "" }));
    } catch {
      toast("Error al crear el negocio", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleCSVUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { toast("Selecciona un archivo CSV", "error"); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/negocios/csv`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al importar");
      toast(`Importados: ${data.creados}, Duplicados: ${data.duplicados}, Errores: ${data.errores}`, "success");
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error al importar CSV", "error");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const header = "nombre,rubro,comuna,direccion,telefono,email,sitioWeb,instagram,facebook";
    const example = "Barbería Don Pedro,barbería,concepción,Av. Principal 100,+56912345678,info@donpedro.cl,,@donpedro,";
    const blob = new Blob([header + "\n" + example + "\n"], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_negocios.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ingesta de Datos</h1>
        <p className="text-sm text-muted-foreground">
          Agrega negocios manualmente o importa desde un archivo CSV
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
        <button
          onClick={() => setTab("manual")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${tab === "manual" ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Plus className="mr-1.5 inline h-4 w-4" /> Manual
        </button>
        <button
          onClick={() => setTab("csv")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${tab === "csv" ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Upload className="mr-1.5 inline h-4 w-4" /> CSV
        </button>
      </div>

      {/* Manual Form */}
      {tab === "manual" && (
        <form onSubmit={handleManualSubmit} className="rounded-xl border border-border bg-card p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-foreground">Nombre *</label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                placeholder="Nombre del negocio"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Rubro</label>
              <select
                value={form.rubro}
                onChange={(e) => setForm((f) => ({ ...f, rubro: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
              >
                {RUBROS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Comuna</label>
              <select
                value={form.comuna}
                onChange={(e) => setForm((f) => ({ ...f, comuna: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
              >
                {COMUNAS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Dirección</label>
              <input
                type="text"
                value={form.direccion}
                onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                placeholder="Av. Principal 123"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Teléfono</label>
              <input
                type="text"
                value={form.telefono}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                placeholder="+56 9 1234 5678"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                placeholder="contacto@negocio.cl"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Sitio Web</label>
              <input
                type="url"
                value={form.sitioWeb}
                onChange={(e) => setForm((f) => ({ ...f, sitioWeb: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Instagram</label>
              <input
                type="text"
                value={form.instagram}
                onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                placeholder="@usuario"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Facebook</label>
              <input
                type="url"
                value={form.facebook}
                onChange={(e) => setForm((f) => ({ ...f, facebook: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                placeholder="https://facebook.com/..."
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Link externo</label>
              <input
                type="url"
                value={form.linkExterno}
                onChange={(e) => setForm((f) => ({ ...f, linkExterno: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                placeholder="AgendaPro, Linktree, etc."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="mt-6 flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {creating ? "Creando…" : "Crear Negocio"}
          </button>
        </form>
      )}

      {/* CSV Upload */}
      {tab === "csv" && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-foreground">Importar desde CSV</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                El archivo debe incluir columnas: <b>nombre</b>, <b>rubro</b>, <b>comuna</b>. Opcionalmente: dirección, teléfono, email, sitioWeb, instagram, facebook.
              </p>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
            >
              <FileDown className="h-4 w-4" />
              Descargar plantilla
            </button>
          </div>

          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-foreground">Archivo CSV</label>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.txt"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:text-sm file:text-primary-foreground"
              />
            </div>
            <button
              onClick={handleCSVUpload}
              disabled={uploading}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {uploading ? "Importando…" : "Importar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
