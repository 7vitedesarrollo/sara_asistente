'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import DOMPurify from 'isomorphic-dompurify'
import { MealPlanGridEditor, MealPlanGridReadOnly, type WeekStructure } from '@/components/MealPlanGrid'

type Template = {
  id: string
  name: string
  summary: string | null
  instructions: string | null
  structure: WeekStructure | null
  daily_kcal: number | null
  daily_protein_g: number | null
  created_at: string
  updated_at: string
}

type Mode =
  | { kind: 'list' }
  | { kind: 'create' }
  | { kind: 'edit'; template: Template }

export default function PlantillasClient({
  templates: initial,
  nutritionistId,
}: {
  templates: Template[]
  nutritionistId: string
}) {
  const supabase = createClient()
  const [list, setList] = useState<Template[]>(initial)
  const [mode, setMode] = useState<Mode>({ kind: 'list' })
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function handleCreate(payload: Omit<Template, 'id' | 'created_at' | 'updated_at'>) {
    const optimistic: Template = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...payload,
    }
    setList(prev => [optimistic, ...prev])
    setMode({ kind: 'list' })

    const { error, data } = await supabase
      .from('meal_plan_templates')
      .insert({ nutritionist_id: nutritionistId, ...payload })
      .select()
      .single()

    if (error) {
      toast.error('Error al crear la plantilla.')
      setList(prev => prev.filter(t => t.id !== optimistic.id))
    } else {
      setList(prev => prev.map(t => t.id === optimistic.id ? { ...t, id: data.id } : t))
      toast.success('Plantilla creada')
    }
  }

  async function handleUpdate(id: string, payload: Omit<Template, 'id' | 'created_at' | 'updated_at'>) {
    const previousList = list
    setList(prev => prev.map(t => t.id === id ? { ...t, ...payload, updated_at: new Date().toISOString() } : t))
    setMode({ kind: 'list' })

    const { error } = await supabase
      .from('meal_plan_templates')
      .update(payload)
      .eq('id', id)

    if (error) {
      toast.error('Error al guardar cambios.')
      setList(previousList)
    } else {
      toast.success('Plantilla actualizada')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta plantilla? La acción no se puede deshacer.')) return
    const previousList = list
    setList(prev => prev.filter(t => t.id !== id))

    const { error } = await supabase
      .from('meal_plan_templates')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Error al eliminar.')
      setList(previousList)
    } else {
      toast.success('Plantilla eliminada')
    }
  }

  if (mode.kind === 'create') {
    return (
      <TemplateForm
        title="Nueva plantilla"
        onSubmit={handleCreate}
        onCancel={() => setMode({ kind: 'list' })}
      />
    )
  }

  if (mode.kind === 'edit') {
    return (
      <TemplateForm
        title="Editar plantilla"
        initial={mode.template}
        onSubmit={(payload) => handleUpdate(mode.template.id, payload)}
        onCancel={() => setMode({ kind: 'list' })}
      />
    )
  }

  return (
    <>
      <div className="flex items-end justify-between mb-6 pb-4 border-b border-border">
        <div>
          <h1 className="font-display text-4xl text-graphite leading-tight">Plantillas</h1>
          <p className="text-sm text-graphite-muted mt-1">
            Estructuras alimentarias reutilizables que duplicas y adaptas por paciente.
          </p>
        </div>
        <button
          onClick={() => setMode({ kind: 'create' })}
          className="bg-sage text-white text-sm px-4 py-2 rounded-md hover:bg-[#3D6A4A] transition-colors font-medium"
        >
          Nueva plantilla
        </button>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-lg">
          <p className="font-display italic text-2xl text-graphite-muted">Aún sin plantillas guardadas.</p>
          <p className="text-sm text-graphite-subtle mt-2">
            Crea tu primera plantilla, o guarda un plan existente como plantilla desde la ficha de un paciente.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(t => (
            <TemplateCard
              key={t.id}
              template={t}
              expanded={expandedId === t.id}
              onToggle={() => setExpandedId(prev => prev === t.id ? null : t.id)}
              onEdit={() => setMode({ kind: 'edit', template: t })}
              onDelete={() => handleDelete(t.id)}
            />
          ))}
        </div>
      )}
    </>
  )
}

// ─── Template form ───────────────────────────────────────────────────────

