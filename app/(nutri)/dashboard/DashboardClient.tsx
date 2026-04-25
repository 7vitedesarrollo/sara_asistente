'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import NewPatientDrawer from '@/components/NewPatientDrawer'

type Patient = {
  id: string
  name: string
  age: number | null
  sex: string | null
  phone: string | null
}

type Appointment = {
  id: string
  datetime: string
  reason: string | null
  status: string
  patient: Patient | null
}

type Props = {
  todayAppointments: Appointment[]
  allPatients: (Patient & { created_at: string })[]
  nutritionistId: string
}

export default function DashboardClient({ todayAppointments, allPatients, nutritionistId }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [showDrawer, setShowDrawer] = useState(false)

  const pending = todayAppointments.filter(a => a.status === 'programada')
  const attended = todayAppointments.filter(a => a.status === 'atendida')

  // Búsqueda filtra todos los pacientes
  const searchResults = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return allPatients.filter(p => p.name.toLowerCase().includes(q))
  }, [search, allPatients])

  const handlePatientClick = useCallback((patientId: string) => {
    router.push(`/patients/${patientId}/consultas`)
  }, [router])

  const today = new Date().toLocaleDateString('es', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Buscador */}
      <div className="relative mb-8">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-graphite-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar paciente por nombre…"
          className="w-full pl-10 pr-4 py-2.5 bg-cream-raised border border-border-strong rounded-md text-sm text-graphite placeholder:text-graphite-subtle focus:outline-none focus:border-sage focus:ring-[3px] focus:ring-sage-bg transition-all"
          autoFocus
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-graphite-subtle hover:text-graphite text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Resultados de búsqueda */}
      {search.trim() && (
        <div className="mb-8 bg-cream-raised rounded-md border border-border overflow-hidden">
          {searchResults.length === 0 ? (
            <p className="px-4 py-6 text-sm text-graphite-subtle text-center">
              Sin resultados para &ldquo;{search}&rdquo;
            </p>
          ) : (
            <ul>
              {searchResults.map(p => (
                <li key={p.id}>
                  <button
                    onClick={() => handlePatientClick(p.id)}
                    className="w-full px-4 py-3 text-left hover:bg-cream-sunken transition-colors border-b border-border last:border-0"
                  >
                    <span className="font-medium text-sm text-graphite">{p.name}</span>
                    <span className="text-xs text-graphite-subtle ml-2 font-mono">
                      {p.age ? `${p.age} años` : ''} {p.sex ?? ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Header del día */}
      {!search.trim() && (
        <>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="font-display text-3xl text-graphite capitalize leading-tight">{today}</h2>
              <p className="text-sm text-graphite-muted mt-1">
                {todayAppointments.length === 0
                  ? 'Sin consultas agendadas hoy'
                  : `${todayAppointments.length} consulta${todayAppointments.length > 1 ? 's' : ''} hoy`}
              </p>
            </div>
            <button
              onClick={() => setShowDrawer(true)}
              className="flex items-center gap-1.5 bg-sage text-white text-sm px-4 py-2 rounded-md hover:bg-[#3D6A4A] transition-colors font-medium"
            >
              <span className="text-base leading-none">+</span>
              Nuevo paciente
            </button>
          </div>

          {/* Pendientes */}
          {pending.length > 0 && (
            <section className="mb-6">
              <h3 className="text-[11px] font-mono font-medium text-graphite-subtle uppercase tracking-widest mb-3">
                Pendientes · {pending.length}
              </h3>
              <ul className="space-y-2">
                {pending.map(a => (
                  <AppointmentCard
                    key={a.id}
                    appointment={a}
                    onClick={() => a.patient && handlePatientClick(a.patient.id)}
                  />
                ))}
              </ul>
            </section>
          )}

          {/* Atendidos */}
          {attended.length > 0 && (
            <section className="mb-6">
              <h3 className="text-[11px] font-mono font-medium text-graphite-subtle uppercase tracking-widest mb-3">
                Atendidos · {attended.length}
              </h3>
              <ul className="space-y-2 opacity-60">
                {attended.map(a => (
                  <AppointmentCard
                    key={a.id}
                    appointment={a}
                    onClick={() => a.patient && handlePatientClick(a.patient.id)}
                    done
                  />
                ))}
              </ul>
            </section>
          )}

          {/* Estado vacío */}
          {todayAppointments.length === 0 && (
            <div className="text-center py-20 border border-dashed border-border rounded-lg">
              <p className="font-display italic text-2xl text-graphite-muted">
                Día tranquilo.
              </p>
              <p className="text-sm text-graphite-subtle mt-2">
                Sin consultas agendadas para hoy.
              </p>
              <button
                onClick={() => setShowDrawer(true)}
                className="mt-4 text-sm text-sage font-medium hover:underline"
              >
                Agregar paciente
              </button>
            </div>
          )}
        </>
      )}

      {/* Drawer nuevo paciente */}
      <NewPatientDrawer
        open={showDrawer}
        onClose={() => setShowDrawer(false)}
        nutritionistId={nutritionistId}
        onCreated={() => {
          setShowDrawer(false)
          router.refresh()
        }}
      />
    </div>
  )
}

function AppointmentCard({
  appointment,
  onClick,
  done = false,
}: {
  appointment: Appointment
  onClick: () => void
  done?: boolean
}) {
  const time = new Date(appointment.datetime).toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <li>
      <button
        onClick={onClick}
        className="w-full bg-cream-raised border border-border rounded-md px-4 py-3 text-left hover:border-sage hover:shadow-sm transition-all"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className={`font-display text-lg ${done ? 'line-through text-graphite-subtle' : 'text-graphite'}`}>
              {appointment.patient?.name ?? 'Paciente'}
            </p>
            {appointment.reason && (
              <p className="text-xs text-graphite-muted mt-0.5 truncate">{appointment.reason}</p>
            )}
          </div>
          <span className="text-xs text-graphite-muted font-mono shrink-0">{time}</span>
        </div>
      </button>
    </li>
  )
}
