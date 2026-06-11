# 🌳 Tree Prospect

Pipeline de prospección de negocios locales para **Tree Marketing**. Detecta comercios
con **buen negocio real pero presencia digital pobre** (sin web, solo Instagram, ficha sin
reclamar, pocas fotos), los puntúa, y prepara el outreach por WhatsApp con una demo.

Es la versión seria del workflow del reel de "side hustle con AI": en vez de spec masivo
y spam, datos reales + scoring + revisión humana + outreach 1-a-1 personalizado.

> **Primer scan real (CABA, 11-jun-2026):** 240 negocios escaneados → **27 candidatos**.
> Top: odontólogos y contadores en Villa Urquiza/Caballito con 4.9★ y hasta 162 reseñas,
> sin web ninguna. El perfil exacto que buscamos.

---

## Cómo correrlo (local)

### 1. Token de Apify (gratis, sin tarjeta)
Por qué Apify y no la API oficial de Google: los Términos de Places API **prohíben
persistir** nombre/teléfono/rating (solo dejan guardar el place ID); construir una base de
prospección violaría eso, con riesgo de suspensión del proyecto GCP. Apify scrapea datos
públicos y da campos que la API oficial no da: **conteo de fotos, si la ficha está sin
reclamar, respuestas del dueño a reviews**.

1. Crear cuenta en https://apify.com (plan free: **USD 5/mes de crédito, sin tarjeta**;
   un scan de ~240 negocios cuesta centavos).
2. Copiar el token desde https://console.apify.com/account/integrations
3. `cp .env.example .env` y pegar el token en `APIFY_TOKEN`.

### 2. Definir qué buscar
Editar [`src/config.js`](src/config.js) → `RUBROS` y `ZONAS` (o cargarlos desde el dashboard).
El default (2 rubros × 2 zonas × 60 = ~240 negocios) entra cómodo en el free tier.

### 3. Correr
```bash
npm run scan      # busca, puntúa y escribe output/candidates.{json,csv}
npm run serve     # dashboard en http://localhost:4477
```
En el dashboard: cargás rubros/zonas y tocás **Correr scan**, o revisás lo ya escaneado;
aprobás/descartás candidatos (se guarda en el navegador) y copiás un mensaje de WhatsApp
ya personalizado por negocio.

---

## Deploy en Railway

El repo trae `start` apuntando al dashboard, que escucha `process.env.PORT`. Railway lo
detecta solo. Configurá estas variables de entorno en el servicio:

| Var | Requerida | Para qué |
|---|---|---|
| `APIFY_TOKEN` | sí | correr scans desde la web |
| `DASHBOARD_KEY` | recomendada | si está seteada, el botón "Correr scan" pide esa clave (evita que cualquiera con la URL gaste crédito de Apify) |

Sin `DASHBOARD_KEY` el endpoint de scan queda abierto a quien tenga la URL — poné una.

---

## El scoring (0–100)

**Gates duros** (si no pasan, no se puntúan): operativo, ≥20 reviews, rating ≥4.0, no cadena.

| Componente | Máx | Qué premia |
|---|---|---|
| Presencia web | 35 | sin web (+35), solo redes (+28), web rota (+10), web ok (+0) |
| Salud del negocio | 20 | rating + volumen de reviews |
| Fotos | 15 | pocas fotos = perfil descuidado |
| Perfil descuidado | 15 | sin responder reviews + sin horarios |
| Actividad reciente | 10 | última review fresca = demanda viva |
| Sin reclamar | 5 | ficha no reclamada por el dueño |

Los componentes "sin responder reviews" y "actividad reciente" sólo se completan si el scan
trae reviews: poné `maxReviews > 0` en [`src/config.js`](src/config.js) (cuesta un poco más).
Con `maxReviews: 0` (default, barato) el score base llega a 75. **Candidato ideal** (sin web,
4.6★ con 80 reviews recientes sin responder, 3 fotos, sin reclamar) ≈ 95.

> Detalle argentino clave: muchos comercios usan **Instagram como única "web"**. El pipeline
> clasifica el sitio en 3 estados (web propia / solo redes / nada); los dos últimos son
> candidatos, con pitch distinto.

---

## ⚠️ Reglas de uso (no romper)

- **WhatsApp**: el outreach va por la **app de WhatsApp Business, manual, 10–20/día**, número
  dedicado. NO por Cloud API: cold outreach sin opt-in = ban de número (Meta lo prohíbe).
- **Opt-out**: si alguien dice que no, se registra y no se lo contacta nunca más (art. 27
  Ley 25.326 habilita marketing a datos comerciales públicos, pero obliga a dar de baja).
- **Revisión humana obligatoria**: nada sale sin que un humano apruebe el candidato y el
  mensaje. El dashboard es ese gate.
- **Datos**: guardamos solo datos del comercio, no de personas físicas.
- **Fotos**: no usar fotos de Google Maps en las demos (copyright + ToS). Stock o generadas.

---

## Estructura

```
src/config.js     qué se busca + pesos del scoring
src/apify.js      cliente del actor compass/crawler-google-places (async)
src/normalize.js  limpieza + clasificación de website + chequeo de webs vivas
src/score.js      gates + score
src/pipeline.js   lógica del scan (la usan el CLI y el server)
src/run.js        CLI: npm run scan
src/serve.js      server del dashboard + endpoint de scan
review.html       dashboard: control de scan, revisión, generador de WhatsApp
```
