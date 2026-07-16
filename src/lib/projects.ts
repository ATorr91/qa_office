import type { BadgeColor } from "@/components/ui/Badge";

export type ProjectStatus =
  | "Por iniciar"
  | "En curso"
  | "En riesgo"
  | "Bloqueado"
  | "Completado";

export type Priority = "Alta" | "Media" | "Baja";

export interface Actionable {
  title: string;
  owner: string;
  due: string;
  priority: Priority;
  done: boolean;
}

export interface TrendPoint {
  label: string;
  passRate: number;
  testsExecuted: number;
}

export interface BugsBySeverity {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface TeamMember {
  name: string;
  role: string;
}

export interface Release {
  label: string;
  date: string;
  type: "epic" | "release";
}

export interface ReportEntry {
  date: string;
  passRate: number;
  coverage: number;
  testsExecuted: number;
  bugsOpen: number;
  note: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  category: "Web" | "Móvil" | "API" | "Interno" | "Cloud";
  status: ProjectStatus;
  priority: Priority;
  startDate: string;
  endDate: string;
  qaLead: string;
  team: TeamMember[];
  releases: Release[];
  lastReportDate: string;
  passRate: number;
  coverage: number;
  testsExecuted: number;
  bugsOpen: number;
  bugsCritical: number;
  bugsBySeverity: BugsBySeverity;
  description: string;
  summary: string;
  trend: TrendPoint[];
  actionables: Actionable[];
}

export const PROJECTS: Project[] = [
  {
    id: "app-movil-pagos",
    name: "App Móvil Pagos",
    client: "Bimbo",
    category: "Móvil",
    status: "En curso",
    priority: "Alta",
    startDate: "2026-03-01",
    endDate: "2026-08-15",
    qaLead: "Marcela Nuñez",
    team: [
      { name: "Marcela Nuñez", role: "QA Lead" },
      { name: "Luis Ortega", role: "QA Engineer" },
      { name: "Karla Paredes", role: "Automation Engineer" },
    ],
    releases: [
      { label: "Release 1.0 – Beta cerrada", date: "2026-05-15", type: "release" },
      { label: "Epic: Pagos con QR", date: "2026-06-20", type: "epic" },
    ],
    lastReportDate: "2026-07-15",
    passRate: 97,
    coverage: 82,
    testsExecuted: 3120,
    bugsOpen: 8,
    bugsCritical: 1,
    bugsBySeverity: { critical: 1, high: 2, medium: 3, low: 2 },
    description: "App móvil de pagos y transferencias para clientes de Bimbo.",
    summary:
      "El proyecto avanza en la fase de ejecución de pruebas con una tasa de aprobación estable arriba del 95%. El único riesgo abierto es un bug crítico en el flujo de reembolsos, ya priorizado con desarrollo. La cobertura sigue subiendo semana a semana y se espera cerrar regresión a tiempo para el lanzamiento de agosto.",
    trend: [
      { label: "S1", passRate: 88, testsExecuted: 180 },
      { label: "S2", passRate: 90, testsExecuted: 240 },
      { label: "S3", passRate: 91, testsExecuted: 310 },
      { label: "S4", passRate: 93, testsExecuted: 380 },
      { label: "S5", passRate: 94, testsExecuted: 420 },
      { label: "S6", passRate: 95, testsExecuted: 460 },
      { label: "S7", passRate: 96, testsExecuted: 505 },
      { label: "S8", passRate: 97, testsExecuted: 540 },
    ],
    actionables: [
      { title: "Cerrar bug crítico de reembolsos duplicados", owner: "Luis Ortega", due: "2026-07-18", priority: "Alta", done: false },
      { title: "Completar suite de regresión de pagos con tarjeta", owner: "Karla Paredes", due: "2026-07-22", priority: "Alta", done: false },
      { title: "Actualizar casos de prueba de biometría", owner: "Marcela Nuñez", due: "2026-07-25", priority: "Media", done: true },
    ],
  },
  {
    id: "portal-clientes",
    name: "Portal Clientes",
    client: "LATAM",
    category: "Web",
    status: "En riesgo",
    priority: "Alta",
    startDate: "2026-05-01",
    endDate: "2026-09-30",
    qaLead: "Sofía Reyes",
    team: [
      { name: "Sofía Reyes", role: "QA Lead" },
      { name: "Iván Solís", role: "QA Engineer" },
    ],
    releases: [
      { label: "Release 2.1 – Canje de millas", date: "2026-06-10", type: "release" },
      { label: "Epic: Rediseño de canje", date: "2026-07-01", type: "epic" },
    ],
    lastReportDate: "2026-07-14",
    passRate: 88,
    coverage: 70,
    testsExecuted: 1840,
    bugsOpen: 15,
    bugsCritical: 3,
    bugsBySeverity: { critical: 3, high: 4, medium: 5, low: 3 },
    description: "Portal de autoservicio para gestión de vuelos y millas.",
    summary:
      "La tasa de aprobación bajó 4 puntos esta semana por una regresión en el módulo de canje de millas tras el último despliegue. Hay 3 bugs críticos abiertos que bloquean el flujo principal de canje. Se necesita una ronda de smoke testing adicional antes de continuar con nuevas features.",
    trend: [
      { label: "S1", passRate: 90, testsExecuted: 140 },
      { label: "S2", passRate: 91, testsExecuted: 190 },
      { label: "S3", passRate: 93, testsExecuted: 230 },
      { label: "S4", passRate: 92, testsExecuted: 260 },
      { label: "S5", passRate: 94, testsExecuted: 300 },
      { label: "S6", passRate: 93, testsExecuted: 330 },
      { label: "S7", passRate: 90, testsExecuted: 350 },
      { label: "S8", passRate: 88, testsExecuted: 390 },
    ],
    actionables: [
      { title: "Investigar regresión en canje de millas", owner: "Iván Solís", due: "2026-07-17", priority: "Alta", done: false },
      { title: "Ejecutar smoke test post-hotfix", owner: "Sofía Reyes", due: "2026-07-18", priority: "Alta", done: false },
      { title: "Revisar cobertura de casos de borde en pagos mixtos", owner: "Iván Solís", due: "2026-07-24", priority: "Media", done: false },
    ],
  },
  {
    id: "api-facturacion",
    name: "API Facturación",
    client: "Sanborns",
    category: "API",
    status: "Bloqueado",
    priority: "Alta",
    startDate: "2026-01-10",
    endDate: "2026-07-20",
    qaLead: "Diego Marín",
    team: [
      { name: "Diego Marín", role: "QA Lead" },
      { name: "Karla Paredes", role: "QA Engineer" },
    ],
    releases: [
      { label: "Release 1.3 – CFDI 4.0", date: "2026-04-20", type: "release" },
      { label: "Epic: Descuentos combinados", date: "2026-06-15", type: "epic" },
    ],
    lastReportDate: "2026-07-16",
    passRate: 61,
    coverage: 55,
    testsExecuted: 960,
    bugsOpen: 21,
    bugsCritical: 6,
    bugsBySeverity: { critical: 6, high: 6, medium: 6, low: 3 },
    description: "API de timbrado y facturación electrónica CFDI 4.0.",
    summary:
      "El proyecto está bloqueado por 6 bugs críticos relacionados con el cálculo de impuestos en facturas con descuentos combinados. El cierre estaba planeado para el 20 de julio pero es probable que se retrase. Se recomienda una reunión de emergencia con desarrollo para re-priorizar antes del corte de sign-off.",
    trend: [
      { label: "S1", passRate: 82, testsExecuted: 90 },
      { label: "S2", passRate: 80, testsExecuted: 150 },
      { label: "S3", passRate: 76, testsExecuted: 210 },
      { label: "S4", passRate: 74, testsExecuted: 260 },
      { label: "S5", passRate: 70, testsExecuted: 300 },
      { label: "S6", passRate: 68, testsExecuted: 330 },
      { label: "S7", passRate: 64, testsExecuted: 360 },
      { label: "S8", passRate: 61, testsExecuted: 390 },
    ],
    actionables: [
      { title: "Escalar bugs críticos de cálculo de impuestos", owner: "Diego Marín", due: "2026-07-17", priority: "Alta", done: false },
      { title: "Definir nueva fecha de sign-off con el cliente", owner: "Diego Marín", due: "2026-07-18", priority: "Alta", done: false },
      { title: "Reforzar pruebas de descuentos combinados", owner: "Karla Paredes", due: "2026-07-21", priority: "Alta", done: false },
    ],
  },
  {
    id: "checkout-web",
    name: "Checkout Web",
    client: "Cemex",
    category: "Web",
    status: "Completado",
    priority: "Media",
    startDate: "2025-11-01",
    endDate: "2026-06-01",
    qaLead: "Ana Cabrera",
    team: [
      { name: "Ana Cabrera", role: "QA Lead" },
      { name: "Iván Solís", role: "QA Engineer" },
    ],
    releases: [
      { label: "Epic: Checkout exprés", date: "2026-03-15", type: "epic" },
      { label: "Release 1.0 – Lanzamiento", date: "2026-06-01", type: "release" },
    ],
    lastReportDate: "2026-06-01",
    passRate: 95,
    coverage: 88,
    testsExecuted: 2640,
    bugsOpen: 2,
    bugsCritical: 0,
    bugsBySeverity: { critical: 0, high: 0, medium: 1, low: 1 },
    description: "Rediseño del flujo de checkout para el e-commerce B2B.",
    summary:
      "Proyecto cerrado y liberado a producción sin incidentes críticos. Quedan 2 bugs menores documentados en el backlog de mantenimiento. El sign-off final se firmó el 1 de junio con una tasa de aprobación de 95%.",
    trend: [
      { label: "S1", passRate: 80, testsExecuted: 200 },
      { label: "S2", passRate: 84, testsExecuted: 260 },
      { label: "S3", passRate: 87, testsExecuted: 320 },
      { label: "S4", passRate: 89, testsExecuted: 380 },
      { label: "S5", passRate: 91, testsExecuted: 420 },
      { label: "S6", passRate: 93, testsExecuted: 460 },
      { label: "S7", passRate: 94, testsExecuted: 500 },
      { label: "S8", passRate: 95, testsExecuted: 540 },
    ],
    actionables: [
      { title: "Documentar bugs menores en backlog de mantenimiento", owner: "Ana Cabrera", due: "2026-06-05", priority: "Baja", done: true },
      { title: "Archivar suite de regresión del proyecto", owner: "Iván Solís", due: "2026-06-10", priority: "Baja", done: true },
      { title: "Retro de cierre con el equipo", owner: "Ana Cabrera", due: "2026-06-12", priority: "Media", done: true },
    ],
  },
  {
    id: "panel-interno",
    name: "Panel Interno",
    client: "BluePixel (interno)",
    category: "Interno",
    status: "Por iniciar",
    priority: "Baja",
    startDate: "2026-07-20",
    endDate: "2026-12-01",
    qaLead: "Sofía Reyes",
    team: [{ name: "Sofía Reyes", role: "QA Lead" }],
    releases: [{ label: "Epic: Gestión de equipos", date: "2026-08-15", type: "epic" }],
    lastReportDate: "—",
    passRate: 0,
    coverage: 0,
    testsExecuted: 0,
    bugsOpen: 0,
    bugsCritical: 0,
    bugsBySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
    description: "Panel de administración interno para gestión de proyectos y equipo.",
    summary:
      "Proyecto en fase de planeación. El kickoff está programado para el 20 de julio; aún no hay pruebas ejecutadas. El plan de pruebas y los ambientes de QA se están preparando esta semana.",
    trend: [
      { label: "S1", passRate: 0, testsExecuted: 0 },
      { label: "S2", passRate: 0, testsExecuted: 0 },
      { label: "S3", passRate: 0, testsExecuted: 0 },
      { label: "S4", passRate: 0, testsExecuted: 0 },
      { label: "S5", passRate: 0, testsExecuted: 0 },
      { label: "S6", passRate: 0, testsExecuted: 0 },
      { label: "S7", passRate: 0, testsExecuted: 0 },
      { label: "S8", passRate: 0, testsExecuted: 0 },
    ],
    actionables: [
      { title: "Definir plan de pruebas", owner: "Sofía Reyes", due: "2026-07-19", priority: "Alta", done: false },
      { title: "Preparar ambientes de QA", owner: "Sofía Reyes", due: "2026-07-19", priority: "Media", done: false },
      { title: "Agendar kickoff con stakeholders", owner: "Sofía Reyes", due: "2026-07-20", priority: "Alta", done: false },
    ],
  },
  {
    id: "sistema-inventario",
    name: "Sistema de Inventario",
    client: "Grupo Bimbo",
    category: "Web",
    status: "En curso",
    priority: "Media",
    startDate: "2026-02-15",
    endDate: "2026-07-30",
    qaLead: "Marcela Nuñez",
    team: [
      { name: "Marcela Nuñez", role: "QA Lead" },
      { name: "Diego Marín", role: "Automation Engineer" },
    ],
    releases: [
      { label: "Epic: Sincronización en tiempo real", date: "2026-05-10", type: "epic" },
      { label: "Release 3.0 – Multi-planta", date: "2026-07-01", type: "release" },
    ],
    lastReportDate: "2026-07-13",
    passRate: 91,
    coverage: 76,
    testsExecuted: 2210,
    bugsOpen: 10,
    bugsCritical: 2,
    bugsBySeverity: { critical: 2, high: 3, medium: 3, low: 2 },
    description: "Sistema de control de inventario multi-planta en tiempo real.",
    summary:
      "En la recta final antes del cierre del 30 de julio. La cobertura de reportes de inventario está completa; queda pendiente cerrar 2 bugs críticos en la sincronización entre plantas antes de UAT.",
    trend: [
      { label: "S1", passRate: 78, testsExecuted: 220 },
      { label: "S2", passRate: 81, testsExecuted: 280 },
      { label: "S3", passRate: 84, testsExecuted: 340 },
      { label: "S4", passRate: 86, testsExecuted: 390 },
      { label: "S5", passRate: 88, testsExecuted: 430 },
      { label: "S6", passRate: 89, testsExecuted: 470 },
      { label: "S7", passRate: 90, testsExecuted: 510 },
      { label: "S8", passRate: 91, testsExecuted: 550 },
    ],
    actionables: [
      { title: "Cerrar bugs críticos de sincronización entre plantas", owner: "Diego Marín", due: "2026-07-20", priority: "Alta", done: false },
      { title: "Preparar guion de UAT con el cliente", owner: "Marcela Nuñez", due: "2026-07-23", priority: "Media", done: false },
      { title: "Validar reportes de inventario en planta piloto", owner: "Marcela Nuñez", due: "2026-07-25", priority: "Media", done: true },
    ],
  },
  {
    id: "app-delivery",
    name: "App Delivery",
    client: "Rappi MX (partner)",
    category: "Móvil",
    status: "Completado",
    priority: "Media",
    startDate: "2025-09-01",
    endDate: "2026-03-01",
    qaLead: "Diego Marín",
    team: [
      { name: "Diego Marín", role: "QA Lead" },
      { name: "Ana Cabrera", role: "QA Engineer" },
    ],
    releases: [
      { label: "Epic: Rutas dinámicas", date: "2025-12-01", type: "epic" },
      { label: "Release 2.0 – Motor de rutas", date: "2026-02-15", type: "release" },
    ],
    lastReportDate: "2026-03-01",
    passRate: 93,
    coverage: 85,
    testsExecuted: 3480,
    bugsOpen: 4,
    bugsCritical: 0,
    bugsBySeverity: { critical: 0, high: 1, medium: 2, low: 1 },
    description: "Integración de la app de delivery con el nuevo motor de rutas.",
    summary:
      "Lanzamiento exitoso en marzo. El motor de rutas redujo tiempos de entrega sin regresiones críticas. Quedan 4 bugs menores en seguimiento post-lanzamiento.",
    trend: [
      { label: "S1", passRate: 84, testsExecuted: 300 },
      { label: "S2", passRate: 86, testsExecuted: 360 },
      { label: "S3", passRate: 88, testsExecuted: 410 },
      { label: "S4", passRate: 89, testsExecuted: 450 },
      { label: "S5", passRate: 90, testsExecuted: 480 },
      { label: "S6", passRate: 91, testsExecuted: 510 },
      { label: "S7", passRate: 92, testsExecuted: 540 },
      { label: "S8", passRate: 93, testsExecuted: 560 },
    ],
    actionables: [
      { title: "Dar seguimiento a bugs menores post-lanzamiento", owner: "Ana Cabrera", due: "2026-03-15", priority: "Baja", done: true },
      { title: "Documentar aprendizajes del motor de rutas", owner: "Diego Marín", due: "2026-03-10", priority: "Media", done: true },
      { title: "Retro de cierre con Rappi", owner: "Diego Marín", due: "2026-03-08", priority: "Media", done: true },
    ],
  },
  {
    id: "crm-ventas",
    name: "CRM Ventas",
    client: "Nutresa",
    category: "Web",
    status: "En curso",
    priority: "Media",
    startDate: "2026-04-01",
    endDate: "2026-10-15",
    qaLead: "Sofía Reyes",
    team: [
      { name: "Sofía Reyes", role: "QA Lead" },
      { name: "Luis Ortega", role: "QA Engineer" },
    ],
    releases: [
      { label: "Release 1.1 – Pedidos en campo", date: "2026-06-01", type: "release" },
      { label: "Epic: Comisiones", date: "2026-07-05", type: "epic" },
    ],
    lastReportDate: "2026-07-12",
    passRate: 90,
    coverage: 73,
    testsExecuted: 1650,
    bugsOpen: 12,
    bugsCritical: 1,
    bugsBySeverity: { critical: 1, high: 3, medium: 5, low: 3 },
    description: "CRM para fuerza de ventas con módulo de pedidos en campo.",
    summary:
      "Avance estable en la mitad del proyecto. El módulo de pedidos en campo ya tiene cobertura completa; el foco actual es el módulo de reportes de comisiones, que concentra la mayoría de los bugs abiertos.",
    trend: [
      { label: "S1", passRate: 82, testsExecuted: 160 },
      { label: "S2", passRate: 84, testsExecuted: 210 },
      { label: "S3", passRate: 85, testsExecuted: 250 },
      { label: "S4", passRate: 87, testsExecuted: 290 },
      { label: "S5", passRate: 88, testsExecuted: 320 },
      { label: "S6", passRate: 89, testsExecuted: 350 },
      { label: "S7", passRate: 89, testsExecuted: 380 },
      { label: "S8", passRate: 90, testsExecuted: 410 },
    ],
    actionables: [
      { title: "Cerrar bug crítico en cálculo de comisiones", owner: "Luis Ortega", due: "2026-07-19", priority: "Alta", done: false },
      { title: "Ampliar cobertura del módulo de reportes", owner: "Sofía Reyes", due: "2026-07-26", priority: "Media", done: false },
      { title: "Validar pedidos en campo sin conexión", owner: "Luis Ortega", due: "2026-07-28", priority: "Media", done: false },
    ],
  },
  {
    id: "portal-proveedores",
    name: "Portal Proveedores",
    client: "Cemex",
    category: "Web",
    status: "En curso",
    priority: "Media",
    startDate: "2026-06-01",
    endDate: "2027-01-15",
    qaLead: "Ana Cabrera",
    team: [
      { name: "Ana Cabrera", role: "QA Lead" },
      { name: "Karla Paredes", role: "QA Engineer" },
    ],
    releases: [
      { label: "Release 1.0 – MVP", date: "2026-08-01", type: "release" },
      { label: "Epic: Conciliación de pagos", date: "2026-09-15", type: "epic" },
    ],
    lastReportDate: "2026-07-11",
    passRate: 85,
    coverage: 60,
    testsExecuted: 940,
    bugsOpen: 18,
    bugsCritical: 2,
    bugsBySeverity: { critical: 2, high: 5, medium: 7, low: 4 },
    description: "Portal para gestión de órdenes de compra y pagos a proveedores.",
    summary:
      "Etapa temprana del proyecto con una base de pruebas creciendo cada semana. Los bugs abiertos se concentran en validaciones de formularios y permisos por rol; ninguno bloquea el avance por ahora.",
    trend: [
      { label: "S1", passRate: 70, testsExecuted: 60 },
      { label: "S2", passRate: 74, testsExecuted: 110 },
      { label: "S3", passRate: 77, testsExecuted: 160 },
      { label: "S4", passRate: 79, testsExecuted: 210 },
      { label: "S5", passRate: 81, testsExecuted: 250 },
      { label: "S6", passRate: 83, testsExecuted: 280 },
      { label: "S7", passRate: 84, testsExecuted: 310 },
      { label: "S8", passRate: 85, testsExecuted: 340 },
    ],
    actionables: [
      { title: "Cerrar bugs críticos de permisos por rol", owner: "Karla Paredes", due: "2026-07-21", priority: "Alta", done: false },
      { title: "Reforzar validaciones de formularios de orden de compra", owner: "Ana Cabrera", due: "2026-07-24", priority: "Media", done: false },
      { title: "Definir casos de prueba de conciliación de pagos", owner: "Ana Cabrera", due: "2026-07-30", priority: "Media", done: false },
    ],
  },
  {
    id: "migracion-cloud",
    name: "Migración Cloud",
    client: "LATAM",
    category: "Cloud",
    status: "En curso",
    priority: "Alta",
    startDate: "2026-07-01",
    endDate: "2027-02-28",
    qaLead: "Diego Marín",
    team: [
      { name: "Diego Marín", role: "QA Lead" },
      { name: "Iván Solís", role: "Automation Engineer" },
    ],
    releases: [
      { label: "Release 1.0 – Región primaria", date: "2026-09-01", type: "release" },
      { label: "Epic: Failover multi-región", date: "2026-11-01", type: "epic" },
    ],
    lastReportDate: "2026-07-15",
    passRate: 100,
    coverage: 20,
    testsExecuted: 140,
    bugsOpen: 1,
    bugsCritical: 0,
    bugsBySeverity: { critical: 0, high: 0, medium: 1, low: 0 },
    description: "Migración de la infraestructura on-premise al cloud multi-región.",
    summary:
      "Arranque reciente con pruebas de humo sobre el nuevo entorno cloud. Todo verde hasta ahora; el plan de pruebas de carga y failover multi-región está en preparación para las próximas semanas.",
    trend: [
      { label: "S1", passRate: 100, testsExecuted: 10 },
      { label: "S2", passRate: 100, testsExecuted: 25 },
      { label: "S3", passRate: 100, testsExecuted: 40 },
      { label: "S4", passRate: 100, testsExecuted: 60 },
      { label: "S5", passRate: 100, testsExecuted: 80 },
      { label: "S6", passRate: 100, testsExecuted: 100 },
      { label: "S7", passRate: 100, testsExecuted: 120 },
      { label: "S8", passRate: 100, testsExecuted: 140 },
    ],
    actionables: [
      { title: "Diseñar plan de pruebas de carga multi-región", owner: "Diego Marín", due: "2026-07-24", priority: "Alta", done: false },
      { title: "Definir escenarios de failover", owner: "Iván Solís", due: "2026-07-28", priority: "Alta", done: false },
      { title: "Resolver bug menor de configuración de DNS", owner: "Iván Solís", due: "2026-07-18", priority: "Baja", done: false },
    ],
  },
];

export function getProjectById(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}

/**
 * Derives a dated report history from the project's weekly trend, spreading
 * the existing pass-rate samples across the real start→(today or end) span so
 * the timeline can correlate a scrubbed date with a plausible historical
 * snapshot without hand-authoring a parallel dataset.
 */
export function getReportHistory(project: Project): ReportEntry[] {
  const start = new Date(project.startDate).getTime();
  const end = new Date(project.endDate).getTime();
  const now = Date.now();
  const rangeEnd = Math.max(start + 1, Math.min(now, end));
  const span = rangeEnd - start;
  const points = project.trend;
  const n = points.length;

  return points.map((point, i) => {
    const date = new Date(start + (i / Math.max(1, n - 1)) * span).toISOString();
    const prev = points[i - 1];
    let note = "Primer reporte del ciclo.";
    if (prev) {
      const delta = point.passRate - prev.passRate;
      if (delta >= 3) note = "Mejora notable en la tasa de aprobación.";
      else if (delta <= -3) note = "Regresión detectada, requiere seguimiento.";
      else note = "Tendencia estable respecto al reporte anterior.";
    }
    const coverage = Math.round((project.coverage * (i + 1)) / n);
    const bugsOpen = Math.max(
      i === n - 1 ? project.bugsOpen : 0,
      Math.round(project.bugsOpen * (1 - i / n) + project.bugsOpen * 0.4),
    );
    return {
      date,
      passRate: point.passRate,
      coverage,
      testsExecuted: point.testsExecuted,
      bugsOpen: i === n - 1 ? project.bugsOpen : bugsOpen,
      note,
    };
  });
}

export const STATUS_OPTIONS: ProjectStatus[] = [
  "Por iniciar",
  "En curso",
  "En riesgo",
  "Bloqueado",
  "Completado",
];

export const CATEGORY_OPTIONS: Project["category"][] = [
  "Web",
  "Móvil",
  "API",
  "Interno",
  "Cloud",
];

const STATUS_BADGE_COLOR: Record<ProjectStatus, BadgeColor> = {
  "Por iniciar": "neutral",
  "En curso": "info",
  "En riesgo": "warning",
  Bloqueado: "danger",
  Completado: "success",
};

export function getStatusBadgeColor(status: ProjectStatus): BadgeColor {
  return STATUS_BADGE_COLOR[status];
}
