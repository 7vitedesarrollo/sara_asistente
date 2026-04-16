import { createClient } from '@/lib/supabase/server'
import PrescriptionsClient from './PrescriptionsClient'

export default async function PrescriptionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: prescriptions } = await supabase
    .from('prescriptions')
    .select('id, medications, instructions, created_at')
    .eq('patient_id', id)
    .eq('doctor_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <PrescriptionsClient
      prescriptions={prescriptions ?? []}
      patientId={id}
      doctorId={user!.id}
    />
  )
}
