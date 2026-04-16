import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DoctorNav from '@/components/DoctorNav'

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: doctor } = await supabase
    .from('doctors')
    .select('name, specialty')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <DoctorNav doctorName={doctor?.name ?? 'Doctor'} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
