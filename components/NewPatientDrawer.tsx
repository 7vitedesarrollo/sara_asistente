'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type Props = {
  open: boolean
  onClose: () => void
  nutritionistId: string
  onCreated: () => void
}

export default function NewPatientDrawer({ open, onClose, nutritionistId, onCreated }: Props) {
  const supabase = createClient()
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [sex, setSex] = useState<'M' | 'F' | 'otro' | ''>('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset al abrir
  useEffect(() => {
    if (open) {
      setName('')
      setAge('')
      setSex('')
      setPhone('')
      setErrors({})
    }
  }, [open])

  // Cerrar con Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function validate() {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'El nombre es obligatorio'
    if (age && (isNaN(Number(age)) || Number(age) < 0 || Number(age) > 120)) {
      errs.age = 'Edad debe ser entre 0 y 120'
    }
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setLoading(true)
    const { error } = await supabase.from('patients').insert({
      nutritionist_id: nutritionistId,
      name: name.trim(),
      age: age ? Number(age) : null,
      sex: sex || null,
      phone: phone.trim() || null,
    })

    if (error) {
      toast.error('Error al crear paciente. Intenta de nuevo.')
    } else {
      toast.success('Paciente creado')
      onCreated()
    }
    setLoading(false)
  }

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 h-full w-full max-w-sm bg-cream-raised shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-graphite">Nuevo paciente</h2>
          <button
            onClick={onClose}
            className="text-graphite-subtle hover:text-graphite-muted text-2xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-graphite-muted mb-1">
              Nombre <span className="text-terracotta">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })) }}
              placeholder="Nombre completo"
              autoFocus
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-[3px] focus:ring-sage-bg ${
                errors.name ? 'border-red-400' : 'border-border-strong'
              }`}
            />
            {errors.name && <p className="text-terracotta text-xs mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-graphite-muted mb-1">Edad</label>
              <input
                type="number"
                value={age}
                onChange={e => { setAge(e.target.value); setErrors(prev => ({ ...prev, age: '' })) }}
                placeholder="años"
                min={0}
                max={120}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-[3px] focus:ring-sage-bg ${
                  errors.age ? 'border-red-400' : 'border-border-strong'
                }`}
              />
              {errors.age && <p className="text-terracotta text-xs mt-1">{errors.age}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-graphite-muted mb-1">Sexo</label>
              <select
                value={sex}
                onChange={e => setSex(e.target.value as typeof sex)}
                className="w-full px-3 py-2 border border-border-strong rounded-lg text-sm focus:outline-none focus:ring-[3px] focus:ring-sage-bg bg-cream-raised"
              >
                <option value="">—</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-graphite-muted mb-1">Teléfono</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+593 999 000 000"
              className="w-full px-3 py-2 border border-border-strong rounded-lg text-sm focus:outline-none focus:ring-[3px] focus:ring-sage-bg"
            />
          </div>
        </form>

        <div className="px-6 py-4 border-t border-border flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border border-border rounded-lg text-sm text-graphite-muted hover:bg-cream-sunken transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit as never}
            disabled={loading}
            className="flex-1 py-2 bg-sage text-white rounded-lg text-sm font-medium hover:bg-[#3D6A4A] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Guardando...' : 'Crear paciente'}
          </button>
        </div>
      </aside>
    </>
  )
}
