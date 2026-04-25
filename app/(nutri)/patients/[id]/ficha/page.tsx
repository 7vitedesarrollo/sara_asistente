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
    .eq('nutritionist_id', user!.id)
    .single()

  if (!patient) notFound()

  const { data: latestMeasurement } = await supabase
    .from('measurements')
    .select('weight_kg, body_fat_pct')
    .eq('patient_id', id)
    .eq('nutritionist_id', user!.id)
    .order('measured_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <FichaClient
      patient={patient}
      latestWeightKg={latestMeasurement?.weight_kg ?? null}
      latestBodyFatPct={latestMeasurement?.body_fat_pct ?? null}
      nutritionistId={user!.id}
    />
  )
}
