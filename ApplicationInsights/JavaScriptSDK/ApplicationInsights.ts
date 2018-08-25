/// <reference types="applicationinsights-common" />

import {
    Event, IConfig, Util,
    Data, Envelope,
    Trace, PageViewPerformance, PageView, DataSanitizer
} from "applicationinsights-common";

import { PageViewManager, IAppInsightsInternal } from "./Telemetry/PageViewManager";
import {
    IPlugin, IConfiguration, IAppInsightsCore,
    ITelemetryPlugin, CoreUtils, ITelemetryItem, _InternalLogging, LoggingSeverity, _InternalMessageId
} from "applicationinsights-core-js";
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
     * @param customProperties Additional data used to filter events and metrics. Defaults to empty.
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
        let telemetryItem = TelemetryItemCreator.createItem(pageView, PageView.dataType, PageView.envelopeType, properties, systemProperties);

        this.context.track(telemetryItem);

        // reset ajaxes counter
        this._trackAjaxAttempts = 0;
    }

    public sendPageViewPerformanceInternal(pageViewPerformance: PageViewPerformance) {
        // TODO: Commenting out for now as we this package only supports pageViewTelemetry. Added task 
        // https://mseng.visualstudio.com/AppInsights/_workitems/edit/1310811
        /*
        var pageViewPerformanceData = new Data<PageViewPerformance>(
            PageViewPerformance.dataType, pageViewPerformance);
        var pageViewPerformanceEnvelope = new Envelope(pageViewPerformanceData, PageViewPerformance.envelopeType);
        this.context.track(pageViewPerformanceEnvelope);
        */
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

        /* TODO re-enable once we add support for startTrackPage. Task to track this:
        https://mseng.visualstudio.com/AppInsights/1DS-Web/_workitems/edit/1305304
        // initialize page view timing
        this._pageTracking = new Timing("trackPageView");
        this._pageTracking.action = (name, url, duration, properties, measurements) => {
            let pageViewItem: IPageViewTelemetry = {
                name: name,
                uri: url,
                duration: duration,
            };
            this.sendPageViewInternal(pageViewItem, properties);
        }
        */
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

    public stop(name: string, url: string, properties?: Object, measurements?: Object) {
        var start = this._events[name];
        if (isNaN(start)) {
            _InternalLogging.throwInternal(
                LoggingSeverity.WARNING, _InternalMessageId.StopCalledWithoutStart, "stop was called without a corresponding start.",
                { name: this._name, key: name }, true);
        } else {
            var end = +new Date;
            var duration = PageViewPerformance.getDuration(start, end);
            this.action(name, url, duration, properties, measurements);
        }

        delete this._events[name];
        this._events[name] = undefined;
    }

    public action: (name?: string, url?: string, duration?: number, properties?: Object, measurements?: Object) => void;
}