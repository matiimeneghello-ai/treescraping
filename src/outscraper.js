// ============================================================
// Cliente Outscraper — Google Maps Search + Reviews (async + polling)
// Docs: https://app.outscraper.com/api-docs
// ============================================================

const BASE = "https://api.outscraper.cloud";

function apiKey() {
  const k = process.env.OUTSCRAPER_API_KEY;
  if (!k) {
    throw new Error(
      "Falta OUTSCRAPER_API_KEY. Copiá .env.example a .env y pegá tu key " +
      "(https://app.outscraper.com/profile)."
    );
  }
  return k;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Dispara un request async y devuelve el id de la tarea.
async function startRequest(path, params) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) v.forEach((x) => url.searchParams.append(k, x));
    else url.searchParams.set(k, v);
  }
  url.searchParams.set("async", "true");

  const res = await fetch(url, { headers: { "X-API-KEY": apiKey() } });
  if (res.status === 401 || res.status === 403) {
    throw new Error("Outscraper rechazó la API key (401/403). Revisá la key.");
  }
  if (!res.ok && res.status !== 202) {
    throw new Error(`Outscraper ${path} devolvió ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  const id = json.id || json.request_id;
  if (!id) throw new Error(`Respuesta sin id de tarea: ${JSON.stringify(json)}`);
  return id;
}

// Pollea hasta que la tarea termina. Devuelve el array `data`.
async function pollResult(id, { tries = 60, intervalMs = 5000 } = {}) {
  const url = `${BASE}/requests/${id}`;
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: { "X-API-KEY": apiKey() } });
    if (res.ok) {
      const json = await res.json();
      const status = (json.status || "").toLowerCase();
      if (status === "success" || status === "finished") return json.data || [];
      if (status === "error" || status === "failed") {
        throw new Error(`Tarea ${id} falló: ${JSON.stringify(json)}`);
      }
    }
    await sleep(intervalMs);
  }
  throw new Error(`Timeout esperando la tarea ${id} (${(tries * intervalMs) / 1000}s).`);
}

// Busca lugares en Google Maps. queries = array de strings.
// Devuelve array plano de lugares (mergeando todas las queries).
export async function searchPlaces(queries, { limit, language, region }) {
  const id = await startRequest("/maps/search-v3", {
    query: queries,
    limit,
    language,
    region,
  });
  const data = await pollResult(id);
  // data es array-de-arrays (uno por query); aplanamos.
  return data.flat().filter(Boolean);
}

// Reviews recientes de un lugar. Devuelve el objeto del lugar con reviews_data.
export async function getReviews(placeIdOrQuery, { reviewsLimit = 10 } = {}) {
  const id = await startRequest("/maps/reviews-v3", {
    query: placeIdOrQuery,
    reviewsLimit,
    sort: "newest",
    language: "es",
  });
  const data = await pollResult(id);
  return (data.flat().filter(Boolean))[0] || null;
}
