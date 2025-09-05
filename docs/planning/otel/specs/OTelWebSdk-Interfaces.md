# OpenTelemetry Web SDK Interface Definitions

This document contains the complete interface definitions for the OpenTelemetry Web SDK, following interface-first design principles with strict Inversion of Control (IoC) architecture.

## Core Design Principles

- **No Global State**: All dependencies must be explicitly injected through factory functions
- **Interface-First**: All public APIs defined as TypeScript interfaces before implementation
- **Dependency Injection**: Components receive dependencies through configuration, not global access
- **Closure OR DynamicProto**: Implementation uses EITHER closure pattern OR DynamicProto-JS for complex inheritance
- **Multi-Tenant Support**: Multiple SDK instances can coexist without interference

## Core SDK Interfaces

### Main SDK Interface

```typescript
/**
 * Main interface for the OpenTelemetry Web SDK instance
 * Provides access to all telemetry providers and SDK management functions
 * Created through factory functions with explicit dependency injection
 */
export interface IOTelWebSdk {
  /** Get a tracer for creating spans */
  getTracer(name: string, version?: string, options?: IOTelTracerOptions): IOTelTracer;
  
  /** Get a logger for emitting log records */  
  getLogger(name: string, version?: string, options?: IOTelLoggerOptions): IOTelLogger;
  
  /** Get a meter for recording metrics */
  getMeter(name: string, version?: string, options?: IOTelMeterOptions): IOTelMeter;
  
  /** Update SDK configuration at runtime (where supported) */
  updateConfig(config: Partial<IOTelWebSdkConfig>): Promise<void>;
  
  /** Completely unload the SDK instance and cleanup all resources */
  unload(onDone?: (result: IUnloadResult) => void, timeoutMs?: number): Promise<IUnloadResult>;
  
  /** Get current SDK configuration (read-only) */
  getConfig(): Readonly<IOTelWebSdkConfig>;
  
  /** Get SDK instance metrics and statistics */
  getStats(): ISDKInstanceStats;
}

/**
 * Configuration interface for the OpenTelemetry Web SDK
 * All dependencies must be explicitly provided - no global state access
 */
export interface IOTelWebSdkConfig {
  /** REQUIRED: Resource information for this SDK instance */
  resource: IOTelResource;
  
  /** REQUIRED: Logger for SDK internal diagnostics */
  logger: IOTelLogger;
  
  /** REQUIRED: Performance timing function (injected for testability) */
  performanceNow: () => number;
  
  /** Connection string for telemetry ingestion */
  connectionString?: string;
  
  /** Sampling rate for traces (0.0 - 1.0) */
  samplingRate?: number;
  
  /** Custom properties to add to all telemetry */
  customProperties?: Record<string, any>;
  
  /** Maximum queue size for batching */
  maxQueueSize?: number;
  
  /** Export interval in milliseconds */
  exportInterval?: number;
  
  /** Enable/disable SDK */
  enabled?: boolean;
  
  /** Debug mode */
  debug?: boolean;
  
  /** REQUIRED: Span processors (must be explicitly provided) */
  spanProcessors: IOTelSpanProcessor[];
  
  /** REQUIRED: Log processors (must be explicitly provided) */
  logProcessors: IOTelLogProcessor[];
  
  /** REQUIRED: Metric readers (must be explicitly provided) */
  metricReaders: IOTelMetricReader[];
  
  /** REQUIRED: Context manager implementation */
  contextManager: IOTelContextManager;
  
  /** REQUIRED: Span ID generator implementation */
  idGenerator: IOTelIdGenerator;
  
  /** REQUIRED: Span sampler implementation */
  sampler: IOTelSampler;
  
  /** Instrumentation configurations */
  instrumentations?: IOTelInstrumentationConfig[];
}

/**
 * Result interface for SDK unload operations
 */
export interface IUnloadResult {
  /** Number of spans exported during unload */
  spansExported: number;
  
  /** Number of logs exported during unload */
  logsExported: number;
  
  /** Number of metrics exported during unload */
  metricsExported: number;
  
  /** Total cleanup time in milliseconds */
  cleanupTimeMs: number;
  
  /** Success status */
  success: boolean;
  
  /** Any errors encountered during unload */
  errors?: Error[];
}
```

