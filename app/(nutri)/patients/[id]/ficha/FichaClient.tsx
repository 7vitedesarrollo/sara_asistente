'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type Patient = {
  id: string
  name: string
  age: number | null
  sex: string | null
  phone: string | null
  email: string | null
  notes: string | null
  birth_date: string | null
  height_cm: number | null
  activity_level: string | null
  dietary_restrictions: string | null
  allergies: string | null
  initial_goal: string | null
}

type Props = {
  patient: Patient
  latestWeightKg: number | null
  latestBodyFatPct: number | null
  nutritionistId: string
}

const ACTIVITY_OPTIONS = [
  { value: '', label: 'No registrado' },
  { value: 'sedentario', label: 'Sedentario (poca o ninguna actividad)' },
  { value: 'ligero', label: 'Ligero (1–3 días/semana)' },
  { value: 'moderado', label: 'Moderado (3–5 días/semana)' },
  { value: 'intenso', label: 'Intenso (6–7 días/semana)' },
  { value: 'muy_intenso', label: 'Muy intenso (atleta o trabajo físico)' },
]

const ACTIVITY_FACTOR: Record<string, number> = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  intenso: 1.725,
  muy_intenso: 1.9,
}

export default function FichaClient({ patient: initial, latestWeightKg, latestBodyFatPct }: Props) {
  const supabase = createClient()
  const [p, setP] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState(initial)

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase
      .from('patients')
      .update({
        name: draft.name,
        age: draft.age,
        sex: draft.sex,
        phone: draft.phone,
        email: draft.email,
        notes: draft.notes,
        birth_date: draft.birth_date,
        height_cm: draft.height_cm,
        activity_level: draft.activity_level,
        dietary_restrictions: draft.dietary_restrictions,
        allergies: draft.allergies,
        initial_goal: draft.initial_goal,
      })
      .eq('id', p.id)

    if (error) {
      toast.error('Error al guardar')
    } else {
      setP(draft)
      setEditing(false)
      toast.success('Ficha actualizada')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <PatientCard
        patient={p}
        editing={editing}
        draft={draft}
        saving={saving}
        onEdit={() => { setDraft(p); setEditing(true) }}
        onCancel={() => setEditing(false)}
        onSave={handleSave}
        onDraftChange={setDraft}
      />
      <EnergyExpenditureCard
        patient={p}
        weightKg={latestWeightKg}
        bodyFatPct={latestBodyFatPct}
      />
    </div>
  )
}

// ─── Patient Card ────────────────────────────────────────────────────────

