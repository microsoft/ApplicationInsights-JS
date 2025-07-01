// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IExceptionConfig } from "@microsoft/applicationinsights-core-js";

/**
 * Configuration interface specifically for AnalyticsPlugin
 * This interface defines only the configuration properties that the Analytics plugin uses.
 */
export interface IAnalyticsConfig {
    /**
     * A session is logged if the user is inactive for this amount of time in milliseconds. Default 30 mins.
     */
    sessionRenewalMs?: number;

    /**
     * A session is logged if it has continued for this amount of time in milliseconds. Default 24h.
     */
    sessionExpirationMs?: number;

    /**
     * If true, exceptions are not autocollected. Default is false
     */
    disableExceptionTracking?: boolean;

    /**
     * If true, on a pageview, the previous instrumented page's view time is tracked and sent as telemetry and a new timer is started for the current pageview.
     */
    autoTrackPageVisitTime?: boolean;

    /**
     * If true, default behavior of trackPageView is changed to record end of page view duration interval when trackPageView is called.
     */
    overridePageViewDuration?: boolean;

    /**
     * Default false. Define whether to track unhandled promise rejections and report as JS errors.
     */
    enableUnhandledPromiseRejectionTracking?: boolean;

    /**
     * Internal flag to track if unhandled promise instrumentation is already set up.
     */
    autoUnhandledPromiseInstrumented?: boolean;

    /**
     * Percentage of events that will be sent. Default is 100, meaning all events are sent.
     */
    samplingPercentage?: number;

    /**
     * If true, the SDK will not store or read any data from local and session storage. Default is false.
     */
    isStorageUseDisabled?: boolean;

    /**
     * Default is false. If true, the SDK will track all Browser Link requests.
     */
    isBrowserLinkTrackingEnabled?: boolean;

    /**
     * Automatically track route changes in Single Page Applications (SPA). If true, each route change will send a new Pageview to Application Insights.
     */
    enableAutoRouteTracking?: boolean;

    /**
     * An optional value that will be used as name postfix for localStorage and session cookie name.
     */
    namePrefix?: string;

    /**
     * If true, debugging data is thrown as an exception by the logger. Default false
     */
    enableDebug?: boolean;

    /**
     * Default false. If true, flush method will not be called when onBeforeUnload event triggers.
     */
    disableFlushOnBeforeUnload?: boolean;

    /**
     * Default value of disableFlushOnBeforeUnload. If true, flush method will not be called when onPageHide or onVisibilityChange (hidden state) event(s) trigger.
     */
    disableFlushOnUnload?: boolean;

    /**
     * Internal flag to track if exception instrumentation is already set up.
     */
    autoExceptionInstrumented?: boolean;

    /**
     * Exception configuration for additional exception handling options.
     */
    expCfg?: IExceptionConfig;
}
