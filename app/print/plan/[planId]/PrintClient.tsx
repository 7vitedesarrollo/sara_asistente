'use client'

import { useEffect } from 'react'

type DayMeals = {
  breakfast?: string
  snack_am?: string
  lunch?: string
  snack_pm?: string
  dinner?: string
}

type WeekStructure = {
  monday?: DayMeals
  tuesday?: DayMeals
  wednesday?: DayMeals
  thursday?: DayMeals
  friday?: DayMeals
  saturday?: DayMeals
  sunday?: DayMeals
}

const DAYS: { key: keyof WeekStructure; label: string }[] = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
]

const MEALS: { key: keyof DayMeals; label: string }[] = [
  { key: 'breakfast', label: 'Desayuno' },
  { key: 'snack_am', label: 'Media mañana' },
  { key: 'lunch', label: 'Almuerzo' },
  { key: 'snack_pm', label: 'Merienda' },
  { key: 'dinner', label: 'Cena' },
]

type Plan = {
  summary: string | null
  instructions: string | null
  structure: WeekStructure | null
  daily_kcal: number | null
  daily_protein_g: number | null
  start_date: string | null
  end_date: string | null
  created_at: string
}

type Patient = {
  name: string
  age: number | null
  sex: string | null
  height_cm: number | null
  initial_goal: string | null
  dietary_restrictions: string | null
  allergies: string | null
}

type Nutritionist = {
  name: string
  specialization: string | null
  email: string
} | null

