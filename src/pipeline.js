// ============================================================
// PIPELINE — lógica de scan reutilizable (la usan el CLI y el server web).
//   buscar -> normalizar -> dedupe -> detectar cadenas ->
//   chequear webs -> gates + score -> escribir output/
// ============================================================

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { RUBROS, ZONAS, QUERY, SCORE_THRESHOLD } from "./config.js";
import { searchPlaces } from "./apify.js";
import { searchInstagram, normalizeIgProfile } from "./instagram.js";
import { normalizePlace, normName } from "./normalize.js";
import { applyGates, scorePlace, webLabel } from "./score.js";
import { auditSite } from "./audit.js";
import { recommendServices } from "./services.js";

// Contexto competitivo: para cada negocio, su posición dentro de la cohorte
// (mismo rubro+zona del scan). Es el ángulo de venta más fuerte: "tu competidor
// te está ganando". Usa la data que ya scrapeamos.
export function computeCompetitive(places) {
  const groups = new Map();
  for (const p of places) {
    const k = p.rubro || "(sin rubro)";
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(p);
  }
  for (const list of groups.values()) {
    const size = list.length;
    const byReviews = [...list].sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
    const byRating = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    const withWeb = list.filter((p) => p.webState === "own").length;
    const leader = byReviews[0];
    const avgPhotos = Math.round(list.reduce((s, p) => s + (p.photos || 0), 0) / size);
    const medReviews = byReviews[Math.floor(size / 2)];
    for (const p of list) {
      p.competitive = {
        cohortSize: size,
        reviewRank: byReviews.indexOf(p) + 1,
        ratingRank: byRating.indexOf(p) + 1,
        withWebCount: withWeb,
        withWebPct: Math.round((withWeb / size) * 100),
        leaderReviews: leader ? (leader.reviews || 0) : 0,
        leaderHasWeb: leader ? leader.webState === "own" : false,
        medianReviews: medReviews ? (medReviews.reviews || 0) : 0,
        avgPhotos,
      };
    }
  }
}

// Corre tareas async con concurrencia acotada.
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }));
  return out;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, "..");
export const OUT = join(ROOT, "output");

// Carga .env de forma mínima (sin dependencias). En Railway las vars
// vienen del entorno, así que esto es no-op ahí.
export function loadEnv() {
  const p = join(ROOT, ".env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

function buildQueries(rubros, zonas) {
  const qs = [];
  for (const rubro of rubros) for (const zona of zonas) qs.push(`${rubro} en ${zona}`);
  return qs;
}

function toCsv(rows) {
  const cols = ["score", "name", "webLabel", "site", "rating", "reviews", "photos",
    "verified", "phone", "borough", "address", "mapsUrl"];
  const esc = (v) => {
    const s = v === undefined || v === null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

// onLog: (msg:string) => void  para reportar progreso a CLI o web.
export async function runScan({ rubros = RUBROS, zonas = ZONAS, query = QUERY, region, source = "maps", onLog = () => {} } = {}) {
  const isIg = source === "instagram";
  // Región (idioma/contenido): la del selector, o inferida del país del scan.
  const reg = region || (String(query.countryCode || "").toLowerCase() === "es" ? "es" : "ar");
  // Para IG la query es un término limpio "rubro barrio" (sin comas internas).
  const queries = isIg
    ? rubros.flatMap((r) => zonas.map((z) => `${r} ${String(z).split(",")[0].trim()}`))
    : buildQueries(rubros, zonas);
  onLog(`Fuente: ${isIg ? "Instagram" : "Google Maps"} · ${queries.length} búsquedas`);
  onLog(`Corriendo el actor de Apify (1–4 min)...`);

  let last = "";
  const onTick = (st) => { if (st !== last) { last = st; onLog(`estado: ${st}`); } };
  const raw = isIg
    ? await searchInstagram(queries, { perQuery: Math.min(query.limit || 20, 30) }, { onTick })
    : await searchPlaces(queries, query, { onTick });
  onLog(`${raw.length} ${isIg ? "perfiles" : "lugares"} recibidos.`);

  // Normalizar + dedupe por placeId
  const now = Date.now();
  const byId = new Map();
  for (const r of raw) {
    const p = isIg ? normalizeIgProfile(r, reg) : normalizePlace(r, now);
    p._normName = normName(p.name);
    if (!p.placeId) p.placeId = `${p._normName}|${p.address || ""}`;
    if (!byId.has(p.placeId)) byId.set(p.placeId, p);
  }
  const places = [...byId.values()];
  for (const p of places) p.region = reg;
  onLog(`${places.length} únicos tras dedupe.`);

  // Conteo de cadenas (mismo nombre normalizado)
  const chainCounts = new Map();
  for (const p of places) chainCounts.set(p._normName, (chainCounts.get(p._normName) || 0) + 1);

  // Auditar las webs propias (GET + análisis SEO/mobile/redes), concurrencia acotada.
  const ownSites = places.filter((p) => p.webState === "own");
  onLog(`Auditando ${ownSites.length} sitios web...`);
  await mapLimit(ownSites, 8, async (p) => {
    p.audit = await auditSite(p.site);
    p.webAlive = p.audit.reachable;
    if (p.audit.emails && p.audit.emails.length) p.email = p.audit.emails[0];
  });

  // Gates + score de presencia + recomendación de servicios (oportunidad)
  for (const p of places) {
    const g = applyGates(p, chainCounts);
    p.passed = g.passed;
    p.gateReasons = g.reasons;
    const s = scorePlace(p);
    p.presenceScore = s.score;
    p.breakdown = s.breakdown;
    p.webLabel = webLabel(p.webState);
    const rec = recommendServices(p, p.audit);
    p.services = rec.services;
    p.primaryService = rec.primary;
    p.score = rec.opportunityScore;   // headline = oportunidad
    delete p._normName;
  }

  if (!isIg) computeCompetitive(places); // IG no tiene reseñas: el ranking no aplica

  const candidates = places
    .filter((p) => p.passed && p.score >= SCORE_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  const payload = {
    generatedAt: new Date().toISOString(),
    queries,
    counts: { raw: raw.length, unique: places.length, candidates: candidates.length },
    candidates,
    all: places,
  };

  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, "candidates.json"), JSON.stringify(payload, null, 2));
  writeFileSync(join(OUT, "candidates.csv"), toCsv(candidates));
  onLog(`Listo: ${candidates.length} candidatos de ${places.length} negocios.`);

  return payload;
}
