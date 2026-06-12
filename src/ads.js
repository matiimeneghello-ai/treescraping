// ============================================================
// Detección de anuncios. Dos señales:
// 1) PIXEL (confiable, ya viene del audit): si el sitio tiene el pixel de
//    Meta instalado está "listo para pautar"; si no, ni puede medir.
// 2) Meta Ad Library (live): cuántos anuncios activos tiene el negocio.
//    Requiere META_AD_TOKEN (token de Meta). Sin token, se omite.
//    Nota: la cobertura de anuncios comerciales por país varía.
// ============================================================

const cache = new Map();
const TTL = 12 * 3600 * 1000;

export async function metaAds(name, country = "AR") {
  const token = process.env.META_AD_TOKEN || process.env.META_ACCESS_TOKEN;
  if (!token) return { checked: false, reason: "sin META_AD_TOKEN" };
  if (!name) return { checked: false };
  const key = `${name}|${country}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL) return hit.data;

  const url = "https://graph.facebook.com/v19.0/ads_archive?" + new URLSearchParams({
    search_terms: name,
    ad_reached_countries: `["${country}"]`,
    ad_active_status: "ACTIVE",
    fields: "id,page_name",
    limit: "30",
    access_token: token,
  });
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    const j = await res.json();
    if (j.error) {
      const data = { checked: true, error: j.error.message || "error", activeAds: null };
      return data;
    }
    const data = { checked: true, activeAds: Array.isArray(j.data) ? j.data.length : 0 };
    cache.set(key, { ts: Date.now(), data });
    return data;
  } catch (e) {
    return { checked: true, error: e.name === "AbortError" ? "timeout" : e.message, activeAds: null };
  }
}

// Resumen de "ad readiness" combinando pixel (del audit) + ad library.
export function adSignal(candidate, ads) {
  const a = candidate.audit;
  const hasPixel = !!(a && a.hasPixel);
  const out = { hasPixel, activeAds: ads && typeof ads.activeAds === "number" ? ads.activeAds : null };
  if (out.activeAds != null && out.activeAds > 0)
    out.label = `Corre ${out.activeAds} anuncio${out.activeAds > 1 ? "s" : ""} activo${out.activeAds > 1 ? "s" : ""}`;
  else if (out.activeAds === 0)
    out.label = hasPixel ? "No está pautando (pero tiene el pixel listo)" : "No está pautando ni tiene pixel instalado";
  else
    out.label = hasPixel ? "Tiene el pixel de Meta instalado" : "No tiene el pixel de Meta instalado";
  return out;
}
