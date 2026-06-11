// ============================================================
// SCAN — pipeline principal.
// 1. Busca rubros x zonas en Google Maps (Outscraper)
// 2. Normaliza + clasifica website + dedupe + detecta cadenas
// 3. Chequea si las webs propias responden (HEAD)
// 4. Aplica gates + score base
// 5. Escribe output/candidates.json y output/candidates.csv
// ============================================================

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { RUBROS, ZONAS, QUERY, SCORE_THRESHOLD } from "./config.js";
import { searchPlaces } from "./outscraper.js";
import { normalizePlace, normName, isWebsiteAlive } from "./normalize.js";
import { applyGates, scorePlace, webLabel } from "./score.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "output");

// Carga .env de forma mínima (sin dependencias).
function loadEnv() {
  const p = join(ROOT, ".env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

function buildQueries() {
  const qs = [];
  for (const rubro of RUBROS) for (const zona of ZONAS) qs.push(`${rubro} en ${zona}`);
  return qs;
}

async function main() {
  loadEnv();
  const queries = buildQueries();
  console.log(`\n🌳 Tree Prospect — scan`);
  console.log(`   ${RUBROS.length} rubros x ${ZONAS.length} zonas = ${queries.length} queries (limit ${QUERY.limit} c/u)`);
  queries.forEach((q) => console.log(`   · ${q}`));
  console.log(`\n→ Consultando Outscraper (puede tardar 1–3 min)...`);

  const raw = await searchPlaces(queries, QUERY);
  console.log(`✓ ${raw.length} lugares crudos recibidos.`);

  // Normalizar + dedupe por placeId
  const byId = new Map();
  for (const r of raw) {
    const p = normalizePlace(r);
    p._normName = normName(p.name);
    if (!p.placeId) p.placeId = `${p._normName}|${p.address || ""}`;
    if (!byId.has(p.placeId)) byId.set(p.placeId, p);
  }
  let places = [...byId.values()];
  console.log(`✓ ${places.length} únicos tras dedupe.`);

  // Conteo de cadenas (mismo nombre normalizado)
  const chainCounts = new Map();
  for (const p of places) chainCounts.set(p._normName, (chainCounts.get(p._normName) || 0) + 1);

  // Chequear webs propias (en paralelo, acotado)
  const ownSites = places.filter((p) => p.webState === "own");
  console.log(`→ Chequeando ${ownSites.length} webs propias (HEAD)...`);
  await Promise.all(ownSites.map(async (p) => { p.webAlive = await isWebsiteAlive(p.site); }));

  // Gates + score
  for (const p of places) {
    const g = applyGates(p, chainCounts);
    p.passed = g.passed;
    p.gateReasons = g.reasons;
    const s = scorePlace(p);
    p.score = s.score;
    p.breakdown = s.breakdown;
    p.webLabel = webLabel(p.webState);
  }

  const candidates = places
    .filter((p) => p.passed && p.score >= SCORE_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  console.log(`\n📊 Resultado:`);
  console.log(`   ${places.length} analizados`);
  console.log(`   ${places.filter((p) => !p.passed).length} descartados por gates`);
  console.log(`   ${candidates.length} candidatos (score >= ${SCORE_THRESHOLD})\n`);

  console.log(`   TOP 10:`);
  candidates.slice(0, 10).forEach((p, i) => {
    console.log(`   ${String(i + 1).padStart(2)}. [${p.score}] ${p.name} — ${p.webLabel} — ${p.rating}★ (${p.reviews}) — ${p.borough || ""}`);
  });

  // Persistir
  mkdirSync(OUT, { recursive: true });
  const payload = {
    generatedAt: new Date().toISOString(),
    queries,
    counts: {
      raw: raw.length,
      unique: places.length,
      candidates: candidates.length,
    },
    candidates,
    all: places,
  };
  writeFileSync(join(OUT, "candidates.json"), JSON.stringify(payload, null, 2));
  writeFileSync(join(OUT, "candidates.csv"), toCsv(candidates));
  console.log(`\n✓ Escrito output/candidates.json y output/candidates.csv`);
  console.log(`  Revisá la lista: npm run serve  → abrí http://localhost:4477\n`);
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

main().catch((e) => {
  console.error(`\n✗ ${e.message}\n`);
  process.exit(1);
});
