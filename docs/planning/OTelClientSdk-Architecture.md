# OTelClientSdk Architecture

## Introduction

This document outlines the architectural design for the OTelClientSdk within the ApplicationInsights-JS repository. The implementation follows the OpenTelemetry specification for tracing, logging, and metrics while integrating with Azure Monitor backend services. The design avoids global singletons and emphasizes explicit instance creation to give users full control over the SDK.

## Core Principles

1. **No Global Singletons**: The design avoids using global variables like context, api, trace, and log. All state is contained within explicitly created instances.
2. **Explicit Instance Creation**: Users must explicitly create instances of all components, giving them full control over the lifecycle and configuration.
3. **Interface-First Design**: All public APIs are defined as interfaces with a capital 'I' prefix, while implementation details are hidden.
4. **Factory Functions**: Component instantiation is done via factory functions rather than exposing constructors.
5. **Full OTel Compliance**: Complete implementation of OpenTelemetry's trace, log, and metrics APIs following the official specification.
6. **Modular Design**: Components can be selectively imported to minimize bundle size and only include what's needed.
7. **Context Management**: Better control over context propagation with explicit context creation and management.
8. **Extensibility**: Support for custom exporters, processors, and samplers to extend functionality.
9. **Performance Optimization**: Use of closures and DynamicProto-JS for efficient implementation.

## Interface Design Principles

### Interface Naming Conventions

- **Public Interfaces**: All public interfaces are prefixed with a capital 'I' (e.g., `ITraceProvider`, `ISpan`)
- **Internal Interfaces**: Internal interfaces are prefixed with '_I' and marked with the @internal typedoc tag (e.g., `_ISpanInternal`, `_ITracerProviderInternal`)
- **Implementation Classes**: Implementation classes are hidden from public API and only accessible via factory functions

### Factory Functions

Instead of exposing class constructors, all component instantiation is done via factory functions:

```typescript
// Public interface
export interface ITraceProvider {
  getTracer(name: string, version?: string, options?: ITracerOptions): ITracer;
  addSpanProcessor(processor: ISpanProcessor): void;
  shutdown(): Promise<void>;
  forceFlush(): Promise<void>;
}

// Internal interface
/**
 * @internal
 */
export interface _ITraceProviderInternal extends ITraceProvider {
  _getActiveSpan(): ISpan | undefined;
  _processSpanData(span: ISpan): void;
}

// Factory function for instantiation
export function createTraceProvider(config: ITraceConfig, resource: IResource): ITraceProvider {
  // Implementation details hidden inside closure
  // ...
  return traceProvider;
}
```

## Component Architecture

### High-Level Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                          OTelClientSdk                                │
│                                                                       │
├───────────────┬─────────────────┬─────────────────┬─────────────────┐
│               │                 │                 │                 │
│    Trace      │      Logs       │     Metrics     │     Context     │
│               │                 │                 │                 │
└───────┬───────┴────────┬────────┴────────┬────────┴────────┬────────┘
        │                │                 │                 │
        ▼                ▼                 ▼                 ▼
┌───────────────┐ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ ITraceProvider│ │ILoggerProvider│  │IMeterProvider│  │IContextManager│
└───────┬───────┘ └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
        │                │                │                │
        ▼                ▼                ▼                │
┌───────────────┐ ┌─────────────┐  ┌─────────────┐        │
│    ITracer    │ │   ILogger   │  │    IMeter   │        │
└───────┬───────┘ └──────┬──────┘  └──────┬──────┘        │
        │                │                │                │
        ▼                ▼                ▼                │
┌───────────────┐ ┌─────────────┐  ┌─────────────┐        │
│     ISpan     │ │ ILogRecord  │  │ IInstruments│        │
└───────┬───────┘ └──────┬──────┘  └──────┬──────┘        │
        │                │                │                │
        ▼                ▼                ▼                ▼