### Telemetry Provider Interfaces

```typescript
/**
 * Trace provider interface - created through factory with injected dependencies
 */
export interface IOTelTraceProvider {
  /** Get a tracer instance */
  getTracer(name: string, version?: string, options?: IOTelTracerOptions): IOTelTracer;
  
  /** Add a span processor */
  addSpanProcessor(processor: IOTelSpanProcessor): void;
  
  /** Get active span processors */
  getActiveSpanProcessors(): IOTelSpanProcessor[];
  
  /** Force flush all processors */
  forceFlush(): Promise<void>;
  
  /** Shutdown the provider */
  shutdown(): Promise<void>;
}

/**
 * Log provider interface - created through factory with injected dependencies
 */
export interface IOTelLogProvider {
  /** Get a logger instance */
  getLogger(name: string, version?: string, options?: IOTelLoggerOptions): IOTelLogger;
  
  /** Add a log processor */
  addLogProcessor(processor: IOTelLogProcessor): void;
  
  /** Get active log processors */
  getActiveLogProcessors(): IOTelLogProcessor[];
  
  /** Force flush all processors */
  forceFlush(): Promise<void>;
  
  /** Shutdown the provider */
  shutdown(): Promise<void>;
}

/**
 * Meter provider interface - created through factory with injected dependencies
 */
export interface IOTelMeterProvider {
  /** Get a meter instance */
  getMeter(name: string, version?: string, options?: IOTelMeterOptions): IOTelMeter;
  
  /** Add a metric reader */
  addMetricReader(reader: IOTelMetricReader): void;
  
  /** Get active metric readers */
  getActiveMetricReaders(): IOTelMetricReader[];
  
  /** Force flush all readers */
  forceFlush(): Promise<void>;
  
  /** Shutdown the provider */
  shutdown(): Promise<void>;
}

/**
 * Tracer interface for creating and managing spans
 */
export interface IOTelTracer {
  /** Start a new span */
  startSpan(name: string, options?: IOTelSpanOptions): IOTelSpan;
  
  /** Start a span and set it as active in the current context */
  startActiveSpan<T>(name: string, fn: (span: IOTelSpan) => T): T;
  startActiveSpan<T>(name: string, options: IOTelSpanOptions, fn: (span: IOTelSpan) => T): T;
  startActiveSpan<T>(name: string, options: IOTelSpanOptions, context: IOTelContext, fn: (span: IOTelSpan) => T): T;
}

/**
 * Span interface for recording trace data
 */
export interface IOTelSpan {
  /** Set an attribute on the span */
  setAttribute(key: string, value: any): void;
  
  /** Set multiple attributes on the span */
  setAttributes(attributes: Record<string, any>): void;
  
  /** Add an event to the span */
  addEvent(name: string, attributes?: Record<string, any>): void;
  
  /** Set the span status */
  setStatus(status: ISpanStatus): void;
  
  /** Update the span name */
  updateName(name: string): void;
  
  /** End the span */
  end(endTime?: number): void;
  
  /** Check if the span is recording */
  isRecording(): boolean;
  
  /** Get the span context */
  getSpanContext(): ISpanContext;
}

/**
 * Logger interface for emitting log records
 */
export interface IOTelLogger {
  /** Emit a log record */
  emit(logRecord: ILogRecord): void;
  
  /** Log an info message */
  info(message: string, attributes?: Record<string, any>): void;
  
  /** Log a warning message */
  warn(message: string, attributes?: Record<string, any>): void;
  
  /** Log an error message */
  error(message: string, attributes?: Record<string, any>): void;
  
  /** Log a debug message */
  debug(message: string, attributes?: Record<string, any>): void;
}

/**
 * Meter interface for recording basic metrics
 * Note: Only includes basic metric types - advanced features like observable metrics are excluded
 */
export interface IOTelMeter {
  /** Create a counter metric */
  createCounter(name: string, options?: IMetricOptions): ICounter;
  
  /** Create a histogram metric */
  createHistogram(name: string, options?: IMetricOptions): IHistogram;
  
  /** Create a gauge metric */
  createGauge(name: string, options?: IMetricOptions): IGauge;
}
}
```

