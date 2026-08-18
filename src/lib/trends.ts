export type TrendRing = "emergente" | "adopcion" | "mainstream";

export type TrendCategory =
  | "IA"
  | "Diseño UX/UI"
  | "Metodología"
  | "Tecnología"
  | "Cultura y consumo";

export interface SoWhat {
  porque: string;
  impacto: string;
  accion: string;
}

export type PestleCategory =
  | "Político"
  | "Económico"
  | "Social"
  | "Tecnológico"
  | "Legal"
  | "Ecológico";

export const PESTLE_OPTIONS: PestleCategory[] = [
  "Político",
  "Económico",
  "Social",
  "Tecnológico",
  "Legal",
  "Ecológico",
];

export interface RealExample {
  org: string;
  detail: string;
}

export interface Trend {
  id: string;
  title: string;
  category: TrendCategory;
  ring: TrendRing;
  summary: string;
  source: string;
  sourceUrl?: string;
  spottedAt: string;
  soWhat: SoWhat;
  relevance: number;
  trending: number;
  opportunity: number;
  pinned: boolean;
  /** Marcos de análisis (Trendhunting y Futuros Tecnológicos): PESTLE. El anillo (ring) ya cumple el rol de "Anillos de Impacto" por horizonte temporal. */
  pestle: PestleCategory[];
  realExamples: RealExample[];
  adopters: string[];
  impactPotential: string;
}

export type TrendSortKey = "relevance" | "trending" | "opportunity" | "recent";

export const SORT_OPTIONS: { value: TrendSortKey; label: string }[] = [
  { value: "recent", label: "Más recientes" },
  { value: "relevance", label: "Más relevantes" },
  { value: "trending", label: "En tendencia" },
  { value: "opportunity", label: "Oportunidad de mercado" },
];

export const RING_OPTIONS: TrendRing[] = ["emergente", "adopcion", "mainstream"];

export const RING_LABELS: Record<TrendRing, string> = {
  emergente: "Emergente",
  adopcion: "En adopción",
  mainstream: "Mainstream",
};

export const RING_TIMEFRAME: Record<TrendRing, string> = {
  emergente: "1–3 años",
  adopcion: "6–12 meses",
  mainstream: "Aplica hoy",
};

export const CATEGORY_OPTIONS: TrendCategory[] = [
  "IA",
  "Diseño UX/UI",
  "Metodología",
  "Tecnología",
  "Cultura y consumo",
];

