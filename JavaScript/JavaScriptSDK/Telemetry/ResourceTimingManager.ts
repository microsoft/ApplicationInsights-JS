/// <reference path="./Common/DataSanitizer.ts"/>
/// <reference path="../Util.ts"/>

module Microsoft.ApplicationInsights.Telemetry {
    "use strict";

    export class ResourceTimingManager {

        private appInsights: AppInsights;
        private resourcesSent: { [name: string]: boolean } = {};
        private reportIntervalHandle;
        private maxResourcesTrackedPerPage;
        private enabled: boolean;
        private reportIntervalDelay: number;
        private pageStarTime;

        constructor(appInsights: AppInsights) {
            this.appInsights = appInsights;
            this.pageStarTime = Date.now();

            var config = appInsights.config.resourceTiming;

            if (!config) {
                this.enabled = false;
                return;
            }

            this.enabled = config.enabled

            if (this.enabled) {
                this.maxResourcesTrackedPerPage = config.maxResourcesPerPage || 50;
                this.reportIntervalDelay = config.reportIntervalDelay || 15000; // 15s;
            }

            this.Init();
        }

        public IsPerformanceApiSupported(): boolean {
            return ('performance' in window && 'getEntriesByType' in window.performance)
        }

        private Init() {
            if (this.enabled && this.IsPerformanceApiSupported()) {
                this.SetInterval();
            }
        }

        // TODO: rename
        private SetInterval() {
            this.Report();

            this.reportIntervalHandle = setInterval(() => {
                try {
                    this.Report();

                } catch (e) {
                    _InternalLogging.throwInternalNonUserActionable(LoggingSeverity.CRITICAL, new _InternalLogMessage(
                        _InternalMessageId.NONUSRACT_FailedToReportResourceTimingData,
                        "message: " + Util.getExceptionName(e), { exception: Util.dump(e) }));

                    clearInterval(this.reportIntervalHandle);
                }
            }, this.reportIntervalDelay);
        }

        // TODO: rename
        public Report() {
            if (!this.enabled || !this.IsPerformanceApiSupported()) {
                return;
            }

            var resources = window.performance.getEntriesByType('resource');
            var foundNewResources = false;

            if (resources === undefined || resources.length <= 0) {
                return;
            }

            for (var i = 0; i < Math.min(resources.length, this.maxResourcesTrackedPerPage); i++) {
                var resource = resources[i];

                // don't report ajax requests, send a timing data only once for each resource
                if (resource.initiatorType == "xmlhttprequest" || this.resourcesSent[resource.name]) {
                    continue;
                } else {
                    this.resourcesSent[resource.name] = true;
                }

                foundNewResources = true;
                var startTime = resource.startTime;
                var total = resource.duration;

                // check if this resource has all timing information available
                // see: https://www.w3.org/TR/resource-timing/#cross-origin-resources
                /* var eventData;
                if (resource.connectStart == 0 && resource.connectEnd == 0 && resource.requestStart == 0 && resource.responseStart == 0) {
                    var total = Util.getDuration(resource.startTime, resource.responseEnd);

                    eventData = { "total": total };
                }

                else {

                    var connection = Util.getDuration(resource.startTime, resource.connectEnd);
                    var ttfb = Util.getDuration(resource.requestStart, resource.responseStart);
                    var transfer = Util.getDuration(resource.responseStart, resource.responseEnd);
                    var total = Util.getDuration(resource.startTime, resource.responseEnd);

                    eventData = { "connection": connection, "ttfb": ttfb, "transfer": transfer, "total": total };
                }*/

                // this.appInsights.trackDependency(Util.newId(), null, resource.name, "pathName", total, true, 200);

                var dependency = new Telemetry.RemoteDependencyData(Util.newId(), resource.name, "pathName", total, true, 200, null, RemoteDependencyData.ResourceDependancyName);
                var dependencyData = new ApplicationInsights.Telemetry.Common.Data<ApplicationInsights.Telemetry.RemoteDependencyData>(
                    Telemetry.RemoteDependencyData.dataType, dependency);
                var envelope = new Telemetry.Common.Envelope(dependencyData, ApplicationInsights.Telemetry.RemoteDependencyData.envelopeType);

                var startOffset = this.pageStarTime + resource.startTime;
                envelope.time = Util.toISOStringForIE8(new Date(startOffset));

                this.appInsights.context.track(envelope);
            }

            if (!foundNewResources) {
                clearInterval(this.reportIntervalHandle);
            }
        }
    }
}
