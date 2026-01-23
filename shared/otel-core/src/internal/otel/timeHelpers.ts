import {
    ICachedValue, ObjDefinePropDescriptor, createCachedValue, createDeferredCachedValue, getPerformance, isArray, isDate, isNullOrUndefined,
    isNumber, mathFloor, mathRound, objDefine, objDefineProps, objFreeze, perfNow, strRepeat, strRight, throwTypeError
} from "@nevware21/ts-utils";
import { IOTelHrTime, OTelTimeInput } from "../../interfaces/OTel/time";
import { setObjStringTag, toISOString } from "../../utils/AppInsights/HelperFuncsCore";

const NANOSECOND_DIGITS = 9;
const NANOSECOND_DIGITS_IN_MILLIS = 6;

// Constants for time unit conversions and manipulation
const NANOS_IN_MILLIS = /*#__PURE__*/ 1000000; // Number of nanoseconds in a millisecond
const NANOS_IN_SECOND = /*#__PURE__*/ 1000000000; // Number of nanoseconds in a second
const MICROS_IN_SECOND = /*#__PURE__*/ 1000000; // Number of microseconds in a second
const MICROS_IN_MILLIS = /*#__PURE__*/ 1000; // Number of microseconds in a millisecond
const MILLIS_IN_SECOND = /*#__PURE__*/ 1000; // Number of milliseconds in a second

interface IOriginHrTime {
    to: number;
    hr: IOTelHrTime
}

let cMillisToNanos: ICachedValue<number>;
let cSecondsToNanos: ICachedValue<number>;
let cTimeOrigin: ICachedValue<IOriginHrTime>;
let cNanoPadding: ICachedValue<string>;

function _notMutable() {
    throwTypeError("HrTime is not mutable")
}

/**
 * Initialize the cached value for converting milliseconds to nanoseconds.
 * @returns
 */
/*#__PURE__*/
function _initSecondsToNanos(): ICachedValue<number> {
    if (!cSecondsToNanos) {
        cSecondsToNanos = createCachedValue(NANOS_IN_SECOND);
    }
    return cSecondsToNanos;
}

/**
 * Initialize the time origin.
 * @returns
 */
/*#__PURE__*/
function _initTimeOrigin(): ICachedValue<IOriginHrTime> {
    if (!cTimeOrigin) {
        let timeOrigin = 0;
        let perf = getPerformance();
        if (perf) {
            timeOrigin = perf.timeOrigin;
            if (!isNumber(timeOrigin)) {
                timeOrigin = (perf as any).timing && (perf as any).timing.fetchStart;
            }

            if (!isNumber(timeOrigin) && perf.now) {
                timeOrigin = perf.now();
            }
        }

        cTimeOrigin = createCachedValue({
            to: timeOrigin,
            hr: millisToHrTime(timeOrigin)
        });
    }
    return cTimeOrigin;
}

/*#__PURE__*/
function _finalizeHrTime(hrTime: IOTelHrTime) {
    function _toString() {
        return "[" + hrTime[0] + ", " + hrTime[1] + "]";
    }

    setObjStringTag(hrTime, _toString);
    
    return objFreeze(hrTime);
}

/*#__PURE__*/
function _createUnixNanoHrTime(unixNano: number): IOTelHrTime {
    // Create array with initial length of 2
    const hrTime = [0, 0] as any as IOTelHrTime;
    const immutable: ObjDefinePropDescriptor = { v: _notMutable, w: false, e: false };
    
    // Define the array elements and other properties (avoid redefining length)
    objDefineProps(hrTime, {
        0: {
            l: createDeferredCachedValue(() => mathFloor(unixNano / NANOS_IN_SECOND))
        },
        1: {
            l: createDeferredCachedValue(() => unixNano % NANOS_IN_SECOND)
        },
        unixNano: {
            v: unixNano,
            e: false,
            w: false
        },
        // Override array mutating methods with single _notMutable function
        push: immutable,
        pop: immutable,
        shift: immutable,
        unshift: immutable,
        splice: immutable,
        sort: immutable,
        reverse: immutable,
        fill: immutable,
        copyWithin: immutable
    });

    return _finalizeHrTime(hrTime);
}

/*#__PURE__*/
function _createHrTime(seconds: number, nanoseconds: number): IOTelHrTime {
    const hrTime = [seconds, nanoseconds] as IOTelHrTime;

    objDefine(hrTime, "unixNano", {
        v: (seconds * NANOS_IN_SECOND) + nanoseconds,
        w: false,
        e: false
    });

    return _finalizeHrTime(hrTime);
}

/**
 * Returns a new HrTime object with zero values for seconds and nanoseconds.
 * @returns A HrTime object representing zero time.
 */
