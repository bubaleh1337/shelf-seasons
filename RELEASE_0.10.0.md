# Shelf Seasons 0.10.0

This release adds seasonal shelves, reading languages, translated-title search, stronger provider covers and readable calendar book cards.

## Required database migration

Before starting the new application version, open Supabase SQL Editor, paste the complete contents of `supabase/migrations/202609070004_seasons_and_languages.sql`, and run it once.

## Windows update

After replacing the project files, run:

```powershell
.\UPDATE_TO_0.10.0.ps1
npm ci
npm run test:connected
npm run release:check
```

Then start locally with `npm run dev`. To publish, commit and push the verified files to `main`; the connected Vercel project will deploy them automatically.
