'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import DOMPurify from 'isomorphic-dompurify'
import { MealPlanGridEditor, MealPlanGridReadOnly, type WeekStructure } from '@/components/MealPlanGrid'

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

type Template = {
  id: string
  name: string
  summary: string | null
  instructions: string | null
  structure: WeekStructure | null
  daily_kcal: number | null
  daily_protein_g: number | null
}

type Props = {
  mealPlans: MealPlan[]
  templates: Template[]
  patientId: string
  nutritionistId: string
}

export default function PlanesClient({ mealPlans: initial, templates, patientId, nutritionistId }: Props) {
  const supabase = createClient()
  const [list, setList] = useState<MealPlan[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [prefill, setPrefill] = useState<Partial<MealPlan> | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function handleSave(plan: Omit<MealPlan, 'id' | 'created_at'>) {
    const optimistic: MealPlan = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...plan,
    }
    setList(prev => [optimistic, ...prev])
    setShowForm(false)
    setPrefill(null)

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

  async function handleSaveAsTemplate(plan: MealPlan) {
    const name = prompt('Nombre de la plantilla', plan.summary ?? '')
    if (!name?.trim()) return

    const { error } = await supabase
      .from('meal_plan_templates')
      .insert({
        nutritionist_id: nutritionistId,
        name: DOMPurify.sanitize(name.trim()),
        summary: plan.summary,
        instructions: plan.instructions,
        structure: plan.structure,
        daily_kcal: plan.daily_kcal,
        daily_protein_g: plan.daily_protein_g,
      })

    if (error) {
      toast.error('Error al guardar la plantilla.')
    } else {
      toast.success('Plantilla creada — disponible en /plantillas')
    }
  }

  return (
    <div className="space-y-4">
      {!showForm ? (
        <button
          onClick={() => { setPrefill(null); setShowForm(true) }}
          className="w-full border-2 border-dashed border-border rounded-lg py-3 text-sm text-graphite-subtle hover:border-sage hover:text-sage transition-colors"
        >
          + Nuevo plan alimentario
        </button>
      ) : (
        <PlanForm
          templates={templates}
          prefill={prefill}
          onLoadTemplate={(t) => setPrefill({
            summary: t.summary,
            instructions: t.instructions,
            structure: t.structure,
            daily_kcal: t.daily_kcal,
            daily_protein_g: t.daily_protein_g,
          })}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setPrefill(null) }}
        />
      )}

      {list.length === 0 && !showForm && (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <p className="font-display italic text-2xl text-graphite-muted">Aún sin planes alimentarios.</p>
          <p className="text-sm text-graphite-subtle mt-2">
            {templates.length > 0
              ? `Crea uno desde cero o cárgalo desde una de tus ${templates.length} plantilla${templates.length > 1 ? 's' : ''}.`
              : 'Crea el primer plan semanal para iniciar el seguimiento.'}
          </p>
        </div>
      )}

      {list.map(plan => (
        <PlanCard
          key={plan.id}
          plan={plan}
          expanded={expandedId === plan.id}
          onToggle={() => setExpandedId(prev => prev === plan.id ? null : plan.id)}
          onSaveAsTemplate={() => handleSaveAsTemplate(plan)}
        />
      ))}
    </div>
  )
}

// ─── Form ────────────────────────────────────────────────────────────────

function PlanForm({
  templates,
  prefill,
  onLoadTemplate,
  onSave,
  onCancel,
}: {
  templates: Template[]
  prefill: Partial<MealPlan> | null
  onLoadTemplate: (t: Template) => void
  onSave: (plan: Omit<MealPlan, 'id' | 'created_at'>) => void
  onCancel: () => void
}) {
  // re-init state from prefill when it changes (key on parent forces remount)
  const [summary, setSummary] = useState(prefill?.summary ?? '')
  const [instructions, setInstructions] = useState(prefill?.instructions ?? '')
  const [dailyKcal, setDailyKcal] = useState(prefill?.daily_kcal?.toString() ?? '')
  const [dailyProtein, setDailyProtein] = useState(prefill?.daily_protein_g?.toString() ?? '')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 6)
    return d.toISOString().slice(0, 10)
  })
  const [structure, setStructure] = useState<WeekStructure>(prefill?.structure ?? {})
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  function applyTemplate(templateId: string) {
    setSelectedTemplate(templateId)
    if (!templateId) return
    const t = templates.find(t => t.id === templateId)
    if (!t) return
    setSummary(t.summary ?? '')
    setInstructions(t.instructions ?? '')
    setDailyKcal(t.daily_kcal?.toString() ?? '')
    setDailyProtein(t.daily_protein_g?.toString() ?? '')
    setStructure(t.structure ?? {})
    onLoadTemplate(t)
    toast.success(`Plantilla "${t.name}" cargada`)
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
      {templates.length > 0 && (
        <div className="bg-sage-bg rounded-md px-4 py-3 flex items-center gap-3">
          <p className="text-xs font-mono text-sage uppercase tracking-widest shrink-0">Cargar desde plantilla</p>
          <select
            value={selectedTemplate}
            onChange={e => applyTemplate(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-cream-raised border border-border-strong rounded-md text-sm text-graphite focus:outline-none focus:border-sage focus:ring-[3px] focus:ring-sage-bg"
          >
            <option value="">— Empezar desde cero —</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.daily_kcal ? ` · ${t.daily_kcal} kcal` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

      <div>
        <div className="flex items-baseline justify-between mb-2">
          <label className="text-xs font-medium text-graphite-muted">Plan semanal</label>
          <span className="text-[11px] font-mono text-graphite-subtle uppercase tracking-widest">7 días · 5 comidas</span>
        </div>
        <MealPlanGridEditor structure={structure} onChange={setStructure} />
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

// ─── Card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  expanded,
  onToggle,
  onSaveAsTemplate,
}: {
  plan: MealPlan
  expanded: boolean
  onToggle: () => void
  onSaveAsTemplate: () => void
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
          <div className="flex justify-end gap-2">
            <button
              onClick={onSaveAsTemplate}
              className="text-sm px-4 py-2 rounded-md text-sage border border-sage hover:bg-sage-bg transition-colors"
            >
              Guardar como plantilla
            </button>
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
            <MealPlanGridReadOnly structure={plan.structure} />
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
