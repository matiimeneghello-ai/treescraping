// ============================================================
// SCAN (CLI) — wrapper fino sobre pipeline.runScan.
// Uso: npm run scan
// ============================================================

import { RUBROS, ZONAS } from "./config.js";
import { loadEnv, runScan } from "./pipeline.js";

async function main() {
  loadEnv();
  console.log(`\n🌳 Tree Prospect — scan`);
  console.log(`   ${RUBROS.length} rubros x ${ZONAS.length} zonas\n`);

  const payload = await runScan({ onLog: (m) => console.log(`   ${m}`) });

  console.log(`\n📊 ${payload.counts.candidates} candidatos de ${payload.counts.unique} negocios\n`);
  console.log(`   TOP 10:`);
  payload.candidates.slice(0, 10).forEach((p, i) => {
    console.log(`   ${String(i + 1).padStart(2)}. [${p.score}] ${p.name} — ${p.webLabel} — ${p.rating}★ (${p.reviews}) — ${p.borough || ""}`);
  });
  console.log(`\n✓ output/candidates.json + candidates.csv`);
  console.log(`  Revisá la lista: npm run serve  → http://localhost:4477\n`);
}

main().catch((e) => {
  console.error(`\n✗ ${e.message}\n`);
  process.exitCode = 1;
});
