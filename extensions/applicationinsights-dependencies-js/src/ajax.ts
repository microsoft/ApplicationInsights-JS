// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    RequestHeaders, Util, CorrelationIdHelper, TelemetryItemCreator, ICorrelationConfig,
    RemoteDependencyData, DateTimeUtils, DisabledPropertyName, Data, IDependencyTelemetry,
    IConfig, ConfigurationManager, ITelemetryContext, PropertiesPluginIdentifier, IPropertiesPlugin, DistributedTracingModes
} from '@microsoft/applicationinsights-common';
import {
    CoreUtils, LoggingSeverity, _InternalMessageId, IDiagnosticLogger,
    IAppInsightsCore, ITelemetryPlugin, IConfiguration, IPlugin, ITelemetryItem
} from '@microsoft/applicationinsights-core-js';
import { ajaxRecord } from './ajaxRecord';
import { EventHelper } from './ajaxUtils';
import { Traceparent } from './TraceParent';


export interface XMLHttpRequestInstrumented extends XMLHttpRequest {
    ajaxData: ajaxRecord;
}

export interface IDependenciesPlugin {
    trackDependencyData(dependency: IDependencyTelemetry);
}

export interface IInstrumentationRequirements extends IDependenciesPlugin {
    includeCorrelationHeaders: (ajaxData: ajaxRecord, input?: Request | string, init?: RequestInit, xhr?: XMLHttpRequestInstrumented) => any;
}

export class AjaxMonitor implements ITelemetryPlugin, IDependenciesPlugin, IInstrumentationRequirements {

    public static identifier: string = "AjaxDependencyPlugin";

    public static getDefaultConfig(): ICorrelationConfig {
        const config: ICorrelationConfig = {
            maxAjaxCallsPerView: 500,
            disableAjaxTracking: false,
            disableFetchTracking: true,
            disableCorrelationHeaders: false,
            distributedTracingMode: DistributedTracingModes.AI,
            correlationHeaderExcludedDomains: [
                "*.blob.core.windows.net",
                "*.blob.core.chinacloudapi.cn",
                "*.blob.core.cloudapi.de",
                "*.blob.core.usgovcloudapi.net"],
            correlationHeaderDomains: undefined,
            appId: undefined,
            enableCorsCorrelation: false,
            enableRequestHeaderTracking: false,
            enableResponseHeaderTracking: false
        }
        return config;
    }

    public static getEmptyConfig(): ICorrelationConfig {
        return {
            maxAjaxCallsPerView: undefined,
            disableAjaxTracking: undefined,
            disableFetchTracking: undefined,
            disableCorrelationHeaders: undefined,
            distributedTracingMode: undefined,
            correlationHeaderExcludedDomains: undefined,
            appId: undefined,
            enableCorsCorrelation: undefined,
            correlationHeaderDomains: undefined,
            enableRequestHeaderTracking: undefined,
            enableResponseHeaderTracking: undefined
        }
    }

    private static getFailedAjaxDiagnosticsMessage(xhr: XMLHttpRequestInstrumented): string {
        let result = "";
        try {
            if (!CoreUtils.isNullOrUndefined(xhr) &&
                !CoreUtils.isNullOrUndefined(xhr.ajaxData) &&
                !CoreUtils.isNullOrUndefined(xhr.ajaxData.requestUrl)) {
                result += "(url: '" + xhr.ajaxData.requestUrl + "')";
            }
        } catch (e) { }

        return result;
    }
    public identifier: string = AjaxMonitor.identifier;

    priority: number = 120;
    protected initialized: boolean; // ajax monitoring initialized
    protected _fetchInitialized: boolean; // fetch monitoring initialized
    protected _core: IAppInsightsCore;
    protected _config: ICorrelationConfig;
    protected _nextPlugin: ITelemetryPlugin;
    protected _trackAjaxAttempts: number = 0;
    private currentWindowHost;
    private _context: ITelemetryContext;
    private _isUsingW3CHeaders: boolean;
    private _isUsingAIHeaders: boolean;

