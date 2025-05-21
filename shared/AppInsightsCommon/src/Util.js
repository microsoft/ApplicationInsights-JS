"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.isInternalApplicationInsightsEndpoint = isInternalApplicationInsightsEndpoint;
exports.correlationIdSetPrefix = correlationIdSetPrefix;
exports.correlationIdGetPrefix = correlationIdGetPrefix;
exports.correlationIdCanIncludeCorrelationHeader = correlationIdCanIncludeCorrelationHeader;
exports.correlationIdGetCorrelationContext = correlationIdGetCorrelationContext;
exports.correlationIdGetCorrelationContextValue = correlationIdGetCorrelationContextValue;
exports.AjaxHelperParseDependencyPath = AjaxHelperParseDependencyPath;
exports.dateTimeUtilsNow = dateTimeUtilsNow;
exports.dateTimeUtilsDuration = dateTimeUtilsDuration;
exports.createDistributedTraceContextFromTrace = createDistributedTraceContextFromTrace;
var applicationinsights_core_js_1 = require("@microsoft/applicationinsights-core-js");
var ts_utils_1 = require("@nevware21/ts-utils");
var Constants_1 = require("./Constants");
var RequestResponseHeaders_1 = require("./RequestResponseHeaders");
var DataSanitizer_1 = require("./Telemetry/Common/DataSanitizer");
var UrlHelperFuncs_1 = require("./UrlHelperFuncs");
// listing only non-geo specific locations
var _internalEndpoints = [
    Constants_1.DEFAULT_BREEZE_ENDPOINT + Constants_1.DEFAULT_BREEZE_PATH,
    "https://breeze.aimon.applicationinsights.io" + Constants_1.DEFAULT_BREEZE_PATH,
    "https://dc-int.services.visualstudio.com" + Constants_1.DEFAULT_BREEZE_PATH
];
var _correlationIdPrefix = "cid-v1:";
function isInternalApplicationInsightsEndpoint(endpointUrl) {
    return (0, applicationinsights_core_js_1.arrIndexOf)(_internalEndpoints, endpointUrl.toLowerCase()) !== -1;
}
function correlationIdSetPrefix(prefix) {
    _correlationIdPrefix = prefix;
}
function correlationIdGetPrefix() {
    return _correlationIdPrefix;
}
/**
 * Checks if a request url is not on a excluded domain list and if it is safe to add correlation headers.
 * Headers are always included if the current domain matches the request domain. If they do not match (CORS),
 * they are regex-ed across correlationHeaderDomains and correlationHeaderExcludedDomains to determine if headers are included.
 * Some environments don't give information on currentHost via window.location.host (e.g. Cordova). In these cases, the user must
 * manually supply domains to include correlation headers on. Else, no headers will be included at all.
 */
