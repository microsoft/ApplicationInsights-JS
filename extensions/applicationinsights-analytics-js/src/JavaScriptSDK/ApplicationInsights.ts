/**
 * ApplicationInsights.ts
 * @copyright Microsoft 2018
 */

import {
    IConfig, Util, PageViewPerformance, IAppInsights, PageView, RemoteDependencyData, Event as EventTelemetry, IEventTelemetry,
    TelemetryItemCreator, Metric, Exception, SeverityLevel, Trace, IDependencyTelemetry,
    IExceptionTelemetry, ITraceTelemetry, IMetricTelemetry, IAutoExceptionTelemetry,
    IPageViewTelemetryInternal, IPageViewTelemetry, IPageViewPerformanceTelemetry, IPageViewPerformanceTelemetryInternal,
    ConfigurationManager, DateTimeUtils,
    IExceptionInternal,
    PropertiesPluginIdentifier
} from "@microsoft/applicationinsights-common";

import {
    IPlugin, IConfiguration, IAppInsightsCore,
    ITelemetryPlugin, CoreUtils, ITelemetryItem,
    IDiagnosticLogger, LoggingSeverity, _InternalMessageId, ICustomProperties,
} from "@microsoft/applicationinsights-core-js";
import { PageViewManager, IAppInsightsInternal } from "./Telemetry/PageViewManager";
import { PageVisitTimeManager } from "./Telemetry/PageVisitTimeManager";
import { PageViewPerformanceManager } from './Telemetry/PageViewPerformanceManager';
import { ITelemetryConfig } from "../JavaScriptSDK.Interfaces/ITelemetryConfig";

// For types only
import * as properties from "@microsoft/applicationinsights-properties-js";

"use strict";

const durationProperty: string = "duration";

export class ApplicationInsights implements IAppInsights, ITelemetryPlugin, IAppInsightsInternal {
    public static Version = "2.2.4"; // Not currently used anywhere

    public static getDefaultConfig(config?: IConfig): IConfig {
        if (!config) {
            config = {};
        }

        // set default values
        config.sessionRenewalMs = 30 * 60 * 1000;
        config.sessionExpirationMs = 24 * 60 * 60 * 1000;
        config.disableExceptionTracking = Util.stringToBoolOrDefault(config.disableExceptionTracking);
        config.autoTrackPageVisitTime = Util.stringToBoolOrDefault(config.autoTrackPageVisitTime);
        config.overridePageViewDuration = Util.stringToBoolOrDefault(config.overridePageViewDuration);

        if (isNaN(config.samplingPercentage) || config.samplingPercentage <= 0 || config.samplingPercentage >= 100) {
            config.samplingPercentage = 100;
        }

        config.isCookieUseDisabled = Util.stringToBoolOrDefault(config.isCookieUseDisabled);
        config.isStorageUseDisabled = Util.stringToBoolOrDefault(config.isStorageUseDisabled);
        config.isBrowserLinkTrackingEnabled = Util.stringToBoolOrDefault(config.isBrowserLinkTrackingEnabled);
        config.enableAutoRouteTracking = Util.stringToBoolOrDefault(config.enableAutoRouteTracking);
        config.namePrefix = config.namePrefix || "";

        return config;
    }
    public initialize: (config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[]) => void;
    public identifier: string = "ApplicationInsightsAnalytics"; // do not change name or priority
    public priority: number = 180; // take from reserved priority range 100- 200
    public config: IConfig;
    public core: IAppInsightsCore;
    public queue: Array<() => void>;
    public autoRoutePVDelay = 500; // ms; Time to wait after a route change before triggering a pageview to allow DOM changes to take place
    protected _nextPlugin: ITelemetryPlugin;
    protected _logger: IDiagnosticLogger; // Initialized by Core
    protected _telemetryInitializers: Array<(envelope: ITelemetryItem) => boolean | void>; // Internal telemetry initializers.
    protected _pageViewManager: PageViewManager;
    protected _pageViewPerformanceManager: PageViewPerformanceManager;
    protected _pageVisitTimeManager: PageVisitTimeManager;

