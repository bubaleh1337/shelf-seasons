# Encrypted database backups

Shelf Seasons creates one encrypted Supabase database backup every day at
02:17 UTC. A backup can also be started manually from GitHub Actions.

Only the encrypted `.tar.gz.age` file is uploaded. GitHub keeps each artifact
for 30 days. The unencrypted roles, schema and data files exist only on the
temporary GitHub runner and are removed before the job ends.

## What is included

- database roles allowed by the Supabase export filters;
- database schema, RLS policies, functions and triggers;
- table data, including application rows and `auth.users`;
- SHA-256 checksums for the three SQL files.

Supabase Storage object bytes are not part of a database dump. The database
contains their metadata, but uploaded cover files require a separate object
backup. Vercel settings, OAuth secrets and other provider configuration are
also not included.

## One-time setup

### 1. Create an age key on Windows

Install `age` and create a dedicated key. Keep the private key outside the
repository.

```powershell
winget install --id FiloSottile.age
New-Item -ItemType Directory -Force "$env:USERPROFILE\Documents\ShelfSeasonsBackup" | Out-Null
age-keygen -o "$env:USERPROFILE\Documents\ShelfSeasonsBackup\age-key.txt"
age-keygen -y "$env:USERPROFILE\Documents\ShelfSeasonsBackup\age-key.txt"
```

The last command prints a public key beginning with `age1`. Save a second copy
of `age-key.txt` on an offline drive or in a trusted password manager. Never
commit it, paste it into chat, or add it to Vercel.

### 2. Copy the Supabase connection URI

Open **Supabase → Project → Connect → Session pooler → URI**. Replace the
password placeholder with the database password. Use the session pooler on
port `5432`, because it works from IPv4 GitHub runners. If the password contains
reserved URL characters, use its percent-encoded form in the URI.

The value looks like this, but must contain the real project values:

```text
postgresql://postgres.PROJECT_REF:DATABASE_PASSWORD@aws-REGION.pooler.supabase.com:5432/postgres
```

Do not save the real URI in a file in the repository.

### 3. Add two GitHub repository secrets

Open **GitHub repository → Settings → Secrets and variables → Actions → New
repository secret** and add:

| Secret | Value |
| --- | --- |
| `SUPABASE_DB_URL` | Complete Session pooler URI from Supabase |
| `BACKUP_AGE_PUBLIC_KEY` | Public `age1...` key from step 1 |

The private `AGE-SECRET-KEY-...` value must stay only with the owner.

### 4. Run the first backup

Open **GitHub repository → Actions → Encrypted database backup → Run workflow**.
Wait for a green check, open that run and download its artifact. Extract the
downloaded GitHub ZIP so that the `.tar.gz.age` file is available locally.

Verify it on Windows:

```powershell
Set-Location P:\Projects\shelf-seasons\shelf-seasons
.\scripts\verify-database-backup.ps1 `
  -BackupFile "$env:USERPROFILE\Downloads\shelf-seasons-db-DATE.tar.gz.age" `
  -IdentityFile "$env:USERPROFILE\Documents\ShelfSeasonsBackup\age-key.txt"
```

The script decrypts into a unique temporary directory, verifies every checksum
and deletes the temporary plaintext copy. It does not connect to or modify any
database.

## Restore rehearsal

Never test a restore against production. Create a separate disposable target,
decrypt a selected backup locally, and follow the current official Supabase
restore procedure for that target. Restore `roles.sql`, `schema.sql`, then
`data.sql` in one transaction with errors configured to stop the operation.
Verify key table counts, RLS and sign-in, then record the date and result in the
release checklist.

A successful scheduled job proves that an archive was created. A successful
verification proves that it can be decrypted and its files are intact. Only a
restore rehearsal proves that the backup can recover the application.

## Operating routine

- Check the latest workflow run once a week.
- Download and verify at least one backup each month.
- Keep one monthly encrypted `.age` file outside GitHub for longer retention.
- Rehearse a restore after important schema changes and before public launch.
- If the private age key is lost, existing backups cannot be decrypted.
- If the database password changes, update only `SUPABASE_DB_URL` in GitHub.

The workflow is `.github/workflows/database-backup.yml`; the export logic is
`scripts/create-database-backup.sh`.

## References

- [Supabase database backups](https://supabase.com/docs/guides/platform/backups)
- [Supabase logical export and restore](https://supabase.com/docs/guides/self-hosting/restore-from-platform)
- [GitHub Actions artifacts](https://docs.github.com/en/actions/tutorials/store-and-share-data)
- [age encryption](https://github.com/FiloSottile/age)
