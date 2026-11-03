$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$packages = @(
    @{ path = "AISKU"; suffix = ""; publicPath = "scripts/b"; count = 13 },
    @{ path = "extensions\applicationinsights-clickanalytics-js"; suffix = "/ext"; publicPath = "scripts/b/ext"; count = 13 },
    @{ path = "extensions\applicationinsights-debugplugin-js"; suffix = "/ext"; publicPath = "scripts/b/ext"; count = 13 },
    @{ path = "extensions\applicationinsights-perfmarkmeasure-js"; suffix = "/ext"; publicPath = "scripts/b/ext"; count = 13 },
    @{ path = "tools\chrome-debug-extension"; suffix = "/tools"; publicPath = "release/tools"; count = 2 },
    @{ path = "tools\config"; suffix = ""; publicPath = "scripts/b"; count = 1 }
)

function Assert-Equal($expected, $actual, [string] $message) {
    if ($expected -cne $actual) {
        throw "$message -- expected [$expected], got [$actual]"
    }
}

function Read-Script([string] $path) {
    $tokens = $null
    $errors = $null
    $ast = [System.Management.Automation.Language.Parser]::ParseFile($path, [ref] $tokens, [ref] $errors)
    if ($errors.Count -ne 0) {
        throw "PowerShell parse errors in ${path}: $errors"
    }
    return $ast
}

$helper = Read-Script (Join-Path $repoRoot "common\publish\AzStorageHelper\AzStorageHelper.psm1")
$versionFunction = $helper.Find({
    param($node)
    $node -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq "Get-VersionDetails"
}, $false)
. ([scriptblock]::Create($versionFunction.Extent.Text))

function Test-Publishing($package, [string] $versionString, [string[]] $expectedPaths) {
    $path = Join-Path $repoRoot "$($package.path)\scripts\publishAzReleaseToCdn.ps1"
    $ast = Read-Script $path
    $version = Get-VersionDetails $versionString
    $releaseFiles = @{ "ai.$versionString.js" = "release" }
    $testFiles = @{ "ai_test.config.$versionString.cfg.json" = "test" }
    $cacheControl1Year = "public, max-age=31536000, immutable, no-transform"
    $contentType = "application/test"
    $overwrite = $false
    $global:connectDetails = @{ testOnly = $false; storeContainer = "cdn" }
    $calls = [System.Collections.Generic.List[hashtable]]::new()

    function PublishFiles($files, $storePath, $cacheControl, $type, $replace) {
        $calls.Add(@{ files = $files; path = $storePath })
        Assert-Equal $cacheControl1Year $cacheControl "Cache policy changed"
        Assert-Equal $contentType $type "Content type changed"
        Assert-Equal $overwrite $replace "Overwrite flag changed"
    }

    # Execute only the real routing block, never Azure setup or authentication.
    $routing = $ast.EndBlock.Statements | Where-Object {
        $_ -is [System.Management.Automation.Language.IfStatementAst] -and
        $_.Clauses[0].Item1.Extent.Text -eq '$version.type -eq "release"'
    }
    Assert-Equal 1 @($routing).Count "Expected one publishing routing block in $path"
    . ([scriptblock]::Create($routing.Extent.Text))

    Assert-Equal ($expectedPaths -join ",") (($calls | ForEach-Object { $_.path }) -join ",") "$path $versionString destinations"
    $usesTestConfig = $package.path -eq "tools\config" -and
        ($version.type -eq "beta" -or $version.type -eq "dev" -or $version.type -like "nightly*")
    foreach ($call in $calls) {
        $expectedFiles = $releaseFiles
        if ($usesTestConfig) {
            $expectedFiles = $testFiles
        }
        Assert-Equal $true ([object]::ReferenceEquals($expectedFiles, $call.files)) "$path $versionString file selection"
    }
    Assert-Equal ($version.type -eq "alpha") $global:connectDetails.testOnly "$path test storage isolation"
}