/*#__PURE__*/ /*@__NO_SIDE_EFFECTS__*/
export function zeroHrTime(): IOTelHrTime {
    return _createUnixNanoHrTime(0);
}

/**
 * Converts a number of milliseconds from epoch to HrTime([seconds, remainder in nanoseconds]).
 * @param epochMillis - The number of milliseconds since the epoch (January 1, 1970).
 * @returns A HrTime object representing the converted time.
 */
/*#__PURE__*/ /*@__NO_SIDE_EFFECTS__*/
export function millisToHrTime(epochMillis: number): IOTelHrTime {
    let result: IOTelHrTime;

    if (epochMillis > 0) {
        // Handle whole and fractional parts separately for maximum precision
        const wholeMillis = mathFloor(epochMillis);
        const fractionalMillis = epochMillis - wholeMillis;
        
        // Handle whole milliseconds using integer arithmetic
        const seconds = mathFloor(wholeMillis / MILLIS_IN_SECOND);
        const millisFromSeconds = wholeMillis % MILLIS_IN_SECOND;
        const nanosFromWholeMillis = millisFromSeconds * NANOS_IN_MILLIS;
        
        // Convert fractional milliseconds to nanoseconds with proper rounding
        // Use Math.round to properly handle cases where we need to round up
        const nanosFromFraction = mathRound(fractionalMillis * NANOS_IN_MILLIS);
        
        // Combine the nanoseconds parts and handle any potential overflow
        let totalNanos = nanosFromWholeMillis + nanosFromFraction;
        let adjustedSeconds = seconds;
        
        // Check if we need to increment the seconds
        if (totalNanos >= NANOS_IN_SECOND) {
            adjustedSeconds++;
            totalNanos -= NANOS_IN_SECOND;
        }
        
        result = _createHrTime(adjustedSeconds, totalNanos);
    }

    return result || zeroHrTime();
}

/**
 * Converts a number of nanoseconds to HrTime([seconds, remainder in nanoseconds]).
 * @param nanos - The number of nanoseconds since the epoch (January 1, 1970).
 * @returns A HrTime object representing the converted time.
 */
/*#__PURE__*/ /*@__NO_SIDE_EFFECTS__*/
export function nanosToHrTime(nanos: number): IOTelHrTime {
    let result: IOTelHrTime;
    if (nanos > 0) {
        result = _createUnixNanoHrTime(nanos);
    }
    return result || zeroHrTime();
}

/**
 * Converts a HrTime object to a number representing nanoseconds since epoch.
 * Note: Due to JavaScript number limitations, values greater than Number.MAX_SAFE_INTEGER
 * may lose precision. For very large time values, consider using string representation
 * or splitting into separate second/nanosecond components.
 * @param hrTime - The HrTime object to convert.
 * @returns The number of nanoseconds represented by the HrTime object.
 */
/*#__PURE__*/ /*@__NO_SIDE_EFFECTS__*/
export function hrTimeToUnixNanos(hrTime: IOTelHrTime): number {
    let value = hrTime.unixNano;
    if (isNullOrUndefined(value)) {
        // Handle legacy HRTime format using standard number operations
        // First calculate seconds contribution to nanoseconds
        const secondsInNanos = hrTime[0] * NANOS_IN_MILLIS;
        // Add the additional nanoseconds
        value = secondsInNanos + hrTime[1];

        // // Add warning if we're approaching number precision limits
        // if (Math.abs(value) > Number.MAX_SAFE_INTEGER) {
        //     console.warn("Time value exceeds safe integer limits, precision may be lost");
        // }
    }

    return value;
}

/**
 * Returns an hrtime calculated via performance component.
 * @param performanceNow - The current time in milliseconds since the epoch.
 */
/*#__PURE__*/
export function hrTime(performanceNow?: number): IOTelHrTime {
    let result = millisToHrTime(isNumber(performanceNow) ? performanceNow : perfNow());
    const perf = getPerformance();
    if (perf) {
        const timeOrigin = cTimeOrigin || _initTimeOrigin();
        result = addHrTimes(timeOrigin.v.hr, result);
    }

    return result;
}

/**
 * Converts a TimeInput to an HrTime, defaults to _hrtime().
 * @param time - The time input to convert.
 */
/*#__PURE__*/
export function timeInputToHrTime(time: OTelTimeInput): IOTelHrTime {
    let result: IOTelHrTime;
    
    if (!isTimeInputHrTime(time)) {
        if (isNumber(time)) {
            const timeOrigin = cTimeOrigin || _initTimeOrigin();
            // Must be a performance.now() if it's smaller than process start time
            result = (time < timeOrigin.v.to) ? hrTime(time) : millisToHrTime(time);
        } else if (isDate(time)) {
            result = millisToHrTime((time as Date).getTime());
        } else {
            throwTypeError("Invalid input type");
        }
    } else {
        // Convert HrTime array to IOTelHrTime
        result = _createHrTime(time[0], time[1]);
    }

    return result;
}

