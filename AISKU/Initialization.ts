// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IConfiguration, AppInsightsCore, IAppInsightsCore, LoggingSeverity, _InternalMessageId, ITelemetryItem } from "applicationinsights-core-js";
import { ApplicationInsights, IAppInsights } from "applicationinsights-analytics-js";
import { Util, IConfig, IDependencyTelemetry, PageViewPerformance, IPageViewPerformanceTelemetry, IPageViewTelemetry, IExceptionTelemetry, IAutoExceptionTelemetry, ITraceTelemetry, IMetricTelemetry } from "applicationinsights-common";
import { Sender } from "applicationinsights-channel-js";
import { PropertiesPlugin, IPropertiesPlugin } from "applicationinsights-properties-js";
import { AjaxPlugin as DependenciesPlugin, IDependenciesPlugin } from 'applicationinsights-dependencies-js';

"use strict";

export interface Snippet {
    queue: Array<() => void>;
    config: IConfiguration;
}

export interface IApplicationInsights extends IAppInsights, IDependenciesPlugin, IPropertiesPlugin {
    appInsights: ApplicationInsights;
};

export class Initialization implements IApplicationInsights {
    public snippet: Snippet;
    public config: IConfiguration;
    private core: IAppInsightsCore;
    public appInsights: ApplicationInsights;
    private properties: PropertiesPlugin;
    private dependencies: DependenciesPlugin;

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

        this.properties = new PropertiesPlugin();
        this.dependencies = new DependenciesPlugin();

