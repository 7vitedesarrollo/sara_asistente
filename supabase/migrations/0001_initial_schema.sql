-- ============================================================
-- sara_asistente — Schema inicial + RLS
-- ============================================================

-- Enums
CREATE TYPE sex AS ENUM ('M', 'F', 'otro');
CREATE TYPE appointment_status AS ENUM ('programada', 'atendida', 'cancelada', 'no_asistio');

-- ─── Doctors ─────────────────────────────────────────────────
CREATE TABLE doctors (
  id          UUID PRIMARY KEY,              -- = auth.users.id
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  specialty   TEXT,
  phone       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Patients ────────────────────────────────────────────────
CREATE TABLE patients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id   UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  age         INTEGER,
  sex         sex,
  phone       TEXT,
  email       TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Visits (Atenciones) ─────────────────────────────────────
CREATE TABLE visits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id   UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  date        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes       TEXT,
  diagnosis   TEXT,
  next_visit  DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Prescriptions ───────────────────────────────────────────
CREATE TABLE prescriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id    UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  visit_id     UUID REFERENCES visits(id) ON DELETE SET NULL,
  medications  TEXT NOT NULL,
  instructions TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Exam Orders ─────────────────────────────────────────────
CREATE TABLE exam_orders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id   UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  visit_id    UUID REFERENCES visits(id) ON DELETE SET NULL,
  exams       TEXT NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Medical Certificates ────────────────────────────────────
CREATE TABLE medical_certificates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id   UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  visit_id    UUID REFERENCES visits(id) ON DELETE SET NULL,
  content     TEXT NOT NULL,
  issued_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Appointments ────────────────────────────────────────────
CREATE TABLE appointments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id   UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  datetime    TIMESTAMPTZ NOT NULL,
  reason      TEXT,
  status      appointment_status NOT NULL DEFAULT 'programada',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_patients_doctor_id ON patients(doctor_id);
CREATE INDEX idx_visits_patient_id ON visits(patient_id);
CREATE INDEX idx_visits_doctor_id ON visits(doctor_id);
CREATE INDEX idx_appointments_doctor_id_datetime ON appointments(doctor_id, datetime);
CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX idx_exam_orders_patient_id ON exam_orders(patient_id);

-- ============================================================
-- ROW LEVEL SECURITY — cada médico solo ve SUS datos
-- ============================================================

ALTER TABLE doctors              ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients             ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits               ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments         ENABLE ROW LEVEL SECURITY;

-- doctors: solo puedo ver/editar mi propio perfil
CREATE POLICY "doctor_own_profile" ON doctors
  FOR ALL USING (id = auth.uid());

-- patients: solo los pacientes de mi doctor_id
CREATE POLICY "doctor_own_patients" ON patients
  FOR ALL USING (doctor_id = auth.uid());

-- visits
CREATE POLICY "doctor_own_visits" ON visits
  FOR ALL USING (doctor_id = auth.uid());

-- prescriptions
CREATE POLICY "doctor_own_prescriptions" ON prescriptions
  FOR ALL USING (doctor_id = auth.uid());

-- exam_orders
CREATE POLICY "doctor_own_exam_orders" ON exam_orders
  FOR ALL USING (doctor_id = auth.uid());

-- medical_certificates
CREATE POLICY "doctor_own_certificates" ON medical_certificates
  FOR ALL USING (doctor_id = auth.uid());

-- appointments
CREATE POLICY "doctor_own_appointments" ON appointments
  FOR ALL USING (doctor_id = auth.uid());

-- ============================================================
-- AUTO-CREAR PERFIL DE DOCTOR AL REGISTRARSE
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.doctors (id, name, email)
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
