'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type MealPlan = { id: string; medications: string; instructions: string | null; created_at: string }

type Props = { mealPlans: MealPlan[]; patientId: string; nutritionistId: string }

export default function PlanesClient({ mealPlans: initial, patientId, nutritionistId }: Props) {
  const supabase = createClient()
  const [list, setList] = useState<MealPlan[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [medications, setMedications] = useState('')
  const [instructions, setInstructions] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!medications.trim()) return
    setSaving(true)

    const temp: MealPlan = {
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
      .from('meal_plans')
      .insert({ patient_id: patientId, nutritionist_id: nutritionistId, medications, instructions: instructions || null })
      .select()
      .single()

    if (error) {
      toast.error('Error al guardar la receta. Reintentar →')
      setList(prev => prev.filter(r => r.id !== temp.id))
    } else {
      setList(prev => prev.map(r => r.id === temp.id ? { ...r, id: data.id } : r))
      toast.success('Plan alimentario guardada ✓')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full border-2 border-dashed border-border rounded-xl py-3 text-sm text-graphite-subtle hover:border-sage hover:text-sage transition-colors"
        >
          + Nueva receta
        </button>
      ) : (
        <div className="bg-sage-bg border border-blue-100 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-blue-800">Nueva receta</h3>
          <div>
            <label className="block text-xs font-medium text-graphite-muted mb-1">Medicamentos</label>
            <textarea
              value={medications}
              onChange={e => setMedications(e.target.value)}
              placeholder="Amoxicilina 500mg c/8h x 7 días&#10;Ibuprofeno 400mg c/12h x 5 días"
              rows={4}
              autoFocus
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-[3px] focus:ring-sage-bg resize-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-graphite-muted mb-1">Instrucciones adicionales</label>
            <input
              type="text"
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="Tomar con alimentos, no en ayunas"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-[3px] focus:ring-sage-bg"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg text-sm text-graphite-muted hover:bg-cream-raised">Cancelar</button>
            <button onClick={handleSave} disabled={saving || !medications.trim()} className="flex-1 py-2 bg-sage text-white rounded-lg text-sm font-medium hover:bg-[#3D6A4A] disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar receta'}
            </button>
          </div>
        </div>
      )}

      {list.length === 0 && !showForm && (
        <div className="text-center py-12 text-graphite-subtle">
          <p className="font-display italic text-2xl text-graphite-muted">Aún sin planes alimentarios.</p>
        </div>
      )}

      {list.map(rx => (
        <div key={rx.id} className="bg-cream-raised border border-border rounded-xl p-4">
          <p className="text-xs text-graphite-subtle mb-2">
            {new Date(rx.created_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <pre className="text-sm text-graphite whitespace-pre-wrap font-mono">{rx.medications}</pre>
          {rx.instructions && <p className="text-xs text-graphite-muted mt-2 italic">{rx.instructions}</p>}
        </div>
      ))}
    </div>
  )
}
