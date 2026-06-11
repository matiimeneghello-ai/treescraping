// ============================================================
// Normalización: mapea el item del actor de Apify
// (compass/crawler-google-places) a un objeto limpio y clasifica
// el estado del website (own/social/none).
// ============================================================

import { SOCIAL_HOSTS } from "./config.js";

export function classifyWebsite(site) {
  if (!site || typeof site !== "string" || !site.trim()) return "none";
  const s = site.toLowerCase();
  if (SOCIAL_HOSTS.some((h) => s.includes(h))) return "social";
  return "own";
}

const DAY = 86400000;

// Extrae respuestas del dueño y antigüedad de la review más nueva
// desde el array reviews[] del item (sólo viene si maxReviews > 0).
function reviewSignals(reviews, now) {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return { ownerReplies: null, lastReviewDays: null };
  }
  const replies = reviews.filter((r) => r.responseFromOwnerText).length;
  const dates = reviews
    .map((r) => Date.parse(r.publishedAtDate))
    .filter((t) => !Number.isNaN(t));
  const newest = dates.length ? Math.max(...dates) : null;
  return {
    ownerReplies: replies,
    lastReviewDays: newest ? Math.round((now - newest) / DAY) : null,
  };
}

export function normalizePlace(raw, now = Date.now()) {
  const site = raw.website || "";
  const rating = Number(raw.totalScore ?? 0) || 0;
  const reviews = Number(raw.reviewsCount ?? 0) || 0;
  const photos = Number(raw.imagesCount ?? 0) || 0;

  // claimThisBusiness === true  => muestra "Reclamar este negocio" => NO reclamado.
  const unclaimed = raw.claimThisBusiness === true;

  const oh = raw.openingHours;
  const hasHours = Array.isArray(oh) ? oh.length > 0 : !!oh;

  const closed = raw.permanentlyClosed === true || raw.temporarilyClosed === true;

  const { ownerReplies, lastReviewDays } = reviewSignals(raw.reviews, now);

  return {
    placeId: raw.placeId || raw.cid || raw.fid,
    name: raw.title || "(sin nombre)",
    rubro: raw.searchString || "",
    category: raw.categoryName || (Array.isArray(raw.categories) ? raw.categories[0] : ""),
    address: raw.address || "",
    borough: raw.neighborhood || raw.city || "",
    phone: raw.phone || raw.phoneUnformatted || "",
    site,
    webState: classifyWebsite(site),
    rating,
    reviews,
    photos,
    verified: !unclaimed,
    hasHours,
    businessStatus: closed ? "CLOSED" : "OPERATIONAL",
    lat: raw.location?.lat,
    lng: raw.location?.lng,
    mapsUrl: raw.url || (raw.placeId ? `https://www.google.com/maps/place/?q=place_id:${raw.placeId}` : ""),
    ownerReplies,
    lastReviewDays,
  };
}

// Normaliza un nombre para detectar cadenas (mismo comercio repetido).
export function normName(name) {
  return (name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\b(sucursal|suc|local|sa|srl|s a|s r l)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Chequea si una web propia responde (HEAD). Devuelve true si 2xx/3xx.
export async function isWebsiteAlive(url) {
  try {
    const u = url.startsWith("http") ? url : "https://" + url;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(u, { method: "HEAD", redirect: "follow", signal: ctrl.signal });
    clearTimeout(t);
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
}
