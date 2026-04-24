import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Pacientes con cita hoy o agregados hoy
  const today = new Date()
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

  const { data: todayAppointments } = await supabase
    .from('appointments')
    .select(`
      id,
      datetime,
      reason,
      status,
      patient:patients(id, name, age, sex, phone)
    `)
    .eq('nutritionist_id', user!.id)
    .gte('datetime', startOfDay)
    .lte('datetime', endOfDay)
    .order('datetime', { ascending: true })

  // Todos los pacientes para la búsqueda
  const { data: allPatients } = await supabase
    .from('patients')
    .select('id, name, age, sex, phone, created_at')
    .eq('nutritionist_id', user!.id)
    .order('name', { ascending: true })

  // Supabase typegen returns patient as array for FK joins; normalize to single object
  type RawAppt = NonNullable<typeof todayAppointments>[number]
  type NormalizedAppt = Omit<RawAppt, 'patient'> & {
    patient: { id: string; name: string; age: number | null; sex: string | null; phone: string | null } | null
  }

  const normalizedAppointments: NormalizedAppt[] = (todayAppointments ?? []).map(a => ({
    ...a,
    patient: Array.isArray(a.patient) ? (a.patient[0] ?? null) : a.patient,
  }))

  return (
    <DashboardClient
      todayAppointments={normalizedAppointments}
      allPatients={allPatients ?? []}
      nutritionistId={user!.id}
    />
  )
}
