'use client'

import { useState, useRef, useEffect } from 'react'

type Message = { role: 'user' | 'assistant'; content: string }
type Patient = { id: string; name: string }

export default function SaraClient({ patients, nutritionistId }: { patients: Patient[]; nutritionistId: string }) {
  const [selectedPatient, setSelectedPatient] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || loading) return

    const userMsg: Message = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/sara', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          patientId: selectedPatient || null,
          history: messages,
        }),
      })

      if (!res.ok) throw new Error('Error en la respuesta')

      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error al conectar con Sara. Verifica tu configuración de API.',
      }])
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-6 pb-4 border-b border-border">
        <div>
          <h1 className="font-display text-3xl text-graphite leading-none">Sara <em className="italic text-sage">IA</em></h1>
          <p className="text-xs text-graphite-subtle mt-1.5 font-mono uppercase tracking-widest">Asistente nutricional</p>
        </div>
        <select
          value={selectedPatient}
          onChange={e => setSelectedPatient(e.target.value)}
          className="sm:ml-auto text-sm border border-border-strong rounded-md px-3 py-2 bg-cream-raised text-graphite focus:outline-none focus:border-sage focus:ring-[3px] focus:ring-sage-bg"
        >
          <option value="">Consulta general</option>
          {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <p className="font-display italic text-2xl text-graphite-muted">
              Sara está lista para ayudarte.
            </p>
            <p className="text-sm text-graphite-subtle mt-3 max-w-sm mx-auto">
              Puedes preguntar sobre cálculo de gasto energético, ajustes de macronutrientes, estrategias dietéticas o el historial de un paciente.
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
              m.role === 'user'
                ? 'bg-sage text-white rounded-br-sm'
                : 'bg-cream-raised border border-border text-graphite rounded-bl-sm'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-cream-raised border border-border rounded-xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Escribe tu pregunta…"
          disabled={loading}
          className="flex-1 px-4 py-2.5 bg-cream-raised border border-border-strong rounded-md text-sm text-graphite placeholder:text-graphite-subtle focus:outline-none focus:border-sage focus:ring-[3px] focus:ring-sage-bg disabled:opacity-50 transition-all"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 bg-sage text-white rounded-md text-sm font-medium hover:bg-[#3D6A4A] disabled:opacity-50 transition-colors"
        >
          Enviar
        </button>
      </div>
    </div>
  )
}
