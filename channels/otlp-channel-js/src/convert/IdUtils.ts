// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { getInst, isString, strLower } from "@nevware21/ts-utils";

const TRACE_ID_LEN = 32;
const SPAN_ID_LEN = 16;
const HEX_ZEROS = "00000000000000000000000000000000";
const SEPARATORS = /[-:\s]/g;
const NON_HEX = /[^0-9a-f]/;

function _normalizeId(value: any, length: number): string {
    if (!isString(value) || !value) {
        return null;
    }

    // Identifiers that originate from a `traceparent` header or from user supplied context may
    // include separators or uppercase characters, so those are normalized away. Anything that still
    // contains a non hex character is rejected rather than coerced, because silently turning an
    // arbitrary string into a plausible looking identifier would fabricate correlation that does not
    // exist.
    let id = strLower(value).replace(SEPARATORS, "");
    if (!id || NON_HEX.test(id)) {
        return null;
    }

    if (id.length > length) {
        id = id.substring(0, length);
    } else if (id.length < length) {
        id = HEX_ZEROS.substring(0, length - id.length) + id;
    }

    // An all zero id is explicitly invalid in the OpenTelemetry specification
    if (id === HEX_ZEROS.substring(0, length)) {
        return null;
    }

    return id;
}

/**
 * Normalizes the supplied value into a valid OTLP trace id (32 lowercase hex characters).
 * @param value - The value to normalize.
 * @returns The normalized trace id, or `null` when the value cannot represent a valid trace id.
 */
export function normalizeTraceId(value: any): string {
    return _normalizeId(value, TRACE_ID_LEN);
}

/**
 * Normalizes the supplied value into a valid OTLP span id (16 lowercase hex characters).
 * @param value - The value to normalize.
 * @returns The normalized span id, or `null` when the value cannot represent a valid span id.
 */
export function normalizeSpanId(value: any): string {
    return _normalizeId(value, SPAN_ID_LEN);
}

/**
 * Extracts a span id from an Application Insights hierarchical operation id.
 *
 * @remarks
 * The dependency and request telemetry produced by this SDK carries an id in the W3C derived
 * `|<traceId>.<spanId>` form (see `ajaxRecord.ts`), which is not itself a valid OTLP span id. The
 * embedded span id is the identifier that any child telemetry will reference as its parent, so it
 * must be used rather than discarded -- generating a new id here would silently break the parent /
 * child relationships in the exported trace.
 *
 * @param value - The identifier to parse.
 * @returns The embedded span id, or `null` when the value does not carry one.
 */
export function extractSpanId(value: any): string {
    if (!isString(value) || !value) {
        return null;
    }

    if (value.charAt(0) !== "|" && value.indexOf(".") === -1) {
        // A plain identifier, let the normal normalization handle it
        return normalizeSpanId(value);
    }

    let parts = value.replace(/^\|/, "").split(".");
    let segments: string[] = [];
    for (let lp = 0; lp < parts.length; lp++) {
        if (parts[lp]) {
            segments.push(parts[lp]);
        }
    }

    // `|<traceId>.` identifies an operation rather than a span, so there is no span id to extract
    if (segments.length < 2) {
        return null;
    }

    return normalizeSpanId(segments[segments.length - 1]);
}

/**
 * Splits a target that may be either a bare host or an absolute url.
 *
 * @remarks
 * The automatically collected dependency telemetry sets `target` to the absolute url of the request
 * (`ajaxRecord.ts`), but the OpenTelemetry semantic conventions require `server.address` to be the
 * host on its own with the port reported separately, so the value has to be split rather than copied
 * verbatim.
 *
 * @param target - The dependency target.
 * @returns The host, the port (when present) and the url (when the target was an absolute url).
 */
export function parseTarget(target: any): { host: string, port: number, url: string } {
    let result = { host: null as string, port: null as number, url: null as string };

    if (!isString(target) || !target) {
        return result;
    }

    // scheme://host[:port][/path]
    let matches = /^([a-z][a-z0-9+.-]*):\/\/([^/?#:]+)(?::(\d+))?/i.exec(target);
    if (matches) {
        result.host = matches[2];
        result.url = target;
        if (matches[3]) {
            result.port = +matches[3];
        }

        return result;
    }

    // host[:port] without a scheme
    let hostPort = /^([^/?#:]+):(\d+)$/.exec(target);
    if (hostPort) {
        result.host = hostPort[1];
        result.port = +hostPort[2];

        return result;
    }

    result.host = target;

    return result;
}

/**
 * Generates a random hex identifier of the requested length, preferring the platform's cryptographic
 * random source when it is available.
 */
function _randomHex(length: number): string {
    let result = "";
    let crypto: any = getInst("crypto") || getInst("msCrypto");

    if (crypto && crypto.getRandomValues) {
        // Two hex characters per byte
        let bytes = new Uint8Array(length / 2);
        crypto.getRandomValues(bytes);
        for (let lp = 0; lp < bytes.length; lp++) {
            let hex = bytes[lp].toString(16);
            result += hex.length === 1 ? "0" + hex : hex;
        }
    } else {
        while (result.length < length) {
            // 8 hex characters at a time
            let part = ((Math.random() * 0x100000000) >>> 0).toString(16);
            result += HEX_ZEROS.substring(0, 8 - part.length) + part;
        }

        result = result.substring(0, length);
    }

    // A zero identifier is invalid, so force at least one non zero character
    if (result === HEX_ZEROS.substring(0, length)) {
        result = "1" + result.substring(1);
    }

    return result;
}

/**
 * Generates a new random OTLP trace id.
 * @returns A 32 character lowercase hex trace id.
 */
export function generateTraceId(): string {
    return _randomHex(TRACE_ID_LEN);
}

/**
 * Generates a new random OTLP span id.
 *
 * @remarks
 * This is required because not every Application Insights telemetry type carries a usable span
 * identifier -- a page view for example has a page view id rather than a span id -- yet a span
 * cannot be exported to OTLP without a valid `spanId`.
 *
 * @returns A 16 character lowercase hex span id.
 */
export function generateSpanId(): string {
    return _randomHex(SPAN_ID_LEN);
}
