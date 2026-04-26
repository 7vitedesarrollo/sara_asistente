import { createClient } from '@/lib/supabase/server'
import AppointmentsClient from './AppointmentsClient'

export default async function AppointmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      id,
      datetime,
      reason,
      status,
      patient:patients(id, name, age, email)
    `)
    .eq('nutritionist_id', user!.id)
    .gte('datetime', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
    .order('datetime', { ascending: true })
    .limit(100)

  const { data: patients } = await supabase
    .from('patients')
    .select('id, name')
    .eq('nutritionist_id', user!.id)
    .order('name')

  // Cargar recordatorios ya enviados para las citas listadas (para mostrar
  // estado en la UI sin extra round-trips por cita)
  const apptIds = (appointments ?? []).map(a => a.id)
  const { data: reminders } = apptIds.length > 0
    ? await supabase
        .from('appointment_reminders')
        .select('appointment_id, kind, status, sent_at')
        .in('appointment_id', apptIds)
        .eq('kind', 'email')
    : { data: [] }

  const remindersByAppt = new Map<string, { status: string; sent_at: string }>()
  for (const r of reminders ?? []) {
    remindersByAppt.set(r.appointment_id, { status: r.status, sent_at: r.sent_at })
  }

  type RawAppt = NonNullable<typeof appointments>[number]
  type NormalizedAppt = Omit<RawAppt, 'patient'> & {
    patient: { id: string; name: string; age: number | null; email: string | null } | null
    reminder: { status: string; sent_at: string } | null
  }

  const normalized: NormalizedAppt[] = (appointments ?? []).map(a => ({
    ...a,
    patient: Array.isArray(a.patient) ? (a.patient[0] ?? null) : a.patient,
    reminder: remindersByAppt.get(a.id) ?? null,
  }))

  return (
    <AppointmentsClient
      appointments={normalized}
      patients={patients ?? []}
      nutritionistId={user!.id}
    />
  )
}
