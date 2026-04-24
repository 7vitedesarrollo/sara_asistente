import { createClient } from '@/lib/supabase/server'
import LabReferencesClient from './LabReferencesClient'

export default async function ReferenciasPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: orders } = await supabase
    .from('lab_references')
    .select('id, requested_labs, notes, created_at')
    .eq('patient_id', id)
    .eq('nutritionist_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <LabReferencesClient
      orders={orders ?? []}
      patientId={id}
      nutritionistId={user!.id}
    />
  )
}
