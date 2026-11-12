import type { ProcessStage } from "../../procesoTypes";

export const futureproof: ProcessStage = {
  id: "futureproof",
  number: 5,
  name: "FutureProof",
  goal: "Gastar las semanas cotizadas en mejoras priorizadas y medir su efecto real.",
  service: "FutureProof",
  summary: [
    "Un taller decide en qué disciplina se gastan las semanas cotizadas.",
    "MixPanel, Google Analytics e Impath miden el uso; el ciclo de mejora reporta contra los objetivos SMART.",
  ],
  rhythm: "Ciclos quincenales o por sprint, con revisión de métricas al inicio.",
  checklist: [
    {
      title: "Taller de ideación, priorización y validación",
      phase: "principio",
      items: [
        "Preparar el taller con datos de uso y los hallazgos de Testing",
        "Facilitar la ideación por disciplina: investigación, diseño, desarrollo e implementación",
        "Priorizar ideas con un criterio explícito (por ejemplo impacto y esfuerzo)",
        "Validar con el cliente contra las semanas cotizadas",
        "Documentar el plan de semanas de FutureProof por disciplina",
      ],
    },
    {
      title: "Instrumentación",
      phase: "despues",
      items: [
        "Instalar MixPanel",
        "Instalar Google Analytics",
        "Instalar Impath",
        "Definir los eventos clave alineados a los objetivos SMART",
        "Verificar que los eventos llegan y que el consentimiento y la privacidad están cubiertos",
        "Armar un tablero de métricas de uso",
      ],
    },
    {
      title: "Ciclo de mejora",
      phase: "despues",
      items: [
        "Revisar métricas en una cadencia fija (semanal o quincenal)",
        "Hacer pruebas de usuario de las mejoras propuestas",
        "Mantener un backlog de mejoras priorizado",
        "Ejecutar las mejoras por sprint",
        "Medir antes y después de cada mejora",
      ],
    },
    {
      title: "Reporte",
      phase: "final",
      items: [
        "Completar el reporte de FutureProof en formato de aceptación",
        "Mostrar resultados frente a los objetivos SMART",
        "Presentar recomendaciones y siguiente fase",
      ],
    },
  ],
  deliverable: {
    title: "Reporte de FutureProof y aceptación",
    contents: [
      "Taller y plan de semanas",
      "Eventos y métricas instrumentadas",
      "Mejoras y su efecto medido",
      "Hallazgos de pruebas de usuario",
      "Resultados frente a objetivos SMART",
      "Recomendaciones y siguiente fase",
    ],
    criteria: [
      { criterion: "Plan de semanas validado", evidence: "Plan firmado por disciplina" },
      { criterion: "Analítica instalada y verificada", evidence: "Eventos visibles en las tres herramientas" },
      { criterion: "Mejoras medidas antes y después", evidence: "Tabla de mejoras con resultado" },
      { criterion: "Semanas consumidas igual a cotizadas", evidence: "Semanas ejecutadas frente a contratadas" },
    ],
  },
  tools: [
    { name: "MixPanel", use: "Eventos y embudos de uso" },
    { name: "Google Analytics", use: "Tráfico y comportamiento" },
    { name: "Impath", use: "Uso y user testing (confirmar alcance)" },
    { name: "Claude Cowork", use: "Investigar y analizar métricas" },
    { name: "Claude Code", use: "Implementar mejoras e instrumentación" },
    { name: "Figma", use: "Diseñar mejoras y dinámicas del taller" },
    { name: "Excel", use: "Seguir semanas y resultados" },
    { name: "Tactiq y NotebookLM", use: "Taller y sesiones con el cliente" },
  ],
  skills: [
    { name: "product-management:metrics-review", use: "Detectar desviaciones en métricas de uso" },
    { name: "opportunity-framework", use: "Priorizar por impacto y esfuerzo" },
    { name: "product-management:roadmap-update", use: "Reordenar el plan según lo medido" },
    { name: "jobs-to-be-done", use: "Entender qué buscan los usuarios" },
    { name: "experience-map", use: "Mapear puntos de contacto" },
    { name: "data:build-dashboard", use: "Tablero de métricas del proyecto" },
    { name: "data:analyze", use: "Analizar datos de uso" },
    { name: "usability-test-plan", use: "Probar mejoras con usuarios" },
  ],
  agents: [
    {
      name: "Analista de uso",
      does: "Resume cada semana anomalías y oportunidades de uso.",
      humanCheck: "Estratega valida el sentido de negocio.",
    },
    {
      name: "Facilitador de taller",
      does: "Prepara la dinámica, agrupa ideas, propone priorización.",
      humanCheck: "Equipo y cliente priorizan en sala.",
    },
    {
      name: "Redactor del reporte de FutureProof",
      does: "Compone el reporte con métricas y resultados.",
      humanCheck: "Estratega verifica cada cifra.",
    },
  ],
  sops: [
    {
      title: "Taller de ideación, priorización y validación",
      owner: "Estratega y diseño",
      steps: [
        "Reunir datos de uso y hallazgos de Testing.",
        "Declarar las semanas cotizadas y su reparto.",
        "Ideación por disciplina, con tiempo fijo por ronda.",
        "Priorizar con criterio explícito, visible en pantalla.",
        "Validar con cliente y enviar plan en 24 horas.",
      ],
    },
    {
      title: "Instalación y verificación de analítica",
      url: "https://docs.mixpanel.com/",
      owner: "Desarrollo y estratega",
      steps: [
        "Listar eventos que prueban cada objetivo SMART.",
        "Instalar MixPanel, Google Analytics e Impath.",
        "Disparar cada evento en pruebas y verificar llegada.",
        "Confirmar consentimiento y manejo de datos personales.",
        "Documentar el diccionario de eventos en Drive.",
      ],
    },
    {
      title: "Revisión periódica de métricas",
      owner: "Estratega",
      steps: [
        "Abrir el tablero en la cadencia acordada.",
        "Comparar contra línea base y meta.",
        "Anotar qué se movió y por qué.",
        "Convertir hipótesis en mejoras del backlog.",
        "Enviar resumen corto al cliente.",
      ],
    },
  ],
  tips: [
    "Instala analítica primero: sin línea base no hay comparación.",
    "Cada mejora lleva métrica esperada y fecha de revisión.",
    "Muestra las semanas cotizadas como presupuesto visible.",
  ],
  examples: [
    { title: "Mapa de valor de servicios", href: "/mapa-valor-servicios", note: "Validación real contra ideal por proyecto." },
    { title: "Transpais: Future Proof (395.02)", href: "/dashboard-estrategas#proyectos", note: "En curso. Candidato para taller y ciclo de mejora.", status: "candidato" },
    { title: "APAC Future Proof (421.01)", href: "/dashboard-estrategas#proyectos", note: "Recién iniciado tras un MVP terminado.", status: "candidato" },
    { title: "Deiman: Future Proof (422.02)", href: "/dashboard-estrategas#proyectos", note: "Posterior a un e-commerce terminado.", status: "candidato" },
  ],
  signals: [
    { metric: "CSAT y NPS durante FutureProof", source: "Pestañas NPS y CSAT", status: "existe" },
    { metric: "Avance de sprints de mejora", source: "Pestaña «Avance del sprint»", status: "existe" },
    { metric: "Eventos instrumentados frente al plan", source: "Diccionario de eventos", status: "por-integrar" },
    { metric: "Semanas consumidas frente a cotizadas", source: "Contrato y horas", status: "manual" },
    { metric: "Métrica objetivo frente a línea base", source: "Admin → Objetivos", status: "manual" },
  ],
  io: {
    inputs: [
      {
        name: "Acta de entrega y aceptación final",
        format: "PDF firmado",
        where: "Etapa anterior",
        from: "entrega"
      },
      {
        name: "Plan de FutureProof y semanas cotizadas",
        format: "Google Doc y contrato",
        where: "Etapa anterior",
        from: "entrega",
        note: "Semanas por disciplina."
      },
      {
        name: "Backlog restante y recomendaciones",
        format: "Jira y Google Doc",
        where: "Etapa anterior",
        from: "entrega",
        note: "Insumo del taller de priorización."
      },
      {
        name: "Resultados de pruebas de usuario",
        format: "Google Sheet",
        where: "Testing",
        from: "testing",
        note: "Hallazgos sin resolver."
      },
      {
        name: "Objetivos SMART con línea base",
        format: "Google Sheet",
        where: "Discovery",
        from: "discovery",
        note: "Base para medir el sitio publicado."
      },
      {
        name: "Accesos a la analítica del sitio publicado",
        format: "Enlaces y lista de accesos",
        where: "Cliente, canal seguro",
        note: "Sin acceso no hay instrumentación."
      }
    ],
    outputs: [
      {
        name: "Memoria del taller",
        format: "FigJam y Google Doc",
        where: "Drive, /05-FutureProof/Taller"
      },
      {
        name: "Plan de semanas por disciplina",
        format: "Google Sheet",
        where: "Drive, /05-FutureProof"
      },
      {
        name: "Plan de medición",
        format: "Google Sheet",
        where: "Drive, /05-FutureProof/Medición",
        note: "Qué decisión informa cada métrica."
      },
      {
        name: "Tableros de MixPanel y Google Analytics",
        format: "Enlaces a los tableros",
        where: "Herramientas; compartido con cliente",
        note: "Uso real del sitio publicado."
      },
      {
        name: "Resultados de pruebas de usuario con Impath",
        format: "Reporte de la herramienta",
        where: "Drive, /05-FutureProof/Pruebas",
        note: "Confirmar nombre y alcance."
      },
      {
        name: "Mejoras entregadas y su efecto medido",
        format: "Google Doc y tickets de Jira",
        where: "Jira y Drive"
      },
      {
        name: "Recomendaciones y siguiente fase",
        format: "Google Doc",
        where: "Drive /05-FutureProof, lo recibe cliente"
      },
      {
        name: "Reporte de FutureProof y aceptación",
        format: "PDF firmado por el cliente",
        where: "Drive /05-FutureProof/Reporte, firma cliente",
        note: "Cierra la etapa y el proyecto."
      }
    ]
  },
};
