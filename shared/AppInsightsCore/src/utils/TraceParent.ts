import { arrForEach, isArray, isNullOrUndefined, isString, strIndexOf, strLeft, strTrim } from "@nevware21/ts-utils";
import { STR_EMPTY } from "../constants/InternalConstants";
import { eW3CTraceFlags } from "../enums/W3CTraceFlags";
import { ITraceParent } from "../interfaces/ai/ITraceParent";
import { generateW3CId } from "./CoreUtils";
import { findMetaTag, findNamedServerTiming } from "./EnvUtils";

// using {0,16} for leading and trailing whitespace just to constrain the possible runtime of a random string
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
 * @returns
 */
/*#__NO_SIDE_EFFECTS__*/
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
 * @returns
 */
/*#__NO_SIDE_EFFECTS__*/
export function parseTraceParent(value: string, selectIdx?: number): ITraceParent {
    if (!value) {
        // Don't pass a null/undefined or empty string
        return null;
    }

    if (isArray(value)) {
        // The value may have been encoded on the page into an array so handle this automatically
        value = value[0] || STR_EMPTY;
    }

    if (!value || !isString(value) || value.length > 8192) {
        // limit potential processing based on total length
        return null;
    }

    if (strIndexOf(value, ",") !== -1) {
        let values = value.split(",");
        value = values[selectIdx > 0 && values.length > selectIdx ? selectIdx : 0];
    }

    // See https://www.w3.org/TR/trace-context/#versioning-of-traceparent
    TRACE_PARENT_REGEX.lastIndex = 0;
    const match = TRACE_PARENT_REGEX.exec(strTrim(value));
    if (!match ||                               // No match
            match[1] === INVALID_VERSION ||     // version ff is forbidden
            match[2] === INVALID_TRACE_ID ||    // All zeros is considered to be invalid
            match[3] === INVALID_SPAN_ID) {     // All zeros is considered to be invalid
        return null;
    }

    return {
        version: (match[1] || STR_EMPTY).toLowerCase(),
        traceId: (match[2] || STR_EMPTY).toLowerCase(),
        spanId: (match[3] || STR_EMPTY).toLowerCase(),
        traceFlags: parseInt(match[4], 16)
    }
}

/**
 * Is the provided W3c Trace Id a valid string representation, it must be a 32-character string
 * of lowercase hexadecimal characters for example, 4bf92f3577b34da6a3ce929d0e0e4736.
 * If all characters as zero (00000000000000000000000000000000) it will be considered an invalid value.
 * @param value - The W3c trace Id to be validated
 * @returns true if valid otherwise false
 */
/*#__NO_SIDE_EFFECTS__*/
export function isValidTraceId(value: string): boolean {
    return _isValid(value, 32, INVALID_TRACE_ID);
}

/**
 * Is the provided W3c span id (aka. parent id) a valid string representation, it must be a 16-character
 * string of lowercase hexadecimal characters, for example, 00f067aa0ba902b7.
 * If all characters are zero (0000000000000000) this is considered an invalid value.
 * @param value - The W3c span id to be validated
 * @returns true if valid otherwise false
 */
/*#__NO_SIDE_EFFECTS__*/
export function isValidSpanId(value: string): boolean {
    return _isValid(value, 16, INVALID_SPAN_ID);
}

/**
 * Validates that the provided ITraceParent instance conforms to the currently supported specifications
 * @param value - The parsed traceParent value
 * @returns
 */
/*#__NO_SIDE_EFFECTS__*/
export function isValidTraceParent(value: ITraceParent) {
    if (!value ||
            !_isValid(value.version, 2, INVALID_VERSION) ||
            !_isValid(value.traceId, 32, INVALID_TRACE_ID) ||
            !_isValid(value.spanId, 16, INVALID_SPAN_ID) ||
            !_isValid(_formatFlags(value.traceFlags), 2)) {

        // Each known field must contain a valid value
        return false;
    }

    return true;
}

/**
 * Is the parsed traceParent indicating that the trace is currently sampled.
 * @param value - The parsed traceParent value
 * @returns
 */
/*#__NO_SIDE_EFFECTS__*/
export function isSampledFlag(value: ITraceParent) {
    if (isValidTraceParent(value)) {
        return (value.traceFlags & SAMPLED_FLAG) === SAMPLED_FLAG;
    }

    return false;
}

/**
 * Format the ITraceParent value as a string using the supported and know version formats.
 * So even if the passed traceParent is a later version the string value returned from this
 * function will convert it to only the known version formats.
 * This currently only supports version "00" and invalid "ff"
 * @param value - The parsed traceParent value
 * @returns
 */
/*#__NO_SIDE_EFFECTS__*/
export function formatTraceParent(value: ITraceParent) {
    if (value) {
        // Special Note: This only supports formatting as version 00, future versions should encode any known supported version
        // So parsing a future version will populate the correct version value but reformatting will reduce it to version 00.
        let flags = _formatFlags(value.traceFlags);
        if (!_isValid(flags, 2)) {
            flags = "01";
        }

        let version = value.version || DEFAULT_VERSION;
        if (version !== "00" && version !== "ff") {
            // Reduce version to "00"
            version = DEFAULT_VERSION;
        }

        // Format as version 00
        return `${version.toLowerCase()}-${_formatValue(value.traceId, 32, INVALID_TRACE_ID).toLowerCase()}-${_formatValue(value.spanId, 16, INVALID_SPAN_ID).toLowerCase()}-${flags.toLowerCase()}`;
    }

    return STR_EMPTY;
}

/**
 * Helper function to fetch the passed traceparent from the page, looking for it as a meta-tag or a Server-Timing header.
 * @param selectIdx - If the found value is comma separated which is the preferred entry to select, defaults to the first
 * @returns
 */
export function findW3cTraceParent(selectIdx?: number): ITraceParent {
    const name = "traceparent";
    let traceParent: ITraceParent = parseTraceParent(findMetaTag(name), selectIdx);
    if (!traceParent) {
        traceParent = parseTraceParent(findNamedServerTiming(name), selectIdx)
    }

    return traceParent;
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
 * @param doc - The document to search for script tags
 * @returns
 */
export function findAllScripts(doc: any) {
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
