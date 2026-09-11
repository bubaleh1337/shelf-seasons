# Changelog

## 0.19.3

- Book create/edit now continues when only the rate-limit infrastructure is temporarily unavailable; real request limits still return 429.
- Save failures now show specific Russian and English messages instead of one generic error.
- Added a dedicated regression test for search в†’ choose в†’ mark as read в†’ save.
- Removing a custom cover no longer deletes the stored file before the book metadata update has succeeded.
## 0.19.2

- Decoupled Google Books/Open Library cover persistence from the critical book create/edit request.
- Book metadata and reading status now save even when a remote cover download, image conversion or Storage write is slow or fails.
- Provider covers are repaired in the background after a successful save.
- Custom user-uploaded covers remain synchronous and validated before the save is reported successful.
- Editing an imported book now preserves its original provider identity so later cover repair can still recover the catalog cover.
## 0.19.1

- Renamed the yearly-goal details action to `View goal` / `РџРѕСЃРјРѕС‚СЂРµС‚СЊ С†РµР»СЊ`.
- Stacked yearly-goal actions at full card width on phones so buttons no longer overflow or collide.
- Preserved the compact horizontal action layout on larger screens.

## 0.19.0

- Replaced oversized yearly-goal covers with fixed compact 36 Г— 54 px thumbnails on desktop and mobile.
- Added a separate confirmed reread action for completed books; ordinary metadata saves never start another reading run.
- Kept completed reading history intact when a reread starts and made the behavior explicit in Russian and English.
- Added browser-side Google Books and Open Library fallbacks so a server quota or rate-limit infrastructure failure no longer disables discovery.
- Expanded instant translated-title fallbacks for common Russian searches including `РҐРѕР±Р±РёС‚` and `Р’РµРґСЊРјР°Рє`.
- Kept manual book entry available when every external catalog is unavailable.

## 0.18.0

- Added an inspectable yearly-goal breakdown with every counted title, completion date and reread label.
- Added a protected way to remove an accidental duplicate reread while keeping the original completed reading history.
- Clarified that yearly goals count completed reading runs rather than the current number of library cards.
- Fixed the Russian `РРіСЂР° РїСЂРµСЃС‚РѕР»РѕРІ` search with a fast translated-title fallback through Open Library.
- Bounded and parallelized provider requests so a slow translation service no longer exhausts the server request budget.
- Added distinct localized messages for temporary search outages and rate limits.

## 0.17.1

- Made every book card in the Home library preview open the existing book editor.
- Added full-card pointer, keyboard focus and pressed feedback without changing the separate Library link.
- Added complete Russian and English accessible labels for opening book details.

## 0.17.0

- Updated Next.js and Sharp to patched releases and removed all known production dependency vulnerabilities reported by `npm audit`.
- Added database-backed rate limits for expensive book search, book editing and cover-repair routes.
- Added Content Security Policy and other browser security headers and removed the framework disclosure header.
- Localized document language, page metadata and search-engine indexing rules for Russian and English routes.
- Added bilingual privacy policy and terms of use with links from sign-in and Settings.
- Limited remote cover downloads by bytes and reduced automatic cover-repair retries to at most once per week after success.
- Added Android and Apple PWA icons and removed the unused 3.1 MB PNG cover asset.

## 0.16.0

- Added an automatic daily Supabase database export with a manual GitHub Actions trigger.
- Encrypted every backup with a dedicated age public key before uploading it.
- Added 30-day artifact retention, internal SHA-256 checksums and plaintext cleanup.
- Added a Windows verification script and a documented non-production restore rehearsal.
- Documented that database dumps do not contain Supabase Storage object bytes or provider configuration.

## 0.15.0

- Fixed authenticated language switching so the saved profile locale changes before navigation.
- Let every book category in Recaps choose from the entire personal library, including paused and unfinished books.
- Replaced ambiguous seasonal recap copy with explicit monthly and yearly headings in Russian and English.
- Shortened the developer name to Ekaterina / Р•РєР°С‚РµСЂРёРЅР°.
- Parallelized initial data loading, batched signed cover links and split heavier sections into deferred client chunks.
- Reduced the bundled demonstration cover from 3.1 MB to 153 KB.
- Added optional server-side Google Books API key support and reduced redundant translated-title requests.

