# Changelog

## 0.5.0 — 2026-09-05

- Added real reading runs and daily reading sessions with ownership-based RLS.
- Added quick check-ins, optional pages/minutes/progress, backdated entries and notes.
- Added real week, month and year calendar views with book covers and deletable day entries.
- Added current and longest streaks with the today grace window in the saved timezone.
- Made provider covers resilient: Russian search is preferred, remote covers are normalized into private storage and failed images always show an accessible fallback.
- Added a closed-beta Vercel deployment checklist.

## 0.4.0 — 2026-09-05

- Replaced fictional books with each signed-in account's private personal library.
- Added Google Books search with Open Library fallback and fully manual entry.
- Added book creation, editing, filtering, archiving and deletion.
- Added private validated custom-cover uploads with ownership-based storage policies.
- Removed timezone selection from onboarding and kept automatic detection for future calendar-day boundaries.
- Replaced misleading demo calendar, series and recap data with honest empty states for signed-in accounts.

## 0.3.1 — 2026-09-05

- Added a connected Supabase health/schema check for the configured development project.
- Made the regular runtime suite deterministic even when a local Supabase configuration is present.
- Prepared the Windows handoff for the connected `shelf-seasons-dev` environment.

## 0.3.0 — 2026-09-05

- Added Supabase SSR client boundaries for standard Next.js 16.
- Added Google OAuth start, PKCE callback, safe local sign-out and protected app routes.
- Added bilingual sign-in and onboarding for locale, timezone, theme and optional yearly goal.
- Added the first ordered migration, ownership-based RLS policies, typed database definitions and pgTAP policy tests.
- Kept a no-credentials demo mode so the interface remains runnable before Supabase setup.

## 0.2.0 — 2026-09-04

- Replaced the Vinext, Vite and Cloudflare Worker development runtime with
  standard Next.js, matching the local workflow used by `vmeste-app`.
- Removed Cloudflare asset bindings and the image-optimization path that failed
  during Windows development.
- Added clean-install runtime tests for both languages, every primary route,
  generated CSS, client scripts and the bundled book cover.

## 0.1.3 — 2026-09-04

- Fixed the unstyled Windows development page by removing the local public
  asset binding that intercepted Vite's generated CSS and client modules.
- Kept development book covers on their direct public URLs, so local image
  loading no longer depends on Cloudflare image bindings.

## 0.1.2 — 2026-09-04

- Fixed local book-cover loading by declaring the `public` asset binding and
  serving public covers directly when the app runs in development mode.

## 0.1.1 — 2026-09-03

- Fixed `npm run dev`, build, lint and related scripts for Windows PowerShell.
- Added an automated guard against Unix-only npm scripts returning to the project.

## 0.1.0 — 2026-09-03

- Created the Shelf Seasons Stage 0/1 foundation.
- Added bilingual English/Russian routes and navigation.
- Added responsive Home, Library, Calendar, Series, Recaps and Settings demos.
- Added light/dark theme behavior, localized sample content and reading check-in interaction.
- Added PWA metadata, an original fictional cover asset and accessibility foundations.
- Added the approved product, data, design, localization and release documentation.
