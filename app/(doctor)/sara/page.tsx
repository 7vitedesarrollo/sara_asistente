import { createClient } from '@/lib/supabase/server'
import SaraClient from './SaraClient'

export default async function SaraPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: patients } = await supabase
    .from('patients')
    .select('id, name')
    .eq('doctor_id', user!.id)
    .order('name')

  return <SaraClient patients={patients ?? []} doctorId={user!.id} />
}
