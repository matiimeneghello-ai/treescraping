// ============================================================
// buildKit(candidate, dealUrl) -> kit de outreach consciente del servicio
// recomendado: mail + whatsapp adaptados (web/redesign/seo/redes/paid),
// análisis con los hallazgos reales, y el link al deliverable correcto.
// ============================================================

import { fill, competitiveLine } from "./fill.js";
import { serviceCopyOf, copyOf, resolveRubro, brandName } from "./content.js";

export function buildKit(p, dealUrl) {
  const tokens = {
    NAME: brandName(p),
    NEIGHBORHOOD: p.borough || p.city || "tu zona",
    RATING: p.rating ?? "",
    REVIEWS: p.reviews ?? "",
    RUBRO: resolveRubro(p).label || "tu rubro",
    DEAL_URL: dealUrl,
    DEMO_URL: dealUrl, // compat
  };

  const svcKey = (p.primaryService && p.primaryService.key) || "web";
  const SC = serviceCopyOf(p);
  const CO = copyOf(p);
  const copy = SC[svcKey] || SC.web;

  // Análisis: los hallazgos concretos del motor de servicios. Fallback a las
  // frases de presencia para datos viejos sin p.services.
  let analysis;
  const comp = competitiveLine(p, tokens.RUBRO);
  if (p.services && p.services.length) {
    analysis = [...(comp ? [comp] : []), ...p.services.slice(0, 3).map((s) => s.reason)];
  } else {
    const ps = CO.painSentences;
    const list = [];
    if (p.webState === "none") list.push(ps.noWeb);
    else if (p.webState === "social") list.push(ps.socialOnly);
    if (Number(p.photos) <= 5) list.push(ps.fewPhotos);
    if (p.verified === false) list.push(ps.unclaimed);
    if (Number(p.rating) >= 4.5 && Number(p.reviews) >= 50) list.push(ps.strongDemand);
    analysis = list.filter(Boolean).map((s) => fill(s, tokens));
  }

  return {
    service: svcKey,
    serviceLabel: (p.primaryService && p.primaryService.label) || "Sitio web",
    emailSubject: fill(copy.emailSubject, tokens),
    emailBody: fill(copy.emailBody, tokens),
    whatsapp: fill(copy.whatsapp, tokens),
    analysis,
    valueProps: CO.valueProps || [],
    waPhone: p.phoneIntl || String(p.phone || "").replace(/[^0-9]/g, ""),
  };
}
