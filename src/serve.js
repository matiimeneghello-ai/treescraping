// ============================================================
// SERVE — server del dashboard (sin dependencias).
// Sirve review.html + candidates.json y permite disparar el scan
// desde la web. Escucha process.env.PORT (Railway) o 4477 local.
//
// Env vars:
//   APIFY_TOKEN    (requerido para correr scans)
//   DASHBOARD_KEY  (opcional) si está seteada, POST /api/scan exige
//                  header x-key con ese valor — evita que cualquiera
//                  gaste crédito de Apify desde la URL pública.
// ============================================================

import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { loadEnv, runScan, ROOT, OUT } from "./pipeline.js";
import { RUBROS, ZONAS } from "./config.js";

loadEnv();
const PORT = process.env.PORT || 4477;

// Estado del job en memoria (un scan a la vez).
let job = { status: "idle", startedAt: null, finishedAt: null, log: [], error: null, counts: null };

function startScan({ rubros, zonas }) {
  if (job.status === "running") return false;
  job = { status: "running", startedAt: new Date().toISOString(), finishedAt: null, log: [], error: null, counts: null };
  const onLog = (m) => { job.log.push(`${new Date().toISOString().slice(11, 19)} ${m}`); if (job.log.length > 200) job.log.shift(); };
  runScan({
    rubros: rubros?.length ? rubros : RUBROS,
    zonas: zonas?.length ? zonas : ZONAS,
    onLog,
  })
    .then((payload) => { job.status = "done"; job.finishedAt = new Date().toISOString(); job.counts = payload.counts; })
    .catch((e) => { job.status = "error"; job.finishedAt = new Date().toISOString(); job.error = e.message; onLog(`ERROR: ${e.message}`); });
  return true;
}

function send(res, code, type, body) {
  res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(body);
}
const json = (res, code, obj) => send(res, code, "application/json; charset=utf-8", JSON.stringify(obj));

function readBody(req) {
  return new Promise((resolve) => {
    let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => resolve(b));
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost`);
  const path = url.pathname;

  if (path === "/" || path === "/index.html") {
    return send(res, 200, "text/html; charset=utf-8", readFileSync(join(ROOT, "review.html")));
  }

  if (path === "/candidates.json") {
    const f = join(OUT, "candidates.json");
    if (!existsSync(f)) return json(res, 404, { error: "corré un scan primero" });
    return send(res, 200, "application/json; charset=utf-8", readFileSync(f));
  }

  // Config por defecto para prellenar el formulario del dashboard.
  if (path === "/api/defaults") {
    return json(res, 200, { rubros: RUBROS, zonas: ZONAS, hasToken: !!(process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN), needsKey: !!process.env.DASHBOARD_KEY });
  }

  if (path === "/api/status") {
    return json(res, 200, { status: job.status, startedAt: job.startedAt, finishedAt: job.finishedAt, error: job.error, counts: job.counts, log: job.log.slice(-12) });
  }

  if (path === "/api/scan" && req.method === "POST") {
    if (process.env.DASHBOARD_KEY && req.headers["x-key"] !== process.env.DASHBOARD_KEY) {
      return json(res, 401, { error: "clave inválida" });
    }
    if (!(process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN)) {
      return json(res, 400, { error: "falta APIFY_TOKEN en el servidor" });
    }
    let body = {};
    try { body = JSON.parse((await readBody(req)) || "{}"); } catch {}
    const clean = (s) => String(s || "").split(/\n|,/).map((x) => x.trim()).filter(Boolean);
    const started = startScan({ rubros: clean(body.rubros), zonas: clean(body.zonas) });
    if (!started) return json(res, 409, { error: "ya hay un scan corriendo" });
    return json(res, 202, { status: "running" });
  }

  send(res, 404, "text/plain", "not found");
});

server.listen(PORT, () => {
  console.log(`\n🌳 Tree Prospect dashboard en puerto ${PORT}`);
  if (!(process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN)) console.log("   ⚠ sin APIFY_TOKEN: el scan desde la web no va a correr");
  console.log("");
});
