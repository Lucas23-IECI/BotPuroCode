const USER_AGENT = "BotPuroCode/1.0 (+https://purocode.com/bot; herramienta interna de analisis web)";

export interface PageSpeedResult {
  performanceScore: number | null;
  lcpMs: number | null;
  fcpMs: number | null;
  cls: number | null;
}

export async function checkPageSpeed(
  url: string,
  apiKey?: string
): Promise<PageSpeedResult> {
  const result: PageSpeedResult = {
    performanceScore: null,
    lcpMs: null,
    fcpMs: null,
    cls: null,
  };

  if (!apiKey) return result;

  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
  const apiUrl = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  apiUrl.searchParams.set("url", normalizedUrl);
  apiUrl.searchParams.set("key", apiKey);
  apiUrl.searchParams.set("strategy", "mobile");
  apiUrl.searchParams.set("category", "performance");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(apiUrl.toString(), {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    });

    clearTimeout(timeout);

    if (!response.ok) return result;

    const data = await response.json() as {
      lighthouseResult?: {
        categories?: {
          performance?: { score?: number };
        };
        audits?: {
          "largest-contentful-paint"?: { numericValue?: number };
          "first-contentful-paint"?: { numericValue?: number };
          "cumulative-layout-shift"?: { numericValue?: number };
        };
      };
    };

    const lighthouse = data.lighthouseResult;
    if (!lighthouse) return result;

    const perfScore = lighthouse.categories?.performance?.score;
    if (perfScore != null) {
      result.performanceScore = Math.round(perfScore * 100);
    }

    result.lcpMs = lighthouse.audits?.["largest-contentful-paint"]?.numericValue ?? null;
    result.fcpMs = lighthouse.audits?.["first-contentful-paint"]?.numericValue ?? null;
    result.cls = lighthouse.audits?.["cumulative-layout-shift"]?.numericValue ?? null;
  } catch {
    // Silently fail — PageSpeed is optional
  }

  return result;
}
