# Microsoft Application Insights JavaScript SDK
## Try Application Insights with JavaScript SDK - no Azure subscription required
If you don't have an Azure subscription and would like to try Application Insights with JavaScript SDK, visit this website to get a preview of Application Insights: http://aka.ms/ainow. 

## API reference
* Check out https://github.com/Microsoft/ApplicationInsights-JS/blob/master/API-reference.md

## To build:

* Visual Studio 2013 Ultimate with Update 4
* Clone the Git repository 
* Open Visual Studio solution (devenv JavaScript\Microsoft.ApplicationInsights.JavaScript.sln)
* Build solution in Visual Studio

## To run check-in tests
* `powershell "& .\RunTestsInBrowser.ps1"` to run `Tests.html` in a browser (you might need to call Set-ExecutionPolicy to be able to execute the script)
* Don't forget to build the solution after changing TypeScript files
* Refresh Tests.html in the browser to re-run tests

## Check out the Wiki for other useful info

https://github.com/Microsoft/ApplicationInsights-JS/wiki
