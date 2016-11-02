module Microsoft.ApplicationInsights {
    "use strict";

    export class PerformanceAnalyzer {
        private enabled = false;
        private appInsights: IAppInsights;
        private performanceSendInterval = 10000;
        private resourceFilters: string[];
        private intervalHandler: number;

        // report each resource only once
        private resourcesLogged: { [name: string]: boolean } = {};

        constructor(appInsights: IAppInsights) {
            this.appInsights = appInsights;
            this.enabled = this.appInsights.config.isPerfAnalyzerEnabled;

            // TODO: move to configuration so user can setup custom resource performance measurments.
            this.resourceFilters = ["/v2/track", "/ai.0.js"];

            this.Init();
        }

        public Init() {
            if (!this.enabled || !this.IsPerformanceApiSupported()) {
                return;
            }

            this.intervalHandler = setInterval(() => {
                this.SendPerfData();

                if (this.resourceFilters.length === Object.keys(this.resourcesLogged).length) {
                    // nothing more to report
                    clearInterval(this.intervalHandler);
                }
            }, this.performanceSendInterval);
        }

        public IsPerformanceApiSupported(): boolean {
            return ("performance" in window && "getEntriesByType" in window.performance);
        }

        public SendPerfData() {
            if (!this.enabled || !this.IsPerformanceApiSupported()) {
                return;
            }

            var resources = window.performance.getEntriesByType("resource");

            if (resources === undefined || resources.length <= 0) {
                return;
            }

            for (var i: number = 0; i < resources.length; i++) {
                var resource = resources[i];

                var name: string = resource.name;

                if (name && this.IsMatching(name) && !this.resourcesLogged[name]) {
                    var properties: { [name: string]: string; } = {
                        "url": name
                    };

                    // check if this resource has all timing information available
                    // see: https://www.w3.org/TR/resource-timing/#cross-origin-resources
                    var measurements: { [name: string]: number; };
                    if (resource.connectStart === 0 && resource.connectEnd === 0 &&
                        resource.requestStart === 0 && resource.responseStart === 0) {
                        measurements = {
                            "duration": resource.duration,
                            "startTime": resource.startTime,
                            "responseEnd": resource.responseEnd
                        };
                    } else {
                        measurements = {
                            "duration": resource.duration,
                            "startTime": resource.startTime,
                            "redirectStart": resource.redirectStart,
                            "redirectEnd": resource.redirectEnd,
                            "domainLookupStart": resource.domainLookupStart,
                            "domainLookupEnd": resource.domainLookupEnd,
                            "connectStart": resource.connectStart,
                            "secureConnectionStart": resource.secureConnectionStart || "0",
                            "connectEnd": resource.connectEnd,
                            "requestStart": resource.requestStart,
                            "responseStart": resource.responseStart,
                            "responseEnd": resource.responseEnd
                        };
                    }

                    this.appInsights.trackEvent("AI (Internal): PerfAnalyzer", properties, measurements);
                    this.resourcesLogged[name] = true;

                    break;
                }
            }
        }

        private IsMatching(name: string): boolean {
            for (var i: number = 0; i < this.resourceFilters.length; i++) {
                if (name.indexOf(this.resourceFilters[i]) !== -1) {
                    return true;
                }
            }
            return false;
        }
    }
}