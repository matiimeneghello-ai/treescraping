export const LOGIN_PAGE = `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tree Prospect · acceso</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  :root{--bg:#04060f;--panel:#0a0f1f;--soft:rgba(255,255,255,.08);--acid:#b8ff57;--text:#eaeef6;--muted:#8893a7;--danger:#ff6b6b}
  *{box-sizing:border-box;margin:0}
  body{min-height:100vh;background:var(--bg);color:var(--text);font-family:'Bricolage Grotesque',system-ui,sans-serif;
    display:grid;place-items:center;
    background-image:radial-gradient(680px 420px at 80% -6%,rgba(184,255,87,.09),transparent 60%),radial-gradient(620px 500px at 10% 4%,rgba(94,194,255,.06),transparent 62%)}
  .box{width:92vw;max-width:380px;background:linear-gradient(180deg,#0e1426,var(--panel));border:1px solid var(--soft);
    border-radius:18px;padding:32px 28px;box-shadow:0 30px 80px -30px rgba(0,0,0,.9)}
  .logo{display:flex;align-items:center;gap:11px;margin-bottom:6px}
  .mark{width:34px;height:34px;border-radius:10px;background:linear-gradient(150deg,#b8ff57,#9be53c);position:relative}
  .mark::after{content:"";position:absolute;inset:0;margin:auto;width:12px;height:12px;background:var(--bg);transform:rotate(45deg)}
  h1{font-size:20px;font-weight:800;letter-spacing:-.03em}
  h1 span{color:var(--acid)}
  .sub{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:.14em;text-transform:uppercase;margin:14px 0 22px}
  label{display:block;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin:0 0 6px}
  input{width:100%;background:var(--bg);color:var(--text);border:1px solid var(--soft);border-radius:10px;
    padding:12px 14px;font-family:inherit;font-size:15px;margin-bottom:16px}
  input:focus{outline:none;border-color:var(--acid);box-shadow:0 0 0 3px rgba(184,255,87,.12)}
  button{width:100%;background:linear-gradient(180deg,#b8ff57,#9be53c);color:#06210a;border:none;border-radius:10px;
    padding:13px;font-family:inherit;font-weight:800;font-size:15px;cursor:pointer}
  button:hover{filter:brightness(1.06)}
  .err{color:var(--danger);font-size:13px;margin-top:6px;min-height:18px}
</style></head>
<body>
  <form class="box" id="f">
    <div class="logo"><div class="mark"></div><h1>tree<span>_</span>prospect</h1></div>
    <div class="sub">panel de prospección · acceso</div>
    <label>Usuario</label>
    <input id="u" autocomplete="username" autofocus />
    <label>Contraseña</label>
    <input id="p" type="password" autocomplete="current-password" />
    <button type="submit">Entrar</button>
    <div class="err" id="e"></div>
  </form>
<script>
document.getElementById('f').addEventListener('submit', async e=>{
  e.preventDefault();
  const u=document.getElementById('u').value.trim(), p=document.getElementById('p').value;
  const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user:u,pass:p})});
  if(r.ok){ location.href='/'; }
  else { document.getElementById('e').textContent='Usuario o contraseña incorrectos.'; }
});
</script>
</body></html>`;
