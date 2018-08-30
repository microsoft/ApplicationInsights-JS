/// <reference types="applicationinsights-common" />

import {
    IConfig, _InternalLogging, LoggingSeverity,
    _InternalMessageId, Util, PageViewPerformance, PageView
} from "applicationinsights-common";

import { PageViewManager, IAppInsightsInternal } from "./Telemetry/PageViewManager";
import { IPlugin, IConfiguration, IAppInsightsCore, ITelemetryPlugin, CoreUtils, ITelemetryItem } from "applicationinsights-core-js";
import { TelemetryContext } from "./TelemetryContext";
import { PageVisitTimeManager } from "./Telemetry/PageVisitTimeManager";
import { IAppInsights } from "../JavascriptSDK.Interfaces/IAppInsights";
import { IPageViewTelemetry, IPageViewTelemetryInternal } from "../JavascriptSDK.Interfaces/IPageViewTelemetry";
import { ITelemetryConfig } from "../JavaScriptSDK.Interfaces/ITelemetryConfig";
import { TelemetryItemCreator } from "./TelemetryItemCreator";

"use strict";

export class ApplicationInsights implements IAppInsights, ITelemetryPlugin, IAppInsightsInternal {

    public static defaultIdentifier = "ApplicationInsightsAnalytics";
    public identifier: string;
    priority: number;
    public initialize: (config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[]) => void;

    public static Version = "0.0.1";
    private _globalconfig: IConfiguration;
    private _nextPlugin: ITelemetryPlugin;
    private _pageTracking: Timing;

    // Counts number of trackAjax invokations.
    // By default we only monitor X ajax call per view to avoid too much load.
    // Default value is set in config.
    // This counter keeps increasing even after the limit is reached.
    private _trackAjaxAttempts: number = 0;

    private _pageViewManager: PageViewManager;
    private _pageVisitTimeManager: PageVisitTimeManager;

    public config: IConfig;
    public core: IAppInsightsCore;
    public context: TelemetryContext;
    public queue: (() => void)[];
    public static appInsightsDefaultConfig: IConfiguration;

    constructor() {
        this.identifier = ApplicationInsights.defaultIdentifier;
        this.initialize = this._initialize.bind(this);
    }

    public processTelemetry(env: ITelemetryItem) {
        if (!CoreUtils.isNullOrUndefined(this._nextPlugin)) {
            this._nextPlugin.processTelemetry(env);
        }
    }

    public setNextPlugin(next: ITelemetryPlugin) {
        this._nextPlugin = next;
    }

    /**
     * Logs that a page or other item was viewed. 
     * @param IPageViewTelemetry The string you used as the name in startTrackPage. Defaults to the document title.
     * @param customProperties Additional data used to filter events and metrics. Defaults to empty. If a user wants
     *                         to provide a custom duration, it'll have to be in customProperties
     */
    public trackPageView(pageView: IPageViewTelemetry, customProperties?: { [key: string]: any }) {
        try {
            this._pageViewManager.trackPageView(pageView, customProperties);

            if (this.config.autoTrackPageVisitTime) {
                this._pageVisitTimeManager.trackPreviousPageVisit(pageView.name, pageView.uri);
            }
        } catch (e) {
            _InternalLogging.throwInternal(
                LoggingSeverity.CRITICAL,
                _InternalMessageId.TrackPVFailed,
                "trackPageView failed, page view will not be collected: " + Util.getExceptionName(e),
                { exception: Util.dump(e) });
        }
    }

    public sendPageViewInternal(pageView: IPageViewTelemetryInternal, properties?: { [key: string]: any }, systemProperties?: { [key: string]: any }) {
        let telemetryItem = TelemetryItemCreator.createItem(pageView, 
            PageView.dataType, 
            PageView.envelopeType, 
            properties, 
            systemProperties);

        this.context.track(telemetryItem);

        // reset ajaxes counter
        this._trackAjaxAttempts = 0;
    }

    public sendPageViewPerformanceInternal(pageViewPerformance: PageViewPerformance, properties?: { [key: string]: any }) {
        let telemetryItem = TelemetryItemCreator.createItem(pageViewPerformance,
            PageViewPerformance.dataType,
            PageViewPerformance.envelopeType,
            properties);

        this.context.track(telemetryItem);
    }

    /**
     * Starts timing how long the user views a page or other item. Call this when the page opens. 
     * This method doesn't send any telemetry. Call {@link stopTrackTelemetry} to log the page when it closes.
     * @param name A string that idenfities this item, unique within this HTML document. Defaults to the document title.
     */
    public startTrackPage(name?: string) {
        try {
            if (typeof name !== "string") {
                name = window.document && window.document.title || "";
            }

            this._pageTracking.start(name);
        } catch (e) {
            _InternalLogging.throwInternal(
                LoggingSeverity.CRITICAL,
                _InternalMessageId.StartTrackFailed,
                "startTrackPage failed, page view may not be collected: " + Util.getExceptionName(e),
                { exception: Util.dump(e) });
        }
    }

