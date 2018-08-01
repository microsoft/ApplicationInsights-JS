/// <reference types="applicationinsights-core-js" />
/// <reference types="applicationinsights-common" />
/// <reference types="applicationinsights-analytics-js" />
/// <reference types="applicationinsights-channel-js" />

import { IConfiguration, AppInsightsCore, IAppInsightsCore } from "applicationinsights-core-js";
import { ApplicationInsights } from "applicationinsights-analytics-js";
import { Util, _InternalLogging, LoggingSeverity, _InternalMessageId, IConfig } from "applicationinsights-common";
import { Sender } from "applicationinsights-channel-js";


"use strict";

export interface Snippet {
    queue: Array<() => void>;
    config: IConfiguration;
}

export class Initialization {
    public snippet: Snippet;
    public config: IConfiguration;
    private core: IAppInsightsCore;
    private appInsights: ApplicationInsights;

    constructor(snippet: Snippet) {

        // initialize the queue and config in case they are undefined
        snippet.queue = snippet.queue || [];
        var config: IConfiguration = snippet.config || <any>{};

        // ensure instrumentationKey is specified
        if (config && !config.instrumentationKey) {
            config = <any>snippet;
            ApplicationInsights.Version = "2.0.0";
        }

        this.appInsights = new ApplicationInsights();
        // set default values using config passed through snippet
        config = Initialization.getDefaultConfig(config, this.appInsights.identifier);

        this.snippet = snippet;
        this.config = config;
    }

    public loadAppInsights() {

        this.core = new AppInsightsCore();
        let extensions = [];
        let appInsightsChannel : Sender = new Sender();



        extensions.push(appInsightsChannel);
        extensions.push(this.appInsights);

        // initialize core
        this.core.initialize(this.config, extensions);
        
        // initialize extensions
        this.appInsights.initialize(this.config, this.core, extensions);
        appInsightsChannel.initialize(this.config);
        return this.appInsights;
    }

    public emptyQueue() {

        // call functions that were queued before the main script was loaded
        try {
            if (Util.isArray(this.snippet.queue)) {
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

            // need from core
            // Microsoft.ApplicationInsights._InternalLogging.throwInternal(
            //     LoggingSeverity.WARNING,
            //     _InternalMessageId.FailedToSendQueuedTelemetry,
            //     "Failed to send queued telemetry",
            //     properties);
        }
    }

    public pollInteralLogs(appInsightsInstance: ApplicationInsights) {
        // return setInterval(() => {
        //     var queue: Array<_InternalLogMessage> = ApplicationInsights._InternalLogging.queue;
        //     var length = queue.length;
        //     for (var i = 0; i < length; i++) {
        //         appInsightsInstance.trackTrace(queue[i].message);
        //     }
        //     queue.length = 0;
        // }, this.config.diagnosticLogInterval);
    }

    public addHousekeepingBeforeUnload(appInsightsInstance: ApplicationInsights): void {
        // Add callback to push events when the user navigates away

        if (!appInsightsInstance.config.disableFlushOnBeforeUnload && ('onbeforeunload' in window)) {
            var performHousekeeping = function () {
                // Adds the ability to flush all data before the page unloads.
                // Note: This approach tries to push an async request with all the pending events onbeforeunload.
                // Firefox does not respect this.Other browsers DO push out the call with < 100% hit rate.
                // Telemetry here will help us analyze how effective this approach is.
                // Another approach would be to make this call sync with a acceptable timeout to reduce the 
                // impact on user experience.
                
                //appInsightsInstance.context._sender.triggerSend();

                this.core.getTransmissionControl().flush(true);
                // Back up the current session to local storage
                // This lets us close expired sessions after the cookies themselves expire
                appInsightsInstance.context._sessionManager.backup();
            };

            if (!Util.addEventHandler('beforeunload', performHousekeeping)) {
                _InternalLogging.throwInternal(
                    LoggingSeverity.CRITICAL,
                    _InternalMessageId.FailedToAddHandlerForOnBeforeUnload,
                    'Could not add handler for beforeunload');
            }
        }
    }

    public static getDefaultConfig(configuration?: IConfiguration, identifier?: string): IConfiguration {
        if (!configuration) {
            configuration = <IConfiguration>{};
        }

        if (configuration) {
            identifier = identifier ? identifier : "AppAnalytics"; // To do: define constant        
        }

        let config = configuration.extensions ? <IConfig>configuration.extensions[identifier] : {};

        // set default values
        configuration.endpointUrl = configuration.endpointUrl || "https://dc.services.visualstudio.com/v2/track";
        config.sessionRenewalMs = 30 * 60 * 1000;
        config.sessionExpirationMs = 24 * 60 * 60 * 1000;
        
        config.enableDebug = Util.stringToBoolOrDefault(config.enableDebug);
        config.disableExceptionTracking = Util.stringToBoolOrDefault(config.disableExceptionTracking);
        config.verboseLogging = Util.stringToBoolOrDefault(config.verboseLogging);
        config.diagnosticLogInterval = config.diagnosticLogInterval || 10000;
        config.autoTrackPageVisitTime = Util.stringToBoolOrDefault(config.autoTrackPageVisitTime);

        if (isNaN(config.samplingPercentage) || config.samplingPercentage <= 0 || config.samplingPercentage >= 100) {
            config.samplingPercentage = 100;
        }

        config.disableAjaxTracking = Util.stringToBoolOrDefault(config.disableAjaxTracking)
        config.maxAjaxCallsPerView = !isNaN(config.maxAjaxCallsPerView) ? config.maxAjaxCallsPerView : 500;
        
        config.disableCorrelationHeaders = Util.stringToBoolOrDefault(config.disableCorrelationHeaders);
        config.correlationHeaderExcludedDomains = config.correlationHeaderExcludedDomains || [
            "*.blob.core.windows.net", 
            "*.blob.core.chinacloudapi.cn",
            "*.blob.core.cloudapi.de",
            "*.blob.core.usgovcloudapi.net"];
        config.disableFlushOnBeforeUnload = Util.stringToBoolOrDefault(config.disableFlushOnBeforeUnload);
        config.isCookieUseDisabled = Util.stringToBoolOrDefault(config.isCookieUseDisabled);
        config.isStorageUseDisabled = Util.stringToBoolOrDefault(config.isStorageUseDisabled);
        config.isBrowserLinkTrackingEnabled = Util.stringToBoolOrDefault(config.isBrowserLinkTrackingEnabled);
        config.enableCorsCorrelation = Util.stringToBoolOrDefault(config.enableCorsCorrelation);

        return configuration;
    }
}