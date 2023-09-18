// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import dynamicProto from "@microsoft/dynamicproto-js";
import {
    CorrelationIdHelper, DisabledPropertyName, IConfig, ICorrelationConfig, IDependencyTelemetry, IRequestContext, ITelemetryContext,
    PropertiesPluginIdentifier, RemoteDependencyData, RequestHeaders, createDistributedTraceContextFromTrace, createTelemetryItem,
    createTraceParent, dateTimeUtilsNow, eDistributedTracingModes, eRequestHeaders, formatTraceParent, isInternalApplicationInsightsEndpoint
} from "@microsoft/applicationinsights-common";
import {
    BaseTelemetryPlugin, IAppInsightsCore, IConfiguration, ICustomProperties, IDistributedTraceContext, IInstrumentCallDetails,
    IInstrumentHooksCallbacks, IPlugin, IProcessTelemetryContext, ITelemetryItem, ITelemetryPluginChain, InstrumentFunc, InstrumentProto,
    _eInternalMessageId, _throwInternal, arrForEach, createProcessTelemetryContext, createUniqueNamespace, deepFreeze, dumpObj,
    eLoggingSeverity, eventOn, generateW3CId, getExceptionName, getGlobal, getIEVersion, getLocation, getPerformance, isFunction,
    isNullOrUndefined, isString, isXhrSupported, mergeEvtNamespace, objForEachKey, strPrototype, strTrim
} from "@microsoft/applicationinsights-core-js";
import { DependencyInitializerFunction, IDependencyInitializerDetails, IDependencyInitializerHandler } from "./DependencyInitializer";
import {
    DependencyListenerFunction, IDependencyHandler, IDependencyListenerContainer, IDependencyListenerDetails, IDependencyListenerHandler
} from "./DependencyListener";
import { IAjaxRecordResponse, ajaxRecord } from "./ajaxRecord";

declare let WorkerGlobalScope: any;
declare let self: any;

const AJAX_MONITOR_PREFIX = "ai.ajxmn.";
const strDiagLog = "diagLog";
const AJAX_DATA_CONTAINER = "_ajaxData";
const STR_FETCH = "fetch";

const ERROR_HEADER = "Failed to monitor XMLHttpRequest";
const ERROR_PREFIX = ", monitoring data for this ajax call ";
const ERROR_POSTFIX = ERROR_PREFIX +  "may be incorrect.";
const ERROR_NOT_SENT = ERROR_PREFIX + "won't be sent.";
const CORRELATION_HEADER_ERROR = "Failed to get Request-Context correlation header as it may be not included in the response or not accessible.";
const CUSTOM_REQUEST_CONTEXT_ERROR = "Failed to add custom defined request context as configured call back may missing a null check.";
const FAILED_TO_CALCULATE_DURATION_ERROR = "Failed to calculate the duration of the ";

// Using a global value so that to handle same iKey with multiple app insights instances (mostly for testing)
let _markCount: number = 0;

interface _IInternalDependencyHandler<F> {
    id: number;
    fn: F;
}

/** @Ignore */
function _supportsFetch(): (input: RequestInfo, init?: RequestInit) => Promise<Response> {
    let _global = getGlobal();
    if (!_global ||
            isNullOrUndefined((_global as any).Request) ||
            isNullOrUndefined((_global as any).Request[strPrototype]) ||
            isNullOrUndefined(_global[STR_FETCH])) {
        return null;
    }

    return _global[STR_FETCH];
}

let _isWebWorker: boolean = null;

function isWebWorker() {
    if (_isWebWorker == null) {
        try {
            _isWebWorker = !!(self && self instanceof WorkerGlobalScope);
        } catch(e) {
            _isWebWorker = false;
        }
    }

    return _isWebWorker;
}

/**
 * Determines whether ajax monitoring can be enabled on this document
 * @returns True if Ajax monitoring is supported on this page, otherwise false
 * @ignore
 */
function _supportsAjaxMonitoring(ajaxMonitorInstance: AjaxMonitor, ajaxDataId: string): boolean {
    let result = false;

    if (isXhrSupported()) {
        let proto = XMLHttpRequest[strPrototype];
        result = !isNullOrUndefined(proto) &&
            !isNullOrUndefined(proto.open) && // eslint-disable-line security/detect-non-literal-fs-filename -- false positive
            !isNullOrUndefined(proto.send) &&
            !isNullOrUndefined(proto.abort);
    }

    let ieVer = getIEVersion();
    if (ieVer && ieVer < 9) {
        result = false;
    }

    if (result) {
        // Disable if the XmlHttpRequest can't be extended or hooked
        try {
            let xhr = new XMLHttpRequest();
            let xhrData: XMLHttpRequestData = {
                xh: [],
                i: {
                    [ajaxDataId]: {} as ajaxRecord
                }
            };

            xhr[AJAX_DATA_CONTAINER] = xhrData;

            // Check that we can update the prototype
            let theOpen = XMLHttpRequest[strPrototype].open;
            XMLHttpRequest[strPrototype].open = theOpen;
        } catch (e) {
            // We can't decorate the xhr object so disable monitoring
            result = false;
            _throwInternalCritical(ajaxMonitorInstance,
                _eInternalMessageId.FailedMonitorAjaxOpen,
                "Failed to enable XMLHttpRequest monitoring, extension is not supported",
                {
                    exception: dumpObj(e)
                });
        }
    }

    return result;
}

/**
 * Internal helper to fetch the SDK instance tracking data for this XHR request
 * @param xhr
 * @param ajaxDataId
 * @returns
 */
const _getAjaxData = (xhr: XMLHttpRequestInstrumented, ajaxDataId: string): ajaxRecord => {
    if (xhr && ajaxDataId && xhr[AJAX_DATA_CONTAINER]) {
        return (xhr[AJAX_DATA_CONTAINER].i || { })[ajaxDataId];
    }

    return null;
}

/**
 * @ignore
 * Internal helper to track the singleton shared tracking headers, so we can attempt to not create headers
 * that might cause an issue if multiple values are populated.
 * @param xhr - The instrumented XHR instance
 */
const _addSharedXhrHeaders = (xhr: XMLHttpRequestInstrumented, name: string, value: string) => {
    if (xhr) {
        let headers = (xhr[AJAX_DATA_CONTAINER] || {}).xh;
        if (headers) {
            headers.push({
                n: name,
                v: value
            });
        }
    }
}

const _isHeaderSet = (xhr: XMLHttpRequestInstrumented, name: string) => {
    let isPresent = false;
    if (xhr) {
        let headers = (xhr[AJAX_DATA_CONTAINER] || {}).xh;
        if (headers) {
            arrForEach(headers, (header) => {
                if (header.n === name) {
                    isPresent = true;
                    return -1;
                }
            });
        }
    }

    return isPresent;
}

/** @Ignore */
function _getFailedAjaxDiagnosticsMessage(xhr: XMLHttpRequestInstrumented, ajaxDataId: string): string {
    let result = "";
    try {
        let ajaxData = _getAjaxData(xhr, ajaxDataId);
        if (ajaxData && ajaxData.requestUrl) {
            result += "(url: '" + ajaxData.requestUrl + "')";
        }
    } catch (e) {
        // eslint-disable-next-line no-empty
    }

    return result;
}

