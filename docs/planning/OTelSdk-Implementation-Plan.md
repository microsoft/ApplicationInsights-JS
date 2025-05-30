# OTelClientSdk Implementation Plan

## Overview

This document outlines the implementation plan for creating the OTelClientSdk within the ApplicationInsights-JS repository. This SDK implements the OpenTelemetry specification while avoiding global singletons and requiring explicit instance creation. The implementation leverages and extends the existing interfaces in the `shared/OpenTelemetry/src` folder to provide a complete OpenTelemetry solution that integrates with Azure Monitor.

## Interface-First Design Approach

The OTelClientSdk follows an interface-first design pattern where all components are defined by interfaces before implementation. This provides several benefits:

1. **Clear API Contracts**: Interfaces define explicit contracts that implementations must follow
2. **Better Type Safety**: TypeScript can validate correct usage of interfaces
3. **Reduced Bundle Size**: Implementation details can be hidden behind interfaces
4. **Improved Testing**: Interfaces make it easier to mock components for testing
5. **Better Documentation**: JSDoc comments on interfaces provide clear usage guidance

Key aspects of this approach include:

- **Public Interfaces**: All publicly exposed components have interfaces with proper `I` prefix
- **Internal Interfaces**: Internal components use interfaces with `_I` prefix and `@internal` JSDoc tags
- **Factory Functions**: Components are created via factory functions instead of constructors
- **Hidden Implementations**: Implementation details are hidden from consumers
- **Interface Documentation**: Comprehensive JSDoc comments on all interfaces

## Architectural Goals

1. **No Global Singletons** - Avoid using global variables like context, api, trace, and log
2. **Explicit Instance Creation** - Users must explicitly create instances of all components
3. **Full OTel Compliance** - Complete implementation of OpenTelemetry's trace, log, and metrics APIs
4. **Modular Design** - Components can be selectively imported to minimize bundle size
5. **Context Management** - Better control over context propagation with explicit context creation
6. **Extensibility** - Support for custom exporters, processors, and samplers
7. **Azure Monitor Integration** - Seamless integration with Azure Monitor backend services

## Directory Structure

```
ApplicationInsights-JS/
└── OTelClientSdk/
    ├── LICENSE
    ├── NOTICE
    ├── PRIVACY
    ├── README.md
    ├── package.json
    ├── tsconfig.json
    ├── rollup.config.js
    ├── api-extractor.json
    └── src/
        ├── index.ts
        ├── types.ts
        ├── config/
        │   ├── index.ts
        │   ├── defaultConfig.ts
        │   ├── interfaces/
        │   │   ├── IConfigTypes.ts
        │   │   └── _IConfigInternal.ts
        │   └── implementation/
        │       └── ConfigManager.ts
        ├── trace/
        │   ├── index.ts
        │   ├── interfaces/
        │   │   ├── ITraceProvider.ts
        │   │   ├── ITracer.ts
        │   │   ├── ISpan.ts
        │   │   ├── ISpanProcessor.ts
        │   │   ├── ISpanExporter.ts
        │   │   ├── ISampler.ts
        │   │   └── _ITraceInternal.ts
        │   └── implementation/
        │       ├── factory.ts
        │       ├── TraceProvider.ts
        │       ├── Tracer.ts
        │       ├── Span.ts
        │       ├── SpanProcessor.ts
        │       └── SpanExporter.ts
        ├── logs/
        │   ├── index.ts
        │   ├── interfaces/
        │   │   ├── ILoggerProvider.ts
        │   │   ├── ILogger.ts
        │   │   ├── ILogRecord.ts
        │   │   ├── ILogRecordProcessor.ts
        │   │   └── _ILogInternal.ts
        │   └── implementation/
        │       ├── factory.ts
        │       ├── LoggerProvider.ts
        │       ├── Logger.ts
        │       └── LogRecordProcessor.ts
        ├── metrics/
        │   ├── index.ts
        │   ├── interfaces/
        │   │   ├── IMeterProvider.ts
        │   │   ├── IMeter.ts
        │   │   ├── IMetric.ts
        │   │   └── _IMetricInternal.ts
        │   └── implementation/
        │       ├── factory.ts
        │       ├── MeterProvider.ts
        │       ├── Meter.ts
        │       └── MetricExporter.ts
        ├── context/
        │   ├── index.ts
        │   ├── interfaces/
        │   │   ├── IContext.ts
        │   │   ├── IPropagator.ts
        │   │   └── _IContextInternal.ts
        │   ├── implementation/
        │   │   ├── factory.ts
        │   │   ├── Context.ts
        │   │   └── ContextManager.ts
        │   └── propagation/
        │       ├── interfaces/
        │       │   └── ITextMapPropagator.ts
        │       └── implementation/
        │           ├── W3CTraceContextPropagator.ts
        │           └── BaggagePropagator.ts
        ├── resource/
        │   ├── index.ts
        │   ├── interfaces/
        │   │   └── IResource.ts
        │   └── implementation/
        │       ├── factory.ts
        │       └── Resource.ts
        └── utils/
            ├── index.ts
            ├── interfaces/
            │   ├── IIdGenerator.ts
            │   └── IValidator.ts
            └── implementation/
                ├── IdGenerator.ts
                └── validators.ts
```

