

/**
 * Configuration interface for OpenTelemetry attribute limits.
 * These limits help control the size and number of attributes to prevent
 * excessive memory usage and ensure consistent performance.
 * 
 * @example
 * ```typescript
 * const limits: IOTelAttributeLimits = {
 *   attributeCountLimit: 128,        // Maximum 128 attributes
 *   attributeValueLengthLimit: 4096  // Maximum 4KB per attribute value
 * };
 * ```
 * 
 * @remarks
 * When limits are exceeded:
 * - Additional attributes beyond `attributeCountLimit` are dropped
 * - Attribute values longer than `attributeValueLengthLimit` are truncated
 * - The behavior may vary based on the specific implementation
 * 
 * @since 3.4.0
 */
export interface IOTelAttributeLimits {
    /**
     * Maximum allowed length for attribute values in characters.
     * 
     * @remarks
     * - Values longer than this limit will be truncated
     * - Applies to string attribute values only
     * - Numeric and boolean values are not affected by this limit
     * - Array values have this limit applied to each individual element
     * 
     * @defaultValue 4096
     * 
     * @example
     * ```typescript
     * // If attributeValueLengthLimit is 100:
     * span.setAttribute("description", "a".repeat(200)); // Will be truncated to 100 characters
     * span.setAttribute("count", 12345);                 // Not affected (number)
     * span.setAttribute("enabled", true);                // Not affected (boolean)
     * ```
     */
    attributeValueLengthLimit?: number;

    /**
     * Maximum number of attributes allowed per telemetry item.
     * 
     * @remarks
     * - Attributes added beyond this limit will be dropped
     * - The order of attributes matters; earlier attributes take precedence
     * - This limit applies to the total count of attributes, regardless of their type
     * - Inherited or default attributes count toward this limit
     * 
     * @defaultValue 128
     * 
     * @example
     * ```typescript
     * // If attributeCountLimit is 5:
     * span.setAttributes({
     *   "attr1": "value1",  // Kept
     *   "attr2": "value2",  // Kept
     *   "attr3": "value3",  // Kept
     *   "attr4": "value4",  // Kept
     *   "attr5": "value5",  // Kept
     *   "attr6": "value6"   // Dropped (exceeds limit)
     * });
     * ```
     */
    attributeCountLimit?: number;
}