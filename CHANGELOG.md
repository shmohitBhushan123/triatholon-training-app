# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added

- `.github/workflows/release-please.yml` — automated release workflow; triggers on push to `main`, opens Release PRs with version bumps and changelog generation
- `release-please-config.json` — release-please configuration; `release-type: node`, `feat` and `fix` surfaced in changelog, `chore` and `docs` hidden
- `.release-please-manifest.json` — version manifest seeded at `0.1.0`
- `app/privacy/page.tsx` — static privacy policy page; required for Whoop developer app registration
- `lib/supabase/server.ts` — server-side Supabase client using service role key; bypasses RLS, used in all API route handlers
- `lib/strava/auth.ts` — Strava OAuth helpers: `buildStravaAuthUrl`, `exchangeStravaCode`, `refreshStravaToken`
- `lib/strava/client.ts` — authenticated Strava API client: `getValidAccessToken` (reads from Supabase, auto-refreshes on expiry), `stravaFetch` (authorized outbound HTTP wrapper)
- `app/api/strava/connect/route.ts` — initiates Strava OAuth; generates CSRF state, sets httpOnly cookie, redirects to Strava
- `app/api/strava/callback/route.ts` — Strava OAuth callback; validates CSRF state, exchanges code for tokens, upserts into `strava_tokens`
- `app/api/strava/activities/route.ts` — proxies recent Strava activities; Zod-validated, returns JSON
- `lib/config.ts` — typed, validated environment variable access; fails fast on missing vars
- `lib/schemas/` — Zod schemas for Strava, Whoop, Garmin, and Athlete types
- `lib/utils.ts` — shared utility functions
- Next.js 15 with App Router and strict TypeScript
- Tailwind CSS v4 with mobile-first dark theme
- shadcn/ui with Nova preset; CSS variables in `app/globals.css`
- Vitest configured as ESM-native test runner
- ESLint 9 flat config with strict TypeScript ruleset
- Prettier, Husky v9, lint-staged — pre-commit runs Prettier → ESLint → Vitest
- GitHub Actions CI — triggers on push to `feature/**` and `develop`, PRs to `main`/`develop`
- Supabase project provisioned; `strava_tokens` table with RLS policy
- `.env.local.example` — documented template for all required environment variables

### Dependencies

- `zod` — runtime schema validation
- `husky`, `lint-staged` — git hook management
- `@types/node`, `typescript` — TypeScript toolchain
