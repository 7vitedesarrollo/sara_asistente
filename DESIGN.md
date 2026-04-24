# Design System — Sara Asistente

> Fuente de verdad del sistema de diseño. Leer antes de cualquier decisión visual o de UI. Si el código no coincide con este documento, el código está mal.

## Product Context

- **Qué es:** plataforma web para el nutricionista clínico individual que gestiona su consulta privada y la atención de sus pacientes.
- **Quién la usa:** nutricionista profesional (1–3 años de experiencia o más), trabaja presencial y/o telemedicina, atiende entre 30 y 80 pacientes activos.
- **Espacio:** herramientas clínicas para profesionales de salud. Competencia referencial: Nutrium (Portugal), Healthie (US), Practice Better (CA). Posicionamiento: ni wellness-lifestyle ni enterprise B2B, sino "herramienta profesional confiable que el paciente ve al otro lado de la pantalla".
- **Tipo:** dashboard web app + portal paciente (fase 2).

## Aesthetic Direction

- **Nombre:** Clínico-Moderno.
- **Thesis:** precisión de Linear/Notion + calidez humana sutil de Instrument Serif + identidad verde salvia. La información es el diseño; la decoración sobra.
- **Decoration level:** intentional (sombras sutiles, bordes 1px, acento sage puntual). Nada de gradientes decorativos, blobs, ilustraciones, fotografía stock de comida.
- **Mood:** la paciente mira la pantalla durante la consulta y piensa "esta persona es profesional y organizada". El nutricionista la abre en la mañana y siente calma, no urgencia.
- **Referencias:** Linear (densidad + claridad), Mercury (clínico + humano), Instrument (tipografía editorial), Substack editor (respeto por el contenido).

## Typography

