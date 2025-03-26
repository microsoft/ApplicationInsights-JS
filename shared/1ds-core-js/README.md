# Microsoft 1DS Web SDK Core

## Description

1DS Web SDK Core is the telemetry orchestrator, responsible for initializing all attached plugins and calling process() on each of them.

## npm

Packages available [here](https://www.npmjs.com/package/@microsoft/1ds-core-js).

## Basic Usage

### Setup

```js
import { AppInsightsCore, IExtendedConfiguration } from '@microsoft/1ds-core-js';
```

```js
var appInsightsCore: AppInsightsCore = new AppInsightsCore();
var coreConfig: IExtendedConfiguration = {
      instrumentationKey: "YOUR_TENANT_KEY"
};
//Initialize SDK
appInsightsCore.initialize(coreConfig, []);
```

## Configuration

### [IExtendedConfiguration](https://microsoft.github.io/ApplicationInsights-JS/webSdk/1ds-core-js/interfaces/IExtendedConfiguration.html)

|  Config   | Description | Type
|----------------|----------------------------------------|----|
|  instrumentationKey     |Instrumentation key of resource.|string
|  diagnosticLogInterval     |Polling interval (in ms) for internal logging queue.|number
|  maxMessageLimit     |Maximum number of iKey transmitted logging telemetry per page view.|number
|  loggingLevelConsole     |Console logging level. All logs with a severity level higher than the configured level will be printed to console. Otherwise they are suppressed. |number
|  loggingLevelTelemetry     |Telemtry logging level to instrumentation key. All logs with a severity level higher than the configured level will sent as telemetry data to the configured instrumentation key.|number
|  enableDebugExceptions     |If enabled, uncaught exceptions will be thrown to help with debugging.|boolean
|  endpointUrl     |Endpoint where telemetry data is sent.|string
|  extensionConfig     |Extension configs loaded in SDK.|[key: string]: any;
|  extensions     |Additional plugins that should be loaded by core at runtime.| Array< ITelemetryPlugin>
|  channels     |Channel queues that is setup by caller in desired order.|Array< IChannelControls[]>
|  propertyStorageOverride     |The property storage override that should be used to store internal SDK properties, otherwise stored as cookies. It is needed where cookies are not available.|IPropertyStorageOverride
| cookieCfg | Defaults to cookie usage enabled see [ICookieCfgConfig](#ICookieMgrConfig) settings for full defaults. | [ICookieCfgConfig](#ICookieMgrConfig)<br>[Optional]<br>(Since 3.1.0) 
|  disableCookiesUsage     |A boolean that indicated whether to disable the use of cookies by the Aria SDK. The cookies added by the SDK are MicrosoftApplicationsTelemetryDeviceId and MicrosoftApplicationsTelemetryFirstLaunchTime. If cookies are disabled, then session events are not sent unless propertyStorageOverride is provided to store the values elsewhere.|boolean
| cookieDomain | Custom cookie domain. This is helpful if you want to share Application Insights cookies across subdomains.<br>(Since v3.1.0) If `cookieCfg.domain` is defined it will take precedence over this value. | alias for [`cookieCfg.domain`](#ICookieMgrConfig)<br>[Optional]<br>(Since 3.1.0)
| cookiePath | Custom cookie path. This is helpful if you want to share Application Insights cookies behind an application gateway.<br>If `cookieCfg.path` is defined it will take precedence over this value. | alias for [`cookieCfg.path`](#ICookieMgrConfig)<br>[Optional]<br>(Since 3.1.0) |
|  anonCookieName     |Name of the Anon cookie.  The value will be set in the qsp header to collector requests.  Collector will use this value to look for specific cookie to use for anid property.|string
| enablePerfMgr | [Optional] When enabled (true) this will create local perfEvents for code that has been instrumented to emit perfEvents (via the doPerf() helper). This can be used to identify performance issues within the SDK based on your usage or optionally within your own instrumented code. [More details are available by the basic documentation](https://github.com/microsoft/ApplicationInsights-JS/blob/main/docs/PerformanceMonitoring.md). Since v2.4.0| boolean<br/>Defaults to false
| perfEvtsSendAll | [Optional] When _enablePerfMgr_ is enabled and the [IPerfManager](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IPerfManager.html) fires a [INotificationManager](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/INotificationManager.html).perfEvent() this flag determines whether an event is fired (and sent to all listeners) for all events (true) or only for 'parent' events (false &lt;default&gt;).<br />A parent [IPerfEvent](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IPerfEvent.html) is an event where no other IPerfEvent is still running at the point of this event being created and it's _parent_ property is not null or undefined. Since v2.4.0 | boolean<br />Defaults to false
| idLength | [Optional] Identifies the default length used to generate new random session and user id's. Defaults to 22, previous default value was 5 (v2.4.2 or less), if you need to keep the previous maximum length you should set this value to 5. | number<br />Default: 22 
| disableEventTimings | [Optional] Disables additional internal event timings that are added during processing of events, the timings are not sent as part telemetry items to the server. | boolean<br/>Default: false
| enableCompoundKey | [Optional] Enables support for objects with compound keys which indirectly represent an object where the "key" of the object contains a "." as part of it's name.<br />Example: <code>event: { "somedata.embeddedvalue": 123 } </code> | boolean<br />Default: false
| disablePageUnloadEvents | [Optional] An array of the page unload events that you would like to be ignored, special note there must be at least one valid unload event hooked, if you list all or the runtime environment only supports a listed "disabled" event it will still be hooked, if required by the SDK.<br /> Unload events include "beforeunload", "unload", "visibilitychange" (with 'hidden' state) and "pagehide"| string[]<br />Default: not specified
| disablePageShowEvents | [Optional] An array of page show events that you would like to be ignored, special note there must be at lease one valid show event hooked, if you list all or the runtime environment only supports a listed (disabled) event it will STILL be hooked, if required by the SDK.<br/> Page Show events include "pageshow" and "visibilitychange" (with 'visible' state)| string[]<br /> Default: not specified

### [IPropertyStorageOverride](https://microsoft.github.io/ApplicationInsights-JS/webSdk/1ds-core-js/interfaces/IPropertyStorageOverride.html)

|  Config   | Description | Type
|----------------|----------------------------------------|----|
|  setProperty     |A function for passing key value pairs to be stored.| function
|  getProperty     | A function that gets a value for a given key.| function

### [ICookieMgrConfig](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ICookieMgrConfig.html)

Cookie Configuration for instance based cookie management added in version 3.1.0.

| Name | Description | <div style="width:250px">Type</div> |
|------|-------------|--------------|
| enabled | A boolean that indicates whether the use of cookies by  the SDK is enabled by the current instance. If false, the instance of the SDK initialized by this configuration will not store or read any data from cookies | boolean | true |
| domain | Custom cookie domain. This is helpful if you want to share Application Insights cookies across subdomains. If not provided uses the value from root `cookieDomain` value. | string<br/>Defaults: null |
| path | Specifies the path to use for the cookie, if not provided it will use any value from the root `cookiePath` value. | string<br/>Defaults: / |
| ignoreCookies | Specify the cookie name(s) to be ignored, this will cause any matching cookie name to never be read or written. They may still be explicitly purged or deleted. You do not need to repeat the name in the `blockedCookies` configuration.(Since v3.2.7) | string[] <br/> Defaults: undefined | 
| blockedCookies | Specify the cookie name(s) to never be written, this will cause any cookie name to never be created or updated, they will still be read unless also included in the ignoreCookies and may still be explicitly purged or deleted. If not provided defaults to the same list provided in ignoreCookies. (Since v3.2.7) | string[] <br/> Defaults: undefined | 
| getCookie | Function to fetch the named cookie value, if not provided it will use the internal cookie parsing / caching. | `(name: string) => string`<br/>Defaults: null |
| setCookie | Function to set the named cookie with the specified value, only called when adding or updating a cookie. | `(name: string, value: string) => void`<br/>Defaults:  null |
| delCookie | Function to delete the named cookie with the specified value, separated from setCookie to avoid the need to parse the value to determine whether the cookie is being added or removed.if not provided it will use the internal cookie parsing / caching. | `(name: string, value: string) => void`<br/>Defaults:  null |

## Cookie Handling

From version 3.1.0, cookie management is now available directly from the instance and can be disabled and re-enabled after initialization.

If cookie usage is disabled during initialization via the `disableCookiesUsage` configurations, you can now re-enable via the [ICookieMgr](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ICookieMgr.html) `setEnabled` function.

The instance based cookie management also replaces the previous CoreUtils and global functions of `disableCookies()`, `setCookie(...)`, `getCookie(...)` and `deleteCookie(...)`. And to benefit from the tree-shaking enhancements also introduced as part of version 3.1.0 you should no longer uses the global functions.

### Simplified Usage of new instance Cookie Manager

- oneDs.[getCookieMgr()](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ICookieMgr.html).setEnabled(true/false)
- oneDs.[getCookieMgr()](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ICookieMgr.html).set("MyCookie", "thevalue");
- oneDs.[getCookieMgr()](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ICookieMgr.html).get("MyCookie");
- oneDs.[getCookieMgr()](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ICookieMgr.html).del("MyCookie");

### Blocking individual cookies

Since v3.2.7 you can now specify which Cookie name(s) that you want the SDK to either ignore (never read, written or created) or blocked (will be read if already present but will not write or create), this is useful for blocking non-critical Cookies that your site does not need but the SDK automatically populates. These settings only affect the Javascript SDK reading, writing and creation of the cookies and do NOT affect automatic cookies added by the Collector. See the ["Cookies Set/Read by 1DS Web SDK" section of the linked page](https://eng.ms/docs/products/geneva/collect/instrument/1ds/javascriptsdk/getting-started).

Example.

```typescript
var coreConfig: IExtendedConfiguration = {
    instrumentationKey: "YOUR_TENANT_KEY",
    cookieCfg: {
        ignoreCookies: [ "MicrosoftApplicationsTelemetryDeviceId" ]
    }
    extensions: [ /* Your extensions */ ],
    extensionConfig: []
};
```

## API documentation

[Typedoc generated API reference](https://microsoft.github.io/ApplicationInsights-JS/webSdk/1ds-core-js)

## Learn More

You can learn more in [1DS First party (Internal) getting started](https://aka.ms/1dsjs).

## Data Collection

The software may collect information about you and your use of the software and send it to Microsoft. Microsoft may use this information to provide services and improve our products and services. You may turn off the telemetry as described in the repository. There are also some features in the software that may enable you and Microsoft to collect data from users of your applications. If you use these features, you must comply with applicable law, including providing appropriate notices to users of your applications together with a copy of Microsoft's privacy statement. Our privacy statement is located at [https://go.microsoft.com/fwlink/?LinkID=824704](https://go.microsoft.com/fwlink/?LinkID=824704). You can learn more about data collection and use in the help documentation and our privacy statement. Your use of the software operates as your consent to these practices.

To turn off sending telemetry to Microsoft, ensure that the POST channel is not configured in the extensions.  See below configuration for example:

```js
var coreConfig: IExtendedConfiguration = {
      instrumentationKey: "YOUR_TENANT_KEY",
      extensions: [
        postChannel  // << REMOVE THIS EXTENSION TO STOP SENDING TELEMETRY TO MICROSOFT
      ],
      extensionConfig: []
};
```

## Contributing

Read our [contributing guide](./CONTRIBUTING.md) to learn about our development process, how to propose bugfixes and improvements, and how to build and test your changes to Application Insights.

## Data Collection

As this SDK is designed to enable applications to perform data collection which is sent to the Microsoft collection endpoints the following is required to identify our privacy statement.

The software may collect information about you and your use of the software and send it to Microsoft. Microsoft may use this information to provide services and improve our products and services. You may turn off the telemetry as described in the repository. There are also some features in the software that may enable you and Microsoft to collect data from users of your applications. If you use these features, you must comply with applicable law, including providing appropriate notices to users of your applications together with a copy of Microsoft’s privacy statement. Our privacy statement is located at https://go.microsoft.com/fwlink/?LinkID=824704. You can learn more about data collection and use in the help documentation and our privacy statement. Your use of the software operates as your consent to these practices.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft trademarks or logos is subject to and must follow [Microsoft’s Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general). Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship. Any use of third-party trademarks or logos are subject to those third-party’s policies.

## License

[MIT](./LICENSE.TXT)
