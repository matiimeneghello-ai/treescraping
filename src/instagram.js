// ============================================================
// Fuente Instagram (Apify apify/instagram-scraper). Busca perfiles de
// negocios por rubro+zona y los normaliza a la forma de candidato.
// Los leads de IG no tienen reseñas ni teléfono: se contactan por DM.
// Ideal para negocios que están en IG sin web propia (vender web).
// ============================================================

import { runActor } from "./apify.js";
import { classifyWebsite } from "./normalize.js";

const IG_ACTOR = process.env.IG_ACTOR || "apify~instagram-scraper";

// queries = ["peluqueria madrid", "restaurante madrid", ...]
export async function searchInstagram(queries, opts = {}, { onTick } = {}) {
  const perQuery = opts.perQuery || 20;
  const input = {
    search: queries.join(", "),     // el actor acepta términos separados por coma
    searchType: "user",
    searchLimit: Math.min(queries.length * perQuery, 200),
    resultsType: "details",         // queremos info de perfil, no posts
    resultsLimit: 1,
    addParentData: true,
  };
  const items = await runActor(IG_ACTOR, input, { onTick });
  return (items || []).filter((x) => x && (x.username || x.ownerUsername));
}

export function normalizeIgProfile(raw, region) {
  const username = raw.username || raw.ownerUsername || "";
  const ext = String(raw.externalUrl || raw.external_url || "").trim();
  let webState = ext ? classifyWebsite(ext) : "social";
  if (webState === "none") webState = "social"; // tiene IG => al menos social
  const name = raw.fullName || raw.name || username || "(sin nombre)";
  const igUrl = username ? "https://instagram.com/" + username : (raw.url || "");
  return {
    placeId: "ig:" + (username || raw.id || name),
    name,
    // rubro inferido del texto del perfil, para que resolveRubro matchee
    rubro: `${raw.businessCategoryName || ""} ${name} ${raw.biography || ""}`.slice(0, 140),
    category: raw.businessCategoryName || raw.category || "Instagram",
    address: "",
    borough: "", city: "",
    phone: "", phoneIntl: "",
    site: webState === "own" ? ext : "",
    webState,
    rating: "", reviews: 0,
    photos: Number(raw.postsCount ?? 0) || 0,
    followers: Number(raw.followersCount ?? raw.followers ?? 0) || 0,
    verified: true,   // IG no tiene ficha de Google: no aplica "sin reclamar"
    hasHours: true,   // no aplica
    businessStatus: "OPERATIONAL",
    source: "instagram",
    igUrl, igUsername: username,
    bio: raw.biography || "",
    region,
    mapsUrl: igUrl,
  };
}
