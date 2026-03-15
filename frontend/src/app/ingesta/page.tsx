"use client";

import { useState, useRef, useCallback } from "react";
import { createNegocio } from "@/lib/api";
import { useToast } from "@/components/toast";
import {
  Upload, Plus, FileDown, ChevronRight, ChevronLeft, Check, FileSpreadsheet, Eye,
  AlertTriangle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

/* ─── CSV Wizard types ───────────────────────────────── */
type WizardStep = "upload" | "preview" | "importing" | "done";
interface CSVRow {
  [key: string]: string;
}
interface ImportResult {
  creados: number;
  duplicados: number;
  errores: number;
}

/* ─── Step indicator ─────────────────────────────────── */
function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
            i < current
              ? "bg-green-500 text-white"
              : i === current
                ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow"
                : "bg-muted text-muted-foreground"
          )}>
            {i < current ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </div>
          <span className={cn(
            "hidden text-sm font-medium sm:inline",
            i === current ? "text-foreground" : "text-muted-foreground"
          )}>
            {label}
          </span>
          {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground/50" />}
        </div>
      ))}
    </div>
  );
}

export default function IngestaPage() {
  const [tab, setTab] = useState<"manual" | "csv">("manual");
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [creating, setCreating] = useState(false);

  /* CSV wizard state */
  const [wizardStep, setWizardStep] = useState<WizardStep>("upload");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<CSVRow[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);

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

  /* Parse CSV client-side for preview */
  const handleFileSelect = useCallback(() => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setCsvFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) { toast("El archivo debe tener al menos una fila de datos", "error"); return; }

      const delimiter = lines[0].includes(";") ? ";" : ",";
      const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, ""));
      setCsvHeaders(headers);

      const rows: CSVRow[] = [];
      for (let i = 1; i < lines.length && i <= 100; i++) {
        const vals = lines[i].split(delimiter).map((v) => v.trim().replace(/^["']|["']$/g, ""));
        const row: CSVRow = {};
        headers.forEach((h, j) => { row[h] = vals[j] ?? ""; });
        rows.push(row);
      }
      setCsvRows(rows);
      setWizardStep("preview");
    };
    reader.readAsText(file, "utf-8");
  }, [toast]);

  /* Actually import */
  const handleImport = async () => {
    if (!csvFile) return;
    setImporting(true);
    setWizardStep("importing");
    try {
      const formData = new FormData();
      formData.append("file", csvFile);
      const res = await fetch(`${API_BASE}/negocios/csv`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al importar");
      setImportResult({ creados: data.creados, duplicados: data.duplicados, errores: data.errores });
      setWizardStep("done");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error al importar CSV", "error");
      setWizardStep("preview");
    } finally {
      setImporting(false);
    }
  };

  const resetWizard = () => {
    setWizardStep("upload");
    setCsvHeaders([]);
    setCsvRows([]);
    setCsvFileName("");
    setCsvFile(null);
    setImportResult(null);
    if (fileRef.current) fileRef.current.value = "";
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

  const hasNombre = csvHeaders.some((h) => h.toLowerCase() === "nombre");
  const hasRubro = csvHeaders.some((h) => h.toLowerCase() === "rubro");
  const hasComuna = csvHeaders.some((h) => h.toLowerCase() === "comuna");
  const missingRequired = !hasNombre || !hasRubro || !hasComuna;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Ingesta de Datos</h1>
        <p className="text-sm text-muted-foreground">
          Agrega negocios manualmente o importa desde un archivo CSV
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
        <button
          onClick={() => { setTab("manual"); resetWizard(); }}
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

      {/* ═══ Manual Form ═══ */}
      {tab === "manual" && (
        <form onSubmit={handleManualSubmit} className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-foreground">Nombre *</label>
              <input type="text" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-all" placeholder="Nombre del negocio" />
            </div>
            {[
              { key: "rubro", type: "select", options: RUBROS },
              { key: "comuna", type: "select", options: COMUNAS },
              { key: "direccion", placeholder: "Av. Principal 123" },
              { key: "telefono", placeholder: "+56 9 1234 5678" },
              { key: "email", placeholder: "contacto@negocio.cl", inputType: "email" },
              { key: "sitioWeb", placeholder: "https://...", inputType: "url" },
              { key: "instagram", placeholder: "@usuario" },
              { key: "facebook", placeholder: "https://facebook.com/...", inputType: "url" },
              { key: "linkExterno", placeholder: "AgendaPro, Linktree, etc.", inputType: "url" },
            ].map((field) => (
              <div key={field.key}>
                <label className="mb-1.5 block text-sm font-medium capitalize text-foreground">{field.key.replace(/([A-Z])/g, " $1")}</label>
                {field.type === "select" ? (
                  <select value={form[field.key as keyof typeof form]} onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground transition-all">
                    {field.options!.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={field.inputType ?? "text"} value={form[field.key as keyof typeof form]}
                    onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-all"
                    placeholder={field.placeholder} />
                )}
              </div>
            ))}
          </div>
          <button type="submit" disabled={creating}
            className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-violet-500/20 hover:brightness-110 transition-all disabled:opacity-50">
            <Plus className="h-4 w-4" /> {creating ? "Creando…" : "Crear Negocio"}
          </button>
        </form>
      )}

      {/* ═══ CSV Wizard ═══ */}
      {tab === "csv" && (
        <div className="space-y-4">
          <StepIndicator current={wizardStep === "upload" ? 0 : wizardStep === "preview" ? 1 : wizardStep === "importing" ? 2 : 3} steps={["Subir archivo", "Previsualizar", "Importar", "Listo"]} />

          {/* Step 1: Upload */}
          {wizardStep === "upload" && (
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-violet-500/10 p-2"><FileSpreadsheet className="h-5 w-5 text-violet-500" /></div>
                  <div>
                    <h3 className="font-semibold text-foreground">Selecciona tu archivo CSV</h3>
                    <p className="text-sm text-muted-foreground">Columnas requeridas: nombre, rubro, comuna</p>
                  </div>
                </div>
                <button onClick={downloadTemplate}
                  className="flex items-center gap-2 rounded-xl border border-border/60 px-4 py-2 text-sm text-foreground hover:bg-accent/50 transition-colors">
                  <FileDown className="h-4 w-4" /> Plantilla
                </button>
              </div>

              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 p-10 transition-colors hover:border-violet-500/50 hover:bg-muted/40">
                <Upload className="mb-3 h-10 w-10 text-violet-400/50" />
                <span className="text-sm font-medium text-foreground">Arrastra o haz clic para seleccionar</span>
                <span className="mt-1 text-xs text-muted-foreground">CSV, TXT — máx. 5MB</span>
                <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileSelect} />
              </label>
            </div>
          )}

          {/* Step 2: Preview */}
          {wizardStep === "preview" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Eye className="h-5 w-5 text-violet-500" />
                    <div>
                      <h3 className="font-semibold text-foreground">{csvFileName}</h3>
                      <p className="text-sm text-muted-foreground">{csvRows.length} filas · {csvHeaders.length} columnas</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={resetWizard}
                      className="flex items-center gap-1.5 rounded-xl border border-border/60 px-4 py-2 text-sm text-muted-foreground hover:bg-accent/50 transition-colors">
                      <ChevronLeft className="h-4 w-4" /> Cambiar archivo
                    </button>
                  </div>
                </div>

                {/* Column mapping */}
                <div className="mb-4 flex flex-wrap gap-2">
                  {csvHeaders.map((h) => {
                    const isRequired = ["nombre", "rubro", "comuna"].includes(h.toLowerCase());
                    const isOptional = ["direccion", "telefono", "email", "sitioweb", "instagram", "facebook"].includes(h.toLowerCase());
                    return (
                      <span key={h} className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium",
                        isRequired ? "bg-green-500/20 text-green-400" :
                        isOptional ? "bg-blue-500/20 text-blue-400" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {h} {isRequired && "✓"}
                      </span>
                    );
                  })}
                </div>

                {missingRequired && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-400">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Faltan columnas requeridas: {!hasNombre && "nombre "}{!hasRubro && "rubro "}{!hasComuna && "comuna"}
                  </div>
                )}

                {/* Table preview */}
                <div className="max-h-80 overflow-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">#</th>
                        {csvHeaders.map((h) => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvRows.slice(0, 20).map((row, i) => (
                        <tr key={i} className="border-t border-border hover:bg-muted/30">
                          <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                          {csvHeaders.map((h) => (
                            <td key={h} className="max-w-48 truncate px-3 py-2 text-foreground">{row[h] || <span className="text-muted-foreground/50">—</span>}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvRows.length > 20 && (
                    <p className="border-t border-border bg-muted/30 px-3 py-2 text-center text-xs text-muted-foreground">
                      Mostrando 20 de {csvRows.length} filas
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={handleImport} disabled={missingRequired}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-violet-500/20 hover:brightness-110 transition-all disabled:opacity-50">
                  <Upload className="h-4 w-4" /> Importar {csvRows.length} negocios
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Importing */}
          {wizardStep === "importing" && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card py-16 shadow-sm">
              <Loader2 className="mb-4 h-10 w-10 animate-spin text-violet-500" />
              <p className="text-lg font-semibold text-foreground">Importando negocios…</p>
              <p className="mt-1 text-sm text-muted-foreground">Procesando {csvRows.length} registros</p>
            </div>
          )}

          {/* Step 4: Done */}
          {wizardStep === "done" && importResult && (
            <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20">
                <Check className="h-7 w-7 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Importación completada</h3>
              <div className="mx-auto mt-4 grid max-w-sm grid-cols-3 gap-4">
                <div className="rounded-lg bg-green-500/10 p-3">
                  <p className="text-2xl font-bold text-green-400">{importResult.creados}</p>
                  <p className="text-xs text-muted-foreground">Creados</p>
                </div>
                <div className="rounded-lg bg-yellow-500/10 p-3">
                  <p className="text-2xl font-bold text-yellow-400">{importResult.duplicados}</p>
                  <p className="text-xs text-muted-foreground">Duplicados</p>
                </div>
                <div className="rounded-lg bg-red-500/10 p-3">
                  <p className="text-2xl font-bold text-red-400">{importResult.errores}</p>
                  <p className="text-xs text-muted-foreground">Errores</p>
                </div>
              </div>
              <button onClick={resetWizard}
                className="mt-6 rounded-xl border border-border/60 px-6 py-2.5 text-sm font-medium text-foreground hover:bg-accent/50 transition-colors">
                Importar otro archivo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
