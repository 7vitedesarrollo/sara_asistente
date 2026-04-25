'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import DOMPurify from 'isomorphic-dompurify'

const DAYS: { key: DayKey; label: string }[] = [
  { key: 'monday', label: 'Lun' },
  { key: 'tuesday', label: 'Mar' },
  { key: 'wednesday', label: 'Mié' },
  { key: 'thursday', label: 'Jue' },
  { key: 'friday', label: 'Vie' },
  { key: 'saturday', label: 'Sáb' },
  { key: 'sunday', label: 'Dom' },
]

const MEALS: { key: MealKey; label: string }[] = [
  { key: 'breakfast', label: 'Desayuno' },
  { key: 'snack_am', label: 'Media mañana' },
  { key: 'lunch', label: 'Almuerzo' },
  { key: 'snack_pm', label: 'Merienda' },
  { key: 'dinner', label: 'Cena' },
]

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
type MealKey = 'breakfast' | 'snack_am' | 'lunch' | 'snack_pm' | 'dinner'
type DayMeals = Partial<Record<MealKey, string>>
type WeekStructure = Partial<Record<DayKey, DayMeals>>

type MealPlan = {
  id: string
  summary: string | null
  instructions: string | null
  structure: WeekStructure | null
  daily_kcal: number | null
  daily_protein_g: number | null
  start_date: string | null
  end_date: string | null
  created_at: string
}

type Props = {
  mealPlans: MealPlan[]
  patientId: string
  nutritionistId: string
}

export default function PlanesClient({ mealPlans: initial, patientId, nutritionistId }: Props) {
  const supabase = createClient()
  const [list, setList] = useState<MealPlan[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function handleSave(plan: Omit<MealPlan, 'id' | 'created_at'>) {
    const optimistic: MealPlan = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...plan,
    }
    setList(prev => [optimistic, ...prev])
    setShowForm(false)

    const { error, data } = await supabase
      .from('meal_plans')
      .insert({
        patient_id: patientId,
        nutritionist_id: nutritionistId,
        summary: plan.summary,
        instructions: plan.instructions,
        structure: plan.structure,
        daily_kcal: plan.daily_kcal,
        daily_protein_g: plan.daily_protein_g,
        start_date: plan.start_date,
        end_date: plan.end_date,
      })
      .select()
      .single()

    if (error) {
      toast.error('Error al guardar el plan. Reintenta.')
      setList(prev => prev.filter(p => p.id !== optimistic.id))
    } else {
      setList(prev => prev.map(p => p.id === optimistic.id ? { ...p, id: data.id } : p))
      toast.success('Plan alimentario guardado')
    }
  }

  return (
    <div className="space-y-4">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full border-2 border-dashed border-border rounded-lg py-3 text-sm text-graphite-subtle hover:border-sage hover:text-sage transition-colors"
        >
          + Nuevo plan alimentario
        </button>
      ) : (
        <PlanForm
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}

      {list.length === 0 && !showForm && (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <p className="font-display italic text-2xl text-graphite-muted">Aún sin planes alimentarios.</p>
          <p className="text-sm text-graphite-subtle mt-2">Crea el primer plan semanal para iniciar el seguimiento.</p>
        </div>
      )}

      {list.map(plan => (
        <PlanCard
          key={plan.id}
          plan={plan}
          expanded={expandedId === plan.id}
          onToggle={() => setExpandedId(prev => prev === plan.id ? null : plan.id)}
        />
      ))}
    </div>
  )
}

// ─── Form ────────────────────────────────────────────────────────────────