/** @ignore */
function _throwInternalCritical(ajaxMonitorInstance:AjaxMonitor, msgId: _eInternalMessageId, message: string, properties?: Object, isUserAct?: boolean): void {
    _throwInternal(ajaxMonitorInstance[strDiagLog](), eLoggingSeverity.CRITICAL, msgId, message, properties, isUserAct);
}

/** @ignore */
function _throwInternalWarning(ajaxMonitorInstance:AjaxMonitor, msgId: _eInternalMessageId, message: string, properties?: Object, isUserAct?: boolean): void {
    _throwInternal(ajaxMonitorInstance[strDiagLog](), eLoggingSeverity.WARNING, msgId, message, properties, isUserAct);
}

/** @Ignore */
function _createErrorCallbackFunc(ajaxMonitorInstance: AjaxMonitor, internalMessage: _eInternalMessageId, message:string) {
    // tslint:disable-next-line
    return function (callDetails: IInstrumentCallDetails) {
        _throwInternalCritical(ajaxMonitorInstance,
            internalMessage,
            message,
            {
                ajaxDiagnosticsMessage: _getFailedAjaxDiagnosticsMessage(callDetails.inst, (ajaxMonitorInstance as any)._ajaxDataId),
                exception: dumpObj(callDetails.err)
            });
    };
}

function _indexOf(value:string, match:string):number {
    if (value && match) {
        return value.indexOf(match);
    }

    return -1;
}

function _addHandler<F>(container: _IInternalDependencyHandler<F>[], id: number, theFunc: F): IDependencyHandler {
    let theHandler: _IInternalDependencyHandler<F> = {
        id: id,
        fn: theFunc
    };

    container.push(theHandler);

    return {
        remove: () => {
            arrForEach(container, (initializer, idx) => {
                if (initializer.id === theHandler.id) {
                    container.splice(idx, 1);
                    return -1;
                }
            });
        }
    };
}

function _processDependencyContainer<F extends Function, D>(core: IAppInsightsCore, container: _IInternalDependencyHandler<F>[], details: D, message: string) {
    let result = true;
    arrForEach(container, (theFunc, idx) => {
        try {
            if (theFunc.fn.call(null, details) === false) {
                result = false;
            }
        } catch (e) {
            _throwInternal(
                core && core.logger,
                eLoggingSeverity.CRITICAL,
                _eInternalMessageId.TelemetryInitializerFailed,
                "Dependency " + message + " [#" + idx + "] failed: " + getExceptionName(e),
                { exception: dumpObj(e) }, true);
        }
    });

    return result;
}

function _processDependencyListeners(listeners: _IInternalDependencyHandler<DependencyListenerFunction>[], core: IAppInsightsCore, ajaxData: ajaxRecord, xhr: XMLHttpRequest, input?: Request | string, init?: RequestInit): void {
    var initializersCount = listeners.length;
    if (initializersCount > 0) {
        let details: IDependencyListenerDetails = {
            core: core,
            xhr: xhr,
            input: input,
            init: init,
            traceId: ajaxData.traceID,
            spanId: ajaxData.spanID,
            traceFlags: ajaxData.traceFlags,
            context: ajaxData.context || {},
            aborted: !!ajaxData.aborted
        };
    
        _processDependencyContainer(core, listeners, details, "listener");

        ajaxData.traceID = details.traceId;
        ajaxData.spanID = details.spanId;
        ajaxData.traceFlags = details.traceFlags;
        ajaxData.context = details.context;
    }
}

export interface XMLHttpRequestData {
    /**
     * The "Shared" XHR headers, avoids causing multiple instances
     */
    xh?: Array<{ n: string, v: string }>;

    /**
     * The individual tracking data for each AI instance
     */
    i: { [key: string]: ajaxRecord };
}

export interface XMLHttpRequestInstrumented extends XMLHttpRequest {
    _ajaxData: XMLHttpRequestData;
}

const BLOB_CORE = "*.blob.core.";

export const DfltAjaxCorrelationHeaderExDomains = deepFreeze([
    BLOB_CORE + "windows.net",
    BLOB_CORE + "chinacloudapi.cn",
    BLOB_CORE + "cloudapi.de",
    BLOB_CORE + "usgovcloudapi.net"
]);


const _internalExcludeEndpoints = [
    /https:\/\/[^\/]*(\.pipe\.aria|aria\.pipe|events\.data|collector\.azure)\.[^\/]+\/(OneCollector\/1|Collector\/3)\.0/i
];

export interface IDependenciesPlugin extends IDependencyListenerContainer {
    /**
     * Logs dependency call
     * @param dependencyData - dependency data object
     */
    trackDependencyData(dependency: IDependencyTelemetry): void;
}

export interface IInstrumentationRequirements extends IDependenciesPlugin {
    includeCorrelationHeaders: (ajaxData: ajaxRecord, input?: Request | string, init?: RequestInit, xhr?: XMLHttpRequestInstrumented) => any;
}

function _getDefaultConfig(): ICorrelationConfig {
    const config: ICorrelationConfig = {
        maxAjaxCallsPerView: 500,
        disableAjaxTracking: false,
        disableFetchTracking: false,
        excludeRequestFromAutoTrackingPatterns: undefined,
        disableCorrelationHeaders: false,
        distributedTracingMode: eDistributedTracingModes.AI_AND_W3C,
        correlationHeaderExcludedDomains: DfltAjaxCorrelationHeaderExDomains,
        correlationHeaderDomains: undefined,
        correlationHeaderExcludePatterns: undefined,
        appId: undefined,
        enableCorsCorrelation: false,
        enableRequestHeaderTracking: false,
        enableResponseHeaderTracking: false,
        enableAjaxErrorStatusText: false,
        enableAjaxPerfTracking: false,
        maxAjaxPerfLookupAttempts: 3,
        ajaxPerfLookupDelay: 25,
        ignoreHeaders:[
            "Authorization",
            "X-API-Key",
            "WWW-Authenticate"],
        addRequestContext: undefined,
        addIntEndpoints: true
    }
    return config;
}

function _getEmptyConfig(): ICorrelationConfig {
    let emptyConfig = _getDefaultConfig();
    objForEachKey(emptyConfig, (value) => {
        emptyConfig[value] = undefined;
    });

    return emptyConfig;
}

export class AjaxMonitor extends BaseTelemetryPlugin implements IDependenciesPlugin, IInstrumentationRequirements, IDependencyListenerContainer {

    public static identifier: string = "AjaxDependencyPlugin";

    public static getDefaultConfig = _getDefaultConfig;

    public static getEmptyConfig = _getEmptyConfig;

    public identifier: string = AjaxMonitor.identifier;

    priority: number = 120;