### Context Management Interfaces

```typescript
/**
 * Context manager interface for managing execution context
 */
export interface IOTelContextManager {
  /** Get the active context */
  active(): IOTelContext;
  
  /** Execute a function with a specific context as active */
  with<T>(context: IOTelContext, fn: () => T): T;
  
  /** Create a new context with a span set as active */
  setSpan(context: IOTelContext, span: IOTelSpan): IOTelContext;
  
  /** Get the active span from a context */
  getSpan(context: IOTelContext): IOTelSpan | undefined;
}

/**
 * Context interface representing execution context
 */
export interface IOTelContext {
  /** Get a value from the context */
  getValue(key: symbol): any;
  
  /** Set a value in the context */
  setValue(key: symbol, value: any): IOTelContext;
  
  /** Delete a value from the context */
  deleteValue(key: symbol): IOTelContext;
}
```

### Required Dependency Interfaces

```typescript
/**
 * ID generator interface - must be injected into trace provider
 */
export interface IOTelIdGenerator {
  /** Generate a new trace ID */
  generateTraceId(): string;
  
  /** Generate a new span ID */
  generateSpanId(): string;
}

/**
 * Sampler interface - must be injected into trace provider
 */
export interface IOTelSampler {
  /** Make sampling decision for a span */
  shouldSample(context: IOTelContext, traceId: string, spanName: string, spanKind: ISpanKind, attributes?: Record<string, any>, links?: ISpanLink[]): ISamplingResult;
}

/**
 * Sampling result interface
 */
export interface ISamplingResult {
  /** Sampling decision */
  decision: ISamplingDecision;
  
  /** Additional attributes to add to the span */
  attributes?: Record<string, any>;
  
  /** Trace state to propagate */
  traceState?: string;
}

/**
 * Sampling decision enumeration
 */
export enum ISamplingDecision {
  /** Do not record or export the span */
  NOT_RECORD = 0,
  
  /** Record the span but do not export */
  RECORD = 1,
  
  /** Record and export the span */
  RECORD_AND_SAMPLED = 2
}

/**
 * Metric reader interface - must be injected into meter provider
 */
export interface IOTelMetricReader {
  /** Collect metrics */
  collect(): Promise<IMetricData[]>;
  
  /** Force flush metrics */
  forceFlush(): Promise<void>;
  
  /** Shutdown the reader */
  shutdown(): Promise<void>;
}

/**
 * SDK instance statistics interface
 */
export interface ISDKInstanceStats {
  /** Instance creation timestamp */
  createdAt: number;
  
  /** Last activity timestamp */
  lastActivityAt: number;
  
  /** Number of spans created */
  spansCreated: number;
  
  /** Number of logs emitted */
  logsEmitted: number;
  
  /** Number of metrics recorded */
  metricsRecorded: number;
  
  /** Current queue sizes */
  queueSizes: {
    spans: number;
    logs: number;
    metrics: number;
  };
  
  /** Memory usage in bytes */
  memoryUsageBytes: number;
}
```

### Configuration and Options Interfaces

