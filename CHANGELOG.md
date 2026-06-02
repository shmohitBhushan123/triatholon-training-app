# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased] — feature/strava

### Added

- feature/strava: - `lib/supabase/server.ts` — server-side Supabase client using service role key (bypasses RLS); used in all API route handlers - `lib/strava/auth.ts` — Strava OAuth helpers: `buildStravaAuthUrl`, `exchangeStravaCode`, `refreshStravaToken` - `lib/strava/client.ts` — authenticated Strava API client: `getValidAccessToken` (reads from Supabase, auto-refreshes on expiry), `stravaFetch` (authorized outbound HTTP wrapper) - `app/api/strava/connect/route.ts` — GET handler; generates CSRF state, sets httpOnly cookie, redirects browser to Strava authorization page - `app/api/strava/callback/route.ts` — GET handler; validates CSRF state, exchanges authorization code for tokens, upserts tokens into `strava_tokens` table in Supabase - `app/api/strava/activities/route.ts` — GET handler; fetches recent activities from Strava API, validates response with Zod, returns JSON - `PERSONAL_USER_ID` entry added to `.env.local.example`
- feature/scaffold: - Next.js 15 project initialized with App Router and strict TypeScript - Tailwind CSS v4 configured with mobile-first dark theme - shadcn/ui initialized with Nova preset; CSS variables set in `app/globals.css` - Vitest configured as ESM-native test runner (`vitest.config.ts`, `vitest.setup.ts`) - ESLint 9 flat config (`eslint.config.mjs`) with strict TypeScript ruleset - Prettier configured (`.prettierrc`, `.prettierignore`) - Husky v9 + lint-staged: pre-commit hook runs Prettier → ESLint → Vitest on staged files - GitHub Actions CI workflow: triggers on push to `feature/**` and `develop`, PRs to `main`/`develop` - Project folder structure scaffolded: `app/`, `lib/`, `services/`, `components/`, `types/` - `lib/config.ts` — typed, validated environment variable access - `lib/schemas/` — Zod schemas for Strava, Whoop, Garmin, and Athlete types - `lib/utils.ts` — shared utility functions - `.env.local.example` — documented template for all required environment variables - `AGENTS.md` and `CLAUDE.md` — agent instruction files - `develop` branch created; branch protection rules configured on GitHub - Supabase project provisioned; `strava_tokens` table created with RLS policy

### Dependencies

- `zod` — runtime schema validation
- `husky`, `lint-staged` — git hook management
- `@types/node`, `typescript` — TypeScript toolchain
