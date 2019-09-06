// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { IConfiguration, CoreUtils } from '@microsoft/applicationinsights-core-js';
import { DistributedTracingModes } from '../Enums';

/**
 * @description Configuration settings for how telemetry is sent
 * @export
 * @interface IConfig
 */
export interface IConfig {

    /**
     * @description
     * @type {boolean}
     * @memberof IConfig
     */
    emitLineDelimitedJson?: boolean;

    /**
     * @description An optional account id, if your app groups users into accounts. No spaces, commas, semicolons, equals, or vertical bars.
     * @type {string}
     * @memberof IConfig
     */
    accountId?: string;

    /**
     * @description A session is logged if the user is inactive for this amount of time in milliseconds. Default 30 mins.
     * @type {number}
     * @memberof IConfig
     * @default 30*60*1000
     */
    sessionRenewalMs?: number;

    /**
     * @description A session is logged if it has continued for this amount of time in milliseconds. Default 24h.
     * @type {number}
     * @memberof IConfig
     * @default 24*60*60*1000
     */
    sessionExpirationMs?: number;

    /**
     * @description Max size of telemetry batch. If batch exceeds limit, it is sent and a new batch is started
     * @type {number}
     * @memberof IConfig
     * @default 100000
     */
    maxBatchSizeInBytes?: number;

    /**
     * @description How long to batch telemetry for before sending (milliseconds)
     * @type {number}
     * @memberof IConfig
     * @default 15 seconds
     */
    maxBatchInterval?: number;

    /**
     * @description If true, debugging data is thrown as an exception by the logger. Default false
     * @type {boolean}
     * @memberof IConfig
     * @defaultValue false
     */
    enableDebug?: boolean;

    /**
     * @description If true, exceptions are not autocollected. Default is false
     * @type {boolean}
     * @memberof IConfig
     * @defaultValue false
     */
    disableExceptionTracking?: boolean;

    /**
     * @description If true, telemetry is not collected or sent. Default is false
     * @type {boolean}
     * @memberof IConfig
     * @defaultValue false
     */
    disableTelemetry?: boolean;

    /**
     * @description Percentage of events that will be sent. Default is 100, meaning all events are sent.
     * @type {number}
     * @memberof IConfig
     * @defaultValue 100
     */
    samplingPercentage?: number;

    /**
     * @description
     * @type {boolean}
     * @memberof IConfig
     */
    autoTrackPageVisitTime?: boolean;

    /**
     * @description Automatically track route changes in Single Page Applications (SPA). If true, each route change will send a new Pageview to Application Insights.
     * @type {boolean}
     * @memberof IConfig
     */
    enableAutoRouteTracking?: boolean;

    /**
     * @description If true, Ajax calls are not autocollected. Default is false
     * @type {boolean}
     * @memberof IConfig
     * @defaultValue false
     */
    disableAjaxTracking?: boolean;

    /**
     * @description If true, Fetch requests are not autocollected. Default is true.
     * @type {boolean}
     * @memberof IConfig
     * @defaultValue true
     */
    disableFetchTracking?: boolean;

    /**
     * @description If true, default behavior of trackPageView is changed to record end of page view duration interval when trackPageView is called. If false and no custom duration is provided to trackPageView, the page view performance is calculated using the navigation timing API. Default is false
     * @type {boolean}
     * @memberof IConfig
     * @defaultValue false
     */
    overridePageViewDuration?: boolean;

    /**
     * @description Default 500 - controls how many ajax calls will be monitored per page view. Set to -1 to monitor all (unlimited) ajax calls on the page.
     * @type {number}
     * @memberof IConfig
     */
    maxAjaxCallsPerView?: number;

    /**
     * @ignore
     * @description If false, internal telemetry sender buffers will be checked at startup for items not yet sent. Default is true
     * @type {boolean}
     * @memberof IConfig
     * @defaultValue true
     */
    disableDataLossAnalysis?: boolean;

    /**
     * @description If false, the SDK will add two headers ('Request-Id' and 'Request-Context') to all dependency requests to correlate them with corresponding requests on the server side. Default is false.
     * @type {boolean}
     * @memberof IConfig
     * @defaultValue false
     */
    disableCorrelationHeaders?: boolean;

    /**
     * @description Sets the distributed tracing mode. If AI_AND_W3C mode or W3C mode is set, W3C trace context headers (traceparent/tracestate) will be generated and included in all outgoing requests. 
     * AI_AND_W3C is provided for back-compatibility with any legacy Application Insights instrumented services
     * @type {enum}
     * @memberof IConfig
     * @defaultValue AI
     */
    distributedTracingMode?: DistributedTracingModes;

    /**
     * @description Disable correlation headers for specific domain
     * @type {string[]}
     * @memberof IConfig
     */
    correlationHeaderExcludedDomains?: string[];

    /**
     * @description Default false. If true, flush method will not be called when onBeforeUnload event triggers.
     * @type {boolean}
     * @memberof IConfig
     */
    disableFlushOnBeforeUnload?: boolean;