    private _isInitialized: boolean = false;
    private _globalconfig: IConfiguration;
    private _eventTracking: Timing;
    private _pageTracking: Timing;
    private _properties: properties.PropertiesPlugin;

    // Counts number of trackAjax invokations.
    // By default we only monitor X ajax call per view to avoid too much load.
    // Default value is set in config.
    // This counter keeps increasing even after the limit is reached.
    private _trackAjaxAttempts: number = 0;

    // array with max length of 2 that store current url and previous url for SPA page route change trackPageview use.
    private _prevUri: string = typeof window === "object" && window.location && window.location.href || "";
    private _currUri: string;

    constructor() {
        this.initialize = this._initialize.bind(this);
    }


    public processTelemetry(env: ITelemetryItem) {
        let doNotSendItem = false;
        const telemetryInitializersCount = this._telemetryInitializers.length;
        for (let i = 0; i < telemetryInitializersCount; ++i) {
            const telemetryInitializer = this._telemetryInitializers[i];
            if (telemetryInitializer) {
                try {
                    if (telemetryInitializer.apply(null, [env]) === false) {
                        doNotSendItem = true;
                        break;
                    }
                } catch (e) {
                    // log error but dont stop executing rest of the telemetry initializers
                    // doNotSendItem = true;
                    this._logger.throwInternal(
                        LoggingSeverity.CRITICAL, _InternalMessageId.TelemetryInitializerFailed, "One of telemetry initializers failed, telemetry item will not be sent: " + Util.getExceptionName(e),
                        { exception: Util.dump(e) }, true);
                }
            }
        }

        if (!doNotSendItem && !CoreUtils.isNullOrUndefined(this._nextPlugin)) {
            this._nextPlugin.processTelemetry(env);
        }
    }

    public setNextPlugin(next: ITelemetryPlugin) {
        this._nextPlugin = next;
    }

    public trackEvent(event: IEventTelemetry, customProperties?: ICustomProperties): void {
        try {
            const telemetryItem = TelemetryItemCreator.create<IEventTelemetry>(
                event,
                EventTelemetry.dataType,
                EventTelemetry.envelopeType,
                this._logger,
                customProperties
            );

            this.core.track(telemetryItem);
        } catch (e) {
            this._logger.throwInternal(LoggingSeverity.WARNING,
                _InternalMessageId.TrackTraceFailed,
                "trackTrace failed, trace will not be collected: " + Util.getExceptionName(e),
                { exception: Util.dump(e) });
        }
    }

    /**
     * Start timing an extended event. Call `stopTrackEvent` to log the event when it ends.
     * @param   name    A string that identifies this event uniquely within the document.
     */
    public startTrackEvent(name: string) {
        try {
            this._eventTracking.start(name);
        } catch (e) {
            this._logger.throwInternal(LoggingSeverity.CRITICAL,
                _InternalMessageId.StartTrackEventFailed,
                "startTrackEvent failed, event will not be collected: " + Util.getExceptionName(e),
                { exception: Util.dump(e) });
        }
    }

    /**
     * Log an extended event that you started timing with `startTrackEvent`.
     * @param   name    The string you used to identify this event in `startTrackEvent`.
     * @param   properties  map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
     * @param   measurements    map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
     */
    public stopTrackEvent(name: string, properties?: { [key: string]: string }, measurements?: { [key: string]: number }) {
        try {
            this._eventTracking.stop(name, undefined, properties); // Todo: Fix to pass measurements once type is updated
        } catch (e) {
            this._logger.throwInternal(LoggingSeverity.CRITICAL,
                _InternalMessageId.StopTrackEventFailed,
                "stopTrackEvent failed, event will not be collected: " + Util.getExceptionName(e),
                { exception: Util.dump(e) });
        }
    }

