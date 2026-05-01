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
    .eq('nutritionist_id', user!.id)  // RLS refuerzo explícito
    .single()

  if (!patient) notFound()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      {/* Header del paciente */}
      <div className="mb-6">
        <a
          href="/dashboard"
          className="text-sm text-graphite-subtle hover:text-graphite-muted flex items-center gap-1 mb-3"
        >
          ← Volver
        </a>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="font-display text-2xl sm:text-3xl text-graphite">{patient.name}</h1>
          <span className="text-sm text-graphite-subtle font-mono">
            {[patient.age ? `${patient.age} años` : null, patient.sex].filter(Boolean).join(' · ')}
          </span>
        </div>
        {patient.phone && (
          <p className="text-sm text-graphite-subtle mt-0.5 font-mono">{patient.phone}</p>
        )}
      </div>

      {/* Tabs */}
      <PatientTabs patientId={id} />

      {/* Contenido */}
      <div className="mt-6">{children}</div>
    </div>
  )
}
