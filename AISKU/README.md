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

### Use JS `snippet` and initialize dynamically (download full Application Insights script from CDN)  
Use this method for an MVC application. Get "code to monitor my web pages" from the Quick Start page, 
and insert it in the head of your web pages. Application Insights script will be downloaded 
from CDN or you can override the script hosting location by specifying `url` parameter in the config.   

```

<script type="text/javascript">
var sdkInstance="appInsightsSDK";window[sdkInstance]="appInsights";var aiName=window[sdkInstance],aisdk=window[aiName]||function(e){function n(e){i[e]=function(){var n=arguments;i.queue.push(function(){i[e].apply(i,n)})}}var i={config:e};i.initialize=!0;var t=document,a=window;setTimeout(function(){var n=t.createElement("script");n.src=e.url||"https://az416426.vo.msecnd.net/beta/ai.1.min.js",t.getElementsByTagName("script")[0].parentNode.appendChild(n)});try{i.cookie=t.cookie}catch(e){}i.queue=[];for(var s=["PageView","Exception","Trace","DependencyData","Metric"];s.length;)n("track"+s.pop());if(n("startTrackPage"),n("stopTrackPage"),e.extensionConfig&&e.extensionConfig.ApplicationInsightsAnalytics&&!1===e.extensionConfig.ApplicationInsightsAnalytics.disableExceptionTracking){n("_"+(s="onerror"));var o=a[s];a[s]=function(e,n,t,a,r){var c=o&&o(e,n,t,a,r);return!0!==c&&i["_"+s]({message:e,url:n,lineNumber:t,columnNumber:a,error:r}),c},e.extensionConfig.ApplicationInsightsAnalytics.autoExceptionInstrumented=!0}return i}
(
    {instrumentationKey:"INSTRUMENTATION_KEY"}
);
if(window[aiName]=aisdk,aisdk.queue&&0===aisdk.queue.length){var pageViewItem={name:document.title?document.title:"",uri:document.URL?document.URL:""};aisdk.trackPageView(pageViewItem)}
</script>
```

### trackPageView

```ts
/**
 * Logs that a page or other item was viewed. 
 * @param IPageViewTelemetry The string you used as the name in startTrackPage. Defaults to the  document title.
 * @param customProperties Additional data used to filter events and metrics. Defaults to empty.
 */
applicationInsights.trackPageView(pageView: IPageViewTelemetry, customProperties?: { [key: string]: any })
```

The IPageViewTelemetry interface is below: 

```ts
interface IPageViewTelemetry {
    /*
     * name String - The string you used as the name in startTrackPage.
     * Defaults to the document title.
     */
    name?: string;

    /*
     * uri  String - a relative or absolute URL that identifies the page or other item.
     * Defaults to the window location.
     */
    uri?: string;

    /*
     * refUri  String - the URL of the source page where current page is loaded from
     */
    refUri?: string;

    /*
     * pageType  String - page type
     */
    pageType?: string;

    /*
     * isLoggedIn - boolean is user logged in
     */
    isLoggedIn?: boolean;

    /*
     * property bag to contain an extension to domain properties - extension to Part B
     */
    pageTags?: { [key: string]: any };
}
```

### startTrackPage

```ts
startTrackPage(name?: string)
```
    
Starts the timer for tracking a page view. Use this instead of ```trackPageView``` if you want to control when the page view timer starts and stops, but don't want to calculate the duration yourself. This method doesn't send any telemetry. Call ```stopTrackPage``` to log the end of the page view and send the event.

Parameter | Description
---|---
`name` | The name used to identify the page in the portal. Defaults to the document title.

### stopTrackPage

```ts
stopTrackPage(name?: string, url?: string, customProperties?: { [name: string]: any; });
```

Stops the timer that was started by calling ```startTrackPage``` and sends the page view telemetry with the specified properties and measurements. The duration of the page view will be the time between calling ```startTrackPage``` and ```stopTrackPage```.

