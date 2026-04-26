// Email helper — Resend con fallback log-only para desarrollo sin API key.
// Sin dependencia npm: usa fetch directo contra el API REST de Resend.
//
// Setup:
//   1. Crear cuenta en https://resend.com (3000 emails/mes gratis)
//   2. Verificar dominio O usar onboarding@resend.dev (testing)
//   3. Generar API key en https://resend.com/api-keys
//   4. Añadir RESEND_API_KEY y RESEND_FROM_EMAIL a .env
// ============================================================

export type EmailPayload = {
  to: string
  subject: string
  text: string
  html?: string
}

export type EmailResult =
  | { ok: true; status: 'sent'; id: string }
  | { ok: true; status: 'logged' }
  | { ok: false; status: 'failed'; error: string }

export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL

  // Sin configurar → fallback log-only (registramos como enviado para no
  // bloquear el flujo en desarrollo, pero status='logged' indica que no
  // salió de la máquina)
  if (!apiKey || apiKey === 'your-resend-key' || !from) {
    console.log('[email:logged]', { to: payload.to, subject: payload.subject })
    return { ok: true, status: 'logged' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html ?? undefined,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        ok: false,
        status: 'failed',
        error: data.message ?? data.name ?? `HTTP ${response.status}`,
      }
    }

    return { ok: true, status: 'sent', id: data.id ?? '' }
  } catch (err) {
    return {
      ok: false,
      status: 'failed',
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

// ─── Templates ───────────────────────────────────────────────────────────

export function reminderEmail({
  patientName,
  nutritionistName,
  appointmentDateTime,
  appointmentReason,
}: {
  patientName: string
  nutritionistName: string
  appointmentDateTime: string
  appointmentReason: string | null
}): { subject: string; text: string; html: string } {
  const dt = new Date(appointmentDateTime)
  const fechaLarga = dt.toLocaleDateString('es', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const hora = dt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })

  const subject = `Recordatorio: tu consulta con Lic. ${nutritionistName} es mañana`

  const text = `Hola ${patientName},

Te recordamos tu consulta nutricional con Lic. ${nutritionistName}:

📅 ${fechaLarga}
⏰ ${hora}
${appointmentReason ? `\nMotivo: ${appointmentReason}\n` : ''}
Si necesitas reagendar o cancelar, responde a este correo cuanto antes.

Hasta pronto.`

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FAFAF8; color: #1A1F1C; padding: 32px 16px; margin: 0; }
  .card { max-width: 480px; margin: 0 auto; background: #FCFCFA; border: 1px solid #E5E5E0; border-radius: 12px; padding: 32px; }
  .greeting { font-size: 28px; font-family: Georgia, serif; font-weight: 400; line-height: 1.1; margin: 0 0 16px; }
  .greeting em { color: #4A7C59; font-style: italic; }
  .body { font-size: 15px; line-height: 1.6; color: #1A1F1C; margin: 0 0 24px; }
  .meta { background: #EDF2EE; border-left: 3px solid #4A7C59; padding: 16px 20px; border-radius: 6px; margin: 24px 0; }
  .meta-row { display: flex; gap: 12px; margin: 6px 0; font-size: 14px; }
  .meta-label { font-family: 'SF Mono', Menlo, monospace; font-size: 11px; color: #5C615D; text-transform: uppercase; letter-spacing: 0.1em; min-width: 70px; padding-top: 2px; }
  .meta-value { font-size: 15px; color: #1A1F1C; flex: 1; }
  .footer { font-size: 12px; color: #8C918D; text-align: center; margin-top: 24px; }
  .signature { margin-top: 24px; padding-top: 16px; border-top: 1px solid #E5E5E0; font-size: 13px; color: #5C615D; }
</style>
</head>
<body>
<div class="card">
  <p class="greeting">Hola, <em>${escape(patientName)}</em>.</p>
  <p class="body">Te recordamos tu consulta nutricional con Lic. ${escape(nutritionistName)}.</p>
  <div class="meta">
    <div class="meta-row">
      <div class="meta-label">Día</div>
      <div class="meta-value">${escape(fechaLarga)}</div>
    </div>
    <div class="meta-row">
      <div class="meta-label">Hora</div>
      <div class="meta-value">${escape(hora)}</div>
    </div>
    ${appointmentReason ? `<div class="meta-row"><div class="meta-label">Motivo</div><div class="meta-value">${escape(appointmentReason)}</div></div>` : ''}
  </div>
  <p class="body">Si necesitas reagendar o cancelar, responde a este correo cuanto antes.</p>
  <div class="signature">Hasta pronto.<br>Lic. ${escape(nutritionistName)}</div>
</div>
<p class="footer">Sara Asistente</p>
</body>
</html>`

  return { subject, text, html }
}

function escape(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
