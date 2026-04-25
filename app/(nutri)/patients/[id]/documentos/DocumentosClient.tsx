'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import DOMPurify from 'isomorphic-dompurify'

type Cert = { id: string; content: string; issued_at: string }

type Props = {
  certs: Cert[]
  patientId: string
  nutritionistId: string
  nutritionistName: string
  nutritionistSpecialization: string
}

export default function DocumentosClient({ certs: initial, patientId, nutritionistId, nutritionistName, nutritionistSpecialization }: Props) {
  const supabase = createClient()
  const [list, setList] = useState<Cert[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!content.trim()) return
    setSaving(true)

    const clean = DOMPurify.sanitize(content)
    const temp: Cert = {
      id: crypto.randomUUID(),
      content: clean,
      issued_at: new Date().toISOString(),
    }
    setList(prev => [temp, ...prev])
    setShowForm(false)
    setContent('')

    const { error, data } = await supabase
      .from('certificates')
      .insert({ patient_id: patientId, nutritionist_id: nutritionistId, content: clean })
      .select()
      .single()

    if (error) {
      toast.error('Error al guardar el certificado. Reintentar →')
      setList(prev => prev.filter(c => c.id !== temp.id))
    } else {
      setList(prev => prev.map(c => c.id === temp.id ? { ...c, id: data.id } : c))
      toast.success('Certificado guardado ✓')
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
          + Nuevo certificado médico
        </button>
      ) : (
        <div className="bg-sage-bg border border-blue-100 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-blue-800">Certificado</h3>
          <p className="text-xs text-graphite-muted">Lic. {nutritionistName} {nutritionistSpecialization ? `· ${nutritionistSpecialization}` : ''}</p>
          <div>
            <label className="block text-xs font-medium text-graphite-muted mb-1">Contenido del certificado</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Certifico que el/la paciente... se encuentra... y se le indica reposo por..."
              rows={6}
              autoFocus
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-[3px] focus:ring-sage-bg resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg text-sm text-graphite-muted hover:bg-cream-raised">Cancelar</button>
            <button onClick={handleSave} disabled={saving || !content.trim()} className="flex-1 py-2 bg-sage text-white rounded-lg text-sm font-medium hover:bg-[#3D6A4A] disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar certificado'}
            </button>
          </div>
        </div>
      )}

      {list.length === 0 && !showForm && (
        <div className="text-center py-12 text-graphite-subtle">
          <p className="font-display italic text-2xl text-graphite-muted">Sin documentos emitidos.</p>
        </div>
      )}

      {list.map(cert => (
        <div key={cert.id} className="bg-cream-raised border border-border rounded-xl p-4">
          <p className="text-xs text-graphite-subtle mb-2">
            Emitido el {new Date(cert.issued_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <p className="text-sm text-graphite whitespace-pre-wrap">{cert.content}</p>
          <p className="text-xs text-graphite-subtle mt-3">— Lic. {nutritionistName}</p>
        </div>
      ))}
    </div>
  )
}