function correlationIdCanIncludeCorrelationHeader(config, requestUrl, currentHost) {
    if (!requestUrl || (config && config.disableCorrelationHeaders)) {
        return false;
    }
    if (config && config.correlationHeaderExcludePatterns) {
        for (var i = 0; i < config.correlationHeaderExcludePatterns.length; i++) {
            if (config.correlationHeaderExcludePatterns[i].test(requestUrl)) {
                return false;
            }
        }
    }
    var requestHost = (0, UrlHelperFuncs_1.urlParseUrl)(requestUrl).host.toLowerCase();
    if (requestHost && ((0, ts_utils_1.strIndexOf)(requestHost, ":443") !== -1 || (0, ts_utils_1.strIndexOf)(requestHost, ":80") !== -1)) {
        // [Bug #1260] IE can include the port even for http and https URLs so if present
        // try and parse it to remove if it matches the default protocol port
        requestHost = ((0, UrlHelperFuncs_1.urlParseFullHost)(requestUrl, true) || "").toLowerCase();
    }
    if ((!config || !config.enableCorsCorrelation) && (requestHost && requestHost !== currentHost)) {
        return false;
    }
    var includedDomains = config && config.correlationHeaderDomains;
    if (includedDomains) {
        var matchExists_1;
        (0, applicationinsights_core_js_1.arrForEach)(includedDomains, function (domain) {
            var regex = new RegExp(domain.toLowerCase().replace(/\\/g, "\\\\").replace(/\./g, "\\.").replace(/\*/g, ".*"));
            matchExists_1 = matchExists_1 || regex.test(requestHost);
        });
        if (!matchExists_1) {
            return false;
        }
    }
    var excludedDomains = config && config.correlationHeaderExcludedDomains;
    if (!excludedDomains || excludedDomains.length === 0) {
        return true;
    }
    for (var i = 0; i < excludedDomains.length; i++) {
        var regex = new RegExp(excludedDomains[i].toLowerCase().replace(/\\/g, "\\\\").replace(/\./g, "\\.").replace(/\*/g, ".*"));
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
function correlationIdGetCorrelationContext(responseHeader) {
    if (responseHeader) {
        var correlationId = correlationIdGetCorrelationContextValue(responseHeader, RequestResponseHeaders_1.RequestHeaders[1 /* eRequestHeaders.requestContextTargetKey */]);
        if (correlationId && correlationId !== _correlationIdPrefix) {
            return correlationId;
        }
    }
}
/**
 * Gets key from correlation response header
 */
function correlationIdGetCorrelationContextValue(responseHeader, key) {
    if (responseHeader) {
        var keyValues = responseHeader.split(",");
        for (var i = 0; i < keyValues.length; ++i) {
            var keyValue = keyValues[i].split("=");
            if (keyValue.length === 2 && keyValue[0] === key) {
                return keyValue[1];
            }
        }
    }
}
function AjaxHelperParseDependencyPath(logger, absoluteUrl, method, commandName) {
    var target, name = commandName, data = commandName;
    if (absoluteUrl && absoluteUrl.length > 0) {
        var parsedUrl = (0, UrlHelperFuncs_1.urlParseUrl)(absoluteUrl);
        target = parsedUrl.host;
        if (!name) {
            if (parsedUrl.pathname != null) {
                var pathName = (parsedUrl.pathname.length === 0) ? "/" : parsedUrl.pathname;
                if (pathName.charAt(0) !== "/") {
                    pathName = "/" + pathName;
                }
                data = parsedUrl.pathname;
                name = (0, DataSanitizer_1.dataSanitizeString)(logger, method ? method + " " + pathName : pathName);
            }
            else {
                name = (0, DataSanitizer_1.dataSanitizeString)(logger, absoluteUrl);
            }
        }
    }
    else {
        target = commandName;
        name = commandName;
    }
    return {
        target: target,
        name: name,
        data: data
    };
}
function dateTimeUtilsNow() {
    // returns the window or webworker performance object
    var perf = (0, applicationinsights_core_js_1.getPerformance)();
    if (perf && perf.now && perf.timing) {
        var now = perf.now() + perf.timing.navigationStart;
        // Known issue with IE where this calculation can be negative, so if it is then ignore and fallback
        if (now > 0) {
            return now;
        }
    }
    return (0, applicationinsights_core_js_1.dateNow)();
}
function dateTimeUtilsDuration(start, end) {
    var result = null;
    if (start !== 0 && end !== 0 && !(0, applicationinsights_core_js_1.isNullOrUndefined)(start) && !(0, applicationinsights_core_js_1.isNullOrUndefined)(end)) {
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
function createDistributedTraceContextFromTrace(telemetryTrace, parentCtx) {
    var trace = telemetryTrace || {};
    return {
        getName: function () {
            return trace.name;
        },
        setName: function (newValue) {
            parentCtx && parentCtx.setName(newValue);
            trace.name = newValue;
        },
        getTraceId: function () {
            return trace.traceID;
        },
        setTraceId: function (newValue) {
            parentCtx && parentCtx.setTraceId(newValue);
            if ((0, applicationinsights_core_js_1.isValidTraceId)(newValue)) {
                trace.traceID = newValue;
            }
        },
        getSpanId: function () {
            return trace.parentID;
        },
        setSpanId: function (newValue) {
            parentCtx && parentCtx.setSpanId(newValue);
            if ((0, applicationinsights_core_js_1.isValidSpanId)(newValue)) {
                trace.parentID = newValue;
            }
        },
        getTraceFlags: function () {
            return trace.traceFlags;
        },
        setTraceFlags: function (newTraceFlags) {
            parentCtx && parentCtx.setTraceFlags(newTraceFlags);
            trace.traceFlags = newTraceFlags;
        }
    };
}
