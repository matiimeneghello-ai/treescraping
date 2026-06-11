// ============================================================
// recommendServices(candidate, audit) — decide qué servicio(s) de
// Tree le conviene a cada negocio, con el porqué concreto, basado en
// señales reales (presencia + audit del sitio + datos de Maps).
// Devuelve { services:[{key,label,score,reason}], primary, opportunityScore }.
// ============================================================

export const SERVICE_LABELS = {
  web: "Sitio web",
  redesign: "Rehacer sitio",
  seo: "SEO",
  social: "Redes sociales",
  paid: "Pauta (paid)",
};

export function recommendServices(p, audit) {
  const a = audit || { checked: false };
  const reviews = Number(p.reviews) || 0;
  const rating = Number(p.rating) || 0;
  const healthy = rating >= 4.0 && reviews >= 15;
  const photos = Number(p.photos) || 0;
  const services = [];

  // ---- WEB: no tiene sitio propio ----
  if (p.webState === "none") {
    services.push({ key: "web", label: SERVICE_LABELS.web, score: 90,
      reason: "No tiene sitio web propio: cuando lo buscan en Google no encuentra dónde conocerlo ni contactarlo." });
  } else if (p.webState === "social") {
    services.push({ key: "web", label: SERVICE_LABELS.web, score: 68,
      reason: "Solo tiene redes; le falta un sitio propio que sea suyo y no dependa del algoritmo de Instagram." });
  }

  // ---- Con web propia auditada: redesign / seo / social ----
  if (p.webState === "own") {
    if (a.checked && !a.reachable && a.status >= 400) {
      // Error HTTP claro (4xx/5xx): el sitio realmente falla.
      services.push({ key: "redesign", label: SERVICE_LABELS.redesign, score: 84,
        reason: `Su sitio devuelve un error (${a.status}): hoy pierde a todo el que entra desde Google.` });
    } else if (a.checked && !a.reachable) {
      // No pudimos cargarlo (timeout / bloqueo): no afirmamos que esté caído, ofrecemos auditoría.
      services.push({ key: "seo", label: SERVICE_LABELS.seo, score: 46,
        reason: "Su sitio tardó en responder en nuestra prueba: vale una auditoría de velocidad y SEO para ver qué lo frena." });
    } else if (a.checked && a.reachable) {
      if (!a.hasViewport) {
        services.push({ key: "redesign", label: SERVICE_LABELS.redesign, score: 75,
          reason: "El sitio no está adaptado a celular, y la mayoría lo abre desde el teléfono." });
      }
      const seoGaps = [];
      if (!a.hasTitle || a.titleLen < 10) seoGaps.push("sin un título claro");
      if (!a.hasMetaDesc) seoGaps.push("sin meta descripción");
      if (!a.hasSchema) seoGaps.push("sin datos de negocio local (schema)");
      if (!a.https) seoGaps.push("sin HTTPS seguro");
      if (a.words && a.words < 200) seoGaps.push("con muy poco contenido");
      if (!a.hasH1) seoGaps.push("sin un encabezado principal");
      if (seoGaps.length >= 2) {
        services.push({ key: "seo", label: SERVICE_LABELS.seo, score: Math.min(80, 46 + seoGaps.length * 8),
          reason: `El sitio existe pero no está optimizado para Google (${seoGaps.slice(0, 3).join(", ")}): por eso no aparece cuando lo buscan.` });
      }
      if (a.social.length === 0) {
        services.push({ key: "social", label: SERVICE_LABELS.social, score: 56,
          reason: "Tiene web pero no se le ven redes; está perdiendo el canal donde su público pasa el día." });
      }
    } else {
      // tiene web propia pero no la pudimos auditar: oferta SEO conservadora
      services.push({ key: "seo", label: SERVICE_LABELS.seo, score: 44,
        reason: "Tiene un sitio; vale una auditoría de SEO para ver si aparece cuando lo buscan." });
    }
  }

  // ---- SOCIAL para solo-redes: ya tiene redes, ofrecer gestión ----
  if (p.webState === "social") {
    services.push({ key: "social", label: "Gestión de redes", score: 48,
      reason: "Maneja sus redes solo; podríamos profesionalizar el contenido y la constancia." });
  }

  // ---- PAID: oferta de crecimiento si está sano ----
  if (healthy) {
    services.push({ key: "paid", label: SERVICE_LABELS.paid, score: rating >= 4.5 && reviews >= 50 ? 54 : 42,
      reason: `Tiene buena reputación (${rating}★, ${reviews} reseñas) pero depende de que lo encuentren solos; con pauta llega a más gente que ya busca lo suyo.` });
  }

  // ---- señal extra: ficha pobre alimenta el caso web/seo ----
  if (!p.verified && p.webState !== "own") {
    const web = services.find((s) => s.key === "web");
    if (web) web.reason += " Además su ficha de Google figura sin reclamar.";
  }
  void photos;

  services.sort((x, y) => y.score - x.score);
  return {
    services,
    primary: services[0] || null,
    opportunityScore: services.length ? services[0].score : 0,
  };
}
