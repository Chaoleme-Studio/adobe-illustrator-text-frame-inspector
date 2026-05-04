param(
  [string]$Version = "1.1.0",
  [string]$CertPassword = $env:ZXP_CERT_PASSWORD
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$stageRoot = Join-Path $projectRoot "release\TextFrameInspector"
$releaseRoot = Join-Path $projectRoot "release"
$zxpPath = Join-Path $releaseRoot ("TextFrameInspector-" + $Version + ".zxp")
$certPath = Join-Path $releaseRoot "TextFrameInspector-self-signed.p12"

if (-not (Test-Path $stageRoot)) {
  & (Join-Path $PSScriptRoot "build-release.ps1") -Version $Version -SkipZip
}

$zxp = Get-Command ZXPSignCmd.exe -ErrorAction SilentlyContinue
if (-not $zxp) {
  $zxp = Get-Command ZXPSignCmd -ErrorAction SilentlyContinue
}

if (-not $zxp) {
  throw "ZXPSignCmd was not found. Add it to PATH before building ZXP."
}

if (-not $CertPassword) {
  $CertPassword = "TextFrameInspector"
}

if (Test-Path $zxpPath) {
  Remove-Item -LiteralPath $zxpPath -Force
}

if (-not (Test-Path $certPath)) {
  & $zxp.Source -selfSignedCert US CA TextFrameInspector TextFrameInspector $CertPassword $certPath
}

& $zxp.Source -sign $stageRoot $zxpPath $certPath $CertPassword -tsa http://timestamp.digicert.com/

Write-Host ""
Write-Host "ZXP package created:" -ForegroundColor Green
Write-Host $zxpPath
