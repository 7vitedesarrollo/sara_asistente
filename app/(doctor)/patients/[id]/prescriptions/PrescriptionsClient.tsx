'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type Rx = { id: string; medications: string; instructions: string | null; created_at: string }

type Props = { prescriptions: Rx[]; patientId: string; doctorId: string }

export default function PrescriptionsClient({ prescriptions: initial, patientId, doctorId }: Props) {
  const supabase = createClient()
  const [list, setList] = useState<Rx[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [medications, setMedications] = useState('')
  const [instructions, setInstructions] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!medications.trim()) return
    setSaving(true)

    const temp: Rx = {
      id: crypto.randomUUID(),
      medications,
      instructions: instructions || null,
      created_at: new Date().toISOString(),
    }
    setList(prev => [temp, ...prev])
    setShowForm(false)
    setMedications('')
    setInstructions('')

    const { error, data } = await supabase
      .from('prescriptions')
      .insert({ patient_id: patientId, doctor_id: doctorId, medications, instructions: instructions || null })
      .select()
      .single()

    if (error) {
      toast.error('Error al guardar la receta. Reintentar →')
      setList(prev => prev.filter(r => r.id !== temp.id))
    } else {
      setList(prev => prev.map(r => r.id === temp.id ? { ...r, id: data.id } : r))
      toast.success('Receta guardada ✓')
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
          + Nueva receta
        </button>
      ) : (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-blue-800">Nueva receta</h3>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Medicamentos</label>
            <textarea
              value={medications}
              onChange={e => setMedications(e.target.value)}
              placeholder="Amoxicilina 500mg c/8h x 7 días&#10;Ibuprofeno 400mg c/12h x 5 días"
              rows={4}
              autoFocus
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Instrucciones adicionales</label>
            <input
              type="text"
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="Tomar con alimentos, no en ayunas"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-white">Cancelar</button>
            <button onClick={handleSave} disabled={saving || !medications.trim()} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar receta'}
            </button>
          </div>
        </div>
      )}

      {list.length === 0 && !showForm && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">💊</p>
          <p className="text-sm">Sin recetas registradas.</p>
        </div>
      )}

      {list.map(rx => (
        <div key={rx.id} className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-2">
            {new Date(rx.created_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <pre className="text-sm text-gray-900 whitespace-pre-wrap font-mono">{rx.medications}</pre>
          {rx.instructions && <p className="text-xs text-gray-500 mt-2 italic">{rx.instructions}</p>}
        </div>
      ))}
    </div>
  )
}
