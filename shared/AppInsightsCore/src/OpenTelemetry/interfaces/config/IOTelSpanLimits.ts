// import { IOTelAttributeLimits } from "./IOTelAttributeLimits";

// /**
//  * Configuration interface for OpenTelemetry span-specific limits.
//  * Extends the general attribute limits with additional constraints specific to spans,
//  * including limits on events, links, and their associated attributes.
//  * 
//  * @example
//  * ```typescript
//  * const spanLimits: IOTelSpanLimits = {
//  *   // Inherited from IOTelAttributeLimits
//  *   attributeCountLimit: 128,
//  *   attributeValueLengthLimit: 4096,
//  *   
//  *   // Span-specific limits
//  *   linkCountLimit: 128,
//  *   eventCountLimit: 128,
//  *   attributePerEventCountLimit: 32,
//  *   attributePerLinkCountLimit: 32
//  * };
//  * ```
//  * 
//  * @remarks
//  * These limits help prevent spans from consuming excessive memory and ensure
//  * consistent performance even when dealing with complex traces that have many
//  * events, links, or attributes.
//  * 
//  * @since 3.4.0
//  */
// export interface IOTelSpanLimits extends IOTelAttributeLimits {
  
//     /**
//      * Maximum number of links allowed per span.
//      * 
//      * @remarks
//      * - Links added beyond this limit will be dropped
//      * - Links are typically added at span creation time
//      * - Each link represents a causal relationship with another span
//      * - Links added after creation may be subject to additional restrictions
//      * 
//      * @defaultValue 128
//      * 
//      * @example
//      * ```typescript
//      * const span = tracer.startSpan("operation", {
//      *   links: [
//      *     { context: relatedSpanContext1 },
//      *     { context: relatedSpanContext2 },
//      *     // ... up to linkCountLimit links
//      *   ]
//      * });
//      * ```
//      */
//     linkCountLimit?: number;
    
//     /**
//      * Maximum number of events allowed per span.
//      * 
//      * @remarks
//      * - Events added beyond this limit will be dropped
//      * - Events are typically used to mark significant points during span execution
//      * - Each event can have its own set of attributes (limited by attributePerEventCountLimit)
//      * - Events are ordered chronologically within the span
//      * 
//      * @defaultValue 128
//      * 
//      * @example
//      * ```typescript
//      * // If eventCountLimit is 3:
//      * span.addEvent("started");           // Kept
//      * span.addEvent("processing");        // Kept  
//      * span.addEvent("validation");        // Kept
//      * span.addEvent("completed");         // Dropped (exceeds limit)
//      * ```
//      */
//     eventCountLimit?: number;
    
//     /**
//      * Maximum number of attributes allowed per span event.
//      * 
//      * @remarks
//      * - This limit applies to each individual event within a span
//      * - Attributes added to events beyond this limit will be dropped
//      * - This is separate from the span's own attribute limits
//      * - Event attributes are useful for providing context about what happened at that point in time
//      * 
//      * @defaultValue 32
//      * 
//      * @example
//      * ```typescript
//      * // If attributePerEventCountLimit is 2:
//      * span.addEvent("user_action", {
//      *   "action": "click",        // Kept
//      *   "element": "button",      // Kept
//      *   "timestamp": "12345"      // Dropped (exceeds per-event limit)
//      * });
//      * ```
//      */
//     attributePerEventCountLimit?: number;
  
//     /**
//      * Maximum number of attributes allowed per span link.
//      * 
//      * @remarks
//      * - This limit applies to each individual link within a span
//      * - Attributes added to links beyond this limit will be dropped
//      * - This is separate from the span's own attribute limits
//      * - Link attributes provide additional context about the relationship between spans
//      * 
//      * @defaultValue 32
//      * 
//      * @example
//      * ```typescript
//      * // If attributePerLinkCountLimit is 2:
//      * const span = tracer.startSpan("operation", {
//      *   links: [{
//      *     context: relatedSpanContext,
//      *     attributes: {
//      *       "relationship": "follows",    // Kept
//      *       "correlation_id": "abc123",   // Kept
//      *       "priority": "high"            // Dropped (exceeds per-link limit)
//      *     }
//      *   }]
//      * });
//      * ```
//      */
//     attributePerLinkCountLimit?: number;
// }
