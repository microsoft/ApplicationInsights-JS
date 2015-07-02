# Copy snippet files and replace // with http:// otherwise the tests will not be able to load the file://
Param(
    [ValidateNotNullOrEmpty()]
    [parameter(Mandatory=$true, HelpMessage="The project directory.")]
    [string]$projectDir,

    [ValidateNotNullOrEmpty()]
    [parameter(Mandatory=$false, HelpMessage="The instrumentation key.")]
    [string]$iKey = "89330895-7c53-4315-a242-85d136ad9c16", 

    [ValidateNotNullOrEmpty()]
    [parameter(Mandatory=$false, HelpMessage="The endpoinoint URL. (dev: datacollection-devred.cloudapp.net, int: dc-int.services.visualstudio.com, prod: dc.services.visualstudio.com")]
    [string]$endpointUrl = "http://dc.services.visualstudio.com/v2/track",

    [ValidateNotNullOrEmpty()]
    [parameter(Mandatory=$false, HelpMessage="CDN URL -- NOTE this is only used to as a replacement index")]
    [string]$cdnUrl = "//az416426.vo.msecnd.net/scripts/a/ai.0.js"
)

# copy ai full
$path = "$($projectDir)\..\JavaScriptSDK\min\ai.js"
if(-not (test-path $path)) {
    $path = "$($projectDir)\..\JavaScriptSDK\min\ai_tests.js"
}

$content = gc $path
$content | out-file "$($projectDir)\E2ETests\ai.js"

# build ai path in file:// format
$aiPath = "file:///" + ($projectDir -replace "\\", "/") + "/E2ETests/ai.js"

# test the queue
$queueTest = "var i = 100; while(i--){appInsights.queue.push(function() {window.queueTest('from the queue')})};"

# copy snippet and convert protocol to file://
$edgePrefix = gc "$($projectDir)\..\JavaScriptSDK\snippet.js"
$edgePrefix = $edgePrefix -replace $cdnUrl, $aiPath
$edgePrefix = $edgePrefix -replace "instrumentationKey: ""INSTRUMENTATION_KEY""", "instrumentationKey: ""$($iKey)"", endpointUrl: ""$($endpointUrl)"", maxBatchInterval: 1"
$edgePrefix = $edgePrefix -replace 'CDN_PATH',$aiPath
$edgePrefix += $queueTest
$edgePrefix | out-file "$($projectDir)\E2ETests\sprint70Snippet.js"

# copy snippet and convert protocol to file://
$sprint69Snippet = gc "$($projectDir)\E2ETests\standalone\legacySnippetSprint69.js"
$sprint69Snippet = $sprint69Snippet -replace $cdnUrl, $aiPath
$sprint69Snippet = $sprint69Snippet -replace "iKey: ""INSTRUMENTATION_KEY""", "iKey: ""$($iKey)"", endpointUrl: ""$($endpointUrl)"", maxBatchInterval: 1"
$sprint69Snippet = $sprint69Snippet -replace 'CDN_PATH',$aiPath
$sprint69Snippet += $queueTest
$sprint69Snippet | out-file "$($projectDir)\E2ETests\sprint69Snippet.js"

# copy legacy snippet and convert protocol to file://
$sprint66Snippet = gc "$($projectDir)\E2ETests\standalone\legacySnippet.js"
$sprint66Snippet = $sprint66Snippet -replace $cdnUrl, $aiPath
$sprint66Snippet = $sprint66Snippet -replace "appInsights.start\(\);", "appInsights.start(""$($iKey)"");"
$sprint66Snippet += "appInsights.endpointUrl = ""$($endpointUrl)""; appInsights.maxBatchInterval = 1"
$sprint66Snippet += $queueTest
$sprint66Snippet | out-file "$($projectDir)\E2ETests\sprint66Snippet.js"

$testSnippet = gc "$($projectDir)\E2ETests\standalone\testSnippet.js"
$testSnippet = $testSnippet -replace "ENDPOINT_URL", $endpointUrl
$testSnippet = $testSnippet -replace "INSTRUMENTATION_KEY", $iKey
$testSnippet = $testSnippet -replace "CDN_URL",$aiPath
$testSnippet += $queueTest
$testSnippet | out-file "$($projectDir)\E2ETests\testSnippet.js"

# add snippet to error test files
$instrumentation = gc "$($projectDir)\E2ETests\autoCollectionTemplates\instrumentation.js"
$files = @("errorDom.html", "errorScriptGlobal.html", "errorScriptNested.html", "errorScriptSyntax.html")
foreach ($file in $files) {
    $content = gc "$($projectDir)\E2ETests\autoCollectionTemplates\$($file)"

    $strSnippet = ""
    foreach ($line in $edgePrefix) {
        $strSnippet += $line + "`r`n        "
    }

    $strInstrumentation = ""
    foreach ($line in $instrumentation) {
        $strInstrumentation += $line + "`r`n        "
    }

    $content = $content -replace 'PREFIX_PLACEHOLDER', $strSnippet 
	$content = $content -replace 'INSTRUMENTATION_PLACEHOLDER', $strInstrumentation 
    $content | out-file "$($projectDir)\E2ETests\$($file)"
}

# add snippet to performance test file
$content = gc "$($projectDir)\Selenium\testPageNoAppInsights.html"
$strSnippet = ""
foreach ($line in $edgePrefix) {
    $strSnippet += $line + "`r`n        "
}

$content = $content -replace '//PREFIX_PLACEHOLDER', $strSnippet
$content | out-file "$($projectDir)\Selenium\testPageWithAppInsights.html"
