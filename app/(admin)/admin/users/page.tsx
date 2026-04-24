import { createClient } from '@/lib/supabase/server'
import UsersClient from './UsersClient'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('nutritionists')
    .select('id, name, email, role, specialization, created_at')
    .order('created_at', { ascending: false })

  return <UsersClient users={users ?? []} />
}