function TemplateForm({
  title,
  initial,
  onSubmit,
  onCancel,
}: {
  title: string
  initial?: Template
  onSubmit: (payload: Omit<Template, 'id' | 'created_at' | 'updated_at'>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [summary, setSummary] = useState(initial?.summary ?? '')
  const [instructions, setInstructions] = useState(initial?.instructions ?? '')
  const [dailyKcal, setDailyKcal] = useState(initial?.daily_kcal?.toString() ?? '')
  const [dailyProtein, setDailyProtein] = useState(initial?.daily_protein_g?.toString() ?? '')
  const [structure, setStructure] = useState<WeekStructure>(initial?.structure ?? {})

  function submit() {
    if (!name.trim()) {
      toast.error('Indica un nombre para la plantilla.')
      return
    }
    onSubmit({
      name: DOMPurify.sanitize(name.trim()),
      summary: summary ? DOMPurify.sanitize(summary.trim()) : null,
      instructions: instructions ? DOMPurify.sanitize(instructions.trim()) : null,
      structure,
      daily_kcal: dailyKcal ? parseInt(dailyKcal, 10) : null,
      daily_protein_g: dailyProtein ? parseInt(dailyProtein, 10) : null,
    })
  }

  return (
    <>
      <div className="flex items-end justify-between mb-6 pb-4 border-b border-border">
        <h1 className="font-display text-4xl text-graphite leading-tight">{title}</h1>
        <div className="flex gap-2">
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
            Guardar plantilla
          </button>
        </div>
      </div>

      <div className="bg-cream-raised border border-border rounded-lg p-6 space-y-5">
        <div>
          <label className="block text-xs font-medium text-graphite-muted mb-2">
            Nombre de la plantilla <span className="text-terracotta">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Déficit moderado · 1500 kcal · alta saciedad"
            autoFocus
            className="w-full px-3 py-2.5 bg-cream-raised border border-border-strong rounded-md text-sm text-graphite placeholder:text-graphite-subtle focus:outline-none focus:border-sage focus:ring-[3px] focus:ring-sage-bg transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-graphite-muted mb-2">
            Objetivo / descripción <span className="text-graphite-subtle">(opcional)</span>
          </label>
          <input
            type="text"
            value={summary}
            onChange={e => setSummary(e.target.value)}
            placeholder="Reducción de peso con preservación de masa magra"
            className="w-full px-3 py-2.5 bg-cream-raised border border-border-strong rounded-md text-sm text-graphite placeholder:text-graphite-subtle focus:outline-none focus:border-sage focus:ring-[3px] focus:ring-sage-bg transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-graphite-muted mb-2">
              Kcal diarias <span className="font-mono text-graphite-subtle">kcal</span>
            </label>
            <input
              type="number"
              value={dailyKcal}
              onChange={e => setDailyKcal(e.target.value)}
              placeholder="1500"
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
              placeholder="100"
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
            placeholder="Hidratación 2L/día. Ajustar las porciones según peso del paciente."
            className="w-full px-3 py-2 bg-cream-raised border border-border-strong rounded-md text-sm text-graphite placeholder:text-graphite-subtle focus:outline-none focus:border-sage focus:ring-[3px] focus:ring-sage-bg resize-none"
          />
        </div>
      </div>
    </>
  )
}

// ─── Card ────────────────────────────────────────────────────────────────

function TemplateCard({
  template: t,
  expanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  template: Template
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const updated = new Date(t.updated_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
  const filledMeals = countFilledMeals(t.structure)

  return (
    <div className="bg-cream-raised border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 hover:bg-cream-sunken transition-colors"
      >
        <div className="flex items-baseline justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg text-graphite truncate">{t.name}</h3>
            {t.summary && (
              <p className="text-sm text-graphite-muted mt-0.5 truncate">{t.summary}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs font-mono text-graphite-subtle uppercase tracking-widest">
              {t.daily_kcal && <span>{t.daily_kcal} kcal</span>}
              {t.daily_protein_g && <span>{t.daily_protein_g} g proteína</span>}
              <span>{filledMeals}/35 celdas</span>
            </div>
          </div>
          <span className="text-xs font-mono text-graphite-subtle shrink-0">{updated}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border p-5 space-y-4">
          <div className="flex justify-end gap-2">
            <button
              onClick={onDelete}
              className="text-sm px-3 py-1.5 rounded-md text-terracotta hover:bg-[#F6E6E0] transition-colors"
            >
              Eliminar
            </button>
            <button
              onClick={onEdit}
              className="text-sm font-medium px-4 py-1.5 rounded-md bg-sage text-white hover:bg-[#3D6A4A] transition-colors"
            >
              Editar
            </button>
          </div>

          {t.structure && Object.keys(t.structure).length > 0 ? (
            <MealPlanGridReadOnly structure={t.structure} />
          ) : (
            <p className="text-sm text-graphite-subtle italic">Plantilla sin estructura semanal.</p>
          )}

          {t.instructions && (
            <div>
              <p className="text-[11px] font-mono text-graphite-subtle uppercase tracking-widest mb-1">Instrucciones</p>
              <p className="text-sm text-graphite leading-relaxed whitespace-pre-wrap">{t.instructions}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function countFilledMeals(structure: WeekStructure | null): number {
  if (!structure) return 0
  let count = 0
  for (const day of Object.values(structure)) {
    if (!day) continue
    for (const meal of Object.values(day)) {
      if (meal && meal.trim()) count++
    }
  }
  return count
}
