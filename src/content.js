// ============================================================
// Contenido de outreach y de landings, por rubro.
// Generado con un panel de agentes (workflow tree-demo-kit) y curado.
// Editable a mano. Los tokens {{...}} los llena el server.
// ============================================================

import { norm } from "./fill.js";
import { COPY_ES, SERVICE_COPY_ES, RUBROS_ES } from "./content-es.js";

// Región de contenido/idioma del candidato: "es" = España (peninsular), resto = "ar".
export function regionOf(candidate) {
  return candidate && candidate.region === "es" ? "es" : "ar";
}
export function copyOf(candidate) { return COPY[regionOf(candidate)] || COPY.ar; }
export function serviceCopyOf(candidate) { return SERVICE_COPY[regionOf(candidate)] || SERVICE_COPY.ar; }

// Resuelve el contenido del rubro a partir de un candidato (rubro/category),
// matcheando por las keywords de cada rubro (r.match) o por el slug, en la región.
export function resolveRubro(candidate) {
  const list = RUBROS_CONTENT[regionOf(candidate)] || RUBROS_CONTENT.ar;
  const hay = norm(`${candidate.rubro || ""} ${candidate.category || ""}`);
  const hit = list.find((r) => {
    if (r.slug === "generico") return false;
    const kws = r.match && r.match.length ? r.match : [r.slug];
    return kws.some((k) => hay.includes(norm(k)));
  });
  return hit || list.find((r) => r.slug === "generico") || list[0];
}

// Palabras que ya indican "marca de negocio" (si están, no se toca el nombre).
const BUSINESS_KW = /consultorio|consultor|cl[ií]nica|cl[ií]nico|estudio|centro|odontolog|dental|contable|contador|asociados|sociedad|grupo|instituto|sal[oó]n|peluquer|barber|taller|veterinar|inmobiliar|sa\b|srl|s\.?a\.?|s\.?r\.?l\.?|clinic|studio|center|office|group|&/i;

// Nombre de marca para la demo: si el nombre parece de persona/genérico, le
// antepone un descriptor del rubro para que se lea como un negocio real.
// Si ya parece marca, lo deja igual.
export function brandName(candidate) {
  const name = (candidate.name || "").trim();
  if (!name || name === "(sin nombre)") return "Tu Negocio";
  if (BUSINESS_KW.test(name)) return name;
  const c = resolveRubro(candidate);
  const words = name.split(/\s+/);
  const looksPlain = words.length >= 1 && words.length <= 3 && !/\d/.test(name);
  if (c.brandPrefix && looksPlain) return `${c.brandPrefix} ${name}`;
  return name;
}

const COPY_AR = {
  emailSubject: "{{NAME}}, te armé el sitio y quiero que lo veas",
  emailBody:
`Hola, soy de Tree Marketing. Encontramos {{NAME}} en {{NEIGHBORHOOD}} y vimos que tienen {{RATING}} estrellas con {{REVIEWS}} reseñas en Google. Eso habla muy bien del laburo que hacen.

Lo que notamos es que, cuando alguien los busca, no aparece un sitio propio para conocerlos mejor ni para contactarlos directo. Esa gente que ya los está buscando muchas veces termina en otro lado.

Así que en lugar de explicártelo, lo armamos: te dejamos una demo de tu propio sitio, lista, con la info de {{NAME}}. No es una maqueta genérica, es para tu {{RUBRO}}.

Miralo acá: {{DEMO_URL}}

Si te cierra, respondé este mail y lo dejamos andando. Si algo no te gusta, decímelo igual y lo ajustamos. Un saludo.`,
  whatsapp:
`Hola {{NAME}}, soy de Tree Marketing. Vimos su ficha en {{NEIGHBORHOOD}} con {{RATING}}★ y {{REVIEWS}} reseñas, muy buena.

Notamos que no tienen sitio web propio, así que les armamos una demo con la info de ustedes para que la vean: {{DEMO_URL}}

No es una plantilla genérica, es para su {{RUBRO}}. Si les gusta, la dejamos andando. ¿La miran y me cuentan?`,
  painSentences: {
    noWeb: "Cuando alguien busca {{NAME}} en Google no encuentra un sitio propio, solo la ficha, y termina decidiendo con menos información de la que ustedes podrían mostrar.",
    socialOnly: "Hoy toda su presencia depende de Instagram, y ahí el algoritmo manda; un sitio propio es de ustedes y no se lo lleva nadie.",
    fewPhotos: "Su ficha tiene pocas fotos, y en {{RUBRO}} la gente decide bastante por lo que ve antes de escribir.",
    unclaimed: "La ficha de Google de {{NAME}} todavía figura sin reclamar por el dueño, así que cualquiera podría editarla y ustedes pierden control de lo que aparece.",
    strongDemand: "Tienen {{RATING}}★ con {{REVIEWS}} reseñas, o sea demanda real, pero sin web esa gente que ya los elige no tiene a dónde ir a reservar o consultar.",
  },
  valueProps: [
    "Un sitio propio, rápido y que se ve bien en el celular, donde la mayoría te busca",
    "Tu info de Google ordenada: horarios, ubicación, servicios y forma de contacto en un solo lugar",
    "Botón directo a WhatsApp para que la consulta te llegue sin vueltas",
    "Te aparecemos mejor cuando te buscan por tu rubro en tu zona",
    "Lo dejamos andando nosotros: no tenés que pelearte con ninguna plataforma",
  ],
};

