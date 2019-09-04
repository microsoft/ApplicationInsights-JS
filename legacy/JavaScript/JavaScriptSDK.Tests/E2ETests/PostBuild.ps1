# Copy snippet files and replace // with http:// otherwise the tests will not be able to load the file://
Param(
    [ValidateNotNullOrEmpty()]
    [parameter(Mandatory=$true, HelpMessage="The project directory.")]
    [string]$projectDir,

	[ValidateNotNullOrEmpty()]
    [parameter(Mandatory=$true, HelpMessage="The project build output directory.")]
    [string]$outputDir,

    [ValidateNotNullOrEmpty()]
    [parameter(Mandatory=$false, HelpMessage="The instrumentation key.")]
    [string]$iKey = "3e6a441c-b52b-4f39-8944-f81dd6c2dc46", 

    [ValidateNotNullOrEmpty()]
    [parameter(Mandatory=$false, HelpMessage="The endpoinoint URL. (dev: datacollection-devred.cloudapp.net, int: dc-int.services.visualstudio.com, prod: dc.services.visualstudio.com")]
    [string]$endpointUrl = "https://dc.services.visualstudio.com/v2/track",

    [ValidateNotNullOrEmpty()]
    [parameter(Mandatory=$false, HelpMessage="CDN URL -- NOTE this is only used to as a replacement index")]
    [string]$cdnUrl = "https://az416426.vo.msecnd.net/scripts/a/ai.0.js"
)

# copy ai full
$path = "$($projectDir)\..\JavaScriptSDK\min\ai.js"
if(-not (test-path $path)) {
    $path = "$($projectDir)\..\JavaScriptSDK\min\ai_tests.js"
}

$content = gc $path
$content | out-file "$($projectDir)\E2ETests\ai.js"

# build ai path in file:// format
# $aiPath = "file:///" + ($projectDir -replace "\\", "/") + "ai.js"
$aiPath = "ai.js"

# test the queue
$queueTest = "var i = 100; while(i--){appInsights.queue && appInsights.queue.push(function() {window.queueTest('from the queue')})};"

# copy snippet and convert protocol to file://
$snippetLatest = gc "$($projectDir)\..\JavaScriptSDK\snippet.js"
$snippetLatest = $snippetLatest -replace $cdnUrl, $aiPath
$snippetLatest = $snippetLatest -replace "instrumentationKey: ""INSTRUMENTATION_KEY""", "instrumentationKey: ""$($iKey)"", endpointUrl: ""$($endpointUrl)"", maxBatchInterval: 1"
$snippetLatest = $snippetLatest -replace 'CDN_PATH',$aiPath
$snippetLatest += $queueTest
$snippetLatest | out-file "$($projectDir)\E2ETests\snippetLatest.js"

# copy snippet and convert protocol to file://
$snippet10 = gc "$($projectDir)\E2ETests\standalone\snippet_1.0.js"
$snippet10 = $snippet10 -replace $cdnUrl, $aiPath
$snippet10 = $snippet10 -replace "instrumentationKey: ""INSTRUMENTATION_KEY""", "instrumentationKey: ""$($iKey)"", endpointUrl: ""$($endpointUrl)"", maxBatchInterval: 1"
$snippet10 = $snippet10 -replace 'CDN_PATH',$aiPath
$snippet10 += $queueTest
$snippet10 | out-file "$($projectDir)\E2ETests\snippet_1.0.js"

# copy snippet and convert protocol to file://
$snippet01 = gc "$($projectDir)\E2ETests\standalone\snippet_0.1.js"
$snippet01 = $snippet01 -replace $cdnUrl, $aiPath
$snippet01 = $snippet01 -replace "iKey: ""INSTRUMENTATION_KEY""", "iKey: ""$($iKey)"", endpointUrl: ""$($endpointUrl)"", maxBatchInterval: 1"
$snippet01 = $snippet01 -replace 'CDN_PATH',$aiPath
$snippet01 += $queueTest
$snippet01 | out-file "$($projectDir)\E2ETests\snippet_0.1.js"

$testSnippet = gc "$($projectDir)\E2ETests\standalone\testSnippet.js"
$testSnippet = $testSnippet -replace "ENDPOINT_URL", $endpointUrl
$testSnippet = $testSnippet -replace "INSTRUMENTATION_KEY", $iKey
$testSnippet = $testSnippet -replace "CDN_URL",$aiPath
$testSnippet += $queueTest
$testSnippet | out-file "$($projectDir)\E2ETests\testSnippet.js"

# add snippet to performance test file
$content = gc "$($projectDir)\Selenium\testPageNoAppInsights.html"
$strSnippet = ""
foreach ($line in $edgePrefix) {
    $strSnippet += $line + "`r`n        "
}

$content = $content -replace '//PREFIX_PLACEHOLDER', $strSnippet
$content | out-file "$($projectDir)\Selenium\testPageWithAppInsights.html"

# copy E2E files
Copy-Item "$($projectDir)\E2ETests\*.js" "$($outputDir)\E2ETests\"
Copy-Item "$($projectDir)\E2ETests\*.htm" "$($outputDir)\E2ETests\"
Copy-Item "$($projectDir)\E2ETests\*.html" "$($outputDir)\E2ETests\"