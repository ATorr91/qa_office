import type { ProcessStage } from "../../procesoTypes";

export const testing: ProcessStage = {
  id: "testing",
  number: 3,
  name: "Testing",
  goal: "Probar con usuarios reales y corregir hasta congelar una versión candidata.",
  summary: [
    "Probar que el sistema funcione, se entienda y cumpla los objetivos SMART.",
    "Priorizar hallazgos por severidad e impacto, corregir y congelar una versión candidata pulida.",
  ],
  rhythm: "Ciclos semanales: probar, priorizar, corregir, repetir.",
  checklist: [
    {
      title: "Plan de pruebas",
      phase: "principio",
      items: [
        "Ligar los objetivos de testing a los objetivos SMART",
        "Definir hipótesis y tareas críticas de cada flujo",
        "Definir perfil y número de participantes",
        "Elegir método (moderado, no moderado, encuesta u otro) y herramienta",
        "Escribir guion o protocolo",
      ],
    },
    {
      title: "Pruebas funcionales y técnicas",
      phase: "despues",
      items: [
        "Recorrer el sistema completo en los navegadores y dispositivos acordados",
        "Verificar de nuevo accesibilidad, SEO y velocidad",
        "Probar permisos, roles y datos de prueba contra producción",
        "Pasar la regresión de los bugs ya corregidos",
      ],
    },
    {
      title: "User testing",
      phase: "despues",
      items: [
        "Reclutar participantes",
        "Hacer sesiones moderadas y grabarlas con Tactiq",
        "Hacer pruebas no moderadas",
        "Aplicar encuesta de usabilidad",
        "Registrar éxito de tarea, tiempo, errores y satisfacción",
      ],
    },
    {
      title: "Síntesis y priorización",
      phase: "despues",
      items: [
        "Sintetizar sesiones en un affinity diagram",
        "Clasificar hallazgos por severidad e impacto",
        "Decidir qué se corrige ahora y qué va al backlog",
      ],
    },
    {
      title: "Pulido",
      phase: "despues",
      items: [
        "Corregir los hallazgos priorizados",
        "Hacer una segunda ronda de verificación",
        "Pulir detalles visuales, microcopy y animaciones",
        "Congelar la versión candidata",
      ],
    },
    {
      title: "Cierre de la etapa",
      phase: "final",
      items: ["Completar el reporte de Testing en formato de aceptación", "Peer review del reporte", "Presentarlo al cliente y obtener su aceptación"],
    },
  ],
  deliverable: {
    title: "Reporte de Testing y aceptación",
    contents: [
      "Plan y objetivos de prueba",
      "Método, participantes y herramientas",
      "Métricas de usabilidad y funcionalidad",
      "Hallazgos con severidad y evidencia",
      "Cambios aplicados, antes y después",
      "Pendientes aceptados para el backlog",
      "Versión candidata congelada",
    ],
    criteria: [
      { criterion: "Flujos críticos probados", evidence: "Matriz de flujos con evidencia" },
      { criterion: "Sin hallazgos críticos ni altos abiertos", evidence: "Tabla de hallazgos con estado" },
      { criterion: "Usabilidad dentro de la meta", evidence: "Tareas y encuesta contra la meta" },
      { criterion: "Regresión completa pasada", evidence: "Lista de regresión verificada" },
      { criterion: "Versión candidata congelada", evidence: "Etiqueta con fecha de despliegue" },
    ],
  },
  tools: [
    { name: "Tactiq", use: "Grabar y transcribir sesiones" },
    { name: "NotebookLM", use: "Buscar patrones en transcripciones" },
    { name: "Claude Cowork", use: "Sintetizar sesiones y encuestas" },
    { name: "Excel", use: "Hallazgos y métricas" },
    { name: "Figma", use: "Prototipos para pruebas tempranas" },
    { name: "Claude Code", use: "Corregir y correr verificaciones" },
    { name: "Jira", use: "Bugs y hallazgos priorizados" },
    { name: "Encuestas", use: "Herramienta por definir" },
  ],
  skills: [
    { name: "usability-test-plan", use: "Plan con tareas, métricas y participantes" },
    { name: "survey-design", use: "Encuestas sin sesgo" },
    { name: "interview-script", use: "Guion de sesiones moderadas" },
    { name: "summarize-interview", use: "Resumir sesiones con citas" },
    { name: "affinity-diagram", use: "Agrupar hallazgos en temas" },
    { name: "design:user-research", use: "Planear y ejecutar investigación" },
    { name: "design:research-synthesis", use: "Sintetizar hallazgos" },
    { name: "design:accessibility-review", use: "Segunda pasada de accesibilidad" },
    { name: "data:analyze", use: "Analizar encuestas y métricas" },
    { name: "code-review", use: "Revisión técnica antes de congelar" },
  ],
  agents: [
    {
      name: "Sintetizador de sesiones",
      does: "Convierte transcripciones en hallazgos con cita y tiempo.",
      humanCheck: "Verificar citas contra la grabación.",
    },
    {
      name: "Priorizador de hallazgos",
      does: "Propone severidad e impacto y ordena hallazgos.",
      humanCheck: "El estratega decide el sprint.",
    },
    {
      name: "Revisor de regresión",
      does: "Corre verificaciones y recorre flujos en el navegador.",
      humanCheck: "El estratega decide congelar.",
    },
  ],
  sops: [
    {
      title: "Sesión moderada de user testing",
      url: "https://www.nngroup.com/articles/usability-testing-101/",
      owner: "Estratega",
      steps: [
        "Grabar con consentimiento; aclarar que se prueba el sistema.",
        "Dar una tarea a la vez, sin guiar.",
        "Anotar dudas y errores; ayudar solo si piden.",
        "Cerrar con tres preguntas abiertas y la encuesta.",
        "Subir grabación y notas el mismo día.",
      ],
    },
    {
      title: "Prueba no moderada y encuesta",
      owner: "Estratega",
      steps: [
        "Definir tareas y qué cuenta como éxito.",
        "Escribir instrucciones que se entiendan sin moderador.",
        "Probar antes con una persona del equipo.",
        "Enviar a la muestra con fecha de cierre.",
        "Limpiar respuestas inválidas y analizar contra la meta.",
      ],
    },
    {
      title: "Regresión antes de congelar la versión candidata",
      owner: "Estratega y desarrollo",
      steps: [
        "Listar flujos críticos y bugs corregidos en Build.",
        "Recorrer cada uno en móvil, escritorio, light y dark.",
        "Correr verificaciones automáticas y corregir fallas.",
        "Congelar versión y registrar fecha y enlace.",
      ],
    },
  ],
  tips: [
    "Cinco participantes por segmento detectan los problemas más repetidos.",
    "Define tarea y criterio de éxito antes de sesionar.",
    "Guarda cada hallazgo con evidencia: clip o cita.",
    "Pule al final: primero lo que bloquea.",
  ],
  examples: [
    { title: "Plan de pruebas de referencia", href: null, note: "Por elegir: plan de testing de proyecto anterior.", status: "por-elegir" },
    { title: "Reporte de hallazgos de referencia", href: null, note: "Por elegir: hallazgos con severidad y evidencia.", status: "por-elegir" },
  ],
  signals: [
    { metric: "Calificación QA", source: "Pestaña «Calificación QA»", status: "existe" },
    { metric: "Deadlines de tickets de Testing", source: "Jira", status: "existe" },
    { metric: "Hallazgos críticos cerrados antes de entrega", source: "Tabla de hallazgos", status: "por-integrar" },
    { metric: "Usabilidad frente a la meta", source: "Reporte de Testing", status: "manual" },
    { metric: "Sesiones realizadas frente al plan", source: "Checklist de Testing", status: "existe" },
  ],
  io: {
    inputs: [
      {
        name: "Versión en preview",
        format: "Enlace al ambiente de preview",
        where: "Build",
        from: "build",
        note: "Debe estar estable antes de convocar."
      },
      {
        name: "Reporte de Build aceptado",
        format: "PDF firmado",
        where: "Build",
        from: "build",
        note: "Lo aceptado no se discute."
      },
      {
        name: "UI final y wireframes",
        format: "Figma",
        where: "Build",
        from: "build",
        note: "Referencia para comparar lo construido."
      },
      {
        name: "Resultados de accesibilidad, SEO y velocidad",
        format: "Reporte de Lighthouse",
        where: "Build",
        from: "build",
        note: "Línea base para no empeorar."
      },
      {
        name: "Objetivos SMART y flujos principales",
        format: "Google Doc",
        where: "Discovery",
        from: "discovery"
      },
      {
        name: "Lista de participantes",
        format: "Google Sheet",
        where: "Cliente y estratega",
        note: "Con permiso para grabar."
      }
    ],
    outputs: [
      {
        name: "Plan de pruebas",
        format: "Google Doc",
        where: "Drive /03-Testing"
      },
      {
        name: "Guiones de entrevistas y encuestas",
        format: "Google Doc y formulario",
        where: "Drive /03-Testing/Guiones"
      },
      {
        name: "Grabaciones y transcripciones",
        format: "Video y transcripción de Tactiq",
        where: "Drive /03-Testing/Sesiones",
        note: "Con consentimiento del participante."
      },
      {
        name: "Resultados de encuestas y pruebas de usuario",
        format: "Google Sheet",
        where: "Drive /03-Testing/Resultados",
        usedIn: [
          "entrega",
          "futureproof"
        ]
      },
      {
        name: "Reporte de pruebas funcionales y técnicas",
        format: "Google Sheet",
        where: "Drive /03-Testing/Resultados",
        note: "Navegadores, dispositivos, formularios, enlaces."
      },
      {
        name: "Matriz de hallazgos",
        format: "Google Sheet y tickets de Jira",
        where: "Jira y Drive",
        note: "Severidad, evidencia y estado.",
        usedIn: [
          "entrega"
        ]
      },
      {
        name: "Antes y después de los cambios",
        format: "Capturas y Figma",
        where: "Drive /03-Testing/Cambios",
        note: "Prueba al cliente lo atendido."
      },
      {
        name: "Pendientes aceptados por el cliente",
        format: "Backlog en Jira",
        where: "Jira",
        usedIn: [
          "entrega",
          "futureproof"
        ]
      },
      {
        name: "Versión candidata congelada",
        format: "Etiqueta en el repositorio y enlace al preview",
        where: "Repositorio",
        note: "Después solo errores.",
        usedIn: [
          "entrega"
        ]
      },
      {
        name: "Reporte de Testing y aceptación",
        format: "PDF firmado por el cliente",
        where: "Drive /03-Testing/Reporte",
        usedIn: [
          "entrega"
        ]
      }
    ]
  },
};
