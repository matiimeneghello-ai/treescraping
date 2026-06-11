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

// Arma un wa.me a partir de un teléfono argentino. Best-effort: Mati revisa
// antes de mandar. Devuelve "" si no hay teléfono usable.
export function waLink(phone) {
  let d = String(phone || "").replace(/[^0-9]/g, "");
  if (!d) return "";
  if (d.startsWith("0")) d = d.slice(1);
  if (!d.startsWith("54")) d = "54" + d;
  return `https://wa.me/${d}`;
}
