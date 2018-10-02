import { IConfiguration, AppInsightsCore, IAppInsightsCore, LoggingSeverity, _InternalMessageId, ITelemetryItem } from "applicationinsights-core-js";
import { ApplicationInsights, IAppInsights, IPageViewTelemetry, IExceptionTelemetry, IAutoExceptionTelemetry, ITraceTelemetry, IMetricTelemetry } from "applicationinsights-analytics-js";
import { Util, IConfig, RemoteDependencyData, IDependencyTelemetry } from "applicationinsights-common";
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
    public static defaultName: string = "appInsights";
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
        // this.config.extensionConfig.ApplicationInsightsAnalytics = {
        //     ...this.config.extensionConfig.ApplicationInsightsAnalytics,
        // }
    }
    
    // Analytics Plugin
    public trackPageView(pageView: IPageViewTelemetry, customProperties?: { [key: string]: any; }) {
        this.appInsights.trackPageView(pageView, customProperties);
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
        const windowName: string = this.config.extensionConfig.ApplicationInsightsAnalytics.sdkInstanceName || Initialization.defaultName;

        extensions.push(appInsightsChannel);
        extensions.push(this.properties);
        extensions.push(this.dependencies);
        extensions.push(this.appInsights);

        // initialize core
        window[windowName] = this;
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
        const config: IConfig = configuration.extensionConfig[identifier]; // ref to main config

        // set default values
        configuration.endpointUrl = configuration.endpointUrl || "https://dc.services.visualstudio.com/v2/track";
        config.sessionRenewalMs = 30 * 60 * 1000;
        config.sessionExpirationMs = 24 * 60 * 60 * 1000;

        config.enableDebug = Util.stringToBoolOrDefault(config.enableDebug);
        config.disableExceptionTracking = Util.stringToBoolOrDefault(config.disableExceptionTracking);
        config.consoleLoggingLevel = config.consoleLoggingLevel || 1; // Show only CRITICAL level
        config.telemetryLoggingLevel = config.telemetryLoggingLevel || 0; // Send nothing
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
        config.sdkInstanceName = config.sdkInstanceName || Initialization.defaultName;

        return configuration;
    }
}