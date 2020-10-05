[CmdletBinding()]
param (
    [string] $container = "",                           # The container to update
    [string] $activeVersion = "",                       # The version to copy as the active version
    [string] $cdnStorePath = "cdnstoragename",          # Identifies the target Azure Storage account (by name)
    [string] $subscriptionId = $null,                   # Identifies the target Azure Subscription Id (if not encoded in the cdnStorePath)
    [string] $resourceGroup = $null,                    # Identifies the target Azure Subscription Resource Group (if not encoded in the cdnStorePath)
    [string] $sasToken = $null,                         # The SAS Token to use rather than using or attempting to login
    [string] $logPath = $null,                          # The location where logs should be written
    [switch] $minorOnly = $false,                       # Only set the active minor version (v2.x) and not the major version (v2)
    [switch] $testOnly = $false                         # Uploads to a "tst" test container on the storage account
)

$metaSdkVer = "aijssdkver"
$metaSdkSrc = "aijssdksrc"

$global:hasErrors = $false
$global:sasToken = $sasToken
$global:resourceGroup = $resourceGroup
$global:storeName = $null                              # The endpoint needs to the base name of the endpoint, not the full URL (eg. “my-cdn” rather than “my-cdn.azureedge.net”)
$global:subscriptionId = $subscriptionId
$global:storageContext = $null

Function Log-Params 
{
    Log "Container : $container"
    Log "Version   : $activeVersion"
    Log "Store Path: $cdnStorePath"
    Log "Test Mode : $testOnly"
    Log "Log Path  : $logDir"
    
    if ([string]::IsNullOrWhiteSpace($global:sasToken) -eq $true) {
        Log "Mode      : User-Credentials"
    } else {
        Log "Mode      : Sas-Token"
    }
}

##  Function: Get-TimeStamp
##  Purpose: Used to get the timestamp for logging
Function Get-TimeStamp
{
    return "[{0:MM/dd/yy} {0:HH:mm:ss}]" -f (Get-Date)
}

Function Write-LogDetail(
    [string] $value
) {
    Add-Content $logFile "$(Get-TimeStamp) $value"
}

##  Function: Log
##  Purpose: Used to log the output to both the Console and a log file
Function Log( 
    [string] $value
) {
    Write-Host "$(Get-TimeStamp) $value"
    Write-LogDetail $value
}

##  Function: Log-Warning
##  Purpose: Used to log the output to both the Console and a log file
Function Log-Warning ( 
    [string] $value
) {
    Write-Host "$(Get-TimeStamp) [WRN] $value" -ForegroundColor Yellow -BackgroundColor DarkBlue
    Write-LogDetail "[WRN] $value"
}

##  Function: Log-Warning
##  Purpose: Used to log the output to both the Console and a log file
Function Log-Failure ( 
    [string] $value,
    [boolean] $isTerminal = $true
) {
    if ($isTerminal -eq $true) {
        Write-Host "$(Get-TimeStamp) [ERR] $value" -ForegroundColor Yellow -BackgroundColor DarkRed
        Write-LogDetail "[ERR] $value"
        $global:hasErrors = $true
    } else {
        Write-Host "$(Get-TimeStamp) [INF] $value" -ForegroundColor Red
        Write-LogDetail "[INF] $value"
    }
}

Function Log-Exception(
    [System.Management.Automation.ErrorRecord] $err,
    [boolean] $asError = $true,
    [string] $prefix = ""
) {
    Log-Failure "$($prefix)Exception: $($err.Exception.Message)" $asError
    Log-Failure "$($prefix)Source   : $($err.Exception.Source)"  $asError
    Write-LogDetail "$($prefix)Full Exception: $($err.Exception)"
    Log-Failure "$($prefix)$($err.ScriptStackTrace)" $asError
}

