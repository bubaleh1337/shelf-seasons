# Master prompt for the first Codex build

Copy the prompt below into Codex after creating and opening the empty `shelf-seasons` repository and placing this planning package in its root.

---

You are starting the Shelf Seasons product from an empty repository.

Shelf Seasons is a bilingual English/Russian reading journal with the feeling of a cozy home library. The canonical brand is exactly `Shelf Seasons`; the canonical technical slug is exactly `shelf-seasons`. Never translate, transliterate or substitute the brand.

First read, in full:

1. `AGENTS.md`
2. `PRODUCT_SPEC.md`
3. `docs/DECISIONS.md`
4. `docs/LOCALIZATION.md`
5. `docs/DESIGN_SYSTEM.md`
6. `docs/UX_FLOWS.md`
7. `docs/DATA_MODEL.md`
8. `docs/ROADMAP.md`

Then inspect the repository and propose a concise implementation plan for **Stage 0 and Stage 1 only**. If an existing scaffold or user changes are present, preserve them. Resolve contradictions using the documented source-of-truth order; ask before inventing a major product decision.

Implement Stage 0 and Stage 1 as a polished, runnable foundation:

- Next.js App Router, React and strict TypeScript;
- Tailwind CSS and design tokens matching `docs/DESIGN_SYSTEM.md`;
- `next-intl` with locale-prefixed `/en` and `/ru` routes;
- English and Russian messages with automated key-parity checks;
- responsive app shell and navigation;
- demo-data screens for Home, Library, Calendar, Series and Recaps;
- reusable book-cover, book-card, status, empty-state, dialog and feedback primitives;
- light/dark/system theme support;
- accessible keyboard behavior, visible focus, reduced motion and 44×44 px touch targets;
- PWA manifest, canonical `Shelf Seasons` metadata and an honest offline fallback;
- formatter, lint, type-check, unit tests, basic accessibility checks and production build scripts;
- `.env.example`, CI, changelog and concise setup documentation.

Use deliberately reviewed compatible dependency versions and commit the lockfile. Do not use floating or unreviewed `latest` versions. Do not add Supabase, OAuth credentials, real provider calls, production analytics, deployment or paid services in these stages. Use typed local demo fixtures behind interfaces that can later be replaced by real repositories.

The visual result should feel calm, literary and warm, not like a productivity dashboard. Use the documented Fraunces/Manrope typography direction, book-cover-led layouts, restrained motion and strong accessibility. Avoid excessive cards, gradients, glassmorphism and gamified pressure.

Required behavior:

- every user-facing string is localized in English and Russian;
- Russian copy is gender-neutral;
- product title is `Shelf Seasons — Reading Journal` in English and `Shelf Seasons — Дневник чтения` in Russian;
- mobile navigation is usable at 320 px;
- long Russian strings do not overflow;
- missing covers use an intentional placeholder;
- demo dates are formatted through locale-aware utilities;
- no UI implies that demo reading data has been saved to a real account.

Before finishing:

1. run a clean install from the lockfile;
2. run format check, lint, type-check, unit tests and production build;
3. inspect the main screens at 320, 768 and 1440 px in both locales and themes when preview tools are available;
4. fix failures rather than hiding them;
5. update `CHANGELOG.md` and any affected docs.

Return a handoff that leads with the working outcome and includes:

- what was implemented;
- major decisions and any deviations from the plan;
- key files changed;
- commands run and their results;
- how to start the app in Windows PowerShell;
- anything still unverified;
- the single recommended next stage.

Do not deploy or create external projects. Stop after the verified Stage 0/1 foundation.

---
