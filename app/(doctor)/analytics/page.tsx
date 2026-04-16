import { createClient } from '@/lib/supabase/server'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

  const [
    { count: totalPatients },
    { count: thisMonthPatients },
    { count: thisMonthVisits },
    { count: thisMonthAppointments },
  ] = await Promise.all([
    supabase.from('patients').select('*', { count: 'exact', head: true }).eq('doctor_id', user!.id),
    supabase.from('patients').select('*', { count: 'exact', head: true }).eq('doctor_id', user!.id).gte('created_at', startOfMonth),
    supabase.from('visits').select('*', { count: 'exact', head: true }).eq('doctor_id', user!.id).gte('created_at', startOfMonth),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('doctor_id', user!.id).gte('created_at', startOfMonth),
  ])

  const month = now.toLocaleDateString('es', { month: 'long', year: 'numeric' })

  const stats = [
    { label: 'Pacientes totales', value: totalPatients ?? 0, icon: '👤' },
    { label: `Pacientes nuevos (${month})`, value: thisMonthPatients ?? 0, icon: '✨' },
    { label: `Atenciones (${month})`, value: thisMonthVisits ?? 0, icon: '📋' },
    { label: `Citas (${month})`, value: thisMonthAppointments ?? 0, icon: '📅' },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Métricas</h1>

      <div className="grid grid-cols-2 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-5">
            <p className="text-3xl mb-1">{s.icon}</p>
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-300 text-center mt-8">
        Métricas adicionales (gráficos, tendencias) disponibles en próximas versiones.
      </p>
    </div>
  )
}
