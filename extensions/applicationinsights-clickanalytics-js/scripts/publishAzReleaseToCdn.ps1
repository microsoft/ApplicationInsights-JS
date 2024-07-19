param (
    [string] $releaseFrom = $null,                      # The root path for where to find the files to be released
    [string] $storeContainer = "cdn",                   # Identifies the destination storage account container
    [string] $cdnStorePath = "cdnstoragename",          # Identifies the target Azure Storage account (by name)
    [string] $subscriptionId = $null,                   # Identifies the target Azure Subscription Id (if not encoded in the cdnStorePath)
    [string] $resourceGroup = $null,                    # Identifies the target Azure Subscription Resource Group (if not encoded in the cdnStorePath)
    [string] $sasToken = $null,                         # The SAS Token to use rather than using or attempting to login
    [string] $logPath = $null,                          # The location where logs should be written
    [switch] $overwrite = $false,                       # Overwrite any existing files   
    [switch] $testOnly = $false,                        # Uploads to a "tst" test container on the storage account
    [switch] $cdn = $false,                             # (No longer used -- kept for now for backward compatibility)
    [switch] $useConnectedAccount = $false              # Use Entra Id to connect to Azure
)

Import-Module -Force -Name "../../../common/publish/Logging"
Import-Module -Force -Name "../../../common/publish/AzStorageHelper"

[hashtable]$global:connectDetails = @{}
$global:connectDetails.storeContainer = $storeContainer
$global:connectDetails.cdnStorePath = $cdnStorePath
$global:connectDetails.resourceGroup = $resourceGroup
$global:connectDetails.storeName = $null                              # The endpoint needs to the base name of the endpoint, not the full URL (eg. “my-cdn” rather than “my-cdn.azureedge.net”)
$global:connectDetails.subscriptionId = $subscriptionId
$global:connectDetails.sasToken = $sasToken
$global:connectDetails.storageContext = $null
$global:connectDetails.testOnly = $testOnly
$global:connectDetails.useConnectedAccount = $useConnectedAccount

$global:cacheValue = $null

Function Write-LogParams 
{
    $logDir = Get-LogPath

    Write-Log "Storage Container : $storeContainer"
    Write-Log "Store Path        : $($global:connectDetails.cdnStorePath)"
    Write-Log "Overwrite         : $overwrite"
    Write-Log "Test Mode         : $testOnly"
    Write-Log "SourcePath        : $jsSdkDir"
    Write-Log "Log Path          : $logDir"
    Write-Log "Use Connected Acct: $useConnectedAccount"

    if ([string]::IsNullOrWhiteSpace($global:connectDetails.sasToken) -eq $true) {
        Write-Log "Mode      : User-Credentials"
    } else {
        Write-Log "Mode      : Sas-Token"
    }
}

Function GetReleaseFiles (
    [hashtable] $verDetails
)
{
    $version = $verDetails.full
    Write-Log "Version   : $($verDetails.full)"
    Write-Log "  Number  : $($verDetails.ver)"
    Write-Log "  Type    : $($verDetails.type)"
    Write-Log "  BldNum  : $($verDetails.bldNum)"

    # check if the minified dir exists
    $jsSdkSrcDir = Join-Path $jssdkDir -ChildPath "browser\";

    if (-Not (Test-Path $jsSdkSrcDir)) {
        Write-LogWarning "'$jsSdkSrcDir' directory doesn't exist. Compile JSSDK first.";
        exit
    }

    $files = New-Object 'system.collections.generic.dictionary[string,string]'

    Write-Log "Adding files";
    AddReleaseFile $files $jsSdkSrcDir "ai.clck.$version.integrity.json" $true
    AddReleaseFile $files $jsSdkSrcDir "ai.clck.$version.js"
    AddReleaseFile $files $jsSdkSrcDir "ai.clck.$version.js.map"
    AddReleaseFile $files $jsSdkSrcDir "ai.clck.$version.min.js"
    AddReleaseFile $files $jsSdkSrcDir "ai.clck.$version.min.js.map"
    AddReleaseFile $files $jsSdkSrcDir "ai.clck.$version.cjs.js"
    AddReleaseFile $files $jsSdkSrcDir "ai.clck.$version.cjs.js.map"
    AddReleaseFile $files $jsSdkSrcDir "ai.clck.$version.cjs.min.js"
    AddReleaseFile $files $jsSdkSrcDir "ai.clck.$version.cjs.min.js.map"
    AddReleaseFile $files $jsSdkSrcDir "ai.clck.$version.gbl.js"
    AddReleaseFile $files $jsSdkSrcDir "ai.clck.$version.gbl.js.map"
    AddReleaseFile $files $jsSdkSrcDir "ai.clck.$version.gbl.min.js"
    AddReleaseFile $files $jsSdkSrcDir "ai.clck.$version.gbl.min.js.map"

    return $files
}

#-----------------------------------------------------------------------------
# Start of Script
#-----------------------------------------------------------------------------
Set-LogPath $logPath "publishReleaseCdnLog"

$jsSdkDir = $releaseFrom
if ([string]::IsNullOrWhiteSpace($jsSdkDir) -eq $true) {
    $jsSdkDir = Split-Path (Split-Path $MyInvocation.MyCommand.Path) -Parent
}

$cacheControl1Year = "public, max-age=31536000, immutable, no-transform";
$contentType = "text/javascript; charset=utf-8";

Write-LogParams

# You will need to at least have the Az modules installed
InstallRequiredModules
$global:connectDetails = ParseCdnStorePath $global:connectDetails

if ([string]::IsNullOrWhiteSpace($global:connectDetails.sasToken) -eq $true) {
    Write-Log "**********************************************************************"
    Write-Log "Validating user access"
    Write-Log "**********************************************************************"
    $global:connectDetails = ValidateAccess $global:connectDetails
}

Write-Log "======================================================================"

$version = GetPackageVersion $jsSdkDir

$releaseFiles = GetReleaseFiles $version      # Get the versioned files only
if ($null -eq $releaseFiles -or $releaseFiles.Count -eq 0) {
    Write-LogFailure "Unable to find any release files"
}

Write-Log "Release Files : $($releaseFiles.Count)"
Write-Log "----------------------------------------------------------------------"

# Publish the full versioned files to all release folders
if ($version.type -eq "release") {
    # Normal publishing deployment
    PublishFiles $releaseFiles "beta/ext" $cacheControl1Year $contentType $overwrite
    PublishFiles $releaseFiles "next/ext" $cacheControl1Year $contentType $overwrite
    PublishFiles $releaseFiles "scripts/b/ext" $cacheControl1Year $contentType $overwrite
}
elseif ($version.type -eq "rc") {
    PublishFiles $releaseFiles "beta/ext" $cacheControl1Year $contentType $overwrite
    PublishFiles $releaseFiles "next/ext" $cacheControl1Year $contentType $overwrite
}
elseif ($version.type -eq "dev" -or $version.type -eq "beta") {
    # Publish to release type folder folder
    PublishFiles $releaseFiles "$($version.type)/ext" $cacheControl1Year $contentType $overwrite
}
elseif ($version.type -eq "nightly" -or $version.type -eq "nightly3") {
    # Publish to release nightly folder folder
    PublishFiles $releaseFiles "nightly/ext" $cacheControl1Year $contentType $overwrite
}
else {
    # Upload to the test container rather than the supplied one
    $global:connectDetails.testOnly = $true
    $global:connectDetails.storeContainer = "tst"
    PublishFiles $releaseFiles "$($version.type)/ext" $cacheControl1Year $contentType $overwrite
}

Write-Log "======================================================================"
