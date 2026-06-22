// ============================================================
// Scoring: gates duros + score 0–100 sobre el blueprint.
// Devuelve { passed, score, breakdown, reasons }.
// ============================================================

import { GATES, WEIGHTS } from "./config.js";

export function applyGates(p, chainCounts) {
  const reasons = [];
  if ((chainCounts.get(p._normName) || 0) > GATES.maxChainBranches) reasons.push("cadena/franquicia");
  // Instagram: no hay reseñas/rating; gate por seguidores (negocio real con audiencia).
  if (p.source === "instagram") {
    if ((Number(p.followers) || 0) < GATES.minFollowers) reasons.push(`<${GATES.minFollowers} seguidores`);
    return { passed: reasons.length === 0, reasons };
  }
  if (p.businessStatus && p.businessStatus !== "OPERATIONAL") reasons.push("no operativo");
  if (p.reviews < GATES.minReviews) reasons.push(`<${GATES.minReviews} reviews`);
  if (p.rating < GATES.minRating) reasons.push(`rating <${GATES.minRating}`);
  return { passed: reasons.length === 0, reasons };
}

export function scorePlace(p) {
  const b = {};

  // presencia_web (máx 35)
  if (p.webState === "none") b.web = WEIGHTS.webNone;
  else if (p.webState === "social") b.web = WEIGHTS.webSocialOnly;
  else if (p.webState === "own" && p.webAlive === false) b.web = WEIGHTS.webOwnBroken;
  else b.web = WEIGHTS.webOwnOk;

  // salud_negocio (máx 20)
  if (p.rating >= 4.5 && p.reviews >= 50) b.health = WEIGHTS.health4_5;
  else if (p.rating >= 4.2 && p.reviews >= 20) b.health = WEIGHTS.health4_2;
  else if (p.rating >= 4.0 && p.reviews >= 20) b.health = WEIGHTS.health4_0;
  else b.health = 0;

  // fotos (máx 15)
  if (p.photos <= 5) b.photos = WEIGHTS.photosFew;
  else if (p.photos <= 15) b.photos = WEIGHTS.photosMid;
  else b.photos = WEIGHTS.photosMany;

  // perfil_descuidado (máx 15)
  b.ownerReplies = p.ownerReplies === 0 ? WEIGHTS.ownerNoReplies : 0; // (enrich)
  b.hours = p.hasHours ? 0 : WEIGHTS.noHours;

  // actividad_reciente (máx 10) — (enrich)
  if (p.lastReviewDays === null || p.lastReviewDays === undefined) b.recency = 0;
  else if (p.lastReviewDays <= 90) b.recency = WEIGHTS.reviewFresh;
  else if (p.lastReviewDays <= 180) b.recency = WEIGHTS.reviewMid;
  else b.recency = 0;

  // sin_reclamar (máx 5)
  b.unclaimed = p.verified ? 0 : WEIGHTS.unclaimed;

  const score = Object.values(b).reduce((a, x) => a + x, 0);
  return { score, breakdown: b };
}

// Etiqueta legible del estado web para el pitch.
export function webLabel(state) {
  return {
    none: "Sin presencia (ni web ni redes)",
    social: "Solo Instagram/Facebook",
    own: "Web propia",
  }[state] || state;
}
