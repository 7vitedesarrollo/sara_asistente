-- ============================================================
-- sara_asistente — Rebrand: médico → nutricionista
-- ============================================================
-- Renombra tablas, columnas, índices y políticas RLS al dominio
-- nutricional. Agrega tabla measurements y campos antropométricos.
-- Preserva todos los datos existentes (pre-MVP).
-- ============================================================

BEGIN;

-- ─── Drop trigger y función auto-perfil (se recrean abajo) ───
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ─── Drop políticas RLS viejas (tienen nombres con 'doctor') ──
DROP POLICY IF EXISTS "doctor_own_profile"       ON doctors;
DROP POLICY IF EXISTS "doctor_own_patients"      ON patients;
DROP POLICY IF EXISTS "doctor_own_visits"        ON visits;
DROP POLICY IF EXISTS "doctor_own_prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "doctor_own_exam_orders"   ON exam_orders;
DROP POLICY IF EXISTS "doctor_own_certificates"  ON medical_certificates;
DROP POLICY IF EXISTS "doctor_own_appointments"  ON appointments;

-- ─── Rename tablas ───────────────────────────────────────────
ALTER TABLE doctors              RENAME TO nutritionists;
ALTER TABLE visits               RENAME TO consultations;
ALTER TABLE prescriptions        RENAME TO meal_plans;
ALTER TABLE exam_orders          RENAME TO lab_references;
ALTER TABLE medical_certificates RENAME TO certificates;

-- ─── Rename columnas en nutritionists ─────────────────────────
ALTER TABLE nutritionists RENAME COLUMN specialty TO specialization;

-- ─── Rename columnas en consultations ─────────────────────────
ALTER TABLE consultations RENAME COLUMN diagnosis TO objective;
ALTER TABLE consultations RENAME COLUMN next_visit TO next_consultation;

-- ─── Rename columnas en meal_plans ────────────────────────────
ALTER TABLE meal_plans RENAME COLUMN medications TO summary;

-- ─── Rename columnas en lab_references ────────────────────────
ALTER TABLE lab_references RENAME COLUMN exams TO requested_labs;

-- ─── Rename doctor_id → nutritionist_id (todas las tablas) ────
ALTER TABLE patients       RENAME COLUMN doctor_id TO nutritionist_id;
ALTER TABLE consultations  RENAME COLUMN doctor_id TO nutritionist_id;
ALTER TABLE meal_plans     RENAME COLUMN doctor_id TO nutritionist_id;
ALTER TABLE lab_references RENAME COLUMN doctor_id TO nutritionist_id;
ALTER TABLE certificates   RENAME COLUMN doctor_id TO nutritionist_id;
ALTER TABLE appointments   RENAME COLUMN doctor_id TO nutritionist_id;

-- ─── Rename visit_id → consultation_id ────────────────────────
ALTER TABLE meal_plans     RENAME COLUMN visit_id TO consultation_id;
ALTER TABLE lab_references RENAME COLUMN visit_id TO consultation_id;
ALTER TABLE certificates   RENAME COLUMN visit_id TO consultation_id;

-- ─── Rename índices ───────────────────────────────────────────
ALTER INDEX idx_patients_doctor_id               RENAME TO idx_patients_nutritionist_id;
ALTER INDEX idx_visits_patient_id                RENAME TO idx_consultations_patient_id;
ALTER INDEX idx_visits_doctor_id                 RENAME TO idx_consultations_nutritionist_id;
ALTER INDEX idx_appointments_doctor_id_datetime  RENAME TO idx_appointments_nutritionist_id_datetime;
ALTER INDEX idx_prescriptions_patient_id         RENAME TO idx_meal_plans_patient_id;
ALTER INDEX idx_exam_orders_patient_id           RENAME TO idx_lab_references_patient_id;

-- ─── Campos nutricionales en patients ─────────────────────────
ALTER TABLE patients
  ADD COLUMN birth_date             DATE,
  ADD COLUMN height_cm              NUMERIC(5,1),
  ADD COLUMN activity_level         TEXT,
  ADD COLUMN dietary_restrictions   TEXT,
  ADD COLUMN allergies              TEXT,
  ADD COLUMN initial_goal           TEXT;

-- ─── Campos en consultations ──────────────────────────────────
ALTER TABLE consultations
  ADD COLUMN anthropometric_notes TEXT,
  ADD COLUMN adherence_notes      TEXT;

-- ─── Estructura de plan alimentario en meal_plans ─────────────
ALTER TABLE meal_plans
  ADD COLUMN structure        JSONB,
  ADD COLUMN daily_kcal       INTEGER,
  ADD COLUMN daily_protein_g  INTEGER,
  ADD COLUMN start_date       DATE,
  ADD COLUMN end_date         DATE;

-- ─── Nueva tabla: measurements (antropometría) ────────────────
CREATE TABLE measurements (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  nutritionist_id  UUID NOT NULL REFERENCES nutritionists(id) ON DELETE CASCADE,
  consultation_id  UUID REFERENCES consultations(id) ON DELETE SET NULL,
  measured_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  weight_kg        NUMERIC(5,2),
  body_fat_pct     NUMERIC(4,1),
  muscle_mass_kg   NUMERIC(5,2),
  waist_cm         NUMERIC(5,1),
  hip_cm           NUMERIC(5,1),
  bmi              NUMERIC(4,1),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_measurements_patient_id ON measurements(patient_id, measured_at DESC);
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;

-- ─── Políticas RLS nuevas ─────────────────────────────────────
CREATE POLICY "nutri_own_profile" ON nutritionists
  FOR ALL USING (id = auth.uid());

CREATE POLICY "nutri_own_patients" ON patients
  FOR ALL USING (nutritionist_id = auth.uid());

CREATE POLICY "nutri_own_consultations" ON consultations
  FOR ALL USING (nutritionist_id = auth.uid());

CREATE POLICY "nutri_own_meal_plans" ON meal_plans
  FOR ALL USING (nutritionist_id = auth.uid());

CREATE POLICY "nutri_own_lab_references" ON lab_references
  FOR ALL USING (nutritionist_id = auth.uid());

CREATE POLICY "nutri_own_certificates" ON certificates
  FOR ALL USING (nutritionist_id = auth.uid());

CREATE POLICY "nutri_own_appointments" ON appointments
  FOR ALL USING (nutritionist_id = auth.uid());

CREATE POLICY "nutri_own_measurements" ON measurements
  FOR ALL USING (nutritionist_id = auth.uid());

-- ─── Trigger auto-crear perfil de nutricionista ───────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.nutritionists (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMIT;
