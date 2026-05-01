import { notFound } from 'next/navigation'
import { validateToken, getServiceClient } from '@/lib/portal'
import PortalClient from './PortalClient'

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const ctx = await validateToken(token)
  if (!ctx) notFound()

  // Fetch entries de los últimos 7 días para el paciente
  const supabase = getServiceClient()
  if (!supabase) notFound()

  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - 6)
  const isoStart = startDate.toISOString().slice(0, 10)

  const { data: entries } = await supabase
    .from('food_diary_entries')
    .select('id, entry_date, meal_kind, content, amount_ml, mood_rating')
    .eq('patient_id', ctx.patientId)
    .gte('entry_date', isoStart)
    .order('entry_date', { ascending: false })

  return (
    <PortalClient
      token={ctx.token}
      patientName={ctx.patientName}
      nutritionistName={ctx.nutritionistName}
      entries={entries ?? []}
    />
  )
}
