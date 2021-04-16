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

$metaSdkVer = "aijssdkver"

$global:hasErrors = $false
$global:cacheValue = $null
$global:sasToken = $sasToken
$global:resourceGroup = $resourceGroup
$global:storeName = $null                              # The endpoint needs to the base name of the endpoint, not the full URL (eg. “my-cdn” rather than “my-cdn.azureedge.net”)
$global:subscriptionId = $subscriptionId
$global:storageContext = $null

Function Log-Params 
{
    Log "Storage Container : $storeContainer"
    Log "Store Path        : $cdnStorePath"
    Log "Overwrite         : $overwrite"
    Log "Test Mode         : $testOnly"
    Log "SourcePath        : $jsSdkDir"
    Log "Log Path          : $logDir"
    
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

Function AddReleaseFile(
    $files,
    [string] $releaseDir,
    [string] $name
) {
    $sourcePath = (Join-Path $releaseDir -ChildPath ($name))

    if (-Not (Test-Path $sourcePath)) {
        Log-Warning "Missing expected source file '$sourcePath'";
        exit         
    }

    Log " - $sourcePath"
    $files.Add($name, $sourcePath)
}

Function GetReleaseFiles
{
    if ([string]::IsNullOrWhiteSpace($jsSdkDir) -eq $true) {
        Log-Warning "Invalid JS Sdk Path"
        exit
    }

    Log "Releasing from : $jsSdkDir"

    # find version number
    $packageJsonPath =  Join-Path $jsSdkDir -ChildPath "package.json"
    if (-Not (Test-Path $packageJsonPath)) {
        Log-Warning "'$packageJsonPath' file not found, please enter the top JSSDK directory.";
        exit
    }

    $packagesJson = (Get-Content $packageJsonPath -Raw) | ConvertFrom-Json
    $version = $packagesJson.version;

    Log "Version        : $version"

    # check if the minified dir exists
    $jsSdkSrcDir = Join-Path $jssdkDir -ChildPath "browser\";

    if (-Not (Test-Path $jsSdkSrcDir)) {
        Log-Warning "'$jsSdkSrcDir' directory doesn't exist. Compile JSSDK first.";
        exit
    }

    $files = New-Object 'system.collections.generic.dictionary[string,string]'

    Log "Adding files";
    AddReleaseFile $files $jsSdkSrcDir "ai.clck.$version.js"
    AddReleaseFile $files $jsSdkSrcDir "ai.clck.$version.js.map"
    AddReleaseFile $files $jsSdkSrcDir "ai.clck.$version.min.js"
    AddReleaseFile $files $jsSdkSrcDir "ai.clck.$version.min.js.map"

    return $files
}

Function GetVersion(
    [string] $name
) {
    $regMatch = '^(.*\/)*([^\/\d]*\.)(\d+(\.\d+)*(-[^\.]+)?)(\.(?:js|min\.js)(?:\.map)?)$'
    $match = ($name | select-string $regMatch -AllMatches).matches

    if ($null -eq $match) {
        return $null
    }
    
    [hashtable]$return = @{}
    $return.path = $match.groups[1].value
    $return.prefix = $match.groups[2].value
    $return.ver = $match.groups[3].value
    $return.verType = $match.groups[5].value
    $return.ext = $match.groups[6].value

    return $return
}

Function PublishFiles(
    $files,
    [string] $storagePath,
    [string] $cacheControlValue,
    [bool] $overwrite
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

    if ($storeContainer.Length -gt 0) {
        $blobPrefix = $storageContainer + "/" + $blobPrefix
        $storageContainer = $storeContainer
   }

    Log "Container  : $storageContainer Prefix: $blobPrefix"
    Log "    Using Cache Control: $cacheControlValue"

    # Use the Users Storage Context credentials
    $azureContext = $global:storageContext
    if ([string]::IsNullOrWhiteSpace($global:sasToken) -ne $true) {
        # Use the Sas token
        $azureContext = New-AzureStorageContext -StorageAccountName $global:storeName -Sastoken $global:sasToken
    }
    
    $container = Get-AzureStorageContainer -Name $storageContainer -Context $azureContext -ErrorAction SilentlyContinue
    if ($null -eq $container) {
        $Error.Clear()
        New-AzureStorageContainer -Name $storageContainer -Context $azureContext -Permission Blob -ErrorAction SilentlyContinue | Out-Null
        Log-Errors
    }

    if ($global:hasErrors -eq $true) {
        exit 3
    }

    # upload files to Azure Storage
    foreach($name in $files.Keys) {
        $path = $files[$name]

        $metadata = [hashtable]@{}
        $version = GetVersion $name
        if ($null -ne $version) {
            $metadata[$metaSdkVer] = $version.ver
        }

        $newBlob = $null
        $blob = Get-AzureStorageBlob -Container $storageContainer -Blob ($blobPrefix + $name) -Context $azureContext -ErrorAction SilentlyContinue
        if ($null -ne $blob -and $blob.Count -ne 0) {
            if ($overwrite -eq $true) {
                Log "    Overwriting $($blobPrefix + $name)"
                $newBlob = Set-AzureStorageBlobContent -Force -Container $storageContainer -File $path -Blob ($blobPrefix + $name) -Context $azureContext -Properties @{CacheControl = $cacheControlValue; ContentType = $contentType} -Metadata $metadata
                if ($null -eq $newBlob) {
                    Log-Failure "    Failed to overwrite/upload $($blobPrefix + $name)"
                }
            } else {
                Log-Warning "    $($blobPrefix + $name) is already present"
            }
        } else {
            Log "    Uploading $($blobPrefix + $name)"
            $newBlob = Set-AzureStorageBlobContent -Container $storageContainer -File $path -Blob ($blobPrefix + $name) -Context $azureContext -Properties @{CacheControl = $cacheControlValue; ContentType = $contentType} -Metadata $metadata
            if ($null -eq $newBlob) {
                Log-Failure "    Failed to upload $($blobPrefix + $name)"
            }
        }

        # Stop publishing if any errors have been logged
        if ($global:hasErrors -eq $true) {
            exit 5
        }
    }
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

$jsSdkDir = $releaseFrom
if ([string]::IsNullOrWhiteSpace($jsSdkDir) -eq $true) {
    $jsSdkDir = Split-Path (Split-Path $MyInvocation.MyCommand.Path) -Parent
}

$fileTimeStamp = ((get-date).ToUniversalTime()).ToString("yyyyMMddThhmmss")
$logFile = "$logDir\publishReleaseCdnLog_$fileTimeStamp.txt"

$cacheControl1Year = "public, max-age=31536000, immutable";
$contentType = "text/javascript; charset=utf-8";

Log-Params

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
$releaseFiles = GetReleaseFiles $false      # Get the versioned files only
if ($null -eq $releaseFiles -or $releaseFiles.Count -eq 0) {
    Log-Failure "Unable to find any release files"
}

Log "Release Files : $($releaseFiles.Count)"

Log "----------------------------------------------------------------------"
# Publish the full versioned files to all release folders
PublishFiles $releaseFiles "beta/ext" $cacheControl1Year $overwrite
PublishFiles $releaseFiles "next/ext" $cacheControl1Year $overwrite
PublishFiles $releaseFiles "scripts/b/ext" $cacheControl1Year $overwrite
Log "======================================================================"
