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
    supabase.from('patients').select('*', { count: 'exact', head: true }).eq('nutritionist_id', user!.id),
    supabase.from('patients').select('*', { count: 'exact', head: true }).eq('nutritionist_id', user!.id).gte('created_at', startOfMonth),
    supabase.from('consultations').select('*', { count: 'exact', head: true }).eq('nutritionist_id', user!.id).gte('created_at', startOfMonth),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('nutritionist_id', user!.id).gte('created_at', startOfMonth),
  ])

  const month = now.toLocaleDateString('es', { month: 'long', year: 'numeric' })

  const stats = [
    { label: 'Pacientes totales', value: totalPatients ?? 0, icon: '👤' },
    { label: `Pacientes nuevos (${month})`, value: thisMonthPatients ?? 0, icon: '✨' },
    { label: `Consultas (${month})`, value: thisMonthVisits ?? 0, icon: '📋' },
    { label: `Citas (${month})`, value: thisMonthAppointments ?? 0, icon: '📅' },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="font-display text-3xl text-graphite mb-6">Métricas</h1>

      <div className="grid grid-cols-2 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-cream-raised border border-border rounded-xl p-5">
            <p className="text-3xl mb-1">{s.icon}</p>
            <p className="font-display text-4xl text-graphite">{s.value}</p>
            <p className="text-xs text-graphite-subtle mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-graphite-subtle text-center mt-8">
        Métricas adicionales (gráficos, tendencias) disponibles en próximas versiones.
      </p>
    </div>
  )
}
