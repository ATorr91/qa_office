// Email copy for the self-evaluation flow: the invitation, the reminders and the closing notice. Plain text and
// HTML (inline styles, because email clients ignore stylesheets). Pure functions so they can be previewed and tested.

const BLUE = "#16A1CD";
const INK = "#1a1e21";
const SOFT = "#5b6670";

export interface MailContent {
  subject: string;
  html: string;
  text: string;
}

function escapeHtml(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** "jueves 5 de noviembre, 3:00 p. m." in the team's timezone. */
export function formatDeadline(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", {
    timeZone: "America/Mexico_City",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  });
}

function layout(heading: string, paragraphs: string[], link: string, cta: string, footer: string): string {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:${INK}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #e3e8ec">
<tr><td style="padding:28px 28px 8px"><div style="font-size:12px;font-weight:bold;letter-spacing:.08em;color:${BLUE};text-transform:uppercase">BluePixel · Estrategas</div>
<h1 style="margin:8px 0 0;font-size:20px;line-height:1.3">${escapeHtml(heading)}</h1></td></tr>
<tr><td style="padding:8px 28px 4px;font-size:14px;line-height:1.6">${paragraphs.map((p) => `<p style="margin:12px 0">${p}</p>`).join("")}</td></tr>
<tr><td style="padding:8px 28px 24px"><a href="${escapeHtml(link)}" style="display:inline-block;background:${BLUE};color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 22px;border-radius:8px">${escapeHtml(cta)}</a>
<p style="margin:14px 0 0;font-size:12px;color:${SOFT};word-break:break-all">Si el botón no abre, copia este enlace: ${escapeHtml(link)}</p></td></tr>
<tr><td style="padding:14px 28px;border-top:1px solid #e3e8ec;font-size:11px;color:${SOFT}">${footer}</td></tr>
</table></td></tr></table></body></html>`;
}

const FOOTER = "Este enlace es personal: no lo reenvíes. Tus respuestas las ve solo el equipo de administración del dashboard.";

export function invitationMail(p: { name: string; title: string; link: string; closesAt: string; windowHours: number }): MailContent {
  const deadline = formatDeadline(p.closesAt);
  const intro = `Hola ${p.name}, te toca calificarte a ti mismo/a en «${p.title}». Son unos minutos y sirve para comparar cómo percibes tu trabajo con lo que muestran las métricas.`;
  const window = `Tienes <strong>${p.windowHours} horas</strong> para responder: la encuesta cierra el <strong>${escapeHtml(deadline)}</strong> (hora CDMX).`;
  return {
    subject: `Tu autoevaluación: ${p.title} · responde en ${p.windowHours} h`,
    html: layout(`Tu autoevaluación: ${p.title}`, [escapeHtml(intro), window], p.link, "Responder mi autoevaluación", FOOTER),
    text: `${intro}\n\nTienes ${p.windowHours} horas para responder: cierra el ${deadline} (hora CDMX).\n\nResponde aquí: ${p.link}\n\n${FOOTER}`,
  };
}

export function reminderMail(p: { name: string; title: string; link: string; closesAt: string; hoursLeft: number }): MailContent {
  const deadline = formatDeadline(p.closesAt);
  const left = p.hoursLeft <= 1 ? "menos de 1 hora" : `${Math.round(p.hoursLeft)} horas`;
  const intro = `Hola ${p.name}, todavía no recibimos tu autoevaluación «${p.title}».`;
  const window = `Te quedan <strong>${escapeHtml(left)}</strong>: cierra el <strong>${escapeHtml(deadline)}</strong> (hora CDMX). Pasado ese momento ya no se podrá responder.`;
  return {
    subject: `Recordatorio: tu autoevaluación cierra en ${left}`,
    html: layout(`Te quedan ${left} para responder`, [escapeHtml(intro), window], p.link, "Responder ahora", FOOTER),
    text: `${intro}\n\nTe quedan ${left}: cierra el ${deadline} (hora CDMX).\n\nResponde aquí: ${p.link}\n\n${FOOTER}`,
  };
}
