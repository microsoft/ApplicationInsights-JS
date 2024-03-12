# Application Insights JavaScript SDK

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

[![GitHub Workflow Status (master)](https://img.shields.io/github/actions/workflow/status/microsoft/ApplicationInsights-JS/ci.yml)](https://github.com/microsoft/ApplicationInsights-JS/tree/master)
[![npm version](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-web.svg)](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-web)
[![Build Status](https://dev.azure.com/mseng/AppInsights/_apis/build/status/AppInsights%20-%20DevTools/1DS%20JavaScript%20SDK%20web%20SKU%20vNext?branchName=master)](https://dev.azure.com/mseng/AppInsights/_build/latest?definitionId=8184&branchName=master)
[![minified size size](https://img.badgesize.io/https://js.monitor.azure.com/scripts/b/ai.2.min.js.svg?label=minified%20size)](https://js.monitor.azure.com/scripts/b/ai.2.min.js)
[![gzip size](https://img.badgesize.io/https://js.monitor.azure.com/scripts/b/ai.2.min.js.svg?compression=gzip&softmax=30000&max=35000)](https://js.monitor.azure.com/scripts/b/ai.2.min.js)


## Before Getting Started

This SDK is not for non-browser environments, for example, the Node.js applications.

For instrumenting a Node.js app, the recommended SDK is the [ApplicationInsights-node.js repository](https://github.com/microsoft/ApplicationInsights-node.js).

ES3 support has been removed from the latest version (v3.x), if required [see for ES3/IE8 Support](https://microsoft.github.io/ApplicationInsights-JS/es3_Support.html
)

## Release Versions

| Version | Details
|---------|--------------------------
| <b>[3.x](https://github.com/microsoft/ApplicationInsights-JS/tree/main)<br/><sub>(main)</sub> </b>| Current supported release from April '2023.<br/>Supports dynamic configuration changes/updates after initialization. Supports all features of v2 except with the known <b>[Breaking changes from previous versions](https://microsoft.github.io/ApplicationInsights-JS/upgrade/v3_BreakingChanges.html)</b> and does NOT support the previous v1.x compatible API proxy layer, it also removes support for ES3 / IE8. Minimum supported Runtime is now ES5 (IE9+).
| [2.x](https://github.com/microsoft/ApplicationInsights-JS/tree/master)<br/><sub>(master)</sub> | Feature freeze from March '2023, security fixes and critical bugs only.<br />Supports adding / removing extensions and full unloading/removal of the SDK after initialization. Last version to support ES3 (IE8+), also provides a v1.x compatible API proxy layer for upgrading from V1.x.
| [1.0.x](https://github.com/microsoft/ApplicationInsights-JS/tree/legacy-v1)<br/><sub>(legacy-v1)</sub> | No longer actively maintained -- please Upgrade. The documentation for `applicationinsights-js@1.0.x` has moved [here](https://github.com/microsoft/ApplicationInsights-JS/tree/master/legacy/README.md). If you are looking to upgrade to the new version of the SDK, please see the [Upgrade Guide](https://microsoft.github.io/ApplicationInsights-JS/upgrade/v2_UpgradeGuide.html). | Not actively maintained, please upgrade.

## Getting Started

1. Create an Application Insights resource in Azure by following [these instructions](https://docs.microsoft.com/en-us/azure/application-insights/app-insights-javascript?toc=/azure/azure-monitor/toc.json).
2. Grab the _Connection String_ from the resource you created in
   step 1. Later, you'll add it to the `connectionString` setting of the Application Insights JavaScript SDK.
3. Add Application Insights to your app. **There are 2 ways to do this.**
    - Install via NPM. Then, [set up an instance of Application Insights in your app.](#npm-setup-ignore-if-using-snippet-setup)
        > *Note:* **Typings are included with this package**, so you do **not** need to install a separate typings package.

        ```sh
        npm i --save @microsoft/applicationinsights-web
        ```

    - [Pasting a script snippet at the beginning of every `<head>` tag for each page you want to monitor.](#snippet-setup-ignore-if-using-npm-setup)

## Basic Usage

### NPM Setup (ignore if using Snippet Setup)

```js
import { ApplicationInsights } from '@microsoft/applicationinsights-web'

const appInsights = new ApplicationInsights({ config: {
  connectionString: 'YOUR_CONNECTION_STRING_GOES_HERE'
  /* ...Other Configuration Options... */
} });
appInsights.loadAppInsights();
appInsights.trackPageView(); // Manually call trackPageView to establish the current user/session/pageview
```

### Snippet Setup (Ignore if using NPM Setup)

If your app does not use NPM, you can directly instrument your webpages with Application Insights by pasting this snippet at the top of each your pages. Preferably, it should be the first script in your `<head>` section so that it can monitor any potential issues with all of your dependencies.

The current version of the snippet is version 6, the version is identified by the "sv:" in the script.

```html
<script type="text/javascript">
!function(v,y,T){var S=v.location,k="script",D="instrumentationKey",C="ingestionendpoint",I="disableExceptionTracking",E="ai.device.",b="toLowerCase",w=(D[b](),"crossOrigin"),N="POST",e="appInsightsSDK",t=T.name||"appInsights",n=((T.name||v[e])&&(v[e]=t),v[t]||function(l){var u=!1,d=!1,g={initialize:!0,queue:[],sv:"6",version:2,config:l};function m(e,t){var n={},a="Browser";return n[E+"id"]=a[b](),n[E+"type"]=a,n["ai.operation.name"]=S&&S.pathname||"_unknown_",n["ai.internal.sdkVersion"]="javascript:snippet_"+(g.sv||g.version),{time:(a=new Date).getUTCFullYear()+"-"+i(1+a.getUTCMonth())+"-"+i(a.getUTCDate())+"T"+i(a.getUTCHours())+":"+i(a.getUTCMinutes())+":"+i(a.getUTCSeconds())+"."+(a.getUTCMilliseconds()/1e3).toFixed(3).slice(2,5)+"Z",iKey:e,name:"Microsoft.ApplicationInsights."+e.replace(/-/g,"")+"."+t,sampleRate:100,tags:n,data:{baseData:{ver:2}}};function i(e){e=""+e;return 1===e.length?"0"+e:e}}var e,n,f=l.url||T.src;function a(e){var t,n,a,i,o,s,r,c,p;u=!0,g.queue=[],d||(d=!0,i=f,r=(c=function(){var e,t={},n=l.connectionString;if(n)for(var a=n.split(";"),i=0;i<a.length;i++){var o=a[i].split("=");2===o.length&&(t[o[0][b]()]=o[1])}return t[C]||(t[C]="https://"+((e=(n=t.endpointsuffix)?t.location:null)?e+".":"")+"dc."+(n||"services.visualstudio.com")),t}()).instrumentationkey||l[D]||"",c=(c=c[C])?c+"/v2/track":l.endpointUrl,(p=[]).push((t="SDK LOAD Failure: Failed to load Application Insights SDK script (See stack for details)",n=i,o=c,(s=(a=m(r,"Exception")).data).baseType="ExceptionData",s.baseData.exceptions=[{typeName:"SDKLoadFailed",message:t.replace(/\./g,"-"),hasFullStack:!1,stack:t+"\nSnippet failed to load ["+n+"] -- Telemetry is disabled\nHelp Link: https://go.microsoft.com/fwlink/?linkid=2128109\nHost: "+(S&&S.pathname||"_unknown_")+"\nEndpoint: "+o,parsedStack:[]}],a)),p.push((s=i,t=c,(o=(n=m(r,"Message")).data).baseType="MessageData",(a=o.baseData).message='AI (Internal): 99 message:"'+("SDK LOAD Failure: Failed to load Application Insights SDK script (See stack for details) ("+s+")").replace(/\"/g,"")+'"',a.properties={endpoint:t},n)),i=p,r=c,JSON&&((o=v.fetch)&&!T.useXhr?o(r,{method:N,body:JSON.stringify(i),mode:"cors"}):XMLHttpRequest&&((s=new XMLHttpRequest).open(N,r),s.setRequestHeader("Content-type","application/json"),s.send(JSON.stringify(i)))))}function i(e,t){d||setTimeout(function(){!t&&g.core||a()},500)}f&&((n=y.createElement(k)).src=f,!(o=T[w])&&""!==o||"undefined"==n[w]||(n[w]=o),n.onload=i,n.onerror=a,n.onreadystatechange=function(e,t){"loaded"!==n.readyState&&"complete"!==n.readyState||i(0,t)},e=n,T.ld<0?y.getElementsByTagName("head")[0].appendChild(e):setTimeout(function(){y.getElementsByTagName(k)[0].parentNode.appendChild(e)},T.ld||0));try{g.cookie=y.cookie}catch(h){}function t(e){for(;e.length;)!function(t){g[t]=function(){var e=arguments;u||g.queue.push(function(){g[t].apply(g,e)})}}(e.pop())}var s,r,o="track",c="TrackPage",p="TrackEvent",o=(t([o+"Event",o+"PageView",o+"Exception",o+"Trace",o+"DependencyData",o+"Metric",o+"PageViewPerformance","start"+c,"stop"+c,"start"+p,"stop"+p,"addTelemetryInitializer","setAuthenticatedUserContext","clearAuthenticatedUserContext","flush"]),g.SeverityLevel={Verbose:0,Information:1,Warning:2,Error:3,Critical:4},(l.extensionConfig||{}).ApplicationInsightsAnalytics||{});return!0!==l[I]&&!0!==o[I]&&(t(["_"+(s="onerror")]),r=v[s],v[s]=function(e,t,n,a,i){var o=r&&r(e,t,n,a,i);return!0!==o&&g["_"+s]({message:e,url:t,lineNumber:n,columnNumber:a,error:i,evt:v.event}),o},l.autoExceptionInstrumented=!0),g}(T.cfg));function a(){T.onInit&&T.onInit(n)}(v[t]=n).queue&&0===n.queue.length?(n.queue.push(a),n.trackPageView({})):a()}(window,document,{
src: "https://js.monitor.azure.com/scripts/b/ai.2.min.js", // The SDK URL Source
// name: "appInsights", // Global SDK Instance name defaults to "appInsights" when not supplied
// ld: 0, // Defines the load delay (in ms) before attempting to load the sdk. -1 = block page load and add to head. (default) = 0ms load after timeout,
// useXhr: 1, // Use XHR instead of fetch to report failures (if available),
crossOrigin: "anonymous", // When supplied this will add the provided value as the cross origin attribute on the script tag
// onInit: null, // Once the application insights instance has loaded and initialized this callback function will be called with 1 argument -- the sdk instance (DO NOT ADD anything to the sdk.queue -- As they won't get called)
cfg: { // Application Insights Configuration
    connectionString: "YOUR_CONNECTION_STRING"
}});
</script>
```

> :bulb: **Note**
>
> For readability and to reduce possible JavaScript errors, all of the possible configuration options are listed on a new line in snippet code above, if you don't want to change the value of a commented line it can be removed.

#### Reporting Script load exceptions

This version of the snippet detects and reports an exception when loading the SDK from the CDN fails, this exception is reported to the Azure Monitor portal (under the failures &gt; exceptions &gt; browser), and provides visibility into failures of this type so that you are aware your application is not reporting telemetry (or other exceptions) as expected. This signal is an important measurement in understanding that you have lost telemetry because the SDK did not load or initialize, this provides clarity that you are missing the following telemetry:
- Under-reporting of how users are using (or trying to use) your site;
- Missing telemetry on how your end users are using your site;
- Missing JavaScript errors that could potentially be blocking your end users from successfully using your site.

For details on this exception see [SDK Load Failure](docs/SdkLoadFailure.md) page.

Reporting of this failure as an exception to the portal does not use the configuration option ```disableExceptionTracking``` from the application insights configuration and therefore if this failure occurs it will always be reported by the snippet, even when the window.onerror support is disabled.

Reporting of SDK load exceptions is specifically NOT supported on IE 8 (or less). This assists with reducing the minified size of the snippet by assuming that most environments are not exclusively IE 8 or less. If you have this requirement and you wish to receive these exceptions, you will need to either include a fetch poly fill or create you own snippet version that uses ```XDomainRequest``` instead of ```XMLHttpRequest```, it is recommended that you use the [provided snippet source code](https://github.com/microsoft/ApplicationInsights-JS/blob/master/AISKU/snippet/snippet.js) as a starting point.

> :bulb: **Note**
>
> If you are using a previous version of the snippet, it is highly recommended that you update to the latest version so that you will receive these previously unreported issues.

#### Snippet configuration options

All configuration options have now been move towards the end of the script to help avoid accidentally introducing JavaScript errors that would not just cause the SDK to fail to load, but also it would disable the reporting of the failure.

Each configuration option is shown above on a new line, if you don't wish to override the default value of an item listed as [optional] you can  remove that line to minimize the resulting size of your returned page.

The available configuration options are: -

| Name | Type | Description
|------|------|----------------
| src | string **[required]** | The full URL for where to load the SDK from. This value is used for the "src" attribute of a dynamically added &lt;script /&gt; tag. You can use the public CDN location or your own privately hosted one.
| name | string *[optional]* | The global name for the initialized SDK, defaults to appInsights. So ```window.appInsights``` will be a reference to the initialized instance. Note: if you provide a name value or a previous instance appears to be assigned (via the global name appInsightsSDK) then this name value will also be defined in the global namespace as ```window.appInsightsSDK=<name value>```, this is required by the SDK initialization code to ensure it's initializing and updating the correct snippet skeleton and proxy methods.
| ld | number in ms *[optional]* | Defines the load delay to wait before attempting to load the SDK. Default value is 0ms and any negative value will immediately add a script tag to the &lt;head&gt; region of the page, which will then block the page load event until to script is loaded (or fails).
| useXhr | boolean *[optional]* | This setting is used only for reporting SDK load failures. Reporting will first attempt to use fetch() if available and then fallback to XHR, setting this value to true just bypasses the fetch check. Use of this value is only be required if your application is being used in an environment where fetch would fail to send the failure events.
| crossOrigin | string *[optional]* | By including this setting, the script tag added to download the SDK will include the crossOrigin attribute with this string value. When not defined (the default) no crossOrigin attribute is added. Recommended values are not defined (the default); ""; or "anonymous" (For all valid values see [HTML attribute: crossorigin](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin) documentation)
| onInit | function(aiSdk) { ... } *[optional]* | This callback function which is called after the main SDK script has been successfully loaded and initialized from the CDN (based on the src value), it is passed a reference to the sdk instance that it is being called for and it is also called _before_ the first initial page view. If the SDK has already been loaded and initialized this callback will still be called. NOTE: As this callback is called during the processing of the sdk.queue array you CANNOT add any additional items to the queue as they will be ignored and dropped. (Added as part of snippet version 5 -- the sv:"#" value within the snippet script, the current version is 6)
| cfg | object **[required]** | The configuration passed to the Application Insights SDK during initialization.

#### Example using the snippet onInit callback

```html
<script type="text/javascript">
!function(T,l,y){<!-- Removed the Snippet code for brevity -->}(window,document,{
src: "https://js.monitor.azure.com/scripts/b/ai.2.min.js",
crossOrigin: "anonymous",
onInit: function (sdk) {
  sdk.addTelemetryInitializer(function (envelope) {
    envelope.data.someField = 'This item passed through my telemetry initializer';
  });
}, // Once the application insights instance has loaded and initialized this method will be called
cfg: { // Application Insights Configuration
    connectionString: "YOUR_CONNECTION_STRING"
}});
</script>
```

#### Active Public CDN endpoints

To help with global resiliency, we have added and updated our primary CDN endpoint (source URL) so that if required we can address any outages without the need for everyone to update the URL used by the Application Insights snippet within their application.

All active CDN endpoints contain all of the previous (and future) versions of the SDK and there is currently no plans to stop or block accessing the snippet from the previous (legacy/backup) URL.

| State | CDN Endpoint | Description
|-------|--------------|--------------------
| Primary | https://js.monitor.azure.com/scripts/b/ai.2.min.js | Provides additional resiliency, allowing us to redirect to a different CDN provider should there be an unexpected issue (if required).
| ~~Legacy/Backup~~<br />:exclamation: Deprecated | ~~https://az416426.vo.msecnd.net/scripts/b/ai.2.min.js~~ | Due to the legacy nature of this URL / Domain, __if there is an unexpected issue (outage) with this domain, your application will need to be updated and deployed to use the new URL__.<br />:exclamation: Due to #1813 this URL is now being classified as Deprecated and we will be actively making changes to the SDK to warnings in your telemetry if we detect this domain being used.

### Connection String Setup

For either the NPM or Snippet setup, you can also configure your instance of Application Insights using a Connection String. Simply replace the `instrumentationKey` field with the `connectionString` field.
```js
import { ApplicationInsights } from '@microsoft/applicationinsights-web'

const appInsights = new ApplicationInsights({ config: {
  connectionString: 'YOUR_CONNECTION_STRING_GOES_HERE'
  /* ...Other Configuration Options... */
} });
appInsights.loadAppInsights();
appInsights.trackPageView();
```

#### (Alternative Setup Method) Include AI JS SDK script and initialize statically

Use this approach if you would like to host AI JS SDK script on your endpoint or bundle it with other scripts. 
```html
<!-- use your own path to JS SDK script -->
<script type="text/javascript" src="/pathToAIJSSDK.js"></script>
```
After JS script has loaded, include the following snippet to initialize Application Insights:

```html
<!-- the snippet below assumes that JS SDK script has already loaded -->
<script type="text/javascript">
    var snippet = {
        config: {
            connectionString: "InstrumentationKey=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx"
        }
    };
    var init = new Microsoft.ApplicationInsights.ApplicationInsights(snippet);
    var appInsights = init.loadAppInsights();
    appInsights.trackPageView();
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
appInsights.stopTrackPage("pageName", null, {customProp1: "some value"});
appInsights.startTrackEvent("event");
appInsights.stopTrackEvent("event", null, {customProp1: "some value"});
appInsights.flush();
```

Custom properties can be included in your telemetry through the `properties` named argument. This can be done with *any* of the Track APIs.

```js
appInsights.trackEvent({
  name: 'some event',
  properties: { // accepts any type
    prop1: 'string',
    prop2: 123.45,
    prop3: { nested: 'objects are okay too' }
  }
});
```

### Setting Up Autocollection

All autocollection is ON by default. The full version of the Application Insights Javascript SDK auto collects:

- **Uncaught exceptions** in your app, including information on
  - Stack trace
  - Exception details and message accompanying the error
  - Line & column number of error
  - URL where error was raised
- **Network Dependency Requests** made by your app **XHR** and **Fetch** (fetch collection is enabled by default) requests, include information on
  - Url of dependency source
  - Command & Method used to request the dependency
  - Duration of the request
  - Result code and success status of the request
  - ID (if any) of user making the request
  - Correlation context (if any) where request is made
- **User information** (e.g. Location, network, IP)
- **Device information** (e.g. Browser, OS, version, language, model)
- **Session information**

### Telemetry Initializers

Telemetry initializers are used to modify the contents of collected telemetry before being sent from the user's browser. They can also be used to prevent certain telemetry from being sent, by returning `false`. Multiple telemetry initializers can be added to your Application Insights instance, and they are executed in order of adding them.

The input argument to `addTelemetryInitializer` is a callback that takes a [`ITelemetryItem`](./API-reference.md#addTelemetryInitializer) as an argument and returns a `boolean` or `void`. If returning `false`, the telemetry item is not sent, else it proceeds to the next telemetry initializer, if any, or is sent to the telemetry collection endpoint.

#### Example: [Setting Cloud Role Name](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-map#set-cloud-role-name)

```js
var telemetryInitializer = (envelope) => {
  envelope.tags["ai.cloud.role"] = "your role name";
  envelope.tags["ai.cloud.roleInstance"] = "your role instance";
}
appInsights.addTelemetryInitializer(telemetryInitializer);
```

#### Example: Filtering

```js
var telemetryInitializer = (envelope) => {
  envelope.data.someField = 'This item passed through my telemetry initializer';
};
appInsights.addTelemetryInitializer(telemetryInitializer);
appInsights.trackTrace({message: 'This message will use a telemetry initializer'});

appInsights.addTelemetryInitializer(() => false); // Nothing is sent after this is executed
appInsights.trackTrace({message: 'this message will not be sent'}); // Not sent
```

### Dependency Listeners

A [dependency listener is a callback function](./API-reference.md#addDependencyListener) that allows you to perform additional manipulation of the request details before the request is performed.

This includes :-

- Complete access to either the XMLHttpRequest instance or the fetch API `input` and `init` arguments.
- Ability to get/set the properties used to generate the W3C `traceparent` header (`traceId`, `spanId, `traceFlags)
- Set values in the object context container for other listeners called after the current one, as well as this context object is also made available to all dependency initializers.

### Dependency Initializers

A [Dependency Initializer is very similar](./API-reference.md#addDependencyInitializer) to a [Telemetry Initializer](https://github.com/Microsoft/ApplicationInsights-JS#telemetry-initializers) in that it allows you modify the contents of collected telemetry before being sent from the user's browser. And you can also returning `false` to cause the event to not be emitted.

The differences between a telemetry initializer and a dependency initializer are :-
- A Dependency Initializer is called "before" the event is processed by the pipeline, as such it will NOT (yet) contain the automatically populated properties that are applied later;
- When a dependency initializer returns `false` to drop the event the event does NOT count against the `maxAjaxCallsPerView` as this blocks the event call from being tracked, and while returning `false` from a [Telemetry Initializer](https://github.com/Microsoft/ApplicationInsights-JS#telemetry-initializers) will also stop the event from being reported because this is further down the processing pipeline the dependency event IS counted against the `maxAjaxCallsPerView` limit.
- It has access to an optional "context" `{ [key: string]: any }` object that is also available to the Dependency Listeners. This allows a listener to add additional details to the context (before the XHR/fetch request is sent), and the initializer will be called after the request has completed.

## Configuration

Most configuration fields are named such that they can be defaulted to falsey. All fields are optional except for `instrumentationKey` or a `connectionString` containing the instrumentation key.

| Name | Type | Default | Description |
|------|------|---------|-------------|
| instrumentationKey | string<br>[**Required if `connectionString` not supplied**]| null | Instrumentation key that you obtained from the Azure Portal. |
| connectionString | string<br>[**Require if `instrumentationKey` not supplied**] | null | The Connection string that you obtained from the Azure portal |
| accountId | string | null | An optional account id, if your app groups users into accounts. No spaces, commas, semicolons, equals, or vertical bars |
| sessionRenewalMs | numeric | 1800000 | A session is logged if the user is inactive for this amount of time in milliseconds. Default is 30 minutes |
| sessionExpirationMs | numeric | 86400000 | A session is logged if it has continued for this amount of time in milliseconds. Default is 24 hours |
| maxBatchSizeInBytes | numberic | 10000 | Max size of telemetry batch. If a batch exceeds this limit, it is immediately sent and a new batch is started |
| maxBatchInterval | numeric | 15000 | How long to batch telemetry for before sending (milliseconds) |
| disableExceptionTracking | boolean || false | If true, exceptions are not autocollected. Default is false. |
| disableTelemetry | boolean | false | If true, telemetry is not collected or sent. Default is false. |
| enableDebug | boolean | false | If true, **internal** debugging data is thrown as an exception **instead** of being logged, regardless of SDK logging settings. Default is false. <br>***Note:*** Enabling this setting will result in dropped telemetry whenever an internal error occurs. This can be useful for quickly identifying issues with your configuration or usage of the SDK. If you do not want to lose telemetry while debugging, consider using `loggingLevelConsole` or `loggingLevelTelemetry` instead of `enableDebug`.
| enableDebugExceptions | boolean | false | Prior to v2.8.12 this was the only supported value and the documented `enableDebug` was incorrect, since v2.8.12 both `enableDebug` and `enableDebugExceptions` is supported. However, this configuration has been removed from v3.x
| loggingLevelConsole | numeric | 0 | Logs **internal** Application Insights errors to console. <br>0: off, <br>1: Critical errors only, <br>2: Everything (errors & warnings) |
| loggingLevelTelemetry | numeric | 1 | Sends **internal** Application Insights errors as telemetry. <br>0: off, <br>1: Critical errors only, <br>2: Everything (errors & warnings) |
| diagnosticLogInterval | numeric | 10000 | (internal) Polling interval (in ms) for internal logging queue |
| samplingPercentage | numeric | 100 | Percentage of events that will be sent. Default is 100, meaning all events are sent. Set this if you wish to preserve your datacap for large-scale applications. |
| autoTrackPageVisitTime | boolean | false | If true, on a pageview, the _previous_ instrumented page's view time is tracked and sent as telemetry and a new timer is started for the current pageview. It is sent as a custom metric named `PageVisitTime` in `milliseconds` and is calculated via the Date [now()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now) function (if available) and falls back to (new Date()).[getTime()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTime) if now() is unavailable (IE8 or less). Default is false. |
| disableAjaxTracking | boolean | false | If true, Ajax calls are not autocollected. Default is false. |
| disableFetchTracking | boolean | false | If true, Fetch requests are not autocollected. Default is false (Since v2.8.0, previously true) |
| excludeRequestFromAutoTrackingPatterns | string[] \| RegExp[] | undefined | Provide a way to exclude specific route from automatic tracking for XMLHttpRequest or Fetch request. If defined, for an ajax / fetch request that the request url matches with the regex patterns, auto tracking is turned off. Default is undefined. |
| addRequestContext | (requestContext: IRequestionContext) => {[key: string]: any} | undefined | Provide a way to enrich dependencies logs with context at the beginning of api call. Default is undefined. You will need to check if `xhr` exists if you configure `xhr` related conetext. You will need to check if `fetch request` and `fetch response` exist if you configure `fetch` related context. Otherwise you may not get the data you need. |
| overridePageViewDuration | boolean | false | If true, default behavior of trackPageView is changed to record end of page view duration interval when trackPageView is called. If false and no custom duration is provided to trackPageView, the page view performance is calculated using the navigation timing API. Default is false. |
| maxAjaxCallsPerView | numeric | 500 | Default 500 - controls how many ajax calls will be monitored per page view. Set to -1 to monitor all (unlimited) ajax calls on the page. |
| disableDataLossAnalysis | boolean | true | If false, internal telemetry sender buffers will be checked at startup for items not yet sent. |
| disableCorrelationHeaders | boolean | false | If false, the SDK will add two headers ('Request-Id' and 'Request-Context') to all dependency requests to correlate them with corresponding requests on the server side. Default is false. |
| correlationHeaderExcludedDomains | string[] | undefined | Disable correlation headers for specific domains |
| correlationHeaderExcludePatterns | regex[] | undefined | Disable correlation headers using regular expressions |
| correlationHeaderDomains | string[] | undefined | Enable correlation headers for specific domains |
| disableFlushOnBeforeUnload | boolean | false | Default false. If true, flush method will not be called when onBeforeUnload event triggers |
| enableSessionStorageBuffer | boolean | true | Default true. If true, the buffer with all unsent telemetry is stored in session storage. The buffer is restored on page load |
| cookieCfg | [ICookieCfgConfig](#ICookieMgrConfig)<br>[Optional]<br>(Since 2.6.0) | undefined | Defaults to cookie usage enabled see [ICookieCfgConfig](#ICookieMgrConfig) settings for full defaults. |
| ~~isCookieUseDisabled~~<br>disableCookiesUsage | alias for [`cookieCfg.enabled`](#ICookieMgrConfig)<br>[Optional] | false | Default false. A boolean that indicates whether to disable the use of cookies by the SDK. If true, the SDK will not store or read any data from cookies. isCookieUseDisable is deprecated in favor of disableCookiesUsage, when both are provided disableCookiesUsage take precedence.<br>(Since v2.6.0) If `cookieCfg.enabled` is defined it will take precedence over these values, Cookie usage can be re-enabled after initialization via the core.getCookieMgr().setEnabled(true). |
| cookieDomain | alias for [`cookieCfg.domain`](#ICookieMgrConfig)<br>[Optional] | null | Custom cookie domain. This is helpful if you want to share Application Insights cookies across subdomains.<br>(Since v2.6.0) If `cookieCfg.domain` is defined it will take precedence over this value. |
| cookiePath | alias for [`cookieCfg.path`](#ICookieMgrConfig)<br>[Optional]<br>(Since 2.6.0) | null | Custom cookie path. This is helpful if you want to share Application Insights cookies behind an application gateway.<br>If `cookieCfg.path` is defined it will take precedence over this value.  |
| isRetryDisabled | boolean | false | Default false. If false, retry on 206 (partial success), 408 (timeout), 429 (too many requests), 500 (internal server error), 503 (service unavailable), and 0 (offline, only if detected) |
| isStorageUseDisabled | boolean | false | If true, the SDK will not store or read any data from local and session storage. Default is false. |
| isBeaconApiDisabled | boolean | true | If false, the SDK will send all telemetry using the [Beacon API](https://www.w3.org/TR/beacon) |
| disableXhr | boolean | false | Don't use XMLHttpRequest or XDomainRequest (for IE < 9) by default instead attempt to use fetch() or sendBeacon. If no other transport is available it will still use XMLHttpRequest |
| onunloadDisableBeacon | boolean | false | Default false. when tab is closed, the SDK will send all remaining telemetry using the [Beacon API](https://www.w3.org/TR/beacon) |
| onunloadDisableFetch | boolean | false | If fetch keepalive is supported do not use it for sending events during unload, it may still fallback to fetch() without keepalive |
| sdkExtension | string | null | Sets the sdk extension name. Only alphabetic characters are allowed. The extension name is added as a prefix to the 'ai.internal.sdkVersion' tag (e.g. 'ext_javascript:2.0.0'). Default is null. |
| isBrowserLinkTrackingEnabled | boolean | false | Default is false. If true, the SDK will track all [Browser Link](https://docs.microsoft.com/en-us/aspnet/core/client-side/using-browserlink) requests. |
| appId | string | null | AppId is used for the correlation between AJAX dependencies happening on the client-side with the server-side requests. When Beacon API is enabled, it cannot be used automatically, but can be set manually in the configuration. Default is null |
| enableCorsCorrelation | boolean | false | If true, the SDK will add two headers ('Request-Id' and 'Request-Context') to all CORS requests to correlate outgoing AJAX dependencies with corresponding requests on the server side. Default is false |
| namePrefix | string | undefined | An optional value that will be used as name postfix for localStorage and session cookie name.
| sessionCookiePostfix | string | undefined | An optional value that will be used as name postfix for session cookie name. If undefined, namePrefix is used as name postfix for session cookie name.
| userCookiePostfix | string | undefined | An optional value that will be used as name postfix for user cookie name. If undefined, no postfix is added on user cookie name.
| enableAutoRouteTracking | boolean | false | Automatically track route changes in Single Page Applications (SPA). If true, each route change will send a new Pageview to Application Insights. Hash route changes changes (`example.com/foo#bar`) are also recorded as new page views.
| enableRequestHeaderTracking | boolean | false | If true, AJAX & Fetch request headers is tracked, default is false. If ignoreHeaders is not configured, Authorization and X-API-Key headers are not logged.
| enableResponseHeaderTracking | boolean | false | If true, AJAX & Fetch request's response headers is tracked, default is false. If ignoreHeaders is not configured, WWW-Authenticate header is not logged.
| ignoreHeaders | string[] | ["Authorization", "X-API-Key", "WWW-Authenticate"] | AJAX & Fetch request and response headers to be ignored in log data. To override or discard the default, add an array with all headers to be excluded or an empty array to the configuration.
| enableAjaxErrorStatusText | boolean | false | Default false. If true, include response error data text | boolean in dependency event on failed AJAX requests.
| enableAjaxPerfTracking | boolean | false | Default false. Flag to enable looking up and including additional browser window.performance timings in the reported ajax (XHR and fetch) reported metrics.
| maxAjaxPerfLookupAttempts | numeric | 3 | Defaults to 3. The maximum number of times to look for the window.performance timings (if available), this is required as not all browsers populate the window.performance before reporting the end of the XHR request and for fetch requests this is added after its complete.
| ajaxPerfLookupDelay | numeric | 25 | Defaults to 25ms. The amount of time to wait before re-attempting to find the windows.performance timings for an ajax request, time is in milliseconds and is passed directly to setTimeout().
| distributedTracingMode | numeric or `DistributedTracingModes` | `DistributedTracingModes.AI_AND_W3C` | Sets the distributed tracing mode. If AI_AND_W3C mode or W3C mode is set, W3C trace context headers (traceparent/tracestate) will be generated and included in all outgoing requests. AI_AND_W3C is provided for back-compatibility with any legacy Application Insights instrumented services.
| enableUnhandledPromiseRejectionTracking | boolean | false | If true, unhandled promise rejections will be autocollected and reported as a javascript error. When disableExceptionTracking is true (dont track exceptions) the config value will be ignored and unhandled promise rejections will not be reported.
| disableInstrumentationKeyValidation | boolean | false | If true, instrumentation key validation check is bypassed. Default value is false.
| enablePerfMgr | boolean | false | [Optional] When enabled (true) this will create local perfEvents for code that has been instrumented to emit perfEvents (via the doPerf() helper). This can be used to identify performance issues within the SDK based on your usage or optionally within your own instrumented code. [More details are available by the basic documentation](./docs/PerformanceMonitoring.md). Since v2.5.7
| perfEvtsSendAll | boolean | false | [Optional] When _enablePerfMgr_ is enabled and the [IPerfManager](https://github.com/microsoft/ApplicationInsights-JS/blob/master/shared/AppInsightsCore/src/JavaScriptSDK.Interfaces/IPerfManager.ts) fires a [INotificationManager](https://github.com/microsoft/ApplicationInsights-JS/blob/master/shared/AppInsightsCore/src/JavaScriptSDK.Interfaces/INotificationManager.ts).perfEvent() this flag determines whether an event is fired (and sent to all listeners) for all events (true) or only for 'parent' events (false &lt;default&gt;).<br />A parent [IPerfEvent](https://github.com/microsoft/ApplicationInsights-JS/blob/master/shared/AppInsightsCore/src/JavaScriptSDK.Interfaces/IPerfEvent.ts) is an event where no other IPerfEvent is still running at the point of this event being created and it's _parent_ property is not null or undefined. Since v2.5.7
| createPerfMgr | (core: IAppInsightsCore, notificationManager: INotificationManager) => IPerfManager | undefined | Callback function that will be called to create a the IPerfManager instance when required and ```enablePerfMgr``` is enabled, this enables you to override the default creation of a PerfManager() without needing to ```setPerfMgr()``` after initialization.
| idLength | numeric | 22 | [Optional] Identifies the default length used to generate new random session and user id's. Defaults to 22, previous default value was 5 (v2.5.8 or less), if you need to keep the previous maximum length you should set this value to 5.
| customHeaders | `[{header: string, value: string}]` | undefined | [Optional] The ability for the user to provide extra headers when using a custom endpoint. customHeaders will not be added on browser shutdown moment when beacon sender is used. And adding custom headers is not supported on IE9 or earlier.
| convertUndefined | `any` | undefined | [Optional] Provide user an option to convert undefined field to user defined value.
| eventsLimitInMem | number | 10000 | [Optional] The number of events that can be kept in memory before the SDK starts to drop events when not using Session Storage (the default).
| disableIkeyDeprecationMessage | boolean | true | [Optional]  Disable instrumentation Key deprecation error message. If true, error message will NOT be sent. **Note: instrumentation key support will end soon**, see aka.ms/IkeyMigrate for more details.
| bufferOverride <br/><sub>since 2.8.12</sub> | IStorageBuffer | undefined | [Optional] Identifies a simple interface to allow you to override the storage mechanism used for tracking unsent and unacknowledged events, when not provided defaults to using SessionStorage interface. You MUST supply both the `getItem` and `setItem` functions when defined.
| storagePrefix (since v2.8.15)| string[] | undefined | [Optional] An optional value that will be added as name prefix for storage name.  ([design for system to correctly identifies these telemetry events as "necessary"](https://github.com/microsoft/ApplicationInsights-JS/issues/2094).) |
| retryCodes | number[] | undefined | Identifies the status codes that will cause event batches to be resent, when `null` or `undefined` the SDK will use it's defaults `[401, 408, 429, 500, 502, 503, 504]`. `403` was removed in version 2.8.18. |

### ICookieMgrConfig

Cookie Configuration for instance based cookie management added in version 2.6.0.

| Name | Type | Default | Description |
|------|------|---------|-------------|
| enabled | boolean | true | A boolean that indicates whether the use of cookies by  the SDK is enabled by the current instance. If false, the instance of the SDK initialized by this configuration will not store or read any data from cookies |
| domain | string | null | Custom cookie domain. This is helpful if you want to share Application Insights cookies across subdomains. If not provided uses the value from root `cookieDomain` value. |
| path | string | / | Specifies the path to use for the cookie, if not provided it will use any value from the root `cookiePath` value. |
| ignoreCookies | string[] | undefined | Specify the cookie name(s) to be ignored, this will cause any matching cookie name to never be read or written. They may still be explicitly purged or deleted. You do not need to repeat the name in the `blockedCookies` configuration.(Since v2.8.8)
| blockedCookies | string[] | undefined | Specify the cookie name(s) to never be written, this will cause any cookie name to never be created or updated, they will still be read unless also included in the ignoreCookies and may still be explicitly purged or deleted. If not provided defaults to the same list provided in ignoreCookies. (Since v2.8.8)
| getCookie | `(name: string) => string` | null | Function to fetch the named cookie value, if not provided it will use the internal cookie parsing / caching. |
| setCookie | `(name: string, value: string) => void` | null | Function to set the named cookie with the specified value, only called when adding or updating a cookie. |
| delCookie | `(name: string, value: string) => void` | null | Function to delete the named cookie with the specified value, separated from setCookie to avoid the need to parse the value to determine whether the cookie is being added or removed.if not provided it will use the internal cookie parsing / caching. |

## Cookie Handling

From version 2.6.0, cookie management is now available directly from the instance and can be disabled and re-enabled after initialization.

If disabled during initialization via the `disableCookiesUsage` or `cookieCfg.enabled` configurations, you can now re-enable via the [ICookieMgr](https://github.com/microsoft/ApplicationInsights-JS/blob/master/shared/AppInsightsCore/src/JavaScriptSDK.Interfaces/ICookieMgr.ts) `setEnabled` function.

The instance based cookie management also replaces the previous CoreUtils global functions of `disableCookies()`, `setCookie(...)`, `getCookie(...)` and `deleteCookie(...)`. And to benefit from the tree-shaking enhancements also introduced as part of version 2.6.0 you should no longer uses the global functions.

### Simplified Usage of new instance Cookie Manager

**General Guidance**

When calling `getCookieMgr()` before the SDK has successfully initialized will return a temporary `ICookieMgr` instance that will have cookie support fully enabled, thus allowing the getting, setting and deleting of cookies. So unless you know that your configuration WILL ALLOW cookie usage you should delay accessing or using the cookie manager until after initialization.

- appInsights.[getCookieMgr()](https://github.com/microsoft/ApplicationInsights-JS/blob/master/shared/AppInsightsCore/src/JavaScriptSDK.Interfaces/ICookieMgr.ts).setEnabled(true/false)
- appInsights.[getCookieMgr()](https://github.com/microsoft/ApplicationInsights-JS/blob/master/shared/AppInsightsCore/src/JavaScriptSDK.Interfaces/ICookieMgr.ts).set("MyCookie", "thevalue");
- appInsights.[getCookieMgr()](https://github.com/microsoft/ApplicationInsights-JS/blob/master/shared/AppInsightsCore/src/JavaScriptSDK.Interfaces/ICookieMgr.ts).get("MyCookie");
- appInsights.[getCookieMgr()](https://github.com/microsoft/ApplicationInsights-JS/blob/master/shared/AppInsightsCore/src/JavaScriptSDK.Interfaces/ICookieMgr.ts).del("MyCookie");

> In v2.6.0 the `getCookieMgr()` is not directly available on the main entry points documented above for the snippet, NPM (`ApplicationInsights`) or React Plugin usages. As a workaround for this version you will need to access it via the `core` or `appInsights` properties as below (the `getCookieMgr()` will be available in later versions)
>
>- appInsights.**core.**[getCookieMgr()](https://github.com/microsoft/ApplicationInsights-JS/blob/master/shared/AppInsightsCore/src/JavaScriptSDK.Interfaces/ICookieMgr.ts).xxxxx
>- appInsights.**appInsights.**[getCookieMgr()](https://github.com/microsoft/ApplicationInsights-JS/blob/master/shared/AppInsightsCore/src/JavaScriptSDK.Interfaces/ICookieMgr.ts).xxxxx

**Snippet usage notes**

The `getCookieMgr()` method, `core` and `appInsights` properties are only available AFTER the SDK has been successfully loaded and initialized.

So you will need to only call or access the manager from within the onInit() callback function (available in snippet (v5) or above) or after you know that the SDK has been loaded and initialized, otherwise you will cause an exception, unless you also perform an existence check of the property or function.

>**Additional Legacy snippet users for v2.6.0**
>
>If you are using a legacy snippet for your application (it is suggested that you upgrade), you will need to use the following options
>
>- appInsights.**core.**[getCookieMgr()](https://github.com/microsoft/ApplicationInsights-JS/blob/master/shared/AppInsightsCore/src/JavaScriptSDK.Interfaces/ICookieMgr.ts).xxxxx
>- appInsights.**appInsights.core.**[getCookieMgr()](https://github.com/microsoft/ApplicationInsights-JS/blob/master/shared/AppInsightsCore/src/JavaScriptSDK.Interfaces/ICookieMgr.ts).xxxxx
>- appInsights.**appInsightsNew.**[getCookieMgr()](https://github.com/microsoft/ApplicationInsights-JS/blob/master/shared/AppInsightsCore/src/JavaScriptSDK.Interfaces/ICookieMgr.ts).xxxxx

## Tree-Shaking Support and enhancements

As part of changes being introduced in version 2.6.0 we are deprecating and removing the *internal* usages of the static helper classes `CoreUtils`, `EventHelper`, `Util`, `UrlHelper`, `DateTimeUtils` and `ConnectionStringParser` to provide better support for tree-shaking algorithms so that unused code can be safely dropped when using NPM packages.

[See Tree-Shaking Recommendations](TreeShakingRecommendations.md)

## Single Page Applications

By default, this SDK will **not** handle state based route changing that occurs in single page applications. To enable automatic route change tracking for your single page application, you can add `enableAutoRouteTracking: true` to your setup configuration.

Currently, we support a separate [React plugin](#available-extensions-for-the-sdk) which you can initialize with this SDK. It will also accomplish route change tracking for you, as well as collect [other React specific telemetry](https://github.com/microsoft/applicationinsights-react-js).

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


| Extensions    | NPM Version 
|---------------|-------------
| [Angular](https://github.com/microsoft/applicationinsights-angularplugin-js) | [![npm version](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-angularplugin-js.svg)](https://www.npmjs.com/package/@microsoft/applicationinsights-angularplugin-js)
| [React](https://github.com/microsoft/applicationinsights-react-js) | [![npm version](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-react-js.svg)](https://www.npmjs.com/package/@microsoft/applicationinsights-react-js)
| [React Native](https://github.com/microsoft/applicationinsights-react-native) | [![npm version](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-react-native.svg)](https://www.npmjs.com/package/@microsoft/applicationinsights-react-native)

## Upgrading from the old Version of Application Insights

Breaking changes in the SDK V2 version:
- To allow for better API signatures, some of the apis such as trackPageView, trackException have been updated.
- ES3 (IE8) compatibility, while running in IE8 or lower versions of the browser is not an officially supported scenario we are working to maintain ES3 level compatibility to ensure that the SDK will not cause any unexpected failures due to Javascript parsing error. See [ES3/IE8 Compatibility](#es3ie8-compatibility) below for further information.
- Telemetry envelope has field name and structure changes due to data schema updates.
- Moved `context.operation` to `context.telemetryTrace`. Some fields were also changed (`operation.id` --> `telemetryTrace.traceID`)
  - If you want to maunally refresh the current pageview id (e.g. in SPA apps) this can be done with `appInsights.context.telemetryTrace.traceID = generateW3CId()`

If you are using the current application insights PRODUCTION SDK (1.0.20) and want to see if the new SDK works in runtime, please update URL depending on your current SDK loading scenario:

**a)** Download via CDN scenario:
    Update code snippet that you currently use to point to the following URL:
    ```
    "https://js.monitor.azure.com/scripts/b/ai.2.min.js"
    ```

**b)** NPM scenario:
    Call downloadAndSetup to download full ApplicationInsights script from CDN and initialize it with connection string.

```ts
appInsights.downloadAndSetup({
    connectionString: "InstrumentationKey=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx",
    url: "https://js.monitor.azure.com/scripts/b/ai.2.min.js"
});
```

Test in internal environment to verify monitoring telemetry is working as expected. If all works, please update your api signatures appropriately to SDK V2 version and deploy in your production environments.

## Build a new extension for the SDK

The SDK supports the ability to include multiple extensions at runtime. In order to create a new extension, please implement the following interface:

[ITelemetryPlugin](https://github.com/microsoft/ApplicationInsights-JS/blob/master/shared/AppInsightsCore/src/JavaScriptSDK.Interfaces/ITelemetryPlugin.ts)

On initialization, config.extensions accepts an array of ITelemetryPlugin objects. These are hooked up and ITelemetryPlugin.processTelemetry() is chained based on priority of these plugins.
Please note that higher the priority, the later your processing code will be invoked. The SDK supports a plugin model and channels can also be plugged in similarly (advanced scenario).
Target scenarios for creating a brand new extension is to share a usage scenario that benefits multiple customers. Please follow guidelines

Here is the priority ranges available:

- Regular extension priority can be between 201 to 499.
- Priorty range < 201 is reserved.
- Priority range > 1000 is for channels (advanced scenario)

[BaseTelemetryPlugin](https://github.com/microsoft/ApplicationInsights-JS/blob/master/shared/AppInsightsCore/src/JavaScriptSDK/BaseTelemetryPlugin.ts)

To help with the creation of new extensions there is now a supported base class which can be used, this not only provides the common (boilerplate) implementations of common functions it will enable future plugins to automatically receive functional updates with the need to recode the plugins. it provides implementations for :-
* [ITelemetryPlugin.setNextPlugin()](https://github.com/microsoft/ApplicationInsights-JS/blob/master/shared/AppInsightsCore/src/JavaScriptSDK.Interfaces/ITelemetryPlugin.ts) implementation to continuing supporting existing (non-shared) execution of plugins, however, new plugins should use the new [IProcessTelemetryContext.processNext()](https://github.com/microsoft/ApplicationInsights-JS/blob/master/shared/AppInsightsCore/src/JavaScriptSDK.Interfaces/IProcessTelemetryContext.ts) moving forward as this support the creation of shared (singleton) plugins;
* New [ITelemetryPlugin.isInitialized()](https://github.com/microsoft/ApplicationInsights-JS/blob/master/shared/AppInsightsCore/src/JavaScriptSDK.Interfaces/ITelemetryPlugin.ts) implementation
* And several helper methods.
  * [processNext()](https://github.com/microsoft/ApplicationInsights-JS/blob/master/shared/AppInsightsCore/src/JavaScriptSDK/BaseTelemetryPlugin.ts), - to call the next plugin using the context or the _nextPlugin value
  * [diagLog()](https://github.com/microsoft/ApplicationInsights-JS/blob/master/shared/AppInsightsCore/src/JavaScriptSDK/BaseTelemetryPlugin.ts): - to access the current [IDiagnosticLogger](https://github.com/microsoft/ApplicationInsights-JS/blob/master/shared/AppInsightsCore/src/JavaScriptSDK.Interfaces/IDiagnosticLogger.ts) instance.

  If you are creating new extensions it is recommended that you extend from this base class so that your extension will automatically inherit any future enhancements that are added to the ITelemetryPlugin interface without it requiring updates.

Usage:

```ts
const customPluginInstance = new YourCustomPlugin()
const appInsights = new ApplicationInsights({ config: {
    connectionString: 'YOUR_CONNECTION_STRING_GOES_HERE',
    extensions: [customPluginInstance]
    // Other Configuration Options...
}});
appInsights.loadAppInsights();
```

ITelemetryPlugin has a simpler base type IPlugin that you can instantiate for initialization purposes when SDK loads.

## Build & Test this repo

1. Install all dependencies

    ```sh
    npm install
    npm install -g @microsoft/rush
    ```

2. Navigate to the root folder and update rush dependencies

    ```sh
    rush update
    ```

3. Build and test

    ```sh
    rush build
    npm run test
    ```

## Performance

Application Insights JS adds a negligible amount of load time to your website. By using the snippet, minimal components of the library are quickly loaded. In the meantime, the full script is downloaded in the background.

While the script downloads from the CDN, all tracking of your page is queued. Once the downloaded script finishes asynchronously initializing, all events that were queued are tracked. As a result, you will not lose any telemetry during the entire life cycle of your page. This setup process provides your page with a seamless analytics system, invisible to your users.

> Summary:
>
> - ![current npm version](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-web.svg)
> - ![gzip compressed size](https://img.badgesize.io/https://js.monitor.azure.com/scripts/b/ai.2.min.js.svg?compression=gzip)
> - **~15 ms** overall initialization time
> - **Zero** tracking missed during life cycle of page

## Module Formats

As part of packaging we produce [umd (Universal Module Definition)](https://github.com/umdjs/umd) modules using [rollupjs](https://www.rollupjs.org/guide/en/) which creates a wrapper that works for most users as it supports module loading and initialization with or without [RequireJS](https://requirejs.org/).

However, there are some cases where your code doesn't directly use [RequireJS](https://requirejs.org/) but it is loaded into the runtime environment before your code and the 1DS SDK, in these cases the [rollupjs](https://www.rollupjs.org/guide/en/) wrapper registers (defines) but does not initialize (execute) the SDK and instead waits for the first to call "require()" before the module is executed 

eg. ```var aiSdk = require("@microsoft/applicationinsights-web");```

This situation can also occur when the scripts are loaded lazily, late or dynamically (__and__ RequireJs is present) as this can cause a race condition between the SDK and RequireJS, which will cause the same issue if RequireJS is loaded first.

To support this usage pattern we also produce and publish to the CDN endpoints an [iife (Immediately Invoked Function Expression)](https://www.codeproject.com/Articles/5265230/Understanding-all-JavaScript-Module-Formats-and-To#iife-module-javascript-module-pattern) module so that the SDK is always executed and initialized.

To use these modules instead of using the default script name simply add ```.gbl``` before the ```.min.js``` eg. use ```.gbl.min.js``` instead of ```.min.js``` at the end of the script name.

These modules are also included in the NPM packages within the ```bundle``` folder.

Example (not complete) CDN paths for the current major version.

| Module | Default Module | IIFE Module
|--------|----------------|--------------
| [AISku<br/>(Main Sdk)](https://github.com/microsoft/ApplicationInsights-JS/tree/master/AISKU) | http://js.monitor.azure.com/scripts/b/ai.2.min.js | http://js.monitor.azure.com/scripts/b/ai.2.gbl.min.js
| [Click Analytics Extension](https://github.com/microsoft/ApplicationInsights-JS/tree/master/extensions/applicationinsights-clickanalytics-js) | http://js.monitor.azure.com/scripts/b/ext/ai.clck.2.min.js | http://js.monitor.azure.com/scripts/b/ext/ai.clck.2.gbl.min.js
| [Debug Plugin Extension](https://github.com/microsoft/ApplicationInsights-JS/tree/master/extensions/applicationinsights-debugplugin-js) | http://js.monitor.azure.com/scripts/b/ext/ai.dbg.2.min.js | http://js.monitor.azure.com/scripts/b/ext/ai.dbg.2.gbl.min.js
| [Perf Mark/Measure Manager Extension](https://github.com/microsoft/ApplicationInsights-JS/tree/master/extensions/applicationinsights-perfmarkmeasure-js) | http://js.monitor.azure.com/scripts/b/ext/ai.prfmm-mgr.2.min.js | http://js.monitor.azure.com/scripts/b/ext/ai.prfmm-mgr.2.gbl.min.js


As part of the CDN deployment and promoting new versions as the default we also provide both minor and explicit versions of all modules, so each published module will also include the following versions and formats. The example names are assuming version 3 as the current major version and 3.1 and the current minor.

| Major | Minor | Patch (Explicit) | Description
|------|--------|------------------|-----------------
| ```ai.2.min.js``` | ```ai.2.7.min.js``` | ```ai.2.7.2.min.js``` | Minified UMD version
| ```ai.2.gbl.min.js``` | ```ai.2.7.gbl.min.js``` | ```ai.2.7.2.gbl.min.js``` | Minified IIFE version

And the process of Promoting (or rolling back) a deployed version is simply a case of replacing the major and minor version of the script with the current explicit version

### CDN Debugging support

We support 2 basic approaches for debugging the SDK via the CDN hosted scripts

- Every Module includes a ```//# sourceMappingURL=xxxx``` at the end of the file and has the referenced map file uploaded to the CDN.
- We also publish unminified versions of every module, just drop the ```.min``` from the script name (eg. ```https://js.monitor.azure.com/scripts/b/ai.2.js```)

| Major | Minor | Patch (Explicit) | Description
|------|--------|------------------|-----------------
| ```ai.2.min.js.map``` | ```ai.2.7.min.js.map``` | ```ai.2.7.2.min.js.map``` | Map file for the UMD versions
| ```ai.2.gbl.min.js.map``` | ```ai.2.7.gbl.min.js.map``` | ```ai.2.7.2.gbl.min.js.map``` | Map file for the IIFE versions
| ```ai.2.js``` | ```ai.2.7.js``` | ```ai.2.7.2.js``` | Unminified UMD versions
| ```ai.2.gbl.js``` | ```ai.2.7.gbl.js``` | ```ai.2.7.2.gbl.js``` | Unminified IIFE versions

## Nightly Builds

To aid with testing and validation we also produce and publish nightly builds whenever there is a change from the previous build. These builds are published to the [NpmJs registry](https://www.npmjs.com/package/@microsoft/applicationinsights-web) and to the CDN automatically on a successful build / test pass.

This process also [tags the source code](https://github.com/microsoft/ApplicationInsights-JS/tags) so that we can track the specific changes included using a nightly build specific version number which is the format "nightly-yymm-##" eg. ```nightly-2112-08```

These nightly builds will not be retained indefinitely and should only be used for __pre-production__ testing and/or validation of any changes that have not yet been released.

### NPM

The NPM builds are tagged as "nightly" and can by downloaded using this as the version number ```npm install @microsoft/applicationinsights-web@nightly``` or using the nightly specific version number which is "nightly.yyyymm-###" (```npm install @microsoft/applicationinsights-web@2.7.3-nightly.2112-08```) where ## is the specific build number for the month (Note, slightly different version from the source code tag due to compatibility issues between the different systems).

### CDN

These nightly builds are also uploaded to a different path on the CDN  and explicitly have the ```-nightly``` added to the module name eg. ```/nightly/ai.2-nightly.min.js```, each nightly build is re-numbered assuming the next release will be a patch release. So if the last release was 2.7.2, then all nightly builds will be numbered 2.7.3-nightly.

So to access simply update the URL used when downloading the required module.

| Module | Nightly Build
|--------|----------------
| [AISku (Main Sdk)](https://github.com/microsoft/ApplicationInsights-JS/tree/master/AISKU) | http://js.monitor.azure.com/nightly/ai.2-nightly.min.js
| [Click Analytics Extension](https://github.com/microsoft/ApplicationInsights-JS/tree/master/extensions/applicationinsights-clickanalytics-js) | http://js.monitor.azure.com/nightly/ext/ai.clck.2-nightly.min.js
| [Debug Plugin Extension](https://github.com/microsoft/ApplicationInsights-JS/tree/master/extensions/applicationinsights-debugplugin-js) | http://js.monitor.azure.com/nightly/ext/ai.dbg.2-nightly.min.js
| [Perf Mark/Measure Manager Extension](https://github.com/microsoft/ApplicationInsights-JS/tree/master/extensions/applicationinsights-perfmarkmeasure-js) | http://js.monitor.azure.com/nightly/ext/ai.prfmm-mgr.2-nightly.min.js

As with the normal release process the nightly builds also include major, minor, explicit, IIFE (```.gbl```), *.map and unminified versions, these are primarily available for validating changes between builds.

| Module | CDN Path
|--------|----------------
| Major | http://js.monitor.azure.com/nightly/ai.2-nightly.min.js<br />http://js.monitor.azure.com/nightly/ai.2-nightly.gbl.min.js<br />http://js.monitor.azure.com/nightly/ai.2-nightly.js<br />http://js.monitor.azure.com/nightly/ai.2-nightly.gbl.js
| Minor | http://js.monitor.azure.com/nightly/ai.2.7-nightly.min.js<br />http://js.monitor.azure.com/nightly/ai.2.7-nightly.gbl.min.js<br />http://js.monitor.azure.com/nightly/ai.2.7-nightly.js<br />http://js.monitor.azure.com/nightly/ai.2.7-nightly.gbl.js
| Explicit | http://js.monitor.azure.com/nightly/ai.2.7.3-nightly.2112-08.min.js<br />http://js.monitor.azure.com/nightly/ai.2.7.3-nightly.2112-08.gbl.min.js<br />http://js.monitor.azure.com/nightly/ai.2.7.3-nightly.2112-08.js<br />http://js.monitor.azure.com/nightly/ai.2.7.3-nightly.2112-08.gbl.js

### Deployment process and alternate CDN endpoints

When a new release is deployed the following occurs as part of the release

- NPM packages are created and published to [NpmJs](https://www.npmjs.com/package/@microsoft/applicationinsights-web)
- The new explicit versioned files (eg. `ai.2.7.2.js`; `ai.2.7.2.min.js`; `ai.2.7.2.gbl.min.js`; `ai.2.7.2.min.js.map`; etc) are uploaded to all cdn endpoints URL's (public, next and beta - details below)
- We then go through a deployment process of "promoting" the new version to the "Major" (`ai.2.min.js`) and "Minor" (`ai.2.x.min.js`) release URL's to upgrade everyone to the newly released version based on the schedule listed below

| Endpoint | Url | Schedule
|----------|-------------|--------
| Beta | https://js.monitor.azure.com/beta/ai.2.min.js | Same day as the NPM release
| Next | https://js.monitor.azure.com/next/ai.2.min.js | One additional work day after the `beta` URL promotion.
| Public | https://js.monitor.azure.com/scripts/b/ai.2.min.js | Another One additional work day after the `next` URL promotion, (so 2 work days after initial release) unless this falls on the last work day of the week (eg. Friday) in which case it will be delayed until the first work day of the next work week.

The milestones for each release should include both the deployment plan (as it's about to be released) or the final release times as with [v2.7.2](https://github.com/microsoft/ApplicationInsights-JS/milestone/58)

It is expected that most users will be using the `Public` URL, however, it is also recommended that if you have a test or canary environment that you should use either the `beta` or `next` URL's so that you would be alerted first before any production users are impacted. If any issues are detected with the `beta` or `next` URL's as a new release is being deployed please raise a new [Issue](https://github.com/microsoft/ApplicationInsights-JS/issues) as soon as this is confirmed.

## Release Notes

- [Releases](https://github.com/microsoft/ApplicationInsights-JS/releases)
- [Changelist Notes](./RELEASES.md)

## Browser Support

![Chrome](https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png) | ![Firefox](https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png) | ![IE](https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png) | ![Opera](https://raw.githubusercontent.com/alrra/browser-logos/master/src/opera/opera_48x48.png) | ![Safari](https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png)
--- | --- | --- | --- | --- |
Latest ✔ | Latest ✔ | 9+ Full ✔<br>8- Compatible | Latest ✔ | Latest ✔ |

> Note: ES3/IE8 compatibility will be removed in the future v3.x.x releases (scheduled for mid-late 2022), so if you need to retain ES3 compatibility you will need to remain on the 2.x.x versions of the SDK or your runtime will need install polyfill's to your ES3 environment before loading / initializing the SDK.

### Build and Test this Project

Note: With the recent update to the latest version of rush ```npm run build``` fails with exit code 1 on successful build, hence the addition of ```--silent``` to the ```npm run build``` command.

```zsh
npm install -g @microsoft/rush
npm install
npm run build --silent
```

### Submitting a Change to this Project

```zsh
<...added some code...>
rush change
<...enter details>
git add <...your changes and rush change file...>
git commit -m "info about your change"
git push
```

## ES3/IE8 Compatibility

> Future releases of the SDK numbered v3.x.x will be removing ES3 (IE8) support, so if you need to retain ES3 compatibility for your environment you will need to remain on the 2.x.x versions of the SDK or your runtime will need install polyfill's to your ES3 environment before loading / initializing the SDK.

As an SDK there are numerous users which cannot control the browsers that their customers use. As such we need to ensure that this SDK continues to "work" and does not break the JS execution when loaded by an older browser. While it would be ideal to just not support IE8 and older generation (ES3) browsers there are numerous large customers/users that continue to require pages to "work" and as noted they may or cannot control which browser that their end users choose to use.

This does NOT mean that we will only support the lowest common set of features, just that we need to maintain ES3 code compatibility and when adding new features they will need to be added in a manner that would not break ES3 Javascript parsing and added as an optional feature.

As part of enabling ES3/IE8 support we have set the ```tsconfig.json``` to ES3 and ```uglify``` settings in ```rollup.config.js``` transformations to support ie8. This provides a first level of support which blocks anyone from adding unsupported ES3 features to the code and enables the generated javascript to be validily parsed in an ES3+ environment.

Ensuring that the generated code is compatible with ES3 is only the first step, JS parsers will still parse the code when an unsupport core function is used, it will just fail or throw an exception at runtime. Therefore, we also need to require/use polyfil implementations or helper functions to handle those scenarios.

It should also be noted that the overall goal of ES3/IE8 compatibility is the support at least the following 2 usage usage patterns. By supporting these two (2) basic use-cases, application/developers will be able to determine what browsers their users are using and whether they are experiencing any issues. As the SDK will report the data to the server, thus enabling the insights into whether they need to either fully support ES3/IE8 or provide some sort of browser upgrade notifications.

- track()
- trackException()

Beyond terminating support for older browsers that only support ES3, (which we cannot do at this point in time) we will endeavour to maintain support for the above two (2) use-cases.

### Browser must support JSON class

If your users are using a browser that does not support the [JSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON) Api you will need to include your own JSON polyfil implementation and this will need to be loaded prior to the application insights code.

This **includes** when running your application within an embedded browser, which on windows will default to using IE in IE7 doc mode -- which does NOT provide the JSON Api. 

For this case either provide a JSON polyfil or add the ["X-UA-Compatible"](https://docs.microsoft.com/en-us/openspecs/ie_standards/ms-iedoco/380e2488-f5eb-4457-a07a-0cb1b6e4b4b5?redirectedfrom=MSDN) meta tag and/or a header to your hosting page so that IE will provide the expected runtime environment.

```
 <meta http-equiv="X-UA-Compatible" content="IE=edge">
 
 <meta http-equiv="X-UA-Compatible" content="IE=11">
```

[More details on this are available here](https://docs.microsoft.com/en-us/archive/blogs/asiatech/ie11-migration-guide-understanding-browser-mode-document-mode-user-agent-and-x-ua-compatible)

### ES3/IE8 Packaging helper (ES3 rollup-plugin)

To ensure that the system conforms to the ES3 spec, by only using ES3 compatible code we have created a rollup plugin which has 2 functions

- es3Poly() finds and rewrite several commonly incompatible functions (such as Object.defineProperty; Object.getOwnPropertyDescriptor; Object.create) with inline polyfill functions that either call the real implementation or provide a basic implementation so that the scripts can be loaded and executed.
- es3Check() finds some of the known ES3 incompatible methods and will stop the packaging process if they are identified (and have not been polyfilled by es3Poly()), this provides a semi-automated validation of not just the application insights code, but also 3rd party libraries that it uses.
- importCheck() checks that the source code does not include imports from specific files or packages, this has been added due to packaging issues while using es3Poly causing imported type values to be renamed as "name$$1", which causes uglify() to missing renaming in some cases where the original source is "name$1". So this is being used to ensure that each source file only imports the values from packages or the original source file and not the main module export like "index". The importCheck can be placed before the nodeResolve() or after the es3Check() the recommendation is to fail fast be having this before the resolve. It should also be noted that only if the import is used will it appear in the final output (packagin), so it may exist in the original source but the packaging will not fail in this case.

To use these rollup plugins you simply need to add the following to your rollup.config.js

To import the module
```
import { es3Poly, es3Check, importCheck } from "@microsoft/applicationinsights-rollup-es3";
```

And then include as part of the packaging plugin list, if you use es3Poly()you should always include it before es3Check() 

```
    plugins: [
      replace({ ... }),
      importCheck({ exclude: [ "Index" ] }),
      nodeResolve({ browser: false, preferBuiltins: false }),
      es3Poly(),
      es3Check()
    ]
```

All plugins take an options which allows you to add additional checks and polyfill replacements. See the [Interfaces.ts]() for the definitions and [ES3Tokens.ts]() for the default values, which should provide the examples, if we have missed some common values that you require please feel free to raise an issue or provide a PR to add as the defaults.

It should be noted at this point that the both react and react-native extensions will NOT work in an ES3/IE8 environment out of the box, primarily because of the react code and their dependencies.
You *may* be able to workaround this limitation by providing and your own polyfill implementations for the unsupported methods.

### ES3/IE8 Features, Solutions, Workarounds and Polyfill style helper functions

> Note: We will be removing our internal ES3 / IE8 support polyfills as part of the next major release 3.x.x (scheduled for mid-late 2022), so if you need to retain ES3 compatibility you will need to remain on the 2.x.x versions of the SDK or your runtime will need install polyfill's to your ES3 environment __before__ loading / initializing the SDK.

As part of contributing to the project the following table highlights all of the currently known issues and the available solution/workaround. During PR and reviewing please ensure that you do not use the unsupported feature directly and instead use (or provide) the helper, solution or workaround.

This table does not attempt to include ALL of the ES3 unsupported features, just the currently known functions that where being used at the time or writing. You are welcome to contribute to provide additional helpers, workarounds or documentation of values that should not be used.

|  Feature  |  Description  |  Helper, Solution or Workaround |
|-----------|-----------------|-----------------|
| ```JSON.stringify(obj)``` | We have a hard requirement on JSON support, however, because of the size of adding a specific JSON polyfil just for our usage we decided not to include our own version. As such any user of this Api **MUST** include a JSON polyfil implementation, otherwise, the API simply will not work. | App/Site **MUST** provide their own JSON polyfil.
| ```Object.keys()``` | Not provided by ES3, use the helper  | ```CoreUtils.objKeys(obj: {}): string[]``` |
| ES5+ getters/setters<br>```Object.defineProperty(...)``` | Code will needs to created the individual getters/setters manually in a static initializer. See ```ChannelController.ts``` for example usage.<br>However, to ensure compatibility actual usage of any getters/setters internally in the primary SDK code is not permitted. They may (and should) be used in unit tests to ensure that if used they function as expected (in an ES5+ environment).| ``` CoreUtils.objDefineAccessors<T>(target:any, prop:string, getProp?:() => T, setProp?: (v:T) => void) : boolean``` |
| ```Object.create(protoObj)``` | Not supported in an ES3 environment, use the helper or direct construct the object with SON style notation (if possible) | ```CoreUtils.objCreate(obj:object):any``` |
| ```Object.create(protoObj, descriptorSet)``` | Not supported and no provided workaround/solution. | N/A |
| ```Object.defineProperties()``` | Not supported and no provided workaround/solution. | N/A |
| ```Object.getOwnPropertyNames(obj)``` | Not supported and no provided workaround/solution. | N/A |
| ```Object.getPrototypeOf(obj)``` | Not supported and no provided workaround/solution. | N/A |
| ```Object.getOwnPropertyDescriptor(obj)``` | Not supported and no provided workaround/solution. | N/A |
| ```Object.getOwnPropertyNames()``` | Not supported and no provided workaround/solution. | N/A |
| ```Object.preventExtensions(obj)``` | Not supported and no provided workaround/solution. | N/A |
| ```Object.isExtensible(obj)``` | Not supported and no provided workaround/solution. | N/A |
| ```Object.seal(obj)``` | Not supported and no provided workaround/solution. | N/A |
| ```Object.isSealed(obj)``` | Not supported and no provided workaround/solution. | N/A |
| ```Object.freeze(obj)``` | Not supported and no provided workaround/solution. | N/A |
| ```Object.isFrozen(obj)``` | Not supported and no provided workaround/solution. | N/A |
| ```Array.prototype.indexOf(...)``` | Use the provided helper | ```CoreUtils.arrIndexOf<T>(arr: T[], searchElement: T, fromIndex?: number): number``` |
| ```Array.prototype.lastIndexOf(...)``` | Not supported and no provided workaround/solution. | N/A |
| ```Array.prototype.every(...)``` | Not supported and no provided workaround/solution. | N/A |
| ```Array.prototype.some(...)``` | Not supported and no provided workaround/solution. | N/A |
| ```Array.prototype.forEach(...)``` | Use the provided helper. | ```arrForEach<T>(arr: T[], callbackfn: (value: T, index?: number, array?: T[]) => void, thisArg?: any):void``` |
| ```Array.prototype.map(...)``` | Use the provided helper. | ```CoreUtils.arrMap<T,R>(arr: T[], callbackfn: (value: T, index?: number, array?: T[]) => R, thisArg?: any): R[]``` |
| ```Array.prototype.filter(...)``` | Not supported and no provided workaround/solution. | N/A |
| ```Array.prototype.reduce(...)``` | Use the provided helper. | ```CoreUtils.arrReduce<T,R>(arr: T[], callbackfn: (previousValue: T|R, currentValue?: T, currentIndex?: number, array?: T[]) => R, initialValue?: R): R``` |
| ```Array.prototype.reduceRight(...)``` | Not supported and no provided workaround/solution. | N/A |
| ```Date.prototype.toISOString()``` | Use the provided helper | ```CoreUtils.toISOString(date: Date)``` |
| ```Date.now()``` | Use the provided helper | ```CoreUtils.dateNow()``` |
| ```performance.now()``` | Use the provided helper for the Performance Api now function. | ```CoreUtils.perfNow()``` |

## Contributing

Read our [contributing guide](./CONTRIBUTING.md) to learn about our development process, how to propose bugfixes and improvements, and how to build and test your changes to Application Insights.

## Data Collection

As this SDK is designed to enable applications to perform data collection which is sent to the Microsoft collection endpoints the following is required to identify our privacy statement.

The software may collect information about you and your use of the software and send it to Microsoft. Microsoft may use this information to provide services and improve our products and services. You may turn off the telemetry as described in the repository. There are also some features in the software that may enable you and Microsoft to collect data from users of your applications. If you use these features, you must comply with applicable law, including providing appropriate notices to users of your applications together with a copy of Microsoft’s privacy statement. Our privacy statement is located at https://go.microsoft.com/fwlink/?LinkID=824704. You can learn more about data collection and use in the help documentation and our privacy statement. Your use of the software operates as your consent to these practices.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft trademarks or logos is subject to and must follow [Microsoft’s Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general). Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship. Any use of third-party trademarks or logos are subject to those third-party’s policies.

## License

[MIT](LICENSE)
