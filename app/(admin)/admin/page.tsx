import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: totalDoctors },
    { count: totalPatients },
    { count: totalVisits },
    { data: recentDoctors },
  ] = await Promise.all([
    supabase.from('nutritionists').select('*', { count: 'exact', head: true }).eq("role", "nutritionist"),
    supabase.from('patients').select('*', { count: 'exact', head: true }),
    supabase.from('consultations').select('*', { count: 'exact', head: true }),
    supabase.from('nutritionists')
      .select('id, name, email, specialization, created_at')
      .eq("role", "nutritionist")
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const stats = [
    { label: 'Médicos registrados', value: totalDoctors ?? 0, icon: '👨‍⚕️' },
    { label: 'Pacientes totales', value: totalPatients ?? 0, icon: '👤' },
    { label: 'Consultas totales', value: totalVisits ?? 0, icon: '📋' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="font-display text-3xl text-graphite mb-2">Panel de administración</h1>
      <p className="text-sm text-graphite-subtle mb-8">Vista global de la plataforma sara</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-cream-raised border border-border rounded-xl p-5">
            <p className="text-3xl mb-1">{s.icon}</p>
            <p className="font-display text-4xl text-graphite">{s.value}</p>
            <p className="text-xs text-graphite-subtle mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-cream-raised border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex justify-between items-center">
          <h2 className="font-semibold text-graphite text-sm">Médicos recientes</h2>
          <a href="/admin/nutricionistas" className="text-xs text-sage hover:underline">Ver todos →</a>
        </div>
        {(recentDoctors ?? []).length === 0 ? (
          <p className="px-5 py-8 text-sm text-graphite-subtle text-center">Sin médicos registrados aún.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-cream-sunken">
              <tr>
                <th className="px-5 py-2 text-left text-xs font-medium text-graphite-subtle">Nombre</th>
                <th className="px-5 py-2 text-left text-xs font-medium text-graphite-subtle">Especialidad</th>
                <th className="px-5 py-2 text-left text-xs font-medium text-graphite-subtle">Registrado</th>
              </tr>
            </thead>
            <tbody>
              {(recentDoctors ?? []).map(d => (
                <tr key={d.id} className="border-t border-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-graphite">{d.name}</p>
                    <p className="text-xs text-graphite-subtle">{d.email}</p>
                  </td>
                  <td className="px-5 py-3 text-graphite-muted">{d .specialization?? '—'}</td>
                  <td className="px-5 py-3 text-graphite-subtle text-xs">
                    {new Date(d.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
