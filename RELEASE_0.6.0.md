# Shelf Seasons 0.6.0

This release adds the first complete book-finish ritual and a live yearly reading goal.

## What is included

- finish the current book without editing its shelf manually;
- optional 0.5–5 rating and short impression;
- optional favorite or disappointment nomination;
- completed book immediately leaves the “Reading” card;
- editable yearly goal with an include-rereads option;
- goal progress updates immediately after completion;
- books added directly as read now create a completed reading run;
- completion is idempotent, owner-checked and protected by RLS.

## Install over 0.5.5 on Windows

1. Stop `npm run dev` with `Ctrl+C`.
2. Copy every file from this archive into `P:\Projects\shelf-seasons\shelf-seasons` and replace existing files.
3. Run:

```powershell
Set-Location P:\Projects\shelf-seasons\shelf-seasons
.\UPDATE_TO_0.6.0.ps1
npm ci
npm run release:check
```

4. In Supabase SQL Editor, run the entire file:

```text
supabase/migrations/202609060001_completion_and_goals.sql
```

5. Commit and push so Vercel deploys the same verified source:

```powershell
git add -A
git commit -m "feat: add book completion and yearly goals"
git push origin main
```

No Google, Supabase URL or Vercel environment setting changes are required for this release.
