import { createClient } from '@/lib/supabase/server'

export default async function AdminDoctorsPage() {
  const supabase = await createClient()

  const { data: nutritionists } = await supabase
    .from('nutritionists')
    .select(`
      id, name, email, specialization, phone, created_at,
      patients:patients(count)
    `)
    .eq("role", "nutritionist")
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nutricionistas</h1>

      {(nutritionists ?? []).length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center text-gray-400">
          <p className="text-3xl mb-2">👨‍⚕️</p>
          <p className="text-sm">Sin médicos registrados aún.</p>
          <p className="text-xs mt-1">Se agregan automáticamente cuando un médico se registra.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">Nutricionista</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">Especialidad</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">Pacientes</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">Registrado</th>
              </tr>
            </thead>
            <tbody>
              {(nutritionists ?? []).map(d => {
                const patientCount = Array.isArray(d.patients)
                  ? (d.patients[0] as { count: number } | undefined)?.count ?? 0
                  : 0
                return (
                  <tr key={d.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{d.name}</p>
                      <p className="text-xs text-gray-400">{d.email}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{d .specialization?? '—'}</td>
                    <td className="px-5 py-3 text-gray-700 font-medium">{patientCount}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {new Date(d.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
