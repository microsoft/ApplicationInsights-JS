# Microsoft Application Insights JavaScript SDK

[Application Insights](https://azure.microsoft.com/services/application-insights/) tells you about your app's performance and usage. By adding a few lines of code to your web pages, you get data about how many users you have, which pages are most popular, how fast pages load, whether they throw exceptions, and more. And you can add code to track more detailed user activity.

## Try Application Insights with JavaScript SDK - no Azure subscription required
If you don't have an Azure subscription and would like to try Application Insights on one of your own web pages, visit [Try Application Insights Now](http://aka.ms/ainow). 

## Get started

To use this SDK, you'll need a subscription to [Microsoft Azure](https://azure.com). (There's a free package.)

In the [Azure Preview Portal](https://portal.azure.com), open an Application Insights resource. 

Get "code to monitor my web pages" from the Quick Start page, and insert it in the head of your web pages. 

Use your web pages, and then look for user and page view results in the Application Insights resource. 

[Learn more.](https://azure.microsoft.com/documentation/articles/app-insights-javascript/)


## API reference

Data on users, page views, and exceptions are provided out of the box. You can write your own code to track specific events and metrics.

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
