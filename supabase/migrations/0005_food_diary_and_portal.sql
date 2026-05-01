-- ============================================================
-- sara_asistente — Diario alimentario + portal del paciente
-- ============================================================

BEGIN;

-- Tokens públicos para que el paciente acceda al portal sin login
CREATE TABLE patient_access_tokens (
  token            TEXT PRIMARY KEY,
  patient_id       UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  nutritionist_id  UUID NOT NULL REFERENCES nutritionists(id) ON DELETE CASCADE,
  expires_at       TIMESTAMPTZ,
  revoked_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at     TIMESTAMPTZ
);

CREATE INDEX idx_patient_access_tokens_patient_id
  ON patient_access_tokens(patient_id);

ALTER TABLE patient_access_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nutri_manages_own_tokens" ON patient_access_tokens
  FOR ALL USING (nutritionist_id = auth.uid())
  WITH CHECK (nutritionist_id = auth.uid());

-- Diario alimentario
CREATE TYPE meal_kind AS ENUM (
  'breakfast', 'snack_am', 'lunch', 'snack_pm', 'dinner', 'water', 'mood'
);

CREATE TABLE food_diary_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  nutritionist_id UUID NOT NULL REFERENCES nutritionists(id) ON DELETE CASCADE,
  entry_date      DATE NOT NULL,
  meal_kind       meal_kind NOT NULL,
  content         TEXT,
  amount_ml       INTEGER,
  mood_rating     SMALLINT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (patient_id, entry_date, meal_kind)
);

CREATE INDEX idx_food_diary_entries_patient_date
  ON food_diary_entries(patient_id, entry_date DESC);

ALTER TABLE food_diary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nutri_sees_diary" ON food_diary_entries
  FOR ALL USING (nutritionist_id = auth.uid())
  WITH CHECK (nutritionist_id = auth.uid());

CREATE TRIGGER trg_food_diary_entries_updated
  BEFORE UPDATE ON food_diary_entries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

COMMIT;
