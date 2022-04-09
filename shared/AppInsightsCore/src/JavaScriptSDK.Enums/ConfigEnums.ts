// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// @skip-file-minify - Skip attempting to minify this file

import { createEnumMap } from "./EnumHelperFuncs";

export const enum eConfigEnum {
    /**
     * Instrumentation key of resource. Either this or connectionString must be specified.
     */
    instrumentationKey = 0,

    /**
     * Connection string of resource. Either this or instrumentationKey must be specified.
     */
    connectionString = 1,
 
    /**
     * Polling interval (in ms) for internal logging queue
     */
    diagnosticLogInterval = 2,
 
    /**
     * Maximum number of iKey transmitted logging telemetry per page view
     */
    maxMessageLimit = 3,
 
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
    loggingLevelConsole = 4,
 
    /**
     * Telemtry logging level to instrumentation key. All logs with a severity
     * level higher than the configured level will sent as telemetry data to
     * the configured instrumentation key.
     *
     * 0: ALL iKey logging off
     * 1: logs to iKey: severity >= CRITICAL
     * 2: logs to iKey: severity >= WARNING
     */
    loggingLevelTelemetry = 5,
 
    /**
     * If enabled, uncaught exceptions will be thrown to help with debugging
     */
    enableDebugExceptions = 6,

    /**
     * Endpoint where telemetry data is sent
     */
    endpointUrl = 7,

    /**
     * Extension configs loaded in SDK
     */
    extensionConfig = 8,

    /**
     * Additional plugins that should be loaded by core at runtime
     */
    extensions = 9,

    /**
     * Channel queues that is setup by caller in desired order.
     * If channels are provided here, core will ignore any channels that are already setup, example if there is a SKU with an initialized channel
     */
    channels = 10,

    /**
     * @type {boolean}
     * Flag that disables the Instrumentation Key validation.
     */
    disableInstrumentationKeyValidation = 11,
    
    /**
     * [Optional] When enabled this will create local perfEvents based on sections of the code that have been instrumented
     * to emit perfEvents (via the doPerf()) when this is enabled. This can be used to identify performance issues within
     * the SDK, the way you are using it or optionally your own instrumented code.
     * The provided IPerfManager implementation does NOT send any additional telemetry events to the server it will only fire
     * the new perfEvent() on the INotificationManager which you can listen to.
     * This also does not use the window.performance API, so it will work in environments where this API is not supported.
     */
    enablePerfMgr = 12,

    /**
     * [Optional] Callback function that will be called to create a the IPerfManager instance when required and ```enablePerfMgr```
     * is enabled, this enables you to override the default creation of a PerfManager() without needing to ```setPerfMgr()```
     * after initialization.
     */
    createPerfMgr = 13,

    /**
     * [Optional] Fire every single performance event not just the top level root performance event. Defaults to false.
     */
    perfEvtsSendAll = 14,

    /**
     * [Optional] Identifies the default length used to generate random session and user id's if non currently exists for the user / session.
     * Defaults to 22, previous default value was 5, if you need to keep the previous maximum length you should set this value to 5.
     */
    idLength = 15,

    /**
     * @description Custom cookie domain. This is helpful if you want to share Application Insights cookies across subdomains. It
     * can be set here or as part of the cookieCfg.domain, the cookieCfg takes precedence if both are specified.
     * @type {string}
     * @defaultValue ""
     */
    cookieDomain = 16,

    /**
     * @description Custom cookie path. This is helpful if you want to share Application Insights cookies behind an application
     * gateway. It can be set here or as part of the cookieCfg.domain, the cookieCfg takes precedence if both are specified.
     * @type {string}
     * @defaultValue ""
     */
    cookiePath = 17,

    /**
     * [Optional] A boolean that indicated whether to disable the use of cookies by the SDK. If true, the SDK will not store or
     * read any data from cookies. Cookie usage can be re-enabled after initialization via the core.getCookieMgr().enable().
     */
    disableCookiesUsage = 18,

    /**
     * [Optional] A Cookie Manager configuration which includes hooks to allow interception of the get, set and delete cookie
     * operations. If this configuration is specified any specified enabled and domain properties will take precedence over the
     * cookieDomain and disableCookiesUsage values.
     */
    cookieCfg = 19,

    /**
     * [Optional] An array of the page unload events that you would like to be ignored, special note there must be at least one valid unload
     * event hooked, if you list all or the runtime environment only supports a listed "disabled" event it will still be hooked, if required by the SDK.
     * Unload events include "beforeunload", "unload", "visibilitychange" (with 'hidden' state) and "pagehide"
     */
    disablePageUnloadEvents = 20,

    /**
     * [Optional] An array of page show events that you would like to be ignored, special note there must be at lease one valid show event
     * hooked, if you list all or the runtime environment only supports a listed (disabled) event it will STILL be hooked, if required by the SDK.
     * Page Show events include "pageshow" and "visibilitychange" (with 'visible' state)
     */
    disablePageShowEvents = 21,

    /**
     * [Optional] A flag for performance optimization to disable attempting to use the Chrome Debug Extension, if disabled and the extension is installed
     * this will not send any notifications.
     */
    disableDbgExt = 22,

    /**
     * The JSON format (normal vs line delimited). True means line delimited JSON.
     */
    emitLineDelimitedJson = 23,

    /**
     * An optional account id, if your app groups users into accounts. No spaces, commas, semicolons, equals, or vertical bars.
     */
    accountId = 24,

    /**
     * A session is logged if the user is inactive for this amount of time in milliseconds. Default 30 mins.
     * @default 30*60*1000
     */
    sessionRenewalMs = 25,

    /**
     * A session is logged if it has continued for this amount of time in milliseconds. Default 24h.
     * @default 24*60*60*1000
     */
    sessionExpirationMs = 26,

    /**
     * Max size of telemetry batch. If batch exceeds limit, it is sent and a new batch is started
     * @default 100000
     */
    maxBatchSizeInBytes = 27,

    /**
     * How long to batch telemetry for before sending (milliseconds)
     * @default 15 seconds
     */
    maxBatchInterval = 28,

    /**
     * If true, debugging data is thrown as an exception by the logger. Default false
     * @defaultValue false
     */
    enableDebug = 29,

    /**
     * If true, exceptions are not autocollected. Default is false
     * @defaultValue false
     */
    disableExceptionTracking = 30,

    /**
     * If true, telemetry is not collected or sent. Default is false
     * @defaultValue false
     */
    disableTelemetry = 31,

    /**
     * Percentage of events that will be sent. Default is 100, meaning all events are sent.
     * @defaultValue 100
     */
    samplingPercentage = 32,

    /**
     * If true, on a pageview, the previous instrumented page's view time is tracked and sent as telemetry and a new timer is started for the current pageview. It is sent as a custom metric named PageVisitTime in milliseconds and is calculated via the Date now() function (if available) and falls back to (new Date()).getTime() if now() is unavailable (IE8 or less). Default is false.
     */
    autoTrackPageVisitTime = 33,

    /**
     * Automatically track route changes in Single Page Applications (SPA). If true, each route change will send a new Pageview to Application Insights.
     */
    enableAutoRouteTracking = 34,

    /**
     * If true, Ajax calls are not autocollected. Default is false
     * @defaultValue false
     */
    disableAjaxTracking = 35,

    /**
     * If true, Fetch requests are not autocollected. Default is true.
     * @defaultValue true
     */
    disableFetchTracking = 36,

    /**
     * Provide a way to exclude specific route from automatic tracking for XMLHttpRequest or Fetch request. For an ajax / fetch request that the request url matches with the regex patterns, auto tracking is turned off.
     * @defaultValue undefined.
     */
    excludeRequestFromAutoTrackingPatterns = 37,

    /**
     * Provide a way to enrich dependencies logs with context at the beginning of api call.
     * Default is undefined.
     */
    addRequestContext = 38,

    /**
     * If true, default behavior of trackPageView is changed to record end of page view duration interval when trackPageView is called. If false and no custom duration is provided to trackPageView, the page view performance is calculated using the navigation timing API. Default is false
     * @defaultValue false
     */
    overridePageViewDuration = 39,

    /**
     * Default 500 - controls how many ajax calls will be monitored per page view. Set to -1 to monitor all (unlimited) ajax calls on the page.
     */
    maxAjaxCallsPerView = 40,

    /**
     * @ignore
     * If false, internal telemetry sender buffers will be checked at startup for items not yet sent. Default is true
     * @defaultValue true
     */
    disableDataLossAnalysis = 41,

    /**
     * If false, the SDK will add two headers ('Request-Id' and 'Request-Context') to all dependency requests to correlate them with corresponding requests on the server side. Default is false.
     * @defaultValue false
     */
    disableCorrelationHeaders = 42,

    /**
     * Sets the distributed tracing mode. If AI_AND_W3C mode or W3C mode is set, W3C trace context headers (traceparent/tracestate) will be generated and included in all outgoing requests.
     * AI_AND_W3C is provided for back-compatibility with any legacy Application Insights instrumented services
     * @defaultValue AI_AND_W3C
     */
    distributedTracingMode = 43,

    /**
     * Disable correlation headers for specific domain
     */
    correlationHeaderExcludedDomains = 44,

    /**
     * Default false. If true, flush method will not be called when onBeforeUnload, onUnload, onPageHide or onVisibilityChange (hidden state) event(s) trigger.
     */
    disableFlushOnBeforeUnload = 45,

    /**
     * Default value of {@link #disableFlushOnBeforeUnload}. If true, flush method will not be called when onPageHide or onVisibilityChange (hidden state) event(s) trigger.
     */
    disableFlushOnUnload = 46,

    /**
     * If true, the buffer with all unsent telemetry is stored in session storage. The buffer is restored on page load. Default is true.
     * @defaultValue true
     */
    enableSessionStorageBuffer = 47,

    /**
     * @deprecated Use either disableCookiesUsage or specify a cookieCfg with the enabled value set.
     * If true, the SDK will not store or read any data from cookies. Default is false. As this field is being deprecated, when both
     * isCookieUseDisabled and disableCookiesUsage are used disableCookiesUsage will take precedent.
     * @defaultValue false
     */
    isCookieUseDisabled = 48,

    /**
     * Default false. If false, retry on 206 (partial success), 408 (timeout), 429 (too many requests), 500 (internal server error), 503 (service unavailable), and 0 (offline, only if detected)
     * @description
     * @defaultValue false
     */
    isRetryDisabled = 49,

    /**
     * @deprecated Used when initizialing from snippet only.
     *  The url from where the JS SDK will be downloaded.
     */
    url = 50,

    /**
     * If true, the SDK will not store or read any data from local and session storage. Default is false.
     * @defaultValue false
     */
    isStorageUseDisabled = 51,

    /**
     * If false, the SDK will send all telemetry using the [Beacon API](https://www.w3.org/TR/beacon)
     * @defaultValue true
     */
    isBeaconApiDisabled = 52,

    /**
     * Don't use XMLHttpRequest or XDomainRequest (for IE < 9) by default instead attempt to use fetch() or sendBeacon.
     * If no other transport is available it will still use XMLHttpRequest
     */
    disableXhr = 53,

    /**
     * If fetch keepalive is supported do not use it for sending events during unload, it may still fallback to fetch() without keepalive
     */
    onunloadDisableFetch = 54,

    /**
     * Sets the sdk extension name. Only alphabetic characters are allowed. The extension name is added as a prefix to the 'ai.internal.sdkVersion' tag (e.g. 'ext_javascript:2.0.0'). Default is null.
     * @defaultValue null
     */
    sdkExtension = 55,

    /**
     * Default is false. If true, the SDK will track all [Browser Link](https://docs.microsoft.com/en-us/aspnet/core/client-side/using-browserlink) requests.
     * @defaultValue false
     */
    isBrowserLinkTrackingEnabled = 56,

    /**
     * AppId is used for the correlation between AJAX dependencies happening on the client-side with the server-side requets. When Beacon API is enabled, it cannot be used automatically, but can be set manually in the configuration. Default is null
     * @defaultValue null
     */
    appId = 57,

    /**
     * If true, the SDK will add two headers ('Request-Id' and 'Request-Context') to all CORS requests to correlate outgoing AJAX dependencies with corresponding requests on the server side. Default is false
     * @defaultValue false
     */
    enableCorsCorrelation = 58,

    /**
     * An optional value that will be used as name postfix for localStorage and session cookie name.
     * @defaultValue null
     */
    namePrefix = 59,

    /**
     * An optional value that will be used as name postfix for session cookie name. If undefined, namePrefix is used as name postfix for session cookie name.
     * @defaultValue null
     */
    sessionCookiePostfix = 60,

    /**
     * An optional value that will be used as name postfix for user cookie name. If undefined, no postfix is added on user cookie name.
     * @defaultValue null
     */
    userCookiePostfix = 61,

    /**
     * An optional value that will track Request Header through trackDependency function.
     * @defaultValue false
     */
    enableRequestHeaderTracking = 62,

    /**
     * An optional value that will track Response Header through trackDependency function.
     * @defaultValue false
     */
    enableResponseHeaderTracking = 63,

    /**
     * An optional value that will track Response Error data through trackDependency function.
     * @defaultValue false
     */
    enableAjaxErrorStatusText = 64,

    /**
     * Flag to enable looking up and including additional browser window.performance timings
     * in the reported ajax (XHR and fetch) reported metrics.
     * Defaults to false.
     */
    enableAjaxPerfTracking = 65,

    /**
     * The maximum number of times to look for the window.performance timings (if available), this
     * is required as not all browsers populate the window.performance before reporting the
     * end of the XHR request and for fetch requests this is added after its complete
     * Defaults to 3
     */
    maxAjaxPerfLookupAttempts = 66,

    /**
     * The amount of time to wait before re-attempting to find the windows.performance timings
     * for an ajax request, time is in milliseconds and is passed directly to setTimeout()
     * Defaults to 25.
     */
    ajaxPerfLookupDelay = 67,
        
    /**
     * Default false. when tab is closed, the SDK will send all remaining telemetry using the [Beacon API](https://www.w3.org/TR/beacon)
     * @defaultValue false
     */
    onunloadDisableBeacon = 68,

    /**
     * @ignore
     * Internal only
     */
    autoExceptionInstrumented = 69,

    /**
     * @ignore
     * Internal only
     */
    correlationHeaderDomains = 70,

    /**
     * @ignore
     * Internal only
     */
    autoUnhandledPromiseInstrumented = 71,

    /**
     * Default false. Define whether to track unhandled promise rejections and report as JS errors.
     * When disableExceptionTracking is enabled (dont track exceptions) this value will be false.
     * @defaultValue false
     */
    enableUnhandledPromiseRejectionTracking = 72,

    /**
     * Disable correlation headers using regular expressions
     */
    correlationHeaderExcludePatterns = 73,

    /**
     * The ability for the user to provide extra headers
     */
    customHeaders = 74,

    /**
     * Provide user an option to convert undefined field to user defined value.
     */
    convertUndefined = 75,

    /**
     * [Optional] The number of events that can be kept in memory before the SDK starts to drop events. By default, this is 10,000.
     */
    eventsLimitInMem = 76
}