export default function PrintClient({
  plan,
  patient,
  nutritionist,
}: {
  plan: Plan
  patient: Patient
  nutritionist: Nutritionist
}) {
  useEffect(() => {
    // Pequeño delay para que las fuentes (Instrument Serif + Geist) terminen de cargar
    const t = setTimeout(() => window.print(), 400)
    return () => clearTimeout(t)
  }, [])

  const issued = new Date(plan.created_at).toLocaleDateString('es', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const range = plan.start_date && plan.end_date
    ? `${formatDate(plan.start_date)} al ${formatDate(plan.end_date)}`
    : null

  return (
    <div className="print-doc">
      <style>{printCss}</style>

      {/* Toolbar (solo screen) */}
      <div className="print-toolbar">
        <button onClick={() => window.print()} className="toolbar-btn primary">
          Descargar / Imprimir PDF
        </button>
        <button onClick={() => window.history.back()} className="toolbar-btn">
          Volver
        </button>
      </div>

      {/* Encabezado */}
      <header className="header">
        <div className="logo-row">
          <span className="logomark">S</span>
          <div>
            <p className="brand">Sara</p>
            <p className="brand-sub">Asistente para nutricionistas clínicos</p>
          </div>
        </div>
        <div className="issue-info">
          <p className="issue-label">Plan emitido</p>
          <p className="issue-date">{issued}</p>
        </div>
      </header>

      <div className="divider" />

      {/* Datos del paciente + plan */}
      <section className="meta">
        <div>
          <p className="meta-label">Paciente</p>
          <p className="patient-name">{patient.name}</p>
          <p className="patient-detail">
            {[
              patient.age ? `${patient.age} años` : null,
              patient.sex === 'M' ? 'Masculino' : patient.sex === 'F' ? 'Femenino' : null,
              patient.height_cm ? `${patient.height_cm} cm` : null,
            ].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="targets">
          {range && (
            <div>
              <p className="meta-label">Vigencia</p>
              <p className="meta-value">{range}</p>
            </div>
          )}
          {plan.daily_kcal && (
            <div>
              <p className="meta-label">Energía diaria</p>
              <p className="meta-value mono">{plan.daily_kcal} kcal</p>
            </div>
          )}
          {plan.daily_protein_g && (
            <div>
              <p className="meta-label">Proteína</p>
              <p className="meta-value mono">{plan.daily_protein_g} g/día</p>
            </div>
          )}
        </div>
      </section>

      {plan.summary && (
        <section className="objective">
          <p className="meta-label">Objetivo</p>
          <p className="objective-text">{plan.summary}</p>
        </section>
      )}

      {(patient.dietary_restrictions || patient.allergies) && (
        <section className="restrictions">
          {patient.dietary_restrictions && (
            <div>
              <p className="meta-label">Restricciones</p>
              <p className="restriction-text">{patient.dietary_restrictions}</p>
            </div>
          )}
          {patient.allergies && (
            <div className="allergies">
              <p className="meta-label">Alergias</p>
              <p className="restriction-text">{patient.allergies}</p>
            </div>
          )}
        </section>
      )}

      {/* Grid semanal */}
      <section className="week-section">
        <h2 className="week-title">Plan alimentario semanal</h2>
        {plan.structure && Object.keys(plan.structure).length > 0 ? (
          <table className="week-table">
            <thead>
              <tr>
                <th></th>
                {MEALS.map(m => <th key={m.key}>{m.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {DAYS.map(d => (
                <tr key={d.key}>
                  <th className="day-cell">{d.label}</th>
                  {MEALS.map(m => (
                    <td key={`${d.key}-${m.key}`}>
                      {plan.structure?.[d.key]?.[m.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty-week">Plan sin estructura semanal detallada.</p>
        )}
      </section>

      {plan.instructions && (
        <section className="instructions">
          <h2 className="instructions-title">Instrucciones</h2>
          <p className="instructions-text">{plan.instructions}</p>
        </section>
      )}

      {/* Firma */}
      <footer className="signature">
        <div className="signature-line"></div>
        <p className="signature-name">{nutritionist?.name ?? '—'}</p>
        <p className="signature-detail">
          {nutritionist?.specialization ?? 'Nutricionista clínico'}
          {nutritionist?.email ? ` · ${nutritionist.email}` : ''}
        </p>
        <p className="signature-disclaimer">
          Plan orientativo emitido en consulta. No reemplaza criterio médico para condiciones clínicas concomitantes.
        </p>
      </footer>
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
}

const printCss = `
  /* Reset light + paleta del documento */
  .print-doc {
    --doc-bg: #FFFFFF;
    --doc-fg: #1A1F1C;
    --doc-muted: #5C615D;
    --doc-subtle: #8C918D;
    --doc-border: #D4D4CE;
    --doc-sage: #4A7C59;
    --doc-sage-bg: #EDF2EE;
    --doc-terracotta: #B5533F;

    background: var(--doc-bg);
    color: var(--doc-fg);
    font-family: var(--font-geist-sans), 'Helvetica', sans-serif;
    font-feature-settings: 'tnum' 1;
    max-width: 800px;
    margin: 0 auto;
    padding: 56px 64px 80px;
    min-height: 100vh;
    line-height: 1.5;
  }

  .print-doc * { box-sizing: border-box; }

  /* Toolbar (screen only) */
  .print-toolbar {
    position: fixed;
    top: 16px;
    right: 16px;
    display: flex;
    gap: 8px;
    z-index: 100;
  }
  .toolbar-btn {
    font-family: inherit;
    font-size: 13px;
    padding: 8px 14px;
    border-radius: 8px;
    border: 1px solid var(--doc-border);
    background: var(--doc-bg);
    color: var(--doc-muted);
    cursor: pointer;
  }
  .toolbar-btn.primary {
    background: var(--doc-sage);
    color: white;
    border-color: var(--doc-sage);
    font-weight: 500;
  }
  .toolbar-btn:hover { opacity: 0.9; }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
  }
  .logo-row { display: flex; align-items: center; gap: 12px; }
  .logomark {
    display: inline-grid;
    place-items: center;
    width: 32px; height: 32px;
    background: var(--doc-sage);
    color: white;
    border-radius: 6px;
    font-family: var(--font-instrument-serif), Georgia, serif;
    font-style: italic;
    font-size: 19px;
    line-height: 1;
  }
  .brand {
    font-family: var(--font-instrument-serif), Georgia, serif;
    font-size: 28px;
    line-height: 1;
    color: var(--doc-fg);
    margin: 0;
    font-weight: 400;
  }
  .brand-sub {
    font-size: 11px;
    color: var(--doc-subtle);
    margin: 4px 0 0;
  }
  .issue-info { text-align: right; }
  .issue-label {
    font-family: var(--font-geist-mono), monospace;
    font-size: 10px;
    color: var(--doc-subtle);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin: 0 0 4px;
  }
  .issue-date {
    font-size: 13px;
    color: var(--doc-fg);
    margin: 0;
  }

  .divider {
    height: 1px;
    background: var(--doc-border);
    margin: 0 0 28px;
  }

  /* Meta paciente */
  .meta {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 32px;
    margin-bottom: 24px;
    align-items: start;
  }
  .meta-label {
    font-family: var(--font-geist-mono), monospace;
    font-size: 10px;
    color: var(--doc-subtle);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin: 0 0 4px;
  }
  .patient-name {
    font-family: var(--font-instrument-serif), Georgia, serif;
    font-size: 28px;
    color: var(--doc-fg);
    margin: 0;
    line-height: 1.1;
    font-weight: 400;
  }
  .patient-detail {
    font-size: 12px;
    color: var(--doc-muted);
    margin: 4px 0 0;
  }
  .targets { display: grid; gap: 12px; text-align: right; }
  .targets > div { min-width: 120px; }
  .meta-value {
    font-size: 13px;
    color: var(--doc-fg);
    margin: 0;
  }
  .mono { font-family: var(--font-geist-mono), monospace; }

  .objective {
    background: var(--doc-sage-bg);
    border-left: 2px solid var(--doc-sage);
    padding: 12px 16px;
    margin-bottom: 20px;
  }
  .objective-text {
    font-family: var(--font-instrument-serif), Georgia, serif;
    font-size: 18px;
    color: var(--doc-fg);
    margin: 4px 0 0;
    line-height: 1.3;
    font-style: italic;
  }

  .restrictions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    padding: 12px 0 16px;
    border-top: 1px solid var(--doc-border);
    border-bottom: 1px solid var(--doc-border);
    margin-bottom: 24px;
  }
  .restriction-text {
    font-size: 13px;
    color: var(--doc-fg);
    margin: 4px 0 0;
  }
  .allergies .restriction-text { color: var(--doc-terracotta); }

  /* Tabla semanal */
  .week-section { margin-bottom: 24px; }
  .week-title {
    font-family: var(--font-instrument-serif), Georgia, serif;
    font-size: 22px;
    color: var(--doc-fg);
    margin: 0 0 12px;
    font-weight: 400;
  }
  .week-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 11px;
  }
  .week-table th, .week-table td {
    border: 1px solid var(--doc-border);
    padding: 8px 10px;
    text-align: left;
    vertical-align: top;
  }
  .week-table thead th {
    background: var(--doc-sage-bg);
    font-family: var(--font-geist-mono), monospace;
    font-size: 9px;
    color: var(--doc-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 500;
  }
  .week-table .day-cell {
    background: #F4F4EF;
    font-family: var(--font-instrument-serif), Georgia, serif;
    font-size: 13px;
    color: var(--doc-fg);
    width: 90px;
    font-weight: 400;
    font-style: italic;
  }
  .week-table tbody td {
    color: var(--doc-fg);
    line-height: 1.35;
    word-break: break-word;
  }
  .empty-week {
    padding: 24px;
    text-align: center;
    color: var(--doc-muted);
    font-style: italic;
    border: 1px dashed var(--doc-border);
  }

  /* Instrucciones */
  .instructions { margin-bottom: 32px; }
  .instructions-title {
    font-family: var(--font-instrument-serif), Georgia, serif;
    font-size: 18px;
    color: var(--doc-fg);
    margin: 0 0 8px;
    font-weight: 400;
  }
  .instructions-text {
    font-size: 13px;
    color: var(--doc-fg);
    margin: 0;
    line-height: 1.6;
    white-space: pre-wrap;
  }

  /* Firma */
  .signature {
    margin-top: 56px;
    padding-top: 16px;
  }
  .signature-line {
    width: 240px;
    height: 1px;
    background: var(--doc-fg);
    margin-bottom: 6px;
  }
  .signature-name {
    font-family: var(--font-instrument-serif), Georgia, serif;
    font-size: 17px;
    color: var(--doc-fg);
    margin: 0;
    font-weight: 400;
  }
  .signature-detail {
    font-size: 11px;
    color: var(--doc-muted);
    margin: 2px 0 0;
  }
  .signature-disclaimer {
    margin-top: 18px;
    font-size: 10px;
    color: var(--doc-subtle);
    line-height: 1.5;
    max-width: 480px;
  }

  /* Print */
  @media print {
    @page {
      size: A4;
      margin: 14mm 16mm;
    }
    body { background: white !important; }
    .print-toolbar { display: none !important; }
    .print-doc {
      max-width: none;
      padding: 0;
      min-height: auto;
    }
    .week-table { page-break-inside: avoid; }
    .signature { page-break-inside: avoid; }
  }
`
