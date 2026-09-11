# Shelf Seasons 0.19.3

This patch finishes hardening the critical book-save flow.

## Included

- database-backed write limits still enforce real 429 responses, but a technical failure of the limiter itself no longer blocks book creation or editing;
- external provider cover persistence remains outside the critical save path;
- save errors are mapped to actionable Russian and English messages;
- custom-cover removal is ordered safely so Storage is not deleted before the database update succeeds;
- a dedicated regression test protects the searched-book в†’ Read в†’ Save path.

## Manual setup

No Supabase migration and no new environment variable are required.