## Implementation Phases

### Phase 1: Interface Definition

1. Define public interfaces for all components with I prefix
2. Define internal interfaces with _I prefix and @internal tags
3. Document all interfaces with comprehensive JSDoc comments
4. Define factory function signatures for all components
5. Create type definitions for configuration options

### Phase 2: Core Implementation

1. Implement the factory functions for core components
2. Implement the hidden implementation classes
3. Create integration points between components
4. Set up configuration handling with dynamic configuration support
5. Implement resource management for telemetry source identification

### Phase 3: Trace Provider Implementation

1. Implement TraceProvider
   - Create ITraceProvider interface with documentation
   - Create _ITraceProviderInternal interface for internal methods
   - Implement hidden TraceProvider class
   - Create createTraceProvider factory function

2. Implement Tracer
   - Create ITracer interface with documentation
   - Create _ITracerInternal interface for internal methods
   - Implement hidden Tracer class
   - Create factory function for internal use

3. Implement Span
   - Create ISpan interface with documentation
   - Create _ISpanInternal interface for internal methods
   - Implement hidden Span class
   - Create factory function for internal use
   - Implement attribute handling with proper validation

4. Implement SpanProcessor and SpanExporter
   - Create ISpanProcessor and ISpanExporter interfaces
   - Create hidden BatchSpanProcessor implementation
   - Create hidden SimpleSpanProcessor implementation
   - Create ISpanExporter interface
   - Implement hidden AzureMonitorSpanExporter class
   - Create factory functions for each component

### Phase 4: Log Provider Implementation

1. Implement LoggerProvider
   - Create ILoggerProvider interface with documentation
   - Create _ILoggerProviderInternal interface for internal methods
   - Implement hidden LoggerProvider class
   - Create createLoggerProvider factory function

2. Implement Logger
   - Create ILogger interface with documentation
   - Create _ILoggerInternal interface for internal methods
   - Implement hidden Logger class
   - Create factory function for internal use
   - Add structured logging support with attribute validation

3. Implement LogRecordProcessor and LogRecordExporter
   - Create ILogRecordProcessor and ILogRecordExporter interfaces
   - Create hidden BatchLogRecordProcessor implementation
   - Create hidden SimpleLogRecordProcessor implementation
   - Create ILogRecordExporter interface
   - Implement hidden AzureMonitorLogRecordExporter class
   - Create factory functions for each component

### Phase 5: Metric Provider Implementation

1. Implement MeterProvider
   - Create IMeterProvider interface with documentation
   - Create _IMeterProviderInternal interface for internal methods
   - Implement hidden MeterProvider class
   - Create createMeterProvider factory function

2. Implement Meter
   - Create IMeter interface with documentation
   - Create _IMeterInternal interface for internal methods
   - Implement hidden Meter class
   - Create factory function for internal use
   - Implement instrument creation (Counter, Histogram, etc.)

3. Implement MetricExporter
   - Create IMetricExporter interface
   - Implement hidden AzureMonitorMetricExporter class
   - Create factory functions for each component

### Phase 6: Context and Propagation

1. Implement Context
   - Create IContext interface with documentation
   - Create _IContextInternal interface for internal methods
   - Implement hidden Context class
   - Create createContext factory function
   - Add key-value storage for context values with type safety

2. Implement Context Propagation
   - Create ITextMapPropagator interface
   - Implement hidden W3CTraceContextPropagator class
   - Implement hidden BaggagePropagator class
   - Create factory functions for each propagator

### Phase 7: Integration and Testing

1. Integrate with existing ApplicationInsights backend
2. Create comprehensive unit tests for all interfaces and implementations
3. Create integration tests for end-to-end scenarios
4. Create performance tests to ensure efficiency
5. Create browser-specific instrumentations (XHR, fetch, user interaction)
6. Add framework integrations (React, Angular, Vue)

### Phase 8: Documentation and Examples

