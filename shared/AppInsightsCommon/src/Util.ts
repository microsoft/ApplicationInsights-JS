// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    IDiagnosticLogger, IDistributedTraceContext, TransportType, arrForEach, arrIndexOf, dateNow, getPerformance, isNullOrUndefined,
    isValidSpanId, isValidTraceId
} from "@microsoft/applicationinsights-core-js";
import { isArray, isNumber, strIndexOf } from "@nevware21/ts-utils";
import { DEFAULT_BREEZE_ENDPOINT, DEFAULT_BREEZE_PATH } from "./Constants";
import { ITelemetryTrace } from "./Interfaces/Context/ITelemetryTrace";
import { ICorrelationConfig } from "./Interfaces/ICorrelationConfig";
import { IXDomainRequest } from "./Interfaces/IXDomainRequest";
import { RequestHeaders, eRequestHeaders } from "./RequestResponseHeaders";
import { dataSanitizeString } from "./Telemetry/Common/DataSanitizer";
import { urlParseFullHost, urlParseUrl } from "./UrlHelperFuncs";

// listing only non-geo specific locations
const _internalEndpoints: string[] = [
    DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH,
    "https://breeze.aimon.applicationinsights.io" + DEFAULT_BREEZE_PATH,
    "https://dc-int.services.visualstudio.com" + DEFAULT_BREEZE_PATH
];

let _correlationIdPrefix: string = "cid-v1:";

export function isInternalApplicationInsightsEndpoint(endpointUrl: string): boolean {
    return arrIndexOf(_internalEndpoints, endpointUrl.toLowerCase()) !== -1;
}

export function correlationIdSetPrefix(prefix: string) {
    _correlationIdPrefix = prefix;
}

export function correlationIdGetPrefix() {
    return _correlationIdPrefix;
}

/**
 * Checks if a request url is not on a excluded domain list and if it is safe to add correlation headers.
 * Headers are always included if the current domain matches the request domain. If they do not match (CORS),
 * they are regex-ed across correlationHeaderDomains and correlationHeaderExcludedDomains to determine if headers are included.
 * Some environments don't give information on currentHost via window.location.host (e.g. Cordova). In these cases, the user must
 * manually supply domains to include correlation headers on. Else, no headers will be included at all.
 */
export function correlationIdCanIncludeCorrelationHeader(config: ICorrelationConfig, requestUrl: string, currentHost?: string) {
    if (!requestUrl || (config && config.disableCorrelationHeaders)) {
        return false;
    }

    if (config && config.correlationHeaderExcludePatterns) {
        for (let i = 0; i < config.correlationHeaderExcludePatterns.length; i++) {
            if (config.correlationHeaderExcludePatterns[i].test(requestUrl)) {
                return false;
            }
        }
    }

    let requestHost = urlParseUrl(requestUrl).host.toLowerCase();
    if (requestHost && (strIndexOf(requestHost, ":443") !== -1 || strIndexOf(requestHost, ":80") !== -1)) {
        // [Bug #1260] IE can include the port even for http and https URLs so if present
        // try and parse it to remove if it matches the default protocol port
        requestHost = (urlParseFullHost(requestUrl, true) || "").toLowerCase();
    }

    if ((!config || !config.enableCorsCorrelation) && (requestHost && requestHost !== currentHost)) {
        return false;
    }

    const includedDomains = config && config.correlationHeaderDomains;
    if (includedDomains) {
        let matchExists: boolean;
        arrForEach(includedDomains, (domain) => {
            const regex = new RegExp(domain.toLowerCase().replace(/\\/g, "\\\\").replace(/\./g, "\\.").replace(/\*/g, ".*"));
            matchExists = matchExists || regex.test(requestHost);
        });

        if (!matchExists) {
            return false;
        }
    }

    const excludedDomains = config && config.correlationHeaderExcludedDomains;
    if (!excludedDomains || excludedDomains.length === 0) {
        return true;
    }

    for (let i = 0; i < excludedDomains.length; i++) {
        const regex = new RegExp(excludedDomains[i].toLowerCase().replace(/\\/g, "\\\\").replace(/\./g, "\\.").replace(/\*/g, ".*"));
        if (regex.test(requestHost)) {
            return false;
        }
    }

    // if we don't know anything about the requestHost, require the user to use included/excludedDomains.
    // Previously we always returned false for a falsy requestHost
    return requestHost && requestHost.length > 0;
}

/**
 * Combines target appId and target role name from response header.
 */
export function correlationIdGetCorrelationContext(responseHeader: string) {
    if (responseHeader) {
        const correlationId = correlationIdGetCorrelationContextValue(responseHeader, RequestHeaders[eRequestHeaders.requestContextTargetKey]);
        if (correlationId && correlationId !== _correlationIdPrefix) {
            return correlationId;
        }
    }
}

