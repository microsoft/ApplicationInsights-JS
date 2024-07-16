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
    [switch] $cacheTest = $false,                       # Uploads the images with a shorter cache time
    [string] $versionlist = $null                       # List of versions whose size images should be generated and published 
)

Import-Module -Force -Name "../../common/publish/Logging"
Import-Module -Force -Name "../../common/publish/AzStorageHelper"

[hashtable]$global:connectDetails = @{}
$global:connectDetails.storeContainer = $storeContainer
$global:connectDetails.cdnStorePath = $cdnStorePath
$global:connectDetails.resourceGroup = $resourceGroup
$global:connectDetails.storeName = $null                              # The endpoint needs to the base name of the endpoint, not the full URL (eg. “my-cdn” rather than “my-cdn.azureedge.net”)
$global:connectDetails.subscriptionId = $subscriptionId
$global:connectDetails.sasToken = $sasToken
$global:connectDetails.storageContext = $null
$global:connectDetails.testOnly = $testOnly

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
    
    if ([string]::IsNullOrWhiteSpace($global:connectDetails.sasToken) -eq $true) {
        Write-Log "Mode      : User-Credentials"
    } else {
        Write-Log "Mode      : Sas-Token"
    }
}

Function GetReleaseFiles
{
    Write-Log "Folder   : $jsSdkDir"

    # check if the img dir exists
    $parentDir = Split-Path -Path $jsSdkDir -Parent
    $imgSrcDir = Join-Path -Path $parentDir -ChildPath "AISKU/.cdn/img"

    Write-Log "Image Folder   : $imgSrcDir"

    if (-Not (Test-Path $imgSrcDir)) {
        Write-LogWarning "'$imgSrcDir' directory doesn't exist. Generate IMG first.";
        exit
    }

    $files = New-Object 'system.collections.generic.dictionary[string,string]'
    $nightFiles = New-Object 'system.collections.generic.dictionary[string,string]'

    Write-Log "Adding files";
    # Iterate over each version in the versionlist
    $versions = $versionlist -split ","
    foreach ($version in $versions) {
        $version = $version.Trim()
        Write-Host "Version : $version"
        if ($version -like "*night*") {
            Write-Host "The version contains 'night'"
            AddReleaseFile $nightFiles $imgSrcDir "ai.$version.js.svg"
            AddReleaseFile $nightFiles $imgSrcDir "ai.$version.gzip.min.js.svg"
            AddReleaseFile $nightFiles $imgSrcDir "ai.$version.min.js.svg"
        } else {
            Write-Host "The version does not contain 'night'"
            AddReleaseFile $files $imgSrcDir "ai.$version.js.svg"
            AddReleaseFile $files $imgSrcDir "ai.$version.gzip.min.js.svg"
            AddReleaseFile $files $imgSrcDir "ai.$version.min.js.svg"
        }
    }

    return $files, $nightFiles
}

#-----------------------------------------------------------------------------
# Start of Script
#-----------------------------------------------------------------------------
Set-LogPath $logPath "publishReleaseCdnLog"

$jsSdkDir = $releaseFrom
if ([string]::IsNullOrWhiteSpace($jsSdkDir) -eq $true) {
    $jsSdkDir = Split-Path (Split-Path $MyInvocation.MyCommand.Path) -Parent
}

$cacheControl = "public, max-age=31536000, immutable, no-transform";
if ($cacheTest -eq $true) {
    $cacheControl = "public, max-age=86400, immutable, no-transform";
}
$contentType = "image/svg+xml;";

Write-LogParams

# You will need to at least have the AzureRM module installed
InstallRequiredModules
$global:connectDetails = ParseCdnStorePath $global:connectDetails

if ([string]::IsNullOrWhiteSpace($global:connectDetails.sasToken) -eq $true) {
    Write-Log "**********************************************************************"
    Write-Log "Validating user access"
    Write-Log "**********************************************************************"
    $global:connectDetails = ValidateAccess $global:connectDetails
}

Write-Log "======================================================================"

$releaseFiles, $releaseNightFiles = GetReleaseFiles 
$actualCount = $releaseFiles.Count + $releaseNightFiles.Count
$versions = $versionlist -split ","
if ($null -eq $releaseFiles -and $null -eq $releaseNightFiles) {
    Write-LogFailure "Unable to find any release files"
} elseif ($actualCount -ne 3*$versions.Count) {
    Write-LogWarning "Files number is incorrect. Expected: $($versions.Count*3), Actual: $actualCount"
}

Write-Log "Release Files : $($releaseFiles.Count)"
Write-Log "Release Night Files : $($releaseNightFiles.Count)"
Write-Log "----------------------------------------------------------------------"

$contentDisposition = "inline"

# Publish the img to the folder that is same to the script folder.
PublishFiles $releaseFiles "scripts/b" $cacheControl $contentType $overwrite $contentDisposition
PublishFiles $releaseNightFiles "nightly" $cacheControl $contentType $overwrite $contentDisposition

Write-Log "======================================================================"
