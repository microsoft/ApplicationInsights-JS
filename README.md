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

[![GitHub Workflow Status (main)](https://img.shields.io/github/actions/workflow/status/microsoft/ApplicationInsights-JS/ci.yml?branch=main)](https://github.com/microsoft/ApplicationInsights-JS/tree/main)
[![Build Status](https://dev.azure.com/mseng/AppInsights/_apis/build/status%2FAppInsights%20-%20DevTools%2F1DS%20JavaScript%20SDK%20web%20SKU%20(main%3B%20master)?branchName=main)](https://dev.azure.com/mseng/AppInsights/_build/latest?definitionId=8184&branchName=main)
[![npm version](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-web.svg)](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-web)
[![minified size size](https://js.monitor.azure.com/scripts/b/ai.3.min.js.svg)](https://js.monitor.azure.com/scripts/b/ai.3.min.js)
[![gzip size](https://js.monitor.azure.com/scripts/b/ai.3.min.js.gzip.svg)](https://js.monitor.azure.com/scripts/b/ai.3.min.js)

# Menu
- [Before Getting Started](#before-getting-started)
- [Release Versions](#release-versions)
- [Getting Started](#getting-started)
- [Basic Usage](#basic-usage)
- [Configuration](#configuration)
- <details>
  <summary>More</summary>
  
  - [Cookie Handling](#cookie-handling)
  - [Tree-Shaking Support and Enhancements](#tree-shaking-support-and-enhancements)
  - [Service Notification](#service-notification)
  - [Single Page Applications](#single-page-applications)
  - [Source Map Support](#source-map-support)
  - [Examples](#examples)
  - [Application Insights Web Basic](#application-insights-web-basic)
  - [Available Extensions for the SDK](#available-extensions-for-the-sdk)
  - [Build a New Extension for the SDK](#build-a-new-extension-for-the-sdk)
  - [Build & Test This Repo](#build-and-test-this-repo)
  - [Performance](#performance)
  - [Module Formats](#module-formats)
  - [Nightly Builds](#nightly-builds)
  - [Release Notes](#release-notes)
  - [Browser Support](#browser-support)
  - [Contributing](#contributing)
  - [Data Collection](#data-collection)
  - [Trademarks](#trademarks)
  - [License](#license)
  
  </details>

> # URGENT ACTION: Stop using az416426.vo.msecnd.net
>
> To avoid any global OUTAGE you MUST change ALL of your CDN usage from “https://az416426.vo.msecnd.net/scripts/..” to our primary CDN endpoint https://js.monitor.azure.com/scripts/...
>
> See/follow [Issue #2457](https://github.com/microsoft/ApplicationInsights-JS/issues/2457) for updated details
>
> We are currently investigating the available options on how we can avoid / migrate / mitigate this situation, but at this point it is **HIGHLY** likely that there will be either a temporary or permanent outage of this domain. As we currently have no known way to “migrate” this domain to a different CDN.

## Before Getting Started

This SDK is intended for browser environments and is not suitable for other environments, like Node.js applications.

For instrumenting a Node.js app, the recommended SDK is the [ApplicationInsights-node.js repository](https://github.com/microsoft/ApplicationInsights-node.js).

ES3 support has been removed from the latest version (v3.x), if required [see for ES3/IE8 Support](https://microsoft.github.io/ApplicationInsights-JS/es3_Support.html
)

## Release Versions

| Version | Details
|---------|--------------------------
| <b>[3.x](https://github.com/microsoft/ApplicationInsights-JS/tree/main)<br/><sub>(main)</sub> </b>| Current supported release from April '2023.<br/>Supports dynamic configuration changes/updates after initialization. Supports all features of v2 except with the known <b>[Breaking changes from previous versions](https://microsoft.github.io/ApplicationInsights-JS/upgrade/v3_BreakingChanges.html)</b> and does NOT support the previous v1.x compatible API proxy layer, it also removes support for ES3 / IE8. Minimum supported Runtime is now ES5 (IE9+).
| [2.x](https://github.com/microsoft/ApplicationInsights-JS/tree/master)<br/><sub>(master)</sub> | Feature freeze from March '2023, security fixes and critical bugs only.<br />Supports adding / removing extensions and full unloading/removal of the SDK after initialization. Last version to support ES3 (IE8+), also provides a v1.x compatible API proxy layer for upgrading from V1.x.
| [1.0.x](https://github.com/microsoft/ApplicationInsights-JS/tree/legacy-v1)<br/><sub>(legacy-v1)</sub> | No longer actively maintained -- please Upgrade. The documentation for `applicationinsights-js@1.0.x` has moved [here](https://github.com/microsoft/ApplicationInsights-JS/tree/master/legacy/README.md). If you are looking to upgrade to the new version of the SDK, please see the [Upgrade Guide](https://microsoft.github.io/ApplicationInsights-JS/upgrade/v2_UpgradeGuide.html). | Not actively maintained, please upgrade.


> :bulb: **Note**
> When multiple instances of Application Insights with different major version are active within a single session, errors may arise. For further details, please refer to the [version conflict doc](./versionConflict.md).

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

The current version of the snippet is version 8, the version is identified by the "sv:" in the script.

```html
<script type="text/javascript">
!(function (cfg){function e(){cfg.onInit&&cfg.onInit(n)}var x,w,D,t,E,n,C=window,O=document,b=C.location,q="script",I="ingestionendpoint",L="disableExceptionTracking",j="ai.device.";"instrumentationKey"[x="toLowerCase"](),w="crossOrigin",D="POST",t="appInsightsSDK",E=cfg.name||"appInsights",(cfg.name||C[t])&&(C[t]=E),n=C[E]||function(g){var f=!1,m=!1,h={initialize:!0,queue:[],sv:"8",version:2,config:g};function v(e,t){var n={},i="Browser";function a(e){e=""+e;return 1===e.length?"0"+e:e}return n[j+"id"]=i[x](),n[j+"type"]=i,n["ai.operation.name"]=b&&b.pathname||"_unknown_",n["ai.internal.sdkVersion"]="javascript:snippet_"+(h.sv||h.version),{time:(i=new Date).getUTCFullYear()+"-"+a(1+i.getUTCMonth())+"-"+a(i.getUTCDate())+"T"+a(i.getUTCHours())+":"+a(i.getUTCMinutes())+":"+a(i.getUTCSeconds())+"."+(i.getUTCMilliseconds()/1e3).toFixed(3).slice(2,5)+"Z",iKey:e,name:"Microsoft.ApplicationInsights."+e.replace(/-/g,"")+"."+t,sampleRate:100,tags:n,data:{baseData:{ver:2}},ver:undefined,seq:"1",aiDataContract:undefined}}var n,i,t,a,y=-1,T=0,S=["js.monitor.azure.com","js.cdn.applicationinsights.io","js.cdn.monitor.azure.com","js0.cdn.applicationinsights.io","js0.cdn.monitor.azure.com","js2.cdn.applicationinsights.io","js2.cdn.monitor.azure.com","az416426.vo.msecnd.net"],o=g.url||cfg.src,r=function(){return s(o,null)};function s(d,t){if((n=navigator)&&(~(n=(n.userAgent||"").toLowerCase()).indexOf("msie")||~n.indexOf("trident/"))&&~d.indexOf("ai.3")&&(d=d.replace(/(\/)(ai\.3\.)([^\d]*)$/,function(e,t,n){return t+"ai.2"+n})),!1!==cfg.cr)for(var e=0;e<S.length;e++)if(0<d.indexOf(S[e])){y=e;break}var n,i=function(e){var a,t,n,i,o,r,s,c,u,l;h.queue=[],m||(0<=y&&T+1<S.length?(a=(y+T+1)%S.length,p(d.replace(/^(.*\/\/)([\w\.]*)(\/.*)$/,function(e,t,n,i){return t+S[a]+i})),T+=1):(f=m=!0,s=d,!0!==cfg.dle&&(c=(t=function(){var e,t={},n=g.connectionString;if(n)for(var i=n.split(";"),a=0;a<i.length;a++){var o=i[a].split("=");2===o.length&&(t[o[0][x]()]=o[1])}return t[I]||(e=(n=t.endpointsuffix)?t.location:null,t[I]="https://"+(e?e+".":"")+"dc."+(n||"services.visualstudio.com")),t}()).instrumentationkey||g.instrumentationKey||"",t=(t=(t=t[I])&&"/"===t.slice(-1)?t.slice(0,-1):t)?t+"/v2/track":g.endpointUrl,t=g.userOverrideEndpointUrl||t,(n=[]).push((i="SDK LOAD Failure: Failed to load Application Insights SDK script (See stack for details)",o=s,u=t,(l=(r=v(c,"Exception")).data).baseType="ExceptionData",l.baseData.exceptions=[{typeName:"SDKLoadFailed",message:i.replace(/\./g,"-"),hasFullStack:!1,stack:i+"\nSnippet failed to load ["+o+"] -- Telemetry is disabled\nHelp Link: https://go.microsoft.com/fwlink/?linkid=2128109\nHost: "+(b&&b.pathname||"_unknown_")+"\nEndpoint: "+u,parsedStack:[]}],r)),n.push((l=s,i=t,(u=(o=v(c,"Message")).data).baseType="MessageData",(r=u.baseData).message='AI (Internal): 99 message:"'+("SDK LOAD Failure: Failed to load Application Insights SDK script (See stack for details) ("+l+")").replace(/\"/g,"")+'"',r.properties={endpoint:i},o)),s=n,c=t,JSON&&((u=C.fetch)&&!cfg.useXhr?u(c,{method:D,body:JSON.stringify(s),mode:"cors"}):XMLHttpRequest&&((l=new XMLHttpRequest).open(D,c),l.setRequestHeader("Content-type","application/json"),l.send(JSON.stringify(s)))))))},a=function(e,t){m||setTimeout(function(){!t&&h.core||i()},500),f=!1},p=function(e){var n=O.createElement(q),e=(n.src=e,t&&(n.integrity=t),n.setAttribute("data-ai-name",E),cfg[w]);return!e&&""!==e||"undefined"==n[w]||(n[w]=e),n.onload=a,n.onerror=i,n.onreadystatechange=function(e,t){"loaded"!==n.readyState&&"complete"!==n.readyState||a(0,t)},cfg.ld&&cfg.ld<0?O.getElementsByTagName("head")[0].appendChild(n):setTimeout(function(){O.getElementsByTagName(q)[0].parentNode.appendChild(n)},cfg.ld||0),n};p(d)}cfg.sri&&(n=o.match(/^((http[s]?:\/\/.*\/)\w+(\.\d+){1,5})\.(([\w]+\.){0,2}js)$/))&&6===n.length?(d="".concat(n[1],".integrity.json"),i="@".concat(n[4]),l=window.fetch,t=function(e){if(!e.ext||!e.ext[i]||!e.ext[i].file)throw Error("Error Loading JSON response");var t=e.ext[i].integrity||null;s(o=n[2]+e.ext[i].file,t)},l&&!cfg.useXhr?l(d,{method:"GET",mode:"cors"}).then(function(e){return e.json()["catch"](function(){return{}})}).then(t)["catch"](r):XMLHttpRequest&&((a=new XMLHttpRequest).open("GET",d),a.onreadystatechange=function(){if(a.readyState===XMLHttpRequest.DONE)if(200===a.status)try{t(JSON.parse(a.responseText))}catch(e){r()}else r()},a.send())):o&&r();try{h.cookie=O.cookie}catch(k){}function e(e){for(;e.length;)!function(t){h[t]=function(){var e=arguments;f||h.queue.push(function(){h[t].apply(h,e)})}}(e.pop())}var c,u,l="track",d="TrackPage",p="TrackEvent",l=(e([l+"Event",l+"PageView",l+"Exception",l+"Trace",l+"DependencyData",l+"Metric",l+"PageViewPerformance","start"+d,"stop"+d,"start"+p,"stop"+p,"addTelemetryInitializer","setAuthenticatedUserContext","clearAuthenticatedUserContext","flush"]),h.SeverityLevel={Verbose:0,Information:1,Warning:2,Error:3,Critical:4},(g.extensionConfig||{}).ApplicationInsightsAnalytics||{});return!0!==g[L]&&!0!==l[L]&&(e(["_"+(c="onerror")]),u=C[c],C[c]=function(e,t,n,i,a){var o=u&&u(e,t,n,i,a);return!0!==o&&h["_"+c]({message:e,url:t,lineNumber:n,columnNumber:i,error:a,evt:C.event}),o},g.autoExceptionInstrumented=!0),h}(cfg.cfg),(C[E]=n).queue&&0===n.queue.length?(n.queue.push(e),n.trackPageView({})):e();})({
    src: "https://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js",
    // name: "appInsights", // Global SDK Instance name defaults to "appInsights" when not supplied
    // ld: 0, // Defines the load delay (in ms) before attempting to load the sdk. -1 = block page load and add to head. (default) = 0ms load after timeout,
    // useXhr: 1, // Use XHR instead of fetch to report failures (if available),
    // dle: true, // Prevent the SDK from reporting load failure log
    crossOrigin: "anonymous", // When supplied this will add the provided value as the cross origin attribute on the script tag
    // onInit: null, // Once the application insights instance has loaded and initialized this callback function will be called with 1 argument -- the sdk instance (DO NOT ADD anything to the sdk.queue -- As they won't get called)
    // sri: false, // Custom optional value to specify whether fetching the snippet from integrity file and do integrity check 
    cfg: { // Application Insights Configuration
        connectionString: "YOUR_CONNECTION_STRING"
    }
});
</script>
```

> :bulb: **Note**
>
> 1. For readability and to reduce possible JavaScript errors, all of the possible configuration options are listed on a new line in snippet code above, if you don't want to change the value of a commented line it can be removed.
>
> 2. ConnectionString format should follow "InstrumentationKey=xxxx;...." If the string provided does not meet this format, the sdk load process would fail

#### Reporting Script load exceptions

This version of the snippet detects and reports an exception when loading the SDK from the CDN fails, this exception is reported to the Azure Monitor portal (under the failures &gt; exceptions &gt; browser), and provides visibility into failures of this type so that you are aware your application is not reporting telemetry (or other exceptions) as expected. This signal is an important measurement in understanding that you have lost telemetry because the SDK did not load or initialize, this provides clarity that you are missing the following telemetry:
- Under-reporting of how users are using (or trying to use) your site;
- Missing telemetry on how your end users are using your site;
- Missing JavaScript errors that could potentially be blocking your end users from successfully using your site.

For details on this exception see [SDK Load Failure](https://microsoft.github.io/ApplicationInsights-JS/SdkLoadFailure) page.

Reporting of this failure as an exception to the portal does not use the configuration option ```disableExceptionTracking``` from the application insights configuration and therefore if this failure occurs it will always be reported by the snippet, even when the window.onerror support is disabled.

Reporting of SDK load exceptions is specifically NOT supported on IE 8 (or less). This assists with reducing the minified size of the snippet by assuming that most environments are not exclusively IE 8 or less. If you have this requirement and you wish to receive these exceptions, you will need to either include a fetch poly fill or create you own snippet version that uses ```XDomainRequest``` instead of ```XMLHttpRequest```, it is recommended that you use the [provided snippet source code](https://github.com/microsoft/ApplicationInsights-JS/blob/main/AISKU/snippet/snippet.js) as a starting point.

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
| onInit | function(aiSdk) { ... } *[optional]* | This callback function which is called after the main SDK script has been successfully loaded and initialized from the CDN (based on the src value), it is passed a reference to the sdk instance that it is being called for and it is also called _before_ the first initial page view. If the SDK has already been loaded and initialized this callback will still be called. NOTE: As this callback is called during the processing of the sdk.queue array you CANNOT add any additional items to the queue as they will be ignored and dropped. (Added as part of snippet version 5 -- the sv:"#" value within the snippet script, the current version is 7)
| cfg | object **[required]** | The configuration passed to the Application Insights SDK during initialization.
| sri | boolean *[optional]* | Custom optional value to specify whether to fetch the snippet from an integrity file and perform an integrity check. When this option is used, the integrity file is loaded first, affecting the load order and script execution. Hence the ld option will be ignored. Additionally, if the page navigates away before the integrity file is loaded, some events may be lost.

#### Example using the snippet onInit callback

```html
<script type="text/javascript">
!function(T,l,y){<!-- Removed the Snippet code for brevity -->}(window,document,{
src: "https://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js",
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

> ## URGENT ACTION: Stop using az416426.vo.msecnd.net
>
> To avoid any global OUTAGE you MUST change ALL of your CDN usage from “https://az416426.vo.msecnd.net/scripts/..” to our primary CDN endpoint https://js.monitor.azure.com/scripts/...
>
> See/follow [Issue #2457](https://github.com/microsoft/ApplicationInsights-JS/issues/2457) for updated details
>
> We are currently investigating the available options on how we can avoid / migrate / mitigate this situation, but at this point it is **HIGHLY** likely that there will be either a temporary or permanent outage of this domain. As we currently have no known way to “migrate” this domain to a different CDN.

To help with global resiliency, we have added and updated our primary CDN endpoint (source URL) so that if required we can address any outages without the need for everyone to update the URL used by the Application Insights snippet within their application.

~~All active CDN endpoints contain all of the previous (and future) versions of the SDK and there is currently no plans to stop or block accessing the snippet from the previous (legacy/backup) URL.~~

Due to [Issue #2457](https://github.com/microsoft/ApplicationInsights-JS/issues/2457) we are now declaring that you MUST always use `js.monitor.azure.com` domain.


| State | CDN Endpoint | Description
|-------|--------------|--------------------
| Primary | https://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js | Provides additional resiliency, allowing us to redirect to a different CDN provider should there be an unexpected issue (if required).
| ~~Legacy/Backup~~<br />:exclamation: ~~Deprecated~~ DO NOT USE | ~~https://az416426.vo.msecnd.net/scripts/b/ai.2.min.js~~ | ~~Due to the legacy nature of this URL / Domain, __if there is an unexpected issue (outage) with this domain, your application will need to be updated and deployed to use the new URL__.<br />:exclamation: Due to #1813 this URL is now being classified as Deprecated and we will be actively making changes to the SDK to warnings in your telemetry if we detect this domain being used.~~<br/>Due to [Issue #2457](https://github.com/microsoft/ApplicationInsights-JS/issues/2457) we are now declaring that you MUST always use `js.monitor.azure.com` domain.

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
appInsights.stopTrackPage("pageName", null, {customePropertiesName: "some value"}, {customerMeasurementsName: 144});
appInsights.startTrackEvent("event");
appInsights.stopTrackEvent("event", null, {customePropertiesName: "some value"}, {customerMeasurementsName: 150});
appInsights.flush();
```

Custom properties can be included in your telemetry through the `properties` named argument. This can be done with *any* of the Track APIs except stopTrackPage and stopTrackEvent.

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

When using stopTrackPage and stopTrackEvent, you can pass in data categorized by types:

Strings: These should be included under the properties field.
Numbers: Add these under the measurements field.
Remember, the order of the properties and measurements should not be altered. You can achieve this using the following code structure:

```js
appInsights.startTrackEvent("event name"); 
appInsights.stopTrackEvent("event name", {
  stringProp1: 'string',
  stringProp2: {nested: "objects are okay too", key: "value"} // In this example, stringProp2 will be sent as: "stringProp2": "{\"nested\":\"objects are okay too\",\"key\":\"value\"}".
  },
  {numProp1: 3.15, numProp2: 90000}
)
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

### Advanced Setting Using Config/Extensions
- [How to add more details in my Exception Telemetry?](https://microsoft.github.io/ApplicationInsights-JS/exceptionTelemetry) 


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
| enableDebugExceptions | boolean | false | Removed from v3.x, Prior to v2.8.12 this was the only supported value and the documented `enableDebug` was incorrect, since v2.8.12 both `enableDebug` and `enableDebugExceptions` is supported.
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
| enableAjaxErrorStatusText | boolean | false | Default false. If true, include response error data text | boolean in dependency event on failed AJAX requests.
| enableAjaxPerfTracking | boolean | false | Default false. Flag to enable looking up and including additional browser window.performance timings in the reported ajax (XHR and fetch) reported metrics.
| maxAjaxPerfLookupAttempts | numeric | 3 | Defaults to 3. The maximum number of times to look for the window.performance timings (if available), this is required as not all browsers populate the window.performance before reporting the end of the XHR request and for fetch requests this is added after its complete.
| ajaxPerfLookupDelay | numeric | 25 | Defaults to 25ms. The amount of time to wait before re-attempting to find the windows.performance timings for an ajax request, time is in milliseconds and is passed directly to setTimeout().
| distributedTracingMode | numeric or `DistributedTracingModes` | `DistributedTracingModes.AI_AND_W3C` | Sets the distributed tracing mode. If AI_AND_W3C mode or W3C mode is set, W3C trace context headers (traceparent/tracestate) will be generated and included in all outgoing requests. AI_AND_W3C is provided for back-compatibility with any legacy Application Insights instrumented services.
| enableUnhandledPromiseRejectionTracking | boolean | false | If true, unhandled promise rejections will be autocollected and reported as a javascript error. When disableExceptionTracking is true (dont track exceptions) the config value will be ignored and unhandled promise rejections will not be reported.
| disableInstrumentationKeyValidation | boolean | false | If true, instrumentation key validation check is bypassed. Default value is false.
| enablePerfMgr | boolean | false | [Optional] When enabled (true) this will create local perfEvents for code that has been instrumented to emit perfEvents (via the doPerf() helper). This can be used to identify performance issues within the SDK based on your usage or optionally within your own instrumented code. [More details are available by the basic documentation](https://microsoft.github.io/ApplicationInsights-JS/PerformanceMonitoring). Since v2.5.7
| perfEvtsSendAll | boolean | false | [Optional] When _enablePerfMgr_ is enabled and the [IPerfManager](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IPerfManager.html) fires a [INotificationManager](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/INotificationManager.html).perfEvent() this flag determines whether an event is fired (and sent to all listeners) for all events (true) or only for 'parent' events (false &lt;default&gt;).<br />A parent [IPerfEvent](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IPerfEvent.html) is an event where no other IPerfEvent is still running at the point of this event being created and it's _parent_ property is not null or undefined. Since v2.5.7
| createPerfMgr | (core: IAppInsightsCore, notificationManager: INotificationManager) => IPerfManager | undefined | Callback function that will be called to create a the IPerfManager instance when required and ```enablePerfMgr``` is enabled, this enables you to override the default creation of a PerfManager() without needing to ```setPerfMgr()``` after initialization.
| idLength | numeric | 22 | [Optional] Identifies the default length used to generate new random session and user id's. Defaults to 22, previous default value was 5 (v2.5.8 or less), if you need to keep the previous maximum length you should set this value to 5.
| customHeaders | `[{header: string, value: string}]` | undefined | [Optional] The ability for the user to provide extra headers when using a custom endpoint. customHeaders will not be added on browser shutdown moment when beacon sender is used. And adding custom headers is not supported on IE9 or earlier.
| convertUndefined | `any` | undefined | [Optional] Provide user an option to convert undefined field to user defined value.
| eventsLimitInMem | number | 10000 | [Optional] The number of events that can be kept in memory before the SDK starts to drop events when not using Session Storage (the default).
| disableIkeyDeprecationMessage | boolean | true | [Optional]  Disable instrumentation Key deprecation error message. If true, error message will NOT be sent. **Note: instrumentation key support will end soon**, see aka.ms/IkeyMigrate for more details.
| bufferOverride <br/><sub>since 2.8.12</sub> | IStorageBuffer | undefined | [Optional] Identifies a simple interface to allow you to override the storage mechanism used for tracking unsent and unacknowledged events, when not provided defaults to using SessionStorage interface. You MUST supply both the `getItem` and `setItem` functions when defined.
| storagePrefix | string[] | undefined | [Optional] An optional value that will be added as name prefix for storage name. |
| featureOptIn (#feature)<br/><sub>since 3.0.3</sub> | IFeatureOptIn | undefined | [Optional]  Set Feature opt in details. |
| throttleMgrCfg <br/><sub>since 3.0.3</sub> | `{[key: number]: IThrottleMgrConfig}` | undefined | [Optional]  Set throttle mgr configuration by key. |
| retryCodes | number[] | undefined | Identifies the status codes that will cause event batches to be resent, when `null` or `undefined` the SDK will use it's defaults `[401, 408, 429, 500, 502, 503, 504]`. `403` was removed in version 3.1.1. |
| expCfg <br/><sub>since 3.3.1</sub>| [`IExceptionConfig`](https://github.com/microsoft/ApplicationInsights-JS/blob/main/shared/AppInsightsCommon/src/Interfaces/IExceptionTelemetry.ts) | undefined | Set additional configuration for exceptions, such as more scripts to include in the exception telemetry. |

### Feature

You can use the `featureOptIn` configuration to enable or customize specific SDK features.

#### Available Feature Flags

| Name        | Default | Description                                  | Note |
|-------------|---------|----------------------------------------------|------------|
| `zipPayload` | `none`*(version 3.3.7)  | Enables compression using the Compression API to zip telemetry payloads. |If this feature is turned on and the CompressionStream API is available, the payload will be compressed using the CompressionStream API. Compression will only occur if the event is asynchronous. For events like unloads, compression will not be applied. Note: if user set payloadPreprocessor, this zip compression will not be applied.|

* A default value of none means the SDK may automatically enable this feature in the future. To explicitly prevent this, set the feature to disable using FeatureOptInMode.disable.

#### How to Enable a Feature

To enable a feature such as `zipPayload`, set the `featureOptIn` property in the SDK configuration as shown below:

```javascript
const appInsights = new ApplicationInsights({
    config: {
        connectionString: "YOUR_CONNECTION_STRING",
        // Other configuration options...
        featureOptIn: {
            zipPayload: {
                mode: FeatureOptInMode.enable, // Set the opt-in status for the feature
                blockCdnCfg: false,             // Define whether to block changes from CDN config
            } as IFeatureOptInDetails
        }
    }
});
```
See [feature opt-in status](https://microsoft.github.io/ApplicationInsights-JS/WebConfig) for more details.


### ExtensionConfig

`extensionConfig` should be initialized under the specific extension rather than being defined in the root configuration. This allows for more granular configuration tailored to each extension's needs.

For instance, to configure the dependencies plugin, you would initialize it as follows:

```js
const appInsights = new ApplicationInsights({
    config: {
        connectionString: 'InstrumentationKey=YOUR_INSTRUMENTATION_KEY_GOES_HERE',
        extensionConfig: {
            [DependenciesPlugin.identifier]: {
                ignoreHeaders: []
            }
        }
    }
});
```

| Name | Type | Default | Extenstion | Description |
|------|------|---------|---------|-------------|
| ignoreHeaders | string[] | ["Authorization", "X-API-Key", "WWW-Authenticate"] | DependenciesPlugin | AJAX & Fetch request and response headers to be ignored in log data. To override or discard the default, add an array with all headers to be excluded or an empty array to the configuration. Need to be defined in depenedency plugin extension config, see more [here](./extensions/applicationinsights-dependencies-js/README.md)

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

If disabled during initialization via the `disableCookiesUsage` or `cookieCfg.enabled` configurations, you can now re-enable via the [ICookieMgr](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ICookieMgr.html) `setEnabled` function.

The instance based cookie management also replaces the previous CoreUtils global functions of `disableCookies()`, `setCookie(...)`, `getCookie(...)` and `deleteCookie(...)`. And to benefit from the tree-shaking enhancements also introduced as part of version 2.6.0 you should no longer uses the global functions.

### Simplified Usage of new instance Cookie Manager

**General Guidance**

When calling `getCookieMgr()` before the SDK has successfully initialized will return a temporary `ICookieMgr` instance that will have cookie support fully enabled, thus allowing the getting, setting and deleting of cookies. So unless you know that your configuration WILL ALLOW cookie usage you should delay accessing or using the cookie manager until after initialization.

- appInsights.[getCookieMgr()](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ICookieMgr.html).setEnabled(true/false)
- appInsights.[getCookieMgr()](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ICookieMgr.html).set("MyCookie", "thevalue");
- appInsights.[getCookieMgr()](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ICookieMgr.html).get("MyCookie");
- appInsights.[getCookieMgr()](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ICookieMgr.html).del("MyCookie");

> In v2.6.0 the `getCookieMgr()` is not directly available on the main entry points documented above for the snippet, NPM (`ApplicationInsights`) or React Plugin usages. As a workaround for this version you will need to access it via the `core` or `appInsights` properties as below (the `getCookieMgr()` will be available in later versions)
>
>- appInsights.**core.**[getCookieMgr()](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ICookieMgr.html).xxxxx
>- appInsights.**appInsights.**[getCookieMgr()](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ICookieMgr.html).xxxxx

**Snippet usage notes**

The `getCookieMgr()` method, `core` and `appInsights` properties are only available AFTER the SDK has been successfully loaded and initialized.

So you will need to only call or access the manager from within the onInit() callback function (available in snippet (v5) or above) or after you know that the SDK has been loaded and initialized, otherwise you will cause an exception, unless you also perform an existence check of the property or function.

>**Additional Legacy snippet users for v2.6.0**
>
>If you are using a legacy snippet for your application (it is suggested that you upgrade), you will need to use the following options
>
>- appInsights.**core.**[getCookieMgr()](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ICookieMgr.html).xxxxx
>- appInsights.**appInsights.core.**[getCookieMgr()](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ICookieMgr.html).xxxxx
>- appInsights.**appInsightsNew.**[getCookieMgr()](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ICookieMgr.html).xxxxx

## Tree-Shaking Support and enhancements

As part of changes being introduced in version 2.6.0 we are deprecating and removing the *internal* usages of the static helper classes `CoreUtils`, `EventHelper`, `Util`, `UrlHelper`, `DateTimeUtils` and `ConnectionStringParser` to provide better support for tree-shaking algorithms so that unused code can be safely dropped when using NPM packages.

[See Tree-Shaking Recommendations](TreeShakingRecommendations.md)

## Service Notification

As part of changes being introduced in version 3.0.3, we are intergrating [cfgSync plugin](https://github.com/microsoft/ApplicationInsights-JS/tree/main/extensions/applicationinsights-cfgsync-js) and [throttle manager](https://microsoft.github.io/ApplicationInsights-JS/ThrottleMgr) to AISKU.
For versions before 3.1.2, these components are disabled by default.

For versions after 3.1.2, these components are **turned on by default**.
See [feature opt-in status](https://microsoft.github.io/ApplicationInsights-JS/WebConfig) for more details.

For users behind a firewall, see [how to disable fetching from default CfgSync CDN](https://microsoft.github.io/ApplicationInsights-JS/WebConfig#basic-usage).

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

Click here for a [Type Error Fixed Guideline](https://microsoft.github.io/ApplicationInsights-JS/ExtensionErrorSteps)

## Build a new extension for the SDK

The SDK supports the ability to include multiple extensions at runtime. In order to create a new extension, please implement the following interface:

[ITelemetryPlugin](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ITelemetryPlugin.html)

On initialization, config.extensions accepts an array of ITelemetryPlugin objects. These are hooked up and ITelemetryPlugin.processTelemetry() is chained based on priority of these plugins.
Please note that higher the priority, the later your processing code will be invoked. The SDK supports a plugin model and channels can also be plugged in similarly (advanced scenario).
Target scenarios for creating a brand new extension is to share a usage scenario that benefits multiple customers. Please follow guidelines

Here is the priority ranges available:

- Regular extension priority can be between 201 to 499.
- Priorty range < 201 is reserved.
- Priority range > 1000 is for channels (advanced scenario)

[BaseTelemetryPlugin](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/classes/BaseTelemetryPlugin.html)

To help with the creation of new extensions there is now a supported base class which can be used, this not only provides the common (boilerplate) implementations of common functions it will enable future plugins to automatically receive functional updates with the need to recode the plugins. it provides implementations for :-
* [ITelemetryPlugin.setNextPlugin()](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ITelemetryPlugin.html) implementation to continuing supporting existing (non-shared) execution of plugins, however, new plugins should use the new [IProcessTelemetryContext.processNext()](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IProcessTelemetryContext.html) moving forward as this support the creation of shared (singleton) plugins;
* New [ITelemetryPlugin.isInitialized()](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ITelemetryPlugin.html) implementation
* And several helper methods.
  * [processNext()](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/classes/BaseTelemetryPlugin.html), - to call the next plugin using the context or the _nextPlugin value
  * [diagLog()](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/classes/BaseTelemetryPlugin.html): - to access the current [IDiagnosticLogger](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IDiagnosticLogger.html) instance.

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
> - ![gzip compressed size](https://js.monitor.azure.com/scripts/b/ai.3.min.js.gzip.svg)
> - **~15 ms** overall initialization time
> - **Zero** tracking missed during life cycle of page

## Module Formats

As part of packaging we produce [umd (Universal Module Definition)](https://github.com/umdjs/umd) modules using [rollupjs](https://www.rollupjs.org/guide/en/) which creates a wrapper that works for most users as it supports module loading and initialization with or without [RequireJS](https://requirejs.org/).

However, there are some cases where your code doesn't directly use [RequireJS](https://requirejs.org/) but it is loaded into the runtime environment before your code and the 1DS SDK, in these cases the [rollupjs](https://www.rollupjs.org/guide/en/) wrapper registers (defines) but does not initialize (execute) the SDK and instead waits for the first to call "require()" before the module is executed 

eg. ```var aiSdk = require("@microsoft/applicationinsights-web");```

This situation can also occur when the scripts are loaded lazily, late or dynamically (__and__ RequireJs is present) as this can cause a race condition between the SDK and RequireJS, which will cause the same issue if RequireJS is loaded first.

If users load Application Insights from the CDN via a script tag with require js running by other scripts, errors may occur. A typical error could be "Error: Mismatched anonymous define() module". The root reason is explained [here](https://requirejs.org/docs/errors.html#mismatch).

To support this usage pattern we also produce and publish to the CDN endpoints an [iife (Immediately Invoked Function Expression)](https://www.codeproject.com/Articles/5265230/Understanding-all-JavaScript-Module-Formats-and-To#iife-module-javascript-module-pattern) module so that the SDK is always executed and initialized.

To use these modules instead of using the default script name simply add ```.gbl``` before the ```.min.js``` eg. use ```.gbl.min.js``` instead of ```.min.js``` at the end of the script name. (Note: Since version 7, the gbl modules is set as default module to solve the potential [problem](#module-formats) caused by require.js)

These modules are also included in the NPM packages within the ```bundle``` folder.

Example (not complete) CDN paths for the current major version.

| Module | Default Module (Supports loading via requireJs) | IIFE Module
|--------|----------------|--------------
| [AISku<br/>(Main Sdk)](https://github.com/microsoft/ApplicationInsights-JS/tree/main/AISKU) | http://js.monitor.azure.com/scripts/b/ai.3.min.js<br/> http://js.monitor.azure.com/scripts/b/ai.2.min.js | http://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js <br />http://js.monitor.azure.com/scripts/b/ai.2.gbl.min.js
| [Click Analytics Extension](https://github.com/microsoft/ApplicationInsights-JS/tree/main/extensions/applicationinsights-clickanalytics-js) | http://js.monitor.azure.com/scripts/b/ext/ai.clck.3.min.js<br />http://js.monitor.azure.com/scripts/b/ext/ai.clck.2.min.js | http://js.monitor.azure.com/scripts/b/ext/ai.clck.3.gbl.min.js<br />http://js.monitor.azure.com/scripts/b/ext/ai.clck.2.gbl.min.js
| [Debug Plugin Extension](https://github.com/microsoft/ApplicationInsights-JS/tree/main/extensions/applicationinsights-debugplugin-js) | http://js.monitor.azure.com/scripts/b/ext/ai.dbg.3.min.js<br />http://js.monitor.azure.com/scripts/b/ext/ai.dbg.2.min.js | http://js.monitor.azure.com/scripts/b/ext/ai.dbg.3.gbl.min.js<br />http://js.monitor.azure.com/scripts/b/ext/ai.dbg.2.gbl.min.js
| [Perf Mark/Measure Manager Extension](https://github.com/microsoft/ApplicationInsights-JS/tree/main/extensions/applicationinsights-perfmarkmeasure-js) | http://js.monitor.azure.com/scripts/b/ext/ai.prfmm-mgr.3.min.js<br />http://js.monitor.azure.com/scripts/b/ext/ai.prfmm-mgr.2.min.js | http://js.monitor.azure.com/scripts/b/ext/ai.prfmm-mgr.3.gbl.min.js<br />http://js.monitor.azure.com/scripts/b/ext/ai.prfmm-mgr.2.gbl.min.js

As part of the CDN deployment and promoting new versions as the default we also provide both minor and explicit versions of all modules, so each published module will also include the following versions and formats. The example names are assuming version 3 as the current major version and 3.1 and the current minor.

| Major | Minor | Patch (Explicit) | Description
|------|--------|------------------|-----------------
| ```ai.3.min.js```<br />```ai.2.min.js``` | ```ai.3.0.min.js```<br />```ai.2.8.min.js``` | ```ai.3.0.2.min.js```<br />```ai.2.8.16.min.js``` | Minified UMD version
| ```ai.3.gbl.min.js```<br />```ai.2.gbl.min.js``` | ```ai.3.0.gbl.min.js```<br />```ai.2.8.gbl.min.js``` | ```ai.3.0.2.gbl.min.js```<br />```ai.2.8.16.gbl.min.js``` | Minified IIFE version<br/>(Recommended for v3.x)

And the process of Promoting (or rolling back) a deployed version is simply a case of replacing the major and minor version of the script with the current explicit version

### CDN Debugging support

We support 2 basic approaches for debugging the SDK via the CDN hosted scripts

- Every Module includes a ```//# sourceMappingURL=xxxx``` at the end of the file and has the referenced map file uploaded to the CDN.
- We also publish unminified versions of every module, just drop the ```.min``` from the script name (eg. ```https://js.monitor.azure.com/scripts/b/ai.3.gbl.js```)

| Major | Minor | Patch (Explicit) | Description
|------|--------|------------------|-----------------
| ```ai.3.min.js.map```<br />```ai.2.min.js.map``` | ```ai.3.0.min.js.map```<br />```ai.2.8.min.js.map``` | ```ai.3.0.2.min.js.map```<br />```ai.2.8.16.min.js.map``` | Map file for the UMD versions
| ```ai.3.gbl.min.js.map```<br />```ai.2.gbl.min.js.map``` | ```ai.3.0.gbl.min.js.map```<br />```ai.2.8.gbl.min.js.map``` | ```ai.3.0.2.gbl.min.js.map```<br />```ai.2.8.16.gbl.min.js.map``` | Map file for the IIFE versions
| ```ai.3.js```<br />```ai.2.js``` | ```ai.3.0.js```<br />```ai.2.8.js``` | ```ai.3.0.2.js```<br />```ai.2.8.16.js``` | Unminified UMD versions
| ```ai.3.gbl.js```<br />```ai.2.gbl.js``` | ```ai.3.0.gbl.js```<br />```ai.2.8.gbl.js``` | ```ai.3.0.2.gbl.js```<br />```ai.2.8.16.gbl.js``` | Unminified IIFE versions

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
| [AISku (Main Sdk)](https://github.com/microsoft/ApplicationInsights-JS/tree/main/AISKU) | http://js.monitor.azure.com/nightly/ai.2-nightly.min.js
| [Click Analytics Extension](https://github.com/microsoft/ApplicationInsights-JS/tree/main/extensions/applicationinsights-clickanalytics-js) | http://js.monitor.azure.com/nightly/ext/ai.clck.2-nightly.min.js
| [Debug Plugin Extension](https://github.com/microsoft/ApplicationInsights-JS/tree/main/extensions/applicationinsights-debugplugin-js) | http://js.monitor.azure.com/nightly/ext/ai.dbg.2-nightly.min.js
| [Perf Mark/Measure Manager Extension](https://github.com/microsoft/ApplicationInsights-JS/tree/main/extensions/applicationinsights-perfmarkmeasure-js) | http://js.monitor.azure.com/nightly/ext/ai.prfmm-mgr.2-nightly.min.js

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
- We then go through a deployment process of "promoting" the new version to the "Major" (`ai.3.gbl.min.js`) and "Minor" (`ai.3.x.gbl.min.js`) release URL's to upgrade everyone to the newly released version based on the schedule listed below

| Endpoint | Url | Schedule
|----------|-------------|--------
| Beta | https://js.monitor.azure.com/beta/ai.3.gbl.min.js | Same day as the NPM release
| Next | https://js.monitor.azure.com/next/ai.3.gbl.min.js | One additional work day after the `beta` URL promotion.
| Public | https://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js | Another One additional work day after the `next` URL promotion, (so 2 work days after initial release) unless this falls on the last work day of the week (eg. Friday) in which case it will be delayed until the first work day of the next work week.

The milestones for each release should include both the deployment plan (as it's about to be released) or the final release times as with [v2.7.2](https://github.com/microsoft/ApplicationInsights-JS/milestone/58)

It is expected that most users will be using the `Public` URL, however, it is also recommended that if you have a test or canary environment that you should use either the `beta` or `next` URL's so that you would be alerted first before any production users are impacted. If any issues are detected with the `beta` or `next` URL's as a new release is being deployed please raise a new [Issue](https://github.com/microsoft/ApplicationInsights-JS/issues) as soon as this is confirmed.

## Release Notes

- [Releases](https://github.com/microsoft/ApplicationInsights-JS/releases)
- [Changelist Notes](./RELEASES.md)

## Browser Support

- ES5 Compliant browsers

![Chrome](https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png) | ![Firefox](https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png) | ![IE](https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png) | ![Opera](https://raw.githubusercontent.com/alrra/browser-logos/master/src/opera/opera_48x48.png) | ![Safari](https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png)
--- | --- | --- | --- | --- |
Latest ✔ | Latest ✔ | 9+ Full ✔ | Latest ✔ | Latest ✔ |

> v3.x removed ES3 / IE8, if you need to retain ES3 (IE8) compatibility you will need to remain on the v2.x versions of the SDK. Which is now maintained on the old [master branch](https://github.com/Microsoft/ApplicationInsights-JS/tree/master)

### Submitting a Change to this Project

```zsh
<...added some code...>
rush change
<...enter details>
git add <...your changes and rush change file...>
git commit -m "info about your change"
git push
```

## Contributing

Read our [contributing guide](./CONTRIBUTING.md) to learn about our development process, how to propose bugfixes and improvements, and how to build and test your changes to Application Insights.

## Data Collection

As this SDK is designed to enable applications to perform data collection which is sent to the Microsoft collection endpoints the following is required to identify our privacy statement.

The software may collect information about you and your use of the software and send it to Microsoft. Microsoft may use this information to provide services and improve our products and services. You may turn off the telemetry as described in the repository. There are also some features in the software that may enable you and Microsoft to collect data from users of your applications. If you use these features, you must comply with applicable law, including providing appropriate notices to users of your applications together with a copy of Microsoft’s privacy statement. Our privacy statement is located at https://go.microsoft.com/fwlink/?LinkID=824704. You can learn more about data collection and use in the help documentation and our privacy statement. Your use of the software operates as your consent to these practices.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft trademarks or logos is subject to and must follow [Microsoft’s Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general). Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship. Any use of third-party trademarks or logos are subject to those third-party’s policies.

## License

[MIT](LICENSE)
