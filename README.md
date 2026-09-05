# Shelf Seasons

**Your reading life, season by season.**

Shelf Seasons is a cozy bilingual reading journal and visual book tracker. This repository contains the verified bilingual design and account foundation plus a real personal library and reading tracker on standard Next.js.

The brand is always **Shelf Seasons**. The technical slug is always `shelf-seasons`.

## Current demo

- `/ru/app` — Russian Home
- `/en/app` — English Home
- `/[locale]/app/library` — searchable/filterable cover library
- `/[locale]/app/calendar` — week, month and year reading views
- `/[locale]/app/series` — ordered series overview
- `/[locale]/app/recaps` — monthly reading recap
- `/[locale]/app/settings` — language, timezone and theme demo

Without `.env.local`, the visual shell continues to run safely in demo mode. With a configured development Supabase project, `/en/app` and `/ru/app` are protected, Google OAuth uses server-side cookie sessions, and a new account completes bilingual onboarding.

## Windows PowerShell

Prerequisite: Node.js 22 or newer.

```powershell
Set-Location P:\Projects\shelf-seasons
npm ci
npm run dev
```

Open the local address printed by the development server.

The default address is `http://localhost:3000/ru/app`.

For the reading tracker, apply `supabase/migrations/202609050003_reading_tracker.sql` once after the personal-library migration.

Verification:

```powershell
npm run typecheck
npm run lint
npm test
```

## Stage 2: development account setup

Use a development Supabase project named `shelf-seasons-dev`. Do not connect production while implementing features.

1. Copy `.env.example` to `.env.local` and add the project URL and publishable key.
2. Apply `supabase/migrations/202609050001_stage_2_profiles.sql` through the Supabase SQL editor or CLI.
3. Enable Google in Supabase Auth and add the Supabase callback URL to the Google OAuth client.
4. In Supabase Auth URL configuration, set the Site URL to `http://localhost:3000` and allow `http://localhost:3000/auth/callback`.
5. Restart `npm run dev`, then open `http://localhost:3000/ru/sign-in`.

After applying the migration, verify the live development project:

```powershell
npm run test:connected
```

The Google client secret belongs in Google/Supabase configuration, never in `.env.local` used by Next.js. See `docs/STAGE_2_SETUP.md` for the exact checklist.

## Product documents

Read in this order before implementation work:

1. `PRODUCT_SPEC.md`
2. `docs/DECISIONS.md`
3. the relevant domain document in `docs/`
4. `AGENTS.md`
5. `docs/ROADMAP.md`

## Current stage

Version 0.5.0 includes the personal library, quick/detailed reading sessions, a real cover calendar and streaks. Series, finish-book rituals and recaps remain later roadmap stages.
