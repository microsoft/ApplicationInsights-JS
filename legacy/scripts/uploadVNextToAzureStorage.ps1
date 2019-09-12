# get js sdk directory
$jsSdkDir = Split-Path (Split-Path $MyInvocation.MyCommand.Path) -Parent; 
Write-Host "Releasing a vnext from $jsSdkDir";

# check if the minified dir exists
$jssdkMinDir = Join-Path $jssdkDir -ChildPath "bundle\";

if (-Not (Test-Path $jssdkMinDir)) {
    Write-Warning "'$jssdkMinDir' directory doesn't exist. Compile JSSDK first.";
    exit;
}

Write-Host "Preparing js files...";

$releaseFromDir = Join-Path $jssdkMinDir -ChildPath "vnext";

New-Item -ItemType directory -Path $releaseFromDir | Out-Null
Copy-Item ($jssdkMinDir + "ai.js") (Join-Path $releaseFromDir -ChildPath "ai.vnext.js")
Copy-Item ($jssdkMinDir + "ai.js.map") (Join-Path $releaseFromDir -ChildPath "ai.js.map")
Copy-Item ($jssdkMinDir + "ai.0.js") (Join-Path $releaseFromDir -ChildPath "ai.vnext.0.js")
Copy-Item ($jssdkMinDir + "ai.0.js.map") (Join-Path $releaseFromDir -ChildPath "ai.0.js.map")

Write-Host "Please review files in $releaseFromDir"
Write-Host "Files will be uploaded to Azure storage! Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown');

$storageAccountName = "daprodcdn";
$storageAccountKey = Read-Host "Please enter '$storageAccountName' account key";

$azureContext = New-AzureStorageContext -StorageAccountName $storageAccountName -StorageAccountKey $storageAccountKey
$cacheControlValue = "public, max-age=600";

# upload files to Azure Storage
$files = Get-ChildItem $releaseFromDir;
foreach($file in $files) {
    Set-AzureStorageBlobContent -Container scripts -File (Join-Path $releaseFromDir -ChildPath $file) -Blob ("a/"+$file) -Context $azureContext -Properties @{CacheControl = $cacheControlValue; ContentType = "application/x-javascript"} 
}

Write-Host "Files uploaded successfully to Azure Storage."
