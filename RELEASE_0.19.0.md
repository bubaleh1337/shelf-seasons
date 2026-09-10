# Shelf Seasons 0.19.0

This release makes rereading explicit, keeps yearly-goal details compact and
adds a second route around production book-search failures.

## Included

- completed books now have a separate confirmed `Start rereading` action;
- ordinary book edits cannot silently create a reread;
- starting a reread preserves the earlier completed run and creates a new run;
- yearly-goal rows use fixed 36 × 54 px cover thumbnails in every viewport;
- search combines the authenticated application endpoint with browser-side
  Google Books and Open Library requests;
- common Russian titles such as `Игра престолов`, `Хоббит` and `Ведьмак` have
  immediate English-title fallbacks;
- manual entry remains available if all catalog requests fail.

## Manual setup

No Supabase migration and no new required environment variable are needed.
A restricted `GOOGLE_BOOKS_API_KEY` in Vercel is still strongly recommended
for reliable search coverage after the app is shared more widely.