    /**
     * @description Log a diagnostic message
     * @param {ITraceTelemetry} trace
     * @param ICustomProperties.
     * @memberof ApplicationInsights
     */
    public trackTrace(trace: ITraceTelemetry, customProperties?: ICustomProperties): void {
        try {
            const telemetryItem = TelemetryItemCreator.create<ITraceTelemetry>(
                trace,
                Trace.dataType,
                Trace.envelopeType,
                this._logger,
                customProperties);

            this.core.track(telemetryItem);
        } catch (e) {
            this._logger.throwInternal(LoggingSeverity.WARNING,
                _InternalMessageId.TrackTraceFailed,
                "trackTrace failed, trace will not be collected: " + Util.getExceptionName(e),
                { exception: Util.dump(e) });
        }
    }

    /**
     * @description Log a numeric value that is not associated with a specific event. Typically
     * used to send regular reports of performance indicators. To send single measurement, just
     * use the name and average fields of {@link IMetricTelemetry}. If you take measurements
     * frequently, you can reduce the telemetry bandwidth by aggregating multiple measurements
     * and sending the resulting average at intervals
     * @param {IMetricTelemetry} metric input object argument. Only name and average are mandatory.
     * @param {{[key: string]: any}} customProperties additional data used to filter metrics in the
     * portal. Defaults to empty.
     * @memberof ApplicationInsights
     */
    public trackMetric(metric: IMetricTelemetry, customProperties?: ICustomProperties): void {
        try {
            const telemetryItem = TelemetryItemCreator.create<IMetricTelemetry>(
                metric,
                Metric.dataType,
                Metric.envelopeType,
                this._logger,
                customProperties
            );

            this.core.track(telemetryItem);
        } catch (e) {
            this._logger.throwInternal(LoggingSeverity.CRITICAL,
                _InternalMessageId.TrackMetricFailed,
                "trackMetric failed, metric will not be collected: " + Util.getExceptionName(e),
                { exception: Util.dump(e) });
        }
    }

    /**
     * Logs that a page or other item was viewed.
     * @param IPageViewTelemetry The string you used as the name in startTrackPage. Defaults to the document title.
     * @param customProperties Additional data used to filter events and metrics. Defaults to empty.
     * If a user wants to provide duration for pageLoad, it'll have to be in pageView.properties.duration
     */
    public trackPageView(pageView?: IPageViewTelemetry, customProperties?: ICustomProperties) {
        try {
            const inPv = pageView || {};
            this._pageViewManager.trackPageView(inPv, {...inPv.properties, ...inPv.measurements, ...customProperties});

            if (this.config.autoTrackPageVisitTime) {
                this._pageVisitTimeManager.trackPreviousPageVisit(inPv.name, inPv.uri);
            }
        } catch (e) {
            this._logger.throwInternal(
                LoggingSeverity.CRITICAL,
                _InternalMessageId.TrackPVFailed,
                "trackPageView failed, page view will not be collected: " + Util.getExceptionName(e),
                { exception: Util.dump(e) });
        }
    }

    /**
     * Create a page view telemetry item and send it to the SDK pipeline through the core.track API
     * @param pageView Page view item to be sent
     * @param properties Custom properties (Part C) that a user can add to the telemetry item
     * @param systemProperties System level properties (Part A) that a user can add to the telemetry item
     */
    public sendPageViewInternal(pageView: IPageViewTelemetryInternal, properties?: { [key: string]: any }, systemProperties?: { [key: string]: any }) {
        if (typeof document !== "undefined") {
            pageView.refUri = pageView.refUri === undefined ? document.referrer : pageView.refUri;
        }

        const telemetryItem = TelemetryItemCreator.create<IPageViewTelemetryInternal>(
            pageView,
            PageView.dataType,
            PageView.envelopeType,
            this._logger,
            properties,
            systemProperties);

        this.core.track(telemetryItem);

        // reset ajaxes counter
        this._trackAjaxAttempts = 0;
    }

    /**
     * @ignore INTERNAL ONLY
     * @param pageViewPerformance
     * @param properties
     */
    public sendPageViewPerformanceInternal(pageViewPerformance: IPageViewPerformanceTelemetryInternal, properties?: { [key: string]: any }, systemProperties?: { [key: string]: any }) {
        const telemetryItem = TelemetryItemCreator.create<IPageViewPerformanceTelemetryInternal>(
            pageViewPerformance,
            PageViewPerformance.dataType,
            PageViewPerformance.envelopeType,
            this._logger,
            properties,
            systemProperties);

        this.core.track(telemetryItem);
    }