## 0.14.1

- Added a readable surface beneath every book cover on Home and Library.
- Kept status, language, season, title and author together inside the protected text surface.
- Removed the detached autumn garland from desktop and mobile layouts.

## 0.14.0

- Anchored each seasonal still life to the true bottom-right of the page and centered the autumn garland independently.
- Replaced manual page and percentage calculations with one current-page field and server-calculated progress.
- Added the current page and progress bar to the active book on Home.
- Prevented ordinary book edits from creating duplicate completed reading runs and deduplicated recap books and selectors.
- Preserved existing reading history while deduplicating recap presentation.
- Replaced the browser-native cover picker text with fully localized Russian and English controls.

## 0.13.0

- Replaced sparse seasonal corner decorations with an atmospheric full-page seasonal backdrop.
- Added original paper texture, layered light, large edge foliage and a cozy illustrated still life for every season.
- Added autumn books, coffee, pumpkins and string lights, plus distinct spring, summer and winter motifs.
- Kept all decoration scroll-bound, non-interactive and safely behind application content on desktop and mobile.

## 0.12.0

- Added a bilingual developer card with direct email and Telegram contacts.
- Added a Buy Me a Coffee support button using the project's public donation page.
- Added compact desktop sidebar contact actions and a mobile Settings shortcut so the contact card is reachable on every supported screen size.
- Protected external links against opener access and kept all contact actions keyboard accessible.

## 0.11.0

- Replaced the fixed emoji motif with calm, scroll-bound seasonal artwork that decorates the page without covering interface copy.
- Rebuilt seasonal collections as physical wooden shelves with illustrated spring, summer, autumn and winter objects.
- Displayed books spine-first on each shelf and moved the full cover grid and edit actions into an accessible shelf dialog.
- Ordered shelves from the reader's current season and continued through the following seasons chronologically.

## 0.10.0

- Added four illustrated seasonal shelves and a subtle automatic spring, summer, autumn or winter application palette.
- Added reading language to books and immutable reading-run history, plus RU/EN/other counts in recaps.
- Added translated-title discovery for Russian searches and stronger Google Books/Open Library cover recovery.
- Rebuilt calendar day cards so book title and author remain readable alongside the cover.
- Added an always-visible Add book action to Home and seasonal/language badges throughout the library.

## 0.9.0

- Added immediate pending feedback to desktop and mobile navigation.
- Added JSON account export and protected self-service account deletion.
- Added a visible app version and removed the technical timezone row.
- Removed the obsolete generated Sites runtime cache from future Git tracking.

## 0.8.0

- Added deterministic live and final monthly/yearly recap screens from real reading runs and sessions.
- Added completed-book mosaics, unique books, rereads, reading days, period streaks, detailed page/time totals, active weeks and yearly goal results.
- Added editable favorite book, disappointment, favorite cover and favorite series selections.
- Added database eligibility validation, ownership RLS and explicit exclusion of private notes and impressions from recap responses.

## 0.7.0

- Added user-owned book series with bilingual creation, editing and deletion flows.
- Added ordered linked books and future-volume placeholders with accessible move controls.
- Added automatic read progress, next-volume display and a one-click start-next-book action.
- Added composite ownership constraints, RLS policies and a trusted atomic reorder function.

## 0.6.0

- Added an idempotent finish-book ritual with completion date, optional rating, impression and recap nomination.
- Added an editable yearly goal calculated from authoritative completed reading runs, with optional reread counting.
- Made direct вЂњReadвЂќ shelf changes create a completed run and refresh the interface from the server.
- Added owner-bound nomination storage, RLS policies and regression coverage for completion and goal calculations.

## 0.5.5

- Start Google OAuth in the browser so Supabase stores the PKCE verifier on the same device before leaving for Google.
- Complete the OAuth code exchange in the server callback and attach the new session cookies to the protected-app redirect.
- Added precise production and localhost URL configuration instructions plus safe cleanup for obsolete 0.5.4 OAuth files.

## 0.5.4

- Removed the callback route/page collision that prevented Vercel from deploying 0.5.3.
- Split the OAuth callback redirect and browser-side PKCE exchange across separate routes.
- Added a Windows cleanup script that safely removes only the two obsolete callback files left by archive overlays.