```typescript
/**
 * Options for creating a tracer
 */
export interface IOTelTracerOptions {
  /** Schema URL for semantic conventions */
  schemaUrl?: string;
  
  /** Additional tracer attributes */
  attributes?: Record<string, any>;
}

/**
 * Options for creating a logger
 */
export interface IOTelLoggerOptions {
  /** Schema URL for semantic conventions */
  schemaUrl?: string;
  
  /** Additional logger attributes */
  attributes?: Record<string, any>;
}

/**
 * Options for creating a meter
 */
export interface IOTelMeterOptions {
  /** Schema URL for semantic conventions */
  schemaUrl?: string;
  
  /** Additional meter attributes */
  attributes?: Record<string, any>;
}

/**
 * Options for creating a span
 */
export interface IOTelSpanOptions {
  /** Span kind */
  kind?: ISpanKind;
  
  /** Start time for the span */
  startTime?: number;
  
  /** Initial attributes for the span */
  attributes?: Record<string, any>;
  
  /** Links to other spans */
  links?: ISpanLink[];
  
  /** Parent context */
  parent?: IOTelContext;
}

/**
 * Configuration for instrumentations
 */
export interface IOTelInstrumentationConfig {
  /** Name of the instrumentation */
  name: string;
  
  /** Version of the instrumentation */
  version?: string;
  
  /** Whether the instrumentation is enabled */
  enabled?: boolean;
  
  /** Instrumentation-specific configuration */
  config?: Record<string, any>;
}
```

### Processor and Exporter Interfaces

```typescript
/**
 * Span processor interface
 */
export interface IOTelSpanProcessor {
  /** Called when a span is started */
  onStart(span: IOTelSpan, parentContext?: IOTelContext): void;
  
  /** Called when a span is ended */
  onEnd(span: IOTelSpan): void;
  
  /** Force flush any pending spans */
  forceFlush(): Promise<void>;
  
  /** Shutdown the processor */
  shutdown(): Promise<void>;
}

/**
 * Span exporter interface
 */
export interface ISpanExporter {
  /** Export spans */
  export(spans: IOTelSpan[]): Promise<IExportResult>;
  
  /** Shutdown the exporter */
  shutdown(): Promise<void>;
}

/**
 * Log processor interface
 */
export interface IOTelLogProcessor {
  /** Called when a log record is emitted */
  onEmit(logRecord: ILogRecord): void;
  
  /** Force flush any pending log records */
  forceFlush(): Promise<void>;
  
  /** Shutdown the processor */
  shutdown(): Promise<void>;
}

/**
 * Log exporter interface
 */
export interface ILogExporter {
  /** Export log records */
  export(logRecords: ILogRecord[]): Promise<IExportResult>;
  
  /** Shutdown the exporter */
  shutdown(): Promise<void>;
}

/**
 * Metric processor interface
 */
export interface IMetricProcessor {
  /** Process metric data */
  process(metrics: IMetricData[]): IMetricData[];
  
  /** Shutdown the processor */
  shutdown(): Promise<void>;
}

/**
 * Metric exporter interface
 */
export interface IMetricExporter {
  /** Export metrics */
  export(metrics: IMetricData[]): Promise<IExportResult>;
  
  /** Shutdown the exporter */
  shutdown(): Promise<void>;
}
```

### Data Model Interfaces

