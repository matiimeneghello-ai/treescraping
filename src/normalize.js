// ============================================================
// Normalización: mapea el registro crudo de Outscraper a un objeto
// limpio y clasifica el estado del website (own/social/none).
// ============================================================

import { SOCIAL_HOSTS } from "./config.js";

// Outscraper varía algunos nombres de campo según endpoint/versión.
// Tomamos el primero que exista.
const pick = (o, ...keys) => {
  for (const k of keys) {
    if (o[k] !== undefined && o[k] !== null && o[k] !== "") return o[k];
  }
  return undefined;
};

export function classifyWebsite(site) {
  if (!site || typeof site !== "string" || !site.trim()) return "none";
  const s = site.toLowerCase();
  if (SOCIAL_HOSTS.some((h) => s.includes(h))) return "social";
  return "own";
}

export function normalizePlace(raw) {
  const site = pick(raw, "site", "website", "web", "url");
  const rating = Number(pick(raw, "rating") ?? 0) || 0;
  const reviews = Number(pick(raw, "reviews", "reviews_count", "user_ratings_total") ?? 0) || 0;
  const photos = Number(pick(raw, "photos_count", "photos") ?? 0) || 0;

  // `verified`: en Outscraper, true = ficha reclamada por el dueño.
  let verified = pick(raw, "verified");
  if (typeof verified === "string") verified = verified.toLowerCase() === "true";

  const hours = pick(raw, "working_hours", "working_hours_old_format", "hours");
  const hasHours = !!hours && (typeof hours === "object" ? Object.keys(hours).length > 0 : String(hours).trim() !== "");

  return {
    placeId: pick(raw, "place_id", "google_id", "place_id_2"),
    name: pick(raw, "name", "title") || "(sin nombre)",
    rubro: pick(raw, "query") || "",   // Outscraper devuelve la query origen
    category: pick(raw, "category", "type", "subtypes"),
    address: pick(raw, "full_address", "address", "formatted_address"),
    borough: pick(raw, "borough", "city"),
    phone: pick(raw, "phone", "phone_1", "international_phone_number"),
    site: site || "",
    webState: classifyWebsite(site),
    rating,
    reviews,
    photos,
    verified: verified === true,
    hasHours,
    reviewsLink: pick(raw, "reviews_link"),
    businessStatus: (pick(raw, "business_status") || "OPERATIONAL").toUpperCase(),
    lat: pick(raw, "latitude", "lat"),
    lng: pick(raw, "longitude", "lng"),
    mapsUrl: pick(raw, "location_link", "place_link") ||
      (pick(raw, "place_id") ? `https://www.google.com/maps/place/?q=place_id:${pick(raw, "place_id")}` : ""),
    // campos que completa el enriquecimiento de reviews:
    ownerReplies: null,
    lastReviewDays: null,
    _raw: undefined, // se setea afuera si se quiere conservar
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
