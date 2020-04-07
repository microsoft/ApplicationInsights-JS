# Releases

## 2.5.4

### Changelog

- #1242 Upgrading the tslib dependency to 1.11.1
- #1233 [BUG] Duplicate React dependency
- #1232 [BUG] window.appInsights.properties is marked private
  - Fix issue by always exposing window.appInsights.context
- #1240 [BUG] Telemetry correlation headers are not included for all fetch requests
- #1229 [BUG] Unable to include telemetry correlation headers
- #1227 SPFX - undefinedundefined is not defined
- #1221 npm @microsoft/applicationinsights-web: license information missing in package.json
- #1191 [BUG] ICustomProperties does not support setting values

## 2.5.3

### Changelog

- #1224 [BUG] When running in IE7/8 the app insights doesn't initialize and gets stuck in a loop (long running script)

## 2.5.2

### Changelog

- #1217 [BUG] App Insights fails when the XHR object is not extensible (or frozen)
- #1186 [BUG] App Insights initialization setting 'enableAjaxErrorStatusText is not working #1218

## 2.5.1

### Changelog

- #1210 [BUG] Typescript error when using @microsoft/applicationinsights-web 2.5.0 and "noImplicitAny"/"strict" option
- #1207 [BUG] The latest version 2.4.4 cannot connect front-end with back-end on the Application Map on Application Insights

## 2.5.0

### Changelog

- #1204 When a fetch polyfill is installed there reporting endpoint is also causing events to be sent
- #1202 ai_user and ai_session cookies not set #1203
- #1201 add to auto track exceptions in react native plugin
- #1199 Build is breaking when you do a "rush update --full --purge --recheck" due to tslib v1.11.0 update
- #1194 XHR/Fetch enhancement - add additional telemetry from window.performance #1195
- #1193 add sanitizer for operationName
- #1189 Add the option to specify the refUri with stopTrackPage #1190
- #1186 App Insights initialization setting 'enableAjaxErrorStatusText' is not working #1187

#### XHR/Fetch enhancement

Adds additional performance data derived from the window.performance.getEntries() for the fetch or XHR request.

Configuration options
| Name | Default | Description |
|------|---------|-------------|
| enableAjaxPerfTracking | false | Default false. Flag to enable looking up and including additional browser window.performance timings in the reported ajax (XHR and fetch) reported metrics. 
| maxAjaxPerfLookupAttempts | 3 | Defaults to 3. The maximum number of times to look for the window.performance timings (if available), this is required as not all browsers populate the window.performance before reporting the end of the XHR request and for fetch requests this is added after its complete.
| ajaxPerfLookupDelay | 25 | Defaults to 25ms. The amount of time to wait before re-attempting to find the windows.performance timings for an ajax request, time is in milliseconds and is passed directly to setTimeout().

#### Auto track exception React Native Plugin

This has been enabled by default in the updated version.
It can be disabled by adding the ```disableExceptionCollection``` config value with a value of true.

## 2.4.4

### Changelog

- #1182 Fix error TS2430: Interface 'Window' incorrectly extends interface 'WindowEventHandlers'
- #1185 Rollback namespace overwrite change

## 2.4.3

## Changelog

- Syntax error tools/rollup-es3/src/es3/Es3Tokens.ts #1179

## 2.4.2

### ES3 Support

An additional conversion was required for ES3 support as TypeScript was adding a getter for embedding a constant enum into the Common class.

### Changelog

 - #1177 Add additional checks and polyfil for TypeScript get translations for constants

## v 2.4.1...2.4.0

### ES3 Support

With this release the source files can be loaded in an ES3 environment (IE7/8) and send requests to the server. As part of this change you will now receive requests from users using an older browser, prior to this version users using an ES3 base browser will (most likely) have been getting a javascript error, which would have caused no data to be sent.

### Enable support for reusing plugins in multiple instances of AppInsights #1132

