const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("botpurocode_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
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
  googlePlaceId: string | null;
  horarios: string | null;
  estadoGoogle: string | null;
  fotosUrl: string[];
  igFollowers: number | null;
  igLastPost: string | null;
  fbFollowers: number | null;
  fbLastPost: string | null;
  estadoPresencia: string;
  score: number;
  nivelOportunidad: string;
  razonesScore: string[];
  calidadDatos: string;
  estadoContacto: string;
  notas: string | null;
  fechaUltimoContacto: string | null;
  proximoSeguimiento: string | null;
  asignadoAId: string | null;
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
  conversionPorComuna: Array<{ comuna: string; total: number; ganados: number }>;
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

// ─── Auth ────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  activo?: boolean;
  createdAt?: string;
  cargo?: string | null;
  bio?: string | null;
  telefono?: string | null;
  avatarBase64?: string | null;
  mustChangePassword?: boolean;
  lastLoginAt?: string | null;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export function login(email: string, password: string) {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getMe() {
  return request<User>("/auth/me");
}

export function getUsers() {
  return request<User[]>("/auth/users");
}

export function registerUser(data: { email: string; nombre: string; password: string; rol?: string }) {
  return request<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateUser(id: string, data: Partial<User>) {
  return request<User>(`/auth/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function seedAdmin() {
  return request<{ message: string; users: User[] }>("/auth/seed", { method: "POST" });
}

// ─── Plantillas ──────────────────────────────────────────

export interface Plantilla {
  id: string;
  createdAt: string;
  updatedAt: string;
  nombre: string;
  tipo: "WHATSAPP" | "EMAIL";
  asunto: string | null;
  cuerpo: string;
  categoria: string | null;
  activa: boolean;
}

export function getPlantillas(params?: { tipo?: string; categoria?: string }) {
  const qs = new URLSearchParams();
  if (params?.tipo) qs.set("tipo", params.tipo);
  if (params?.categoria) qs.set("categoria", params.categoria);
  return request<Plantilla[]>(`/plantillas?${qs}`);
}

export function createPlantilla(data: { nombre: string; tipo: string; asunto?: string; cuerpo: string; categoria?: string }) {
  return request<Plantilla>("/plantillas", { method: "POST", body: JSON.stringify(data) });
}

export function updatePlantilla(id: string, data: Partial<Plantilla>) {
  return request<Plantilla>(`/plantillas/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export function deletePlantilla(id: string) {
  return request(`/plantillas/${id}`, { method: "DELETE" });
}

export function renderPlantilla(plantillaId: string, negocioId: string) {
  return request<{ tipo: string; asunto: string; cuerpo: string; whatsappLink: string | null }>("/plantillas/render", {
    method: "POST",
    body: JSON.stringify({ plantillaId, negocioId }),
  });
}

export function seedPlantillas() {
  return request<{ message: string }>("/plantillas/seed", { method: "POST" });
}

// ─── Propuestas ──────────────────────────────────────────

export interface Propuesta {
  id: string;
  createdAt: string;
  negocioId: string;
  tipoServicio: string;
  precioBase: number;
  descuento: number;
  precioFinal: number;
  diagnostico: string;
  solucion: string;
  pdfUrl: string | null;
  estado: string;
  creadoPor?: { nombre: string };
}

export function createPropuesta(data: { negocioId: string; tipoServicio: string; descuento?: number }) {
  return request<Propuesta>("/propuestas", { method: "POST", body: JSON.stringify(data) });
}

export function getPropuestas(negocioId: string) {
  return request<Propuesta[]>(`/propuestas/negocio/${negocioId}`);
}

export function updatePropuesta(id: string, estado: string) {
  return request<Propuesta>(`/propuestas/${id}`, { method: "PATCH", body: JSON.stringify({ estado }) });
}

export function getPropuestaPDFUrl(id: string) {
  return `${API_BASE}/propuestas/${id}/pdf`;
}

// ─── Notificaciones ──────────────────────────────────────

export interface Notificacion {
  id: string;
  createdAt: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  metadata: string | null;
}

export function getNotificaciones() {
  return request<{ notificaciones: Notificacion[]; noLeidas: number }>("/notificaciones");
}

export function marcarNotificacionLeida(id: string) {
  return request("/notificaciones/" + id + "/leer", { method: "PATCH" });
}

export function marcarTodasLeidas() {
  return request("/notificaciones/leer-todas", { method: "PATCH" });
}

// ─── Google Places ───────────────────────────────────────

export function enriquecerGooglePlaces(negocioId: string) {
  return request<{ status: string; reason?: string }>(`/negocios/${negocioId}/enriquecer`, { method: "POST" });
}

// ─── Asignación de leads ─────────────────────────────────

export function asignarLead(negocioId: string, asignadoAId: string | null) {
  return request<Negocio>(`/negocios/${negocioId}/asignar`, {
    method: "PATCH",
    body: JSON.stringify({ asignadoAId }),
  });
}

// ─── Cambiar contraseña ──────────────────────────────────

export function changePassword(currentPassword: string, newPassword: string) {
  return request<{ message: string }>("/auth/me/password", {
    method: "PATCH",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function deleteNotificacion(id: string) {
  return request("/notificaciones/" + id, { method: "DELETE" });
}

// ─── Automatizaciones ────────────────────────────────────

export interface Automatizacion {
  id: string;
  createdAt: string;
  nombre: string;
  activa: boolean;
  trigger: string;
  condicion: string;
  accion: string;
  accionConfig: string;
}

export function getAutomatizaciones() {
  return request<Automatizacion[]>("/automatizaciones");
}

export function createAutomatizacion(data: {
  nombre: string;
  trigger: string;
  condicion: Record<string, unknown>;
  accion: string;
  accionConfig: Record<string, unknown>;
}) {
  return request<Automatizacion>("/automatizaciones", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAutomatizacion(id: string, data: Partial<{
  nombre: string;
  trigger: string;
  condicion: Record<string, unknown>;
  accion: string;
  accionConfig: Record<string, unknown>;
  activa: boolean;
}>) {
  return request<Automatizacion>("/automatizaciones/" + id, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteAutomatizacion(id: string) {
  return request("/automatizaciones/" + id, { method: "DELETE" });
}

// ─── Perfil ────────────────────────────────────────

export function updateProfile(data: {
  nombre?: string;
  cargo?: string | null;
  bio?: string | null;
  telefono?: string | null;
  avatarBase64?: string | null;
}) {
  return request<User>("/auth/me/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function getUserProfile(id: string) {
  return request<User>(`/auth/users/${id}`);
}

// ─── Actividad ─────────────────────────────────────

export interface ActivityLog {
  id: string;
  createdAt: string;
  userId: string;
  accion: string;
  entidad: string | null;
  entidadId: string | null;
  detalle: string | null;
  metadata: string | null;
  user: { id: string; nombre: string; avatarBase64: string | null };
}

export interface ActivityStats {
  user: { id: string; nombre: string; avatarBase64: string | null };
  total: number;
  thisWeek: number;
  byAction: Array<{ accion: string; count: number }>;
}

export function getActivity(params: { userId?: string; accion?: string; limit?: number; offset?: number } = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) qs.set(k, String(v));
  }
  return request<{ items: ActivityLog[]; total: number }>(`/activity?${qs}`);
}

export function getActivityStats() {
  return request<ActivityStats[]>("/activity/stats");
}

export function getActivityHeatmap(userId: string, days = 365) {
  return request<Record<string, number>>(`/activity/heatmap/${userId}?days=${days}`);
}
