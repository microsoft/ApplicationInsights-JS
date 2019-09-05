param (
    [Parameter(Mandatory=$true)][string]$releasePath,
    [Parameter(Mandatory=$true)][string]$ikey
 )

$ai = Join-Path $releasePath -ChildPath "ai.js";
$aiMin = Join-Path $releasePath -ChildPath "ai.min.js";
$aiMinZip = Join-Path $releasePath -ChildPath "ai.min.zip";

# zip ai.min.js file
# Compress-Archive -Path $aiMin -DestinationPath $aiMinZip;   #...I wish, but it doesn't work in VSTS ;(

$input = New-Object System.IO.FileStream $aiMin, ([IO.FileMode]::Open), ([IO.FileAccess]::Read), ([IO.FileShare]::Read)
$buffer = New-Object byte[]($input.Length)
$byteCount = $input.Read($buffer, 0, $input.Length)
$input.Close();

$output = New-Object System.IO.FileStream $aiMinZip, ([IO.FileMode]::Create), ([IO.FileAccess]::Write), ([IO.FileShare]::None)
$gzipStream = New-Object System.IO.Compression.GzipStream $output, ([IO.Compression.CompressionMode]::Compress)

$gzipStream.Write($buffer, 0, $buffer.Length)
$gzipStream.Close()

# Check sizes
$aiSize = (Get-Item $ai).Length;
$aiMinSize = (Get-Item $aiMin).Length;
$aiMinZipSize = (Get-Item $aiMinZip).Length;

Write-Host "==== JS SDK size ==="
Write-Host "ai.js: $aiSize bytes. Path: $ai"
Write-Host "ai.min.js: $aiMinSize bytes. Path: $aiMin"
Write-Host "ai.min.zip: $aiMinZipSize bytes. Path $aiMinZip"

$currentDir = Get-Location;
$aiDll = Join-Path $currentDir -ChildPath "Microsoft.ApplicationInsights.dll";
Add-Type -Path $aiDll  

$telemetry = New-Object "Microsoft.ApplicationInsights.TelemetryClient"
$telemetry.InstrumentationKey = $ikey;

$metrics = New-Object 'system.collections.generic.dictionary[[string],[double]]'
$metrics.Add('ai', $aiSize);
$metrics.Add('ai.min', $aiMinSize);
$metrics.Add('a.min.zip', $aiMinZipSize);

Try 
{
    $telemetry.TrackEvent("JsSdkSize", $null, $metrics);
    $telemetry.Flush();
}
Catch
{
    Write-Host Failed to send telemetry. Error: $_.Exception.Message;
}

$MAX_SDK_SIZE = 25 * 1024; # size in bytes

If($aiMinZipSize -ge $MAX_SDK_SIZE) 
{
    Write-Host JS SDK library is too big (minimized+zipped): $aiMinZipSize bytes, max allowed size: $MAX_SDK_SIZE bytes
    Write-Host Please contact kszostak@microsoft.com or the ChuckNorris team to increase the threashold.

    throw "SDK too big";
    exit 1;
}