Function Log-Errors(
    [boolean] $asError = $true,
    [string] $prefix = ""
) {
    foreach ($err in $Error) {
        Log-Exception $err $asError
        foreach ($innerEx in $err.InnerExceptions) {
            Log-Exception $innerEx $asError "$prefix  "
        }
    }
}

##  Function: InstallRequiredModules
##  Purpose: Checks and attempts to install the required AzureRM Modules
Function InstallRequiredModules ( 
    [int32] $retry = 1
) {
    if ($retry -le 0) {
        Log-Warning "--------------------------------------"
        Log-Warning "Failed to install the required Modules"
        Log-Warning "--------------------------------------"
        Log ""
        Log "Please install / run the following from an administrator powershell window"
        Log "Install-Module AzureRM"
        Log "Install-Module Az.Storage"
        Log ""
        Log "Additional Notes for Internal Application Insights Team"
        Log "Please review the 'Release to CDN Failures' Page on the teams documentation for further assistance"

        exit
    }

    $commandsExist = $true
    $c = Get-Command Login-AzureRMAccount -errorAction SilentlyContinue
    if ($null -eq $c) {
        $commandsExist = $false
    } else {
        Log "Importing Module $($c.Source) for Login-AzureRMAccount"
        Import-Module $c.Source
        $c = Get-Command Get-AzureRmStorageAccount -errorAction SilentlyContinue
        if ($null -eq $c) {
            $commandsExist = $false
        } else {
            Log "Importing Module $($c.Source) for Get-AzureRmStorageAccount"
            Import-Module $c.Source
        }
    }

    if ($commandsExist -eq $false) {
        # You will need to at least have the AzureRM module installed
        $m = Get-Module -ListAvailable -Name "AzureRM"
        if ($null -eq $m) {
            Log "The AzureRM module is not currently installed -- it needs to be"
            Log "Attempting to Install AzureRM Module"

            InstallRequiredModules $($retry-1)
        }
    }
}

Function IsGuid(
    [string] $value
) {
    $guid = New-Object 'System.Guid'
    return [System.Guid]::TryParse($value, [ref]$guid)
}

Function CheckLogin
{
    $loggedIn = $false
    $attempt = 0

    Log "Checking Logged in status."
    while ($loggedIn -eq $false) {
        $Error.Clear()

        if ($attempt -ge 5) {
            Log-Failure "Unable to login..."
            exit 100;
        }

        $loggedIn = $true
        if ([string]::IsNullOrWhiteSpace($global:resourceGroup) -ne $true) {
            if ([string]::IsNullOrWhiteSpace($global:storeName) -eq $true) {
                Get-AzureRmStorageAccount -ResourceGroupName $global:resourceGroup -AccountName $global:storeName -ErrorAction SilentlyContinue | Out-Null
            } else {
                Get-AzureRmStorageAccount -ResourceGroupName $global:resourceGroup -ErrorAction SilentlyContinue | Out-Null
            }
        } else {
            Get-AzureRmStorageAccount -ErrorAction SilentlyContinue | Out-Null
        }

        Log-Errors $false

        #Get-AzureRmSubscription -SubscriptionId $subscriptionId -ErrorAction SilentlyContinue
        foreach ($eacherror in $Error) {
            if ($eacherror.Exception.ToString() -like "* Login-AzureRmAccount*") {
                $loggedIn = $false

                Log "Logging in... Atempt #$($attempt + 1)"
                $Error.Clear()
                Login-AzureRMAccount -ErrorAction SilentlyContinue 
                Log-Errors $false
                break
            } elseif ($eacherror.Exception.ToString() -like "* Connect-AzureRmAccount*") {
                $loggedIn = $false

                Log "Connecting... Atempt #$($attempt + 1)"
                $Error.Clear()
                if ([string]::IsNullOrWhiteSpace($global:subscriptionId) -ne $true -and (IsGuid($global:subscriptionId) -eq $true)) {
                    Connect-AzureRmAccount -ErrorAction SilentlyContinue -Subscription $global:subscriptionId | Out-Null
                } else {
                    Connect-AzureRmAccount -ErrorAction SilentlyContinue | Out-Null
                }

                Log-Errors $false
                break
            } else {
                $loggedIn = $false
                Log-Warning "Unexpected failure $($eacherror.Exception)"
            }
        }

        $attempt ++
    }

    $Error.Clear()
}

