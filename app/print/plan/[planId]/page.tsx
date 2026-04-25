import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import PrintClient from './PrintClient'

export default async function PrintPlanPage({
  params,
}: {
  params: Promise<{ planId: string }>
}) {
  const { planId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: plan } = await supabase
    .from('meal_plans')
    .select('patient_id, summary, instructions, structure, daily_kcal, daily_protein_g, start_date, end_date, created_at')
    .eq('id', planId)
    .eq('nutritionist_id', user.id)
    .single()

  if (!plan) notFound()

  const [{ data: patient }, { data: nutritionist }] = await Promise.all([
    supabase
      .from('patients')
      .select('name, age, sex, height_cm, initial_goal, dietary_restrictions, allergies')
      .eq('id', plan.patient_id)
      .eq('nutritionist_id', user.id)
      .single(),
    supabase
      .from('nutritionists')
      .select('name, specialization, email')
      .eq('id', user.id)
      .single(),
  ])

  if (!patient) notFound()

  return <PrintClient plan={plan} patient={patient} nutritionist={nutritionist} />
}
