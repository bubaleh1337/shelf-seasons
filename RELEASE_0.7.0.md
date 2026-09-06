# Shelf Seasons 0.7.0

This release replaces the series placeholder with a complete user-owned series workflow.

## Included

- create, edit and delete a series without changing its books;
- add owned library books or title-only future volumes;
- edit position labels and move volumes with keyboard-accessible buttons;
- calculate progress from real book statuses;
- show and start the next unread library book;
- protect series and entries with ownership constraints and RLS.

## Install over 0.6.0 on Windows

1. Stop the development server with `Ctrl+C`.
2. Copy every file from the archive into `P:\Projects\shelf-seasons\shelf-seasons` and replace existing files.
3. Run:

```powershell
Set-Location P:\Projects\shelf-seasons\shelf-seasons
.\UPDATE_TO_0.7.0.ps1
npm ci
npm run release:check
```

4. In Supabase SQL Editor, run the entire file:

```text
supabase/migrations/202609070001_series.sql
```

5. Verify the connected schema and deploy through Git:

```powershell
npm run test:connected
git add -A
git commit -m "feat: add book series and cycles"
git push origin main
```

Vercel deploys the pushed commit automatically. No environment or OAuth setting changes are required.
