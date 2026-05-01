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

const MEALS: { key: MealKind; label: string; placeholder: string }[] = [
  { key: 'breakfast', label: 'Desayuno', placeholder: '¿Qué desayunaste hoy?' },
  { key: 'snack_am', label: 'Media mañana', placeholder: 'Snack o algo entre desayuno y almuerzo' },
  { key: 'lunch', label: 'Almuerzo', placeholder: '¿Qué almorzaste?' },
  { key: 'snack_pm', label: 'Merienda', placeholder: 'Snack de la tarde' },
  { key: 'dinner', label: 'Cena', placeholder: '¿Qué cenaste?' },
]

const MOOD_OPTIONS = [
  { rating: 1, label: 'Mal' },
  { rating: 2, label: 'Bajo' },
  { rating: 3, label: 'Normal' },
  { rating: 4, label: 'Bien' },
  { rating: 5, label: 'Excelente' },
]

export default function PortalClient({
  token,
  patientName,
  nutritionistName,
  entries: initial,
}: {
  token: string
  patientName: string
  nutritionistName: string
  entries: Entry[]
}) {
  const [entries, setEntries] = useState<Entry[]>(initial)
  const today = new Date().toISOString().slice(0, 10)

  // Index entries by date and meal_kind for quick lookup
  const todayEntries = useMemo(() => {
    const map = new Map<MealKind, Entry>()
    for (const e of entries) {
      if (e.entry_date === today) map.set(e.meal_kind, e)
    }
    return map
  }, [entries, today])

  const todayWaterMl = todayEntries.get('water')?.amount_ml ?? 0
  const todayMood = todayEntries.get('mood')?.mood_rating ?? null

  async function saveEntry(meal_kind: MealKind, payload: { content?: string; amount_ml?: number; mood_rating?: number }) {
    const optimistic: Entry = {
      id: todayEntries.get(meal_kind)?.id ?? crypto.randomUUID(),
      entry_date: today,
      meal_kind,
      content: payload.content ?? null,
      amount_ml: payload.amount_ml ?? null,
      mood_rating: payload.mood_rating ?? null,
    }

    setEntries(prev => {
      const without = prev.filter(e => !(e.entry_date === today && e.meal_kind === meal_kind))
      return [optimistic, ...without]
    })

    try {
      const res = await fetch(`/api/portal/${token}/diary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meal_kind, ...payload }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? 'No se pudo guardar')
      }
    } catch {
      toast.error('Error de red')
    }
  }

  // Historial agrupado por día (excluyendo hoy)
  const historyByDay = useMemo(() => {
    const map = new Map<string, Entry[]>()
    for (const e of entries) {
      if (e.entry_date === today) continue
      const arr = map.get(e.entry_date) ?? []
      arr.push(e)
      map.set(e.entry_date, arr)
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [entries, today])

  const todayLabel = new Date().toLocaleDateString('es', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-md mx-auto px-4 py-8 pb-16">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-grid place-items-center w-7 h-7 bg-sage rounded-md font-display italic text-white text-base leading-none">S</span>
            <span className="font-display text-xl text-graphite">Sara</span>
          </div>
          <h1 className="font-display text-3xl text-graphite leading-tight">
            Hola, <em className="italic text-sage">{patientName.split(' ')[0]}</em>.
          </h1>
          <p className="text-sm text-graphite-muted mt-1.5 capitalize">{todayLabel}</p>
          <p className="text-xs font-mono text-graphite-subtle uppercase tracking-widest mt-3">
            Diario para Lic. {nutritionistName}
          </p>
        </header>

        {/* Comidas */}
        <section className="space-y-3 mb-6">
          <h2 className="text-[11px] font-mono text-graphite-subtle uppercase tracking-widest mb-2">
            Hoy comí
          </h2>
          {MEALS.map(meal => (
            <MealCard
              key={meal.key}
              label={meal.label}
              placeholder={meal.placeholder}
              initial={todayEntries.get(meal.key)?.content ?? ''}
              onSave={(content) => saveEntry(meal.key, { content })}
            />
          ))}
        </section>

        {/* Hidratación */}
        <WaterCard
          totalMl={todayWaterMl}
          onChange={(amount_ml) => saveEntry('water', { amount_ml })}
        />

        {/* Mood */}
        <MoodCard
          rating={todayMood}
          onChange={(mood_rating) => saveEntry('mood', { mood_rating })}
        />

        {/* Historial */}
        {historyByDay.length > 0 && (
          <section className="mt-10">
            <h2 className="text-[11px] font-mono text-graphite-subtle uppercase tracking-widest mb-3">
              Últimos días
            </h2>
            <div className="space-y-3">
              {historyByDay.map(([date, dayEntries]) => (
                <HistoryDay key={date} date={date} entries={dayEntries} />
              ))}
            </div>
          </section>
        )}

        <footer className="mt-12 pt-6 border-t border-border">
          <p className="text-[11px] font-mono text-graphite-subtle uppercase tracking-widest text-center">
            Sara · diario nutricional
          </p>
        </footer>
      </div>
    </div>
  )
}

// ─── MealCard ────────────────────────────────────────────────────────────

function MealCard({
  label, placeholder, initial, onSave,
}: {
  label: string
  placeholder: string
  initial: string
  onSave: (content: string) => void
}) {
  const [value, setValue] = useState(initial)
  const [saving, setSaving] = useState(false)
  const dirty = value !== initial

  async function handleSave() {
    if (!dirty) return
    setSaving(true)
    await onSave(value)
    setSaving(false)
  }

  return (
    <div className="bg-cream-raised border border-border rounded-lg p-4">
      <div className="flex items-baseline justify-between mb-2">
        <p className="font-display text-base text-graphite">{label}</p>
        {initial && <span className="text-[10px] font-mono uppercase tracking-widest text-sage">✓ Guardado</span>}
      </div>
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={handleSave}
        rows={2}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-cream-raised border border-border-strong rounded-md text-sm text-graphite placeholder:text-graphite-subtle focus:outline-none focus:border-sage focus:ring-[3px] focus:ring-sage-bg resize-none"
      />
      {dirty && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-2 text-xs font-medium text-sage hover:underline disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      )}
    </div>
  )
}

// ─── WaterCard ───────────────────────────────────────────────────────────

function WaterCard({
  totalMl,
  onChange,
}: {
  totalMl: number
  onChange: (ml: number) => void
}) {
  const glasses = Math.round(totalMl / 250)
  function adjust(delta: number) {
    const next = Math.max(0, totalMl + delta * 250)
    onChange(next)
  }
  return (
    <div className="bg-cream-raised border border-border rounded-lg p-4 mb-3">
      <div className="flex items-baseline justify-between mb-3">
        <p className="font-display text-base text-graphite">Hidratación</p>
        <p className="font-mono text-xs text-graphite-subtle uppercase tracking-widest">
          {totalMl} ml · {glasses} vaso{glasses === 1 ? '' : 's'}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => adjust(-1)}
          disabled={totalMl === 0}
          className="w-12 h-12 rounded-full border border-border-strong text-graphite-muted hover:border-sage hover:text-sage disabled:opacity-30 transition-colors text-xl"
        >
          −
        </button>
        <div className="flex-1 flex justify-center gap-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-7 rounded-sm border ${i < glasses ? 'bg-sage border-sage' : 'bg-cream-sunken border-border'}`}
            />
          ))}
        </div>
        <button
          onClick={() => adjust(1)}
          className="w-12 h-12 rounded-full bg-sage text-white hover:bg-[#3D6A4A] transition-colors text-xl"
        >
          +
        </button>
      </div>
    </div>
  )
}

