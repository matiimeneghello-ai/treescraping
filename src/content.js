// ============================================================
// Contenido de outreach y de landings, por rubro.
// Generado con un panel de agentes (workflow tree-demo-kit) y curado.
// Editable a mano. Los tokens {{...}} los llena el server.
// ============================================================

import { norm } from "./fill.js";

// Resuelve el contenido del rubro a partir de un candidato (rubro/category),
// matcheando por las keywords de cada rubro (r.match) o por el slug.
export function resolveRubro(candidate) {
  const hay = norm(`${candidate.rubro || ""} ${candidate.category || ""}`);
  const hit = RUBROS_CONTENT.find((r) => {
    if (r.slug === "generico") return false;
    const kws = r.match && r.match.length ? r.match : [r.slug];
    return kws.some((k) => hay.includes(norm(k)));
  });
  return hit || RUBROS_CONTENT.find((r) => r.slug === "generico") || RUBROS_CONTENT[0];
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

export const COPY = {
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

export const RUBROS_CONTENT = [
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
