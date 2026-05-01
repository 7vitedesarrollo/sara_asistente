'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'

type MealKind = 'breakfast' | 'snack_am' | 'lunch' | 'snack_pm' | 'dinner' | 'water' | 'mood'

type Entry = {
  id: string
  entry_date: string
  meal_kind: MealKind
  content: string | null
  amount_ml: number | null
  mood_rating: number | null
}

type AccessToken = {
  token: string
  expires_at: string | null
  revoked_at: string | null
  last_used_at: string | null
  created_at: string
}

const MEAL_COLUMNS: { key: MealKind; label: string }[] = [
  { key: 'breakfast', label: 'Desayuno' },
  { key: 'snack_am', label: 'Med. mañ.' },
  { key: 'lunch', label: 'Almuerzo' },
  { key: 'snack_pm', label: 'Merienda' },
  { key: 'dinner', label: 'Cena' },
]

export default function DiarioClient({
  patientId,
  patientName,
  entries: initialEntries,
  tokens: initialTokens,
}: {
  patientId: string
  patientName: string
  entries: Entry[]
  tokens: AccessToken[]
}) {
  const [tokens, setTokens] = useState<AccessToken[]>(initialTokens)
  const [generatingLink, setGeneratingLink] = useState(false)

  const activeToken = useMemo(() => {
    return tokens.find(t => !t.revoked_at && (!t.expires_at || new Date(t.expires_at) > new Date()))
  }, [tokens])

  // Group entries by date for grid
  const dayMap = useMemo(() => {
    const map = new Map<string, Map<MealKind, Entry>>()
    for (const e of initialEntries) {
      const day = map.get(e.entry_date) ?? new Map<MealKind, Entry>()
      day.set(e.meal_kind, e)
      map.set(e.entry_date, day)
    }
    return map
  }, [initialEntries])

  // 14 días, hoy primero
  const days: string[] = useMemo(() => {
    const arr: string[] = []
    const today = new Date()
    for (let i = 0; i < 14; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      arr.push(d.toISOString().slice(0, 10))
    }
    return arr
  }, [])

  async function generateLink() {
    setGeneratingLink(true)
    try {
      const res = await fetch('/api/patient-tokens/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, days: 90 }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'No se pudo generar')
      } else {
        setTokens(prev => [{
          token: data.token,
          expires_at: data.expires_at,
          revoked_at: null,
          last_used_at: null,
          created_at: new Date().toISOString(),
        }, ...prev])
        toast.success('Enlace generado · cópialo y envíaselo al paciente')
      }
    } catch {
      toast.error('Error de red')
    }
    setGeneratingLink(false)
  }

  async function revokeToken(token: string) {
    if (!confirm('¿Revocar el enlace? El paciente perderá acceso al portal.')) return
    const res = await fetch('/api/patient-tokens/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    if (res.ok) {
      setTokens(prev => prev.map(t => t.token === token ? { ...t, revoked_at: new Date().toISOString() } : t))
      toast.success('Enlace revocado')
    } else {
      toast.error('No se pudo revocar')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between pb-2">
        <div>
          <h2 className="font-display text-2xl text-graphite leading-tight">Diario alimentario</h2>
          <p className="text-sm text-graphite-muted mt-1">
            Lo que <em>{patientName.split(' ')[0]}</em> ha registrado en los últimos 14 días.
          </p>
        </div>
      </div>

      {/* Token / enlace para paciente */}
      <TokenCard
        activeToken={activeToken}
        patientName={patientName}
        onGenerate={generateLink}
        onRevoke={revokeToken}
        generating={generatingLink}
      />

      {/* Grid de 14 días */}
      <DiaryGrid days={days} dayMap={dayMap} />
    </div>
  )
}

// ─── TokenCard ───────────────────────────────────────────────────────────

function TokenCard({
  activeToken,
  patientName,
  onGenerate,
  onRevoke,
  generating,
}: {
  activeToken: AccessToken | undefined
  patientName: string
  onGenerate: () => void
  onRevoke: (token: string) => void
  generating: boolean
}) {
  const [copied, setCopied] = useState(false)

  if (!activeToken) {
    return (
      <div className="bg-cream-raised border border-border rounded-lg p-5">
        <p className="font-display text-lg text-graphite mb-1">Aún no enviaste el enlace</p>
        <p className="text-sm text-graphite-muted mb-4">
          Genera un enlace privado de 90 días para que el paciente registre sus comidas, hidratación y ánimo desde su celular.
        </p>
        <button
          onClick={onGenerate}
          disabled={generating}
          className="bg-sage text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-[#3D6A4A] disabled:opacity-50 transition-colors"
        >
          {generating ? 'Generando…' : 'Generar enlace para el paciente'}
        </button>
      </div>
    )
  }

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/portal/${activeToken.token}`
    : `/portal/${activeToken.token}`
  const expires = activeToken.expires_at
    ? new Date(activeToken.expires_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'sin caducidad'
  const lastUsed = activeToken.last_used_at
    ? new Date(activeToken.last_used_at).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : 'aún no'

  function copy() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Enlace copiado')
    setTimeout(() => setCopied(false), 2000)
  }

  const waMessage = encodeURIComponent(
    `Hola ${patientName.split(' ')[0]}, este es tu enlace privado para registrar tu diario nutricional: ${url}`,
  )

  return (
    <div className="bg-sage-bg border border-sage-light rounded-lg p-5 space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="font-display text-lg text-graphite">Enlace activo del paciente</p>
        <span className="text-[11px] font-mono text-graphite-subtle uppercase tracking-widest">
          Caduca {expires} · usado {lastUsed}
        </span>
      </div>
      <div className="bg-cream-raised border border-border rounded-md p-3 font-mono text-xs text-graphite break-all select-all">
        {url}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={copy}
          className="text-sm font-medium px-4 py-2 rounded-md bg-sage text-white hover:bg-[#3D6A4A] transition-colors"
        >
          {copied ? 'Copiado ✓' : 'Copiar enlace'}
        </button>
        <a
          href={`https://wa.me/?text=${waMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium px-4 py-2 rounded-md bg-cream-raised border border-border-strong text-graphite hover:bg-cream-sunken transition-colors"
        >
          Compartir por WhatsApp
        </a>
        <button
          onClick={() => onRevoke(activeToken.token)}
          className="text-sm px-3 py-2 rounded-md text-terracotta hover:bg-[#F6E6E0] transition-colors ml-auto"
        >
          Revocar enlace
        </button>
      </div>
    </div>
  )
}

