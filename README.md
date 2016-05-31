# Microsoft Application Insights JavaScript SDK

[Application Insights](https://azure.microsoft.com/services/application-insights/) tells you about your app's performance and usage. By adding a few lines of code to your web pages, you get data about how many users you have, which pages are most popular, how fast pages load, whether they throw exceptions, and more. And you can add code to track more detailed user activity.

## Try Application Insights with JavaScript SDK - no Azure subscription required
If you don't have an Azure subscription and would like to try Application Insights on one of your own web pages, visit [Try Application Insights Now](http://aka.ms/ainow). 

## Get started

To use this SDK, you'll need a subscription to [Microsoft Azure](https://azure.com). Application Insights has a free subscription option.
In the [Azure Preview Portal](https://portal.azure.com), create new or open an existing Application Insights resource.

## Initializing Application Insights JS SDK script   
There are several ways to initialize Aplication Insights.     

|                                    | **Dynamic loading.** JS script tag is inserted in the head of the page. This is the recommended approach as our CDN is getting frequent updates.                                                                                                           | **Static loading.** You are responsible for including JS script tag or bundling the script with your other scripts. |
|------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| **Using initialization `snippet`** | [Dynamic loading with snippet](README.md#use-js-snippet-and-initialize-dynamically-download-full-application-insights-script-from-cdn) This is default approach used in a new ASP.NET application created in Visual Studio. Use this for MVC applications. | [Host AI JS SDK and initialize statically](README.md#include-ai-js-sdk-script-and-initialize-statically). Cordova applications where you would like to embed scripts into your application for faster loading is an example of when you would use this approach.                                                                                                             |
| **Using module import**            | [Dynamic loading using module import](README.md#import-as-a-module-and-initialize-dynamically-download-full-application-insights-script-from-cdn). This is the recommended approach for modern modular applications.                                       | **TBD** see #213                                                                                                                 |

### Use JS `snippet` and initialize dynamically (download full Application Insights script from CDN)  
Use this method for an MVC application. Get "code to monitor my web pages" from the Quick Start page, 
and insert it in the head of your web pages. Application Insights script will be downloaded 
from CDN or you can override the script hosting location by specifying `url` parameter in the config.   
```
<script type="text/javascript">
    var appInsights = window.appInsights || function (config) {
        function s(config) { t[config] = function () { var i = arguments; t.queue.push(function () { t[config].apply(t, i) }) } } var t = { config: config }, r = document, f = window, e = "script", o = r.createElement(e), i, u; for (o.src = config.url || "//az416426.vo.msecnd.net/scripts/a/ai.0.js", r.getElementsByTagName(e)[0].parentNode.appendChild(o), t.cookie = r.cookie, t.queue = [], i = ["Event", "Exception", "Metric", "PageView", "Trace"]; i.length;) s("track" + i.pop()); return config.disableExceptionTracking || (i = "onerror", s("_" + i), u = f[i], f[i] = function (config, r, f, e, o) { var s = u && u(config, r, f, e, o); return s !== !0 && t["_" + i](config, r, f, e, o), s }), t
    }({
        instrumentationKey: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx"
    });

    window.appInsights = appInsights;
    appInsights.trackPageView();
</script>
```    
[Learn more.](https://azure.microsoft.com/documentation/articles/app-insights-javascript/)

### Import as a module and initialize dynamically (download full Application Insights script from CDN)  
Use this method for a modern JS application that is using modules. Just like in `snippet` scenario the full script will be downloaded from CDN.
* Obtain instrumentation key from your Application Insights resource  
* Install applicationinsights-js with npm  
`npm install applicationinsights-js` 

* Import and call `downloadAndSetup` to initialize it. You can override the script hosting location by specifying `url` parameter in the config 
```
/* import AppInsights */
import {AppInsights} from "applicationinsights-js"

/* Call downloadAndSetup to download full ApplicationInsights script from CDN and initialize it with instrumentation key */
AppInsights.downloadAndSetup({ instrumentationKey: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx" });

/* example: track page view */
AppInsights.trackPageView(
    "FirstPage", /* (optional) page name */
    null, /* (optional) page url if available */
    { prop1: "prop1", prop2: "prop2" }, /* (optional) dimension dictionary */
    { measurement1: 1 }, /* (optional) metric dictionary */
    123 /* page view duration in milliseconds */
);

/* example: track event */
AppInsights.trackEvent("TestEvent", { prop1: "prop1", prop2: "prop2" }, { measurement1: 1 });
```
### Include AI JS SDK script and initialize statically
Use this approach if you would like to host AI JS SDK script on your endpoint or bundle it with other scripts. One popular example is Cordova applications (see [this blog post](http://www.teamfoundation.co.za/2016/02/application-insights-and-typescript/). After JS script has loaded, include the following snippet to initialize Application Insights:   
```
<!-- the snippet below assumes that JS SDK script has already loaded -->
<script type="text/javascript" src="/pathToAIJSSDK.js"></script>   
<script type="text/javascript">   
    var snippet: any = {   
        config: {   
            instrumentationKey: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx"   
        }   
    };   
    var init = new Microsoft.ApplicationInsights.Initialization(snippet);   
    var appInsights = init.loadAppInsights();   
    appInsights.trackPageView();   
</script>   
```  
## API reference

Data on users, page views, and exceptions are provided out of the box. You can write your own code to track specific events and metrics.

See:

* [JavaScript API reference](https://github.com/Microsoft/ApplicationInsights-JS/blob/master/API-reference.md)
* [API overview with portal examples](https://azure.microsoft.com/documentation/articles/app-insights-api-custom-events-metrics/)

## To build:

* Visual Studio 2013 Ultimate with Update 4 or later
* Clone the Git repository 
* Open Visual Studio solution (devenv JavaScript\Microsoft.ApplicationInsights.JavaScript.sln)
* Build solution in Visual Studio

## To run check-in tests
* `powershell "& .\RunTestsInBrowser.ps1"` to run `Tests.html` in a browser (you might need to call Set-ExecutionPolicy to be able to execute the script)
* Don't forget to build the solution after changing TypeScript files
* Refresh Tests.html in the browser to re-run tests

## Check out the Wiki for other useful info

https://github.com/Microsoft/ApplicationInsights-JS/wiki

## Contributing

We strongly welcome and encourage contributions to this project. Please read the [contributor's guide][ContribGuide] located in the ApplicationInsights-Home repository. If making a large change we request that you open an [issue][GitHubIssue] first. We follow the [Git Flow][GitFlow] approach to branching. 

[ContribGuide]: https://github.com/Microsoft/ApplicationInsights-Home/blob/master/CONTRIBUTING.md
[GitFlow]: http://nvie.com/posts/a-successful-git-branching-model/
[GitHubIssue]: https://github.com/Microsoft/ApplicationInsights-JS/issues