    /**
     * Send browser performance metrics.
     * @param pageViewPerformance
     * @param customProperties
     */
    public trackPageViewPerformance(pageViewPerformance: IPageViewPerformanceTelemetry, customProperties?: ICustomProperties): void {
        try {
            this._pageViewPerformanceManager.populatePageViewPerformanceEvent(pageViewPerformance);
            this.sendPageViewPerformanceInternal(pageViewPerformance, customProperties);
        } catch (e) {
            this._logger.throwInternal(
                LoggingSeverity.CRITICAL,
                _InternalMessageId.TrackPVFailed,
                "trackPageViewPerformance failed, page view will not be collected: " + Util.getExceptionName(e),
                { exception: Util.dump(e) });
        }
    }

    /**
     * Starts the timer for tracking a page load time. Use this instead of `trackPageView` if you want to control when the page view timer starts and stops,
     * but don't want to calculate the duration yourself. This method doesn't send any telemetry. Call `stopTrackPage` to log the end of the page view
     * and send the event.
     * @param name A string that idenfities this item, unique within this HTML document. Defaults to the document title.
     */
    public startTrackPage(name?: string) {
        try {
            if (typeof name !== "string") {
                name = window.document && window.document.title || "";
            }

            this._pageTracking.start(name);
        } catch (e) {
            this._logger.throwInternal(
                LoggingSeverity.CRITICAL,
                _InternalMessageId.StartTrackFailed,
                "startTrackPage failed, page view may not be collected: " + Util.getExceptionName(e),
                { exception: Util.dump(e) });
        }
    }


    /**
     * Stops the timer that was started by calling `startTrackPage` and sends the pageview load time telemetry with the specified properties and measurements.
     * The duration of the page view will be the time between calling `startTrackPage` and `stopTrackPage`.
     * @param   name  The string you used as the name in startTrackPage. Defaults to the document title.
     * @param   url   String - a relative or absolute URL that identifies the page or other item. Defaults to the window location.
     * @param   properties  map[string, string] - additional data used to filter pages and metrics in the portal. Defaults to empty.
     * @param   measurements    map[string, number] - metrics associated with this page, displayed in Metrics Explorer on the portal. Defaults to empty.
     */
    public stopTrackPage(name?: string, url?: string, properties?: { [key: string]: string }, measurement?: { [key: string]: number }) {
        try {
            if (typeof name !== "string") {
                name = window.document && window.document.title || "";
            }

            if (typeof url !== "string") {
                url = window.location && window.location.href || "";
            }

            this._pageTracking.stop(name, url, properties, measurement);

            if (this.config.autoTrackPageVisitTime) {
                this._pageVisitTimeManager.trackPreviousPageVisit(name, url);
            }
        } catch (e) {
            this._logger.throwInternal(
                LoggingSeverity.CRITICAL,
                _InternalMessageId.StopTrackFailed,
                "stopTrackPage failed, page view will not be collected: " + Util.getExceptionName(e),
                { exception: Util.dump(e) });
        }
    }

   /**
    * @ignore INTERNAL ONLY
    * @param exception
    * @param properties
    * @param systemProperties
    */
    public sendExceptionInternal(exception: IExceptionTelemetry, customProperties?: { [key: string]: any }, systemProperties?: { [key: string]: any }) {
        const exceptionPartB = new Exception(
            this._logger,
            exception.exception || new Error(Util.NotSpecified),
            exception.properties,
            exception.measurements,
            exception.severityLevel,
            exception.id
        ).toInterface();

        const telemetryItem: ITelemetryItem = TelemetryItemCreator.create<IExceptionInternal>(
            exceptionPartB,
            Exception.dataType,
            Exception.envelopeType,
            this._logger,
            customProperties,
            systemProperties
        );
        this.core.track(telemetryItem);
    }