```typescript
/**
 * Log record interface
 */
export interface ILogRecord {
  /** Log timestamp */
  timestamp?: number;
  
  /** Log severity level */
  severityLevel?: ISeverityLevel;
  
  /** Log severity text */
  severityText?: string;
  
  /** Log message */
  body?: string;
  
  /** Log attributes */
  attributes?: Record<string, any>;
  
  /** Resource attributes */
  resource?: IOTelResource;
  
  /** Instrumentation scope */
  instrumentationScope?: IInstrumentationScope;
}

/**
 * Metric data interface
 */
export interface IMetricData {
  /** Metric name */
  name: string;
  
  /** Metric description */
  description?: string;
  
  /** Metric unit */
  unit?: string;
  
  /** Metric type */
  type: IMetricType;
  
  /** Metric data points */
  dataPoints: IDataPoint[];
  
  /** Resource attributes */
  resource?: IOTelResource;
  
  /** Instrumentation scope */
  instrumentationScope?: IInstrumentationScope;
}

/**
 * Span context interface
 */
export interface ISpanContext {
  /** Trace ID */
  traceId: string;
  
  /** Span ID */
  spanId: string;
  
  /** Trace flags */
  traceFlags: number;
  
  /** Trace state */
  traceState?: string;
  
  /** Whether the context is remote */
  isRemote?: boolean;
}

/**
 * Resource interface
 */
export interface IOTelResource {
  /** Resource attributes */
  attributes: Record<string, any>;
  
  /** Merge with another resource */
  merge(other: IOTelResource): IOTelResource;
}

/**
 * Instrumentation scope interface
 */
export interface IInstrumentationScope {
  /** Instrumentation name */
  name: string;
  
  /** Instrumentation version */
  version?: string;
  
  /** Schema URL */
  schemaUrl?: string;
  
  /** Additional attributes */
  attributes?: Record<string, any>;
}
```

### Factory Function Interfaces

```typescript
/**
 * Factory function to create standalone SDK instance
 * All dependencies must be explicitly provided through config
 */
export function createOTelWebSdk(config: IOTelWebSdkConfig): IOTelWebSdk;

/**
 * Factory function for trace provider with dependency injection
 */
export function createTraceProvider(config: ITraceProviderConfig): IOTelTraceProvider;

/**
 * Factory function for log provider with dependency injection
 */
export function createLogProvider(config: ILogProviderConfig): IOTelLogProvider;

/**
 * Factory function for meter provider with dependency injection
 */
export function createMeterProvider(config: IMeterProviderConfig): IOTelMeterProvider;

/**
 * Trace provider configuration with explicit dependencies
 */
export interface ITraceProviderConfig {
  /** REQUIRED: Resource information */
  resource: IOTelResource;
  
  /** REQUIRED: Span processors */
  spanProcessors: IOTelSpanProcessor[];
  
  /** REQUIRED: Sampler implementation */
  sampler: IOTelSampler;
  
  /** REQUIRED: ID generator for span and trace IDs */
  idGenerator: IOTelIdGenerator;
  
  /** REQUIRED: Context manager */
  contextManager: IOTelContextManager;
  
  /** REQUIRED: Logger for internal diagnostics */
  logger: IOTelLogger;
  
  /** REQUIRED: Performance timing function */
  performanceNow: () => number;
}

/**
 * Log provider configuration with explicit dependencies
 */
export interface ILogProviderConfig {
  /** REQUIRED: Resource information */
  resource: IOTelResource;
  
  /** REQUIRED: Log processors */
  logProcessors: IOTelLogProcessor[];
  
  /** REQUIRED: Context manager */
  contextManager: IOTelContextManager;
  
  /** REQUIRED: Logger for internal diagnostics */
  logger: IOTelLogger;
  
  /** REQUIRED: Performance timing function */
  performanceNow: () => number;
}

/**
 * Meter provider configuration with explicit dependencies
 */
export interface IMeterProviderConfig {
  /** REQUIRED: Resource information */
  resource: IOTelResource;
  
  /** REQUIRED: Metric readers */
  metricReaders: IOTelMetricReader[];
  
  /** REQUIRED: Logger for internal diagnostics */
  logger: IOTelLogger;
  
  /** REQUIRED: Performance timing function */
  performanceNow: () => number;
}
```

## Enums and Constants

