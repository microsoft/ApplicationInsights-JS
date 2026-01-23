// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { arrForEach, isArray, isNullOrUndefined, isString, strLeft, strTrim } from "@nevware21/ts-utils";
import { STR_EMPTY } from "../../constants/InternalConstants";
import { eW3CTraceFlags } from "../../enums/AppInsights/W3CTraceFlags";
import { IDistributedTraceContext } from "../../interfaces/AppInsights/IDistributedTraceContext";
import { ITraceParent } from "../../interfaces/AppInsights/ITraceParent";
import { ITelemetryTrace } from "../../interfaces/AppInsights/context/ITelemetryTrace";
import { generateW3CId } from "./CoreUtils";
import { findMetaTag, findNamedServerTiming } from "./EnvUtils";

const TRACE_PARENT_REGEX = /^([\da-f]{2})-([\da-f]{32})-([\da-f]{16})-([\da-f]{2})(-[^\s]{1,64})?$/i;
const DEFAULT_VERSION = "00";
const INVALID_VERSION = "ff";
export const INVALID_TRACE_ID = "00000000000000000000000000000000";
export const INVALID_SPAN_ID = "0000000000000000";
const SAMPLED_FLAG = 0x01;


function _isValid(value: string, len: number, invalidValue?: string): boolean {
    if (value && value.length === len && value !== invalidValue) {
        return !!value.match(/^[\da-f]*$/i);
    }

    return false;
}

function _formatValue(value: string, len: number, defValue: string): string {
    if (_isValid(value, len)) {
        return value;
    }

    return defValue;
}

function _formatFlags(value: number): string {
    if (isNaN(value) || value < 0 || value > 255) {
        value = 0x01;
    }

    let result = value.toString(16);
    while (result.length < 2) {
        result = "0" + result;
    }

    return result;
}

/**
 * Create a new ITraceParent instance using the provided values.
 * @param traceId - The traceId to use, when invalid a new random W3C id will be generated.
 * @param spanId - The parent/span id to use, a new random value will be generated if it is invalid.
 * @param flags - The traceFlags to use, defaults to zero (0) if not supplied or invalid
 * @param version - The version to used, defaults to version "01" if not supplied or invalid.
 */
export function createTraceParent(traceId?: string, spanId?: string, flags?: number, version?: string): ITraceParent {
    return {
        version: _isValid(version, 2, INVALID_VERSION) ? version : DEFAULT_VERSION,
        traceId: isValidTraceId(traceId) ? traceId : generateW3CId(),
        spanId: isValidSpanId(spanId) ? spanId : strLeft(generateW3CId(), 16),
        traceFlags: (!isNullOrUndefined(flags) && flags >= 0 && flags <= 0xFF ? flags : eW3CTraceFlags.Sampled)
    };
}

/**
 * Attempt to parse the provided string as a W3C TraceParent header value (https://www.w3.org/TR/trace-context/#traceparent-header)
 *
 * @param value - The value to be parsed
 * @param selectIdx - If the found value is comma separated which is the preferred entry to select, defaults to the first
 */
export function parseTraceParent(value: string, selectIdx?: number): ITraceParent {
    if (!value) {
        return null;
    }

    if (isArray(value)) {
        value = value[0] || STR_EMPTY;
    }

    if (!value || !isString(value) || value.length > 8192) {
        return null;
    }

    if (value.indexOf(",") !== -1) {
        let values = value.split(",");
        value = values[selectIdx > 0 && values.length > selectIdx ? selectIdx : 0];
    }

    TRACE_PARENT_REGEX.lastIndex = 0;
    const match = TRACE_PARENT_REGEX.exec(strTrim(value));
    if (!match ||
        match[1] === INVALID_VERSION ||
        match[2] === INVALID_TRACE_ID ||
        match[3] === INVALID_SPAN_ID) {
        return null;
    }

    return {
        version: (match[1] || STR_EMPTY).toLowerCase(),
        traceId: (match[2] || STR_EMPTY).toLowerCase(),
        spanId: (match[3] || STR_EMPTY).toLowerCase(),
        traceFlags: parseInt(match[4], 16)
    };
}

/**
 * Is the provided W3c Trace Id a valid string representation.
 */
export function isValidTraceId(value: string): boolean {
    return _isValid(value, 32, INVALID_TRACE_ID);
}

/**
 * Is the provided W3c span id (aka. parent id) a valid string representation.
 */
export function isValidSpanId(value: string): boolean {
    return _isValid(value, 16, INVALID_SPAN_ID);
}

/**
 * Validates that the provided ITraceParent instance conforms to the currently supported specifications.
 */
export function isValidTraceParent(value: ITraceParent): boolean {
    if (!value ||
        !_isValid(value.version, 2, INVALID_VERSION) ||
        !_isValid(value.traceId, 32, INVALID_TRACE_ID) ||
        !_isValid(value.spanId, 16, INVALID_SPAN_ID) ||
        !_isValid(_formatFlags(value.traceFlags), 2)) {
        return false;
    }

    return true;
}

/**
 * Is the parsed traceParent indicating that the trace is currently sampled.
 */