┌───────────────┐ ┌─────────────┐  ┌─────────────┐ ┌─────────────┐
│ISpanProcessors│ │ILogProcessors│  │IMetricReaders│ │IPropagation │
└───────┬───────┘ └──────┬──────┘  └──────┬──────┘ └──────┬──────┘
        │                │                │               │
        ▼                ▼                ▼               ▼
┌───────────────┐ ┌─────────────┐  ┌─────────────┐ ┌─────────────┐
│ISpanExporters │ │ILogExporters│  │IMetricExporters│ │ITextMap    │
└───────┬───────┘ └──────┬──────┘  └──────┬──────┘ │ Propagators │
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

### 1. OTelClientSdk

The main entry point that provides access to all functionality. This is the only class that's directly exposed.

**Interfaces:**

```typescript
export interface IOTelClientSdkConfig extends IOTelConfig {
  connectionString?: string;
  instrumentationKey?: string;
  endpoint?: string;
  traceConfig?: ITraceConfig;
  logConfig?: ILogConfig;
  metricConfig?: IMetricConfig;
}

export interface IOTelClientSdk {
  readonly traceProvider: ITraceProvider;
  readonly loggerProvider: ILoggerProvider;
  readonly meterProvider: IMeterProvider;
  readonly contextManager: IContextManager;
  readonly propagator: IPropagator;
  shutdown(): Promise<void>;
  forceFlush(): Promise<void>;
}

/**
 * @internal
 */
export interface _IOTelClientSdkInternal extends IOTelClientSdk {
  _getConfig(): IOTelClientSdkConfig;
}

// Class implementation and factory function
export class OTelClientSdk implements IOTelClientSdk {
  // Implementation
}

export function createOTelClientSdk(config: IOTelClientSdkConfig, resource?: IResource): IOTelClientSdk;
```

### 2. TraceProvider

TraceProvider is the entry point for tracing functionality. It manages the creation and configuration of Tracers.

**Interfaces:**

```typescript
export interface ITraceConfig {
  sampler?: ISampler;
  maxAttributes?: number;
  maxEvents?: number;
  maxLinks?: number;
  idGenerator?: IIdGenerator;
}

export interface ITraceProvider {
  /**
   * Returns a Tracer for use by the given instrumentation library.
   */
  getTracer(name: string, version?: string, schemaUrl?: string, attributes?: Record<string, any>): ITracer;
  
  /**
   * Adds a SpanProcessor to this TraceProvider.
   */
  addSpanProcessor(processor: ISpanProcessor): void;
  
  /**
   * Shuts down this TraceProvider.
   */
  shutdown(): Promise<void>;
  
  /**
   * Forceflush this TraceProvider.
   */
  forceFlush(): Promise<void>;
}

/**
 * @internal
 */
export interface _ITraceProviderInternal extends ITraceProvider {
  _getActiveSpan(): ISpan | undefined;
  _processSpanData(span: ISpan): void;
}

export function createTraceProvider(config: ITraceConfig, resource: IResource): ITraceProvider;
```

### 3. Tracer

Tracer is responsible for creating and managing spans.

**Interfaces:**

```typescript
export interface ITracerOptions {
  schemaUrl?: string;
  attributes?: Record<string, any>;
}

export interface ITracer {
  /**
   * Starts a new Span.
   */
  startSpan(name: string, options?: ISpanOptions, context?: IContext): ISpan;
  
  /**
   * Starts a new Span and makes it the active span in the context.
   */
  startActiveSpan<T extends (...args: any[]) => any>(
    name: string, 
    options: ISpanOptions | undefined,
    context: IContext | undefined,
    fn: (span: ISpan) => ReturnType<T>
  ): ReturnType<T>;
}

/**
 * @internal
 */
export interface _ITracerInternal extends ITracer {
  _getName(): string;
  _getVersion(): string | undefined;
  _getAttributes(): Record<string, any>;
}

export function createTracer(
  name: string, 
  version?: string, 
  options?: ITracerOptions, 
  provider?: ITraceProvider
): ITracer;
```

