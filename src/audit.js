// ============================================================
// auditSite(url) — trae el HTML de un sitio y mide señales reales
// para diagnosticar qué le falta (SEO, mobile, redes, etc.).
// Sin dependencias: parsing por regex sobre el HTML.
// Devuelve un objeto de señales; nunca tira (best-effort).
// ============================================================

const SOCIAL_RE = /(instagram\.com|facebook\.com|fb\.com|tiktok\.com|wa\.me|api\.whatsapp\.com)/i;
const EMAIL_BAD = /\.(png|jpe?g|gif|svg|webp|css|js|ico|woff2?)$|sentry|wixpress|example\.|schema\.org|w3\.org|googleapis|cloudflare|@2x|@3x|\.0[0-9]|placeholder|tu-?email|your-?email|^email@|nombre@|@dominio|@tudominio|@email\./i;

function findEmails(html, finalUrl) {
  const emails = new Set();
  for (const m of html.matchAll(/mailto:([^"'?>\s]+@[^"'?>\s]+)/gi)) {
    try { emails.add(decodeURIComponent(m[1]).toLowerCase().trim()); } catch { emails.add(m[1].toLowerCase()); }
  }
  for (const m of html.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)) emails.add(m[0].toLowerCase());
  let host = "";
  try { host = new URL(finalUrl).hostname.replace(/^www\./, ""); } catch {}
  return [...emails]
    .filter((e) => e.length >= 6 && e.length < 70 && !EMAIL_BAD.test(e))
    .sort((a, b) => (host && b.endsWith("@" + host) ? 1 : 0) - (host && a.endsWith("@" + host) ? 1 : 0));
}

async function fetchPageEmails(url) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 7000);
    const res = await fetch(url, { redirect: "follow", signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 (compatible; TreeProspect/1.0)" } });
    clearTimeout(t);
    if (!res.ok) return [];
    const html = (await res.text()).slice(0, 300000);
    return findEmails(html, res.url || url);
  } catch { return []; }
}

function textWordCount(html) {
  const txt = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return txt ? txt.split(" ").length : 0;
}

export async function auditSite(url) {
  const out = {
    checked: true, reachable: false, https: false, status: 0, finalUrl: "",
    hasTitle: false, titleLen: 0, hasMetaDesc: false, hasViewport: false,
    hasSchema: false, hasOG: false, hasH1: false, social: [], words: 0,
    hasPixel: false, hasGA: false, copyrightYear: null, emails: [],
    error: null,
  };
  if (!url) { out.checked = false; return out; }
  const full = url.startsWith("http") ? url : "https://" + url;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 9000);
    const res = await fetch(full, {
      method: "GET", redirect: "follow", signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TreeProspect/1.0)" },
    });
    clearTimeout(t);
    out.status = res.status;
    out.finalUrl = res.url || full;
    out.https = out.finalUrl.startsWith("https://");
    out.reachable = res.status >= 200 && res.status < 400;
    if (!out.reachable) return out;

    // Leer hasta ~400KB para no colgarse en sitios pesados.
    const reader = res.body?.getReader?.();
    let html = "";
    if (reader) {
      const dec = new TextDecoder();
      let size = 0;
      while (size < 400000) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        html += dec.decode(value, { stream: true });
      }
      try { reader.cancel(); } catch {}
    } else {
      html = await res.text();
    }

    const lower = html.toLowerCase();
    const titleM = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    out.hasTitle = !!(titleM && titleM[1].trim());
    out.titleLen = titleM ? titleM[1].trim().length : 0;
    out.hasMetaDesc = /<meta[^>]+name=["']description["'][^>]*content=["'][^"']{1,}["']/i.test(html);
    out.hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
    out.hasOG = /<meta[^>]+property=["']og:/i.test(html);
    out.hasH1 = /<h1[\s>]/i.test(html);
    out.hasSchema = lower.includes("application/ld+json") &&
      /"@type"\s*:\s*"(localbusiness|dentist|store|restaurant|professionalservice|realestateagent|[a-z]*business)"/i.test(html);
    const socials = new Set();
    for (const m of html.matchAll(/https?:\/\/[^"'\s>]+/gi)) {
      const sm = m[0].match(SOCIAL_RE);
      if (sm) socials.add(sm[1].toLowerCase().replace("www.", ""));
    }
    out.social = [...socials];
    out.words = textWordCount(html);
    // Señales de marketing: pixel de Meta, Google Analytics, antigüedad del footer.
    out.hasPixel = /fbq\(|connect\.facebook\.net\/[^"']*fbevents/i.test(html);
    out.hasGA = /gtag\(|googletagmanager\.com\/gtag|google-analytics\.com\/(analytics|ga)\.js/i.test(html);
    const cy = html.match(/(?:©|&copy;|copyright)[^0-9]{0,14}(20[0-9]{2})/i);
    out.copyrightYear = cy ? Number(cy[1]) : null;
    // Emails de contacto: de la home, y si no hay, de la página de contacto.
    out.emails = findEmails(html, out.finalUrl);
    if (!out.emails.length) {
      const base = out.finalUrl.replace(/\/+$/, "");
      for (const path of ["/contacto", "/contact", "/contacto/", "/contactanos", "/contacto.html"]) {
        const found = await fetchPageEmails(base + path);
        if (found.length) { out.emails = found; break; }
      }
    }
  } catch (e) {
    out.error = e.name === "AbortError" ? "timeout" : (e.message || "fetch error");
  }
  return out;
}
