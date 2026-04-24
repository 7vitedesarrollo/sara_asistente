'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import DOMPurify from 'isomorphic-dompurify'

type Consultation = {
  id: string
  date: string
  notes: string | null
  objective: string | null
  next_consultation: string | null
  created_at: string
}

type Props = {
  consultations: Consultation[]
  patientId: string
  nutritionistId: string
}

export default function ConsultasClient({ consultations: initial, patientId, nutritionistId }: Props) {
  const supabase = createClient()
  const [consultations, setConsultations] = useState<Consultation[]>(initial)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)

  function handleToggle(id: string) {
    setExpandedId(prev => prev === id ? null : id)
  }

  async function handleNewConsultation(consultationData: Partial<Consultation>) {
    const newConsultation: Consultation = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      notes: consultationData.notes ?? null,
      objective: consultationData.objective ?? null,
      next_consultation: consultationData.next_consultation ?? null,
      created_at: new Date().toISOString(),
    }

    // Optimistic update
    setConsultations(prev => [newConsultation, ...prev])
    setShowNewForm(false)

    const { error, data } = await supabase
      .from('consultations')
      .insert({
        patient_id: patientId,
        nutritionist_id: nutritionistId,
        notes: newConsultation.notes,
        objective: newConsultation.objective,
        next_consultation: newConsultation.next_consultation,
      })
      .select()
      .single()

    if (error) {
      toast.error('Error al guardar la atención. Reintentar →')
      setConsultations(prev => prev.filter(v => v.id !== newConsultation.id))
    } else {
      // Replace temp ID with real one
      setConsultations(prev => prev.map(v => v.id === newConsultation.id ? { ...v, id: data.id } : v))
      toast.success('Consulta guardada ✓')
    }
  }

  return (
    <div className="space-y-4">
      {/* Nueva atención */}
      {!showNewForm ? (
        <button
          onClick={() => setShowNewForm(true)}
          className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
        >
          + Nueva atención
        </button>
      ) : (
        <VisitForm
          onSave={handleNewConsultation}
          onCancel={() => setShowNewForm(false)}
        />
      )}

      {/* Lista de atenciones */}
      {consultations.length === 0 && !showNewForm && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm">Sin atenciones registradas.</p>
        </div>
      )}

      {consultations.map(consultation => (
        <VisitCard
          key={consultation.id}
          consultation={consultation}
          expanded={expandedId === consultation.id}
          onToggle={() => handleToggle(consultation.id)}
          patientId={patientId}
          nutritionistId={nutritionistId}
          onUpdated={(updated) => setConsultations(prev => prev.map(v => v.id === updated.id ? updated : v))}
        />
      ))}
    </div>
  )
}

// ─── VisitCard ────────────────────────────────────────────────────────────────

function VisitCard({
  consultation,
  expanded,
  onToggle,
  patientId,
  nutritionistId,
  onUpdated,
}: {
  consultation: Consultation
  expanded: boolean
  onToggle: () => void
  patientId: string
  nutritionistId: string
  onUpdated: (c: Consultation) => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (expanded && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [expanded])

  const date = new Date(consultation.date).toLocaleDateString('es', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div ref={cardRef} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div>
          <p className="text-sm font-medium text-gray-900">{date}</p>
          {consultation.objective && (
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{consultation.objective}</p>
          )}
        </div>
        <span className="text-gray-400 text-lg">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <EditVisitForm
          consultation={consultation}
          patientId={patientId}
          nutritionistId={nutritionistId}
          onClose={onToggle}
          onSaved={onUpdated}
        />
      )}
    </div>
  )
}

// ─── VisitForm (nueva atención) ───────────────────────────────────────────────

function VisitForm({
  onSave,
  onCancel,
}: {
  onSave: (data: Partial<Consultation>) => void
  onCancel: () => void
}) {
  const [notes, setNotes] = useState('')
  const [objective, setObjective] = useState('')
  const [nextConsultation, setNextConsultation] = useState('')

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-blue-800">Nueva atención</h3>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Notas clínicas</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Motivo de consulta, examen físico, hallazgos..."
          rows={4}
          autoFocus
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Objetivo de consulta</label>
        <input
          type="text"
          value={objective}
          onChange={e => setObjective(e.target.value)}
          placeholder="Ej: Apendicitis aguda"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Próxima cita</label>
        <input
          type="date"
          value={nextConsultation}
          onChange={e => setNextConsultation(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-white transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={() => onSave({ notes, objective, next_consultation: nextConsultation || null })}
          className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Guardar atención
        </button>
      </div>
    </div>
  )
}

// ─── EditVisitForm (atención existente expandida) ─────────────────────────────

function EditVisitForm({
  consultation,
  patientId,
  nutritionistId,
  onClose,
  onSaved,
}: {
  consultation: Consultation
  patientId: string
  nutritionistId: string
  onClose: () => void
  onSaved: (c: Consultation) => void
}) {
  const supabase = createClient()
  const [notes, setNotes] = useState(consultation.notes ?? '')
  const [objective, setObjective] = useState(consultation.objective ?? '')
  const [nextConsultation, setNextConsultation] = useState(consultation.next_consultation ?? '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)

  async function handleSave() {
    setSaving(true)
    setSaveError(false)

    // Sanitize before save
    const cleanNotes = DOMPurify.sanitize(notes)
    const cleanObjective = DOMPurify.sanitize(objective)

    const { error } = await supabase
      .from('consultations')
      .update({
        notes: cleanNotes,
        objective: cleanObjective,
        next_consultation: nextConsultation || null,
      })
      .eq('id', consultation.id)
      .eq('nutritionist_id', nutritionistId) // double-check ownership

    if (error) {
      setSaveError(true)
    } else {
      onSaved({ ...consultation, notes: cleanNotes, objective: cleanObjective, next_consultation: nextConsultation || null })
      toast.success('Nota guardada ✓')
      onClose()
    }
    setSaving(false)
  }

  return (
    <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Notas clínicas</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={5}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Objetivo de consulta</label>
        <input
          type="text"
          value={objective}
          onChange={e => setObjective(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Próxima cita</label>
        <input
          type="date"
          value={nextConsultation}
          onChange={e => setNextConsultation(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {saveError && (
        <p className="text-red-600 text-xs">
          Error al guardar. <button onClick={handleSave} className="underline">Reintentar →</button>
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cerrar ×
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar nota'}
        </button>
      </div>
    </div>
  )
}
