# V3.x Upgrade Breaking Changes (from v2.x))

Some of the major changes include

- Added support for dynamic (reactive) configuration changes after initialization
- Removed ES3 / IE8 Support, now only supports ES5 / IE9+
- Removed V1 API Backward Compatibility, Upgrading from V1 -> V3 is NOT supported and will require code changes in your application if you use the previous V1 API functions
- Requires Object.defineProperty support, the SDK now uses [Object.defineProperty](https://caniuse.com/?search=defineProperty) quite heavily and therefore support is limited to runtimes correctly implement this functionality. Without this the SDK will not function correctly.
- Many (mostly unused) exports from the NPM packages have been removed.

This document has attempted to identify all of the major breaking and behavior changes, it may be incomplete. If you encounter an issue that has not been documented please [create an issue](https://github.com/microsoft/ApplicationInsights-JS/issues/new/choose) and we will review to determine whether this was unexpected and should be fixed or if it needs to be documented.

## Extensions build for v2.x

If the extension is 100% self contained (all referenced code is included in it's own bundle), then apart from some TypeScript typing warnings / errors the SDK will load and initialize the plugin. It will most likely not support some of the newer functionality like dynamic configuration changes, complete unloading and removal.

However, for any extensions that contain references to the core components (import / require) the core components WILL likely not work with the v3.x (because of the breaking changes) and will need to be updated to use the external helpers or the alternate functions.

## Removed ES3 (IE8) Support

Previous internal polyfills for JavaScript features that are supported by ES5 are no longer included.

As part of packaging ES3 reserved word usage ("catch") is not longer wrapped, this WILL cause the SDK to fail to load in an ES3 environment.

The SDK still uses internal polyfills for ES5 features that are not supported by IE9-11 (like. Symbol).

If your application is required to maintain support for IE8 (ES3) you WILL need to continue to use the latest v2.x (Supported) releases.

## Configuration changes

| Configuration | Change
|---------------|-----------------
| `enableDebugExceptions` | This configuration has been removed and now only `enableDebug` is not used, as previously documented for v2

## Behavior changes

| Function       | Change
|----------------|--------------
| strStartsWith  | This is now uses the native [startsWith](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith) or a [polyfill if required](https://caniuse.com/?search=startsWith) that conforms the same functionality which will throw a TypeError for `null`, `undefined` values
| strEndsWith  | This is now uses the native [endsWith](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith) or a [polyfill if required](https://caniuse.com/?search=endsWith) that conforms the same functionality which will throw a TypeError for `null`, `undefined` values

| IAppInsightsCore   | Details
|--------------------|--------------------
| pollInternalLogs() | This now returns an ITimerHandler interface with a `cancel()` function rather than the `number` returned from the `setInternal()`.<br/>It is also now called automatically at the end of core `initialize` rather than being explicitly called via `snippet` initialization and `loadAppInsights`, this is a minor execution order change.

## AISKU

- V1 Snippet Usage
- All V1 API Compatibility Support

| V1 API | Details
|-----------|---------------------
| trackPageView | Use V2 API<br/>`trackPageView(pageView?: IPageViewTelemetry)`<br/><br/>V1 Removed<br/> `track(name?: string, url?: string, properties?: {[key: string]: string }, measurements?: {[key: string]: number }, duration?: number)`
| trackEvent | Use V2 API<br/>`trackEvent(event: IEventTelemetry, customProperties?: ICustomProperties)`<br/><br />V1 Removed<br /> `trackEvent(name: string, properties?: Object, measurements?: Object)`
| trackDependency | Use V2 API<br/>`trackDependencyData(dependency: IDependencyTelemetry)`<br/><br/>V1 Removed<br/>`trackDependency(id: string, method: string, absoluteUrl: string, pathName: string, totalTime: number, success: boolean, resultCode: number)`
| trackException | Use V2 API<br/>`trackException(exception: IExceptionTelemetry, customProperties?: ICustomProperties)`<br/><br/> V1 Removed<br/> `trackException(exception: Error, handledAt?: string, properties?: { [name: string]: string; }, measurements?: { [name: string]: number; }, severityLevel?: any)`
| trackMetric | Use V2 API<br/>`trackMetric(metric: IMetricTelemetry, customProperties?: ICustomProperties)`<br/><br />V1 Removed<br/> `trackMetric(name: string, average: number, sampleCount?: number, min?: number, max?: number, properties?: { [name: string]: string; })`
| trackTrace | Use V2 API<br/>`trackTrace(trace: ITraceTelemetry, customProperties?: ICustomProperties)`<br/><br />V1 Removed<br/> `trackTrace(message: string, properties?: { [name: string]: string; }, severityLevel?: any)`
| _onerror | Use V2 API<br/>`_onerror(exception: IAutoExceptionTelemetry)`<br/><br />V1 Removed<br/> `_onerror(message: string, url: string, lineNumber: number, columnNumber: number, error: Error)`
| downloadAndSetup | Removed

#### Exported Globals (NPM)

- Telemetry
- ICoreUtils; CoreUtils
- IUtil; Util
- ICorrelationIdHelper
- IUrlHelper
- IDateTimeUtils
- DataSanitizer (from common module)
- IDataSanitizer (from common module)

#### Exported Globals (CDN)

The previously exported namespaced globals have been replaced with a reduced set of individual functions (Which where also exported by v2.8.x)

> Note: Until the final release all of these "Removed" or "New Access" are subject to be changed. You should not be using the published `beta` for validation purposes and not in a production environment.

<table>
<thead>
<tr><th colspan="2">Previous CDN namespace / access</th><th>Replacement new access</th></tr>
</thead>
<tbody>
<tr><td colspan="2"><code>Microsoft.ApplicationInsights.Telemetry</code></td><td>Removed</td></tr>
<tr><td></td><td>BreezeChannelIdentifier</td><td><code>Microsoft.ApplicationInsights.</code>BreezeChannelIdentifier</td></tr>
<tr><td></td><td>PropertiesPluginIdentifier</td><td><code>Microsoft.ApplicationInsights.</code>PropertiesPluginIdentifier</td></tr>
<tr><td></td><td>AnalyticsPluginIdentifier</td><td><code>Microsoft.ApplicationInsights.</code>AnalyticsPluginIdentifier</td></tr>
<tr><td></td><td>DisabledPropertyName</td><td><code>Microsoft.ApplicationInsights.</code>DisabledPropertyName</td></tr>
<tr><td></td><td>ProcessLegacy</td><td>Removed</td></tr>
<tr><td></td><td>SampleRate</td><td>"sampleRate"</td></tr>
<tr><td></td><td>HttpMethod</td><td>"http.method"</td></tr>
<tr><td></td><td>DEFAULT_BREEZE_ENDPOINT</td><td><code>Microsoft.ApplicationInsights.</code>DEFAULT_BREEZE_ENDPOINT</td></tr>
<tr><td colspan="2"><code>Microsoft.ApplicationInsights.Telemetry.Util</code></td><td>Removed</td></tr>
<tr><td></td><td>NotSpecified</td><td>Removed</td></tr>
<tr><td></td><td>createDomEvent</td><td>Removed</td></tr>
<tr><td></td><td>disableStorage</td><td>Removed</td></tr>
<tr><td></td><td>isInternalApplicationInsightsEndpoint</td><td>Removed</td></tr>
<tr><td></td><td>canUseLocalStorage</td><td>Removed</td></tr>
<tr><td></td><td>getStorage</td><td>Removed</td></tr>
<tr><td></td><td>setStorage</td><td>Removed</td></tr>
<tr><td></td><td>removeStorage</td><td>Removed</td></tr>
<tr><td></td><td>canUseSessionStorage</td><td>Removed</td></tr>
<tr><td></td><td>getSessionStorageKeys</td><td>Removed</td></tr>
<tr><td></td><td>getSessionStorage</td><td>Removed</td></tr>
<tr><td></td><td>setSessionStorage</td><td>Removed</td></tr>
<tr><td></td><td>removeSessionStorage</td><td>Removed</td></tr>
<tr><td></td><td>disableCookies</td><td>Removed</td></tr>
<tr><td></td><td>canUseCookies</td><td>Removed</td></tr>
<tr><td></td><td>disallowsSameSiteNone</td><td>Removed</td></tr>
<tr><td></td><td>setCookie</td><td>Removed</td></tr>
<tr><td></td><td>stringToBoolOrDefault</td><td>Removed</td></tr>
<tr><td></td><td>getCookie</td><td>Removed</td></tr>
<tr><td></td><td>deleteCookie</td><td>Removed</td></tr>
<tr><td></td><td>trim</td><td>Removed</td></tr>
<tr><td></td><td>newId</td><td><code>Microsoft.ApplicationInsights.</code>newId</td></tr>
<tr><td></td><td>random32</td><td><code>Microsoft.ApplicationInsights.</code>random32</td></tr>
<tr><td></td><td>generateW3CId</td><td><code>Microsoft.ApplicationInsights.</code>generateW3CId</td></tr>
<tr><td></td><td>isArray</td><td>Removed</td></tr>
<tr><td></td><td>isError</td><td>Removed</td></tr>
<tr><td></td><td>isDate</td><td>Removed</td></tr>
<tr><td></td><td>toISOStringForIE8</td><td>Removed</td></tr>
<tr><td></td><td>getIEVersion</td><td>Removed</td></tr>
<tr><td></td><td>msToTimeSpan</td><td>Removed</td></tr>
<tr><td></td><td>isCrossOriginError</td><td>Removed</td></tr>
<tr><td></td><td>dump</td><td>Removed</td></tr>
<tr><td></td><td>getExceptionName</td><td>Removed</td></tr>
<tr><td></td><td>addEventHandler</td><td><code>Microsoft.ApplicationInsights.</code>addEventHandler</td></tr>
<tr><td></td><td>removeEventHandler</td><td><code>Microsoft.ApplicationInsights.</code>removeEventHandler</td></tr>
<tr><td></td><td>IsBeaconApiSupported</td><td><code>Microsoft.ApplicationInsights.</code>IsBeaconApiSupported</td></tr>
<tr><td></td><td>getExtension</td><td><code>appInsights.getPlugin("&lt;plugin id&gt;")?.plugin</td></tr>
<tr><td colspan="2"><code>Microsoft.ApplicationInsights.Telemetry.CorrelationIdHelper</code></td><td>Removed</td></tr>
<tr><td colspan="2"><code>Microsoft.ApplicationInsights.Telemetry.UrlHelper</code></td><td>Removed</td></tr>
<tr><td colspan="2"><code>Microsoft.ApplicationInsights.Telemetry.DateTimeUtils</code></td><td>Removed</td></tr>
<tr><td colspan="2"><code>Microsoft.ApplicationInsights.Telemetry.ConnectionStringParser</code></td><td>Removed</td></tr>
<tr><td colspan="2"><code>Microsoft.ApplicationInsights.Telemetry.FieldType (enum)</code></td><td>Removed</td></tr>
<tr><td colspan="2"><code>Microsoft.ApplicationInsights.Telemetry.RequestHeaders (enum)</code></td><td><code>Microsoft.ApplicationInsights.</code>RequestHeaders</td></tr>
<tr><td colspan="2"><code>Microsoft.ApplicationInsights.Telemetry.Envelope (class)</code></td><td>Removed</td></tr>
<tr><td colspan="2"><code>Microsoft.ApplicationInsights.Telemetry.Event (class)</code></td><td>Removed</td></tr>
<tr><td colspan="2"><code>Microsoft.ApplicationInsights.Telemetry.Exception (class)</code></td><td>Removed</td></tr>
<tr><td colspan="2"><code>Microsoft.ApplicationInsights.Telemetry.Metric (class)</code></td><td>Removed</td></tr>
<tr><td colspan="2"><code>Microsoft.ApplicationInsights.Telemetry.PageView (class)</code></td><td>Removed</td></tr>
<tr><td colspan="2"><code>Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData (class)</code></td><td>Removed</td></tr>
<tr><td colspan="2"><code>Microsoft.ApplicationInsights.Telemetry.Trace (class)</code></td><td>Removed</td></tr>
<tr><td colspan="2"><code>Microsoft.ApplicationInsights.Telemetry.PageViewPerformance (class)</code></td><td>Removed</td></tr>
<tr><td colspan="2"><code>Microsoft.ApplicationInsights.Telemetry.Data (class)</code></td><td>Removed</td></tr>
<tr><td colspan="2"><code>Microsoft.ApplicationInsights.Telemetry.SeverityLevel (enum)</code></td><td><code>Microsoft.ApplicationInsights.</code>SeverityLevel</td></tr>
<tr><td colspan="2"><code>Microsoft.ApplicationInsights.Telemetry.ConfigurationManager (class)</code></td><td>Removed</td></tr>
<tr><td colspan="2"><code>Microsoft.ApplicationInsights.Telemetry.ContextTagKeys (class)</code></td><td>Removed</td></tr>
<tr><td colspan="2"><code>Microsoft.ApplicationInsights.Telemetry.DataSanitizer</code></td><td>Removed</td></tr>
<tr><td colspan="2"><code>Microsoft.ApplicationInsights.Telemetry.TelemetryItemCreator</code></td><td>Removed</td></tr>
<tr><td colspan="2"><code>Microsoft.ApplicationInsights.Telemetry.CtxTagKeys</code></td><td>Removed</td></tr>
<tr><td colspan="2"><code>Microsoft.ApplicationInsights.Telemetry.Extensions (enum)</code></td><td>Removed</td></tr>
<tr><td colspan="2"><code>Microsoft.ApplicationInsights.Telemetry.DistributedTracingMode (enum)</code></td><td><code>Microsoft.ApplicationInsights.</code>DistributedTracingMode</td></tr>
<tr><td colspan="2"><code>Microsoft.ApplicationInsights.Util</code></td><td>Removed: see <code>Microsoft.ApplicationInsights.Telemetry.Util</td></tr>
</tbody>
</table>

### AISKU Light

#### V2 API Changes

| V1 API    | Details
|-----------|---------------------
| getSKUDefaults | Removed in V2

#### Exported Globals

- CoreUtils

### @microsoft/applicationinsights-common

#### Exported Globals (NPM)

- IUtil; Util
  - Use the individual `utl` prefixed functions that are also exported in later v2 releases documented in the [Tree Shaking Recommendations](https://github.com/microsoft/ApplicationInsights-JS/blob/main/TreeShakingRecommendations.md).
- ICorrelationIdHelper; CorrelationIdHelper
  - Use the individual `correlationId` prefixed functions that are also exported in later v2 releases documented in the [Tree Shaking Recommendations](https://github.com/microsoft/ApplicationInsights-JS/blob/main/TreeShakingRecommendations.md).
- IDateTimeUtils; DateTimeUtils;
  - Use the individual `dateTimeUtils` prefixed functions that are also exported in later v2 releases documented in the [Tree Shaking Recommendations](https://github.com/microsoft/ApplicationInsights-JS/blob/main/TreeShakingRecommendations.md).
- IUrlHelper; UrlHelper
  - Use the individual `url` prefixed functions that are also exported in later v2 releases documented in the [Tree Shaking Recommendations](https://github.com/microsoft/ApplicationInsights-JS/blob/main/TreeShakingRecommendations.md).
- IDataSanitizer, DataSanitizer
  - Use the individual `dataSanitizer` prefixed functions that are also exported in later v2 releases documented in the [Tree Shaking Recommendations](https://github.com/microsoft/ApplicationInsights-JS/blob/main/TreeShakingRecommendations.md).

### @microsoft/applicationinsights-core-js

All previously `@deprecated` marked functions and the legacy "global" cookie handling functions
#### Exported Globals (NPM)

- BaseCore
  - Use `AppInsightsCore` (`AppInsightsCore` and `BaseCore` are now merged)
- ICoreUtils; CoreUtils
  - See the replacements documented in the [Tree Shaking Recommendations](https://microsoft.github.io/ApplicationInsights-JS/TreeShakingRecommendations.html).
- IEventHelper; EventHelper
  - See the replacements documented in the [Tree Shaking Recommendations](https://github.com/microsoft/ApplicationInsights-JS/blob/main/TreeShakingRecommendations.md).
- EnumMap, createEnumMap
  - Removed as not used internally, use the ts-utils support versions if required
-`hasOwnProperty()`
  - use `objHasOwnProperty()`

#### Exposed Runtime configuration values

- `config.extensionConfig.NotificationManager` In eariler versions this was assigned to the current notification manager, this is now removed
  - You can access the current notification manager via `core.getNotifyMgr()` which is more reliable as it will lazily create an instance if one is currently not assigned.

##### Removed no replacement

__Functions__

- disableCookies
- canUseCookies
- getCookie
- setCookie
- deleteCookie
- _legacyCookieMgr

__Classes__

- `BaseCore`

## Browser Support

Minimum JavaScript Language Specification: ES5

![Chrome](https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png) | ![Firefox](https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png) | ![IE](https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png) | ![Opera](https://raw.githubusercontent.com/alrra/browser-logos/master/src/opera/opera_48x48.png) | ![Safari](https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png)
--- | --- | --- | --- | --- |
Latest ✔ | Latest ✔ | 9+ Full ✔ | Latest ✔ | Latest ✔ |

> Note: ES3/IE8 compatibility has been <u>__removed__</u>, so if you need to retain ES3 compatibility you will need to remain on the 2.x.x versions of the SDK.