### 4. LoggerProvider

LoggerProvider is the entry point for logging functionality. It manages the creation and configuration of Loggers.

**Interfaces:**

```typescript
export interface ILogConfig {
  maxAttributes?: number;
  filter?: ILogFilter;
}

export interface ILoggerProvider {
  /**
   * Returns a Logger for use by the given instrumentation library.
   */
  getLogger(name: string, version?: string, options?: ILoggerOptions): ILogger;
  
  /**
   * Adds a LogRecordProcessor to this LoggerProvider.
   */
  addLogRecordProcessor(processor: ILogRecordProcessor): void;
  
  /**
   * Shuts down this LoggerProvider.
   */
  shutdown(): Promise<void>;
  
  /**
   * Forceflush this LoggerProvider.
   */
  forceFlush(): Promise<void>;
}

/**
 * @internal
 */
export interface _ILoggerProviderInternal extends ILoggerProvider {
  _processLogRecord(record: ILogRecord): void;
}

export function createLoggerProvider(config: ILogConfig, resource: IResource): ILoggerProvider;
```

### 5. MeterProvider

MeterProvider is the entry point for metrics functionality. It manages the creation and configuration of Meters.

**Interfaces:**

```typescript
export interface IMetricConfig {
  views?: IView[];
}

export interface IMeterProvider {
  /**
   * Returns a Meter for use by the given instrumentation library.
   */
  getMeter(name: string, version?: string, options?: IMeterOptions): IMeter;
  
  /**
   * Adds a MetricReader to this MeterProvider.
   */
  addMetricReader(reader: IMetricReader): void;
  
  /**
   * Shuts down this MeterProvider.
   */
  shutdown(): Promise<void>;
  
  /**
   * Forceflush this MeterProvider.
   */
  forceFlush(): Promise<void>;
}

/**
 * @internal
 */
export interface _IMeterProviderInternal extends IMeterProvider {
  _getResource(): IResource;
}

export function createMeterProvider(config: IMetricConfig, resource: IResource): IMeterProvider;
```

### 6. ContextManager

ContextManager is responsible for managing context propagation and storage.

**Interfaces:**

```typescript
export interface IContext {
  getValue<T>(key: symbol | string): T | undefined;
  setValue<T>(key: symbol | string, value: T): IContext;
  deleteValue(key: symbol | string): IContext;
}

export interface IContextManager {
  /**
   * Returns the active context.
   */
  active(): IContext;
  
  /**
   * Executes the callback with the provided context as active.
   */
  with<T extends (...args: any[]) => any>(
    context: IContext,
    fn: () => ReturnType<T>
  ): ReturnType<T>;
  
  /**
   * Creates a new Context instance.
   */
  createContext(): IContext;
}

/**
 * @internal
 */
export interface _IContextManagerInternal extends IContextManager {
  _setActive(context: IContext): void;
  _getActive(): IContext;
}

export function createContextManager(): IContextManager;
export function createContext(): IContext;
```

### 7. Resource

Resource represents the entity producing telemetry.

**Interfaces:**

```typescript
export interface IResource {
  /**
   * Returns a new Resource that is the result of merging this resource with the other resource.
   */
  merge(other: IResource): IResource;
  
  /**
   * Returns the attributes of this resource.
   */
  getAttributes(): Record<string, any>;
}

/**
 * @internal
 */
export interface _IResourceInternal extends IResource {
  _getAttributeMap(): Map<string, any>;
}

export function createResource(attributes: Record<string, any>): IResource;
```

## Implementation Approach

### 1. Factory Functions

Instead of using class constructors, the SDK uses factory functions to create instances. This approach provides several benefits:

- Better encapsulation of private state
- More control over instance creation
- Support for dependency injection
- Easier mocking for testing