1. Create API documentation for all public interfaces
2. Create usage examples for common scenarios
3. Create migration guide from existing ApplicationInsights SDK
4. Create migration guide from standard OpenTelemetry SDK

## Implementation Timeline

- **Month 1**: Phases 1 and 2
- **Month 2**: Phases 3 and 4
- **Month 3**: Phases 5, 6, 7, and 8

## Interface Definition Examples

### Core SDK Interface

```typescript
/**
 * Configuration options for the OTel Client SDK
 * @public
 */
export interface IOTelClientConfig {
  /** Optional connection string for Azure Monitor */
  connectionString?: string;
  
  /** Optional instrumentation key for Azure Monitor */
  instrumentationKey?: string;
  
  /** Optional endpoint for Azure Monitor */
  endpoint?: string;
  
  /** Configuration for the trace provider */
  traceConfig?: ITraceConfig;
  
  /** Configuration for the logger provider */
  logConfig?: ILogConfig;
  
  /** Configuration for the meter provider */
  meterConfig?: IMeterConfig;
  
  /** Configuration for the context manager */
  contextConfig?: IContextConfig;
}

/**
 * Main interface for the OTel Client SDK
 * @public
 */
export interface IOTelClientSdk {
  /** Trace provider instance for distributed tracing */
  readonly traceProvider: ITraceProvider;
  
  /** Logger provider instance for logging */
  readonly loggerProvider: ILoggerProvider;
  
  /** Meter provider instance for metrics */
  readonly meterProvider: IMeterProvider;
  
  /** Context manager instance for context propagation */
  readonly contextManager: IContextManager;
  
  /**
   * Shuts down all providers and flushes any pending telemetry
   * @returns A promise that resolves when shutdown is complete
   */
  shutdown(): Promise<void>;
  
  /**
   * Forces a flush of any pending telemetry
   * @returns A promise that resolves when flush is complete
   */
  forceFlush(): Promise<void>;
}

/**
 * Internal interface for the OTel Client SDK
 * Not exposed to consumers
 * @internal
 */
export interface _IOTelClientSdkInternal extends IOTelClientSdk {
  _getResource(): IResource;
  _getExporters(): IExporter[];
  _configChanged(changes: Partial<IOTelClientConfig>): void;
}
```

### Factory Function Example

```typescript
/**
 * Creates a new instance of the OTel Client SDK
 * @param config - Configuration options for the SDK
 * @param resource - Optional resource information
 * @returns A new instance of the OTel Client SDK
 * @public
 */
export function createOTelClientSdk(
  config: IOTelClientConfig, 
  resource?: IResource
): IOTelClientSdk {
  // Implementation details hidden from consumers
  const _resource = resource || createResource({
    'service.name': 'unknown_service'
  });
  
  const _contextManager = createContextManager(config.contextConfig);
  const _traceProvider = createTraceProvider(config.traceConfig, _resource);
  const _loggerProvider = createLoggerProvider(config.logConfig, _resource);
  const _meterProvider = createMeterProvider(config.meterConfig, _resource);
  
  // Create instance with only the public interface exposed
  const instance: IOTelClientSdk = {
    get traceProvider() { return _traceProvider; },
    get loggerProvider() { return _loggerProvider; },
    get meterProvider() { return _meterProvider; },
    get contextManager() { return _contextManager; },
    
    async shutdown(): Promise<void> {
      await Promise.all([
        _traceProvider.shutdown(),
        _loggerProvider.shutdown(),
        _meterProvider.shutdown()
      ]);
    },
    
    async forceFlush(): Promise<void> {
      await Promise.all([
        _traceProvider.forceFlush(),
        _loggerProvider.forceFlush(),
        _meterProvider.forceFlush()
      ]);
    }
  };
  
  return instance;
}
```

## Interface-First Implementation Examples

To illustrate how the interface-first design pattern is implemented throughout the SDK, here are detailed examples for key components:

### 1. Trace Provider Interface Hierarchy

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
   * @param options - Optional configuration for the tracer
   * @returns A tracer instance
   */
  getTracer(name: string, version?: string, options?: ITracerOptions): ITracer;
  
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

### 2. Implementation Class (Hidden From Consumers)

