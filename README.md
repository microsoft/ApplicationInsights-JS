<properties
	pageTitle="Application Insights SDK JavaScript API"
	description="Reference doc"
	services="application-insights"
    documentationCenter=".net"
/>

<tags
	ms.service="application-insights"
	ms.workload="tbd"
	ms.tgt_pltfrm="ibiza"
	ms.devlang="na"
	ms.topic="article"
	ms.date="08/24/2015"/>


# Application Insights JavaScript SDK


[![Build Status](https://dev.azure.com/mseng/AppInsights/_apis/build/status/AppInsights%20-%20DevTools/1DS%20JavaScript%20SDK%20web%20SKU%20vNext?branchName=master)](https://dev.azure.com/mseng/AppInsights/_build/latest?definitionId=8184&branchName=master)
[![Build Status](https://travis-ci.org/microsoft/ApplicationInsights-JS.svg?branch=master)](https://travis-ci.org/microsoft/ApplicationInsights-JS)
[![npm version](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-web.svg)](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-web)
[![minified size size](https://img.badgesize.io/https://az416426.vo.msecnd.net/scripts/b/ai.2.min.js.svg?label=minified%20size)](https://img.badgesize.io/https://az416426.vo.msecnd.net/scripts/b/ai.2.min.js.svg?label=minified%20size)
[![gzip size](https://img.badgesize.io/https://az416426.vo.msecnd.net/scripts/b/ai.2.min.js.svg?compression=gzip&softmax=30000&max=35000)](https://img.badgesize.io/https://az416426.vo.msecnd.net/scripts/b/ai.2.min.js.svg?compression=gzip&softmax=30000&max=35000)


> ***Note:*** The documentation for `applicationinsights-js` has moved [here](./legacy_README.md). If you are looking to upgrade to the new version of the SDK, please see the [Upgrade Guide](#upgrading-from-the-old-version-of-application-insights).

## Getting Started
1. Create an Application Insights resource in Azure by following [these instructions](https://docs.microsoft.com/en-us/azure/application-insights/app-insights-javascript?toc=/azure/azure-monitor/toc.json).
2. Grab the _Instrumentation Key_ (aka "ikey") from the resource you created in
   step 1. Later, you'll add it to the `instrumentationKey` setting of the Application Insights JavaScript SDK.
3. Add Application Insights to your app. **There are 2 ways to do this.**
	- Install via NPM. Then, [set up an instance of Application Insights in your app.](#setup-npm-only-ignore-if-using-snippet)
		> *Note:* **Typings are included with this package**, so you do **not** need to install a separate typings package.
		```sh
		npm i --save @microsoft/applicationinsights-web
		```
	- [Pasting a script snippet at the beginning of every `<head>` tag for each page you want to monitor.](#snippet-setup-ignore-if-using-npm)

## Basic Usage

### NPM Setup (ignore if using Snippet Setup)
```js
import { ApplicationInsights } from '@microsoft/applicationinsights-web'

const appInsights = new ApplicationInsights({ config: {
  instrumentationKey: 'YOUR_INSTRUMENTATION_KEY_GOES_HERE'
  /* ...Other Configuration Options... */
} });
appInsights.loadAppInsights();
```

### Snippet Setup (Ignore if using NPM Setup)
If your app does not use NPM, you can directly instrument your webpages with Application Insights by pasting this snippet at the top of each your pages. Preferably, it should be the first script in your `<head>` section so that it can monitor any potential issues with all of your dependencies.
```html
<script type="text/javascript">
var sdkInstance="appInsightsSDK";window[sdkInstance]="appInsights";var aiName=window[sdkInstance],aisdk=window[aiName]||function(e){function n(e){t[e]=function(){var n=arguments;t.queue.push(function(){t[e].apply(t,n)})}}var t={config:e};t.initialize=!0;var i=document,a=window;setTimeout(function(){var n=i.createElement("script");n.src=e.url||"https://az416426.vo.msecnd.net/scripts/b/ai.2.min.js",i.getElementsByTagName("script")[0].parentNode.appendChild(n)});try{t.cookie=i.cookie}catch(e){}t.queue=[],t.version=2;for(var r=["Event","PageView","Exception","Trace","DependencyData","Metric","PageViewPerformance"];r.length;)n("track"+r.pop());n("startTrackPage"),n("stopTrackPage");var s="Track"+r[0];if(n("start"+s),n("stop"+s),n("addTelemetryInitializer"),n("setAuthenticatedUserContext"),n("clearAuthenticatedUserContext"),n("flush"),!(!0===e.disableExceptionTracking||e.extensionConfig&&e.extensionConfig.ApplicationInsightsAnalytics&&!0===e.extensionConfig.ApplicationInsightsAnalytics.disableExceptionTracking)){n("_"+(r="onerror"));var o=a[r];a[r]=function(e,n,i,a,s){var c=o&&o(e,n,i,a,s);return!0!==c&&t["_"+r]({message:e,url:n,lineNumber:i,columnNumber:a,error:s}),c},e.autoExceptionInstrumented=!0}return t}(
{
  instrumentationKey:"INSTRUMENTATION_KEY"
}
);window[aiName]=aisdk,aisdk.queue&&0===aisdk.queue.length&&aisdk.trackPageView({});
</script>
```

### Sending Telemetry to the Azure Portal
If initialized using the snippet, your Application Insights instance is located by default at `window.appInsights`
```js
appInsights.trackEvent({name: 'some event'});
appInsights.trackPageView({name: 'some page'});
appInsights.trackPageViewPerformance({name : 'some page', url: 'some url'});
appInsights.trackException({exception: new Error('some error')});
appInsights.trackTrace({message: 'some trace'});
appInsights.trackMetric({name: 'some metric', average: 42});
appInsights.trackDependencyData({absoluteUrl: 'some url', responseCode: 200, method: 'GET', id: 'some id'});
appInsights.startTrackPage("pageName");
appInsights.stopTrackPage("pageName", {customProp1: "some value"});
appInsights.startTrackEvent("event");
appInsights.stopTrackEvent("event", {customProp1: "some value"});
appInsights.flush();
```

### Setting Up Autocollection
All autocollection is on by default. By using the full version of the JavaScript Application Insights SDK, we collect for you
- **Uncaught exceptions** in your app, including information on
	- Stack trace
	- Exception details and message accompanying the error
	- Line & column number of error
	- URL where error was raised
- **Network Dependency Requests** made by your app **XHR** and **Fetch** (fetch collection is disabled by default) requests, include information on
	- Url of dependency source
	- Command & Method used to request the dependency
	- Duration of the request
	- Result code and success status of the request
	- ID (if any) of user making the request
	- Correlation context (if any) where request is made
- **User information** (e.g. Location, network, IP)
- **Device information** (e.g. Browser, OS, version, language, resolution, model)
- **Session information**

### Telemetry Initializers
Telemetry initializers are used to modify the contents of collected telemetry before being sent from the user's browser. They can also be used to prevent certain telemetry from being sent, by returning `false`. Multiple telemetry initializers can be added to your Application Insights instance, and they are executed in order of adding them.

The input argument to `addTelemetryInitializer` is a callback that takes a [`ITelemetryItem`](./API-reference.md#addTelemetryInitializer) as an argument and returns a `boolean` or `void`. If returning `false`, the telemetry item is not sent, else it proceeds to the next telemetry initializer, if any, or is sent to the telemetry collection endpoint.

An example of using telemetry initializers:
```ts
var telemetryInitializer = (envelope) => {
  envelope.data.someField = 'This item passed through my telemetry initializer';
};
appInsights.addTelemetryInitializer(telemetryInitializer);
appInsights.trackTrace({message: 'This message will use a telemetry initializer'});

appInsights.addTelemetryInitializer(() => false); // Nothing is sent after this is executed
appInsights.trackTrace({message: 'this message will not be sent'}); // Not sent
```

## Configuration
Most configuration fields are named such that they can be defaulted to falsey. All fields are optional except for `instrumentationKey`.

| Name | Default | Description |
|------|---------|-------------|
| instrumentationKey | null | **Required**<br>Instrumentation key that you obtained from the Azure Portal. |
| accountId | null | An optional account id, if your app groups users into accounts. No spaces, commas, semicolons, equals, or vertical bars |
| sessionRenewalMs | 1800000 | A session is logged if the user is inactive for this amount of time in milliseconds. Default is 30 minutes |
| sessionExpirationMs | 86400000 | A session is logged if it has continued for this amount of time in milliseconds. Default is 24 hours |
| maxBatchSizeInBytes | 10000 | Max size of telemetry batch. If a batch exceeds this limit, it is immediately sent and a new batch is started |
| maxBatchInterval | 15000 | How long to batch telemetry for before sending (milliseconds) |
| disableExceptionTracking | false | If true, exceptions are no autocollected. Default is false. |
| disableTelemetry | false | If true, telemetry is not collected or sent. Default is false. |
| enableDebug | false | If true, **internal** debugging data is thrown as an exception **instead** of being logged, regardless of SDK logging settings. Default is false. <br>***Note:*** Enabling this setting will result in dropped telemetry whenever an internal error occurs. This can be useful for quickly identifying issues with your configuration or usage of the SDK. If you do not want to lose telemetry while debugging, consider using `consoleLoggingLevel` or `telemetryLoggingLevel` instead of `enableDebug`. |
| loggingLevelConsole | 0 | Logs **internal** Application Insights errors to console. <br>0: off, <br>1: Critical errors only, <br>2: Everything (errors & warnings) |
| loggingLevelTelemetry | 1 | Sends **internal** Application Insights errors as telemetry. <br>0: off, <br>1: Critical errors only, <br>2: Everything (errors & warnings) |
| diagnosticLogInterval | 10000 | (internal) Polling interval (in ms) for internal logging queue |
| samplingPercentage | 100 | Percentage of events that will be sent. Default is 100, meaning all events are sent. Set this if you wish to preserve your datacap for large-scale applications. |
| autoTrackPageVisitTime | false | If true, on a pageview,the previous instrumented page's view time is tracked and sent as telemetry and a new timer is started for the current pageview. Default is false. |
| disableAjaxTracking | false | If true, Ajax calls are not autocollected. Default is false. |
| disableFetchTracking | true | If true, Fetch requests are not autocollected. Default is true |
| overridePageViewDuration | false | If true, default behavior of trackPageView is changed to record end of page view duration interval when trackPageView is called. If false and no custom duration is provided to trackPageView, the page view performance is calculated using the navigation timing API. Default is false. |
| maxAjaxCallsPerView | 500 | Default 500 - controls how many ajax calls will be monitored per page view. Set to -1 to monitor all (unlimited) ajax calls on the page. |
| disableDataLossAnalysis | true | If false, internal telemetry sender buffers will be checked at startup for items not yet sent. |
| disableCorrelationHeaders | false | If false, the SDK will add two headers ('Request-Id' and 'Request-Context') to all dependency requests to correlate them with corresponding requests on the server side. Default is false. |
| correlationHeaderExcludedDomains |  | Disable correlation headers for specific domains |
| correlationHeaderDomains |  | Enable correlation headers for specific domains |
| disableFlushOnBeforeUnload | false | Default false. If true, flush method will not be called when onBeforeUnload event triggers |
| enableSessionStorageBuffer | true | Default true. If true, the buffer with all unsent telemetry is stored in session storage. The buffer is restored on page load |
| isCookieUseDisabled | false | Default false. If true, the SDK will not store or read any data from cookies.|
| cookieDomain | null | Custom cookie domain. This is helpful if you want to share Application Insights cookies across subdomains. |
| isRetryDisabled | false | Default false. If false, retry on 206 (partial success), 408 (timeout), 429 (too many requests), 500 (internal server error), 503 (service unavailable), and 0 (offline, only if detected) |
| isStorageUseDisabled | false | If true, the SDK will not store or read any data from local and session storage. Default is false. |
| isBeaconApiDisabled | true | If false, the SDK will send all telemetry using the [Beacon API](https://www.w3.org/TR/beacon) |
| onunloadDisableBeacon | false | Default false. when tab is closed, the SDK will send all remaining telemetry using the [Beacon API](https://www.w3.org/TR/beacon) |
| sdkExtension | null | Sets the sdk extension name. Only alphabetic characters are allowed. The extension name is added as a prefix to the 'ai.internal.sdkVersion' tag (e.g. 'ext_javascript:2.0.0'). Default is null. |
| isBrowserLinkTrackingEnabled | false | Default is false. If true, the SDK will track all [Browser Link](https://docs.microsoft.com/en-us/aspnet/core/client-side/using-browserlink) requests. |
| appId | null | AppId is used for the correlation between AJAX dependencies happening on the client-side with the server-side requests. When Beacon API is enabled, it cannot be used automatically, but can be set manually in the configuration. Default is null |
| enableCorsCorrelation | false | If true, the SDK will add two headers ('Request-Id' and 'Request-Context') to all CORS requests tocorrelate outgoing AJAX dependencies with corresponding requests on the server side. Default is false |
| namePrefix | undefined | An optional value that will be used as name postfix for localStorage and cookie name.
| enableAutoRouteTracking | false | Automatically track route changes in Single Page Applications (SPA). If true, each route change will send a new Pageview to Application Insights. Hash route changes changes (`example.com/foo#bar`) are also recorded as new page views.
| enableRequestHeaderTracking | false | If true, AJAX & Fetch request headers is tracked, default is false.
| enableResponseHeaderTracking | false | If true, AJAX & Fetch request's response headers is tracked, default is false.
| distributedTracingMode | `DistributedTracingModes.AI` | Sets the distributed tracing mode. If AI_AND_W3C mode or W3C mode is set, W3C trace context headers (traceparent/tracestate) will be generated and included in all outgoing requests. AI_AND_W3C is provided for back-compatibility with any legacy Application Insights instrumented services.

## Single Page Applications

By default, this SDK will **not** handle state based route changing that occurs in single page applications. To enable automatic route change tracking for your single page application, you can add `enableAutoRouteTracking: true` to your setup configuration.

Currently, we support a separate [React plugin](#available-extensions-for-the-sdk) which you can initialize with this SDK. It will also accomplish route change tracking for you, as well as collect [other React specific telemetry](./extensions/applicationinsights-react-js).

## Source Map Support

The minified callstack of your exception telemetry can be unminified in the Azure Portal. All existing integrations on the Exception Details panel will work with the newly unminified callstack. Drag and drop source map unminifying supports all existing and future JS SDKs (+Node.JS), so you do not need to upgrade your SDK version. To view your unminified callstack,
1. Select an Exception Telemetry item in the Azure Portal to view its "End-to-end transaction details"
2. Identify which source maps correspond to this call stack. The source map must match a stack frame's source file, but suffixed with `.map`
3. Drag and drop the source maps onto the call stack in the Azure Portal
![](https://i.imgur.com/Efue9nU.gif)

## Examples

For runnable examples, see [Application Insights Javascript SDK Samples](https://github.com/topics/applicationinsights-js-demo)

## Application Insights Web Basic

For a lightweight experience, you can instead install the basic version of Application Insights
```
npm i --save @microsoft/applicationinsights-web-basic
```
This version comes with the bare minimum amount of features and functionalities and relies on you to build it up as you see fit. For example, it performs no auto-collection (uncaught exceptions, ajax, etc). The APIs to send certain telemetry types, like `trackTrace`, `trackException`, etc, are not included in this version, so you will need to provide your own wrapper. The only api that is available is `track`. A [sample](https://github.com/Azure-Samples/applicationinsights-web-sample1/blob/master/testlightsku.html) is located here.

## Available extensions for the SDK


| Extensions |
|---------------|
| [React](https://github.com/microsoft/ApplicationInsights-JS/tree/master/extensions/applicationinsights-react-js)|
| [React Native](https://github.com/microsoft/ApplicationInsights-JS/tree/master/extensions/applicationinsights-react-native)|

## Upgrading from the old Version of Application Insights
Breaking changes in the SDK V2 version:
- To allow for better API signatures, some of the apis such as trackPageView, trackException have been updated. Running in IE8 or lower versions of the browser is not supported.
- Telemetry envelope has field name and structure changes due to data schema updates.
- Moved `context.operation` to `context.telemetryTrace`. Some fields were also changed (`operation.id` --> `telemetryTrace.traceID`)
  - If you want to maunally refresh the current pageview id (e.g. in SPA apps) this can be done with `appInsights.properties.context.telemetryTrace.traceID = Util.newId()`

If you are using the current application insights PRODUCTION SDK (1.0.20) and want to see if the new SDK works in runtime, please update URL depending on your current SDK loading scenario:

**a)** Download via CDN scenario:
	Update code snippet that you currently use to point to the following URL:
	```
	"https://az416426.vo.msecnd.net/scripts/b/ai.2.min.js"
	```

**b)** NPM scenario:
	Call downloadAndSetup to download full ApplicationInsights script from CDN and initialize it with instrumentation key.
```ts
appInsights.downloadAndSetup({
    instrumentationKey: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx",
    url: "https://az416426.vo.msecnd.net/scripts/b/ai.2.min.js"
});
```
Test in internal environment to verify monitoring telemetry is working as expected. If all works, please update your api signatures appropriately to SDK V2 version and deploy in your production environments.

## Build a new extension for the SDK
The beta SDK supports the ability to include multiple extensions at runtime. In order to create a new extension, please implement the following interface:

[ITelemetryPlugin](https://github.com/microsoft/ApplicationInsights-JS/blob/master/shared/AppInsightsCore/src/JavaScriptSDK.Interfaces/ITelemetryPlugin.ts)

On initialization, config.extensions accepts an array of ITelemetryPlugin objects. These are hooked up and ITelemetryPlugin.processTelemetry() is chained based on priority of these plugins.
Please note that higher the priority, the later your processing code will be invoked. The SDK supports a plugin model and channels can also be plugged in similarly (advanced scenario).
Target scenarios for creating a brand new extension is to share a usage scenario that benefits multiple customers. Please follow guidelines

Here is the priority ranges available:
- Regular extension priority can be between 201 to 499.
- Priorty range < 201 is reserved.
- Priority range > 1000 is for channels (advanced scenario)

Usage:

```ts
const customPluginInstance = new YourCustomPlugin()
const appInsights = new ApplicationInsights({ config: {
	instrumentationKey: 'YOUR_INSTRUMENTATION_KEY_GOES_HERE',
	extensions: [customPluginInstance]
	// Other Configuration Options...
}});
appInsights.loadAppInsights();
```

ITelemetryPlugin has a simpler base type IPlugin that you can instantiate for initialization purposes when SDK loads.

## Build & Test this repo

1. Install all dependencies
	```
	npm install
	npm install -g @microsoft/rush
	```
2. Navigate to the root folder and update rush dependencies
	```
	rush update
	```
3. Build and test
	```
	rush build
	npm run test
	```

## Performance
At just 25 KB gzipped, and taking only ~15 ms to initialize, Application Insights adds a negligible amount of loadtime to your website. By using the snippet, minimal components of the library are quickly loaded. In the meantime, the full script is downloaded in the background.

While the script is downloading from the CDN, all tracking of your page is queued. Once the downloaded script finishes asynchronously initializing, all events that were queued are tracked. As a result, you will not lose any telemetry during the entire life cycle of your page. This setup process provides your page with a seamless analytics system, invisible to your users.

> Summary:
> - **25 KB** gzipped
> - **15 ms** overall initialization time
> - **Zero** tracking missed during life cycle of page


## Browser Support
![Chrome](https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png) | ![Firefox](https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png) | ![IE](https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png) | ![Opera](https://raw.githubusercontent.com/alrra/browser-logos/master/src/opera/opera_48x48.png) | ![Safari](https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png)
--- | --- | --- | --- | --- |
Latest ✔ | Latest ✔ | 9+ ✔ | Latest ✔ | Latest ✔ |

## Contributing
Read our [contributing guide](./CONTRIBUTING.md) to learn about our development process, how to propose bugfixes and improvements, and how to build and test your changes to Application Insights.
