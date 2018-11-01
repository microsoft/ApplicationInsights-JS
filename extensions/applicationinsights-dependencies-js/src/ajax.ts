// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    RequestHeaders, Util, CorrelationIdHelper, TelemetryItemCreator, ICorrelationConfig,
    RemoteDependencyData, DateTimeUtils, DisabledPropertyName, Data, IDependencyTelemetry
} from '@microsoft/applicationinsights-common';
import {
    CoreUtils, LoggingSeverity, _InternalMessageId, IDiagnosticLogger,
    IAppInsightsCore, ITelemetryPlugin, IConfiguration, IPlugin, ITelemetryItem
} from '@microsoft/applicationinsights-core-js';
import { ajaxRecord } from './ajaxRecord';
import { EventHelper } from './ajaxUtils';

export interface XMLHttpRequestInstrumented extends XMLHttpRequest {
    ajaxData: ajaxRecord;
}

export interface IDependenciesPlugin {
    trackDependencyData(dependency: IDependencyTelemetry, properties?: { [key: string]: any }, systemProperties?: { [key: string]: any });
}

export class AjaxMonitor implements ITelemetryPlugin, IDependenciesPlugin {
    private currentWindowHost;
    protected initialized: boolean; // ajax monitoring initialized
    protected _fetchInitialized: boolean; // fetch monitoring initialized
    protected _core: IAppInsightsCore;
    protected _config: ICorrelationConfig;
    protected _nextPlugin: ITelemetryPlugin;
    protected _trackAjaxAttempts: number = 0;
    protected addHeadersCB: (fetchData: ajaxRecord, input?: Request | string, init?: RequestInit, xhr?: XMLHttpRequestInstrumented) => any;

    constructor() {
        this.currentWindowHost = window && window.location.host && window.location.host.toLowerCase();
        this.initialized = false;
        this._fetchInitialized = false;
        this.addHeadersCB = this.includeCorrelationHeaders;
    }

    public setAddHeadersCB(CB: (fetchData: ajaxRecord, input?: Request | string, init?: RequestInit, xhr?: XMLHttpRequestInstrumented) => any) {
        this.addHeadersCB = CB;
    }

    ///<summary>Verifies that particalar instance of XMLHttpRequest needs to be monitored</summary>
    ///<param name="excludeAjaxDataValidation">Optional parameter. True if ajaxData must be excluded from verification</param>
    ///<returns type="bool">True if instance needs to be monitored, otherwise false</returns>
    private isMonitoredInstance(xhr: XMLHttpRequestInstrumented, excludeAjaxDataValidation?: boolean): boolean {

        // checking to see that all interested functions on xhr were instrumented
        return this.initialized

            // checking on ajaxData to see that it was not removed in user code
            && (excludeAjaxDataValidation === true || !CoreUtils.isNullOrUndefined(xhr.ajaxData))

            // check that this instance is not not used by ajax call performed inside client side monitoring to send data to collector
            && xhr[DisabledPropertyName] !== true;

    }

