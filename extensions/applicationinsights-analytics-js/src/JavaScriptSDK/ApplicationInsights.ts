/**
 * ApplicationInsights.ts
 * @copyright Microsoft 2018
 */

import {
    IConfig, PageViewPerformance, IAppInsights, PageView, RemoteDependencyData, Event as EventTelemetry, IEventTelemetry,
    TelemetryItemCreator, Metric, Exception, SeverityLevel, Trace, IDependencyTelemetry,
    IExceptionTelemetry, ITraceTelemetry, IMetricTelemetry, IAutoExceptionTelemetry,
    IPageViewTelemetryInternal, IPageViewTelemetry, IPageViewPerformanceTelemetry, IPageViewPerformanceTelemetryInternal,
    dateTimeUtilsDuration, IExceptionInternal, PropertiesPluginIdentifier, AnalyticsPluginIdentifier, stringToBoolOrDefault, createDomEvent,
    strNotSpecified, isCrossOriginError, utlDisableStorage, dataSanitizeString
} from "@microsoft/applicationinsights-common";

import {
    IPlugin, IConfiguration, IAppInsightsCore,
    BaseTelemetryPlugin, ITelemetryItem, IProcessTelemetryContext, ITelemetryPluginChain,
    IDiagnosticLogger, LoggingSeverity, _InternalMessageId, ICustomProperties,
    getWindow, getDocument, getHistory, getLocation, doPerf, objForEachKey,
    isString, isFunction, isNullOrUndefined, arrForEach, generateW3CId, dumpObj, getExceptionName, isError, ICookieMgr, safeGetCookieMgr
} from "@microsoft/applicationinsights-core-js";
import { PageViewManager, IAppInsightsInternal } from "./Telemetry/PageViewManager";
import { PageVisitTimeManager } from "./Telemetry/PageVisitTimeManager";
import { PageViewPerformanceManager } from "./Telemetry/PageViewPerformanceManager";
import { ITelemetryConfig } from "../JavaScriptSDK.Interfaces/ITelemetryConfig";
import dynamicProto from "@microsoft/dynamicproto-js";

// For types only
import { PropertiesPlugin } from "@microsoft/applicationinsights-properties-js";

"use strict";

const durationProperty: string = "duration";
const strEvent = "event";

function _dispatchEvent(target:EventTarget, evnt: Event) {
    if (target && target.dispatchEvent && evnt) {
        target.dispatchEvent(evnt);
    }
}

function _getReason(error: any) {
    if (error && error.reason) {
        const reason = error.reason;
        if (!isString(reason) && isFunction(reason.toString)) {
            return reason.toString();
        }

        return dumpObj(reason);
    }

    // Pass the original object down which will eventually get evaluated for any message or description
    return error || "";
}

export class ApplicationInsights extends BaseTelemetryPlugin implements IAppInsights, IAppInsightsInternal {
    public static Version = "2.7.2"; // Not currently used anywhere

    public static getDefaultConfig(config?: IConfig): IConfig {
        if (!config) {
            config = {};
        }

        // set default values
        config.sessionRenewalMs = 30 * 60 * 1000;
        config.sessionExpirationMs = 24 * 60 * 60 * 1000;
        config.disableExceptionTracking = stringToBoolOrDefault(config.disableExceptionTracking);
        config.autoTrackPageVisitTime = stringToBoolOrDefault(config.autoTrackPageVisitTime);
        config.overridePageViewDuration = stringToBoolOrDefault(config.overridePageViewDuration);
        config.enableUnhandledPromiseRejectionTracking = stringToBoolOrDefault(config.enableUnhandledPromiseRejectionTracking);
    
        if (isNaN(config.samplingPercentage) || config.samplingPercentage <= 0 || config.samplingPercentage >= 100) {
            config.samplingPercentage = 100;
        }

        config.isStorageUseDisabled = stringToBoolOrDefault(config.isStorageUseDisabled);
        config.isBrowserLinkTrackingEnabled = stringToBoolOrDefault(config.isBrowserLinkTrackingEnabled);
        config.enableAutoRouteTracking = stringToBoolOrDefault(config.enableAutoRouteTracking);
        config.namePrefix = config.namePrefix || "";

        config.enableDebug = stringToBoolOrDefault(config.enableDebug);
        config.disableFlushOnBeforeUnload = stringToBoolOrDefault(config.disableFlushOnBeforeUnload);
        config.disableFlushOnUnload = stringToBoolOrDefault(config.disableFlushOnUnload, config.disableFlushOnBeforeUnload);

        return config;
    }

