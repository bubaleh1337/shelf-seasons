$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
node (Join-Path $projectRoot "scripts\update-to-0.10.0.mjs")
