# Claude Code Instructions — Performance Nutrition App

## Design System

Always read `DESIGN.md` before making any visual or UI decisions.
All font choices, colors, spacing, border radius, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

## Tech Stack

- Next.js (App Router) + Vercel
- Supabase: Postgres + Auth + Row Level Security
- Tailwind CSS + shadcn/ui (override CSS variables per DESIGN.md)
- TypeScript throughout — no `any`

## Key Plans and Specs

- Design doc: `~/.gstack/projects/cycling_coach/AzureAD+MathijsdeGrootSTARC-unknown-design-20260413-102450.md`
- CEO plan: `~/.gstack/projects/cycling_coach/ceo-plans/2026-04-13-performance-nutrition-mvp.md`
- Test plan: `~/.gstack/projects/cycling_coach/test-plan-20260413.md`

## Phase 0 (this weekend — no auth, no DB)

Build the race fueling calculator as a standalone Next.js page:
1. Form: duration (number), weight (number), intensity (button group — 4 options, never a dropdown)
2. Pure TypeScript `calculateRaceFueling()` function — see design doc for algorithm
3. Shareable URL: `?duration=4&intensity=moderate&weight=70` (full words, locked format)
4. Validate URL params — invalid params must not crash the page
5. Race card: brevet card design (see DESIGN.md), Geist Mono timetable, NOT a bullet list
6. Formula tooltips: "?" next to each number
7. Conversion CTA: appears below race card after first calculation only

## Phase 1 (after forum feedback)

Resolve feasibility gates first (30 min of Intervals.icu API testing before writing code):
- Gate 1: Does `/api/v1/athlete/{id}/events` return planned TSS + duration for future dates?
- Gate 2: Is OAuth2 available for third-party apps, or API key only?

## Algorithms

Pure TypeScript functions with no side effects. See design doc for full specs.

Acceptance test for `calculateRaceFueling(4, 'moderate', 70, null)`:
- 60g carbs/hr, 2 gels/hr (50g), 10g carb drink, 500ml/hr, solid food OK after 3h

## Database schema

See design doc. Key column that MUST exist:
- `workouts.intervals_event_id` — required for upsert, prevents sync duplicates
- `athlete_profiles.timezone` — required for correct date calculations
- Token encryption: Supabase Vault (not plain text storage)
