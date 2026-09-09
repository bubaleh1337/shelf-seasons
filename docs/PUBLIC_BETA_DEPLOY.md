# Closed public beta on Vercel

Version 0.15.0 can be shared with a small group through a public Vercel URL. This is a beta, not the final public release: legal pages, monitoring, rate limits and a restore rehearsal remain on the roadmap.

## Before deployment

1. After overlaying the 0.15.0 archive on Windows, run `.\UPDATE_TO_0.15.0.ps1` once to remove generated caches from the previous source version.
2. Apply every migration in `supabase/migrations` in filename order. The new 0.15.0 migration is `202609090002_recap_library_choices.sql`.
3. Run `npm run release:check` and push version 0.15.0 to the GitHub `main` branch.
4. Import `bubaleh1337/shelf-seasons` in Vercel.
5. Add these Production environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL` = the existing Supabase project URL;
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = the existing publishable key.
   - `GOOGLE_BOOKS_API_KEY` = an optional restricted server-side key, recommended before sharing the app publicly.

Vercel supplies the production hostname automatically. `NEXT_PUBLIC_APP_URL` is optional and is only needed later for a custom domain or to override the generated Vercel hostname.

## OAuth URLs

In Supabase **Authentication → URL Configuration**:

- set **Site URL** to `https://shelf-seasons.vercel.app` — production must never use `http://`;
- add `https://shelf-seasons.vercel.app/auth/callback` to **Redirect URLs**;
- keep `http://localhost:3000/auth/callback` as a second Redirect URL for local development.

In Vercel **Environment Variables**, production needs the matching Supabase project URL and publishable key. Do not place the Google Client Secret in Vercel.

In Google Auth Platform, keep the Supabase callback URI unchanged. If the OAuth app is still in Testing, add each beta tester's Google email under **Audience → Test users**.

Test sign-in, book status changes and reading check-ins in a private browser window before sharing the link.
