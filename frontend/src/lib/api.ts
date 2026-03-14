const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Negocios ────────────────────────────────────────────

export interface Negocio {
  id: string;
  createdAt: string;
  updatedAt: string;
  nombre: string;
  rubro: string;
  subrubro: string | null;
  comuna: string;
  ciudad: string | null;
  region: string | null;
  direccion: string | null;
  lat: number | null;
  lng: number | null;
  telefono: string | null;
  email: string | null;
  whatsapp: string | null;
  sitioWeb: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  linkExterno: string | null;
  tipoLinkExt: string | null;
  gmapsRating: number | null;
  gmapsReviews: number | null;
  estadoPresencia: string;
  score: number;
  nivelOportunidad: string;
  razonesScore: string[];
  estadoContacto: string;
  notas: string | null;
  fechaUltimoContacto: string | null;
  proximoSeguimiento: string | null;
  fuenteDescubrimiento: string;
  _count?: { analisis: number; contactos: number };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Stats {
  total: number;
  avgScore: number;
  byPresencia: Record<string, number>;
  byContacto: Record<string, number>;
  byNivel: Record<string, number>;
  byRubro: Array<{ rubro: string; count: number }>;
  byComuna: Array<{ comuna: string; count: number }>;
  nuevos7d: number;
  nuevos30d: number;
  tasaConversion: number;
  ganados: number;
  topHot: Array<{ id: string; nombre: string; rubro: string; comuna: string; score: number; estadoPresencia: string; estadoContacto: string }>;
  seguimientosPendientes: number;
}

// Helper to convert Stats maps to arrays for charts
export function statsPresenciaArray(s: Stats) {
  return Object.entries(s.byPresencia).map(([estadoPresencia, _count]) => ({ estadoPresencia, _count }));
}
export function statsNivelArray(s: Stats) {
  return Object.entries(s.byNivel).map(([nivelOportunidad, _count]) => ({ nivelOportunidad, _count }));
}
export function statsContactoArray(s: Stats) {
  return Object.entries(s.byContacto).map(([estadoContacto, _count]) => ({ estadoContacto, _count }));
}
export function statsRubroArray(s: Stats) {
  return s.byRubro.map((r) => ({ rubro: r.rubro, _count: r.count }));
}
export function statsComunaArray(s: Stats) {
  return s.byComuna.map((c) => ({ comuna: c.comuna, _count: c.count }));
}

export function getNegocios(params: Record<string, string | number> = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  }
  return request<PaginatedResponse<Negocio>>(`/negocios?${qs}`);
}

export function getNegocio(id: string) {
  return request<Negocio & { analisis: Analisis[]; contactos: Contacto[] }>(`/negocios/${id}`);
}

export function getStats() {
  return request<Stats>("/negocios/stats");
}

export function createNegocio(data: Partial<Negocio>) {
  return request<Negocio>("/negocios", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateNegocio(id: string, data: Partial<Negocio>) {
  return request<Negocio>(`/negocios/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteNegocio(id: string) {
  return request(`/negocios/${id}`, { method: "DELETE" });
}

// ─── Análisis ────────────────────────────────────────────

export interface Analisis {
  id: string;
  createdAt: string;
  negocioId: string;
  dominioExiste: boolean | null;
  dominioResponde: boolean | null;
  httpStatus: number | null;
  redirectUrl: string | null;
  tieneSSL: boolean | null;
  esResponsive: boolean | null;
  tecnologia: string | null;
  plantillaGenerica: boolean | null;
  tieneFormulario: boolean | null;
  tieneCTA: boolean | null;
  tieneWhatsappWidget: boolean | null;
  tieneFavicon: boolean | null;
  tieneTitle: boolean | null;
  titleText: string | null;
  tieneMetaDesc: boolean | null;
  metaDescText: string | null;
  tieneH1: boolean | null;
  tieneSitemap: boolean | null;
  tieneRobotsTxt: boolean | null;
  performanceScore: number | null;
  lcpMs: number | null;
  fcpMs: number | null;
  cls: number | null;
  errores: string[];
}

export function triggerAnalisis(negocioId: string) {
  return request<{ message: string }>(`/analisis/${negocioId}`, { method: "POST" });
}

export function triggerBatchAnalisis(ids: string[]) {
  return request<{ message: string }>("/analisis/batch", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}

export function getQueueStatus() {
  return request<{ size: number; pending: number }>("/analisis/queue");
}

// ─── CRM ─────────────────────────────────────────────────

export interface Contacto {
  id: string;
  createdAt: string;
  negocioId: string;
  tipo: string;
  resultado: string | null;
  notas: string | null;
  negocio?: { id: string; nombre: string; rubro: string };
}

export function createContacto(data: {
  negocioId: string;
  tipo: string;
  resultado?: string;
  notas?: string;
}) {
  return request<Contacto>("/crm/contacto", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getPipeline() {
  return request<Record<string, Negocio[]>>("/crm/pipeline");
}

export function updateEstadoContacto(
  id: string,
  estadoOrData: string | { estadoContacto?: string; notas?: string; proximoSeguimiento?: string }
) {
  const body = typeof estadoOrData === "string" ? { estadoContacto: estadoOrData } : estadoOrData;
  return request<Negocio>(`/crm/negocio/${id}/estado`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export interface Seguimiento {
  id: string;
  nombre: string;
  rubro: string;
  comuna: string;
  score: number;
  estadoContacto: string;
  proximoSeguimiento: string | null;
  notas: string | null;
  _count: { contactos: number };
}

export function getSeguimientos() {
  return request<Seguimiento[]>("/crm/seguimientos");
}

// ─── OSM ─────────────────────────────────────────────────

export function getZonas() {
  return request<string[]>("/osm/zonas");
}

export function getRubrosOSM() {
  return request<string[]>("/osm/rubros");
}

export function buscarOSM(rubro: string, comuna: string, importar = false) {
  return request<{
    resultados?: Array<{ nombre: string; tipo: string; comuna: string; direccion?: string; lat?: number; lng?: number; telefono?: string; sitioWeb?: string; email?: string }>;
    total?: number;
    encontrados?: number;
    creados?: number;
    duplicados?: number;
  }>(
    "/osm/buscar",
    { method: "POST", body: JSON.stringify({ rubro, comuna, importar }) }
  );
}

// ─── Export ──────────────────────────────────────────────

export function getReport(id: string) {
  return request<Record<string, unknown>>(`/export/report/${id}`);
}

export function getExportCSVUrl() {
  return `${API_BASE}/export/csv`;
}
