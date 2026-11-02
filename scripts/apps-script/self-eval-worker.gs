/**
 * Worker de las autoevaluaciones. Cada pocos minutos:
 *   1. le pide al servidor que procese lo pendiente (enviar lo programado, mandar recordatorios, cerrar lo vencido);
 *   2. toma los correos que quedaron en cola y los manda desde TU cuenta de Google (sin servicios externos);
 *   3. le avisa al servidor cuáles salieron.
 * Solo usa el INGEST_SECRET; el servidor nunca recibe acceso a tu correo.
 *
 * Instalación: ver scripts/apps-script/README.md
 */
const APP_URL = 'https://qa-office.vercel.app';
const SENDER_NAME = 'BluePixel · Estrategas';

function secret() {
  const s = PropertiesService.getScriptProperties().getProperty('INGEST_SECRET');
  if (!s) throw new Error('Falta la propiedad de script INGEST_SECRET.');
  return s;
}

function call(path, method, body) {
  const res = UrlFetchApp.fetch(APP_URL + path, {
    method: method,
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + secret() },
    payload: body ? JSON.stringify(body) : undefined,
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() >= 300) throw new Error(path + ' → ' + res.getResponseCode() + ' ' + res.getContentText());
  return JSON.parse(res.getContentText());
}

function selfEvalWorker() {
  Logger.log('tick: ' + JSON.stringify(call('/api/self-eval/tick', 'post')));
  deliverOutbox();
}

function deliverOutbox() {
  const queued = call('/api/self-eval/outbox', 'get').mail;
  queued.forEach(function (m) {
    try {
      MailApp.sendEmail({ to: m.to, subject: m.subject, body: m.text, htmlBody: m.html, name: SENDER_NAME });
      call('/api/self-eval/outbox', 'post', { id: m.id, ok: true });
    } catch (err) {
      call('/api/self-eval/outbox', 'post', { id: m.id, ok: false, error: String(err) });
    }
  });
  Logger.log('correos enviados: ' + queued.length);
}

/** Ejecútala una vez: crea el disparador que corre el worker cada 10 minutos. */
function installTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'selfEvalWorker') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('selfEvalWorker').timeBased().everyMinutes(10).create();
}