        this.snippet = snippet;
        this.config = config;
    }
    
    // Analytics Plugin
    public trackPageView(pageView: IPageViewTelemetry, customProperties?: { [key: string]: any; }) {
        this.appInsights.trackPageView(pageView, customProperties);
    }
    public trackPageViewPerformance(pageViewPerformance: IPageViewPerformanceTelemetry, customProperties?: { [key:string]: any }): void {
        this.appInsights.trackPageViewPerformance(pageViewPerformance, customProperties);
    }
    public trackException(exception: IExceptionTelemetry, customProperties?: { [key: string]: any; }): void {
        this.appInsights.trackException(exception, customProperties);
    }
    public _onerror(exception: IAutoExceptionTelemetry): void {
        this.appInsights._onerror(exception);
    }
    public trackTrace(trace: ITraceTelemetry, customProperties?: { [key: string]: any; }): void {
        this.appInsights.trackTrace(trace, customProperties);
    }
    public trackMetric(metric: IMetricTelemetry, customProperties?: { [key: string]: any; }): void {
        this.appInsights.trackMetric(metric, customProperties);
    }
    public startTrackPage(name?: string): void {
        this.appInsights.startTrackPage(name);
    }
    public stopTrackPage(name?: string, url?: string, customProperties?: Object) {
        this.appInsights.stopTrackPage(name, url, customProperties);
    }
    public addTelemetryInitializer(telemetryInitializer: (item: ITelemetryItem) => boolean | void) {
        return this.appInsights.addTelemetryInitializer(telemetryInitializer);
    }

    // Properties Plugin
    public setAuthenticatedUserContext(authenticatedUserId: string, accountId?: string, storeInCookie = false): void {
         this.properties.user.setAuthenticatedUserContext(authenticatedUserId, accountId, storeInCookie);
    }
    public clearAuthenticatedUserContext(): void {
         this.properties.user.clearAuthenticatedUserContext();
    }

    // Dependencies Plugin
    public trackDependencyData(dependency: IDependencyTelemetry, customProperties?: {[key: string]: any}, systemProperties?: {[key: string]: any}): void {
        this.dependencies.trackDependencyData(dependency, customProperties, systemProperties);
    }

    public loadAppInsights(): IApplicationInsights {

        this.core = new AppInsightsCore();
        let extensions = [];
        let appInsightsChannel: Sender = new Sender();

        extensions.push(appInsightsChannel);
        extensions.push(this.properties);
        extensions.push(this.dependencies);
        extensions.push(this.appInsights);

        // initialize core
        this.core.initialize(this.config, extensions);
        return this;
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

    public pollInternalLogs(): void {
        this.core.pollInternalLogs();
    }

    public addHousekeepingBeforeUnload(appInsightsInstance: IApplicationInsights): void {
        // Add callback to push events when the user navigates away

        if (!appInsightsInstance.appInsights.config.disableFlushOnBeforeUnload && ('onbeforeunload' in window)) {
            var performHousekeeping = function () {
                // Adds the ability to flush all data before the page unloads.
                // Note: This approach tries to push an async request with all the pending events onbeforeunload.
                // Firefox does not respect this.Other browsers DO push out the call with < 100% hit rate.
                // Telemetry here will help us analyze how effective this approach is.
                // Another approach would be to make this call sync with a acceptable timeout to reduce the 
                // impact on user experience.

                //appInsightsInstance.context._sender.triggerSend();

                appInsightsInstance.appInsights.core.getTransmissionControls().forEach(queues => {
                    queues.forEach(channel => channel.flush(true));
                });
                
                // Back up the current session to local storage
                // This lets us close expired sessions after the cookies themselves expire
                // Todo: move this against interface behavior
                if (this.core.extensions["AppInsightsPropertiesPlugin"] &&
                    this.core.extensions["AppInsightsPropertiesPlugin"]._sessionManager) {
                    this.core.extensions["AppInsightsPropertiesPlugin"]._sessionManager.backup();
                }
            };

            if (!Util.addEventHandler('beforeunload', performHousekeeping)) {
                this.core.logger.throwInternal(
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
            identifier = identifier ? identifier : "ApplicationInsightsAnalytics";
        }

        // Undefined checks
        if (!configuration.extensionConfig) {
            configuration.extensionConfig = {};
        }
        if (!configuration.extensionConfig[identifier]) {
            configuration.extensionConfig[identifier] = {};
        }
        const extensionConfig: IConfig = configuration.extensionConfig[identifier]; // ref to main config
        // set default values
        configuration.endpointUrl = configuration.endpointUrl || "https://dc.services.visualstudio.com/v2/track";
        extensionConfig.sessionRenewalMs = 30 * 60 * 1000;
        extensionConfig.sessionExpirationMs = 24 * 60 * 60 * 1000;

        extensionConfig.enableDebug = Util.stringToBoolOrDefault(extensionConfig.enableDebug);
        extensionConfig.disableExceptionTracking = Util.stringToBoolOrDefault(extensionConfig.disableExceptionTracking);
        extensionConfig.consoleLoggingLevel = extensionConfig.consoleLoggingLevel || 1; // Show only CRITICAL level
        extensionConfig.telemetryLoggingLevel = extensionConfig.telemetryLoggingLevel || 0; // Send nothing
        extensionConfig.diagnosticLogInterval = extensionConfig.diagnosticLogInterval || 10000;
        extensionConfig.autoTrackPageVisitTime = Util.stringToBoolOrDefault(extensionConfig.autoTrackPageVisitTime);

        if (isNaN(extensionConfig.samplingPercentage) || extensionConfig.samplingPercentage <= 0 || extensionConfig.samplingPercentage >= 100) {
            extensionConfig.samplingPercentage = 100;
        }

        extensionConfig.disableAjaxTracking = Util.stringToBoolOrDefault(extensionConfig.disableAjaxTracking)
        extensionConfig.maxAjaxCallsPerView = !isNaN(extensionConfig.maxAjaxCallsPerView) ? extensionConfig.maxAjaxCallsPerView : 500;

        extensionConfig.disableCorrelationHeaders = Util.stringToBoolOrDefault(extensionConfig.disableCorrelationHeaders);
        extensionConfig.correlationHeaderExcludedDomains = extensionConfig.correlationHeaderExcludedDomains || [
            "*.blob.core.windows.net",
            "*.blob.core.chinacloudapi.cn",
            "*.blob.core.cloudapi.de",
            "*.blob.core.usgovcloudapi.net"];
        extensionConfig.disableFlushOnBeforeUnload = Util.stringToBoolOrDefault(extensionConfig.disableFlushOnBeforeUnload);
        extensionConfig.isCookieUseDisabled = Util.stringToBoolOrDefault(extensionConfig.isCookieUseDisabled);
        extensionConfig.isStorageUseDisabled = Util.stringToBoolOrDefault(extensionConfig.isStorageUseDisabled);
        extensionConfig.isBrowserLinkTrackingEnabled = Util.stringToBoolOrDefault(extensionConfig.isBrowserLinkTrackingEnabled);
        extensionConfig.enableCorsCorrelation = Util.stringToBoolOrDefault(extensionConfig.enableCorsCorrelation);

        return configuration;
    }
}