# VELORA

A full-stack triathlon training app — think Runna, but for triathlon. VELORA is a personal project to build a personalized, periodized swim/bike/run training plan generator, backed by real fitness data instead of a static, one-size-fits-all schedule.

## Why

Runna is excellent for running, but there's no equivalent for triathlon that:

- Is adaptive based on real recovery data (HRV, sleep, strain)
- Integrates swim, bike, run, and brick workouts in one place
- Feels like a modern consumer mobile app rather than a spreadsheet

This is currently a backend-first MVP under active development — see [Status](#status) below for what's actually built vs. what's planned.

## What's built

- **Algorithm-generated training plans** — a deterministic, rules-based periodization engine (Base → Build → Race Prep → Taper), not AI-generated. Given the same inputs, it always produces the same plan. Covers standalone run, cycling, and swim plans, plus a composite triathlon plan with brick workouts, via `POST /api/plans/{run,cycling,swim,tri}`, `GET /api/plans/current`, and `GET /api/workouts/today`.
- **Google sign-in** via Supabase Auth.
- **Strava OAuth connection** and an endpoint to fetch an athlete's recent activities.
- **Whoop OAuth connection** and an endpoint to fetch an athlete's recovery data (score, HRV, resting heart rate).
- **Zwift `.zwo` file generation** — `POST /api/zwift/generate` turns a workout definition into a downloadable, Zwift-compatible workout file.

## Planned

- **Onboarding UI** — multi-step frontend form that collects the inputs the plan engine needs and posts to the plan-generation endpoints.
- **Daily workout dashboard** — card-based view of today's session, reading from `GET /api/workouts/today`.
- **Activity matching** — comparing synced Strava activities against planned sessions to mark them complete/partial/missed (`services/activity-matcher` is currently an empty stub).
- **Recovery overlay** — turning raw Whoop recovery scores into a green/yellow/red execute/modify/skip recommendation (`services/recovery` is currently an empty stub).
- **Garmin Connect integration** — activity and FTP history (not started; only a schema exists today).
- **Conversational coaching layer** — an LLM to answer "why am I doing this session?" or "should I skip today?"; explicitly never used to generate or modify the plan itself.
- **Adaptive plan adjustments** — shifting the plan based on sustained low recovery or missed sessions.

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

Personal project, pre-MVP. There is no frontend yet beyond sign-in/sign-out — everything else is API-only. The plan engine, its persistence APIs, and Strava/Whoop OAuth are functional and tested (320+ tests, `tsc`/`eslint`/`prettier` clean). Onboarding UI and the daily workout dashboard are next up.
