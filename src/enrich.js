// ============================================================
// ENRICH — enriquecimiento de la shortlist con reviews recientes.
// Completa los componentes (enrich) del score: respuestas del dueño
// y antigüedad de la última review. Re-puntúa y reordena.
// Corré esto DESPUÉS de `npm run scan`.
// ============================================================

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SHORTLIST_TOP } from "./config.js";
import { getReviews } from "./outscraper.js";
import { scorePlace } from "./score.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "output");

function loadEnv() {
  const p = join(ROOT, ".env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const DAY = 86400000;

function parseReviewDate(r) {
  // Outscraper expone review_datetime_utc ("MM/DD/YYYY HH:mm:ss") o un epoch.
  const v = r.review_datetime_utc || r.datetime || r.review_timestamp;
  if (!v) return null;
  if (typeof v === "number") return v * (v < 1e12 ? 1000 : 1);
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : t;
}

async function main() {
  loadEnv();
  const file = join(OUT, "candidates.json");
  if (!existsSync(file)) {
    console.error("No existe output/candidates.json. Corré primero: npm run scan");
    process.exit(1);
  }
  const payload = JSON.parse(readFileSync(file, "utf8"));
  const shortlist = payload.candidates.slice(0, SHORTLIST_TOP);
  console.log(`\n🌳 Enriqueciendo top ${shortlist.length} con reviews recientes...\n`);

  const now = Date.now();
  for (const p of shortlist) {
    try {
      const q = p.placeId && p.placeId.includes("|") ? p.name : p.placeId;
      const data = await getReviews(q, { reviewsLimit: 10 });
      const reviews = (data && (data.reviews_data || data.reviews)) || [];
      const replies = reviews.filter((r) => r.owner_answer || r.owner_answer_timestamp).length;
      const dates = reviews.map(parseReviewDate).filter(Boolean);
      const newest = dates.length ? Math.max(...dates) : null;

      p.ownerReplies = replies;
      p.lastReviewDays = newest ? Math.round((now - newest) / DAY) : null;

      const s = scorePlace(p);
      p.score = s.score;
      p.breakdown = s.breakdown;
      console.log(`  [${p.score}] ${p.name} — ${replies} respuestas — última review ${p.lastReviewDays ?? "?"}d`);
    } catch (e) {
      console.log(`  ! ${p.name}: ${e.message}`);
    }
  }

  shortlist.sort((a, b) => b.score - a.score);
  // reinsertar enriquecidos al frente del array de candidatos
  const rest = payload.candidates.slice(SHORTLIST_TOP);
  payload.candidates = [...shortlist, ...rest];
  payload.enrichedAt = new Date().toISOString();

  writeFileSync(file, JSON.stringify(payload, null, 2));
  console.log(`\n✓ Re-puntuado y guardado. Revisá: npm run serve\n`);
}

main().catch((e) => {
  console.error(`\n✗ ${e.message}\n`);
  process.exit(1);
});
