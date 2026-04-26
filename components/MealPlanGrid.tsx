'use client'

export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
export type MealKey = 'breakfast' | 'snack_am' | 'lunch' | 'snack_pm' | 'dinner'
export type DayMeals = Partial<Record<MealKey, string>>
export type WeekStructure = Partial<Record<DayKey, DayMeals>>

export const DAYS: { key: DayKey; label: string }[] = [
  { key: 'monday', label: 'Lun' },
  { key: 'tuesday', label: 'Mar' },
  { key: 'wednesday', label: 'Mié' },
  { key: 'thursday', label: 'Jue' },
  { key: 'friday', label: 'Vie' },
  { key: 'saturday', label: 'Sáb' },
  { key: 'sunday', label: 'Dom' },
]

export const MEALS: { key: MealKey; label: string }[] = [
  { key: 'breakfast', label: 'Desayuno' },
  { key: 'snack_am', label: 'Media mañana' },
  { key: 'lunch', label: 'Almuerzo' },
  { key: 'snack_pm', label: 'Merienda' },
  { key: 'dinner', label: 'Cena' },
]

export function MealPlanGridEditor({
  structure,
  onChange,
}: {
  structure: WeekStructure
  onChange: (next: WeekStructure) => void
}) {
  function setMeal(day: DayKey, meal: MealKey, value: string) {
    onChange({ ...structure, [day]: { ...structure[day], [meal]: value } })
  }

  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <div className="min-w-[900px] grid grid-cols-[140px_repeat(7,minmax(120px,1fr))] gap-px bg-border rounded-md overflow-hidden border border-border">
        <div className="bg-cream-sunken px-3 py-2.5"></div>
        {DAYS.map(d => (
          <div key={d.key} className="bg-cream-sunken px-3 py-2.5 text-[11px] font-mono text-graphite-muted uppercase tracking-widest text-center">
            {d.label}
          </div>
        ))}

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
  )
}

export function MealPlanGridReadOnly({ structure }: { structure: WeekStructure }) {
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <div className="min-w-[900px] grid grid-cols-[120px_repeat(7,minmax(110px,1fr))] gap-px bg-border rounded-md overflow-hidden border border-border">
        <div className="bg-cream-sunken px-3 py-2"></div>
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
                {structure?.[d.key]?.[meal.key] ?? <span className="text-graphite-subtle">—</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
