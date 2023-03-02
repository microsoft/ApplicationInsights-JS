# Microsoft Application Insights JavaScript SDK - Dependencies Plugin

Dependencies Plugin for the Application Insights Javascript SDK

## Configuration

[`ICorrelationConfig`](../../shared/AppInsightsCommon/src/Interfaces/ICorrelationConfig.ts)

## Functions

### Dependency Listeners

`addDependencyListener(dependencyListener: DependencyListenerFunction): IDependencyListenerHandler`

A [dependency listener](../API-reference.md#adddependencylistener) is a callback function that **allows you to perform additional manipulation of the request details before the request is performed**.

This includes :-

- Complete access to either the XMLHttpRequest instance or the fetch API `input` and `init` arguments.
- Ability to get/set the properties used to generate the W3C `traceparent` header (`traceId`, `spanId,`traceFlags)
- Set values in the object context container for other listeners called after the current one, as well as this context object is also made available to all dependency initializers.

```javascript
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

### Dependency Initializers

`addDependencyInitializer(dependencyInitializer: DependencyInitializerFunction): IDependencyInitializerHandler`

A [Dependency Initializer](../API-reference.md#adddependencyinitializer)  is very similar to a [Telemetry Initializer](https://github.com/Microsoft/ApplicationInsights-JS#telemetry-initializers) in that it **allows you modify the contents of collected telemetry before being sent from the user's browser**. And you can also returning `false` to cause the event to not be emitted.

The differences between a telemetry initializer and a dependency initializer are :-

- A Dependency Initializer is called "before" the event is processed by the pipeline, as such it will NOT (yet) contain the automatically populated properties that are applied later;
- When a dependency initializer returns `false` to drop the event the event does NOT count against the `maxAjaxCallsPerView` as this blocks the event call from being tracked, and while returning `false` from a [Telemetry Initializer](https://github.com/Microsoft/ApplicationInsights-JS#telemetry-initializers) will also stop the event from being reported because this is further down the processing pipeline the dependency event IS counted against the `maxAjaxCallsPerView` limit.
- It has access to an optional "context" `{ [key: string]: any }` object that is also available to the Dependency Listeners. This allows a listener to add additional details to the context (before the XHR/fetch request is sent), and the initializer will be called after the request has completed.

```javascript
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

### Track Dependency

`trackDependencyData(dependency:` `IDependencyTelemetry``, properties?: { [key: string]: any }): void`

[TrackDependencyData](../API-reference.md#trackdependencydata) function allows you to manually log a dependency call.

```javascript
appInsights.trackDependencyData({absoluteUrl: 'some url', responseCode: 200, method: 'GET', id: 'some id'});
```

## Sample

A [sample](./../examples/dependency/README.md) is provided to show how to filter, modify, block and disable dependency data.
