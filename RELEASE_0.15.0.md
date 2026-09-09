# Shelf Seasons 0.15.0

This release fixes authenticated language switching, expands recap selections and improves initial loading performance.

## Included

- language changes are persisted before navigation, preventing the app from redirecting back to the previous locale;
- every book category in Recaps can use any book in the personal library, including paused and unfinished books;
- explicit monthly and yearly recap headings in Russian and English;
- the developer is shown simply as Ekaterina / Екатерина;
- parallel initial data requests and batched private-cover URL generation;
- lazy loading for Recaps, Series and Seasonal shelves;
- a 153 KB WebP demonstration cover replacing the previous 3.1 MB PNG;
- optional server-side Google Books API key support for a public beta.

## Required Supabase migration

Run `supabase/migrations/202609090002_recap_library_choices.sql` once in Supabase SQL Editor before deploying this version.

## Optional Vercel environment variable

For a public beta, add a restricted server-side `GOOGLE_BOOKS_API_KEY`. Existing book search still works without it, but the key gives Google Books requests a project identity and manageable quota.