## 0.5.3

- Moved the OAuth code exchange into the browser callback page so Vercel cannot lose the new session cookie between two server redirects.
- Excluded authentication routes from session-refresh middleware during the PKCE handshake.
- Added a bilingual, accessible sign-in completion screen and callback regression coverage.

## 0.5.2

- Fixed Google OAuth session cookies across Vercel redirects.
- Kept OAuth callbacks on the exact hostname where sign-in started.
- Added multi-pass Google Books search with unrestricted fallback.
- Ranked matching-language and matching-script book editions first.
- Added a clear empty search state with manual-entry fallback.

## 0.5.1 вЂ” 2026-09-05

- Fixed the Home page so only a book on the Reading shelf can appear as the current book.
- Added a bilingual empty state when the library has books but none are currently being read.
- Synchronized library shelf changes with active reading runs and repaired stale runs left by 0.5.0.
- Added deterministic Vercel build configuration and automatic Vercel production-origin detection.
- Added regression coverage for completed books, recent current-book selection, status transitions and deployment configuration.

## 0.5.0 вЂ” 2026-09-05

- Added real reading runs and daily reading sessions with ownership-based RLS.
- Added quick check-ins, optional pages/minutes/progress, backdated entries and notes.
- Added real week, month and year calendar views with book covers and deletable day entries.
- Added current and longest streaks with the today grace window in the saved timezone.
- Made provider covers resilient: Russian search is preferred, remote covers are normalized into private storage and failed images always show an accessible fallback.
- Added a closed-beta Vercel deployment checklist.

## 0.4.0 вЂ” 2026-09-05

- Replaced fictional books with each signed-in account's private personal library.
- Added Google Books search with Open Library fallback and fully manual entry.
- Added book creation, editing, filtering, archiving and deletion.
- Added private validated custom-cover uploads with ownership-based storage policies.
- Removed timezone selection from onboarding and kept automatic detection for future calendar-day boundaries.
- Replaced misleading demo calendar, series and recap data with honest empty states for signed-in accounts.

## 0.3.1 вЂ” 2026-09-05

- Added a connected Supabase health/schema check for the configured development project.
- Made the regular runtime suite deterministic even when a local Supabase configuration is present.
- Prepared the Windows handoff for the connected `shelf-seasons-dev` environment.

## 0.3.0 вЂ” 2026-09-05

- Added Supabase SSR client boundaries for standard Next.js 16.
- Added Google OAuth start, PKCE callback, safe local sign-out and protected app routes.
- Added bilingual sign-in and onboarding for locale, timezone, theme and optional yearly goal.
- Added the first ordered migration, ownership-based RLS policies, typed database definitions and pgTAP policy tests.
- Kept a no-credentials demo mode so the interface remains runnable before Supabase setup.

## 0.2.0 вЂ” 2026-09-04

- Replaced the Vinext, Vite and Cloudflare Worker development runtime with
  standard Next.js, matching the local workflow used by `vmeste-app`.
- Removed Cloudflare asset bindings and the image-optimization path that failed
  during Windows development.
- Added clean-install runtime tests for both languages, every primary route,
  generated CSS, client scripts and the bundled book cover.

## 0.1.3 вЂ” 2026-09-04

- Fixed the unstyled Windows development page by removing the local public
  asset binding that intercepted Vite's generated CSS and client modules.
- Kept development book covers on their direct public URLs, so local image
  loading no longer depends on Cloudflare image bindings.

## 0.1.2 вЂ” 2026-09-04

- Fixed local book-cover loading by declaring the `public` asset binding and
  serving public covers directly when the app runs in development mode.

## 0.1.1 вЂ” 2026-09-03

- Fixed `npm run dev`, build, lint and related scripts for Windows PowerShell.
- Added an automated guard against Unix-only npm scripts returning to the project.

## 0.1.0 вЂ” 2026-09-03

- Created the Shelf Seasons Stage 0/1 foundation.
- Added bilingual English/Russian routes and navigation.
- Added responsive Home, Library, Calendar, Series, Recaps and Settings demos.
- Added light/dark theme behavior, localized sample content and reading check-in interaction.
- Added PWA metadata, an original fictional cover asset and accessibility foundations.
- Added the approved product, data, design, localization and release documentation.


