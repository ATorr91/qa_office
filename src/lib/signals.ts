import type { TrendCategory } from "./trends";
import { smartSearch } from "./search";

export type SignalOrigin = "mercado" | "competencia";

export type SignalMediaType =
  | "articulo"
  | "case-study"
  | "red-social"
  | "infografia"
  | "video"
  | "reporte"
  | "conferencia"
  | "congreso"
  | "charla"
  | "workshop";

export const MEDIA_TYPE_LABELS: Record<SignalMediaType, string> = {
  articulo: "Artículo",
  "case-study": "Case study",
  "red-social": "Red social",
  infografia: "Infografía",
  video: "Video",
  reporte: "Reporte",
  conferencia: "Conferencia",
  congreso: "Congreso",
  charla: "Charla",
  workshop: "Workshop",
};

export const MEDIA_TYPE_OPTIONS: SignalMediaType[] = [
  "articulo",
  "reporte",
  "case-study",
  "video",
  "infografia",
  "red-social",
  "conferencia",
  "congreso",
  "charla",
  "workshop",
];

export interface Signal {
  id: string;
  title: string;
  blurb: string;
  category: TrendCategory;
  source: string;
  sourceUrl: string;
  mediaType: SignalMediaType;
  /** ISO date (YYYY-MM-DD) if we could confirm real publish date, null otherwise. */
  publishedAt: string | null;
  /**
   * Editorial relevance/opportunity score (0-100) assigned after actually reading
   * the verified source — not a live popularity metric.
   */
  heat: number;
  origin: SignalOrigin;
}

/**
 * Every entry below was found via real web search and confirmed live with a
 * direct fetch before being included — titles/summaries describe the actual
 * verified content, not a guess. Curated as of 2026-08-06.
 */
