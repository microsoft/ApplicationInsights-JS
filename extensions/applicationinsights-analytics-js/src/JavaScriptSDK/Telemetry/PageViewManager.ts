// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    IPageViewPerformanceTelemetryInternal, IPageViewTelemetry, IPageViewTelemetryInternal, dateTimeUtilsDuration
} from "@microsoft/applicationinsights-common";
import {
    IAppInsightsCore, IDiagnosticLogger, IProcessTelemetryUnloadContext, ITelemetryUnloadState, _eInternalMessageId, _throwInternal,
    arrForEach, dumpObj, eLoggingSeverity, fieldRedaction, getDocument, getExceptionName, getLocation, isNullOrUndefined
} from "@microsoft/applicationinsights-core-js";
import { ITimerHandler, getPerformance, isUndefined, isWebWorker, scheduleTimeout } from "@nevware21/ts-utils";
import { IPageViewPerformanceManager } from "./PageViewPerformanceManager";

/**
 * Internal interface to pass appInsights object to subcomponents without coupling
 */
export interface IAppInsightsInternal {
    sendPageViewInternal(pageViewItem: IPageViewTelemetryInternal, properties?: Object, systemProperties?: Object): void;
    sendPageViewPerformanceInternal(pageViewPerformance: IPageViewPerformanceTelemetryInternal, properties?: Object, systemProperties?: Object): void;
}

/**
 * Internal interface for PageViewManager.
 * @internal
 */
export interface IPageViewManager {
    /**
     * Currently supported cases:
     * 1) (default case) track page view called with default parameters, overridePageViewDuration = false. Page view is sent with page view performance when navigation timing data is available.
     *    a. If navigation timing is not supported then page view is sent right away with undefined duration. Page view performance is not sent.
     * 2) overridePageViewDuration = true, custom duration provided. Custom duration is used, page view sends right away.
     * 3) overridePageViewDuration = true, custom duration NOT provided. Page view is sent right away, duration is time spent from page load till now (or undefined if navigation timing is not supported).
     * 4) overridePageViewDuration = false, custom duration is provided. Page view is sent right away with custom duration.
     *
     * In all cases page view performance is sent once (only for the 1st call of trackPageView), or not sent if navigation timing is not supported.
     */
    trackPageView(pageView: IPageViewTelemetry, customProperties?: { [key: string]: any }): void;

    teardown(unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState): void;
}

/**
 * Factory function to create a PageViewManager instance.
 * @param appInsights - Internal interface to send telemetry
 * @param overridePageViewDuration - Whether to override page view duration
 * @param core - App Insights core instance
 * @param pageViewPerformanceManager - Page view performance manager instance
 * @returns A new IPageViewManager instance.
 * @internal
 */