    /**
     * Logs how long a page or other item was visible, after {@link startTrackPage}. Call this when the page closes. 
     * @param name The string you used as the name in startTrackPage. Defaults to the document title.
     * @param url A relative or absolute URL that identifies the page or other item. Defaults to the window location.
     * @param properties Additional data used to filter pages and metrics in the portal. Defaults to empty. 
     *                   Any property of type double will be considered a measurement, and will be treated by Application Insights as a metric
     */
    public stopTrackPage(name?: string, url?: string, properties?: Object) {
        try {
            if (typeof name !== "string") {
                name = window.document && window.document.title || "";
            }

            if (typeof url !== "string") {
                url = window.location && window.location.href || "";
            }

            this._pageTracking.stop(name, url, properties);

            if (this.config.autoTrackPageVisitTime) {
                this._pageVisitTimeManager.trackPreviousPageVisit(name, url);
            }
        } catch (e) {
            _InternalLogging.throwInternal(
                LoggingSeverity.CRITICAL,
                _InternalMessageId.StopTrackFailed,
                "stopTrackPage failed, page view will not be collected: " + Util.getExceptionName(e),
                { exception: Util.dump(e) });
        }
    }

    private _initialize(config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[]) {
        if (CoreUtils.isNullOrUndefined(core)) {
            throw Error("Error initializing");
        }

        this.core = core;
        this._globalconfig = {
            instrumentationKey: config.instrumentationKey,
            endpointUrl: config.endpointUrl
        };

        this.config = config.extensions && config.extensions[this.identifier] ? config.extensions[this.identifier] : <IConfig>{};

        // load default values if specified
        var defaults: IConfiguration = ApplicationInsights.appInsightsDefaultConfig;
        if (defaults !== undefined) {
            if (defaults.extensions && defaults.extensions[this.identifier]) {
                for (var field in defaults.extensions[this.identifier]) {
                    // for each unspecified field, set the default value
                    if (this.config[field] === undefined) {
                        this.config[field] = defaults[field];
                    }
                }
            }

            if (this._globalconfig) {
                for (var field in defaults) {
                    if (this._globalconfig[field] === undefined) {
                        this._globalconfig[field] = defaults[field];
                    }
                }
            }
        }

        _InternalLogging.verboseLogging = () => this.config.verboseLogging;
        _InternalLogging.enableDebugExceptions = () => this.config.enableDebug;

        // Todo: move this out of static state
        if (this.config.isCookieUseDisabled) {
            Util.disableCookies();
        }

        // Todo: move this out of static state
        if (this.config.isStorageUseDisabled) {
            Util.disableStorage();
        }

        var configGetters: ITelemetryConfig = {
            instrumentationKey: () => config.instrumentationKey,
            accountId: () => this.config.accountId,
            sessionRenewalMs: () => this.config.sessionRenewalMs,
            sessionExpirationMs: () => this.config.sessionExpirationMs,
            sampleRate: () => this.config.samplingPercentage,
            cookieDomain: () => this.config.cookieDomain,
            sdkExtension: () => this.config.sdkExtension,
            isBrowserLinkTrackingEnabled: () => this.config.isBrowserLinkTrackingEnabled,
            appId: () => this.config.appId
        }

        this.context = new TelemetryContext(configGetters, this.core);

        this._pageViewManager = new PageViewManager(this, this.config.overridePageViewDuration, this.core);

        /*
        TODO: renable this trackEvent once we support trackEvent in this package. Created task to track this:
        https://mseng.visualstudio.com/AppInsights/_workitems/edit/1310833

        // initialize event timing
        this._eventTracking = new Timing("trackEvent");
        this._eventTracking.action = (name?: string, url?: string, duration?: number, properties?: Object, measurements?: Object) => {
            if (!measurements) {
                measurements = { duration: duration };
            }
            else {
                // do not override existing duration value
                if (isNaN(measurements["duration"])) {
                    measurements["duration"] = duration;
                }
            }


            var event = new Event(name, properties, measurements);
            var data = new Data<Event>(Event.dataType, event);
            var envelope = new Envelope(data, Event.envelopeType);

            this.context.track(envelope);
        }
        */

        // initialize page view timing
        this._pageTracking = new Timing("trackPageView");
        this._pageTracking.action = (name, url, duration, properties) => {
            let pageViewItem: IPageViewTelemetry = {
                name: name,
                uri: url
            };

            // duration must be a custom property in order for the collector to extract it
            properties["duration"] = duration;
            this.sendPageViewInternal(pageViewItem, properties);
        }
    }
}

/**
 * Used to record timed events and page views.
 */
class Timing {
    private _name;
    private _action: (ITimingDetail, number) => void;
    private _events: {
        [key: string]: number;
    };

    constructor(name: string) {
        this._name = name;
        this._events = {};
    }

    public start(name: string) {
        if (typeof this._events[name] !== "undefined") {
            _InternalLogging.throwInternal(
                LoggingSeverity.WARNING, _InternalMessageId.StartCalledMoreThanOnce, "start was called more than once for this event without calling stop.",
                { name: this._name, key: name }, true);
        }

        this._events[name] = +new Date;
    }

    public stop(name: string, url: string, properties?: Object) {
        var start = this._events[name];
        if (isNaN(start)) {
            _InternalLogging.throwInternal(
                LoggingSeverity.WARNING, _InternalMessageId.StopCalledWithoutStart, "stop was called without a corresponding start.",
                { name: this._name, key: name }, true);
        } else {
            var end = +new Date;
            var duration = PageViewPerformance.getDuration(start, end);
            this.action(name, url, duration, properties);
        }

        delete this._events[name];
        this._events[name] = undefined;
    }

    public action: (name?: string, url?: string, duration?: number, properties?: Object) => void;
}