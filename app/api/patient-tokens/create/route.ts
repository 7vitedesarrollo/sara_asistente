import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateTokenString } from '@/lib/portal'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const patientId = body.patientId
  const days = typeof body.days === 'number' && body.days > 0 && body.days <= 365 ? body.days : 90

  if (!patientId || typeof patientId !== 'string') {
    return NextResponse.json({ error: 'patientId required' }, { status: 400 })
  }

  // RLS verifica que el paciente pertenece al nutricionista
  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('id', patientId)
    .single()

  if (!patient) return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + days)

  const token = generateTokenString()

  const { error } = await supabase
    .from('patient_access_tokens')
    .insert({
      token,
      patient_id: patientId,
      nutritionist_id: user.id,
      expires_at: expiresAt.toISOString(),
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    token,
    url: `/portal/${token}`,
    expires_at: expiresAt.toISOString(),
  })
}
