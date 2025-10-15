// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { DistributedTracingModes } from "../Enums/Enums";
import { IRequestContext } from "./IRequestContext";
import { ICustomProperties } from "./ITelemetryItem";

export interface ICorrelationConfig {
    enableCorsCorrelation: boolean;

    /**
     * [Optional] Domains to be excluded from correlation headers.
     * To override or discard the default, add an array with all domains to be excluded or
     * an empty array to the configuration.
     *
     * @example
     * ```ts
     * import { ApplicationInsights } from '@microsoft/applicationinsights-web';
     * const appInsights = new ApplicationInsights({
     *    config: {
     *       connectionString: 'InstrumentationKey=YOUR_INSTRUMENTATION_KEY_GOES_HERE',
     *       extensionConfig: {
     *          AjaxDependencyPlugin: {
     *              // Both arrays of strings are used to match the request URL against the
     *              // current host and the request URL to determine if correlation headers
     *              // The strings are converted to RegExp objects by translating
     *              // - `.` to `\\.` (to match a literal dot)
     *              // - `*` to `.*` (to match any character)
     *              // - `\` to `\\` (to match a literal slash)
     *              // All other characters are ignored and passed to the RegExp constructor
     *              correlationHeaderExcludedDomains: ["test", "*.azure.com", "ignore.microsoft.com"],
     *              correlationHeaderDomains: ["azure.com", "prefix.bing.com", "*.microsoft.com", "example.com"]
     *          }
     *       }
     * });
     * appInsights.loadAppInsights();
     * appInsights.trackPageView(); // Manually call trackPageView to establish the current user/session/pageview
     * ```
     */
    correlationHeaderExcludedDomains: string[];

    /**
     * [Optional] Domains to be included in correlation headers.
     * To override or discard the default, add an array with all domains to be included or
     * an empty array to the configuration.
     *
     * @example
     * ```ts
     * import { ApplicationInsights } from '@microsoft/applicationinsights-web';
     * const appInsights = new ApplicationInsights({
     *    config: {
     *       connectionString: 'InstrumentationKey=YOUR_INSTRUMENTATION_KEY_GOES_HERE',
     *       extensionConfig: {
     *          AjaxDependencyPlugin: {
     *              // Values MUST be RegExp objects
     *              correlationHeaderExcludePatterns: [/*\.azure.com/, /prefix.bing.com/, /.*\.microsoft.com/, /example.com/]
     *          }
     *       }
     * });
     * appInsights.loadAppInsights();
     * appInsights.trackPageView(); // Manually call trackPageView to establish the current user/session/pageview
     * ```
     */
    correlationHeaderExcludePatterns?: RegExp[];
    disableCorrelationHeaders: boolean;

    /**
     * The distributed tracing mode to use for this configuration.
     * Defaults to AI_AND_W3C.
     * This is used to determine which headers are sent with requests and how the
     * telemetry is correlated across services.
     * @default AI_AND_W3C
     * @see {@link DistributedTracingModes}
     */
    distributedTracingMode: DistributedTracingModes;
    
    maxAjaxCallsPerView: number;
    disableAjaxTracking: boolean;
    disableFetchTracking: boolean;
    appId?: string;
    enableRequestHeaderTracking?: boolean;
    enableResponseHeaderTracking?: boolean;
    enableAjaxErrorStatusText?: boolean;

    /**
     * Flag to enable looking up and including additional browser window.performance timings
     * in the reported ajax (XHR and fetch) reported metrics.
     * Defaults to false.
     */
    enableAjaxPerfTracking?: boolean;

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
     * [Optional] Domains to be excluded from correlation headers.
     * To override or discard the default, add an array with all domains to be excluded or
     * an empty array to the configuration.
     *
     * @example
     * ```ts
     * import { ApplicationInsights } from '@microsoft/applicationinsights-web';
     * const appInsights = new ApplicationInsights({
     *    config: {
     *       connectionString: 'InstrumentationKey=YOUR_INSTRUMENTATION_KEY_GOES_HERE',
     *       extensionConfig: {
     *          AjaxDependencyPlugin: {
     *              // Both arrays of strings are used to match the request URL against the
     *              // current host and the request URL to determine if correlation headers
     *              // The strings are converted to RegExp objects by translating
     *              // - `.` to `\\.` (to match a literal dot)
     *              // - `*` to `.*` (to match any character)
     *              // - `\` to `\\` (to match a literal slash)
     *              // All other characters are ignored and passed to the RegExp constructor
     *              correlationHeaderExcludedDomains: ["test", "*.azure.com", "ignore.microsoft.com"],
     *              correlationHeaderDomains: ["azure.com", "prefix.bing.com", "*.microsoft.com", "example.com"]
     *          }
     *       }
     * });
     * appInsights.loadAppInsights();
     * appInsights.trackPageView(); // Manually call trackPageView to establish the current user/session/pageview
     * ```
     */
    correlationHeaderDomains?: string[];

    /**
     * [Optional] Response and request headers to be excluded from AJAX & Fetch tracking data.
     * To override or discard the default, add an array with all headers to be excluded or
     * an empty array to the configuration.
     *
     * For example: `["Authorization", "X-API-Key", "WWW-Authenticate"]`
     *
     * @example
     * ```js
     * import { ApplicationInsights } from '@microsoft/applicationinsights-web';
     * import { AjaxPlugin } from '@microsoft/applicationinsights-dependencies-js';
     *
     * const dependencyPlugin = new AjaxPlugin();
     * const appInsights = new ApplicationInsights({
     *     config: {
     *         connectionString: 'InstrumentationKey=YOUR_INSTRUMENTATION_KEY_GOES_HERE',
     *         extensions: [dependencyPlugin],
     *         extensionConfig: {
     *             AjaxDependencyPlugin: {
     *                 ignoreHeaders: [
     *                     "Authorization",
     *                     "X-API-Key",
     *                     "WWW-Authenticate"
     *                 ]
     *             }
     *         }
     *     }
     * });
     * appInsights.loadAppInsights();
     * appInsights.trackPageView(); // Manually call trackPageView to establish the current user/session/pageview
     * ```
     */
    ignoreHeaders?: string[];

    /**
     * Provide a way to exclude specific route from automatic tracking for XMLHttpRequest or Fetch request.
     * For an ajax / fetch request that the request url matches with the regex patterns, auto tracking is turned off.
     * Default is undefined.
     */
    excludeRequestFromAutoTrackingPatterns?: string[] | RegExp[];

    /**
     * Provide a way to enrich dependencies logs with context at the beginning of api call.
     * Default is undefined.
     */
    addRequestContext?: (requestContext?: IRequestContext) => ICustomProperties;

    /**
     * [Optional] Flag to indicate whether the internal looking endpoints should be automatically
     * added to the `excludeRequestFromAutoTrackingPatterns` collection. (defaults to true).
     * This flag exists as the provided regex is generic and may unexpectedly match a domain that
     * should not be excluded.
     */
    addIntEndpoints?: boolean;
}