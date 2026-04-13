# Design System — Performance Nutrition

Created by /design-consultation on 2026-04-13

## Product Context

- **What this is:** A web app for cyclists using Intervals.icu that translates training load into daily macro targets and race fueling plans.
- **Who it's for:** Analytical cyclists — the Intervals.icu community. Data-driven, skeptical of lifestyle branding, comfortable reading training logs and TSS numbers.
- **Space/industry:** Sports nutrition / cycling analytics
- **Project type:** Web app (APP UI — not a marketing site)
- **Component library:** Tailwind CSS + shadcn/ui (override all CSS variables with this system)

## Aesthetic Direction

- **Direction:** Precision Instrument
- **Decoration level:** Minimal (typography and whitespace do all the work)
- **Mood:** Like a well-made training log or a race brevet card. Not a sports drink brand. Not a wellness app. Something the analytical cyclist sees and immediately trusts. Dense but not cluttered. Precise but not cold.
- **Deliberate departures from category norms:**
  1. Light surface (not dark) — matches Intervals.icu's visual language; this audience chose Intervals.icu precisely because it doesn't look like a fitness app
  2. Amber accent (not blue/green) — every cycling app defaults to blue (Garmin, Wahoo) or green (health apps); amber reads as fuel/energy and is conceptually on-brand
  3. The race card as a physical artifact — styled like a brevet card, not a data widget; designed to be photographed and shared

## Typography

