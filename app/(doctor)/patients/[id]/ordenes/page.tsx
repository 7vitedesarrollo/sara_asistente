import { createClient } from '@/lib/supabase/server'
import OrdenesClient from './OrdenesClient'

export default async function OrdenesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: orders } = await supabase
    .from('exam_orders')
    .select('id, exams, notes, created_at')
    .eq('patient_id', id)
    .eq('doctor_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <OrdenesClient
      orders={orders ?? []}
      patientId={id}
      doctorId={user!.id}
    />
  )
}
