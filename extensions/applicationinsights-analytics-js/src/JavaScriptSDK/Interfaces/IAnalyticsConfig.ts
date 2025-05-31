// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IExceptionConfig } from "@microsoft/applicationinsights-core-js";

/**
 * Configuration interface specifically for AnalyticsPlugin
 * This interface defines the subset of configuration properties that are relevant to the Analytics plugin.
 */
export interface IAnalyticsConfig {
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
     * If true, exceptions are not autocollected. Default is false
     * @defaultValue false
     */
    disableExceptionTracking?: boolean;

    /**
     * If true, on a pageview, the previous instrumented page's view time is tracked and sent as telemetry and a new timer is started for the current pageview. It is sent as a custom metric named PageVisitTime in milliseconds and is calculated via the Date now() function (if available) and falls back to (new Date()).getTime() if now() is unavailable (IE8 or less). Default is false.
     */
    autoTrackPageVisitTime?: boolean;

    /**
     * If true, default behavior of trackPageView is changed to record end of page view duration interval when trackPageView is called. If false and no custom duration is provided to trackPageView, the page view performance is calculated using the navigation timing API. Default is false
     * @defaultValue false
     */
    overridePageViewDuration?: boolean;

    /**
     * Default false. Define whether to track unhandled promise rejections and report as JS errors.
     * When disableExceptionTracking is enabled (dont track exceptions) this value will be false.
     * @defaultValue false
     */
    enableUnhandledPromiseRejectionTracking?: boolean;

    /**
     * @ignore
     * Internal only
     */
    autoUnhandledPromiseInstrumented?: boolean;

    /**
     * Percentage of events that will be sent. Default is 100, meaning all events are sent.
     * @defaultValue 100
     */
    samplingPercentage?: number;

    /**
     * If true, the SDK will not store or read any data from local and session storage. Default is false.
     * @defaultValue false
     */
    isStorageUseDisabled?: boolean;

    /**
     * Default is false. If true, the SDK will track all [Browser Link](https://docs.microsoft.com/en-us/aspnet/core/client-side/using-browserlink) requests.
     * @defaultValue false
     */
    isBrowserLinkTrackingEnabled?: boolean;

    /**
     * Automatically track route changes in Single Page Applications (SPA). If true, each route change will send a new Pageview to Application Insights.
     */
    enableAutoRouteTracking?: boolean;

    /**
     * An optional value that will be used as name postfix for localStorage and session cookie name.
     * @defaultValue null
     */
    namePrefix?: string;

    /**
     * If true, debugging data is thrown as an exception by the logger. Default false
     * @defaultValue false
     */
    enableDebug?: boolean;

    /**
     * Default false. If true, flush method will not be called when onBeforeUnload, onUnload, onPageHide or onVisibilityChange (hidden state) event(s) trigger.
     */
    disableFlushOnBeforeUnload?: boolean;

    /**
     * Default value of `disableFlushOnBeforeUnload`. If true, flush method will not be called when onPageHide or onVisibilityChange (hidden state) event(s) trigger.
     */
    disableFlushOnUnload?: boolean;

    /**
     * [Optional] Set additional configuration for exceptions, such as more scripts to include in the exception telemetry.
     */
    expCfg?: IExceptionConfig;

    /**
     * @ignore
     * Internal only
     */
    autoExceptionInstrumented?: boolean;

    /**
     * An optional account id, if your app groups users into accounts. No spaces, commas, semicolons, equals, or vertical bars.
     */
    accountId?: string;
}