```typescript
/**
 * Implementation of the trace provider
 * Not exported - internal use only
 */
class TraceProviderImpl implements _ITraceProviderInternal {
  private _resource: IResource;
  private _config: ITraceConfig;
  private _tracers: Map<string, ITracer> = new Map();
  private _processors: ISpanProcessor[] = [];
  private _sampler: ISampler;
  private _isShutdown: boolean = false;
  
  constructor(config: ITraceConfig, resource: IResource) {
    this._config = config || {};
    this._resource = resource;
    this._sampler = this._config.sampler || createParentBasedSampler({
      root: createTraceIdRatioSampler(this._config.samplingRatio || 1.0)
    });
  }
  
  getTracer(name: string, version?: string, options?: ITracerOptions): ITracer {
    if (this._isShutdown) {
      // Return no-op tracer after shutdown
      return createNoopTracer();
    }
    
    const key = `${name}@${version || ''}`;
    
    if (!this._tracers.has(key)) {
      // Create internal tracer instance
      const tracer = new TracerImpl(name, version, {
        ...options,
        sampler: this._sampler,
        resource: this._resource
      });
      
      // Store tracer by key
      this._tracers.set(key, tracer);
    }
    
    return this._tracers.get(key)!;
  }
  
  addSpanProcessor(processor: ISpanProcessor): void {
    if (this._isShutdown) {
      return;
    }
    
    this._processors.push(processor);
    
    // Register processor with existing tracers
    for (const tracer of this._tracers.values()) {
      if (isTracerInternal(tracer)) {
        tracer._addSpanProcessor(processor);
      }
    }
  }
  
  async forceFlush(): Promise<void> {
    if (this._isShutdown) {
      return;
    }
    
    await Promise.all(this._processors.map(p => p.forceFlush()));
  }
  
  async shutdown(): Promise<void> {
    if (this._isShutdown) {
      return;
    }
    
    this._isShutdown = true;
    await Promise.all(this._processors.map(p => p.shutdown()));
  }
  
  // Internal methods
  _getResource(): IResource {
    return this._resource;
  }
  
  _getSpanProcessors(): ReadonlyArray<ISpanProcessor> {
    return [...this._processors];
  }
  
  _getTracers(): ReadonlyMap<string, ITracer> {
    return new Map(this._tracers);
  }
}
```

### 3. Factory Function (Public API)

```typescript
/**
 * Creates a new trace provider
 * @param config - Optional configuration for the trace provider
 * @param resource - The resource that identifies the source of the telemetry
 * @returns A new trace provider instance
 * @public
 */
export function createTraceProvider(
  config?: ITraceConfig,
  resource?: IResource
): ITraceProvider {
  const effectiveResource = resource || createResource({
    'service.name': 'unknown_service'
  });
  
  // Create the implementation instance but return only the interface type
  return new TraceProviderImpl(config || {}, effectiveResource);
}
```

### 4. Usage Example

```typescript
// Consumer code only interacts with interfaces
import { 
  createTraceProvider, 
  createBatchSpanProcessor, 
  createAzureMonitorSpanExporter,
  ITraceProvider,
  ITracer,
  ISpan 
} from '@microsoft/applicationinsights-otelclientsdk';

// Create provider using factory function
const traceProvider: ITraceProvider = createTraceProvider({
  samplingRatio: 0.5
});

// Add processors
traceProvider.addSpanProcessor(
  createBatchSpanProcessor(
    createAzureMonitorSpanExporter({ 
      connectionString: 'InstrumentationKey=...' 
    })
  )
);

// Get a tracer
const tracer: ITracer = traceProvider.getTracer('my-component');

// Create a span
const span: ISpan = tracer.startSpan('my-operation');

// Use the span
span.setAttribute('key', 'value');
span.end();

// Shutdown
await traceProvider.shutdown();
```

## Implementing Factory Functions with DynamicProto

## Technical Design Details

### Interface-First Design Pattern

All components follow the interface-first design pattern:

1. Public interfaces with `I` prefix define the public API
2. Internal interfaces with `_I` prefix define the internal API
3. Implementation classes are hidden from consumers
4. Factory functions provide the only way to create instances

This approach ensures:

- Clean separation between public API and implementation
- Ability to change implementations without breaking API
- Smaller bundle size through hidden implementation details
- Easier testing through interface-based mocking
- Better TypeScript type checking and IDE support

### Hidden Implementation with Factory Functions

Implementation classes are hidden and only accessible through factory functions:

```typescript
// Implementation class is not exported
class TraceProviderImpl implements ITraceProvider {
  // Implementation details
}

// Only the factory function is exported
export function createTraceProvider(config?: ITraceConfig): ITraceProvider {
  return new TraceProviderImpl(config);
}
```

This pattern ensures:

1. Consumers can only use the public interface
2. Implementation details remain hidden
3. Bundle size can be optimized
4. Interface contract is enforced

## Next Steps

1. Define detailed interface specifications for each component
2. Implement core SDK functionality
3. Create proof-of-concept implementations for key scenarios
4. Establish test framework and benchmarks
5. Implement integration with Azure Monitor backends
