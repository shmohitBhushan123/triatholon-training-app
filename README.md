# VELORA

A full-stack triathlon training app — think Runna, but for triathlon. VELORA generates a personalized, periodized swim/bike/run training plan and adapts it based on real recovery data, instead of a static, one-size-fits-all schedule.

## Why

Runna is excellent for running, but there's no equivalent for triathlon that:

- Is truly adaptive based on real recovery data (HRV, sleep, strain)
- Integrates swim, bike, run, and brick workouts in one place
- Feels like a modern consumer mobile app rather than a spreadsheet

## Features

- **Algorithm-generated training plans** — a deterministic, rules-based periodization engine (Base → Build → Race Prep → Taper), not AI-generated. Given the same inputs, it always produces the same plan.
- **Multi-sport support** — standalone run, cycling, or swim plans, or a composite triathlon plan with brick workouts.
- **Activity sync** — completed workouts pulled from Strava and matched against planned sessions.
- **Recovery overlay** — Whoop recovery score per day drives a green/yellow/red recommendation (execute as written / modify / skip).
- **Zwift integration** — one-click `.zwo` file generation for any bike workout.
- **Conversational coaching layer** — an LLM answers "why am I doing this session?" or "should I skip today?", but never generates or modifies the plan itself — that's the plan engine's job.

## Tech stack

Next.js (App Router) + TypeScript (strict), Supabase (Postgres + Auth), Tailwind CSS, Vitest.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in Supabase/Strava/Whoop credentials
npm run dev
```

Common tasks (see `Makefile`):

```bash
make run         # npm run dev
make unit-test   # npm run test:run
make check       # prettier --write, eslint --fix, and tests, across the whole repo
```

## Status

Personal project, currently an MVP. Backend (plan engine, onboarding + persistence APIs, OAuth) is functional; frontend (onboarding flow, daily workout dashboard) is in progress.
