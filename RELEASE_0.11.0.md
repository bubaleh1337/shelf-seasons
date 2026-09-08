# Shelf Seasons 0.11.0

This release redesigns the seasonal experience with scroll-bound page artwork and physical, interactive wooden shelves.

## Database and environment

No new Supabase migration or Vercel environment variable is required. Version 0.10.0 migrations must already be applied.

## Windows update

After replacing the project files, run:

```powershell
.\UPDATE_TO_0.11.0.ps1
npm ci
npm run test:connected
npm run release:check
```

Then start locally with `npm run dev`. To publish, commit and push the verified files to `main`; the connected Vercel project will deploy them automatically.
