'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type Appointment = {
  id: string
  datetime: string
  reason: string | null
  status: string
  patient: { id: string; name: string; age: number | null } | null
}

type Props = {
  appointments: Appointment[]
  patients: { id: string; name: string }[]
  nutritionistId: string
}

export default function AppointmentsClient({ appointments: initial, patients, nutritionistId }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [list, setList] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [patientId, setPatientId] = useState('')
  const [datetime, setDatetime] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!patientId || !datetime) return
    setSaving(true)

    const { error, data } = await supabase
      .from('appointments')
      .insert({ patient_id: patientId, nutritionist_id: nutritionistId, datetime, reason: reason || null })
      .select(`id, datetime, reason, status, patient:patients(id, name, age)`)
      .single()

    if (error) {
      toast.error('Error al agendar la cita.')
    } else {
      const normalized: Appointment = {
        ...data,
        patient: Array.isArray(data.patient) ? (data.patient[0] ?? null) : data.patient,
      }
      setList(prev => [...prev, normalized].sort((a, b) => a.datetime.localeCompare(b.datetime)))
      setShowForm(false)
      setPatientId('')
      setDatetime('')
      setReason('')
      toast.success('Cita agendada ✓')
    }
    setSaving(false)
  }

  async function markAttended(id: string) {
    const { error } = await supabase.from('appointments').update({ status: 'atendida' }).eq('id', id)
    if (!error) {
      setList(prev => prev.map(a => a.id === id ? { ...a, status: 'atendida' } : a))
      router.refresh()
    }
  }

  const grouped = list.reduce<Record<string, Appointment[]>>((acc, a) => {
    const day = new Date(a.datetime).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
    if (!acc[day]) acc[day] = []
    acc[day].push(a)
    return acc
  }, {})

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Agenda</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Nueva cita
        </button>
      </div>

      {showForm && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3 mb-6">
          <h3 className="text-sm font-semibold text-blue-800">Agendar cita</h3>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Paciente</label>
            <select value={patientId} onChange={e => setPatientId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Seleccionar paciente...</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha y hora</label>
            <input type="datetime-local" value={datetime} onChange={e => setDatetime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Motivo</label>
            <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="Consulta de seguimiento"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-white">Cancelar</button>
            <button onClick={handleSave} disabled={saving || !patientId || !datetime}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Agendando...' : 'Agendar cita'}
            </button>
          </div>
        </div>
      )}

      {list.length === 0 && !showForm && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-sm">Sin citas próximas.</p>
        </div>
      )}

      {Object.entries(grouped).map(([day, appts]) => (
        <section key={day} className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 capitalize">{day}</h3>
          <ul className="space-y-2">
            {appts.map(a => (
              <li key={a.id} className={`bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between ${a.status === 'atendida' ? 'opacity-50' : ''}`}>
                <div>
                  <p className={`text-sm font-medium ${a.status === 'atendida' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {a.patient?.name ?? 'Paciente'}
                  </p>
                  {a.reason && <p className="text-xs text-gray-400">{a.reason}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-mono">
                    {new Date(a.datetime).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {a.status === 'programada' && (
                    <button onClick={() => markAttended(a.id)}
                      className="text-xs text-blue-600 hover:underline whitespace-nowrap">
                      Marcar atendido
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
