// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { dataSanitizeUrl, dateTimeUtilsDuration, IDependencyTelemetry, urlGetAbsoluteUrl, urlGetCompleteUrl, msToTimeSpan } from "@microsoft/applicationinsights-common";
import { IDiagnosticLogger, objKeys, arrForEach, isNumber, isString, normalizeJsName, objForEachKey } from "@microsoft/applicationinsights-core-js";
import dynamicProto from "@microsoft/dynamicproto-js";

export interface IAjaxRecordResponse {
    statusText: string,
    headerMap: Object,
    correlationContext: string,
    type?: string,
    responseText?: string,
    response?: Object
}

let strProperties = "properties";

/** @ignore */
function _calcPerfDuration(resourceEntry:PerformanceResourceTiming, start:string, end:string) {
    let result = 0;
    let from = resourceEntry[start];
    let to = resourceEntry[end];
    if (from && to) {
        result = dateTimeUtilsDuration(from, to);
    }

    return result;
}

/** @ignore */
function _setPerfDuration(props:any, name:string, resourceEntry:PerformanceResourceTiming, start:string, end:string): number {
    let result = 0;
    let value = _calcPerfDuration(resourceEntry, start, end);
    if (value) {
        result = _setPerfValue(props, name, msToTimeSpan(value));
    }

    return result;
}

/** @ignore */
function _setPerfValue(props:any, name:string, value:any): number {
    let strPerf = "ajaxPerf";
    let result = 0;
    if (props && name && value) {
        let perfData = props[strPerf] = (props[strPerf] || {});
        perfData[name] = value;
        result = 1;
    }

    return result;
}

/** @ignore */
function _populatePerfData(ajaxData:ajaxRecord, dependency:IDependencyTelemetry) {
    /*
    * https://developer.mozilla.org/en-US/docs/Web/API/Resource_Timing_API/Using_the_Resource_Timing_API
    *  | -startTime
    *  | -redirectStart
    *  |            | -redirectEnd
    *  |            | | -fetchStart
    *  |            | |   | -domainLookupStart
    *  |            | |   |                |- domainLookupEnd
    *  |            | |   |                | | -connectStart
    *  |            | |   |                | |  | -secureConnectionStart
    *  |            | |   |                | |  |        | -connectEnd
    *  |            | |   |                | |  |        | | -requestStart
    *  |            | |   |                | |  |        | |           | | -responseStart
    *  |            | |   |                | |  |        | |           | |            | | -responseEnd
    *  +------------+-+---+----------------+-+--+--------+-+-----------+-+------------+-+
    *  |--redirect--| |---|--domainLookup--| |--connect--| |--request--| |--response--| |
    *  |-------------------networkConnect----------------|
    *  |                                                   |---------sentRequest--------|
    *  |------------------------------------perfTotal-----------------------------------|
    */

    let resourceEntry = ajaxData.perfTiming;
    let props = dependency[strProperties] || {};
    let propsSet = 0;
    let strName = "name";
    let strStart = "Start";
    let strEnd = "End";
    let strDomainLookup = "domainLookup";
    let strConnect = "connect";
    let strRedirect = "redirect";
    let strRequest = "request";
    let strResponse = "response";
    let strDuration = "duration";
    let strStartTime = "startTime";
    let strDomainLookupStart = strDomainLookup + strStart;
    let strDomainLookupEnd = strDomainLookup + strEnd;
    let strConnectStart = strConnect + strStart;
    let strConnectEnd = strConnect + strEnd;
    let strRequestStart = strRequest + strStart;
    let strRequestEnd = strRequest + strEnd;
    let strResponseStart = strResponse + strStart;
    let strResponseEnd = strResponse + strEnd;
    let strRedirectStart = strRedirect + strStart;
    let strRedirectEnd = strRedirect = strEnd;
    
    let strTransferSize = "transferSize";
    let strEncodedBodySize = "encodedBodySize";
    let strDecodedBodySize = "decodedBodySize";
    let strServerTiming = "serverTiming"
    
    if (resourceEntry) {
        // redirect
        propsSet |= _setPerfDuration(props, strRedirect, resourceEntry, strRedirectStart, strRedirectEnd);

        // domainLookup
        propsSet |= _setPerfDuration(props, strDomainLookup, resourceEntry, strDomainLookupStart, strDomainLookupEnd);

        // connect
        propsSet |= _setPerfDuration(props, strConnect, resourceEntry, strConnectStart, strConnectEnd);

        // request
        propsSet |= _setPerfDuration(props, strRequest, resourceEntry, strRequestStart, strRequestEnd);

        // response
        propsSet |= _setPerfDuration(props, strResponse, resourceEntry, strResponseStart, strResponseEnd);

        // Network connection time
        propsSet |= _setPerfDuration(props, "networkConnect", resourceEntry, strStartTime, strConnectEnd);

        // Sent Request
        propsSet |= _setPerfDuration(props, "sentRequest", resourceEntry, strRequestStart, strResponseEnd);

        // PerfTotal / Duration
        let duration = resourceEntry[strDuration];
        if (!duration) {
            duration = _calcPerfDuration(resourceEntry, strStartTime, strResponseEnd) || 0;
        }

        propsSet |= _setPerfValue(props, strDuration, duration);
        propsSet |= _setPerfValue(props, "perfTotal", duration);

        var serverTiming = resourceEntry[strServerTiming];
        if (serverTiming) {
            let server = {};
            arrForEach(serverTiming, (value, idx) => {
                let name = normalizeJsName(value[strName] || "" + idx);
                let newValue = server[name] || {};
                objForEachKey(value, (key, val) => {
                    if (key !== strName && isString(val) || isNumber(val)) {
                        if (newValue[key]) {
                            val = newValue[key] + ";" + val;
                        }
                        if (val || !isString(val)) {
                            // Only set the value if it has a value and it's not an empty string
                            newValue[key] = val;
                        }
                    }
                });
                server[name] = newValue;
            });
            propsSet |= _setPerfValue(props, strServerTiming, server);
        }

        propsSet |= _setPerfValue(props, strTransferSize, resourceEntry[strTransferSize])
        propsSet |= _setPerfValue(props, strEncodedBodySize, resourceEntry[strEncodedBodySize])
        propsSet |= _setPerfValue(props, strDecodedBodySize, resourceEntry[strDecodedBodySize])
    } else {
        if (ajaxData.perfMark) {
            propsSet |= _setPerfValue(props, "missing", ajaxData.perfAttempts);
        }
    }

    if (propsSet) {
        dependency[strProperties] = props;
    }
}