- **Display:** [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif) (400, 400 italic). Encabezados, nombres de paciente, saludos, citas destacadas. Transmite pensamiento cuidado, no corporativo.
- **Body:** [Geist](https://fonts.google.com/specimen/Geist) (300–700). Texto corrido, labels, navegación, formularios. Tabular-nums activado (`font-feature-settings: 'tnum' 1`) para mediciones antropométricas.
- **Data/Tables:** [Geist Mono](https://fonts.google.com/specimen/Geist+Mono) (400–600). Valores numéricos en tablas (pesos, IMC, fechas, IDs), timestamps, badges técnicos.
- **Code:** Geist Mono (cuando aplique para debugging, no debería aparecer en UI de nutricionista).

**NO usar:** Inter, Roboto, Arial, Helvetica, Montserrat, Poppins, Open Sans (overused). Nunca usar Papyrus, Comic Sans, Lobster, Impact.

**Carga:** Google Fonts con `preconnect` + `display=swap`. En Next.js 16, usar `next/font/google` para self-hosting automático:

```ts
import { Instrument_Serif, Geist, Geist_Mono } from 'next/font/google'
```

### Escala tipográfica

| Role            | Size          | Line-height | Font                   | Weight |
|-----------------|---------------|-------------|------------------------|--------|
| Display XL      | 56–120px (clamp) | 0.95     | Instrument Serif       | 400    |
| Display L       | 48px          | 1.1         | Instrument Serif       | 400    |
| Display M       | 34px          | 1.1         | Instrument Serif       | 400    |
| Display S       | 20px          | 1.2         | Instrument Serif       | 400    |
| Body L          | 18px          | 1.55        | Geist                  | 400    |
| Body M (base)   | 16px          | 1.55        | Geist                  | 400    |
| Body S          | 14px          | 1.5         | Geist                  | 400    |
| Caption         | 12px          | 1.4         | Geist                  | 400–500|
| Label/Overline  | 11–12px       | 1.4         | Geist Mono             | 500    |
| Data            | 13–14px       | 1.4         | Geist Mono (tabular)   | 400–500|

## Color

Approach: **restringido**. El verde identifica la marca sin pedir atención; lo demás es neutral.

### Tokens

```css
:root {
  /* Base surfaces */
  --cream: #FAFAF8;          /* fondo global */
  --cream-raised: #FCFCFA;   /* cards, paneles */
  --cream-sunken: #F4F4EF;   /* sidebar, secciones deprimidas */

  /* Text */
  --graphite: #1A1F1C;       /* texto principal (AAA contrast vs cream) */
  --graphite-muted: #5C615D; /* texto secundario */
  --graphite-subtle: #8C918D;/* labels, timestamps */

  /* Borders */
  --border: #E5E5E0;
  --border-strong: #D4D4CE;

  /* Brand / Primary */
  --sage: #4A7C59;           /* acento primario: botones, nav activa, iconos destacados */
  --sage-light: #6B9F6B;     /* success, estados positivos */
  --sage-bg: #EDF2EE;        /* fondos de badges sage, hover states */

  /* Semantic */
  --amber: #C89E4F;          /* warning */
  --terracotta: #B5533F;     /* error */
}
```

### Dark mode

```css
[data-theme="dark"] {
  --cream: #131512;
  --cream-raised: #1B1E1B;
  --cream-sunken: #0E100F;
  --graphite: #F0EEE8;
  --graphite-muted: #A8AAA5;
  --graphite-subtle: #6D706C;
  --border: #2A2C29;
  --border-strong: #3A3D39;
  --sage: #7FB08B;           /* sage se aclara en dark para contraste */
  --sage-light: #9BC5A4;
  --sage-bg: #1C2620;
}
```

Estrategia dark mode: no invertir, rediseñar surfaces. Reducir saturación del sage ~10% al aclararlo. Mantener jerarquía por luminosidad.

### Reglas de uso

- **Verde (sage)** aparece solo en: botones primarios, nav item activo, iconos de marca, success states, destacados de contenido crítico (nombre del paciente en planes). Si usas verde más de 5 veces en una vista, quita algunos.
- **Amber** solo para warnings que el usuario debe atender (plan con retraso, paciente sin agenda hace tiempo).
- **Terracotta** solo para errores y alergias del paciente. Nunca decorativo.
- **Fondo cream** siempre `#FAFAF8`, nunca blanco puro `#FFFFFF`.
- **Texto** siempre graphite `#1A1F1C`, nunca negro puro `#000000`.

## Spacing

Base: **8px**. Toda dimensión de layout en múltiplos de 8. Density: comfortable.

```
2xs: 2px   · border-widths, separadores
xs:  4px   · tight gaps dentro de componentes
sm:  8px   · gap estándar dentro de cards
md:  16px  · padding interno de cards
lg:  24px  · gap entre cards, padding de secciones
xl:  32px  · padding de contenido principal, gap entre paneles
2xl: 48px  · separación entre secciones mayores
3xl: 64px  · hero padding, inicio de página
```

## Layout

- **App shell:** sidebar 240px (izq) + main content. Opcional: rail derecho 320px para contexto de paciente.
- **Grid:** flexible, 12 columnas desktop; max-width de contenido 1440px.
- **Cards:** border 1px + sombra muy sutil (`0 1px 2px rgba(26,31,28,0.04)`). Nunca sombras dramáticas.
- **Densidad:** comfortable. No compact (Linear/dev-tool vibe, demasiado denso para consulta clínica), no airy (marketing site, desperdicia real estate).

### Border radius

```
--radius-sm: 6px;   /* inputs, small pills */
--radius-md: 8px;   /* cards, buttons */
--radius-lg: 12px;  /* containers mayores, modals */
--radius-full: 9999px; /* avatares, badges pill */
```

## Motion

Approach: **minimal-functional**. Solo transiciones que ayudan a comprender; nada decorativo.

```css
--ease-enter: cubic-bezier(0.2, 0.8, 0.3, 1);
--ease-exit:  cubic-bezier(0.6, 0.05, 0.8, 0.4);
--ease-move:  cubic-bezier(0.4, 0, 0.2, 1);

--dur-micro:  80ms;   /* hover, focus ring */
--dur-short:  150ms;  /* estado por defecto */
--dur-medium: 250ms;  /* modales, drawers */
--dur-long:   400ms;  /* entrance hero */
```

No usar: scroll-driven animations, parallax, entradas en cascada, animaciones de iconos, spinners decorativos. La herramienta se usa durante consultas: la animación distrae a la paciente.

## Iconography

- Stroke width 1.8px, line-cap round.
- 16x16 en UI densa (nav, badges), 20x20 en contenido, 24x24 en CTAs.
- Currentcolor para heredar del contenedor.
- **Vetado:** cruz médica (somos nutrición, no medicina), caduceo, estetoscopio, emoji de comida como iconos funcionales.

## Voice & Copy

- **Idioma:** español LatAm. Tuteo por defecto, usted solo si el usuario lo configura.
- **Tono:** cercano pero profesional. "Buenos días, Dra. Stefanny" > "Hola!". "Consultas de hoy" > "Tu día".
- **Nomenclatura de dominio** (usar estas palabras, no las médicas genéricas):
  - Paciente (no cliente)
  - Consulta / atención (no visita)
  - Plan alimentario (no receta, no prescripción)
  - Evaluación antropométrica / mediciones (no signos vitales)
  - Objetivo de consulta (no diagnóstico)
  - Seguimiento / control (no cita de revisión)
- **Microcopy ejemplos:**
  - Vacío de pacientes: "Aún no tienes pacientes registrados. Agrega el primero para empezar."
  - Guardado: "Plan alimentario guardado." (no "¡Éxito!")
  - Errores: directos, sin culpar al usuario. "No pudimos enviar el correo. Reintenta o envía manualmente."

## AI Slop — qué NO incluir

Vetados a perpetuidad:
- Gradientes púrpura/violeta.
- Grids de 3 columnas con iconos en círculos de colores.
- Todo centrado con spacing uniforme.
- Border-radius bubbly (más de 16px en todo).
- Gradient buttons como CTA primario.
- Stock photo de comida.
- Copy tipo "Elevate your practice", "Unleash your potential".
- Blobs decorativos de colores.
- Medical cross icons.
- Lottie de ilustración genérica.

## Accessibility

- Contraste AAA entre graphite y cream (17:1). AA entre sage y cream (4.6:1) — aceptable para texto grande y UI no textual.
- Focus ring: 3px halo `var(--sage-bg)` + border `var(--sage)`. Visible sin depender de color.
- Target size mínimo: 40px (botones de producción). Inputs: 40px alto.
- Soportar `prefers-reduced-motion: reduce`: desactivar todas las transiciones no-esenciales.
- Soportar `prefers-color-scheme: dark` con el dark mode definido arriba.

## Decisions Log

| Fecha | Decisión | Rationale |
|-------|----------|-----------|
| 2026-04-23 | Sistema inicial creado | Pivote de médicos a nutricionistas. Research de 4 apps referentes (Nutrium, Healthie, Practice Better, Evolution Nutrition). Eureka: la categoría asume wellness-vibe pero el nutricionista clínico se posiciona más cerca del médico que del coach. Diferenciación deliberada: aesthetic clínico-moderno con calidez editorial, no wellness-lifestyle. |
| 2026-04-23 | Instrument Serif como display | Romper con el default de rounded sans de la categoría. Señal "tool for thoughtful professionals". |
| 2026-04-23 | Sage #4A7C59 como primary | Verde nutricional adulto, no lime fitness ni teal consumer. Identifica sin pedir atención. |
| 2026-04-23 | Cream #FAFAF8 en vez de blanco puro | Reduce fatiga visual en consultas largas, transmite calidez humana. |
| 2026-04-23 | Geist como body + Geist Mono para data | Tabular-nums impecable para mediciones antropométricas, lo principal de este producto. |
