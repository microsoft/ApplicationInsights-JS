# OTelClientSdk Architecture

## Introduction

This document outlines the architectural design for the OTelClientSdk within the ApplicationInsights-JS repository. The implementation follows the OpenTelemetry specification for tracing, logging, and metrics while integrating with Azure Monitor backend services. The design avoids global singletons and emphasizes explicit instance creation to give users full control over the SDK.

## Core Principles

1. **Interface-First Design**: All public APIs are defined as interfaces with `I` prefix, and internal interfaces are prefixed with `_I`
2. **No Global Singletons**: The design avoids using global variables like context, api, trace, and log
3. **Explicit Instance Creation**: Users must explicitly create instances through factory functions
4. **Full OTel Compliance**: Complete implementation of OpenTelemetry's trace, log, and metrics APIs
5. **Modular Design**: Components can be selectively imported for tree-shaking
6. **Context Management**: Better control over context propagation with explicit creation
7. **Extensibility**: Support for custom exporters, processors, and samplers
8. **Performance Optimization**: Use of closures and DynamicProto-JS for efficient implementation

## Interface-First Design Pattern

The OTelClientSdk implements an interface-first design pattern that prioritizes clear API contracts and encapsulation. This pattern has several key elements:

1. **Public Interfaces**: All public APIs are defined through interfaces with the `I` prefix
   - Example: `ITraceProvider`, `ISpan`, `ILogger`, etc.
   - Include comprehensive JSDoc documentation
   - Define explicit method signatures with proper typing
   - Exposed in the public API surface

2. **Internal Interfaces**: Implementation details are defined through interfaces with `_I` prefix
   - Example: `_ITraceProviderInternal`, `_ISpanInternal`, etc.
   - Marked with `@internal` JSDoc tags
   - May extend public interfaces with additional internal methods
   - Not exported in the public API

3. **Factory Functions**: Components are created through factory functions instead of constructors
   - Example: `createTraceProvider()` instead of `new TraceProvider()`
   - Return interface types rather than implementation types
   - Hide implementation details from consumers
   - Handle initialization complexity
   - Provide sensible defaults

4. **Hidden Implementation Classes**: Implementation details are hidden
   - Classes are not exported to consumers
   - State is managed through closures
   - Internal implementation can change without breaking API
   - Enables better tree-shaking and bundle size optimization

### Interface Example

```typescript
/**
 * Interface for a trace provider that creates and manages tracers
 * @public
 */
export interface ITraceProvider {
  /**
   * Returns a tracer instance for the given name and version
   * @param name - The instrumentation name
   * @param version - Optional instrumentation version
   * @returns A tracer instance
   */
  getTracer(name: string, version?: string): ITracer;
  
  /**
   * Adds a span processor to this trace provider
   * @param processor - The span processor to add
   */
  addSpanProcessor(processor: ISpanProcessor): void;
  
  /**
   * Forces a flush of all span processors
   * @returns A promise that resolves when all spans are flushed
   */
  forceFlush(): Promise<void>;
  
  /**
   * Shuts down the trace provider and its span processors
   * @returns A promise that resolves when shutdown is complete
   */
  shutdown(): Promise<void>;
}

/**
 * Internal interface for trace provider implementation details
 * @internal
 */
export interface _ITraceProviderInternal extends ITraceProvider {
  /**
   * Gets the resource associated with this provider
   * @internal
   */
  _getResource(): IResource;
  
  /**
   * Gets all registered span processors
   * @internal
   */
  _getSpanProcessors(): ReadonlyArray<ISpanProcessor>;
  
  /**
   * Gets all active tracers
   * @internal
   */
  _getTracers(): ReadonlyMap<string, ITracer>;
}
```

### Factory Function Example

