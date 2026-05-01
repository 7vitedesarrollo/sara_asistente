'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import DOMPurify from 'isomorphic-dompurify'

type Measurement = {
  id: string
  measured_at: string
  weight_kg: number | null
  body_fat_pct: number | null
  muscle_mass_kg: number | null
  waist_cm: number | null
  hip_cm: number | null
  bmi: number | null
  notes: string | null
}

type Props = {
  measurements: Measurement[]
  patientId: string
  patientName: string
  patientHeightCm: number | null
  nutritionistId: string
}

export default function MeasurementsClient({
  measurements: initial,
  patientId,
  patientName,
  patientHeightCm,
  nutritionistId,
}: Props) {
  const supabase = createClient()
  const [measurements, setMeasurements] = useState<Measurement[]>(initial)
  const [showForm, setShowForm] = useState(false)

  async function handleSave(payload: Omit<Measurement, 'id' | 'measured_at'>) {
    const optimistic: Measurement = {
      id: crypto.randomUUID(),
      measured_at: new Date().toISOString(),
      ...payload,
    }
    setMeasurements(prev => [optimistic, ...prev])
    setShowForm(false)

    const { error, data } = await supabase
      .from('measurements')
      .insert({
        patient_id: patientId,
        nutritionist_id: nutritionistId,
        weight_kg: payload.weight_kg,
        body_fat_pct: payload.body_fat_pct,
        muscle_mass_kg: payload.muscle_mass_kg,
        waist_cm: payload.waist_cm,
        hip_cm: payload.hip_cm,
        bmi: payload.bmi,
        notes: payload.notes,
      })
      .select()
      .single()

    if (error) {
      toast.error('Error al guardar la medición. Reintenta.')
      setMeasurements(prev => prev.filter(m => m.id !== optimistic.id))
    } else {
      setMeasurements(prev => prev.map(m => m.id === optimistic.id ? { ...m, id: data.id, measured_at: data.measured_at } : m))
      toast.success('Medición guardada')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between pb-2">
        <div>
          <h2 className="font-display text-2xl text-graphite leading-tight">Mediciones</h2>
          <p className="text-sm text-graphite-muted mt-1">
            {measurements.length === 0
              ? 'Aún no hay mediciones registradas.'
              : `${measurements.length} registro${measurements.length > 1 ? 's' : ''} antropométrico${measurements.length > 1 ? 's' : ''} de ${patientName}.`}
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-sage text-white text-sm px-4 py-2 rounded-md hover:bg-[#3D6A4A] transition-colors font-medium"
          >
            Nueva medición
          </button>
        )}
      </div>

      {showForm && (
        <MeasurementForm
          patientHeightCm={patientHeightCm}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}

      {measurements.length === 0 && !showForm ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <p className="font-display italic text-2xl text-graphite-muted">
            Sin antropometría registrada.
          </p>
          <p className="text-sm text-graphite-subtle mt-2">
            Registra la primera medición para ver evolución a lo largo del tiempo.
          </p>
        </div>
      ) : (
        <>
          <EvolutionChart measurements={measurements} />
          <MeasurementTable measurements={measurements} />
        </>
      )}
    </div>
  )
}

// ─── Form ────────────────────────────────────────────────────────────────

