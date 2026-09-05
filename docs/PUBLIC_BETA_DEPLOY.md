# Closed public beta on Vercel

Version 0.5.0 can be shared with a small group through a public Vercel URL. This is a beta, not the final public release: account export/deletion, legal pages and release monitoring remain on the roadmap.

## Before deployment

1. Apply `supabase/migrations/202609050003_reading_tracker.sql` once.
2. Push version 0.5.0 to the GitHub `main` branch.
3. Import `bubaleh1337/shelf-seasons` in Vercel.
4. Add these Production environment variables in Vercel:
   - `NEXT_PUBLIC_APP_URL` = the final `https://...vercel.app` address;
   - `NEXT_PUBLIC_SUPABASE_URL` = the existing Supabase project URL;
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = the existing publishable key.

## OAuth URLs

In Supabase **Authentication → URL Configuration**:

- set **Site URL** to the Vercel HTTPS address;
- add `https://YOUR-VERCEL-DOMAIN/auth/callback` to **Redirect URLs**;
- keep the localhost callback for local development.

In Google Auth Platform, keep the Supabase callback URI unchanged. If the OAuth app is still in Testing, add each beta tester's Google email under **Audience → Test users**.

Redeploy after setting `NEXT_PUBLIC_APP_URL`. Test sign-in in a private browser window before sharing the link.
