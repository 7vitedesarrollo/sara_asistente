import { createClient } from '@/lib/supabase/server'
import DocumentosClient from './DocumentosClient'

export default async function CertificadosPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: certs } = await supabase
    .from('certificates')
    .select('id, content, issued_at')
    .eq('patient_id', id)
    .eq('nutritionist_id', user!.id)
    .order('issued_at', { ascending: false })

  const { data: nutritionist } = await supabase
    .from('nutritionists')
    .select('name, specialization')
    .eq('id', user!.id)
    .single()

  return (
    <DocumentosClient
      certs={certs ?? []}
      patientId={id}
      nutritionistId={user!.id}
      nutritionistName={nutritionist?.name ?? ''}
      nutritionistSpecialization={nutritionist?.specialization ?? ''}
    />
  )
}
