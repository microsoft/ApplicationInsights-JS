// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { PageViewPerfData } from '../Interfaces/Contracts/Generated/PageViewPerfData';
import { FieldType } from '../Enums';
import { ISerializable } from '../Interfaces/Telemetry/ISerializable';
import { DataSanitizer } from './Common/DataSanitizer';
import { Util } from '../Util';
import { IDiagnosticLogger, _InternalMessageId, LoggingSeverity } from 'applicationinsights-core-js';


export class PageViewPerformance extends PageViewPerfData implements ISerializable {

    public static envelopeType = "Microsoft.ApplicationInsights.{0}.PageviewPerformance";
    public static dataType = "PageviewPerformanceData";

    private static MAX_DURATION_ALLOWED = 3600000; // 1h

    public aiDataContract = {
        ver: FieldType.Required,
        name: FieldType.Default,
        url: FieldType.Default,
        duration: FieldType.Default,
        perfTotal: FieldType.Default,
        networkConnect: FieldType.Default,
        sentRequest: FieldType.Default,
        receivedResponse: FieldType.Default,
        domProcessing: FieldType.Default,
        properties: FieldType.Default,
        measurements: FieldType.Default
    };

    /**
     * Field indicating whether this instance of PageViewPerformance is valid and should be sent
     */
    private isValid: boolean;

    /**
     * Indicates whether this instance of PageViewPerformance is valid and should be sent
     */
    public getIsValid() {
        return this.isValid;
    }

    private durationMs: number;

    /**
    * Gets the total duration (PLT) in milliseconds. Check getIsValid() before using this method.
    */
    public getDurationMs() {
        return this.durationMs;
    }

    /**
     * Constructs a new instance of the PageEventTelemetry object
     */
    constructor(logger: IDiagnosticLogger, name: string, url: string, unused: number, properties?: any, measurements?: any) {
        super();

        this.isValid = false;

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
         */
        var timing = PageViewPerformance.getPerformanceTiming();
        if (timing) {
            var total = PageViewPerformance.getDuration(timing.navigationStart, timing.loadEventEnd);
            var network = PageViewPerformance.getDuration(timing.navigationStart, timing.connectEnd);
            var request = PageViewPerformance.getDuration(timing.requestStart, timing.responseStart);
            var response = PageViewPerformance.getDuration(timing.responseStart, timing.responseEnd);
            var dom = PageViewPerformance.getDuration(timing.responseEnd, timing.loadEventEnd);

            if (total == 0) {
                logger.throwInternal(
                    LoggingSeverity.WARNING,
                    _InternalMessageId.ErrorPVCalc,
                    "error calculating page view performance.",
                    { total: total, network: network, request: request, response: response, dom: dom });

            } else if (!PageViewPerformance.shouldCollectDuration(total, network, request, response, dom)) {
                logger.throwInternal(
                    LoggingSeverity.WARNING,
                    _InternalMessageId.InvalidDurationValue,
                    "Invalid page load duration value. Browser perf data won't be sent.",
                    { total: total, network: network, request: request, response: response, dom: dom });

            } else if (total < Math.floor(network) + Math.floor(request) + Math.floor(response) + Math.floor(dom)) {
                // some browsers may report individual components incorrectly so that the sum of the parts will be bigger than total PLT
                // in this case, don't report client performance from this page
                logger.throwInternal(
                    LoggingSeverity.WARNING,
                    _InternalMessageId.ClientPerformanceMathError,
                    "client performance math error.",
                    { total: total, network: network, request: request, response: response, dom: dom });

            } else {
                this.durationMs = total;

                // convert to timespans
                this.perfTotal = this.duration = Util.msToTimeSpan(total);
                this.networkConnect = Util.msToTimeSpan(network);
                this.sentRequest = Util.msToTimeSpan(request);
                this.receivedResponse = Util.msToTimeSpan(response);
                this.domProcessing = Util.msToTimeSpan(dom);

                this.isValid = true;
            }
        }

        this.url = DataSanitizer.sanitizeUrl(logger, url);
        this.name = DataSanitizer.sanitizeString(logger, name) || Util.NotSpecified;

        this.properties = DataSanitizer.sanitizeProperties(logger, properties);
        this.measurements = DataSanitizer.sanitizeMeasurements(logger, measurements);
    }

    public static getPerformanceTiming(): PerformanceTiming {
        if (PageViewPerformance.isPerformanceTimingSupported()) {
            return window.performance.timing;
        }

        return null;
    }

    /**
    * Returns true is window performance timing API is supported, false otherwise.
    */
    public static isPerformanceTimingSupported() {
        return typeof window != "undefined" && window.performance && window.performance.timing;
    }

    /**
     * As page loads different parts of performance timing numbers get set. When all of them are set we can report it.
     * Returns true if ready, false otherwise.
     */
    public static isPerformanceTimingDataReady() {
        var timing = window.performance.timing;

        return timing.domainLookupStart > 0
            && timing.navigationStart > 0
            && timing.responseStart > 0
            && timing.requestStart > 0
            && timing.loadEventEnd > 0
            && timing.responseEnd > 0
            && timing.connectEnd > 0
            && timing.domLoading > 0;
    }

    public static getDuration(start: any, end: any): number {
        var duration = undefined;
        if (!(isNaN(start) || isNaN(end))) {
            duration = Math.max(end - start, 0);
        }

        return duration;
    }

    /**
     * This method tells if given durations should be excluded from collection.
     */
    public static shouldCollectDuration(...durations: number[]): boolean {
        // a full list of Google crawlers user agent strings - https://support.google.com/webmasters/answer/1061943?hl=en
        let botAgentNames = ['googlebot', 'adsbot-google', 'apis-google', 'mediapartners-google'];
        let userAgent = navigator.userAgent;
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
            for (var i = 0; i < durations.length; i++) {
                if (durations[i] >= PageViewPerformance.MAX_DURATION_ALLOWED) {
                    return false;
                }
            }
        }

        return true;
    }
}