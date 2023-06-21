// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { IConfiguration, ICustomProperties, isNullOrUndefined } from "@microsoft/applicationinsights-core-js";
import { DistributedTracingModes } from "../Enums";
import { IRequestContext } from "./IRequestContext";
import { IStorageBuffer } from "./IStorageBuffer";

/**
 * Configuration settings for how telemetry is sent
 * @export
 * @interface IConfig
 */
export interface IConfig {

    /**
     * The JSON format (normal vs line delimited). True means line delimited JSON.
     */
    emitLineDelimitedJson?: boolean;

    /**
     * An optional account id, if your app groups users into accounts. No spaces, commas, semicolons, equals, or vertical bars.
     */
    accountId?: string;

    /**
     * A session is logged if the user is inactive for this amount of time in milliseconds. Default 30 mins.
     * @default 30*60*1000
     */
    sessionRenewalMs?: number;

    /**
     * A session is logged if it has continued for this amount of time in milliseconds. Default 24h.
     * @default 24*60*60*1000
     */
    sessionExpirationMs?: number;

    /**
     * Max size of telemetry batch. If batch exceeds limit, it is sent and a new batch is started
     * @default 100000
     */
    maxBatchSizeInBytes?: number;

    /**
     * How long to batch telemetry for before sending (milliseconds)
     * @default 15 seconds
     */
    maxBatchInterval?: number;

    /**
     * If true, debugging data is thrown as an exception by the logger. Default false
     * @defaultValue false
     */
    enableDebug?: boolean;

    /**
     * If true, exceptions are not autocollected. Default is false
     * @defaultValue false
     */
    disableExceptionTracking?: boolean;

    /**
     * If true, telemetry is not collected or sent. Default is false
     * @defaultValue false
     */
    disableTelemetry?: boolean;

    /**
     * Percentage of events that will be sent. Default is 100, meaning all events are sent.
     * @defaultValue 100
     */
    samplingPercentage?: number;

    /**
     * If true, on a pageview, the previous instrumented page's view time is tracked and sent as telemetry and a new timer is started for the current pageview. It is sent as a custom metric named PageVisitTime in milliseconds and is calculated via the Date now() function (if available) and falls back to (new Date()).getTime() if now() is unavailable (IE8 or less). Default is false.
     */
    autoTrackPageVisitTime?: boolean;

    /**
     * Automatically track route changes in Single Page Applications (SPA). If true, each route change will send a new Pageview to Application Insights.
     */
    enableAutoRouteTracking?: boolean;

    /**
     * If true, Ajax calls are not autocollected. Default is false
     * @defaultValue false
     */
    disableAjaxTracking?: boolean;

    /**
     * If true, Fetch requests are not autocollected. Default is false (Since 2.8.0, previously true).
     * @defaultValue false
     */
    disableFetchTracking?: boolean;

    /**
     * Provide a way to exclude specific route from automatic tracking for XMLHttpRequest or Fetch request. For an ajax / fetch request that the request url matches with the regex patterns, auto tracking is turned off.
     * @defaultValue undefined.
     */
    excludeRequestFromAutoTrackingPatterns?: string[] | RegExp[];

    /**
     * Provide a way to enrich dependencies logs with context at the beginning of api call.
     * Default is undefined.
     */
    addRequestContext?: (requestContext?: IRequestContext) => ICustomProperties;

    /**
     * If true, default behavior of trackPageView is changed to record end of page view duration interval when trackPageView is called. If false and no custom duration is provided to trackPageView, the page view performance is calculated using the navigation timing API. Default is false
     * @defaultValue false
     */
    overridePageViewDuration?: boolean;

    /**
     * Default 500 - controls how many ajax calls will be monitored per page view. Set to -1 to monitor all (unlimited) ajax calls on the page.
     */
    maxAjaxCallsPerView?: number;

    /**
     * @ignore
     * If false, internal telemetry sender buffers will be checked at startup for items not yet sent. Default is true
     * @defaultValue true
     */
    disableDataLossAnalysis?: boolean;

    /**
     * If false, the SDK will add two headers ('Request-Id' and 'Request-Context') to all dependency requests to correlate them with corresponding requests on the server side. Default is false.
     * @defaultValue false
     */
    disableCorrelationHeaders?: boolean;

    /**
     * Sets the distributed tracing mode. If AI_AND_W3C mode or W3C mode is set, W3C trace context headers (traceparent/tracestate) will be generated and included in all outgoing requests.
     * AI_AND_W3C is provided for back-compatibility with any legacy Application Insights instrumented services
     * @defaultValue AI_AND_W3C
     */
    distributedTracingMode?: DistributedTracingModes;

