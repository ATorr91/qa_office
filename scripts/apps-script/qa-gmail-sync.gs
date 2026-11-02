/**
 * Lee los correos "[Estatus QA] ..." de tu Gmail y manda el Pass Rate de cada uno al dashboard.
 * Corre en tu cuenta de Google (Apps Script), así que no hace falta darle a la app acceso a tu correo:
 * solo viajan los números del resumen (proyecto, release, fecha de corte, avance, Pass Rate y estatus).
 *
 * Instalación: ver scripts/apps-script/README.md
 */
const ENDPOINT = 'https://qa-office.vercel.app/api/ingest/qa';
const SEARCH = 'subject:"[Estatus QA" newer_than:90d';

function syncQaReports() {
  const secret = PropertiesService.getScriptProperties().getProperty('INGEST_SECRET');
  if (!secret) throw new Error('Falta la propiedad de script INGEST_SECRET.');

  const rows = [];
  GmailApp.search(SEARCH, 0, 100).forEach(function (thread) {
    thread.getMessages().forEach(function (message) {
      const row = parseReport(message.getPlainBody(), message.getSubject(), message.getDate());
      if (row) rows.push(row);
    });
  });
  if (rows.length === 0) return Logger.log('Sin reportes de QA para enviar.');

  for (let i = 0; i < rows.length; i += 200) {
    const res = UrlFetchApp.fetch(ENDPOINT, {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + secret },
      payload: JSON.stringify({ rows: rows.slice(i, i + 200) }),
      muteHttpExceptions: true,
    });
    Logger.log(res.getResponseCode() + ' ' + res.getContentText());
  }
}

/** Primer valor de la etiqueta en el correo; en una respuesta es el del resumen citado. */
function field(body, pattern) {
  const m = body.match(pattern);
  return m ? m[1].trim() : null;
}

function parseReport(body, subject, sentAt) {
  const passRate = field(body, /Pass Rate\)?\s*:\s*([\d.,]+)\s*%?/i);
  if (passRate === null) return null;
  const subjectProject = field(subject, /\[Estatus QA[^\]]*\]\s*(.+?)\s+-\s/i);
  const release = field(body, /Release\s*:\s*(.+)/i);
  const progress = field(body, /Porcentaje de Avance\s*:\s*([\d.,]+)/i);
  return {
    project: field(body, /Proyecto\s*:\s*(.+)/i) || subjectProject,
    release: release && release !== '-' ? release : null,
    cutDate: field(body, /Fecha de Corte\s*:\s*([\d-]+)/i),
    emailDate: sentAt.toISOString(),
    progress: progress === null ? null : Number(progress.replace(',', '.')),
    passRate: Number(passRate.replace(',', '.')),
    status: field(body, /Estatus General\s*:\s*([^\n\r]+)/i),
  };
}

/** Ejecútala una vez: crea el disparador que revisa tu correo todos los días a las 7 am. */
function installDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'syncQaReports') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('syncQaReports').timeBased().everyDays(1).atHour(7).create();
}