Function ParseCdnStorePath
{
    if ([string]::IsNullOrWhiteSpace($cdnStorePath) -eq $true) {
        Log-Failure "Invalid Store Path ($cdnStorePath)"
        exit 10
    }

    $global:storeName = $cdnStorePath
    $splitOptions = [System.StringSplitOptions]::RemoveEmptyEntries    
    $parts = $cdnStorePath.split(":", $splitOptions)
    if ($parts.Length -eq 3) {
        $global:subscriptionId = $parts[0]
        $global:resourceGroup = $parts[1]
        $global:storeName = $parts[2]
    } elseif ($parts.Length -eq 2) {
        $global:subscriptionId = $parts[0]
        $global:storeName = $parts[1]
    } elseif ($parts.Length -ne 1) {
        Log-Failure "Invalid Store Path ($cdnStorePath)"
        exit 11
    }

    if ([string]::IsNullOrWhiteSpace($global:storeName) -eq $true) {
        Log-Failure "Missing Storage name from Path ($cdnStorePath)"
        exit 12
    }

    Log "----------------------------------------------------------------------"
    if ([string]::IsNullOrWhiteSpace($global:subscriptionId) -ne $true) {
        Log "Subscription: $global:subscriptionId"
    }

    if ([string]::IsNullOrWhiteSpace($global:resourceGroup) -ne $true) {
        Log "Group       : $global:resourceGroup"
    }

    Log "StoreName   : $global:storeName"
    Log "----------------------------------------------------------------------"
}

