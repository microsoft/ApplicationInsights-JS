/// <reference path="../Util.ts"/>

module Microsoft.ApplicationInsights.Telemetry {
    "use strict";

    export class Timings {

        public total: number;
        public network: number;
        public request: number;
        public response: number;
        public dom: number;

        constructor(durationMs: number, networkMs: number, sendMs: number, receiveMs: number, domProcessingMs: number) {
            this.total = Timings.getDuration(durationMs);
            this.network = Timings.getDuration(networkMs);
            this.request = Timings.getDuration(sendMs);
            this.response = Timings.getDuration(receiveMs);
            this.dom = Timings.getDuration(domProcessingMs);
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