```typescript
/**
 * Creates a new trace provider
 * @param config - Optional configuration for the trace provider
 * @param resource - The resource that identifies the source of the telemetry
 * @returns A new trace provider instance
 */
export function createTraceProvider(
  config?: ITraceConfig,
  resource?: IResource
): ITraceProvider {
  // Private closure variables
  const _resource = resource || createResource({
    'service.name': 'unknown_service'
  });
  
  const _config = config || {};
  const _tracers = new Map<string, ITracer>();
  const _processors: ISpanProcessor[] = [];
  
  // Create the instance
  const _self: _ITraceProviderInternal = {
    getTracer(name: string, version?: string): ITracer {
      const key = `${name}@${version || ''}`;
      
      if (!_tracers.has(key)) {
        _tracers.set(key, createTracer(name, version, _resource));
      }
      
      return _tracers.get(key)!;
    },
    
    addSpanProcessor(processor: ISpanProcessor): void {
      _processors.push(processor);
    },
    
    forceFlush(): Promise<void> {
      return Promise.all(_processors.map(p => p.forceFlush())).then(() => {});
    },
    
    shutdown(): Promise<void> {
      return Promise.all(_processors.map(p => p.shutdown())).then(() => {});
    },
    
    // Internal methods
    _getResource(): IResource {
      return _resource;
    },
    
    _getSpanProcessors(): ReadonlyArray<ISpanProcessor> {
      return [..._processors];
    },
    
    _getTracers(): ReadonlyMap<string, ITracer> {
      return new Map(_tracers);
    }
  };
  
  return _self;
}
```

## Component Architecture

### High-Level Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                        IOTelClientSdk                                 │
│                                                                       │
├───────────────┬─────────────────┬─────────────────┬─────────────────┐
│               │                 │                 │                 │
│    Trace      │      Logs       │     Metrics     │     Context     │
│               │                 │                 │                 │
└───────┬───────┴────────┬────────┴────────┬────────┴────────┬────────┘
        │                │                 │                 │
        ▼                ▼                 ▼                 ▼
┌───────────────┐ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ITraceProvider │ │ILoggerProvider│  │IMeterProvider│  │IContextManager│
└───────┬───────┘ └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
        │                │                │                │
        ▼                ▼                ▼                │
┌───────────────┐ ┌─────────────┐  ┌─────────────┐        │
│    ITracer    │ │   ILogger   │  │   IMeter    │        │
└───────┬───────┘ └──────┬──────┘  └──────┬──────┘        │
        │                │                │                │
        ▼                ▼                ▼                │
┌───────────────┐ ┌─────────────┐  ┌─────────────┐        │
│     ISpan     │ │ ILogRecord  │  │ IInstrument │        │
└───────┬───────┘ └──────┬──────┘  └──────┬──────┘        │
        │                │                │                │
        ▼                ▼                ▼                ▼
┌───────────────┐ ┌─────────────┐  ┌─────────────┐ ┌─────────────┐
│ISpanProcessor │ │ILogProcessor │  │IMetricReader│ │IPropagation │
└───────┬───────┘ └──────┬──────┘  └──────┬──────┘ └──────┬──────┘
        │                │                │               │
        ▼                ▼                ▼               ▼
┌───────────────┐ ┌─────────────┐  ┌─────────────┐ ┌─────────────┐
│ISpanExporter  │ │ILogExporter │  │IMetricExporter│ │ ITextMap   │
└───────┬───────┘ └──────┬──────┘  └──────┬──────┘ │ Propagator  │
        │                │                │        └─────────────┘
        └────────┬───────┴────────┬───────┘
                 ▼                ▼
         ┌─────────────────┬─────────────────┐
         │  Azure Monitor  │  Other Backends │
         │  Backend API    │  (Optional)     │
         └─────────────────┴─────────────────┘
```

### Processing Pipeline

Each telemetry type follows a similar processing pipeline:

```
┌─────────────┐     ┌───────────────┐     ┌──────────────┐     ┌──────────────┐
│ Telemetry   │ ──> │ Processors    │ ──> │ Exporters    │ ──> │ Backend      │
│ Generation  │     │ (Batching,    │     │ (Protocol    │     │ Systems      │
│             │     │  Filtering)   │     │  Adapters)   │     │              │
└─────────────┘     └───────────────┘     └──────────────┘     └──────────────┘
```

## Key Components

### 1. IOTelClientSdk

The main entry point that provides access to all functionality:

**Public Interface:**

```typescript
/**
 * Main interface for the OpenTelemetry Client SDK
 */
export interface IOTelClientSdk {
  /**
   * Provider for tracing functionality
   */
  traceProvider: ITraceProvider;
  
  /**
   * Provider for logging functionality
   */
  loggerProvider: ILoggerProvider;
  
  /**
   * Provider for metrics functionality
   */
  meterProvider: IMeterProvider;
  
  /**
   * Manager for context propagation
   */
  contextManager: IContextManager;
  
  /**
   * Main propagator for context propagation
   */
  propagator: IPropagator;
  
  /**
   * Shuts down the SDK, flushing any pending telemetry
   * @returns A promise that resolves when shutdown is complete
   */
  shutdown(): Promise<void>;
  
