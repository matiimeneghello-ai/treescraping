// ============================================================
// SERVE — server estático mínimo (sin dependencias) para el dashboard.
// Sirve review.html y output/candidates.json en http://localhost:4477
// ============================================================

import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PORT = 4477;

const server = createServer((req, res) => {
  if (req.url === "/" || req.url === "/index.html") {
    return send(res, 200, "text/html; charset=utf-8", readFileSync(join(ROOT, "review.html")));
  }
  if (req.url.startsWith("/candidates.json")) {
    const f = join(ROOT, "output", "candidates.json");
    if (!existsSync(f)) return send(res, 404, "application/json", '{"error":"corré npm run scan primero"}');
    return send(res, 200, "application/json; charset=utf-8", readFileSync(f));
  }
  send(res, 404, "text/plain", "not found");
});

function send(res, code, type, body) {
  res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(body);
}

server.listen(PORT, () => {
  console.log(`\n🌳 Dashboard en http://localhost:${PORT}\n   (Ctrl+C para cortar)\n`);
});
