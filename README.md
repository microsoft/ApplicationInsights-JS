# Microsoft Application Insights JavaScript SDK

## API reference
* Check out https://github.com/Microsoft/ApplicationInsights-JS/blob/apiRef/API.md

## To build:

* Visual Studio 2013 Ultimate with Update 4
* Clone the Git repository 
* Open Visual Studio solution (devenv JavaScript\Microsoft.ApplicationInsights.JavaScript.sln)
* Build solution in Visual Studio

## To run check-in tests
* `powershell "& .\RunTestsInBrowser.ps1"` to run `Tests.html` in a browser
* Don't forget to build the solution after changing TypeScript files
* Refresh Tests.html in the browser to re-run tests

## Performance testing results

For this release, we added a perfResults.txt.csv file that documents the history of performance measurements of the code in the master branch to share with the community the performance of the JavaScript SDK.

When running the performance tests locally, a similar file will be produced that could be used to measure the impact your new code would have on the project.
