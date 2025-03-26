
if (Test-Path "../../common/publish/Logging") {
    Import-Module -Name "../../common/publish/Logging"
} else {
    Import-Module -Name "../../../common/publish/Logging"
}

$cacheControl30Min = "public, max-age=1800, immutable, no-transform";

$metaSdkVer = "aijssdkver"
$metaSdkSrc = "aijssdksrc"
$jsContentType = "text/javascript; charset=utf-8";
$contentTypeMap = @{
    "js" = $jsContentType;
    "map" = "application/json";
    "json" = "application/json";
    "zip" = "application/zip";
    "htm" = "text/html; charset=utf-8";
    "html" = "text/html; charset=utf-8";
};

##  Function: InstallRequiredModules
##  Purpose: Checks and attempts to install the required Azure Modules
Function InstallRequiredModules ( 
    [int32] $retry = 1
) {
    if ($retry -le 0) {
        Write-LogWarning "--------------------------------------"
        Write-LogWarning "Failed to install the required Modules"
        Write-LogWarning "--------------------------------------"
        Write-Log ""
        Write-Log "Please install / run the following from an administrator powershell window"
        Write-Log "Install-Module Az.Accounts"
        Write-Log "Install-Module Az.Storage"
        Write-Log ""
        Write-Log "Additional Notes for Internal Application Insights Team"
        Write-Log "Please review the 'Release to CDN Failures' Page on the teams documentation for further assistance"

        exit
    }

    $commandsExist = $true
    $c = Get-Command Connect-AzAccount -errorAction SilentlyContinue
    if ($null -eq $c) {
        $commandsExist = $false
    } else {
        Write-Log "Importing Module $($c.Source) for Connect-AzAccount"
        Import-Module $c.Source
        $c = Get-Command Get-AzStorageAccount -errorAction SilentlyContinue
        if ($null -eq $c) {
            $commandsExist = $false
        } else {
            Write-Log "Importing Module $($c.Source) for Get-AzStorageAccount"
            Import-Module $c.Source
        }
    }

    if ($commandsExist -eq $false) {
        # You will need to at least have the Az.Storage module installed
        $m = Get-Module -ListAvailable -Name "Az.Storage"
        if ($null -eq $m) {
            Write-Log "The Az.Storage module is not currently installed -- it needs to be"
            Write-Log "Attempting to Install Az.Storage Module"
 
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

Function CheckLogin(
    [hashtable] $connectDetails
)
{
    $loggedIn = $false
    $attempt = 1

    Try {
        Write-Log "Checking Logged in status. $connectDetails"
        while ($loggedIn -eq $false) {
            $global:Error.Clear()
    
            if ($attempt -ge 6) {
                Write-LogFailure "Unable to login..."
                exit 100;
            }
    
            $loggedIn = $true
            if ([string]::IsNullOrWhiteSpace($($connectDetails.resourceGroup)) -ne $true) {
                if ([string]::IsNullOrWhiteSpace($connectDetails.storeName) -ne $true) {
                    Write-Log "Attempting to get default storage account for $($connectDetails.resourceGroup) account $($connectDetails.storeName)"
                    Get-AzStorageAccount -ResourceGroupName $connectDetails.resourceGroup -Name $connectDetails.storeName -ErrorAction SilentlyContinue | Out-Null
                } else {
                    Write-Log "Attempting to get default storage account for $($connectDetails.resourceGroup)"
                    Get-AzStorageAccount -ResourceGroupName $connectDetails.resourceGroup -ErrorAction SilentlyContinue | Out-Null
                }
            } else {
                Write-Log "Attempting to get default storage account"
                Get-AzStorageAccount -ErrorAction SilentlyContinue | Out-Null
            }
    
            Write-LogErrors $false
    
            foreach ($eacherror in $global:Error) {
                Write-LogWarning "Not Logged in..."
                $loggedIn = $false
                if ($eacherror.Exception.ToString() -like "* Connect-AzAccount*") {
                    Write-Log "Logging in... Atempt #$attempt"
                    $global:Error.Clear()
                    Login-AzAccount -ErrorAction SilentlyContinue 
                    Write-LogErrors $false
                    break
                } elseif ($eacherror.Exception.ToString() -like "* Connect-AzAccount*") {
                    Write-Log "Connecting... Atempt #$attempt"
                    $global:Error.Clear()
                    if ([string]::IsNullOrWhiteSpace($connectDetails.subscriptionId) -ne $true -and (IsGuid($connectDetails.subscriptionId) -eq $true)) {
                        Connect-AzAccount -ErrorAction SilentlyContinue -SubscriptionId $connectDetails.subscriptionId | Out-Null
                    } else {
                        Connect-AzAccount -ErrorAction SilentlyContinue | Out-Null
                    }
    
                    Write-LogErrors $false
                    break
                } else {
                    Write-LogWarning "Unexpected failure $($eacherror.Exception)"
                }
            }
    
            $attempt ++
        }
    
        $global:Error.Clear()
    }
    Catch [error]
    {
        Write-LogException error
    }
}

Function ParseCdnStorePath (
    [hashtable] $connectDetails
)
{
    if ([string]::IsNullOrWhiteSpace($connectDetails.cdnStorePath) -eq $true) {
        Write-LogFailure "Invalid Store Path ($($connectDetails.cdnStorePath))"
        exit 10
    }

    $connectDetails.storeName = $connectDetails.cdnStorePath
    $splitOptions = [System.StringSplitOptions]::RemoveEmptyEntries    
    $parts = $connectDetails.cdnStorePath.split(":", $splitOptions)
    if ($parts.Length -eq 3) {
        $connectDetails.subscriptionId = $parts[0]
        $connectDetails.resourceGroup = $parts[1]
        $connectDetails.storeName = $parts[2]
    } elseif ($parts.Length -eq 2) {
        $connectDetails.subscriptionId = $parts[0]
        $connectDetails.storeName = $parts[1]
    } elseif ($parts.Length -ne 1) {
        Write-LogFailure "Invalid Store Path ($($connectDetails.cdnStorePath))"
        exit 11
    }

    if ([string]::IsNullOrWhiteSpace($connectDetails.storeName) -eq $true) {
        Write-LogFailure "Missing Storage name from Path ($($connectDetails.cdnStorePath))"
        exit 12
    }

    Write-Log "----------------------------------------------------------------------"
    if ([string]::IsNullOrWhiteSpace($connectDetails.subscriptionId) -ne $true) {
        Write-Log "Subscription: $($connectDetails.subscriptionId)"
    }

    if ([string]::IsNullOrWhiteSpace($connectDetails.resourceGroup) -ne $true) {
        Write-Log "Group       : $($connectDetails.resourceGroup)"
    }

    Write-Log "StoreName   : $($connectDetails.storeName)"
    Write-Log "----------------------------------------------------------------------"

    return $connectDetails
}

Function ValidateAccess (
    [hashtable] $connectDetails
)
{
    if ($null -eq $connectDetails) {
        $connectDetails = @{}
    }

    CheckLogin($connectDetails) | Out-Null
    if (Get-HasErrors -eq $true) {
        exit 2
    }

    $store = $null
    $subs = $null
    if ([string]::IsNullOrWhiteSpace($connectDetails.subscriptionId) -ne $true -and (IsGuid($connectDetails.subscriptionId) -eq $true)) {
        Select-AzSubscription -SubscriptionId $connectDetails.subscriptionId | Out-Null
        if ([string]::IsNullOrWhiteSpace($connectDetails.resourceGroup) -ne $true -and [string]::IsNullOrWhiteSpace($connectDetails.storeName) -ne $true) {
            Write-Log "  Getting Storage Account"
            $accounts = Get-AzStorageAccount -ResourceGroupName $connectDetails.resourceGroup -Name $connectDetails.storeName
            if ($null -ne $accounts -and $accounts.Length -eq 1) {
                $store = $accounts[0]
            }
        }
        
        if ($null -eq $store) {
            Write-Log "  Selecting Subscription"
            $subs = Get-AzSubscription -SubscriptionId $connectDetails.subscriptionId | Where-Object State -eq "Enabled"
        }
    } else {
        Write-Log "  Finding Subscriptions"
        $subs = Get-AzSubscription | Where-Object State -eq "Enabled"
    }

    if ($null -eq $store -and $null -ne $subs) {
        if ($null -eq $subs -or $subs.Length -eq 0) {
            Write-LogFailure "  - No Active Subscriptions"
            exit 500;
        }
    
        # Limit to the defined subscription
        if ([string]::IsNullOrWhiteSpace($connectDetails.subscriptionId) -ne $true) {
            $subs = $subs | Where-Object Id -like $("*$($connectDetails.subscriptionId)*")
        }

        Write-Log "  Finding Storage Account"
        $accounts = $null
        foreach ($id in $subs) {
            Write-Log "    Checking Subscription $($id.Id)"
            Select-AzSubscription -SubscriptionId $id.Id | Out-Null
            $accounts = $null
            if ([string]::IsNullOrWhiteSpace($connectDetails.resourceGroup) -ne $true) {
                if ([string]::IsNullOrWhiteSpace($connectDetails.storeName) -eq $true) {
                    $accounts = Get-AzStorageAccount -ResourceGroupName $connectDetails.resourceGroup -Name $connectDetails.storeName
                } else {
                    $accounts = Get-AzStorageAccount -ResourceGroupName $connectDetails.resourceGroup
                }
            } else {
                $accounts = Get-AzStorageAccount
            }
    
            if ($null -ne $accounts -and $accounts.Length -ge 1) {
                # If a resource group has been supplied limit to just that group
                if ([string]::IsNullOrWhiteSpace($connectDetails.resourceGroup) -ne $true) {
                    $accounts = $accounts | Where-Object ResourceGroupName -eq $connectDetails.resourceGroup
                }
    
                $accounts = $accounts | Where-Object StorageAccountName -eq $connectDetails.storeName
    
                if ($accounts.Length -gt 1) {
                    Write-LogFailure "    - Too many [$($accounts.Length)] matching storage accounts located for $($connectDetails.cdnStorePath) please specify the resource group as a prefix for the store name parameter '[<Subscription>:[<ResourceGroup>:]]<StoreName>"
                    exit 300;
                } elseif ($accounts.Length -eq 1 -and $null -eq $store) {
                    Write-Log "    - Found Candidate Subscription $($id.Id)"
                    $connectDetails.subscriptionId = $id.Id
                    $store = $accounts[0]
                } elseif ($accounts.Length -ne 0 -or $null -ne $store) {
                    Write-LogFailure "    - More than 1 storage account was located for $($connectDetails.cdnStorePath) please specify the resource group as a prefix for the store name parameter '[<Subscription>:[<ResourceGroup>:]]<StoreName>"
                    exit 300;
                } else {
                    Write-Log "    - No Matching Accounts"
                }
            } else {
                Write-Log "    - No Storage Accounts"
            }
        }
    }

    if ($null -eq $store) {
        Write-LogFailure "  Unable to access or locate a storage account $($connectDetails.cdnStorePath)"
        exit 300;
    }

    $connectDetails.storeName = $store.StorageAccountName
    $connectDetails.resourceGroup = $store.ResourceGroupName

    Write-Log "Getting StorageContext for"
    if ([string]::IsNullOrWhiteSpace($connectDetails.subscriptionId) -ne $true) {
        Write-Log "  Subscription: $($connectDetails.subscriptionId)"
    }

    if ([string]::IsNullOrWhiteSpace($connectDetails.resourceGroup) -ne $true) {
        Write-Log "  Group       : $($connectDetails.resourceGroup)"
    }

    Write-Log "  StoreName   : $storeName"
    if ($connectDetails.useConnectedAccount -eq $true -and [string]::IsNullOrWhiteSpace($storeName) -ne $true) {
        Write-Log "  Using Connected Account"
        $connectDetails.storageContext = New-AzStorageContext -StorageAccountName $storeName -UseConnectedAccount -ErrorAction SilentlyContinue
    } else {
        Write-Log "  Using User Account"
        $connectDetails.storageContext = $store.context
    }
    if ($null -eq $connectDetails.storageContext) {
        Write-LogFailure "  - Unable to access or locate a storage account $($connectDetails.cdnStorePath)"
        exit 301;
    }

    return $connectDetails
}

Function GetContainerContext(
    [hashtable] $connectDetails,
    [string] $storagePath
) {
    # Don't try and publish anything if any errors have been logged
    if (Get-HasErrors -eq $true) {
        exit 2
    }

    while($storagePath.endsWith("/") -eq $true) {
        $storagePath = $storagePath.Substring(0, $storagePath.Length-1)
    }

    $blobPrefix = ""
    $storageContainer = ""

    $tokens = $storagePath.split("/", 2)
    if ($tokens.length -eq 0) {
        Write-LogWarning "Invalid storage path - $storagePath"
        exit
    }

    $storageContainer = $tokens[0]
    if ($tokens.Length -eq 2) {
        $blobPrefix = $tokens[1] + "/"
    }

    if ($connectDetails.storeContainer.Length -gt 0) {
        $blobPrefix = $storageContainer + "/" + $blobPrefix
        $storageContainer = $connectDetails.storeContainer
   }

   if ($connectDetails.testOnly -eq $true) {
        $blobPrefix = $storageContainer + "/" + $blobPrefix
        $storageContainer = "tst"
    }
    
    Write-Log "Container  : $storageContainer Prefix: $blobPrefix"

    # Use the Users Storage Context credentials
    $azureContext = $connectDetails.storageContext
    if ([string]::IsNullOrWhiteSpace($connectDetails.sasToken) -ne $true) {
        # Use the Sas token
        $azureContext = New-AzStorageContext -StorageAccountName $connectDetails.storeName -Sastoken $connectDetails.sasToken -ErrorAction SilentlyContinue
    }

    if ($connectDetails.useConnectedAccount -eq $true) {
        Write-Log "Using Connected Account"
        $azureContext = New-AzStorageContext -StorageAccountName $connectDetails.storeName -UseConnectedAccount -ErrorAction SilentlyContinue
    }

    $azContainer = Get-AzStorageContainer -Name $storageContainer -Context $azureContext -ErrorAction SilentlyContinue
    if ($null -eq $azContainer) {
        Write-Log "Container [$storageContainer] does not exist"
        return
    }

    if (Get-HasErrors -eq $true) {
        exit 3
    }

    [hashtable]$return = @{}
    $return.azureContext = $azureContext
    $return.container = $azContainer
    $return.storageContainer = $storageContainer
    $return.blobPrefix = $blobPrefix

    return $return
}

Function Get-VersionDetails (
    [string] $ver
) {
    [hashtable] $version = @{}
    $version.full = $ver

    $parts = $ver -split "\+", 2
    if ($parts.Length -eq 2) {
        $version.bldNum = $parts[1]
        $ver = $parts[0]
    } else {
        $version.bldNum = ""
    }

    $parts = $ver -split "-", 2
    $version.ver = $parts[0]
    if ($parts.Length -eq 2) {
        $version.preRel = $parts[1]
        $version.type = ((($parts[1] -split "\+")[0] -split "\.")[0] -split "-")[0]
    } else {
        $version.preRel = ""
        $version.type = "release"
    }

    return $version;
}


Function Get-FileVersion (
    [string] $name
) {
    $regMatch = '^(.*\/)*([^\/\d]*\.)(\d+(\.\d+)*(-[\w\d\-\+]+\.?[\w\d\-\+]*)?)(\.(?:gbl\.js|gbl\.min\.js|cjs\.js|cjs\.min\.js|js|min\.js|integrity\.json|cfg\.json|zip)(?:\.map)?)$'
    $match = ($name | select-string $regMatch -AllMatches).matches
    $contentType = $jsContentType

    if ($null -eq $match) {
        return $null
    }
    
    $ext = $match.groups[6].value
    $tokens = $ext.split(".")
    if ($tokens.length -gt 0) {
        $theExt = $tokens[$tokens.Count - 1]
        $contentType = $contentTypeMap[$theExt]
    }

    [hashtable]$return = @{}
    $return.path = $match.groups[1].value
    $return.prefix = $match.groups[2].value
    $return.ver = $match.groups[3].value
    $return.verType = $match.groups[5].value
    $return.ext = $match.groups[6].value
    $return.contentType = $contentType

    return $return
}

Function Get-VersionFiles(
    [system.collections.generic.dictionary[string, system.collections.generic.list[hashtable]]] $files,
    [string] $storagePath,
    [string] $filePrefix,
    [string] $activeVersion
) {
    $context = GetContainerContext $global:connectDetails $storagePath
    if ($null -eq $context) {
        return
    }

    $wildCard = $false
    if ($filePrefix.EndsWith('*') -eq $true) {
        $wildCard = $true
        $filePrefix = $filePrefix.Substring(0, $filePrefix.Length - 1)
    }

    $blobs = Get-AzStorageBlob -Container $context.storageContainer -Context $context.azureContext -Prefix "$($context.blobPrefix)$filePrefix" -ErrorAction SilentlyContinue
    foreach ($blob in $blobs) {
        $version = Get-FileVersion $blob.Name
        if ($null -ne $version -and [string]::IsNullOrWhiteSpace($version.ver) -ne $true -and
                ([string]::IsNullOrWhiteSpace($activeVersion) -eq $true -or $version.ver -eq $activeVersion)) {

            $isMatch = $false
            if ($wildCard -ne $true -and $version.prefix -eq $filePrefix) {
                $isMatch = $true
            } elseif ($wildCard -eq $true -and $version.prefix.StartsWith($filePrefix) -eq $true) {
                $isMatch = $true
            }

            if ($isMatch -eq $true) {
                $fileList = $null
                if ($files.ContainsKey($version.ver) -ne $true) {
                    $fileList = New-Object 'system.collections.generic.list[hashtable]'
                    $files.Add($version.ver, $fileList)
                } else {
                    $fileList = $files[$version.ver]
                }
    
                $theBlob = [hashtable]@{}
                $theBlob.path = "$($context.storageContainer)/$($version.path)"
                $theBlob.blob = $blob
                $theBlob.context = $context
                $fileList.Add($theBlob)
            }
        }
    }
}

Function HasMetaTag(
    $blob,
    [string] $metaKey
) {
    foreach ($dataKey in $blob.ICloudBlob.Metadata.Keys) {
        if ($dataKey -ieq $metaKey) {
            return $true
        }
    }

    return $false
}

Function GetMetaTagValue(
    $blob,
    [string] $metaKey
) {
    $value = ""

    foreach ($dataKey in $blob.ICloudBlob.Metadata.Keys) {
        if ($dataKey -ieq $metaKey) {
            $value = $blob.ICloudBlob.Metadata[$dataKey]
            break
        }
    }

    return $value
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
    Write-LogErrors

    # Don't perform any copyies if if any errors have been logged as we want to make sure the attributes have been set
    if (Get-HasErrors -eq $true) {
        exit 2
    }

    Write-Log "       - $($blob.Name) ==> $destName"

    $srcCloudBlob = $blob.ICloudBlob.FetchAttributes()

    $blobResult = Start-AzStorageBlobCopy -Context $blobContext -SrcContainer $blob.ICloudBlob.Container.Name -SrcBlob $blob.ICloudBlob.Name -DestContext $destContext.azureContext -DestContainer "$($destContext.storageContainer)" -DestBlob $destName -Force
    Write-LogErrors

    # Don't try and publish anything if any errors have been logged
    if (Get-HasErrors -eq $true) {
        exit 2
    }
    
    $status = $blobResult | Get-AzStorageBlobCopyState
    while ($status.Status -eq "Pending") {
        $status = $blobResult | Get-AzStorageBlobCopyState
        Write-Log $status
        Start-Sleep 10
    }

    # Don't try and publish anything if any errors have been logged
    if (Get-HasErrors -eq $true) {
        exit 2
    }

    # Make sure the metadata and properties are set correctly
    # - When destination did not exist then the properties and metadata are set correctly
    # - But when overwriting an existing blob the properties and metadata are not updated
    $newBlob = Get-AzStorageBlob -Context $destContext.azureContext -Container "$($destContext.storageContainer)" -Blob $destName
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
    $ver,
    $cacheControl
) {
    $cloudBlob = $stagedBlob.ICloudBlob
    $cloudBlob.FetchAttributes()
    $cloudBlob.Properties.CacheControl = $cacheControl
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

    Write-LogErrors
    # Don't try and publish anything if any errors have been logged
    if (Get-HasErrors -eq $true) {
        exit 2
    }
}

Function PublishFiles(
    $files,
    [string] $storagePath,
    [string] $cacheControlValue,
    [string] $defaultContentType,
    [bool] $overwrite
) {

    # Don't try and publish anything if any errors have been logged
    if (Get-HasErrors -eq $true) {
        exit 2
    }

    while($storagePath.endsWith("/") -eq $true) {
        $storagePath = $storagePath.Substring(0, $storagePath.Length-1)
    }

    $blobPrefix = ""
    $storageContainer = ""

    $tokens = $storagePath.split("/", 2)
    if ($tokens.length -eq 0) {
        Write-LogWarning "Invalid storage path - $storagePath"
        exit
    }

    $storageContainer = $tokens[0]
    if ($tokens.Length -eq 2) {
        $blobPrefix = $tokens[1] + "/"
    }

    if ($global:connectDetails.storeContainer.Length -gt 0) {
        $blobPrefix = $storageContainer + "/" + $blobPrefix
        $storageContainer = $global:connectDetails.storeContainer
   }

    if ($global:connectDetails.testOnly -eq $true) {
        $blobPrefix = $storageContainer + "/" + $blobPrefix
        $storageContainer = "tst"
    }

    Write-Log "Container  : $storageContainer Prefix: $blobPrefix"
    Write-Log "    Using Cache Control: $cacheControlValue"

    # Use the Users Storage Context credentials
    $azureContext = $global:connectDetails.storageContext
    if ([string]::IsNullOrWhiteSpace($global:connectDetails.sasToken) -ne $true) {
        # Use the Sas token
        $azureContext = New-AzStorageContext -StorageAccountName $global:connectDetails.storeName -Sastoken $global:connectDetails.sasToken
    }

    if ($connectDetails.useConnectedAccount -eq $true) {
        Write-Log "Using Connected Account"
        $azureContext = New-AzStorageContext -StorageAccountName $global:connectDetails.storeName -UseConnectedAccount -ErrorAction SilentlyContinue
    }

    $container = Get-AzStorageContainer -Name $storageContainer -Context $azureContext -ErrorAction SilentlyContinue
    if ($null -eq $container) {
        $Error.Clear()
        New-AzStorageContainer -Name $storageContainer -Context $azureContext -Permission Blob -ErrorAction SilentlyContinue | Out-Null
        Write-LogErrors
    }

    if (Get-HasErrors -eq $true) {
        exit 3
    }

    # upload files to Azure Storage
    foreach($name in $files.Keys) {
        $path = $files[$name]

        $metadata = [hashtable]@{}
        $version = Get-FileVersion $name
        if ($null -ne $version) {
            $metadata[$metaSdkVer] = $version.ver
        }

        $contentType = $defaultContentType
        if ($null -ne $version.contentType) {
            $contentType = $version.contentType
        }

        $newBlob = $null
        $blob = Get-AzStorageBlob -Container $storageContainer -Blob ($blobPrefix + $name) -Context $azureContext -ErrorAction SilentlyContinue
        if ($null -ne $blob -and $blob.Count -ne 0) {
            if ($overwrite -eq $true) {
                Write-Log "    Overwriting $($blobPrefix + $name) as [$($version.ext) -> ($contentType)] with version $($version.ver)"
                $newBlob = Set-AzStorageBlobContent -Force -Container $storageContainer -File $path -Blob ($blobPrefix + $name) -Context $azureContext -Properties @{CacheControl = $cacheControlValue; ContentType = $contentType} -Metadata $metadata
                if ($null -eq $newBlob) {
                    Write-LogFailure "    Failed to overwrite/upload $($blobPrefix + $name)"
                }
            } else {
                Write-LogWarning "    $($blobPrefix + $name) is already present"
            }
        } else {
            Write-Log "    Uploading $($blobPrefix + $name) as [$($version.ext) -> ($contentType)] with version $($version.ver)"
            $newBlob = Set-AzStorageBlobContent -Container $storageContainer -File $path -Blob ($blobPrefix + $name) -Context $azureContext -Properties @{CacheControl = $cacheControlValue; ContentType = $contentType} -Metadata $metadata
            if ($null -eq $newBlob) {
                Write-LogFailure "    Failed to upload $($blobPrefix + $name)"
            }
        }

        # Stop publishing if any errors have been logged
        if (Get-HasErrors -eq $true) {
            exit 5
        }
    }
}

Function AddReleaseFile(
    $files,
    [string] $releaseDir,
    [string] $name,
    [boolean] $optional = $false
) {
    $sourcePath = (Join-Path $releaseDir -ChildPath ($name))

    if (-Not (Test-Path $sourcePath)) {
        if ($false -eq $optional) {
            Write-LogWarning "Missing expected source file '$sourcePath'";
            exit         
        } else {
            return
        }
    }

    Write-Log " - $sourcePath"
    $files.Add($name, $sourcePath)
}

Function GetPackageVersion(
    [string] $jsSdkDir
)
{
    if ([string]::IsNullOrWhiteSpace($jsSdkDir) -eq $true) {
        Write-LogWarning "Invalid JS Sdk Path"
        exit
    }

    Write-Log "Releasing from : $jsSdkDir"

    # find version number
    $packageJsonPath =  Join-Path $jsSdkDir -ChildPath "package.json"
    if (-Not (Test-Path $packageJsonPath)) {
        Write-LogWarning "'$packageJsonPath' file not found, please enter the top JSSDK directory.";
        exit
    }

    $packagesJson = (Get-Content $packageJsonPath -Raw) | ConvertFrom-Json

    return Get-VersionDetails $packagesJson.version
}

Function ListVersions(
   [system.collections.generic.dictionary[string, system.collections.generic.list[hashtable]]] $files,
   [boolean] $activeOnly,
   [boolean] $showFiles
) {

    $sortedKeys = $files.Keys | Sort-Object
    $orderedKeys = New-Object 'system.collections.generic.list[string]'
    foreach ($key in $sortedKeys) {
        $verParts = $key.split(".");
        if ($verParts.Length -ge 3) {
            continue
        }
        $orderedKeys.Add($key)
    }

    if ($activeOnly -ne $true) {
        foreach ($key in $sortedKeys) {
            $verParts = $key.split(".");
            if ($verParts.Length -lt 3) {
                continue
            }
            $orderedKeys.Add($key)
        }
    }

    foreach ($key in $orderedKeys) {
        $verParts = $key.split(".");
        if ($activeOnly -eq $true -and $verParts.Length -gt 2) {
            continue
        }

        $fileList = $files[$key]
        $paths = [hashtable]@{}
        if ($showFiles -ne $true) {
            Write-Log $("v{0,-12} ({1,2})" -f $key,$($fileList.Count))
            $pathList = ""
            foreach ($theBlob in $fileList) {
                $thePath = $theBlob.path
                if (HasMetaTag($theBlob, $metaSdkSrc)) {
                    $sdkVer = GetMetaTagValue $theBlob $metaSdkSrc
                    $version = Get-FileVersion $sdkVer
                    $thePath = "$($version.path)$($version.prefix)$($version.ver)"
                }

                if ($paths.ContainsKey($thePath) -ne $true) {
                    $paths[$thePath] = 1
                    $value = "{0,-20}" -f $thePath
                    $pathList = "$pathList$value  "
                } else {
                    $paths[$thePath] = ($paths[$thePath] + 1)
                }
            }

            foreach ($thePath in $paths.Keys | Sort-Object) {
                Write-Log $("  - {1,-40} ({0})" -f $paths[$thePath],$thePath)
            }

            #Write-Log $("v{0,-8} ({1,2})  -  {2}" -f $key,$($fileList.Count),$pathList.Trim())
        } else {
            Write-Log $("v{0,-12} ({1,2})" -f $key,$($fileList.Count))
            foreach ($theBlob in $fileList) {
                $blob = $theBlob.blob
                $blob.ICloudBlob.FetchAttributes()
                $sdkVersion = GetMetaTagValue $blob $metaSdkVer
                if ([string]::IsNullOrWhiteSpace($sdkVersion) -ne $true) {
                    $sdkVersion = "v$sdkVersion"
                } else {
                    $sdkVersion = "---"
                }
    
                $metaTags = ""
                foreach ($dataKey in $blob.ICloudBlob.Metadata.Keys) {
                    if ($dataKey -ine $metaSdkVer) {
                        $metaTags = "$metaTags$dataKey=$($blob.ICloudBlob.Metadata[$dataKey]); "
                    }
                }
    
                $cacheControl = $blob.ICloudBlob.Properties.CacheControl
                $cacheControl = $cacheControl -replace "public","pub"
                $cacheControl = $cacheControl -replace "max-age=31536000","1yr"
                $cacheControl = $cacheControl -replace "max-age=1800","30m"
                $cacheControl = $cacheControl -replace "max-age=900","15m"
                $cacheControl = $cacheControl -replace "max-age=300"," 5m"
                $cacheControl = $cacheControl -replace "immutable","im"
                $cacheControl = $cacheControl -replace "no-transform","no-trns"
                $cacheControl = $cacheControl -replace ", "," "
    
                Write-Log $("  - {0,-64}{3,-26}{1,8:N1} Kb  {2:yyyy-MM-dd HH:mm:ss}  {4,10}  {5}" -f $($blob.ICloudBlob.Container.Name + "/" + $blob.Name),($blob.Length/1kb),$blob.LastModified,$sdkVersion,$cacheControl,$metaTags)
            }
        }
    }
}

Function SetActiveVersion(
   [system.collections.generic.list[hashtable]] $fileList,
   [string] $storePath,
   [boolean] $minorOnly,
   [boolean] $setUnversioned = $false
) {

    $destContext = GetContainerContext $global:connectDetails $storePath

    Write-Log "Storage Path : $storePath"
    Write-Log "Container : $($destContext.storageContainer)"
    Write-Log "BlobPrefix: $($destContext.blobPrefix)"

    # Stage the version updates
    foreach ($theBlob in $fileList) {
        $blob = $theBlob.blob
        $blobContext = $theBlob.context.azureContext
        Write-Log $("Copying: {0,-40} {1,6:N1} Kb  {2:yyyy-MM-dd HH:mm:ss}" -f $($blob.ICloudBlob.Container.Name + "/" + $blob.Name),($blob.Length/1kb),$blob.LastModified)

        $version = Get-FileVersion $blob.Name
        if ($null -ne $version) {
            $verDetails = Get-VersionDetails $version.ver
            $verParts = $verDetails.ver.Split(".")
            if ($verParts.Length -ne 3) {
                Write-LogFailure "ScriptError: Invalid Version! [$activeVersion]"
            }

            $preRel = ""
            if ($verDetails.type -ne "release") {
                $preRel = "-" + $verDetails.type
            }
        
            # Don't try and publish anything if any errors have been logged
            if (Get-HasErrors -eq $true) {
                exit 2
            }
    
            $stageName = "$($version.path)$($version.prefix)$($verParts[0]).$($verParts[1])$($preRel)$($version.ext).stage"
            CopyBlob $blobContext $blob $destContext $stageName

            $stagedBlob = Get-AzStorageBlob -Context $destContext.azureContext -Container $destContext.storageContainer -Blob $stageName
            SetProperties $stagedBlob "[$($destContext.storageContainer)]/$($blob.Name)" $version.ver $cacheControl30Min

            $minorName = "$($version.path)$($version.prefix)$($verParts[0]).$($verParts[1])$($preRel)$($version.ext)"
            CopyBlob $blobContext $stagedBlob $destContext $minorName

            if ($minorOnly -eq $false) {
                $majorName = "$($version.path)$($version.prefix)$($verParts[0])$($preRel)$($version.ext)"
                CopyBlob $blobContext $stagedBlob $destContext $majorName
            }

            if ($setUnversioned -eq $true) {
                $unVerName = "$($version.path)$($version.prefix)$($preRel)$($version.ext)" -Replace "\.\.", "." -Replace "\.-", "."
                CopyBlob $blobContext $stagedBlob $destContext $unVerName
            }

            # Remove the staged files
            $stagedBlob | Remove-AzStorageBlob -Force
        }
    }
}

Export-ModuleMember -Function InstallRequiredModules
Export-ModuleMember -Function IsGuid
Export-ModuleMember -Function CheckLogin
Export-ModuleMember -Function ParseCdnStorePath
Export-ModuleMember -Function ValidateAccess
Export-ModuleMember -Function GetContainerContext
Export-ModuleMember -Function Get-VersionDetails
Export-ModuleMember -Function Get-FileVersion
Export-ModuleMember -Function Get-VersionFiles
Export-ModuleMember -Function HasMetaTag
Export-ModuleMember -Function GetMetaTagValue
Export-ModuleMember -Function RemoveMetadata
Export-ModuleMember -Function CopyBlob
Export-ModuleMember -Function SetProperties
Export-ModuleMember -Function PublishFiles
Export-ModuleMember -Function AddReleaseFile
Export-ModuleMember -Function GetPackageVersion
Export-ModuleMember -Function ListVersions
Export-ModuleMember -Function SetActiveVersion