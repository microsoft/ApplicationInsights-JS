// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { strTrim } from "@nevware21/ts-utils";
import { IOTelLogRecordLimits } from "../../interfaces/OTel/logs/IOTelLogRecordLimits";
import { handleWarn } from "../../internal/otel/commonUtils";
import { IOTelErrorHandlers } from "../../otel-core-js";

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
    const handlers: IOTelErrorHandlers = {};
    if (typeof process === "undefined" || !process.env) {
        return undefined;
    }

    const raw = process.env[key];
    if (raw == null || strTrim(raw) === "") {
        return undefined;
    }

    const value = Number(raw);
    if (isNaN(value)) {
        handleWarn(handlers, `Unknown value ${JSON.stringify(raw)} for ${key}, expected a number, using defaults`);
        return undefined;
    }

    return value;
}

export function loadDefaultConfig() {
    return {
        forceFlushTimeoutMillis: 30000,
        logRecordLimits: {
            attributeValueLengthLimit: (() => {
                const configuredValue = getNumberFromEnv("OTEL_LOGRECORD_ATTRIBUTE_VALUE_LENGTH_LIMIT");
                return configuredValue !== undefined ? configuredValue : Infinity;
            })(),
            attributeCountLimit: (() => {
                const configuredValue = getNumberFromEnv("OTEL_LOGRECORD_ATTRIBUTE_COUNT_LIMIT");
                return configuredValue !== undefined ? configuredValue : 128;
            })()
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
    const providedCount = logRecordLimits.attributeCountLimit;
    const providedValueLength = logRecordLimits.attributeValueLengthLimit;

    const envLogCount = getNumberFromEnv("OTEL_LOGRECORD_ATTRIBUTE_COUNT_LIMIT");
    const envGeneralCount = getNumberFromEnv("OTEL_ATTRIBUTE_COUNT_LIMIT");

    const envLogValueLength = getNumberFromEnv("OTEL_LOGRECORD_ATTRIBUTE_VALUE_LENGTH_LIMIT");
    const envGeneralValueLength = getNumberFromEnv("OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT");

    return {
        /**
         * Reassign log record attribute count limit to use first non null value defined by user or use default value
         */
        attributeCountLimit: providedCount !== undefined
            ? providedCount
            : envLogCount !== undefined
                ? envLogCount
                : envGeneralCount !== undefined
                    ? envGeneralCount
                    : 128,
        /**
         * Reassign log record attribute value length limit to use first non null value defined by user or use default value
         */
        attributeValueLengthLimit: providedValueLength !== undefined
            ? providedValueLength
            : envLogValueLength !== undefined
                ? envLogValueLength
                : envGeneralValueLength !== undefined
                    ? envGeneralValueLength
                    : Infinity
    };
}
