// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import dynamicProto from "@microsoft/dynamicproto-js";
import { IPageViewPerformanceTelemetryInternal, dateTimeUtilsDuration, msToTimeSpan } from "@microsoft/applicationinsights-common";
import {
    IAppInsightsCore, IDiagnosticLogger, _eInternalMessageId, _throwInternal, eLoggingSeverity, getNavigator, getPerformance, safeGetLogger
} from "@microsoft/applicationinsights-core-js";

const MAX_DURATION_ALLOWED = 3600000; // 1h
const botAgentNames = ["googlebot", "adsbot-google", "apis-google", "mediapartners-google"];

function _isPerformanceTimingSupported() {
    let perf = getPerformance();
    return perf && !!perf.timing;
}

function _isPerformanceNavigationTimingSupported() {
    let perf = getPerformance();
    return perf && perf.getEntriesByType && perf.getEntriesByType("navigation").length > 0;
}

function _isPerformanceTimingDataReady() {
    let perf = getPerformance();
    const timing = perf ? perf.timing : 0;

    return timing
        && timing.domainLookupStart > 0
        && timing.navigationStart > 0
        && timing.responseStart > 0
        && timing.requestStart > 0
        && timing.loadEventEnd > 0
        && timing.responseEnd > 0
        && timing.connectEnd > 0
        && timing.domLoading > 0;
}

function _getPerformanceTiming(): PerformanceTiming | null {
    if (_isPerformanceTimingSupported()) {
        return getPerformance().timing;
    }

    return null;
}

function _getPerformanceNavigationTiming(): PerformanceNavigationTiming | null {
    if (_isPerformanceNavigationTimingSupported()) {
        return getPerformance().getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    }

    return null;
}

/**
* This method tells if given durations should be excluded from collection.
*/
function _shouldCollectDuration(...durations: number[]): boolean {
    var _navigator = getNavigator() || {} as any;
    // a full list of Google crawlers user agent strings - https://support.google.com/webmasters/answer/1061943?hl=en
    const userAgent = _navigator.userAgent;
    let isGoogleBot = false;

    if (userAgent) {
        for (let i = 0; i < botAgentNames.length; i++) {
            isGoogleBot = isGoogleBot || userAgent.toLowerCase().indexOf(botAgentNames[i]) !== -1;
        }
    }

    if (isGoogleBot) {
        // Don't report durations for GoogleBot, it is returning invalid values in performance.timing API.
        return false;
    } else {
        // for other page views, don't report if it's outside of a reasonable range
        for (let i = 0; i < durations.length; i++) {
            if (durations[i] < 0 || durations[i] >= MAX_DURATION_ALLOWED) {
                return false;
            }
        }
    }

    return true;
}

/**
 * Class encapsulates sending page view performance telemetry.
 */
export class PageViewPerformanceManager {

