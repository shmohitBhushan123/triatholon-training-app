# Copilot Instructions — Triathlon Training App

## Project Overview

I am building a full-stack triathlon training app — think Runna but for triathlon (swim, bike, run). The app will be personalized, adaptive, and pull from real fitness data across multiple APIs. This is a personal project built to production quality.

The current build is an **MVP using Next.js as a web app**. The intention is to validate the product, get all core logic working (plan engine, API integrations, recovery overlay), and eventually port the frontend to React Native for a true native iOS/Android experience. Do not over-engineer for native at this stage, but do not make decisions that would make a future React Native migration unnecessarily painful.

---

## The Problem It Solves

Runna is excellent for running but there is no equivalent for triathlon that is:

- Truly adaptive based on real recovery data
- Integrates swim, bike, run, and brick workouts in one place
- Feels like a modern consumer mobile app

This app aims to be that.

---

## Developer Background

I am a **DevOps Engineer with 3 years of corporate experience**. My primary languages are **Go, Python, and Groovy**. I have built CLI tools in Go using the Cobra library — decoupled stages of CI/CD pipelines that handle things like building and publishing Docker images to Artifactory/ECR/ACR and executing SonarQube scans. This work involved structured API calls, idiomatic code organization, and clean separation of concerns.

**My frontend experience is limited.** This is my first full-stack JavaScript/TypeScript project. I am comfortable with backend logic, API integrations, and structured architecture — the frontend is where I will need more guidance.

When introducing frontend-specific concepts (React state, components, hooks, server vs client components in Next.js), please explain them clearly. Do not assume prior React knowledge. For backend logic, API structure, and code organization, you can be more concise — I will recognize the patterns.

**I am writing TypeScript, not JavaScript.** TypeScript's strong typing is familiar and preferable coming from Go. Always use strict TypeScript. Never suggest loose JavaScript patterns.

---

## Code Architecture & Structure

My Go background means I think in layers — entry points, business logic, reusable packages, and services. I expect the same separation here. The following structure should be followed and explained when deviated from:

```
/app                          # Next.js owns this — routes, pages, API endpoints
  /api                        # Backend API route handlers (like pkg/ but for HTTP)
    /strava/route.ts
    /whoop/route.ts
    /garmin/route.ts
    /zwift/route.ts
  /(pages)                    # Frontend route pages
/lib                          # Reusable logic — equivalent to pkg/ in Go
  /strava                     # Strava API client, OAuth, data fetching
  /whoop                      # Whoop API client, recovery logic
  /garmin                     # Garmin Connect client
  /zwift                      # .zwo file generation
  /config.ts                  # Environment variable access, typed config
  /utils                      # Shared utility functions
/services                     # Business logic layer — equivalent to service/ in Go
  /plan-engine                # Periodization algorithm, plan generation
  /activity-matcher           # Match Strava activities to planned sessions
  /recovery                   # Whoop overlay logic, green/yellow/red rules
/components                   # UI building blocks (no Go equivalent — frontend only)
  /ui                         # Generic reusable components
  /workout                    # Workout card, session detail components
  /onboarding                 # Onboarding flow components
/types                        # Shared TypeScript interfaces and types
/tests                        # Unit and integration tests mirroring above structure
```

If Copilot suggests a structure that deviates from this, explain why and whether it is idiomatic Next.js convention or just a shortcut.

---

## Athlete Profile (First User / Test Case)

- **Goal race:** Ironman 70.3 Jones Beach (~4 months out)
- **Secondary race:** Philadelphia Half Marathon, November 2026
- **Half marathon PR:** 1:37:45 (Brooklyn Half, May 2026)
- **Swim benchmark:** 2,100y at 1:55/100y pace
- **Bike FTP:** 163w (Wahoo KICKR Core 2 via Zwift)
- **Gear:** Garmin Forerunner 165, Whoop strap, Wahoo KICKR Core 2
- **Note:** Garmin wrist HR reads high — Whoop is source of truth for recovery and HRV
- **Run training:** Managed via Runna app (no public API — completed runs sync to Strava)
- **Training availability:** 8–10 hrs/week, 5–6 days. Rest day: Wednesday. Long run: Friday. Long ride: Saturday.

---

## Core App Features (Priority Order)

1. **Onboarding flow** — Multi-step athlete profile setup: goal race, fitness benchmarks (swim pace, FTP, recent run time), weekly hours available, rest days, gear owned
2. **Algorithm-generated training plan** — 16-week periodized plan generated from onboarding inputs using structured coaching logic. See plan engine section below.
3. **Daily workout view** — Card-based UI showing today's session with full detail, zone targets, and workout instructions. Runna-style UX.
4. **Activity sync** — Completed workouts pulled from Strava, matched against planned sessions automatically
5. **Recovery overlay** — Whoop recovery score per day with green/yellow/red recommendation (execute as written / modify / skip)
6. **Zwift integration** — One-click `.zwo` XML file generation for any bike workout, pre-loaded with intervals, ready to drop into Zwift's local workout folder
7. **Progress tracking** — FTP over time, swim pace over time, run pace trends
8. **Adaptive plan adjustments** — Rules-based: if Whoop shows sustained low recovery or sessions are missed, the plan shifts forward using defined logic