    constructor() {
        this.currentWindowHost = window && window.location && window.location.host && window.location.host.toLowerCase();
        this.initialized = false;
        this._fetchInitialized = false;
    }

    trackDependencyData(dependency: IDependencyTelemetry, properties?: { [key: string]: any }) {
        this.trackDependencyDataInternal(dependency, properties);
    }

    public processTelemetry(item: ITelemetryItem) {
        if (this._nextPlugin && this._nextPlugin.processTelemetry) {
            this._nextPlugin.processTelemetry(item);
        }
    }

    setNextPlugin(next: ITelemetryPlugin) {
        if (next) {
            this._nextPlugin = next;
        }
    }

    public includeCorrelationHeaders(ajaxData: ajaxRecord, input?: Request | string, init?: RequestInit, xhr?: XMLHttpRequestInstrumented): any {
        if (input) { // Fetch
            if (CorrelationIdHelper.canIncludeCorrelationHeader(this._config, ajaxData.getAbsoluteUrl(), this.currentWindowHost)) {
                if (!init) {
                    init = {};
                }
                // init headers override original request headers
                // so, if they exist use only them, otherwise use request's because they should have been applied in the first place
                // not using original request headers will result in them being lost
                init.headers = new Headers(init.headers || (input instanceof Request ? (input.headers || {}) : {}));
                if (this._isUsingAIHeaders) {
                    const id = "|" + ajaxData.traceID + "." + ajaxData.spanID;
                    init.headers.set(RequestHeaders.requestIdHeader, id);
                    if (this._config.enableRequestHeaderTracking) {
                        ajaxData.requestHeaders[RequestHeaders.requestIdHeader] = id;
                    }
                }
                const appId: string = this._config.appId || this._context.appId();
                if (appId) {
                    init.headers.set(RequestHeaders.requestContextHeader, RequestHeaders.requestContextAppIdFormat + appId);
                    if (this._config.enableRequestHeaderTracking) {
                        ajaxData.requestHeaders[RequestHeaders.requestContextHeader] = RequestHeaders.requestContextAppIdFormat + appId;
                    }
                }
                if (this._isUsingW3CHeaders) {
                    const traceparent = new Traceparent(ajaxData.traceID, ajaxData.spanID);
                    init.headers.set(RequestHeaders.traceParentHeader, traceparent.toString());
                    if (this._config.enableRequestHeaderTracking) {
                        ajaxData.requestHeaders[RequestHeaders.traceParentHeader] = traceparent.toString();
                    }
                }
                return init;
            }
            return init;
        } else if (xhr) { // XHR
            if (this.currentWindowHost && CorrelationIdHelper.canIncludeCorrelationHeader(this._config, xhr.ajaxData.getAbsoluteUrl(),
                this.currentWindowHost)) {
                if (this._isUsingAIHeaders) {
                    const id = "|" + xhr.ajaxData.traceID + "." + xhr.ajaxData.spanID;
                    xhr.setRequestHeader(RequestHeaders.requestIdHeader, id);
                    if (this._config.enableRequestHeaderTracking) {
                        xhr.ajaxData.requestHeaders[RequestHeaders.requestIdHeader] = id;
                    }
                }
                const appId = this._config.appId || this._context.appId();
                if (appId) {
                    xhr.setRequestHeader(RequestHeaders.requestContextHeader, RequestHeaders.requestContextAppIdFormat + appId);
                    if (this._config.enableRequestHeaderTracking) {
                        xhr.ajaxData.requestHeaders[RequestHeaders.requestContextHeader] = RequestHeaders.requestContextAppIdFormat + appId;
                    }
                }
                if (this._isUsingW3CHeaders) {
                    const traceparent = new Traceparent(xhr.ajaxData.traceID, xhr.ajaxData.spanID);
                    xhr.setRequestHeader(RequestHeaders.traceParentHeader, traceparent.toString());
                    if (this._config.enableRequestHeaderTracking) {
                        xhr.ajaxData.requestHeaders[RequestHeaders.traceParentHeader] = traceparent.toString();
                    }
                }
            }

            return xhr;
        }
        return undefined;
    }

