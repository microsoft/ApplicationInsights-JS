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
 

# Application Insights SDK JavaScript API

The JavaScript SDK is loaded into your web page when you set up [web page tracking](https://azure.microsoft.com/documentation/articles/app-insights-javascript/) in [Application Insights](https://azure.microsoft.com/services/application-insights/).
You add a short snippet of code to the page, which pulls in the rest of the SDK.

* [How to set up web page tracking](https://azure.microsoft.com/documentation/articles/app-insights-javascript/)
* [Overview of the API and examples](https://azure.microsoft.com/documentation/articles/app-insights-api-custom-events-metrics/)
* Non-minified built code: [ai.js](https://az416426.vo.msecnd.net/scripts/a/ai.js)

## class AppInsights

The shop front for the SDK, that sends telemetry to Application Insights.

In a web page where you have [set up web page tracking](https://azure.microsoft.com/documentation/articles/app-insights-javascript/), you can use the instance `appInsights`. For example:
    
    appInsights.trackPageView("page1");


### trackPageView

    trackPageView(name?: string, url?: string, properties?:{[string]:string}, measurements?: {[string]:number}, duration?: number)

Logs that a page or similar container was displayed to the user. 

Parameter | Description
---|---
`name` | The name used to identify the page in the portal. Defaults to the document title.
`url` |  A relative or absolute URL that identifies the page or similar item. Defaults to the window location.
`properties` | Map of string to string: Additional data used to [filter pages](https://azure.microsoft.com/documentation/articles/app-insights-api-custom-events-metrics/#properties) in the portal. Defaults to empty.
`measurements` | Map of string to number: Metrics associated with this page, displayed in Metrics Explorer on the portal. Defaults to empty.
`duration` | The number of milliseconds it took to load this page, displayed in Metrics Explorer on the portal. Defaults to empty. If empty, end of page view duration is recorded when browser page load event is called.

The standard snippet that you get from the portal includes a call to trackPageView. If you insert your own calls, consider
removing this default. An example where you might write your own calls is where your app is a single HTML page that has multiple
tabs, and you want to log a page view when each tab opens.

### startTrackPage

    startTrackPage(name?: string)
    
Starts the timer for tracking a page view. Use this instead of ```trackPageView``` if you want to control when the page view timer starts and stops, but don't want to calculate the duration yourself. This method doesn't send any telemetry. Call ```stopTrackPage``` to log the end of the page view and send the event.

Parameter | Description
---|---
`name` | The name used to identify the page in the portal. Defaults to the document title.

### stopTrackPage

    stopTrackPage(name?: string, url?: string, properties?: { [name: string]: string; }, measurements?: { [name: string]: number; });

Stops the timer that was started by calling ```startTrackPage``` and sends the page view telemetry with the specified properties and measurements. The duration of the page view will be the time between calling ```startTrackPage``` and ```stopTrackPage```.

Parameter | Description
---|---
`name` | The name used to identify the page in the portal. Defaults to the document title.
`url` |  A relative or absolute URL that identifies the page or similar item. Defaults to the window location.
`properties` | Map of string to string: Additional data used to [filter pages](https://azure.microsoft.com/documentation/articles/app-insights-api-custom-events-metrics/#properties) in the portal. Defaults to empty.
`measurements` | Map of string to number: Metrics associated with this page, displayed in Metrics Explorer on the portal. Defaults to empty.

### trackEvent

    trackEvent(name: string, properties?: {[string]:string}, measurements?: {[string]:number})

Log a user action or other occurrence.

Parameter | Description
---|---
 `name` | Identifies the event. Events with the same name are counted and can be charted in [Metric Explorer](https://azure.microsoft.com/documentation/articles/app-insights-metrics-explorer/).
`properties` | Map of string to string: Additional data used to [filter events](https://azure.microsoft.com/documentation/articles/app-insights-api-custom-events-metrics/#properties) in the portal. Defaults to empty.
`measurements` | Map of string to number: Metrics associated with this page, displayed in Metrics Explorer on the portal. Defaults to empty.

In the portal, you can select events by name, and [display charts that count them or display associated measurements](https://azure.microsoft.com/documentation/articles/app-insights-metrics-explorer/).

You can also search and [display individual events](https://azure.microsoft.com/documentation/articles/app-insights-diagnostic-search/).


### trackMetric

    trackMetric(name: string, average: number, sampleCount?: number, min?: number, max?: number, properties?: {[string]:string})

Log a positive numeric value that is not associated with a specific event. Typically used to send regular reports of performance indicators. 

Parameter | Description
---|---
`name` | A string that identifies the metric. In the portal, you can select metrics for display by name.
`average` | Either a single measurement, or the average of several measurements. Should be >=0 to be correctly displayed.
`sampleCount` | Count of measurements represented by the average. Defaults to 1. Should be >=1.
`min` | The smallest measurement in the sample. Defaults to the average. Should be >= 0.
`max` | The largest measurement in the sample. Defaults to the average. Should be >= 0.
`properties` | Map of string to string: Additional data used to [filter events](https://azure.microsoft.com/documentation/articles/app-insights-api-custom-events-metrics/#properties) in the portal.

In the portal, you can select metrics by name to [chart their values over time](https://azure.microsoft.com/documentation/articles/app-insights-metrics-explorer/). You can't search or view individual trackMetric calls.

To send a single measurement, use just the first two parameters. If you take measurements very frequently, you can reduce the telemetry bandwidth by aggregating multiple measurements and sending the resulting average at intervals.


### trackException

    trackException(exception: Error, handledAt?: string, properties?: {[string]:string}, measurements?: {[string]:number}, severityLevel?: AI.SeverityLevel)

Log an exception you have caught. (Exceptions caught by the browser are also logged.)

Parameter | Description
---|---
`exception` | An Error from a catch clause.  
`handledAt` | Defaults to "unhandled".
`properties` | Map of string to string: Additional data used to [filter exceptions](https://azure.microsoft.com/documentation/articles/app-insights-api-custom-events-metrics/#properties) in the portal. Defaults to empty.
`measurements` | Map of string to number: Metrics associated with this page, displayed in Metrics Explorer on the portal. Defaults to empty.
`severityLevel` | Supported values: [SeverityLevel.ts](https://github.com/Microsoft/ApplicationInsights-JS/blob/master/JavaScript/JavaScriptSDK.Interfaces/Contracts/Generated/SeverityLevel.ts)

In the portal, you can [search on exception type and view](https://azure.microsoft.com/documentation/articles/app-insights-diagnostic-search/) the type, message, and stack trace of individual instances. 

By default, uncaught browser exceptions are caught by the SDK and reported to the portal. To disable this behavior, insert the following line in the initialization snippet that you got from the portal. You can't set this anywhere else:

    })({
    instrumentationKey: "your instrumentation key",

    disableExceptionTracking: true
    });


### trackTrace

    trackTrace(message: string, properties?: {[string]:string}, severityLevel?: AI.SeverityLevel)

Log a diagnostic event such as entering or leaving a method.

 Parameter | Description
---|---
`message` | Diagnostic data. Can be much longer than a name.
`properties` | Map of string to string: Additional data used to [filter exceptions](https://azure.microsoft.com/documentation/articles/app-insights-api-custom-events-metrics/#properties) in the portal. Defaults to empty.
`severityLevel` | Supported values: [SeverityLevel.ts](https://github.com/Microsoft/ApplicationInsights-JS/blob/master/JavaScript/JavaScriptSDK.Interfaces/Contracts/Generated/SeverityLevel.ts)


In the portal, you can search on message content and [display individual trackTrace events](https://azure.microsoft.com/documentation/articles/app-insights-diagnostic-search/).
(Unlike `trackEvent`, you can't filter on the message content in the portal.)


### trackDependency

    trackDependency(id: string, method: string, absoluteUrl: string, pathName: string, totalTime: number, success: boolean, resultCode: number) {
    
Log a dependency call (for instance: ajax)

 Parameter | Description
---|---
`id` | Unique id, this is used by the backend to correlate server requests. Use `Util.newId()` to generate a unique Id.
`method` | Represents request verb (GET, POST, etc.)
`absoluteUrl` | Absolute url used to make the dependency request
`pathName` | Path part of the absolute url
`totalTime` | Total request time
`success` | Indicates if the request was successful
`resultCode` | Response code returned by the dependency request


### flush

    flush()

Immediately send all queued telemetry. Synchronous.

You don't usually have to use this, as it happens automatically on window closing.

<a name="setAuthenticatedUserContext"></a>
### setAuthenticatedUserContext

    setAuthenticatedUserContext(authenticatedUserId: string, accountId?: string)

Set the authenticated user id and the account id in this session. Use this when you have identified a specific signed-in user. Parameters must not contain spaces or ,;=|

 Parameter | Description
---|---
`authenticatedUserId` | An id that uniquely identifies a user of your app. No spaces, comma, semicolon, equals or vertical bar.
`accountId` | An optional account id, if your app groups users into accounts. No spaces, comma, semicolon, equals or vertical bar.
    
In the portal, this will add to the count of authenticated users. Authenticated users provide a more reliable count of the number of real users than the count of anonymous users.

The authenticated user id will be available as part of the context of the telemetry sent to the portal, so that you can filter and search on it. It will also be saved as a cookie and sent to the server, where the server SDK (if installed) will attach it to server telemetry.

### clearAuthenticatedUserContext

    clearAuthenticatedUserContext ()

Clears the authenticated user id and the account id from the user context, and clears the associated cookie.


### config

    config: IConfig

Values that control how the telemetry data is sent.

    interface IConfig {
        // The key of your Application Insights resource in Azure
        instrumentationKey: string;
        
        // The Application Insights server
        endpointUrl: string;
        
        accountId: string;
        
        // A session is logged if the user is inactive for this time in milliseconds. Default 30 mins.
        sessionRenewalMs: number; 
        
        // A session is logged if it has continued for this time in milliseconds. Default 24h.
        sessionExpirationMs: number;
        
        // Default 100k
        maxBatchSizeInBytes: number;
        
        // Default 15s
        maxBatchInterval: number;
        
        // If true, data is sent immediately and not batched.
        enableDebug: boolean;
                
        // If true, telemetry data is not collected or sent. Default false.
        disableTelemetry: boolean; 
        
        // If true, the SDK will log all internal errors (any severity) to the console. Default false
        verboseLogging: boolean;
        
        // Controls what percentage of events will be sent
        // Default 100. 
        samplingPercentage: boolean;
        
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
	
        // Default true. If false, the SDK will add two headers ('x-ms-request-root-id' and 'x-ms-request-id) 
        // to all dependency requests (within the same domain) to correlate them with corresponding requests on the server side. 
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
    }

Set these values in [the snippet](https://azure.microsoft.com/documentation/articles/app-insights-javascript/) that you insert in your web pages.
Look for this line, and add more items:

    })({
      instrumentationKey: "000...000"
    });

You can also read or write them dynamically:

    appInsights.config.disableTelemetry = true;

### context

    context: TelemetryContext

Information that the SDK attempts to extract from the environment about the device, location, and user. 




## class TelemetryContext


### context.application

    application: Context.Application

Details of the app you're monitoring.

     context.application.ver: string
     context.application.build : string

        
### context.device

    device : Context.Device
    
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

    user: Context.User

Data about the current user. Users are identified by cookie, so one person can look like 
more than one user if they use different machines or browsers, or delete cookies.

Property | Description
---|---
`user.id` | Unique, cookie-based user id, automatically assigned.
`user.authenticatedId` | Id set by your app using [`setAuthenticatedUserContext`](#setAuthenticatedUserContext) when the user signs in.
`user.accountId` | Set by your app when the user signs in, if your app groups users into accounts.
`user.accountAcquisitionDate` |
`user.agent` | 
`user.storeRegion` | 


### context.session

    session: Context.Session
    
The user session. A session represents a series of user actions. A session starts with a user action.
It ends at the last user activity when there is no more activity for sessionRenewalMs, or if it lasts longer than sessionExpirationMs.

Property | Description
---|---
`session.id` | Automatically assigned id
`session.isFirst` | Boolean. True if this is the first session for this user.
`session.acquisitionDate` | Number. The dateTime when this session was created.
`session.renewalDate` | Number. DateTime when telemetry was last sent with this session.


### context.location

   location: Context.Location

Data from which the geographical location of the user's device can be guessed.

Property | Description
---|---
`location.ip` | IP address

### context.operation

        operation: Context.Operation;
        
Represents the user request. Operation id is used to tie together related events in diagnostic search.

Property | Description
---|---
`id` | Unique id
`name` | 
`parentId` |
`rootId` |
`syntheticSource` | String identifying the bot or test agent.


### track

        public track(envelope: Telemetry.Common.Envelope) ;

Sends telemetry to the endpoint.

### addTelemetryInitializer

        public addTelemetryInitializer(telemetryInitializer: (envelope: Telemetry.Common.Envelope) => boolean | void)

Adds a telemetry initializer to the collection. Telemetry initializers will be called one by one, in the order they were added,
before the telemetry item is pushed for sending.
If one of the telemetry initializers returns false then the telemetry item will not be sent.
If one of the telemetry initializers throws an error then the telemetry item will not be sent.


#### Example

Add this code immediately after the initialization snippet that you get from the portal.

        ...
        window.appInsights = appInsights;
        
        // Add telemetry initializer
        appInsights.queue.push(function () {
            appInsights.context.addTelemetryInitializer(function (envelope) {
                var telemetryItem = envelope.data.baseData;

                // To check the telemetry item’s type:
                if (envelope.name === Microsoft.ApplicationInsights.Telemetry.PageView.envelopeType) {
                    // this statement removes url from all page view documents
                    telemetryItem.url = "URL CENSORED";
                }

                // To set custom properties:
                telemetryItem.properties = telemetryItem.properties || {};
                telemetryItem.properties["globalProperty"] = "boo";

                // To set custom metrics:
                telemetryItem.measurements = telemetryItem.measurements || {};
                telemetryItem.measurements["globalMetric"] = 100;
            });
        });
    // end of insertion
    
    appInsights.trackPageView();

## class Envelope

        public ver: number;
        public name: string;
        public time: string;
        public sampleRate: number;
        public seq: string;
        public iKey: string;
        public flags: number;
        public deviceId: string;
        public os: string;
        public osVer: string;
        public appId: string;
        public appVer: string;
        public userId: string;
        public tags: any;
        public data: Base;  // PageView, Event, Exception etc
        


## Links

* Read or contribute to the [code for the SDK](https://github.com/Microsoft/ApplicationInsights-js).
* [Overview of the API and examples](https://azure.microsoft.com/documentation/articles/app-insights-api-custom-events-metrics/)