function PlanForm({
  onSave,
  onCancel,
}: {
  onSave: (plan: Omit<MealPlan, 'id' | 'created_at'>) => void
  onCancel: () => void
}) {
  const [summary, setSummary] = useState('')
  const [instructions, setInstructions] = useState('')
  const [dailyKcal, setDailyKcal] = useState('')
  const [dailyProtein, setDailyProtein] = useState('')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 6)
    return d.toISOString().slice(0, 10)
  })
  const [structure, setStructure] = useState<WeekStructure>({})

  function setMeal(day: DayKey, meal: MealKey, value: string) {
    setStructure(prev => ({
      ...prev,
      [day]: { ...prev[day], [meal]: value },
    }))
  }

  function submit() {
    if (!summary.trim()) {
      toast.error('Indica un objetivo o resumen del plan.')
      return
    }
    onSave({
      summary: DOMPurify.sanitize(summary.trim()),
      instructions: instructions ? DOMPurify.sanitize(instructions.trim()) : null,
      structure,
      daily_kcal: dailyKcal ? parseInt(dailyKcal, 10) : null,
      daily_protein_g: dailyProtein ? parseInt(dailyProtein, 10) : null,
      start_date: startDate || null,
      end_date: endDate || null,
    })
  }

  return (
    <div className="bg-cream-raised border border-border rounded-lg p-5 space-y-5">
      {/* Header del form */}
      <div>
        <label className="block text-xs font-medium text-graphite-muted mb-2">
          Objetivo del plan <span className="text-terracotta">*</span>
        </label>
        <input
          type="text"
          value={summary}
          onChange={e => setSummary(e.target.value)}
          placeholder="Reducción de peso con preservación de masa magra"
          className="w-full px-3 py-2.5 bg-cream-raised border border-border-strong rounded-md text-sm text-graphite placeholder:text-graphite-subtle focus:outline-none focus:border-sage focus:ring-[3px] focus:ring-sage-bg transition-all"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-graphite-muted mb-2">
            Kcal diarias <span className="font-mono text-graphite-subtle">kcal</span>
          </label>
          <input
            type="number"
            value={dailyKcal}
            onChange={e => setDailyKcal(e.target.value)}
            placeholder="1650"
            className="w-full px-3 py-2 bg-cream-raised border border-border-strong rounded-md text-sm text-graphite font-mono focus:outline-none focus:border-sage focus:ring-[3px] focus:ring-sage-bg"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-graphite-muted mb-2">
            Proteína <span className="font-mono text-graphite-subtle">g</span>
          </label>
          <input
            type="number"
            value={dailyProtein}
            onChange={e => setDailyProtein(e.target.value)}
            placeholder="95"
            className="w-full px-3 py-2 bg-cream-raised border border-border-strong rounded-md text-sm text-graphite font-mono focus:outline-none focus:border-sage focus:ring-[3px] focus:ring-sage-bg"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-graphite-muted mb-2">Inicia</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full px-3 py-2 bg-cream-raised border border-border-strong rounded-md text-sm text-graphite font-mono focus:outline-none focus:border-sage focus:ring-[3px] focus:ring-sage-bg"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-graphite-muted mb-2">Termina</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full px-3 py-2 bg-cream-raised border border-border-strong rounded-md text-sm text-graphite font-mono focus:outline-none focus:border-sage focus:ring-[3px] focus:ring-sage-bg"
          />
        </div>
      </div>

      {/* Grid semanal */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <label className="text-xs font-medium text-graphite-muted">Plan semanal</label>
          <span className="text-[11px] font-mono text-graphite-subtle uppercase tracking-widest">7 días · 5 comidas</span>
        </div>
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="min-w-[900px] grid grid-cols-[140px_repeat(7,minmax(120px,1fr))] gap-px bg-border rounded-md overflow-hidden border border-border">
            {/* Header row */}
            <div className="bg-cream-sunken px-3 py-2.5 text-[11px] font-mono text-graphite-subtle uppercase tracking-widest"></div>
            {DAYS.map(d => (
              <div key={d.key} className="bg-cream-sunken px-3 py-2.5 text-[11px] font-mono text-graphite-muted uppercase tracking-widest text-center">
                {d.label}
              </div>
            ))}

            {/* Meal rows */}
            {MEALS.map(meal => (
              <div key={meal.key} className="contents">
                <div className="bg-cream-sunken px-3 py-2.5 text-xs font-medium text-graphite-muted flex items-center">
                  {meal.label}
                </div>
                {DAYS.map(d => (
                  <textarea
                    key={`${d.key}-${meal.key}`}
                    value={structure[d.key]?.[meal.key] ?? ''}
                    onChange={e => setMeal(d.key, meal.key, e.target.value)}
                    rows={2}
                    placeholder="—"
                    className="bg-cream-raised px-2.5 py-2 text-xs text-graphite placeholder:text-graphite-subtle focus:outline-none focus:bg-sage-bg/30 resize-none border-0"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-graphite-muted mb-2">
          Instrucciones / notas <span className="text-graphite-subtle">(opcional)</span>
        </label>
        <textarea
          value={instructions}
          onChange={e => setInstructions(e.target.value)}
          rows={2}
          placeholder="Hidratación 2L/día. Tolerancia FODMAP baja. Evitar alimentos procesados los días de entrenamiento."
          className="w-full px-3 py-2 bg-cream-raised border border-border-strong rounded-md text-sm text-graphite placeholder:text-graphite-subtle focus:outline-none focus:border-sage focus:ring-[3px] focus:ring-sage-bg resize-none"
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="text-sm px-4 py-2 rounded-md text-graphite-muted hover:bg-cream-sunken transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={submit}
          className="text-sm font-medium px-4 py-2 rounded-md bg-sage text-white hover:bg-[#3D6A4A] transition-colors"
        >
          Guardar plan
        </button>
      </div>
    </div>
  )
}

// ─── Card (lista) ────────────────────────────────────────────────────────

function PlanCard({
  plan,
  expanded,
  onToggle,
}: {
  plan: MealPlan
  expanded: boolean
  onToggle: () => void
}) {
  const created = new Date(plan.created_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
  const range = plan.start_date && plan.end_date
    ? `${new Date(plan.start_date).toLocaleDateString('es', { day: '2-digit', month: 'short' })} → ${new Date(plan.end_date).toLocaleDateString('es', { day: '2-digit', month: 'short' })}`
    : null

  return (
    <div className="bg-cream-raised border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 hover:bg-cream-sunken transition-colors"
      >
        <div className="flex items-baseline justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-display text-lg text-graphite truncate">
              {plan.summary || 'Plan sin objetivo registrado'}
            </h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs font-mono text-graphite-muted">
              {range && <span>{range}</span>}
              {plan.daily_kcal && <span>{plan.daily_kcal} kcal/día</span>}
              {plan.daily_protein_g && <span>{plan.daily_protein_g} g proteína</span>}
            </div>
          </div>
          <span className="text-xs font-mono text-graphite-subtle shrink-0">{created}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border p-5 space-y-4">
          <div className="flex justify-end">
            <a
              href={`/print/plan/${plan.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium px-4 py-2 rounded-md bg-sage text-white hover:bg-[#3D6A4A] transition-colors inline-flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" />
              </svg>
              Descargar PDF
            </a>
          </div>
          {plan.structure && Object.keys(plan.structure).length > 0 ? (
            <div className="overflow-x-auto -mx-1 px-1">
              <div className="min-w-[900px] grid grid-cols-[120px_repeat(7,minmax(110px,1fr))] gap-px bg-border rounded-md overflow-hidden border border-border">
                <div className="bg-cream-sunken px-3 py-2 text-[11px] font-mono text-graphite-subtle uppercase tracking-widest"></div>
                {DAYS.map(d => (
                  <div key={d.key} className="bg-cream-sunken px-3 py-2 text-[11px] font-mono text-graphite-muted uppercase tracking-widest text-center">
                    {d.label}
                  </div>
                ))}
                {MEALS.map(meal => (
                  <div key={meal.key} className="contents">
                    <div className="bg-cream-sunken px-3 py-2 text-xs font-medium text-graphite-muted">
                      {meal.label}
                    </div>
                    {DAYS.map(d => (
                      <div key={`${d.key}-${meal.key}`} className="bg-cream-raised px-2.5 py-2 text-xs text-graphite whitespace-pre-wrap leading-snug">
                        {plan.structure?.[d.key]?.[meal.key] ?? <span className="text-graphite-subtle">—</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-graphite-subtle italic">Plan sin estructura semanal detallada.</p>
          )}

          {plan.instructions && (
            <div>
              <p className="text-[11px] font-mono text-graphite-subtle uppercase tracking-widest mb-1">Instrucciones</p>
              <p className="text-sm text-graphite leading-relaxed">{plan.instructions}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