    constructor(core: IAppInsightsCore) {
        let _logger: IDiagnosticLogger = safeGetLogger(core);

        dynamicProto(PageViewPerformanceManager, this, (_self) => {
            _self.populatePageViewPerformanceEvent = (pageViewPerformance: IPageViewPerformanceTelemetryInternal): void => {
                pageViewPerformance.isValid = false;
        
                /*
                 * http://www.w3.org/TR/navigation-timing/#processing-model
                 *  |-navigationStart
                 *  |             |-connectEnd
                 *  |             ||-requestStart
                 *  |             ||             |-responseStart
                 *  |             ||             |              |-responseEnd
                 *  |             ||             |              |
                 *  |             ||             |              |         |-loadEventEnd
                 *  |---network---||---request---|---response---|---dom---|
                 *  |--------------------------total----------------------|
                 *
                 *  total = The difference between the load event of the current document is completed and the first recorded timestamp of the performance entry : https://developer.mozilla.org/en-US/docs/Web/Performance/Navigation_and_resource_timings#duration
                 *  network = Redirect time + App Cache + DNS lookup time + TCP connection time
                 *  request = Request time : https://developer.mozilla.org/en-US/docs/Web/Performance/Navigation_and_resource_timings#request_time
                 *  response = Response time
                 *  dom = Document load time : https://html.spec.whatwg.org/multipage/dom.html#document-load-timing-info
                 *      = Document processing time : https://developers.google.com/web/fundamentals/performance/navigation-and-resource-timing/#document_processing
                 *      + Loading time : https://developers.google.com/web/fundamentals/performance/navigation-and-resource-timing/#loading
                 */
                const navigationTiming = _getPerformanceNavigationTiming();
                const timing = _getPerformanceTiming();
                let total = 0;
                let network = 0;
                let request = 0;
                let response = 0;
                let dom = 0;
        
                if (navigationTiming || timing) {
                    if (navigationTiming) {
                        total = navigationTiming.duration;
                        /**
                         * support both cases:
                         * - startTime is always zero: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming
                         * - for older browsers where the startTime is not zero
                         */
                        network = navigationTiming.startTime === 0 ? navigationTiming.connectEnd : dateTimeUtilsDuration(navigationTiming.startTime, navigationTiming.connectEnd);
                        request = dateTimeUtilsDuration(navigationTiming.requestStart, navigationTiming.responseStart);
                        response = dateTimeUtilsDuration(navigationTiming.responseStart, navigationTiming.responseEnd);
                        dom = dateTimeUtilsDuration(navigationTiming.responseEnd, navigationTiming.loadEventEnd);
                    } else {
                        total = dateTimeUtilsDuration(timing.navigationStart, timing.loadEventEnd);
                        network = dateTimeUtilsDuration(timing.navigationStart, timing.connectEnd);
                        request = dateTimeUtilsDuration(timing.requestStart, timing.responseStart);
                        response = dateTimeUtilsDuration(timing.responseStart, timing.responseEnd);
                        dom = dateTimeUtilsDuration(timing.responseEnd, timing.loadEventEnd);
                    }
        
                    if (total === 0) {
                        _throwInternal(_logger,
                            eLoggingSeverity.WARNING,
                            _eInternalMessageId.ErrorPVCalc,
                            "error calculating page view performance.",
                            { total, network, request, response, dom });
        
                    } else if (!_self.shouldCollectDuration(total, network, request, response, dom)) {
                        _throwInternal(_logger,
                            eLoggingSeverity.WARNING,
                            _eInternalMessageId.InvalidDurationValue,
                            "Invalid page load duration value. Browser perf data won't be sent.",
                            { total, network, request, response, dom });
        
                    } else if (total < Math.floor(network) + Math.floor(request) + Math.floor(response) + Math.floor(dom)) {
                        // some browsers may report individual components incorrectly so that the sum of the parts will be bigger than total PLT
                        // in this case, don't report client performance from this page
                        _throwInternal(_logger,
                            eLoggingSeverity.WARNING,
                            _eInternalMessageId.ClientPerformanceMathError,
                            "client performance math error.",
                            { total, network, request, response, dom });
        
                    } else {
                        pageViewPerformance.durationMs = total;
                        // // convert to timespans
                        pageViewPerformance.perfTotal = pageViewPerformance.duration = msToTimeSpan(total);
                        pageViewPerformance.networkConnect = msToTimeSpan(network);
                        pageViewPerformance.sentRequest = msToTimeSpan(request);
                        pageViewPerformance.receivedResponse = msToTimeSpan(response);
                        pageViewPerformance.domProcessing = msToTimeSpan(dom);
                        pageViewPerformance.isValid = true;
                    }
                }
            }
        
            _self.getPerformanceTiming = _getPerformanceTiming;
            _self.isPerformanceTimingSupported = _isPerformanceTimingSupported;
            _self.isPerformanceTimingDataReady = _isPerformanceTimingDataReady;
            _self.shouldCollectDuration = _shouldCollectDuration;
        });
    }

    public populatePageViewPerformanceEvent(pageViewPerformance: IPageViewPerformanceTelemetryInternal): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public getPerformanceTiming(): PerformanceTiming | null {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
    * Returns true is window performance timing API is supported, false otherwise.
    */
    public isPerformanceTimingSupported() {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return true;
    }

    /**
    * As page loads different parts of performance timing numbers get set. When all of them are set we can report it.
    * Returns true if ready, false otherwise.
    */
    public isPerformanceTimingDataReady() {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return true;
    }

    /**
    * This method tells if given durations should be excluded from collection.
    */
    public shouldCollectDuration(...durations: number[]): boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return true;
    }
}
