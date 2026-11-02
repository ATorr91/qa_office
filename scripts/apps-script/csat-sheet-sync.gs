/**
 * Manda al dashboard el promedio de CSAT por cuenta y por mes de la pestaña "CSAT - Respuestas".
 * Va dentro del archivo «CUENTAS 2026» (Extensiones → Apps Script), así que el archivo nunca se comparte con
 * la app. Solo salen: nombre de la cuenta, mes y las calificaciones numéricas. No salen owners, contactos,
 * ventas, facturación ni ninguna otra pestaña. El servidor además descarta las cuentas que no sigue el dashboard.
 *
 * Instalación: ver scripts/apps-script/README.md
 */
const ENDPOINT = 'https://qa-office.vercel.app/api/ingest/csat';
const YEAR = 2026;
const TAB_PATTERN = /csat.*respuestas/i;
const MONTHS = { enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12 };

function norm(v) {
  return String(v).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function syncCsat() {
  const secret = PropertiesService.getScriptProperties().getProperty('INGEST_SECRET');
  if (!secret) throw new Error('Falta la propiedad de script INGEST_SECRET.');

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets().filter(function (s) { return TAB_PATTERN.test(s.getName()); })[0];
  if (!sheet) throw new Error('No encontré la pestaña de CSAT.');
  const grid = sheet.getDataRange().getDisplayValues();

  // La fila del encabezado es la que dice CLIENTE; los meses están justo arriba, combinados sobre 3 columnas.
  const headerRow = grid.findIndex(function (row) { return row.some(function (c) { return norm(c) === 'cliente'; }); });
  if (headerRow < 1) throw new Error('No encontré el encabezado CLIENTE.');
  const clientCol = grid[headerRow].findIndex(function (c) { return norm(c) === 'cliente'; });
  const monthByCol = [];
  let current = null;
  grid[headerRow - 1].forEach(function (cell, col) {
    const m = MONTHS[norm(cell).replace('[merged]', '').trim()];
    if (m) current = m;
    monthByCol[col] = current;
  });

  const answers = {}; // "cliente|mes" -> [calificaciones]
  let max = 0;
  for (let r = headerRow + 1; r < grid.length; r++) {
    const client = grid[r][clientCol].trim();
    if (!client) continue;
    grid[r].forEach(function (cell, col) {
      if (col === clientCol || !monthByCol[col]) return;
      const n = Number(String(cell).replace(',', '.'));
      // SR / NA / - no son respuestas, y un 0 en la escala de 1 a 5 tampoco: es un mes todavía sin contestar.
      if (String(cell).trim() === '' || !isFinite(n) || n <= 0) return;
      const key = client + '|' + monthByCol[col];
      (answers[key] = answers[key] || []).push(n);
      max = Math.max(max, n);
    });
  }

  // La escala no viene escrita en la hoja: se deduce de la calificación más alta que aparece.
  const scaleMax = max <= 5 ? 5 : max <= 10 ? 10 : 100;
  const rows = Object.keys(answers).map(function (key) {
    const parts = key.split('|');
    const month = YEAR + '-' + ('0' + parts[1]).slice(-2);
    return { client: parts[0], month: month, values: answers[key], scaleMax: scaleMax };
  });
  Logger.log('Escala detectada: 1-' + scaleMax + ' · cuentas/mes con respuestas: ' + rows.length);
  if (rows.length === 0) return;

  const res = UrlFetchApp.fetch(ENDPOINT, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + secret },
    payload: JSON.stringify({ rows: rows }),
    muteHttpExceptions: true,
  });
  Logger.log(res.getResponseCode() + ' ' + res.getContentText());
}

/** Ejecútala una vez: crea el disparador que manda el CSAT todos los días a las 7 am. */
function installDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'syncCsat') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('syncCsat').timeBased().everyDays(1).atHour(7).create();
}
