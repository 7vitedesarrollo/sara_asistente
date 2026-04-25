'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type Nutritionist = {
  id: string
  name: string
  email: string
  specialization: string | null
  phone: string | null
}

export default function SettingsClient({ nutritionist: initial }: { nutritionist: Nutritionist | null }) {
  const supabase = createClient()
  const [d, setD] = useState(initial)
  const [saving, setSaving] = useState(false)

  if (!d) return <div className="max-w-lg mx-auto px-4 py-6 text-graphite-subtle text-sm">No se encontró el perfil.</div>

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('nutritionists')
      .update({ name: d!.name, specialization: d!.specialization, phone: d!.phone })
      .eq('id', d!.id)

    if (error) {
      toast.error('Error al guardar')
    } else {
      toast.success('Perfil actualizado ✓')
    }
    setSaving(false)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="font-display text-3xl text-graphite mb-6">Configuración</h1>

      <form onSubmit={handleSave} className="bg-cream-raised border border-border rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-graphite text-sm">Perfil del médico</h2>

        <div>
          <label className="block text-xs font-medium text-graphite-muted mb-1">Nombre completo</label>
          <input
            type="text"
            value={d.name}
            onChange={e => setD(prev => prev ? { ...prev, name: e.target.value } : prev)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-[3px] focus:ring-sage-bg"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-graphite-muted mb-1">Correo electrónico</label>
          <input
            type="email"
            value={d.email}
            disabled
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-cream-sunken text-graphite-subtle cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-graphite-muted mb-1">Especialidad</label>
          <input
            type="text"
            value={d .specialization?? ''}
            onChange={e => setD(prev => prev ? { ...prev, specialization: e.target.value || null } : prev)}
            placeholder="Cirugía General, Medicina Interna..."
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-[3px] focus:ring-sage-bg"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-graphite-muted mb-1">Teléfono</label>
          <input
            type="tel"
            value={d.phone ?? ''}
            onChange={e => setD(prev => prev ? { ...prev, phone: e.target.value || null } : prev)}
            placeholder="+593 999 000 000"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-[3px] focus:ring-sage-bg"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2 bg-sage text-white rounded-lg text-sm font-medium hover:bg-[#3D6A4A] disabled:opacity-50 transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}
