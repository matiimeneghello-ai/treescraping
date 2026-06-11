// ============================================================
// CONFIG — qué se busca y cómo se puntúa
// Editá RUBROS y ZONAS libremente. El pipeline arma el producto
// cartesiano (cada rubro en cada zona) y consulta una query por par.
// ============================================================

// 2 rubros x 2 zonas = 4 queries x 60 resultados = ~240 negocios.
// Entra cómodo en el free tier de Outscraper (500 registros/mes).
export const RUBROS = [
  "estudio contable",
  "odontologo",
];

export const ZONAS = [
  "Villa Urquiza, CABA, Argentina",
  "Caballito, CABA, Argentina",
];

// Otros rubros buenos para probar (negocio sano + presencia digital floja
// es lo habitual en estos verticales). Descomentá o reemplazá arriba.
export const RUBROS_SUGERIDOS = [
  "estudio contable", "odontologo", "kinesiologo", "veterinaria",
  "estetica facial", "gimnasio", "taller mecanico", "inmobiliaria",
  "estudio juridico", "marmoleria", "carpinteria", "cerrajeria",
  "fabrica de pastas", "vivero", "peluqueria canina",
];

export const QUERY = {
  limit: 60,          // resultados por query (maxCrawledPlacesPerSearch)
  language: "es",
  countryCode: "ar",  // minúscula (lo exige el actor)
  // Reviews por lugar. 0 = scan barato/rápido (score base hasta 75).
  // > 0 trae respuestas del dueño + antigüedad de reviews => score completo,
  // pero cuesta más crédito y tarda más. Empezá en 0 y subí a 5 si querés señal fina.
  maxReviews: 0,
  reviewsSort: "newest",
};

// ---------- Clasificación de website ----------
// En Argentina muchísimos comercios usan Instagram/linktree como única "web".
// Un site vacío NO siempre es presencia cero; clasificamos en 3 estados.
export const SOCIAL_HOSTS = [
  "instagram.com", "facebook.com", "fb.com", "fb.me", "m.facebook.com",
  "linktr.ee", "linktree", "beacons.ai", "wa.me", "api.whatsapp.com",
  "linkt.ee", "tiktok.com", "linktree.com", "withkoji.com", "tap.bio",
];

// ---------- Scoring ----------
// Gates duros: si no pasan, ni se puntúa.
export const GATES = {
  minRating: 4.0,
  minReviews: 20,
  maxChainBranches: 3,   // mismo nombre normalizado > N sucursales => cadena
};

// Pesos del score (0–100). Los componentes marcados (enrich) sólo se
// completan tras correr `npm run enrich` sobre la shortlist; en el scan
// base valen 0 y el score base llega hasta 75.
export const WEIGHTS = {
  // presencia_web (máx 35)
  webNone: 35,        // sin website ni redes
  webSocialOnly: 28,  // sólo Instagram/Facebook/linktree
  webOwnBroken: 10,   // web propia pero caída (HEAD != 200)
  webOwnOk: 0,        // web propia andando => casi descarta

  // salud_negocio (máx 20)
  health4_5: 20,      // rating >= 4.5 y reviews >= 50
  health4_2: 15,      // rating >= 4.2 y reviews >= 20
  health4_0: 10,      // rating >= 4.0 y reviews >= 20

  // fotos (máx 15)
  photosFew: 15,      // <= 5
  photosMid: 8,       // 6–15
  photosMany: 0,      // > 15

  // perfil_descuidado (máx 15) — (enrich) salvo horarios
  ownerNoReplies: 10, // (enrich) 0 respuestas del dueño en últimas 10 reviews
  noHours: 5,         // sin horarios cargados

  // actividad_reciente (máx 10) — (enrich)
  reviewFresh: 10,    // (enrich) última review <= 3 meses
  reviewMid: 5,       // (enrich) última review 3–6 meses

  // sin_reclamar (máx 5)
  unclaimed: 5,       // verified == false  (además es flag de pitch)
};

export const SCORE_THRESHOLD = 50;  // >= candidato (sobre score base, sin enrich)
export const SHORTLIST_TOP = 40;    // cuántos pasan a enriquecimiento de reviews