    /**
     * Log an exception you have caught.
     *
     * @param {IExceptionTelemetry} exception   Object which contains exception to be sent
     * @param {{[key: string]: any}} customProperties   Additional data used to filter pages and metrics in the portal. Defaults to empty.
     *
     * Any property of type double will be considered a measurement, and will be treated by Application Insights as a metric.
     * @memberof ApplicationInsights
     */
    public trackException(exception: IExceptionTelemetry, customProperties?: ICustomProperties): void {
        try {
            this.sendExceptionInternal(exception, customProperties);
        } catch (e) {
            this._logger.throwInternal(
                LoggingSeverity.CRITICAL,
                _InternalMessageId.TrackExceptionFailed,
                "trackException failed, exception will not be collected: " + Util.getExceptionName(e),
                { exception: Util.dump(e) });
        }
    }

    /**
     * @description Custom error handler for Application Insights Analytics
     * @param {IAutoExceptionTelemetry} exception
     * @memberof ApplicationInsights
     */
    public _onerror(exception: IAutoExceptionTelemetry): void {
        try {
            const properties = {
                url: (exception && exception.url) || document.URL,
                lineNumber: exception.lineNumber,
                columnNumber: exception.columnNumber,
                message: exception.message
            };

            if (Util.isCrossOriginError(exception.message, exception.url, exception.lineNumber, exception.columnNumber, exception.error)) {
                this._sendCORSException(properties.url);
            } else {
                if (!Util.isError(exception.error)) {
                    const stack = "window.onerror@" + properties.url + ":" + exception.lineNumber + ":" + (exception.columnNumber || 0);
                    exception.error = new Error(exception.message);
                    exception.error.stack = stack;
                }
                this.trackException({ exception: exception.error, severityLevel: SeverityLevel.Error }, properties);
            }
        } catch (e) {
            const errorString = exception.error ?
                (exception.error.name + ", " + exception.error.message)
                : "null";

            this._logger.throwInternal(
                LoggingSeverity.CRITICAL,
                _InternalMessageId.ExceptionWhileLoggingError,
                "_onError threw exception while logging error, error will not be collected: "
                + Util.getExceptionName(e),
                { exception: Util.dump(e), errorString }
            );
        }
    }

    public addTelemetryInitializer(telemetryInitializer: (item: ITelemetryItem) => boolean | void) {
        this._telemetryInitializers.push(telemetryInitializer);
    }

