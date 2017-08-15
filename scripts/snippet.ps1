# build snippet.html from minified javascript snippet
Param(
    [ValidateNotNullOrEmpty()]
    [parameter(Mandatory=$false, HelpMessage="The relative output path/format.")]
    [string]$outputPath="snippet.html",

    [ValidateNotNullOrEmpty()]
    [parameter(Mandatory=$false, HelpMessage="The tab replacement.")]
    [string]$tab="    ",

    [ValidateNotNullOrEmpty()]
    [parameter(Mandatory=$false, HelpMessage="The uri for integration environment backend.")]
    [string]$intEnvironment="//dc-int.services.visualstudio.com/v2/track",

    [ValidateNotNullOrEmpty()]
    [parameter(Mandatory=$false, HelpMessage="The uri for production environment CDN content.")]
    [string]$prodCDNPath="https://az416426.vo.msecnd.net/scripts/a/ai.0.js",

    [ValidateNotNullOrEmpty()]
    [parameter(Mandatory=$false, HelpMessage="The uri for integration environment CDN content.")]
    [string]$intCDNPath="//az416426.vo.msecnd.net/scripts/a/ai.0.js",

    [ValidateNotNullOrEmpty()]
    [parameter(Mandatory=$false, HelpMessage="The number of extra tabs (per bug: 1591487).")]
    [int]$extraTabs=1
)

 <# 
 .Synopsis 
     Gets an absolute output path for a given flavor
 .Outputs 
     An absolute path
 #>
function Get-OutputPath($flavor) {
    $path = $outputPath -replace "\.", "$($flavor)."
    return ".\snippet\$($path)"
}

 <# 
 .Synopsis 
     Get pretty-printed minified snippet text
 .Description 
     Reads minified snippet output, uses regexs to enhance readability and returns a string which is functionally equivalent to the input
 .Outputs 
     An HTML script tag containing the snippet
 #>
function Read-MinifiedSnippet()
{
    # find the file path with preference for release build
    $snippetPath = ".\bundle\snippet\snippet.min.js"

    # read the minified snippet
    $snippet = gc $snippetPath

    # common regex http://www.regexr.com/
    $formatterMatch = '(.*?{)(.*?)(}\({)(.*?)(}\);)(.*?;)(.*)'
    $formatterReplace = '\t$1\r\n\t$2\r\n$3\r\n\t$4\r\n$5\r\n\r\n$6\r\n$7;'
    $snippet = $snippet -replace $formatterMatch,$formatterReplace

    # accomodate weird powershel regex escape behavior
    # note: this will not work directly with the replace pattern above, only strings with double quotes can use `r`n
    $snippet = $snippet -replace "\\r\\n","`r`n\t"
    $snippet = $snippet -replace "\\t",$tab

    # change the minified config param to ai for readability
    $readabilityMatch = '(\bn\b)'
    $readabilityReplace = 'config'
    $snippet = $snippet -replace $readabilityMatch,$readabilityReplace

    # set CDN path
    $snippet = $snippet -replace 'CDN_PATH',$prodCDNPath

    # add script tag
    $snippet = "<script type=""text/javascript"">`r`n" + $snippet + "`r`n</script>"
    return $snippet
}

 <# 
 .Synopsis 
     Redirect a given snippet to the integration environment backend
 .Outputs 
     An HTML script tag containing the snippet redirected to the integration environment
 #>
function Get-IntVersion($snippetText) {
    $iKeyMatch = '(.*?)(instrumentationKey:)(".*")'
    $iKeyReplace = '$1$2$3,\r\n$1endpointUrl:"ENDPOINT_PATH",\r\n$1url:"CDN_PATH"'
    $snippetText = $snippetText -replace $iKeyMatch,$iKeyReplace
    $snippetText = $snippetText -replace "\\r\\n","`r`n"
    $snippetText = $snippetText -replace 'CDN_PATH',$intCDNPath
    $snippetText = $snippetText -replace 'ENDPOINT_PATH',$intEnvironment
    return $snippetText
}

 <# 
 .Synopsis 
     Redirect a given snippet to the integration environment backend
 .Outputs 
     An HTML script tag containing the snippet redirected to the integration environment
 #>
function Get-VSIXVersion($snippetText) {
    # build padding string
    $padding = ""
    $tabCount = $extraTabs
    while($extraTabs -gt 0) {
        $padding += $tab
        $extraTabs--
    }

    # add required padding for vsix
    $replace = $padding + '$1'
    $snippetText = $snippetText -replace '(.+\r\n)',$replace
    $snippetText = $snippetText -replace '(</script>)',$replace

    # add extra encoding for vsix (vsix calls string.format so '{' and '} must be doubled)
    $snippetText = $snippetText  -replace '{','{{' -replace '}','}}'

    # add {0} target for vsix
    $snippetText = $snippetText  -replace 'INSTRUMENTATION_KEY','{0}'
    return $snippetText
}

# 1) write snippet for prod getInstrumentation API
$snippet = Read-MinifiedSnippet
$outputFile = Get-OutputPath -flavor ""
$snippet | out-file $outputFile

# 2) write snippet for prod VSIX/nuget
$snippet_vsix = Get-VSIXVersion -snippetText $snippet
$outputFile_vsix = Get-OutputPath -flavor "_vsix"
$snippet_vsix | out-file $outputFile_vsix

# 3) write snippet for int getInstrumentation API
$snippet_int = Get-IntVersion -snippetText $snippet
$outputFile_int = Get-OutputPath -flavor "_int"
$snippet_int | out-file $outputFile_int

# 4) write snippet for int VSIX/nuget
$snippet_vsixint = Get-IntVersion -snippetText $snippet_vsix
$outputFile_vsixint = Get-OutputPath -flavor "_vsixint"
$snippet_vsixint | out-file $outputFile_vsixint
