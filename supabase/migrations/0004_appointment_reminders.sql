-- ============================================================
-- sara_asistente — Recordatorios de citas (sidecar)
-- ============================================================
-- Tabla independiente de appointments. Registra envíos de
-- recordatorios (email / WhatsApp / SMS) para cada cita,
-- evita duplicados con UNIQUE (appointment_id, kind), y
-- permite auditar errores de envío.
-- ============================================================

BEGIN;

CREATE TYPE reminder_kind AS ENUM ('email', 'whatsapp', 'sms');
CREATE TYPE reminder_status AS ENUM ('sent', 'failed', 'logged');

CREATE TABLE appointment_reminders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id  UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  nutritionist_id UUID NOT NULL REFERENCES nutritionists(id) ON DELETE CASCADE,
  kind            reminder_kind NOT NULL,
  status          reminder_status NOT NULL,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recipient       TEXT,
  error_message   TEXT,

  UNIQUE (appointment_id, kind)
);

CREATE INDEX idx_reminders_nutritionist_id
  ON appointment_reminders(nutritionist_id, sent_at DESC);

ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nutri_own_reminders" ON appointment_reminders
  FOR ALL USING (nutritionist_id = auth.uid())
  WITH CHECK (nutritionist_id = auth.uid());

COMMIT;