    private _initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[]) {

        if (this._isInitialized) {
            return;
        }

        if (CoreUtils.isNullOrUndefined(core)) {
            throw Error("Error initializing");
        }

        this.core = core;
        this._logger = core.logger;
        this._globalconfig = {
            instrumentationKey: config.instrumentationKey,
            endpointUrl: config.endpointUrl || "https://dc.services.visualstudio.com/v2/track"
        };

        this.config = config.extensionConfig && config.extensionConfig[this.identifier] ? config.extensionConfig[this.identifier] : {} as IConfig;

        // load default values if specified
        const defaults: IConfig = ApplicationInsights.getDefaultConfig();
        if (defaults !== undefined) {
            for (const field in defaults) {
                // for each unspecified field, set the default value
                this.config[field] = ConfigurationManager.getConfig(config, field, this.identifier, defaults[field]);
            }

            if (this._globalconfig) {
                for (const field in defaults) {
                    if (this._globalconfig[field] === undefined) {
                        this._globalconfig[field] = defaults[field];
                    }
                }
            }
        }

        // Todo: move this out of static state
        if (this.config.isCookieUseDisabled) {
            Util.disableCookies();
        }

        // Todo: move this out of static state
        if (this.config.isStorageUseDisabled) {
            Util.disableStorage();
        }

        const configGetters: ITelemetryConfig = {
            instrumentationKey: () => config.instrumentationKey,
            accountId: () => this.config.accountId || config.accountId,
            sessionRenewalMs: () => this.config.sessionRenewalMs || config.sessionRenewalMs,
            sessionExpirationMs: () => this.config.sessionExpirationMs || config.sessionExpirationMs,
            sampleRate: () => this.config.samplingPercentage || config.samplingPercentage,
            cookieDomain: () => this.config.cookieDomain || config.cookieDomain,
            sdkExtension: () => this.config.sdkExtension || config.sdkExtension,
            isBrowserLinkTrackingEnabled: () => this.config.isBrowserLinkTrackingEnabled || config.isBrowserLinkTrackingEnabled,
            appId: () => this.config.appId || config.appId
        }

        this._pageViewPerformanceManager = new PageViewPerformanceManager(this.core);
        this._pageViewManager = new PageViewManager(this, this.config.overridePageViewDuration, this.core, this._pageViewPerformanceManager);
        this._pageVisitTimeManager = new PageVisitTimeManager(this._logger, (pageName, pageUrl, pageVisitTime) => this.trackPageVisitTime(pageName, pageUrl, pageVisitTime))

        this._telemetryInitializers = [];
        this._addDefaultTelemetryInitializers(configGetters);


        this._eventTracking = new Timing(this._logger, "trackEvent");
        this._eventTracking.action =
            (name?: string, url?: string, duration?: number, properties?: { [key: string]: string }) => {
                if (!properties) {
                    properties = {};
                }

                properties[durationProperty] = duration.toString();
                this.trackEvent({ name, properties } as IEventTelemetry);
            }

        // initialize page view timing
        this._pageTracking = new Timing(this._logger, "trackPageView");
        this._pageTracking.action = (name, url, duration, properties, measurements) => {

            // duration must be a custom property in order for the collector to extract it
            if (CoreUtils.isNullOrUndefined(properties)) {
                properties = {};
            }
            properties[durationProperty] = duration.toString();

            const pageViewItem: IPageViewTelemetry = {
                name,
                uri: url,
                properties,
                measurements
            };

            this.sendPageViewInternal(pageViewItem);
        }

        const instance: IAppInsights = this;
        if (this.config.disableExceptionTracking === false &&
            !this.config.autoExceptionInstrumented) {
            // We want to enable exception auto collection and it has not been done so yet
            const onerror = "onerror";
            const originalOnError = window[onerror];
            window.onerror = (message, url, lineNumber, columnNumber, error) => {
                const handled = originalOnError && (originalOnError(message, url, lineNumber, columnNumber, error) as any);
                if (handled !== true) { // handled could be typeof function
                    instance._onerror({
                        message,
                        url,
                        lineNumber,
                        columnNumber,
                        error
                    });
                }

                return handled;
            }
            this.config.autoExceptionInstrumented = true;
        }

        /**
         * Create a custom "locationchange" event which is triggered each time the history object is changed
         */
        if (this.config.enableAutoRouteTracking === true
            && typeof history === "object" && typeof history.pushState === "function" && typeof history.replaceState === "function"
            && typeof window === "object"
            && typeof Event !== "undefined") {
            const _self = this;
            // Find the properties plugin
            extensions.forEach(extension => {
                if (extension.identifier === PropertiesPluginIdentifier) {
                    this._properties = extension as properties.PropertiesPlugin;
                }
            });

            history.pushState = ( f => function pushState() {
                const ret = f.apply(this, arguments);
                window.dispatchEvent(Util.createDomEvent(_self.config.namePrefix + "pushState"));
                window.dispatchEvent(Util.createDomEvent(_self.config.namePrefix + "locationchange"));
                return ret;
            })(history.pushState);

            history.replaceState = ( f => function replaceState(){
                const ret = f.apply(this, arguments);
                window.dispatchEvent(Util.createDomEvent(_self.config.namePrefix + "replaceState"));
                window.dispatchEvent(Util.createDomEvent(_self.config.namePrefix + "locationchange"));
                return ret;
            })(history.replaceState);

            window.addEventListener(_self.config.namePrefix + "popstate",()=>{
                window.dispatchEvent(Util.createDomEvent(_self.config.namePrefix + "locationchange"));
            });

            window.addEventListener(_self.config.namePrefix + "locationchange", () => {
                if (_self._properties && _self._properties.context && _self._properties.context.telemetryTrace) {
                    _self._properties.context.telemetryTrace.traceID = Util.generateW3CId();
                    _self._properties.context.telemetryTrace.name = window.location && window.location.pathname || "_unknown_";
                }
                if (this._currUri) {
                    this._prevUri = this._currUri;
                    this._currUri = window.location && window.location.href || "";
                } else {
                    this._currUri = window.location && window.location.href || "";
                }
                setTimeout(((uri: string) => {
                    // todo: override start time so that it is not affected by autoRoutePVDelay
                    _self.trackPageView({ refUri: uri, properties: { duration: 0 } }); // SPA route change loading durations are undefined, so send 0
                }).bind(this, this._prevUri), _self.autoRoutePVDelay);
            });
        }

        this._isInitialized = true;
    }

    /**
     * Log a page visit time
     * @param    pageName    Name of page
     * @param    pageVisitDuration Duration of visit to the page in milleseconds
     */
    private trackPageVisitTime(pageName: string, pageUrl: string, pageVisitTime: number) {
        const properties = { PageName: pageName, PageUrl: pageUrl };
        this.trackMetric({
            name: "PageVisitTime",
            average: pageVisitTime,
            max: pageVisitTime,
            min: pageVisitTime,
            sampleCount: 1
        }, properties);
    }

    private _addDefaultTelemetryInitializers(configGetters: ITelemetryConfig) {
        if (!configGetters.isBrowserLinkTrackingEnabled()) {
            const browserLinkPaths = ['/browserLinkSignalR/', '/__browserLink/'];
            const dropBrowserLinkRequests = (envelope: ITelemetryItem) => {
                if (envelope.baseType === RemoteDependencyData.dataType) {
                    const remoteData = envelope.baseData as IDependencyTelemetry;
                    if (remoteData) {
                        for (let i = 0; i < browserLinkPaths.length; i++) {
                            if (remoteData.target && remoteData.target.indexOf(browserLinkPaths[i]) >= 0) {
                                return false;
                            }
                        }
                    }
                }

                return true;
            }

            this._addTelemetryInitializer(dropBrowserLinkRequests)
        }
    }

    private _addTelemetryInitializer(telemetryInitializer: (envelope: ITelemetryItem) => boolean | void) {
        this._telemetryInitializers.push(telemetryInitializer);
    }

    private _sendCORSException(url: string) {
        const exception: IAutoExceptionTelemetry = {
            message: "Script error: The browser's same-origin policy prevents us from getting the details of this exception. Consider using the 'crossorigin' attribute.",
            url,
            lineNumber: 0,
            columnNumber: 0,
            error: undefined
        };
        const telemetryItem: ITelemetryItem = TelemetryItemCreator.create<IAutoExceptionTelemetry>(
            exception,
            Exception.dataType,
            Exception.envelopeType,
            this._logger,
            { url }
        );

        this.core.track(telemetryItem);
    }
}

