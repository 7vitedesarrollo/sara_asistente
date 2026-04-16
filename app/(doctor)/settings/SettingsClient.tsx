'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type Doctor = {
  id: string
  name: string
  email: string
  specialty: string | null
  phone: string | null
}

export default function SettingsClient({ doctor: initial }: { doctor: Doctor | null }) {
  const supabase = createClient()
  const [d, setD] = useState(initial)
  const [saving, setSaving] = useState(false)

  if (!d) return <div className="max-w-lg mx-auto px-4 py-6 text-gray-400 text-sm">No se encontró el perfil.</div>

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('doctors')
      .update({ name: d!.name, specialty: d!.specialty, phone: d!.phone })
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
      <h1 className="text-xl font-bold text-gray-900 mb-6">Configuración</h1>

      <form onSubmit={handleSave} className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-gray-800 text-sm">Perfil del médico</h2>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nombre completo</label>
          <input
            type="text"
            value={d.name}
            onChange={e => setD(prev => prev ? { ...prev, name: e.target.value } : prev)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Correo electrónico</label>
          <input
            type="email"
            value={d.email}
            disabled
            className="w-full px-3 py-2 border border-gray-100 rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Especialidad</label>
          <input
            type="text"
            value={d.specialty ?? ''}
            onChange={e => setD(prev => prev ? { ...prev, specialty: e.target.value || null } : prev)}
            placeholder="Cirugía General, Medicina Interna..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
          <input
            type="tel"
            value={d.phone ?? ''}
            onChange={e => setD(prev => prev ? { ...prev, phone: e.target.value || null } : prev)}
            placeholder="+593 999 000 000"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}
