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
      patient:patients(id, name, age)
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

  type RawAppt = NonNullable<typeof appointments>[number]
  type NormalizedAppt = Omit<RawAppt, 'patient'> & {
    patient: { id: string; name: string; age: number | null } | null
  }

  const normalized: NormalizedAppt[] = (appointments ?? []).map(a => ({
    ...a,
    patient: Array.isArray(a.patient) ? (a.patient[0] ?? null) : a.patient,
  }))

  return (
    <AppointmentsClient
      appointments={normalized}
      patients={patients ?? []}
      nutritionistId={user!.id}
    />
  )
}
