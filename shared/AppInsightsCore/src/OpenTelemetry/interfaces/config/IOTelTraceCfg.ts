import { IOTelContextManager } from "../context/IOTelContextManager";
import { IOTelAttributeLimits } from "./IOTelAttributeLimits";
import { IOTelSpanLimits } from "./IOTelSpanLimits";

/**
 * Configuration interface for OpenTelemetry tracing functionality.
 * This interface contains all the settings that control how traces are created,
 * processed, and managed within the OpenTelemetry system.
 * 
 * @example
 * ```typescript
 * const traceCfg: IOTelTraceCfg = {
 *   serviceName: "my-service",
 *   generalLimits: {
 *     attributeCountLimit: 128,
 *     attributeValueLengthLimit: 4096
 *   },
 *   spanLimits: {
 *     attributeCountLimit: 128,
 *     linkCountLimit: 128,
 *     eventCountLimit: 128
 *   }
 * };
 * ```
 * 
 * @since 3.4.0
 */
export interface IOTelTraceCfg {
    /**
     * The context manager instance responsible for managing trace context propagation.
     * If not provided, a default context manager implementation will be used.
     * 
     * @remarks
     * The context manager handles the storage and retrieval of active spans and
     * other contextual information as execution flows through different parts of
     * the application, including across asynchronous boundaries.
     */
    // contextManager?: IOTelContextManager;

    // textMapPropagator?: TextMapPropagator;

    // sampler?: IOTelSampler;
    
    /**
     * Global attribute limits that apply to all telemetry items.
     * These limits help prevent excessive memory usage and ensure consistent
     * behavior across different telemetry types.
     * 
     * @remarks
     * These limits are inherited by more specific configurations unless overridden.
     * For example, spans will use these limits unless `spanLimits` specifies different values.
     */
    generalLimits?: IOTelAttributeLimits;

    /**
     * Specific limits that apply only to spans.
     * These limits override the general limits for span-specific properties.
     * 
     * @remarks
     * Includes limits for attributes, events, links, and their associated attributes.
     * This allows for fine-tuned control over span size and complexity.
     */
    spanLimits?: IOTelSpanLimits;

    // idGenerator?: IOTelIdGenerator;

    // logRecordProcessors?: LogRecordProcessor[];
    // metricReader: IMetricReader;
    // views: ViewOptions[];
    // instrumentations: (Instrumentation | Instrumentation[])[];
    // resource: Resource;
    // resourceDetectors: Array<ResourceDetector>;
    
    /**
     * The name of the service generating telemetry data.
     * This name will be included in all telemetry items as a resource attribute.
     * 
     * @remarks
     * The service name is crucial for identifying and filtering telemetry data
     * in observability systems. It should be consistent across all instances
     * of the same service.
     * 
     * @example
     * ```typescript
     * serviceName: "user-authentication-service"
     * ```
     */
    serviceName?: string;
    
    // spanProcessors?: SpanProcessor[];
    // traceExporter: SpanExporter;
}
