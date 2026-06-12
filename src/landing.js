// ============================================================
// renderLanding(candidate) -> HTML completo de la demo del negocio.
// Llena el template premium con datos reales del candidato e inyecta
// las tarjetas de servicios según el rubro.
// ============================================================

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./pipeline.js";
import { existsSync } from "node:fs";
import { fill, esc, waLink, localizeES } from "./fill.js";
import { resolveRubro, brandName, regionOf } from "./content.js";

// Un template por rubro (cacheado). Fallback al genérico, y a un
// template viejo si los nuevos no estuvieran presentes.
const _cache = {};
function loadTemplate(file) {
  if (_cache[file] !== undefined) return _cache[file];
  const path = join(ROOT, "src", file);
  const fallback = join(ROOT, "src", "landing-generico.html");
  const legacy = join(ROOT, "src", "landing-template.html");
  const use = existsSync(path) ? path : existsSync(fallback) ? fallback : legacy;
  _cache[file] = readFileSync(use, "utf8");
  return _cache[file];
}

// Inyecta SOLO las tarjetas (sin envolver en .svc-grid): los templates ya
// ponen el contenedor <div class="svc-grid"> alrededor de {{SERVICES_HTML}}.
function servicesHtml(content) {
  return content.services
    .map((s) => `<div class="svc-card"><h3 class="svc-title">${esc(s.title)}</h3><p class="svc-desc">${esc(s.desc)}</p></div>`)
    .join("");
}

export function renderLanding(p) {
  const content = resolveRubro(p);
  const TEMPLATE = loadTemplate(content.template || "landing-generico.html");
  const phoneRaw = p.phoneIntl || String(p.phone || "").replace(/[^0-9]/g, "");
  const wa = waLink(phoneRaw);
  const brand = brandName(p);
  const tokens = {
    NAME: esc(brand),
    INITIAL: esc((brand.trim()[0] || "•").toUpperCase()),
    TAGLINE: esc(content.tagline),
    RUBRO: esc(content.label || content.slug),
    NEIGHBORHOOD: esc(p.borough || p.city || ""),
    CITY: esc(p.city || p.borough || ""),
    PHONE: esc(p.phone || ""),
    PHONE_RAW: phoneRaw,
    WHATSAPP_LINK: wa || (p.mapsUrl || "#"),
    RATING: esc(p.rating ?? ""),
    REVIEWS: esc(p.reviews ?? ""),
    ADDRESS: esc(p.address || ""),
    MAPS_URL: esc(p.mapsUrl || "#"),
    YEAR: String(new Date().getFullYear()),
    ABOUT: esc(content.about),
    SERVICES_HTML: servicesHtml(content), // ya viene escapado por campo
  };
  const html = fill(TEMPLATE, tokens);
  return regionOf(p) !== "ar" ? localizeES(html) : html;
}