function PatientCard({
  patient: p,
  editing,
  draft,
  saving,
  onEdit,
  onCancel,
  onSave,
  onDraftChange,
}: {
  patient: Patient
  editing: boolean
  draft: Patient
  saving: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  onDraftChange: (next: Patient) => void
}) {
  const update = <K extends keyof Patient>(key: K, value: Patient[K]) => {
    onDraftChange({ ...draft, [key]: value })
  }

  if (!editing) {
    return (
      <section className="bg-cream-raised border border-border rounded-lg p-6 space-y-5">
        <div className="flex justify-between items-start">
          <h2 className="font-display text-2xl text-graphite leading-tight">Datos del paciente</h2>
          <button
            onClick={onEdit}
            className="text-sm text-sage font-medium hover:underline"
          >
            Editar
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
          <Field label="Nombre" value={p.name} />
          <Field label="Edad" value={p.age ? `${p.age} años` : null} mono />
          <Field label="Sexo" value={p.sex === 'M' ? 'Masculino' : p.sex === 'F' ? 'Femenino' : p.sex} />
          <Field label="Estatura" value={p.height_cm ? `${p.height_cm} cm` : null} mono />
          <Field label="Fecha de nacimiento" value={p.birth_date} mono />
          <Field label="Nivel de actividad" value={ACTIVITY_OPTIONS.find(o => o.value === p.activity_level)?.label ?? null} />
          <Field label="Teléfono" value={p.phone} mono />
          <Field label="Correo" value={p.email} mono />
        </div>

        {(p.initial_goal || p.dietary_restrictions || p.allergies || p.notes) && (
          <div className="space-y-3 pt-4 border-t border-border">
            <FieldBlock label="Objetivo inicial" value={p.initial_goal} />
            <FieldBlock label="Restricciones alimentarias" value={p.dietary_restrictions} />
            <FieldBlock label="Alergias" value={p.allergies} highlight />
            <FieldBlock label="Notas generales" value={p.notes} />
          </div>
        )}
      </section>
    )
  }

  return (
    <section className="bg-cream-raised border border-border rounded-lg p-6 space-y-4">
      <h2 className="font-display text-2xl text-graphite leading-tight">Editar ficha</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Nombre</Label>
          <Input value={draft.name} onChange={v => update('name', v)} />
        </div>
        <div>
          <Label>Edad <span className="font-mono text-graphite-subtle">años</span></Label>
          <Input type="number" value={draft.age ?? ''} onChange={v => update('age', v ? Number(v) : null)} />
        </div>
        <div>
          <Label>Sexo</Label>
          <Select value={draft.sex ?? ''} onChange={v => update('sex', v || null)}>
            <option value="">—</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="otro">Otro</option>
          </Select>
        </div>
        <div>
          <Label>Estatura <span className="font-mono text-graphite-subtle">cm</span></Label>
          <Input type="number" step="0.1" value={draft.height_cm ?? ''} onChange={v => update('height_cm', v ? Number(v) : null)} />
        </div>
        <div>
          <Label>Fecha de nacimiento</Label>
          <Input type="date" value={draft.birth_date ?? ''} onChange={v => update('birth_date', v || null)} />
        </div>
        <div className="col-span-2">
          <Label>Nivel de actividad</Label>
          <Select value={draft.activity_level ?? ''} onChange={v => update('activity_level', v || null)}>
            {ACTIVITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>
        <div>
          <Label>Teléfono</Label>
          <Input type="tel" value={draft.phone ?? ''} onChange={v => update('phone', v || null)} />
        </div>
        <div>
          <Label>Correo</Label>
          <Input type="email" value={draft.email ?? ''} onChange={v => update('email', v || null)} />
        </div>
        <div className="col-span-2">
          <Label>Objetivo inicial</Label>
          <Input value={draft.initial_goal ?? ''} onChange={v => update('initial_goal', v || null)} placeholder="Reducción de peso con preservación de masa magra" />
        </div>
        <div>
          <Label>Restricciones alimentarias</Label>
          <Input value={draft.dietary_restrictions ?? ''} onChange={v => update('dietary_restrictions', v || null)} placeholder="Sin gluten, baja en lactosa" />
        </div>
        <div>
          <Label>Alergias</Label>
          <Input value={draft.allergies ?? ''} onChange={v => update('allergies', v || null)} placeholder="Mariscos, frutos secos" />
        </div>
        <div className="col-span-2">
          <Label>Notas generales</Label>
          <Textarea rows={3} value={draft.notes ?? ''} onChange={v => update('notes', v || null)} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onCancel}
          className="text-sm px-4 py-2 rounded-md text-graphite-muted hover:bg-cream-sunken transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="text-sm font-medium px-4 py-2 rounded-md bg-sage text-white hover:bg-[#3D6A4A] disabled:opacity-50 transition-colors"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </section>
  )
}

// ─── Energy Expenditure Card (Mifflin-St Jeor) ───────────────────────────

function EnergyExpenditureCard({
  patient: p,
  weightKg,
  bodyFatPct,
}: {
  patient: Patient
  weightKg: number | null
  bodyFatPct: number | null
}) {
  const calc = useMemo(() => computeEnergy(p, weightKg, bodyFatPct), [p, weightKg, bodyFatPct])

  return (
    <section className="bg-cream-raised border border-border rounded-lg p-6 space-y-5">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="font-display text-2xl text-graphite leading-tight">
            Gasto energético <em className="italic text-sage">estimado</em>
          </h2>
          <p className="text-xs text-graphite-subtle mt-1.5 font-mono uppercase tracking-widest">
            {calc.usedKatchMcArdle ? 'Katch-McArdle (con % grasa)' : 'Mifflin-St Jeor'}
          </p>
        </div>
      </div>

      {!calc.canCompute ? (
        <div className="border border-dashed border-border rounded-md py-8 px-4 text-center">
          <p className="font-display italic text-xl text-graphite-muted">
            Faltan datos para estimar.
          </p>
          <ul className="text-sm text-graphite-subtle mt-2 space-y-0.5">
            {calc.missing.map(m => <li key={m}>· {m}</li>)}
          </ul>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Stat
              label="TMB / BMR"
              value={`${calc.bmr}`}
              unit="kcal"
              hint="Energía en reposo absoluto"
            />
            <Stat
              label={`TDEE (${calc.activityLabel})`}
              value={`${calc.tdee}`}
              unit="kcal/día"
              hint="Mantenimiento de peso"
              accent
            />
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-[11px] font-mono text-graphite-subtle uppercase tracking-widest">
              Sugerencias por objetivo
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Goal label="Reducción" range={`${calc.deficit.low}–${calc.deficit.high}`} delta="−15 a −20%" />
              <Goal label="Mantenimiento" range={`${calc.tdee}`} delta="100% TDEE" highlight />
              <Goal label="Aumento masa" range={`${calc.surplus.low}–${calc.surplus.high}`} delta="+10 a +15%" />
            </div>
          </div>

          <p className="text-xs text-graphite-subtle leading-relaxed pt-1">
            Estimación orientativa. Ajustar según adherencia, evolución antropométrica y tolerancia individual del paciente.
          </p>
        </>
      )}
    </section>
  )
}

// ─── Energy calc ─────────────────────────────────────────────────────────

function computeEnergy(p: Patient, weightKg: number | null, bodyFatPct: number | null) {
  const missing: string[] = []
  if (!weightKg) missing.push('peso (registrar una medición)')
  if (!p.height_cm) missing.push('estatura')
  if (!p.age) missing.push('edad')
  if (!p.sex || (p.sex !== 'M' && p.sex !== 'F')) missing.push('sexo (M o F)')
  if (!p.activity_level) missing.push('nivel de actividad')

  if (missing.length > 0 || !weightKg || !p.height_cm || !p.age || !p.activity_level) {
    return {
      canCompute: false as const,
      missing,
      usedKatchMcArdle: false,
      bmr: 0,
      tdee: 0,
      activityLabel: '',
      deficit: { low: 0, high: 0 },
      surplus: { low: 0, high: 0 },
    }
  }

  // Katch-McArdle si hay % grasa, si no Mifflin-St Jeor
  let bmr: number
  let usedKatchMcArdle = false
  if (bodyFatPct != null && bodyFatPct > 0 && bodyFatPct < 60) {
    const leanMassKg = weightKg * (1 - bodyFatPct / 100)
    bmr = 370 + 21.6 * leanMassKg
    usedKatchMcArdle = true
  } else {
    const sexOffset = p.sex === 'M' ? 5 : -161
    bmr = 10 * weightKg + 6.25 * p.height_cm - 5 * p.age + sexOffset
  }

  const factor = ACTIVITY_FACTOR[p.activity_level] ?? 1.2
  const tdee = bmr * factor
  const activityLabel = ACTIVITY_OPTIONS.find(o => o.value === p.activity_level)?.label.split(' ')[0] ?? ''

  return {
    canCompute: true as const,
    missing,
    usedKatchMcArdle,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    activityLabel,
    deficit: { low: Math.round(tdee * 0.80), high: Math.round(tdee * 0.85) },
    surplus: { low: Math.round(tdee * 1.10), high: Math.round(tdee * 1.15) },
  }
}

// ─── UI primitives ───────────────────────────────────────────────────────

function Field({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-mono text-graphite-subtle uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-sm text-graphite ${mono ? 'font-mono' : ''}`}>{value || <span className="text-graphite-subtle">—</span>}</p>
    </div>
  )
}

function FieldBlock({ label, value, highlight }: { label: string; value: string | null; highlight?: boolean }) {
  if (!value) return null
  return (
    <div>
      <p className="text-[11px] font-mono text-graphite-subtle uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-sm whitespace-pre-wrap ${highlight ? 'text-terracotta' : 'text-graphite-muted'}`}>{value}</p>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-graphite-muted mb-1.5">{children}</label>
}

function Input({
  type = 'text', value, onChange, placeholder, step,
}: {
  type?: string
  value: string | number
  onChange: (v: string) => void
  placeholder?: string
  step?: string
}) {
  return (
    <input
      type={type}
      step={step}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 bg-cream-raised border border-border-strong rounded-md text-sm text-graphite placeholder:text-graphite-subtle focus:outline-none focus:border-sage focus:ring-[3px] focus:ring-sage-bg transition-all"
    />
  )
}

function Select({
  value, onChange, children,
}: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 bg-cream-raised border border-border-strong rounded-md text-sm text-graphite focus:outline-none focus:border-sage focus:ring-[3px] focus:ring-sage-bg"
    >
      {children}
    </select>
  )
}

