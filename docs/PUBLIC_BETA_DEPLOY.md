# Closed public beta on Vercel

Version 0.5.4 can be shared with a small group through a public Vercel URL. This is a beta, not the final public release: account export/deletion, legal pages and release monitoring remain on the roadmap.

## Before deployment

1. After overlaying the 0.5.4 archive on Windows, run `node .\scripts\update-to-0.5.4.mjs` once to remove obsolete 0.5.3 callback files.
2. Apply `supabase/migrations/202609050004_library_status_sync.sql` once, after migration `003`.
3. Run `npm run release:check` and push version 0.5.4 to the GitHub `main` branch.
4. Import `bubaleh1337/shelf-seasons` in Vercel.
5. Add these Production environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL` = the existing Supabase project URL;
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = the existing publishable key.

Vercel supplies the production hostname automatically. `NEXT_PUBLIC_APP_URL` is optional and is only needed later for a custom domain or to override the generated Vercel hostname.

## OAuth URLs

In Supabase **Authentication → URL Configuration**:

- set **Site URL** to the Vercel HTTPS address;
- add `https://YOUR-VERCEL-DOMAIN/auth/callback` to **Redirect URLs**;
- keep the localhost callback for local development.

In Google Auth Platform, keep the Supabase callback URI unchanged. If the OAuth app is still in Testing, add each beta tester's Google email under **Audience → Test users**.

Test sign-in, book status changes and reading check-ins in a private browser window before sharing the link.