/**
 * Used to record timed events and page views.
 */
class Timing {

    public action: (name?: string, url?: string, duration?: number, properties?: { [key: string]: string }, measurements?: { [key: string]: number }) => void;
    private _name;
    private _events: {
        [key: string]: number;
    };
    private _logger: IDiagnosticLogger;

    constructor(logger: IDiagnosticLogger, name: string) {
        this._name = name;
        this._events = {};
        this._logger = logger;
    }

    public start(name: string) {
        if (typeof this._events[name] !== "undefined") {
            this._logger.throwInternal(
                LoggingSeverity.WARNING, _InternalMessageId.StartCalledMoreThanOnce, "start was called more than once for this event without calling stop.",
                { name: this._name, key: name }, true);
        }

        this._events[name] = +new Date;
    }

    public stop(name: string, url: string, properties?: { [key: string]: string }, measurements?: { [key: string]: number }) {
        const start = this._events[name];
        if (isNaN(start)) {
            this._logger.throwInternal(
                LoggingSeverity.WARNING, _InternalMessageId.StopCalledWithoutStart, "stop was called without a corresponding start.",
                { name: this._name, key: name }, true);
        } else {
            const end = +new Date;
            const duration = DateTimeUtils.GetDuration(start, end);
            this.action(name, url, duration, properties, measurements);
        }

        delete this._events[name];
        this._events[name] = undefined;
    }
}