/**
 * Returns a duration of two hrTime.
 * @param startTime - The start time of the duration
 * @param endTime - The end time of the duration
 * @returns The duration between startTime and endTime as an IOTelHrTime
 */
/*#__PURE__*/ /*@__NO_SIDE_EFFECTS__*/
export function hrTimeDuration(startTime: IOTelHrTime, endTime: IOTelHrTime): IOTelHrTime {
    const seconds = endTime[0] - startTime[0];
    let nanos = endTime[1] - startTime[1];

    // overflow
    if (nanos < 0) {
        const adjustedSeconds = seconds - 1;
        // negate
        const nanoSeconds = cSecondsToNanos || _initSecondsToNanos();
        nanos += nanoSeconds.v;
        return _createHrTime(adjustedSeconds, nanos);
    }

    return _createHrTime(seconds, nanos);
}

/**
 * Convert hrTime to timestamp, for example "2019-05-14T17:00:00.000123456Z"
 * @param time - The hrTime to convert.
 */
/*#__PURE__*/ /*@__NO_SIDE_EFFECTS__*/
export function hrTimeToTimeStamp(time: IOTelHrTime): string {
    if (!cNanoPadding) {
        cNanoPadding = createCachedValue(strRepeat("0", NANOSECOND_DIGITS));
    }

    const date = toISOString(new Date(time[0] * 1000));
    return date.replace("000Z", strRight(cNanoPadding.v + time[1] + "Z", NANOSECOND_DIGITS + 1));
}

/**
 * Convert hrTime to nanoseconds.
 * @param time - The hrTime to convert.
 */
/*#__PURE__*/ /*@__NO_SIDE_EFFECTS__*/
export function hrTimeToNanoseconds(time: IOTelHrTime): number {
    let nanoSeconds = cSecondsToNanos || _initSecondsToNanos();
    return time[0] * nanoSeconds.v + time[1];
}

/**
 * Convert hrTime to milliseconds.
 * @param time - The hrTime to convert.
 */
/*#__PURE__*/ /*@__NO_SIDE_EFFECTS__*/
export function hrTimeToMilliseconds(time: IOTelHrTime): number {
    // Use integer math for the seconds part to avoid floating point precision loss
    const millisFromSeconds = time[0] * MILLIS_IN_SECOND;
    // Convert nanoseconds to milliseconds with proper rounding
    const millisFromNanos = Math.round(time[1] / NANOS_IN_MILLIS);
    return millisFromSeconds + millisFromNanos;
}

/**
 * Convert hrTime to microseconds.
 * @param time - The hrTime to convert.
 */
/*#__PURE__*/ /*@__NO_SIDE_EFFECTS__*/
export function hrTimeToMicroseconds(time: IOTelHrTime): number {
    // Use integer math for the seconds part to avoid floating point precision loss
    const microsFromSeconds = time[0] * MICROS_IN_SECOND;
    // Convert nanoseconds to microseconds with proper rounding
    const microsFromNanos = Math.round(time[1] / MICROS_IN_MILLIS);
    return microsFromSeconds + microsFromNanos;
}

/**
 * check if time is HrTime
 * @param value - The value to check.
 */
/*#__PURE__*/ /*@__NO_SIDE_EFFECTS__*/
export function isTimeInputHrTime(value: unknown): value is IOTelHrTime {
    return isArray(value) && value.length === 2 && isNumber(value[0]) && isNumber(value[1]);
}

/**
 * check if input value is a correct types.TimeInput
 * @param value - The value to check.
 */
/*#__PURE__*/ /*@__NO_SIDE_EFFECTS__*/
export function isTimeInput(value: unknown): value is OTelTimeInput {
    return !isNullOrUndefined(value) && (isTimeInputHrTime(value) || isNumber(value) || isDate(value));
}

/**
 * Given 2 HrTime formatted times, return their sum as an HrTime.
 * @param time1 - The first HrTime to add
 * @param time2 - The second HrTime to add
 * @returns The sum of the two HrTime values as an IOTelHrTime
 */
/*#__PURE__*/ /*@__NO_SIDE_EFFECTS__*/
export function addHrTimes(time1: IOTelHrTime, time2: IOTelHrTime): IOTelHrTime {
    const seconds = time1[0] + time2[0];
    let nanos = time1[1] + time2[1];
    const nanoSeconds = cSecondsToNanos || _initSecondsToNanos();

    // Nanoseconds overflow check
    if (nanos >= nanoSeconds.v) {
        nanos -= nanoSeconds.v;
        return _createHrTime(seconds + 1, nanos);
    }

    return _createHrTime(seconds, nanos);
}
