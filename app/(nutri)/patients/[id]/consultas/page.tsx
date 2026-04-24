import { createClient } from '@/lib/supabase/server'
import ConsultasClient from './ConsultasClient'

export default async function ConsultasPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: consultations } = await supabase
    .from('consultations')
    .select('id, date, notes, objective, next_consultation, created_at')
    .eq('patient_id', id)
    .eq('nutritionist_id', user!.id)
    .order('date', { ascending: false })

  return (
    <ConsultasClient
      consultations={consultations ?? []}
      patientId={id}
      nutritionistId={user!.id}
    />
  )
}