export function isSampledFlag(value: ITraceParent): boolean {
    if (isValidTraceParent(value)) {
        return (value.traceFlags & SAMPLED_FLAG) === SAMPLED_FLAG;
    }

    return false;
}

/**
 * Format the ITraceParent value as a string using the supported and known version formats.
 */
export function formatTraceParent(value: ITraceParent): string {
    if (value) {
        let flags = _formatFlags(value.traceFlags);
        if (!_isValid(flags, 2)) {
            flags = "01";
        }

        let version = value.version || DEFAULT_VERSION;
        if (version !== "00" && version !== "ff") {
            version = DEFAULT_VERSION;
        }

        return `${version.toLowerCase()}-${_formatValue(value.traceId, 32, INVALID_TRACE_ID).toLowerCase()}-${_formatValue(value.spanId, 16, INVALID_SPAN_ID).toLowerCase()}-${flags.toLowerCase()}`;
    }

    return STR_EMPTY;
}

/**
 * Helper function to fetch the passed traceparent from the page, looking for it as a meta-tag or a Server-Timing header.
 */
export function findW3cTraceParent(selectIdx?: number): ITraceParent {
    const name = "traceparent";
    let traceParent: ITraceParent = parseTraceParent(findMetaTag(name), selectIdx);
    if (!traceParent) {
        traceParent = parseTraceParent(findNamedServerTiming(name), selectIdx);
    }

    return traceParent;
}

export function createDistributedTraceContextFromTrace(telemetryTrace?: ITelemetryTrace, parentCtx?: IDistributedTraceContext): IDistributedTraceContext {
    let trace = telemetryTrace || {} as ITelemetryTrace;

    function _getName(): string {
        return trace.name;
    }

    function _setName(newValue: string): void {
        if (parentCtx) {
            parentCtx.setName(newValue);
        }

        trace.name = newValue;
    }

    function _getTraceId(): string {
        return trace.traceID;
    }

    function _setTraceId(newValue: string): void {
        if (parentCtx) {
            parentCtx.setTraceId(newValue);
        }

        if (isValidTraceId(newValue)) {
            trace.traceID = newValue;
        }
    }

    function _getSpanId(): string {
        return trace.parentID;
    }

    function _setSpanId(newValue: string): void {
        if (parentCtx) {
            parentCtx.setSpanId(newValue);
        }

        if (isValidSpanId(newValue)) {
            trace.parentID = newValue;
        }
    }

    function _getTraceFlags(): number | undefined {
        return trace.traceFlags;
    }

    function _setTraceFlags(newValue?: number): void {
        if (parentCtx) {
            parentCtx.setTraceFlags(newValue);
        }

        trace.traceFlags = newValue;
    }

    let ctx = {
        getName: _getName,
        setName: _setName,
        getTraceId: _getTraceId,
        setTraceId: _setTraceId,
        getSpanId: _getSpanId,
        setSpanId: _setSpanId,
        getTraceFlags: _getTraceFlags,
        setTraceFlags: _setTraceFlags,
        isRemote: parentCtx ? parentCtx.isRemote : false,
        traceState: parentCtx ? parentCtx.traceState : undefined,
        parentCtx: parentCtx || null
    } as IDistributedTraceContext;

    Object.defineProperty(ctx, "pageName", {
        configurable: true,
        enumerable: true,
        get: _getName,
        set: (newValue: string) => {
            trace.name = newValue;
        }
    });

    Object.defineProperty(ctx, "traceId", {
        configurable: true,
        enumerable: true,
        get: _getTraceId,
        set: (newValue: string) => {
            if (isValidTraceId(newValue)) {
                trace.traceID = newValue;
            }
        }
    });

    Object.defineProperty(ctx, "spanId", {
        configurable: true,
        enumerable: true,
        get: _getSpanId,
        set: (newValue: string) => {
            if (isValidSpanId(newValue)) {
                trace.parentID = newValue;
            }
        }
    });

    Object.defineProperty(ctx, "traceFlags", {
        configurable: true,
        enumerable: true,
        get: _getTraceFlags,
        set: (newValue?: number) => {
            trace.traceFlags = newValue;
        }
    });

    return ctx;
}

export interface scriptsInfo {
    url: string;
    crossOrigin?: string;
    async?: boolean;
    defer?: boolean;
    referrerPolicy?: string;
}

/**
 * Find all script tags in the provided document and return the information about them.
 */
export function findAllScripts(doc: any): scriptsInfo[] {
    let scripts = doc.getElementsByTagName("script");
    let result: scriptsInfo[] = [];
    arrForEach(scripts, (script: any) => {
        let src = script.getAttribute("src");
        if (src) {
            let crossOrigin = script.getAttribute("crossorigin");
            let async = script.hasAttribute("async") === true;
            let defer = script.hasAttribute("defer") === true;
            let referrerPolicy = script.getAttribute("referrerpolicy");
            let info: scriptsInfo = { url: src };
            if (crossOrigin) {
                info.crossOrigin = crossOrigin;
            }
            if (async) {
                info.async = async;
            }
            if (defer) {
                info.defer = defer;
            }
            if (referrerPolicy) {
                info.referrerPolicy = referrerPolicy;
            }
            result.push(info);
        }
    });

    return result;
}
