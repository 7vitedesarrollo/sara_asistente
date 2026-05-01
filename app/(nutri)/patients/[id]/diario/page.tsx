import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import DiarioClient from './DiarioClient'

export default async function DiarioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: patient } = await supabase
    .from('patients')
    .select('id, name')
    .eq('id', id)
    .eq('nutritionist_id', user!.id)
    .single()

  if (!patient) notFound()

  // Últimos 14 días
  const since = new Date()
  since.setDate(since.getDate() - 13)
  const isoSince = since.toISOString().slice(0, 10)

  const [{ data: entries }, { data: tokens }] = await Promise.all([
    supabase
      .from('food_diary_entries')
      .select('id, entry_date, meal_kind, content, amount_ml, mood_rating')
      .eq('patient_id', id)
      .eq('nutritionist_id', user!.id)
      .gte('entry_date', isoSince)
      .order('entry_date', { ascending: false }),
    supabase
      .from('patient_access_tokens')
      .select('token, expires_at, revoked_at, last_used_at, created_at')
      .eq('patient_id', id)
      .eq('nutritionist_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  return (
    <DiarioClient
      patientId={id}
      patientName={patient.name}
      entries={entries ?? []}
      tokens={tokens ?? []}
    />
  )
}
