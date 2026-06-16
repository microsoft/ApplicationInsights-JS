### trackPageView

```ts
applicationInsights.trackPageView(pageView: IPageViewTelemetry)
```

The [`IPageViewTelemetry`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IPageViewTelemetry.html) interface is below:

Parameter | Type | Description
---|---|---
[`name?`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IPageViewTelemetry.html#name) | string | **Optional**<br>Name of the pageview. Defaults to the document `title`.
[`uri?`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IPageViewTelemetry.html#uri) | string | **Optional**<br>A relative or absolute URL that identifies the page or other item. Defaults to the window location.
[`refUri?`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IPageViewTelemetry.html#refUri) | string | **Optional**<br>The URL of the previous page that sent the user to the current page.
[`pageType?`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IPageViewTelemetry.html#pageType) | string | **Optional**<br>Page Type string. Describes how you classify this page, e.g. errorPage, formPage, etc.
[`isLoggedIn?`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IPageViewTelemetry.html#isLoggedIn) | boolean | **Optional**<br>Whether or not the user is logged in
[`properties?`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IPageViewTelemetry.html#properties) | dictionary | **Optional**<br>Map of string to any: Additional data used to [filter pages](https://azure.microsoft.com/documentation/articles/app-insights-api-custom-events-metrics/#properties) in the portal. Defaults to empty.

> *Note:* To send a custom duration (ms) of your pageview as an argument, it must be included in the `properties` named field. E.g `appInsights.trackPageView({ properties: { duration: 123.45 } });`.

### startTrackPage

```ts
startTrackPage(name?: string)
```

Starts the timer for tracking a page load time. Use this instead of `trackPageView` if you want to control when the page view timer starts and stops, but don't want to calculate the duration yourself. This method doesn't send any telemetry. Call `stopTrackPage` to log the end of the page view and send the event.

Parameter | Type | Description
---|---|---
`name?` | string | **Optional**<br>The name used to identify the page in the portal. Defaults to the document title.

### stopTrackPage

```ts
stopTrackPage(name?: string, url?: string);
```

Stops the timer that was started by calling `startTrackPage` and sends the pageview load time telemetry with the specified properties and measurements. The duration of the page view will be the time between calling `startTrackPage` and `stopTrackPage`.

Parameter | Type | Description
---|---|---
`name?` | string | **Optional**<br>The name used to identify the page in the portal. Defaults to the document title.
`url?` |  string | **Optional**<br>A relative or absolute URL that identifies the page or similar item. Defaults to the window location.

### trackMetric

```ts
trackMetric(metric: IMetricTelemetry)
```

Log a positive numeric value that is not associated with a specific event. Typically used to send regular reports of performance indicators.

To send a single measurement, use just the first two parameters. If you take measurements very frequently, you can reduce the telemetry bandwidth by aggregating multiple measurements and sending the resulting `average` and `sampleCount` at intervals.

[`IMetricTelemetry`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IMetricTelemetry.html) is described below

Parameter | Type | Description
---|---|---
[`name`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IMetricTelemetry.html#name) | string | **Required**<br>A string that identifies the metric. In the portal, you can select metrics for display by name.
[`average`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IMetricTelemetry.html#average) | number | **Required**<br>Either a single measurement, or the average of several measurements. Should be >=0 to be correctly displayed.
[`sampleCount?`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IMetricTelemetry.html#sampleCount) | number | **Optional**<br>Count of measurements represented by the average. Defaults to 1. Should be >=1.
[`min?`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IMetricTelemetry.html#min) | number | **Optional**<br>The smallest measurement in the sample. Defaults to the average. Should be >= 0.
[`max?`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IMetricTelemetry.html#max) | number | **Optional**<br>The largest measurement in the sample. Defaults to the average. Should be >= 0.
[`properties?`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IMetricTelemetry.html#properties) | dictionary | **Optional**<br>Map of string to any: Additional data used to [filter pages](https://azure.microsoft.com/documentation/articles/app-insights-api-custom-events-metrics/#properties) in the portal. Defaults to empty.

### trackException

```ts
trackException(exception: IExceptionTelemetry)
```

Log an exception you have caught. Exceptions caught by the browser are also automatically logged.

[`IExceptionTelemetry`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IExceptionTelemetry.html) is described below

Parameter | Type | Description
---|---|---
[`exception`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IExceptionTelemetry.html#exception) | [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) | **Required**<br>Error object
[`severityLevel?`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IExceptionTelemetry.html#severityLevel) | [SeverityLevel (number)](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-common/enums/eSeverityLevel.html) | **Optional**<br>Severity of the message, ranging from verbose to critical
[`properties?`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IExceptionTelemetry.html#properties) | dictionary | **Optional**<br>Map of string to any: Additional data used to [filter pages](https://azure.microsoft.com/documentation/articles/app-insights-api-custom-events-metrics/#properties) in the portal. Defaults to empty.

By default, uncaught browser exceptions are caught by the SDK and reported to the portal. To disable this behavior, insert the following line in the config section below your connection string:

```ts
{
  connectionString: "your connection string",
  disableExceptionTracking: true
}
```

### trackTrace

```ts
trackTrace(trace: ITraceTelemetry)
```

Log a diagnostic event such as entering or leaving a method.


The [`ITraceTelemetry`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/ITraceTelemetry.html) interface is described below

Parameter | Type | Description
---|---|---
[`message`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/ITraceTelemetry.html#message) | string | **Required**<br>Diagnostic data. Can be much longer than an event's name.
[`severityLevel?`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/ITraceTelemetry.html#severityLevel) | [SeverityLevel (number)](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-common/enums/eSeverityLevel.html) | **Optional**<br>Severity of the message, ranging from verbose to critical
[`properties?`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/ITraceTelemetry.html#properties) | dictionary | **Optional**<br>Map of string to any: Additional data used to [filter pages](https://azure.microsoft.com/documentation/articles/app-insights-api-custom-events-metrics/#properties) in the portal. Defaults to empty.

In the portal, you can search on message content and [display individual trackTrace events](https://azure.microsoft.com/documentation/articles/app-insights-diagnostic-search/).
(Unlike `trackEvent`, you can't filter on the message content in the portal.)


### trackDependencyData

```ts
trackDependencyData(dependency: IDependencyTelemetry)
```

Log a dependency call (for instance: ajax)

The [`IDependencyTelemetry`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IDependencyTelemetry.html) interface is described below

Parameter | Type | Description
---|---|---
[`id`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IDependencyTelemetry.html#id) | string | **Required**<br>Unique id, this is used by the backend to correlate server requests.
[`responseCode`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IDependencyTelemetry.html#responseCode) | number | **Required**<br>Response code returned by the dependency request (e.g., `200` for a success).
[`name?`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IDependencyTelemetry.html#name) | string | **Optional**<br>Name of the command initiated with this dependency call.
[`duration?`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IDependencyTelemetry.html#duration) | number | **Optional**<br>Elapsed time of request & reply
[`success?`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IDependencyTelemetry.html#success) | boolean | **Optional**<br>Whether or not the request was successful or not (e.g., `responseCode` in the range 200-299)
[`startTime?`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IDependencyTelemetry.html#startTime) | Date | **Optional**<br>Dependency start timestamp.
[`correlationContext?`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IDependencyTelemetry.html#correlationContext) | string | **Optional**<br>correlation context from the server.
[`type?`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IDependencyTelemetry.html#type) | string | **Optional**<br>Dependency type name.
[`data?`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IDependencyTelemetry.html#data) | string | **Internal**<br>Command initiated by this dependency call. This is not a user settable field. `data` is automatically set based on the dependency name (if available). Please include additional custom properties as part of the `properties` value below.
[`target?`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IDependencyTelemetry.html#target) | string | **Optional**<br>Target site of a dependency call.
[`properties?`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IDependencyTelemetry.html#properties) | dictionary | **Optional**<br>Map of string to any: Additional data used to [filter pages](https://azure.microsoft.com/documentation/articles/app-insights-api-custom-events-metrics/#properties) in the portal. Defaults to empty.

### trackEvent

```ts
applicationInsights.trackEvent(event: IEventTelemetry)
```

The [`IEventTelemetry`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IEventTelemetry.html) interface is below:

Parameter | Type | Description
---|---|---
[`name`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IEventTelemetry.html#name) | string | **Required**<br>An event name string.
[`properties?`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-web/interfaces/IEventTelemetry.html#properties) | dictionary | **Optional**<br>Map of string to any: Additional data used to [filter pages](https://azure.microsoft.com/documentation/articles/app-insights-api-custom-events-metrics/#properties) in the portal. Defaults to empty.
~~`measurements?`~~ | dictionary | **Optional**<br>Map of string to any: Additional data (metrics) used to [filter pages](https://azure.microsoft.com/documentation/articles/app-insights-api-custom-events-metrics/#properties) in the portal. Defaults to empty.

### flush

```ts
flush(isAsync?: boolean, callBack?: () => void): void | IPromise<void>
```

Immediately send all queued telemetry. By default, it is sent asynchronously.

- `isAsync` - Whether to send asynchronously. Defaults to `true`.
- `callBack` - Optional callback invoked when the flush completes. If provided, the method returns `void`.
- If `isAsync` is `true` and no `callBack` is provided, returns an `IPromise<void>` that resolves when the flush completes.

> *Note:* You don't have to use flush, as it is automatically called at an interval and when the user closes the window.

<a name="setAuthenticatedUserContext"></a>
### setAuthenticatedUserContext

```ts
setAuthenticatedUserContext(authenticatedUserId: string, accountId?: string, storeInCookie = false)
```

Set the authenticated user id and the account id. Use this when you have identified a specific signed-in user. Parameters must not contain spaces or ,;=|

The method will only set the `authenticatedUserId` and `accountId` for all events in the current page view. To set them for all events within the whole session, you should either call this method on every page view or set `storeInCookie = true`.

 Parameter | Type |Description
---|---|--
`authenticatedUserId` | string | **Required**<br>An id that uniquely identifies a user of your app. No spaces, comma, semicolon, equals or vertical bar.
`accountId?` | string | **Optional**<br>An optional account id, if your app groups users into accounts. No spaces, comma, semicolon, equals or vertical bar.

In the portal, this will add to the count of authenticated users. Authenticated users provide a more reliable count of the number of real users than the count of anonymous users.

The authenticated user id will be available as part of the context of the telemetry sent to the portal, so that you can filter and search on it. It will also be saved as a cookie and sent to the server, where the server SDK (if installed) will attach it to server telemetry.

### clearAuthenticatedUserContext

```ts
clearAuthenticatedUserContext ()
```

Clears the authenticated user id and the account id from the user context, and clears the associated cookie.


### addTelemetryInitializer

```ts
public addTelemetryInitializer(telemetryInitializer: (item: ITelemetryItem) => boolean | void)
```

Adds a telemetry initializer to the collection. Telemetry initializers will be called one by one with the telemetryItem of type [`ITelemetryItem`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ITelemetryItem.html), in the order they were added,
before the telemetry item is pushed for sending.
If one of the telemetry initializers returns false or throws an error, then the telemetry item will not be sent.

### addDependencyListener

```ts
public addDependencyListener(dependencyListener: (dependencyDetails: IDependencyListenerDetails) => void): IDependencyListenerHandler;

// Example Usage
let handler = appInsights.addDependencyListener((details) => {
    // You have complete access to the xhr instance
    // details.xhr: XMLHttpRequest;

    // Or if a fetch request you have complete access to the input and init objects
    // details.input: Request | string;
    // details.init: RequestInit;

    // Access or change the W3C traceId that will be added to the outbound request
    details.traceId = "";

    // Access or change the W3C spanId that will be added to the outbound request
    details.spanId = "";

    // Access or change the W3C traceflags that will be added to the outbound request
    details.traceFlags = 1;

    // Add additional context values (any) that can be used by other listeners and is
    // also passed to any dependency initializers
    details.context.someValue = 1234;
});

// [Optional] Remove the dependency initializer
handler.remove();
```

A dependency listener is a callback function that allows you to perform additional manipulation of the request details before the request is performed.

This includes :-

- Complete access to either the XMLHttpRequest instance or the fetch API `input` and `init` arguments.
- Ability to get/set the properties used to generate the W3C `traceparent` header (`traceId`, `spanId, `traceFlags)
- Set values in the object context container for other listeners called after the current one, as well as this context object is also made available to all dependency initializers.

### addDependencyInitializer

```ts
public addDependencyInitializer(dependencyInitializer: (item: IDependencyInitializerDetails) => boolean | void): IDependencyInitializerHandler

// Example Usage
let handler = appInsights.addDependencyInitializer((details) => {
    details.item.xxxx = "";   // item is the telemetry event "before" it's been processed

    // [Optional] To stop any event from being reported you can
    // return false;
});


// [Optional] Remove the dependency initializer
handler.remove();
```

A Dependency Initializer is very similar to a [Telemetry Initializer](https://github.com/Microsoft/ApplicationInsights-JS#telemetry-initializers) in that it allows you modify the contents of collected telemetry before being sent from the user's browser. And you can also returning `false` to cause the event to not be emitted.

The differences between a telemetry initializer and a dependency initializer are :-
- A Dependency Initializer is called "before" the event is processed by the pipeline, as such it will NOT (yet) contain the automatically populated properties that are applied later;
- When a dependency initializer returns `false` to drop the event the event does NOT count against the `maxAjaxCallsPerView` as this blocks the event call from being tracked, and while returning `false` from a [Telemetry Initializer](https://github.com/Microsoft/ApplicationInsights-JS#telemetry-initializers) will also stop the event from being reported because this is further down the processing pipeline the dependency event IS counted against the `maxAjaxCallsPerView` limit.
- It has access to an optional "context" `{ [key: string]: any }` object that is also available to the Dependency Listeners. This allows a listener to add additional details to the context (before the XHR/fetch request is sent), and the initializer will be called after the request has completed.

The input argument to `addDependencyInitializer` is a callback that takes a [`IDependencyInitializerDetails`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-dependencies-js/interfaces/IDependencyInitializerDetails.html) as an argument and returns a `boolean` or `void`. If returning `false`, the dependency event is not sent, else it proceeds to the next dependency initializer, if any, or is sent to processing pipeline to be sent to the telemetry collection endpoint.

### getSender

```ts
applicationInsights.getSender() => Sender
```

Get the sender to configure and set the custom headers when using a custom endpoint.

### addHeader

```ts
public addHeader(name: string, value: string)
```

Add header to request.

### Custom extension

A custom plugin can be loaded by the SDK through config.extensions. All plugins must implement [`ITelemetryPlugin`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ITelemetryPlugin.html) interface. These provide the capability of inspecting and updating data as it leaves the system, but also provides additional functionality to for one time initialization of extension state and pass in custom configuration through SKU configuration etc.

## [`ITelemetryContext`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ITelemetryContext.html)

### context.application

```ts
application: IApplication
```

Details of the app you're monitoring. See [`IApplication`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IApplication.html).

Property | Type | Description
---|---|---
[`application.ver`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IApplication.html#ver) | string | Application version
[`application.build`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IApplication.html#build) | string | Application build

### context.device

```ts
device: IDevice
```

The device the app is running on. See [`IDevice`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IDevice.html).

Property | Type | Description
---|---|---
[`device.id`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IDevice.html#id) | string | Unique ID
[`device.deviceClass`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IDevice.html#deviceClass) | string | Device class
[`device.model`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IDevice.html#model) | string | Device model
[`device.resolution`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IDevice.html#resolution) | string | Screen resolution
[`device.ip`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IDevice.html#ip) | string | IP address

### context.user

```ts
user: IUserContext
```

Data about the current user. Users are identified by cookie, so one person can look like
more than one user if they use different machines or browsers, or delete cookies. See [`IUserContext`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IUserContext.html).

Property | Type | Description
---|---|---
[`user.id`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IUserContext.html#id) | string | Unique, cookie-based user id, automatically assigned.
[`user.authenticatedId`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IUserContext.html#authenticatedId) | string | Id set by your app using [`setAuthenticatedUserContext`](#setAuthenticatedUserContext) when the user signs in.
[`user.accountId`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IUserContext.html#accountId) | string | Set by your app when the user signs in, if your app groups users into accounts.
[`user.accountAcquisitionDate`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IUserContext.html#accountAcquisitionDate) | string | Account acquisition date


### context.session

```ts
session: ISession
```

The user session. A session represents a series of user actions. A session starts with a user action.
It ends at the last user activity when there is no more activity for sessionRenewalMs, or if it lasts longer than sessionExpirationMs. See [`ISession`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ISession.html).

Property | Type | Description
---|---|---
[`session.id`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ISession.html#id) | string | Automatically assigned id
[`session.acquisitionDate`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ISession.html#acquisitionDate) | number | The dateTime when this session was created.
[`session.renewalDate`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ISession.html#renewalDate) | number | DateTime when telemetry was last sent with this session.


### context.location

```ts
location: ILocation
```

Data from which the geographical location of the user's device can be guessed. See [`ILocation`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ILocation.html).

Property | Type | Description
---|---|---
[`location.ip`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ILocation.html#ip) | string | IP address

### context.telemetryTrace

> **Deprecated:** Use [`appInsights.getTraceCtx()`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ITraceHost.html#getTraceCtx) instead to get/set the current trace context. This returns an [`IDistributedTraceContext`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IDistributedTraceContext.html) which supports distributed tracing and allows the core to manage the trace context.

```ts
telemetryTrace: ITelemetryTrace
```

Represents the distributed trace context. See [`ITelemetryTrace`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ITelemetryTrace.html).

Property | Type | Description
---|---|---
[`telemetryTrace.traceID`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ITelemetryTrace.html#traceID) | string | Trace ID
[`telemetryTrace.parentID`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ITelemetryTrace.html#parentID) | string | Parent ID
[`telemetryTrace.traceFlags`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ITelemetryTrace.html#traceFlags) | number | W3C trace flags
[`telemetryTrace.name`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ITelemetryTrace.html#name) | string | Operation name

### Distributed Trace Context (Recommended)

Use [`getTraceCtx()`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ITraceHost.html#getTraceCtx) to access the current [`IDistributedTraceContext`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IDistributedTraceContext.html). This is the recommended replacement for the deprecated `telemetryTrace`.

```ts
// Get the current trace context - using the standard SKU (AISKU)
let traceCtx = appInsights.getTraceCtx();

// Or when using the core directly
// let traceCtx = appInsights.core.getTraceCtx();

// Read trace values
let traceId = traceCtx.traceId;
let spanId = traceCtx.spanId;
let traceFlags = traceCtx.traceFlags;
let pageName = traceCtx.pageName;

// Update trace values (updates current context only)
traceCtx.traceId = "new-trace-id";
traceCtx.spanId = "new-span-id";
traceCtx.traceFlags = 1;
traceCtx.pageName = "my-page";

// Replace the entire trace context
appInsights.core.setTraceCtx(newTraceCtx);
```

Property | Type | Description
---|---|---
[`traceId`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IDistributedTraceContext.html#traceId) | string | 32 lowercase hex character trace ID, shared across all spans in a trace
[`spanId`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IDistributedTraceContext.html#spanId) | string | 16 lowercase hex character span ID, unique identifier for this span
[`traceFlags`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IDistributedTraceContext.html#traceFlags) | number | W3C trace flags (8-bit bitmap), bit 0x01 indicates sampling
[`pageName`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IDistributedTraceContext.html#pageName) | string | Current page name
[`traceState`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IDistributedTraceContext.html#traceState) | IW3cTraceState | Vendor-specific trace state for cross-system correlation
[`parentCtx`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IDistributedTraceContext.html#parentCtx) | IDistributedTraceContext | Parent context (read-only)
[`isRemote`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IDistributedTraceContext.html#isRemote) | boolean | Whether context was propagated from a remote parent
