# Shelf Seasons 0.8.0

This release replaces the recap placeholder with deterministic monthly and yearly reading recaps.

## Included

- live and final monthly/yearly recap periods;
- completed books, unique books, rereads, reading days and longest streak;
- pages and minutes labelled by the number of detailed sessions available;
- most active week, yearly goal result and cover mosaic;
- optional favorite book, disappointment, cover and series selections;
- owner-bound selection validation, RLS and private-note exclusion.

## Install over 0.7.0 on Windows

1. Stop the development server with `Ctrl+C`.
2. Copy every file from the archive into `P:\Projects\shelf-seasons\shelf-seasons` and replace existing files.
3. Run:

```powershell
Set-Location P:\Projects\shelf-seasons\shelf-seasons
.\UPDATE_TO_0.8.0.ps1
npm ci
npm run release:check
```

4. In Supabase SQL Editor, run the entire file:

```text
supabase/migrations/202609070002_recaps.sql
```

5. Verify the connected schema and deploy through Git:

```powershell
npm run test:connected
git add -A
git commit -m "feat: add monthly and yearly recaps"
git push origin main
```

Vercel deploys the pushed commit automatically. No environment or OAuth setting changes are required.
