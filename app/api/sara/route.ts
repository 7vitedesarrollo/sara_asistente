import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import DOMPurify from 'isomorphic-dompurify'

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

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

  let patientContext = ''
  if (patientId) {
    const { data: patient } = await supabase
      .from('patients')
      .select('name, age, sex, notes, height_cm, activity_level, dietary_restrictions, allergies, initial_goal')
      .eq('id', patientId)
      .eq('nutritionist_id', user.id)
      .single()

    const { data: consultations } = await supabase
      .from('consultations')
      .select('date, notes, objective, next_consultation')
      .eq('patient_id', patientId)
      .eq('nutritionist_id', user.id)
      .order('date', { ascending: false })
      .limit(5)

    const { data: measurements } = await supabase
      .from('measurements')
      .select('measured_at, weight_kg, body_fat_pct, waist_cm, bmi')
      .eq('patient_id', patientId)
      .eq('nutritionist_id', user.id)
      .order('measured_at', { ascending: false })
      .limit(5)

    if (patient) {
      patientContext = `
Paciente: ${patient.name}, ${patient.age ?? '?'} años, sexo: ${patient.sex ?? 'no especificado'}, estatura: ${patient.height_cm ?? '?'} cm
Nivel de actividad: ${patient.activity_level ?? 'no registrado'}
Objetivo inicial: ${patient.initial_goal ?? 'no registrado'}
Restricciones: ${patient.dietary_restrictions ?? 'ninguna'} | Alergias: ${patient.allergies ?? 'ninguna'}
Notas generales: ${patient.notes ?? 'ninguna'}

Últimas mediciones:
${measurements?.map(m => `- ${new Date(m.measured_at).toLocaleDateString('es')}: ${m.weight_kg ?? '?'} kg, ${m.body_fat_pct ?? '?'}% grasa, IMC ${m.bmi ?? '?'}, cintura ${m.waist_cm ?? '?'} cm`).join('\n') ?? 'sin registro'}

Últimas consultas:
${consultations?.map(c => `- ${new Date(c.date).toLocaleDateString('es')}: ${c.objective ?? 'sin objetivo registrado'} | ${c.notes?.slice(0, 200) ?? 'sin notas'}`).join('\n') ?? 'ninguna'}
`
    }
  }

  const systemPrompt = `Eres Sara, una asistente de IA para nutricionistas clínicos individuales en Latinoamérica.
Ayudas con interpretación de mediciones antropométricas, composición de planes alimentarios, ajustes de macronutrientes según objetivo (reducción, mantenimiento, aumento de masa magra), y gestión de pacientes.
Conoces RDA/DRI, métodos de cálculo de gasto energético (Mifflin-St Jeor, Harris-Benedict, Katch-McArdle), estrategias dietéticas (mediterránea, baja en carbohidratos, DASH, FODMAP, cetogénica cuando es clínicamente apropiada), manejo nutricional de diabetes tipo 2, dislipidemia, embarazo, deporte y patologías digestivas.
No das diagnósticos médicos ni prescribes fármacos. Si detectas señales clínicas (dolor, síntomas agudos, banderas rojas) recomiendas derivación al médico tratante.
Eres concisa, precisa y recuerdas al nutricionista que tus respuestas son orientativas y no reemplazan su criterio profesional.
Responde siempre en español.
${patientContext ? `\nContexto del paciente:\n${patientContext}` : ''}`

  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey || apiKey === 'your-openrouter-key-here') {
    return NextResponse.json({
      reply: 'Sara IA requiere configurar OPENROUTER_API_KEY en las variables de entorno.',
    })
  }

  const history: ChatMessage[] = (body.history ?? [])
    .filter((m: ChatMessage) => m.role === 'user' || m.role === 'assistant')
    .slice(-6)

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://sara-asistente.local',
        'X-Title': 'Sara Asistente',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3.1',
        max_tokens: 1024,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: message },
        ],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({
        reply: `Error del proveedor: ${data.error?.message ?? 'respuesta inesperada'}`,
      })
    }

    const reply = data.choices?.[0]?.message?.content ?? 'Sin respuesta.'
    return NextResponse.json({ reply })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