    public initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[]) {
        if (!this.initialized && !this._fetchInitialized) {
            this._core = core;
            const defaultConfig = AjaxMonitor.getDefaultConfig();
            this._config = AjaxMonitor.getEmptyConfig();
            for (const field in defaultConfig) {
                this._config[field] = ConfigurationManager.getConfig(config, field, AjaxMonitor.identifier, defaultConfig[field]);
            }

            this._isUsingAIHeaders = this._config.distributedTracingMode === DistributedTracingModes.AI || this._config.distributedTracingMode === DistributedTracingModes.AI_AND_W3C;
            this._isUsingW3CHeaders = this._config.distributedTracingMode === DistributedTracingModes.AI_AND_W3C || this._config.distributedTracingMode === DistributedTracingModes.W3C;

            if (this._config.disableAjaxTracking === false) {
                this.instrumentXhr();
            }

            if (this._config.disableFetchTracking === false) {
                this.instrumentFetch();
            }

            if (extensions.length > 0 && extensions) {
                let propExt, extIx = 0;
                while (!propExt && extIx < extensions.length) {
                    if (extensions[extIx] && extensions[extIx].identifier === PropertiesPluginIdentifier) {
                        propExt = extensions[extIx]
                    }
                    extIx++;
                }
                if (propExt) {
                    this._context = propExt.context; // we could move IPropertiesPlugin to common as well
                }
            }
        }
    }

    /**
     * Logs dependency call
     * @param dependencyData dependency data object
     */
    protected trackDependencyDataInternal(dependency: IDependencyTelemetry, properties?: { [key: string]: any }, systemProperties?: { [key: string]: any }) {
        if (this._config.maxAjaxCallsPerView === -1 || this._trackAjaxAttempts < this._config.maxAjaxCallsPerView) {
            const item = TelemetryItemCreator.create<IDependencyTelemetry>(
                dependency,
                RemoteDependencyData.dataType,
                RemoteDependencyData.envelopeType,
                this._core.logger,
                properties,
                systemProperties);

            this._core.track(item);
        } else if (this._trackAjaxAttempts === this._config.maxAjaxCallsPerView) {
            this._core.logger.throwInternal(LoggingSeverity.CRITICAL,
                _InternalMessageId.MaxAjaxPerPVExceeded,
                "Maximum ajax per page view limit reached, ajax monitoring is paused until the next trackPageView(). In order to increase the limit set the maxAjaxCallsPerView configuration parameter.",
                true);
        }

        ++this._trackAjaxAttempts;
    }

    // Fetch Stuff
    protected instrumentFetch(): void {
        if (!this.supportsFetch() || this._fetchInitialized) {
            return;
        }
        const originalFetch: (input?: Request | string, init?: RequestInit) => Promise<Response> = window.fetch;
        const fetchMonitorInstance: AjaxMonitor = this;
        window.fetch = function fetch(input?: Request | string, init?: RequestInit): Promise<Response> {
            let fetchData: ajaxRecord;
            if (fetchMonitorInstance.isFetchInstrumented(input) && fetchMonitorInstance.isMonitoredInstance(undefined, undefined, input, init)) {
                try {
                    fetchData = fetchMonitorInstance.createFetchRecord(input, init);
                    init = fetchMonitorInstance.includeCorrelationHeaders(fetchData, input, init);
                } catch (e) {
                    fetchMonitorInstance._core.logger.throwInternal(
                        LoggingSeverity.CRITICAL,
                        _InternalMessageId.FailedMonitorAjaxOpen,
                        "Failed to monitor Window.fetch, monitoring data for this fetch call may be incorrect.",
                        {
                            ajaxDiagnosticsMessage: this.getFailedFetchDiagnosticsMessage(input),
                            exception: Util.dump(e)
                        });
                }
            }
            return originalFetch(input, init)
                .then(response => {
                    fetchMonitorInstance.onFetchComplete(response, fetchData);
                    return response;
                })
                .catch(reason => {
                    fetchMonitorInstance.onFetchFailed(input, fetchData, reason);
                    throw reason;
                });
        }
        this._fetchInitialized = true;
    }

    protected instrumentXhr() {
        if (this.supportsAjaxMonitoring() && !this.initialized) {
            this.instrumentOpen();
            this.instrumentSend();
            this.instrumentAbort();
            this.instrumentSetRequestHeader();
            this.initialized = true;
        }
    }

    /// <summary>Verifies that particalar instance of XMLHttpRequest needs to be monitored</summary>
    /// <param name="excludeAjaxDataValidation">Optional parameter. True if ajaxData must be excluded from verification</param>
    /// <returns type="bool">True if instance needs to be monitored, otherwise false</returns>
    private isMonitoredInstance(xhr?: XMLHttpRequestInstrumented, excludeAjaxDataValidation?: boolean, request?: Request | string, init?: RequestInit): boolean {

        let disabledProperty = false;
        let ajaxValidation = true;
        let initialized = false;
        if (typeof request !== 'undefined') { // fetch
            initialized = this._fetchInitialized;
            // Look for DisabledPropertyName in either Request or RequestInit
            disabledProperty = (typeof request === 'object' ? request[DisabledPropertyName] === true : false) ||
                (init ? init[DisabledPropertyName] === true : false);
        } else if (typeof xhr !== 'undefined') {
            initialized = this.initialized;
            disabledProperty = xhr[DisabledPropertyName] === true;
            ajaxValidation = excludeAjaxDataValidation === true || !CoreUtils.isNullOrUndefined(xhr.ajaxData);
        }

        // checking to see that all interested functions on xhr were instrumented
        return initialized

            // checking on ajaxData to see that it was not removed in user code
            && ajaxValidation

            // check that this instance is not not used by ajax call performed inside client side monitoring to send data to collector
            && !disabledProperty;

    }

    /// <summary>Determines whether ajax monitoring can be enabled on this document</summary>
    /// <returns>True if Ajax monitoring is supported on this page, otherwise false</returns>
    private supportsAjaxMonitoring(): boolean {
        let result = true;
        if (CoreUtils.isNullOrUndefined(XMLHttpRequest) ||
            CoreUtils.isNullOrUndefined(XMLHttpRequest.prototype) ||
            CoreUtils.isNullOrUndefined(XMLHttpRequest.prototype.open) ||
            CoreUtils.isNullOrUndefined(XMLHttpRequest.prototype.send) ||
            CoreUtils.isNullOrUndefined(XMLHttpRequest.prototype.abort)) {
            result = false;
        }

        // disable in IE8 or older (https://www.w3schools.com/jsref/jsref_trim_string.asp)
        try {
            " a ".trim();
        } catch (ex) {
            result = false;
        }

        return result;
    }

    private instrumentOpen() {
        const originalOpen = XMLHttpRequest.prototype.open;
        const ajaxMonitorInstance = this;
        XMLHttpRequest.prototype.open = function (method, url, async) {
            try {
                if (ajaxMonitorInstance.isMonitoredInstance(this, true) &&
                    (
                        !(this as XMLHttpRequestInstrumented).ajaxData ||
                        !(this as XMLHttpRequestInstrumented).ajaxData.xhrMonitoringState.openDone
                    )) {
                    ajaxMonitorInstance.openHandler(this, method, url, async);
                }
            } catch (e) {
                ajaxMonitorInstance._core.logger.throwInternal(
                    LoggingSeverity.CRITICAL,
                    _InternalMessageId.FailedMonitorAjaxOpen,
                    "Failed to monitor XMLHttpRequest.open, monitoring data for this ajax call may be incorrect.",
                    {
                        ajaxDiagnosticsMessage: AjaxMonitor.getFailedAjaxDiagnosticsMessage(this),
                        exception: Util.dump(e)
                    });
            }

            return originalOpen.apply(this, arguments);
        };
    }

    private openHandler(xhr: XMLHttpRequestInstrumented, method, url, async) {
        const traceID = (this._context && this._context.telemetryTrace && this._context.telemetryTrace.traceID) || Util.generateW3CId();
        const spanID = Util.generateW3CId().substr(0, 16);

        const ajaxData = new ajaxRecord(traceID, spanID, this._core.logger);
        ajaxData.method = method;
        ajaxData.requestUrl = url;
        ajaxData.xhrMonitoringState.openDone = true;
        ajaxData.requestHeaders = {};
        xhr.ajaxData = ajaxData;

        this.attachToOnReadyStateChange(xhr);
    }

    private instrumentSend() {
        const originalSend = XMLHttpRequest.prototype.send;
        const ajaxMonitorInstance = this;
        XMLHttpRequest.prototype.send = function (content) {
            try {
                if (ajaxMonitorInstance.isMonitoredInstance(this) && !(this as XMLHttpRequestInstrumented).ajaxData.xhrMonitoringState.sendDone) {
                    ajaxMonitorInstance.sendHandler(this, content);
                }
            } catch (e) {
                ajaxMonitorInstance._core.logger.throwInternal(
                    LoggingSeverity.CRITICAL,
                    _InternalMessageId.FailedMonitorAjaxSend,
                    "Failed to monitor XMLHttpRequest, monitoring data for this ajax call may be incorrect.",
                    {
                        ajaxDiagnosticsMessage: AjaxMonitor.getFailedAjaxDiagnosticsMessage(this),
                        exception: Util.dump(e)
                    });
            }

            return originalSend.apply(this, arguments);
        };
    }

    private sendHandler(xhr: XMLHttpRequestInstrumented, content) {
        xhr.ajaxData.requestSentTime = DateTimeUtils.Now();
        xhr = this.includeCorrelationHeaders(xhr.ajaxData, undefined, undefined, xhr);
        xhr.ajaxData.xhrMonitoringState.sendDone = true;
    }

    private instrumentAbort() {
        const originalAbort = XMLHttpRequest.prototype.abort;
        const ajaxMonitorInstance = this;
        XMLHttpRequest.prototype.abort = function () {
            try {
                if (ajaxMonitorInstance.isMonitoredInstance(this) && !(this as XMLHttpRequestInstrumented).ajaxData.xhrMonitoringState.abortDone) {
                    (this as XMLHttpRequestInstrumented).ajaxData.aborted = 1;
                    (this as XMLHttpRequestInstrumented).ajaxData.xhrMonitoringState.abortDone = true;
                }
            } catch (e) {
                ajaxMonitorInstance._core.logger.throwInternal(
                    LoggingSeverity.CRITICAL,
                    _InternalMessageId.FailedMonitorAjaxAbort,
                    "Failed to monitor XMLHttpRequest.abort, monitoring data for this ajax call may be incorrect.",
                    {
                        ajaxDiagnosticsMessage: AjaxMonitor.getFailedAjaxDiagnosticsMessage(this),
                        exception: Util.dump(e)
                    });
            }

            return originalAbort.apply(this, arguments);
        };
    }

    private instrumentSetRequestHeader() {
        if (!this._config.enableRequestHeaderTracking) {
            return;
        }
        const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
        const ajaxMonitorInstance = this;
        XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
            try {
                if (ajaxMonitorInstance.isMonitoredInstance(this)) {
                    this.ajaxData.requestHeaders[header] = value;
                }
            } catch (e) {
                ajaxMonitorInstance._core.logger.throwInternal(
                    LoggingSeverity.CRITICAL,
                    _InternalMessageId.FailedMonitorAjaxSetRequestHeader,
                    "Failed to monitor XMLHttpRequest.setRequestHeader, monitoring data for this ajax call may be incorrect.",
                    {
                        ajaxDiagnosticsMessage: AjaxMonitor.getFailedAjaxDiagnosticsMessage(this),
                        exception: Util.dump(e)
                    });
            }

            return originalSetRequestHeader.apply(this, arguments);
        }
    }

    private attachToOnReadyStateChange(xhr: XMLHttpRequestInstrumented) {
        const ajaxMonitorInstance = this;
        xhr.ajaxData.xhrMonitoringState.onreadystatechangeCallbackAttached = EventHelper.AttachEvent(xhr, "readystatechange", () => {
            try {
                if (ajaxMonitorInstance.isMonitoredInstance(xhr)) {
                    if (xhr.readyState === 4) {
                        ajaxMonitorInstance.onAjaxComplete(xhr);
                    }
                }
            } catch (e) {
                const exceptionText = Util.dump(e);

                // ignore messages with c00c023f, as this a known IE9 XHR abort issue
                if (!exceptionText || exceptionText.toLowerCase().indexOf("c00c023f") === -1) {
                    ajaxMonitorInstance._core.logger.throwInternal(
                        LoggingSeverity.CRITICAL,
                        _InternalMessageId.FailedMonitorAjaxRSC,
                        "Failed to monitor XMLHttpRequest 'readystatechange' event handler, monitoring data for this ajax call may be incorrect.",
                        {
                            ajaxDiagnosticsMessage: AjaxMonitor.getFailedAjaxDiagnosticsMessage(xhr),
                            exception: Util.dump(e)
                        });
                }
            }
        });
    }

    private onAjaxComplete(xhr: XMLHttpRequestInstrumented) {
        xhr.ajaxData.responseFinishedTime = DateTimeUtils.Now();
        xhr.ajaxData.status = xhr.status;
        xhr.ajaxData.CalculateMetrics();

        if (xhr.ajaxData.ajaxTotalDuration < 0) {
            this._core.logger.throwInternal(
                LoggingSeverity.WARNING,
                _InternalMessageId.FailedMonitorAjaxDur,
                "Failed to calculate the duration of the ajax call, monitoring data for this ajax call won't be sent.",
                {
                    ajaxDiagnosticsMessage: AjaxMonitor.getFailedAjaxDiagnosticsMessage(xhr),
                    requestSentTime: xhr.ajaxData.requestSentTime,
                    responseFinishedTime: xhr.ajaxData.responseFinishedTime
                });
        } else {
            const dependency = {
                id: "|" + xhr.ajaxData.traceID + "." + xhr.ajaxData.spanID,
                target: xhr.ajaxData.getAbsoluteUrl(),
                name: xhr.ajaxData.getPathName(),
                type: "Ajax",
                duration: xhr.ajaxData.ajaxTotalDuration,
                success: (+(xhr.ajaxData.status)) >= 200 && (+(xhr.ajaxData.status)) < 400,
                responseCode: +xhr.ajaxData.status,
                method: xhr.ajaxData.method
            } as IDependencyTelemetry;

            // enrich dependency target with correlation context from the server
            const correlationContext = this.getAjaxCorrelationContext(xhr);
            if (correlationContext) {
                dependency.correlationContext = /* dependency.target + " | " + */ correlationContext;
            }

            if (this._config.enableRequestHeaderTracking) {
                if (Object.keys(xhr.ajaxData.requestHeaders).length > 0) {
                    dependency.properties = dependency.properties || {};
                    dependency.properties.requestHeaders = {};
                    dependency.properties.requestHeaders = xhr.ajaxData.requestHeaders;
                }
            }

            if (this._config.enableResponseHeaderTracking) { 
                const headers = xhr.getAllResponseHeaders();
                if (headers) {
                    // xhr.getAllResponseHeaders() method returns all the response headers, separated by CRLF, as a string or null
                    // the regex converts the header string into an array of individual headers
                    const arr = headers.trim().split(/[\r\n]+/);
                    const responseHeaderMap = {};
                    arr.forEach((line) => {
                        const parts = line.split(': ');
                        const header = parts.shift();
                        const value = parts.join(': ');
                        responseHeaderMap[header] = value;
                    });
                    if (Object.keys(responseHeaderMap).length > 0) {
                        dependency.properties = dependency.properties || {};
                        dependency.properties.responseHeaders = {};
                        dependency.properties.responseHeaders = responseHeaderMap;
                    }
                }
            }
            
            this.trackDependencyDataInternal(dependency);

            xhr.ajaxData = null;
        }
    }

    private getAjaxCorrelationContext(xhr: XMLHttpRequestInstrumented) {
        try {
            const responseHeadersString = xhr.getAllResponseHeaders();
            if (responseHeadersString !== null) {
                const index = responseHeadersString.toLowerCase().indexOf(RequestHeaders.requestContextHeaderLowerCase);
                if (index !== -1) {
                    const responseHeader = xhr.getResponseHeader(RequestHeaders.requestContextHeader);
                    return CorrelationIdHelper.getCorrelationContext(responseHeader);
                }
            }
        } catch (e) {
            this._core.logger.throwInternal(
                LoggingSeverity.WARNING,
                _InternalMessageId.FailedMonitorAjaxGetCorrelationHeader,
                "Failed to get Request-Context correlation header as it may be not included in the response or not accessible.",
                {
                    ajaxDiagnosticsMessage: AjaxMonitor.getFailedAjaxDiagnosticsMessage(xhr),
                    exception: Util.dump(e)
                });
        }
    }

    private isFetchInstrumented(input: Request | string): boolean {
        return this._fetchInitialized && input[DisabledPropertyName] !== true;
    }

    private supportsFetch(): boolean {
        let result: boolean = true;
        if (!window || CoreUtils.isNullOrUndefined((window as any).Request) ||
            CoreUtils.isNullOrUndefined((window as any).Request.prototype) ||
            CoreUtils.isNullOrUndefined(window.fetch)) {
            result = false;
        }
        return result;
    }

    private createFetchRecord(input?: Request | string, init?: RequestInit): ajaxRecord {
        const traceID = (this._context && this._context.telemetryTrace && this._context.telemetryTrace.traceID) || Util.generateW3CId();
        const spanID = Util.generateW3CId().substr(0, 16);

        const ajaxData = new ajaxRecord(traceID, spanID, this._core.logger);
        ajaxData.requestSentTime = DateTimeUtils.Now();

        if (input instanceof Request) {
            ajaxData.requestUrl = input ? input.url : "";
        } else {
            ajaxData.requestUrl = input;
        }

        if (init && init.method) {
            ajaxData.method = init.method;
        } else if (input && input instanceof Request) {
            ajaxData.method = input.method;
        } else {
            ajaxData.method = "GET";
        }

        if (init && init.headers && this._config.enableRequestHeaderTracking) {
            ajaxData.requestHeaders = init.headers;
        } else {
            ajaxData.requestHeaders = {};
        }
        return ajaxData;
    }

    private getFailedFetchDiagnosticsMessage(input: Request | Response | string): string {
        let result: string = "";
        try {
            if (!CoreUtils.isNullOrUndefined(input)) {
                if (typeof (input) === "string") {
                    result += `(url: '${input}')`;
                } else {
                    result += `(url: '${input.url}')`;
                }
            }
        } catch (e) {
            this._core.logger.throwInternal(
                LoggingSeverity.CRITICAL,
                _InternalMessageId.FailedMonitorAjaxOpen,
                "Failed to grab failed fetch diagnostics message",
                { exception: Util.dump(e) }
            );
        }
        return result;
    }

    private onFetchComplete(response: Response, ajaxData: ajaxRecord): void {
        if (!ajaxData) {
            return;
        }
        try {
            ajaxData.responseFinishedTime = DateTimeUtils.Now();
            ajaxData.CalculateMetrics();

            if (ajaxData.ajaxTotalDuration < 0) {
                this._core.logger.throwInternal(
                    LoggingSeverity.WARNING,
                    _InternalMessageId.FailedMonitorAjaxDur,
                    "Failed to calculate the duration of the fetch call, monitoring data for this fetch call won't be sent.",
                    {
                        fetchDiagnosticsMessage: this.getFailedFetchDiagnosticsMessage(response),
                        requestSentTime: ajaxData.requestSentTime,
                        responseFinishedTime: ajaxData.responseFinishedTime
                    });
            } else {
                const dependency: IDependencyTelemetry = {
                    id: "|" + ajaxData.traceID + "." + ajaxData.spanID,
                    target: ajaxData.getAbsoluteUrl(),
                    name: ajaxData.getPathName(),
                    type: "Fetch",
                    duration: ajaxData.ajaxTotalDuration,
                    success: response.status >= 200 && response.status < 400,
                    responseCode: response.status,
                    properties: { HttpMethod: ajaxData.method }
                };

                // enrich dependency target with correlation context from the server
                const correlationContext: string = this.getFetchCorrelationContext(response);
                if (correlationContext) {
                    dependency.correlationContext = correlationContext;
                }

                if (this._config.enableRequestHeaderTracking) {
                    if (Object.keys(ajaxData.requestHeaders).length > 0) {
                        dependency.properties = dependency.properties || {};
                        dependency.properties.requestHeaders = ajaxData.requestHeaders;
                    }               
                }

                if (this._config.enableResponseHeaderTracking) {          
                    const responseHeaderMap = {};
                    response.headers.forEach((value, name) => {
                        responseHeaderMap[name] = value;
                    });
                    if (Object.keys(responseHeaderMap).length > 0) {
                        dependency.properties = dependency.properties || {};
                        dependency.properties.responseHeaders = responseHeaderMap;
                    }
                }
                this.trackDependencyDataInternal(dependency);
            }
        } catch (e) {
            this._core.logger.throwInternal(
                LoggingSeverity.WARNING,
                _InternalMessageId.FailedMonitorAjaxGetCorrelationHeader,
                "Failed to calculate the duration of the fetch call, monitoring data for this fetch call won't be sent.",
                {
                    fetchDiagnosticsMessage: this.getFailedFetchDiagnosticsMessage(response),
                    exception: Util.dump(e)
                }
            );
        }
    }

    private onFetchFailed(input: Request | string, ajaxData: ajaxRecord, reason: any): void {
        if (!ajaxData) {
            return;
        }
        try {
            ajaxData.responseFinishedTime = DateTimeUtils.Now();
            ajaxData.CalculateMetrics();

            if (ajaxData.ajaxTotalDuration < 0) {
                this._core.logger.throwInternal(
                    LoggingSeverity.WARNING,
                    _InternalMessageId.FailedMonitorAjaxDur,
                    "Failed to calculate the duration of the failed fetch call, monitoring data for this fetch call won't be sent.",
                    {
                        fetchDiagnosticsMessage: this.getFailedFetchDiagnosticsMessage(input),
                        requestSentTime: ajaxData.requestSentTime,
                        responseFinishedTime: ajaxData.responseFinishedTime
                    });
            } else {
                const dependency: IDependencyTelemetry = {
                    id: "|" + ajaxData.traceID + "." + ajaxData.spanID,
                    target: ajaxData.getAbsoluteUrl(),
                    name: ajaxData.getPathName(),
                    type: "Fetch",
                    duration: ajaxData.ajaxTotalDuration,
                    success: false,
                    responseCode: 0,
                    properties: { HttpMethod: ajaxData.method }
                };

                this.trackDependencyDataInternal(dependency, { error: reason.message });
            }
        } catch (e) {
            this._core.logger.throwInternal(
                LoggingSeverity.WARNING,
                _InternalMessageId.FailedMonitorAjaxGetCorrelationHeader,
                "Failed to calculate the duration of the failed fetch call, monitoring data for this fetch call won't be sent.",
                {
                    fetchDiagnosticsMessage: this.getFailedFetchDiagnosticsMessage(input),
                    exception: Util.dump(e)
                });
        }
    }

    private getFetchCorrelationContext(response: Response): string {
        try {
            const responseHeader: string = response.headers.get(RequestHeaders.requestContextHeader);
            return CorrelationIdHelper.getCorrelationContext(responseHeader);
        } catch (e) {
            this._core.logger.throwInternal(
                LoggingSeverity.WARNING,
                _InternalMessageId.FailedMonitorAjaxGetCorrelationHeader,
                "Failed to get Request-Context correlation header as it may be not included in the response or not accessible.",
                {
                    fetchDiagnosticsMessage: this.getFailedFetchDiagnosticsMessage(response),
                    exception: Util.dump(e)
                });
        }
    }
}
