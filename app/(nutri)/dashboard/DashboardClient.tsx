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
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Buscador — elemento #1 */}
      <div className="relative mb-6">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar paciente por nombre..."
          className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
          autoFocus
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Resultados de búsqueda */}
      {search.trim() && (
        <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {searchResults.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">
              Sin resultados para &ldquo;{search}&rdquo;
            </p>
          ) : (
            <ul>
              {searchResults.map(p => (
                <li key={p.id}>
                  <button
                    onClick={() => handlePatientClick(p.id)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                  >
                    <span className="font-medium text-sm text-gray-900">{p.name}</span>
                    <span className="text-xs text-gray-400 ml-2">
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 capitalize">{today}</h2>
              <p className="text-sm text-gray-400">
                {todayAppointments.length === 0
                  ? 'Sin citas hoy'
                  : `${todayAppointments.length} cita${todayAppointments.length > 1 ? 's' : ''}`}
              </p>
            </div>
            <button
              onClick={() => setShowDrawer(true)}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <span className="text-base leading-none">+</span>
              Nuevo paciente
            </button>
          </div>

          {/* Pendientes */}
          {pending.length > 0 && (
            <section className="mb-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
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
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
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
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-sm">No hay pacientes registrados hoy.</p>
              <button
                onClick={() => setShowDrawer(true)}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                + Agregar paciente
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
        className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-left hover:border-blue-200 hover:shadow-sm transition-all"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-medium text-sm ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
              {appointment.patient?.name ?? 'Paciente'}
            </p>
            {appointment.reason && (
              <p className="text-xs text-gray-400 mt-0.5">{appointment.reason}</p>
            )}
          </div>
          <span className="text-xs text-gray-400 font-mono">{time}</span>
        </div>
      </button>
    </li>
  )
}
