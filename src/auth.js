// ============================================================
// Login simple para el panel. Usuarios en la env var USERS
// ("user:clave,user:clave"). Token de sesión firmado con AUTH_SECRET.
// Las páginas públicas (demos, diagnósticos, /audit) NO requieren login.
// ============================================================

import { createHmac, timingSafeEqual } from "node:crypto";

function secret() { return process.env.AUTH_SECRET || "tree-prospect-dev-secret"; }

export function getUsers() {
  const raw = process.env.USERS || "";
  const m = {};
  for (const pair of raw.split(",")) {
    const i = pair.indexOf(":");
    if (i > 0) m[pair.slice(0, i).trim().toLowerCase()] = pair.slice(i + 1);
  }
  return m;
}

export function authEnabled() { return Object.keys(getUsers()).length > 0; }

export function checkLogin(user, pass) {
  const u = getUsers()[String(user || "").trim().toLowerCase()];
  return u !== undefined && u === String(pass || "");
}

export function makeToken(user) {
  const u = String(user).toLowerCase();
  const sig = createHmac("sha256", secret()).update(u).digest("hex");
  return Buffer.from(u).toString("base64url") + "." + sig;
}

export function verifyToken(token) {
  if (!token) return null;
  const [b64, sig] = String(token).split(".");
  if (!b64 || !sig) return null;
  let u;
  try { u = Buffer.from(b64, "base64url").toString(); } catch { return null; }
  const exp = createHmac("sha256", secret()).update(u).digest("hex");
  try {
    if (sig.length === exp.length && timingSafeEqual(Buffer.from(sig), Buffer.from(exp))) return u;
  } catch {}
  return null;
}

export function cookies(req) {
  const o = {};
  (req.headers.cookie || "").split(";").forEach((c) => {
    const i = c.indexOf("=");
    if (i > 0) o[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim());
  });
  return o;
}

export function isPublic(path) {
  return path === "/login" || path === "/api/login" || path === "/api/logout" ||
    path.startsWith("/demo/") || path.startsWith("/report/") || path.startsWith("/img/") ||
    path === "/audit" || path === "/audit/" || path === "/api/audit-url" || path === "/api/audit-psi";
}
