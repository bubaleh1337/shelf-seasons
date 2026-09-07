# Shelf Seasons 0.9.0

This release adds immediate navigation feedback and private account-data controls.

Apply `supabase/migrations/202609070003_account_controls.sql`, then run:

```powershell
.\UPDATE_TO_0.9.0.ps1
npm ci
npm run test:connected
npm run release:check
```
