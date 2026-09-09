# Shelf Seasons 0.17.0

This release hardens the public beta before wider testing.

## Included

- patched Next.js, Sharp and transitive production dependencies;
- database-backed limits for book search, book writes and cover repair;
- security headers and removal of the framework disclosure header;
- localized titles, descriptions, document language and indexing rules;
- bilingual privacy policy and terms of use linked from sign-in and Settings;
- bounded remote-cover downloads and less frequent automatic cover repair;
- installable PNG and Apple touch icons;
- removal of the unused 3.1 MB PNG demonstration asset.

## Manual setup required

Before deploying the application, run
`supabase/migrations/202609090003_public_beta_hardening.sql` in the production
Supabase SQL Editor. It creates the private rate-limit table and its
authenticated atomic function.

No new Vercel or GitHub secret is required.
