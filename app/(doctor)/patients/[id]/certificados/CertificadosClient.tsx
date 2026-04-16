'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import DOMPurify from 'isomorphic-dompurify'

type Cert = { id: string; content: string; issued_at: string }

type Props = {
  certs: Cert[]
  patientId: string
  doctorId: string
  doctorName: string
  doctorSpecialty: string
}

export default function CertificadosClient({ certs: initial, patientId, doctorId, doctorName, doctorSpecialty }: Props) {
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
      .from('medical_certificates')
      .insert({ patient_id: patientId, doctor_id: doctorId, content: clean })
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
          className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
        >
          + Nuevo certificado médico
        </button>
      ) : (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-blue-800">Certificado médico</h3>
          <p className="text-xs text-gray-500">Dr. {doctorName} {doctorSpecialty ? `· ${doctorSpecialty}` : ''}</p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Contenido del certificado</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Certifico que el/la paciente... se encuentra... y se le indica reposo por..."
              rows={6}
              autoFocus
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-white">Cancelar</button>
            <button onClick={handleSave} disabled={saving || !content.trim()} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar certificado'}
            </button>
          </div>
        </div>
      )}

      {list.length === 0 && !showForm && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">📄</p>
          <p className="text-sm">Sin certificados emitidos.</p>
        </div>
      )}

      {list.map(cert => (
        <div key={cert.id} className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-2">
            Emitido el {new Date(cert.issued_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{cert.content}</p>
          <p className="text-xs text-gray-400 mt-3">— Dr. {doctorName}</p>
        </div>
      ))}
    </div>
  )
}
