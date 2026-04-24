import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NutriNav from '@/components/NutriNav'

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: nutritionist } = await supabase
    .from('nutritionists')
    .select('name, specialization')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <NutriNav nutritionistName={nutritionist?.name ?? 'Doctor'} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
