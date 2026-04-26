import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, reminderEmail } from '@/lib/email'

// POST /api/reminders/send
// Body: { appointmentId: string }
//
// Envío manual desde la UI del nutricionista. Auth via cookie de Supabase
// normal (RLS valida que la cita pertenezca al nutricionista autenticado).

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { appointmentId } = await req.json()
  if (!appointmentId || typeof appointmentId !== 'string') {
    return NextResponse.json({ error: 'appointmentId required' }, { status: 400 })
  }

  // Verificar que ya no se haya enviado
  const { data: existing } = await supabase
    .from('appointment_reminders')
    .select('id, status, sent_at')
    .eq('appointment_id', appointmentId)
    .eq('kind', 'email')
    .maybeSingle()

  if (existing) {
    return NextResponse.json({
      error: 'Ya se envió un recordatorio para esta cita',
      previous: existing,
    }, { status: 409 })
  }

  // Cargar cita + paciente + nutricionista (RLS asegura ownership)
  const { data: appt, error: apptErr } = await supabase
    .from('appointments')
    .select(`
      id, datetime, reason, status, nutritionist_id,
      patient:patients ( name, email ),
      nutritionist:nutritionists ( name )
    `)
    .eq('id', appointmentId)
    .single()

  if (apptErr || !appt) {
    return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
  }

  const patient = Array.isArray(appt.patient) ? appt.patient[0] : appt.patient
  const nutri = Array.isArray(appt.nutritionist) ? appt.nutritionist[0] : appt.nutritionist

  if (!patient?.email) {
    return NextResponse.json({
      error: 'El paciente no tiene correo registrado',
    }, { status: 400 })
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

  if (!result.ok) {
    return NextResponse.json({
      ok: false,
      error: result.error,
    }, { status: 502 })
  }

  return NextResponse.json({
    ok: true,
    status: result.status,
    recipient: patient.email,
  })
}
