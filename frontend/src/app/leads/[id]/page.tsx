"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getNegocio,
  triggerAnalisis,
  createContacto,
  updateEstadoContacto,
  deleteNegocio,
  type Negocio,
  type Analisis,
  type Contacto,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { ScoreExplainerPanel } from "@/components/score-explainer";
import {
  ArrowLeft,
  Globe,
  Instagram,
  Facebook,
  PlayCircle,
  Phone,
  Mail,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  MessageCircle,
  MapPin,
  Star,
  Eye,
  AlertTriangle,
  Ban,
  Navigation,
  Search,
} from "lucide-react";

const CRM_STATES = [
  "NO_CONTACTADO",
  "CONTACTADO",
  "PROPUESTA_ENVIADA",
  "NEGOCIANDO",
  "CERRADO_GANADO",
  "CERRADO_PERDIDO",
  "CERRADO_NO_EXISTE",
] as const;

const CRM_LABELS: Record<string, string> = {
  NO_CONTACTADO: "No Contactado",
  CONTACTADO: "Contactado",
  PROPUESTA_ENVIADA: "Propuesta Enviada",
  NEGOCIANDO: "Negociando",
  CERRADO_GANADO: "Cerrado Ganado",
  CERRADO_PERDIDO: "Cerrado Perdido",
  CERRADO_NO_EXISTE: "No Existe",
};

const CRM_DOT_COLORS: Record<string, string> = {
  NO_CONTACTADO: "bg-gray-400",
  CONTACTADO: "bg-blue-400",
  PROPUESTA_ENVIADA: "bg-purple-400",
  NEGOCIANDO: "bg-yellow-400",
  CERRADO_GANADO: "bg-green-400",
  CERRADO_PERDIDO: "bg-red-400",
  CERRADO_NO_EXISTE: "bg-red-600",
};

const TIPOS_CONTACTO = ["LLAMADA", "EMAIL", "WHATSAPP", "VISITA", "OTRO"] as const;
const RESULTADOS = ["POSITIVO", "NEGATIVO", "NEUTRAL", "SIN_RESPUESTA"] as const;

/* ─── Score Ring SVG ──────────────────────────────────────── */
function ScoreRing({ score }: { score: number }) {
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#eab308" : "#ef4444";
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-2xl font-bold text-foreground">{score}</span>
        <span className="text-xs text-muted-foreground block -mt-1">/100</span>
      </div>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────── */
function Check({ ok }: { ok: boolean | null | undefined }) {
  if (ok === null || ok === undefined) return <span className="text-muted-foreground">—</span>;
  return ok ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <XCircle className="h-4 w-4 text-red-400" />;
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "nunca";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  return `hace ${months} mes${months > 1 ? "es" : ""}`;
}

function lcpInterpretation(ms: number): { label: string; color: string } {
  if (ms <= 2500) return { label: "Bueno", color: "text-green-400" };
  if (ms <= 4000) return { label: "Necesita mejorar", color: "text-yellow-400" };
  return { label: "Pobre", color: "text-red-400" };
}

const PRESENCIA_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
  SIN_WEB: { icon: <XCircle className="h-8 w-8" />, color: "text-green-400" },
  SOLO_RRSS: { icon: <Instagram className="h-8 w-8" />, color: "text-lime-400" },
  LINK_EXTERNO: { icon: <ExternalLink className="h-8 w-8" />, color: "text-yellow-400" },
  WEB_BASICA: { icon: <Globe className="h-8 w-8" />, color: "text-orange-400" },
  WEB_MEDIA: { icon: <Globe className="h-8 w-8" />, color: "text-red-400" },
  WEB_BUENA: { icon: <Globe className="h-8 w-8" />, color: "text-red-500" },
  PENDIENTE: { icon: <Clock className="h-8 w-8" />, color: "text-gray-400" },
};

const PRESENCIA_LABELS: Record<string, string> = {
  SIN_WEB: "Sin sitio web",
  SOLO_RRSS: "Solo redes sociales",
  LINK_EXTERNO: "Link externo",
  WEB_BASICA: "Web básica",
  WEB_MEDIA: "Web media",
  WEB_BUENA: "Web buena",
  PENDIENTE: "Pendiente",
};

