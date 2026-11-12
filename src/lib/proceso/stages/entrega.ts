import type { ProcessStage } from "../../procesoTypes";

export const entrega: ProcessStage = {
  id: "entrega",
  number: 4,
  name: "Entrega",
  goal: "Validar, hacer handoff y presentar los resultados en un sitio navegable.",
  summary: [
    "La entrega es una sesión con el cliente, no un archivo: validar etapas, hacer handoff, presentar con un sitio navegable.",
    "Antes: logística y ensayo con roles.",
  ],
  rhythm: "Un hito de cierre con ensayo previo. La sesión es para decidir.",
  checklist: [
    {
      title: "Validación interna",
      phase: "principio",
      items: [
        "Confirmar que Discovery, Build y Testing tienen su reporte aceptado",
        "Pasar el checklist de calidad final",
        "Verificar el ambiente de producción",
        "Revisar que README, arquitectura, guía de despliegue y guía de contenido estén completos",
      ],
    },
    {
      title: "Handoff técnico y de diseño",
      phase: "despues",
      items: [
        "Entregar repositorio y accesos con un gestor de contraseñas, nunca por correo ni chat",
        "Ordenar Figma con componentes y tokens",
        "Documentar variables de entorno y servicios de terceros sin exponer secretos",
        "Entregar el backlog restante priorizado",
        "Escribir el runbook: cómo desplegar y cómo monitorear",
      ],
    },
    {
      title: "Presentación y sitio navegable",
      phase: "despues",
      items: [
        "Armar la presentación completa del trabajo",
        "Armar el sitio web navegable con los resultados de cada etapa, de Discovery a FutureProof",
        "Presentar los resultados frente a los objetivos SMART del Discovery",
        "Ensayar con tiempos",
      ],
    },
    {
      title: "Logística con el cliente",
      phase: "despues",
      items: [
        "Acordar fecha, asistentes y quién firma la aceptación final",
        "Mandar agenda y materiales 24 a 48 horas antes",
        "Preparar el enlace, la grabación (Tactiq) y un plan B",
      ],
    },
    {
      title: "Preparación interna",
      phase: "despues",
      items: [
        "Ensayo con el equipo y reparto de roles",
        "Lista de preguntas difíciles y sus respuestas",
        "Respaldo de la presentación y del sitio sin conexión",
      ],
    },
    {
      title: "Cierre",
      phase: "final",
      items: [
        "Obtener la aceptación final firmada",
        "Enviar la minuta con acuerdos",
        "Archivar la carpeta del proyecto en Drive",
        "Enviar la encuesta de satisfacción del cliente (NPS y CSAT)",
        "Hacer la transición a FutureProof",
      ],
    },
  ],
  deliverable: {
    title: "Acta de entrega y aceptación final",
    contents: [
      "Resumen frente a objetivos SMART",
      "Reportes aceptados por etapa",
      "Enlace al sitio de resultados",
      "Documentación técnica y runbook",
      "Accesos transferidos, sin credenciales",
      "Backlog restante y recomendaciones",
      "Plan de FutureProof",
    ],
    criteria: [
      { criterion: "Etapas anteriores aceptadas", evidence: "Reportes firmados de las tres etapas" },
      { criterion: "Handoff técnico y de diseño completo", evidence: "Checklist de handoff con enlaces" },
      { criterion: "Cliente navega resultados de cada etapa", evidence: "Sitio de entrega publicado" },
      { criterion: "Accesos transferidos de forma segura", evidence: "Registro de entrega de accesos" },
      { criterion: "Aceptación final firmada", evidence: "Acta firmada por quien autoriza" },
    ],
  },
  tools: [
    { name: "Google Drive", use: "Reportes, minuta y carpeta final" },
    { name: "Figma", use: "Archivo de handoff ordenado" },
    { name: "Claude Code", use: "Sitio navegable de resultados" },
    { name: "Tactiq", use: "Grabación y minuta de la sesión" },
    { name: "NotebookLM", use: "Preguntas desde los reportes" },
    { name: "Excel", use: "Resumen y cuadro de objetivos" },
  ],
  skills: [
    { name: "design:design-handoff", use: "Especificaciones para desarrollo" },
    { name: "design-dev-bridge:handoff-to-code", use: "Handoff de diseño a código" },
    { name: "design-dev-bridge:write-design-system-doc", use: "Documentar el sistema de diseño" },
    { name: "operations:runbook", use: "Runbook de despliegue y monitoreo" },
    { name: "operations:status-report", use: "Estado del proyecto con riesgos" },
    { name: "product-management:stakeholder-update", use: "Comunicado a dirección del cliente" },
    { name: "anthropic-skills:pptx", use: "Presentación en PowerPoint" },
    { name: "operations:process-doc", use: "Procesos que quedan al cliente" },
  ],
  agents: [
    {
      name: "Armador del sitio de entrega",
      does: "Junta reportes aceptados en la plantilla de entrega.",
      humanCheck: "Cada sección coincide con el reporte.",
    },
    {
      name: "Preparador de preguntas difíciles",
      does: "Propone preguntas probables del cliente desde reportes.",
      humanCheck: "El equipo escribe las respuestas.",
    },
    {
      name: "Redactor de minuta",
      does: "Convierte la transcripción en minuta y acuerdos.",
      humanCheck: "Validar acuerdos y fechas.",
    },
  ],
  sops: [
    {
      title: "Handoff técnico y de diseño",
      owner: "Estratega, diseño y desarrollo",
      steps: [
        "Asignar responsable a cada punto del checklist.",
        "Ordenar Figma: páginas, componentes, tokens nombrados.",
        "Documentar repo, variables de entorno y terceros.",
        "Transferir accesos con gestor de contraseñas.",
        "El cliente confirma que entra a todo.",
      ],
    },
    {
      title: "Sesión de entrega con el cliente",
      owner: "Estratega",
      steps: [
        "Fijar fecha, asistentes y firmante; mandar materiales.",
        "Ensayar con tiempos y roles.",
        "Grabar y presentar contra los objetivos SMART.",
        "Mostrar el sitio; pedir aceptación o fecha de revisión.",
        "Mandar la minuta con acuerdos en 24 horas.",
      ],
    },
    {
      title: "Cierre administrativo del proyecto",
      owner: "Estratega",
      steps: [
        "Confirmar la aceptación final firmada.",
        "Archivar en Drive reportes y grabación.",
        "Enviar la encuesta de satisfacción.",
        "Marcar entregado en Jira y dashboard.",
        "Convocar el arranque de FutureProof.",
      ],
    },
  ],
  tips: [
    "Presenta contra los objetivos SMART, no funciones.",
    "Manda el material antes: la sesión es para decidir.",
    "Ensaya con cronómetro: lo largo pierde al cliente.",
    "Nunca mandes credenciales por correo ni chat.",
  ],
  examples: [
    { title: "Entrega del MVP (template)", href: "/entrega-mvp-template", note: "Presentación base: alcance, calidad, arquitectura, siguientes pasos." },
    { title: "APAC MVP: Servicios Neurorrobótica (420.01)", href: "/dashboard-estrategas#proyectos", note: "MVP en Future Proof. Confirmar que sirve de ejemplo.", status: "candidato" },
  ],
  signals: [
    { metric: "CSAT y NPS posteriores a la entrega", source: "Pestañas NPS y CSAT", status: "existe" },
    { metric: "Entrega en fecha del timeline", source: "Jira y timeline", status: "existe" },
    { metric: "Aceptación final a la primera", source: "Reporte de Entrega (Admin)", status: "existe" },
    { metric: "Cumplimiento del checklist de Entrega", source: "Admin → Etapas", status: "existe" },
  ],
  io: {
    inputs: [
      {
        name: "Versión candidata congelada",
        format: "Etiqueta en el repositorio y enlace",
        where: "Etapa anterior",
        from: "testing",
        note: "Es lo que se transfiere."
      },
      {
        name: "Reportes aceptados de Discovery, Build y Testing",
        format: "PDF firmados",
        where: "Etapas anteriores",
        from: "testing",
        note: "Alimentan el sitio de resultados."
      },
      {
        name: "Pendientes y matriz de hallazgos",
        format: "Jira y Google Sheet",
        where: "Etapa anterior",
        from: "testing",
        note: "Base del backlog restante."
      },
      {
        name: "Contrato vendido",
        format: "PDF",
        where: "Discovery",
        from: "discovery",
        note: "Valida que se cubre lo vendido."
      },
      {
        name: "Objetivos SMART con su avance",
        format: "Google Sheet",
        where: "Discovery",
        from: "discovery",
        note: "Base de la presentación."
      },
      {
        name: "Asistentes y fecha de la sesión de entrega",
        format: "Correo o invitación de calendario",
        where: "Cliente",
        note: "Define quién acepta y recibe accesos."
      }
    ],
    outputs: [
      {
        name: "Documentación técnica",
        format: "Markdown en el repositorio",
        where: "Repositorio del proyecto",
        note: "README, arquitectura, despliegue, contenido, runbook.",
        usedIn: [
          "futureproof"
        ]
      },
      {
        name: "Archivos finales de diseño",
        format: "Figma de entrega y exportaciones (ZIP)",
        where: "Drive /04-Entrega/Diseño, cliente"
      },
      {
        name: "Sitio navegable de resultados",
        format: "Sitio web con enlace",
        where: "Se entrega al cliente"
      },
      {
        name: "Presentación de entrega",
        format: "Presentación en PDF",
        where: "Drive /04-Entrega/Presentación, cliente",
        note: "Resumen frente a objetivos SMART."
      },
      {
        name: "Lista de accesos transferidos",
        format: "Google Sheet, sin credenciales",
        where: "Drive /04-Entrega",
        note: "Qué, a quién y cuándo."
      },
      {
        name: "Agenda y minuta de la sesión",
        format: "Google Doc",
        where: "Drive /04-Entrega"
      },
      {
        name: "Backlog restante y recomendaciones",
        format: "Jira y Google Doc",
        where: "Jira y Drive",
        usedIn: [
          "futureproof"
        ]
      },
      {
        name: "Plan de FutureProof",
        format: "Google Doc",
        where: "Drive /04-Entrega",
        note: "Uso de las semanas cotizadas.",
        usedIn: [
          "futureproof"
        ]
      },
      {
        name: "Acta de entrega y aceptación final",
        format: "PDF firmado por el cliente",
        where: "Drive /04-Entrega/Acta, firma cliente",
        usedIn: [
          "futureproof"
        ]
      }
    ]
  },
};
