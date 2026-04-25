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
        <MeasurementTable measurements={measurements} />
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
      <div className="grid grid-cols-2 gap-4">
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
  // Reverse-pair to compute delta (since list is DESC, "next" item is the previous chronologically)
  return (
    <div className="bg-cream-raised border border-border rounded-lg overflow-hidden">
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
