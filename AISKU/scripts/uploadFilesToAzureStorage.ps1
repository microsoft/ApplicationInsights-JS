$storageAccountName = "daprodcdn";
$cacheControlValue = "max-age=1800, immutable";
$contentType = "text/javascript; charset=utf-8";

function Show-Menu
{
     param (
           [string]$Title = 'Select container name'
     )
     cls
     Write-Host "================ $Title ================"

     Write-Host "1: next"
     Write-Host "2: beta"
     Write-Host "3: scripts/b"
}
Show-Menu
$input = Read-Host "Select an option (1, 2, 3)"

switch ($input)
{
    '1' {
        $containerName = "next";
    } '2' {
        $containerName = "beta";
    } '3' {
        $containerName = "scripts";
    }
}

# Add "b/" blob prefix for scripts container only
$blobPrefix = If ($containerName.equals("scripts")) {"b/"} Else {""}


# get js sdk directory
$jsSdkDir = Split-Path (Split-Path $MyInvocation.MyCommand.Path) -Parent;
Write-Host "Releasing from $jsSdkDir";

# find version number
$packageJsonPath =  Join-Path $jsSdkDir -ChildPath "package.json"
if (-Not (Test-Path $packageJsonPath)) {
    Write-Warning "'$packageJsonPath' file not found, please enter the top JSSDK directory.";
    exit;
}

$packagesJson = (Get-Content $packageJsonPath -Raw) | ConvertFrom-Json
$version = $packagesJson.version;

# check if the minified dir exists
$jssdkMinDir = Join-Path $jssdkDir -ChildPath "browser\";

if (-Not (Test-Path $jssdkMinDir)) {
    Write-Warning "'$jssdkMinDir' directory doesn't exist. Compile JSSDK first.";
    exit;
}

Write-Host "Preparing js files...";

$releaseFromDir = Join-Path $jssdkMinDir -ChildPath $version;

if (Test-Path $releaseFromDir) {
    Write-Warning "$releaseFromDir release directory already exists."
    Write-Warning "Did you forget to change the version number?"
    exit;
}

New-Item -Force -ItemType directory -Path $releaseFromDir | Out-Null
Copy-Item ($jssdkMinDir + "ai.2.js") (Join-Path $releaseFromDir -ChildPath "ai.2.js")
Copy-Item ($jssdkMinDir + "ai.2.js") (Join-Path $releaseFromDir -ChildPath ("ai." + $version + ".js"))
Copy-Item ($jssdkMinDir + "ai.2.js.map") (Join-Path $releaseFromDir -ChildPath "ai.2.js.map")
Copy-Item ($jssdkMinDir + "ai.2.js.map") (Join-Path $releaseFromDir -ChildPath ("ai." + $version + ".js.map"))
Copy-Item ($jssdkMinDir + "ai.2.min.js") (Join-Path $releaseFromDir -ChildPath "ai.2.min.js")
Copy-Item ($jssdkMinDir + "ai.2.min.js") (Join-Path $releaseFromDir -ChildPath ("ai." + $version + ".min.js"))
Copy-Item ($jssdkMinDir + "ai.2.min.js.map") (Join-Path $releaseFromDir -ChildPath "ai.2.min.js.map")
Copy-Item ($jssdkMinDir + "ai.2.min.js.map") (Join-Path $releaseFromDir -ChildPath ("ai." + $version + ".min.js.map"))

Write-Host "Please review files in $releaseFromDir"
Write-Host "Files will be uploaded to Azure storage! Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown');

$storageAccountKey = Read-Host "Please enter '$storageAccountName' account key";

$azureContext = New-AzureStorageContext -StorageAccountName $storageAccountName -StorageAccountKey $storageAccountKey

# upload files to Azure Storage
$files = Get-ChildItem $releaseFromDir;
foreach($file in $files) {
    Set-AzureStorageBlobContent -Container $containerName -File (Join-Path $releaseFromDir -ChildPath $file) -Blob ($blobPrefix + $file) -Context $azureContext -Properties @{CacheControl = $cacheControlValue; ContentType = $contentType}
}

Write-Host "Files uploaded successfully to Azure Storage."
