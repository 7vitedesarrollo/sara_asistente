# TODOS — sara_asistente

Items diferidos del plan de implementación (autoplan, 2026-04-10)

---

## Post-Fase 1 (después de tener cirujano en producción)

- [ ] Spike: WhatsApp-native como canal alternativo/complementario
- [ ] Explorar: OpenEMR o Medplum como base open-source con wrapper simple
- [ ] Explorar: Notion/Airtable template para validar demanda en días (no semanas)

## Post-Fase 2 (después de 3-5 médicos pagando)

- [ ] Recordatorios automáticos de citas (SMS / WhatsApp / email)
- [ ] Agenda / calendario integrado
- [ ] Exportación de historial en PDF
- [ ] Facturación / billing para el médico (facturas a pacientes)
- [ ] Tracking de referidos
- [ ] App móvil nativa (o PWA con offline support)
- [ ] Canal de adquisición: ¿cómo llegar a los próximos 50 médicos?

## Compliance (evaluar antes de launch por país)

- [ ] México: NOM-024 (privacidad datos médicos)
- [ ] Chile: Ley 19.628
- [ ] Colombia: Ley 1581
- [ ] Field-level encryption con pgcrypto si regulación lo requiere
- [ ] Audit logs para acceso a datos de pacientes

## Infraestructura futura

- [ ] Hosting en LatAm si regulación requiere datos en país
- [ ] Rate limiting global (Vercel Edge Middleware o Upstash)
- [ ] Backups automáticos + PITR habilitado en Supabase (verificar plan)
