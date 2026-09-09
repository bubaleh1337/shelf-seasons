[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile,

    [Parameter(Mandatory = $true)]
    [string]$IdentityFile
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command age -ErrorAction SilentlyContinue)) {
    throw "Команда age не найдена. Установи её: winget install --id FiloSottile.age"
}

if (-not (Get-Command tar -ErrorAction SilentlyContinue)) {
    throw "Команда tar не найдена. Она входит в современные версии Windows 11."
}

$resolvedBackup = (Resolve-Path -LiteralPath $BackupFile).Path
$resolvedIdentity = (Resolve-Path -LiteralPath $IdentityFile).Path
$temporaryRoot = [System.IO.Path]::GetTempPath()
$workDirectory = Join-Path $temporaryRoot ("shelf-seasons-backup-" + [guid]::NewGuid().ToString("N"))
$plainArchive = Join-Path $workDirectory "database-backup.tar.gz"
$extractDirectory = Join-Path $workDirectory "contents"

try {
    New-Item -ItemType Directory -Path $extractDirectory -Force | Out-Null

    & age --decrypt --identity $resolvedIdentity --output $plainArchive $resolvedBackup
    if ($LASTEXITCODE -ne 0) {
        throw "Не удалось расшифровать бэкап. Проверь файл и приватный ключ age."
    }

    & tar -xzf $plainArchive -C $extractDirectory
    if ($LASTEXITCODE -ne 0) {
        throw "Не удалось распаковать расшифрованный архив."
    }

    $requiredFiles = @("roles.sql", "schema.sql", "data.sql", "SHA256SUMS", "backup-info.txt")
    foreach ($requiredFile in $requiredFiles) {
        $candidate = Join-Path $extractDirectory $requiredFile
        if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) {
            throw "В бэкапе отсутствует обязательный файл: $requiredFile"
        }
    }

    $checksumLines = Get-Content -LiteralPath (Join-Path $extractDirectory "SHA256SUMS")
    foreach ($line in $checksumLines) {
        if ($line -notmatch '^([0-9a-f]{64})\s+\*?(.+)$') {
            throw "Некорректная строка в SHA256SUMS: $line"
        }

        $expectedHash = $Matches[1].ToUpperInvariant()
        $relativeName = $Matches[2]
        $candidate = Join-Path $extractDirectory $relativeName
        $actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $candidate).Hash
        if ($actualHash -ne $expectedHash) {
            throw "Контрольная сумма не совпала для файла: $relativeName"
        }
    }

    Write-Host "Бэкап успешно расшифрован и проверен. Роли, схема и данные не повреждены." -ForegroundColor Green
}
finally {
    $normalizedTemporaryRoot = [System.IO.Path]::GetFullPath($temporaryRoot)
    $normalizedWorkDirectory = [System.IO.Path]::GetFullPath($workDirectory)
    $safePrefix = $normalizedTemporaryRoot.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar + "shelf-seasons-backup-"

    if ($normalizedWorkDirectory.StartsWith($safePrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        Remove-Item -LiteralPath $normalizedWorkDirectory -Recurse -Force -ErrorAction SilentlyContinue
    }
}
