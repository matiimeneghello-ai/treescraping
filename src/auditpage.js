// ============================================================
// Página pública /audit — lead magnet: el visitante pone la URL de su
// negocio y recibe un diagnóstico gratis (corre el mismo motor de audit
// + recomendación). Pensada para embeber/linkear desde treemkt.ar.
// ============================================================

export const AUDIT_PAGE = `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Auditá tu presencia digital · Tree Marketing</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{--bg:#f6f8f6;--surface:#fff;--ink:#16241c;--ink-soft:#41514a;--mute:#6b7b73;--border:#e2e8e3;
    --brand:#1f7a44;--brand-deep:#156335;--brand-wash:#e8f3ec;--y:#16894a;--n:#c0392b;--warn:#d98a2b;}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Manrope",system-ui,sans-serif;background:var(--bg);color:var(--ink);line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
  .wrap{max-width:720px;margin:0 auto;padding:0 20px}
  a{color:inherit}
  .top{background:var(--ink);color:#dfeee5;font-size:13px;padding:10px 0;text-align:center}
  .top b{color:#fff}
  header{padding:56px 0 18px;text-align:center}
  .kick{font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--brand);margin-bottom:14px}
  h1{font-size:clamp(2rem,6.5vw,3rem);font-weight:800;letter-spacing:-.02em;line-height:1.1}
  .sub{color:var(--ink-soft);font-size:1.1rem;margin-top:16px;max-width:34ch;margin-inline:auto}
  form{display:flex;gap:10px;flex-wrap:wrap;margin:30px 0 8px;background:var(--surface);border:1px solid var(--border);
    border-radius:16px;padding:10px;box-shadow:0 10px 30px -18px rgba(22,36,28,.4)}
  input{flex:1;min-width:200px;border:none;background:transparent;color:var(--ink);font-family:inherit;font-size:1.05rem;padding:14px 14px;outline:none}
  button{background:var(--brand);color:#fff;border:none;border-radius:11px;font-family:inherit;font-weight:800;font-size:1.02rem;
    padding:0 26px;min-height:54px;cursor:pointer;transition:background .18s,transform .18s}
  button:hover{background:var(--brand-deep);transform:translateY(-1px)}
  button:disabled{opacity:.6;cursor:wait}
  .hint{text-align:center;color:var(--mute);font-size:.86rem;margin-bottom:40px}
  section{background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:28px 26px;margin-bottom:18px}
  h2{font-size:1.3rem;font-weight:800;margin-bottom:6px}
  .sec-sub{color:var(--mute);font-size:.95rem;margin-bottom:18px}
  .checks{list-style:none;display:grid;gap:11px}
  .chk{display:flex;align-items:flex-start;gap:12px;font-size:1rem;color:var(--ink-soft)}
  .chk .ico{width:26px;height:26px;border-radius:8px;flex:none;display:grid;place-items:center}
  .chk.y .ico{background:#e6f5ec}.chk.n .ico{background:#fae9e6}
  .chk .ico svg{width:16px;height:16px}
  .chk.n span:last-child{color:var(--ink);font-weight:600}
  .svc{border:1px solid var(--border);border-radius:14px;padding:18px 20px;margin-top:12px;position:relative}
  .svc.top{border-color:var(--brand);background:var(--brand-wash)}
  .svc .tag{position:absolute;top:-11px;left:16px;background:var(--brand);color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;padding:4px 11px;border-radius:999px}
  .svc h3{font-size:1.1rem;font-weight:800;margin-bottom:5px}
  .svc p{color:var(--ink-soft);font-size:.96rem}
  .psi{display:grid;gap:13px}
  .psi-loading{color:var(--mute)}
  .psi-row{display:flex;align-items:center;gap:12px}
  .psi-l{flex:0 0 120px;font-size:.92rem;color:var(--ink-soft)}
  .psi-bar{flex:1;height:9px;background:#edf1ee;border-radius:6px;overflow:hidden}
  .psi-bar i{display:block;height:100%;border-radius:6px}
  .psi-row b{flex:0 0 32px;text-align:right;font-variant-numeric:tabular-nums}
  .cta{background:linear-gradient(160deg,var(--brand),var(--brand-deep));color:#fff;text-align:center;border:none}
  .cta h2{color:#fff}.cta p{color:#dff0e6;margin-bottom:18px}
  .cta a{display:inline-flex;background:#fff;color:var(--brand-deep);font-weight:800;border-radius:999px;padding:14px 28px;min-height:52px;align-items:center}
  #out{margin-top:24px}
  .err{color:var(--n);text-align:center;margin-top:16px}
  footer{text-align:center;color:var(--mute);font-size:12.5px;padding:24px 0 48px}
  .spin{display:inline-block;width:18px;height:18px;border:3px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:s .7s linear infinite;vertical-align:-3px}
  @keyframes s{to{transform:rotate(360deg)}}
</style></head>
<body>
  <div class="top">Herramienta gratuita de <b>Tree Marketing</b></div>
  <div class="wrap">
    <header>
      <div class="kick">Diagnóstico digital gratis</div>
      <h1>¿Tu negocio aparece como debería en internet?</h1>
      <p class="sub">Poné la web de tu negocio y te decimos, en 30 segundos, qué está bien y qué conviene mejorar.</p>
      <form id="f">
        <input id="u" type="text" placeholder="tunegocio.com.ar" autocomplete="off" />
        <button id="b" type="submit">Analizar gratis</button>
      </form>
      <div class="hint">Sin registro. Te mostramos el resultado al toque.</div>
    </header>
    <div id="out"></div>
  </div>
  <footer>Tree Marketing · ${new Date().getFullYear()}</footer>
<script>
const ICO_Y='<svg viewBox="0 0 24 24" fill="none" stroke="#16894a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
const ICO_N='<svg viewBox="0 0 24 24" fill="none" stroke="#c0392b" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function chk(ok,l){return '<li class="chk '+(ok?'y':'n')+'"><span class="ico">'+(ok?ICO_Y:ICO_N)+'</span><span>'+esc(l)+'</span></li>'}
const f=document.getElementById('f'),out=document.getElementById('out'),b=document.getElementById('b');
f.addEventListener('submit',async e=>{
  e.preventDefault();
  const u=document.getElementById('u').value.trim(); if(!u) return;
  b.disabled=true; b.innerHTML='<span class="spin"></span>'; out.innerHTML='';
  let d; try{ d=await fetch('/api/audit-url',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:u})}).then(r=>r.json()); }
  catch{ out.innerHTML='<div class="err">No pudimos analizar el sitio. Probá de nuevo.</div>'; b.disabled=false; b.textContent='Analizar gratis'; return; }
  b.disabled=false; b.textContent='Analizar de nuevo';
  if(d.error){ out.innerHTML='<div class="err">'+esc(d.error)+'</div>'; return; }
  const a=d.audit||{};
  let html='';
  if(a.reachable){
    html+='<section><h2>Cómo te encuentran hoy</h2><p class="sec-sub">'+esc(d.url)+'</p><ul class="checks">'+
      chk(a.https,'Conexión segura (HTTPS)')+chk(a.hasViewport,'Adaptado a celular')+
      chk(a.hasTitle&&a.titleLen>=10,'Título de página claro')+chk(a.hasMetaDesc,'Descripción para Google')+
      chk(a.hasSchema,'Datos de negocio local (schema)')+chk((a.social||[]).length>0,'Redes enlazadas')+
      chk((a.words||0)>=200,'Contenido suficiente')+chk(a.hasPixel,'Pixel para medir y retargetear')+
      '</ul></section>';
  } else {
    html+='<section><h2>No pudimos cargar tu sitio</h2><p class="sec-sub">'+esc(d.url)+'</p><p>Tardó demasiado o no responde — eso ya es algo a revisar: si a nosotros nos costó, a tus clientes también.</p></section>';
  }
  if(d.psiPending){
    html+='<section id="psi-sec"><h2>Velocidad, según Google</h2><p class="sec-sub">Medido en celular con PageSpeed.</p><div id="psi" class="psi"><span class="psi-loading">Midiendo… (Google tarda unos segundos)</span></div></section>';
  }
  const svcs=d.services||[];
  if(svcs.length){
    html+='<section><h2>Lo que conviene mejorar</h2><p class="sec-sub">En orden de impacto para vos.</p>'+
      svcs.map((s,i)=>'<div class="svc '+(i===0?'top':'')+'">'+(i===0?'<span class="tag">Lo más urgente</span>':'')+'<h3>'+esc(s.label)+'</h3><p>'+esc(s.reason)+'</p></div>').join('')+'</section>';
  }
  html+='<section class="cta"><h2>¿Lo resolvemos juntos?</h2><p>En Tree Marketing armamos un plan concreto para tu negocio, sin compromiso.</p><a href="https://wa.me/" target="_blank">Hablemos por WhatsApp</a></section>';
  out.innerHTML=html;
  out.scrollIntoView({behavior:'smooth',block:'start'});
  if(d.psiPending){
    fetch('/api/audit-psi?url='+encodeURIComponent(d.url)).then(r=>r.json()).then(function(p){
      var el=document.getElementById('psi'); if(!el) return;
      if(!p || p.error || (p.perf==null && p.seo==null)){ var s=document.getElementById('psi-sec'); if(s) s.style.display='none'; return; }
      function bar(l,v){ if(v==null) return ''; var c=v>=90?'#16894a':v>=50?'#d98a2b':'#c0392b';
        return '<div class="psi-row"><span class="psi-l">'+l+'</span><span class="psi-bar"><i style="width:'+v+'%;background:'+c+'"></i></span><b style="color:'+c+'">'+v+'</b></div>'; }
      el.innerHTML=bar('Velocidad',p.perf)+bar('SEO',p.seo)+bar('Accesibilidad',p.a11y)+bar('Buenas prácticas',p.bp);
    }).catch(function(){ var s=document.getElementById('psi-sec'); if(s) s.style.display='none'; });
  }
});
</script>
</body></html>`;
