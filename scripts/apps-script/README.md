# Automatizaciones de QA y CSAT (Google Apps Script)

El dashboard lee **QA** de tus correos `[Estatus QA]` y **CSAT** de la hoja `CUENTAS 2026`. Como las dos cosas viven
en tu cuenta de Google, los scripts corren ahí y solo mandan números al dashboard — la app nunca recibe acceso a
tu correo ni a la hoja (que es sensible). **NPS** no necesita script: lo lee el servidor de Figma a diario
(`/api/sync/figma`, ver `vercel.json`).

## Una sola vez

1. En Vercel (Project → Settings → Environment Variables, Production) crea:
   - `INGEST_SECRET`: una cadena larga y aleatoria (por ejemplo `openssl rand -hex 24`). Es la contraseña que usan los scripts.
   - `FIGMA_TOKEN`: un Personal access token de Figma con acceso de lectura al archivo de encuestas.
   - `ADMIN_PASSWORD`, si aún no existe.
   Redeploy después de guardarlas.
2. **QA** — en https://script.google.com crea un proyecto, pega `qa-gmail-sync.gs`, y en *Project Settings → Script
   properties* agrega `INGEST_SECRET` con el mismo valor. Ejecuta `syncQaReports` (te pedirá permiso para leer tu Gmail)
   y luego `installDailyTrigger` para que corra todos los días a las 7 am.
3. **CSAT** — abre `CUENTAS 2026` → *Extensiones → Apps Script*, pega `csat-sheet-sync.gs`, agrega la misma propiedad
   `INGEST_SECRET`, ejecuta `syncCsat` y luego `installDailyTrigger`.
   - El script deduce la escala de las respuestas (1-5, 1-10 o 0-100) de la calificación más alta que aparece; el
     registro de ejecución dice cuál eligió. Revísalo la primera vez.
   - Solo salen cuenta, mes y calificaciones. No salen owners, contactos, ventas ni otras pestañas.

Mandar los mismos datos varias veces no duplica nada. Para probar sin esperar al día siguiente, ejecuta la función a mano.

## Autoevaluaciones: envío de correos y recordatorios

El tab **Autoevaluación** crea encuestas que se mandan por correo a cada estratega con un enlace personal y un plazo (24 h por
defecto). El servidor deja los correos en una cola; alguien tiene que entregarlos. Hay dos opciones:

- **Con tu cuenta de Google (sin servicios externos):** crea un proyecto en https://script.google.com, pega
  `self-eval-worker.gs` y agrega la propiedad `INGEST_SECRET` (la misma de arriba). Ejecuta `selfEvalWorker` una vez
  (pedirá permiso para enviar correo) y luego `installTrigger`. Cada 10 minutos procesa lo pendiente (envíos programados,
  recordatorios, cierres) y manda los correos desde tu cuenta. Límite de Google: ~1,500 correos al día en Workspace.
- **Con Resend:** define `RESEND_API_KEY` y `MAIL_FROM` (dominio verificado) en Vercel. El servidor manda directo cada vez que
  corre el proceso; ahí el worker de Google solo hace falta para correr el proceso con frecuencia.

Vercel cron llama al proceso una vez al día como respaldo; para que los recordatorios lleguen a tiempo con un plazo de 24 h
hace falta que corra con más frecuencia (el worker de Google, o un plan de Vercel que permita crons más frecuentes).
Sin ninguna de las dos opciones configuradas **no sale ningún correo**: las encuestas se crean igual y desde el detalle puedes
«Copiar enlace» para mandarlo tú.
