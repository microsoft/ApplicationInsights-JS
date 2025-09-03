/**
* ApplicationInsights.ts
* @copyright Microsoft 2018
*/

import dynamicProto from "@microsoft/dynamicproto-js";
import {
    AnalyticsPluginIdentifier, Event as EventTelemetry, Exception, IAppInsights, IAutoExceptionTelemetry, IConfig, IDependencyTelemetry,
    IEventTelemetry, IExceptionInternal, IExceptionTelemetry, IMetricTelemetry, IPageViewPerformanceTelemetry,
    IPageViewPerformanceTelemetryInternal, IPageViewTelemetry, IPageViewTelemetryInternal, ITraceTelemetry, Metric, PageView,
    PageViewPerformance, RemoteDependencyData, Trace, createDomEvent, createTelemetryItem, dataSanitizeString, eSeverityLevel,
    isCrossOriginError, strNotSpecified, utlDisableStorage, utlEnableStorage, utlSetStoragePrefix
} from "@microsoft/applicationinsights-common";
import {
    BaseTelemetryPlugin, IAppInsightsCore, IConfigDefaults, IConfiguration, ICookieMgr, ICustomProperties, IExceptionConfig,
    IInstrumentCallDetails, IPlugin, IProcessTelemetryContext, IProcessTelemetryUnloadContext, ITelemetryInitializerHandler, ITelemetryItem,
    ITelemetryPluginChain, ITelemetryUnloadState, InstrumentEvent, TelemetryInitializerFunction, _eInternalMessageId, arrForEach,
    cfgDfBoolean, cfgDfMerge, cfgDfSet, cfgDfString, cfgDfValidate, createProcessTelemetryContext, createUniqueNamespace, dumpObj,
    eLoggingSeverity, eventOff, eventOn, fieldRedaction, findAllScripts, generateW3CId, getDocument, getExceptionName, getHistory,
    getLocation, getWindow, hasHistory, hasWindow, isFunction, isNullOrUndefined, isString, isUndefined, mergeEvtNamespace, onConfigChange,
    safeGetCookieMgr, strUndefined, throwError
} from "@microsoft/applicationinsights-core-js";
import { IAjaxMonitorPlugin } from "@microsoft/applicationinsights-dependencies-js";
import { isArray, isError, objDeepFreeze, objDefine, scheduleTimeout, strIndexOf } from "@nevware21/ts-utils";
import { IAnalyticsConfig } from "./Interfaces/IAnalyticsConfig";
import { IAppInsightsInternal, IPageViewManager, createPageViewManager } from "./Telemetry/PageViewManager";
import { IPageViewPerformanceManager, createPageViewPerformanceManager } from "./Telemetry/PageViewPerformanceManager";
import { IPageVisitTimeManager, createPageVisitTimeManager } from "./Telemetry/PageVisitTimeManager";
import { ITiming, createTiming } from "./Timing";

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

const MinMilliSeconds = 60000;

const defaultValues: IConfigDefaults<IAnalyticsConfig> = objDeepFreeze({
    sessionRenewalMs: cfgDfSet(_chkConfigMilliseconds, 30 * 60 * 1000),
    sessionExpirationMs: cfgDfSet(_chkConfigMilliseconds, 24 * 60 * 60 * 1000),
    disableExceptionTracking: cfgDfBoolean(),
    autoTrackPageVisitTime: cfgDfBoolean(),
    overridePageViewDuration: cfgDfBoolean(),
    enableUnhandledPromiseRejectionTracking: cfgDfBoolean(),
    autoUnhandledPromiseInstrumented: false,
    samplingPercentage: cfgDfValidate(_chkSampling, 100),
    isStorageUseDisabled: cfgDfBoolean(),
    isBrowserLinkTrackingEnabled: cfgDfBoolean(),
    enableAutoRouteTracking: cfgDfBoolean(),
    namePrefix: cfgDfString(),
    enableDebug: cfgDfBoolean(),
    disableFlushOnBeforeUnload: cfgDfBoolean(),
    disableFlushOnUnload: cfgDfBoolean(false, "disableFlushOnBeforeUnload"),
    expCfg: cfgDfMerge<IExceptionConfig>({inclScripts: false, expLog: undefined, maxLogs: 50})
});

function _chkConfigMilliseconds(value: number, defValue: number): number {
    value = value || defValue;
    if (value < MinMilliSeconds) {
        value = MinMilliSeconds;
    }

    return +value;
}

function _chkSampling(value: number) {
    return !isNaN(value) && value > 0 && value <= 100;
}

function _updateStorageUsage(extConfig: IAnalyticsConfig) {
    // Not resetting the storage usage as someone may have manually called utlDisableStorage, so this will only
    // reset based if the configuration option is provided
    if (!isUndefined(extConfig.isStorageUseDisabled)) {
        if (extConfig.isStorageUseDisabled) {
            utlDisableStorage();
        } else {
            utlEnableStorage();
        }
    }
}