    /**
     * Disable correlation headers for specific domain
     */
    correlationHeaderExcludedDomains?: string[];

    /**
     * Default false. If true, flush method will not be called when onBeforeUnload, onUnload, onPageHide or onVisibilityChange (hidden state) event(s) trigger.
     */
    disableFlushOnBeforeUnload?: boolean;

    /**
     * Default value of {@link #disableFlushOnBeforeUnload}. If true, flush method will not be called when onPageHide or onVisibilityChange (hidden state) event(s) trigger.
     */
    disableFlushOnUnload?: boolean;

    /**
     * [Optional] An array of the page unload events that you would like to be ignored, special note there must be at least one valid unload
     * event hooked, if you list all or the runtime environment only supports a listed "disabled" event it will still be hooked if required by the SDK.
     * (Some page unload functionality may be disabled via disableFlushOnBeforeUnload or disableFlushOnUnload config entries)
     * Unload events include "beforeunload", "unload", "visibilitychange" (with 'hidden' state) and "pagehide"
     */
    disablePageUnloadEvents?: string[];

    /**
     * [Optional] An array of page show events that you would like to be ignored, special note there must be at lease one valid show event
     * hooked, if you list all or the runtime environment only supports a listed (disabled) event it will STILL be hooked if required by the SDK.
     * Page Show events include "pageshow" and "visibilitychange" (with 'visible' state)
     */
    disablePageShowEvents?: string[];
 
    /**
     * If true, the buffer with all unsent telemetry is stored in session storage. The buffer is restored on page load. Default is true.
     * @defaultValue true
     */
    enableSessionStorageBuffer?: boolean;

    /**
     * If specified, overrides the storage & retrieval mechanism that is used to manage unsent telemetry.
     */
    bufferOverride?: IStorageBuffer;

    /**
     * @deprecated Use either disableCookiesUsage or specify a cookieCfg with the enabled value set.
     * If true, the SDK will not store or read any data from cookies. Default is false. As this field is being deprecated, when both
     * isCookieUseDisabled and disableCookiesUsage are used disableCookiesUsage will take precedent.
     * @defaultValue false
     */
    isCookieUseDisabled?: boolean;

    /**
     * If true, the SDK will not store or read any data from cookies. Default is false.
     * If you have also specified a cookieCfg then enabled property (if specified) will take precedent over this value.
     * @defaultValue false
     */
    disableCookiesUsage?: boolean;

    /**
     * Custom cookie domain. This is helpful if you want to share Application Insights cookies across subdomains.
     * @defaultValue ""
     */
    cookieDomain?: string;

    /**
     * Custom cookie path. This is helpful if you want to share Application Insights cookies behind an application gateway.
     * @defaultValue ""
     */
    cookiePath?: string;

    /**
     * Default false. If false, retry on 206 (partial success), 408 (timeout), 429 (too many requests), 500 (internal server error), 503 (service unavailable), and 0 (offline, only if detected)
     * @description
     * @defaultValue false
     */
    isRetryDisabled?: boolean;

    /**
     * @deprecated Used when initizialing from snippet only.
     *  The url from where the JS SDK will be downloaded.
     */
    url?: string;

    /**
     * If true, the SDK will not store or read any data from local and session storage. Default is false.
     * @defaultValue false
     */
    isStorageUseDisabled?: boolean;

    /**
     * If false, the SDK will send all telemetry using the [Beacon API](https://www.w3.org/TR/beacon)
     * @defaultValue true
     */
    isBeaconApiDisabled?: boolean;

    /**
     * Don't use XMLHttpRequest or XDomainRequest (for IE < 9) by default instead attempt to use fetch() or sendBeacon.
     * If no other transport is available it will still use XMLHttpRequest
     */
    disableXhr?: boolean;

    /**
     * If fetch keepalive is supported do not use it for sending events during unload, it may still fallback to fetch() without keepalive
     */
    onunloadDisableFetch?: boolean;

    /**
     * Sets the sdk extension name. Only alphabetic characters are allowed. The extension name is added as a prefix to the 'ai.internal.sdkVersion' tag (e.g. 'ext_javascript:2.0.0'). Default is null.
     * @defaultValue null
     */
    sdkExtension?: string;

    /**
     * Default is false. If true, the SDK will track all [Browser Link](https://docs.microsoft.com/en-us/aspnet/core/client-side/using-browserlink) requests.
     * @defaultValue false
     */
    isBrowserLinkTrackingEnabled?: boolean;

