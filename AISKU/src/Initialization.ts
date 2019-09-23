// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IConfiguration, AppInsightsCore, IAppInsightsCore, LoggingSeverity, _InternalMessageId, ITelemetryItem, ICustomProperties, IChannelControls } from "@microsoft/applicationinsights-core-js";
import { ApplicationInsights } from "@microsoft/applicationinsights-analytics-js";
import { Util, IConfig, IDependencyTelemetry, IPageViewPerformanceTelemetry,IPropertiesPlugin,
         IPageViewTelemetry, IExceptionTelemetry, IAutoExceptionTelemetry, ITraceTelemetry, ITelemetryContext,
         IMetricTelemetry, IEventTelemetry, IAppInsights, PropertiesPluginIdentifier } from "@microsoft/applicationinsights-common";
import { Sender } from "@microsoft/applicationinsights-channel-js";
import { PropertiesPlugin, TelemetryContext } from "@microsoft/applicationinsights-properties-js";
import { AjaxPlugin as DependenciesPlugin, IDependenciesPlugin } from '@microsoft/applicationinsights-dependencies-js';

"use strict";

/**
 *
 * @export
 * @interface Snippet
 */
export interface Snippet {
    config: IConfiguration & IConfig;
    queue?: Array<() => void>;
    version?: number;
}

export interface IApplicationInsights extends IAppInsights, IDependenciesPlugin, IPropertiesPlugin {
    appInsights: ApplicationInsights;
    flush: (async?: boolean) => void;
    onunloadFlush: (async?: boolean) => void;
};

/**
 * Application Insights API
 * @class Initialization
 * @implements {IApplicationInsights}
 */
export class Initialization implements IApplicationInsights {
    public snippet: Snippet;
    public config: IConfiguration & IConfig;
    public appInsights: ApplicationInsights;
    public core: IAppInsightsCore;
    public context: TelemetryContext;

    private dependencies: DependenciesPlugin;
    private properties: PropertiesPlugin;

    constructor(snippet: Snippet) {
        // initialize the queue and config in case they are undefined
        snippet.queue = snippet.queue || [];
        snippet.version = snippet.version || 2.0; // Default to new version
        let config: IConfiguration & IConfig = snippet.config || ({} as any);

        // ensure instrumentationKey is specified
        if (config && !config.instrumentationKey) {
            config = (snippet as any);
            ApplicationInsights.Version = "2.2.4"; // Not currently used anywhere
        }

        this.appInsights = new ApplicationInsights();

        this.properties = new PropertiesPlugin();
        this.dependencies = new DependenciesPlugin();
        this.core = new AppInsightsCore();

        this.snippet = snippet;
        this.config = config;
        this.getSKUDefaults();
    }

    // Analytics Plugin
    /**
     * Log a user action or other occurrence.
     * @param {IEventTelemetry} event
     * @param {ICustomProperties} [customProperties]
     * @memberof Initialization
     */
    public trackEvent(event: IEventTelemetry, customProperties?: ICustomProperties) {
        this.appInsights.trackEvent(event, customProperties);
    }

    /**
     * Logs that a page, or similar container was displayed to the user.
     * @param {IPageViewTelemetry} pageView
     * @memberof Initialization
     */
    public trackPageView(pageView?: IPageViewTelemetry) {
        const inPv = pageView || {};
        this.appInsights.trackPageView(inPv);
    }

    /**
     * Log a bag of performance information via the customProperties field.
     * @param {IPageViewPerformanceTelemetry} pageViewPerformance
     * @memberof Initialization
     */
    public trackPageViewPerformance(pageViewPerformance: IPageViewPerformanceTelemetry): void {
        const inPvp = pageViewPerformance || {};
        this.appInsights.trackPageViewPerformance(inPvp);
    }

    /**
     * Log an exception that you have caught.
     * @param {IExceptionTelemetry} exception
     * @memberof Initialization
     */
    public trackException(exception: IExceptionTelemetry): void {
        if (!exception.exception && (exception as any).error) {
            exception.exception = (exception as any).error;
        }
        this.appInsights.trackException(exception);
    }

    /**
     * Manually send uncaught exception telemetry. This method is automatically triggered
     * on a window.onerror event.
     * @param {IAutoExceptionTelemetry} exception
     * @memberof Initialization
     */
    public _onerror(exception: IAutoExceptionTelemetry): void {
        this.appInsights._onerror(exception);
    }