export class AnalyticsPlugin extends BaseTelemetryPlugin implements IAppInsights, IAppInsightsInternal {
    public static Version = "#version#"; // Not currently used anywhere

    public identifier: string = AnalyticsPluginIdentifier; // do not change name or priority
    public priority: number = 180; // take from reserved priority range 100- 200
    public readonly config: IConfig & IConfiguration;
    public queue: Array<() => void>;
    public autoRoutePVDelay = 500; // ms; Time to wait after a route change before triggering a pageview to allow DOM changes to take place

    constructor() {
        super();
        let _eventTracking: ITiming;
        let _pageTracking: ITiming;
        let _pageViewManager: IPageViewManager;
        let _pageViewPerformanceManager: IPageViewPerformanceManager;
        let _pageVisitTimeManager: IPageVisitTimeManager;
        let _preInitTelemetryInitializers: TelemetryInitializerFunction[];
        let _isBrowserLinkTrackingEnabled: boolean;
        let _browserLinkInitializerAdded: boolean;
        let _enableAutoRouteTracking: boolean;
        let _historyListenerAdded: boolean;
        let _disableExceptionTracking: boolean;
        let _autoExceptionInstrumented: boolean;
        let _enableUnhandledPromiseRejectionTracking: boolean;
        let _autoUnhandledPromiseInstrumented: boolean;
        let _extConfig: IAnalyticsConfig;
        let _autoTrackPageVisitTime: boolean;
        let _expCfg: IExceptionConfig;
    
        // array with max length of 2 that store current url and previous url for SPA page route change trackPageview use.
        let _prevUri: string; // Assigned in the constructor
        let _currUri: string;
        let _evtNamespace: string | string[];
        // For testing error hooks only
        let _errorHookCnt: number;

        dynamicProto(AnalyticsPlugin, this, (_self, _base) => {
            let _addHook = _base._addHook;

            _initDefaults();

            _self.getCookieMgr = () => {
                return safeGetCookieMgr(_self.core);
            };

            _self.processTelemetry = (env: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => {
                _self.processNext(env, itemCtx);
            };
        
            _self.trackEvent = (event: IEventTelemetry, customProperties?: ICustomProperties): void => {
                try {
                    let telemetryItem = createTelemetryItem<IEventTelemetry>(
                        event,
                        EventTelemetry.dataType,
                        EventTelemetry.envelopeType,
                        _self.diagLog(),
                        customProperties
                    );

                    _self.core.track(telemetryItem);
                } catch (e) {
                    _throwInternal(eLoggingSeverity.WARNING,
                        _eInternalMessageId.TrackTraceFailed,
                        "trackTrace failed, trace will not be collected: " + getExceptionName(e),
                        { exception: dumpObj(e) });
                }
            };

            /**
             * Start timing an extended event. Call `stopTrackEvent` to log the event when it ends.
             * @param name - A string that identifies this event uniquely within the document.
             */
            _self.startTrackEvent = (name: string) => {
                try {
                    _eventTracking.start(name);
                } catch (e) {
                    _throwInternal(eLoggingSeverity.CRITICAL,
                        _eInternalMessageId.StartTrackEventFailed,
                        "startTrackEvent failed, event will not be collected: " + getExceptionName(e),
                        { exception: dumpObj(e) });
                }
            };

            /**
             * Log an extended event that you started timing with `startTrackEvent`.
             * @param name - The string you used to identify this event in `startTrackEvent`.
             * @param properties - map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
             * @param measurements - map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
             */
            _self.stopTrackEvent = (name: string, properties?: { [key: string]: string }, measurements?: { [key: string]: number }) => {
                try {
                    _eventTracking.stop(name, undefined, properties, measurements);
                } catch (e) {
                    _throwInternal(eLoggingSeverity.CRITICAL,
                        _eInternalMessageId.StopTrackEventFailed,
                        "stopTrackEvent failed, event will not be collected: " + getExceptionName(e),
                        { exception: dumpObj(e) });
                }
            };

            /**
             * @description Log a diagnostic message
             * @param trace - the trace message
             * @param customProperties - Additional custom properties to include in the event
             */
            _self.trackTrace = (trace: ITraceTelemetry, customProperties?: ICustomProperties): void => {
                try {
                    let telemetryItem = createTelemetryItem<ITraceTelemetry>(
                        trace,
                        Trace.dataType,
                        Trace.envelopeType,
                        _self.diagLog(),
                        customProperties);
        
                    _self.core.track(telemetryItem);
                } catch (e) {
                    _throwInternal(eLoggingSeverity.WARNING,
                        _eInternalMessageId.TrackTraceFailed,
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
             * @param metric - input object argument. Only name and average are mandatory.
             * @param } customProperties additional data used to filter metrics in the
             * portal. Defaults to empty.
             */
            _self.trackMetric = (metric: IMetricTelemetry, customProperties?: ICustomProperties): void => {
                try {
                    let telemetryItem = createTelemetryItem<IMetricTelemetry>(
                        metric,
                        Metric.dataType,
                        Metric.envelopeType,
                        _self.diagLog(),
                        customProperties
                    );
        
                    _self.core.track(telemetryItem);
                } catch (e) {
                    _throwInternal(eLoggingSeverity.CRITICAL,
                        _eInternalMessageId.TrackMetricFailed,
                        "trackMetric failed, metric will not be collected: " + getExceptionName(e),
                        { exception: dumpObj(e) });
                }
            };

            /**
             * Logs that a page or other item was viewed.
             * @param IPageViewTelemetry - The string you used as the name in startTrackPage. Defaults to the document title.
             * @param customProperties - Additional data used to filter events and metrics. Defaults to empty.
             * If a user wants to provide duration for pageLoad, it'll have to be in pageView.properties.duration
             */
            _self.trackPageView = (pageView?: IPageViewTelemetry, customProperties?: ICustomProperties) => {
                try {
                    let inPv = pageView || {};
                    if (_self.core && _self.core.config) {
                        inPv.uri = fieldRedaction(inPv.uri, _self.core.config);
                    }
                    _pageViewManager.trackPageView(inPv, {...inPv.properties, ...inPv.measurements, ...customProperties});

                    if (_autoTrackPageVisitTime) {
                        _pageVisitTimeManager.trackPreviousPageVisit(inPv.name, inPv.uri);
                    }
                } catch (e) {
                    _throwInternal(
                        eLoggingSeverity.CRITICAL,
                        _eInternalMessageId.TrackPVFailed,
                        "trackPageView failed, page view will not be collected: " + getExceptionName(e),
                        { exception: dumpObj(e) });
                }
            };

            /**
             * Create a page view telemetry item and send it to the SDK pipeline through the core.track API
             * @param pageView - Page view item to be sent
             * @param properties - Custom properties (Part C) that a user can add to the telemetry item
             * @param systemProperties - System level properties (Part A) that a user can add to the telemetry item
             */
            _self.sendPageViewInternal = (pageView: IPageViewTelemetryInternal, properties?: { [key: string]: any }, systemProperties?: { [key: string]: any }) => {
                let doc = getDocument();
                if (doc) {
                    pageView.refUri = pageView.refUri === undefined ? doc.referrer : pageView.refUri;
                }
                if (_self.core && _self.core.config) {
                    pageView.refUri = fieldRedaction(pageView.refUri, _self.core.config);
                }
                if (isNullOrUndefined(pageView.startTime)) {
                    // calculate the start time manually
                    let duration = ((properties || pageView.properties || {}).duration || 0);
                    pageView.startTime = new Date(new Date().getTime() - duration);
                }
                let telemetryItem = createTelemetryItem<IPageViewTelemetryInternal>(
                    pageView,
                    PageView.dataType,
                    PageView.envelopeType,
                    _self.diagLog(),
                    properties,
                    systemProperties);

                _self.core.track(telemetryItem);
                // reset ajaxes counter
                _resetAjaxAttempts();
            };

            /**
             * @ignore INTERNAL ONLY
             * @param pageViewPerformance
             * @param properties
             */
            _self.sendPageViewPerformanceInternal = (pageViewPerformance: IPageViewPerformanceTelemetryInternal, properties?: { [key: string]: any }, systemProperties?: { [key: string]: any }) => {
                let telemetryItem = createTelemetryItem<IPageViewPerformanceTelemetryInternal>(
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
                let inPvp = pageViewPerformance || {};
                try {
                    _pageViewPerformanceManager.populatePageViewPerformanceEvent(inPvp);
                    _self.sendPageViewPerformanceInternal(inPvp, customProperties);
                } catch (e) {
                    _throwInternal(
                        eLoggingSeverity.CRITICAL,
                        _eInternalMessageId.TrackPVFailed,
                        "trackPageViewPerformance failed, page view will not be collected: " + getExceptionName(e),
                        { exception: dumpObj(e) });
                }
            };

            /**
             * Starts the timer for tracking a page load time. Use this instead of `trackPageView` if you want to control when the page view timer starts and stops,
             * but don't want to calculate the duration yourself. This method doesn't send any telemetry. Call `stopTrackPage` to log the end of the page view
             * and send the event.
             * @param name - A string that idenfities this item, unique within this HTML document. Defaults to the document title.
             */
            _self.startTrackPage = (name?: string) => {
                try {
                    if (typeof name !== "string") {
                        let doc = getDocument();
                        name = doc && doc.title || "";
                    }
        
                    _pageTracking.start(name);
                } catch (e) {
                    _throwInternal(
                        eLoggingSeverity.CRITICAL,
                        _eInternalMessageId.StartTrackFailed,
                        "startTrackPage failed, page view may not be collected: " + getExceptionName(e),
                        { exception: dumpObj(e) });
                }
            };

            /**
             * Stops the timer that was started by calling `startTrackPage` and sends the pageview load time telemetry with the specified properties and measurements.
             * The duration of the page view will be the time between calling `startTrackPage` and `stopTrackPage`.
             * @param name - The string you used as the name in startTrackPage. Defaults to the document title.
             * @param url - String - a relative or absolute URL that identifies the page or other item. Defaults to the window location.
             * @param properties - map[string, string] - additional data used to filter pages and metrics in the portal. Defaults to empty.
             * @param measurements - map[string, number] - metrics associated with this page, displayed in Metrics Explorer on the portal. Defaults to empty.
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
                    if (_self.core && _self.core.config) {
                        url = fieldRedaction(url, _self.core.config);
                    }
                    _pageTracking.stop(name, url, properties, measurement);
        
                    if (_autoTrackPageVisitTime) {
                        _pageVisitTimeManager.trackPreviousPageVisit(name, url);
                    }
                } catch (e) {
                    _throwInternal(
                        eLoggingSeverity.CRITICAL,
                        _eInternalMessageId.StopTrackFailed,
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
                // Adding additional edge cases to handle
                // - Not passing anything (null / undefined)
                const theError = (exception && (exception.exception || exception.error)) ||
                    // - Handle someone calling trackException based of v1 API where the exception was the Error
                    isError(exception) && exception ||
                    // - Handles no error being defined and instead of creating a new Error() instance attempt to map so any stacktrace
                    //   is preserved and does not list ApplicationInsights code as the source
                    { name: (exception && typeof exception) as string, message: exception as any || strNotSpecified };

                // If no exception object was passed assign to an empty object to avoid internal exceptions
                exception = exception || {};
                let exceptionPartB = new Exception(
                    _self.diagLog(),
                    theError,
                    exception.properties || customProperties,
                    exception.measurements,
                    exception.severityLevel,
                    exception.id
                ).toInterface();
                var doc = getDocument();
                if (doc && _expCfg?.inclScripts) {
                    var scriptsInfo = findAllScripts(doc);
                    exceptionPartB.properties["exceptionScripts"] = JSON.stringify(scriptsInfo);
                }
                if (_expCfg?.expLog) {
                    let logs = _expCfg.expLog();
                    if (logs && logs.logs && isArray(logs.logs)) {
                        exceptionPartB.properties["exceptionLog"] = logs.logs.slice(0, _expCfg.maxLogs).join("\n");
                    }
                }
                let telemetryItem: ITelemetryItem = createTelemetryItem<IExceptionInternal>(
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
             * @param exception -   Object which contains exception to be sent
             * @param } customProperties   Additional data used to filter pages and metrics in the portal. Defaults to empty.
             *
             * Any property of type double will be considered a measurement, and will be treated by Application Insights as a metric.
             */
            _self.trackException = (exception: IExceptionTelemetry, customProperties?: ICustomProperties): void => {
                if (exception && !exception.exception && (exception as any).error) {
                    exception.exception = (exception as any).error;
                }
        
                try {
                    _self.sendExceptionInternal(exception, customProperties);
                } catch (e) {
                    _throwInternal(
                        eLoggingSeverity.CRITICAL,
                        _eInternalMessageId.TrackExceptionFailed,
                        "trackException failed, exception will not be collected: " + getExceptionName(e),
                        { exception: dumpObj(e) });
                }
            };

            /**
             * @description Custom error handler for Application Insights Analytics
             * @param exception
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
                    let properties = {
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
                        _self.trackException({ exception, severityLevel: eSeverityLevel.Error }, properties);
                    }
                } catch (e) {
                    const errorString = error ? (error.name + ", " + error.message) : "null";
        
                    _throwInternal(
                        eLoggingSeverity.CRITICAL,
                        _eInternalMessageId.ExceptionWhileLoggingError,
                        "_onError threw exception while logging error, error will not be collected: "
                        + getExceptionName(e),
                        { exception: dumpObj(e), errorString }
                    );
                }
            };

            _self.addTelemetryInitializer = (telemetryInitializer: TelemetryInitializerFunction): ITelemetryInitializerHandler => {
                if (_self.core) {
                    // Just add to the core
                    return _self.core.addTelemetryInitializer(telemetryInitializer);
                }

                // Handle "pre-initialization" telemetry initializers (for backward compatibility)
                if (!_preInitTelemetryInitializers) {
                    _preInitTelemetryInitializers = [];
                }

                _preInitTelemetryInitializers.push(telemetryInitializer);
            };

            _self.initialize = (config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain) => {
                if (_self.isInitialized()) {
                    return;
                }

                if (isNullOrUndefined(core)) {
                    throwError("Error initializing");
                }

                _base.initialize(config, core, extensions, pluginChain);
                try {
                    _evtNamespace = mergeEvtNamespace(createUniqueNamespace(_self.identifier), core.evtNamespace && core.evtNamespace());
                    if (_preInitTelemetryInitializers) {
                        arrForEach(_preInitTelemetryInitializers, (initializer) => {
                            core.addTelemetryInitializer(initializer);
                        });
    
                        _preInitTelemetryInitializers = null;
                    }

                    _populateDefaults(config);
    
                    _pageViewPerformanceManager = createPageViewPerformanceManager(_self.core);
                    _pageViewManager = createPageViewManager(_self, _extConfig.overridePageViewDuration, _self.core, _pageViewPerformanceManager);
                    _pageVisitTimeManager = createPageVisitTimeManager(_self.diagLog(), (pageName, pageUrl, pageVisitTime) => trackPageVisitTime(pageName, pageUrl, pageVisitTime));

                    _eventTracking = createTiming(_self.diagLog(), "trackEvent");
                    _eventTracking.action =
                        (name?: string, url?: string, duration?: number, properties?: { [key: string]: string }, measurements?: { [key: string]: number }) => {
                            if (!properties) {
                                properties = {};
                            }
    
                            if (!measurements) {
                                measurements = {};
                            }
    
                            properties.duration = duration.toString();
                            _self.trackEvent({ name, properties, measurements } as IEventTelemetry);
                        }
    
                    // initialize page view timing
                    _pageTracking = createTiming(_self.diagLog(), "trackPageView");
                    _pageTracking.action = (name, url, duration, properties, measurements) => {
    
                        // duration must be a custom property in order for the collector to extract it
                        if (isNullOrUndefined(properties)) {
                            properties = {};
                        }
                        properties.duration = duration.toString();
    
                        let pageViewItem: IPageViewTelemetry = {
                            name,
                            uri: url,
                            properties,
                            measurements
                        };
    
                        _self.sendPageViewInternal(pageViewItem, properties);
                    }
    
                    if (hasWindow()) {
                        _updateExceptionTracking();
                        _updateLocationChange();
                    }
    
                } catch (e) {
                    // resetting the initialized state because of failure
                    _self.setInitialized(false);
                    throw e;
                }
            };

            _self._doTeardown = (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) => {
                _pageViewManager && _pageViewManager.teardown(unloadCtx, unloadState)
        
                // Just register to remove all events associated with this namespace
                eventOff(window, null, null, _evtNamespace);
                _initDefaults();
            };

           
            _self["_getDbgPlgTargets"] = () => {
                return [_errorHookCnt, _autoExceptionInstrumented];
            };
            
            function _resetAjaxAttempts() {
                // Reset ajax attempts counter for the new page view
                if (_self.core) {
                    let ajaxPlugin = _self.core.getPlugin<IAjaxMonitorPlugin>("AjaxDependencyPlugin");
                    if (ajaxPlugin && ajaxPlugin.plugin && ajaxPlugin.plugin.resetAjaxAttempts) {
                        ajaxPlugin.plugin.resetAjaxAttempts();
                    }
                }
            }
            
            function _populateDefaults(config: IConfiguration) {
                // it is used for 1DS as well, so config type should be IConfiguration only
                let identifier = _self.identifier;
                let core = _self.core;

                _self._addHook(onConfigChange(config, () => {
                    let ctx = createProcessTelemetryContext(null, config, core);
                    _extConfig = ctx.getExtCfg(identifier, defaultValues);
                    // make sure auto exception is instrumented only once and it won't be overriden by the following config changes
                    _autoExceptionInstrumented = _autoExceptionInstrumented || (config as any).autoExceptionInstrumented || _extConfig.autoExceptionInstrumented;

                    _expCfg = _extConfig.expCfg;
                    _autoTrackPageVisitTime = _extConfig.autoTrackPageVisitTime;

                    if (config.storagePrefix){
                        utlSetStoragePrefix(config.storagePrefix);
                    }
                    _updateStorageUsage(_extConfig);

                    // _updateBrowserLinkTracking
                    _isBrowserLinkTrackingEnabled = _extConfig.isBrowserLinkTrackingEnabled;
                    _addDefaultTelemetryInitializers();
                }));
            }

            /**
             * Log a page visit time
             * @param pageName - Name of page
             * @param pageVisitDuration - Duration of visit to the page in milliseconds
             */
            function trackPageVisitTime(pageName: string, pageUrl: string, pageVisitTime: number) {
                let properties = { PageName: pageName, PageUrl: pageUrl };
                _self.trackMetric({
                    name: "PageVisitTime",
                    average: pageVisitTime,
                    max: pageVisitTime,
                    min: pageVisitTime,
                    sampleCount: 1
                }, properties);
            }

            function _addDefaultTelemetryInitializers() {
                if (!_browserLinkInitializerAdded && _isBrowserLinkTrackingEnabled) {
                    const browserLinkPaths = ["/browserLinkSignalR/", "/__browserLink/"];
                    const dropBrowserLinkRequests = (envelope: ITelemetryItem) => {
                        if (_isBrowserLinkTrackingEnabled && envelope.baseType === RemoteDependencyData.dataType) {
                            let remoteData = envelope.baseData as IDependencyTelemetry;
                            if (remoteData) {
                                for (let i = 0; i < browserLinkPaths.length; i++) {
                                    if (remoteData.target && strIndexOf(remoteData.target, browserLinkPaths[i]) >= 0) {
                                        return false;
                                    }
                                }
                            }
                        }

                        return true;
                    }

                    _self._addHook(_self.addTelemetryInitializer(dropBrowserLinkRequests));
                    _browserLinkInitializerAdded = true;
                }
            }

            function _sendCORSException(exception: IAutoExceptionTelemetry, properties?: ICustomProperties) {
                let telemetryItem: ITelemetryItem = createTelemetryItem<IAutoExceptionTelemetry>(
                    exception,
                    Exception.dataType,
                    Exception.envelopeType,
                    _self.diagLog(),
                    properties
                );

                _self.core.track(telemetryItem);
            }

            function _updateExceptionTracking() {
                let _window = getWindow();
                let locn = getLocation(true);

                _self._addHook(onConfigChange(_extConfig, () => {
                    _disableExceptionTracking = _extConfig.disableExceptionTracking;
                    if (!_disableExceptionTracking && !_autoExceptionInstrumented && !_extConfig.autoExceptionInstrumented) {
                        // We want to enable exception auto collection and it has not been done so yet
                        _addHook(InstrumentEvent(_window, "onerror", {
                            ns: _evtNamespace,
                            rsp: (callDetails: IInstrumentCallDetails, message, url, lineNumber, columnNumber, error) => {
                                if (!_disableExceptionTracking && callDetails.rslt !== true) {
                                    _self._onerror(Exception.CreateAutoException(
                                        message,
                                        url,
                                        lineNumber,
                                        columnNumber,
                                        error,
                                        callDetails.evt
                                    ));
                                }
                            }
                        }, false));
                        _errorHookCnt ++;

                        _autoExceptionInstrumented = true;
                    }
                }));

                _addUnhandledPromiseRejectionTracking(_window, locn);
            }

            function _updateLocationChange() {
                let win = getWindow();
                let locn = getLocation(true);

                _self._addHook(onConfigChange(_extConfig, () => {
                    _enableAutoRouteTracking = _extConfig.enableAutoRouteTracking === true;

                    /**
                     * Create a custom "locationchange" event which is triggered each time the history object is changed
                     */
                    if (win && _enableAutoRouteTracking && !_historyListenerAdded && hasHistory()) {
                        let _history = getHistory();

                        if (isFunction(_history.pushState) && isFunction(_history.replaceState) && typeof Event !== strUndefined) {
                            _addHistoryListener(win, _history, locn);
                        }
                    }
                }));
            }

            /**
             * Create a custom "locationchange" event which is triggered each time the history object is changed
             */
            function _addHistoryListener(win: Window, history: History, locn: Location) {
                if (_historyListenerAdded) {
                    return;
                }

                // Name Prefix is only referenced during the initial initialization and cannot be changed afterwards
                let namePrefix = _extConfig.namePrefix || "";

                function _popstateHandler() {
                    if (_enableAutoRouteTracking) {
                        _dispatchEvent(win, createDomEvent(namePrefix + "locationchange"));
                    }
                }

                function _locationChangeHandler() {
                    // We always track the changes (if the handler is installed) to handle the feature being disabled between location changes
                    if (_currUri) {
                        _prevUri = _currUri;
                        _currUri = locn && locn.href || "";
                    } else {
                        _currUri = locn && locn.href || "";
                    }
                    if (_self.core && _self.core.config) {
                        _currUri = fieldRedaction(_currUri, _self.core.config);
                    }
                    if (_enableAutoRouteTracking) {

                        // TODO(OTelSpan) (create new "context") / spans for the new page view
                        // Should "end" any previous span (once we have a new one)
                        let newContext = _self.core.getTraceCtx(true);
                        // While the above will create a new context instance it doesn't generate a new traceId
                        // so we need to generate a new one here
                        newContext.setTraceId(generateW3CId());

                        // This populates the ai.operation.name which has a maximum size of 1024 so we need to sanitize it
                        newContext.pageName = dataSanitizeString(_self.diagLog(), newContext.pageName || "_unknown_");
                        if (_self.core && _self.core.getTraceCtx) {
                            _self.core.setTraceCtx(newContext);
                        }

                        scheduleTimeout(((uri: string) => {
                            // todo: override start time so that it is not affected by autoRoutePVDelay
                            _self.trackPageView({ refUri: uri, properties: { duration: 0 } }); // SPA route change loading durations are undefined, so send 0
                        }).bind(_self, _prevUri), _self.autoRoutePVDelay);
                    }
                }

                _addHook(InstrumentEvent(history, "pushState", {
                    ns: _evtNamespace,
                    rsp: () => {
                        if (_enableAutoRouteTracking) {
                            _dispatchEvent(win, createDomEvent(namePrefix + "pushState"));
                            _dispatchEvent(win, createDomEvent(namePrefix + "locationchange"));
                        }
                    }
                }, true));

                _addHook(InstrumentEvent(history, "replaceState", {
                    ns: _evtNamespace,
                    rsp: () => {
                        if (_enableAutoRouteTracking) {
                            _dispatchEvent(win, createDomEvent(namePrefix + "replaceState"));
                            _dispatchEvent(win, createDomEvent(namePrefix + "locationchange"));
                        }
                    }
                }, true));

                eventOn(win, namePrefix + "popstate", _popstateHandler, _evtNamespace);
                eventOn(win, namePrefix + "locationchange", _locationChangeHandler, _evtNamespace);

                _historyListenerAdded = true;
            }

            function _addUnhandledPromiseRejectionTracking(_window: Window, _location: Location) {
                _self._addHook(onConfigChange(_extConfig, () => {

                    _enableUnhandledPromiseRejectionTracking = _extConfig.enableUnhandledPromiseRejectionTracking === true;
                    _autoExceptionInstrumented = _autoExceptionInstrumented || _extConfig.autoUnhandledPromiseInstrumented;

                    if (_enableUnhandledPromiseRejectionTracking && !_autoUnhandledPromiseInstrumented) {
                        // We want to enable exception auto collection and it has not been done so yet
                        _addHook(InstrumentEvent(_window, "onunhandledrejection", {
                            ns: _evtNamespace,
                            rsp: (callDetails: IInstrumentCallDetails, error: PromiseRejectionEvent) => {
                                if (_enableUnhandledPromiseRejectionTracking && callDetails.rslt !== true) { // handled could be typeof function
                                    _self._onerror(Exception.CreateAutoException(
                                        _getReason(error),
                                        _location ? _location.href : "",
                                        0,
                                        0,
                                        error,
                                        callDetails.evt
                                    ));
                                }
                            }
                        }, false));
                        _errorHookCnt ++;
                        _extConfig.autoUnhandledPromiseInstrumented = _autoUnhandledPromiseInstrumented = true;
                    }
                }));
            }

            /**
             * This method will throw exceptions in debug mode or attempt to log the error as a console warning.
             * @param severity - The severity of the log message
             * @param msgId - The log message.
             */
            function _throwInternal(severity: eLoggingSeverity, msgId: _eInternalMessageId, msg: string, properties?: Object, isUserAct?: boolean): void {
                _self.diagLog().throwInternal(severity, msgId, msg, properties, isUserAct);
            }

            function _initDefaults() {
                _eventTracking = null;
                _pageTracking = null;
                _pageViewManager = null;
                _pageViewPerformanceManager = null;
                _pageVisitTimeManager = null;
                _preInitTelemetryInitializers = null;
                _isBrowserLinkTrackingEnabled = false;
                _browserLinkInitializerAdded = false;
                _enableAutoRouteTracking = false;
                _historyListenerAdded = false;
                _disableExceptionTracking = false;
                _autoExceptionInstrumented = false;
                _enableUnhandledPromiseRejectionTracking = false;
                _autoUnhandledPromiseInstrumented = false;
                _autoTrackPageVisitTime = false;

                // Reset ajax attempts counter
                _resetAjaxAttempts();
            
                // array with max length of 2 that store current url and previous url for SPA page route change trackPageview use.
                let location = getLocation(true);
                _prevUri = location && location.href || "";
                if (_self.core && _self.core.config) {
                    _prevUri = fieldRedaction(_prevUri, _self.core.config);
                }
                _currUri = null;
                _evtNamespace = null;
                _extConfig = null;
                _errorHookCnt = 0;

                // Define _self.config
                objDefine(_self, "config", {
                    g: () => _extConfig
                });
            }
        
            // For backward compatibility
            objDefine<any>(_self, "_pageViewManager", { g: () => _pageViewManager });
            objDefine<any>(_self, "_pageViewPerformanceManager", { g: () => _pageViewPerformanceManager });
            objDefine<any>(_self, "_pageVisitTimeManager", { g: () => _pageVisitTimeManager });
            objDefine<any>(_self, "_evtNamespace", { g: () => "." + _evtNamespace });
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
     * @param name - A string that identifies this event uniquely within the document.
     */
    public startTrackEvent(name: string) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Log an extended event that you started timing with `startTrackEvent`.
     * @param name - The string you used to identify this event in `startTrackEvent`.
     * @param properties - map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
     * @param measurements - map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
     */
    public stopTrackEvent(name: string, properties?: { [key: string]: string }, measurements?: { [key: string]: number }) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * @description Log a diagnostic message
     * @param trace - the trace message
     * @param customProperties - Additional custom properties to include in the event
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
     * @param metric - input object argument. Only name and average are mandatory.
     * @param customProperties - additional data used to filter metrics in the
     * portal. Defaults to empty.
     */
    public trackMetric(metric: IMetricTelemetry, customProperties?: ICustomProperties): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Logs that a page or other item was viewed.
     * @param IPageViewTelemetry - The string you used as the name in startTrackPage. Defaults to the document title.
     * @param customProperties - Additional data used to filter events and metrics. Defaults to empty.
     * If a user wants to provide duration for pageLoad, it'll have to be in pageView.properties.duration
     */
    public trackPageView(pageView?: IPageViewTelemetry, customProperties?: ICustomProperties) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Create a page view telemetry item and send it to the SDK pipeline through the core.track API
     * @param pageView - Page view item to be sent
     * @param properties - Custom properties (Part C) that a user can add to the telemetry item
     * @param systemProperties - System level properties (Part A) that a user can add to the telemetry item
     */
    public sendPageViewInternal(pageView: IPageViewTelemetryInternal, properties?: { [key: string]: any }, systemProperties?: { [key: string]: any }) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * @ignore INTERNAL ONLY
     * @param pageViewPerformance - The page view performance item to be sent
     * @param properties - Custom properties (Part C) that a user can add to the telemetry item
     */
    public sendPageViewPerformanceInternal(pageViewPerformance: IPageViewPerformanceTelemetryInternal, properties?: { [key: string]: any }, systemProperties?: { [key: string]: any }) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Send browser performance metrics.
     * @param pageViewPerformance - The page view performance item to be sent
     * @param customProperties - Additional data used to filter pages and metrics in the portal. Defaults to empty.
     */
    public trackPageViewPerformance(pageViewPerformance: IPageViewPerformanceTelemetry, customProperties?: ICustomProperties): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Starts the timer for tracking a page load time. Use this instead of `trackPageView` if you want to control when the page view timer starts and stops,
     * but don't want to calculate the duration yourself. This method doesn't send any telemetry. Call `stopTrackPage` to log the end of the page view
     * and send the event.
     * @param name - A string that idenfities this item, unique within this HTML document. Defaults to the document title.
     */
    public startTrackPage(name?: string) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Stops the timer that was started by calling `startTrackPage` and sends the pageview load time telemetry with the specified properties and measurements.
     * The duration of the page view will be the time between calling `startTrackPage` and `stopTrackPage`.
     * @param name - The string you used as the name in startTrackPage. Defaults to the document title.
     * @param url - String - a relative or absolute URL that identifies the page or other item. Defaults to the window location.
     * @param properties - map[string, string] - additional data used to filter pages and metrics in the portal. Defaults to empty.
     * @param measurements - map[string, number] - metrics associated with this page, displayed in Metrics Explorer on the portal. Defaults to empty.
     */
    public stopTrackPage(name?: string, url?: string, properties?: { [key: string]: string }, measurement?: { [key: string]: number }) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
    * @ignore INTERNAL ONLY
    * @param exception - The exception item to be sent
    * @param properties - Custom properties (Part C) that a user can add to the telemetry item
    * @param systemProperties - System level properties (Part A) that a user can add to the telemetry item
    */
    public sendExceptionInternal(exception: IExceptionTelemetry, customProperties?: { [key: string]: any }, systemProperties?: { [key: string]: any }) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Log an exception you have caught.
     *
     * @param exception - Object which contains exception to be sent
     * @param customProperties - Additional data used to filter pages and metrics in the portal. Defaults to empty.
     *
     * Any property of type double will be considered a measurement, and will be treated by Application Insights as a metric.
     */
    public trackException(exception: IExceptionTelemetry, customProperties?: ICustomProperties): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * @description Custom error handler for Application Insights Analytics
     * @param exception - The exception item to be sent
     */
    public _onerror(exception: IAutoExceptionTelemetry): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public addTelemetryInitializer(telemetryInitializer: (item: ITelemetryItem) => boolean | void): ITelemetryInitializerHandler {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    public initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}