Function ValidateAccess
{
    CheckLogin | Out-Null

    $store = $null
    $subs = $null
    if ([string]::IsNullOrWhiteSpace($global:subscriptionId) -ne $true -and (IsGuid($global:subscriptionId) -eq $true)) {
        Select-AzureRmSubscription -SubscriptionId $global:subscriptionId | Out-Null
        if ([string]::IsNullOrWhiteSpace($global:resourceGroup) -ne $true -and [string]::IsNullOrWhiteSpace($global:storeName) -ne $true) {
            Log "  Getting Storage Account"
            $accounts = Get-AzureRmStorageAccount -ResourceGroupName $global:resourceGroup -AccountName $global:storeName
            if ($null -ne $accounts -and $accounts.Length -eq 1) {
                $store = $accounts[0]
            }
        }
        
        if ($null -eq $store) {
            Log "  Selecting Subscription"
            $subs = Get-AzureRmSubscription -SubscriptionId $global:subscriptionId | Where-Object State -eq "Enabled"
        }
    } else {
        Log "  Finding Subscriptions"
        $subs = Get-AzureRmSubscription | Where-Object State -eq "Enabled"
    }

    if ($null -eq $store -and $null -ne $subs) {
        if ($null -eq $subs -or $subs.Length -eq 0) {
            Log-Failure "  - No Active Subscriptions"
            exit 500;
        }
    
        # Limit to the defined subscription
        if ([string]::IsNullOrWhiteSpace($global:subscriptionId) -ne $true) {
            $subs = $subs | Where-Object Id -like $("*$global:subscriptionId*")
        }

        Log "  Finding Storage Account"
        $accounts = $null
        foreach ($id in $subs) {
            Log "    Checking Subscription $($id.Id)"
            Select-AzureRmSubscription -SubscriptionId $id.Id | Out-Null
            $accounts = $null
            if ([string]::IsNullOrWhiteSpace($global:resourceGroup) -ne $true) {
                if ([string]::IsNullOrWhiteSpace($global:storeName) -eq $true) {
                    $accounts = Get-AzureRmStorageAccount -ResourceGroupName $global:resourceGroup -AccountName $global:storeName
                } else {
                    $accounts = Get-AzureRmStorageAccount -ResourceGroupName $global:resourceGroup
                }
            } else {
                $accounts = Get-AzureRmStorageAccount
            }
    
            if ($null -ne $accounts -and $accounts.Length -ge 1) {
                # If a resource group has been supplied limit to just that group
                if ([string]::IsNullOrWhiteSpace($global:resourceGroup) -ne $true) {
                    $accounts = $accounts | Where-Object ResourceGroupName -eq $global:resourceGroup
                }
    
                $accounts = $accounts | Where-Object StorageAccountName -eq $global:storeName
    
                if ($accounts.Length -gt 1) {
                    Log-Failure "    - Too many [$($accounts.Length)] matching storage accounts located for $($cdnStorePath) please specify the resource group as a prefix for the store name parameter '[<Subscription>:[<ResourceGroup>:]]<StoreName>"
                    exit 300;
                } elseif ($accounts.Length -eq 1 -and $null -eq $store) {
                    Log "    - Found Candidate Subscription $($id.Id)"
                    $global:subscriptionId = $id.Id
                    $store = $accounts[0]
                } elseif ($accounts.Length -ne 0 -or $null -ne $store) {
                    Log-Failure "    - More than 1 storage account was located for $($cdnStorePath) please specify the resource group as a prefix for the store name parameter '[<Subscription>:[<ResourceGroup>:]]<StoreName>"
                    exit 300;
                } else {
                    Log "    - No Matching Accounts"
                }
            } else {
                Log "    - No Storage Accounts"
            }
        }
    }

    if ($null -eq $store) {
        Log-Failure "  Unable to access or locate a storage account $cdnStorePath"
        exit 300;
    }

    $global:storeName = $store.StorageAccountName
    $global:resourceGroup = $store.ResourceGroupName

    Log "Getting StorageContext for"
    if ([string]::IsNullOrWhiteSpace($global:subscriptionId) -ne $true) {
        Log "  Subscription: $global:subscriptionId"
    }

    if ([string]::IsNullOrWhiteSpace($global:resourceGroup) -ne $true) {
        Log "  Group       : $global:resourceGroup"
    }

    Log "  StoreName   : $global:storeName"    
    $global:storageContext = $store.context
    if ($null -eq $global:storageContext) {
        Log-Failure "  - Unable to access or locate a storage account $cdnStorePath"
        exit 301;
    }
}

Function GetVersion(
    [string] $name
) {
    $regMatch = '^(.*\/)*([^\/\d]*\.)(\d+\.\d+\.\d+(-[^\.]+)?)(\.(?:gbl\.js|gbl\.min\.js|cjs\.js|cjs\.min\.js|js|min\.js)(?:\.map)?)$'
    $match = ($name | select-string $regMatch -AllMatches).matches

    if ($null -eq $match) {
        return $null
    }
    
    [hashtable]$return = @{}
    $return.path = $match.groups[1].value
    $return.prefix = $match.groups[2].value
    $return.ver = $match.groups[3].value
    $return.verType = $match.groups[4].value
    $return.ext = $match.groups[5].value

    return $return
}

