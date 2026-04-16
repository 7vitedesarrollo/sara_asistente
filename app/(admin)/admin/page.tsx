import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: totalDoctors },
    { count: totalPatients },
    { count: totalVisits },
    { data: recentDoctors },
  ] = await Promise.all([
    supabase.from('doctors').select('*', { count: 'exact', head: true }).eq('role', 'doctor'),
    supabase.from('patients').select('*', { count: 'exact', head: true }),
    supabase.from('visits').select('*', { count: 'exact', head: true }),
    supabase.from('doctors')
      .select('id, name, email, specialty, created_at')
      .eq('role', 'doctor')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const stats = [
    { label: 'Médicos registrados', value: totalDoctors ?? 0, icon: '👨‍⚕️' },
    { label: 'Pacientes totales', value: totalPatients ?? 0, icon: '👤' },
    { label: 'Atenciones totales', value: totalVisits ?? 0, icon: '📋' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Panel de administración</h1>
      <p className="text-sm text-gray-400 mb-8">Vista global de la plataforma sara</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-5">
            <p className="text-3xl mb-1">{s.icon}</p>
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-semibold text-gray-800 text-sm">Médicos recientes</h2>
          <a href="/admin/doctors" className="text-xs text-blue-600 hover:underline">Ver todos →</a>
        </div>
        {(recentDoctors ?? []).length === 0 ? (
          <p className="px-5 py-8 text-sm text-gray-400 text-center">Sin médicos registrados aún.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-400">Nombre</th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-400">Especialidad</th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-400">Registrado</th>
              </tr>
            </thead>
            <tbody>
              {(recentDoctors ?? []).map(d => (
                <tr key={d.id} className="border-t border-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{d.name}</p>
                    <p className="text-xs text-gray-400">{d.email}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{d.specialty ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
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
