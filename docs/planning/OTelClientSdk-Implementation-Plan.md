# OTelClientSdk Implementation Plan

## Overview

This document outlines the implementation plan for creating the OTelClientSdk within the ApplicationInsights-JS repository. This SDK implements the OpenTelemetry specification while avoiding global singletons and requiring explicit instance creation. The implementation leverages and extends the existing interfaces in the `shared/OpenTelemetry/src` folder to provide a complete OpenTelemetry solution that integrates with Azure Monitor.

## Architectural Goals

1. **No Global Singletons** - Avoid using global variables like context, api, trace, and log
2. **Explicit Instance Creation** - Users must explicitly create instances of all components
3. **Interface-First Design** - All public APIs are defined as interfaces prefixed with 'I'
4. **Implementation Hiding** - Implementation details are hidden with factory functions
5. **Full OTel Compliance** - Complete implementation of OpenTelemetry's trace, log, and metrics APIs
6. **Modular Design** - Components can be selectively imported to minimize bundle size
7. **Context Management** - Better control over context propagation with explicit context creation
8. **Extensibility** - Support for custom exporters, processors, and samplers

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
        ├── interfaces/
        │   ├── index.ts
        │   ├── IOTelClientSdk.ts
        │   ├── config/
        │   │   ├── IConfig.ts
        │   │   └── ITraceConfig.ts
        │   ├── trace/
        │   │   ├── ITraceProvider.ts
        │   │   ├── ITracer.ts
        │   │   ├── ISpan.ts
        │   │   ├── ISpanProcessor.ts
        │   │   └── ISpanExporter.ts
        │   ├── logs/
        │   │   ├── ILoggerProvider.ts
        │   │   ├── ILogger.ts
        │   │   ├── ILogRecord.ts
        │   │   └── ILogRecordProcessor.ts
        │   ├── metrics/
        │   │   ├── IMeterProvider.ts
        │   │   ├── IMeter.ts
        │   │   ├── IMetric.ts
        │   │   └── IMetricExporter.ts
        │   ├── context/
        │   │   ├── IContext.ts
        │   │   ├── IContextManager.ts
        │   │   └── IPropagator.ts
        │   └── resource/
        │       └── IResource.ts
        ├── implementation/
        │   ├── OTelClientSdk.ts
        │   ├── trace/
        │   │   ├── TraceProvider.ts
        │   │   ├── Tracer.ts
        │   │   ├── Span.ts
        │   │   ├── SpanProcessor.ts
        │   │   └── SpanExporter.ts
        │   ├── logs/
        │   │   ├── LoggerProvider.ts
        │   │   ├── Logger.ts
        │   │   ├── LogRecord.ts
        │   │   └── LogRecordProcessor.ts
        │   ├── metrics/
        │   │   ├── MeterProvider.ts
        │   │   ├── Meter.ts
        │   │   ├── Metric.ts
        │   │   └── MetricExporter.ts
        │   ├── context/
        │   │   ├── Context.ts
        │   │   ├── ContextManager.ts
        │   │   └── Propagator.ts
        │   └── resource/
        │       └── Resource.ts
        ├── factory/
        │   ├── createOTelClientSdk.ts
        │   ├── createTraceProvider.ts
        │   ├── createLoggerProvider.ts
        │   ├── createMeterProvider.ts
        │   ├── createContextManager.ts
        │   └── createResource.ts
        └── utils/
            ├── index.ts
            ├── IdGenerator.ts
            └── validators.ts
