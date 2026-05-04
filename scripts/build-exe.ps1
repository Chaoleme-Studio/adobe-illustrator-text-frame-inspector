param(
  [string]$Version = "1.0.0"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$stageRoot = Join-Path $projectRoot "release\TextFrameInspector"
$issPath = Join-Path $projectRoot "installer\TextFrameInspector.iss"

if (-not (Test-Path $stageRoot)) {
  & (Join-Path $PSScriptRoot "build-release.ps1") -Version $Version -SkipZip
}

$iscc = Get-Command ISCC.exe -ErrorAction SilentlyContinue
if (-not $iscc) {
  $iscc = Get-Command iscc -ErrorAction SilentlyContinue
}

if (-not $iscc) {
  throw "Inno Setup Compiler (ISCC.exe) was not found. Install Inno Setup before building the EXE installer."
}

$env:TFI_VERSION = $Version
$env:TFI_STAGE_ROOT = $stageRoot

& $iscc.Source $issPath

Write-Host ""
Write-Host "EXE installer created:" -ForegroundColor Green
Write-Host (Join-Path $projectRoot ("release\TextFrameInspector-Setup-" + $Version + ".exe"))