  /**
   * Forces a flush of all pending telemetry
   * @returns A promise that resolves when flush is complete
   */
  forceFlush(): Promise<void>;
}

/**
 * Configuration options for the OpenTelemetry Client SDK
 */
export interface IOTelClientConfig {
  /**
   * Azure Monitor connection string
   */
  connectionString?: string;
  
  /**
   * Azure Monitor instrumentation key (deprecated, use connectionString instead)
   */
  instrumentationKey?: string;
  
  /**
   * Resource that represents the source of telemetry
   */
  resource?: IResource;
  
  /**
   * Configuration for tracing functionality
   */
  traceConfig?: ITraceConfig;
  
  /**
   * Configuration for logging functionality
   */
  logConfig?: ILogConfig;
  
  /**
   * Configuration for metrics functionality
   */
  metricConfig?: IMetricConfig;
}

/**
 * Creates a new OTelClientSdk instance
 * @param config Configuration for the SDK
 * @returns A new OTelClientSdk instance
 */
export function createOTelClientSdk(config: IOTelClientConfig): IOTelClientSdk;
```

### 2. ITraceProvider

TraceProvider is the entry point for tracing functionality:

**Public Interface:**

```typescript
/**
 * Provider for tracing functionality
 */
export interface ITraceProvider {
  /**
   * Returns a Tracer for use by the given instrumentation library
   * @param name Name of the tracer (usually component name)
   * @param version Optional version of the component
   * @param options Optional configuration options
   * @returns A tracer instance
   */
  getTracer(name: string, version?: string, options?: ITracerOptions): ITracer;
  
  /**
   * Adds a SpanProcessor to this TraceProvider
   * @param processor The span processor to add
   */
  addSpanProcessor(processor: ISpanProcessor): void;
  
  /**
   * Shuts down this TraceProvider
   * @returns A promise that resolves when shutdown is complete
   */
  shutdown(): Promise<void>;
  
  /**
   * Forces a flush of all pending spans
   * @returns A promise that resolves when flush is complete
   */
  forceFlush(): Promise<void>;
}

/**
 * @internal
 * Internal interface for TraceProvider implementation details
 */
export interface _ITraceProviderInternal extends ITraceProvider {
  _getActiveSpan(): ISpan | undefined;
  _processSpanData(span: _ISpanInternal): void;
}

/**
 * Creates a new TraceProvider instance
 * @param config Configuration for the TraceProvider
 * @param resource Resource that represents the source of telemetry
 * @returns A new TraceProvider instance
 */
export function createTraceProvider(config: ITraceConfig, resource: IResource): ITraceProvider;
```

### 3. ILoggerProvider

LoggerProvider is the entry point for logging functionality:

**Public Interface:**

```typescript
/**
 * Provider for logging functionality
 */
export interface ILoggerProvider {
  /**
   * Returns a Logger for use by the given instrumentation library
   * @param name Name of the logger (usually component name)
   * @param version Optional version of the component
   * @param options Optional configuration options
   * @returns A logger instance
   */
  getLogger(name: string, version?: string, options?: ILoggerOptions): ILogger;
  
  /**
   * Adds a LogRecordProcessor to this LoggerProvider
   * @param processor The log record processor to add
   */
  addLogRecordProcessor(processor: ILogRecordProcessor): void;
  
  /**
   * Shuts down this LoggerProvider
   * @returns A promise that resolves when shutdown is complete
   */
  shutdown(): Promise<void>;
  
  /**
   * Forces a flush of all pending logs
   * @returns A promise that resolves when flush is complete
   */
  forceFlush(): Promise<void>;
}

/**
 * @internal
 * Internal interface for LoggerProvider implementation details
 */
export interface _ILoggerProviderInternal extends ILoggerProvider {
  _processLogRecord(logRecord: ILogRecord): void;
}

/**
 * Creates a new LoggerProvider instance
 * @param config Configuration for the LoggerProvider
 * @param resource Resource that represents the source of telemetry
 * @returns A new LoggerProvider instance
 */
export function createLoggerProvider(config: ILogConfig, resource: IResource): ILoggerProvider;
```

### 4. IMeterProvider

MeterProvider is the entry point for metrics functionality:

**Public Interface:**

```typescript
/**
 * Provider for metrics functionality
 */
