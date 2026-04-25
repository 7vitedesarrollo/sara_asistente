'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type Patient = {
  id: string
  name: string
  age: number | null
  sex: string | null
  phone: string | null
  email: string | null
  notes: string | null
}

export default function FichaClient({ patient: initial, nutritionistId }: { patient: Patient; nutritionistId: string }) {
  const supabase = createClient()
  const [p, setP] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState(initial)

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase
      .from('patients')
      .update({
        name: draft.name,
        age: draft.age,
        sex: draft.sex,
        phone: draft.phone,
        email: draft.email,
        notes: draft.notes,
      })
      .eq('id', p.id)

    if (error) {
      toast.error('Error al guardar')
    } else {
      setP(draft)
      setEditing(false)
      toast.success('Ficha actualizada ✓')
    }
    setSaving(false)
  }

  const Field = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div>
      <p className="text-xs text-graphite-subtle mb-0.5">{label}</p>
      <p className="text-sm text-graphite">{value || '—'}</p>
    </div>
  )

  if (!editing) {
    return (
      <div className="bg-cream-raised border border-border rounded-xl p-5 space-y-4">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-graphite">Datos del paciente</h3>
          <button
            onClick={() => { setDraft(p); setEditing(true) }}
            className="text-sm text-sage hover:underline"
          >
            Editar
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre" value={p.name} />
          <Field label="Edad" value={p.age ? `${p.age} años` : null} />
          <Field label="Sexo" value={p.sex} />
          <Field label="Teléfono" value={p.phone} />
          <Field label="Correo" value={p.email} />
        </div>
        {p.notes && (
          <div>
            <p className="text-xs text-graphite-subtle mb-0.5">Notas</p>
            <p className="text-sm text-graphite-muted whitespace-pre-wrap">{p.notes}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-cream-raised border border-border rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-graphite">Editar ficha</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-graphite-muted mb-1">Nombre</label>
          <input
            type="text"
            value={draft.name}
            onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-[3px] focus:ring-sage-bg"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-graphite-muted mb-1">Edad</label>
          <input
            type="number"
            value={draft.age ?? ''}
            onChange={e => setDraft(d => ({ ...d, age: e.target.value ? Number(e.target.value) : null }))}
            min={0} max={120}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-[3px] focus:ring-sage-bg"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-graphite-muted mb-1">Sexo</label>
          <select
            value={draft.sex ?? ''}
            onChange={e => setDraft(d => ({ ...d, sex: e.target.value || null }))}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-[3px] focus:ring-sage-bg bg-cream-raised"
          >
            <option value="">—</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-graphite-muted mb-1">Teléfono</label>
          <input
            type="tel"
            value={draft.phone ?? ''}
            onChange={e => setDraft(d => ({ ...d, phone: e.target.value || null }))}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-[3px] focus:ring-sage-bg"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-graphite-muted mb-1">Correo</label>
          <input
            type="email"
            value={draft.email ?? ''}
            onChange={e => setDraft(d => ({ ...d, email: e.target.value || null }))}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-[3px] focus:ring-sage-bg"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-graphite-muted mb-1">Notas generales</label>
          <textarea
            value={draft.notes ?? ''}
            onChange={e => setDraft(d => ({ ...d, notes: e.target.value || null }))}
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-[3px] focus:ring-sage-bg resize-none"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => setEditing(false)}
          className="px-4 py-2 border border-border rounded-lg text-sm text-graphite-muted hover:bg-cream-sunken"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2 bg-sage text-white rounded-lg text-sm font-medium hover:bg-[#3D6A4A] disabled:opacity-50 transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
