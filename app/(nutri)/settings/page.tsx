import { createClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: nutritionist } = await supabase
    .from('nutritionists')
    .select('*')
    .eq('id', user!.id)
    .single()

  return <SettingsClient nutritionist={nutritionist} />
}
