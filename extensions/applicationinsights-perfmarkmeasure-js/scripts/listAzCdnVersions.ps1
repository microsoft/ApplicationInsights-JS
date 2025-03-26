param (
    [string] $container = $null,                        # Identify the container that you want to check blank == all
    [string] $storeContainer = "cdn",                   # Identifies the destination storage account container
    [string] $cdnStorePath = "cdnstoragename",          # Identifies the target Azure Storage account (by name)
    [string] $subscriptionId = $null,                   # Identifies the target Azure Subscription Id (if not encoded in the cdnStorePath)
    [string] $resourceGroup = $null,                    # Identifies the target Azure Subscription Resource Group (if not encoded in the cdnStorePath)
    [string] $sasToken = $null,                         # The SAS Token to use rather than using or attempting to login
    [string] $logPath = $null,                          # The location where logs should be written
    [switch] $showFiles = $false,                       # Show the individual files with details as well
    [switch] $activeOnly = $false,                      # Only show the active (deployed) versions
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

Function Write-LogParams 
{
    $logDir = Get-LogPath

    Write-Log "Container         : $container"
    Write-Log "Storage Container : $storeContainer"
    Write-Log "Store Path        : $($global:connectDetails.cdnStorePath)"
    Write-Log "Log Path          : $logDir"
    Write-Log "Show Files        : $showFiles"
    Write-Log "Test Mode         : $testOnly"
    Write-Log "Use Connected Acct: $useConnectedAccount"
    
    if ([string]::IsNullOrWhiteSpace($global:connectDetails.sasToken) -eq $true) {
        Write-Log "Mode      : User-Credentials"
    } else {
        Write-Log "Mode      : Sas-Token"
    }
}

Function Validate-Params
{
    # Validate parameters
    if ([string]::IsNullOrWhiteSpace($container) -ne $true -and "beta","next","public", "dev", "nightly" -NotContains $container) {
        Write-LogFailure "[$($container)] is not a valid value, must be beta, next or public"
    }
}

Function Get-AllVersionFiles(
    [system.collections.generic.dictionary[string, system.collections.generic.list[hashtable]]] $files,
    [string] $storagePath
) {
    Get-VersionFiles $files "$storagePath/ext" "ai.prfmm-mgr." $null
}

$Error.Clear()

#-----------------------------------------------------------------------------
# Start of Script
#-----------------------------------------------------------------------------
Set-LogPath $logPath, "listCdnVersionsLog"
Write-LogParams
Validate-Params

# Don't try and list anything if any errors have been logged
if (Get-HasErrors -eq $true) {
    exit 2
}

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
# List the files for each container
$files = New-Object 'system.collections.generic.dictionary[string, system.collections.generic.list[hashtable]]'


# Get the public files (scripts/b)
if ([string]::IsNullOrWhiteSpace($container) -eq $true) {
    Get-AllVersionFiles $files "scripts/b"
    Get-AllVersionFiles $files "beta"
    Get-AllVersionFiles $files "next"
    Get-AllVersionFiles $files "dev"
    Get-AllVersionFiles $files "nightly"
}

if ([string]::IsNullOrWhiteSpace($container) -ne $true) {
    if ($container -eq "public") {
        Get-AllVersionFiles $files "scripts/b"
    } elseif ($container -eq "beta" -or $container -eq "next" -or $container -eq "dev" -or $container -eq "nightly") {
        Get-AllVersionFiles $files "$container"
    } else {
        $global:connectDetails.testOnly = $true
        $global:connectDetails.storeContainer = "tst"
        Get-AllVersionFiles $files "$container"
    }
}

ListVersions $files $activeOnly $showFiles

Write-Log "======================================================================"
