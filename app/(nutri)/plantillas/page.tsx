import { createClient } from '@/lib/supabase/server'
import PlantillasClient from './PlantillasClient'

export default async function PlantillasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: templates } = await supabase
    .from('meal_plan_templates')
    .select('id, name, summary, instructions, structure, daily_kcal, daily_protein_g, created_at, updated_at')
    .eq('nutritionist_id', user!.id)
    .order('updated_at', { ascending: false })

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <PlantillasClient templates={templates ?? []} nutritionistId={user!.id} />
    </div>
  )
}