function MeasurementForm({
  patientHeightCm,
  onSave,
  onCancel,
}: {
  patientHeightCm: number | null
  onSave: (data: Omit<Measurement, 'id' | 'measured_at'>) => void
  onCancel: () => void
}) {
  const [weight, setWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [muscleMass, setMuscleMass] = useState('')
  const [waist, setWaist] = useState('')
  const [hip, setHip] = useState('')
  const [notes, setNotes] = useState('')

  const weightNum = weight ? parseFloat(weight) : null
  const computedBmi = (weightNum && patientHeightCm)
    ? Number((weightNum / Math.pow(patientHeightCm / 100, 2)).toFixed(1))
    : null

  function submit() {
    if (!weight) {
      toast.error('El peso es obligatorio.')
      return
    }
    onSave({
      weight_kg: weightNum,
      body_fat_pct: bodyFat ? parseFloat(bodyFat) : null,
      muscle_mass_kg: muscleMass ? parseFloat(muscleMass) : null,
      waist_cm: waist ? parseFloat(waist) : null,
      hip_cm: hip ? parseFloat(hip) : null,
      bmi: computedBmi,
      notes: notes ? DOMPurify.sanitize(notes) : null,
    })
  }

  return (
    <div className="bg-cream-raised border border-border rounded-lg p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Peso" unit="kg" value={weight} onChange={setWeight} type="number" step="0.1" required />
        <Field label="% Grasa corporal" unit="%" value={bodyFat} onChange={setBodyFat} type="number" step="0.1" />
        <Field label="Masa muscular" unit="kg" value={muscleMass} onChange={setMuscleMass} type="number" step="0.1" />
        <Field label="Cintura" unit="cm" value={waist} onChange={setWaist} type="number" step="0.1" />
        <Field label="Cadera" unit="cm" value={hip} onChange={setHip} type="number" step="0.1" />
        <div>
          <label className="block text-xs font-medium text-graphite-muted mb-2">
            IMC <span className="font-mono text-graphite-subtle">(auto)</span>
          </label>
          <div className="px-3 py-2 bg-cream-sunken border border-border rounded-md text-sm font-mono text-graphite">
            {computedBmi ?? (patientHeightCm ? '—' : 'sin estatura registrada')}
          </div>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-graphite-muted mb-2">
          Notas <span className="text-graphite-subtle">(opcional)</span>
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="Pliegue cutáneo, hidratación, condiciones de la medición…"
          className="w-full px-3 py-2 bg-cream-raised border border-border-strong rounded-md text-sm text-graphite placeholder:text-graphite-subtle focus:outline-none focus:border-sage focus:ring-[3px] focus:ring-sage-bg resize-none"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
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
          Guardar medición
        </button>
      </div>
    </div>
  )
}

function Field({
  label, unit, value, onChange, type = 'text', step, required,
}: {
  label: string
  unit?: string
  value: string
  onChange: (v: string) => void
  type?: string
  step?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-graphite-muted mb-2">
        {label}
        {unit && <span className="ml-1 font-mono text-graphite-subtle">{unit}</span>}
        {required && <span className="text-terracotta ml-0.5">*</span>}
      </label>
      <input
        type={type}
        step={step}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-cream-raised border border-border-strong rounded-md text-sm text-graphite focus:outline-none focus:border-sage focus:ring-[3px] focus:ring-sage-bg transition-all font-mono"
      />
    </div>
  )
}

// ─── Table ───────────────────────────────────────────────────────────────

function MeasurementTable({ measurements }: { measurements: Measurement[] }) {
  return (
    <>
      {/* Desktop: tabla densa */}
      <div className="hidden md:block bg-cream-raised border border-border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 gap-2 px-4 py-3 border-b border-border bg-cream-sunken text-[11px] font-mono text-graphite-subtle uppercase tracking-widest">
          <div>Fecha</div>
          <div className="text-right">Peso</div>
          <div className="text-right">% Grasa</div>
          <div className="text-right">M. Muscular</div>
          <div className="text-right">Cintura</div>
          <div className="text-right">Cadera</div>
          <div className="text-right">IMC</div>
        </div>
        {measurements.map((m, idx) => {
          const prev = measurements[idx + 1]
          const date = new Date(m.measured_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
          return (
            <div key={m.id} className="grid grid-cols-7 gap-2 px-4 py-3 border-b border-border last:border-0 text-sm hover:bg-cream-sunken transition-colors">
              <div className="font-mono text-graphite-muted">{date}</div>
              <Cell value={m.weight_kg} unit="kg" prev={prev?.weight_kg ?? null} betterIsLower />
              <Cell value={m.body_fat_pct} unit="%" prev={prev?.body_fat_pct ?? null} betterIsLower />
              <Cell value={m.muscle_mass_kg} unit="kg" prev={prev?.muscle_mass_kg ?? null} betterIsLower={false} />
              <Cell value={m.waist_cm} unit="cm" prev={prev?.waist_cm ?? null} betterIsLower />
              <Cell value={m.hip_cm} unit="cm" prev={prev?.hip_cm ?? null} betterIsLower />
              <Cell value={m.bmi} unit="" prev={prev?.bmi ?? null} betterIsLower />
            </div>
          )
        })}
      </div>

      {/* Mobile: card-list */}
      <div className="md:hidden space-y-3">
        {measurements.map((m, idx) => {
          const prev = measurements[idx + 1]
          const date = new Date(m.measured_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
          const fields: { label: string; value: number | null; unit: string; betterIsLower: boolean; prev: number | null }[] = [
            { label: 'Peso', value: m.weight_kg, unit: 'kg', betterIsLower: true, prev: prev?.weight_kg ?? null },
            { label: '% Grasa', value: m.body_fat_pct, unit: '%', betterIsLower: true, prev: prev?.body_fat_pct ?? null },
            { label: 'M. Muscular', value: m.muscle_mass_kg, unit: 'kg', betterIsLower: false, prev: prev?.muscle_mass_kg ?? null },
            { label: 'Cintura', value: m.waist_cm, unit: 'cm', betterIsLower: true, prev: prev?.waist_cm ?? null },
            { label: 'Cadera', value: m.hip_cm, unit: 'cm', betterIsLower: true, prev: prev?.hip_cm ?? null },
            { label: 'IMC', value: m.bmi, unit: '', betterIsLower: true, prev: prev?.bmi ?? null },
          ]
          return (
            <div key={m.id} className="bg-cream-raised border border-border rounded-lg p-4">
              <p className="text-[11px] font-mono text-graphite-subtle uppercase tracking-widest mb-3">{date}</p>
              <div className="grid grid-cols-2 gap-3">
                {fields.filter(f => f.value != null).map(f => (
                  <div key={f.label}>
                    <p className="text-[11px] font-mono text-graphite-subtle uppercase tracking-widest">{f.label}</p>
                    <Cell value={f.value} unit={f.unit} prev={f.prev} betterIsLower={f.betterIsLower} />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

function Cell({
  value, unit, prev, betterIsLower,
}: {
  value: number | null
  unit: string
  prev: number | null
  betterIsLower: boolean
}) {
  if (value == null) return <div className="text-right text-graphite-subtle font-mono">—</div>
  const delta = prev != null ? Number((value - prev).toFixed(1)) : null
  const goodDirection = delta == null ? null : (betterIsLower ? delta < 0 : delta > 0)
  const deltaColor = delta == null ? '' : goodDirection ? 'text-sage-light' : 'text-amber'
  const sign = delta != null && delta > 0 ? '+' : ''
  return (
    <div className="text-right">
      <div className="font-mono text-graphite tabular-nums">
        {value.toFixed(unit === '%' || unit === '' ? 1 : 2)}
        {unit && <span className="text-graphite-subtle ml-0.5">{unit}</span>}
      </div>
      {delta != null && delta !== 0 && (
        <div className={`text-[11px] font-mono ${deltaColor}`}>
          {sign}{delta}
        </div>
      )}
    </div>
  )
}

// ─── Evolution Chart (SVG) ───────────────────────────────────────────────

type MetricKey = 'weight_kg' | 'body_fat_pct' | 'bmi' | 'waist_cm'

const METRICS: { key: MetricKey; label: string; unit: string; betterIsLower: boolean }[] = [
  { key: 'weight_kg', label: 'Peso', unit: 'kg', betterIsLower: true },
  { key: 'body_fat_pct', label: '% Grasa', unit: '%', betterIsLower: true },
  { key: 'bmi', label: 'IMC', unit: '', betterIsLower: true },
  { key: 'waist_cm', label: 'Cintura', unit: 'cm', betterIsLower: true },
]

function EvolutionChart({ measurements }: { measurements: Measurement[] }) {
  const [metricKey, setMetricKey] = useState<MetricKey>('weight_kg')
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  // chronological ASC for the chart (input is DESC)
  const points = [...measurements]
    .reverse()
    .map(m => ({ id: m.id, t: new Date(m.measured_at).getTime(), v: m[metricKey], date: m.measured_at }))
    .filter((p): p is { id: string; t: number; v: number; date: string } => p.v != null)

  const metric = METRICS.find(m => m.key === metricKey)!

  // Count availability per metric for pill disabled state
  const availability = METRICS.reduce((acc, m) => {
    acc[m.key] = measurements.filter(x => x[m.key] != null).length
    return acc
  }, {} as Record<MetricKey, number>)

  const W = 800
  const H = 280
  const PAD = { top: 24, right: 24, bottom: 36, left: 56 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  if (points.length < 2) {
    return (
      <div className="bg-cream-raised border border-border rounded-lg p-5">
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="font-display text-xl text-graphite">Evolución</h3>
          <MetricPills value={metricKey} onChange={setMetricKey} availability={availability} />
        </div>
        <div className="h-48 flex items-center justify-center border border-dashed border-border rounded-md">
          <p className="font-display italic text-lg text-graphite-muted text-center">
            {points.length === 0
              ? `Aún no hay datos de ${metric.label.toLowerCase()}.`
              : 'Registra al menos una medición más para ver la evolución.'}
          </p>
        </div>
      </div>
    )
  }

  const tMin = points[0].t
  const tMax = points[points.length - 1].t
  const tRange = tMax - tMin || 1

  const vMin = Math.min(...points.map(p => p.v))
  const vMax = Math.max(...points.map(p => p.v))
  const vPad = (vMax - vMin) * 0.15 || 1
  const yMin = Math.max(0, vMin - vPad)
  const yMax = vMax + vPad
  const yRange = yMax - yMin

  const xScale = (t: number) => PAD.left + ((t - tMin) / tRange) * chartW
  const yScale = (v: number) => PAD.top + (1 - (v - yMin) / yRange) * chartH

  // Y ticks (4)
  const yTicks = [0, 1, 2, 3].map(i => yMin + (yRange / 3) * i)
  // X ticks: show first, middle, last (or all if <=4 points)
  const xTickIndices = points.length <= 4
    ? points.map((_, i) => i)
    : [0, Math.floor(points.length / 3), Math.floor(2 * points.length / 3), points.length - 1]

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.t).toFixed(2)} ${yScale(p.v).toFixed(2)}`).join(' ')

  // Trend total
  const total = points[points.length - 1].v - points[0].v
  const totalGood = metric.betterIsLower ? total < 0 : total > 0
  const trendColor = total === 0 ? 'text-graphite-muted' : totalGood ? 'text-sage-light' : 'text-amber'
  const trendSign = total > 0 ? '+' : ''

  const hovered = hoveredIdx != null ? points[hoveredIdx] : null

  return (
    <div className="bg-cream-raised border border-border rounded-lg p-5">
      <div className="flex items-baseline justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h3 className="font-display text-xl text-graphite leading-tight">Evolución de <em className="italic text-sage">{metric.label.toLowerCase()}</em></h3>
          <p className="text-xs text-graphite-subtle font-mono uppercase tracking-widest mt-1">
            {points.length} mediciones · {formatRange(points[0].date, points[points.length - 1].date)}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`font-mono text-sm ${trendColor}`}>
            {trendSign}{total.toFixed(metric.unit === '%' || metric.unit === '' ? 1 : 2)} {metric.unit}
            <span className="text-graphite-subtle text-xs ml-1.5">total</span>
          </div>
          <MetricPills value={metricKey} onChange={setMetricKey} availability={availability} />
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none">
          {/* Grid horizontal */}
          {yTicks.map((tick, i) => (
            <line
              key={i}
              x1={PAD.left} x2={W - PAD.right}
              y1={yScale(tick)} y2={yScale(tick)}
              stroke="var(--border)" strokeWidth="1"
              strokeDasharray={i === 0 ? '0' : '2 4'}
            />
          ))}

          {/* Y axis labels */}
          {yTicks.map((tick, i) => (
            <text
              key={i}
              x={PAD.left - 8} y={yScale(tick) + 4}
              textAnchor="end"
              className="fill-graphite-subtle"
              fontSize="11"
              fontFamily="var(--font-geist-mono), monospace"
            >
              {tick.toFixed(metric.unit === '%' || metric.unit === '' ? 1 : 1)}
            </text>
          ))}

          {/* X axis labels */}
          {xTickIndices.map(i => {
            const p = points[i]
            return (
              <text
                key={p.id}
                x={xScale(p.t)} y={H - PAD.bottom + 18}
                textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
                className="fill-graphite-subtle"
                fontSize="11"
                fontFamily="var(--font-geist-mono), monospace"
              >
                {new Date(p.date).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
              </text>
            )
          })}

          {/* Línea (sage) */}
          <path d={path} fill="none" stroke="var(--sage)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Dots interactivos */}
          {points.map((p, i) => (
            <g key={p.id}>
              {/* Hit area invisible más grande para hover */}
              <circle
                cx={xScale(p.t)} cy={yScale(p.v)} r="14"
                fill="transparent"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              />
              <circle
                cx={xScale(p.t)} cy={yScale(p.v)}
                r={hoveredIdx === i ? 6 : 4}
                fill={hoveredIdx === i ? 'var(--sage)' : 'var(--cream)'}
                stroke="var(--sage)" strokeWidth="2"
                style={{ pointerEvents: 'none', transition: 'r 120ms' }}
              />
            </g>
          ))}
        </svg>

        {/* Tooltip */}
        {hovered && (
          <div
            className="absolute pointer-events-none bg-graphite text-cream rounded-md px-3 py-2 text-xs shadow-lg whitespace-nowrap"
            style={{
              left: `${(xScale(hovered.t) / W) * 100}%`,
              top: `${(yScale(hovered.v) / H) * 100}%`,
              transform: 'translate(-50%, calc(-100% - 12px))',
            }}
          >
            <div className="font-mono">
              {hovered.v.toFixed(metric.unit === '%' || metric.unit === '' ? 1 : 2)}
              <span className="text-graphite-subtle ml-1">{metric.unit}</span>
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-graphite-subtle mt-0.5">
              {new Date(hovered.date).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MetricPills({
  value, onChange, availability,
}: {
  value: MetricKey
  onChange: (v: MetricKey) => void
  availability: Record<MetricKey, number>
}) {
  return (
    <div className="flex gap-1 bg-cream-sunken rounded-full p-1">
      {METRICS.map(m => {
        const disabled = availability[m.key] === 0
        const active = value === m.key
        return (
          <button
            key={m.key}
            disabled={disabled}
            onClick={() => onChange(m.key)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              active
                ? 'bg-sage text-white'
                : disabled
                  ? 'text-graphite-subtle cursor-not-allowed opacity-50'
                  : 'text-graphite-muted hover:text-graphite hover:bg-cream-raised'
            }`}
          >
            {m.label}
          </button>
        )
      })}
    </div>
  )
}

function formatRange(startIso: string, endIso: string): string {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'el mismo día'
  if (days < 14) return `${days} días`
  if (days < 60) return `${Math.round(days / 7)} semanas`
  return `${Math.round(days / 30)} meses`
}