Function GetContainerContext(
    [string] $storagePath
) {
    # Don't try and publish anything if any errors have been logged
    if ($global:hasErrors -eq $true) {
        exit 2
    }

    while($storagePath.endsWith("/") -eq $true) {
        $storagePath = $storagePath.Substring(0, $storagePath.Length-1)
    }

    $blobPrefix = ""
    $storageContainer = ""

    $tokens = $storagePath.split("/", 2)
    if ($tokens.length -eq 0) {
        Log-Warning "Invalid storage path - $storagePath"
        exit
    }

    $storageContainer = $tokens[0]
    if ($tokens.Length -eq 2) {
        $blobPrefix = $tokens[1] + "/"
    }

    if ($testOnly -eq $true) {
        $blobPrefix = $storageContainer + "/" + $blobPrefix
        $storageContainer = "tst"
    }

    Log "Container  : $storageContainer Prefix: $blobPrefix"

    # Use the Users Storage Context credentials
    $azureContext = $global:storageContext
    if ([string]::IsNullOrWhiteSpace($global:sasToken) -ne $true) {
        # Use the Sas token
        $azureContext = New-AzureStorageContext -StorageAccountName $global:storeName -Sastoken $global:sasToken -ErrorAction SilentlyContinue
    }
    
    $container = Get-AzureStorageContainer -Name $storageContainer -Context $azureContext -ErrorAction SilentlyContinue
    Log-Errors

    if ($global:hasErrors -eq $true) {
        exit 3
    }

    if ($null -eq $container) {
        Log "Container [$storageContainer] does not exist"
        exit 4
    }

    [hashtable]$return = @{}
    $return.azureContext = $azureContext
    $return.container = $container
    $return.storageContainer = $storageContainer
    $return.blobPrefix = $blobPrefix

    return $return
}

Function GetVersionFiles(
    [system.collections.generic.dictionary[string, system.collections.generic.list[hashtable]]] $files,
    [string] $storagePath,
    [string] $filePrefix
) {
    $context = GetContainerContext $storagePath

    $blobs = Get-AzureStorageBlob -Container $context.storageContainer -Context $context.azureContext -Prefix "$($context.blobPrefix)$filePrefix$activeVersion" -ErrorAction SilentlyContinue
    foreach ($blob in $blobs) {
        $parts = $blob.Name.Split("/")
        $name = $parts[$parts.Length-1]
        $version = GetVersion $name
        if ($null -ne $version -and [string]::IsNullOrWhiteSpace($version.ver) -ne $true -and 
                $version.prefix -eq $filePrefix -and
                $version.ver -eq $activeVersion) {
            $fileList = $null
            if ($files.ContainsKey($version.ver) -ne $true) {
                $fileList = New-Object 'system.collections.generic.list[hashtable]'
                $files.Add($version.ver, $fileList)
            } else {
                $fileList = $files[$version.ver]
            }

            Log $("  - {0,-40} {1,6:N1} Kb  {2:yyyy-MM-dd HH:mm:ss}" -f $($blob.ICloudBlob.Container.Name + "/" + $blob.Name),($blob.Length/1kb),$blob.LastModified)
            $theBlob = [hashtable]@{}
            $theBlob.blob = $blob
            $theBlob.context = $context
            $fileList.Add($theBlob)
        }
    }
}

Function RemoveMetadata(
    $cloudBlob,
    [string] $dataKey
) {
    # Removing and adding the attribute to avoid duplication of values when the key case is different
    $changed = $true
    while ($changed -eq $true) {
        $changed = $false
        foreach ($dstKey in $cloudBlob.Metadata.Keys) {
            if ($dstKey -ieq $dataKey) {
                $cloudBlob.Metadata.Remove($dstKey) | Out-Null
                $changed = $true
                break
            }
        }
    } 
}

