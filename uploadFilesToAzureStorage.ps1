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
$jssdkMinDir = Join-Path $jssdkDir -ChildPath "JavaScript\JavaScriptSDK\min\";

if (-Not (Test-Path $jssdkMinDir)) {
    Write-Warning "'$jssdkMinDir' directory doesn't exist. Compile JSSDK first.";
    exit;
}

Write-Host "Preparing js files...";

$releaseFromDir = Join-Path $jssdkMinDir -ChildPath $version;
$jsFile = "ai.js";
$jsMinFile = "ai.min.js";

if (Test-Path $releaseFromDir) {
    Write-Warning "$releaseFromDir release directory already exists."
    Write-Warning "Did you forget to change the version number?"
    exit;
}

New-Item -ItemType directory -Path $releaseFromDir | Out-Null
Copy-Item ($jssdkMinDir + "ai.js") (Join-Path $releaseFromDir -ChildPath "ai.js")
Copy-Item ($jssdkMinDir + "ai.js") (Join-Path $releaseFromDir -ChildPath ("ai." + $version + ".js"))
Copy-Item ($jssdkMinDir + "ai.min.js") (Join-Path $releaseFromDir -ChildPath "ai.0.js")
Copy-Item ($jssdkMinDir + "ai.min.js") (Join-Path $releaseFromDir -ChildPath ("ai." + $version + ".min.js"))

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

# copying files to dist dir 
Copy-Item (Join-Path $releaseFromDir -ChildPath "ai.js") (Join-Path $jsSdkDir -ChildPath "dist" | Join-Path -ChildPath "ai.js")
Copy-Item (Join-Path $releaseFromDir -ChildPath "ai.0.js") (Join-Path $jsSdkDir -ChildPath "dist" | Join-Path -ChildPath "ai.0.js")

Write-Host "Files copied to dist folder, don't forget to push them to GitHub"