    constructor() {
        super();
        let _fetchInitialized: boolean;      // fetch monitoring initialized
        let _xhrInitialized: boolean;        // XHR monitoring initialized
        let _currentWindowHost: string;
        let _config: ICorrelationConfig;
        let _enableRequestHeaderTracking: boolean;
        let _enableAjaxErrorStatusText: boolean;
        let _trackAjaxAttempts: number;
        let _context: ITelemetryContext;
        let _isUsingW3CHeaders: boolean;
        let _isUsingAIHeaders: boolean;
        let _markPrefix: string;
        let _enableAjaxPerfTracking: boolean;
        let _maxAjaxCallsPerView: number;
        let _enableResponseHeaderTracking: boolean;
        let _disabledUrls: any;
        let _disableAjaxTracking: boolean;
        let _disableFetchTracking: boolean;
        let _excludeRequestFromAutoTrackingPatterns: (string | RegExp)[];
        let _addRequestContext: (requestContext?: IRequestContext) => ICustomProperties;
        let _evtNamespace: string | string[];
        let _ajaxDataId: string;
        let _dependencyHandlerId: number;
        let _dependencyListeners: _IInternalDependencyHandler<DependencyListenerFunction>[];
        let _dependencyInitializers: _IInternalDependencyHandler<DependencyInitializerFunction>[];

        dynamicProto(AjaxMonitor, this, (_self, _base) => {
            let _addHook = _base._addHook;

            _initDefaults();

            _self.initialize = (config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain) => {
                if (!_self.isInitialized()) {
                    _base.initialize(config, core, extensions, pluginChain);
                    _evtNamespace = mergeEvtNamespace(createUniqueNamespace("ajax"), core && core.evtNamespace && core.evtNamespace());

                    _populateDefaults(config);

                    _instrumentXhr();
                    _instrumentFetch();
                    _populateContext();
                }
            };

            _self._doTeardown = () => {
                _initDefaults();
            };

            _self.trackDependencyData = (dependency: IDependencyTelemetry, properties?: { [key: string]: any }) => {
                _reportDependencyInternal(_dependencyInitializers, _self.core, null, dependency, properties);
            }

            _self.includeCorrelationHeaders = (ajaxData: ajaxRecord, input?: Request | string, init?: RequestInit, xhr?: XMLHttpRequestInstrumented): any => {
                // Test Hook to allow the overriding of the location host
                let currentWindowHost = _self["_currentWindowHost"] || _currentWindowHost;

                _processDependencyListeners(_dependencyListeners, _self.core, ajaxData, xhr, input, init);

                if (input || input === "") { // Fetch
                    if (CorrelationIdHelper.canIncludeCorrelationHeader(_config, ajaxData.getAbsoluteUrl(), currentWindowHost)) {
                        if (!init) {
                            init = {};
                        }

                        // init headers override original request headers
                        // so, if they exist use only them, otherwise use request's because they should have been applied in the first place
                        // not using original request headers will result in them being lost
                        let headers = new Headers(init.headers || (input instanceof Request ? (input.headers || {}) : {}));
                        if (_isUsingAIHeaders) {
                            const id = "|" + ajaxData.traceID + "." + ajaxData.spanID;
                            headers.set(RequestHeaders[eRequestHeaders.requestIdHeader], id);
                            if (_enableRequestHeaderTracking) {
                                ajaxData.requestHeaders[RequestHeaders[eRequestHeaders.requestIdHeader]] = id;
                            }
                        }
                        const appId: string = _config.appId ||(_context && _context.appId());
                        if (appId) {
                            headers.set(RequestHeaders[eRequestHeaders.requestContextHeader], RequestHeaders[eRequestHeaders.requestContextAppIdFormat] + appId);
                            if (_enableRequestHeaderTracking) {
                                ajaxData.requestHeaders[RequestHeaders[eRequestHeaders.requestContextHeader]] = RequestHeaders[eRequestHeaders.requestContextAppIdFormat] + appId;
                            }
                        }
                        if (_isUsingW3CHeaders) {
                            let traceFlags = ajaxData.traceFlags;
                            if (isNullOrUndefined(traceFlags)) {
                                traceFlags = 0x01;
                            }

                            const traceParent = formatTraceParent(createTraceParent(ajaxData.traceID, ajaxData.spanID, traceFlags));
                            headers.set(RequestHeaders[eRequestHeaders.traceParentHeader], traceParent);
                            if (_enableRequestHeaderTracking) {
                                ajaxData.requestHeaders[RequestHeaders[eRequestHeaders.traceParentHeader]] = traceParent;
                            }
                        }

                        init.headers = headers;
                    }

                    return init;
                } else if (xhr) { // XHR
                    if (CorrelationIdHelper.canIncludeCorrelationHeader(_config, ajaxData.getAbsoluteUrl(), currentWindowHost)) {
                        if (_isUsingAIHeaders) {
                            if (!_isHeaderSet(xhr, RequestHeaders[eRequestHeaders.requestIdHeader])) {
                                const id = "|" + ajaxData.traceID + "." + ajaxData.spanID;
                                xhr.setRequestHeader(RequestHeaders[eRequestHeaders.requestIdHeader], id);
                                if (_enableRequestHeaderTracking) {
                                    ajaxData.requestHeaders[RequestHeaders[eRequestHeaders.requestIdHeader]] = id;
                                }
                            } else {
                                _throwInternalWarning(_self, _eInternalMessageId.FailedMonitorAjaxSetRequestHeader,
                                    "Unable to set [" + RequestHeaders[eRequestHeaders.requestIdHeader] + "] as it has already been set by another instance");
                            }
                        }
                        const appId = _config.appId || (_context && _context.appId());
                        if (appId) {
                            if (!_isHeaderSet(xhr, RequestHeaders[eRequestHeaders.requestContextHeader])) {
                                xhr.setRequestHeader(RequestHeaders[eRequestHeaders.requestContextHeader], RequestHeaders[eRequestHeaders.requestContextAppIdFormat] + appId);
                                if (_enableRequestHeaderTracking) {
                                    ajaxData.requestHeaders[RequestHeaders[eRequestHeaders.requestContextHeader]] = RequestHeaders[eRequestHeaders.requestContextAppIdFormat] + appId;
                                }
                            } else {
                                _throwInternalWarning(_self, _eInternalMessageId.FailedMonitorAjaxSetRequestHeader,
                                    "Unable to set [" + RequestHeaders[eRequestHeaders.requestContextHeader] + "] as it has already been set by another instance");
                            }
                        }
                        if (_isUsingW3CHeaders) {
                            let traceFlags = ajaxData.traceFlags;
                            if (isNullOrUndefined(traceFlags)) {
                                traceFlags = 0x01;
                            }

                            if (!_isHeaderSet(xhr, RequestHeaders[eRequestHeaders.traceParentHeader])) {
                                const traceParent = formatTraceParent(createTraceParent(ajaxData.traceID, ajaxData.spanID, traceFlags));
                                xhr.setRequestHeader(RequestHeaders[eRequestHeaders.traceParentHeader], traceParent);
                                if (_enableRequestHeaderTracking) {
                                    ajaxData.requestHeaders[RequestHeaders[eRequestHeaders.traceParentHeader]] = traceParent;
                                }
                            } else {
                                _throwInternalWarning(_self, _eInternalMessageId.FailedMonitorAjaxSetRequestHeader,
                                    "Unable to set [" + RequestHeaders[eRequestHeaders.traceParentHeader] + "] as it has already been set by another instance");
                            }
                        }
                    }

                    return xhr;
                }

                return undefined;
            }

            _self.trackDependencyDataInternal = (dependency: IDependencyTelemetry, properties?: { [key: string]: any }, systemProperties?: { [key: string]: any }) => {
                if (_maxAjaxCallsPerView === -1 || _trackAjaxAttempts < _maxAjaxCallsPerView) {
                    // Hack since expected format in w3c mode is |abc.def.
                    // Non-w3c format is |abc.def
                    // @todo Remove if better solution is available, e.g. handle in portal
                    if ((_config.distributedTracingMode === eDistributedTracingModes.W3C
                        || _config.distributedTracingMode === eDistributedTracingModes.AI_AND_W3C)
                        && typeof dependency.id === "string" && dependency.id[dependency.id.length - 1] !== "."
                    ) {
                        dependency.id += ".";
                    }
                    if (isNullOrUndefined(dependency.startTime)) {
                        dependency.startTime = new Date();
                    }
                    const item = createTelemetryItem<IDependencyTelemetry>(
                        dependency,
                        RemoteDependencyData.dataType,
                        RemoteDependencyData.envelopeType,
                        _self[strDiagLog](),
                        properties,
                        systemProperties);

                    _self.core.track(item);
                } else if (_trackAjaxAttempts === _maxAjaxCallsPerView) {
                    _throwInternalCritical(_self,
                        _eInternalMessageId.MaxAjaxPerPVExceeded,
                        "Maximum ajax per page view limit reached, ajax monitoring is paused until the next trackPageView(). In order to increase the limit set the maxAjaxCallsPerView configuration parameter.",
                        true);
                }

                ++_trackAjaxAttempts;
            }

            _self.addDependencyListener = (dependencyListener: DependencyListenerFunction): IDependencyListenerHandler => {
                return _addHandler(_dependencyListeners, _dependencyHandlerId++, dependencyListener);
            };

            _self.addDependencyInitializer = (dependencyInitializer: DependencyInitializerFunction): IDependencyInitializerHandler => {
                return _addHandler(_dependencyInitializers, _dependencyHandlerId++, dependencyInitializer);
            };
        
            function _initDefaults() {
                let location = getLocation();
                _fetchInitialized = false;      // fetch monitoring initialized
                _xhrInitialized = false;        // XHR monitoring initialized
                _currentWindowHost = location && location.host && location.host.toLowerCase();
                _config = AjaxMonitor.getEmptyConfig();
                _enableRequestHeaderTracking = false;
                _enableAjaxErrorStatusText = false;
                _trackAjaxAttempts = 0;
                _context = null;
                _isUsingW3CHeaders = false;
                _isUsingAIHeaders = false;
                _markPrefix = null;
                _enableAjaxPerfTracking = false;
                _maxAjaxCallsPerView = 0;
                _enableResponseHeaderTracking = false;
                _disabledUrls = {};
                _disableAjaxTracking = false;
                _disableFetchTracking = false;
        
                _excludeRequestFromAutoTrackingPatterns = null;
                _addRequestContext = null;
                _evtNamespace = null;
                _dependencyHandlerId = 0;
                _dependencyListeners = [];
                _dependencyInitializers = [];
                _ajaxDataId = createUniqueNamespace("ajaxData");
                (_self as any)._ajaxDataId = _ajaxDataId;
            }

            function _populateDefaults(config: IConfiguration) {
                let ctx = createProcessTelemetryContext(null, config, _self.core);

                // Reset to the empty config
                _config = _getEmptyConfig();
                const defaultConfig = _getDefaultConfig();
                objForEachKey(defaultConfig, (field, value) => {
                    _config[field] = ctx.getConfig(AjaxMonitor.identifier, field, value);
                });
    
                let distributedTracingMode = _config.distributedTracingMode;
                _enableRequestHeaderTracking = _config.enableRequestHeaderTracking;
                _enableAjaxErrorStatusText = _config.enableAjaxErrorStatusText;
                _enableAjaxPerfTracking = _config.enableAjaxPerfTracking;
                _maxAjaxCallsPerView = _config.maxAjaxCallsPerView;
                _enableResponseHeaderTracking = _config.enableResponseHeaderTracking;
                _excludeRequestFromAutoTrackingPatterns = [].concat(_config.excludeRequestFromAutoTrackingPatterns || [], _config.addIntEndpoints !== false ? _internalExcludeEndpoints : []);
                _addRequestContext = _config.addRequestContext;

                _isUsingAIHeaders = distributedTracingMode === eDistributedTracingModes.AI || distributedTracingMode === eDistributedTracingModes.AI_AND_W3C;
                _isUsingW3CHeaders = distributedTracingMode === eDistributedTracingModes.AI_AND_W3C || distributedTracingMode === eDistributedTracingModes.W3C;

                if (_enableAjaxPerfTracking) {
                    let iKey = config.instrumentationKey || "unkwn";
                    if (iKey.length > 5) {
                        _markPrefix = AJAX_MONITOR_PREFIX + iKey.substring(iKey.length - 5) + ".";
                    } else {
                        _markPrefix = AJAX_MONITOR_PREFIX + iKey + ".";
                    }
                }

                _disableAjaxTracking = !!_config.disableAjaxTracking;
                _disableFetchTracking = !!_config.disableFetchTracking;
            }

            function _populateContext() {
                let propExt = _self.core.getPlugin<any>(PropertiesPluginIdentifier);
                if (propExt) {
                    _context = propExt.plugin.context; // we could move IPropertiesPlugin to common as well
                }
            }

            // discard the header if it's defined as ignoreHeaders in ICorrelationConfig
            function _canIncludeHeaders(header: string) {
                let rlt = true;
                if (header || _config.ignoreHeaders) {
                    arrForEach(_config.ignoreHeaders,(key => {
                        if (key.toLowerCase() === header.toLowerCase()) {
                            rlt = false;
                            return -1;
                        }
                    }))
                }
                return rlt;
            }

            // Fetch Stuff
            function _instrumentFetch(): void {
                let fetch = _supportsFetch();
                if (!fetch) {
                    return;
                }

                let global = getGlobal();
                let isPolyfill = (fetch as any).polyfill;
                if (!_disableFetchTracking && !_fetchInitialized) {
                    _addHook(InstrumentFunc(global, STR_FETCH, {
                        ns: _evtNamespace,
                        // Add request hook
                        req: (callDetails: IInstrumentCallDetails, input, init) => {
                            let fetchData: ajaxRecord;
                            if (!_disableFetchTracking && _fetchInitialized &&
                                    !_isDisabledRequest(null, input, init) &&
                                    // If we have a polyfil and XHR instrumented then let XHR report otherwise we get duplicates
                                    !(isPolyfill && _xhrInitialized)) {
                                let ctx = callDetails.ctx();
                                fetchData = _createFetchRecord(input, init);
                                let newInit = _self.includeCorrelationHeaders(fetchData, input, init);
                                if (newInit !== init) {
                                    callDetails.set(1, newInit);
                                }
                                ctx.data = fetchData;
                            }
                        },
                        rsp: (callDetails: IInstrumentCallDetails, input) => {
                            if (!_disableFetchTracking) {
                                let fetchData = callDetails.ctx().data;
                                if (fetchData) {
                                    // Replace the result with the new promise from this code
                                    callDetails.rslt = callDetails.rslt.then((response: any) => {
                                        _reportFetchMetrics(callDetails, (response||{}).status, input, response, fetchData, () => {
                                            let ajaxResponse:IAjaxRecordResponse = {
                                                statusText: (response||{}).statusText,
                                                headerMap: null,
                                                correlationContext: _getFetchCorrelationContext(response)
                                            };
    
                                            if (_enableResponseHeaderTracking && response) {
                                                const responseHeaderMap = {};
                                                response.headers.forEach((value: string, name: string) => {     // @skip-minify
                                                    if (_canIncludeHeaders(name)) {
                                                        responseHeaderMap[name] = value;
                                                    }
                                                });
    
                                                ajaxResponse.headerMap = responseHeaderMap;
                                            }
    
                                            return ajaxResponse;
                                        });
    
                                        return response;
                                    })
                                        .catch((reason: any) => {
                                            _reportFetchMetrics(callDetails, 0, input, null, fetchData, null, { error: reason.message || dumpObj(reason) });
                                            throw reason;
                                        });
                                }
                            }
                        },
                        // Create an error callback to report any hook errors
                        hkErr: _createErrorCallbackFunc(_self, _eInternalMessageId.FailedMonitorAjaxOpen,
                            "Failed to monitor Window.fetch" + ERROR_POSTFIX)
                    }, true, isWebWorker()));

                    _fetchInitialized = true;
                } else if (isPolyfill) {
                    // If fetch is a polyfill we need to capture the request to ensure that we correctly track
                    // disabled request URLS (i.e. internal urls) to ensure we don't end up in a constant loop
                    // of reporting ourselves, for example React Native uses a polyfill for fetch
                    // Note: Polyfill implementations that don't support the "poyyfill" tag are not supported
                    // the workaround is to add a polyfill property to your fetch implementation before initializing
                    // App Insights
                    _addHook(InstrumentFunc(global, STR_FETCH, {
                        ns: _evtNamespace,
                        req: (callDetails: IInstrumentCallDetails, input, init) => {
                            // Just call so that we record any disabled URL
                            _isDisabledRequest(null, input, init);
                        }
                    }));
                }

                if (isPolyfill) {
                    // retag the instrumented fetch with the same polyfill settings this is mostly for testing
                    // But also supports multiple App Insights usages
                    (global[STR_FETCH] as any).polyfill = isPolyfill;
                }
            }

            function _hookProto(target: any, funcName: string, callbacks: IInstrumentHooksCallbacks) {
                _addHook(InstrumentProto(target, funcName, callbacks));
            }

            function _instrumentXhr():void {
                if (_supportsAjaxMonitoring(_self, _ajaxDataId) && !_disableAjaxTracking && !_xhrInitialized) {
                    // Instrument open
                    _hookProto(XMLHttpRequest, "open", {
                        ns: _evtNamespace,
                        req: (callDetails: IInstrumentCallDetails, method:string, url:string, async?:boolean) => {
                            if (!_disableAjaxTracking) {
                                let xhr = callDetails.inst as XMLHttpRequestInstrumented;
                                let ajaxData = _getAjaxData(xhr, _ajaxDataId);
                                if (!_isDisabledRequest(xhr, url) && _isMonitoredXhrInstance(xhr, ajaxData, true)) {
                                    if (!ajaxData || !ajaxData.xhrMonitoringState.openDone) {
                                        // Only create a single ajaxData (even when multiple AI instances are running)
                                        ajaxData = _openHandler(xhr, method, url, async);
                                    }
    
                                    // always attach to the on ready state change (required for handling multiple instances)
                                    _attachToOnReadyStateChange(xhr, ajaxData);
                                }
                            }
                        },
                        hkErr: _createErrorCallbackFunc(_self, _eInternalMessageId.FailedMonitorAjaxOpen,
                            ERROR_HEADER + ".open" + ERROR_POSTFIX)
                    });

                    // Instrument send
                    _hookProto(XMLHttpRequest, "send", {
                        ns: _evtNamespace,
                        req: (callDetails: IInstrumentCallDetails, context?: Document | BodyInit | null) => {
                            if (!_disableAjaxTracking) {
                                let xhr = callDetails.inst as XMLHttpRequestInstrumented;
                                let ajaxData = _getAjaxData(xhr, _ajaxDataId);
                                if (_isMonitoredXhrInstance(xhr, ajaxData) && !ajaxData.xhrMonitoringState.sendDone) {
                                    _createMarkId("xhr", ajaxData);
                                    ajaxData.requestSentTime = dateTimeUtilsNow();
                                    _self.includeCorrelationHeaders(ajaxData, undefined, undefined, xhr);
                                    ajaxData.xhrMonitoringState.sendDone = true;
                                }
                            }
                        },
                        hkErr: _createErrorCallbackFunc(_self, _eInternalMessageId.FailedMonitorAjaxSend,
                            ERROR_HEADER + ERROR_POSTFIX)
                    });

                    // Instrument abort
                    _hookProto(XMLHttpRequest, "abort", {
                        ns: _evtNamespace,
                        req: (callDetails: IInstrumentCallDetails) => {
                            if (!_disableAjaxTracking) {
                                let xhr = callDetails.inst as XMLHttpRequestInstrumented;
                                let ajaxData = _getAjaxData(xhr, _ajaxDataId);
                                if (_isMonitoredXhrInstance(xhr, ajaxData) && !ajaxData.xhrMonitoringState.abortDone) {
                                    ajaxData.aborted = 1;
                                    ajaxData.xhrMonitoringState.abortDone = true;
                                }
                            }
                        },
                        hkErr: _createErrorCallbackFunc(_self, _eInternalMessageId.FailedMonitorAjaxAbort,
                            ERROR_HEADER + ".abort" + ERROR_POSTFIX)
                    });

                    // Instrument setRequestHeader
                    _hookProto(XMLHttpRequest, "setRequestHeader", {
                        ns: _evtNamespace,
                        req: (callDetails: IInstrumentCallDetails, header: string, value: string) => {
                            if (!_disableAjaxTracking) {
                                let xhr = callDetails.inst as XMLHttpRequestInstrumented;
                                let ajaxData = _getAjaxData(xhr, _ajaxDataId);
                                if (ajaxData && _isMonitoredXhrInstance(xhr, ajaxData)) {
                                    _addSharedXhrHeaders(xhr, header, value);
                                    if (_enableRequestHeaderTracking && _canIncludeHeaders(header)) {
                                        if (ajaxData) {
                                            ajaxData.requestHeaders[header] = value;
                                        }
                                    }
                                }
                            }
                        },
                        hkErr: _createErrorCallbackFunc(_self, _eInternalMessageId.FailedMonitorAjaxSetRequestHeader,
                            ERROR_HEADER + ".setRequestHeader" + ERROR_POSTFIX)
                    });

                    _xhrInitialized = true;
                }
            }

            function _isDisabledRequest(xhr?: XMLHttpRequestInstrumented, request?: Request | string, init?: RequestInit) {
                let isDisabled = false;
                let theUrl:string = ((!isString(request) ? ((request ||{}) as Request).url || "" : request as string) ||"").toLowerCase();

                // check excludeRequestFromAutoTrackingPatterns before stripping off any query string
                arrForEach(_excludeRequestFromAutoTrackingPatterns, (regex: string | RegExp) => {
                    let theRegex = regex;
                    if (isString(regex)) {
                        theRegex = new RegExp(regex);
                    }

                    if (!isDisabled) {
                        isDisabled = (theRegex as RegExp).test(theUrl);
                    }
                });

                // if request url matches with exclude regex pattern, return true and no need to check for headers
                if (isDisabled) {
                    return isDisabled;
                }

                let idx = _indexOf(theUrl, "?");
                let idx2 = _indexOf(theUrl, "#");
                if (idx === -1 || (idx2 !== -1 && idx2 < idx)) {
                    idx = idx2;
                }
                if (idx !== -1) {
                    // Strip off any Query string
                    theUrl = theUrl.substring(0, idx);
                }

                // check that this instance is not not used by ajax call performed inside client side monitoring to send data to collector
                if (!isNullOrUndefined(xhr)) {
                    // Look on the XMLHttpRequest of the URL string value
                    isDisabled = xhr[DisabledPropertyName] === true || theUrl[DisabledPropertyName] === true;
                } else if (!isNullOrUndefined(request)) { // fetch
                    // Look for DisabledPropertyName in either Request or RequestInit
                    isDisabled = (typeof request === "object" ? request[DisabledPropertyName] === true : false) ||
                            (init ? init[DisabledPropertyName] === true : false);
                }

                // Also add extra check just in case the XHR or fetch objects where not decorated with the DisableProperty due to sealing or freezing
                if (!isDisabled && theUrl && isInternalApplicationInsightsEndpoint(theUrl)) {
                    isDisabled = true;
                }

                if (isDisabled) {
                    // Add the disabled url if not present
                    if (!_disabledUrls[theUrl]) {
                        _disabledUrls[theUrl] = 1;
                    }
                } else {
                    // Check to see if the url is listed as disabled
                    if (_disabledUrls[theUrl]) {
                        isDisabled = true;
                    }
                }

                return isDisabled;
            }

            /// <summary>Verifies that particular instance of XMLHttpRequest needs to be monitored</summary>
            /// <param name="excludeAjaxDataValidation">Optional parameter. True if ajaxData must be excluded from verification</param>
            /// <returns type="bool">True if instance needs to be monitored, otherwise false</returns>
            function _isMonitoredXhrInstance(xhr: XMLHttpRequestInstrumented, ajaxData: ajaxRecord, excludeAjaxDataValidation?: boolean): boolean {
                let ajaxValidation = true;
                let initialized = _xhrInitialized;
                if (!isNullOrUndefined(xhr)) {
                    ajaxValidation = excludeAjaxDataValidation === true || !isNullOrUndefined(ajaxData);
                }

                // checking to see that all interested functions on xhr were instrumented
                return initialized
                    // checking on ajaxData to see that it was not removed in user code
                    && ajaxValidation;
            }

            function _getDistributedTraceCtx(): IDistributedTraceContext {
                let distributedTraceCtx: IDistributedTraceContext = null;
                if (_self.core && _self.core.getTraceCtx) {
                    distributedTraceCtx = _self.core.getTraceCtx(false);
                }

                // Fall back
                if (!distributedTraceCtx && _context && _context.telemetryTrace) {
                    distributedTraceCtx = createDistributedTraceContextFromTrace(_context.telemetryTrace);
                }

                return distributedTraceCtx;
            }

            function _openHandler(xhr: XMLHttpRequestInstrumented, method: string, url: string, async: boolean): ajaxRecord {
                let distributedTraceCtx: IDistributedTraceContext = _getDistributedTraceCtx();

                const traceID = (distributedTraceCtx && distributedTraceCtx.getTraceId()) || generateW3CId();
                const spanID = generateW3CId().substr(0, 16);

                let xhrRequestData = xhr[AJAX_DATA_CONTAINER] = (xhr[AJAX_DATA_CONTAINER] || { xh:[], i: {}});
                let ajaxDataCntr = xhrRequestData.i = (xhrRequestData.i || { });
                const ajaxData = ajaxDataCntr[_ajaxDataId] = (ajaxDataCntr[_ajaxDataId] || new ajaxRecord(traceID, spanID, _self[strDiagLog](), _self.core?.getTraceCtx()));

                ajaxData.traceFlags = distributedTraceCtx && distributedTraceCtx.getTraceFlags();
                ajaxData.method = method;
                ajaxData.requestUrl = url;
                ajaxData.xhrMonitoringState.openDone = true;
                ajaxData.requestHeaders = {};
                ajaxData.async = async;
                ajaxData.errorStatusText = _enableAjaxErrorStatusText;

                return ajaxData;
            }

            function _attachToOnReadyStateChange(xhr: XMLHttpRequestInstrumented, ajaxData: ajaxRecord) {
                ajaxData.xhrMonitoringState.stateChangeAttached = eventOn(xhr, "readystatechange", () => {
                    try {
                        if (xhr && xhr.readyState === 4 && _isMonitoredXhrInstance(xhr, ajaxData)) {
                            _onAjaxComplete(xhr);
                        }
                    } catch (e) {
                        const exceptionText = dumpObj(e);

                        // ignore messages with c00c023f, as this a known IE9 XHR abort issue
                        if (!exceptionText || _indexOf(exceptionText.toLowerCase(), "c00c023f") === -1) {
                            _throwInternalCritical(_self,
                                _eInternalMessageId.FailedMonitorAjaxRSC,
                                ERROR_HEADER + " 'readystatechange' event handler" + ERROR_POSTFIX,
                                {
                                    ajaxDiagnosticsMessage: _getFailedAjaxDiagnosticsMessage(xhr, _ajaxDataId),
                                    exception: exceptionText
                                });
                        }
                    }
                }, _evtNamespace);
            }

            function _getResponseText(xhr: XMLHttpRequestInstrumented) {
                try {
                    const responseType = xhr.responseType;
                    if (responseType === "" || responseType === "text") {
                        // As per the specification responseText is only valid if the type is an empty string or "text"
                        return xhr.responseText;
                    }
                } catch (e) {
                    // This shouldn't happen because of the above check -- but just in case, so just ignore
                }

                return null;
            }

            function _onAjaxComplete(xhr: XMLHttpRequestInstrumented) {
                let ajaxData = _getAjaxData(xhr, _ajaxDataId);
                ajaxData.responseFinishedTime = dateTimeUtilsNow();
                ajaxData.status = xhr.status;

                function _reportXhrError(e: any, failedProps?:Object) {
                    let errorProps = failedProps||{};
                    errorProps["ajaxDiagnosticsMessage"] = _getFailedAjaxDiagnosticsMessage(xhr, _ajaxDataId);
                    if (e) {
                        errorProps["exception"]  = dumpObj(e);
                    }

                    _throwInternalWarning(_self,
                        _eInternalMessageId.FailedMonitorAjaxDur,
                        FAILED_TO_CALCULATE_DURATION_ERROR + "ajax call" + ERROR_NOT_SENT,
                        errorProps
                    );
                }

                _findPerfResourceEntry("xmlhttprequest", ajaxData, () => {
                    try {
                        const dependency = ajaxData.CreateTrackItem("Ajax", _enableRequestHeaderTracking, () => {
                            let ajaxResponse:IAjaxRecordResponse = {
                                statusText: xhr.statusText,
                                headerMap: null,
                                correlationContext: _getAjaxCorrelationContext(xhr),
                                type: xhr.responseType,
                                responseText: _getResponseText(xhr),
                                response: xhr.response
                            };

                            if (_enableResponseHeaderTracking) {
                                const headers = xhr.getAllResponseHeaders();
                                if (headers) {
                                    // xhr.getAllResponseHeaders() method returns all the response headers, separated by CRLF, as a string or null
                                    // the regex converts the header string into an array of individual headers
                                    const arr = strTrim(headers).split(/[\r\n]+/);
                                    const responseHeaderMap = {};
                                    arrForEach(arr, (line) => {
                                        const parts = line.split(": ");
                                        const header = parts.shift();
                                        const value = parts.join(": ");
                                        if(_canIncludeHeaders(header)) {
                                            responseHeaderMap[header] = value;
                                        }
                                    });

                                    ajaxResponse.headerMap = responseHeaderMap;
                                }
                            }

                            return ajaxResponse;
                        });

                        let properties;
                        try {
                            if (!!_addRequestContext) {
                                properties = _addRequestContext({status: xhr.status, xhr});
                            }
                        } catch (e) {
                            _throwInternalWarning(_self,
                                _eInternalMessageId.FailedAddingCustomDefinedRequestContext,
                                CUSTOM_REQUEST_CONTEXT_ERROR);
                        }

                        if (dependency) {
                            if (properties !== undefined) {
                                dependency.properties = {...dependency.properties, ...properties};
                            }

                            let sysProperties = ajaxData.getPartAProps();
                            _reportDependencyInternal(_dependencyInitializers, _self.core, ajaxData, dependency, null, sysProperties);
                        } else {
                            _reportXhrError(null, {
                                requestSentTime: ajaxData.requestSentTime,
                                responseFinishedTime: ajaxData.responseFinishedTime
                            });
                        }
                    } finally {
                        // cleanup telemetry data
                        try {
                            let xhrRequestData = (xhr[AJAX_DATA_CONTAINER] || { i: {}});
                            let ajaxDataCntr = (xhrRequestData.i || { });
                            if (ajaxDataCntr[_ajaxDataId]) {
                                ajaxDataCntr[_ajaxDataId] = null;
                            }
                        } catch (e) {
                            // May throw in environments that prevent extension or freeze xhr
                        }
                    }
                }, (e) => {
                    _reportXhrError(e, null);
                });
            }

            function _getAjaxCorrelationContext(xhr: XMLHttpRequestInstrumented) {
                try {
                    const responseHeadersString = xhr.getAllResponseHeaders();
                    if (responseHeadersString !== null) {
                        const index = _indexOf(responseHeadersString.toLowerCase(), RequestHeaders[eRequestHeaders.requestContextHeaderLowerCase]);
                        if (index !== -1) {
                            const responseHeader = xhr.getResponseHeader(RequestHeaders[eRequestHeaders.requestContextHeader]);
                            return CorrelationIdHelper.getCorrelationContext(responseHeader);
                        }
                    }
                } catch (e) {
                    _throwInternalWarning(_self,
                        _eInternalMessageId.FailedMonitorAjaxGetCorrelationHeader,
                        CORRELATION_HEADER_ERROR,
                        {
                            ajaxDiagnosticsMessage: _getFailedAjaxDiagnosticsMessage(xhr, _ajaxDataId),
                            exception: dumpObj(e)
                        });
                }
            }

            function _createMarkId(type:string, ajaxData:ajaxRecord) {
                if (ajaxData.requestUrl && _markPrefix && _enableAjaxPerfTracking) {
                    let performance = getPerformance();
                    if (performance && isFunction(performance.mark)) {
                        _markCount++;
                        let markId = _markPrefix + type + "#" + _markCount;
                        performance.mark(markId);
                        let entries = performance.getEntriesByName(markId);
                        if (entries && entries.length === 1) {
                            ajaxData.perfMark = entries[0] as any;
                        }
                    }
                }
            }

            function _findPerfResourceEntry(initiatorType:string, ajaxData:ajaxRecord, trackCallback:() => void, reportError:(e:any) => void): void {
                let perfMark = ajaxData.perfMark;
                let performance = getPerformance();

                let maxAttempts = _config.maxAjaxPerfLookupAttempts;
                let retryDelay = _config.ajaxPerfLookupDelay;
                let requestUrl = ajaxData.requestUrl;
                let attempt = 0;
                (function locateResourceTiming() {
                    try {
                        if (performance && perfMark) {
                            attempt++;
                            let perfTiming:PerformanceResourceTiming = null;
                            let entries = performance.getEntries();
                            for (let lp = entries.length - 1; lp >= 0; lp--) {
                                let entry:PerformanceEntry = entries[lp];
                                if (entry) {
                                    if (entry.entryType === "resource") {
                                        if ((entry as PerformanceResourceTiming).initiatorType === initiatorType &&
                                                (_indexOf(entry.name, requestUrl) !== -1 || _indexOf(requestUrl, entry.name) !== -1)) {

                                            perfTiming = entry as PerformanceResourceTiming;
                                        }
                                    } else if (entry.entryType === "mark" && entry.name === perfMark.name) {
                                        // We hit the start event
                                        ajaxData.perfTiming = perfTiming;
                                        break;
                                    }

                                    if (entry.startTime < perfMark.startTime - 1000) {
                                        // Fallback to try and reduce the time spent looking for the perf entry
                                        break;
                                    }
                                }
                            }
                        }

                        if (!perfMark ||                // - we don't have a perfMark or
                            ajaxData.perfTiming ||      // - we have not found the perf entry or
                            attempt >= maxAttempts ||   // - we have tried too many attempts or
                            ajaxData.async === false) { // - this is a sync request

                            if (perfMark && isFunction(performance.clearMarks)) {
                                // Remove the mark so we don't fill up the performance resources too much
                                performance.clearMarks(perfMark.name);
                            }

                            ajaxData.perfAttempts = attempt;

                            // just continue and report the track event
                            trackCallback();
                        } else {
                            // We need to wait for the browser to populate the window.performance entry
                            // This needs to be at least 1ms as waiting <= 1 (on firefox) is not enough time for fetch or xhr,
                            // this is a scheduling issue for the browser implementation
                            setTimeout(locateResourceTiming, retryDelay);
                        }
                    } catch (e) {
                        reportError(e);
                    }
                })();
            }

            function _createFetchRecord(input?: Request | string, init?: RequestInit): ajaxRecord {
                let distributedTraceCtx: IDistributedTraceContext = _getDistributedTraceCtx();

                const traceID = (distributedTraceCtx && distributedTraceCtx.getTraceId()) || generateW3CId();
                const spanID = generateW3CId().substr(0, 16);

                let ajaxData = new ajaxRecord(traceID, spanID, _self[strDiagLog](), _self.core?.getTraceCtx());
                ajaxData.traceFlags = distributedTraceCtx && distributedTraceCtx.getTraceFlags();
                ajaxData.requestSentTime = dateTimeUtilsNow();
                ajaxData.errorStatusText = _enableAjaxErrorStatusText;

                if (input instanceof Request) {
                    ajaxData.requestUrl = input ? input.url : "";
                } else {
                    ajaxData.requestUrl = input;
                }

                let method = "GET";
                if (init && init.method) {
                    method = init.method;
                } else if (input && input instanceof Request) {
                    method = input.method;
                }
                ajaxData.method = method;

                let requestHeaders = {};
                if (_enableRequestHeaderTracking) {
                    let headers = new Headers((init ? init.headers : 0) || (input instanceof Request ? (input.headers || {}) : {}));
                    headers.forEach((value, key) => {       // @skip-minify
                        if (_canIncludeHeaders(key)) {
                            requestHeaders[key] = value;
                        }
                    });
                }

                ajaxData.requestHeaders = requestHeaders;

                _createMarkId(STR_FETCH, ajaxData);

                return ajaxData;
            }

            function _getFailedFetchDiagnosticsMessage(input: Request | Response | string): string {
                let result: string = "";
                try {
                    if (!isNullOrUndefined(input)) {
                        if (isString(input)) {
                            result += `(url: '${input}')`;
                        } else {
                            result += `(url: '${input.url}')`;
                        }
                    }
                } catch (e) {
                    _throwInternalCritical(_self,
                        _eInternalMessageId.FailedMonitorAjaxOpen,
                        "Failed to grab failed fetch diagnostics message",
                        { exception: dumpObj(e) }
                    );
                }
                return result;
            }

            function _reportFetchMetrics(callDetails: IInstrumentCallDetails, status: number, input: Request, response: Response | string, ajaxData: ajaxRecord, getResponse:() => IAjaxRecordResponse, properties?: { [key: string]: any }): void {
                if (!ajaxData) {
                    return;
                }

                function _reportFetchError(msgId: _eInternalMessageId, e: any, failedProps?:Object) {
                    let errorProps = failedProps||{};
                    errorProps["fetchDiagnosticsMessage"] = _getFailedFetchDiagnosticsMessage(input);
                    if (e) {
                        errorProps["exception"]  = dumpObj(e);
                    }

                    _throwInternalWarning(_self,
                        msgId,
                        FAILED_TO_CALCULATE_DURATION_ERROR + "fetch call" + ERROR_NOT_SENT,
                        errorProps
                    );
                }
                ajaxData.responseFinishedTime = dateTimeUtilsNow();
                ajaxData.status = status;

                _findPerfResourceEntry(STR_FETCH, ajaxData, () => {
                    const dependency = ajaxData.CreateTrackItem("Fetch", _enableRequestHeaderTracking, getResponse);
                    
                    let properties;
                    try {
                        if (!!_addRequestContext) {
                            properties = _addRequestContext({status, request: input, response});
                        }
                    } catch (e) {
                        _throwInternalWarning(_self,
                            _eInternalMessageId.FailedAddingCustomDefinedRequestContext,
                            CUSTOM_REQUEST_CONTEXT_ERROR);
                    }
                    
                    if (dependency) {
                        if (properties !== undefined) {
                            dependency.properties = {...dependency.properties, ...properties};
                        }

                        let sysProperties = ajaxData.getPartAProps();
                        _reportDependencyInternal(_dependencyInitializers, _self.core, ajaxData, dependency, null, sysProperties);
                    } else {
                        _reportFetchError(_eInternalMessageId.FailedMonitorAjaxDur, null,
                            {
                                requestSentTime: ajaxData.requestSentTime,
                                responseFinishedTime: ajaxData.responseFinishedTime
                            });
                    }
                }, (e) => {
                    _reportFetchError(_eInternalMessageId.FailedMonitorAjaxGetCorrelationHeader, e, null);
                });
            }

            function _getFetchCorrelationContext(response: Response): string {
                if (response && response.headers) {
                    try {
                        const responseHeader: string = response.headers.get(RequestHeaders[eRequestHeaders.requestContextHeader]);
                        return CorrelationIdHelper.getCorrelationContext(responseHeader);
                    } catch (e) {
                        _throwInternalWarning(_self,
                            _eInternalMessageId.FailedMonitorAjaxGetCorrelationHeader,
                            CORRELATION_HEADER_ERROR,
                            {
                                fetchDiagnosticsMessage: _getFailedFetchDiagnosticsMessage(response),
                                exception: dumpObj(e)
                            });
                    }
                }
            }

            function _reportDependencyInternal(
                initializers: _IInternalDependencyHandler<DependencyInitializerFunction>[],
                core: IAppInsightsCore,
                ajaxData: ajaxRecord,
                dependency: IDependencyTelemetry,
                properties?: { [key: string]: any },
                systemProperties?: { [key: string]: any }
            ) {
            
                let result = true;
                var initializersCount = initializers.length;
                if (initializersCount > 0) {
                    let details: IDependencyInitializerDetails = {
                        item: dependency,
                        properties: properties,
                        sysProperties: systemProperties,
                        context: ajaxData ? ajaxData.context : null,
                        aborted: ajaxData ? !!ajaxData.aborted : false
                    };
                
                    result = _processDependencyContainer(core, initializers, details, "initializer");
                }
            
                if (result) {
                    _self.trackDependencyDataInternal(dependency, properties, systemProperties);
                }
            }
        });
    }

