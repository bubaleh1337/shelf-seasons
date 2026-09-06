# Shelf Seasons: staged roadmap

Build one verified vertical slice at a time. A stage is complete only after its exit criteria pass. Production deployment is a separate explicit user decision.

## Stage 0 — repository and guardrails

Deliverables:

- create the `shelf-seasons` repository and default branch;
- add this planning package at the repository root;
- scaffold the app with strict TypeScript and a committed lockfile;
- add formatter, linting, type-checking and test commands;
- add `.env.example`, `.gitignore`, CI and a changelog;
- establish `main` as production-ready and use short-lived feature branches.

Exit criteria:

- clean install succeeds from the lockfile;
- lint, type-check, unit tests and production build pass;
- no secret or environment-specific identifier is committed;
- brand checks find only the canonical technical name.

## Stage 1 — bilingual design shell

Deliverables:

- locale-prefixed routes for `en` and `ru`;
- responsive app shell and navigation;
- design tokens, typography, light and dark themes;
- polished demo-data versions of Home, Library, Calendar, Series and Recaps;
- reusable cover, book card, status chip, empty state and dialog components;
- manifest, icons, installable PWA baseline and offline fallback page.

Exit criteria:

- the complete navigation works on mobile and desktop;
- all demo screens work in both locales without overflow;
- keyboard navigation, visible focus and reduced motion are verified;
- screenshots at 320, 768 and 1440 px have no obvious layout defects.

## Stage 2 — accounts, profiles and security foundation

Status: completed and verified by the owner in the development Supabase project.

Deliverables:

- separate development and production Supabase projects;
- migrations for profile/preferences;
- Google OAuth and protected routes;
- onboarding for locale, timezone, theme and optional yearly goal;
- RLS tests and typed database client boundaries;
- safe sign-out and account session handling.

Exit criteria:

- a new user can sign in, finish onboarding and sign out;
- one account cannot read or mutate another account's rows;
- authentication errors are translated and recoverable;
- callback and redirect URLs are constrained to approved origins.

## Stage 3 — personal library

Status: the core vertical slice ships in `0.4.0`: search/manual creation, private custom covers, statuses, filters, edit, archive and delete. Ratings, duplicate warnings and density controls remain for a later Stage 3 increment.

Deliverables:

- book search through Google Books with Open Library cover fallback;
- manual book creation when providers fail;
- private custom-cover upload, validation and replacement;
- statuses, formats, ratings, notes and filters;
- grid/list density controls and book detail screen;
- duplicate warning without destructive automatic merging.

Exit criteria:

- add, edit, filter and remove flows work end to end;
- broken providers never block manual entry;
- custom covers are private and cleaned up correctly;
- provider payloads are normalized and untrusted URLs are handled safely.

## Stage 4 — reading log, calendar and streaks

Status: completed through `0.6.0`: quick/detailed sessions, backdating, real week/month/year views, deletion, streak calculations, synchronized statuses and the full finish-book ritual.

Deliverables:

- reading runs and reading sessions;
- fast `Log today's reading` check-in;
- detailed/backdated entry with pages or minutes;
- week, month and year cover calendar;
- current and longest streak calculations in the user's timezone;
- tests across DST, month/year boundaries, edits and deletes.

Exit criteria:

- a check-in takes no more than a few seconds;
- session edits immediately recompute calendar and streaks;
- the current streak keeps yesterday's run alive until today ends;
- no streak is changed merely by opening the app.

## Stage 5 — goals, series and finishing rituals

Status: yearly goals and finishing rituals ship in `0.6.0`; manual series remain the next increment.

Deliverables:

- yearly book goal with reread preference;
- manual series with ordered books and placeholders;
- series progress and next-book action;
- finish-book flow, rating and monthly/yearly nominations;
- rereading as a new reading run.

Exit criteria:

- goals and series are computed from authoritative run data;
- finishing a book is idempotent;
- removing or reordering a series entry preserves other data;
- nominations can be edited later.

## Stage 6 — recaps and account control

Deliverables:

- monthly and yearly recap screens;
- best/worst/favorite selections from eligible books;
- shareable privacy-safe recap image;
- JSON export;
- account deletion with database and storage cleanup;
- notification preferences without guilt-based messaging.

Exit criteria:

- recaps remain deterministic after refresh;
- private notes never appear in shared images;
- export content matches its documentation;
- deletion has a clear confirmation and verified cleanup path.

## Stage 7 — release hardening and closed beta

Deliverables:

- privacy policy, terms, support and data-deletion information;
- analytics and error monitoring with data minimization;
- rate limits, abuse protection and provider quotas;
- performance, accessibility and restore rehearsal;
- closed beta feedback cycle;
- production deployment and domain only after explicit approval.

Exit criteria:

- release checklist is complete;
- critical user journeys pass on current Safari, Chrome and mobile PWA modes;
- backup restoration is rehearsed;
- no P0/P1 defects remain;
- owner approves the public release.

## Suggested delivery rhythm

Keep stages small enough to review visually. Each stage should produce:

1. a short implementation plan;
2. the change itself;
3. automated verification;
4. screenshots or a preview for visual review;
5. changelog and documentation updates;
6. one explicit decision about what comes next.