---

## Plan Generation Philosophy

**This is not AI-generated.** The training plan engine is a rules-based algorithm built on established triathlon periodization principles — the same approach Runna uses for running. It is deterministic: given the same inputs, it produces the same plan.

Core principles the algorithm must follow:

- **Phases:** Base → Build 1 → Build 2 → Race Prep → Taper
- **Progressive overload:** ~10% volume increase per week
- **Cutback weeks:** Every 3–4 weeks, drop volume ~20% for recovery
- **Sport balance:** Swim, bike, run, and brick sessions distributed across the week
- **Brick workouts:** Bike immediately followed by run, scheduled weekly from week 2 onward
- **Taper:** 2–3 week volume reduction leading into race week

Inputs: race date, athlete benchmarks, weekly hours available, rest days, gear.
Output: structured JSON plan stored in the database.

---

## Where the Claude API Fits

The Anthropic Claude API (`claude-sonnet-4-20250514`) is used as a **conversational coaching layer only**. It is not involved in plan generation or adaptation logic.

Use cases:

- "Why am I doing this session?" — contextual workout explanation
- "I'm feeling fatigued, should I skip today?" — coaching assistant response
- Plain language weekly performance summaries
- General Q&A about training

Never use the Claude API to generate or modify the training plan structure. That is the plan engine's job.

---

## API Integrations

| Service        | Auth                                       | Purpose                                                | Notes                                                                                      |
| -------------- | ------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Strava         | OAuth2                                     | Activity sync — all runs, rides, swims including Zwift | Primary activity source. Runna completed runs appear here too.                             |
| Whoop          | OAuth2                                     | Recovery score, HRV, strain, sleep                     | Source of truth for recovery. Public API, well documented.                                 |
| Garmin Connect | Unofficial (`garminconnect` JS/Python lib) | Activity data, HR, FTP history                         | No official public API. Handle fragility carefully.                                        |
| Zwift          | None (file-based)                          | Custom workout delivery via `.zwo` XML files           | No official API. Activities sync to Strava. Workout files dropped into local Zwift folder. |
| Runna          | None                                       | No public API — treat Strava as the bridge             | Completed runs appear in Strava automatically.                                             |

Store all tokens in environment variables. Never hardcode credentials. Use a typed `lib/config.ts` to access all env vars with validation on startup.

---

## Tech Stack

| Layer       | Choice               | Notes                                              |
| ----------- | -------------------- | -------------------------------------------------- |
| Language    | TypeScript (strict)  | Always strict mode. No loose JS patterns.          |
| Framework   | Next.js (App Router) | Full-stack. Frontend + API routes in one codebase. |
| Database    | Supabase (Postgres)  | Auth + database. Free tier for MVP.                |
| Deployment  | Vercel               | Seamless Next.js deployment. Free tier for MVP.    |
| Styling     | Tailwind CSS         | Utility-first. Mobile-first always.                |
| Testing     | Jest                 | Unit tests. Co-located with the code they test.    |
| E2E Testing | Playwright           | Deferred post-MVP but scaffold should support it.  |

---

## Code Quality & Pre-commit Hooks

Enforce quality at the commit level, not just in CI. The following must be configured:

- **Husky** — Git hooks manager
- **lint-staged** — Run checks on staged files only, keeps hooks fast
- **ESLint** — TypeScript linting. Strict ruleset. No warnings treated as non-errors.
- **Prettier** — Code formatting. Analogous to `gofmt`. Non-negotiable formatting consistency.
- **Jest** — Unit tests must pass before commit

Pre-commit hook order:

1. Prettier format check
2. ESLint lint check
3. Jest unit tests (on affected files via lint-staged)

CI/CD via GitHub Actions should mirror these checks as a second gate — same principle as enforcing SonarQube and lint checks in a pipeline. Pre-commit is the first gate, CI is the second.

---

## Design Direction

- **Mobile-first** — every component designed for small screens first
- **Dark theme** — athletic aesthetic, think Whoop meets Runna
- **Card-based workout view** — daily session as a prominent card, tappable for full detail
- **Clean onboarding** — multi-step flow with progress indicator
- **No generic AI aesthetics** — no purple gradients, no Inter font, no cookie-cutter layouts

---

## General Principles

- Always explain _why_ a pattern is used, not just _what_ it does — especially for frontend and Next.js-specific conventions
- If deviating from the folder structure above, explain whether it is idiomatic Next.js or a shortcut
- Prefer explicit over magic — coming from Go, implicit behavior should always be called out
- When introducing a new concept (React hooks, server vs client components, etc.), give a one-line analogy to Go or Python if possible
- This is an MVP — do not over-engineer, but do not write throwaway code. Every decision should be defensible and extensible.
