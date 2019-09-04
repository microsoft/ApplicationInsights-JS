// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/// <reference path="AppInsights.ts" />

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
                var properties: any = {};
                if (exception && typeof exception.toString === "function") {
                    properties.exception = exception.toString();
                }
                Microsoft.ApplicationInsights._InternalLogging.throwInternal(
                    LoggingSeverity.WARNING,
                    _InternalMessageId.FailedToSendQueuedTelemetry,
                    "Failed to send queued telemetry",
                    properties);
            }
        }

        public pollInteralLogs(appInsightsInstance: AppInsights) {
            return setInterval(() => {
                var queue: Array<_InternalLogMessage> = Microsoft.ApplicationInsights._InternalLogging.queue;
                var length = queue.length;
                for (var i = 0; i < length; i++) {
                    appInsightsInstance.trackTrace(queue[i].message);
                }
                queue.length = 0;
            }, this.config.diagnosticLogInterval);
        }

        public addHousekeepingBeforeUnload(appInsightsInstance: AppInsights): void {
            // Add callback to push events when the user navigates away

            if (!appInsightsInstance.config.disableFlushOnBeforeUnload && ('onbeforeunload' in window)) {
                var performHousekeeping = function () {
                    // Adds the ability to flush all data before the page unloads.
                    // Note: This approach tries to push an async request with all the pending events onbeforeunload.
                    // Firefox does not respect this.Other browsers DO push out the call with < 100% hit rate.
                    // Telemetry here will help us analyze how effective this approach is.
                    // Another approach would be to make this call sync with a acceptable timeout to reduce the 
                    // impact on user experience.
                    appInsightsInstance.context._sender.triggerSend();

                    // Back up the current session to local storage
                    // This lets us close expired sessions after the cookies themselves expire
                    appInsightsInstance.context._sessionManager.backup();
                };

                if (!Microsoft.ApplicationInsights.Util.addEventHandler('beforeunload', performHousekeeping)) {
                    Microsoft.ApplicationInsights._InternalLogging.throwInternal(
                        Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL,
                        Microsoft.ApplicationInsights._InternalMessageId.FailedToAddHandlerForOnBeforeUnload,
                        'Could not add handler for beforeunload');
                }
            }
        }

        public static getDefaultConfig(config?: IConfig): IConfig {
            if (!config) {
                config = <IConfig>{};
            }

            // set default values
            config.endpointUrl = config.endpointUrl || "https://dc.services.visualstudio.com/v2/track";
            config.sessionRenewalMs = 30 * 60 * 1000;
            config.sessionExpirationMs = 24 * 60 * 60 * 1000;
            config.maxBatchSizeInBytes = config.maxBatchSizeInBytes > 0 ? config.maxBatchSizeInBytes : 102400; // 100kb
            config.maxBatchInterval = !isNaN(config.maxBatchInterval) ? config.maxBatchInterval : 15000;
            config.enableDebug = Util.stringToBoolOrDefault(config.enableDebug);
            config.disableExceptionTracking = Util.stringToBoolOrDefault(config.disableExceptionTracking);
            config.disableTelemetry = Util.stringToBoolOrDefault(config.disableTelemetry);
            config.verboseLogging = Util.stringToBoolOrDefault(config.verboseLogging);
            config.emitLineDelimitedJson = Util.stringToBoolOrDefault(config.emitLineDelimitedJson);
            config.diagnosticLogInterval = config.diagnosticLogInterval || 10000;
            config.autoTrackPageVisitTime = Util.stringToBoolOrDefault(config.autoTrackPageVisitTime);

            if (isNaN(config.samplingPercentage) || config.samplingPercentage <= 0 || config.samplingPercentage >= 100) {
                config.samplingPercentage = 100;
            }

            config.disableAjaxTracking = Util.stringToBoolOrDefault(config.disableAjaxTracking);
            config.maxAjaxCallsPerView = !isNaN(config.maxAjaxCallsPerView) ? config.maxAjaxCallsPerView : 500;
          
            config.isBeaconApiDisabled = Util.stringToBoolOrDefault(config.isBeaconApiDisabled, true);
            config.disableCorrelationHeaders = Util.stringToBoolOrDefault(config.disableCorrelationHeaders);
            config.correlationHeaderExcludedDomains = config.correlationHeaderExcludedDomains || [
                "*.blob.core.windows.net", 
                "*.blob.core.chinacloudapi.cn",
                "*.blob.core.cloudapi.de",
                "*.blob.core.usgovcloudapi.net"];
            config.disableFlushOnBeforeUnload = Util.stringToBoolOrDefault(config.disableFlushOnBeforeUnload);
            config.enableSessionStorageBuffer = Util.stringToBoolOrDefault(config.enableSessionStorageBuffer, true);
            config.isRetryDisabled = Util.stringToBoolOrDefault(config.isRetryDisabled);
            config.isCookieUseDisabled = Util.stringToBoolOrDefault(config.isCookieUseDisabled);
            config.isStorageUseDisabled = Util.stringToBoolOrDefault(config.isStorageUseDisabled);
            config.isBrowserLinkTrackingEnabled = Util.stringToBoolOrDefault(config.isBrowserLinkTrackingEnabled);
            config.enableCorsCorrelation = Util.stringToBoolOrDefault(config.enableCorsCorrelation);
 
            return config;
        }
    }
}
