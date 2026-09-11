$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

Write-Host "Updating Shelf Seasons to 0.19.2..." -ForegroundColor Cyan

npm version 0.19.2 --no-git-tag-version

$versionFile = Join-Path $projectRoot "lib\app-version.ts"
Set-Content -Path $versionFile -Value 'export const APP_VERSION = "0.19.2";' -Encoding utf8

$changelog = Join-Path $projectRoot "CHANGELOG.md"
$current = Get-Content -Path $changelog -Raw
if ($current -notmatch "## 0\.19\.2") {
  $entry = @"
# Changelog

## 0.19.2

- Decoupled Google Books/Open Library cover persistence from the critical book create/edit request.
- Book metadata and reading status now save even when a remote cover download, image conversion or Storage write is slow or fails.
- Provider covers are repaired in the background after a successful save.
- Custom user-uploaded covers remain synchronous and validated before the save is reported successful.
- Editing an imported book now preserves its original provider identity so later cover repair can still recover the catalog cover.

"@
  $body = $current -replace "^# Changelog\r?\n\r?\n", ""
  Set-Content -Path $changelog -Value ($entry + $body) -Encoding utf8
}

$release = Join-Path $projectRoot "RELEASE_0.19.2.md"
@"
# Shelf Seasons 0.19.2

This patch removes remote provider cover work from the critical book-save path.

## Included

- adding a Google Books/Open Library result no longer waits for the provider image to be downloaded, converted with Sharp and uploaded to Storage;
- editing a book is no longer blocked by remote cover failures;
- custom uploaded covers remain validated and stored synchronously;
- the existing cover-repair endpoint runs in the background after a successful save;
- imported books keep their provider identity during metadata edits.

## Manual setup

No Supabase migration and no new environment variable are required.
"@ | Set-Content -Path $release -Encoding utf8

Write-Host "Running verification..." -ForegroundColor Cyan
npm run format:check
npm run lint
npm run typecheck
npm test

Write-Host ""
Write-Host "Shelf Seasons 0.19.2 patch applied and checks passed." -ForegroundColor Green