export const ConfigEnum = createEnumMap<typeof eConfigEnum, {
    [eConfigEnum.instrumentationKey]: "instrumentationKey",
    [eConfigEnum.connectionString]: "connectionString",
    [eConfigEnum.diagnosticLogInterval]: "diagnosticLogInterval",
    [eConfigEnum.maxMessageLimit]: "maxMessageLimit",
    [eConfigEnum.loggingLevelConsole]: "loggingLevelConsole",
    [eConfigEnum.loggingLevelTelemetry]: "loggingLevelTelemetry",
    [eConfigEnum.enableDebugExceptions]: "enableDebugExceptions",
    [eConfigEnum.endpointUrl]: "endpointUrl",
    [eConfigEnum.extensionConfig]: "extensionConfig",
    [eConfigEnum.extensions]: "extensions",
    [eConfigEnum.channels]: "channels",
    [eConfigEnum.disableInstrumentationKeyValidation]: "disableInstrumentationKeyValidation",
    [eConfigEnum.enablePerfMgr]: "enablePerfMgr",
    [eConfigEnum.createPerfMgr]: "createPerfMgr",
    [eConfigEnum.perfEvtsSendAll]: "perfEvtsSendAll",
    [eConfigEnum.idLength]: "idLength",
    [eConfigEnum.cookieDomain]: "cookieDomain",
    [eConfigEnum.cookiePath]: "cookiePath",
    [eConfigEnum.disableCookiesUsage]: "disableCookiesUsage",
    [eConfigEnum.cookieCfg]: "cookieCfg",
    [eConfigEnum.disablePageUnloadEvents]: "disablePageUnloadEvents",
    [eConfigEnum.disablePageShowEvents]: "disablePageShowEvents",
    [eConfigEnum.disableDbgExt]: "disableDbgExt",
    [eConfigEnum.emitLineDelimitedJson]: "emitLineDelimitedJson",
    [eConfigEnum.accountId]: "accountId",
    [eConfigEnum.sessionRenewalMs]: "sessionRenewalMs",
    [eConfigEnum.sessionExpirationMs]: "sessionExpirationMs",
    [eConfigEnum.maxBatchSizeInBytes]: "maxBatchSizeInBytes",
    [eConfigEnum.maxBatchInterval]: "maxBatchInterval",
    [eConfigEnum.enableDebug]: "enableDebug",
    [eConfigEnum.disableExceptionTracking]: "disableExceptionTracking",
    [eConfigEnum.disableTelemetry]: "disableTelemetry",
    [eConfigEnum.samplingPercentage]: "samplingPercentage",
    [eConfigEnum.autoTrackPageVisitTime]: "autoTrackPageVisitTime",
    [eConfigEnum.enableAutoRouteTracking]: "enableAutoRouteTracking",
    [eConfigEnum.disableAjaxTracking]: "disableAjaxTracking",
    [eConfigEnum.disableFetchTracking]: "disableFetchTracking",
    [eConfigEnum.excludeRequestFromAutoTrackingPatterns]: "excludeRequestFromAutoTrackingPatterns",
    [eConfigEnum.addRequestContext]: "addRequestContext",
    [eConfigEnum.overridePageViewDuration]: "overridePageViewDuration",
    [eConfigEnum.maxAjaxCallsPerView]: "maxAjaxCallsPerView",
    [eConfigEnum.disableDataLossAnalysis]: "disableDataLossAnalysis",
    [eConfigEnum.disableCorrelationHeaders]: "disableCorrelationHeaders",
    [eConfigEnum.distributedTracingMode]: "distributedTracingMode",
    [eConfigEnum.correlationHeaderExcludedDomains]: "correlationHeaderExcludedDomains",
    [eConfigEnum.disableFlushOnBeforeUnload]: "disableFlushOnBeforeUnload",
    [eConfigEnum.disableFlushOnUnload]: "disableFlushOnUnload",
    [eConfigEnum.enableSessionStorageBuffer]: "enableSessionStorageBuffer",
    [eConfigEnum.isCookieUseDisabled]: "isCookieUseDisabled",
    [eConfigEnum.isRetryDisabled]: "isRetryDisabled",
    [eConfigEnum.url]: "url",
    [eConfigEnum.isStorageUseDisabled]: "isStorageUseDisabled",
    [eConfigEnum.isBeaconApiDisabled]: "isBeaconApiDisabled",
    [eConfigEnum.disableXhr]: "disableXhr",
    [eConfigEnum.onunloadDisableFetch]: "onunloadDisableFetch",
    [eConfigEnum.sdkExtension]: "sdkExtension",
    [eConfigEnum.isBrowserLinkTrackingEnabled]: "isBrowserLinkTrackingEnabled",
    [eConfigEnum.appId]: "appId",
    [eConfigEnum.enableCorsCorrelation]: "enableCorsCorrelation",
    [eConfigEnum.namePrefix]: "namePrefix",
    [eConfigEnum.sessionCookiePostfix]: "sessionCookiePostfix",
    [eConfigEnum.userCookiePostfix]: "userCookiePostfix",
    [eConfigEnum.enableRequestHeaderTracking]: "enableRequestHeaderTracking",
    [eConfigEnum.enableResponseHeaderTracking]: "enableResponseHeaderTracking",
    [eConfigEnum.enableAjaxErrorStatusText]: "enableAjaxErrorStatusText",
    [eConfigEnum.enableAjaxPerfTracking]: "enableAjaxPerfTracking",
    [eConfigEnum.maxAjaxPerfLookupAttempts]: "maxAjaxPerfLookupAttempts",
    [eConfigEnum.ajaxPerfLookupDelay]: "ajaxPerfLookupDelay",
    [eConfigEnum.onunloadDisableBeacon]: "onunloadDisableBeacon",
    [eConfigEnum.autoExceptionInstrumented]: "autoExceptionInstrumented",
    [eConfigEnum.correlationHeaderDomains]: "correlationHeaderDomains",
    [eConfigEnum.autoUnhandledPromiseInstrumented]: "autoUnhandledPromiseInstrumented",
    [eConfigEnum.enableUnhandledPromiseRejectionTracking]: "enableUnhandledPromiseRejectionTracking",
    [eConfigEnum.correlationHeaderExcludePatterns]: "correlationHeaderExcludePatterns",
    [eConfigEnum.customHeaders]: "customHeaders",
    [eConfigEnum.convertUndefined]: "convertUndefined",
    [eConfigEnum.eventsLimitInMem]: "eventsLimitInMem"
}>({
    instrumentationKey: eConfigEnum.instrumentationKey,
    connectionString: eConfigEnum.connectionString,
    diagnosticLogInterval: eConfigEnum.diagnosticLogInterval,
    maxMessageLimit: eConfigEnum.maxMessageLimit,
    loggingLevelConsole: eConfigEnum.loggingLevelConsole,
    loggingLevelTelemetry: eConfigEnum.loggingLevelTelemetry,
    enableDebugExceptions: eConfigEnum.enableDebugExceptions,
    endpointUrl: eConfigEnum.endpointUrl,
    extensionConfig: eConfigEnum.extensionConfig,
    extensions: eConfigEnum.extensions,
    channels: eConfigEnum.channels,
    disableInstrumentationKeyValidation: eConfigEnum.disableInstrumentationKeyValidation,
    enablePerfMgr: eConfigEnum.enablePerfMgr,
    createPerfMgr: eConfigEnum.createPerfMgr,
    perfEvtsSendAll: eConfigEnum.perfEvtsSendAll,
    idLength: eConfigEnum.idLength,
    cookieDomain: eConfigEnum.cookieDomain,
    cookiePath: eConfigEnum.cookiePath,
    disableCookiesUsage: eConfigEnum.disableCookiesUsage,
    cookieCfg: eConfigEnum.cookieCfg,
    disablePageUnloadEvents: eConfigEnum.disablePageUnloadEvents,
    disablePageShowEvents: eConfigEnum.disablePageShowEvents,
    disableDbgExt: eConfigEnum.disableDbgExt,
    emitLineDelimitedJson: eConfigEnum.emitLineDelimitedJson,
    accountId: eConfigEnum.accountId,
    sessionRenewalMs: eConfigEnum.sessionRenewalMs,
    sessionExpirationMs: eConfigEnum.sessionExpirationMs,
    maxBatchSizeInBytes: eConfigEnum.maxBatchSizeInBytes,
    maxBatchInterval: eConfigEnum.maxBatchInterval,
    enableDebug: eConfigEnum.enableDebug,
    disableExceptionTracking: eConfigEnum.disableExceptionTracking,
    disableTelemetry: eConfigEnum.disableTelemetry,
    samplingPercentage: eConfigEnum.samplingPercentage,
    autoTrackPageVisitTime: eConfigEnum.autoTrackPageVisitTime,
    enableAutoRouteTracking: eConfigEnum.enableAutoRouteTracking,
    disableAjaxTracking: eConfigEnum.disableAjaxTracking,
    disableFetchTracking: eConfigEnum.disableFetchTracking,
    excludeRequestFromAutoTrackingPatterns: eConfigEnum.excludeRequestFromAutoTrackingPatterns,
    addRequestContext: eConfigEnum.addRequestContext,
    overridePageViewDuration: eConfigEnum.overridePageViewDuration,
    maxAjaxCallsPerView: eConfigEnum.maxAjaxCallsPerView,
    disableDataLossAnalysis: eConfigEnum.disableDataLossAnalysis,
    disableCorrelationHeaders: eConfigEnum.disableCorrelationHeaders,
    distributedTracingMode: eConfigEnum.distributedTracingMode,
    correlationHeaderExcludedDomains: eConfigEnum.correlationHeaderExcludedDomains,
    disableFlushOnBeforeUnload: eConfigEnum.disableFlushOnBeforeUnload,
    disableFlushOnUnload: eConfigEnum.disableFlushOnUnload,
    enableSessionStorageBuffer: eConfigEnum.enableSessionStorageBuffer,
    isCookieUseDisabled: eConfigEnum.isCookieUseDisabled,
    isRetryDisabled: eConfigEnum.isRetryDisabled,
    url: eConfigEnum.url,
    isStorageUseDisabled: eConfigEnum.isStorageUseDisabled,
    isBeaconApiDisabled: eConfigEnum.isBeaconApiDisabled,
    disableXhr: eConfigEnum.disableXhr,
    onunloadDisableFetch: eConfigEnum.onunloadDisableFetch,
    sdkExtension: eConfigEnum.sdkExtension,
    isBrowserLinkTrackingEnabled: eConfigEnum.isBrowserLinkTrackingEnabled,
    appId: eConfigEnum.appId,
    enableCorsCorrelation: eConfigEnum.enableCorsCorrelation,
    namePrefix: eConfigEnum.namePrefix,
    sessionCookiePostfix: eConfigEnum.sessionCookiePostfix,
    userCookiePostfix: eConfigEnum.userCookiePostfix,
    enableRequestHeaderTracking: eConfigEnum.enableRequestHeaderTracking,
    enableResponseHeaderTracking: eConfigEnum.enableResponseHeaderTracking,
    enableAjaxErrorStatusText: eConfigEnum.enableAjaxErrorStatusText,
    enableAjaxPerfTracking: eConfigEnum.enableAjaxPerfTracking,
    maxAjaxPerfLookupAttempts: eConfigEnum.maxAjaxPerfLookupAttempts,
    ajaxPerfLookupDelay: eConfigEnum.ajaxPerfLookupDelay,
    onunloadDisableBeacon: eConfigEnum.onunloadDisableBeacon,
    autoExceptionInstrumented: eConfigEnum.autoExceptionInstrumented,
    correlationHeaderDomains: eConfigEnum.correlationHeaderDomains,
    autoUnhandledPromiseInstrumented: eConfigEnum.autoUnhandledPromiseInstrumented,
    enableUnhandledPromiseRejectionTracking: eConfigEnum.enableUnhandledPromiseRejectionTracking,
    correlationHeaderExcludePatterns: eConfigEnum.correlationHeaderExcludePatterns,
    customHeaders: eConfigEnum.customHeaders,
    convertUndefined: eConfigEnum.convertUndefined,
    eventsLimitInMem: eConfigEnum.eventsLimitInMem
});
