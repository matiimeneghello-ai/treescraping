// ============================================================
// buildKit(candidate, demoUrl) -> { emailSubject, emailBody, whatsapp,
//   analysis[], valueProps[] }  para el outreach, listo para copy-paste.
// El análisis se arma según lo que realmente le falta al negocio
// (sale del scoring), no es genérico.
// ============================================================

import { fill } from "./fill.js";
import { COPY, resolveRubro } from "./content.js";

export function buildKit(p, demoUrl) {
  const tokens = {
    NAME: p.name,
    NEIGHBORHOOD: p.borough || "tu zona",
    RATING: p.rating ?? "",
    REVIEWS: p.reviews ?? "",
    RUBRO: resolveRubro(p).label || "tu rubro",
    DEMO_URL: demoUrl,
  };

  // Selección de diagnóstico según el perfil real del candidato.
  const ps = COPY.painSentences;
  const analysis = [];
  if (p.webState === "none") analysis.push(ps.noWeb);
  else if (p.webState === "social") analysis.push(ps.socialOnly);
  if (Number(p.photos) <= 5) analysis.push(ps.fewPhotos);
  if (p.verified === false) analysis.push(ps.unclaimed);
  if (Number(p.rating) >= 4.5 && Number(p.reviews) >= 50) analysis.push(ps.strongDemand);

  return {
    emailSubject: fill(COPY.emailSubject, tokens),
    emailBody: fill(COPY.emailBody, tokens),
    whatsapp: fill(COPY.whatsapp, tokens),
    analysis: analysis.filter(Boolean).map((s) => fill(s, tokens)),
    valueProps: COPY.valueProps || [],
    // para abrir WhatsApp con el mensaje pre-cargado (fallback al teléfono crudo,
    // que ya trae el código de país, para datos viejos sin phoneIntl)
    waPhone: p.phoneIntl || String(p.phone || "").replace(/[^0-9]/g, ""),
  };
}