    public initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public processTelemetry(item: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        this.processNext(item, itemCtx);
    }

    /**
     * Logs dependency call
     * @param dependencyData - dependency data object
     */
    public trackDependencyData(dependency: IDependencyTelemetry, properties?: { [key: string]: any }) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public includeCorrelationHeaders(ajaxData: ajaxRecord, input?: Request | string, init?: RequestInit, xhr?: XMLHttpRequestInstrumented): any {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Add an ajax listener which is called just prior to the request being sent and before the correlation headers are added, to allow you
     * to access the headers and modify the values used to generate the distributed tracing correlation headers.
     * @param dependencyListener - The Telemetry Initializer function
     * @returns - A IDependencyListenerHandler to enable the initializer to be removed
     */
    public addDependencyListener(dependencyListener: DependencyListenerFunction): IDependencyListenerHandler {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Add an dependency telemetry initializer callback function to allow populating additional properties or drop the request.
     * It is called after the dependency call has completed and any available performance details are available. A dependency
     * initializer is similar to the TelemetryInitializer function but it allows you to block the reporting of the dependency
     * request so that it doesn't count against the `maxAjaxCallsPerView`.
     * @param dependencyInitializer - The Dependency Telemetry Initializer function
     * @returns - A IDependencyInitializerHandler to enable the initializer to be removed
     */
    public addDependencyInitializer(dependencyInitializer: DependencyInitializerFunction): IDependencyInitializerHandler {
        return null;
    }

    /**
     * Protected function to allow sub classes the chance to add additional properties to the dependency event
     * before it's sent. This function calls track, so sub-classes must call this function after they have
     * populated their properties.
     * @param dependencyData - dependency data object
     */
    protected trackDependencyDataInternal(dependency: IDependencyTelemetry, properties?: { [key: string]: any }, systemProperties?: { [key: string]: any }) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}
