import type { EstadoPresencia, Negocio } from "@prisma/client";

// ─── Scoring Configuration ─────────────────────────────────

const PESOS_PRESENCIA: Record<string, number> = {
  SIN_WEB: 40,
  SOLO_RRSS: 32,
  LINK_EXTERNO: 25,
  WEB_BASICA: 18,
  WEB_MEDIA: 8,
  WEB_BUENA: 0,
  PENDIENTE: 0,
};

const RUBROS_NIVEL_1 = new Set([
  "barbería", "peluquería", "salón de belleza", "manicure", "centro estético",
  "podología", "florería", "vivero", "pet shop", "peluquería canina",
  "taller mecánico", "vulcanización", "lubricentro", "lavado de autos", "detailing",
  "ferretería", "cerrajería", "gasfitería", "electricista", "carpintería",
  "mueblería", "lavandería", "imprenta", "fotografía", "sublimación",
  "pastelería", "repostería", "cafetería", "almacén", "minimarket", "botillería",
  "fletes", "mudanzas", "transporte escolar", "banquetería", "decoración de eventos",
  "cotillón", "regalos personalizados",
]);

const RUBROS_NIVEL_2 = new Set([
  "veterinaria", "dentista", "kinesiología", "psicólogo", "nutricionista",
  "fonoaudiología", "spa", "masoterapia", "depilación láser",
  "tienda de ropa", "boutique", "zapatería", "joyería",
  "gimnasio", "crossfit", "academia de danza", "escuela de fútbol", "escuela de música",
  "hostal", "cabañas", "agencia de viajes",
  "contador", "asesoría contable", "abogado", "corredora de propiedades",
]);

const RUBROS_NIVEL_3 = new Set([
  "restaurant", "restaurante", "pizzería", "sushi", "hamburguesería",
  "panadería", "clínica dental", "centro médico",
  "servicio técnico", "cámaras de seguridad",
  "gimnasio mediano", "turismo aventura",
]);

interface AnalisisData {
  tieneSSL?: boolean | null;
  esResponsive?: boolean | null;
  tieneFormulario?: boolean | null;
  tieneCTA?: boolean | null;
  tieneFavicon?: boolean | null;
  tieneTitle?: boolean | null;
  tieneMetaDesc?: boolean | null;
  tieneH1?: boolean | null;
  tieneSitemap?: boolean | null;
  tecnologia?: string | null;
  plantillaGenerica?: boolean | null;
  performanceScore?: number | null;
}

interface ScoringResult {
  score: number;
  nivelOportunidad: "ALTA" | "MEDIA_ALTA" | "MEDIA" | "BAJA" | "NO_PRIORITARIO";
  razones: string[];
}

export function calcularScore(
  negocio: Pick<Negocio, "estadoPresencia" | "rubro" | "gmapsRating" | "gmapsReviews" | "telefono" | "instagram">,
  analisis?: AnalisisData | null
): ScoringResult {
  let score = 0;
  const razones: string[] = [];

  // Factor A: Estado de presencia (máx 40)
  const presenciaPts = PESOS_PRESENCIA[negocio.estadoPresencia] ?? 0;
  score += presenciaPts;

  if (negocio.estadoPresencia === "SIN_WEB") {
    razones.push("No tiene sitio web propio");
  } else if (negocio.estadoPresencia === "SOLO_RRSS") {
    razones.push("Solo usa redes sociales como presencia digital");
  } else if (negocio.estadoPresencia === "LINK_EXTERNO") {
    razones.push("Depende de plataforma externa como sustituto de web");
  } else if (negocio.estadoPresencia === "WEB_BASICA") {
    razones.push("Tiene web pero es muy básica");
  } else if (negocio.estadoPresencia === "WEB_MEDIA") {
    razones.push("Tiene web funcional pero con problemas");
  }

  // Factor B: Problemas técnicos (máx 25)
  if (analisis) {
    if (analisis.tieneSSL === false) {
      score += 5;
      razones.push("Sin certificado SSL (HTTP)");
    }
    if (analisis.esResponsive === false) {
      score += 5;
      razones.push("Sitio no responsive (no se ve bien en celular)");
    }
    if (analisis.tieneFormulario === false && analisis.tieneCTA === false) {
      score += 4;
      razones.push("Sin formulario de contacto ni CTA");
    }
    if (analisis.tieneFavicon === false) {
      score += 1;
      razones.push("Sin favicon");
    }
    if (analisis.performanceScore != null) {
      if (analisis.performanceScore < 50) {
        score += 4;
        razones.push(`Performance muy baja (score: ${analisis.performanceScore}/100)`);
      } else if (analisis.performanceScore < 70) {
        score += 2;
        razones.push(`Performance media (score: ${analisis.performanceScore}/100)`);
      }
    }
    if (analisis.tieneTitle === false) {
      score += 2;
      razones.push("Sin title tag (malo para SEO)");
    }
    if (analisis.tieneMetaDesc === false) {
      score += 2;
      razones.push("Sin meta description (malo para SEO)");
    }
    if (analisis.tieneH1 === false) {
      score += 1;
      razones.push("Sin H1");
    }
    if (analisis.tieneSitemap === false) {
      score += 1;
      razones.push("Sin sitemap.xml");
    }
  }

  // Factor C: Tecnología (máx 10)
  if (analisis?.tecnologia) {
    const techScores: Record<string, number> = {
      wordpress: analisis.plantillaGenerica ? 10 : 4,
      wix: 8,
      google_sites: 8,
      blogger: 7,
      html_estatico: 6,
      squarespace: 3,
      shopify: 3,
      webflow: 1,
      joomla: 5,
    };
    const techPts = techScores[analisis.tecnologia] ?? 0;
    if (techPts > 0) {
      score += techPts;
      if (analisis.plantillaGenerica) {
        razones.push(`Usa plantilla genérica (${analisis.tecnologia})`);
      } else {
        razones.push(`Usa ${analisis.tecnologia}`);
      }
    }
  }

  // Factor D: Rubro (máx 15)
  const rubroLower = negocio.rubro.toLowerCase();
  if (RUBROS_NIVEL_1.has(rubroLower)) {
    score += 15;
  } else if (RUBROS_NIVEL_2.has(rubroLower)) {
    score += 10;
  } else if (RUBROS_NIVEL_3.has(rubroLower)) {
    score += 5;
  }

  // Factor E: Señales de actividad comercial (máx 10)
  if (negocio.gmapsRating != null && negocio.gmapsReviews != null) {
    if (negocio.gmapsReviews > 0) {
      score += 3;
      razones.push(`Negocio activo en Google Maps (${negocio.gmapsRating}★, ${negocio.gmapsReviews} reseñas)`);
    }
    if (negocio.gmapsRating != null && negocio.gmapsRating >= 4.0) {
      score += 2;
    }
    if (negocio.gmapsReviews >= 50) {
      score += 2;
    }
  }
  if (negocio.telefono) score += 1;
  if (negocio.instagram) {
    score += 2;
    if (negocio.estadoPresencia === "SOLO_RRSS") {
      razones.push("Tiene Instagram activo pero no web profesional");
    }
  }

  // Cap at 100
  score = Math.min(score, 100);

  // Determine level
  let nivelOportunidad: ScoringResult["nivelOportunidad"];
  if (score >= 80) nivelOportunidad = "ALTA";
  else if (score >= 60) nivelOportunidad = "MEDIA_ALTA";
  else if (score >= 40) nivelOportunidad = "MEDIA";
  else if (score >= 20) nivelOportunidad = "BAJA";
  else nivelOportunidad = "NO_PRIORITARIO";

  return { score, nivelOportunidad, razones };
}