    /**
     * Log a diagnostic scenario such entering or leaving a function.
     * @param {ITraceTelemetry} trace
     * @param {ICustomProperties} [customProperties]
     * @memberof Initialization
     */
    public trackTrace(trace: ITraceTelemetry, customProperties?: ICustomProperties): void {
        this.appInsights.trackTrace(trace, customProperties);
    }

    /**
     * Log a numeric value that is not associated with a specific event. Typically used
     * to send regular reports of performance indicators.
     *
     * To send a single measurement, just use the `name` and `average` fields
     * of {@link IMetricTelemetry}.
     *
     * If you take measurements frequently, you can reduce the telemetry bandwidth by
     * aggregating multiple measurements and sending the resulting average and modifying
     * the `sampleCount` field of {@link IMetricTelemetry}.
     * @param {IMetricTelemetry} metric input object argument. Only `name` and `average` are mandatory.
     * @param {ICustomProperties} [customProperties]
     * @memberof Initialization
     */
    public trackMetric(metric: IMetricTelemetry, customProperties?: ICustomProperties): void {
        this.appInsights.trackMetric(metric, customProperties);
    }
    /**
     * Starts the timer for tracking a page load time. Use this instead of `trackPageView` if you want to control when the page view timer starts and stops,
     * but don't want to calculate the duration yourself. This method doesn't send any telemetry. Call `stopTrackPage` to log the end of the page view
     * and send the event.
     * @param name A string that idenfities this item, unique within this HTML document. Defaults to the document title.
     */
    public startTrackPage(name?: string): void {
        this.appInsights.startTrackPage(name);
    }

    /**
     * Stops the timer that was started by calling `startTrackPage` and sends the pageview load time telemetry with the specified properties and measurements.
     * The duration of the page view will be the time between calling `startTrackPage` and `stopTrackPage`.
     * @param   name  The string you used as the name in startTrackPage. Defaults to the document title.
     * @param   url   String - a relative or absolute URL that identifies the page or other item. Defaults to the window location.
     * @param   properties  map[string, string] - additional data used to filter pages and metrics in the portal. Defaults to empty.
     * @param   measurements    map[string, number] - metrics associated with this page, displayed in Metrics Explorer on the portal. Defaults to empty.
     */
    public stopTrackPage(name?: string, url?: string, customProperties?: { [key: string]: any; }, measurements?: { [key: string]: number; }) {
        this.appInsights.stopTrackPage(name, url, customProperties, measurements);
    }

    public startTrackEvent(name?: string): void {
        this.appInsights.startTrackEvent(name);
    }

    /**
     * Log an extended event that you started timing with `startTrackEvent`.
     * @param   name    The string you used to identify this event in `startTrackEvent`.
     * @param   properties  map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
     * @param   measurements    map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
     */
    public stopTrackEvent(name: string, properties?: { [key: string]: string; }, measurements?: { [key: string]: number; }) {
        this.appInsights.stopTrackEvent(name, properties, measurements); // Todo: Fix to pass measurements once type is updated
    }

    public addTelemetryInitializer(telemetryInitializer: (item: ITelemetryItem) => boolean | void) {
        return this.appInsights.addTelemetryInitializer(telemetryInitializer);
    }

    // Properties Plugin

    /**
     * Set the authenticated user id and the account id. Used for identifying a specific signed-in user. Parameters must not contain whitespace or ,;=|
     *
     * The method will only set the `authenicatedUserId` and `accountId` in the curent page view. To set them for the whole sesion, you should set `storeInCookie = true`
     * @param {string} authenticatedUserId
     * @param {string} [accountId]
     * @param {boolean} [storeInCookie=false]
     * @memberof Initialization
     */
    public setAuthenticatedUserContext(authenticatedUserId: string, accountId?: string, storeInCookie = false): void {
         this.properties.context.user.setAuthenticatedUserContext(authenticatedUserId, accountId, storeInCookie);
    }

    /**
     * Clears the authenticated user id and account id. The associated cookie is cleared, if present.
     * @memberof Initialization
     */
    public clearAuthenticatedUserContext(): void {
         this.properties.context.user.clearAuthenticatedUserContext();
    }

    // Dependencies Plugin

    /**
     * Log a dependency call (e.g. ajax)
     * @param {IDependencyTelemetry} dependency
     * @memberof Initialization
     */
    public trackDependencyData(dependency: IDependencyTelemetry): void {
        this.dependencies.trackDependencyData(dependency);
    }