export const SIGNALS: Signal[] = [
  {
    id: "sig-ai-agents-as-users",
    title: "Los agentes de IA como nuevos \"usuarios\" de las interfaces",
    blurb:
      "Nielsen Norman Group argumenta que los agentes de IA que navegan interfaces (vía capturas de pantalla, árboles de accesibilidad o APIs) deben tratarse como un tipo genuino de usuario, no un caso límite: los fundamentos de accesibilidad hacen las interfaces más legibles tanto para humanos como para agentes.",
    category: "IA",
    source: "Nielsen Norman Group",
    sourceUrl: "https://www.nngroup.com/articles/ai-agents-as-users/",
    mediaType: "articulo",
    publishedAt: "2026-04-10",
    heat: 88,
    origin: "mercado",
  },
  {
    id: "sig-slickplan-ia-arquitectura-informacion",
    title: "Seis tendencias de arquitectura de información para 2026",
    blurb:
      "Slickplan repasa seis tendencias que redefinen la arquitectura de la información: IA para personalización y categorización automática, interfaces de voz y \"zero UI\", web semántica, IA/AR para pensamiento espacial, arquitectura \"content-first\" y accesibilidad como requisito central.",
    category: "IA",
    source: "Slickplan",
    sourceUrl: "https://slickplan.com/blog/information-architecture-trends",
    mediaType: "articulo",
    publishedAt: "2025-12-10",
    heat: 62,
    origin: "mercado",
  },
  {
    id: "sig-figma-2026-ai-report",
    title: "El informe de IA 2026 de Figma: la IA deja de ser un acto individual",
    blurb:
      "Basado en 8,403 respuestas de encuesta y 639 entrevistas en diez mercados, el reporte muestra que la IA pasa de herramienta de productividad individual a transformar la colaboración en equipo: 41% dice que la IA cambia cómo colabora su equipo (vs. 7% hace dos años) y 60% de los desarrolladores ya participa en trabajo de diseño.",
    category: "Tecnología",
    source: "Figma",
    sourceUrl: "https://www.figma.com/blog/2026-ai-report/",
    mediaType: "reporte",
    publishedAt: "2026-06-24",
    heat: 93,
    origin: "mercado",
  },
  {
    id: "sig-designers-in-the-loop-video",
    title: "\"Designers in the loop\": el estado de la IA en UX/UI en 2026",
    blurb:
      "Charla de Gil Ayalon (CTO de MonkeyTech) en el Builders Track de Architecture Next 2026, centrada en cómo los diseñadores están integrando la IA en sus flujos de trabajo de UX/UI día a día.",
    category: "Tecnología",
    source: "YouTube / Architecture Next 2026",
    sourceUrl: "https://www.youtube.com/watch?v=JLITclYPTPk",
    mediaType: "video",
    publishedAt: "2026-06-22",
    heat: 55,
    origin: "mercado",
  },
  {
    id: "sig-ai-in-design-2026-designerfund",
    title: "Informe \"AI in Design 2026\": los diseñadores se convierten en constructores",
    blurb:
      "Encuesta a más de 900 diseñadores en 60+ países con casos de Anthropic, Framer, Linear, Notion, Shopify, Sierra y Stripe: el uso semanal de IA en diseño saltó de 54% a 91% en un año, la mitad ya envió código generado por IA a producción, y los equipos usan en promedio 7 herramientas de IA (el doble que el año anterior).",
    category: "Metodología",
    source: "Designer Fund / Foundation Capital",
    sourceUrl: "https://designerfund.com/blog/ai-in-design-2026",
    mediaType: "reporte",
    publishedAt: "2026-07-29",
    heat: 95,
    origin: "mercado",
  },
  {
    id: "sig-sierra-design-case-study",
    title: "Cómo el equipo de diseño de Sierra sostiene una proporción de 1 a 20 con ingeniería",
    blurb:
      "Caso de estudio sobre Sierra (200M USD de ARR en poco más de dos años): un equipo de diseño muy pequeño da soporte a una ingeniería casi 20 veces mayor prototipando con datos reales, construyendo sistemas compartidos en vez de pulir pantallas individuales, y preservando deliberadamente el detalle artesanal donde vale la pena.",
    category: "Diseño UX/UI",
    source: "Designer Fund (Substack)",
    sourceUrl: "https://designerfund.substack.com/p/ai-design-sierra",
    mediaType: "case-study",
    publishedAt: "2026-07-20",
    heat: 80,
    origin: "mercado",
  },
  {
    id: "sig-digital-synopsis-graphic-trends",
    title: "20 tendencias de diseño gráfico para 2026, con la IA a la cabeza",
    blurb:
      "Página muy ilustrada con 4-5 ejemplos visuales por cada una de 20 tendencias (diseño generado por IA, diseño 3D y animación, tipografía líquida, bento grids, neo-brutalismo, glitch, retrofuturismo), presentando la IA como \"colaborador generativo\" que luego se refina con criterio humano.",
    category: "Diseño UX/UI",
    source: "Digital Synopsis",
    sourceUrl: "https://digitalsynopsis.com/design/graphic-design-trends-2026/",
    mediaType: "infografia",
    publishedAt: null,
    heat: 70,
    origin: "mercado",
  },
  {
    id: "sig-deloitte-digital-consumer-trends",
    title: "Deloitte: 63% de los consumidores del Reino Unido ya usó IA generativa",
    blurb:
      "El 17º informe anual de Deloitte UK (4,150 encuestas) encuentra que 63% ha usado alguna app de IA generativa pero solo 10% la usa a diario, y casi 27% no entiende que puede alucinar. También reporta que 75% de las mujeres del Reino Unido apoya prohibir redes sociales a menores de 16, y que las gafas inteligentes siguen estancadas en 2% de adopción.",
    category: "Cultura y consumo",
    source: "Deloitte",
    sourceUrl: "https://www.deloitte.com/uk/en/Industries/tmt/research/digital-consumer-trends.html",
    mediaType: "reporte",
    publishedAt: "2026-06-17",
    heat: 78,
    origin: "mercado",
  },
  {
    id: "sig-linkedin-apple-keynote-critique",
    title: "Crítica viral en LinkedIn: \"¿Es el fin de una era para el diseño de Apple?\"",
    blurb:
      "Publicación de un ex-IBM y profesor de industria que critica el rediseño de Keynote de Apple, argumentando que prioriza funciones de IA por encima de la usabilidad del caso de uso más común; menciona \"Liquid Glass\" como otro ejemplo de estética que compromete funcionalidad. Generó 78 reacciones y 50 comentarios.",
    category: "Cultura y consumo",
    source: "LinkedIn (Karel Vredenburg)",
    sourceUrl:
      "https://www.linkedin.com/posts/karelvredenburg_apple-design-designfail-activity-7438325278801711104-xwq-",
    mediaType: "red-social",
    publishedAt: null,
    heat: 65,
    origin: "mercado",
  },
  {
    id: "sig-comp-ideo-ai-design-experiments",
    title: "Siete experimentos que exploran los límites de la IA y el diseño",
    blurb:
      "IDEO presenta siete proyectos experimentales en la intersección IA-diseño: una red neuronal que reveló sesgos de entrenamiento al generar caricaturas, un \"bot de estacionamiento\" que terminó resistiendo órdenes humanas, un juego sobre sesgo algorítmico y la exhibición especulativa \"HyperHuman\".",
    category: "IA",
    source: "IDEO",
    sourceUrl: "https://www.ideo.com/journal/7-experiments-that-push-the-edges-of-ai-and-design",
    mediaType: "articulo",
    publishedAt: "2019-06-12",
    heat: 45,
    origin: "competencia",
  },
  {
    id: "sig-comp-pentagram-pienso",
    title: "Pentagram diseña la identidad de Pienso, una plataforma de IA sin código",
    blurb:
      "Pentagram Londres desarrolló identidad visual, tono de voz y sitio web para Pienso (entrenamiento de modelos de lenguaje sin programar): la persona de marca \"el Navegante Optimista\", tipografía Helvetica Now y una paleta de bloques geométricos inspirada en Bauhaus, buscando desmitificar la IA con casos de uso reales.",
    category: "Diseño UX/UI",
    source: "Pentagram",
    sourceUrl: "https://www.pentagram.com/work/pienso",
    mediaType: "case-study",
    publishedAt: null,
    heat: 68,
    origin: "competencia",
  },
  {
    id: "sig-comp-pentagram-ieee-honors",
    title: "Pentagram narra con datos la ceremonia de honores del IEEE 2026",
    blurb:
      "Para IEEE Honors 2026, Pentagram (liderado por Giorgia Lupi) creó una animación narrativa basada en datos para honrar a innovadores como Jensen Huang y Luis von Ahn, usando la metáfora de una placa madre donde las conexiones son \"trazas\" de circuito. Estrenada el 24 de abril de 2026 en Manhattan.",
    category: "Metodología",
    source: "Pentagram",
    sourceUrl: "https://www.pentagram.com/work/ieee-honors-ceremony-2026",
    mediaType: "video",
    publishedAt: "2026-04-24",
    heat: 60,
    origin: "competencia",
  },
  {
    id: "sig-comp-rga-forever-founder",
    title: "R/GA revive a su fundador como avatar conversacional de IA",
    blurb:
      "Por su 50 aniversario, R/GA creó \"Forever Founder\", un avatar de IA de su fundador Bob Greenberg construido con Runway Characters y entrenado con el archivo histórico de la agencia; respondió 145 preguntas en 20 conversaciones en su debut, incluyendo diez minutos consecutivos sin fallas.",
    category: "IA",
    source: "R/GA",
    sourceUrl: "https://runway.com/news/customers/rga",
    mediaType: "case-study",
    publishedAt: null,
    heat: 72,
    origin: "competencia",
  },
  {
    id: "sig-comp-frog-nome-robot",
    title: "Nome: el robot doméstico de frog para una IA física centrada en el humano",
    blurb:
      "frog (Capgemini Invent) propone con Nome un enfoque humano-centrado para \"IA física\" doméstica: diseñaron forma, modelo de interacción y comportamiento contextual inspirándose en el mobiliario cotidiano, con mapeo de vida diaria, principios de postura tipo contrapposto e interacción multimodal validada en VR.",
    category: "Tecnología",
    source: "frog (Capgemini Invent)",
    sourceUrl: "https://www.frog.co/work/designing-robots-for-human-spaces-with-physical-ai",
    mediaType: "case-study",
    publishedAt: null,
    heat: 82,
    origin: "competencia",
  },
  {
    id: "sig-comp-huge-darling-ingredients",
    title: "Huge usa imágenes generadas por IA para simplificar una marca industrial compleja",
    blurb:
      "Huge rediseñó la marca de Darling Ingredients (economía circular) usando imágenes generadas por IA para explicar procesos industriales complejos, y consolidó más de 30 sitios en una sola plataforma. Reportan +12.58% en tasa de interacción y +26.73% en tiempo promedio de interacción.",
    category: "Diseño UX/UI",
    source: "Huge Inc",
    sourceUrl: "https://www.hugeinc.com/work/darling-ingredients/",
    mediaType: "case-study",
    publishedAt: null,
    heat: 75,
    origin: "competencia",
  },
  {
    id: "sig-comp-accenture-life-trends-2026",
    title: "Accenture Song publica su reporte anual Life Trends 2026",
    blurb:
      "El reporte anual de Accenture Song identifica cinco macrotendencias de comportamiento humano frente a la tecnología (\"Stability Premium\", \"Human Journeys\", \"Finding Neo\", \"Good Vibrations\", \"Coming of Age\"), analizando cómo las personas reequilibran su relación con la tecnología: de la desconfianza en deepfakes a la búsqueda de conexiones genuinas.",
    category: "Cultura y consumo",
    source: "Accenture Song",
    sourceUrl:
      "https://www.accenture.com/content/dam/accenture/a-com-no-follow-no-index/document/Accenture-Life-Trends-2026-Forward-Together.pdf",
    mediaType: "reporte",
    publishedAt: null,
    heat: 90,
    origin: "competencia",
  },
  {
    id: "sig-comp-mckinsey-design-index",
    title: "McKinsey cuantifica el valor de negocio del diseño con el Design Index",
    blurb:
      "El estudio más extenso de McKinsey sobre cómo el diseño genera valor de negocio: 300 empresas públicas durante cinco años, más de 2 millones de datos financieros y más de 100,000 acciones de diseño. Las empresas mejor calificadas tuvieron +32 puntos de crecimiento de ingresos y +56 puntos de retorno a accionistas frente a sus pares.",
    category: "Metodología",
    source: "McKinsey & Company (McKinsey Design)",
    sourceUrl: "https://mckinsey.relayto.com/e/the-business-value-of-design-lhomner58jjl9",
    mediaType: "infografia",
    publishedAt: "2018-10-01",
    heat: 74,
    origin: "competencia",
  },
  {
    id: "sig-event-figma-config-2026",
    title: "Figma Config 2026",
    blurb:
      "La conferencia insignia de Figma para profesionales que construyen producto digital, en el Moscone Center de San Francisco (presencial y virtual). Anuncios recientes centrados en herramientas de animación, prompts de shaders personalizados y transformación de assets — Figma integrando IA generativa directo en el flujo de diseño de producto.",
    category: "Diseño UX/UI",
    source: "Figma",
    sourceUrl: "https://config.figma.com/san-francisco/",
    mediaType: "conferencia",
    publishedAt: "2026-06-23",
    heat: 90,
    origin: "mercado",
  },
  {
    id: "sig-event-adobe-max-2026",
    title: "Adobe MAX 2026",
    blurb:
      "La gran conferencia de creatividad de Adobe, con más de 200 sesiones en Miami Beach. Incluye un track dedicado \"Accelerating Creativity with AI\", junto con branding, liderazgo creativo, economía creadora y motion — IA generativa integrándose en herramientas creativas de uso masivo.",
    category: "Tecnología",
    source: "Adobe",
    sourceUrl: "https://max.adobe.com/",
    mediaType: "conferencia",
    publishedAt: "2026-11-10",
    heat: 85,
    origin: "mercado",
  },
  {
    id: "sig-event-future-product-days-2026",
    title: "Future Product Days 2026 (AI Conference)",
    blurb:
      "Conferencia europea en Copenhague, una de las citas de IA aplicada más relevantes para diseñadores, ingenieros y líderes de producto: interfaces adaptativas, automatización responsable, implementación de IA en empresas, y un tercer día íntegro de masterclasses prácticas para llevar ideas a ejecución.",
    category: "IA",
    source: "Future Product Days",
    sourceUrl: "https://www.futureproductdays.com/ai-conference-2026",
    mediaType: "conferencia",
    publishedAt: "2026-09-22",
    heat: 88,
    origin: "mercado",
  },
  {
    id: "sig-event-service-design-global-2026",
    title: "Service Design Global Conference 2026",
    blurb:
      "Congreso anual de la Service Design Network (vinculado a IxDA) en Wiesbaden, Alemania, con opción virtual: la referencia metodológica del sector para blueprint de servicios, diseño centrado en sistemas y estrategia end-to-end de experiencia.",
    category: "Metodología",
    source: "Service Design Network / IxDA",
    sourceUrl: "https://ixda.org/event/service-design-global-conference-2026/",
    mediaType: "congreso",
    publishedAt: "2026-10-28",
    heat: 75,
    origin: "mercado",
  },
  {
    id: "sig-event-smashingconf-freiburg-2026",
    title: "SmashingConf Freiburg 2026",
    blurb:
      "Edición 13 de SmashingConf en Friburgo, Alemania: cuatro días, un solo track, 12 speakers y talleres profundos sobre sistemas de diseño con IA, animación CSS, accesibilidad, ciencia del comportamiento aplicada a UX y prácticas web sostenibles, en formato de \"trabajo en vivo\".",
    category: "Diseño UX/UI",
    source: "Smashing Magazine",
    sourceUrl: "https://smashingconf.com/freiburg-2026",
    mediaType: "conferencia",
    publishedAt: "2026-09-07",
    heat: 80,
    origin: "mercado",
  },
  {
    id: "sig-event-ideo-u-ai-design-thinking-workshop",
    title: "IDEO U: taller de IA x Design Thinking",
    blurb:
      "Programa de IDEO U (la escuela online de IDEO) para integrar IA generativa en cada fase del design thinking: pensamiento creativo, síntesis, prototipado y uso responsable de IA. Formato de 5 semanas con sesiones en vivo, para principiantes y profesionales de cualquier industria.",
    category: "Metodología",
    source: "IDEO U",
    sourceUrl: "https://www.ideou.com/products/aiworkshop",
    mediaType: "workshop",
    publishedAt: "2026-08-17",
    heat: 83,
    origin: "competencia",
  },
  {
    id: "sig-event-new-default-humans-essential-ai",
    title: "\"Keeping Humans Essential in AI Design: Brand, Taste & Craft\"",
    blurb:
      "Charla en video de la serie \"The New Default\" con Dave Hoffera (trayectoria en frog, McKinsey y Amazon), sobre qué pasa con la identidad de marca, el gusto y el criterio humano cuando todos los equipos construyen con las mismas herramientas de IA generativa.",
    category: "Cultura y consumo",
    source: "Monterail (\"The New Default\")",
    sourceUrl: "https://www.youtube.com/watch?v=GbxHmEtMfU8",
    mediaType: "charla",
    publishedAt: "2026-02-09",
    heat: 68,
    origin: "mercado",
  },
  {
    id: "sig-event-frog-designmind-podcast-58",
    title: "Design Mind frogcast Ep. 58 — \"When Human Connection Meets AI\"",
    blurb:
      "Episodio del podcast de frog con Jess Leitch, Head of frog North America, sobre cómo el diseño pasó de función de soporte a socio estratégico en la era de IA, el fenómeno del \"vibe coding\" y por qué la conexión humana sigue siendo insustituible en situaciones emocionales.",
    category: "IA",
    source: "frog (Capgemini Invent)",
    sourceUrl: "https://www.frog.co/designmind/design-mind-frogcast-ep-58-when-human-connection-meets-ai",
    mediaType: "charla",
    publishedAt: "2026-04-16",
    heat: 65,
    origin: "competencia",
  },
];

