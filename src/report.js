// ============================================================
// renderReport(candidate) -> HTML de un diagnóstico de presencia digital
// que Tree Marketing le muestra al prospecto. A diferencia de la demo de
// sitio, este es un documento de Tree (auditoría + propuesta de servicios),
// con hallazgos reales del audit. Para casos de SEO / redes / paid.
// ============================================================

import { esc, waLink, competitiveLine, localizeES } from "./fill.js";
import { brandName, resolveRubro, regionOf } from "./content.js";

function checkRow(ok, label) {
  const icon = ok
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="#16894a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="#c0392b" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  return `<li class="chk ${ok ? "y" : "n"}"><span class="ico">${icon}</span><span>${esc(label)}</span></li>`;
}

export function renderReport(p) {
  const name = brandName(p);
  const a = p.audit || { checked: false };
  const services = p.services || [];
  const wa = waLink(p.phoneIntl || String(p.phone || "").replace(/[^0-9]/g, ""));

  // Hallazgos del audit (solo si auditamos un sitio propio)
  let findings = "";
  if (a.checked && a.reachable) {
    findings = `<ul class="checks">
      ${checkRow(a.https, "Conexión segura (HTTPS)")}
      ${checkRow(a.hasViewport, "Adaptado a celular")}
      ${checkRow(a.hasTitle && a.titleLen >= 10, "Título de página claro")}
      ${checkRow(a.hasMetaDesc, "Descripción para Google (meta description)")}
      ${checkRow(a.hasSchema, "Datos de negocio local para Google (schema)")}
      ${checkRow(a.hasH1, "Encabezado principal definido")}
      ${checkRow(a.social.length > 0, "Redes sociales enlazadas desde el sitio")}
      ${checkRow((a.words || 0) >= 200, "Contenido suficiente en la página")}
      ${checkRow(a.hasPixel, "Pixel de Meta para medir y hacer publicidad")}
    </ul>`;
  } else {
    const presence = p.webState === "none"
      ? "No encontramos un sitio web propio."
      : p.webState === "social"
      ? "Tu presencia hoy depende solo de las redes sociales."
      : "No pudimos analizar tu sitio a fondo (tardó en responder).";
    findings = `<p class="lead">${esc(presence)}</p>`;
  }

  const svcCards = services.map((s, i) => `
    <div class="svc ${i === 0 ? "top" : ""}">
      ${i === 0 ? `<span class="tag">Lo más urgente</span>` : ""}
      <h3>${esc(s.label)}</h3>
      <p>${esc(s.reason)}</p>
    </div>`).join("");

  const html = `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Diagnóstico digital · ${esc(name)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{--bg:#f6f8f6;--surface:#fff;--ink:#16241c;--ink-soft:#41514a;--mute:#6b7b73;--border:#e2e8e3;
    --brand:#1f7a44;--brand-deep:#156335;--brand-wash:#e8f3ec;--y:#16894a;--n:#c0392b;}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Manrope",system-ui,sans-serif;background:var(--bg);color:var(--ink);line-height:1.6;overflow-x:hidden;-webkit-font-smoothing:antialiased}
  .wrap{max-width:760px;margin:0 auto;padding:0 20px}
  a{color:inherit;text-decoration:none}
  .top-bar{background:var(--ink);color:#dfeee5;font-size:13px;padding:10px 0;text-align:center}
  .top-bar b{color:#fff}
  header{padding:48px 0 30px;text-align:center}
  .kick{font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--brand);margin-bottom:14px}
  h1{font-size:clamp(1.9rem,6vw,2.8rem);font-weight:800;letter-spacing:-.02em;line-height:1.12;overflow-wrap:break-word}
  .subline{color:var(--ink-soft);font-size:1.06rem;margin-top:14px}
  .pill{display:inline-flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--border);
    border-radius:999px;padding:8px 15px;font-size:14px;font-weight:600;margin-top:20px}
  .pill .star{color:#f2a93b}
  section{background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:30px 28px;margin-bottom:18px;box-shadow:0 1px 2px rgba(22,36,28,.04)}
  h2{font-size:1.4rem;font-weight:800;letter-spacing:-.01em;margin-bottom:8px}
  .sec-sub{color:var(--mute);font-size:.98rem;margin-bottom:20px}
  .lead{font-size:1.1rem;color:var(--ink-soft)}
  .checks{list-style:none;display:grid;gap:11px}
  .chk{display:flex;align-items:flex-start;gap:12px;font-size:1rem;color:var(--ink-soft)}
  .chk .ico{width:26px;height:26px;border-radius:8px;flex:none;display:grid;place-items:center}
  .chk.y .ico{background:#e6f5ec}.chk.n .ico{background:#fae9e6}
  .chk .ico svg{width:16px;height:16px}
  .chk.n span:last-child{color:var(--ink);font-weight:600}
  .svc{border:1px solid var(--border);border-radius:14px;padding:20px 22px;margin-top:14px;position:relative}
  .svc.top{border-color:var(--brand);background:var(--brand-wash)}
  .svc .tag{position:absolute;top:-11px;left:18px;background:var(--brand);color:#fff;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:4px 11px;border-radius:999px}
  .svc h3{font-size:1.18rem;font-weight:800;margin-bottom:6px;color:var(--ink)}
  .svc p{color:var(--ink-soft);font-size:.98rem}
  .cta{background:linear-gradient(160deg,var(--brand),var(--brand-deep));color:#fff;text-align:center;border:none}
  .cta h2{color:#fff}.cta p{color:#dff0e6;margin-bottom:22px}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;background:#fff;color:var(--brand-deep);
    font-weight:800;font-size:1.02rem;min-height:52px;padding:0 28px;border-radius:999px;transition:transform .18s}
  .btn:hover{transform:translateY(-2px)}
  .btn svg{width:20px;height:20px}
  footer{text-align:center;color:var(--mute);font-size:12.5px;padding:24px 0 48px}
  footer b{color:var(--ink-soft)}
  .psi{display:grid;gap:14px;margin-top:6px}
  .psi-loading{color:var(--mute)}
  .psi-row{display:flex;align-items:center;gap:14px}
  .psi-l{flex:0 0 130px;font-size:.95rem;color:var(--ink-soft)}
  .psi-bar{flex:1;height:9px;background:#edf1ee;border-radius:6px;overflow:hidden}
  .psi-bar i{display:block;height:100%;border-radius:6px;transition:width .6s ease}
  .psi-row b{flex:0 0 34px;text-align:right;font-variant-numeric:tabular-nums}
  .cgrid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:6px}
  .cstat{background:var(--brand-wash);border:1px solid var(--border);border-radius:14px;padding:18px 20px}
  .cv{font-size:2rem;font-weight:800;color:var(--brand-deep);line-height:1}
  .cv small{font-size:.9rem;font-weight:600;color:var(--mute)}
  .cl{color:var(--ink-soft);font-size:.92rem;margin-top:8px}
  @media(max-width:520px){.cgrid{grid-template-columns:1fr}}
  @media(prefers-reduced-motion:reduce){*{transition:none!important}}
</style></head>
<body>
  <div class="top-bar">Diagnóstico preparado por <b>Tree Marketing</b></div>
  <div class="wrap">
    <header>
      <div class="kick">Tu presencia digital, hoy</div>
      <h1>${esc(name)}</h1>
      <p class="subline">Miramos cómo te encuentra (o no) la gente en internet. Esto es lo que vimos.</p>
      <span class="pill"><span class="star">★</span> ${esc(p.rating ?? "")} · ${esc(p.reviews ?? 0)} reseñas en Google</span>
    </header>

    <section>
      <h2>Cómo te encontramos hoy</h2>
      <p class="sec-sub">Un repaso rápido de tu presencia online actual.</p>
      ${findings}
    </section>

    ${p.webState === "own" ? `<section id="psi-sec">
      <h2>Velocidad de tu sitio, según Google</h2>
      <p class="sec-sub">Medido en celular con PageSpeed, la herramienta oficial de Google.</p>
      <div id="psi" class="psi"><span class="psi-loading">Midiendo… (tarda unos segundos)</span></div>
    </section>` : ""}

    ${p.competitive && p.competitive.cohortSize >= 3 ? `<section>
      <h2>Cómo estás vs tu competencia</h2>
      <p class="sec-sub">Miramos los ${p.competitive.cohortSize} negocios de tu rubro en tu zona.</p>
      <div class="cgrid">
        <div class="cstat"><div class="cv">${p.competitive.reviewRank}º <small>de ${p.competitive.cohortSize}</small></div><div class="cl">por cantidad de reseñas</div></div>
        <div class="cstat"><div class="cv">${p.competitive.withWebCount} <small>de ${p.competitive.cohortSize}</small></div><div class="cl">competidores ya tienen sitio web</div></div>
      </div>
      <p class="lead" style="margin-top:18px">${esc(competitiveLine(p, resolveRubro(p).label))}</p>
    </section>` : ""}

    <section>
      <h2>Lo que conviene mejorar</h2>
      <p class="sec-sub">No es todo urgente. Esto es lo que más mueve la aguja para vos, en orden.</p>
      ${svcCards || `<p class="lead">Tu presencia está sólida. Igual hay margen para crecer con pauta.</p>`}
    </section>

    <section class="cta">
      <h2>¿Lo charlamos?</h2>
      <p>Te armamos un plan concreto, sin compromiso. Vos decidís.</p>
      ${wa ? `<a class="btn" href="${wa}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z"/><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2Z"/></svg>
        Hablemos por WhatsApp</a>` : `<a class="btn" href="#">Coordinemos una llamada</a>`}
    </section>

    <footer>Diagnóstico de demostración · <b>Tree Marketing</b> · ${new Date().getFullYear()}</footer>
  </div>
  ${p.webState === "own" ? `<script>
  (function(){
    var el=document.getElementById('psi'); if(!el) return;
    fetch('/api/pagespeed?placeId=${encodeURIComponent(p.placeId || "")}').then(function(r){return r.json()}).then(function(d){
      if(!d || d.error || (d.perf==null && d.seo==null)){ var s=document.getElementById('psi-sec'); if(s) s.style.display='none'; return; }
      function bar(label,v){ if(v==null) return '';
        var c = v>=90?'#16894a':v>=50?'#d98a2b':'#c0392b';
        return '<div class="psi-row"><span class="psi-l">'+label+'</span><span class="psi-bar"><i style="width:'+v+'%;background:'+c+'"></i></span><b style="color:'+c+'">'+v+'</b></div>';
      }
      el.innerHTML = bar('Velocidad',d.perf)+bar('SEO',d.seo)+bar('Accesibilidad',d.a11y)+bar('Buenas prácticas',d.bp);
    }).catch(function(){ var s=document.getElementById('psi-sec'); if(s) s.style.display='none'; });
  })();
  </script>` : ""}
</body></html>`;
  return regionOf(p) === "es" ? localizeES(html) : html;
}