Function CopyBlob(
    $blobContext,
    $blob,
    $destContext,
    $destName
) {
    Log-Errors

    # Don't perform any copyies if if any errors have been logged as we want to make sure the attributes have been set
    if ($global:hasErrors -eq $true) {
        exit 2
    }

    Log "       - $($blob.Name) ==> $destName"

    $srcCloudBlob = $blob.ICloudBlob.FetchAttributes()

    $blobResult = Start-AzureStorageBlobCopy -Context $blobContext -CloudBlob $blob.ICloudBlob -DestContext $destContext.azureContext -DestContainer "$($destContext.storageContainer)" -DestBlob $destName -Force
    Log-Errors

    # Don't try and publish anything if any errors have been logged
    if ($global:hasErrors -eq $true) {
        exit 2
    }
    
    $status = $blobResult | Get-AzureStorageBlobCopyState
    while ($status.Status -eq "Pending") {
        $status = $blobResult | Get-AzureStorageBlobCopyState
        Log $status
        Start-Sleep 10
    }

    # Don't try and publish anything if any errors have been logged
    if ($global:hasErrors -eq $true) {
        exit 2
    }

    # Make sure the metadata and properties are set correctly
    # - When destination did not exist then the properties and metadata are set correctly
    # - But when overwriting an existing blob the properties and metadata are not updated
    $newBlob = Get-AzureStorageBlob -Context $destContext.azureContext -Container "$($destContext.storageContainer)" -Blob $destName
    $cloudBlob = $newBlob.ICloudBlob
    $cloudBlob.FetchAttributes()
    $cloudBlob.Properties.CacheControl = $blob.ICloudBlob.Properties.CacheControl
    foreach ($dataKey in $blob.ICloudBlob.Metadata.Keys) {
        RemoveMetadata $cloudBlob $dataKey
        $cloudBlob.Metadata.Add($dataKey, $blob.ICloudBlob.Metadata[$dataKey]) | Out-Null
    }

    $cloudBlob.SetProperties()
    $cloudBlob.SetMetadata()
}

Function SetProperties(
    $stagedBlob,
    $srcName,
    $ver
) {
    $cloudBlob = $stagedBlob.ICloudBlob
    $cloudBlob.FetchAttributes()
    $cloudBlob.Properties.CacheControl = $cacheControl30Min
    RemoveMetadata $cloudBlob $metaSdkSrc
    $cloudBlob.Metadata.Add($metaSdkSrc, $srcName) | Out-Null

    # Make sure the version metadata is set
    if ($cloudBlob.Metadata.ContainsKey($metaSdkVer) -eq $false -or 
            [string]::IsNullOrWhiteSpace($cloudBlob.Metadata[$metaSdkVer]) -eq $true) {
        RemoveMetadata $cloudBlob $metaSdkVer
        $cloudBlob.Metadata.Add($metaSdkVer, $ver) | Out-Null
    }
    $cloudBlob.SetProperties()
    $cloudBlob.SetMetadata()

    Log-Errors
    # Don't try and publish anything if any errors have been logged
    if ($global:hasErrors -eq $true) {
        exit 2
    }
}

Function SetActiveVersion(
   [system.collections.generic.list[hashtable]] $fileList,
   [string] $storePath
) {

    $destContext = GetContainerContext $storePath

    Log "Storage Path : $storePath"
    Log "Container : $($destContext.storageContainer)"
    Log "BlobPrefix: $($destContext.blobPrefix)"

    # Stage the version updates
    foreach ($theBlob in $fileList) {
        $blob = $theBlob.blob
        $blobContext = $theBlob.context.azureContext
        Log $("Copying: {0,-40} {1,6:N1} Kb  {2:yyyy-MM-dd HH:mm:ss}" -f $($blob.ICloudBlob.Container.Name + "/" + $blob.Name),($blob.Length/1kb),$blob.LastModified)

        $version = GetVersion $blob.Name
        if ($null -ne $version) {
            $verParts = $version.ver.Split(".")
            if ($verParts.Length -ne 3) {
                Log-Failure "ScriptError: Invalid Version! [$activeVersion]"
            }
        
            # Don't try and publish anything if any errors have been logged
            if ($global:hasErrors -eq $true) {
                exit 2
            }
    
            $stageName = "$($version.path)$($version.prefix)$($verParts[0]).$($verParts[1])$($version.ext).stage"
            CopyBlob $blobContext $blob $destContext $stageName

            $stagedBlob = Get-AzureStorageBlob -Context $destContext.azureContext -Container $destContext.storageContainer -Blob $stageName
            SetProperties $stagedBlob "[$($destContext.storageContainer)]/$($blob.Name)" $version.ver

            $minorName = "$($version.path)$($version.prefix)$($verParts[0]).$($verParts[1])$($version.ext)"
            CopyBlob $blobContext $stagedBlob $destContext $minorName

            if ($minorOnly -eq $false) {
                $majorName = "$($version.path)$($version.prefix)$($verParts[0])$($version.ext)"
                CopyBlob $blobContext $stagedBlob $destContext $majorName
            }

            # Remove the staged files
            $stagedBlob | Remove-AzureStorageBlob -Force
        }
    }
}

