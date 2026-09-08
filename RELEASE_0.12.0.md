# Shelf Seasons 0.12.0

This release adds the developer's public contact details and a Buy Me a Coffee support action.

## Database and environment

No new Supabase migration, Google OAuth setting or Vercel environment variable is required.

## Windows update

After replacing the project files, run:

```powershell
.\UPDATE_TO_0.12.0.ps1
npm ci
npm run release:check
```

Then start locally with `npm run dev`. To publish, commit and push the verified files to `main`; the connected Vercel project will deploy them automatically.
