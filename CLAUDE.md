@AGENTS.md

## Product scope

Sara Asistente es una plataforma web para **nutricionistas clínicos individuales** que gestionan su consulta privada y la atención de pacientes. No es una app de wellness/fitness, no es un EMR médico genérico, no es un portal B2B para centros de salud grandes. Todo código, copy y feature nueva debe alinearse al dominio nutricional (planes alimentarios, mediciones antropométricas, seguimiento de composición corporal, diario alimentario), no al dominio médico genérico.

Léxico autoritativo: paciente, consulta, plan alimentario, evaluación antropométrica, mediciones, seguimiento. No usar: receta, prescripción, diagnóstico, cita de revisión, signos vitales.

## Design System

Siempre leer [DESIGN.md](./DESIGN.md) antes de cualquier decisión visual o de UI. Todas las fuentes, colores, espaciado y dirección estética están definidos ahí. No desviarse sin aprobación explícita del usuario. En modo QA, marcar todo código que no cumpla DESIGN.md.

Tokens rápidos (referencia, la fuente es DESIGN.md):
- Display font: Instrument Serif · Body: Geist · Data: Geist Mono
- Primary: sage `#4A7C59` · Base: cream `#FAFAF8` · Text: graphite `#1A1F1C`
- Base spacing: 8px · Radius: 6/8/12px · Motion: minimal-functional (150ms default)

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health

## gstack (recommended)

This project uses [gstack](https://github.com/garrytan/gstack) for AI-assisted workflows.
Install it for the best experience:

```bash
git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup --team
```

Skills like /qa, /ship, /review, /investigate, and /browse become available after install.
Use /browse for all web browsing. Use ~/.claude/skills/gstack/... for gstack file paths.