export interface IMeterProvider {
  /**
   * Returns a Meter for use by the given instrumentation library
   * @param name Name of the meter (usually component name)
   * @param version Optional version of the component
   * @param options Optional configuration options
   * @returns A meter instance
   */
  getMeter(name: string, version?: string, options?: IMeterOptions): IMeter;
  
  /**
   * Adds a MetricReader to this MeterProvider
   * @param reader The metric reader to add
   */
  addMetricReader(reader: IMetricReader): void;
  
  /**
   * Shuts down this MeterProvider
   * @returns A promise that resolves when shutdown is complete
   */
  shutdown(): Promise<void>;
  
  /**
   * Forces a flush of all pending metrics
   * @returns A promise that resolves when flush is complete
   */
  forceFlush(): Promise<void>;
}

/**
 * Creates a new MeterProvider instance
 * @param config Configuration for the MeterProvider
 * @param resource Resource that represents the source of telemetry
 * @returns A new MeterProvider instance
 */
export function createMeterProvider(config: IMetricConfig, resource: IResource): IMeterProvider;
```

### 5. IContextManager

ContextManager is responsible for managing context propagation:

**Public Interface:**

```typescript
/**
 * Manager for context propagation
 */
export interface IContextManager {
  /**
   * Returns the active context
   * @returns The active context
   */
  active(): IContext;
  
  /**
   * Creates a new context
   * @returns A new context
   */
  createContext(): IContext;
  
  /**
   * Gets a value from a context
   * @param context The context to get a value from
   * @param key The key to get
   * @returns The value, or undefined if not found
   */
  getValue(context: IContext, key: symbol | string): unknown;
  
  /**
   * Sets a value in a context
   * @param context The context to set a value in
   * @param key The key to set
   * @param value The value to set
   * @returns A new context with the value set
   */
  setValue(context: IContext, key: symbol | string, value: unknown): IContext;
  
  /**
   * Deletes a value from a context
   * @param context The context to delete a value from
   * @param key The key to delete
   * @returns A new context with the value deleted
   */
  deleteValue(context: IContext, key: symbol | string): IContext;
  
  /**
   * Executes a callback with the provided context as active
   * @param context The context to make active
   * @param fn The callback to execute
   * @returns The return value of the callback
   */
  with<T>(context: IContext, fn: () => T): T;
}

/**
 * Creates a new ContextManager instance
 * @returns A new ContextManager instance
 */
export function createContextManager(): IContextManager;
```

## Implementation Approach

### 1. Factory Functions

Instead of using class constructors, the SDK uses factory functions to create instances:

```typescript
// Export factory functions instead of constructors
export function createTracer(name: string, version?: string, options?: ITracerOptions): ITracer {
  // Private closure variables
  let _name = name;
  let _version = version;
  let _options = options || {};
  
  // Create the instance with private state
  const tracer: ITracer = {
    startSpan(name: string, options?: ISpanOptions): ISpan {
      // Implementation using private state
      return createSpan(name, options, _name, _version);
    },
    
    startActiveSpan<T>(name: string, options?: ISpanOptions, context?: IContext, fn?: (span: ISpan) => T): T {
      // Implementation using private state
      // ...
    }
  };
  
  return tracer;
}
```

### 2. Internal Interfaces with @internal Tag

We use internal interfaces for implementation details:

```typescript
/**
 * Public interface for Span
 */
export interface ISpan {
  spanContext(): ISpanContext;
  setAttribute(key: string, value: any): ISpan;
  setAttributes(attributes: Record<string, any>): ISpan;
  addEvent(name: string, attributes?: Record<string, any>): ISpan;
  setStatus(status: ISpanStatus): ISpan;
  end(endTime?: number): void;
  isRecording(): boolean;
}

/**
 * @internal
 * Internal interface for Span implementation details
 */
export interface _ISpanInternal extends ISpan {
  _getStartTime(): number;
  _getEndTime(): number | undefined;
  _getAttributes(): Record<string, any>;
  _getEvents(): IEvent[];
  _getLinks(): ILink[];
  _getName(): string;
}
```

### 3. Hidden Implementations

All implementation classes are hidden from public API:

```typescript
// Internal implementation class - not exported
class SpanProcessorImpl implements ISpanProcessor {
  private readonly exporter: ISpanExporter;
  private readonly config: ISpanProcessorConfig;
  private readonly spans: ISpan[] = [];
  
  constructor(exporter: ISpanExporter, config?: ISpanProcessorConfig) {
    this.exporter = exporter;
    this.config = config || {};
  }
  
  onStart(span: ISpan): void {
    // Implementation
  }
  
