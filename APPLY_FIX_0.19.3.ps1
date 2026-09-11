$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

Write-Host "Updating Shelf Seasons to 0.19.3..." -ForegroundColor Cyan

npm version 0.19.3 --no-git-tag-version

$versionFile = Join-Path $projectRoot "lib\app-version.ts"
Set-Content -Path $versionFile -Value 'export const APP_VERSION = "0.19.3";' -Encoding utf8

$changelog = Join-Path $projectRoot "CHANGELOG.md"
$current = Get-Content -Path $changelog -Raw
if ($current -notmatch "## 0\.19\.3") {
  $entry = @"
# Changelog

## 0.19.3

- Book create/edit now continues when only the rate-limit infrastructure is temporarily unavailable; real request limits still return 429.
- Save failures now show specific Russian and English messages instead of one generic error.
- Added a dedicated regression test for search → choose → mark as read → save.
- Removing a custom cover no longer deletes the stored file before the book metadata update has succeeded.

"@
  $body = $current -replace "^# Changelog\r?\n\r?\n", ""
  Set-Content -Path $changelog -Value ($entry + $body) -Encoding utf8
}

$release = Join-Path $projectRoot "RELEASE_0.19.3.md"
@"
# Shelf Seasons 0.19.3

This patch finishes hardening the critical book-save flow.

## Included

- database-backed write limits still enforce real 429 responses, but a technical failure of the limiter itself no longer blocks book creation or editing;
- external provider cover persistence remains outside the critical save path;
- save errors are mapped to actionable Russian and English messages;
- custom-cover removal is ordered safely so Storage is not deleted before the database update succeeds;
- a dedicated regression test protects the searched-book → Read → Save path.

## Manual setup

No Supabase migration and no new environment variable are required.
"@ | Set-Content -Path $release -Encoding utf8

Write-Host "Running verification..." -ForegroundColor Cyan
npm run format:check
npm run lint
npm run typecheck
npm test

Write-Host ""
Write-Host "Shelf Seasons 0.19.3 checks passed." -ForegroundColor Green