export function createPageViewManager(
    appInsights: IAppInsightsInternal,
    overridePageViewDuration: boolean,
    core: IAppInsightsCore,
    pageViewPerformanceManager: IPageViewPerformanceManager): IPageViewManager {

    let queueTimer: ITimerHandler = null;
    let itemQueue: Array<() => boolean> = [];
    let pageViewPerformanceSent: boolean = false;
    let firstPageViewSent: boolean = false;
    let _logger: IDiagnosticLogger;
            
    if (core) {
        _logger = core.logger;
    }

    function _flushChannels(isAsync: boolean) {
        if (core) {
            core.flush(isAsync, () => {
                // Event flushed, callback added to prevent promise creation
            });
        }
    }

    function _startTimer() {
        if (!queueTimer) {
            queueTimer = scheduleTimeout((() => {
                queueTimer = null;
                let allItems = itemQueue.slice(0);
                let doFlush = false;
                itemQueue = [];
                arrForEach(allItems, (item) => {
                    if (!item()) {
                        // Not processed so rescheduled
                        itemQueue.push(item);
                    } else {
                        doFlush = true;
                    }
                });

                if (itemQueue.length > 0) {
                    _startTimer();
                }

                if (doFlush) {
                    // We process at least one item so flush the queue
                    _flushChannels(true);
                }
            }), 100);
        }
    }

    function _addQueue(cb:() => boolean) {
        itemQueue.push(cb);

        _startTimer();
    }

    return {
        trackPageView: (pageView: IPageViewTelemetry, customProperties?: { [key: string]: any })  => {
            let name = pageView.name;
            if (isNullOrUndefined(name) || typeof name !== "string") {
                let doc = getDocument();
                name = pageView.name = doc && doc.title || "";
            }
    
            let uri = pageView.uri;
            if (isNullOrUndefined(uri) || typeof uri !== "string") {
                let location = getLocation();
                uri = pageView.uri = location && location.href || "";
            }
            if (core && core.config){
                uri = pageView.uri = fieldRedaction(pageView.uri, core.config);
            }
            if (!firstPageViewSent){
                let perf = getPerformance();
                // Access the performance timing object
                const navigationEntries = (perf && perf.getEntriesByType && perf.getEntriesByType("navigation"));

                // Edge Case the navigation Entries may return an empty array and the timeOrigin is not supported on IE
                if (navigationEntries && navigationEntries[0] && !isUndefined(perf.timeOrigin)) {
                    // Get the value of loadEventStart
                    const loadEventStart = (navigationEntries[0] as PerformanceNavigationTiming).loadEventStart;
                    pageView.startTime =  new Date(perf.timeOrigin + loadEventStart);
                } else {
                    // calculate the start time manually
                    let duration = ((customProperties || pageView.properties || {}).duration || 0);
                    pageView.startTime = new Date(new Date().getTime() - duration);
                }
                firstPageViewSent = true;
            }
    
            // case 1a. if performance timing is not supported by the browser, send the page view telemetry with the duration provided by the user. If the user
            // do not provide the duration, set duration to undefined
            // Also this is case 4
            if (!pageViewPerformanceManager.isPerformanceTimingSupported()) {
                appInsights.sendPageViewInternal(
                    pageView,
                    customProperties
                );
                _flushChannels(true);
    
                if (!isWebWorker()) {
                    // no navigation timing (IE 8, iOS Safari 8.4, Opera Mini 8 - see http://caniuse.com/#feat=nav-timing)
                    _throwInternal(_logger,
                        eLoggingSeverity.WARNING,
                        _eInternalMessageId.NavigationTimingNotSupported,
                        "trackPageView: navigation timing API used for calculation of page duration is not supported in this browser. This page view will be collected without duration and timing info.");
                }
    
                return;
            }
    
            let pageViewSent = false;
            let customDuration: number;
    
            // if the performance timing is supported by the browser, calculate the custom duration
            const start = pageViewPerformanceManager.getPerformanceTiming().navigationStart;
            if (start > 0) {
                customDuration = dateTimeUtilsDuration(start, +new Date);
                if (!pageViewPerformanceManager.shouldCollectDuration(customDuration)) {
                    customDuration = undefined;
                }
            }
    
            // if the user has provided duration, send a page view telemetry with the provided duration. Otherwise, if
            // overridePageViewDuration is set to true, send a page view telemetry with the custom duration calculated earlier
            let duration;
            if (!isNullOrUndefined(customProperties) &&
                !isNullOrUndefined(customProperties.duration)) {
                duration = customProperties.duration;
            }
            if (overridePageViewDuration || !isNaN(duration)) {
                if (isNaN(duration)) {
                    // case 3
                    if (!customProperties) {
                        customProperties = {};
                    }
    
                    customProperties.duration = customDuration;
                }
                // case 2
                appInsights.sendPageViewInternal(
                    pageView,
                    customProperties
                );
                _flushChannels(true);
                pageViewSent = true;
            }
    
            // now try to send the page view performance telemetry
            const maxDurationLimit = 60000;
            if (!customProperties) {
                customProperties = {};
            }
    
            // Queue the event for processing
            _addQueue(() => {
                let processed = false;
                try {
                    if (pageViewPerformanceManager.isPerformanceTimingDataReady()) {
                        processed = true;
                        const pageViewPerformance: IPageViewPerformanceTelemetryInternal = {
                            name,
                            uri
                        };
                        pageViewPerformanceManager.populatePageViewPerformanceEvent(pageViewPerformance);
    
                        if (!pageViewPerformance.isValid && !pageViewSent) {
                            // If navigation timing gives invalid numbers, then go back to "override page view duration" mode.
                            // That's the best value we can get that makes sense.
                            customProperties.duration = customDuration;
                            appInsights.sendPageViewInternal(
                                pageView,
                                customProperties);
                        } else {
                            if (!pageViewSent) {
                                customProperties.duration = pageViewPerformance.durationMs;
                                appInsights.sendPageViewInternal(
                                    pageView,
                                    customProperties);
                            }
    
                            if (!pageViewPerformanceSent) {
                                appInsights.sendPageViewPerformanceInternal(pageViewPerformance, customProperties);
                                pageViewPerformanceSent = true;
                            }
                        }
                    } else if (start > 0 && dateTimeUtilsDuration(start, +new Date) > maxDurationLimit) {
                        // if performance timings are not ready but we exceeded the maximum duration limit, just log a page view telemetry
                        // with the maximum duration limit. Otherwise, keep waiting until performance timings are ready
                        processed = true;
                        if (!pageViewSent) {
                            customProperties.duration = maxDurationLimit;
                            appInsights.sendPageViewInternal(
                                pageView,
                                customProperties
                            );
                        }
                    }
                } catch (e) {
                    _throwInternal(_logger,
                        eLoggingSeverity.CRITICAL,
                        _eInternalMessageId.TrackPVFailedCalc,
                        "trackPageView failed on page load calculation: " + getExceptionName(e),
                        { exception: dumpObj(e) });
                }
    
                return processed;
            });
        },

        teardown: (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) => {
            if (queueTimer) {
                queueTimer.cancel();
                queueTimer = null;

                let allItems = itemQueue.slice(0);
                itemQueue = [];
                arrForEach(allItems, (item) => {
                    if (item()) {
                        // Item processed successfully
                    }
                });
            }
        }
    };
}
