import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NutriShell from '@/components/NutriShell'

export default async function NutriLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: nutritionist } = await supabase
    .from('nutritionists')
    .select('name')
    .eq('id', user.id)
    .single()

  return (
    <NutriShell nutritionistName={nutritionist?.name ?? 'Nutricionista'}>
      {children}
    </NutriShell>
  )
}
