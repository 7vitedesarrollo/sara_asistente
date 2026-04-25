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
      <h1 className="font-display text-3xl text-graphite mb-6">Nutricionistas</h1>

      {(nutritionists ?? []).length === 0 ? (
        <div className="bg-cream-raised border border-border rounded-xl p-12 text-center text-graphite-subtle">
          <p className="text-sm">Sin médicos registrados aún.</p>
          <p className="text-xs mt-1">Se agregan automáticamente cuando un médico se registra.</p>
        </div>
      ) : (
        <div className="bg-cream-raised border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-sunken">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-graphite-subtle">Nutricionista</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-graphite-subtle">Especialidad</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-graphite-subtle">Pacientes</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-graphite-subtle">Registrado</th>
              </tr>
            </thead>
            <tbody>
              {(nutritionists ?? []).map(d => {
                const patientCount = Array.isArray(d.patients)
                  ? (d.patients[0] as { count: number } | undefined)?.count ?? 0
                  : 0
                return (
                  <tr key={d.id} className="border-t border-gray-50 hover:bg-cream-sunken">
                    <td className="px-5 py-3">
                      <p className="font-medium text-graphite">{d.name}</p>
                      <p className="text-xs text-graphite-subtle">{d.email}</p>
                    </td>
                    <td className="px-5 py-3 text-graphite-muted">{d .specialization?? '—'}</td>
                    <td className="px-5 py-3 text-graphite-muted font-medium">{patientCount}</td>
                    <td className="px-5 py-3 text-graphite-subtle text-xs">
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