  onEnd(span: ISpan): void {
    // Implementation
  }
  
  shutdown(): Promise<void> {
    // Implementation
  }
  
  forceFlush(): Promise<void> {
    // Implementation
  }
}

// Export factory function instead of class
export function createBatchSpanProcessor(
  exporter: ISpanExporter,
  config?: ISpanProcessorConfig
): ISpanProcessor {
  return new SpanProcessorImpl(exporter, config);
}
```

## Core OTelClientSdk Implementation

The core `OTelClientSdk` is the only component that may be exposed as a class, but it should still provide a factory function for creation:

```typescript
// Internal implementation class
class OTelClientSdkImpl implements IOTelClientSdk {
  readonly traceProvider: ITraceProvider;
  readonly loggerProvider: ILoggerProvider;
  readonly meterProvider: IMeterProvider;
  readonly contextManager: IContextManager;
  readonly propagator: IPropagator;
  
  constructor(config: IOTelClientConfig) {
    const resource = config.resource || createResource({ 'service.name': 'unknown_service' });
    
    this.contextManager = createContextManager();
    this.traceProvider = createTraceProvider(config.traceConfig || {}, resource);
    this.loggerProvider = createLoggerProvider(config.logConfig || {}, resource);
    this.meterProvider = createMeterProvider(config.metricConfig || {}, resource);
    this.propagator = createCompositePropagator([
      createW3CTraceContextPropagator(),
      createW3CBaggagePropagator()
    ]);
    
    // Set up default exporters if connection string provided
    if (config.connectionString || config.instrumentationKey) {
      // Azure Monitor setup
      // ...
    }
  }
  
  shutdown(): Promise<void> {
    return Promise.all([
      this.traceProvider.shutdown(),
      this.loggerProvider.shutdown(),
      this.meterProvider.shutdown()
    ]).then(() => {});
  }
  
  forceFlush(): Promise<void> {
    return Promise.all([
      this.traceProvider.forceFlush(),
      this.loggerProvider.forceFlush(),
      this.meterProvider.forceFlush() 
    ]).then(() => {});
  }
}

// Public factory function
export function createOTelClientSdk(config: IOTelClientConfig = {}): IOTelClientSdk {
  return new OTelClientSdkImpl(config);
}
```

## Integration with Azure Monitor

The OTelClientSdk provides seamless integration with Azure Monitor through specialized exporters:

```typescript
/**
 * Configuration for Azure Monitor exporters
 */
export interface IAzureMonitorExporterConfig {
  /**
   * Azure Monitor connection string
   */
  connectionString?: string;
  
  /**
   * Azure Monitor instrumentation key (deprecated)
   */
  instrumentationKey?: string;
  
  /**
   * Endpoint URL for Azure Monitor
   */
  endpoint?: string;
}

/**
 * Creates a new Azure Monitor span exporter
 * @param config Configuration for the exporter
 * @returns A new Azure Monitor span exporter
 */
export function createAzureMonitorSpanExporter(config: IAzureMonitorExporterConfig): ISpanExporter {
  // Implementation that converts OTel spans to Azure Monitor format
}

/**
 * Creates a new Azure Monitor log record exporter
 * @param config Configuration for the exporter
 * @returns A new Azure Monitor log record exporter
 */
export function createAzureMonitorLogRecordExporter(config: IAzureMonitorExporterConfig): ILogRecordExporter {
  // Implementation that converts OTel logs to Azure Monitor format
}

/**
 * Creates a new Azure Monitor metric exporter
 * @param config Configuration for the exporter
 * @returns A new Azure Monitor metric exporter
 */
export function createAzureMonitorMetricExporter(config: IAzureMonitorExporterConfig): IMetricExporter {
  // Implementation that converts OTel metrics to Azure Monitor format
}
```

## Comparison with Standard OpenTelemetry SDK

| Feature | Standard OpenTelemetry SDK | OTelClientSdk |
|---------|----------------------------|---------------|
| API Design | Mixed class and interface approach | Strict interface-first design |
| Global Access | Uses global singletons for API access | No globals - explicit instance creation |
| Instance Creation | Classes with constructors | Factory functions |
| Class Exposure | Implementation classes exposed | Implementation details hidden |
| Context Management | Implicitly uses ambient context | Explicit context passing and management |
| Naming Convention | No consistent prefix for interfaces | `I` prefix for public, `_I` for internal |
| Implementation | Class-based | Factory functions with closures |
