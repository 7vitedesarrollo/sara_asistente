import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import MeasurementsClient from './MeasurementsClient'

export default async function MedicionesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: patient } = await supabase
    .from('patients')
    .select('id, name, height_cm')
    .eq('id', id)
    .eq('nutritionist_id', user!.id)
    .single()

  if (!patient) notFound()

  const { data: measurements } = await supabase
    .from('measurements')
    .select('id, measured_at, weight_kg, body_fat_pct, muscle_mass_kg, waist_cm, hip_cm, bmi, notes')
    .eq('patient_id', id)
    .eq('nutritionist_id', user!.id)
    .order('measured_at', { ascending: false })

  return (
    <MeasurementsClient
      measurements={measurements ?? []}
      patientId={id}
      patientName={patient.name}
      patientHeightCm={patient.height_cm}
      nutritionistId={user!.id}
    />
  )
}
