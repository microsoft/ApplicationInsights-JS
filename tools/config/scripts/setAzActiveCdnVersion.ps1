[CmdletBinding()]
param (
    [string] $container = "",                           # The container to update
    [string] $activeVersion = "",                       # The version to copy as the active version
    [string] $storeContainer = "cdn",                   # Identifies the destination storage account container
    [string] $cdnStorePath = "cdnstoragename",          # Identifies the target Azure Storage account (by name)
    [string] $subscriptionId = $null,                   # Identifies the target Azure Subscription Id (if not encoded in the cdnStorePath)
    [string] $resourceGroup = $null,                    # Identifies the target Azure Subscription Resource Group (if not encoded in the cdnStorePath)
    [string] $sasToken = $null,                         # The SAS Token to use rather than using or attempting to login
    [string] $logPath = $null,                          # The location where logs should be written
    [switch] $minorOnly = $false,                       # Only set the active minor version (v2.x) and not the major version (v2)
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
    Write-Log "Container         : $container"
    Write-Log "Version           : $activeVersion"
    Write-Log "Storage Container : $storeContainer"
    Write-Log "Store Path        : $($global:connectDetails.cdnStorePath)"
    Write-Log "Test Mode         : $testOnly"
    Write-Log "Log Path          : $logDir"
    Write-Log "Use Connected Acct: $useConnectedAccount"

    if ([string]::IsNullOrWhiteSpace($global:connectDetails.sasToken) -eq $true) {
        Write-Log "Mode      : User-Credentials"
    } else {
        Write-Log "Mode      : Sas-Token"
    }
}

Function Validate-Params
{
    if ([string]::IsNullOrWhiteSpace($activeVersion) -eq $true) {
        Write-LogFailure "The Active version is not specified"
        exit
    }

    $version = Get-VersionDetails $activeVersion

    if ([string]::IsNullOrWhiteSpace($version.type) -eq $true) {
        Write-LogFailure "Unknown release type"
    }

    $versionParts = $version.ver.Split(".")
    if ($versionParts.Length -ne 3) {
        Write-LogFailure "Active Version [$activeVersion] is not a valid version number"
    }

    foreach ($verNum in $versionParts) {
        [int]$value = 0
        if ([int32]::TryParse($verNum, [ref]$value) -ne $true) {
            Write-LogFailure "[$($verNum)] is not a valid number within the version[$activeVersion]"
        }
    }

    # Publish the full versioned files to all release folders
    if ($version.type -eq "release") {
        # Normal publishing deployment
        if ("beta","next","public" -NotContains $container) {
            Write-LogFailure "Container [$container] is not valid for version type [$($version.type)]"
        }
    }
    elseif ($version.type -eq "rc") {
        if ("beta","next" -NotContains $container) {
            Write-LogFailure "Container [$container] is not valid for version type [$($version.type)]"
        }
    }
    elseif ($version.type -eq "dev" -or $version.type -eq "beta") {
        if ($version.type -ne $container) {
            Write-LogFailure "Container [$container] is not valid for version type [$($version.type)]"
        }
    }
    elseif ($version.type -eq "nightly" -or $version.type -eq "nightly3") {
        if ("nightly" -ne $container) {
            Write-LogFailure "Container [$container] is not valid for version type [$($version.type)]"
        }
    }
    else {
        # Upload to the test container rather than the supplied one
        $global:connectDetails.testOnly = $true
        if ($version.type -ne $container) {
            Write-LogFailure "Container [$container] is not valid for version type [$($version.type)]"
        } else {
            Write-LogWarning "Non-Standard release type using tst/$container as the destination"
        }
    }
    
    return $version;
}

$Error.Clear()

#-----------------------------------------------------------------------------
# Start of Script
#-----------------------------------------------------------------------------
Set-LogPath $logPath "setActiveCdnVersionLog"

Write-LogParams
$version = Validate-Params

# Don't try and publish anything if any errors have been logged
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

$storePath = "$container"
if ($container -eq "public") {
    $storePath = "scripts/b"
} elseif ($container -ne "beta" -and $container -ne "next" -and $container -ne "dev" -and $container -ne "nightly") {
    $global:connectDetails.testOnly = $true
    $global:connectDetails.storeContainer = "tst"
}

Get-VersionFiles $files $storePath "ai.config." $activeVersion

if ($files.ContainsKey($activeVersion) -ne $true) {
    Write-LogFailure "Version [$activeVersion] does not appear to be deployed to [$container]"
} elseif ($files[$activeVersion].Count -ne 1) {          # Since 2.6.5
    Write-LogFailure "Version [$activeVersion] does not fully deployed to [$container] -- only found [$($files[$activeVersion].Count)] file(s)"
}

# Don't try and publish anything if any errors have been logged
if (Get-HasErrors -eq $true) {
    exit 2
}

SetActiveVersion $files[$activeVersion] $storePath $minorOnly

Write-Log "======================================================================"