export class XHRMonitoringState {
    public openDone: boolean;
    public setRequestHeaderDone: boolean;
    public sendDone: boolean;
    public abortDone: boolean;

    // <summary>True, if onreadyStateChangeCallback function attached to xhr, otherwise false</summary>
    public stateChangeAttached: boolean;

    constructor() {
        let self = this;
        self.openDone = false;
        self.setRequestHeaderDone = false;
        self.sendDone = false;
        self.abortDone = false;
    
        // <summary>True, if onreadyStateChangeCallback function attached to xhr, otherwise false</summary>
        self.stateChangeAttached = false;
    }
}

export class ajaxRecord {
    public completed:boolean;
    public requestHeadersSize:number;
    public requestHeaders:any;
    public responseReceivingDuration:number;
    public callbackDuration:number;
    public ajaxTotalDuration:number;
    public aborted:number;
    public pageUrl:string;
    public requestUrl:string;
    public requestSize:number;
    public method:string;
    public perfMark:PerformanceMark;
    public perfTiming:PerformanceResourceTiming;
    public perfAttempts?:number;
    public async?:boolean;

    /// <summary>Should the Error Status text be included in the response</summary>
    public errorStatusText?:boolean;

    /// <summary>Returns the HTTP status code.</summary>
    public status:string|number;

    // <summary>The timestamp when open method was invoked</summary>
    public requestSentTime: number;

    // <summary>The timestamps when first byte was received</summary>
    public responseStartedTime: number;

    // <summary>The timestamp when last byte was received</summary>
    public responseFinishedTime: number;

    // <summary>The timestamp when onreadystatechange callback in readyState 4 finished</summary>
    public callbackFinishedTime: number;

    // <summary>The timestamp at which ajax was ended</summary>
    public endTime: number;

    public xhrMonitoringState: XHRMonitoringState;

    // <summary>Determines whether or not JavaScript exception occured in xhr.onreadystatechange code. 1 if occured, otherwise 0.</summary>
    public clientFailure: number;

    public traceID: string;
    public spanID: string;

