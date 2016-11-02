/// <reference path="./Common/DataSanitizer.ts"/>
/// <reference path="../Util.ts"/>

module Microsoft.ApplicationInsights.Telemetry {
    "use strict";

    export class ResourceTimingManager {

        private appInsights: AppInsights;
        private enabled: boolean;
        private intervalHandler: number;
        private maxResourcesTrackedPerPage;
        private reportInterval: number;
        private reportDelay: number;

        // report each resource only once
        private resourcesLogged: { [name: string]: boolean } = {};

        constructor(appInsights: AppInsights) {
            this.appInsights = appInsights;

            var config = appInsights.config.resourceTiming;

            if (!config) {
                this.enabled = false;
                return;
            }

            this.enabled = config.enabled

            if (this.enabled) {
                this.maxResourcesTrackedPerPage = config.maxResourcesPerPage || 50;
                this.reportInterval = config.reportInterval || 15000; // 15s
                this.reportDelay = 5000; // wait 5s before you start collecting any data
            }

            this.Init();
        }

        private IsPerformanceApiSupported(): boolean {
            return ('performance' in window && 'getEntriesByType' in window.performance)
        }

        private Init() {
            if (!this.enabled || !this.IsPerformanceApiSupported()) {
                return;
            }

            setTimeout(() => {
                this.intervalHandler = setInterval(() => {
                    try {
                        this.ReportResourceTimingData();
                    } catch (e) {
                        _InternalLogging.throwInternalNonUserActionable(LoggingSeverity.CRITICAL, new _InternalLogMessage(
                            _InternalMessageId.NONUSRACT_FailedToReportResourceTimingData,
                            "message: " + Util.getExceptionName(e), { exception: Util.dump(e) }));

                        clearInterval(this.intervalHandler);
                    }
                }, this.reportInterval);
            }, this.reportDelay);
        }

        public ReportResourceTimingData() {
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
                if (resource.initiatorType == "xmlhttprequest" || this.resourcesLogged[resource.name]) {
                    continue;
                } else {
                    this.resourcesLogged[resource.name] = true;
                }

                foundNewResources = true;
                var eventData = null;

                // check if this resource has all timing information available
                // see: https://www.w3.org/TR/resource-timing/#cross-origin-resources
                if (resource.connectStart !== 0 || resource.connectEnd !== 0 || resource.requestStart !== 0 || resource.responseStart == 0) {
                    var connection = Util.getDuration(resource.startTime, resource.connectEnd);
                    var ttfb = Util.getDuration(resource.requestStart, resource.responseStart);
                    var transfer = Util.getDuration(resource.responseStart, resource.responseEnd);

                    eventData = { "connection": connection, "ttfb": ttfb, "transfer": transfer };
                }

                var start = Telemetry.PageViewPerformance.getPerformanceTiming().navigationStart;
                var startOffset = start + resource.startTime;
                var url = resource.name;

                var dependency = new Telemetry.RemoteDependencyData(Util.newId(), url, UrlHelper.getPathName(url), resource.duration, true, 200, null, null, eventData, RemoteDependencyData.ResourceDependancyName);
                var dependencyData = new ApplicationInsights.Telemetry.Common.Data<ApplicationInsights.Telemetry.RemoteDependencyData>(
                    Telemetry.RemoteDependencyData.dataType, dependency);
                var envelope = new Telemetry.Common.Envelope(dependencyData, ApplicationInsights.Telemetry.RemoteDependencyData.envelopeType, new Date(startOffset));

                this.appInsights.context.track(envelope);
            }

            if (!foundNewResources) {
                clearInterval(this.intervalHandler);
            }
        }
    }
}