We have added upport to enable reusing the same plugin in different instances of AppInsights, owned by the same application (but using different Instrumentation keys) is required so that they can reuse a single Plugin instance for all instances.

This changes introduces a new [`IProcessTelemetryContext`](https://github.com/microsoft/ApplicationInsights-JS/blob/master/shared/AppInsightsCore/src/JavaScriptSDK/ProcessTelemetryContext.ts) interface that is passed to the processTelemetry() method so that the plugins can use the current request context for the event rather than the context during initialization.

To assist with creating plugins we have also introduced a base class that you can use for creating new plugins [BaseTelemetryPlugin](https://github.com/microsoft/ApplicationInsights-JS/blob/master/shared/AppInsightsCore/src/JavaScriptSDK/BaseTelemetryPlugin.ts), details are included on the [Readme](https://github.com/microsoft/ApplicationInsights-JS/blob/master/README.md)

### Changelog

- #1175 [BUG] Typescript build with 2.4.0 breaks #1173
- #1174 Legacy Manage SameSite Cookie Settings #1126
- #1172 Update SameSite logic to handle UserAgents that don't support the attribute
- #1169 Fixup Rollup ES3 plugin package.json
- #1167 Add better support for referencing global objects from a window and web workers
- #1164 add null check for sessionManager
- #1162 [BUG]AppInsights not working in IE7 #1142
- #1161 include response error data
- #1159 Export Common Telemetry classes in Snippet
- #1157 fix: only change SameSite when secure
- #1154 Queue events when track is called and not all extensions are initialized
- #1153 Do not clean telemetryInitializers during initialization
- #1150 Remove interface code from API reference and link
- #1135 fix: dont block corr on empty location host
- #1133 Enable support for reusing plugins in multiple instances of AppInsights #1132
- #1129 fix: console logging not honoring setting
- #1122 fix anchor link
- #1116 Move tslib to sku dependencies
- #1113 [Enhancement] AI is not catching all "Unload" dom events #1080

## v 2.3.1
### Changelog
- #1102 Enable support for IE8
- #1096 Add extra window nullchecks for non-browser environments
- #1105 Fix issue where operation name is overwritten

## v 2.3.0...2.2.4

### Changelog
- #1066 Adds Connection String support
- #1061, #1065,#1067, #1088 misc bug fixes

## v 2.2.4

### Changelog
- #1054 Fix issue with AppInsightsCore refactor

## v 2.2.3
### Changelog
- #1051 Add to call track trace on user init sending browser info to the end point when loggingLevelTelemetry config is on
- #1050 Address issue https://github.com/MicrosoftDocs/azure-docs/issues/39011
- #1049 Fix issue with PageViewPerformance event being sent with undefined name property
- #1041 Add tslint error screening
- #1038 Re-organize repo folders
- #1035 Update to use PerformanceNavigationInterface for supported browsers

## v 2.2.2
### Changelog
- #1030 Fix issue with appId correlation being appended with an incorrect format

## v 2.2.1
### Changelog
- #1015 Update to use beaconSender for page unload when browser supports Beacon API
- #1028 Fix issue where window.location is not defined
- #1021 Fix issue with not parsing correlationContext
- #1020 Disable by default logging to console internal SDK errors. Enable by default logging as telemetry for internal SDK errors

## v 2.2.0
### Changelog
- #946 **Feature**: Adds automatic incoming/outgoing header tracking. *Outgoing header tracking is experimental and may be miss some headers*
- #973 **Feature**: Support propagation of W3C compatible distributed tracing headers
- #983: Fix issue regarding incorrect referrer uri when using `enableAutoRouteTracking`
- #984: Fix issue where adding custom properties/tags would not work in telemetry processors
- #999: Fix IE issue when using `enableAutoRouteTracking`
- #1000

## v 2.1.1
Patch release containing fixes to automatic Single Page Application route change tracking via `enableAutoRouteTracking`

### Changelog
#970 - Fixes #967 #969

## v 2.1.0
### Highlights

#### Source Map Support
> *You do not need to upgrade for drag and drop to work. It will work on all previous and future versions of the javascript (and Node.js) SDK

https://i.imgur.com/Efue9nU.gif
You can now drag and drop your source maps onto your Exception Telemetry in the Azure Portal to unminify your callstack. Please open an issue or use the Feedback button in the Portal if a source map you've uploaded is not working as intended. This is a first iteration and in a future update, your source maps will be automatically unminified.

#### SPA Route Change Tracking
You can set `enableAutoRouteTracking: true` to enable state based route tracking for your Single Page Application (React, Angular, Vue, etc). You do not need to install a separate plugin to use this configuration option.

This setting will cause a new Page View telemetry item to be sent each time your app's route changes (**including** Hash route changes).

### Changelog
- #920 Resolve jest testing issues when using React plugin
- #928 Make analytics plugin have last priority
- #936 Fallback to XHR Sender when beacon sender tries to send >64 KB
- #947 Add SPA route change tracking
- #948 Docs: Source map support
- #952 Re-enable `samplingPercentage` functionality
- #918, #919, #932 #933 #935 #939 #940 #951

## v 2.0.1

### trackException Change
This update has a couple of **non-breaking** API changes. Namely, `trackException` is now consistent with the Node.js SDK. The only change here is the named argument is renamed from **`error`** to **`exception`**. A shim is in place so **any existing usages of `trackException` will still work**, and the old field is marked as optional, so any type-checked files will still "compile". There are no breaking changes with this change, but you are encouraged to use `exception` as your named argument field as error will be deprecated in a future major version.

#### Old
```js
appInsights.trackException({ error: new Error() });
```
#### New
```js
appInsights.trackException({ exception: new Error() });
```

### Correlation Header Domain Whitelisting #869

Second, the ability to only send correlation headers to specific, whitelisted domains is now available as a configuration option , `correlationHeaderDomains`. It accepts an `array` of domain `strings`. Wildcards ("*") are okay. By populating this array, all other domains which your application makes requests to will **not** have correlation headers included. This setting makes it easy to avoid OPTIONS requests to services outside of your control.

You can use the inclusion list and the exclusion list in conjunction with each other to add correlation headers to a particular domain, `example.com`, and at the same time exclude headers from a prefixed version of it, `no-headers.example.com`.

###  Tag Override Change #903

Performing custom tag overrides is now more consistent with all of the other Application Insights SDKs, in that it is modified via a simple key-value dictionary. There are no breaking changes with this update, and if you are setting any tags via the old way, they will still work as they do now. You are encouraged to update them since the old way will be deprecated in a future major version release.

#### Old
```js
var telemetryInitializer = (item) => {
  item.tags.push({ "ai.cloud.role": "My Web App" });
};
appInsights.addTelemetryInitializer(telemetryInitializer);
```
#### New
```js
var telemetryInitializer = (item) => {
  item.tags["ai.cloud.role"] = "My Web App";
};
appInsights.addTelemetryInitializer(telemetryInitializer);
```

### Changelog
#869 - config: add ability to whitelist specific domains for adding correlation headers
#893 - docs: fix sample configuration settings
#899 - common: replace Array.some with Array.forEach to simplify polyfill story, add tests
#902 - snippet: add missing methods to lazy loaders
#903 - tags can now be set with same API as other AI SDKs
#904 - rename IExceptionTelemetry.error --> IExceptionTelemetry.exception
#905 - react: fix plugin causing jest tests to fail
#907 - docs: add mention of how to update current context's operation
#908 - react: remove analytics package dependency
#910 - docs: update context refresh information
#913 - Remove code from adding libVer from extensions
#918 - automatically add `ai.operation.name` tag, add `id` to pageview telemetry
#919 - fix issue with `namePrefix` not affecting send buffers

## v 2.0.0

### Changelog
- #878 Fix issue with missing pageviewperformance
- #881 Change access level of some non-exposed methods
- #883 Allow `id` to be set in `Exception` telemetry