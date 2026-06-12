// Utilidades compartidas: reemplazo de tokens {{X}} y escape HTML.

export function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]
  ));
}

// Reemplaza {{TOKEN}} por tokens[TOKEN] (string). Los faltantes quedan "".
export function fill(tpl, tokens) {
  return String(tpl).replace(/\{\{(\w+)\}\}/g, (_, k) =>
    tokens[k] === undefined || tokens[k] === null ? "" : String(tokens[k])
  );
}

// Frase de venta con el contexto competitivo del negocio (su posición en la
// cohorte rubro+zona del scan). El ángulo "tu competidor te está ganando".
export function competitiveLine(p, rubroLabel) {
  const c = p && p.competitive;
  if (!c || c.cohortSize < 3) return "";
  let s = `En tu zona hay ${c.cohortSize} negocios como el tuyo y estás ${c.reviewRank}º por reseñas`;
  const extra = [];
  if (p.webState !== "own" && c.withWebCount > 0)
    extra.push(`${c.withWebCount} de ${c.cohortSize} ya tienen sitio web propio`);
  if (c.reviewRank > 1 && c.leaderReviews >= (Number(p.reviews) || 0) + 10)
    extra.push(`el primero tiene ${c.leaderReviews} reseñas`);
  if (extra.length) s += "; " + extra.join(" y ");
  return s + ".";
}

// Localiza a español de España los textos fijos rioplatenses de los templates
// (imperativos voseo + "turno"->"cita"). Se aplica solo cuando la región es ES.
const ES_MAP = [
  [/Escribinos/g, "Escríbenos"], [/Coordinás/g, "Coordinas"], [/Coordiná/g, "Coordina"],
  [/Reservá/g, "Reserva"], [/Agendá/g, "Agenda"], [/Llamános/g, "Llámanos"], [/Llamá/g, "Llama"],
  [/Contactános/g, "Contáctanos"], [/Contactá/g, "Contacta"], [/Conocé/g, "Conoce"],
  [/Aprovechá/g, "Aprovecha"], [/\bPasá\b/g, "Pasa"], [/\bMirá\b/g, "Mira"], [/\bPedí\b/g, "Pide"],
  [/\bSacá\b/g, "Saca"], [/\bVení\b/g, "Ven"], [/\bEscribí\b/g, "Escribe"], [/\bSumás\b/g, "Sumas"],
  [/\btenés\b/g, "tienes"], [/\bquerés\b/g, "quieres"], [/\bpodés\b/g, "puedes"], [/\bsabés\b/g, "sabes"],
  [/tu turno/g, "tu cita"], [/\bturnos\b/g, "citas"], [/\bturno\b/g, "cita"],
];
export function localizeES(html) {
  let h = html;
  for (const [re, to] of ES_MAP) h = h.replace(re, to);
  return h;
}

// Normaliza para matchear rubros (lowercase sin acentos).
export function norm(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[^a-z0-9 ]/g, "").trim();
}

// Arma un wa.me a partir de un teléfono en formato internacional (con código
// de país, como lo devuelve Apify en phoneUnformatted). Funciona en cualquier
// país. Best-effort: Mati revisa antes de mandar.
export function waLink(phoneIntl) {
  const d = String(phoneIntl || "").replace(/[^0-9]/g, "");
  return d ? `https://wa.me/${d}` : "";
}
