import { createClient } from '@/lib/supabase/server'
import AtencionesClient from './AtencionesClient'

export default async function AtencionesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: visits } = await supabase
    .from('visits')
    .select('id, date, notes, diagnosis, next_visit, created_at')
    .eq('patient_id', id)
    .eq('doctor_id', user!.id)
    .order('date', { ascending: false })

  return (
    <AtencionesClient
      visits={visits ?? []}
      patientId={id}
      doctorId={user!.id}
    />
  )
}
