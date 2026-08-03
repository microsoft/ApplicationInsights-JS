// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelHrTime, millisToHrTime } from "@microsoft/applicationinsights-core-js";
import { isNullOrUndefined, isNumber, isString, mathFloor } from "@nevware21/ts-utils";

const NANOS_PER_SECOND = 1e9;
const MILLIS_PER_SECOND = 1e3;
const NANOS_PER_MILLI = 1e6;
const ZERO_PAD = "000000000";

/**
 * Converts a high resolution time into the OTLP `timeUnixNano` representation, which is the number
 * of nanoseconds since the unix epoch encoded as a decimal string.
 *
 * @remarks
 * This deliberately avoids all floating point arithmetic on the combined value. The number of
 * nanoseconds since the epoch is currently around 1.75e18 which is far beyond
 * `Number.MAX_SAFE_INTEGER` (~9.0e15), so computing `seconds * 1e9 + nanos` as a number silently
 * loses roughly 3 digits of precision. `BigInt` is not available in the ES5 environments that this
 * SDK supports, so the value is composed as a string from the (individually safe) seconds and
 * nanoseconds components instead.
 *
 * @param hrTime - The high resolution `[seconds, nanoseconds]` time to convert.
 * @returns The number of nanoseconds since the unix epoch as a decimal string.
 */
export function hrTimeToUnixNanoStr(hrTime: IOTelHrTime): string {
    if (!hrTime) {
        return "0";
    }

    let seconds = hrTime[0] || 0;
    let nanos = hrTime[1] || 0;

    // Normalize any overflow / underflow in the nanoseconds component so that the string
    // concatenation below stays correct.
    if (nanos >= NANOS_PER_SECOND || nanos < 0) {
        let extraSeconds = mathFloor(nanos / NANOS_PER_SECOND);
        seconds += extraSeconds;
        nanos -= extraSeconds * NANOS_PER_SECOND;
    }

    // Negative times cannot be represented, clamp to the epoch
    if (seconds < 0) {
        return "0";
    }

    let nanoStr = "" + nanos;
    if (nanoStr.length < 9) {
        nanoStr = ZERO_PAD.substring(0, 9 - nanoStr.length) + nanoStr;
    }

    return "" + seconds + nanoStr;
}

/**
 * Converts the number of milliseconds since the unix epoch into the OTLP `timeUnixNano`
 * representation.
 * @param epochMillis - Milliseconds since the unix epoch, may include a fractional component.
 * @returns The number of nanoseconds since the unix epoch as a decimal string.
 */
export function epochMillisToUnixNanoStr(epochMillis: number): string {
    if (!isNumber(epochMillis) || isNaN(epochMillis) || !isFinite(epochMillis)) {
        return "0";
    }

    return hrTimeToUnixNanoStr(millisToHrTime(epochMillis));
}

/**
 * Resolves the supplied value into the number of milliseconds since the unix epoch.
 * @param value - A `Date`, a number of milliseconds, an ISO 8601 date string or a high resolution time.
 * @returns The number of milliseconds since the unix epoch or `null` when the value is not a usable time.
 */
export function toEpochMillis(value: Date | number | string | IOTelHrTime): number | null {
    if (isNullOrUndefined(value)) {
        return null;
    }

    if (isNumber(value)) {
        return isNaN(value) || !isFinite(value) ? null : value;
    }

    if (isString(value)) {
        let parsed = Date.parse(value);
        return isNaN(parsed) ? null : parsed;
    }

    // A Date instance
    if ((value as Date).getTime) {
        let time = (value as Date).getTime();
        return isNaN(time) ? null : time;
    }

    // A high resolution [seconds, nanos] tuple. The result is only used where millisecond precision
    // is sufficient, absolute nanosecond values must go through hrTimeToUnixNanoStr instead.
    let hrTime = value as IOTelHrTime;
    if (isNumber(hrTime[0])) {
        return (hrTime[0] * MILLIS_PER_SECOND) + ((hrTime[1] || 0) / NANOS_PER_MILLI);
    }

    return null;
}

/**
 * Adds a duration expressed in milliseconds to an absolute time expressed as a `timeUnixNano`
 * decimal string, returning a new `timeUnixNano` decimal string.
 *
 * @remarks
 * The addition is performed on the (safe) seconds and nanoseconds components rather than on the
 * combined nanosecond value, for the precision reasons described on {@link hrTimeToUnixNanoStr}.
 *
 * @param startUnixNano - The absolute start time as a decimal string of nanoseconds since the epoch.
 * @param durationMs - The duration to add, in milliseconds.
 * @returns The resulting absolute time as a decimal string of nanoseconds since the epoch.
 */
export function addMillisToUnixNanoStr(startUnixNano: string, durationMs: number): string {
    if (!startUnixNano) {
        return "0";
    }

    if (!isNumber(durationMs) || isNaN(durationMs) || !isFinite(durationMs) || durationMs === 0) {
        return startUnixNano;
    }

    // Split the decimal string back into its (safe) seconds / nanoseconds components. Any value
    // shorter than 10 characters is entirely within the nanoseconds component.
    let len = startUnixNano.length;
    let seconds = len > 9 ? +startUnixNano.substring(0, len - 9) : 0;
    let nanos = +startUnixNano.substring(len > 9 ? len - 9 : 0);

    let durationHr = millisToHrTime(durationMs);

    return hrTimeToUnixNanoStr([seconds + durationHr[0], nanos + durationHr[1]] as IOTelHrTime);
}

/**
 * Parses an Application Insights duration value into a number of milliseconds. Durations are
 * normally supplied as a number of milliseconds but the envelope format also permits the
 * `d.hh:mm:ss.fffffff` timespan representation.
 * @param value - The duration to parse.
 * @returns The duration in milliseconds, or `0` when the value cannot be parsed.
 */
export function parseDurationMs(value: any): number {
    if (isNullOrUndefined(value)) {
        return 0;
    }

    if (isNumber(value)) {
        return isNaN(value) || !isFinite(value) ? 0 : value;
    }

    if (!isString(value)) {
        return 0;
    }

    // d.hh:mm:ss.fffffff  (the days component and the fractional seconds are both optional)
    let matches = /^(?:(\d+)\.)?(\d+):(\d+):(\d+)(?:\.(\d+))?$/.exec(value);
    if (!matches) {
        let parsed = +value;
        return isNaN(parsed) ? 0 : parsed;
    }

    let days = +(matches[1] || 0);
    let hours = +matches[2];
    let minutes = +matches[3];
    let seconds = +matches[4];

    // The fractional component may have up to 7 digits (100ns ticks), normalize it to milliseconds
    let fraction = matches[5] || "";
    let millis = 0;
    if (fraction) {
        millis = +((fraction + "000").substring(0, 3));
    }

    return ((((days * 24 + hours) * 60 + minutes) * 60 + seconds) * MILLIS_PER_SECOND) + millis;
}
