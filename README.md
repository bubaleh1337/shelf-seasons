# Shelf Seasons

**Your reading life, season by season.**

Shelf Seasons is a cozy bilingual reading journal and visual book tracker. This repository currently contains the verified Stage 0/1 product foundation: responsive demo screens, English/Russian routes, themes, PWA metadata and the complete planning contract.

The brand is always **Shelf Seasons**. The technical slug is always `shelf-seasons`.

## Current demo

- `/ru/app` — Russian Home
- `/en/app` — English Home
- `/[locale]/app/library` — searchable/filterable cover library
- `/[locale]/app/calendar` — week, month and year reading views
- `/[locale]/app/series` — ordered series overview
- `/[locale]/app/recaps` — monthly reading recap
- `/[locale]/app/settings` — language, timezone and theme demo

The `Log reading` flow updates only local component state. No account or database is connected in Stage 0/1.

## Windows PowerShell

Prerequisite: Node.js 22 or newer.

```powershell
Set-Location P:\Projects\shelf-seasons
npm ci
npm run dev
```

Open the local address printed by the development server.

Verification:

```powershell
npm run typecheck
npm run lint
npm test
```

## Product documents

Read in this order before implementation work:

1. `PRODUCT_SPEC.md`
2. `docs/DECISIONS.md`
3. the relevant domain document in `docs/`
4. `AGENTS.md`
5. `docs/ROADMAP.md`

## Next stage

Stage 2 adds separate development/production Supabase projects, Google OAuth, profile preferences and tested Row Level Security. Do not add production credentials to this repository.