```typescript
/**
 * Span kind enumeration
 */
export enum ISpanKind {
  INTERNAL = 0,
  SERVER = 1,
  CLIENT = 2,
  PRODUCER = 3,
  CONSUMER = 4
}

/**
 * Span status code enumeration
 */
export enum ISpanStatusCode {
  UNSET = 0,
  OK = 1,
  ERROR = 2
}

/**
 * Severity level enumeration
 */
export enum ISeverityLevel {
  TRACE = 1,
  DEBUG = 5,
  INFO = 9,
  WARN = 13,
  ERROR = 17,
  FATAL = 21
}

/**
 * Metric type enumeration
 */
export enum IMetricType {
  COUNTER = 'Counter',
  HISTOGRAM = 'Histogram',
  UP_DOWN_COUNTER = 'UpDownCounter',
  OBSERVABLE_GAUGE = 'ObservableGauge',
  OBSERVABLE_COUNTER = 'ObservableCounter',
  OBSERVABLE_UP_DOWN_COUNTER = 'ObservableUpDownCounter'
}

/**
 * Export result status enumeration
 */
export enum IExportResultCode {
  SUCCESS = 0,
  FAILED = 1,
  FAILED_RETRYABLE = 2
}
```

This comprehensive interface definition enables:

1. **Type Safety**: Full TypeScript support with strict typing
2. **Interface-First Design**: All APIs defined as contracts before implementation
3. **Multi-Tenant Support**: Multiple SDK instance management with resource sharing
4. **Extensibility**: Plugin architecture through processor and exporter interfaces
5. **Testability**: All interfaces can be mocked for testing
6. **Standards Compliance**: Follows OpenTelemetry API specifications
7. **Resource Management**: Complete lifecycle and cleanup control
8. **Dependency Injection**: All dependencies explicitly provided, no global state
9. **Performance Optimization**: Designed for closure OR DynamicProto implementation patterns

## Implementation Pattern Guidelines

### Implementation Pattern Guidelines

All interfaces are designed to be implemented using EITHER the closure pattern OR DynamicProto-JS pattern:

```typescript
// Example implementation pattern for IOTelTraceProvider
export function createTraceProvider(config: ITraceProviderConfig): IOTelTraceProvider {
  // Validate all required dependencies are provided
  if (!config.resource) {
    throw new Error("Resource must be provided to TraceProvider");
  }
  // ... validate other required dependencies

  // Private closure variables - completely encapsulated
  let _config = { ...config };
  let _tracers = new Map<string, IOTelTracer>();
  let _processors = [...config.spanProcessors];
  let _isShutdown = false;

  // Create the interface instance
  let _self = {} as IOTelTraceProvider;

  // Define methods directly on the interface instance
  _self.getTracer = (name: string, version?: string, options?: IOTelTracerOptions): IOTelTracer => {
    if (_isShutdown) {
      throw new Error("TraceProvider is shutdown");
    }
    
    const key = `${name}@${version || 'unknown'}`;
    let tracer = _tracers.get(key);
    
    if (!tracer) {
      tracer = createTracer({
        name,
        version,
        resource: _config.resource,  // Injected dependency
        processors: _processors,     // Injected dependency
        contextManager: _config.contextManager, // Injected dependency
        logger: _config.logger,      // Injected dependency
        // All dependencies come from injected config
        ...options
      });
      _tracers.set(key, tracer);
    }
    
    return tracer;
  };

  // Other method implementations...

  return _self;
}
```

### Key Implementation Principles

1. **All Dependencies Injected**: No global variable access or singleton patterns
2. **Closure Encapsulation**: Private state completely hidden from external access
3. **Interface Compliance**: Implementation must satisfy the interface contract exactly
4. **Error Handling**: Comprehensive validation of injected dependencies
5. **Performance**: DynamicProto pattern optimizes method calls and memory usage
6. **Testability**: All dependencies can be mocked through the config parameter

## Related Documentation

### Operational Guides
- **[Testing Strategy](./OTelWebSdk-Testing.md)** - Interface testing patterns and mock strategies
- **[Performance Strategy](./OTelWebSdk-Performance.md)** - Performance optimization with interface constraints
- **[Migration Guide](./OTelWebSdk-Migration.md)** - Interface compatibility and migration patterns
