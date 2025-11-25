
/**
 * High-resolution time represented as a tuple of [seconds, nanoseconds].
 * This is the base type for all OpenTelemetry high-resolution time values.
 * 
 * @remarks
 * The first element represents seconds since Unix epoch, and the second element
 * represents nanoseconds (0-999,999,999) within that second.
 * 
 * @example
 * ```typescript
 * const hrTime: OTelHrTimeBase = [1609459200, 500000000]; // 2021-01-01 00:00:00.5 UTC
 * ```
 * 
 * @since 3.4.0
 */
export type OTelHrTimeBase = [number, number];

/**
 * Enhanced high-resolution time interface that extends the base tuple with additional properties.
 * Provides a more structured way to work with high-resolution timestamps.
 * 
 * @example
 * ```typescript
 * const hrTime: IOTelHrTime = {
 *   0: 1609459200,     // seconds since Unix epoch
 *   1: 500000000,      // nanoseconds (0-999,999,999)
 * };
 * ```
 * 
 * @since 3.4.0
 */
export interface IOTelHrTime extends OTelHrTimeBase {
    /**
     * Seconds since Unix epoch (January 1, 1970 00:00:00 UTC).
     * Must be a non-negative integer.
     */
    0: number;
    
    /**
     * Nanoseconds within the second specified by index 0.
     * Must be in the range [0, 999999999].
     */
    1: number;
    
    /**
     * Optional total nanoseconds since Unix epoch.
     * When provided, this should be equivalent to (this[0] * 1e9) + this[1].
     *
     * @remarks
     * This field may be used for more efficient time calculations or when
     * working with systems that natively use nanosecond timestamps.
     */
    // unixNano?: number;
}

/**
 * Union type representing all valid time input formats accepted by OpenTelemetry APIs.
 * 
 * @remarks
 * - `IOTelHrTime`: High-resolution time with nanosecond precision
 * - `number`: Milliseconds since Unix epoch (JavaScript Date.now() format)
 * - `Date`: JavaScript Date object
 * 
 * @example
 * ```typescript
 * // All of these are valid time inputs:
 * const hrTime: OTelTimeInput = [1609459200, 500000000];
 * const msTime: OTelTimeInput = Date.now();
 * const dateTime: OTelTimeInput = new Date();
 * 
 * span.addEvent("event", {}, hrTime);
 * span.addEvent("event", {}, msTime);
 * span.addEvent("event", {}, dateTime);
 * ```
 * 
 * @since 3.4.0
 */
export type OTelTimeInput = IOTelHrTime | number | Date;
