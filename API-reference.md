### trackPageView

```ts
applicationInsights.trackPageView(pageView: IPageViewTelemetry)
```

The `IPageViewTelemetry` interface is below:

Parameter | Type | Description
---|---|---
`name?` | string | **Optional**<br>Name of the pageview. Defaults to the document `title`.
`uri?` | string | **Optional**<br>A relative or absolute URL that identifies the page or other item. Defaults to the window location.
`refUri?` | string | **Optional**<br>The URL of the previous page that sent the user to the current page.
`pageType?` | string | **Optional**<br>Page Type string. Describes how you classify this page, e.g. errorPage, formPage, etc.
`isLoggedIn?` | boolean | **Optional**<br>Whether or not the user is logged in
`properties?` | dictionary | **Optional**<br>Map of string to any: Additional data used to [filter pages](https://azure.microsoft.com/documentation/articles/app-insights-api-custom-events-metrics/#properties) in the portal. Defaults to empty.

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

`IMetricTelemetry` is described below

Parameter | Type | Description
---|---|---
`name` | string | **Required**<br>A string that identifies the metric. In the portal, you can select metrics for display by name.
`average` | number | **Required**<br>Either a single measurement, or the average of several measurements. Should be >=0 to be correctly displayed.
`sampleCount?` | number | **Optional**<br>Count of measurements represented by the average. Defaults to 1. Should be >=1.
`min?` | number | **Optional**<br>The smallest measurement in the sample. Defaults to the average. Should be >= 0.
`max?` | number | **Optional**<br>The largest measurement in the sample. Defaults to the average. Should be >= 0.
`properties?` | dictionary | **Optional**<br>Map of string to any: Additional data used to [filter pages](https://azure.microsoft.com/documentation/articles/app-insights-api-custom-events-metrics/#properties) in the portal. Defaults to empty.

### trackException

```ts
trackException(exception: IExceptionTelemtry)
```

Log an exception you have caught. Exceptions caught by the browser are also automatically logged.

`IExceptionTelemetry` is described below

Parameter | Type | Description
---|---|---
`exception` | [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) | **Required**<br>Error object
`severityLevel?` | [SeverityLevel (number)](https://github.com/microsoft/ApplicationInsights-JS/blob/master/legacy/JavaScript/JavaScriptSDK.Interfaces/Contracts/Generated/SeverityLevel.ts) | **Optional**<br>Severity of the message, ranging from verbose to critical
`properties?` | dictionary | **Optional**<br>Map of string to any: Additional data used to [filter pages](https://azure.microsoft.com/documentation/articles/app-insights-api-custom-events-metrics/#properties) in the portal. Defaults to empty.

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


The `ITraceTelemetry` interface is described below

Parameter | Type | Description
---|---|---
`message` | string | **Required**<br>Diagnostic data. Can be much longer than an event's name.
`severityLevel?` | [SeverityLevel (number)](https://github.com/microsoft/ApplicationInsights-JS/blob/master/legacy/JavaScript/JavaScriptSDK.Interfaces/Contracts/Generated/SeverityLevel.ts) | **Optional**<br>Severity of the message, ranging from verbose to critical
`properties?` | dictionary | **Optional**<br>Map of string to any: Additional data used to [filter pages](https://azure.microsoft.com/documentation/articles/app-insights-api-custom-events-metrics/#properties) in the portal. Defaults to empty.

In the portal, you can search on message content and [display individual trackTrace events](https://azure.microsoft.com/documentation/articles/app-insights-diagnostic-search/).
(Unlike `trackEvent`, you can't filter on the message content in the portal.)


### trackDependencyData

```ts
trackDependencyData(dependency: IDependencyTelemetry)
```

Log a dependency call (for instance: ajax)

The `IDependencyTelemetry` interface is described below

Parameter | Type | Description
---|---|---
`id` | string | **Required**<br>Unique id, this is used by the backend to correlate server requests.
`responseCode` | number | **Required**<br>Response code returned by the dependency request (e.g., `200` for a success).
`name?` | string | **Optional**<br>Name of the command initiated with this dependency call.
`duration?` | number | **Optional**<br>Elapsed time of request & reply
`success?` | boolean | **Optional**<br>Whether or not the request was successful or not (e.g., `responseCode` in the range 200-299)
`startTime?` | Date | **Optional**<br>Dependency start timestamp.
`correlationContext?` | string | **Optional**<br>correlation context from the server.
`type?` | string | **Optional**<br>Dependency type name.
`data?` | string | **Internal**<br>Command initiated by this dependency call. This is not a user settable field. `data` is automatically set based on the dependency name (if available). Please include additional custom properties as part of the `properties` value below.
`target?` | string | **Optional**<br>Target site of a dependency call.
`properties?` | dictionary | **Optional**<br>Map of string to any: Additional data used to [filter pages](https://azure.microsoft.com/documentation/articles/app-insights-api-custom-events-metrics/#properties) in the portal. Defaults to empty.

### trackEvent

```ts
applicationInsights.trackEvent(event: IEventTelemetry)
```

The `IEventTelemetry` interface is below:

Parameter | Type | Description
---|---|---
`name` | string | **Required**<br>An event name string.
`properties?` | dictionary | **Optional**<br>Map of string to any: Additional data used to [filter pages](https://azure.microsoft.com/documentation/articles/app-insights-api-custom-events-metrics/#properties) in the portal. Defaults to empty.
~~`measurements?`~~ | dictionary | **Optional**<br>Map of string to any: Additional data (metrics) used to [filter pages](https://azure.microsoft.com/documentation/articles/app-insights-api-custom-events-metrics/#properties) in the portal. Defaults to empty.

### flush

```ts
flush(async?: boolean = true)
```

Immediately send all queued telemetry. By default, it is sent async.

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

Adds a telemetry initializer to the collection. Telemetry initializers will be called one by one with the telemetryItem of type [`ITelemetryItem`](./shared/AppInsightsCore/src/JavaScriptSDK.Interfaces/ITelemetryItem.ts), in the order they were added,
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

The input argument to `addDependencyInitializer` is a callback that takes a [`IDependencyInitializerDetails`](./extensions/applicationinsights-dependencies-js/src/DependencyInitializer.ts) as an argument and returns a `boolean` or `void`. If returning `false`, the dependency event is not sent, else it proceeds to the next dependency initializer, if any, or is sent to processing pipeline to be sent to the telemetry collection endpoint.

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

A custom plugin can be loaded by the SDK through config.extensions. All plugins must implement [`ITelemetryPlugin`](./shared/AppInsightsCore/src/JavaScriptSDK.Interfaces/ITelemetryPlugin.ts) interface. These provide the capability of inspecting and updating data as it leaves the system, but also provides additional functionality to for one time initialization of extension state and pass in custom configuration through SKU configuration etc.

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
`device.type`  | Type of device
`device.id`	| unique ID
`device.oemName` |
`device.model` |
`device.network` | number  - IANA interface type
`device.resolution`  | screen res
`device.locale` | display language of the OS
`device.ip` |
`device.language` |
`device.os` |  OS running on the device
`device.osversion` |

### context.user

```ts
user: Context.User
```

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
