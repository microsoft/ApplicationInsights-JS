$global:hasErrors = $false
$global:logPath = $null
$global:logDir = $null
$global:logFile = $null

$fileTimeStamp = ((get-date).ToUniversalTime()).ToString("yyyyMMddThhmmss")

##  Function: Get-TimeStamp
##  Purpose: Used to get the timestamp for logging
Function Get-TimeStamp
{
    return "[{0:MM/dd/yy} {0:HH:mm:ss}]" -f (Get-Date)
}

Function Write-LogDetail(
    [string] $value
) {
    $logFile = Get-LogFile
    Add-Content $logFile "$(Get-TimeStamp) $value"
}

Function Clear-HasErrors {
    $global:hasErrors = $false
}

Function Get-HasErrors {
    return $global:hasErrors
}

Function Get-LogPath {
    if ([string]::IsNullOrWhiteSpace($global:logDir)) {
        $global:logDir = $global:logPath
        if ([string]::IsNullOrWhiteSpace($global:logPath) -eq $true) {
            $global:logDir = join-path ${env:SystemDrive} "\Logs"
        }
        
        if (!(Test-Path -Path $global:logDir)) {
            New-Item -ItemType directory -Path $global:logDir
        }
    }
    
    return $global:logDir
}

Function Set-LogPath {
    param (
        [string] $logPath,
        [string] $filename = $null,
        [boolean] $clearHasErrors = $true
    )

    $global:logDir = $null
    $global:logPath = $logPath

    if ([string]::IsNullOrWhiteSpace($filename) -ne $true) {
        $logDir = Get-LogPath
        $global:logFile = "$logDir\$($filename)_$fileTimeStamp.txt"
    }

    if ($clearHasErrors -eq $true) {
        Clear-HasErrors
    }
}

Function Get-LogFile {
    if ([string]::IsNullOrWhiteSpace($global:logFile) -eq $true) {
        $logDir = Get-LogPath
        $global:logFile = "$logDir\publishLog_$fileTimeStamp.txt"
    }

    return $global:logFile
}

##  Function: Write-Log
##  Purpose: Used to log the output to both the Console and a log file
Function Write-Log( 
    [string] $value
) {
    Write-Host "$(Get-TimeStamp) $value"
    Write-LogDetail $value
}

##  Function: Write-LogWarning
##  Purpose: Used to log warning messages to both the Console and a log file
Function Write-LogWarning ( 
    [string] $value
) {
    Write-Host "$(Get-TimeStamp) [WRN] $value" -ForegroundColor Yellow -BackgroundColor DarkBlue
    Write-LogDetail "[WRN] $value"
}

##  Function: Write-LogFailure
##  Purpose: Used to log failure messages to both the Console and a log file
Function Write-LogFailure ( 
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

##  Function: Write-LogException
##  Purpose: Used to log exception details to both the Console and a log file
Function Write-LogException (
    [System.Management.Automation.ErrorRecord] $err,
    [boolean] $asError = $true,
    [string] $prefix = ""
) {
    Write-LogFailure "$($prefix)Exception: $($err.Exception.Message)" $asError
    Write-LogFailure "$($prefix)Source   : $($err.Exception.Source)"  $asError
    Write-LogDetail "$($prefix)Full Exception: $($err.Exception)"
    Write-LogFailure "$($prefix)$($err.ScriptStackTrace)" $asError
}

##  Function: Write-LogErrors
##  Purpose: Used to log error messages to both the Console and a log file
Function Write-LogErrors (
    [boolean] $asError = $true,
    [string] $prefix = ""
) {
    foreach ($err in $global:Error) {
        Write-LogException $err $asError
        foreach ($innerEx in $err.InnerExceptions) {
            Write-LogException $innerEx $asError "$prefix  "
        }
    }
}

# Define the exported functions
Export-ModuleMember -Function Clear-HasErrors
Export-ModuleMember -Function Get-HasErrors
Export-ModuleMember -Function Get-LogPath
Export-ModuleMember -Function Set-LogPath
Export-ModuleMember -Function Get-LogFile
Export-ModuleMember -Function Write-Log
Export-ModuleMember -Function Write-LogWarning
Export-ModuleMember -Function Write-LogFailure
Export-ModuleMember -Function Write-LogException
Export-ModuleMember -Function Write-LogErrors