export const TRENDS: Trend[] = [
  {
    id: "interfaces-generativas-tiempo-real",
    title: "Interfaces generativas en tiempo real",
    category: "Diseño UX/UI",
    ring: "emergente",
    summary:
      "En lugar de flujos estáticos predefinidos, la interfaz se genera y reordena en el momento según el contexto e intención del usuario, usando modelos generativos en el front-end.",
    source: "Nielsen Norman Group",
    sourceUrl: "https://www.nngroup.com/",
    spottedAt: "2026-06-02",
    soWhat: {
      porque:
        "Los flujos estáticos ya no diferencian a un producto; la personalización en tiempo real será la próxima ventaja competitiva en UX.",
      impacto:
        "Los clientes empezarán a pedir experiencias 'que se adaptan solas' en vez de wireframes fijos por perfil de usuario.",
      accion:
        "Montar un prototipo interno con un layout que reordene componentes según el rol del usuario, usando un LLM como capa de decisión.",
    },
    relevance: 78,
    trending: 64,
    opportunity: 71,
    pinned: false,
    pestle: ["Tecnológico", "Social"],
    realExamples: [
      {
        org: "Arc (The Browser Company)",
        detail: "Arc Search reordena resultados y componentes de la página según la consulta del usuario en tiempo real.",
      },
      {
        org: "Notion AI",
        detail: "Genera bloques y layouts de página bajo demanda a partir de una instrucción, en vez de plantillas fijas.",
      },
    ],
    adopters: ["Arc (The Browser Company)", "Notion AI"],
    impactPotential:
      "Podría volver obsoletos los wireframes estáticos por rol de usuario; los equipos de diseño necesitarán definir 'reglas de generación' en vez de solo pantallas.",
  },
  {
    id: "prototipado-ia-cursor-lovable",
    title: "Prototipar en código con IA en vez de solo Figma",
    category: "Metodología",
    ring: "adopcion",
    summary:
      "Equipos de producto están pasando de maquetas estáticas en Figma a prototipos funcionales generados directamente en código con herramientas como Cursor, Lovable o v0.",
    source: "GitHub Trending",
    sourceUrl: "https://github.com/trending",
    spottedAt: "2026-05-20",
    soWhat: {
      porque:
        "Reduce la distancia entre diseño y desarrollo: el cliente valida algo que ya funciona, no una simulación.",
      impacto:
        "Las fases de Discovery pueden entregar un prototipo navegable y con datos reales en vez de solo mockups, acortando el ciclo de validación.",
      accion:
        "Piloto: la próxima propuesta de Discovery se entrega como prototipo en Lovable en vez de solo Figma.",
    },
    relevance: 88,
    trending: 91,
    opportunity: 85,
    pinned: true,
    pestle: ["Tecnológico", "Económico"],
    realExamples: [
      {
        org: "Vercel (v0)",
        detail: "Genera componentes React productivos a partir de un prompt de diseño, usados directo en producción.",
      },
      {
        org: "Cursor",
        detail: "Editor con IA integrada que permite iterar UI y lógica en el mismo entorno sin saltar a Figma.",
      },
    ],
    adopters: ["Vercel (v0)", "Cursor", "Replit"],
    impactPotential:
      "Acorta el ciclo Discovery → Prototipo de semanas a días; el rol de 'diseñador' se acerca al de 'ingeniero de producto'.",
  },
  {
    id: "agentes-autonomos-producto",
    title: "Agentes autónomos embebidos en el producto",
    category: "IA",
    ring: "adopcion",
    summary:
      "Los productos digitales están incorporando agentes que ejecutan tareas completas en nombre del usuario (reservar, comparar, llenar formularios) en vez de solo responder preguntas.",
    source: "Gartner Hype Cycle",
    sourceUrl: "https://www.gartner.com/en/research/methodologies/gartner-hype-cycle",
    spottedAt: "2026-05-11",
    soWhat: {
      porque:
        "El usuario espera cada vez menos pasos manuales; un agente que actúa es una ventaja de conversión medible.",
      impacto:
        "Los clientes con plataformas transaccionales (checkout, reservas, soporte) van a pedir agentes, no solo chatbots informativos.",
      accion:
        "Mapear un flujo transaccional actual de un cliente y diseñar la versión 'agentic' como ejercicio de venta.",
    },
    relevance: 92,
    trending: 95,
    opportunity: 89,
    pinned: true,
    pestle: ["Tecnológico", "Legal", "Económico"],
    realExamples: [
      {
        org: "Klarna",
        detail: "Su asistente de IA resuelve tareas de soporte completas (reembolsos, cambios) sin intervención humana.",
      },
      {
        org: "Perplexity",
        detail: "Sus agentes de compra completan checkouts y reservas en nombre del usuario de principio a fin.",
      },
    ],
    adopters: ["Klarna", "Perplexity", "Booking.com"],
    impactPotential:
      "Cambia el diseño de flujos de 'guiar al usuario' a 'delegar la tarea'; introduce nuevas responsabilidades legales sobre acciones tomadas por el agente.",
  },
  {
    id: "onboarding-conversacional",
    title: "Onboarding conversacional (chat-first)",
    category: "Diseño UX/UI",
    ring: "adopcion",
    summary:
      "El alta de usuarios se está moviendo de wizards de varios pasos a una conversación guiada por IA que recopila la misma información de forma natural.",
    source: "Product Hunt",
    sourceUrl: "https://www.producthunt.com/",
    spottedAt: "2026-04-28",
    soWhat: {
      porque:
        "Reduce la fricción percibida del onboarding largo sin reducir los datos que realmente se necesitan capturar.",
      impacto:
        "Los KPIs de activación de nuevos clientes podrían mejorar si sustituimos formularios largos por un flujo conversacional.",
      accion:
        "Prototipar un onboarding conversacional para el producto con peor tasa de activación del portafolio actual.",
    },
    relevance: 74,
    trending: 68,
    opportunity: 66,
    pinned: false,
    pestle: ["Social", "Tecnológico"],
    realExamples: [
      {
        org: "Duolingo",
        detail: "Usa un flujo conversacional guiado por IA para definir el plan de aprendizaje inicial del usuario.",
      },
      {
        org: "Intercom (Fin)",
        detail: "Su agente recopila datos de configuración de cuenta a través de chat en vez de formularios.",
      },
    ],
    adopters: ["Duolingo", "Intercom"],
    impactPotential:
      "Puede mejorar la activación en productos con formularios largos, pero exige diseñar una 'personalidad conversacional' como parte del design system.",
  },
  {
    id: "design-systems-mantenidos-ia",
    title: "Design systems generados y mantenidos por IA",
    category: "Metodología",
    ring: "emergente",
    summary:
      "Los tokens y componentes del design system se generan y actualizan automáticamente a partir del código de producción, en vez de mantenerse manualmente en Figma.",
    source: "Figma Config (keynote)",
    spottedAt: "2026-03-30",
    soWhat: {
      porque:
        "Elimina el desfase crónico entre lo que dice el design system y lo que realmente existe en producción.",
      impacto:
        "Los equipos de estrategas podrían auditar consistencia de marca de un cliente de forma automática, no manual.",
      accion:
        "Evaluar una herramienta tipo Style Dictionary/Terrazzo en un proyecto interno como prueba de concepto.",
    },
    relevance: 81,
    trending: 73,
    opportunity: 77,
    pinned: false,
    pestle: ["Tecnológico"],
    realExamples: [
      {
        org: "Shopify (Polaris)",
        detail: "Experimenta con pipelines que detectan drift entre el design system y el código en producción.",
      },
      {
        org: "GitHub (Primer)",
        detail: "Explora generación automática de documentación de tokens directamente desde el código.",
      },
    ],
    adopters: ["Shopify", "GitHub"],
    impactPotential:
      "Reduce el trabajo manual de mantenimiento del design system, pero exige gobernanza clara sobre qué cambios se aceptan de forma automática.",
  },
  {
    id: "haptica-avanzada-wearables",
    title: "Micro-interacciones con háptica avanzada",
    category: "Tecnología",
    ring: "emergente",
    summary:
      "Wearables y dispositivos móviles están incorporando patrones hápticos ricos para comunicar estados del sistema sin depender de la pantalla.",
    source: "WGSN",
    sourceUrl: "https://www.wgsn.com/",
    spottedAt: "2026-03-14",
    soWhat: {
      porque:
        "Abre un canal sensorial adicional para UX en contextos donde mirar la pantalla no es viable (manejando, en movimiento).",
      impacto:
        "Clientes de banca o salud con apps móviles podrían diferenciarse con feedback háptico en confirmaciones críticas.",
      accion:
        "Documentar un catálogo básico de patrones hápticos recomendados para los proyectos móviles activos.",
    },
    relevance: 52,
    trending: 45,
    opportunity: 48,
    pinned: false,
    pestle: ["Tecnológico", "Social"],
    realExamples: [
      {
        org: "Apple Watch",
        detail: "El Taptic Engine ya comunica estados (fin de entrenamiento, notificaciones) sin sonido ni pantalla.",
      },
      {
        org: "Meta",
        detail: "Su pulsera de control neuronal explora feedback háptico como canal de confirmación silenciosa.",
      },
    ],
    adopters: ["Apple", "Meta"],
    impactPotential:
      "Abre un canal de comunicación adicional para contextos manos-libres; relevante para apps de salud, fitness y banca móvil.",
  },
  {
    id: "investigacion-ux-synthetic-users",
    title: "Investigación UX asistida por usuarios sintéticos",
    category: "Metodología",
    ring: "adopcion",
    summary:
      "Equipos de research usan agentes que simulan segmentos de usuarios para hacer primeras rondas de pruebas de usabilidad antes de reclutar personas reales.",
    source: "r/UXResearch",
    spottedAt: "2026-05-02",
    soWhat: {
      porque:
        "Permite iterar prototipos mucho más rápido antes de gastar presupuesto de reclutamiento real.",
      impacto:
        "Se podría ofrecer una fase de 'pre-validación sintética' más barata como parte del paquete de Discovery.",
      accion:
        "Probar una ronda de usuarios sintéticos sobre el último prototipo entregado y comparar hallazgos contra usuarios reales.",
    },
    relevance: 85,
    trending: 79,
    opportunity: 82,
    pinned: false,
    pestle: ["Tecnológico", "Económico"],
    realExamples: [
      {
        org: "Synthetic Users",
        detail: "Plataforma que genera entrevistas simuladas con personas sintéticas para validar hipótesis antes de reclutar usuarios reales.",
      },
      {
        org: "UserTesting",
        detail: "Incorporó paneles de 'usuarios de IA' como primera capa de feedback antes de estudios moderados.",
      },
    ],
    adopters: ["Synthetic Users", "UserTesting"],
    impactPotential:
      "Reduce costo y tiempo de las primeras rondas de validación, aunque no sustituye la investigación con usuarios reales en decisiones críticas.",
  },
  {
    id: "accesibilidad-requisito-legal",
    title: "Accesibilidad como requisito legal, no opcional",
    category: "Cultura y consumo",
    ring: "mainstream",
    summary:
      "Con WCAG 2.2 y regulaciones como el European Accessibility Act ya vigentes, la accesibilidad pasó de buena práctica a requisito contractual en muchos mercados.",
    source: "Gartner",
    spottedAt: "2026-02-18",
    soWhat: {
      porque:
        "El riesgo legal y reputacional de ignorarla ya es real y medible, no solo un tema de buenas prácticas.",
      impacto:
        "Todo proyecto nuevo debería incluir una auditoría de accesibilidad como entregable estándar, no como extra.",
      accion:
        "Añadir un checklist de accesibilidad WCAG 2.2 obligatorio a la plantilla de entregables de Discovery.",
    },
    relevance: 90,
    trending: 58,
    opportunity: 94,
    pinned: false,
    pestle: ["Legal", "Social", "Político"],
    realExamples: [
      {
        org: "European Accessibility Act",
        detail: "Ya exige conformidad de accesibilidad en productos y servicios digitales clave desde 2025 en la UE.",
      },
      {
        org: "Bancos europeos",
        detail: "Están re-certificando sus apps móviles contra WCAG 2.2 para evitar sanciones regulatorias.",
      },
    ],
    adopters: ["Unión Europea (EAA)", "Bancos europeos"],
    impactPotential:
      "El incumplimiento pasa de riesgo reputacional a riesgo legal directo; cambia el orden de prioridades en cualquier roadmap de producto.",
  },
  {
    id: "sostenibilidad-digital",
    title: "Diseño digital de bajo consumo energético",
    category: "Cultura y consumo",
    ring: "emergente",
    summary:
      "Marcas empiezan a medir y comunicar la huella de carbono de sus productos digitales, optimizando interfaces y assets para reducir consumo energético.",
    source: "TrendWatching",
    sourceUrl: "https://www.trendwatching.com/",
    spottedAt: "2026-04-05",
    soWhat: {
      porque:
        "La sostenibilidad se está volviendo un argumento de marca también en lo digital, no solo en producto físico.",
      impacto:
        "Clientes con posicionamiento sustentable podrían valorar un reporte de 'huella digital' de su plataforma.",
      accion:
        "Definir una checklist ligera de optimización (imágenes, fuentes, animaciones) para reducir peso de página en proyectos activos.",
    },
    relevance: 61,
    trending: 55,
    opportunity: 59,
    pinned: false,
    pestle: ["Ecológico", "Social"],
    realExamples: [
      {
        org: "Ecosia",
        detail: "Publica y comunica activamente la huella de carbono de su producto digital como parte de su marca.",
      },
      {
        org: "Low Carbon Patterns",
        detail: "Cataloga patrones de UI de bajo consumo energético que ya adoptan sitios de gobierno en el Reino Unido.",
      },
    ],
    adopters: ["Ecosia", "Low Carbon Patterns"],
    impactPotential:
      "La sostenibilidad digital se vuelve un argumento de marca medible, no solo una intención declarativa.",
  },
  {
    id: "dashboards-adaptativos-ia",
    title: "Dashboards personalizados por IA según el usuario",
    category: "IA",
    ring: "adopcion",
    summary:
      "En vez de un dashboard fijo para todos los roles, el layout y las métricas destacadas se ajustan automáticamente según el comportamiento de cada usuario.",
    source: "Bloomberg Technology",
    spottedAt: "2026-05-28",
    soWhat: {
      porque:
        "Los dashboards genéricos generan fatiga de información; la relevancia personalizada mejora la adopción real de las herramientas internas.",
      impacto:
        "Herramientas internas para clientes (paneles de control, reportes) podrían diferenciarse ofreciendo esta capa de personalización.",
      accion:
        "Explorar si el propio QA Office podría priorizar métricas distintas según el rol de quien lo usa (QA lead vs. gerencia).",
    },
    relevance: 76,
    trending: 70,
    opportunity: 73,
    pinned: false,
    pestle: ["Tecnológico", "Económico"],
    realExamples: [
      {
        org: "Bloomberg Terminal",
        detail: "Ajusta los paneles destacados según los activos que cada trader consulta con más frecuencia.",
      },
      {
        org: "Salesforce (Einstein)",
        detail: "Reordena widgets del dashboard de ventas según el comportamiento histórico del usuario.",
      },
    ],
    adopters: ["Bloomberg", "Salesforce"],
    impactPotential:
      "Mejora la adopción de herramientas internas complejas; el propio QA Office podría aplicar esta misma lógica a futuro.",
  },
  {
    id: "design-tokens-cross-platform",
    title: "Design tokens unificados cross-platform",
    category: "Metodología",
    ring: "mainstream",
    summary:
      "Herramientas como Style Dictionary o Terrazzo ya son estándar para sincronizar color, tipografía y espaciado entre web, iOS y Android desde una sola fuente de verdad.",
    source: "GitHub Trending",
    sourceUrl: "https://github.com/trending",
    spottedAt: "2026-01-22",
    soWhat: {
      porque:
        "Evita que cada plataforma mantenga su propia copia manual de los tokens de marca, con el riesgo de que se desincronicen.",
      impacto:
        "Cualquier cliente con apps en múltiples plataformas se beneficia de consolidar sus tokens en una sola fuente.",
      accion:
        "Adoptar esta práctica como estándar interno en el próximo proyecto multiplataforma.",
    },
    relevance: 69,
    trending: 42,
    opportunity: 63,
    pinned: false,
    pestle: ["Tecnológico", "Económico"],
    realExamples: [
      {
        org: "Adobe (Spectrum)",
        detail: "Sincroniza tokens entre web, iOS y Android desde una única fuente con Style Dictionary.",
      },
      {
        org: "Salesforce (Lightning)",
        detail: "Mantiene paridad de marca entre plataformas usando el mismo enfoque de tokens unificados.",
      },
    ],
    adopters: ["Adobe", "Salesforce"],
    impactPotential:
      "Ya es una práctica estándar esperada por clientes con presencia multiplataforma; no adoptarla se percibe como falta de madurez técnica.",
  },
  {
    id: "habitos-interaccion-genz",
    title: "Hábitos de interacción por voz y gesto en Gen Z",
    category: "Cultura y consumo",
    ring: "emergente",
    summary:
      "Usuarios más jóvenes prefieren cada vez más comandos de voz cortos y gestos rápidos sobre navegación tradicional por menús, especialmente en apps de consumo.",
    source: "TikTok / redes visuales",
    spottedAt: "2026-06-10",
    soWhat: {
      porque:
        "Los patrones de navegación clásicos (tabs, menús hamburguesa) pueden sentirse lentos para este segmento.",
      impacto:
        "Productos dirigidos a audiencias jóvenes podrían necesitar atajos de voz/gesto como capa adicional de navegación.",
      accion:
        "Revisar el proyecto con audiencia más joven del portafolio y proponer un atajo de voz o gesto como experimento.",
    },
    relevance: 57,
    trending: 63,
    opportunity: 51,
    pinned: false,
    pestle: ["Social", "Tecnológico"],
    realExamples: [
      {
        org: "TikTok",
        detail: "Prioriza gestos (swipe, hold) sobre menús tradicionales como navegación principal de la app.",
      },
      {
        org: "CapCut",
        detail: "Incorpora comandos de voz cortos para acciones de edición frecuentes.",
      },
    ],
    adopters: ["TikTok", "CapCut"],
    impactPotential:
      "Productos dirigidos a audiencias jóvenes podrían perder relevancia si mantienen navegación 100% basada en menús clásicos.",
  },
];

