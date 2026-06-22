# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added

- **feat: general-scheduler** - migrate scheduler from run plan to general function for each dicipline to utilize
- **fix: run plan refactor** - removed schedule.ts and moved to generators.ts, updated db table
- **feat: run-plan-generator** - create run plan off calculation
- **feat: plan-engine-scaffold** — added supabase migrations table with created plan tables for each sport. Scaffold each training plan under services
- **feat: zwift** — `.zwo` XML file generator (`lib/zwift/zwo.ts`), Zod schema for all block types (`lib/schemas/zwift.ts`), `POST /api/zwift/generate` endpoint returning a downloadable `.zwo` file; supports Warmup, Cooldown, SteadyState, IntervalsT, and FreeRide blocks; power values expressed as FTP fractions
- **feat: whoop** — Whoop OAuth flow, token storage in `whoop_tokens` (Supabase), auto-refresh client, recovery endpoint returning score, HRV, and RHR; `sleep_id` schema bug fixed
- **feat: release-please setup** — automated release workflow on push to `main`; `release-please-config.json` and `.release-please-manifest.json` seeded at `0.1.0`
- **feat: privacy page and scaffold deployment** — static privacy policy page at `/privacy`; required for Whoop developer app registration
- **feat: strava** — Strava OAuth flow, token storage in `strava_tokens` (Supabase), auto-refresh client, activities endpoint; Supabase server client; Zod schemas for all API types
- **feat: scaffold** — Next.js 15, Tailwind CSS v4, shadcn/ui, Vitest, ESLint, Prettier, Husky, GitHub Actions CI, project folder structure