```

## Implementation Phases

### Phase 1: Interface Definition

1. Define all public interfaces with 'I' prefix
   - Define core interfaces like `IOTelClientSdk`, `ITraceProvider`, etc.
   - Define internal interfaces with `_I` prefix for implementation-specific details
   - Document all interfaces with JSDoc comments including @internal tags where appropriate

2. Create integration points with existing interfaces
   - Map to `IOTelApi`, `IOTelSdk`, etc. from shared/OpenTelemetry/src
   - Define extension points for custom implementations

3. Define factory functions for component instantiation
   - Create function signatures for all factory methods
   - Document parameter and return types

### Phase 2: Core Implementation

1. Implement the unified OTelClientSdk class
   - Implement IOTelClientSdk interface
   - Hide implementation details using closure patterns
   - Create factory function for instantiation

2. Implement context management
   - Create context interfaces and implementations
   - Implement explicit context propagation
   - Create factory functions for context creation

3. Implement resource management
   - Create resource interfaces and implementations
   - Implement attribute handling for resources
   - Create factory functions for resource creation

### Phase 3: Trace Provider Implementation

1. Implement ITraceProvider
   - Create trace provider interface and implementation
   - Implement tracer creation functionality
   - Create factory function for instantiation

2. Implement ITracer
   - Create tracer interface and implementation
   - Implement span creation functionality
   - Create factory function for instantiation

3. Implement ISpan
   - Create span interface and implementation
   - Implement attribute, event, and link handling
   - Create factory function for instantiation

4. Implement ISpanProcessor and ISpanExporter
   - Create processor and exporter interfaces
   - Implement batch processing functionality
   - Create Azure Monitor span exporter
   - Create factory functions for instantiation

### Phase 4: Log Provider Implementation

1. Implement ILoggerProvider
   - Create logger provider interface and implementation
   - Implement logger creation functionality
   - Create factory function for instantiation

2. Implement ILogger
   - Create logger interface and implementation
   - Implement log record creation functionality
   - Create factory function for instantiation

3. Implement ILogRecord and ILogRecordProcessor
   - Create log record and processor interfaces
   - Implement batch processing functionality
   - Create Azure Monitor log exporter
   - Create factory functions for instantiation

### Phase 5: Metric Provider Implementation

1. Implement IMeterProvider
   - Create meter provider interface and implementation
   - Implement meter creation functionality
   - Create factory function for instantiation

2. Implement IMeter
   - Create meter interface and implementation
   - Implement instrument creation functionality
   - Create factory function for instantiation

3. Implement metrics instruments and exporters
   - Create counter, histogram, etc. interfaces
   - Implement aggregation functionality
   - Create Azure Monitor metric exporter
   - Create factory functions for instantiation

### Phase 6: Integration and Testing

1. Integration with Azure Monitor
   - Create Azure Monitor exporters for all telemetry types
   - Implement connection string parsing and configuration
   - Create helper functions for Azure Monitor integration

2. Create comprehensive unit tests
   - Test all interfaces and implementations
   - Test factory functions
   - Test integration with Azure Monitor

3. Create integration tests
   - Test end-to-end scenarios
   - Test browser compatibility
   - Test performance and memory usage

### Phase 7: Documentation and Examples

1. Create API documentation
   - Document all public interfaces
   - Document all factory functions
   - Create usage examples for common scenarios

2. Create migration guides
   - Create migration guide from standard OpenTelemetry
   - Create migration guide from classic ApplicationInsights

## Implementation Timeline

- **Month 1**: Phases 1 and 2 - Interface definition and core implementation
- **Month 2**: Phases 3 and 4 - Trace and log provider implementation
- **Month 3**: Phases 5, 6, and 7 - Metric provider, integration, and documentation

## Key Implementation Features

- **Interface-First Design**: All public APIs are defined as interfaces prefixed with 'I'
- **Internal Interfaces**: Internal interfaces are prefixed with '_I' and marked with @internal tag
- **Factory Functions**: All components are instantiated via factory functions
- **No Global Singletons**: The design avoids using global variables like context, api, trace, and log
- **Explicit Instance Creation**: Users must explicitly create instances of all components
- **Full OTel Compliance**: Complete implementation of OpenTelemetry's trace, log, and metrics APIs
- **Modular Design**: Components can be selectively imported to minimize bundle size
- **Context Management**: Better control over context propagation with explicit context creation
- **Extensibility**: Support for custom exporters, processors, and samplers
- **Closures-Based Implementation**: Use closures instead of classes for internal implementations
- **DynamicProto-JS**: Use DynamicProto-JS for complex implementations to optimize performance
- **Tree-Shakable**: Support for tree-shaking to create minimal bundle sizes
- **Azure Monitor Integration**: Seamless integration with Azure Monitor through specialized exporters

## Integration with Existing Interfaces

The OTelClientSdk implements and extends the interfaces from the shared/OpenTelemetry/src folder:

- **IOTelSdk**: Base interface extended by IOTelClientSdk 
- **IOTelApi**: Extended to support explicit context management
- **IOTelTraceApi**: Implemented with non-global trace functionality
- **IOTelContextManager**: Extended with improved context propagation capabilities

## Interface and Factory Function Examples

### Main Client SDK

```typescript
// Public interface
export interface IOTelClientSdkConfig {
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

// Implementation class (only class directly exposed)
export class OTelClientSdk implements IOTelClientSdk {
  // Implementation details
}

// Factory function for instantiation
export function createOTelClientSdk(config: IOTelClientSdkConfig, resource?: IResource): IOTelClientSdk {
  return new OTelClientSdk(config, resource);
}
```

### TraceProvider Implementation

```typescript
// Public interface
export interface ITraceProvider {
  getTracer(name: string, version?: string, options?: ITracerOptions): ITracer;
  addSpanProcessor(processor: ISpanProcessor): void;
  shutdown(): Promise<void>;
  forceFlush(): Promise<void>;
}

/**
 * @internal
 */
export interface _ITraceProviderInternal extends ITraceProvider {
  _getActiveSpan(): ISpan | undefined;
  _processSpanData(span: ISpan): void;
}

// Factory function for instantiation
export function createTraceProvider(config: ITraceConfig, resource: IResource): ITraceProvider {
  // Private closure variables
  let _tracers: Map<string, ITracer> = new Map();
  let _processors: ISpanProcessor[] = [];
  let _config = config;
  let _resource = resource;
  
  // Create the instance
  let _self = {} as ITraceProvider;
  
  // Define methods using DynamicProto
  dynamicProto({} as any, _self, (self: ITraceProvider) => {
    self.getTracer = (name: string, version?: string, options?: ITracerOptions): ITracer => {
      const key = `${name}@${version || ''}`;
      
      if (!_tracers.has(key)) {
        _tracers.set(key, createTracer(name, version, options, _self));
      }
      
      return _tracers.get(key)!;
    };
    
    self.addSpanProcessor = (processor: ISpanProcessor): void => {
      _processors.push(processor);
    };
    
    self.shutdown = async (): Promise<void> => {
      await Promise.all(_processors.map(p => p.shutdown()));
    };
    
    self.forceFlush = async (): Promise<void> => {
      await Promise.all(_processors.map(p => p.forceFlush()));
    };
  });
  
  return _self;
}
```

### LoggerProvider Implementation

```typescript
// Public interface
export interface ILoggerProvider {
  getLogger(name: string, version?: string, options?: ILoggerOptions): ILogger;
  addLogRecordProcessor(processor: ILogRecordProcessor): void;
  shutdown(): Promise<void>;
  forceFlush(): Promise<void>;
}

/**
 * @internal
 */
export interface _ILoggerProviderInternal extends ILoggerProvider {
  _processLogRecord(record: ILogRecord): void;
}

// Factory function for instantiation
export function createLoggerProvider(config: ILogConfig, resource: IResource): ILoggerProvider {
  // Private closure variables
  let _loggers: Map<string, ILogger> = new Map();
  let _processors: ILogRecordProcessor[] = [];
  let _config = config;
  let _resource = resource;
  
  // Create the instance
  let _self = {} as ILoggerProvider;
  
  // Define methods using DynamicProto
  dynamicProto({} as any, _self, (self: ILoggerProvider) => {
    self.getLogger = (name: string, version?: string, options?: ILoggerOptions): ILogger => {
      const key = `${name}@${version || ''}`;
      
      if (!_loggers.has(key)) {
        _loggers.set(key, createLogger(name, version, options));
      }
      
      return _loggers.get(key)!;
    };
    
    self.addLogRecordProcessor = (processor: ILogRecordProcessor): void => {
      _processors.push(processor);
    };
    
    self.shutdown = async (): Promise<void> => {
      await Promise.all(_processors.map(p => p.shutdown()));
    };
    
    self.forceFlush = async (): Promise<void> => {
      await Promise.all(_processors.map(p => p.forceFlush()));
    };
  });
  
  return _self;
}
```

## Next Steps

1. Define detailed interface specifications for each component
2. Create skeleton implementations of all factory functions
3. Implement core functionality starting with context management
4. Create proof-of-concept implementations for key scenarios
5. Establish test framework and initial tests
6. Implement integration with Azure Monitor backends
