# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added

- **feat: whoop** — Whoop OAuth flow, token storage in `whoop_tokens` (Supabase), auto-refresh client, recovery endpoint returning score, HRV, and RHR; `sleep_id` schema bug fixed
- **feat: release-please setup** — automated release workflow on push to `main`; `release-please-config.json` and `.release-please-manifest.json` seeded at `0.1.0`
- **feat: privacy page and scaffold deployment** — static privacy policy page at `/privacy`; required for Whoop developer app registration
- **feat: strava** — Strava OAuth flow, token storage in `strava_tokens` (Supabase), auto-refresh client, activities endpoint; Supabase server client; Zod schemas for all API types
- **feat: scaffold** — Next.js 15, Tailwind CSS v4, shadcn/ui, Vitest, ESLint, Prettier, Husky, GitHub Actions CI, project folder structure
