import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import DOMPurify from 'isomorphic-dompurify'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const message = DOMPurify.sanitize(String(body.message ?? ''))
  const patientId: string | null = body.patientId ?? null

  if (!message) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 })
  }

  // Obtener historial del paciente si se seleccionó uno
  let patientContext = ''
  if (patientId) {
    const { data: patient } = await supabase
      .from('patients')
      .select('name, age, sex, notes')
      .eq('id', patientId)
      .eq('doctor_id', user.id)
      .single()

    const { data: visits } = await supabase
      .from('visits')
      .select('date, notes, diagnosis, next_visit')
      .eq('patient_id', patientId)
      .eq('doctor_id', user.id)
      .order('date', { ascending: false })
      .limit(5)

    if (patient) {
      patientContext = `
Paciente seleccionado: ${patient.name}, ${patient.age ?? '?'} años, sexo: ${patient.sex ?? 'no especificado'}
Notas generales: ${patient.notes ?? 'ninguna'}

Últimas atenciones:
${visits?.map(v => `- ${new Date(v.date).toLocaleDateString('es')}: ${v.diagnosis ?? 'sin diagnóstico'} | ${v.notes?.slice(0, 200) ?? 'sin notas'}`).join('\n') ?? 'ninguna'}
`
    }
  }

  const systemPrompt = `Eres Sara, una asistente clínica de IA para médicos privados en Latinoamérica.
Ayudas con consultas clínicas, medicamentos, diagnósticos diferenciales y gestión de pacientes.
Eres concisa, precisa y siempre recuerdas al médico que tus respuestas son orientativas y no reemplazan el criterio clínico.
Responde siempre en español.
${patientContext ? `\nContexto del paciente:\n${patientContext}` : ''}`

  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return NextResponse.json({
      reply: 'Sara IA requiere configurar ANTHROPIC_API_KEY en las variables de entorno.',
    })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          ...(body.history ?? []).slice(-6), // últimos 6 mensajes de contexto
          { role: 'user', content: message },
        ],
      }),
    })

    const data = await response.json()
    const reply = data.content?.[0]?.text ?? 'Sin respuesta.'

    return NextResponse.json({ reply })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
