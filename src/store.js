// ============================================================
// Store JSON persistente. Usa el volumen /data de Railway (sobrevive
// redeploys); en local cae a output/. Best-effort, nunca tira.
// Guarda: estado de cada lead (CRM) y visitas a demos/diagnósticos.
// ============================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./pipeline.js";

const DIR = existsSync("/data") ? "/data" : join(ROOT, "output");
function file(name) { return join(DIR, name); }
function read(name, def) {
  try { return JSON.parse(readFileSync(file(name), "utf8")); } catch { return def; }
}
function write(name, data) {
  try { mkdirSync(DIR, { recursive: true }); writeFileSync(file(name), JSON.stringify(data)); } catch {}
}

// ---------- Leads (CRM-lite) ----------
// { [placeId]: { status, note, name, updatedAt } }
// status: nuevo | contactado | respondio | reunion | cliente | descartado
export const LEAD_STATES = ["nuevo", "contactado", "respondio", "reunion", "cliente", "descartado"];

export function getLeads() { return read("leads.json", {}); }
export function setLead(placeId, patch) {
  if (!placeId) return null;
  const leads = getLeads();
  const cur = leads[placeId] || { status: "nuevo" };
  leads[placeId] = { ...cur, ...patch, updatedAt: new Date().toISOString() };
  write("leads.json", leads);
  return leads[placeId];
}

// ---------- Views (tracking de demos/diagnósticos) ----------
// { [placeId]: { demo, report, lastAt } }
export function getViews() { return read("views.json", {}); }
export function logView(placeId, kind) {
  if (!placeId) return;
  const views = getViews();
  const v = views[placeId] || { demo: 0, report: 0 };
  if (kind === "report") v.report = (v.report || 0) + 1;
  else v.demo = (v.demo || 0) + 1;
  v.lastAt = new Date().toISOString();
  views[placeId] = v;
  write("views.json", views);
}