function Textarea({
  value, onChange, rows,
}: {
  value: string
  onChange: (v: string) => void
  rows: number
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      className="w-full px-3 py-2 bg-cream-raised border border-border-strong rounded-md text-sm text-graphite focus:outline-none focus:border-sage focus:ring-[3px] focus:ring-sage-bg resize-none"
    />
  )
}

function Stat({
  label, value, unit, hint, accent,
}: {
  label: string
  value: string
  unit: string
  hint: string
  accent?: boolean
}) {
  return (
    <div className={`rounded-md p-4 ${accent ? 'bg-sage-bg' : 'bg-cream-sunken'}`}>
      <p className="text-[11px] font-mono text-graphite-subtle uppercase tracking-widest">{label}</p>
      <p className={`font-display text-4xl mt-1 leading-none ${accent ? 'text-sage' : 'text-graphite'}`}>
        {value}
        <span className="text-base font-sans text-graphite-muted ml-1.5">{unit}</span>
      </p>
      <p className="text-xs text-graphite-muted mt-2">{hint}</p>
    </div>
  )
}

function Goal({
  label, range, delta, highlight,
}: {
  label: string
  range: string
  delta: string
  highlight?: boolean
}) {
  return (
    <div className={`rounded-md border px-3 py-2.5 ${highlight ? 'bg-sage-bg border-sage-light' : 'bg-cream-sunken border-border'}`}>
      <p className="text-[11px] font-mono text-graphite-muted uppercase tracking-widest">{label}</p>
      <p className={`font-mono text-sm mt-1 ${highlight ? 'text-sage' : 'text-graphite'}`}>{range} kcal</p>
      <p className="text-[11px] font-mono text-graphite-subtle mt-0.5">{delta}</p>
    </div>
  )
}