    ///<summary>Determines whether ajax monitoring can be enabled on this document</summary>
    ///<returns>True if Ajax monitoring is supported on this page, otherwise false</returns>
    private supportsMonitoring(): boolean {
        var result = true;
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
        var originalOpen = XMLHttpRequest.prototype.open;
        var ajaxMonitorInstance = this;
        XMLHttpRequest.prototype.open = function (method, url, async) {
            try {
                if (ajaxMonitorInstance.isMonitoredInstance(this, true) &&
                    (
                        !(<XMLHttpRequestInstrumented>this).ajaxData ||
                        !(<XMLHttpRequestInstrumented>this).ajaxData.xhrMonitoringState.openDone
                    )) {
                    ajaxMonitorInstance.openHandler(this, method, url, async);
                }
            } catch (e) {
                this._core.logger.throwInternal(
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
        /* todo:
        Disabling the following block of code as CV is not yet supported in 1DS for 3rd Part. 
        // this format corresponds with activity logic on server-side and is required for the correct correlation
        var id = "|" + this.appInsights.context.operation.id + "." + Util.newId();
        */
       var id = Util.newId();

        var ajaxData = new ajaxRecord(id, this._core.logger);
        ajaxData.method = method;
        ajaxData.requestUrl = url;
        ajaxData.xhrMonitoringState.openDone = true
        xhr.ajaxData = ajaxData;

        this.attachToOnReadyStateChange(xhr);
    }

    private static getFailedAjaxDiagnosticsMessage(xhr: XMLHttpRequestInstrumented): string {
        var result = "";
        try {
            if (!CoreUtils.isNullOrUndefined(xhr) &&
                !CoreUtils.isNullOrUndefined(xhr.ajaxData) &&
                !CoreUtils.isNullOrUndefined(xhr.ajaxData.requestUrl)) {
                result += "(url: '" + xhr.ajaxData.requestUrl + "')";
            }
        } catch (e) { }

        return result;
    }

    private instrumentSend() {
        var originalSend = XMLHttpRequest.prototype.send;
        var ajaxMonitorInstance = this;
        XMLHttpRequest.prototype.send = function (content) {
            try {
                if (ajaxMonitorInstance.isMonitoredInstance(this) && !(<XMLHttpRequestInstrumented>this).ajaxData.xhrMonitoringState.sendDone) {
                    ajaxMonitorInstance.sendHandler(this, content);
                }
            } catch (e) {
                this._core.logger.throwInternal(
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
        xhr = this.addHeadersCB(xhr.ajaxData, undefined, undefined, xhr);
        xhr.ajaxData.xhrMonitoringState.sendDone = true;
    }

    private instrumentAbort() {
        var originalAbort = XMLHttpRequest.prototype.abort;
        var ajaxMonitorInstance = this;
        XMLHttpRequest.prototype.abort = function () {
            try {
                if (ajaxMonitorInstance.isMonitoredInstance(this) && !(<XMLHttpRequestInstrumented>this).ajaxData.xhrMonitoringState.abortDone) {
                    (<XMLHttpRequestInstrumented>this).ajaxData.aborted = 1;
                    (<XMLHttpRequestInstrumented>this).ajaxData.xhrMonitoringState.abortDone = true;
                }
            } catch (e) {
                this._core.logger.throwInternal(
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

    private attachToOnReadyStateChange(xhr: XMLHttpRequestInstrumented) {
        var ajaxMonitorInstance = this;
        xhr.ajaxData.xhrMonitoringState.onreadystatechangeCallbackAttached = EventHelper.AttachEvent(xhr, "readystatechange", () => {
            try {
                if (ajaxMonitorInstance.isMonitoredInstance(xhr)) {
                    if (xhr.readyState === 4) {
                        ajaxMonitorInstance.onAjaxComplete(xhr);
                    }
                }
            } catch (e) {
                var exceptionText = Util.dump(e);

                // ignore messages with c00c023f, as this a known IE9 XHR abort issue
                if (!exceptionText || exceptionText.toLowerCase().indexOf("c00c023f") == -1) {
                    this._core.logger.throwInternal(
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
        }
        else {
            var dependency = <IDependencyTelemetry>{
                id: xhr.ajaxData.id,
                absoluteUrl: xhr.ajaxData.getAbsoluteUrl(),
                commandName: xhr.ajaxData.getPathName(),
                duration: xhr.ajaxData.ajaxTotalDuration,
                success:(+(xhr.ajaxData.status)) >= 200 && (+(xhr.ajaxData.status)) < 400,
                resultCode: +xhr.ajaxData.status,
                method: xhr.ajaxData.method
            };

            // enrich dependency target with correlation context from the server
            var correlationContext = this.getCorrelationContext(xhr);
            if (correlationContext) {
                dependency.correlationContext = /* dependency.target + " | " + */ correlationContext;
            }

            this.trackDependencyData(dependency);

            xhr.ajaxData = null;
        }
    }

    private getCorrelationContext(xhr: XMLHttpRequestInstrumented) {
        try {
            var responseHeadersString = xhr.getAllResponseHeaders();
            if (responseHeadersString !== null) {
                var index = responseHeadersString.toLowerCase().indexOf(RequestHeaders.requestContextHeaderLowerCase);
                if (index !== -1) {
                    var responseHeader = xhr.getResponseHeader(RequestHeaders.requestContextHeader);
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

    /**
     * Logs dependency call
     * @param dependencyData dependency data object
     */
    public trackDependencyData(dependency: IDependencyTelemetry, properties?: { [key: string]: any }, systemProperties?: { [key: string]: any }) {
        if (this._config.maxAjaxCallsPerView === -1 || this._trackAjaxAttempts < this._config.maxAjaxCallsPerView) {
            let item = TelemetryItemCreator.create<IDependencyTelemetry>(
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

    public processTelemetry(item: ITelemetryItem) {
        if (this._nextPlugin && this._nextPlugin.processTelemetry) {
            this._nextPlugin.processTelemetry(item);
        }
    }

    public identifier: string = "AjaxDependencyPlugin";
    
    setNextPlugin(next: ITelemetryPlugin) {
        if (next) {
            this._nextPlugin = next;
        }
    }

    priority: number = 161;

    // Fetch Stuff
    protected instrumentFetch(): void {
        if (!this.supportsFetch() || this._fetchInitialized) {
            return;
        }
        const originalFetch: (input?: Request | string, init?: RequestInit) => Promise<Response> = window.fetch;
        const fetchMonitorInstance: AjaxMonitor = this;
        window.fetch = function fetch(input?: Request | string , init?: RequestInit): Promise<Response> {
            let fetchData: ajaxRecord;
            if (fetchMonitorInstance.isFetchInstrumented(input)) {
                try {
                    fetchData = fetchMonitorInstance.createFetchRecord(input, init);
                    init = fetchMonitorInstance.addHeadersCB(fetchData, input, init);
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
        /* todo:
        Disabling the following block of code as CV is not yet supported in 1DS for 3rd Part. 
        // this format corresponds with activity logic on server-side and is required for the correct correlation
        var id = "|" + this.appInsights.context.operation.id + "." + Util.newId();
        */
        const id: string = Util.newId();
        let ajaxData: ajaxRecord = new ajaxRecord(id, this._core.logger);
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
        return ajaxData;
    }

    private includeCorrelationHeaders(ajaxData: ajaxRecord, input?: Request | string, init?: RequestInit, xhr?: XMLHttpRequestInstrumented) {
        if (input) { // Fetch
            if (CorrelationIdHelper.canIncludeCorrelationHeader(this._config, ajaxData.getAbsoluteUrl(), this.currentWindowHost)) {
                if (!init) {
                    init = {};
                }
                // init headers override original request headers
                // so, if they exist use only them, otherwise use request's because they should have been applied in the first place
                // not using original request headers will result in them being lost
                init.headers = new Headers(init.headers || (input instanceof Request ? (input.headers || {}) : {}));
                init.headers.set(RequestHeaders.requestIdHeader, ajaxData.id);
                // let appId: string = this.appInsights.context ? this.appInsights.context.appId() : null;
                // if (appId) {
                //     init.headers.set(RequestHeaders.requestContextHeader, RequestHeaders.requestContextAppIdFormat + appId);
                // }

                return init;
            }
        } else if (xhr) { // XHR
            if (this.currentWindowHost && CorrelationIdHelper.canIncludeCorrelationHeader(this._config, xhr.ajaxData.getAbsoluteUrl(),
                this.currentWindowHost)) {
                xhr.setRequestHeader(RequestHeaders.requestIdHeader, xhr.ajaxData.id);
                var appId = this._config.appId; // Todo: also, get appId from channel as breeze returns it
                if (appId) {
                    xhr.setRequestHeader(RequestHeaders.requestContextHeader, RequestHeaders.requestContextAppIdFormat + appId);
                }
            }

            return xhr;
        }
        return undefined;
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
                {exception: Util.dump(e)}
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
                let dependency: IDependencyTelemetry = {
                    id: ajaxData.id,
                    absoluteUrl: ajaxData.getAbsoluteUrl(),
                    commandName: ajaxData.getPathName(),
                    duration: ajaxData.ajaxTotalDuration,
                    success: response.status >= 200 && response.status < 400,
                    resultCode: response.status,
                    method: ajaxData.method
                };

                // enrich dependency target with correlation context from the server
                let correlationContext: string = this.getFetchCorrelationContext(response);
                if (correlationContext) {
                    dependency.correlationContext = correlationContext;
                }

                this.trackDependencyData(dependency);
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
                let dependency: IDependencyTelemetry = {
                    id: ajaxData.id,
                    absoluteUrl: ajaxData.getAbsoluteUrl(),
                    commandName: ajaxData.getPathName(),
                    duration: ajaxData.ajaxTotalDuration,
                    success: false,
                    resultCode: 0,
                    method: ajaxData.method
                };
                
                this.trackDependencyData(dependency, { error: reason.message });
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
            let responseHeader: string = response.headers.get(RequestHeaders.requestContextHeader);
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

    protected instrumentXhr() {
        if (this.supportsMonitoring() || this.initialized) {
            this.instrumentOpen();
            this.instrumentSend();
            this.instrumentAbort();
            this.initialized = true;
        }
    }
    
    public initialize(config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[]) {
        if (!this.initialized && !this._fetchInitialized) {
            this._core = core;
            config.extensionConfig = config.extensionConfig ? config.extensionConfig : {};
            let c = config.extensionConfig[this.identifier] ? config.extensionConfig[this.identifier] : {};
            this._config = {
                maxAjaxCallsPerView: !isNaN(c.maxAjaxCallsPerView) ? c.maxAjaxCallsPerView : 500,
                disableAjaxTracking: Util.stringToBoolOrDefault(c.disableAjaxTracking),
                disableFetchTracking: Util.stringToBoolOrDefault(c.disableFetchTracking, true),
                disableCorrelationHeaders: Util.stringToBoolOrDefault(c.disableCorrelationHeaders),
                correlationHeaderExcludedDomains: c.correlationHeaderExcludedDomains || [
                    "*.blob.core.windows.net",
                    "*.blob.core.chinacloudapi.cn",
                    "*.blob.core.cloudapi.de",
                    "*.blob.core.usgovcloudapi.net"],
                appId: c.appId,
                enableCorsCorrelation: Util.stringToBoolOrDefault(c.enableCorsCorrelation)
            };

            if (this._config.disableAjaxTracking === false) {
                this.instrumentXhr();
            }

            if (!this._config.disableFetchTracking === false) {
                this.instrumentFetch();
            }
        }
    }
}
