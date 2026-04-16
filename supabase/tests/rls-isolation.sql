-- ============================================================
-- pgTAP — Tests de aislamiento RLS
-- Correr: supabase test db
-- ============================================================
BEGIN;
SELECT plan(6);

-- Setup: doctor A y doctor B
INSERT INTO auth.users (id, email) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'doctora@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'doctorb@example.com');

INSERT INTO doctors (id, name, email) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Doctor A', 'doctora@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Doctor B', 'doctorb@example.com');

-- Paciente pertenece a Doctor B
INSERT INTO patients (id, doctor_id, name) VALUES
  ('cccccccc-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000002', 'Paciente de B');

-- Test 1: Doctor A autenticado NO puede ver pacientes de Doctor B
SET LOCAL role TO authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub": "aaaaaaaa-0000-0000-0000-000000000001"}';
SELECT is(
  (SELECT count(*)::int FROM patients WHERE doctor_id = 'bbbbbbbb-0000-0000-0000-000000000002'),
  0,
  'Doctor A no puede ver pacientes de Doctor B'
);

-- Test 2: Doctor B SÍ puede ver sus propios pacientes
SET LOCAL "request.jwt.claims" TO '{"sub": "bbbbbbbb-0000-0000-0000-000000000002"}';
SELECT is(
  (SELECT count(*)::int FROM patients),
  1,
  'Doctor B ve sus propios pacientes'
);

-- Test 3: Doctor A NO puede insertar paciente con doctor_id de B
SET LOCAL "request.jwt.claims" TO '{"sub": "aaaaaaaa-0000-0000-0000-000000000001"}';
SELECT throws_ok(
  $$INSERT INTO patients (doctor_id, name) VALUES ('bbbbbbbb-0000-0000-0000-000000000002', 'Hack')$$,
  'Doctor A no puede crear paciente con doctor_id de B'
);

-- Test 4: Doctor A puede ver solo su perfil
SELECT is(
  (SELECT count(*)::int FROM doctors),
  1,
  'Doctor A solo ve su propio perfil'
);

-- Test 5: Doctor A NO puede ver visitas de Doctor B
INSERT INTO visits (patient_id, doctor_id, notes)
VALUES ('cccccccc-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000002', 'Nota privada');

SET LOCAL "request.jwt.claims" TO '{"sub": "aaaaaaaa-0000-0000-0000-000000000001"}';
SELECT is(
  (SELECT count(*)::int FROM visits),
  0,
  'Doctor A no puede ver visitas de Doctor B'
);

-- Test 6: Doctor B ve sus visitas
SET LOCAL "request.jwt.claims" TO '{"sub": "bbbbbbbb-0000-0000-0000-000000000002"}';
SELECT is(
  (SELECT count(*)::int FROM visits),
  1,
  'Doctor B ve sus propias visitas'
);

SELECT * FROM finish();
ROLLBACK;
