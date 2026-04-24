'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type Order = { id: string; requested_labs: string; notes: string | null; created_at: string }

type Props = { orders: Order[]; patientId: string; nutritionistId: string }

export default function LabReferencesClient({ orders: initial, patientId, nutritionistId }: Props) {
  const supabase = createClient()
  const [list, setList] = useState<Order[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [requested_labs, setExams] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!requested_labs.trim()) return
    setSaving(true)

    const temp: Order = {
      id: crypto.randomUUID(),
      requested_labs,
      notes: notes || null,
      created_at: new Date().toISOString(),
    }
    setList(prev => [temp, ...prev])
    setShowForm(false)
    setExams('')
    setNotes('')

    const { error, data } = await supabase
      .from('lab_references')
      .insert({ patient_id: patientId, nutritionist_id: nutritionistId, requested_labs, notes: notes || null })
      .select()
      .single()

    if (error) {
      toast.error('Error al guardar la orden. Reintentar →')
      setList(prev => prev.filter(o => o.id !== temp.id))
    } else {
      setList(prev => prev.map(o => o.id === temp.id ? { ...o, id: data.id } : o))
      toast.success('Orden guardada ✓')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
        >
          + Nueva orden de examen
        </button>
      ) : (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-blue-800">Nueva orden de examen</h3>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Exámenes solicitados</label>
            <textarea
              value={requested_labs}
              onChange={e => setExams(e.target.value)}
              placeholder="BHC, química sanguínea&#10;Rx de tórax PA y lateral&#10;ECG"
              rows={4}
              autoFocus
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Indicaciones</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="En ayunas, acudir a laboratorio antes del martes"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-white">Cancelar</button>
            <button onClick={handleSave} disabled={saving || !requested_labs.trim()} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar orden'}
            </button>
          </div>
        </div>
      )}

      {list.length === 0 && !showForm && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">🔬</p>
          <p className="text-sm">Sin órdenes de examen.</p>
        </div>
      )}

      {list.map(o => (
        <div key={o.id} className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-2">
            {new Date(o.created_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <pre className="text-sm text-gray-900 whitespace-pre-wrap font-mono">{o.requested_labs}</pre>
          {o.notes && <p className="text-xs text-gray-500 mt-2 italic">{o.notes}</p>}
        </div>
      ))}
    </div>
  )
}
