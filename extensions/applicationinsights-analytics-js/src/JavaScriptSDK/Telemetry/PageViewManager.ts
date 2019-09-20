// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    DateTimeUtils, Util, IPageViewTelemetry, IPageViewTelemetryInternal, IPageViewPerformanceTelemetryInternal
} from '@microsoft/applicationinsights-common';
import {
    IAppInsightsCore, CoreUtils, IDiagnosticLogger, LoggingSeverity,
    _InternalMessageId, IChannelControls
} from '@microsoft/applicationinsights-core-js';
import { PageViewPerformanceManager } from './PageViewPerformanceManager';

/**
 * Internal interface to pass appInsights object to subcomponents without coupling 
 */
export interface IAppInsightsInternal {
    sendPageViewInternal(pageViewItem: IPageViewTelemetryInternal, properties?: Object, systemProperties?: Object);
    sendPageViewPerformanceInternal(pageViewPerformance: IPageViewPerformanceTelemetryInternal, properties?: Object, systemProperties?: Object);
}

/**
 * Class encapsulates sending page views and page view performance telemetry.
 */
export class PageViewManager {
    private pageViewPerformanceSent: boolean = false;

    private overridePageViewDuration: boolean = false;

    private appInsights: IAppInsightsInternal;
    private _pageViewPerformanceManager: PageViewPerformanceManager;
    private _channel: () => IChannelControls[][];
    private _logger: IDiagnosticLogger;

    constructor(
        appInsights: IAppInsightsInternal,
        overridePageViewDuration: boolean, core: IAppInsightsCore, pageViewPerformanceManager: PageViewPerformanceManager) {
        this.overridePageViewDuration = overridePageViewDuration;
        this.appInsights = appInsights;
        this._pageViewPerformanceManager = pageViewPerformanceManager;
        if (core) {
            this._channel = () => (core.getTransmissionControls()) as IChannelControls[][];
            this._logger = core.logger;
        }

    }

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
    public trackPageView(pageView: IPageViewTelemetry, customProperties?: { [key: string]: any }) {
        let name = pageView.name;
        if (CoreUtils.isNullOrUndefined(name) || typeof name !== "string") {
            name = pageView.name = window.document && window.document.title || "";
        }

        let uri = pageView.uri;
        if (CoreUtils.isNullOrUndefined(uri) || typeof uri !== "string") {
            uri = pageView.uri = window.location && window.location.href || "";
        }

        // case 1a. if performance timing is not supported by the browser, send the page view telemetry with the duration provided by the user. If the user
        // do not provide the duration, set duration to undefined
        // Also this is case 4
        if (!this._pageViewPerformanceManager.isPerformanceTimingSupported()) {
            this.appInsights.sendPageViewInternal(
                pageView,
                customProperties
            );
            this._channel().forEach(queues => { queues.forEach(q => q.flush(true)) })

            // no navigation timing (IE 8, iOS Safari 8.4, Opera Mini 8 - see http://caniuse.com/#feat=nav-timing)
            this._logger.throwInternal(
                LoggingSeverity.WARNING,
                _InternalMessageId.NavigationTimingNotSupported,
                "trackPageView: navigation timing API used for calculation of page duration is not supported in this browser. This page view will be collected without duration and timing info.");

            return;
        }

        let pageViewSent = false;
        let customDuration;

        // if the performance timing is supported by the browser, calculate the custom duration
        const start = this._pageViewPerformanceManager.getPerformanceTiming().navigationStart;
        customDuration = DateTimeUtils.GetDuration(start, +new Date);
        if (!this._pageViewPerformanceManager.shouldCollectDuration(customDuration)) {
            customDuration = undefined;
        }

        // if the user has provided duration, send a page view telemetry with the provided duration. Otherwise, if
        // overridePageViewDuration is set to true, send a page view telemetry with the custom duration calculated earlier
        let duration;
        if (!CoreUtils.isNullOrUndefined(customProperties) &&
            !CoreUtils.isNullOrUndefined(customProperties.duration)) {
            duration = customProperties.duration;
        }
        if (this.overridePageViewDuration || !isNaN(duration)) {
            if (isNaN(duration)) {
                // case 3
                if (!customProperties) {
                    customProperties = {};
                }

                customProperties["duration"] = customDuration;
            }
            // case 2
            this.appInsights.sendPageViewInternal(
                pageView,
                customProperties
            );
            this._channel().forEach(queues => { queues.forEach(q => q.flush(true)) })
            pageViewSent = true;
        }

        // now try to send the page view performance telemetry
        const maxDurationLimit = 60000;
        if (!customProperties) {
            customProperties = {};
        }
        const handle = setInterval((() => {
            try {
                if (this._pageViewPerformanceManager.isPerformanceTimingDataReady()) {
                    clearInterval(handle);
                    const pageViewPerformance: IPageViewPerformanceTelemetryInternal = {
                        name,
                        uri
                    };
                    this._pageViewPerformanceManager.populatePageViewPerformanceEvent(pageViewPerformance);

                    if (!pageViewPerformance.isValid && !pageViewSent) {
                        // If navigation timing gives invalid numbers, then go back to "override page view duration" mode.
                        // That's the best value we can get that makes sense.
                        customProperties["duration"] = customDuration;
                        this.appInsights.sendPageViewInternal(
                            pageView,
                            customProperties);
                        this._channel().forEach(queues => { queues.forEach(q => q.flush(true)) })
                    } else {
                        if (!pageViewSent) {
                            customProperties["duration"] = pageViewPerformance.durationMs;
                            this.appInsights.sendPageViewInternal(
                                pageView,
                                customProperties);
                        }

                        if (!this.pageViewPerformanceSent) {
                            this.appInsights.sendPageViewPerformanceInternal(pageViewPerformance, customProperties);
                            this.pageViewPerformanceSent = true;
                        }
                        this._channel().forEach(queues => { queues.forEach(q => q.flush(true)) })
                    }
                } else if (DateTimeUtils.GetDuration(start, +new Date) > maxDurationLimit) {
                    // if performance timings are not ready but we exceeded the maximum duration limit, just log a page view telemetry
                    // with the maximum duration limit. Otherwise, keep waiting until performance timings are ready
                    clearInterval(handle);
                    if (!pageViewSent) {
                        customProperties["duration"] = maxDurationLimit;
                        this.appInsights.sendPageViewInternal(
                            pageView,
                            customProperties
                        );
                        this._channel().forEach(queues => { queues.forEach(q => q.flush(true)) })
                    }
                }
            } catch (e) {
                this._logger.throwInternal(
                    LoggingSeverity.CRITICAL,
                    _InternalMessageId.TrackPVFailedCalc,
                    "trackPageView failed on page load calculation: " + Util.getExceptionName(e),
                    { exception: Util.dump(e) });
            }
        }), 100);
    }
}