    // Misc

    /**
     * Manually trigger an immediate send of all telemetry still in the buffer.
     * @param {boolean} [async=true]
     * @memberof Initialization
     */
    public flush(async: boolean = true) {
        this.core.getTransmissionControls().forEach(channels => {
            channels.forEach(channel => {
                channel.flush(async);
            })
        })
    }

    /**
     * Manually trigger an immediate send of all telemetry still in the buffer using beacon Sender.
     * Fall back to xhr sender if beacon is not supported.
     * @param {boolean} [async=true]
     * @memberof Initialization
     */
    public onunloadFlush(async: boolean = true) {
        this.core.getTransmissionControls().forEach(channels => {
            channels.forEach((channel: IChannelControls & Sender) => {
                if (channel.onunloadFlush) {
                    channel.onunloadFlush();
                } else {
                    channel.flush(async);
                }
            })
        })
    }

    /**
     * Initialize this instance of ApplicationInsights
     * @returns {IApplicationInsights}
     * @memberof Initialization
     */
    public loadAppInsights(legacyMode: boolean = false): IApplicationInsights {

        // dont allow additional channels/other extensions for legacy mode; legacy mode is only to allow users to switch with no code changes!
        if (legacyMode && this.config.extensions && this.config.extensions.length > 0) {
            throw new Error("Extensions not allowed in legacy mode");
        }

        const extensions = [];
        const appInsightsChannel: Sender = new Sender();

        extensions.push(appInsightsChannel);
        extensions.push(this.properties);
        extensions.push(this.dependencies);
        extensions.push(this.appInsights);

        // initialize core
        this.core.initialize(this.config, extensions);

        // Empty queue of all api calls logged prior to sdk download
        this.emptyQueue();
        this.pollInternalLogs();
        this.addHousekeepingBeforeUnload(this);
        this.context = this.properties.context;

        return this;
    }

    /**
     * Overwrite the lazy loaded fields of global window snippet to contain the
     * actual initialized API methods
     * @param {Snippet} snippet
     * @memberof Initialization
     */
    public updateSnippetDefinitions(snippet: Snippet) {
        // apply full appInsights to the global instance
        // Note: This must be called before loadAppInsights is called
        for (const field in this) {
            if (typeof field === 'string') {
                snippet[field as string] = this[field];
            }
        }

    }

    /**
     * Call any functions that were queued before the main script was loaded
     * @memberof Initialization
     */
    public emptyQueue() {

        // call functions that were queued before the main script was loaded
        try {
            if (Util.isArray(this.snippet.queue)) {
                // note: do not check length in the for-loop conditional in case something goes wrong and the stub methods are not overridden.
                const length = this.snippet.queue.length;
                for (let i = 0; i < length; i++) {
                    const call = this.snippet.queue[i];
                    call();
                }

                this.snippet.queue = undefined;
                delete this.snippet.queue;
            }
        } catch (exception) {
            const properties: any = {};
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
            const performHousekeeping = () => {
                // Adds the ability to flush all data before the page unloads.
                // Note: This approach tries to push an async request with all the pending events onbeforeunload.
                // Firefox does not respect this.Other browsers DO push out the call with < 100% hit rate.
                // Telemetry here will help us analyze how effective this approach is.
                // Another approach would be to make this call sync with a acceptable timeout to reduce the
                // impact on user experience.

                // appInsightsInstance.context._sender.triggerSend();
                appInsightsInstance.onunloadFlush(false);

                // Back up the current session to local storage
                // This lets us close expired sessions after the cookies themselves expire
                const ext = appInsightsInstance.appInsights.core['_extensions'][PropertiesPluginIdentifier];
                if (ext && ext.context && ext.context._sessionManager) {
                    ext.context._sessionManager.backup();
                }
            };

            if (!Util.addEventHandler('beforeunload', performHousekeeping)) {
                appInsightsInstance.appInsights.core.logger.throwInternal(
                    LoggingSeverity.CRITICAL,
                    _InternalMessageId.FailedToAddHandlerForOnBeforeUnload,
                    'Could not add handler for beforeunload');
            }
        }
    }

    private getSKUDefaults() {
        this.config.diagnosticLogInterval =
            this.config.diagnosticLogInterval && this.config.diagnosticLogInterval > 0 ? this.config.diagnosticLogInterval : 10000;
    }
}
