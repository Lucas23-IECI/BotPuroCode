import { z } from "zod";

export const negocioCreateSchema = z.object({
  nombre: z.string().min(1).max(200),
  rubro: z.string().min(1).max(100),
  subrubro: z.string().max(100).optional(),
  comuna: z.string().min(1).max(100),
  ciudad: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  direccion: z.string().max(300).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  telefono: z.string().max(20).optional(),
  email: z.string().email().max(200).optional().or(z.literal("")),
  whatsapp: z.string().max(20).optional(),
  sitioWeb: z.string().url().max(500).optional().or(z.literal("")),
  instagram: z.string().max(200).optional(),
  facebook: z.string().max(200).optional(),
  tiktok: z.string().max(200).optional(),
  linkExterno: z.string().max(500).optional(),
  tipoLinkExt: z.string().max(50).optional(),
  gmapsRating: z.number().min(0).max(5).optional(),
  gmapsReviews: z.number().int().min(0).optional(),
  fuenteDescubrimiento: z.string().max(50).default("manual"),
});

export const negocioUpdateSchema = negocioCreateSchema.partial();

export const negocioFilterSchema = z.object({
  rubro: z.string().optional(),
  comuna: z.string().optional(),
  estadoPresencia: z.string().optional(),
  estadoContacto: z.string().optional(),
  nivelOportunidad: z.string().optional(),
  scoreMin: z.coerce.number().int().min(0).max(100).optional(),
  scoreMax: z.coerce.number().int().min(0).max(100).optional(),
  busqueda: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.enum(["score", "nombre", "createdAt", "updatedAt"]).default("score"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const contactoCreateSchema = z.object({
  negocioId: z.string().min(1),
  tipo: z.enum(["LLAMADA", "EMAIL", "WHATSAPP", "INSTAGRAM_DM", "VISITA", "OTRO"]),
  resultado: z
    .enum(["INTERESADO", "NO_INTERESADO", "NO_CONTESTA", "SEGUIMIENTO", "PROPUESTA_ENVIADA", "CERRADO"])
    .optional(),
  notas: z.string().max(2000).optional(),
});

export const csvRowSchema = z.object({
  nombre: z.string().min(1),
  rubro: z.string().min(1),
  comuna: z.string().min(1),
  ciudad: z.string().optional(),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().optional(),
  whatsapp: z.string().optional(),
  sitioWeb: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  gmapsRating: z.coerce.number().optional(),
  gmapsReviews: z.coerce.number().int().optional(),
});

export type NegocioCreate = z.infer<typeof negocioCreateSchema>;
export type NegocioFilter = z.infer<typeof negocioFilterSchema>;
export type ContactoCreate = z.infer<typeof contactoCreateSchema>;
export type CsvRow = z.infer<typeof csvRowSchema>;
