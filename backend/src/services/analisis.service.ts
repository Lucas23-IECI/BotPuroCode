import * as cheerio from "cheerio";

export interface AnalisisTecnicoResult {
  tieneSSL: boolean;
  esResponsive: boolean;
  tecnologia: string | null;
  plantillaGenerica: boolean;
  tieneFormulario: boolean;
  tieneCTA: boolean;
  tieneWhatsappWidget: boolean;
  tieneFavicon: boolean;
  tieneTitle: boolean;
  titleText: string | null;
  tieneMetaDesc: boolean;
  metaDescText: string | null;
  tieneH1: boolean;
  tieneSitemap: boolean;
  tieneRobotsTxt: boolean;
  errores: string[];
}

const USER_AGENT = "BotPuroCode/1.0 (+https://purocode.com/bot; herramienta interna de analisis web)";

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

function detectTecnologia(html: string, headers: Headers): { tech: string | null; isGeneric: boolean } {
  const lowerHtml = html.toLowerCase();

  // WordPress
  if (
    lowerHtml.includes("wp-content") ||
    lowerHtml.includes("wp-includes") ||
    /meta.*generator.*wordpress/i.test(html)
  ) {
    const isGeneric =
      /twenty\s*twenty/i.test(html) ||
      /flavor|flavor-developer/i.test(html) ||
      /flavor\.developer/i.test(html);
    return { tech: "wordpress", isGeneric };
  }

  // Wix
  if (lowerHtml.includes("wixstatic.com") || lowerHtml.includes("parastorage.com") || /generator.*wix/i.test(html)) {
    return { tech: "wix", isGeneric: true };
  }

  // Shopify
  if (lowerHtml.includes("cdn.shopify.com") || /shopify/i.test(headers.get("x-powered-by") || "")) {
    return { tech: "shopify", isGeneric: false };
  }

  // Squarespace
  if (lowerHtml.includes("squarespace.com") || /generator.*squarespace/i.test(html)) {
    return { tech: "squarespace", isGeneric: false };
  }

  // Google Sites
  if (lowerHtml.includes("sites.google.com")) {
    return { tech: "google_sites", isGeneric: true };
  }

  // Blogger
  if (lowerHtml.includes("blogspot.com") || /generator.*blogger/i.test(html)) {
    return { tech: "blogger", isGeneric: true };
  }

  // Webflow
  if (lowerHtml.includes("webflow.com") || /generator.*webflow/i.test(html)) {
    return { tech: "webflow", isGeneric: false };
  }

  // Joomla
  if (lowerHtml.includes("/media/jui/") || /generator.*joomla/i.test(html)) {
    return { tech: "joomla", isGeneric: false };
  }

  // Static HTML (very minimal)
  const scriptTags = (html.match(/<script/gi) || []).length;
  const styleTags = (html.match(/<link[^>]*stylesheet/gi) || []).length;
  if (scriptTags <= 1 && styleTags <= 1 && html.length < 10000) {
    return { tech: "html_estatico", isGeneric: true };
  }

  return { tech: null, isGeneric: false };
}

export async function analizarSitio(url: string): Promise<AnalisisTecnicoResult> {
  const result: AnalisisTecnicoResult = {
    tieneSSL: false,
    esResponsive: false,
    tecnologia: null,
    plantillaGenerica: false,
    tieneFormulario: false,
    tieneCTA: false,
    tieneWhatsappWidget: false,
    tieneFavicon: false,
    tieneTitle: false,
    titleText: null,
    tieneMetaDesc: false,
    metaDescText: null,
    tieneH1: false,
    tieneSitemap: false,
    tieneRobotsTxt: false,
    errores: [],
  };

  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(normalizedUrl);
  } catch {
    result.errores.push("URL inválida");
    return result;
  }

  const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;

  // SSL check
  result.tieneSSL = parsedUrl.protocol === "https:";

  // Fetch HTML
  let html: string;
  let headers: Headers;
  try {
    const response = await fetchWithTimeout(normalizedUrl);
    html = await response.text();
    headers = response.headers;
  } catch {
    result.errores.push("No se pudo obtener el HTML del sitio");
    return result;
  }

  const $ = cheerio.load(html);

  // Responsive check
  result.esResponsive =
    $('meta[name="viewport"]').length > 0 || html.includes("@media");

  // Technology detection
  const { tech, isGeneric } = detectTecnologia(html, headers);
  result.tecnologia = tech;
  result.plantillaGenerica = isGeneric;

  // Form detection
  result.tieneFormulario = $("form").length > 0;

  // CTA detection
  const ctaPatterns = /contacto|cotizar|reservar|agendar|comprar|pedir|solicitar|enviar/i;
  result.tieneCTA =
    $("a, button")
      .toArray()
      .some((el) => ctaPatterns.test($(el).text())) || result.tieneFormulario;

  // WhatsApp widget
  result.tieneWhatsappWidget =
    html.includes("wa.me") ||
    html.includes("api.whatsapp.com") ||
    html.includes("whatsapp") ||
    $('[href*="wa.me"], [href*="whatsapp"]').length > 0;

  // Favicon
  result.tieneFavicon =
    $('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').length > 0;

  // SEO — Title
  const title = $("title").first().text().trim();
  result.tieneTitle = title.length > 0;
  result.titleText = title || null;

  // SEO — Meta description
  const metaDesc = $('meta[name="description"]').attr("content")?.trim();
  result.tieneMetaDesc = !!metaDesc && metaDesc.length > 0;
  result.metaDescText = metaDesc || null;

  // SEO — H1
  result.tieneH1 = $("h1").length > 0;

  // Check sitemap.xml and robots.txt in parallel
  const [sitemapRes, robotsRes] = await Promise.allSettled([
    fetchWithTimeout(`${baseUrl}/sitemap.xml`, 5000),
    fetchWithTimeout(`${baseUrl}/robots.txt`, 5000),
  ]);

  result.tieneSitemap =
    sitemapRes.status === "fulfilled" &&
    sitemapRes.value.ok &&
    (sitemapRes.value.headers.get("content-type")?.includes("xml") ?? false);

  result.tieneRobotsTxt = robotsRes.status === "fulfilled" && robotsRes.value.ok;

  // Collect error reasons
  if (!result.tieneSSL) result.errores.push("Sin certificado SSL (HTTP)");
  if (!result.esResponsive) result.errores.push("No es responsive (sin viewport meta)");
  if (!result.tieneFormulario) result.errores.push("Sin formulario de contacto");
  if (!result.tieneCTA) result.errores.push("Sin llamada a la acción clara");
  if (!result.tieneFavicon) result.errores.push("Sin favicon");
  if (!result.tieneTitle) result.errores.push("Sin title tag");
  if (!result.tieneMetaDesc) result.errores.push("Sin meta description");
  if (!result.tieneH1) result.errores.push("Sin H1");
  if (!result.tieneSitemap) result.errores.push("Sin sitemap.xml");
  if (result.plantillaGenerica) result.errores.push(`Usa plantilla genérica (${result.tecnologia})`);

  return result;
}