    public identifier: string = AnalyticsPluginIdentifier; // do not change name or priority
    public priority: number = 180; // take from reserved priority range 100- 200
    public config: IConfig;
    public queue: Array<() => void>;
    public autoRoutePVDelay = 500; // ms; Time to wait after a route change before triggering a pageview to allow DOM changes to take place

    protected _telemetryInitializers: Array<(envelope: ITelemetryItem) => boolean | void>; // Internal telemetry initializers.
    protected _pageViewManager: PageViewManager;
    protected _pageViewPerformanceManager: PageViewPerformanceManager;
    protected _pageVisitTimeManager: PageVisitTimeManager;

    constructor() {
        super();
        let _eventTracking: Timing;
        let _pageTracking: Timing;
        let _properties: PropertiesPlugin;
    
        // Counts number of trackAjax invocations.
        // By default we only monitor X ajax call per view to avoid too much load.
        // Default value is set in config.
        // This counter keeps increasing even after the limit is reached.
        let _trackAjaxAttempts: number = 0;
    
        // array with max length of 2 that store current url and previous url for SPA page route change trackPageview use.
        let _prevUri: string; // Assigned in the constructor
        let _currUri: string;
    

        dynamicProto(ApplicationInsights, this, (_self, _base) => {
            let location = getLocation(true);
            _prevUri = location && location.href || "";

            _self.getCookieMgr = () => {
                return safeGetCookieMgr(_self.core);
            };

            _self.processTelemetry = (env: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => {
                doPerf(_self.core, () => _self.identifier + ":processTelemetry", () => {
                    let doNotSendItem = false;
                    const telemetryInitializersCount = _self._telemetryInitializers.length;
                    itemCtx = _self._getTelCtx(itemCtx);
                    for (let i = 0; i < telemetryInitializersCount; ++i) {
                        const telemetryInitializer = _self._telemetryInitializers[i];
                        if (telemetryInitializer) {
                            try {
                                if (telemetryInitializer.apply(null, [env]) === false) {
                                    doNotSendItem = true;
                                    break;
                                }
                            } catch (e) {
                                // log error but dont stop executing rest of the telemetry initializers
                                // doNotSendItem = true;
                                itemCtx.diagLog().throwInternal(
                                    LoggingSeverity.CRITICAL, _InternalMessageId.TelemetryInitializerFailed, "One of telemetry initializers failed, telemetry item will not be sent: " + getExceptionName(e),
                                    { exception: dumpObj(e) }, true);
                            }
                        }
                    }
            
                    if (!doNotSendItem) {
                        _self.processNext(env, itemCtx);
                    }
                }, () => ({ item: env }), !((env as any).sync));
            };
        
            _self.trackEvent = (event: IEventTelemetry, customProperties?: ICustomProperties): void => {
                try {
                    const telemetryItem = TelemetryItemCreator.create<IEventTelemetry>(
                        event,
                        EventTelemetry.dataType,
                        EventTelemetry.envelopeType,
                        _self.diagLog(),
                        customProperties
                    );

                    _self.core.track(telemetryItem);
                } catch (e) {
                    _self.diagLog().throwInternal(LoggingSeverity.WARNING,
                        _InternalMessageId.TrackTraceFailed,
                        "trackTrace failed, trace will not be collected: " + getExceptionName(e),
                        { exception: dumpObj(e) });
                }
            };

            /**
             * Start timing an extended event. Call `stopTrackEvent` to log the event when it ends.
             * @param   name    A string that identifies this event uniquely within the document.
             */
            _self.startTrackEvent = (name: string) => {
                try {
                    _eventTracking.start(name);
                } catch (e) {
                    _self.diagLog().throwInternal(LoggingSeverity.CRITICAL,
                        _InternalMessageId.StartTrackEventFailed,
                        "startTrackEvent failed, event will not be collected: " + getExceptionName(e),
                        { exception: dumpObj(e) });
                }
            };

            /**
             * Log an extended event that you started timing with `startTrackEvent`.
             * @param   name    The string you used to identify this event in `startTrackEvent`.
             * @param   properties  map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
             * @param   measurements    map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
             */
            _self.stopTrackEvent = (name: string, properties?: { [key: string]: string }, measurements?: { [key: string]: number }) => {
                try {
                    _eventTracking.stop(name, undefined, properties); // Todo: Fix to pass measurements once type is updated
                } catch (e) {
                    _self.diagLog().throwInternal(LoggingSeverity.CRITICAL,
                        _InternalMessageId.StopTrackEventFailed,
                        "stopTrackEvent failed, event will not be collected: " + getExceptionName(e),
                        { exception: dumpObj(e) });
                }
            };

            /**
             * @description Log a diagnostic message
             * @param {ITraceTelemetry} trace
             * @param ICustomProperties.
             * @memberof ApplicationInsights
             */
            _self.trackTrace = (trace: ITraceTelemetry, customProperties?: ICustomProperties): void => {
                try {
                    const telemetryItem = TelemetryItemCreator.create<ITraceTelemetry>(
                        trace,
                        Trace.dataType,
                        Trace.envelopeType,
                        _self.diagLog(),
                        customProperties);
        
                    _self.core.track(telemetryItem);
                } catch (e) {
                    _self.diagLog().throwInternal(LoggingSeverity.WARNING,
                        _InternalMessageId.TrackTraceFailed,
                        "trackTrace failed, trace will not be collected: " + getExceptionName(e),
                        { exception: dumpObj(e) });
                }
            };

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
            _self.trackMetric = (metric: IMetricTelemetry, customProperties?: ICustomProperties): void => {
                try {
                    const telemetryItem = TelemetryItemCreator.create<IMetricTelemetry>(
                        metric,
                        Metric.dataType,
                        Metric.envelopeType,
                        _self.diagLog(),
                        customProperties
                    );
        
                    _self.core.track(telemetryItem);
                } catch (e) {
                    _self.diagLog().throwInternal(LoggingSeverity.CRITICAL,
                        _InternalMessageId.TrackMetricFailed,
                        "trackMetric failed, metric will not be collected: " + getExceptionName(e),
                        { exception: dumpObj(e) });
                }
            };

            /**
             * Logs that a page or other item was viewed.
             * @param IPageViewTelemetry The string you used as the name in startTrackPage. Defaults to the document title.
             * @param customProperties Additional data used to filter events and metrics. Defaults to empty.
             * If a user wants to provide duration for pageLoad, it'll have to be in pageView.properties.duration
             */
            _self.trackPageView = (pageView?: IPageViewTelemetry, customProperties?: ICustomProperties) => {
                try {
                    const inPv = pageView || {};
                    _self._pageViewManager.trackPageView(inPv, {...inPv.properties, ...inPv.measurements, ...customProperties});
        
                    if (_self.config.autoTrackPageVisitTime) {
                        _self._pageVisitTimeManager.trackPreviousPageVisit(inPv.name, inPv.uri);
                    }
                } catch (e) {
                    _self.diagLog().throwInternal(
                        LoggingSeverity.CRITICAL,
                        _InternalMessageId.TrackPVFailed,
                        "trackPageView failed, page view will not be collected: " + getExceptionName(e),
                        { exception: dumpObj(e) });
                }
            };

            /**
             * Create a page view telemetry item and send it to the SDK pipeline through the core.track API
             * @param pageView Page view item to be sent
             * @param properties Custom properties (Part C) that a user can add to the telemetry item
             * @param systemProperties System level properties (Part A) that a user can add to the telemetry item
             */
            _self.sendPageViewInternal = (pageView: IPageViewTelemetryInternal, properties?: { [key: string]: any }, systemProperties?: { [key: string]: any }) => {
                let doc = getDocument();
                if (doc) {
                    pageView.refUri = pageView.refUri === undefined ? doc.referrer : pageView.refUri;
                }
        
                const telemetryItem = TelemetryItemCreator.create<IPageViewTelemetryInternal>(
                    pageView,
                    PageView.dataType,
                    PageView.envelopeType,
                    _self.diagLog(),
                    properties,
                    systemProperties);
        
                _self.core.track(telemetryItem);
        
                // reset ajaxes counter
                _trackAjaxAttempts = 0;
            };

            /**
             * @ignore INTERNAL ONLY
             * @param pageViewPerformance
             * @param properties
             */
            _self.sendPageViewPerformanceInternal = (pageViewPerformance: IPageViewPerformanceTelemetryInternal, properties?: { [key: string]: any }, systemProperties?: { [key: string]: any }) => {
                const telemetryItem = TelemetryItemCreator.create<IPageViewPerformanceTelemetryInternal>(
                    pageViewPerformance,
                    PageViewPerformance.dataType,
                    PageViewPerformance.envelopeType,
                    _self.diagLog(),
                    properties,
                    systemProperties);
        
                _self.core.track(telemetryItem);
            };

            /**
             * Send browser performance metrics.
             * @param pageViewPerformance
             * @param customProperties
             */
            _self.trackPageViewPerformance = (pageViewPerformance: IPageViewPerformanceTelemetry, customProperties?: ICustomProperties): void => {
                try {
                    _self._pageViewPerformanceManager.populatePageViewPerformanceEvent(pageViewPerformance);
                    _self.sendPageViewPerformanceInternal(pageViewPerformance, customProperties);
                } catch (e) {
                    _self.diagLog().throwInternal(
                        LoggingSeverity.CRITICAL,
                        _InternalMessageId.TrackPVFailed,
                        "trackPageViewPerformance failed, page view will not be collected: " + getExceptionName(e),
                        { exception: dumpObj(e) });
                }
            };

            /**
             * Starts the timer for tracking a page load time. Use this instead of `trackPageView` if you want to control when the page view timer starts and stops,
             * but don't want to calculate the duration yourself. This method doesn't send any telemetry. Call `stopTrackPage` to log the end of the page view
             * and send the event.
             * @param name A string that idenfities this item, unique within this HTML document. Defaults to the document title.
             */
            _self.startTrackPage = (name?: string) => {
                try {
                    if (typeof name !== "string") {
                        let doc = getDocument();
                        name = doc && doc.title || "";
                    }
        
                    _pageTracking.start(name);
                } catch (e) {
                    _self.diagLog().throwInternal(
                        LoggingSeverity.CRITICAL,
                        _InternalMessageId.StartTrackFailed,
                        "startTrackPage failed, page view may not be collected: " + getExceptionName(e),
                        { exception: dumpObj(e) });
                }
            };

            /**
             * Stops the timer that was started by calling `startTrackPage` and sends the pageview load time telemetry with the specified properties and measurements.
             * The duration of the page view will be the time between calling `startTrackPage` and `stopTrackPage`.
             * @param   name  The string you used as the name in startTrackPage. Defaults to the document title.
             * @param   url   String - a relative or absolute URL that identifies the page or other item. Defaults to the window location.
             * @param   properties  map[string, string] - additional data used to filter pages and metrics in the portal. Defaults to empty.
             * @param   measurements    map[string, number] - metrics associated with this page, displayed in Metrics Explorer on the portal. Defaults to empty.
             */
            _self.stopTrackPage = (name?: string, url?: string, properties?: { [key: string]: string }, measurement?: { [key: string]: number }) => {
                try {
                    if (typeof name !== "string") {
                        let doc = getDocument();
                        name = doc && doc.title || "";
                    }
        
                    if (typeof url !== "string") {
                        let loc = getLocation();
                        url = loc && loc.href || "";
                    }
        
                    _pageTracking.stop(name, url, properties, measurement);
        
                    if (_self.config.autoTrackPageVisitTime) {
                        _self._pageVisitTimeManager.trackPreviousPageVisit(name, url);
                    }
                } catch (e) {
                    _self.diagLog().throwInternal(
                        LoggingSeverity.CRITICAL,
                        _InternalMessageId.StopTrackFailed,
                        "stopTrackPage failed, page view will not be collected: " + getExceptionName(e),
                        { exception: dumpObj(e) });
                }
            };

           /**
            * @ignore INTERNAL ONLY
            * @param exception
            * @param properties
            * @param systemProperties
            */
            _self.sendExceptionInternal = (exception: IExceptionTelemetry, customProperties?: { [key: string]: any }, systemProperties?: { [key: string]: any }) => {
                const theError = exception.exception || exception.error || new Error(strNotSpecified);
                const exceptionPartB = new Exception(
                    _self.diagLog(),
                    theError,
                    exception.properties || customProperties,
                    exception.measurements,
                    exception.severityLevel,
                    exception.id
                ).toInterface();
        
                const telemetryItem: ITelemetryItem = TelemetryItemCreator.create<IExceptionInternal>(
                    exceptionPartB,
                    Exception.dataType,
                    Exception.envelopeType,
                    _self.diagLog(),
                    customProperties,
                    systemProperties
                );
                _self.core.track(telemetryItem);
            };

            /**
             * Log an exception you have caught.
             *
             * @param {IExceptionTelemetry} exception   Object which contains exception to be sent
             * @param {{[key: string]: any}} customProperties   Additional data used to filter pages and metrics in the portal. Defaults to empty.
             *
             * Any property of type double will be considered a measurement, and will be treated by Application Insights as a metric.
             * @memberof ApplicationInsights
             */
            _self.trackException = (exception: IExceptionTelemetry, customProperties?: ICustomProperties): void => {
                try {
                    _self.sendExceptionInternal(exception, customProperties);
                } catch (e) {
                    _self.diagLog().throwInternal(
                        LoggingSeverity.CRITICAL,
                        _InternalMessageId.TrackExceptionFailed,
                        "trackException failed, exception will not be collected: " + getExceptionName(e),
                        { exception: dumpObj(e) });
                }
            };

            /**
             * @description Custom error handler for Application Insights Analytics
             * @param {IAutoExceptionTelemetry} exception
             * @memberof ApplicationInsights
             */
            _self._onerror = (exception: IAutoExceptionTelemetry): void => {
                let error = exception && exception.error;
                let evt = exception && exception.evt;

                try {
                    if (!evt) {
                        let _window = getWindow();
                        if (_window) {
                            evt = _window[strEvent];
                        }
                    }
                    const url = (exception && exception.url) || (getDocument() || {} as any).URL;
                    // If no error source is provided assume the default window.onerror handler
                    const errorSrc = exception.errorSrc || "window.onerror@" + url + ":" + (exception.lineNumber || 0) + ":" + (exception.columnNumber || 0);
                    const properties = {
                        errorSrc,
                        url,
                        lineNumber: exception.lineNumber || 0,
                        columnNumber: exception.columnNumber || 0,
                        message: exception.message
                    };
    
                    if (isCrossOriginError(exception.message, exception.url, exception.lineNumber, exception.columnNumber, exception.error)) {
                        _sendCORSException(Exception.CreateAutoException(
                            "Script error: The browser's same-origin policy prevents us from getting the details of this exception. Consider using the 'crossorigin' attribute.",
                            url,
                            exception.lineNumber || 0,
                            exception.columnNumber || 0,
                            error,
                            evt,
                            null,
                            errorSrc
                        ), properties);
                    } else {
                        if (!exception.errorSrc) {
                            exception.errorSrc = errorSrc;
                        }
                        _self.trackException({ exception, severityLevel: SeverityLevel.Error }, properties);
                    }
                } catch (e) {
                    const errorString = error ? (error.name + ", " + error.message) : "null";
        
                    _self.diagLog().throwInternal(
                        LoggingSeverity.CRITICAL,
                        _InternalMessageId.ExceptionWhileLoggingError,
                        "_onError threw exception while logging error, error will not be collected: "
                        + getExceptionName(e),
                        { exception: dumpObj(e), errorString }
                    );
                }
            };

            _self.addTelemetryInitializer = (telemetryInitializer: (item: ITelemetryItem) => boolean | void) => {
                _self._telemetryInitializers.push(telemetryInitializer);
            };

            _self.initialize = (config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain) => {
                if (_self.isInitialized()) {
                    return;
                }

                if (isNullOrUndefined(core)) {
                    throw Error("Error initializing");
                }

                _base.initialize(config, core, extensions, pluginChain);
                _self.setInitialized(false); // resetting the initialized state, just in case the following fails
                let ctx = _self._getTelCtx();
                let identifier = _self.identifier;

                _self.config = ctx.getExtCfg<IConfig>(identifier);

                // load default values if specified
                const defaults: IConfig = ApplicationInsights.getDefaultConfig(config);
                if (defaults !== undefined) {
                    objForEachKey(defaults, (field, value) => {
                        // for each unspecified field, set the default value
                        _self.config[field] = ctx.getConfig(identifier, field, value);
                        if (_self.config[field] === undefined) {
                            _self.config[field] = value;
                        }
                    });
                }

                // Todo: move this out of static state
                if (_self.config.isStorageUseDisabled) {
                    utlDisableStorage();
                }

                const configGetters: ITelemetryConfig = {
                    instrumentationKey: () => config.instrumentationKey,
                    accountId: () => _self.config.accountId || config.accountId,
                    sessionRenewalMs: () => _self.config.sessionRenewalMs || config.sessionRenewalMs,
                    sessionExpirationMs: () => _self.config.sessionExpirationMs || config.sessionExpirationMs,
                    sampleRate: () => _self.config.samplingPercentage || config.samplingPercentage,
                    sdkExtension: () => _self.config.sdkExtension || config.sdkExtension,
                    isBrowserLinkTrackingEnabled: () => _self.config.isBrowserLinkTrackingEnabled || config.isBrowserLinkTrackingEnabled,
                    appId: () => _self.config.appId || config.appId
                }

                _self._pageViewPerformanceManager = new PageViewPerformanceManager(_self.core);
                _self._pageViewManager = new PageViewManager(this, _self.config.overridePageViewDuration, _self.core, _self._pageViewPerformanceManager);
                _self._pageVisitTimeManager = new PageVisitTimeManager(_self.diagLog(), (pageName, pageUrl, pageVisitTime) => trackPageVisitTime(pageName, pageUrl, pageVisitTime))
        
                _self._telemetryInitializers = _self._telemetryInitializers || [];
                _addDefaultTelemetryInitializers(configGetters);

                _eventTracking = new Timing(_self.diagLog(), "trackEvent");
                _eventTracking.action =
                    (name?: string, url?: string, duration?: number, properties?: { [key: string]: string }) => {
                        if (!properties) {
                            properties = {};
                        }

                        properties[durationProperty] = duration.toString();
                        _self.trackEvent({ name, properties } as IEventTelemetry);
                    }

                // initialize page view timing
                _pageTracking = new Timing(_self.diagLog(), "trackPageView");
                _pageTracking.action = (name, url, duration, properties, measurements) => {

                    // duration must be a custom property in order for the collector to extract it
                    if (isNullOrUndefined(properties)) {
                        properties = {};
                    }
                    properties[durationProperty] = duration.toString();

                    const pageViewItem: IPageViewTelemetry = {
                        name,
                        uri: url,
                        properties,
                        measurements
                    };

                    _self.sendPageViewInternal(pageViewItem, properties);
                }

                let _window = getWindow();
                let _history = getHistory();
                let _location = getLocation(true);

                const instance: IAppInsights = this;
                if (_self.config.disableExceptionTracking === false &&
                    !_self.config.autoExceptionInstrumented && _window) {
                    // We want to enable exception auto collection and it has not been done so yet
                    const onerror = "onerror";
                    const originalOnError = _window[onerror];
                    _window.onerror = (message, url, lineNumber, columnNumber, error) => {
                        const evt = _window[strEvent];
                        const handled = originalOnError && (originalOnError(message, url, lineNumber, columnNumber, error) as any);
                        if (handled !== true) { // handled could be typeof function
                            instance._onerror(Exception.CreateAutoException(
                                message,
                                url,
                                lineNumber,
                                columnNumber,
                                error,
                                evt
                            ));
                        }

                        return handled;
                    }
                    _self.config.autoExceptionInstrumented = true;
                }

                if (_self.config.disableExceptionTracking === false &&
                    _self.config.enableUnhandledPromiseRejectionTracking === true &&
                    !_self.config.autoUnhandledPromiseInstrumented && _window) {
                    // We want to enable exception auto collection and it has not been done so yet
                    const onunhandledrejection = "onunhandledrejection";
                    const originalOnUnhandledRejection = _window[onunhandledrejection];
                    _window[onunhandledrejection] = (error: PromiseRejectionEvent) => {
                        const evt = _window[strEvent];
                        const handled = originalOnUnhandledRejection && (originalOnUnhandledRejection.call(_window, error) as any);
                        if (handled !== true) { // handled could be typeof function
                            instance._onerror(Exception.CreateAutoException(
                                _getReason(error),
                                _location ? _location.href : "",
                                0,
                                0,
                                error,
                                evt
                            ));
                        }

                        return handled;
                    }
                    _self.config.autoUnhandledPromiseInstrumented = true;
                }

                /**
                 * Create a custom "locationchange" event which is triggered each time the history object is changed
                 */
                if (_self.config.enableAutoRouteTracking === true
                    && _history && isFunction(_history.pushState) && isFunction(_history.replaceState)
                    && _window
                    && typeof Event !== "undefined") {
                    const _self = this;
                    // Find the properties plugin
                    arrForEach(extensions, extension => {
                        if (extension.identifier === PropertiesPluginIdentifier) {
                            _properties = extension as PropertiesPlugin;
                        }
                    });

                    _history.pushState = ( f => function pushState() {
                        const ret = f.apply(this, arguments);
                        _dispatchEvent(_window, createDomEvent(_self.config.namePrefix + "pushState"));
                        _dispatchEvent(_window, createDomEvent(_self.config.namePrefix + "locationchange"));
                        return ret;
                    })(_history.pushState);

                    _history.replaceState = ( f => function replaceState(){
                        const ret = f.apply(this, arguments);
                        _dispatchEvent(_window, createDomEvent(_self.config.namePrefix + "replaceState"));
                        _dispatchEvent(_window, createDomEvent(_self.config.namePrefix + "locationchange"));
                        return ret;
                    })(_history.replaceState);

                    if (_window.addEventListener) {
                        _window.addEventListener(_self.config.namePrefix + "popstate",()=>{
                            _dispatchEvent(_window, createDomEvent(_self.config.namePrefix + "locationchange"));
                        });

                        _window.addEventListener(_self.config.namePrefix + "locationchange", () => {
                            if (_properties && _properties.context && _properties.context.telemetryTrace) {
                                _properties.context.telemetryTrace.traceID = generateW3CId();
                                let traceLocationName = "_unknown_";
                                if (_location && _location.pathname) {
                                    traceLocationName = _location.pathname + (_location.hash || "");
                                }

                                // This populates the ai.operation.name which has a maximum size of 1024 so we need to sanitize it
                                _properties.context.telemetryTrace.name = dataSanitizeString(_self.diagLog(), traceLocationName);
                            }
                            if (_currUri) {
                                _prevUri = _currUri;
                                _currUri = _location && _location.href || "";
                            } else {
                                _currUri = _location && _location.href || "";
                            }
                            setTimeout(((uri: string) => {
                                // todo: override start time so that it is not affected by autoRoutePVDelay
                                _self.trackPageView({ refUri: uri, properties: { duration: 0 } }); // SPA route change loading durations are undefined, so send 0
                            }).bind(this, _prevUri), _self.autoRoutePVDelay);
                        });
                    }
                }

                _self.setInitialized(true);
            };

            /**
             * Log a page visit time
             * @param    pageName    Name of page
             * @param    pageVisitDuration Duration of visit to the page in milleseconds
             */
            function trackPageVisitTime(pageName: string, pageUrl: string, pageVisitTime: number) {
                const properties = { PageName: pageName, PageUrl: pageUrl };
                _self.trackMetric({
                    name: "PageVisitTime",
                    average: pageVisitTime,
                    max: pageVisitTime,
                    min: pageVisitTime,
                    sampleCount: 1
                }, properties);
            }

            function _addDefaultTelemetryInitializers(configGetters: ITelemetryConfig) {
                if (!configGetters.isBrowserLinkTrackingEnabled()) {
                    const browserLinkPaths = ["/browserLinkSignalR/", "/__browserLink/"];
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

                    _addTelemetryInitializer(dropBrowserLinkRequests)
                }
            }

            function _addTelemetryInitializer(telemetryInitializer: (envelope: ITelemetryItem) => boolean | void) {
                _self._telemetryInitializers.push(telemetryInitializer);
            }

            function _sendCORSException(exception: IAutoExceptionTelemetry, properties?: ICustomProperties) {
                const telemetryItem: ITelemetryItem = TelemetryItemCreator.create<IAutoExceptionTelemetry>(
                    exception,
                    Exception.dataType,
                    Exception.envelopeType,
                    _self.diagLog(),
                    properties
                );

                _self.core.track(telemetryItem);
            }
        });
    }

    /**
     * Get the current cookie manager for this instance
     */
    public getCookieMgr(): ICookieMgr {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }
    
    public processTelemetry(env: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public trackEvent(event: IEventTelemetry, customProperties?: ICustomProperties): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Start timing an extended event. Call `stopTrackEvent` to log the event when it ends.
     * @param   name    A string that identifies this event uniquely within the document.
     */
    public startTrackEvent(name: string) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Log an extended event that you started timing with `startTrackEvent`.
     * @param   name    The string you used to identify this event in `startTrackEvent`.
     * @param   properties  map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
     * @param   measurements    map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
     */
    public stopTrackEvent(name: string, properties?: { [key: string]: string }, measurements?: { [key: string]: number }) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * @description Log a diagnostic message
     * @param {ITraceTelemetry} trace
     * @param ICustomProperties.
     * @memberof ApplicationInsights
     */
    public trackTrace(trace: ITraceTelemetry, customProperties?: ICustomProperties): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
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
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Logs that a page or other item was viewed.
     * @param IPageViewTelemetry The string you used as the name in startTrackPage. Defaults to the document title.
     * @param customProperties Additional data used to filter events and metrics. Defaults to empty.
     * If a user wants to provide duration for pageLoad, it'll have to be in pageView.properties.duration
     */
    public trackPageView(pageView?: IPageViewTelemetry, customProperties?: ICustomProperties) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Create a page view telemetry item and send it to the SDK pipeline through the core.track API
     * @param pageView Page view item to be sent
     * @param properties Custom properties (Part C) that a user can add to the telemetry item
     * @param systemProperties System level properties (Part A) that a user can add to the telemetry item
     */
    public sendPageViewInternal(pageView: IPageViewTelemetryInternal, properties?: { [key: string]: any }, systemProperties?: { [key: string]: any }) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * @ignore INTERNAL ONLY
     * @param pageViewPerformance
     * @param properties
     */
    public sendPageViewPerformanceInternal(pageViewPerformance: IPageViewPerformanceTelemetryInternal, properties?: { [key: string]: any }, systemProperties?: { [key: string]: any }) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Send browser performance metrics.
     * @param pageViewPerformance
     * @param customProperties
     */
    public trackPageViewPerformance(pageViewPerformance: IPageViewPerformanceTelemetry, customProperties?: ICustomProperties): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Starts the timer for tracking a page load time. Use this instead of `trackPageView` if you want to control when the page view timer starts and stops,
     * but don't want to calculate the duration yourself. This method doesn't send any telemetry. Call `stopTrackPage` to log the end of the page view
     * and send the event.
     * @param name A string that idenfities this item, unique within this HTML document. Defaults to the document title.
     */
    public startTrackPage(name?: string) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
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
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

   /**
    * @ignore INTERNAL ONLY
    * @param exception
    * @param properties
    * @param systemProperties
    */
    public sendExceptionInternal(exception: IExceptionTelemetry, customProperties?: { [key: string]: any }, systemProperties?: { [key: string]: any }) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
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
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * @description Custom error handler for Application Insights Analytics
     * @param {IAutoExceptionTelemetry} exception
     * @memberof ApplicationInsights
     */
    public _onerror(exception: IAutoExceptionTelemetry): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public addTelemetryInitializer(telemetryInitializer: (item: ITelemetryItem) => boolean | void) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}

/**
 * Used to record timed events and page views.
 */
class Timing {

    public action: (name?: string, url?: string, duration?: number, properties?: { [key: string]: string }, measurements?: { [key: string]: number }) => void;
    public start: (name: string) => void;
    public stop: (name: string, url: string, properties?: { [key: string]: string }, measurements?: { [key: string]: number }) => void;

    constructor(logger: IDiagnosticLogger, name: string) {
        let _self = this;
        let _events: { [key: string]: number; } = {}

        _self.start = (name: string) => {
            if (typeof _events[name] !== "undefined") {
                logger.throwInternal(
                    LoggingSeverity.WARNING, _InternalMessageId.StartCalledMoreThanOnce, "start was called more than once for this event without calling stop.",
                    { name, key: name }, true);
            }
    
            _events[name] = +new Date;
        }
    
        _self.stop = (name: string, url: string, properties?: { [key: string]: string }, measurements?: { [key: string]: number }) => {
            const start = _events[name];
            if (isNaN(start)) {
                logger.throwInternal(
                    LoggingSeverity.WARNING, _InternalMessageId.StopCalledWithoutStart, "stop was called without a corresponding start.",
                    { name, key: name }, true);
            } else {
                const end = +new Date;
                const duration = dateTimeUtilsDuration(start, end);
                _self.action(name, url, duration, properties, measurements);
            }
    
            delete _events[name];
            _events[name] = undefined;
        }
    }
}