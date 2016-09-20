# This script starts IIS Express and opens the Tests.html in a browser to host QUnit test runner
# - Run this script: > powershell "& .\scripts\RunTestsInBrowser.ps1"
# - Build the solution after changing TypeScript source files to regenerate JavaScript 
# - Refresh Tests.html in the browser to run the JavaScript tests 

$iisExpress = Join-Path ${Env:ProgramFiles(x86)} "IIS Express\iisexpress.exe"
$testsPath = Join-Path (Get-Location) ""
$port = (Get-NetTCPConnection | Where-Object {$_.LocalAddress -eq "127.0.0.1" -or $_.LocalAddress -eq "::" } | Measure-Object -property LocalPort -max).Maximum + 1
Start-Process "$iisExpress" -Args ("/path:$testsPath", "/port:$port")
Start-Process "http://localhost:$port/JavaScript/JavaScriptSDK.Tests/Selenium/Tests.html"