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
    [switch] $cdn = $false                              # (No longer used -- kept for now for backward compatibility)
)

Import-Module -Force -Name "../../common/publish/Logging"
Import-Module -Force -Name "../../common/publish/AzureStorageHelper"

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
    $imgSrcDir = Join-Path -Path $parentDir -ChildPath "tools\sizeImageGenerator\img"

    Write-Log "Image Folder   : $imgSrcDir"

    if (-Not (Test-Path $imgSrcDir)) {
        Write-LogWarning "'$imgSrcDir' directory doesn't exist. Generate IMG first.";
        exit
    }

    $files = New-Object 'system.collections.generic.dictionary[string,string]'

    # Get all files in the imgSrcDir directory
    $imgFiles = Get-ChildItem -Path $imgSrcDir -File


    Write-Log "Adding files";
    # Iterate over each file
    foreach ($file in $imgFiles) {
        # Call AddReleaseFile for the current file
        AddReleaseFile $files $imgSrcDir $file.Name
    }

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
$contentType = "image/svg";

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

$releaseFiles = GetReleaseFiles 
if ($null -eq $releaseFiles -or $releaseFiles.Count -eq 0) {
    Write-LogFailure "Unable to find any release files"
}

Write-Log "Release Files : $($releaseFiles.Count)"

Write-Log "----------------------------------------------------------------------"

# Publish the img to the folder that is same to the script folder.
PublishFiles $releaseFiles "scripts/b" $cacheControl1Year $contentType $overwrite

Write-Log "======================================================================"
