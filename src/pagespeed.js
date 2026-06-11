// ============================================================
// pageSpeed(url) — scores reales de Lighthouse vía PageSpeed Insights API
// (performance, SEO, accesibilidad, best-practices) en mobile.
// Gratis; con PSI_KEY sube el límite a 25k/día. Cacheado en memoria.
// Es lento (10-30s), por eso se llama on-demand, no en el scan masivo.
// ============================================================

const cache = new Map(); // url -> { ts, data }
const TTL = 6 * 3600 * 1000;

export async function pageSpeed(url) {
  if (!url) return { error: "sin url" };
  const full = url.startsWith("http") ? url : "https://" + url;
  const hit = cache.get(full);
  if (hit && Date.now() - hit.ts < TTL) return hit.data;

  const key = process.env.PSI_KEY || "";
  const api = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=" +
    encodeURIComponent(full) +
    "&strategy=mobile&category=performance&category=seo&category=accessibility&category=best-practices" +
    (key ? `&key=${key}` : "");

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 32000);
    const res = await fetch(api, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) {
      const data = { error: `PSI ${res.status}` };
      return data;
    }
    const j = await res.json();
    const cat = (j.lighthouseResult && j.lighthouseResult.categories) || {};
    const pct = (c) => (c && typeof c.score === "number" ? Math.round(c.score * 100) : null);
    const data = {
      perf: pct(cat.performance),
      seo: pct(cat.seo),
      a11y: pct(cat.accessibility),
      bp: pct(cat["best-practices"]),
    };
    cache.set(full, { ts: Date.now(), data });
    return data;
  } catch (e) {
    return { error: e.name === "AbortError" ? "timeout" : (e.message || "error") };
  }
}