// Copy de outreach por servicio recomendado. {{DEAL_URL}} = link al deliverable
// (demo de sitio para web/redesign, diagnóstico /report para seo/social/paid).
const SERVICE_COPY_AR = {
  web: {
    emailSubject: "Así se vería {{NAME}} cuando te buscan en {{NEIGHBORHOOD}}",
    emailBody:
`Hola, soy de Tree Marketing. {{NAME}} tiene {{RATING}}★ con {{REVIEWS}} reseñas en Google: el laburo se nota. Lo que le falta es un lugar propio donde esa gente que ya los busca pueda conocerlos y escribirles directo.

Así que en vez de explicártelo, lo armamos: mirá cómo se vería tu sitio, listo y con tu info: {{DEAL_URL}}

Si te gusta, lo dejamos andando esta semana. Un saludo.`,
    whatsapp:
`Hola {{NAME}}, soy de Tree Marketing. Les armé una demo de cómo se vería su sitio propio: {{DEAL_URL}}
¿La miran y me cuentan?`,
  },
  redesign: {
    emailSubject: "Tu sitio, más rápido y pensado para el celular",
    emailBody:
`Hola, soy de Tree Marketing. {{NAME}} ({{RATING}}★, {{REVIEWS}} reseñas) merece una web a la altura. Entramos a la actual y, sobre todo desde el celular —donde la mayoría la abre—, se queda corta.

Le armamos una versión nueva para que veas la diferencia: {{DEAL_URL}}

Si te gusta, la dejamos andando. Un saludo.`,
    whatsapp:
`Hola {{NAME}}, soy de Tree Marketing. Les armé una versión nueva de su web, más rápida y para celular: {{DEAL_URL}}
¿La miran?`,
  },
  seo: {
    emailSubject: "Que {{NAME}} aparezca cuando buscan tu rubro en {{NEIGHBORHOOD}}",
    emailBody:
`Hola, soy de Tree Marketing. {{NAME}} tiene muy buena reputación ({{RATING}}★, {{REVIEWS}} reseñas), pero cuando alguien busca tu rubro en {{NEIGHBORHOOD}} no aparecés como deberías. Hay detalles concretos del sitio que lo están frenando.

Te armamos un diagnóstico con qué encontramos y cómo subir: {{DEAL_URL}}

Son cosas solucionables. ¿Lo miramos juntos?`,
    whatsapp:
`Hola {{NAME}}, soy de Tree Marketing. Tienen reputación bárbara pero no aparecen bien en Google. Les armé un diagnóstico de qué lo frena: {{DEAL_URL}}
¿Lo vemos?`,
  },
  social: {
    emailSubject: "Más clientes desde las redes para {{NAME}}",
    emailBody:
`Hola, soy de Tree Marketing. Nos gustó el laburo de {{NAME}} ({{RATING}}★) y vimos que las redes —donde tu público pasa el día— están desaprovechadas.

Te armamos un diagnóstico de tu presencia y dónde está la oportunidad: {{DEAL_URL}}

¿Te interesa que lo charlemos?`,
    whatsapp:
`Hola {{NAME}}, soy de Tree Marketing. Vimos que en redes hay mucho para aprovechar. Les armé un diagnóstico: {{DEAL_URL}}
¿Lo charlamos?`,
  },
  paid: {
    emailSubject: "Que te encuentre más de la gente que ya te busca",
    emailBody:
`Hola, soy de Tree Marketing. {{NAME}} tiene una reputación muy buena ({{RATING}}★, {{REVIEWS}} reseñas) — el tema no es la calidad, es el alcance. Hay gente buscando tu rubro en {{NEIGHBORHOOD}} que hoy no te encuentra.

Te armamos un diagnóstico con dónde está la oportunidad de crecer con pauta bien hecha: {{DEAL_URL}}

¿Lo vemos sin compromiso?`,
    whatsapp:
`Hola {{NAME}}, soy de Tree Marketing. El laburo está ({{RATING}}★); falta que los encuentre más gente. Les armé un diagnóstico con la oportunidad: {{DEAL_URL}}
¿Lo charlamos?`,
  },
  reviews: {
    emailSubject: "Más reseñas nuevas para {{NAME}} (y mejor lugar en Google)",
    emailBody:
`Hola, soy de Tree Marketing. {{NAME}} tiene buena reputación, pero las reseñas nuevas vienen lentas — y Google premia a los que reciben reseñas seguido, te muestra más arriba en Maps.

Te armamos un diagnóstico y un sistema simple para pedir reseñas por WhatsApp y QR, sin que persigas a nadie: {{DEAL_URL}}

¿Te muestro cómo funciona?`,
    whatsapp:
`Hola {{NAME}}, soy de Tree Marketing. Google muestra más arriba al que recibe reseñas seguido. Les armé un sistema simple para conseguir más: {{DEAL_URL}}
¿Te muestro?`,
  },
  gbp: {
    emailSubject: "Que tu ficha de Google trabaje para vos, {{NAME}}",
    emailBody:
`Hola, soy de Tree Marketing. En 2026 tu ficha de Google es lo que te muestra en Maps y hasta en las respuestas de IA (más que la web). La de {{NAME}} tiene cosas para completar que hoy te hacen perder lugar frente a tus competidores.

Te armamos un diagnóstico de qué le falta y cómo dejarla impecable: {{DEAL_URL}}

¿Lo vemos?`,
    whatsapp:
`Hola {{NAME}}, soy de Tree Marketing. Tu ficha de Google tiene cosas para completar que te hacen perder lugar en Maps. Les armé un diagnóstico: {{DEAL_URL}}
¿Lo vemos?`,
  },
};

