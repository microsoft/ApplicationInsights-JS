// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import type { IAjaxRecordInternal } from "./ajax";
import {
    Extensions, IDependencyTelemetry, IDiagnosticLogger, IDistributedTraceContext, arrForEach, dataSanitizeUrl, dateTimeUtilsDuration,
    isNullOrUndefined, isNumber, isString, msToTimeSpan, normalizeJsName, objForEachKey, objKeys, urlGetAbsoluteUrl, urlGetCompleteUrl
} from "@microsoft/applicationinsights-core-js";
import { mathRound } from "@nevware21/ts-utils";
import { STR_DURATION, STR_PROPERTIES } from "./InternalConstants";

// Type-only import to avoid circular dependency
export interface IAjaxRecordResponse {
    statusText: string,
    headerMap: Object,
    correlationContext: string,
    type?: string,
    responseText?: string,
    response?: Object
}

/** @ignore */
function _calcPerfDuration(resourceEntry:PerformanceResourceTiming, start:string, end:string) {
    let result = 0;
    let from = (resourceEntry as any)[start];
    let to = (resourceEntry as any)[end];
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
function _populatePerfData(ajaxData:IAjaxRecordInternal, dependency:IDependencyTelemetry) {
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

        var serverTiming = (resourceEntry as any)[strServerTiming];
        if (serverTiming) {
            let server: any = {};
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

        propsSet |= _setPerfValue(props, strTransferSize, (resourceEntry as any)[strTransferSize]);
        propsSet |= _setPerfValue(props, strEncodedBodySize, (resourceEntry as any)[strEncodedBodySize]);
        propsSet |= _setPerfValue(props, strDecodedBodySize, (resourceEntry as any)[strDecodedBodySize]);
    } else {
        if (ajaxData.perfMark) {
            propsSet |= _setPerfValue(props, "missing", ajaxData.perfAttempts);
        }
    }

    if (propsSet) {
        dependency.properties = props;
    }
}

/**
 * Interface defining the XHR monitoring state properties
 */
export interface IXHRMonitoringState {
    openDone: boolean;
    setRequestHeaderDone: boolean;
    sendDone: boolean;
    abortDone: boolean;
    
    // True, if onreadyStateChangeCallback function attached to xhr, otherwise false
    stateChangeAttached: boolean;
}

/**
 * Factory function to create an XHR monitoring state object
 * @returns An object implementing IXHRMonitoringState interface
 */
export function createXHRMonitoringState(): IXHRMonitoringState {
    return {
        openDone: false,
        setRequestHeaderDone: false,
        sendDone: false,
        abortDone: false,
        stateChangeAttached: false
    };
}

/**
 * Factory function to create an ajax record that implements IAjaxRecordInternal
 * @param traceCtx - The distributed trace context for the ajax request
 * @param logger - The diagnostic logger instance
 * @returns An object implementing IAjaxRecordInternal interface
 */
export function createAjaxRecord(traceCtx: IDistributedTraceContext, logger: IDiagnosticLogger): IAjaxRecordInternal {
    let _logger: IDiagnosticLogger = logger;

    // Create the ajax record object implementing IAjaxRecordInternal
    let ajaxRecord: IAjaxRecordInternal = {
        // Initialize all properties with default values
        perfMark: null,
        completed: false,
        requestHeadersSize: null,
        requestHeaders: null,
        responseReceivingDuration: null,
        callbackDuration: null,
        ajaxTotalDuration: null,
        aborted: 0,
        pageUrl: null,
        requestUrl: null,
        requestSize: 0,
        method: null,
        status: null,
        requestSentTime: null,
        responseStartedTime: null,
        responseFinishedTime: null,
        callbackFinishedTime: null,
        endTime: null,
        xhrMonitoringState: createXHRMonitoringState(),
        clientFailure: 0,
        traceCtx: traceCtx,
        perfTiming: null,

        getAbsoluteUrl: function(): string {
            return ajaxRecord.requestUrl ? urlGetAbsoluteUrl(ajaxRecord.requestUrl) : null;
        },

        getPathName: function(): string {
            return ajaxRecord.requestUrl ? dataSanitizeUrl(_logger, urlGetCompleteUrl(ajaxRecord.method, ajaxRecord.requestUrl)) : null;
        },

        CreateTrackItem: function(ajaxType: string, enableRequestHeaderTracking: boolean, getResponse: () => IAjaxRecordResponse): IDependencyTelemetry {
            // round to 3 decimal points
            ajaxRecord.ajaxTotalDuration = mathRound(dateTimeUtilsDuration(ajaxRecord.requestSentTime, ajaxRecord.responseFinishedTime) * 1000) / 1000;
            if (ajaxRecord.ajaxTotalDuration < 0) {
                return null;
            }

            let dependency = {
                // Always use the traceId and spanId from the traceCtx, this is the same as the
                // traceId and spanId used to create the ajaxRecord, this is to ensure that
                // the traceId and spanId are always the same for the ajaxRecord and the dependency
                // This is important for the distributed tracing to work correctly
                id: "|" + traceCtx.traceId + "." + traceCtx.spanId,
                target: ajaxRecord.getAbsoluteUrl(),
                name: ajaxRecord.getPathName(),
                type: ajaxType,
                startTime: null,
                duration: ajaxRecord.ajaxTotalDuration,
                success: (+(ajaxRecord.status)) >= 200 && (+(ajaxRecord.status)) < 400,
                responseCode: (+(ajaxRecord.status)),
                [STR_PROPERTIES]: { HttpMethod: ajaxRecord.method }
            } as IDependencyTelemetry;

            let props = dependency[STR_PROPERTIES];
            if (ajaxRecord.aborted) {
                props.aborted = true;
            }

            if (ajaxRecord.requestSentTime) {
                // Set the correct dependency start time
                dependency.startTime = new Date();
                dependency.startTime.setTime(ajaxRecord.requestSentTime);
            }

            // Add Ajax perf details if available
            _populatePerfData(this, dependency);

            if (enableRequestHeaderTracking) {
                if (objKeys(ajaxRecord.requestHeaders).length > 0) {
                    props.requestHeaders = ajaxRecord.requestHeaders;
                }
            }

            if (getResponse) {
                let response: IAjaxRecordResponse = getResponse();
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

                    if (ajaxRecord.errorStatusText) {
                        if ((+(ajaxRecord.status)) >= 400) {
                            const responseType = response.type;
                            if (responseType === "" || responseType === "text") {
                                props.responseText = response.responseText ? response.statusText + " - " + response.responseText : response.statusText;
                            }
                            if (responseType === "json") {
                                props.responseText = response.response ? response.statusText + " - " + JSON.stringify(response.response) : response.statusText;
                            }
                        } else if (ajaxRecord.status === 0) {
                            props.responseText = response.statusText || "";
                        }
                    }
                }
            }

            return dependency;
        },

        getPartAProps: function(): { [key: string]: any } {
            let partA: { [key: string]: any } = null;

            let parentCtx = ajaxRecord.traceCtx.parentCtx;
            if (parentCtx && (parentCtx.traceId || parentCtx.spanId)) {
                partA = {};
                let traceExt = partA[Extensions.TraceExt] = {
                    traceID: parentCtx.traceId,
                    parentID: parentCtx.spanId
                } as { [key: string]: any };

                if (!isNullOrUndefined(parentCtx.traceFlags)) {
                    traceExt.traceFlags = parentCtx.traceFlags;
                }
            }

            return partA;
        }
    };

    return ajaxRecord;
}
