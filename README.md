# 🌳 Tree Prospect

Pipeline de prospección de negocios locales para **Tree Marketing**. Detecta comercios
con **buen negocio real pero presencia digital pobre** (sin web, solo Instagram, ficha sin
reclamar, pocas fotos), los puntúa, y prepara el outreach por WhatsApp con una demo.

Es la versión seria del workflow del reel de "side hustle con AI": en vez de spec masivo
y spam, datos reales + scoring + revisión humana + outreach 1-a-1 personalizado.

---

## Cómo correrlo

### 1. API key de Outscraper (gratis)
Por qué Outscraper y no la API oficial de Google: los Términos de Places API **prohíben
persistir** nombre/teléfono/rating (solo dejan guardar el place ID), y construir una base
de prospección violaría eso, con riesgo de que Google suspenda el proyecto GCP entero.
Outscraper devuelve datos públicos y asume el lado del scraping; además da campos que la API
oficial no da: **email, redes, conteo de fotos, si la ficha está sin reclamar, respuestas
del dueño a reviews**.

1. Crear cuenta en https://app.outscraper.com (free tier: 500 registros/mes).
2. Copiar la API key desde https://app.outscraper.com/profile.
3. `cp .env.example .env` y pegar la key en `OUTSCRAPER_API_KEY`.

### 2. Definir qué buscar
Editar [`src/config.js`](src/config.js) → `RUBROS` y `ZONAS`. El default (2 rubros × 2 zonas
× 60 = ~240 negocios) entra cómodo en el free tier.

### 3. Correr
```bash
npm run scan      # busca, puntúa y escribe output/candidates.{json,csv}
npm run enrich    # (opcional) enriquece el top con reviews recientes y re-puntúa
npm run serve     # dashboard de revisión en http://localhost:4477
```

En el dashboard: aprobás/descartás candidatos (se guarda en el navegador) y copiás un
mensaje de WhatsApp ya personalizado por negocio.

---

## El scoring (0–100)

**Gates duros** (si no pasan, no se puntúan): operativo, ≥20 reviews, rating ≥4.0, no cadena.

| Componente | Máx | Qué premia |
|---|---|---|
| Presencia web | 35 | sin web (+35), solo redes (+28), web rota (+10), web ok (+0) |
| Salud del negocio | 20 | rating + volumen de reviews |
| Fotos | 15 | pocas fotos = perfil descuidado |
| Perfil descuidado | 15 | sin responder reviews *(enrich)* + sin horarios |
| Actividad reciente | 10 | última review fresca = demanda viva *(enrich)* |
| Sin reclamar | 5 | ficha no reclamada por el dueño |

Los componentes *(enrich)* se completan con `npm run enrich`; sin él, el score base llega
a 75. **Candidato ideal** (sin web, 4.6★ con 80 reviews recientes sin responder, 3 fotos,
sin reclamar) ≈ 95: vive del boca en boca y no captura nada de la demanda de búsqueda.

> Detalle argentino clave: muchos comercios usan **Instagram como única "web"**. El pipeline
> clasifica el sitio en 3 estados (web propia / solo redes / nada); los dos últimos son
> candidatos, con pitch distinto.

---

## ⚠️ Reglas de uso (no romper)

- **WhatsApp**: el outreach va por la **app de WhatsApp Business, manual, 10–20/día**, número
  dedicado. NO por Cloud API: el cold outreach sin opt-in = ban de número (Meta lo prohíbe).
- **Opt-out**: si alguien dice que no, se registra y no se lo contacta nunca más (art. 27
  Ley 25.326 habilita marketing a datos comerciales públicos, pero obliga a dar de baja).
- **Revisión humana obligatoria**: nada sale sin que un humano apruebe el candidato y el
  mensaje. El dashboard es ese gate.
- **Datos**: guardamos solo datos del comercio, no de personas físicas (ni nombres de
  reviewers ni celulares personales).
- **Fotos**: no usar fotos de Google Maps en las demos (copyright + ToS). Stock o generadas.

---

## Costos a esta escala (~1.800 negocios/mes)

Datos vía Outscraper ≈ **USD 10/mes** (los primeros 500 registros gratis). El costo es
despreciable; el cuello de botella real es el **outreach manual de calidad**, no la data.

## Estructura

```
src/config.js      qué se busca + pesos del scoring
src/outscraper.js  cliente API (async + polling)
src/normalize.js   limpieza + clasificación de website + chequeo de webs vivas
src/score.js       gates + score
src/run.js         pipeline scan -> output/
src/enrich.js      enriquecimiento de la shortlist con reviews
src/serve.js       server del dashboard
review.html        dashboard de revisión + generador de WhatsApp
```
