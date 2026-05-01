import { NextRequest, NextResponse } from 'next/server'
import DOMPurify from 'isomorphic-dompurify'
import { validateToken, getServiceClient } from '@/lib/portal'

const VALID_KINDS = ['breakfast', 'snack_am', 'lunch', 'snack_pm', 'dinner', 'water', 'mood'] as const

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const ctx = await validateToken(token)
  if (!ctx) return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 })

  const body = await req.json()
  const meal_kind = body.meal_kind
  if (!VALID_KINDS.includes(meal_kind)) {
    return NextResponse.json({ error: 'meal_kind inválido' }, { status: 400 })
  }

  const supabase = getServiceClient()
  if (!supabase) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })

  const today = new Date().toISOString().slice(0, 10)
  const content = body.content != null ? DOMPurify.sanitize(String(body.content)).slice(0, 4000) : null
  const amount_ml = typeof body.amount_ml === 'number' && body.amount_ml >= 0 && body.amount_ml < 100000
    ? Math.round(body.amount_ml)
    : null
  const mood_rating = typeof body.mood_rating === 'number' && body.mood_rating >= 1 && body.mood_rating <= 5
    ? body.mood_rating
    : null

  const { error } = await supabase
    .from('food_diary_entries')
    .upsert({
      patient_id: ctx.patientId,
      nutritionist_id: ctx.nutritionistId,
      entry_date: today,
      meal_kind,
      content,
      amount_ml,
      mood_rating,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'patient_id,entry_date,meal_kind' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