    /**
     * AppId is used for the correlation between AJAX dependencies happening on the client-side with the server-side requets. When Beacon API is enabled, it cannot be used automatically, but can be set manually in the configuration. Default is null
     * @defaultValue null
     */
    appId?: string;

    /**
     * If true, the SDK will add two headers ('Request-Id' and 'Request-Context') to all CORS requests to correlate outgoing AJAX dependencies with corresponding requests on the server side. Default is false
     * @defaultValue false
     */
    enableCorsCorrelation?: boolean;

    /**
     * An optional value that will be used as name postfix for localStorage and session cookie name.
     * @defaultValue null
     */
    namePrefix?: string;

    /**
     * An optional value that will be used as name postfix for session cookie name. If undefined, namePrefix is used as name postfix for session cookie name.
     * @defaultValue null
     */
    sessionCookiePostfix?: string;

    /**
     * An optional value that will be used as name postfix for user cookie name. If undefined, no postfix is added on user cookie name.
     * @defaultValue null
     */
    userCookiePostfix?: string;

    /**
     * An optional value that will track Request Header through trackDependency function.
     * @defaultValue false
     */
    enableRequestHeaderTracking?: boolean;

    /**
     * An optional value that will track Response Header through trackDependency function.
     * @defaultValue false
     */
    enableResponseHeaderTracking?: boolean;

    /**
     * An optional value that will track Response Error data through trackDependency function.
     * @defaultValue false
     */
    enableAjaxErrorStatusText?: boolean;

    /**
     * Flag to enable looking up and including additional browser window.performance timings
     * in the reported ajax (XHR and fetch) reported metrics.
     * Defaults to false.
     */
    enableAjaxPerfTracking?:boolean;

    /**
     * The maximum number of times to look for the window.performance timings (if available), this
     * is required as not all browsers populate the window.performance before reporting the
     * end of the XHR request and for fetch requests this is added after its complete
     * Defaults to 3
     */
    maxAjaxPerfLookupAttempts?: number;

    /**
     * The amount of time to wait before re-attempting to find the windows.performance timings
     * for an ajax request, time is in milliseconds and is passed directly to setTimeout()
     * Defaults to 25.
     */
    ajaxPerfLookupDelay?: number;
        
    /**
     * Default false. when tab is closed, the SDK will send all remaining telemetry using the [Beacon API](https://www.w3.org/TR/beacon)
     * @defaultValue false
     */
    onunloadDisableBeacon?: boolean;

    // Internal

    /**
     * @ignore
     * Internal only
     */
    autoExceptionInstrumented?: boolean;

    /**
     *
     */
    correlationHeaderDomains?: string[]

    /**
     * @ignore
     * Internal only
     */
    autoUnhandledPromiseInstrumented?: boolean;

    /**
     * Default false. Define whether to track unhandled promise rejections and report as JS errors.
     * When disableExceptionTracking is enabled (dont track exceptions) this value will be false.
     * @defaultValue false
     */
    enableUnhandledPromiseRejectionTracking?: boolean;

    /**
     * Disable correlation headers using regular expressions
     */
    correlationHeaderExcludePatterns?: RegExp[];

    /**
     * The ability for the user to provide extra headers
     */
    customHeaders?: [{header: string, value: string}];

    /**
     * Provide user an option to convert undefined field to user defined value.
     */
     convertUndefined?: any,

    /**
     * [Optional] The number of events that can be kept in memory before the SDK starts to drop events. By default, this is 10,000.
     */
    eventsLimitInMem?: number;

    /**
     * [Optional] Disable iKey deprecation error message.
     * @defaultValue true
     */
    disableIkeyDeprecationMessage?: boolean;

    /**
     * [Optional] Flag to indicate whether the internal looking endpoints should be automatically
     * added to the `excludeRequestFromAutoTrackingPatterns` collection. (defaults to true).
     * This flag exists as the provided regex is generic and may unexpectedly match a domain that
     * should not be excluded.
     */
    addIntEndpoints?: boolean;
}

export class ConfigurationManager {
    public static getConfig(config: IConfiguration & IConfig, field: string, identifier?: string, defaultValue: number | string | boolean = false): number | string | boolean {
        let configValue;
        if (identifier && config.extensionConfig && config.extensionConfig[identifier] && !isNullOrUndefined(config.extensionConfig[identifier][field])) {
            configValue = config.extensionConfig[identifier][field];
        } else {
            configValue = config[field];
        }

        return !isNullOrUndefined(configValue) ? configValue : defaultValue;
    }
}
