// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/// <reference path="../../JavaScriptSDK.Interfaces/Contracts/Generated/PageViewData.ts" />
/// <reference path="./Common/DataSanitizer.ts"/>

module Microsoft.ApplicationInsights.Telemetry {
    "use strict";

    /**
    * Class encapsulates sending page views and page view performance telemetry.
    */
    export class PageViewManager {
        private pageViewPerformanceSent: boolean = false;

        private overridePageViewDuration: boolean = false;

        private appInsights: IAppInsightsInternal;

        constructor(
            appInsights: IAppInsightsInternal,
            overridePageViewDuration: boolean) {
            this.overridePageViewDuration = overridePageViewDuration;
            this.appInsights = appInsights;
        }

        /**
        * Currently supported cases:
        * 1) (default case) track page view called with default parameters, overridePageViewDuration = false. Page view is sent with page view performance when navigation timing data is available.
        *    If navigation timing is not supported then page view is sent right away with undefined duration. Page view performance is not sent.
        * 2) overridePageViewDuration = true, custom duration provided. Custom duration is used, page view sends right away.
        * 3) overridePageViewDuration = true. Page view is sent right away, duration is time spent from page load till now (or undefined if navigation timing is not supported). 
        * 4) overridePageViewDuration = false, custom duration is provided. Page view is sent right away with custom duration. 
        *
        * In all cases page view performance is sent once (only for the 1st call of trackPageView), or not sent if navigation timing is not supported.
        */
        public trackPageView(name?: string, url?: string, properties?: Object, measurements?: Object, duration?: number) {
            // ensure we have valid values for the required fields
            if (typeof name !== "string") {
                name = window.document && window.document.title || "";
            }

            if (typeof url !== "string") {
                url = window.location && window.location.href || "";
            }

            var pageViewSent = false;
            var customDuration = undefined;

            if (Telemetry.PageViewPerformance.isPerformanceTimingSupported()) {
                var start = Telemetry.PageViewPerformance.getPerformanceTiming().navigationStart;
                customDuration = Telemetry.PageViewPerformance.getDuration(start, +new Date);

                if (!Telemetry.PageViewPerformance.shouldCollectDuration(customDuration)) {
                    customDuration = undefined;
                }
            } else {
                this.appInsights.sendPageViewInternal(
                    name,
                    url,
                    !isNaN(duration) ? duration : undefined,
                    properties,
                    measurements);
                this.appInsights.flush();
                pageViewSent = true;
            }

            if (!pageViewSent && (this.overridePageViewDuration || !isNaN(duration))) {
                // 1, 2, 4 cases
                this.appInsights.sendPageViewInternal(
                    name,
                    url,
                    !isNaN(duration) ? duration : customDuration,
                    properties,
                    measurements);
                this.appInsights.flush();
                pageViewSent = true;
            }

            var maxDurationLimit = 60000;

            if (!Telemetry.PageViewPerformance.isPerformanceTimingSupported()) {
                // no navigation timing (IE 8, iOS Safari 8.4, Opera Mini 8 - see http://caniuse.com/#feat=nav-timing)
                _InternalLogging.throwInternal(
                    LoggingSeverity.WARNING,
                    _InternalMessageId.NavigationTimingNotSupported,
                    "trackPageView: navigation timing API used for calculation of page duration is not supported in this browser. This page view will be collected without duration and timing info.");
                return;
            }

            var handle = setInterval(() => {
                try {
                    if (Telemetry.PageViewPerformance.isPerformanceTimingDataReady()) {
                        clearInterval(handle);
                        var pageViewPerformance = new Telemetry.PageViewPerformance(name, url, null, properties, measurements);

                        if (!pageViewPerformance.getIsValid() && !pageViewSent) {
                            // If navigation timing gives invalid numbers, then go back to "override page view duration" mode.
                            // That's the best value we can get that makes sense.
                            this.appInsights.sendPageViewInternal(name, url, customDuration, properties, measurements);
                            this.appInsights.flush();
                        } else {
                            if (!pageViewSent) {
                                this.appInsights.sendPageViewInternal(name, url, pageViewPerformance.getDurationMs(), properties, measurements);
                            }

                            if (!this.pageViewPerformanceSent) {
                                this.appInsights.sendPageViewPerformanceInternal(pageViewPerformance);
                                this.pageViewPerformanceSent = true;
                            }
                            this.appInsights.flush();
                        }
                    }
                    else if (Telemetry.PageViewPerformance.getDuration(start, +new Date) > maxDurationLimit) {
                        clearInterval(handle);
                        if (!pageViewSent) {
                            this.appInsights.sendPageViewInternal(name, url, maxDurationLimit, properties, measurements);
                            this.appInsights.flush();
                        }
                    }
                } catch (e) {
                    _InternalLogging.throwInternal(
                        LoggingSeverity.CRITICAL,
                        _InternalMessageId.TrackPVFailedCalc,
                        "trackPageView failed on page load calculation: " + Util.getExceptionName(e),
                        { exception: Util.dump(e) });
                }
            }, 100);
        }
    }
}
