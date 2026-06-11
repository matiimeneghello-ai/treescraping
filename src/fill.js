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