- **Body / UI:** [Instrument Sans](https://fonts.google.com/specimen/Instrument+Sans) — clean, slightly more character than DM Sans, excellent at small sizes for form labels and food log entries
- **Data / numbers:** Instrument Sans with `font-variant-numeric: tabular-nums` — all macro targets, kcal counts, timing markers, progress values
- **Race card timetable:** [Geist Mono](https://fonts.google.com/specimen/Geist+Mono) — fixed-width time column reads like a real race brevet card; applies to time markers (0:20, 0:50...) only
- **Code (if any):** Geist Mono
- **Loading:** Google Fonts via `next/font/google` with `variable` export in Next.js; apply `font-variant-numeric: tabular-nums` to data displays via Tailwind class `tabular-nums`
- **Blacklisted:** Do not use Inter, Roboto, Arial, DM Sans, Poppins, Montserrat as primary

### Type Scale

| Role | Size | Weight | Usage |
|---|---|---|---|
| Cockpit number | 64–72px | 600 | Carb target on dashboard |
| Display | 24–28px | 600 | Page headings |
| Section heading | 20px | 600 | Card headings |
| Body | 15px | 400 | Paragraphs, descriptions |
| Label / UI | 13px | 500 | Form labels, nav items, metadata |
| Caption / muted | 12px | 400 | Timestamps, secondary info |
| Mono (timetable) | 13px | 500 | Race card time column |

## Color

- **Approach:** Restrained — one accent color, used sparingly (primary actions + dominant number only)

| Token | Hex | Usage |
|---|---|---|
| `--color-bg` | `#F5F4F0` | Page background — warm near-white, feels like quality paper |
| `--color-surface` | `#FFFFFF` | Cards, inputs, panels |
| `--color-text` | `#1C1B18` | Primary text — near-black, warm |
| `--color-muted` | `#6A6860` | Secondary text, labels, placeholders |
| `--color-border` | `#E0DED8` | Borders, dividers |
| `--color-accent` | `#D9660A` | Primary actions, carb target number, band chips for hard/race |
| `--color-accent-hover` | `#C05808` | Hover state for accent buttons |
| `--color-accent-light` | `#FDF0E7` | Accent-tinted backgrounds (selected state, CTA strip) |
| `--color-success` | `#1B7A3E` | Solid food OK, progress on-track |
| `--color-warning` | `#B8860B` | Progress approaching target |
| `--color-error` | `#C0392B` | Auth errors, over-target food log |
| `--color-brevet-bg` | `#F9F7F2` | Race card background — slightly warm tint, distinct from surface |

**Dark mode:** Reduce all surface brightness by ~85%, reduce accent saturation by 10%. Swap `--color-bg` → `#18171A`, `--color-surface` → `#222124`, `--color-text` → `#F0EFE9`, `--color-muted` → `#8A8880`, `--color-border` → `#333230`.

**Progress bar color thresholds:**
- 0–79%: `--color-accent` (amber — on track)
- 80–110%: `#B8860B` (warning — approaching)
- >110%: `#C0392B` (error — over target)

**WCAG contrast:** All body text on `--color-surface` exceeds 4.5:1. Accent `#D9660A` on white: 4.6:1 (WCAG AA for large text). Use filled accent backgrounds for small accent text.

## Spacing

- **Base unit:** 8px
- **Density:** Comfortable (not tight-sporty, not airy-wellness)
- **Scale:** 4 / 8 / 16 / 24 / 32 / 48 / 64 / 96px

## Layout

- **Approach:** Grid-disciplined — one reading column, top-to-bottom priority
- **Max content width:** 720px (centered)
- **Mobile:** Single column always. No sidebars at MVP.
- **Grid (if needed for Phase 1 desktop):** 12-column, 24px gutters

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 4px | Chips, badges, progress bars |
| `--radius-md` | 6px | Inputs, buttons, small cards |
| `--radius-lg` | 10px | Main content cards, brevet card |

No uniform bubbly radius on everything. Restrained and purposeful.

## Motion

- **Approach:** Minimal-functional — only transitions that aid comprehension
- **No:** entrance animations, scroll-driven effects, decorative motion
- **Yes:** state transitions (button hover 150ms ease-out, progress bar fill 300ms ease, banner slide-in 200ms)
- **Easing:** enter → ease-out | exit → ease-in | state change → ease-in-out
- **Duration:** micro 50–100ms | short 150ms | medium 250–300ms

## Component Specs

### Cockpit Readout (carb target on dashboard)

```
Position: top of dashboard, no card border
Number: 64–72px, font-weight 600, --color-accent, tabular-nums, letter-spacing: -2px
Unit: 20px, font-weight 500, --color-muted, inline after number
Band label: small chip (--color-accent-light bg, --color-accent text), below number
Workout context: 14px, --color-muted, below band chip
```

NOT a card with a label. Just the number, its unit, its context. Like a Garmin head unit.

### Race Card (brevet)

```
Background: --color-brevet-bg (#F9F7F2)
Border: 1px solid --color-border
Border radius: --radius-lg
Header: race name + meta (duration · intensity · weight), border-bottom
Stats strip: 4 numbers (carbs/hr, fluid/hr, gels/hr, drink carbs/hr), --color-surface bg
Timetable rows: time column (Geist Mono, 52px fixed, --color-accent) + action text
Time markers: bold actions, muted sub-text for context
Solid food row: --color-success, square marker ■
Footer: formula attribution (muted) + [Share plan] ghost button
```

Do NOT use a `<ul>` with bullet points. It's a timetable.

### 7-Day View

```
Layout: compact table/list — NOT a card grid
Row height: 40–48px
Columns: day name (80px) · workout (flex) · carb target (80px, tabular-nums) · band chip (80px)
Today: accent-colored day name, accent carb target
No borders between rows — 1px bottom border only
Band chips: colored per intensity (hard: amber, moderate: green, easy: purple, rest: muted, race: red)
```

### Intensity Button Group (calculator)

```
4 buttons in a row on desktop
2×2 grid on mobile (≤640px)
Selected: --color-accent-light bg, --color-accent text and border
Unselected: --color-bg, --color-muted text, --color-border border
```

Never a `<select>` dropdown. The user must see all 4 options simultaneously.

### Reconnect Banner

```
Position: top of dashboard, above cockpit readout
Style: non-blocking (dashboard content below is always visible)
Background: #FDF8F0, border: #F0D8B8
Text: 13px, [Reconnect →] in --color-accent, × dismiss button
Dismissable: yes, for 24 hours
```

### Conversion CTA (Phase 0, after race card renders)

```
Position: below [Share plan] button, after race card appears
Style: --color-accent-light background, border: --color-border
Text: "Want daily macro targets synced to your Intervals.icu training?"
CTA: [Sign up free →] filled amber button
Appears: only after first calculation — not on page load
```

### Food Log Progress Bar

```
Height: 6px
Background: --color-bg
Fill color thresholds: 0-79% → accent, 80-110% → warning, >110% → error
Label: "Xg / Yg carbs logged · Z%" in 12px muted
Fat floor callout: inline text below fat macro row when fat_floor_applied=true
  "Fat minimum applied (1g/kg protected)" — 12px, --color-muted, italic
```

## Accessibility

- All inputs: `<label>` elements (never placeholder-only)
- Intensity button group: `role="radiogroup"`, `role="radio"`, keyboard nav (arrow keys)
- Progress bars: `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Race card: `<section>` with readable headings, not pure visual layout
- Color contrast: all text meets WCAG AA (4.5:1 body, 3:1 large text)
- Touch targets: 44px minimum height on all interactive elements
- Focus indicators: visible focus ring on all elements (not `:hover` only)
- Food log: keyboard-aware layout on mobile (results stay above soft keyboard)

## Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-04-13 | Precision Instrument aesthetic | Intervals.icu audience distrusts lifestyle branding; analytical trust requires precision |
| 2026-04-13 | Amber accent (#D9660A) | Color of fuel/energy gels; conceptually literal; distinctive from blue/green category norm |
| 2026-04-13 | Light surface (not dark) | Matches Intervals.icu's visual language; morning planning use case; dark mode available but not default |
| 2026-04-13 | Instrument Sans as primary | More character than DM Sans, excellent at 13px labels; tabular-nums support |
| 2026-04-13 | Geist Mono for race card timetable | Fixed-width reads like a real race brevet card; not decorative, functional |
| 2026-04-13 | Brevet card design for race output | Physical artifact feel; designed to be photographed and shared; not a generic data widget |
| 2026-04-13 | Tailwind + shadcn/ui | Accessible component foundations, CSS variable override system, no bundle bloat |
| 2026-04-13 | URL params: full words | `duration=&intensity=&weight=` — human-readable, self-explanatory |
| 2026-04-13 | Reconnect banner: non-blocking | Users must see cached data; morning check-in use case |
| 2026-04-13 | 7-day view: same page, below fold | No navigation step; natural reading continuation |
| 2026-04-13 | Race card share: URL only (v1) | Weekend ship; image export (html-to-image) deferred to v2 |
