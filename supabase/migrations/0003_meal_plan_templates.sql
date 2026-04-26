-- ============================================================
-- sara_asistente — Plantillas de plan alimentario
-- ============================================================
-- Tabla para que el nutricionista guarde plantillas reutilizables
-- (no vinculadas a un paciente). Se duplican dentro de meal_plans
-- al aplicarlas a un paciente concreto.
-- ============================================================

BEGIN;

CREATE TABLE meal_plan_templates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutritionist_id  UUID NOT NULL REFERENCES nutritionists(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  summary          TEXT,
  instructions     TEXT,
  structure        JSONB,
  daily_kcal       INTEGER,
  daily_protein_g  INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meal_plan_templates_nutritionist_id
  ON meal_plan_templates(nutritionist_id, created_at DESC);

ALTER TABLE meal_plan_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nutri_own_templates" ON meal_plan_templates
  FOR ALL USING (nutritionist_id = auth.uid())
  WITH CHECK (nutritionist_id = auth.uid());

-- Trigger para mantener updated_at sincronizado
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_meal_plan_templates_updated
  BEFORE UPDATE ON meal_plan_templates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

COMMIT;
