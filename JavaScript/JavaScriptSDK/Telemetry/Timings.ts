/// <reference path="../Util.ts"/>

module Microsoft.ApplicationInsights.Telemetry {
    "use strict";

    export class Timings {

        public duration: number;
        public perfTotal: string;
        public networkConnect: string;
        public sentRequest: string;
        public receivedResponse: string;
        public domProcessing: string;

        constructor(durationMs: number, networkMs: number, sendMs: number, receiveMs: number, domProcessingMs: number) {
            this.duration = 0;
            var total = Timings.getDuration(durationMs);
            var network = Timings.getDuration(networkMs);
            var request = Timings.getDuration(sendMs);
            var response = Timings.getDuration(receiveMs);
            var dom = Timings.getDuration(domProcessingMs);
            
            if (total < Math.floor(network) + Math.floor(request) + Math.floor(response) + Math.floor(dom)) {
                // some browsers may report individual components incorrectly so that the sum of the parts will be bigger than total PLT
                // in this case, don't report client performance from this page
                _InternalLogging.throwInternalNonUserActionable(
                    LoggingSeverity.WARNING,
                    "client performance math error:" + total + " < " + network + " + " + request + " + " + response + " + " + dom);

            } else {
                this.duration = total;
                // convert to timespans
                this.perfTotal = Util.msToTimeSpan(total);
                this.networkConnect = Util.msToTimeSpan(network);
                this.sentRequest = Util.msToTimeSpan(request);
                this.receivedResponse = Util.msToTimeSpan(response);
                this.domProcessing = Util.msToTimeSpan(dom);
            }
        }
        
        private static getDuration(end: any): number {
            var duration = 0;
            if (!(isNaN(end) || end === 0)) {
                duration = Math.max(end, 0);
            }

            return duration;
        }

    }
}
