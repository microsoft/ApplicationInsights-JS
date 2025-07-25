// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IExceptionConfig } from "@microsoft/applicationinsights-core-js";

/**
 * Configuration interface specifically for AnalyticsPlugin
 * This interface defines only the configuration properties that the Analytics plugin uses.
 */
export interface IAnalyticsConfig {
    /**
     * A session is logged if the user is inactive for this amount of time in milliseconds.
     * @default 1800000 (30 minutes)
     */
    sessionRenewalMs?: number;

    /**
     * A session is logged if it has continued for this amount of time in milliseconds.
     * @default 86400000 (24 hours)
     */
    sessionExpirationMs?: number;

    /**
     * If true, exceptions are not autocollected.
     * @default false
     */
    disableExceptionTracking?: boolean;

    /**
     * If true, on a pageview, the previous instrumented page's view time is tracked and sent as telemetry and a new timer is started for the current pageview.
     * @default false
     */
    autoTrackPageVisitTime?: boolean;

    /**
     * If true, default behavior of trackPageView is changed to record end of page view duration interval when trackPageView is called.
     * @default false
     */
    overridePageViewDuration?: boolean;

    /**
     * Define whether to track unhandled promise rejections and report as JS errors.
     * @default false
     */
    enableUnhandledPromiseRejectionTracking?: boolean;

    /**
     * Internal flag to track if unhandled promise instrumentation is already set up.
     * @default false
     * @internal Internal use only
     * @ignore INTERNAL ONLY
     */
    autoUnhandledPromiseInstrumented?: boolean;

    /**
     * Percentage of events that will be sent. Value must be between 0 and 100.
     * @default 100
     * @example 50 // Only send 50% of events
     */
    samplingPercentage?: number;

    /**
     * If true, the SDK will not store or read any data from local and session storage.
     * @default false
     */
    isStorageUseDisabled?: boolean;

    /**
     * If true, the SDK will track all Browser Link requests.
     * @default false
     */
    isBrowserLinkTrackingEnabled?: boolean;

    /**
     * Automatically track route changes in Single Page Applications (SPA). If true, each route change will send a new Pageview to Application Insights.
     * @default false
     */
    enableAutoRouteTracking?: boolean;

    /**
     * An optional value that will be used as name postfix for localStorage and session cookie name.
     * @default ""
     * @example "MyApp" // Results in localStorage keys like "ai_session_MyApp"
     */
    namePrefix?: string;

    /**
     * If true, debugging data is thrown as an exception by the logger.
     * @default false
     */
    enableDebug?: boolean;

    /**
     * If true, flush method will not be called when onBeforeUnload event triggers.
     * @default false
     */
    disableFlushOnBeforeUnload?: boolean;

    /**
     * If true, flush method will not be called when onPageHide or onVisibilityChange (hidden state) event(s) trigger.
     * @default false
     */
    disableFlushOnUnload?: boolean;

    /**
     * Internal flag to track if exception instrumentation is already set up.
     * @default false
     * @internal Internal use only
     * @ignore INTERNAL ONLY
     */
    autoExceptionInstrumented?: boolean;

    /**
     * Exception configuration for additional exception handling options.
     * @default { inclScripts: false, expLog: undefined, maxLogs: 50 }
     */
    expCfg?: IExceptionConfig;
}

