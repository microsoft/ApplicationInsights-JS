param (
    [Parameter(Mandatory=$true)][string]$releasePath,
    [Parameter(Mandatory=$true)][string]$ikey
 )

$ai = Join-Path $releasePath -ChildPath "ai.js";
$aiMin = Join-Path $releasePath -ChildPath "ai.min.js";
$aiMinZip = Join-Path $releasePath -ChildPath "ai.min.zip";

# zip ai.min.js file
# Compress-Archive -Path $aiMin -DestinationPath $aiMinZip;   #...I wish, but it doesn't work in VSTS ;(

if(-not (test-path($aiMinZip))) {
    set-content $aiMinZip ("PK" + [char]5 + [char]6 + ("$([char]0)" * 18))
    (dir $aiMinZip).IsReadOnly = $false  
}

$shellApplication = new-object -com shell.application
$zipPackage = $shellApplication.NameSpace($aiMinZip)
$zipPackage.CopyHere($aiMin)
Start-sleep -milliseconds 500

# Check sizes
$aiSize = (Get-Item $ai).Length;
$aiMinSize = (Get-Item $aiMin).Length;
$aiMinZipSize = (Get-Item $aiMinZip).Length;

Write-Host "==== JS SDK size ==="
Write-Host "ai.js: $aiSize bytes"
Write-Host "ai.min.js: $aiMinSize bytes"
Write-Host "ai.min.zip: $aiMinZipSize bytes"

$currentDir = Get-Location;
$aiDll = Join-Path $currentDir -ChildPath "Microsoft.ApplicationInsights.dll";
Add-Type -Path $aiDll  

$telemetry = New-Object "Microsoft.ApplicationInsights.TelemetryClient"
$telemetry.InstrumentationKey = $ikey;

$metrics = New-Object 'system.collections.generic.dictionary[[string],[double]]'
$metrics.Add('ai', $aiSize);
$metrics.Add('ai.min', $aiMinSize);
$metrics.Add('a.min.zip', $aiMinZipSize);

$telemetry.TrackEvent("JsSdkSize", $null, $metrics);
$telemetry.Flush();

$MAX_SDK_SIZE = 25 * 1025; # size in bytes

If($aiMinZipSize -ge $MAX_SDK_SIZE) {
    Write-Host "JS SDK library is too big (minimized+zipped): $aiMinZipSize bytes, max allowed size: $MAX_SDK_SIZE bytes"
    Write-Host "Please contact kszostak@microsoft.com or the ChuckNorris team to increase the threashold."

    throw "SDK too big";
    exit 1;
}