function Test-Activation($package, [string] $versionString, [string] $container, [bool] $valid, [bool] $minorOnly = $false) {
    $path = Join-Path $repoRoot "$($package.path)\scripts\setAzActiveCdnVersion.ps1"
    $ast = Read-Script $path
    $activeVersion = $versionString
    $global:connectDetails = @{ testOnly = $false; storeContainer = "cdn" }
    $calls = [System.Collections.Generic.List[hashtable]]::new()

    function Write-Log($message) {}
    function Write-LogWarning($message) {}
    function Write-LogFailure($message) { throw $message }
    function Get-HasErrors { return $false }

    $validation = $ast.Find({
        param($node)
        $node -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq "Validate-Params"
    }, $false)
    . ([scriptblock]::Create($validation.Extent.Text))
    $validationError = $null
    try {
        $version = Validate-Params
    } catch {
        $validationError = $_
    }
    if (!$valid) {
        if ($null -eq $validationError) {
            throw "$path accepted invalid activation $versionString in $container"
        }
        return
    }
    if ($null -ne $validationError) {
        throw $validationError
    }

    $usesTestConfig = $package.path -eq "tools\config" -and
        ($container -eq "dev" -or $container -eq "nightly" -or $version.type -eq "beta")
    $selectedFiles = [System.Collections.Generic.List[hashtable]]::new()
    for ($idx = 0; $idx -lt $package.count; $idx++) {
        $selectedFiles.Add(@{ name = "file$idx" })
    }
    function Get-VersionFiles($files, $storePath, $prefix, $requestedVersion) {
        $expectedPath = "$container$($package.suffix)"
        if ($container -eq "public") {
            $expectedPath = $package.publicPath
        }
        Assert-Equal $expectedPath $storePath "Activation source path changed"
        Assert-Equal $versionString $requestedVersion "Prerelease version name changed"
        if ($package.path -ne "tools\config" -or ($prefix -eq "ai_test.config.") -eq $usesTestConfig) {
            $files[$requestedVersion] = $selectedFiles
        }
    }
    function SetActiveVersion($files, $storePath, $minor, $unversioned) {
        Assert-Equal $true ([object]::ReferenceEquals($selectedFiles, $files)) "Wrong files activated"
        Assert-Equal $minorOnly $minor "Minor-only flag changed"
        Assert-Equal ($package.path -eq "tools\chrome-debug-extension") ([bool] $unversioned) "Unversioned alias behavior changed"
        $calls.Add(@{ path = $storePath })
    }

    $source = $ast.Extent.Text
    $start = $source.IndexOf('$files = New-Object')
    if ($start -lt 0) {
        throw "Missing activation file lookup in $path"
    }
    . ([scriptblock]::Create($source.Substring($start)))
    Assert-Equal 1 $calls.Count "$path should activate once"
    $expectedPath = "$container$($package.suffix)"
    if ($container -eq "public") {
        $expectedPath = $package.publicPath
    }
    Assert-Equal $expectedPath $calls[0].path "$path activation destination"
}

foreach ($package in $packages) {
    $suffix = $package.suffix
    Test-Publishing $package "3.4.5" @("next$suffix", $package.publicPath)
    Test-Publishing $package "3.4.5-rc.1" @("next$suffix")
    Test-Publishing $package "3.4.5-beta.1" @("next$suffix")
    Test-Publishing $package "3.4.5-beta.2+build7" @("next$suffix")
    Test-Publishing $package "3.4.5-dev" @("dev$suffix")
    Test-Publishing $package "3.4.5-nightly.1" @("nightly$suffix")
    Test-Publishing $package "3.4.5-nightlybeta.1" @("nightly$suffix")
    Test-Publishing $package "3.4.5-alpha.1" @("alpha$suffix")

    Test-Activation $package "3.4.5" "next" $true
    Test-Activation $package "3.4.5" "public" $true
    Test-Activation $package "3.4.5-rc.1" "next" $true
    Test-Activation $package "3.4.5-beta.1" "next" $true
    Test-Activation $package "3.4.5-beta.2+build7" "next" $true $true
    Test-Activation $package "3.4.5-dev" "dev" $true
    Test-Activation $package "3.4.5-nightly.1" "nightly" $true
    Test-Activation $package "3.4.5" "beta" $false
    Test-Activation $package "3.4.5-rc.1" "beta" $false
    Test-Activation $package "3.4.5-beta.1" "beta" $false
    Test-Activation $package "3.4.5-beta.1" "public" $false
    Test-Activation $package "3.4.5-beta.1" "dev" $false

    $listing = Read-Script (Join-Path $repoRoot "$($package.path)\scripts\listAzCdnVersions.ps1")
    Assert-Equal $true ($listing.Extent.Text.Contains('Get-AllVersionFiles $files "beta')) "$($package.path) must retain legacy beta listing"
    Write-Output "PASS: $($package.path) publishing, activation and legacy listing"
}

$e2e = Get-Content (Join-Path $repoRoot "AISKU\Tests\Unit\src\applicationinsights.e2e.tests.ts") -Raw
Assert-Equal $false ($e2e.Contains("https://js.monitor.azure.com/beta/")) "E2E must not consume the frozen beta channel"
Assert-Equal $true ($e2e.Contains("https://js.monitor.azure.com/next/ai.3.gbl.min.js?")) "E2E must monitor next"
$site = Get-Content (Join-Path $repoRoot "tools\github-page-script-injection\injectScript.js") -Raw
Assert-Equal $true ($site.Contains('scriptContent.replaceAll("/scripts/b/", "/next/")')) "Docs site must consume next"
Assert-Equal $true ($site.Contains("https://js.monitor.azure.com/next/ai.config.1.cfg.json")) "Docs config must consume next"
Write-Output "PASS: live-test and docs-site channel selection"
