# Downloads the OpenTelemetry Collector binary used to validate the OTLP channel output.
#
#   .\get-collector.ps1
#
# Use this when Docker is not available; otherwise `docker compose up` in this folder is simpler.

param(
    [string] $Version = "0.157.0"
)

$ErrorActionPreference = "Stop"

$binDir = Join-Path $PSScriptRoot "bin"
$exe = Join-Path $binDir "otelcol.exe"

if (Test-Path $exe) {
    Write-Host "The collector is already present at $exe"
    & $exe --version
    exit 0
}

New-Item -ItemType Directory -Force -Path $binDir | Out-Null

$arch = if ([Environment]::Is64BitOperatingSystem) { "amd64" } else { "386" }
$asset = "otelcol_${Version}_windows_${arch}.tar.gz"
$url = "https://github.com/open-telemetry/opentelemetry-collector-releases/releases/download/v$Version/$asset"
$archive = Join-Path $binDir $asset

Write-Host "Downloading $url ..."
Invoke-WebRequest -Uri $url -OutFile $archive -UseBasicParsing -TimeoutSec 600

Write-Host "Extracting ..."
tar -xzf $archive -C $binDir
Remove-Item $archive -ErrorAction SilentlyContinue

& $exe --version
Write-Host ""
Write-Host "Run it with:"
Write-Host "  .\bin\otelcol.exe --config otel-collector-config.yaml"
