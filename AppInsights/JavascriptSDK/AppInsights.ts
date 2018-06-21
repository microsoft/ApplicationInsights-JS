import {
    Event, IConfig,
    _InternalLogging, LoggingSeverity,
    _InternalMessageId, Util,
    Data, Envelope,
    Trace, PageViewPerformance, PageView }
from "applicationinsights-common";

import { PageViewManager, IAppInsightsInternal } from "./Telemetry/PageViewManager";
import { AppInsightsCore, IPlugin, IConfiguration, IAppInsightsCore } from "applicationinsights-core-js";
import { TelemetryContext, ITelemetryConfig } from "./TelemetryContext";
import { PageVisitTimeManager } from "./Telemetry/PageVisitTimeManager";
import { IAppInsights } from "../JavascriptSDK.Interfaces/IAppInsights";
import { CoreUtils } from "JavaScriptSDK/CoreUtils";
import { IPageViewTelemetry } from "../JavascriptSDK.Interfaces/IPageViewTelemetry";

export class AppInsights implements IAppInsights, IPlugin, IAppInsightsInternal {
    public initialize: (config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[]) => void;

    public static Version = "0.0.1";

    private _core: IAppInsightsCore;

    // Counts number of trackAjax invokations.
    // By default we only monitor X ajax call per view to avoid too much load.
    // Default value is set in config.
    // This counter keeps increasing even after the limit is reached.
    private _trackAjaxAttempts: number = 0;

    private _eventTracking: Timing;
    private _pageTracking: Timing;
    private _pageViewManager: PageViewManager;
    private _pageVisitTimeManager: PageVisitTimeManager;

    public config: IConfig;
    public context: TelemetryContext;
    public queue: (() => void)[];
    public static appInsightsDefaultConfig: IConfig;

    constructor(config: IConfig) {
        this.config = config || <IConfig>{};
        this.initialize = this._initialize.bind(this);

        // load default values if specified
        var defaults: IConfig = AppInsights.appInsightsDefaultConfig;
        if (defaults !== undefined) {
            for (var field in defaults) {
                // for each unspecified field, set the default value
                if (this.config[field] === undefined) {
                    this.config[field] = defaults[field];
                }
            }
        }

        _InternalLogging.verboseLogging = () => this.config.verboseLogging;
        _InternalLogging.enableDebugExceptions = () => this.config.enableDebug;
        var configGetters: ITelemetryConfig = {
            instrumentationKey: () => this.config.instrumentationKey,
            accountId: () => this.config.accountId,
            sessionRenewalMs: () => this.config.sessionRenewalMs,
            sessionExpirationMs: () => this.config.sessionExpirationMs,
            // endpointUrl: () => this.config.endpointUrl,
            // emitLineDelimitedJson: () => this.config.emitLineDelimitedJson,
            // maxBatchSizeInBytes: () => {
            //     return (!this.config.isBeaconApiDisabled && Util.IsBeaconApiSupported()) ?
            //         Math.min(this.config.maxBatchSizeInBytes, Sender.MaxBeaconPayloadSize) :
            //         this.config.maxBatchSizeInBytes;
            // },
            // maxBatchInterval: () => this.config.maxBatchInterval,
            // disableTelemetry: () => this.config.disableTelemetry,
            sampleRate: () => this.config.samplingPercentage,
            cookieDomain: () => this.config.cookieDomain,
            // enableSessionStorageBuffer: () => {
            //     // Disable Session Storage buffer if telemetry is sent using Beacon API
            //     return ((this.config.isBeaconApiDisabled || !Util.IsBeaconApiSupported()) && this.config.enableSessionStorageBuffer);
            // },
            // isRetryDisabled: () => this.config.isRetryDisabled,
            // isBeaconApiDisabled: () => this.config.isBeaconApiDisabled,
            sdkExtension: () => this.config.sdkExtension,
            isBrowserLinkTrackingEnabled: () => this.config.isBrowserLinkTrackingEnabled,
            appId: () => this.config.appId
        }

        if (this.config.isCookieUseDisabled) {
            Util.disableCookies();
        }

        if (this.config.isStorageUseDisabled) {
            Util.disableStorage();
        }

        this.context = new TelemetryContext(configGetters, this._core);

        this._pageViewManager = new PageViewManager(this, this.config.overridePageViewDuration);

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

        // initialize page view timing
        this._pageTracking = new Timing("trackPageView");
        this._pageTracking.action = (name, url, duration, properties, measurements) => {
            this.sendPageViewInternal(name, url, duration, properties, measurements);
        }
    }

    /**
     * Logs that a page or other item was viewed. 
     * @param   name  The string you used as the name in startTrackPage. Defaults to the document title.
     * @param   url   String - a relative or absolute URL that identifies the page or other item. Defaults to the window location.
     * @param   properties  map[string, string] - additional data used to filter pages and metrics in the portal. Defaults to empty.
     * @param   measurements    map[string, number] - metrics associated with this page, displayed in Metrics Explorer on the portal. Defaults to empty.
     * @param   duration    number - the number of milliseconds it took to load the page. Defaults to undefined. If set to default value, page load time is calculated internally.
     */
    public trackPageView(pageView: IPageViewTelemetry) {
        try {
            
            let properties: Object = {};
            let measurements: Object = {}; 
            pageView.customDimensions.keys.forEach(key => {
                if (typeof pageView.customDimensions[key] === 'number') {
                    measurements[key] = pageView.customDimensions[key];
                } else {
                    properties[key] = pageView.customDimensions[key];
                }
            });

            this._pageViewManager.trackPageView(pageView.name, pageView.url, properties, measurements, pageView.duration);

            if (this.config.autoTrackPageVisitTime) {
                this._pageVisitTimeManager.trackPreviousPageVisit(pageView.name, pageView.url);
            }

        } catch (e) {
            _InternalLogging.throwInternal(
                LoggingSeverity.CRITICAL,
                _InternalMessageId.TrackPVFailed,
                "trackPageView failed, page view will not be collected: " + Util.getExceptionName(e),
                { exception: Util.dump(e) });
        }
    }

    public sendPageViewInternal(name?: string, url?: string, duration?: number, properties?: Object, measurements?: Object) {
        var pageView = new PageView(name, url, duration, properties, measurements, this.context.operation.id);
        var data = new Data<PageView>(PageView.dataType, pageView);
        var envelope = new Envelope(data, PageView.envelopeType);

        this.context.track(envelope);

        // reset ajaxes counter
        this._trackAjaxAttempts = 0;
    }

    public sendPageViewPerformanceInternal(pageViewPerformance: PageViewPerformance) {
        var pageViewPerformanceData = new Data<PageViewPerformance>(
            PageViewPerformance.dataType, pageViewPerformance);
        var pageViewPerformanceEnvelope = new Envelope(pageViewPerformanceData, PageViewPerformance.envelopeType);
        this.context.track(pageViewPerformanceEnvelope);
    }

    private _initialize(config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[]) {
        if (CoreUtils.isNullOrUndefined(core)) {
            throw Error("Error initializing");
        }

        this._core = core;
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