export function getFreshnessLabel(publishedAt: string | null): string {
  if (!publishedAt) return "Fecha no confirmada";
  const diffMs = new Date(publishedAt).getTime() - Date.now();
  const isFuture = diffMs > 43_200_000; // more than ~12h ahead — treat as a genuinely future event
  const days = Math.round(Math.abs(diffMs) / 86_400_000);

  if (days === 0) return "Hoy";
  if (days === 1) return isFuture ? "En 1 día" : "Hace 1 día";
  if (days < 30) return isFuture ? `En ${days} días` : `Hace ${days} días`;
  const months = Math.round(days / 30);
  if (months < 12) {
    const unit = months === 1 ? "mes" : "meses";
    return isFuture ? `En ${months} ${unit}` : `Hace ${months} ${unit}`;
  }
  const years = Math.round(months / 12);
  const unit = years === 1 ? "año" : "años";
  return isFuture ? `En ${years} ${unit}` : `Hace ${years} ${unit}`;
}

/** Most significant curated signals first — not a literal "last 24h" filter, since real sources span years. */
export function getFeaturedSignals(origin: SignalOrigin | "all" = "all"): Signal[] {
  return [...SIGNALS].filter((s) => origin === "all" || s.origin === origin).sort((a, b) => b.heat - a.heat);
}

export function searchSignals(query: string, origin: SignalOrigin | "all" = "all"): Signal[] {
  const pool = SIGNALS.filter((s) => origin === "all" || s.origin === origin);
  const q = query.trim();
  if (q === "") return [...pool].sort((a, b) => b.heat - a.heat);
  return smartSearch(pool, q, (s) => [
    { text: s.title, weight: 3 },
    { text: s.blurb, weight: 1 },
    { text: s.category, weight: 2 },
    { text: s.source, weight: 1 },
  ]);
}
