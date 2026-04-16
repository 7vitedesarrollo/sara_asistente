import { createClient } from '@/lib/supabase/server'
import CertificadosClient from './CertificadosClient'

export default async function CertificadosPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: certs } = await supabase
    .from('medical_certificates')
    .select('id, content, issued_at')
    .eq('patient_id', id)
    .eq('doctor_id', user!.id)
    .order('issued_at', { ascending: false })

  const { data: doctor } = await supabase
    .from('doctors')
    .select('name, specialty')
    .eq('id', user!.id)
    .single()

  return (
    <CertificadosClient
      certs={certs ?? []}
      patientId={id}
      doctorId={user!.id}
      doctorName={doctor?.name ?? ''}
      doctorSpecialty={doctor?.specialty ?? ''}
    />
  )
}