Function Validate-Params
{
    # Validate parameters
    if ("beta","next","public" -NotContains $container) {
        Log-Failure "[$($container)] is not a valid value, must be beta, next or public"
    }

    $checkVersion = $activeVersion
    $subParts = $checkVersion.split("-")
    if ($subParts.Length -gt 2) {
        Log-Failure "[$($activeVersion)] is not a valid version number"
    } elseif ($subParts.Length -eq 2) {
        $checkVersion = $subParts[0]
    }

    $versionParts = $checkVersion.Split(".")
    if ($versionParts.Length -ne 3) {
        Log-Failure "[$($activeVersion)] is not a valid version number"
    }

    foreach ($verNum in $versionParts) {
        [int]$value = 0
        if ([int32]::TryParse($verNum, [ref]$value) -ne $true) {
            Log-Failure "[$($verNum)] is not a valid number within the version[$activeVersion]"
        }
    }
}

$Error.Clear()

#-----------------------------------------------------------------------------
# Start of Script
#-----------------------------------------------------------------------------
$logDir = $logPath
if ([string]::IsNullOrWhiteSpace($logPath) -eq $true) {
    $logDir = join-path ${env:SystemDrive} "\Logs"
}

if (!(Test-Path -Path $logDir)) {
    New-Item -ItemType directory -Path $logDir
}

$fileTimeStamp = ((get-date).ToUniversalTime()).ToString("yyyyMMddThhmmss")
$logFile = "$logDir\setActiveCdnVersionLog_$fileTimeStamp.txt"

$cacheControl30Min = "public, max-age=1800, immutable";
$contentType = "text/javascript; charset=utf-8";

Log-Params
Validate-Params

# Don't try and publish anything if any errors have been logged
if ($global:hasErrors -eq $true) {
    exit 2
}

# You will need to at least have the AzureRM module installed
InstallRequiredModules
ParseCdnStorePath

if ([string]::IsNullOrWhiteSpace($global:sasToken) -eq $true) {
    Log "**********************************************************************"
    Log "Validating user access"
    Log "**********************************************************************"
    ValidateAccess
}

Log "======================================================================"
# List the files for each container
$files = New-Object 'system.collections.generic.dictionary[string, system.collections.generic.list[hashtable]]'

$storePath = $container
if ($container -eq "beta" -or $container -eq "next") {
    GetVersionFiles $files $container "ai."
} elseif ($container -eq "public") {
    GetVersionFiles $files "scripts/b" "ai."
    $storePath = "scripts/b"
}

if ($files.ContainsKey($activeVersion) -ne $true) {
    Log-Failure "Version [$activeVersion] does not appear to be deployed to [$container]"
} elseif ($files[$activeVersion].Count -ne 4 -and # Prior to 2.5.8
        $files[$activeVersion].Count -ne 8 -and   # Since 2.5.8
        $files[$activeVersion].Count -ne 12) {    # Since 2.5.8
    Log-Failure "Version [$activeVersion] does not fully deployed to [$container] -- only found [$($files[$activeVersion].Count)] file(s)"
}

# Don't try and publish anything if any errors have been logged
if ($global:hasErrors -eq $true) {
    exit 2
}

SetActiveVersion $files[$activeVersion] $storePath

Log "======================================================================"
