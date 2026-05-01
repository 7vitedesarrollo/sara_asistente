import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js'

// Helper compartido para validar tokens de portal del paciente y operar
// con service-role en endpoints públicos (sin sesión Supabase).

export type TokenContext = {
  token: string
  patientId: string
  patientName: string
  nutritionistId: string
  nutritionistName: string
}

export function getServiceClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) return null
  return createServiceClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })
}

export async function validateToken(token: string): Promise<TokenContext | null> {
  if (!token || token.length < 16) return null
  const supabase = getServiceClient()
  if (!supabase) return null

  const { data: row } = await supabase
    .from('patient_access_tokens')
    .select(`
      token,
      patient_id,
      nutritionist_id,
      expires_at,
      revoked_at,
      patient:patients ( name ),
      nutritionist:nutritionists ( name )
    `)
    .eq('token', token)
    .maybeSingle()

  if (!row) return null
  if (row.revoked_at) return null
  if (row.expires_at && new Date(row.expires_at) < new Date()) return null

  // Touch last_used_at (fire-and-forget)
  supabase
    .from('patient_access_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('token', token)
    .then(() => {}, () => {})

  const patient = Array.isArray(row.patient) ? row.patient[0] : row.patient
  const nutri = Array.isArray(row.nutritionist) ? row.nutritionist[0] : row.nutritionist

  if (!patient || !nutri) return null

  return {
    token: row.token,
    patientId: row.patient_id,
    patientName: patient.name,
    nutritionistId: row.nutritionist_id,
    nutritionistName: nutri.name,
  }
}

export function generateTokenString(): string {
  // ~48 chars URL-safe: UUID (32 hex) + 16 random bytes (32 hex) = 64 chars hex
  const uuid = crypto.randomUUID().replaceAll('-', '')
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  const extra = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  return uuid + extra
}
