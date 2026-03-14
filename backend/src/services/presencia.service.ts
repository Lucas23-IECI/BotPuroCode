import dns from "node:dns/promises";
import { URL } from "node:url";

interface PresenciaResult {
  dominioExiste: boolean;
  dominioResponde: boolean;
  httpStatus: number | null;
  redirectUrl: string | null;
  estadoPresencia: "SIN_WEB" | "SOLO_RRSS" | "LINK_EXTERNO" | "WEB_BASICA" | "WEB_MEDIA" | "WEB_BUENA" | "PENDIENTE";
  tipoLinkExt: string | null;
}

const PLATFORM_PATTERNS: Record<string, RegExp> = {
  agendapro: /agendapro\.com/i,
  linktree: /linktr\.ee/i,
  calendly: /calendly\.com/i,
  reservo: /reservo\.cl/i,
  google_sites: /sites\.google\.com/i,
  blogger: /blogspot\.com/i,
};

const SOCIAL_PATTERNS: Record<string, RegExp> = {
  instagram: /instagram\.com/i,
  facebook: /facebook\.com|fb\.com/i,
  tiktok: /tiktok\.com/i,
};

export async function checkPresencia(
  sitioWeb?: string | null,
  instagram?: string | null,
  facebook?: string | null,
  linkExterno?: string | null
): Promise<PresenciaResult> {
  const result: PresenciaResult = {
    dominioExiste: false,
    dominioResponde: false,
    httpStatus: null,
    redirectUrl: null,
    estadoPresencia: "PENDIENTE",
    tipoLinkExt: null,
  };

  // Check for external platforms
  if (linkExterno) {
    for (const [platform, pattern] of Object.entries(PLATFORM_PATTERNS)) {
      if (pattern.test(linkExterno)) {
        result.estadoPresencia = "LINK_EXTERNO";
        result.tipoLinkExt = platform;
        return result;
      }
    }
  }

  // If no website, check social media
  if (!sitioWeb || sitioWeb.trim() === "") {
    if (instagram || facebook) {
      result.estadoPresencia = "SOLO_RRSS";
    } else {
      result.estadoPresencia = "SIN_WEB";
    }
    return result;
  }

  // Check if the "website" is actually a social media profile
  for (const [, pattern] of Object.entries(SOCIAL_PATTERNS)) {
    if (pattern.test(sitioWeb)) {
      result.estadoPresencia = "SOLO_RRSS";
      return result;
    }
  }

  // Check if the "website" is actually an external platform
  for (const [platform, pattern] of Object.entries(PLATFORM_PATTERNS)) {
    if (pattern.test(sitioWeb)) {
      result.estadoPresencia = "LINK_EXTERNO";
      result.tipoLinkExt = platform;
      return result;
    }
  }

  // Has a real website URL — check DNS
  try {
    const url = new URL(sitioWeb.startsWith("http") ? sitioWeb : `https://${sitioWeb}`);
    const hostname = url.hostname;

    await dns.lookup(hostname);
    result.dominioExiste = true;

    // Check if it responds
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "BotPuroCode/1.0 (+https://purocode.com/bot; herramienta interna de analisis web)",
        },
      });

      clearTimeout(timeout);
      result.dominioResponde = true;
      result.httpStatus = response.status;

      if (response.redirected) {
        result.redirectUrl = response.url;
        // Check if it redirected to a social platform
        for (const [, pattern] of Object.entries(SOCIAL_PATTERNS)) {
          if (pattern.test(response.url)) {
            result.estadoPresencia = "SOLO_RRSS";
            return result;
          }
        }
        for (const [platform, pattern] of Object.entries(PLATFORM_PATTERNS)) {
          if (pattern.test(response.url)) {
            result.estadoPresencia = "LINK_EXTERNO";
            result.tipoLinkExt = platform;
            return result;
          }
        }
      }

      // Domain exists and responds — will be classified further by technical analysis
      result.estadoPresencia = "WEB_BASICA"; // default, upgraded or downgraded by analysis
    } catch {
      clearTimeout(timeout);
      result.dominioResponde = false;
      result.estadoPresencia = "SIN_WEB";
    }
  } catch {
    result.dominioExiste = false;
    result.estadoPresencia = "SIN_WEB";
  }

  return result;
}