/**
 * Gets key from correlation response header
 */
export function correlationIdGetCorrelationContextValue(responseHeader: string, key: string) {
    if (responseHeader) {
        const keyValues = responseHeader.split(",");
        for (let i = 0; i < keyValues.length; ++i) {
            const keyValue = keyValues[i].split("=");
            if (keyValue.length === 2 && keyValue[0] === key) {
                return keyValue[1];
            }
        }
    }
}

export function AjaxHelperParseDependencyPath(logger: IDiagnosticLogger, absoluteUrl: string, method: string, commandName: string) {
    let target, name = commandName, data = commandName;

    if (absoluteUrl && absoluteUrl.length > 0) {
        const parsedUrl: HTMLAnchorElement = urlParseUrl(absoluteUrl);
        target = parsedUrl.host;
        if (!name) {
            if (parsedUrl.pathname != null) {
                let pathName: string = (parsedUrl.pathname.length === 0) ? "/" : parsedUrl.pathname;
                if (pathName.charAt(0) !== "/") {
                    pathName = "/" + pathName;
                }
                data = parsedUrl.pathname;
                name = dataSanitizeString(logger, method ? method + " " + pathName : pathName);
            } else {
                name = dataSanitizeString(logger, absoluteUrl);
            }
        }
    } else {
        target = commandName;
        name = commandName;
    }

    return {
        target,
        name,
        data
    };
}

export function dateTimeUtilsNow() {
    // returns the window or webworker performance object
    let perf = getPerformance();
    if (perf && perf.now && perf.timing) {
        let now = perf.now() + perf.timing.navigationStart;
        // Known issue with IE where this calculation can be negative, so if it is then ignore and fallback
        if (now > 0) {
            return now;
        }
    }

    return dateNow();
}

export function dateTimeUtilsDuration(start: number, end: number): number {
    let result = null;
    if (start !== 0 && end !== 0 && !isNullOrUndefined(start) && !isNullOrUndefined(end)) {
        result = end - start;
    }

    return result;
}

/**
 * Creates a IDistributedTraceContext from an optional telemetryTrace
 * @param telemetryTrace - The telemetryTrace instance that is being wrapped
 * @param parentCtx - An optional parent distributed trace instance, almost always undefined as this scenario is only used in the case of multiple property handlers.
 * @returns A new IDistributedTraceContext instance that is backed by the telemetryTrace or temporary object
 */
export function createDistributedTraceContextFromTrace(telemetryTrace?: ITelemetryTrace, parentCtx?: IDistributedTraceContext): IDistributedTraceContext {
    let trace: ITelemetryTrace = telemetryTrace || {};

    return {
        getName: (): string => {
            return trace.name;
        },
        setName: (newValue: string): void => {
            parentCtx && parentCtx.setName(newValue);
            trace.name = newValue;
        },
        getTraceId: (): string => {
            return trace.traceID;
        },
        setTraceId: (newValue: string): void => {
            parentCtx && parentCtx.setTraceId(newValue);
            if (isValidTraceId(newValue)) {
                trace.traceID = newValue
            }
        },
        getSpanId: (): string => {
            return trace.parentID;
        },
        setSpanId: (newValue: string): void => {
            parentCtx && parentCtx.setSpanId(newValue);
            if (isValidSpanId(newValue)) {
                trace.parentID = newValue
            }
        },
        getTraceFlags: (): number => {
            return trace.traceFlags;
        },
        setTraceFlags: (newTraceFlags?: number): void => {
            parentCtx && parentCtx.setTraceFlags(newTraceFlags);
            trace.traceFlags = newTraceFlags
        }
    };
}


export function getResponseText(xhr: XMLHttpRequest | IXDomainRequest) {
    try {
        return xhr.responseText;
    } catch (e) {
        // Best effort, as XHR may throw while XDR wont so just ignore
    }

    return null;
}

export function formatErrorMessageXdr(xdr: IXDomainRequest, message?: string): string {
    if (xdr) {
        return "XDomainRequest,Response:" + getResponseText(xdr) || "";
    }

    return message;
}

export function formatErrorMessageXhr(xhr: XMLHttpRequest, message?: string): string {
    if (xhr) {
        return "XMLHttpRequest,Status:" + xhr.status + ",Response:" + getResponseText(xhr) || xhr.response || "";
    }

    return message;
}

export function prependTransports(theTransports: TransportType[], newTransports: TransportType | TransportType[]) {
    if (newTransports) {
        if (isNumber(newTransports)) {
            theTransports = [newTransports as TransportType].concat(theTransports);
        } else if (isArray(newTransports)) {
            theTransports = newTransports.concat(theTransports);
        }
    }
    return theTransports;
}
