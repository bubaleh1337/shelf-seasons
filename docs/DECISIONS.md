# Shelf Seasons: product and architecture decisions

These decisions are binding until deliberately replaced by a dated decision in this file.

## D-001 — one international brand

**Decision:** the brand is `Shelf Seasons` in every language. Technical identifiers use `shelf-seasons`.

**Why:** translation and infrastructure must never diverge into names such as `vmeste` versus `Together`.

## D-002 — web-first installable product

**Decision:** begin with a responsive PWA. Do not build separate native apps for MVP.

**Why:** one codebase supports desktop and mobile testing, rapid iteration and a realistic first release. Native packaging remains possible after product validation.

## D-003 — implementation stack

**Decision:** Next.js App Router, React, TypeScript, Tailwind CSS, `next-intl`, Supabase and Vercel. Pin reviewed versions and commit the lockfile; never rely on an unreviewed `latest` upgrade.

**Why:** the stack has strong type safety, accessible component options, managed authentication/storage/database and a practical deployment path.

## D-004 — localization from the first component

**Decision:** English and Russian ship together from Stage 1. Locale-prefixed routes and translation keys are architectural requirements.

**Why:** retrofitting localization changes routes, layouts, copy, dates, plurals and tests. Starting bilingual prevents another naming and infrastructure mismatch.

## D-005 — Google first, Apple later

**Decision:** MVP authentication uses Google OAuth. Apple sign-in is a later release item, not a launch blocker.

**Why:** Apple web sign-in adds operational key and secret rotation responsibilities. One provider reduces early failure modes without preventing Apple later.

## D-006 — user-owned book snapshots

**Decision:** each library item stores the user's normalized snapshot of title, authors, cover and provider identifiers. There is no mutable global catalog in MVP.

**Why:** personal edits and custom covers should not change another user's library, and provider data can disappear or change.

## D-007 — reading runs model rereads

**Decision:** reading a book is represented by a `reading_run`. Rereading creates another run for the same library book.

**Why:** a single `started_at`/`finished_at` pair loses history and makes yearly goals, calendars and reread statistics ambiguous.

## D-008 — sessions are the source of reading activity

**Decision:** calendar days and streaks are derived from explicit reading sessions. Opening the app, changing status or editing a book does not count as reading.

**Why:** the habit metric must reflect intentional user input and remain auditable.

## D-009 — today grace window for current streak

**Decision:** if the user has not logged today but did log yesterday, yesterday's contiguous streak remains current until today ends in the user's timezone.

**Why:** a streak should not appear broken in the morning before the user has had a chance to read. If neither today nor yesterday qualifies, current streak is zero.

## D-010 — timezone is profile data

**Decision:** store UTC timestamps plus `profiles.timezone` as an IANA identifier. Daily calculations use that timezone.

**Why:** device timezone can change during travel and UTC calendar grouping produces incorrect days.

## D-011 — custom covers are private

**Decision:** user-uploaded cover objects live in a private bucket and are delivered with short-lived signed access or an authenticated proxy.

**Why:** covers may contain personal scans or notes and should not become enumerable public assets.

## D-012 — manual series and placeholders

**Decision:** series are user-owned, manually editable ordered collections. Entries may reference a library book or be a title-only placeholder.

**Why:** provider series metadata is inconsistent, while readers often know an intended order before owning every volume.

## D-013 — goals count completed runs

**Decision:** a yearly goal counts completed reading runs and includes rereads by default. An explicit preference may exclude reread runs.

**Why:** both conventions are valid. An explicit, visible preference makes the count predictable.

## D-014 — no social layer in MVP

**Decision:** no followers, public profiles, comments, messaging or shared libraries in MVP.

**Why:** they add moderation, privacy and abuse surfaces before the private journal experience is validated.

## D-015 — provider resilience

**Decision:** Google Books is the primary discovery source; Open Library may supply cover fallback; manual entry is always available.

**Why:** external APIs have gaps, quotas and outages. A personal library must not depend on provider uptime.

## D-016 — privacy before analytics

**Decision:** avoid storing private notes, book titles or cover URLs in analytics and error breadcrumbs. Collect only data required for reliability and product-level usage measurement.

**Why:** reading history is personal data, and observability must not silently duplicate it.

## D-017 — documents are the contract

**Decision:** implementation follows this priority when documents conflict:

1. `PRODUCT_SPEC.md`;
2. `docs/DECISIONS.md`;
3. domain-specific documents;
4. `AGENTS.md` for engineering process;
5. `docs/ROADMAP.md` for the active stage;
6. `README.md`;
7. current code behavior.

**Why:** explicit product rules should outrank accidental implementation details.

## D-018 — production actions require explicit approval

**Decision:** agents may prepare code and configuration, but must not purchase a domain, create paid resources, deploy production, rotate secrets or mutate production data without an explicit request.

**Why:** these actions carry cost, external side effects or recovery risk.

## D-019 — timezone is automatic in onboarding

**Decision:** detect the IANA timezone from the browser and store it without asking the user to choose during onboarding. Show the saved value only as an informational setting until travel/timezone editing is implemented.

**Why:** day boundaries still need a timezone, but choosing one is unnecessary friction for almost every new user.