// ─── DiaryGrid ───────────────────────────────────────────────────────────

function DiaryGrid({
  days,
  dayMap,
}: {
  days: string[]
  dayMap: Map<string, Map<MealKind, Entry>>
}) {
  // Stats summary
  const stats = useMemo(() => {
    let totalMealsLogged = 0
    let totalDaysWithLog = 0
    let totalWaterMl = 0
    let totalMoodCount = 0
    let totalMoodSum = 0
    for (const day of dayMap.values()) {
      let logged = false
      for (const meal of day.values()) {
        if (['breakfast', 'snack_am', 'lunch', 'snack_pm', 'dinner'].includes(meal.meal_kind) && meal.content) {
          totalMealsLogged++
          logged = true
        }
        if (meal.meal_kind === 'water' && meal.amount_ml) totalWaterMl += meal.amount_ml
        if (meal.meal_kind === 'mood' && meal.mood_rating) {
          totalMoodSum += meal.mood_rating
          totalMoodCount++
        }
      }
      if (logged) totalDaysWithLog++
    }
    return {
      adherenceDays: totalDaysWithLog,
      avgWaterDay: totalDaysWithLog > 0 ? Math.round(totalWaterMl / totalDaysWithLog) : 0,
      avgMood: totalMoodCount > 0 ? (totalMoodSum / totalMoodCount).toFixed(1) : null,
      totalMeals: totalMealsLogged,
    }
  }, [dayMap])

  if (dayMap.size === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-border rounded-lg">
        <p className="font-display italic text-2xl text-graphite-muted">
          El paciente aún no registra entradas.
        </p>
        <p className="text-sm text-graphite-subtle mt-2">
          Comparte el enlace con él/ella para que empiece a llevar su diario.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Días con registro" value={`${stats.adherenceDays}`} unit="/ 14" />
        <Stat label="Comidas registradas" value={`${stats.totalMeals}`} unit="" />
        <Stat label="Agua promedio/día" value={`${stats.avgWaterDay}`} unit="ml" />
        <Stat label="Ánimo promedio" value={stats.avgMood ?? '—'} unit={stats.avgMood ? '/ 5' : ''} />
      </div>

      {/* Grid */}
      <div className="bg-cream-raised border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-cream-sunken border-b border-border">
                <th className="text-left px-4 py-2.5 text-[11px] font-mono text-graphite-subtle uppercase tracking-widest font-medium">Día</th>
                {MEAL_COLUMNS.map(m => (
                  <th key={m.key} className="text-left px-3 py-2.5 text-[11px] font-mono text-graphite-subtle uppercase tracking-widest font-medium">
                    {m.label}
                  </th>
                ))}
                <th className="text-right px-3 py-2.5 text-[11px] font-mono text-graphite-subtle uppercase tracking-widest font-medium">Agua</th>
                <th className="text-right px-3 py-2.5 text-[11px] font-mono text-graphite-subtle uppercase tracking-widest font-medium">Ánimo</th>
              </tr>
            </thead>
            <tbody>
              {days.map((dateStr, idx) => {
                const day = dayMap.get(dateStr)
                const dt = new Date(dateStr + 'T00:00:00')
                const isToday = idx === 0
                const dayLabel = isToday ? 'Hoy' : dt.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })
                return (
                  <tr key={dateStr} className="border-b border-border last:border-0">
                    <td className={`px-4 py-3 align-top font-mono text-xs whitespace-nowrap ${isToday ? 'text-sage font-medium' : 'text-graphite-muted'}`}>
                      {dayLabel}
                    </td>
                    {MEAL_COLUMNS.map(m => {
                      const entry = day?.get(m.key)
                      return (
                        <td key={m.key} className="px-3 py-3 align-top text-xs text-graphite max-w-[200px]" title={entry?.content ?? ''}>
                          {entry?.content
                            ? <span className="line-clamp-2 leading-snug">{entry.content}</span>
                            : <span className="text-graphite-subtle">—</span>}
                        </td>
                      )
                    })}
                    <td className="px-3 py-3 align-top text-xs font-mono text-right">
                      {day?.get('water')?.amount_ml
                        ? <span className="text-graphite">{day.get('water')!.amount_ml}ml</span>
                        : <span className="text-graphite-subtle">—</span>}
                    </td>
                    <td className="px-3 py-3 align-top text-xs font-mono text-right">
                      {day?.get('mood')?.mood_rating
                        ? <span className="text-sage">{day.get('mood')!.mood_rating}/5</span>
                        : <span className="text-graphite-subtle">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-cream-raised border border-border rounded-md p-3">
      <p className="text-[11px] font-mono text-graphite-subtle uppercase tracking-widest">{label}</p>
      <p className="font-display text-2xl text-graphite mt-1 leading-none">
        {value}
        {unit && <span className="text-sm font-sans text-graphite-muted ml-1">{unit}</span>}
      </p>
    </div>
  )
}