const RUBROS_AR = [
  {
    slug: "odontologo",
    label: "odontología",
    template: "landing-odontologo.html",
    brandPrefix: "Consultorio",
    match: ["odontolog", "dentista", "dental", "dentist"],
    tagline: "Tu sonrisa en manos de un equipo que te explica todo antes de empezar",
    about: "Somos un consultorio odontológico con años atendiendo a la zona. Trabajamos con turnos puntuales, presupuestos claros y sin sorpresas. Lo más importante para nosotros es que entiendas tu tratamiento y te sientas cómodo en cada visita.",
    services: [
      { title: "Limpieza y control", desc: "Limpieza profesional y revisión general para mantener tu boca sana y prevenir problemas." },
      { title: "Arreglo de caries", desc: "Tratamos caries con materiales estéticos que se mimetizan con tu diente." },
      { title: "Conducto (endodoncia)", desc: "Salvamos la pieza cuando la caries llegó al nervio, sin dolor y en pocas sesiones." },
      { title: "Implantes", desc: "Reponemos piezas faltantes con implantes que se ven y funcionan como un diente natural." },
      { title: "Ortodoncia y alineadores", desc: "Enderezamos tu mordida con brackets o placas transparentes, según lo que prefieras." },
      { title: "Blanqueamiento", desc: "Aclaramos el color de tus dientes de forma segura y en consultorio." },
    ],
  },
  {
    slug: "estudio contable",
    label: "estudio contable",
    template: "landing-contable.html",
    brandPrefix: "Estudio",
    match: ["contable", "contador", "contadur", "accountant", "accounting"],
    tagline: "Tus números al día y en regla, sin que tengas que entender de impuestos",
    about: "Somos un estudio contable que acompaña a monotributistas, autónomos y pymes. Te sacamos el tema impositivo de la cabeza para que te dediques a tu negocio. Respondemos rápido y hablamos en criollo, no en jerga.",
    services: [
      { title: "Monotributo", desc: "Alta, recategorización y todo el seguimiento para que nunca te quedes afuera." },
      { title: "Liquidación de impuestos", desc: "Calculamos y presentamos IVA, Ganancias y lo que corresponda en fecha." },
      { title: "Sueldos y cargas sociales", desc: "Liquidamos los sueldos de tus empleados y presentamos las cargas todos los meses." },
      { title: "Balances y estados contables", desc: "Armamos tu balance anual listo para presentar ante AFIP, bancos o socios." },
      { title: "Asesoramiento impositivo", desc: "Te decimos cómo conviene facturar y armar tu negocio para pagar lo justo." },
      { title: "Inscripciones y trámites", desc: "Gestionamos altas en AFIP, ARCA, ingresos brutos y los trámites que necesites." },
    ],
  },
  {
    slug: "gastronomia",
    label: "gastronomía",
    template: "landing-gastronomia.html",
    match: ["restaurant", "resto", "parrilla", "pizzer", "cafe", "café", "cervec", "bar ", "bodeg", "comida", "gastronom", "cocina", "helader", "panaderia", "pasta"],
    tagline: "Cocina de verdad, en un lugar para quedarte sin apuro",
    about: "Cocinamos lo que nos gusta comer: ingredientes frescos, recetas de siempre y un lugar donde sentarte tranquilo. Atendemos como nos gusta que nos atiendan a nosotros.",
    services: [
      { title: "Cocina casera", desc: "Platos hechos al momento, con ingredientes frescos y de la zona." },
      { title: "Parrilla y achuras", desc: "Carnes a la parrilla en su punto justo, como tiene que ser." },
      { title: "Pastas caseras", desc: "Pastas amasadas en casa con salsas de verdad." },
      { title: "Para llevar y delivery", desc: "Pedí y retirá, o te lo llevamos a casa caliente." },
      { title: "Reservas", desc: "Coordinás tu mesa por WhatsApp y te esperamos." },
      { title: "Eventos y grupos", desc: "Cumpleaños, after office y mesas largas, sin drama." },
    ],
  },
  {
    slug: "estetica",
    label: "estética",
    template: "landing-estetica.html",
    match: ["peluquer", "estetica", "estética", "belleza", "spa", "barber", "manicur", "uñas", "depilac", "cosmetolog", "salon de belleza", "nails", "makeup", "maquillaje"],
    tagline: "Salí sintiéndote bien, en manos de gente que sabe lo que hace",
    about: "Hace años cuidamos a la gente del barrio. Trabajamos con productos de calidad, turnos puntuales y la atención personalizada que se merece cada persona que entra.",
    services: [
      { title: "Corte y peinado", desc: "El corte que te queda bien, asesorado según tu estilo." },
      { title: "Color y mechas", desc: "Coloración, mechas y matices con productos que cuidan el pelo." },
      { title: "Manicura y pedicura", desc: "Uñas prolijas y duraderas, tradicional o esmaltado semipermanente." },
      { title: "Tratamientos faciales", desc: "Limpieza e hidratación para que tu piel se sienta bien." },
      { title: "Depilación", desc: "Rápida, prolija y con la mayor comodidad posible." },
      { title: "Maquillaje y eventos", desc: "Te dejamos lista para tu día especial o el evento que sea." },
    ],
  },
  {
    slug: "inmobiliaria",
    label: "inmobiliaria",
    template: "landing-inmobiliaria.html",
    match: ["inmobiliar", "propiedad", "bienes raices", "bienes raíces", "corredor", "real estate", "loteo", "alquiler"],
    tagline: "La propiedad que buscás, con gente que conoce el barrio",
    about: "Conocemos la zona como nadie. Te acompañamos en cada paso de la operación con transparencia, sin letra chica, y nos ocupamos de que todo salga bien de principio a fin.",
    services: [
      { title: "Venta de propiedades", desc: "Publicamos, mostramos y vendemos tu propiedad al mejor precio posible." },
      { title: "Alquileres", desc: "Encontramos inquilinos serios y nos ocupamos del contrato." },
      { title: "Tasaciones", desc: "Te decimos cuánto vale realmente tu propiedad, sin humo." },
      { title: "Administración de alquileres", desc: "Cobramos, controlamos y te depositamos sin que muevas un dedo." },
      { title: "Asesoramiento legal", desc: "Contratos y escrituras revisados para que estés tranquilo." },
      { title: "Búsqueda personalizada", desc: "Nos decís qué buscás y te traemos opciones que encajan." },
    ],
  },
  {
    slug: "generico",
    label: "negocio",
    template: "landing-generico.html",
    tagline: "El servicio que buscás, hecho bien y por gente de la zona",
    about: "Hace años que trabajamos en el barrio y la mayoría de nuestros clientes llega por recomendación. Cumplimos con lo que prometemos, damos presupuesto antes de arrancar y respondemos cuando nos escribís. Así de simple.",
    services: [
      { title: "Presupuesto sin cargo", desc: "Te pasamos un precio claro antes de empezar, sin compromiso." },
      { title: "Atención personalizada", desc: "Escuchamos lo que necesitás y te proponemos la mejor solución para tu caso." },
      { title: "Trabajo garantizado", desc: "Respondemos por lo que hacemos; si algo no quedó bien, lo solucionamos." },
      { title: "Respuesta rápida", desc: "Te contestamos por WhatsApp o teléfono el mismo día." },
      { title: "Años de experiencia", desc: "Conocemos el oficio y la zona, y eso se nota en el resultado." },
    ],
  },
];

// ---------- Exports por región (AR = rioplatense, ES = peninsular) ----------
export const COPY = { ar: COPY_AR, es: COPY_ES };
export const SERVICE_COPY = { ar: SERVICE_COPY_AR, es: SERVICE_COPY_ES };
export const RUBROS_CONTENT = { ar: RUBROS_AR, es: RUBROS_ES };
