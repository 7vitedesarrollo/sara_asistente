import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PatientTabs from '@/components/PatientTabs'

export default async function PatientLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: patient } = await supabase
    .from('patients')
    .select('id, name, age, sex, phone')
    .eq('id', id)
    .eq('doctor_id', user!.id)  // RLS refuerzo explícito
    .single()

  if (!patient) notFound()

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header del paciente */}
      <div className="mb-6">
        <a
          href="/dashboard"
          className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-3"
        >
          ← Volver
        </a>
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-bold text-gray-900">{patient.name}</h1>
          <span className="text-sm text-gray-400">
            {[patient.age ? `${patient.age} años` : null, patient.sex].filter(Boolean).join(' · ')}
          </span>
        </div>
        {patient.phone && (
          <p className="text-sm text-gray-400 mt-0.5">{patient.phone}</p>
        )}
      </div>

      {/* Tabs */}
      <PatientTabs patientId={id} />

      {/* Contenido */}
      <div className="mt-6">{children}</div>
    </div>
  )
}
