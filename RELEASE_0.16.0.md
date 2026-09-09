# Shelf Seasons 0.16.0

This release adds encrypted, automatic database backups for the public beta.

## Included

- daily Supabase logical exports with a manual GitHub Actions trigger;
- separate role, schema and data dumps using Supabase's filtered export;
- age encryption before an artifact leaves the temporary runner;
- 30-day GitHub artifact retention;
- SHA-256 integrity checks inside every encrypted archive;
- a safe Windows verification script that never touches production;
- setup, recovery-rehearsal and key-custody documentation.

## Manual setup required

Add `SUPABASE_DB_URL` and `BACKUP_AGE_PUBLIC_KEY` as GitHub Actions repository
secrets, then run **Encrypted database backup** manually once. Follow
`docs/DATABASE_BACKUPS.md` exactly.

No Supabase migration or Vercel environment variable is required.
