import { createClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: doctor } = await supabase
    .from('doctors')
    .select('*')
    .eq('id', user!.id)
    .single()

  return <SettingsClient doctor={doctor} />
}
