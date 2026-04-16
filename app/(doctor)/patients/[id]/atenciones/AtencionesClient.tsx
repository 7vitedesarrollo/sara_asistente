'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import DOMPurify from 'isomorphic-dompurify'

type Visit = {
  id: string
  date: string
  notes: string | null
  diagnosis: string | null
  next_visit: string | null
  created_at: string
}

type Props = {
  visits: Visit[]
  patientId: string
  doctorId: string
}

export default function AtencionesClient({ visits: initial, patientId, doctorId }: Props) {
  const supabase = createClient()
  const [visits, setVisits] = useState<Visit[]>(initial)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)

  function handleToggle(id: string) {
    setExpandedId(prev => prev === id ? null : id)
  }

  async function handleNewVisit(visitData: Partial<Visit>) {
    const newVisit: Visit = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      notes: visitData.notes ?? null,
      diagnosis: visitData.diagnosis ?? null,
      next_visit: visitData.next_visit ?? null,
      created_at: new Date().toISOString(),
    }

    // Optimistic update
    setVisits(prev => [newVisit, ...prev])
    setShowNewForm(false)

    const { error, data } = await supabase
      .from('visits')
      .insert({
        patient_id: patientId,
        doctor_id: doctorId,
        notes: newVisit.notes,
        diagnosis: newVisit.diagnosis,
        next_visit: newVisit.next_visit,
      })
      .select()
      .single()

    if (error) {
      toast.error('Error al guardar la atención. Reintentar →')
      setVisits(prev => prev.filter(v => v.id !== newVisit.id))
    } else {
      // Replace temp ID with real one
      setVisits(prev => prev.map(v => v.id === newVisit.id ? { ...v, id: data.id } : v))
      toast.success('Atención guardada ✓')
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
          onSave={handleNewVisit}
          onCancel={() => setShowNewForm(false)}
        />
      )}

      {/* Lista de atenciones */}
      {visits.length === 0 && !showNewForm && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm">Sin atenciones registradas.</p>
        </div>
      )}

      {visits.map(visit => (
        <VisitCard
          key={visit.id}
          visit={visit}
          expanded={expandedId === visit.id}
          onToggle={() => handleToggle(visit.id)}
          patientId={patientId}
          doctorId={doctorId}
          onUpdated={(updated) => setVisits(prev => prev.map(v => v.id === updated.id ? updated : v))}
        />
      ))}
    </div>
  )
}

// ─── VisitCard ────────────────────────────────────────────────────────────────

function VisitCard({
  visit,
  expanded,
  onToggle,
  patientId,
  doctorId,
  onUpdated,
}: {
  visit: Visit
  expanded: boolean
  onToggle: () => void
  patientId: string
  doctorId: string
  onUpdated: (v: Visit) => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (expanded && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [expanded])

  const date = new Date(visit.date).toLocaleDateString('es', {
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
          {visit.diagnosis && (
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{visit.diagnosis}</p>
          )}
        </div>
        <span className="text-gray-400 text-lg">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <EditVisitForm
          visit={visit}
          patientId={patientId}
          doctorId={doctorId}
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
  onSave: (data: Partial<Visit>) => void
  onCancel: () => void
}) {
  const [notes, setNotes] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [nextVisit, setNextVisit] = useState('')

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
        <label className="block text-xs font-medium text-gray-600 mb-1">Diagnóstico</label>
        <input
          type="text"
          value={diagnosis}
          onChange={e => setDiagnosis(e.target.value)}
          placeholder="Ej: Apendicitis aguda"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Próxima cita</label>
        <input
          type="date"
          value={nextVisit}
          onChange={e => setNextVisit(e.target.value)}
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
          onClick={() => onSave({ notes, diagnosis, next_visit: nextVisit || null })}
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
  visit,
  patientId,
  doctorId,
  onClose,
  onSaved,
}: {
  visit: Visit
  patientId: string
  doctorId: string
  onClose: () => void
  onSaved: (v: Visit) => void
}) {
  const supabase = createClient()
  const [notes, setNotes] = useState(visit.notes ?? '')
  const [diagnosis, setDiagnosis] = useState(visit.diagnosis ?? '')
  const [nextVisit, setNextVisit] = useState(visit.next_visit ?? '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)

  async function handleSave() {
    setSaving(true)
    setSaveError(false)

    // Sanitize before save
    const cleanNotes = DOMPurify.sanitize(notes)
    const cleanDiagnosis = DOMPurify.sanitize(diagnosis)

    const { error } = await supabase
      .from('visits')
      .update({
        notes: cleanNotes,
        diagnosis: cleanDiagnosis,
        next_visit: nextVisit || null,
      })
      .eq('id', visit.id)
      .eq('doctor_id', doctorId) // double-check ownership

    if (error) {
      setSaveError(true)
    } else {
      onSaved({ ...visit, notes: cleanNotes, diagnosis: cleanDiagnosis, next_visit: nextVisit || null })
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
        <label className="block text-xs font-medium text-gray-600 mb-1">Diagnóstico</label>
        <input
          type="text"
          value={diagnosis}
          onChange={e => setDiagnosis(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Próxima cita</label>
        <input
          type="date"
          value={nextVisit}
          onChange={e => setNextVisit(e.target.value)}
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