    constructor(traceID: string, spanID: string, logger: IDiagnosticLogger) {
        let self = this;
        let _logger: IDiagnosticLogger = logger;
        let strResponseText = "responseText";

        // Assigning the initial/default values within the constructor to avoid typescript from creating a bunch of
        // this.XXXX = null
        self.perfMark = null;
        self.completed = false;
        self.requestHeadersSize = null;
        self.requestHeaders = null;
        self.responseReceivingDuration = null;
        self.callbackDuration = null;
        self.ajaxTotalDuration = null;
        self.aborted = 0;
        self.pageUrl = null;
        self.requestUrl = null;
        self.requestSize = 0;
        self.method = null;
        self.status = null;
        self.requestSentTime = null;
        self.responseStartedTime = null;
        self.responseFinishedTime = null;
        self.callbackFinishedTime = null;
        self.endTime = null;
        self.xhrMonitoringState = new XHRMonitoringState();
        self.clientFailure = 0;

        self.traceID = traceID;
        self.spanID = spanID;

        dynamicProto(ajaxRecord, self, (self) => {
            self.getAbsoluteUrl= () => {
                return self.requestUrl ? urlGetAbsoluteUrl(self.requestUrl) : null;
            }
        
            self.getPathName = () => {
                return self.requestUrl ? dataSanitizeUrl(_logger, urlGetCompleteUrl(self.method, self.requestUrl)) : null;
            }
        
            self.CreateTrackItem = (ajaxType:string, enableRequestHeaderTracking:boolean, getResponse:() => IAjaxRecordResponse):IDependencyTelemetry => {
                // round to 3 decimal points
                self.ajaxTotalDuration = Math.round(dateTimeUtilsDuration(self.requestSentTime, self.responseFinishedTime) * 1000) / 1000;
                if (self.ajaxTotalDuration < 0) {
                    return null;
                }
        
                let dependency = {
                    id: "|" + self.traceID + "." + self.spanID,
                    target: self.getAbsoluteUrl(),
                    name: self.getPathName(),
                    type: ajaxType,
                    startTime: null,
                    duration: self.ajaxTotalDuration,
                    success: (+(self.status)) >= 200 && (+(self.status)) < 400,
                    responseCode: (+(self.status)),
                    method: self.method,
                    [strProperties]: { HttpMethod: self.method }
                } as IDependencyTelemetry;

                if (self.requestSentTime) {
                    // Set the correct dependency start time
                    dependency.startTime = new Date();
                    dependency.startTime.setTime(self.requestSentTime);
                }
        
                // Add Ajax perf details if available
                _populatePerfData(self, dependency);
        
                if (enableRequestHeaderTracking) {
                    if (objKeys(self.requestHeaders).length > 0) {
                        dependency[strProperties] = dependency[strProperties] || {};
                        dependency[strProperties].requestHeaders = self.requestHeaders;
                    }
                }
        
                if (getResponse) {
                    let response:IAjaxRecordResponse = getResponse();
                    if (response) {
        
                        // enrich dependency target with correlation context from the server
                        const correlationContext = response.correlationContext;
                        if (correlationContext) {
                            dependency.correlationContext = /* dependency.target + " | " + */ correlationContext;
                        }
        
                        if (response.headerMap) {
                            if (objKeys(response.headerMap).length > 0) {
                                dependency[strProperties] = dependency[strProperties] || {};
                                dependency[strProperties].responseHeaders = response.headerMap;
                            }
                        }
        
                        if (self.errorStatusText && self.status >= 400) {
                            const responseType = response.type;
                            dependency[strProperties] = dependency[strProperties] || {};
                            if (responseType === "" || responseType === "text") {
                                dependency[strProperties][strResponseText] = response[strResponseText] ? response.statusText + " - " + response[strResponseText] : response.statusText;
                            }
                            if (responseType === "json") {
                                dependency[strProperties][strResponseText] = response.response ? response.statusText + " - " + JSON.stringify(response.response) : response.statusText;
                            }
                        }
                    }
                }
        
                return dependency;
            }
        });
    }

    public getAbsoluteUrl(): string {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    public getPathName(): string {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    public CreateTrackItem(ajaxType:string, enableRequestHeaderTracking:boolean, getResponse:() => IAjaxRecordResponse):IDependencyTelemetry {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }
}

