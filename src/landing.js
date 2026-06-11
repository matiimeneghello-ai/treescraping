// ============================================================
// renderLanding(candidate) -> HTML completo de la demo del negocio.
// Llena el template premium con datos reales del candidato e inyecta
// las tarjetas de servicios según el rubro.
// ============================================================

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./pipeline.js";
import { fill, esc, norm, waLink } from "./fill.js";
import { RUBROS_CONTENT } from "./content.js";

const TEMPLATE = readFileSync(join(ROOT, "src", "landing-template.html"), "utf8");

function rubroContent(candidate) {
  const hay = norm(`${candidate.rubro || ""} ${candidate.category || ""}`);
  return (
    RUBROS_CONTENT.find((r) => r.slug !== "generico" && hay.includes(norm(r.slug))) ||
    RUBROS_CONTENT.find((r) => r.slug === "generico") ||
    RUBROS_CONTENT[0]
  );
}

function servicesHtml(content) {
  return (
    `<div class="svc-grid">` +
    content.services
      .map((s) => `<div class="svc-card"><h3 class="svc-title">${esc(s.title)}</h3><p class="svc-desc">${esc(s.desc)}</p></div>`)
      .join("") +
    `</div>`
  );
}

export function renderLanding(p) {
  const content = rubroContent(p);
  const wa = waLink(p.phone);
  const phoneRaw = String(p.phone || "").replace(/[^0-9]/g, "");
  const tokens = {
    NAME: esc(p.name),
    TAGLINE: esc(content.tagline),
    RUBRO: esc((p.rubro || content.slug).split(" en ")[0]),
    NEIGHBORHOOD: esc(p.borough || ""),
    CITY: "CABA",
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
  return fill(TEMPLATE, tokens);
}