type Tab = "resumen" | "analisis" | "historial";

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { toast } = useToast();

  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [analisis, setAnalisis] = useState<Analisis[]>([]);
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("resumen");
  const [contactForm, setContactForm] = useState({
    tipo: "LLAMADA" as string,
    resultado: "NEUTRAL" as string,
    notas: "",
  });

  const fetchData = async () => {
    try {
      const result = await getNegocio(id);
      setNegocio(result);
      setAnalisis(result.analisis ?? []);
      setContactos(result.contactos ?? []);
    } catch {
      toast("Error al cargar el lead", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAnalysis = async () => {
    setAnalyzing(true);
    try {
      await triggerAnalisis(id);
      toast("Análisis iniciado, se actualizará en segundos…", "info");
      setTimeout(fetchData, 3000);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleEstadoChange = async (estado: string) => {
    await updateEstadoContacto(id, estado);
    toast(`Estado → ${CRM_LABELS[estado] ?? estado}`, "success");
    fetchData();
  };

  const handleMarkNoExiste = async () => {
    await updateEstadoContacto(id, "CERRADO_NO_EXISTE");
    toast("Marcado como 'No existe'", "info");
    fetchData();
  };

  const handleContactSubmit = async () => {
    await createContacto({
      negocioId: id,
      tipo: contactForm.tipo,
      resultado: contactForm.resultado,
      notas: contactForm.notas || undefined,
    });
    setShowContactForm(false);
    setContactForm({ tipo: "LLAMADA", resultado: "NEUTRAL", notas: "" });
    toast("Contacto registrado", "success");
    fetchData();
  };

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este negocio y todos sus datos?")) return;
    await deleteNegocio(id);
    toast("Negocio eliminado", "info");
    router.push("/leads");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  if (!negocio) {
    return <div className="py-24 text-center text-muted-foreground">Negocio no encontrado</div>;
  }

  const lastAnalisis = analisis[0];
  const whatsappNumber = negocio.whatsapp || negocio.telefono;
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}` : null;
  const mapsSearchLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${negocio.nombre} ${negocio.comuna} Chile`)}`;
  const mapsCoordLink = negocio.lat && negocio.lng
    ? `https://www.google.com/maps?q=${negocio.lat},${negocio.lng}`
    : null;
  const presIcon = PRESENCIA_ICONS[negocio.estadoPresencia] ?? PRESENCIA_ICONS.PENDIENTE;
  const isNoExiste = negocio.estadoContacto === "CERRADO_NO_EXISTE";

  return (
    <div className="space-y-5">
      {/* Nav */}
      <button onClick={() => router.push("/leads")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver a Leads
      </button>

      {/* No existe banner */}
      {isNoExiste && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3">
          <Ban className="h-5 w-5 text-red-400" />
          <p className="text-sm font-medium text-red-400">Este negocio fue marcado como cerrado o inexistente</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground">{negocio.nombre}</h1>
          <p className="text-muted-foreground">
            {negocio.rubro} · {negocio.comuna}
            {negocio.direccion && ` · ${negocio.direccion}`}
          </p>

          {/* Social links */}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {negocio.sitioWeb && (
              <a href={negocio.sitioWeb} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-blue-400 hover:underline">
                <Globe className="h-3.5 w-3.5" /> Sitio web
              </a>
            )}
            {negocio.instagram && (
              <a href={`https://instagram.com/${negocio.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-pink-400 hover:underline">
                <Instagram className="h-3.5 w-3.5" /> {negocio.instagram}
              </a>
            )}
            {negocio.facebook && (
              <a href={negocio.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-blue-500 hover:underline">
                <Facebook className="h-3.5 w-3.5" /> Facebook
              </a>
            )}
            {negocio.tiktok && (
              <a href={`https://tiktok.com/@${negocio.tiktok.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-foreground hover:underline">
                TikTok
              </a>
            )}
          </div>

          {/* Google Maps rating */}
          {(negocio.gmapsRating !== null || negocio.gmapsReviews !== null) && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-yellow-400" />
              <span className="font-medium text-foreground">{negocio.gmapsRating ?? "—"}</span>
              <span className="text-muted-foreground">({negocio.gmapsReviews ?? 0} reseñas)</span>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={handleAnalysis}
            disabled={analyzing}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <PlayCircle className="h-4 w-4" />
            {analyzing ? "Analizando…" : "Analizar"}
          </button>
          {!isNoExiste && (
            <button
              onClick={handleMarkNoExiste}
              className="rounded-lg border border-orange-500/50 p-2 text-orange-400 hover:bg-orange-500/10"
              title="Marcar como inexistente/cerrado"
            >
              <Ban className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleDelete}
            className="rounded-lg border border-destructive/50 p-2 text-destructive hover:bg-destructive/10"
            title="Eliminar definitivamente"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Quick Action Buttons — gradient style */}
      <div className="flex flex-wrap gap-3">
        {whatsappLink && (
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-green-500/20 transition-transform hover:scale-105">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        )}
        {negocio.telefono && (
          <a href={`tel:${negocio.telefono}`}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition-transform hover:scale-105">
            <Phone className="h-4 w-4" /> Llamar {negocio.telefono}
          </a>
        )}
        {negocio.email && (
          <a href={`mailto:${negocio.email}`}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/20 transition-transform hover:scale-105">
            <Mail className="h-4 w-4" /> Email
          </a>
        )}
        <a href={mapsSearchLink} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-transform hover:scale-105">
          <Search className="h-4 w-4" /> Buscar en Maps
        </a>
        {mapsCoordLink && (
          <a href={mapsCoordLink} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-transform hover:scale-105">
            <Navigation className="h-4 w-4" /> Ver coordenadas
          </a>
        )}
        {negocio.sitioWeb && (
          <a href={negocio.sitioWeb} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-transform hover:scale-105">
            <Eye className="h-4 w-4" /> Ver sitio web
          </a>
        )}
      </div>

      {/* ─── Tabs ─────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-border">
        {([
          { key: "resumen" as Tab, label: "Resumen" },
          { key: "analisis" as Tab, label: "Análisis Técnico" },
          { key: "historial" as Tab, label: `Historial (${contactos.length})` },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ TAB: Resumen ═══ */}
      {activeTab === "resumen" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Score card with ring */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Score</h3>
              <button onClick={() => setShowScoreInfo(!showScoreInfo)} className="text-xs text-primary hover:underline">
                {showScoreInfo ? "Ocultar" : "¿Cómo funciona?"}
              </button>
            </div>
            <div className="flex items-center gap-4">
              <ScoreRing score={negocio.score} />
              <div>
                <span className={cn(
                  "inline-block rounded-full px-3 py-1 text-xs font-medium",
                  negocio.nivelOportunidad === "ALTA" ? "bg-green-500/20 text-green-400" :
                  negocio.nivelOportunidad === "MEDIA_ALTA" ? "bg-lime-500/20 text-lime-400" :
                  negocio.nivelOportunidad === "MEDIA" ? "bg-yellow-500/20 text-yellow-400" :
                  negocio.nivelOportunidad === "BAJA" ? "bg-orange-500/20 text-orange-400" :
                  "bg-gray-500/20 text-gray-400"
                )}>
                  {negocio.nivelOportunidad.replace(/_/g, " ")}
                </span>
                {negocio.razonesScore && negocio.razonesScore.length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    {negocio.razonesScore.slice(0, 3).map((r, i) => (
                      <p key={i} className="text-xs text-muted-foreground">• {r}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Presencia Digital card with icon */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Presencia Digital</h3>
            <div className="flex items-center gap-3">
              <div className={cn("rounded-xl bg-muted/50 p-3", presIcon.color)}>
                {presIcon.icon}
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {PRESENCIA_LABELS[negocio.estadoPresencia] ?? negocio.estadoPresencia.replace(/_/g, " ")}
                </p>
                {negocio.tipoLinkExt && (
                  <p className="text-sm text-muted-foreground">Plataforma: {negocio.tipoLinkExt}</p>
                )}
                <div className="mt-1 flex gap-2">
                  {negocio.sitioWeb && (
                    <a href={negocio.sitioWeb} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">
                      Visitar web
                    </a>
                  )}
                  {negocio.linkExterno && (
                    <a href={negocio.linkExterno} target="_blank" rel="noopener noreferrer" className="text-xs text-yellow-400 hover:underline">
                      Link externo
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CRM card with colored dot */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Estado CRM</h3>
            <div className="flex items-center gap-2 mb-3">
              <div className={cn("h-3 w-3 rounded-full", CRM_DOT_COLORS[negocio.estadoContacto] ?? "bg-gray-400")} />
              <select
                value={negocio.estadoContacto}
                onChange={(e) => handleEstadoChange(e.target.value)}
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
              >
                {CRM_STATES.map((s) => (
                  <option key={s} value={s}>{CRM_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              Último contacto: {timeAgo(negocio.fechaUltimoContacto)}
            </p>
            {negocio.proximoSeguimiento && (
              <p className={cn(
                "mt-1 text-xs font-medium",
                new Date(negocio.proximoSeguimiento) < new Date() ? "text-red-400" : "text-yellow-400"
              )}>
                Seguimiento: {new Date(negocio.proximoSeguimiento).toLocaleDateString("es-CL")}
                {new Date(negocio.proximoSeguimiento) < new Date() && " (vencido)"}
              </p>
            )}
            {negocio.notas && (
              <p className="mt-2 rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground">{negocio.notas}</p>
            )}
          </div>
        </div>
      )}

      {/* Score explainer collapsible */}
      {activeTab === "resumen" && showScoreInfo && <ScoreExplainerPanel />}

      {/* ═══ TAB: Análisis Técnico ═══ */}
      {activeTab === "analisis" && (
        <>
          {lastAnalisis ? (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm md:grid-cols-4">
                <div className="flex items-center gap-2"><Check ok={lastAnalisis.tieneSSL} /> SSL</div>
                <div className="flex items-center gap-2"><Check ok={lastAnalisis.esResponsive} /> Responsive</div>
                <div className="flex items-center gap-2"><Check ok={lastAnalisis.tieneFavicon} /> Favicon</div>
                <div className="flex items-center gap-2"><Check ok={lastAnalisis.tieneFormulario} /> Formulario</div>
                <div className="flex items-center gap-2"><Check ok={lastAnalisis.tieneCTA} /> CTA</div>
                <div className="flex items-center gap-2"><Check ok={lastAnalisis.tieneWhatsappWidget} /> WhatsApp Widget</div>
                <div className="flex items-center gap-2"><Check ok={lastAnalisis.tieneSitemap} /> Sitemap</div>
                <div className="flex items-center gap-2"><Check ok={lastAnalisis.tieneRobotsTxt} /> robots.txt</div>
                <div className="flex items-center gap-2"><Check ok={lastAnalisis.tieneTitle} /> Title</div>
                <div className="flex items-center gap-2"><Check ok={lastAnalisis.tieneMetaDesc} /> Meta Desc.</div>
                <div className="flex items-center gap-2"><Check ok={lastAnalisis.tieneH1} /> H1</div>
                <div className="flex items-center gap-2">
                  <Check ok={lastAnalisis.plantillaGenerica} />
                  {lastAnalisis.plantillaGenerica ? "Plantilla genérica" : "Web personalizada"}
                </div>

                {/* Performance metrics */}
                <div className="col-span-2 mt-3 md:col-span-4">
                  <div className="flex flex-wrap gap-6">
                    {lastAnalisis.tecnologia && (
                      <div>
                        <p className="text-xs text-muted-foreground">Tecnología</p>
                        <p className="font-medium text-foreground">{lastAnalisis.tecnologia}</p>
                      </div>
                    )}
                    {lastAnalisis.performanceScore !== null && lastAnalisis.performanceScore !== undefined && (
                      <div>
                        <p className="text-xs text-muted-foreground">Performance</p>
                        <p className={cn("font-medium", lastAnalisis.performanceScore >= 90 ? "text-green-400" : lastAnalisis.performanceScore >= 50 ? "text-yellow-400" : "text-red-400")}>
                          {lastAnalisis.performanceScore}/100
                        </p>
                      </div>
                    )}
                    {lastAnalisis.lcpMs !== null && lastAnalisis.lcpMs !== undefined && (
                      <div>
                        <p className="text-xs text-muted-foreground">LCP</p>
                        <p className={cn("font-medium", lcpInterpretation(lastAnalisis.lcpMs).color)}>
                          {(lastAnalisis.lcpMs / 1000).toFixed(1)}s — {lcpInterpretation(lastAnalisis.lcpMs).label}
                        </p>
                      </div>
                    )}
                    {lastAnalisis.fcpMs !== null && lastAnalisis.fcpMs !== undefined && (
                      <div>
                        <p className="text-xs text-muted-foreground">FCP</p>
                        <p className="font-medium text-foreground">{(lastAnalisis.fcpMs / 1000).toFixed(1)}s</p>
                      </div>
                    )}
                    {lastAnalisis.cls !== null && lastAnalisis.cls !== undefined && (
                      <div>
                        <p className="text-xs text-muted-foreground">CLS</p>
                        <p className={cn("font-medium", lastAnalisis.cls <= 0.1 ? "text-green-400" : lastAnalisis.cls <= 0.25 ? "text-yellow-400" : "text-red-400")}>
                          {lastAnalisis.cls.toFixed(3)}
                        </p>
                      </div>
                    )}
                    {lastAnalisis.httpStatus && (
                      <div>
                        <p className="text-xs text-muted-foreground">HTTP Status</p>
                        <p className="font-medium text-foreground">{lastAnalisis.httpStatus}</p>
                      </div>
                    )}
                  </div>
                </div>

                {lastAnalisis.titleText && (
                  <p className="col-span-2 mt-2 text-muted-foreground md:col-span-4">
                    Título: <span className="text-foreground">{lastAnalisis.titleText}</span>
                  </p>
                )}
                {lastAnalisis.metaDescText && (
                  <p className="col-span-2 text-muted-foreground md:col-span-4">
                    Meta Desc: <span className="text-foreground">{lastAnalisis.metaDescText}</span>
                  </p>
                )}

                {lastAnalisis.errores && lastAnalisis.errores.length > 0 && (
                  <div className="col-span-2 mt-2 rounded-lg bg-red-500/5 p-3 md:col-span-4">
                    <p className="mb-1 flex items-center gap-1 text-xs font-medium text-red-400">
                      <AlertTriangle className="h-3.5 w-3.5" /> Errores detectados
                    </p>
                    {lastAnalisis.errores.map((e, i) => (
                      <p key={i} className="text-xs text-red-300">• {e}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
              <PlayCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Sin análisis técnico</p>
              <p className="mt-1 text-xs text-muted-foreground">Haz clic en &quot;Analizar&quot; para evaluar la presencia web</p>
              <button onClick={handleAnalysis} disabled={analyzing}
                className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {analyzing ? "Analizando…" : "Analizar ahora"}
              </button>
            </div>
          )}
        </>
      )}

      {/* ═══ TAB: Historial ═══ */}
      {activeTab === "historial" && (
        <div className="rounded-xl border border-border bg-card p-5">
          {!showContactForm ? (
            <button onClick={() => setShowContactForm(true)}
              className="mb-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              + Registrar contacto
            </button>
          ) : (
            <div className="mb-4 space-y-3 rounded-lg border border-border bg-muted/30 p-4">
              <div className="grid grid-cols-2 gap-3">
                <select value={contactForm.tipo} onChange={(e) => setContactForm((f) => ({ ...f, tipo: e.target.value }))}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground">
                  {TIPOS_CONTACTO.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={contactForm.resultado} onChange={(e) => setContactForm((f) => ({ ...f, resultado: e.target.value }))}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground">
                  {RESULTADOS.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <textarea placeholder="Notas del contacto..." value={contactForm.notas}
                onChange={(e) => setContactForm((f) => ({ ...f, notas: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" rows={3} />
              <div className="flex gap-2">
                <button onClick={handleContactSubmit} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Guardar</button>
                <button onClick={() => setShowContactForm(false)} className="rounded-lg border border-input px-4 py-2 text-sm text-muted-foreground">Cancelar</button>
              </div>
            </div>
          )}

          {contactos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin contactos registrados</p>
          ) : (
            <div className="space-y-3">
              {contactos.map((c) => (
                <div key={c.id} className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3">
                  <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{c.tipo}</span>
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-xs",
                        c.resultado === "POSITIVO" ? "bg-green-500/20 text-green-400" :
                        c.resultado === "NEGATIVO" ? "bg-red-500/20 text-red-400" :
                        "bg-gray-500/20 text-gray-400"
                      )}>
                        {c.resultado?.replace(/_/g, " ") ?? "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
                    </div>
                    {c.notas && <p className="mt-1 text-sm text-muted-foreground">{c.notas}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
