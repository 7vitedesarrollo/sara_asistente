# TODOS — sara_asistente (plataforma para nutricionistas)

Trabajo diferido tras el pivote a nutricionistas clínicos (2026-04-24).

---

## Fase 1 — Primer nutricionista pagando

- [x] Aplicar tokens de DESIGN.md a Dashboard, Ficha, Consultas, Planes, Mediciones, Sara, Nav (commits `ee43a98`, `603ed08`, `b416a2d`)
- [x] Implementar `/mediciones` (timeline antropométrico con tabla `measurements`, IMC autocalculado, delta vs medición previa) — commit `603ed08`
- [x] Editor del plan alimentario semanal (7 días × 5 momentos en grid editable, JSONB `meal_plans.structure`, kcal/proteína target, rango de fechas) — commit `ec955b7`
- [x] Calculadora de gasto energético (Mifflin-St Jeor + Katch-McArdle si hay % grasa, factor de actividad, sugerencias por objetivo) — commit `db7da42`
- [ ] Export PDF del plan alimentario para enviar por correo al paciente
- [ ] Validar con 1 nutricionista real: agenda 10 pacientes, graba 5 consultas, emite 3 planes

## Fase 2 — 3-5 nutricionistas pagando

- [ ] Recordatorios automáticos de citas (email / WhatsApp)
- [ ] Vista gráfica de evolución antropométrica (peso / % grasa / IMC en el tiempo)
- [ ] Librería de planes alimentarios reutilizables (duplicar + ajustar)
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
