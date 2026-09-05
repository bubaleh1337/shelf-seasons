$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
node (Join-Path $projectRoot "scripts\update-to-0.5.4.mjs")
if ($LASTEXITCODE -ne 0) {
    throw "Shelf Seasons cleanup failed."
}
