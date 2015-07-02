/// <reference path="appinsights.ts" />

module Microsoft.ApplicationInsights {
    "use strict";

    export interface Snippet {
        queue: Array<() => void>;
        config: IConfig;
    }

    export class Initialization {
        public snippet: Snippet;
        public config: IConfig;

        constructor(snippet: Snippet) {
            // initialize the queue and config in case they are undefined
            snippet.queue = snippet.queue || [];
            var config: IConfig = snippet.config || <any>{};

            // ensure instrumentationKey is specified
            if (config && !config.instrumentationKey) {
                config = <any>snippet;

                // check for legacy instrumentation key
                if (config["iKey"]) {
                    Microsoft.ApplicationInsights.Version = "0.10.0.0";
                    config.instrumentationKey = config["iKey"];
                } else if (config["applicationInsightsId"]) {
                    Microsoft.ApplicationInsights.Version = "0.7.2.0";
                    config.instrumentationKey = config["applicationInsightsId"];
                } else {
                    throw new Error("Cannot load Application Insights SDK, no instrumentationKey was provided.");
                }
            }

            // set default values
            config = Initialization.getDefaultConfig(config);

            this.snippet = snippet;
            this.config = config;
        }

        // note: these are split into methods to enable unit tests
        public loadAppInsights() {

            // initialize global instance of appInsights
            var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.config);

            // implement legacy version of trackPageView for 0.10<
            if (this.config["iKey"]) {
                var originalTrackPageView = appInsights.trackPageView;
                appInsights.trackPageView = (pagePath?: string, properties?: Object, measurements?: Object) => {
                    originalTrackPageView.apply(appInsights, [null, pagePath, properties, measurements]);
                }
            }

            // implement legacy pageView interface if it is present in the snippet
            var legacyPageView = "logPageView";
            if (typeof this.snippet[legacyPageView] === "function") {
                appInsights[legacyPageView] = (pagePath?: string, properties?: Object, measurements?: Object) => {
                    appInsights.trackPageView(null, pagePath, properties, measurements);
                }
            }

            // implement legacy event interface if it is present in the snippet
            var legacyEvent = "logEvent";
            if (typeof this.snippet[legacyEvent] === "function") {
                appInsights[legacyEvent] = (name: string, properties?: Object, measurements?: Object) => {
                    appInsights.trackEvent(name, properties, measurements);
                }
            }

            return appInsights;
        }

        public emptyQueue() {

            // call functions that were queued before the main script was loaded
            try {
                if (Microsoft.ApplicationInsights.Util.isArray(this.snippet.queue)) {
                    // note: do not check length in the for-loop conditional in case something goes wrong and the stub methods are not overridden.
                    var length = this.snippet.queue.length;
                    for (var i = 0; i < length; i++) {
                        var call = this.snippet.queue[i];
                        call();
                    }

                    this.snippet.queue = undefined;
                    delete this.snippet.queue;
                }
            } catch (exception) {
                var message = "Failed to send queued telemetry";
                if (exception && typeof exception.toString === "function") {
                    message += ": " + exception.toString();
                }

                Microsoft.ApplicationInsights._InternalLogging.throwInternalNonUserActionable(LoggingSeverity.WARNING, message);
            }
        }

        public pollInteralLogs(appInsightsInstance: AppInsights) {
            return setInterval(() => {
                var queue: Array<string> = Microsoft.ApplicationInsights._InternalLogging.queue;
                var length = queue.length;
                for (var i = 0; i < length; i++) {
                    appInsightsInstance.trackTrace(queue[i]);
                }
                queue.length = 0;
            }, this.config.diagnosticLogInterval);
        }

        public static getDefaultConfig(config?: IConfig): IConfig {
            if (!config) {
                config = <IConfig>{};
            }

            // set default values
            config.endpointUrl = config.endpointUrl || "//dc.services.visualstudio.com/v2/track";
            config.accountId = config.accountId;
            config.appUserId = config.appUserId;
            config.sessionRenewalMs = 30 * 60 * 1000;
            config.sessionExpirationMs = 24 * 60 * 60 * 1000;
            config.maxBatchSizeInBytes = config.maxBatchSizeInBytes > 0 ? config.maxBatchSizeInBytes : 1000000;
            config.maxBatchInterval = !isNaN(config.maxBatchInterval) ? config.maxBatchInterval : 15000;
            config.enableDebug = Util.stringToBoolOrDefault(config.enableDebug);
            config.autoCollectErrors = (config.autoCollectErrors !== undefined && config.autoCollectErrors !== null) ?
                Util.stringToBoolOrDefault(config.autoCollectErrors) :
                true;
            config.disableTelemetry = Util.stringToBoolOrDefault(config.disableTelemetry);
            config.verboseLogging = Util.stringToBoolOrDefault(config.verboseLogging);
            config.emitLineDelimitedJson = Util.stringToBoolOrDefault(config.emitLineDelimitedJson);
            config.diagnosticLogInterval = config.diagnosticLogInterval || 10000;
            config.samplingPercentage = config.samplingPercentage || 100;

            return config;
        }
    }
}
