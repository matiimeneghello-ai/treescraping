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
import { RUBROS, ZONAS, QUERY, REGIONS, DEFAULT_REGION } from "./config.js";
import { renderLanding } from "./landing.js";
import { renderReport } from "./report.js";
import { buildKit } from "./kit.js";
import { pageSpeed } from "./pagespeed.js";
import { AUDIT_PAGE } from "./auditpage.js";
import { auditSite } from "./audit.js";
import { recommendServices } from "./services.js";
import { getLeads, setLead, getViews, logView, LEAD_STATES } from "./store.js";
import { metaAds, adSignal } from "./ads.js";

function hostName(u) {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; }
}

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

function startScan({ rubros, zonas, countryCode, language, region }) {
  if (job.status === "running") return false;
  job = { status: "running", startedAt: new Date().toISOString(), finishedAt: null, log: [], error: null, counts: null };
  const onLog = (m) => { job.log.push(`${new Date().toISOString().slice(11, 19)} ${m}`); if (job.log.length > 200) job.log.shift(); };
  // Si se eligió una región conocida, manda ella (país/idioma/contenido); si no,
  // país e idioma manuales (modo "otro"), con contenido AR por defecto.
  const R = REGIONS[region];
  const cc = R ? R.countryCode : (countryCode !== undefined ? String(countryCode).toLowerCase().trim() : QUERY.countryCode);
  const lang = R ? R.language : (language ? String(language).toLowerCase().trim() : QUERY.language);
  const contentRegion = R ? R.region : "ar";
  const query = { ...QUERY, countryCode: cc, language: lang };
  runScan({
    rubros: rubros?.length ? rubros : RUBROS,
    zonas: zonas?.length ? zonas : ZONAS,
    query,
    region: contentRegion,
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
    const regions = Object.entries(REGIONS).map(([k, r]) => ({ key: k, label: r.label, flag: r.flag, zonas: r.zonas }));
    return json(res, 200, { rubros: RUBROS, zonas: ZONAS, regions, defaultRegion: DEFAULT_REGION, hasToken: !!(process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN), needsKey: !!process.env.DASHBOARD_KEY });
  }

  if (path === "/api/status") {
    return json(res, 200, { status: job.status, startedAt: job.startedAt, finishedAt: job.finishedAt, error: job.error, counts: job.counts, log: job.log.slice(-12) });
  }

  // CRM: estado de leads (persistido en el volumen).
  if (path === "/api/leads") {
    return json(res, 200, { leads: getLeads(), states: LEAD_STATES, views: getViews() });
  }
  if (path === "/api/lead" && req.method === "POST") {
    let body = {};
    try { body = JSON.parse((await readBody(req)) || "{}"); } catch {}
    if (!body.placeId) return json(res, 400, { error: "falta placeId" });
    const patch = {};
    if (body.status !== undefined) patch.status = body.status;
    if (body.note !== undefined) patch.note = body.note;
    if (body.name !== undefined) patch.name = body.name;
    return json(res, 200, { lead: setLead(body.placeId, patch) });
  }
  if (path === "/api/views") {
    return json(res, 200, getViews());
  }

  // Señal de anuncios (pixel del audit + Meta Ad Library si hay token).
  if (path === "/api/ads") {
    const placeId = url.searchParams.get("placeId") || "";
    const c = findCandidate(placeId);
    if (!c) return json(res, 404, { error: "candidato no encontrado" });
    try {
      const ads = await metaAds(c.name);
      return json(res, 200, { ...adSignal(c, ads), metaChecked: !!ads.checked, metaError: ads.error || null });
    } catch (e) {
      return json(res, 200, adSignal(c, null));
    }
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
      region: body.region,
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
    logView(placeId, "demo");
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
    logView(placeId, "report");
    try {
      return send(res, 200, "text/html; charset=utf-8", renderReport(c));
    } catch (e) {
      return send(res, 500, "text/plain; charset=utf-8", "Error renderizando el diagnóstico: " + e.message);
    }
  }

  // Página pública de auditoría (lead magnet).
  if (path === "/audit" || path === "/audit/") {
    return send(res, 200, "text/html; charset=utf-8", AUDIT_PAGE);
  }

  // Audita una URL arbitraria (inbound) y devuelve hallazgos + servicios.
  if (path === "/api/audit-url" && req.method === "POST") {
    let body = {};
    try { body = JSON.parse((await readBody(req)) || "{}"); } catch {}
    let u = String(body.url || "").trim();
    if (!u) return json(res, 400, { error: "Poné la dirección de tu sitio." });
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    try {
      const audit = await auditSite(u);
      const cand = { webState: "own", site: u, name: hostName(u), rating: "", reviews: 0, photos: 0, verified: true, hasHours: true, audit };
      const rec = recommendServices(cand, audit);
      // PSI NO va acá (es lento): el cliente lo pide aparte a /api/audit-psi.
      return json(res, 200, { url: u, audit, services: rec.services, primary: rec.primary, psiPending: !!(process.env.PSI_KEY && audit.reachable) });
    } catch (e) {
      return json(res, 500, { error: "No pudimos analizar el sitio." });
    }
  }

  // PageSpeed para una URL arbitraria (lo usa el widget inbound, async).
  if (path === "/api/audit-psi") {
    let u = (url.searchParams.get("url") || "").trim();
    if (!u) return json(res, 200, { error: "sin url" });
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    try { return json(res, 200, await pageSpeed(u)); }
    catch (e) { return json(res, 200, { error: e.message }); }
  }

  // PageSpeed Insights on-demand para el sitio de un candidato (cacheado).
  if (path === "/api/pagespeed") {
    const placeId = url.searchParams.get("placeId") || "";
    const c = findCandidate(placeId);
    if (!c || c.webState !== "own" || !c.site) return json(res, 200, { error: "sin sitio" });
    try {
      return json(res, 200, await pageSpeed(c.site));
    } catch (e) {
      return json(res, 200, { error: e.message });
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
