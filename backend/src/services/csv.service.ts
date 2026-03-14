import { parse } from "csv-parse";
import { Readable } from "stream";
import { csvRowSchema, type CsvRow } from "../types/schemas";

export interface CSVParseResult {
  validos: CsvRow[];
  errores: Array<{ fila: number; error: string }>;
  total: number;
}

export async function parseCSV(
  buffer: Buffer,
  delimiter = ","
): Promise<CSVParseResult> {
  const result: CSVParseResult = { validos: [], errores: [], total: 0 };

  const records: Record<string, string>[] = await new Promise(
    (resolve, reject) => {
      const rows: Record<string, string>[] = [];
      const stream = Readable.from(buffer);

      stream
        .pipe(
          parse({
            columns: true,
            skip_empty_lines: true,
            trim: true,
            delimiter,
            bom: true,
            relax_column_count: true,
          })
        )
        .on("data", (row: Record<string, string>) => rows.push(row))
        .on("end", () => resolve(rows))
        .on("error", reject);
    }
  );

  result.total = records.length;

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const parsed = csvRowSchema.safeParse(normalizeHeaders(row));

    if (parsed.success) {
      result.validos.push(parsed.data);
    } else {
      const msgs = parsed.error.issues.map((e) => e.message).join("; ");
      result.errores.push({ fila: i + 2, error: msgs }); // +2: header + 0-index
    }
  }

  return result;
}

// Normalize common CSV header variations to expected names
function normalizeHeaders(
  row: Record<string, string>
): Record<string, string> {
  const MAP: Record<string, string> = {
    name: "nombre",
    nombre: "nombre",
    negocio: "nombre",
    business: "nombre",
    rubro: "rubro",
    category: "rubro",
    categoría: "rubro",
    categoria: "rubro",
    comuna: "comuna",
    city: "comuna",
    ciudad: "comuna",
    web: "sitioWeb",
    website: "sitioWeb",
    sitioweb: "sitioWeb",
    sitio_web: "sitioWeb",
    url: "sitioWeb",
    instagram: "instagram",
    ig: "instagram",
    facebook: "facebook",
    fb: "facebook",
    telefono: "telefono",
    teléfono: "telefono",
    phone: "telefono",
    fono: "telefono",
    direccion: "direccion",
    dirección: "direccion",
    address: "direccion",
    notas: "notas",
    notes: "notas",
    comentarios: "notas",
    fuente: "fuente",
    source: "fuente",
    origen: "fuente",
  };

  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    const clean = key.toLowerCase().trim().replace(/\s+/g, "_");
    const mapped = MAP[clean];
    if (mapped && value) {
      normalized[mapped] = value.trim();
    }
  }

  return normalized;
}
