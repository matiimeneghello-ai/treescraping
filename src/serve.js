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
import { RUBROS, ZONAS, QUERY } from "./config.js";
import { renderLanding } from "./landing.js";
import { renderReport } from "./report.js";
import { buildKit } from "./kit.js";

function findCandidate(placeId) {
  const f = join(OUT, "candidates.json");
  if (!existsSync(f)) return null;
  const data = JSON.parse(readFileSync(f, "utf8"));
  const pool = [...(data.candidates || []), ...(data.all || [])];
  return pool.find((p) => p.placeId === placeId) || null;
}

loadEnv();
const PORT = process.env.PORT || 4477;

// Seed: si no hay datos de scan (deploy fresco / filesystem efímero),
// arrancamos con el último dataset conocido para que demos y kit funcionen.
import { copyFileSync, mkdirSync } from "node:fs";
(() => {
  const seed = join(ROOT, "src", "seed-candidates.json");
  const live = join(OUT, "candidates.json");
  if (!existsSync(live) && existsSync(seed)) {
    try { mkdirSync(OUT, { recursive: true }); copyFileSync(seed, live); } catch {}
  }
})();

// Estado del job en memoria (un scan a la vez).
let job = { status: "idle", startedAt: null, finishedAt: null, log: [], error: null, counts: null };

function startScan({ rubros, zonas, countryCode, language }) {
  if (job.status === "running") return false;
  job = { status: "running", startedAt: new Date().toISOString(), finishedAt: null, log: [], error: null, counts: null };
  const onLog = (m) => { job.log.push(`${new Date().toISOString().slice(11, 19)} ${m}`); if (job.log.length > 200) job.log.shift(); };
  // País e idioma configurables por scan (modo mundial). "" = sin sesgo de país.
  const query = {
    ...QUERY,
    countryCode: countryCode !== undefined ? String(countryCode).toLowerCase().trim() : QUERY.countryCode,
    language: language ? String(language).toLowerCase().trim() : QUERY.language,
  };
  runScan({
    rubros: rubros?.length ? rubros : RUBROS,
    zonas: zonas?.length ? zonas : ZONAS,
    query,
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
    return json(res, 200, { rubros: RUBROS, zonas: ZONAS, countryCode: QUERY.countryCode, language: QUERY.language, hasToken: !!(process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN), needsKey: !!process.env.DASHBOARD_KEY });
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
    const started = startScan({
      rubros: clean(body.rubros),
      zonas: clean(body.zonas),
      countryCode: body.countryCode,
      language: body.language,
    });
    if (!started) return json(res, 409, { error: "ya hay un scan corriendo" });
    return json(res, 202, { status: "running" });
  }

  // Imágenes de rubro (servidas desde el repo, sin depender de CDNs externos).
  if (path.startsWith("/img/")) {
    const name = path.slice("/img/".length).replace(/[^a-z0-9._-]/gi, "");
    const f = join(ROOT, "src", "img", name);
    if (!name || !existsSync(f)) return send(res, 404, "text/plain", "img not found");
    const type = name.endsWith(".png") ? "image/png" : name.endsWith(".webp") ? "image/webp" : "image/jpeg";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "public, max-age=86400" });
    return res.end(readFileSync(f));
  }

  // Demo: la web del negocio, generada con sus datos reales.
  if (path.startsWith("/demo/")) {
    const placeId = decodeURIComponent(path.slice("/demo/".length));
    const c = findCandidate(placeId);
    if (!c) return send(res, 404, "text/html; charset=utf-8", "<h1>Demo no encontrada</h1><p>Corré un scan primero.</p>");
    try {
      return send(res, 200, "text/html; charset=utf-8", renderLanding(c));
    } catch (e) {
      return send(res, 500, "text/plain; charset=utf-8", "Error renderizando la demo: " + e.message);
    }
  }

  // Report: diagnóstico/propuesta de Tree (para SEO/redes/paid).
  if (path.startsWith("/report/")) {
    const placeId = decodeURIComponent(path.slice("/report/".length));
    const c = findCandidate(placeId);
    if (!c) return send(res, 404, "text/html; charset=utf-8", "<h1>Diagnóstico no encontrado</h1>");
    try {
      return send(res, 200, "text/html; charset=utf-8", renderReport(c));
    } catch (e) {
      return send(res, 500, "text/plain; charset=utf-8", "Error renderizando el diagnóstico: " + e.message);
    }
  }

  // Kit de outreach (mail + whatsapp + análisis) para un candidato.
  if (path === "/api/kit") {
    const placeId = url.searchParams.get("placeId") || "";
    const c = findCandidate(placeId);
    if (!c) return json(res, 404, { error: "candidato no encontrado" });
    const origin = `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}`;
    const id = encodeURIComponent(placeId);
    const demoUrl = `${origin}/demo/${id}`;
    const reportUrl = `${origin}/report/${id}`;
    // El deliverable depende del servicio: demo de sitio para web/redesign,
    // diagnóstico para seo/redes/paid.
    const svc = (c.primaryService && c.primaryService.key) || "web";
    const dealUrl = (svc === "web" || svc === "redesign") ? demoUrl : reportUrl;
    try {
      return json(res, 200, { demoUrl, reportUrl, dealUrl, dealType: (svc === "web" || svc === "redesign") ? "demo" : "report", ...buildKit(c, dealUrl) });
    } catch (e) {
      return json(res, 500, { error: e.message });
    }
  }

  send(res, 404, "text/plain", "not found");
});

server.listen(PORT, () => {
  console.log(`\n🌳 Tree Prospect dashboard en puerto ${PORT}`);
  if (!(process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN)) console.log("   ⚠ sin APIFY_TOKEN: el scan desde la web no va a correr");
  console.log("");
});