Parameter | Description
---|---
`name` | The name used to identify the page in the portal. Defaults to the document title.
`url` |  A relative or absolute URL that identifies the page or similar item. Defaults to the window location.
`customProperties?` | Map of string to string: Additional data used to [filter pages](https://azure.microsoft.com/documentation/articles/app-insights-api-custom-events-metrics/#properties) in the portal. Defaults to empty.

### trackMetric

```ts
trackMetric(metric: IMetricTelemetry, customProperties?: {[name: string]: any})
```

Log a positive numeric value that is not associated with a specific event. Typically used to send regular reports of performance indicators. 

Parameter | Description
---|---
`metric` | IMetricTelemetry interface type
`customProperties?` | Map of string to string: Additional data used to [filter events](https://azure.microsoft.com/documentation/articles/app-insights-api-custom-events-metrics/#properties) in the portal.

IMetricTelemetry is described below

Parameter | Description
---|---
`name` | A string that identifies the metric. In the portal, you can select metrics for display by name.
`average` | Either a single measurement, or the average of several measurements. Should be >=0 to be correctly displayed.
`sampleCount?` | Count of measurements represented by the average. Defaults to 1. Should be >=1.
`min?` | The smallest measurement in the sample. Defaults to the average. Should be >= 0.
`max?` | The largest measurement in the sample. Defaults to the average. Should be >= 0.

To send a single measurement, use just the first two parameters. If you take measurements very frequently, you can reduce the telemetry bandwidth by aggregating multiple measurements and sending the resulting average at intervals.

### trackException

```ts
trackException(exception: IExceptionTelemtry, customProperties?: {[key: string]: any})
```

Log an exception you have caught. (Exceptions caught by the browser are also logged.)

Parameter | Description
---|---
`exception` | An Error from a catch clause.  
`customProperties` | Map of string to string: Additional data used to [filter exceptions](https://azure.microsoft.com/documentation/articles/app-insights-api-custom-events-metrics/#properties) in the portal. Defaults to empty.

IExceptionTelemetry is described below
Parameter | Description
---|---
`error` | Error object
`severityLevel?` | Supported values: [SeverityLevel.ts](https://github.com/Microsoft/ApplicationInsights-JS/blob/master/JavaScript/JavaScriptSDK.Interfaces/Contracts/Generated/SeverityLevel.ts)



By default, uncaught browser exceptions are caught by the SDK and reported to the portal. To disable this behavior, insert the following line in the initialization snippet that you got from this page. You can't set this anywhere else:

```ts
})({
    instrumentationKey: "your instrumentation key",

    extensionConfig: {
        ApplicationInsightsAnalytics: {
            disableExceptionTracking: true
        }
    }
});
```

### trackTrace

```ts
trackTrace(trace: ITraceTelemetry, customProperties?: {[key: string]: any})
```

Log a diagnostic event such as entering or leaving a method.


The ITraceTelemetry interface is described below
 Parameter | Description
---|---
`trace` | ITraceTelemetry type
`properties` | Map of string to string: Additional data used to [filter exceptions](https://azure.microsoft.com/documentation/articles/app-insights-api-custom-events-metrics/#properties) in the portal. Defaults to empty.

 Parameter | Description
---|---
`message` | Diagnostic data. Can be much longer than a name.
`severityLevel` | Supported values: [SeverityLevel.ts](https://github.com/Microsoft/ApplicationInsights-JS/blob/master/JavaScript/JavaScriptSDK.Interfaces/Contracts/Generated/SeverityLevel.ts)

In the portal, you can search on message content and [display individual trackTrace events](https://azure.microsoft.com/documentation/articles/app-insights-diagnostic-search/).
(Unlike `trackEvent`, you can't filter on the message content in the portal.)

### track
To send custom events use `core.track`

```ts
core.track(envelope: ITelemetryItem);
```

Sends telemetry to the endpoint. `ITelemetryItem` is described below

```ts
interface ITelemetryItem {
    /**
     * Unique name of the telemetry item
     */ 
    name: string;

    /**
     * Timestamp when item was sent
     */ 
    timestamp?: Date;

    /**
     * Identifier of the resource that uniquely identifies which resource data is sent to
     */ 
    instrumentationKey?: string;

    /**
     * System properties with well defined extensions, documentation coming soon 
     */ 
    ctx?: {[key: string]: any};

    /**
     * Part A custom extensions
     */
    tags?: Tags[];

    /**
     * Telemetry type used for part B
     */
    baseType?: string;

    /**
     * Based on schema for part B
     */ 
    baseData?: { [key: string]: any };
    
    /**
     * Telemetry data used for Part C
     */
    data?: {
        [key: string]: any;
    },
}
```

### trackDependencyData

```ts
trackDependencyData(dependency: IDependencyTelemetry, customProperties?: {[key: string]: any}, systemProperties?: {[key: string]: any})
```
    
Log a dependency call (for instance: ajax)

 Parameter | Type | Description
---|---|---
`dependency` | IDependencyTelemetry |IDependencyTelemetry type
`customProperties?` | [key: string]: any | Additional data used to filter events and metrics. Defaults to empty.
`systemProperties?` | [key: string]: any | system properties that are added to the context; part A

The IDependencyTelemetry type is described below

Parameter | Type | Description
---|---|---
`absoluteUrl` | string | **Required**<br>Absolute url used to make the dependency request
`success` | boolean | **Required**<br>Whether or not the request was successful or not (e.g., `responseCode` in the range 200-299)
`resultCode` | number | **Required**<br>Response code returned by the dependency request (e.g., `200` for a success)
`commandName?` | string| **Optional**<br>Command used to make the dependency request
`duration?` | number | **Optional**<br>Elapsed time of request & reply
`method?` | string | **Optional**<br>Represents request verb (GET, POST, etc.)
`id` | string | <br>Unique id, this is used by the backend to correlate server requests.

### flush

```ts
flush()
```

Immediately send all queued telemetry. Synchronous.

You don't usually have to use this, as it happens automatically on window closing.

<a name="setAuthenticatedUserContext"></a>
### setAuthenticatedUserContext

```ts
setAuthenticatedUserContext(authenticatedUserId: string, accountId?: string, storeInCookie = false)
```

Set the authenticated user id and the account id. Use this when you have identified a specific signed-in user. Parameters must not contain spaces or ,;=|

The method will only set the `authenticatedUserId` and `accountId` for all events in the current page view. To set them for all events within the whole session, you should either call this method on every page view or set `storeInCookie = true`. 

 Parameter | Description
---|---
`authenticatedUserId` | An id that uniquely identifies a user of your app. No spaces, comma, semicolon, equals or vertical bar.
`accountId` | An optional account id, if your app groups users into accounts. No spaces, comma, semicolon, equals or vertical bar.
    
In the portal, this will add to the count of authenticated users. Authenticated users provide a more reliable count of the number of real users than the count of anonymous users.

The authenticated user id will be available as part of the context of the telemetry sent to the portal, so that you can filter and search on it. It will also be saved as a cookie and sent to the server, where the server SDK (if installed) will attach it to server telemetry.

### clearAuthenticatedUserContext

```ts
clearAuthenticatedUserContext ()
```

Clears the authenticated user id and the account id from the user context, and clears the associated cookie.


### config

```ts
config: IConfig
```

Values that control how the telemetry data is sent.

#### Core config
```ts
interface IConfiguration {

    /**
    * Instrumentation key of resource
    */
    instrumentationKey: string; // todo: update later for multi-tenant?

    /**
     * Polling interval (in ms) for internal logging queue
     */
    diagnosticLoggingInterval?: number;

    /**
     * Maximum number of iKey transmitted logging telemetry per page view
     */
    maxMessageLimit?: number;

    /**
     * Console logging level. All logs with a severity level higher
     * than the configured level will be printed to console. Otherwise 
     * they are suppressed. ie Level 2 will print both CRITICAL and
     * WARNING logs to console, level 1 prints only CRITICAL.
     * 
     * Note: Logs sent as telemetry to instrumentation key will also 
     * be logged to console if their severity meets the configured loggingConsoleLevel
     * 
     * 0: ALL console logging off
     * 1: logs to console: severity >= CRITICAL
     * 2: logs to console: severity >= WARNING
     */
    loggingLevelConsole?: number;

    /**
     * Telemtry logging level to instrumentation key. All logs with a severity
     * level higher than the configured level will sent as telemetry data to
     * the configured instrumentation key.
     * 
     * 0: ALL iKey logging off
     * 1: logs to iKey: severity >= CRITICAL
     * 2: logs to iKey: severity >= WARNING
     */
    loggingLevelTelemetry?: number

    /**
     * If enabled, uncaught exceptions will be thrown to help with debugging
     */
    enableDebugExceptions?: boolean;
    
    /**
    * Endpoint where telemetry data is sent
    */
    endpointUrl?: string;

    /**
    * Extension configs loaded in SDK
    */
    extensionConfig?: { [key: string]: any }; // extension configs;

    /**
     * Additional extensions that should be loaded by core at runtime
     */
    extensions?: ITelemetryPlugin[];

    /**
     * Custom channel queues for use with sending data to multiple channels in parallel
     */
    channels?: Array<IChannelControls[]>;
}

```

### config

```ts
config: IConfig
```

Values that control how the telemetry data is sent.

#### Core config
```ts
interface IConfiguration {

    /**
    * Instrumentation key of resource
    */
    instrumentationKey: string; // todo: update later for multi-tenant?

    /**
     * Polling interval (in ms) for internal logging queue
     */
    diagnosticLoggingInterval?: number;

    /**
     * Maximum number of iKey transmitted logging telemetry per page view
     */
    maxMessageLimit?: number;

    /**
     * Console logging level. All logs with a severity level higher
     * than the configured level will be printed to console. Otherwise 
     * they are suppressed. ie Level 2 will print both CRITICAL and
     * WARNING logs to console, level 1 prints only CRITICAL.
     * 
     * Note: Logs sent as telemetry to instrumentation key will also 
     * be logged to console if their severity meets the configured loggingConsoleLevel
     * 
     * 0: ALL console logging off
     * 1: logs to console: severity >= CRITICAL
     * 2: logs to console: severity >= WARNING
     */
    loggingLevelConsole?: number;

    /**
     * Telemtry logging level to instrumentation key. All logs with a severity
     * level higher than the configured level will sent as telemetry data to
     * the configured instrumentation key.
     * 
     * 0: ALL iKey logging off
     * 1: logs to iKey: severity >= CRITICAL
     * 2: logs to iKey: severity >= WARNING
     */
    loggingLevelTelemetry?: number

    /**
     * If enabled, uncaught exceptions will be thrown to help with debugging
     */
    enableDebugExceptions?: boolean;
    
    /**
    * Endpoint where telemetry data is sent
    */
    endpointUrl?: string;

    /**
    * Extension configs loaded in SDK
    */
    extensionConfig?: { [key: string]: any }; // extension configs;

    /**
     * Additional extensions that should be loaded by core at runtime
     */
    extensions?: ITelemetryPlugin[];

    /**
     * Custom channel queues for use with sending data to multiple channels in parallel
     */
    channels?: Array<IChannelControls[]>;
}

```

Set these values in [the snippet](https://azure.microsoft.com/documentation/articles/app-insights-javascript/) that you insert in your web pages.
Look for this line, and add more items:

```ts
})({
    instrumentationKey: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
});
```

You can also read or write them dynamically:

```ts
appInsights.config.instrumentationKey = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
```

To modify the configuration of any extension, specify the extension's identifier in the `extensionConfig` interface member and set its value as an IConfig (not IConfiguration) object.
#### Example
```ts
var init = new Initialization({
    config: {
        instrumentationKey: 'YOUR INSTRUMENTATION KEY',
        extensionConfig: {
            'AppInsightsChannelPlugin': {
                maxBatchInterval: 5000
            }
        }
    }
});
this._ai = init.loadAppInsights();
```

#### Table of `extensionConfig` identifiers
Extension | Identifier
--- | ---
Dependencies | `'AjaxDependencyPlugin'`
Properties | `'AppInsightsPropertiesPlugin'`
Channel | `'AppInsightsChannelPlugin'`
Analytics | `'ApplicationInsightsAnalytics'`

<br><br>
Analytics Option | Type | Default |
---|---|---|
`autoTrackPageVisitTime` | `boolean` | `false` |
`isCookieUseDisabled` | `boolean` | `false` |
`isStorageUseDisabled` | `boolean` | `false` |
`sessionRenewalMs` | `number` | `1800000` |
`samplingPercentage` | `number` | `100` |
`cookieDomain` | `string` | `undefined` |
`isBrowserLinkTrackingEnabled` | `boolean` | `false` |
<!-- `appId` -->

<br><br>
Channel Option | Type | Default |
---|---|---|
`disableTelemetry` | `boolean` | `false` |
`endpointUrl` | `string` | `'https://dc.services.visualstudio.com/v2/track'` |
`emitLineDelmitedJson` | `boolean`| `false` |
`enableSessionStorageBuffer` | `boolean` | `true` |
`isRetryDisabled` | `boolean` | `false` |
`isBeaconApiDisabled` | `boolean` | `true` |
`maxBatchSizeInBytes` | `number` | `102400` |
`maxBatchInterval` | `number` | `15000` (milliseconds) |

<br><br>
Properties Option | Type | Default |
---|---|---|
instrumentationKey | `string` | n/a |
sessionRenewalMs | `number` | `1800000` |
sampleRate | `number` | `100` |
sessionExpirationMs | `number` | `86400000` |
cookieDomain | `string` | `undefined` |
isBrowserLinkTrackingEnabled | `boolean` | `false` |
<!-- TODO: appId -->

<br><br>
Dependencies Option | Type | Default |
---|---|---|
`maxAjaxCallsPerView` | `number` | `500` |
`disableAjaxTracking` | `boolean` | `false` |
`disableCorrelationHeaders` | `boolean` | `false` |
`correlationHeaderExcludedDomains` | `string[]` | `["\*.blob.core.windows.net","\*.blob.core.chinacloudapi.cn", "\*.blob.core.cloudapi.de", "\*.blob.core.usgovcloudapi.net"]`|
`enableCorsCorrelation` | `boolean` | `false` |
<!-- TODO: appId: -->

<!-- TODO: Specify which plugins have which IConfig options -->
#### Extensions config
```ts
interface IConfig {
    accountId: string;

    // A session is logged if the user is inactive for this time in milliseconds. Default 30 mins.
    sessionRenewalMs: number; 

    // A session is logged if it has continued for this time in milliseconds. Default 24h.
    sessionExpirationMs: number;

    // Default 100k
    maxBatchSizeInBytes: number;

    // Default 15s
    maxBatchInterval: number;

    // If true, debugging data is thrown as an exception by the logger. Default false.
    enableDebug: boolean;

    // If true, telemetry data is not collected or sent. Default false.
    disableTelemetry: boolean; 

    // If true, the SDK will log all internal errors (any severity) to the console. Default false
    verboseLogging: boolean;

    // Controls what percentage of events will be sent
    // Default 100. 
    samplingPercentage: number;

    // Default 10s
    diagnosticLogInterval: number;

    // If true, exceptions are not monitored. 
    disableExceptionTracking: boolean;

    // If true, ajax calls are not monitored.
    disableAjaxTracking: boolean;

    // If true, default behavior of trackPageView is changed to record end of page view duration interval when 
    // trackPageView is called. If false and no custom duration is provided to trackPageView, the page view
    // performance is calculated using the navigation timing API.
    overridePageViewDuration: boolean;

    // Default 500 - controls how many ajax calls will be monitored per page view.
    // Set to -1 to monitor all ajax calls on the page.
    maxAjaxCallsPerView: number;

    // If true, the SDK will not store or read any data from cookies.
    // Default: false
    isCookieUseDisabled: boolean;

    // Custom cookie domain. This is helpful if you want to share Application Insights cookies across subdomains.
    cookieDomain: string;

    // Default false. If true, flush method will not be called when onBeforeUnload event triggers.
    disableFlushOnBeforeUnload: boolean;

    // If true, the buffer with all unsent telemetry is stored in a session storage. The buffer is restored on page load.
    // The feature is enable by default starting with v0.23.0. 
    enableSessionStorageBuffer: boolean;

    // Is retry handler disabled. Default false.
    // If enabled, retry on 206 (partial success), 408 (timeout), 429 (too many requests), 500 (internal server error) and 503 (service unavailable).
    isRetryDisabled: boolean;

    // The url from where the JS SDK will be downloaded. 
    // Default 'https://az416426.vo.msecnd.net/scripts/a/ai.0.js'
    url: string;

    // If true, the SDK will not store or read any data from local and session storage.
    // Default: false
    isStorageUseDisabled: boolean;

    // If false, the SDK will add two headers ('Request-Id' and 'Request-Context') to all 
    // dependency requests to correlate them with corresponding requests on the server side.
    // Default false. 
    disableCorrelationHeaders: boolean;

    // If true, the SDK will send all telemetry using [Beacon API](https://www.w3.org/TR/beacon/)
    // When Beacon API is enabled, then SessionStorageBuffer cannot be used and maxBatchSizeInBytes is limit too 64kb
    // Default: true
    isBeaconApiDisabled: boolean;

    // Sets the sdk extension name. Only alphabetic characters are allowed. 
    // The extension name is added as a prefix to 'ai.internal.sdkVersion' tag (for instance 'ext_javascript:1.0.5')
    // Default: null
    sdkExtension: string;

    // If true, the SDK will track all [Browser Link](https://docs.microsoft.com/en-us/aspnet/core/client-side/using-browserlink) requests. 
    // Default: false
    isBrowserLinkTrackingEnabled: boolean;

    // If true, the SDK will add two headers ('Request-Id' and 'Request-Context') to all 
    // CORS requests to correlate outgoing AJAX dependencies with corresponding requests on the server side.
    // Default false. 
    enableCorsCorrelation: boolean;
}
```

## class TelemetryContext


### context.application

```ts
application: Context.Application
```

Details of the app you're monitoring.

```ts
 context.application.ver: string
 context.application.build : string
```
        
### context.device

```ts
device : Context.Device
```
    
 The device the app is running on.
 
    Property | Description
    ---|---
    device.type  | Type of device
    device.id	| unique ID
    device.oemName |
    device.model |
    device.network | number  - IANA interface type
    device.resolution  | screen res
    device.locale | display language of the OS
    device.ip |
    device.language |
    device.os |  OS running on the device
    device.osversion | 

### context.user

```ts
user: Context.User
```

Data about the current user. Users are identified by cookie, so one person can look like 
more than one user if they use different machines or browsers, or delete cookies.

Property | Description
---|---
`user.localId` | Unique, cookie-based user id, automatically assigned.
`user.authUserId` | Id set by your app using [`setAuthenticatedUserContext`](#setAuthenticatedUserContext) when the user signs in.

### context.session

```ts
session: Context.Session
```
    
The user session. A session represents a series of user actions. A session starts with a user action.
It ends at the last user activity when there is no more activity for sessionRenewalMs, or if it lasts longer than sessionExpirationMs.

Property | Description
---|---
`session.id` | Automatically assigned id
`session.isFirst` | Boolean. True if this is the first session for this user.
`session.acquisitionDate` | Number. The dateTime when this session was created.
`session.renewalDate` | Number. DateTime when telemetry was last sent with this session.


### context.location

```ts
location: Context.Location
```

Data from which the geographical location of the user's device can be guessed.

Property | Description
---|---
`location.ip` | IP address

### context.operation

```ts
operation: Context.Operation;
```
        
Represents the user request. Operation id is used to tie together related events in diagnostic search.

Property | Description
---|---
`id` | Unique id
`name` | 
`parentId` |
`rootId` |
`syntheticSource` | String identifying the bot or test agent.


### addTelemetryInitializer

```ts
public addTelemetryInitializer(telemetryInitializer: (item: ITelemetryItem) => boolean | void)
```

Adds a telemetry initializer to the collection. Telemetry initializers will be called one by one, in the order they were added,
before the telemetry item is pushed for sending.
If one of the telemetry initializers returns false then the telemetry item will not be sent.
If one of the telemetry initializers throws an error then the telemetry item will not be sent.

### Custom extension

A custom plugin can be loaded by the SDK through config.extensions. All plugins must implement ITelemetryPlugin interface. These provide the capability of inspecting and updating data as it leaves the system, but also provides additional functionality to for one time initialization of extension state and pass in custom configuration through SKU configuration etc.

```ts
interface ITelemetryPlugin {
    /**
    * Call back for telemetry processing before it is sent to next plugin for processing (needs to be invoked by caller)
    */
    processTelemetry: (env: ITelemetryItem) => void;

    /**
    * Extension name
    */
    identifier: string;

    /**
    * Set next extension for telemetry processing
    */
    setNextPlugin: (next: ITelemetryPlugin) => void;

    /**
    * Priority of the extension
    *
    * 1 - 100: customer plugins
    * 100 � 199: reserved for internal plugins.
    * > 200: channel plugins (that implement IChannelControls to send data to an endpoint)
    */
    priority: number;
}
```
