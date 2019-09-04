# get js sdk directory
$jsSdkDir = Split-Path (Split-Path $MyInvocation.MyCommand.Path) -Parent; 
Write-Host "Releasing from $jsSdkDir";

$packageJsonPath =  Join-Path $jsSdkDir -ChildPath "package.json"
if (-Not (Test-Path $packageJsonPath)) {
    Write-Warning "'$packageJsonPath' file not found, please enter the top JSSDK directory.";
    exit;
}

$packagesJson = (Get-Content $packageJsonPath -Raw) | ConvertFrom-Json
$oldVersion = $packagesJson.version;

Write-Host "Current JSSDK version is '$oldVersion'"
$version = Read-Host "Please enter a new version number";

if (-Not ($version -match "\d+\.\d+\.\d+")) {
    Write-Warning "Invalid version number. Expecting three numbers: Major, Minor and Path (e.g. 1.2.3)"
    exit;
}

# update package.json 
$packagesJson.version = $version
$packagesJson = $packagesJson | ConvertTo-Json 
$packagesJson = $packagesJson -replace "\\u0026", "&"
[System.IO.File]::WriteAllLines($packageJsonPath, $packagesJson)

# update bower.json
$bowerJsonPath = Join-Path $jsSdkDir -ChildPath "bower.json"
$bowerJson = (Get-Content $bowerJsonPath -Raw) | ConvertFrom-Json
$bowerJson.version = $version
$bowerJson = $bowerJson | ConvertTo-Json 
$bowerJson = $bowerJson -replace "\\u003c", "<"
$bowerJson = $bowerJson -replace "\\u003e", ">"
[System.IO.File]::WriteAllLines($bowerJsonPath, $bowerJson)

# update JavaScript\JavaScriptSDK\AppInsights.ts
$appInsightsTsPath = Join-Path $jsSdkDir -ChildPath "JavaScript\JavaScriptSDK\AppInsights.ts"
$appInsightsTs = Get-Content $appInsightsTsPath

if (-Not ($appInsightsTs -match "export var Version = `"\d+\.\d+\.\d+`"")) {
    Write-Warning "Cannot find 'Version' variable in the AppInsights.ts file. Please update the version manualy."
    # continue on error
} else {
    $appInsightsTs = $appInsightsTs -replace "export var Version = `"\d+\.\d+\.\d+`"", "export var Version = `"$version`""
    [System.IO.File]::WriteAllLines($appInsightsTsPath, $appInsightsTs)
}

# update global.props    
$versionSplit = $version.Split('.');

$globalPropsPath = Join-Path $jsSdkDir -ChildPath "Global.props"
$globalPropsXml = [xml](Get-Content $globalPropsPath)

$ns = New-Object System.Xml.XmlNamespaceManager($globalPropsXml.NameTable)
$ns.AddNamespace("ns", $globalPropsXml.DocumentElement.NamespaceURI)

$globalPropsXml.SelectSingleNode("//ns:SemanticVersionMajor", $ns).InnerText = $versionSplit[0]
$globalPropsXml.SelectSingleNode("//ns:SemanticVersionMinor", $ns).InnerText = $versionSplit[1]
$globalPropsXml.SelectSingleNode("//ns:SemanticVersionPatch", $ns).InnerText = $versionSplit[2]

$versionDate = Get-date -format yyy-MM-dd
$globalPropsXml.SelectSingleNode("//ns:SemanticVersionDate", $ns).InnerText = $versionDate

$globalPropsXml.Save($globalPropsPath);

git checkout -b "release_$version"
git add package.json
git add bower.json
git add Global.props
git add JavaScript/JavaScriptSDK/AppInsights.ts

git commit -m "version update $oldVersion -> $version"

Write-Host ""
Write-Host "Git commit ready. Please push and create a pull request on GitHub"