    /**
     * @description If true, the buffer with all unsent telemetry is stored in session storage. The buffer is restored on page load. Default is true.
     * @type {boolean}
     * @memberof IConfig
     * @defaultValue true
     */
    enableSessionStorageBuffer?: boolean;

    /**
     * @description If true, the SDK will not store or read any data from cookies. Default is false.
     * @type {boolean}
     * @memberof IConfig
     * @defaultValue false
     */
    isCookieUseDisabled?: boolean;

    /**
     * @description Custom cookie domain. This is helpful if you want to share Application Insights cookies across subdomains.
     * @type {string}
     * @memberof IConfig
     * @defaultValue ""
     */
    cookieDomain?: string;

    /** 
     * Default false. If false, retry on 206 (partial success), 408 (timeout), 429 (too many requests), 500 (internal server error), 503 (service unavailable), and 0 (offline, only if detected)
     * @description
     * @type {boolean}
     * @memberof IConfig
     * @defaultValue false
     */
    isRetryDisabled?: boolean;

    /**
     * @deprecated Used when initizialing from snippet only.
     * @description  The url from where the JS SDK will be downloaded. Default 'https://az416426.vo.msecnd.net/scripts/beta/ai.1.js'
     * @type {string}
     * @memberof IConfig
     * @defaultValue "https://az416426.vo.msecnd.net/scripts/beta/ai.1.js"
     */
    url?: string;

    /**
     * @description If true, the SDK will not store or read any data from local and session storage. Default is false.
     * @type {boolean}
     * @memberof IConfig
     * @defaultValue false
     */
    isStorageUseDisabled?: boolean;

    /**
     * @description If false, the SDK will send all telemetry using the [Beacon API](https://www.w3.org/TR/beacon)
     * @type {boolean}
     * @memberof IConfig
     * @defaultValue true
     */
    isBeaconApiDisabled?: boolean;

    /**
     * @description Sets the sdk extension name. Only alphabetic characters are allowed. The extension name is added as a prefix to the 'ai.internal.sdkVersion' tag (e.g. 'ext_javascript:2.0.0'). Default is null.
     * @type {string}
     * @memberof IConfig
     * @defaultValue null
     */
    sdkExtension?: string;

    /**
     * @description Default is false. If true, the SDK will track all [Browser Link](https://docs.microsoft.com/en-us/aspnet/core/client-side/using-browserlink) requests.
     * @type {boolean}
     * @memberof IConfig
     * @defaultValue false
     */
    isBrowserLinkTrackingEnabled?: boolean;

    /**
     * @description AppId is used for the correlation between AJAX dependencies happening on the client-side with the server-side requets. When Beacon API is enabled, it cannot be used automatically, but can be set manually in the configuration. Default is null
     * @type {string}
     * @memberof IConfig
     * @defaultValue null
     */
    appId?: string;

    /**
     * @description If true, the SDK will add two headers ('Request-Id' and 'Request-Context') to all CORS requests tocorrelate outgoing AJAX dependencies with corresponding requests on the server side. Default is false
     * @type {boolean}
     * @memberof IConfig
     * @defaultValue false
     */
    enableCorsCorrelation?: boolean;

    /**
     * @description An optional value that will be used as name postfix for localStorage and cookie name.
     * @type {string}
     * @memberof IConfig
     * @defaultValue null
     */
    namePrefix?: string;

    /**
     * @description An optional value that will track Request Header through trackDependency function.
     * @type {boolean}
     * @memberof IConfig
     * @defaultValue false
     */
    enableRequestHeaderTracking?: boolean;

    /**
     * @description An optional value that will track Resonse Header through trackDependency function.
     * @type {boolean}
     * @memberof IConfig
     * @defaultValue false
     */
    enableResponseHeaderTracking?: boolean;

    /**
     * @description Default false. when tab is closed, the SDK will send all remaining telemetry using the [Beacon API](https://www.w3.org/TR/beacon)
     * @type {boolean}
     * @memberof IConfig
     * @defaultValue false
     */
    onunloadDisableBeacon?: boolean;

    // Internal

    /**
     * @ignore
     * @description Internal only
     * @type {boolean}
     * @memberof IConfig
     */
    autoExceptionInstrumented?: boolean;
    correlationHeaderDomains?: string[]
}

export class ConfigurationManager {
    public static getConfig(config: IConfiguration & IConfig, field: string, identifier?: string, defaultValue: number | string | boolean = false): number | string | boolean {
        let configValue;
        if (identifier && config.extensionConfig && config.extensionConfig[identifier] && !CoreUtils.isNullOrUndefined(config.extensionConfig[identifier][field])) {
            configValue = config.extensionConfig[identifier][field];
        } else {
            configValue = config[field];
        }

        return !CoreUtils.isNullOrUndefined(configValue) ? configValue : defaultValue;
    }
}
