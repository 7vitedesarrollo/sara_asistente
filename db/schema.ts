import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  date,
  pgEnum,
} from 'drizzle-orm/pg-core'

// ─── Enums ───────────────────────────────────────────────────────────────────

export const sexEnum = pgEnum('sex', ['M', 'F', 'otro'])
export const appointmentStatusEnum = pgEnum('appointment_status', [
  'programada',
  'atendida',
  'cancelada',
  'no_asistio',
])
export const userRoleEnum = pgEnum('user_role', ['admin', 'doctor'])

// ─── Doctors ─────────────────────────────────────────────────────────────────
// Sincronizado con auth.users de Supabase (1:1)

export const doctors = pgTable('doctors', {
  id: uuid('id').primaryKey(), // = auth.users.id
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  specialty: text('specialty'),
  phone: text('phone'),
  role: userRoleEnum('role').default('doctor').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ─── Patients ─────────────────────────────────────────────────────────────────

export const patients = pgTable('patients', {
  id: uuid('id').primaryKey().defaultRandom(),
  doctorId: uuid('doctor_id')
    .notNull()
    .references(() => doctors.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  age: integer('age'),
  sex: sexEnum('sex'),
  phone: text('phone'),
  email: text('email'),
  notes: text('notes'), // notas generales del médico
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ─── Visits (Atenciones) ──────────────────────────────────────────────────────

export const visits = pgTable('visits', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id')
    .notNull()
    .references(() => patients.id, { onDelete: 'cascade' }),
  doctorId: uuid('doctor_id')
    .notNull()
    .references(() => doctors.id, { onDelete: 'cascade' }),
  date: timestamp('date', { withTimezone: true }).defaultNow().notNull(),
  notes: text('notes'),
  diagnosis: text('diagnosis'),
  nextVisit: date('next_visit'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ─── Prescriptions ────────────────────────────────────────────────────────────

export const prescriptions = pgTable('prescriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id')
    .notNull()
    .references(() => patients.id, { onDelete: 'cascade' }),
  doctorId: uuid('doctor_id')
    .notNull()
    .references(() => doctors.id, { onDelete: 'cascade' }),
  visitId: uuid('visit_id').references(() => visits.id, { onDelete: 'set null' }),
  medications: text('medications').notNull(), // texto libre: "Amoxicilina 500mg c/8h x 7 días"
  instructions: text('instructions'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ─── Exam Orders ──────────────────────────────────────────────────────────────

export const examOrders = pgTable('exam_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id')
    .notNull()
    .references(() => patients.id, { onDelete: 'cascade' }),
  doctorId: uuid('doctor_id')
    .notNull()
    .references(() => doctors.id, { onDelete: 'cascade' }),
  visitId: uuid('visit_id').references(() => visits.id, { onDelete: 'set null' }),
  exams: text('exams').notNull(), // "BHC, QS, RxTórax"
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ─── Medical Certificates ─────────────────────────────────────────────────────

export const medicalCertificates = pgTable('medical_certificates', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id')
    .notNull()
    .references(() => patients.id, { onDelete: 'cascade' }),
  doctorId: uuid('doctor_id')
    .notNull()
    .references(() => doctors.id, { onDelete: 'cascade' }),
  visitId: uuid('visit_id').references(() => visits.id, { onDelete: 'set null' }),
  content: text('content').notNull(),
  issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow().notNull(),
})

// ─── Appointments ─────────────────────────────────────────────────────────────

export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id')
    .notNull()
    .references(() => patients.id, { onDelete: 'cascade' }),
  doctorId: uuid('doctor_id')
    .notNull()
    .references(() => doctors.id, { onDelete: 'cascade' }),
  datetime: timestamp('datetime', { withTimezone: true }).notNull(),
  reason: text('reason'),
  status: appointmentStatusEnum('status').default('programada').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ─── Types ────────────────────────────────────────────────────────────────────

export type Doctor = typeof doctors.$inferSelect
export type Patient = typeof patients.$inferSelect
export type Visit = typeof visits.$inferSelect
export type Prescription = typeof prescriptions.$inferSelect
export type ExamOrder = typeof examOrders.$inferSelect
export type MedicalCertificate = typeof medicalCertificates.$inferSelect
export type Appointment = typeof appointments.$inferSelect