export function getTrendById(id: string): Trend | undefined {
  return TRENDS.find((t) => t.id === id);
}

/**
 * Backfills fields introduced after a user's localStorage snapshot was created.
 * Prefers the matching seed trend's data (if any) over blank defaults, so older
 * snapshots of built-in trends recover their PESTLE/examples/adopters/impact
 * instead of having them permanently blanked out.
 */
export function normalizeTrend(t: Partial<Trend> & { id: string }): Trend {
  const seed = TRENDS.find((s) => s.id === t.id);
  const base = { pestle: [], realExamples: [], adopters: [], impactPotential: "", ...seed, ...t } as Trend;
  return {
    ...base,
    pestle: t.pestle && t.pestle.length > 0 ? t.pestle : (seed?.pestle ?? base.pestle),
    realExamples: t.realExamples && t.realExamples.length > 0 ? t.realExamples : (seed?.realExamples ?? base.realExamples),
    adopters: t.adopters && t.adopters.length > 0 ? t.adopters : (seed?.adopters ?? base.adopters),
    impactPotential:
      t.impactPotential && t.impactPotential.trim() !== "" ? t.impactPotential : (seed?.impactPotential ?? base.impactPotential),
  };
}

export function generateTrendId(title: string, existingIds: string[]): string {
  const base =
    title
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "tendencia";
  let id = base;
  let n = 2;
  while (existingIds.includes(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  return id;
}
