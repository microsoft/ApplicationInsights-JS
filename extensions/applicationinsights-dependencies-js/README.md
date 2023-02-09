# Microsoft Application Insights JavaScript SDK - Dependencies Plugin

[![Build Status](https://travis-ci.org/microsoft/ApplicationInsights-JS.svg?branch=master)](https://travis-ci.org/microsoft/ApplicationInsights-JS)
[![npm version](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-dependencies-js.svg)](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-dependencies-js)

Dependencies Plugin for the Application Insights Javascript SDK

## Configuration

[`ICorrelationConfig`](../../shared/AppInsightsCommon/src/Interfaces/ICorrelationConfig.ts)

## Functions

### Dependency Listeners

`addDependencyListener(dependencyListener: DependencyListenerFunction): IDependencyListenerHandler`

A [dependency listener](../../API-reference.md#adddependencylistener) is a callback function that **allows you to perform additional manipulation of the request details before the request is performed**.

This includes :-

- Complete access to either the XMLHttpRequest instance or the fetch API `input` and `init` arguments.
- Ability to get/set the properties used to generate the W3C `traceparent` header (`traceId`, `spanId,`traceFlags)
- Set values in the object context container for other listeners called after the current one, as well as this context object is also made available to all dependency initializers.

### Dependency Initializers

`addDependencyInitializer(dependencyInitializer: DependencyInitializerFunction): IDependencyInitializerHandler`

A [Dependency Initializer](../../API-reference.md#adddependencyinitializer)  is very similar to a [Telemetry Initializer](https://github.com/Microsoft/ApplicationInsights-JS#telemetry-initializers) in that it **allows you modify the contents of collected telemetry before being sent from the user's browser**. And you can also returning `false` to cause the event to not be emitted.

The differences between a telemetry initializer and a dependency initializer are :-

- A Dependency Initializer is called "before" the event is processed by the pipeline, as such it will NOT (yet) contain the automatically populated properties that are applied later;
- When a dependency initializer returns `false` to drop the event the event does NOT count against the `maxAjaxCallsPerView` as this blocks the event call from being tracked, and while returning `false` from a [Telemetry Initializer](https://github.com/Microsoft/ApplicationInsights-JS#telemetry-initializers) will also stop the event from being reported because this is further down the processing pipeline the dependency event IS counted against the `maxAjaxCallsPerView` limit.
- It has access to an optional "context" `{ [key: string]: any }` object that is also available to the Dependency Listeners. This allows a listener to add additional details to the context (before the XHR/fetch request is sent), and the initializer will be called after the request has completed.

### Track Dependency

`trackDependencyData(dependency:` [`IDependencyTelemetry`](../../API-reference.md#IDe)`, properties?: { [key: string]: any }): void`

[TrackDependencyData](../../API-reference.md###IDependencyTelemetry) function allows you to manually log a dependency call.

## Sample

A [sample](./example/) is provided to show how to filter, modify, block and disable dependency data.

### Sample Build

- locate to [sample folder](./example/) root
- run `tsc` to build the sample
- replace "YOUR_CONNECTION_STRING" in `index.html` with your connection string.
- open `index.html` in a running server

## Build

``` javascript
npm install -g grunt-cli
npm install
npm run build --silent
```

## Run unit tests

```javascript
npm run test
```

## Contributing

This project welcomes contributions and suggestions. Most contributions require you to
agree to a Contributor License Agreement (CLA) declaring that you have the right to,
and actually do, grant us the rights to use your contribution. For details, visit
<https://cla.microsoft.com>.

When you submit a pull request, a CLA-bot will automatically determine whether you need
to provide a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the
instructions provided by the bot. You will only need to do this once across all repositories using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/)
or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Data Collection

As this SDK is designed to enable applications to perform data collection which is sent to the Microsoft collection endpoints the following is required to identify our privacy statement.

The software may collect information about you and your use of the software and send it to Microsoft. Microsoft may use this information to provide services and improve our products and services. You may turn off the telemetry as described in the repository. There are also some features in the software that may enable you and Microsoft to collect data from users of your applications. If you use these features, you must comply with applicable law, including providing appropriate notices to users of your applications together with a copy of Microsoft’s privacy statement. Our privacy statement is located at <https://go.microsoft.com/fwlink/?LinkID=824704>. You can learn more about data collection and use in the help documentation and our privacy statement. Your use of the software operates as your consent to these practices.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft trademarks or logos is subject to and must follow [Microsoft’s Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general). Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship. Any use of third-party trademarks or logos are subject to those third-party’s policies.

## License

[MIT](LICENSE)