// ─── MoodCard ────────────────────────────────────────────────────────────

function MoodCard({
  rating,
  onChange,
}: {
  rating: number | null
  onChange: (rating: number) => void
}) {
  return (
    <div className="bg-cream-raised border border-border rounded-lg p-4">
      <p className="font-display text-base text-graphite mb-3">¿Cómo te sientes?</p>
      <div className="grid grid-cols-5 gap-2">
        {MOOD_OPTIONS.map(opt => {
          const active = rating === opt.rating
          return (
            <button
              key={opt.rating}
              onClick={() => onChange(opt.rating)}
              className={`py-3 rounded-md transition-colors ${
                active
                  ? 'bg-sage text-white'
                  : 'bg-cream-sunken text-graphite-muted hover:bg-sage-bg hover:text-sage'
              }`}
            >
              <div className="font-mono text-lg leading-none">{opt.rating}</div>
              <div className="text-[10px] mt-1 uppercase tracking-widest">{opt.label}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── HistoryDay ──────────────────────────────────────────────────────────

function HistoryDay({ date, entries }: { date: string; entries: Entry[] }) {
  const dt = new Date(date + 'T00:00:00')
  const label = dt.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })
  const meals = entries.filter(e => ['breakfast', 'snack_am', 'lunch', 'snack_pm', 'dinner'].includes(e.meal_kind)).length
  const water = entries.find(e => e.meal_kind === 'water')?.amount_ml ?? 0
  const mood = entries.find(e => e.meal_kind === 'mood')?.mood_rating ?? null

  return (
    <div className="bg-cream-raised border border-border rounded-lg px-4 py-3 flex items-center justify-between gap-3">
      <p className="text-sm text-graphite font-mono capitalize">{label}</p>
      <div className="flex items-center gap-3 text-xs font-mono text-graphite-subtle">
        <span>{meals}/5 comidas</span>
        <span>{water}ml</span>
        {mood && <span className="text-sage">mood {mood}</span>}
      </div>
    </div>
  )
}
