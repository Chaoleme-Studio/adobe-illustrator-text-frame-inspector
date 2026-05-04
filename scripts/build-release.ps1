param(
  [string]$Version = "1.1.0",
  [switch]$SkipZip
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$releaseRoot = Join-Path $projectRoot "release"
$stageRoot = Join-Path $releaseRoot "TextFrameInspector"
$zipPath = Join-Path $releaseRoot ("TextFrameInspector-" + $Version + ".zip")

if (Test-Path $stageRoot) {
  Remove-Item -LiteralPath $stageRoot -Recurse -Force
}

if ((-not $SkipZip) -and (Test-Path $zipPath)) {
  Remove-Item -LiteralPath $zipPath -Force
}

New-Item -ItemType Directory -Path $stageRoot | Out-Null

$includeItems = @(
  "CSXS",
  "css",
  "js",
  "jsx",
  "index.html",
  "README.md"
)

foreach ($item in $includeItems) {
  $source = Join-Path $projectRoot $item
  $target = Join-Path $stageRoot $item
  Copy-Item -LiteralPath $source -Destination $target -Recurse -Force
}

$installerPath = Join-Path $releaseRoot "install-windows.ps1"
$installerContent = @'
$ErrorActionPreference = "Stop"

$sourceRoot = Join-Path $PSScriptRoot "TextFrameInspector"
$targetRoot = Join-Path $env:APPDATA "Adobe\CEP\extensions\TextFrameInspector"

if (-not (Test-Path $sourceRoot)) {
  throw "未找到 TextFrameInspector 文件夹。请确保 install-windows.ps1 和 TextFrameInspector 目录放在一起。"
}

if (Test-Path $targetRoot) {
  Remove-Item -LiteralPath $targetRoot -Recurse -Force
}

New-Item -ItemType Directory -Path (Split-Path -Parent $targetRoot) -Force | Out-Null
Copy-Item -LiteralPath $sourceRoot -Destination $targetRoot -Recurse -Force

Write-Host ""
Write-Host "安装完成：" -ForegroundColor Green
Write-Host $targetRoot
Write-Host ""
Write-Host "如果 Illustrator 正在运行，请先完全退出再重新打开。"
Write-Host "面板入口：窗口 > 扩展（旧版）> Text Frame Inspector"
'@

Set-Content -LiteralPath $installerPath -Value $installerContent -Encoding UTF8

if (-not $SkipZip) {
  Compress-Archive -Path $stageRoot, $installerPath -DestinationPath $zipPath

  Write-Host ""
  Write-Host "ZIP package created:" -ForegroundColor Green
  Write-Host $zipPath
}

Write-Host ""
Write-Host "Staged extension:" -ForegroundColor Green
Write-Host $stageRoot
