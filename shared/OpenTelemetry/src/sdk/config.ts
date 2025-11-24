// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelLogRecordLimits } from "../interfaces/logs/IOTelLogRecordLimits";

/**
 * Retrieves a number from an environment variable.
 * - Returns `undefined` if the environment variable is empty, unset, contains only whitespace, or is not a number.
 * - Returns a number in all other cases.
 * - In browser environments where process is not available, returns `undefined`.
 *
 * @param {string} key - The name of the environment variable to retrieve.
 * @returns {number | undefined} - The number value or `undefined`.
 */
export function getNumberFromEnv(key: string): number | undefined {
    // Handle browser environments where process is not defined
    if (typeof process === "undefined" || !process.env) {
        return undefined;
    }

    const raw = process.env[key];
    if (raw == null || raw.trim() === "") {
        return undefined;
    }

    const value = Number(raw);
    if (isNaN(value)) {
        console.warn(
            `Unknown value ${JSON.stringify(raw)} for ${key}, expected a number, using defaults`
        );
        return undefined;
    }

    return value;
}

export function loadDefaultConfig() {
    return {
        forceFlushTimeoutMillis: 30000,
        logRecordLimits: {
            attributeValueLengthLimit:
                getNumberFromEnv("OTEL_LOGRECORD_ATTRIBUTE_VALUE_LENGTH_LIMIT") ||
                Infinity,
            attributeCountLimit:
                getNumberFromEnv("OTEL_LOGRECORD_ATTRIBUTE_COUNT_LIMIT") || 128,
        },
        includeTraceContext: true
    };
}

/**
 * When general limits are provided and model specific limits are not,
 * configures the model specific limits by using the values from the general ones.
 * @param logRecordLimits User provided limits configuration
 */
export function reconfigureLimits(
    logRecordLimits: IOTelLogRecordLimits
): Required<IOTelLogRecordLimits> {
    return {
        /**
         * Reassign log record attribute count limit to use first non null value defined by user or use default value
         */
        attributeCountLimit:
            logRecordLimits.attributeCountLimit ||
            getNumberFromEnv("OTEL_LOGRECORD_ATTRIBUTE_COUNT_LIMIT") ||
            getNumberFromEnv("OTEL_ATTRIBUTE_COUNT_LIMIT") ||
            128,
        /**
         * Reassign log record attribute value length limit to use first non null value defined by user or use default value
         */
        attributeValueLengthLimit:
            logRecordLimits.attributeValueLengthLimit ||
            getNumberFromEnv("OTEL_LOGRECORD_ATTRIBUTE_VALUE_LENGTH_LIMIT") ||
            getNumberFromEnv("OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT") ||
            Infinity
    };
}
