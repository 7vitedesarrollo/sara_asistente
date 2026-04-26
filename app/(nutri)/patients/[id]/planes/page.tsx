import { createClient } from '@/lib/supabase/server'
import PlanesClient from './PlanesClient'

export default async function PlanesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: mealPlans }, { data: templates }] = await Promise.all([
    supabase
      .from('meal_plans')
      .select('id, summary, instructions, structure, daily_kcal, daily_protein_g, start_date, end_date, created_at')
      .eq('patient_id', id)
      .eq('nutritionist_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('meal_plan_templates')
      .select('id, name, summary, instructions, structure, daily_kcal, daily_protein_g')
      .eq('nutritionist_id', user!.id)
      .order('updated_at', { ascending: false }),
  ])

  return (
    <PlanesClient
      mealPlans={mealPlans ?? []}
      templates={templates ?? []}
      patientId={id}
      nutritionistId={user!.id}
    />
  )
}
