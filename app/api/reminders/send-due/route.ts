import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { sendEmail, reminderEmail } from '@/lib/email'

// POST /api/reminders/send-due
// Encuentra citas programadas para mañana que aún no tienen recordatorio
// 'email' enviado, intenta enviarlas via Resend, registra el resultado en
// appointment_reminders.
//
// Auth: header Authorization: Bearer <CRON_SECRET>
//
// Configurar como Vercel Cron en vercel.json:
//   { "crons": [{ "path": "/api/reminders/send-due", "schedule": "0 13 * * *" }] }
// (13:00 UTC = 8am hora Ecuador)

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!cronSecret || cronSecret === 'change-me-to-a-random-32-byte-hex') {
    return NextResponse.json({ error: 'CRON_SECRET no configurado' }, { status: 500 })
  }
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY requerido para queries cross-tenant' },
      { status: 500 },
    )
  }

  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Cliente con service role — necesario para iterar todas las citas de
  // todos los nutricionistas (RLS por nutritionist_id se salta sólo para
  // este endpoint cron). Mantener este key fuera del bundle del cliente.
  const supabase = createServiceClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  // Ventana: mañana en la zona horaria del servidor. Si quieres timezone
  // por nutricionista, hay que mover esta lógica al loop por cita usando
  // settings del nutricionista.
  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() + 1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setHours(24, 0, 0, 0)

  const { data: appointments, error: queryErr } = await supabase
    .from('appointments')
    .select(`
      id, datetime, reason, status, nutritionist_id,
      patient:patients ( name, email ),
      nutritionist:nutritionists ( name )
    `)
    .gte('datetime', start.toISOString())
    .lt('datetime', end.toISOString())
    .eq('status', 'programada')

  if (queryErr) {
    return NextResponse.json({ error: queryErr.message }, { status: 500 })
  }

  // Filtrar las que ya tienen recordatorio email
  const ids = (appointments ?? []).map(a => a.id)
  const sentIds = new Set<string>()

  if (ids.length > 0) {
    const { data: existing } = await supabase
      .from('appointment_reminders')
      .select('appointment_id')
      .in('appointment_id', ids)
      .eq('kind', 'email')

    for (const r of existing ?? []) sentIds.add(r.appointment_id)
  }

  type Appt = NonNullable<typeof appointments>[number]
  const pending = (appointments ?? []).filter((a: Appt) => !sentIds.has(a.id))

  let sentCount = 0
  let loggedCount = 0
  let failedCount = 0
  let skippedCount = 0

  for (const appt of pending) {
    // supabase devuelve patient/nutritionist como array por la sintaxis del
    // join — extraemos el primer elemento
    const patient = Array.isArray(appt.patient) ? appt.patient[0] : appt.patient
    const nutri = Array.isArray(appt.nutritionist) ? appt.nutritionist[0] : appt.nutritionist

    if (!patient?.email) {
      skippedCount++
      continue
    }

    const tpl = reminderEmail({
      patientName: patient.name,
      nutritionistName: nutri?.name ?? 'Nutricionista',
      appointmentDateTime: appt.datetime,
      appointmentReason: appt.reason,
    })

    const result = await sendEmail({
      to: patient.email,
      subject: tpl.subject,
      text: tpl.text,
      html: tpl.html,
    })

    await supabase.from('appointment_reminders').insert({
      appointment_id: appt.id,
      nutritionist_id: appt.nutritionist_id,
      kind: 'email',
      status: result.status,
      recipient: patient.email,
      error_message: result.ok ? null : result.error,
    })

    if (result.ok && result.status === 'sent') sentCount++
    else if (result.ok && result.status === 'logged') loggedCount++
    else failedCount++
  }

  return NextResponse.json({
    found: appointments?.length ?? 0,
    pending: pending.length,
    sent: sentCount,
    logged: loggedCount,
    failed: failedCount,
    skipped_no_email: skippedCount,
  })
}
