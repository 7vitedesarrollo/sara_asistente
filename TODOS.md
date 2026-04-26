# TODOS — sara_asistente (plataforma para nutricionistas)

Trabajo diferido tras el pivote a nutricionistas clínicos (2026-04-24).

---

## Fase 1 — Primer nutricionista pagando

- [x] Aplicar tokens de DESIGN.md a Dashboard, Ficha, Consultas, Planes, Mediciones, Sara, Nav (commits `ee43a98`, `603ed08`, `b416a2d`)
- [x] Implementar `/mediciones` (timeline antropométrico con tabla `measurements`, IMC autocalculado, delta vs medición previa) — commit `603ed08`
- [x] Editor del plan alimentario semanal (7 días × 5 momentos en grid editable, JSONB `meal_plans.structure`, kcal/proteína target, rango de fechas) — commit `ec955b7`
- [x] Calculadora de gasto energético (Mifflin-St Jeor + Katch-McArdle si hay % grasa, factor de actividad, sugerencias por objetivo) — commit `db7da42`
- [x] Export PDF del plan alimentario (ruta `/print/plan/[planId]` con `@media print` A4, sin librerías de PDF) — commit `8cfef47`
- [ ] Validar con 1 nutricionista real: agenda 10 pacientes, graba 5 consultas, emite 3 planes

## Fase 2 — 3-5 nutricionistas pagando

- [x] Recordatorios automáticos de citas (email vía Resend con fallback log-only, cron Vercel diario, botón manual desde Agenda) — commit `292fd31`. Pendiente: WhatsApp (requiere Twilio Business).
- [x] Vista gráfica de evolución antropométrica — chart SVG custom con selector Peso/% Grasa/IMC/Cintura, tooltip y trend total (commit `2bc1b4b`)
- [x] Librería de planes alimentarios reutilizables — tabla `meal_plan_templates`, ruta `/plantillas` con CRUD, "Cargar desde plantilla" en PlanForm + "Guardar como plantilla" en PlanCard (commit `9fd2323`)
- [ ] Diario alimentario del paciente (tabla `food_diary` + portal paciente mínimo)
- [ ] Facturación / recibos electrónicos según país
- [ ] PWA con soporte offline básico para consulta sin internet

## Compliance (evaluar antes de launch por país)

- [ ] México: NOM-024 (privacidad datos de salud)
- [ ] Chile: Ley 19.628
- [ ] Colombia: Ley 1581
- [ ] Ecuador: LOPDP
- [ ] Field-level encryption con `pgcrypto` si la regulación del país lo requiere
- [ ] Audit logs para acceso a datos de pacientes

## Infraestructura futura

- [ ] Hosting en LatAm si la regulación requiere datos en país
- [ ] Rate limiting global (Vercel Edge Middleware o Upstash)
- [ ] Backups automáticos + PITR habilitado en Supabase (verificar plan)

## Stretch

- [ ] Integración con balanzas de bioimpedancia (InBody, Tanita) vía CSV o API
- [ ] App móvil nativa para que el paciente registre su diario
- [ ] IA que sugiere ajustes al plan según adherencia y progreso
