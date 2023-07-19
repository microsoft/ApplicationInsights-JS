// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import dynamicProto from "@microsoft/dynamicproto-js";
import {
    Extensions, IDependencyTelemetry, dataSanitizeUrl, dateTimeUtilsDuration, msToTimeSpan, urlGetAbsoluteUrl, urlGetCompleteUrl
} from "@microsoft/applicationinsights-common";
import {
    IDiagnosticLogger, IDistributedTraceContext, arrForEach, isNullOrUndefined, isNumber, isString, normalizeJsName, objForEachKey, objKeys
} from "@microsoft/applicationinsights-core-js";
import { STR_DURATION, STR_PROPERTIES } from "./InternalConstants";

export interface IAjaxRecordResponse {
    statusText: string,
    headerMap: Object,
    correlationContext: string,
    type?: string,
    responseText?: string,
    response?: Object
}

interface ITraceCtx {
    traceId: string;
    spanId: string;
    traceFlags: number;
}

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
    let props = dependency.properties || {};
    let propsSet = 0;
    let strName = "name";
    let strStart = "Start";
    let strEnd = "End";
    let strDomainLookup = "domainLookup";
    let strConnect = "connect";
    let strRedirect = "redirect";
    let strRequest = "request";
    let strResponse = "response";
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
    let strServerTiming = "serverTiming";
    
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
        let duration = resourceEntry.duration;
        if (!duration) {
            duration = _calcPerfDuration(resourceEntry, strStartTime, strResponseEnd) || 0;
        }

        propsSet |= _setPerfValue(props, STR_DURATION, duration);
        propsSet |= _setPerfValue(props, "perfTotal", duration);

        var serverTiming = resourceEntry[strServerTiming];
        if (serverTiming) {
            let server = {};
            arrForEach(serverTiming, (value, idx) => {
                let name = normalizeJsName(value[strName] || "" + idx);
                let newValue = server[name] || {};
                objForEachKey(value, (key, val: any) => {
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

        propsSet |= _setPerfValue(props, strTransferSize, resourceEntry[strTransferSize]);
        propsSet |= _setPerfValue(props, strEncodedBodySize, resourceEntry[strEncodedBodySize]);
        propsSet |= _setPerfValue(props, strDecodedBodySize, resourceEntry[strDecodedBodySize]);
    } else {
        if (ajaxData.perfMark) {
            propsSet |= _setPerfValue(props, "missing", ajaxData.perfAttempts);
        }
    }

    if (propsSet) {
        dependency.properties = props;
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

    // <summary>Determines whether or not JavaScript exception occurred in xhr.onreadystatechange code. 1 if occurred, otherwise 0.</summary>
    public clientFailure: number;

    /**
     * The traceId to use for the dependency call
     */
    public traceID: string;

    /**
     * The spanId to use for the dependency call
     */
    public spanID: string;

    /**
     * The traceFlags to use for the dependency call
     */
    public traceFlags?: number;

    /**
     * The trace context to use for reporting the remote dependency call
     */
    public eventTraceCtx: ITraceCtx;

    /**
     * The listener assigned context values that will be passed to any dependency initializer
     */
    public context?: { [key: string]: any };

    constructor(traceId: string, spanId: string, logger: IDiagnosticLogger, traceCtx?: IDistributedTraceContext) {
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

        self.traceID = traceId;
        self.spanID = spanId;
        self.traceFlags = traceCtx?.getTraceFlags();

        if (traceCtx) {
            self.eventTraceCtx = {
                traceId: traceCtx.getTraceId(),
                spanId: traceCtx.getSpanId(),
                traceFlags: traceCtx.getTraceFlags()
            };
        } else {
            self.eventTraceCtx = null;
        }

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
                    [STR_PROPERTIES]: { HttpMethod: self.method }
                } as IDependencyTelemetry;

                let props = dependency[STR_PROPERTIES];
                if (self.aborted) {
                    props.aborted = true;
                }

                if (self.requestSentTime) {
                    // Set the correct dependency start time
                    dependency.startTime = new Date();
                    dependency.startTime.setTime(self.requestSentTime);
                }
        
                // Add Ajax perf details if available
                _populatePerfData(self, dependency);
        
                if (enableRequestHeaderTracking) {
                    if (objKeys(self.requestHeaders).length > 0) {
                        props.requestHeaders = self.requestHeaders;
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
                                props.responseHeaders = response.headerMap;
                            }
                        }
        
                        if (self.errorStatusText) {
                            if (self.status >= 400) {
                                const responseType = response.type;
                                if (responseType === "" || responseType === "text") {
                                    props.responseText = response.responseText ? response.statusText + " - " + response[strResponseText] : response.statusText;
                                }
                                if (responseType === "json") {
                                    props.responseText = response.response ? response.statusText + " - " + JSON.stringify(response.response) : response.statusText;
                                }
                            } else if (self.status === 0) {
                                props.responseText = response.statusText || "";
                            }
                        }
                    }
                }
        
                return dependency;
            }

            self.getPartAProps = () => {
                let partA: { [key: string]: any } = null;

                let traceCtx = self.eventTraceCtx;
                if (traceCtx && (traceCtx.traceId || traceCtx.spanId)) {
                    partA = {};
                    let traceExt = partA[Extensions.TraceExt] = {
                        traceID: traceCtx.traceId,
                        parentID: traceCtx.spanId
                    } as  { [key: string]: any };

                    if (!isNullOrUndefined(traceCtx.traceFlags)) {
                        traceExt.traceFlags = traceCtx.traceFlags;
                    }
                }

                return partA
            };
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

    public getPartAProps(): { [key: string]: any } {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }
}
