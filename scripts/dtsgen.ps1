##
## This script wrap the generated api dts file with a oneDS namespace and copyright notice the version
##
##  powershell.exe -ExecutionPolicy Bypass ../../scripts\dtsgen.ps1 ./dist-esm/applicationinsights-web.d.ts ./ 'Microsoft.ApplicationInsights'
##
param (
  [string] $skuName,                                        # The Sku name to place in the copyright notice
  [string] $projectPath = "./",                             # The root path for the project
  [string] $dtsFile = "",                                   # [Optional] The generated Dts file (if cannot be derived from the package.json)
  [switch] $hidePrivate                                     # [Optional] Switch to hide private properties and functions
 )

 $packagePath = ("$($projectPath)package.json" | Resolve-Path)
if (!(Test-Path "$packagePath")) {
    Write-Warning "Missing package.json file [$packagePath]"
    exit
}

Write-Host "Using Package: $packagePath"

$packageJson = Get-Content "$packagePath" | Out-String | ConvertFrom-Json
$version = $packageJson.version
$author = $packageJson.author
$homepage = $packageJson.homepage
$packageName = $packageJson.name
$packageName = $packageName -replace '@microsoft/', ''
$packageName = $packageName -replace '/', '_'

if (!$dtsFile) {
    $dtsFile = ("$($projectPath)dist/$packageName.d.ts" | Resolve-Path)
}

Write-Host "Transforming: $dtsFile"

if (!$dtsFile -or !(Test-Path $dtsFile -ErrorAction Ignore)) {
    Write-Error "Missing .d.ts file [$dtsFile]"
    exit
}

$dtsFileRollup = $dtsFile -replace "$packageName.d.ts", "$packageName.rollup.d.ts"

$rollupContent = 
    "/*`n" +
    " * $skuName, $version`n" +
    " * Copyright (c) Microsoft and contributors. All rights reserved.`n" +
    " *`n" +
    " * $author`n" +
    " * $homepage`n";

$newContent = $rollupContent +
    " */`n`n" +
    "declare namespace ApplicationInsights {";

$rollupContent = $rollupContent +
    " *`n" +
    " * ---------------------------------------------------------------------------`n" +
    " * This is a single combined (rollup) declaration file for the package,`n" +
    " * use this version if your build environment doesn't support the using the`n" +
    " * individual *.d.ts files or default namespace wrapped version.`n" +
    " * - Namespaced version: $packageName.d.ts`n" +
    " * ---------------------------------------------------------------------------`n" +
    " */`n";

#Read the generated dts file and append to the new content
$lastLine = ""
# Prefix every line with 4 spaces (indenting the lines)
ForEach ($line in (Get-Content $dtsFile)) {

    # Trim whitespace from the end of the string
    $rollupLine = $line -replace '(\s+$)', ''

    if ($line) {

        # Remove exports and declares
        $line = $line -replace 'export declare ', ''
        $line = $line -replace 'declare ', ''
        $line = $line -replace 'export { }', ''

        # Trim whitespace from the end of the string
        $line = $line -replace '(\s+$)', ''

        if ($hidePrivate) {
            #Hide private properties and functions
            $line = $line -replace '(^\s+)private (.*);', '${1}// private ${2};'
            $rollupLine = $rollupLine -replace '(^\s+)private (.*);', '${1}// private ${2};'
        }

        $rollupContent +=  "`n$rollupLine";
        $newContent += "`n    $line";
    } elseif ($lastLine) {
        # Only add 1 blank line
        $rollupContent += "`n"
        $newContent += "`n"
    }

    $lastLine = $line
}

# Add final trailing closing bracket for the namespace
$newContent += "`n}"

Set-Content -Path $dtsFileRollup -Encoding Ascii -Value $rollupContent
Set-Content -Path $dtsFile -Encoding Ascii -Value $newContent
