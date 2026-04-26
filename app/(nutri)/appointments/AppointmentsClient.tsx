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
  patient: { id: string; name: string; age: number | null; email: string | null } | null
  reminder: { status: string; sent_at: string } | null
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
  const [sendingReminder, setSendingReminder] = useState<string | null>(null)

  async function handleSave() {
    if (!patientId || !datetime) return
    setSaving(true)

    const { error, data } = await supabase
      .from('appointments')
      .insert({ patient_id: patientId, nutritionist_id: nutritionistId, datetime, reason: reason || null })
      .select(`id, datetime, reason, status, patient:patients(id, name, age, email)`)
      .single()

    if (error) {
      toast.error('Error al agendar la cita.')
    } else {
      const normalized: Appointment = {
        ...data,
        patient: Array.isArray(data.patient) ? (data.patient[0] ?? null) : data.patient,
        reminder: null,
      }
      setList(prev => [...prev, normalized].sort((a, b) => a.datetime.localeCompare(b.datetime)))
      setShowForm(false)
      setPatientId('')
      setDatetime('')
      setReason('')
      toast.success('Cita agendada')
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

  async function sendReminder(id: string) {
    setSendingReminder(id)
    try {
      const res = await fetch('/api/reminders/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: id }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Error al enviar el recordatorio')
      } else {
        const msg = data.status === 'logged'
          ? 'Recordatorio registrado (modo log: configura RESEND_API_KEY para enviar)'
          : `Recordatorio enviado a ${data.recipient}`
        toast.success(msg)
        setList(prev => prev.map(a => a.id === id
          ? { ...a, reminder: { status: data.status, sent_at: new Date().toISOString() } }
          : a))
      }
    } catch {
      toast.error('Error de red al enviar el recordatorio')
    }
    setSendingReminder(null)
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
        <h1 className="font-display text-3xl text-graphite">Agenda</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-sage text-white text-sm px-4 py-2 rounded-md hover:bg-[#3D6A4A] transition-colors font-medium"
        >
          + Nueva cita
        </button>
      </div>

      {showForm && (
        <div className="bg-cream-raised border border-border rounded-md p-4 space-y-3 mb-6">
          <h3 className="text-sm font-medium text-graphite">Agendar cita</h3>
          <div>
            <label className="block text-xs font-medium text-graphite-muted mb-1">Paciente</label>
            <select value={patientId} onChange={e => setPatientId(e.target.value)}
              className="w-full px-3 py-2 border border-border-strong rounded-md text-sm bg-cream-raised focus:outline-none focus:border-sage focus:ring-[3px] focus:ring-sage-bg">
              <option value="">Seleccionar paciente…</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-graphite-muted mb-1">Fecha y hora</label>
            <input type="datetime-local" value={datetime} onChange={e => setDatetime(e.target.value)}
              className="w-full px-3 py-2 border border-border-strong rounded-md text-sm focus:outline-none focus:border-sage focus:ring-[3px] focus:ring-sage-bg" />
          </div>
          <div>
            <label className="block text-xs font-medium text-graphite-muted mb-1">Motivo</label>
            <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="Consulta de seguimiento"
              className="w-full px-3 py-2 border border-border-strong rounded-md text-sm focus:outline-none focus:border-sage focus:ring-[3px] focus:ring-sage-bg" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-graphite-muted hover:bg-cream-sunken rounded-md">Cancelar</button>
            <button onClick={handleSave} disabled={saving || !patientId || !datetime}
              className="flex-1 py-2 bg-sage text-white rounded-md text-sm font-medium hover:bg-[#3D6A4A] disabled:opacity-50">
              {saving ? 'Agendando…' : 'Agendar cita'}
            </button>
          </div>
        </div>
      )}

      {list.length === 0 && !showForm && (
        <div className="text-center py-16">
          <p className="font-display italic text-2xl text-graphite-muted">Sin citas próximas.</p>
        </div>
      )}

      {Object.entries(grouped).map(([day, appts]) => (
        <section key={day} className="mb-6">
          <h3 className="text-[11px] font-mono font-medium text-graphite-subtle uppercase tracking-widest mb-3 capitalize">{day}</h3>
          <ul className="space-y-2">
            {appts.map(a => {
              const isPast = new Date(a.datetime) < new Date()
              const tomorrow = isAppointmentTomorrow(a.datetime)
              const canSendReminder = !a.reminder && a.patient?.email && a.status === 'programada' && !isPast
              return (
                <li key={a.id} className={`bg-cream-raised border border-border rounded-md px-4 py-3 ${a.status === 'atendida' ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${a.status === 'atendida' ? 'line-through text-graphite-subtle' : 'text-graphite'}`}>
                        {a.patient?.name ?? 'Paciente'}
                      </p>
                      {a.reason && <p className="text-xs text-graphite-muted mt-0.5 truncate">{a.reason}</p>}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-[11px] font-mono text-graphite-subtle">
                          {new Date(a.datetime).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <ReminderBadge reminder={a.reminder} hasEmail={!!a.patient?.email} tomorrow={tomorrow} />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {a.status === 'programada' && (
                        <button onClick={() => markAttended(a.id)}
                          className="text-xs text-sage hover:underline whitespace-nowrap">
                          Marcar atendido
                        </button>
                      )}
                      {canSendReminder && (
                        <button
                          onClick={() => sendReminder(a.id)}
                          disabled={sendingReminder === a.id}
                          className="text-xs text-graphite-muted hover:text-sage disabled:opacity-50 whitespace-nowrap"
                          title="Enviar recordatorio por email al paciente"
                        >
                          {sendingReminder === a.id ? 'Enviando…' : 'Enviar recordatorio'}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

function ReminderBadge({
  reminder,
  hasEmail,
  tomorrow,
}: {
  reminder: { status: string; sent_at: string } | null
  hasEmail: boolean
  tomorrow: boolean
}) {
  if (reminder) {
    if (reminder.status === 'sent') {
      return (
        <span className="text-[10px] font-mono uppercase tracking-widest text-sage bg-sage-bg px-1.5 py-0.5 rounded">
          ✓ Recordado
        </span>
      )
    }
    if (reminder.status === 'logged') {
      return (
        <span className="text-[10px] font-mono uppercase tracking-widest text-graphite-muted bg-cream-sunken px-1.5 py-0.5 rounded" title="Resend no configurado: solo se registró en log">
          Log only
        </span>
      )
    }
    return (
      <span className="text-[10px] font-mono uppercase tracking-widest text-terracotta bg-[#F6E6E0] px-1.5 py-0.5 rounded">
        Falló envío
      </span>
    )
  }
  if (!hasEmail) {
    return (
      <span className="text-[10px] font-mono uppercase tracking-widest text-graphite-subtle" title="Paciente sin correo registrado">
        Sin correo
      </span>
    )
  }
  if (tomorrow) {
    return (
      <span className="text-[10px] font-mono uppercase tracking-widest text-amber bg-[#F8F2DF] px-1.5 py-0.5 rounded">
        Mañana
      </span>
    )
  }
  return null
}

function isAppointmentTomorrow(iso: string): boolean {
  const apptDate = new Date(iso)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return apptDate.toDateString() === tomorrow.toDateString()
}
