import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import FichaClient from './FichaClient'

export default async function FichaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .eq('doctor_id', user!.id)
    .single()

  if (!patient) notFound()

  return <FichaClient patient={patient} doctorId={user!.id} />
}
