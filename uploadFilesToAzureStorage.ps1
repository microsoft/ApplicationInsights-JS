# get js sdk directory
$jsSdkDir = Read-Host "Please enter the JSSDK root dir";

if (-Not (Test-Path $jsSdkDir)) {
    Write-Warning "'$jssdkDir' directory doesn't exist.";
    exit;
}

# find version number
$packageJsonPath =  Join-Path $jsSdkDir -ChildPath "package.json"
if (-Not (Test-Path $packageJsonPath)) {
    Write-Warning "'$packageJsonPath' file not found, please enter the top JSSDK directory.";
    exit;
}

$packagesJson = (Get-Content $packageJsonPath -Raw) | ConvertFrom-Json
$version = $packagesJson.version;

# check if the minified dir exists
$jssdkMinDir = $jssdkDir + "JavaScript\JavaScriptSDK\min\";

if (-Not (Test-Path $jssdkMinDir)) {
    Write-Warning "'$jssdkMinDir' directory doesn't exist. Compile JSSDK first.";
    exit;
}

Write-Host "Preparing js files...";

$releaseFromDir = $jssdkMinDir + $version + "\";
$jsFile = "ai.js";
$jsMinFile = "ai.min.js";

if (Test-Path $releaseFromDir) {
    Write-Warning "$releaseFromDir release directory already exists."
    Write-Warning "Did you forget to change the version number?"
    exit;
}

New-Item -ItemType directory -Path $releaseFromDir | Out-Null
Copy-Item ($jssdkMinDir + "ai.js") ($releaseFromDir + "ai.js")
Copy-Item ($jssdkMinDir + "ai.js") ($releaseFromDir + "ai." + $version + ".js")
Copy-Item ($jssdkMinDir + "ai.min.js") ($releaseFromDir + "ai.0.js")
Copy-Item ($jssdkMinDir + "ai.min.js") ($releaseFromDir + "ai." + $version + ".min.js")

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
    Set-AzureStorageBlobContent -Container scripts -File ($releaseFromDir + $file) -Blob ("a/"+$file) -Context $azureContext -Properties @{CacheControl = $cacheControlValue; ContentType = "application/x-javascript"} 
}

Write-Host "Files uploaded successfully to Azure Storage."
