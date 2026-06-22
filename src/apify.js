// ============================================================
// Cliente Apify — actor compass/crawler-google-places
// Patrón async (run -> poll -> dataset items) para no chocar el
// límite de 5 min del endpoint run-sync.
// Docs: https://apify.com/compass/crawler-google-places/api
// ============================================================

const MAPS_ACTOR = "compass~crawler-google-places";
const BASE = "https://api.apify.com/v2";

function token() {
  const t = process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN;
  if (!t) {
    throw new Error(
      "Falta APIFY_TOKEN. Copiá .env.example a .env y pegá tu token de Apify " +
      "(https://console.apify.com/account/integrations)."
    );
  }
  return t;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function startRun(actorId, input) {
  // Por defecto usamos la memoria del actor (probada y estable). Forzar RAM alta
  // (ej 4096) hace abortar el run en el plan free de Apify. Si querés acelerar y
  // tu plan lo permite, seteá APIFY_MEMORY (ej 2048/4096) como override explícito.
  const mem = Number(process.env.APIFY_MEMORY);
  const memParam = mem ? `&memory=${mem}` : "";
  const res = await fetch(`${BASE}/acts/${actorId}/runs?token=${token()}${memParam}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error("Apify rechazó el token (401/403). Revisá APIFY_TOKEN.");
  }
  if (!res.ok && res.status !== 201) {
    throw new Error(`Apify run devolvió ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  const run = json.data;
  if (!run?.id) throw new Error(`Respuesta de run sin id: ${JSON.stringify(json)}`);
  return run;
}

async function pollRun(runId, { tries = 120, intervalMs = 5000, onTick } = {}) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(`${BASE}/actor-runs/${runId}?token=${token()}`);
    if (res.ok) {
      const { data } = await res.json();
      const st = data.status;
      if (onTick) onTick(st, i);
      if (st === "SUCCEEDED") return data;
      if (["FAILED", "ABORTED", "TIMED-OUT"].includes(st)) {
        throw new Error(`Run ${runId} terminó en estado ${st}.`);
      }
    }
    await sleep(intervalMs);
  }
  throw new Error(`Timeout esperando el run ${runId}.`);
}

async function getItems(datasetId) {
  const res = await fetch(`${BASE}/datasets/${datasetId}/items?token=${token()}&clean=true`);
  if (!res.ok) throw new Error(`Dataset ${datasetId} devolvió ${res.status}`);
  return res.json();
}

// Corre cualquier actor de Apify (run async -> poll -> items).
export async function runActor(actorId, input, { onTick } = {}) {
  const run = await startRun(actorId, input);
  const done = await pollRun(run.id, { onTick });
  return getItems(done.defaultDatasetId);
}

// Busca lugares. queries = array de strings ("rubro en zona").
// opts: { limit, language, countryCode, maxReviews, reviewsSort }
export async function searchPlaces(queries, opts = {}, { onTick } = {}) {
  const {
    limit = 60, language = "es", countryCode = "AR",
    maxReviews = 0, reviewsSort = "newest",
  } = opts;
  const input = {
    searchStringsArray: queries,
    maxCrawledPlacesPerSearch: limit,
    language,
    countryCode,
    maxReviews,
    reviewsSort,
    maxImages: 0,
    scrapeContacts: false,
    skipClosedPlaces: true,
  };
  return runActor(MAPS_ACTOR, input, { onTick });
}
