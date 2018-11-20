<properties 
	pageTitle="Application Insights SDK JavaScript API" 
	description="Reference doc" 
	services="application-insights" 
    documentationCenter=".net"
	authors="alancameronwills" 
	manager="douge"/>

<tags 
	ms.service="application-insights" 
	ms.workload="tbd" 
	ms.tgt_pltfrm="ibiza" 
	ms.devlang="na" 
	ms.topic="article" 
	ms.date="08/24/2015" 
	ms.author="awills"/>
 

# Application Insights JavaScript SDK - Web

[![Build Status](https://dev.azure.com/mseng/AppInsights/_apis/build/status/1DS%20JavaScript%20SDK%20-%20SKU%20+%20Common%20+%20Extensions)](https://dev.azure.com/mseng/AppInsights/_build/latest?definitionId=7610)
[![Build Status](https://travis-ci.org/Microsoft/ApplicationInsights-JS.svg?branch=master)](https://travis-ci.org/Microsoft/ApplicationInsights-JS)
[![npm version](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-web.svg)](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-web)


## Getting Started
1. Create an Application Insights resource in Azure by following [these instructions](https://docs.microsoft.com/en-us/azure/application-insights/app-insights-javascript?toc=/azure/azure-monitor/toc.json).
2. Grab the _Instrumentation Key_ (aka "ikey") from the resource you created in
   step 1. Later, you'll add it .
3. Add Application Insights to your app via NPM or by [pasting a script snippet at the beginning of every `<head>` tag of each of your pages.](#snippet-setup-(ignore-if-using-npm)) 
    ```sh
    npm i --save @microsoft/applicationinsights-web
    ```
    > *Note:* **Typings are included with this package**, so you do not not need to install a separate typings package.

## Basic Usage

### Setup (NPM only)
```js
import { ApplicationInsights } from '@microsoft/applicationinsights-web'
```

```js
const appInsights = new ApplicationInsights({ config: {
  instrumentationKey: 'YOUR_INSTRUMENTATION_KEY_GOES_HERE',
  /* ...Other Configuration Options... */
}});
appInsights.loadAppInsights();
```

### Snippet Setup (Ignore if using NPM)
If your app does not use NPM, you can directly instrument your webpages with Application Insights by pasting this snippet at the top of each your pages. Preferably, it should be the first script in your `<head>` section so that it can monitor any potential issues with all of your dependencies.
```html
<script type="text/javascript">
var sdkInstance="appInsightsSDK";window[sdkInstance]="appInsights";var aiName=window[sdkInstance],aisdk=window[aiName]||function(e){function n(e){i[e]=function(){var n=arguments;i.queue.push(function(){i[e].apply(i,n)})}}var i={config:e};i.initialize=!0;var t=document,a=window;setTimeout(function(){var n=t.createElement("script");n.src=e.url||"https://az416426.vo.msecnd.net/beta/ai.1.min.js",t.getElementsByTagName("script")[0].parentNode.appendChild(n)});try{i.cookie=t.cookie}catch(e){}i.queue=[];for(var s=["PageView","Exception","Trace","DependencyData","Metric"];s.length;)n("track"+s.pop());if(n("startTrackPage"),n("stopTrackPage"),e.extensionConfig&&e.extensionConfig.ApplicationInsightsAnalytics&&!1===e.extensionConfig.ApplicationInsightsAnalytics.disableExceptionTracking){n("_"+(s="onerror"));var o=a[s];a[s]=function(e,n,t,a,r){var c=o&&o(e,n,t,a,r);return!0!==c&&i["_"+s]({message:e,url:n,lineNumber:t,columnNumber:a,error:r}),c},e.extensionConfig.ApplicationInsightsAnalytics.autoExceptionInstrumented=!0}return i}
(
    {instrumentationKey:"INSTRUMENTATION_KEY"}
);
if(window[aiName]=aisdk,aisdk.queue&&0===aisdk.queue.length){var pageViewItem={name:document.title?document.title:"",uri:document.URL?document.URL:""};aisdk.trackPageView(pageViewItem)}
</script>
```

### Sending Telemetry to the Azure Portal
If initialized using the snippet, your Application Insights instance is located by default at `window.appInsights`
```js
appInsights.trackEvent({name: 'some event'});
appInsights.trackPageView({name: 'some page'});
appInsights.trackPageViewPerformance({name : 'some page', url: 'some url'});
appInsights.trackException({error: new Error('some error')}, customProperties);
appInsights.trackTrace({message: 'some trace'});
appInsights.trackMetric({name: 'some metric', average: 42});
appInsights.trackDependencyData({absoluteUrl: 'some url', resultCode: 200, method: 'GET', id: 'some id'});
```

### Setting Up Autocollection
All autocollection is on by default. By using the full version of the JavaScript Application Insights SDK, we collect for you
- Uncaught exceptions in your app, including information on
	- Stack trace
	- Exception details and message accompanying the error
	- Line & column number of error
	- URL where error was raised
- Network Dependency Requests made by your app XHR and Fetch (disabled by default) requests, include information on
	- Url of dependency source
	- Command & Method used to request the dependency
	- Duration of the request
	- Result code and success status of the request
	- ID (if any) of user making the request
	- Correlation context (if any) where request is made

### Telemetry Initializers
TODO

## Configuration
Most configuration fields are named such that they can be defaulted to falsey.

| Name | Default | Description |
|------|---------|-------------|
| accountId | null | An optional account id, if your app groups users int oaccounts. No spaces, commas, semicolons, equals, or vertical bars |
| sessionRenewalMs | 30000 | A session is logged if the user is inactive for this amount of time in milliseconds. Default is 30 minutes |
| sessionExpirationMs | 86400000 | A session is logged if it has continued for this amount of time in milliseconds. Default is 24 hours |
| maxBatchSizeInBytes | 10000 | Max size of telemetry batch. If a batch exceeds this limit, it is immediately sent and a new batch is started |
| maxBatchInterval | 15000 | How long to batch telemetry for before sending (milliseconds) |
| enableDebug | false | If true, internal debugging data is thrown as an exception by the logger. Default is false. |
| disableExceptionTracking | false | If true, exceptions are no autocollected. Default is false. |
| disableTelemetry | false | If true, telemetry is not collected or sent. Default is false. |
| consoleLoggingLevel | 0 | (internal) Logs internal Application Insights errors to console. 0: off, 1: Critical errors only, 2: Everything (errors & warnings) |
| telemetryLoggingLevel | 1 | (internal) Sends internal Application Insights errors as telemetry. 0: off, 1: Critical errors only, 2: Everything (errors & warnings) |
| diagnosticLogInterval | false | (internal) Polling interval (in ms) for internal logging queue |
| samplingPercentage | 100 | Percentage of events that will be sent. Default is 100, meaning all events are sent. Set this if you wish to preserve your datacap for large-scale applications. |
| autoTrackPageVisitTime | false | |
| disableAjaxTracking | false | If true, Ajax calls are not autocollected. Default is false. |
| disableFetchTracking | true | If true, Fetch requests are not autocollected. Default is true |
| overridePageViewDuration | false | If true, default behavior of trackPageView is changed to record end of page view duration interval when trackPageView is called. If false and no custom duration is provided to trackPageView, the page view performance is calculated using the navigation timing API. Default is false. |
| maxAjaxCallsPerView | 500 | Default 500 - controls how many ajax calls will be monitored per page view. Set to -1 to monitor all (unlimited) ajax calls on the page. |
| disableDataLossAnalysis | true | If false, internal telemetry sender buffers will be checked at startup for items not yet sent. |
| disableCorrelationHeaders | false | If false, the SDK will add two headers ('Request-Id' and 'Request-Context') to all dependency requests to correlate them with corresponding requests on the server side. Default is false. |
| correlationHeaderExcludedDomains |  | Disable correlation headers for specific domains |
| disableFlushOnBeforeUnload | false | Default false. If true, flush method will not be called when onBeforeUnload event triggers |
| enableSessionStorageBuffer | true | Default true. If true, the buffer with all unsent telemetry is stored in session storage. The buffer is restored on page load |
| isCookieUseDisabled | false | Default false. If true, the SDK will not store or read any data from cookies.|
| cookieDomain | null | Custom cookie domain. This is helpful if you want to share Application Insights cookies across subdomains. |
| isRetryDisabled | false | Default false. If false, retry on 206 (partial success), 408 (timeout), 429 (too many requests), 500 (internal server error), 503 (service unavailable), and 0 (offline, only if detected) |
| isStorageUseDisabled | false | If true, the SDK will not store or read any data from local and session storage. Default is false. |
| isBeaconApiDisabled | true | If false, the SDK will send all telemetry using the [Beacon API](https://www.w3.org/TR/beacon) |
| sdkExtension | null | Sets the sdk extension name. Only alphabetic characters are allowed. The extension name is added as a prefix to the 'ai.internal.sdkVersion' tag (e.g. 'ext_javascript:2.0.0'). Default is null. |
| isBrowserLinkTrackingEnabled | false | Default is false. If true, the SDK will track all [Browser Link](https://docs.microsoft.com/en-us/aspnet/core/client-side/using-browserlink) requests. |
| appId | null | AppId is used for the correlation between AJAX dependencies happening on the client-side with the server-side requets. When Beacon API is enabled, it cannot be used automatically, but can be set manually in the configuration. Default is null |
| enableCorsCorrelation | false | If true, the SDK will add two headers ('Request-Id' and 'Request-Context') to all CORS requests tocorrelate outgoing AJAX dependencies with corresponding requests on the server side. Default is false |

## Examples

For runnable examples, see our [Application Insights Demos Page](../Examples/)

## Application Insights Web Basic

For a lightweight experience, you can instead install the basic version of Application Insights
```
npm i --save @microsoft/applicationinsights-web-basic
```
This version comes with the bare minimum amount of features and functionalities and relies on you to build it up as you see fit. For example, it performs no auto-collection (uncaught exceptions, ajax, etc). The APIs to send certain telemetry types, like `trackTrace`, `trackEvent`, etc, are not included in this version, so you will need to provide your own wrapper.

## Contributing

We strongly welcome and encourage contributions to this project. Please read the [contributor's guide][ContribGuide] located in the ApplicationInsights-Home repository. If making a large change we request that you open an [issue][GitHubIssue] first. We follow the [Git Flow][GitFlow] approach to branching. 

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

[ContribGuide]: https://github.com/Microsoft/ApplicationInsights-Home/blob/master/CONTRIBUTING.md
[GitFlow]: http://nvie.com/posts/a-successful-git-branching-model/
[GitHubIssue]: https://github.com/Microsoft/ApplicationInsights-JS/issues

## Build & Test

1. Install all dependencies
	```
	npm install
	```
2. Build and test
	```
	npm run build
	npm run test
	```