Example:

```typescript
export function createTracer(name: string, version?: string, options?: ITracerOptions): ITracer {
  // Private closure variables
  let _name = name;
  let _version = version;
  let _options = options || {};
  
  // Create the tracer instance
  const tracer: ITracer = {
    startSpan(name: string, options?: ISpanOptions): ISpan {
      // Implementation
      return createSpan(name, options);
    },
    startActiveSpan<T>(name: string, options, context, fn): ReturnType<T> {
      // Implementation
      return fn(span) as ReturnType<T>;
    }
  };
  
  return tracer;
}
```

### 2. Closures for Private State

The implementation uses closures to maintain private state without exposing it through public properties:

```typescript
export function createSpan(name: string, options?: ISpanOptions): ISpan {
  // Private closure variables
  let _name = name;
  let _startTime = performance.now();
  let _endTime: number | undefined;
  let _attributes = new Map<string, AttributeValue>();
  
  // Public interface
  const span: ISpan = {
    setAttribute(key: string, value: AttributeValue): ISpan {
      _attributes.set(key, value);
      return this;
    },
    
    end(endTime?: number): void {
      if (_endTime === undefined) {
        _endTime = endTime || performance.now();
      }
    },
    
    // Other methods
  };
  
  return span;
}
```

### 3. DynamicProto-JS for Complex Implementations

For more complex implementations, the SDK uses DynamicProto-JS to optimize performance while maintaining prototype inheritance benefits:

```typescript
export function createSpanProcessor(exporter: ISpanExporter): ISpanProcessor {
  let _exporter = exporter;
  let _spans: ISpan[] = [];
  
  // Create the instance
  const _self = {} as ISpanProcessor;
  
  // Define methods using DynamicProto
  dynamicProto({} as any, _self, (self: ISpanProcessor) => {
    self.onStart = (span: ISpan): void => {
      // Implementation
    };
    
    self.onEnd = (span: ISpan): void => {
      _spans.push(span);
      if (_spans.length >= 100) {
        self.forceFlush().catch(console.error);
      }
    };
    
    self.forceFlush = async (): Promise<void> => {
      const spansToExport = [..._spans];
      _spans = [];
      await _exporter.export(spansToExport);
    };
    
    self.shutdown = async (): Promise<void> => {
      await self.forceFlush();
      await _exporter.shutdown();
    };
  });
  
  return _self;
}
```

## Integration with Azure Monitor

The OTelClientSdk provides seamless integration with Azure Monitor through specialized exporters:

1. **IAzureMonitorSpanExporter**: Converts OpenTelemetry spans to Azure Monitor request and dependency telemetry
2. **IAzureMonitorLogRecordExporter**: Converts OpenTelemetry logs to Azure Monitor trace and exception telemetry
3. **IAzureMonitorMetricExporter**: Converts OpenTelemetry metrics to Azure Monitor metric telemetry

These exporters handle:

- Connection string or instrumentation key configuration
- Protocol conversion
- Batching and retry logic
- Throttling and backoff strategies

## Comparison with Standard OpenTelemetry SDK

| Feature | Standard OpenTelemetry SDK | OTelClientSdk |
|---------|----------------------------|---------------|
| Global Access | Uses global singletons for API access | No globals - explicit instance creation |
| Instance Creation | Implicit through global registry | Explicit through factory functions |
| Interface Design | Mixed class and interface approach | Interface-first with hidden implementations |
| Context Management | Implicitly uses ambient context | Explicit context passing and management |
| Framework Integration | Limited built-in framework support | Rich framework integrations |
| Initialization | Multiple separate initialization points | Unified SDK initialization |
| Bundle Size | Larger baseline bundle | Tree-shakable with smaller bundles |
| Azure Monitor | Requires custom exporters | First-class Azure Monitor support |
| Implementation | Class-based | Closure-based with DynamicProto-JS |
