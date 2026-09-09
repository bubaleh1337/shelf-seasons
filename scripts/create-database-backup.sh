#!/usr/bin/env bash
set -Eeuo pipefail

umask 077

for command_name in supabase age tar sha256sum; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Required command is unavailable: $command_name" >&2
    exit 1
  fi
done

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "SUPABASE_DB_URL is not configured." >&2
  exit 1
fi

if [[ ! "$SUPABASE_DB_URL" =~ ^postgres(ql)?:// ]]; then
  echo "SUPABASE_DB_URL must be a PostgreSQL connection URI." >&2
  exit 1
fi

if [[ -z "${BACKUP_AGE_PUBLIC_KEY:-}" ]] ||
  [[ ! "$BACKUP_AGE_PUBLIC_KEY" =~ ^age1[0-9a-z]+$ ]]; then
  echo "BACKUP_AGE_PUBLIC_KEY must contain one age recipient key." >&2
  exit 1
fi

runner_temp="${RUNNER_TEMP:-/tmp}"
workspace="${GITHUB_WORKSPACE:-$(pwd)}"
timestamp="$(date -u +'%Y-%m-%dT%H-%M-%SZ')"
backup_directory="$runner_temp/shelf-seasons-db-backup-$timestamp"
plain_archive="$runner_temp/shelf-seasons-db-$timestamp.tar.gz"
encrypted_path="$workspace/shelf-seasons-db-$timestamp.tar.gz.age"
completed=false

cleanup() {
  rm -f -- "$plain_archive"
  if [[ "$backup_directory" == "$runner_temp"/shelf-seasons-db-backup-* ]]; then
    rm -rf -- "$backup_directory"
  fi
  if [[ "$completed" != "true" ]]; then
    rm -f -- "$encrypted_path"
  fi
}
trap cleanup EXIT

mkdir -p -- "$backup_directory"

supabase db dump \
  --db-url "$SUPABASE_DB_URL" \
  --file "$backup_directory/roles.sql" \
  --role-only

supabase db dump \
  --db-url "$SUPABASE_DB_URL" \
  --file "$backup_directory/schema.sql"

supabase db dump \
  --db-url "$SUPABASE_DB_URL" \
  --file "$backup_directory/data.sql" \
  --use-copy \
  --data-only

for dump_file in roles.sql schema.sql data.sql; do
  if [[ ! -s "$backup_directory/$dump_file" ]]; then
    echo "Database export is missing or empty: $dump_file" >&2
    exit 1
  fi
done

(
  cd "$backup_directory"
  sha256sum roles.sql schema.sql data.sql >SHA256SUMS
)

printf '%s\n' \
  "Shelf Seasons encrypted database backup" \
  "Created (UTC): $timestamp" \
  "Supabase CLI: $(supabase --version)" \
  "Contents: roles.sql, schema.sql, data.sql, SHA256SUMS" \
  >"$backup_directory/backup-info.txt"

tar -C "$backup_directory" -czf "$plain_archive" .
age --encrypt \
  --recipient "$BACKUP_AGE_PUBLIC_KEY" \
  --output "$encrypted_path" \
  "$plain_archive"

if [[ ! -s "$encrypted_path" ]]; then
  echo "Encrypted backup was not created." >&2
  exit 1
fi

artifact_name="shelf-seasons-db-$timestamp"
if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  printf 'artifact_name=%s\n' "$artifact_name" >>"$GITHUB_OUTPUT"
  printf 'encrypted_path=%s\n' "$encrypted_path" >>"$GITHUB_OUTPUT"
fi

completed=true
echo "Encrypted database backup created: $artifact_name"
