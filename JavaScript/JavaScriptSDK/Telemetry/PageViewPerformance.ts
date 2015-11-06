/// <reference path="../Contracts/Generated/PageViewPerfData.ts"/>
/// <reference path="./Common/DataSanitizer.ts"/>
/// <reference path="../Util.ts"/>

module Microsoft.ApplicationInsights.Telemetry {
    "use strict";

    export class PageViewPerformance extends AI.PageViewPerfData implements ISerializable {

        public static envelopeType = "Microsoft.ApplicationInsights.PageviewPerformance";
        public static dataType = "PageviewPerformanceData";

        public aiDataContract = {
            ver: true,
            name: false,
            url: false,
            duration: false,
            perfTotal: false,
            networkConnect: false,
            sentRequest: false,
            receivedResponse: false,
            domProcessing: false,
            properties: false,
            measurements: false
        };

        /**
         * Field indicating whether this instance of PageViewPerformance is valid and should be sent
         */
        public isValid: boolean;

        public durationMs: number;

        /**
         * Constructs a new instance of the PageEventTelemetry object
         */
        constructor(name: string, url: string, unused: number, properties?: any, measurements?: any) {
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
                    _InternalLogging.throwInternalNonUserActionable(
                        LoggingSeverity.WARNING,
                        "error calculating page view performance: total='" +
                        total + "', network='" + network + "', request='" + request + "', response='" +
                        response + "', dom='" + dom + "'");
                } else if (total < Math.floor(network) + Math.floor(request) + Math.floor(response) + Math.floor(dom)) {
                    // some browsers may report individual components incorrectly so that the sum of the parts will be bigger than total PLT
                    // in this case, don't report client performance from this page                    
                    _InternalLogging.throwInternalNonUserActionable(
                        LoggingSeverity.WARNING,
                        "client performance math error:" + total + " < " + network + " + " + request + " + " + response + " + " + dom);
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

            this.url = Common.DataSanitizer.sanitizeUrl(url);
            this.name = Common.DataSanitizer.sanitizeString(name || Util.NotSpecified);

            this.properties = ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeProperties(properties);
            this.measurements = ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeMeasurements(measurements);
        }

        public static getPerformanceTiming(): PerformanceTiming {
            if (typeof window != "undefined" && window.performance && window.performance.timing) {
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
            var duration = 0;
            if (!(isNaN(start) || isNaN(end))) {
                duration = Math.max(end - start, 0);
            }

            return duration;
        }
    }
}