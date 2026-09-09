# Shelf Seasons 0.14.0

This release fixes reading progress, recap duplicates, seasonal composition and localized cover upload controls.

## Included

- page-bottom seasonal illustrations with an independently centered autumn garland;
- one current-page input with automatic server-side percentage calculation;
- current page and progress bar on Home;
- prevention of new duplicate completed runs without deleting reading history;
- unique books in recap cards and category selectors;
- localized Russian and English cover file controls;
- responsive desktop and mobile styles.

## Required Supabase migration

Run `supabase/migrations/202609090001_reading_progress_and_recap_deduplication.sql` once in Supabase SQL Editor before using the new reading form.

No new Vercel environment variable is required.
