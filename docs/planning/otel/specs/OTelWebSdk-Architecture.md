# OpenTelemetry Web SDK Architecture

## Overview

The OpenTelemetry Web SDK is designed as a modern, modular implementation that follows the OpenTelemetry specification while providing enhanced flexibility and performance for web applications. It delivers a complete observability solution encompassing distributed tracing, structured logging, and basic metrics collection without relying on global singletons or static state.

## Inversion of Control Architecture

The SDK architecture strictly adheres to the Inversion of Control (IoC) pattern to eliminate dependencies on global state and enhance modularity:

### Core IoC Principles

1. **No Global State**: The SDK MUST NOT use any global variables, window properties, or static state
2. **Explicit Dependencies**: All dependencies are explicitly declared and injected through factory functions
3. **Constructor Injection**: Components receive their dependencies through their creation functions
4. **Interface-Based Design**: Components depend on interfaces, not concrete implementations
5. **Lifecycle Management**: Parent components manage the lifecycle of their dependencies

### Dependency Injection Pattern

```typescript
// Example: TraceProvider with explicit dependency injection
export function createTraceProvider(config: ITraceProviderConfig): ITraceProvider {
  // All dependencies explicitly provided in configuration
  const {
    resource,              // Injected resource information
    spanProcessors = [],   // Injected span processors
    spanExporters = [],    // Injected span exporters
    sampler,              // Injected sampling strategy
    idGenerator,          // Injected ID generation strategy
    contextManager,       // Injected context manager
    logger,               // Injected logger
    clock = Date,         // Injected clock (for testing)
    performanceNow = performance.now.bind(performance) // Injected timing
  } = config;

  // Validate all required dependencies are provided
  if (!resource) {
    throw new Error("Resource must be provided to TraceProvider");
  }
  if (!sampler) {
    throw new Error("Sampler must be provided to TraceProvider");
  }
  if (!contextManager) {
    throw new Error("ContextManager must be provided to TraceProvider");
  }

  // Private closure variables - no global state
  let _config = { ...config };
  let _tracers = new Map<string, ITracer>();
  let _isShutdown = false;

  let _self = {} as ITraceProvider;

  // Define methods directly on the interface instance
  _self.getTracer = (name: string, version?: string, options?: ITracerOptions): ITracer => {
    if (_isShutdown) {
      logger.warn("TraceProvider is shutdown, returning no-op tracer");
      return createNoOpTracer();
    }
    
    const key = `${name}@${version || 'unknown'}`;
    let tracer = _tracers.get(key);
    
    if (!tracer) {
      // Inject dependencies into tracer creation
      tracer = createTracer({
        name,
        version,
        resource,           // Injected from provider config
        spanProcessors,     // Injected from provider config
        sampler,           // Injected from provider config
        idGenerator,       // Injected from provider config
        contextManager,    // Injected from provider config
        logger,            // Injected from provider config
        clock,             // Injected from provider config
        performanceNow,    // Injected from provider config
        ...options
      });
      _tracers.set(key, tracer);
    }
    
    return tracer;
  };

  // All operations use injected dependencies, never global state
  _self.shutdown = async (): Promise<void> => {
    if (_isShutdown) return;
    
    _isShutdown = true;
    
    // Shutdown injected processors
    await Promise.all(spanProcessors.map(processor => 
      processor.shutdown().catch(err => 
        logger.error("Error shutting down processor", err)
      )
    ));
    
    _tracers.clear();
  };

  return _self;
}
```

### Benefits of IoC Pattern

1. **Testability**: Easy to mock dependencies for unit testing
2. **Flexibility**: Different implementations can be injected for different environments
3. **Isolation**: No shared global state between SDK instances
4. **Maintainability**: Clear dependency relationships and easier refactoring
5. **Performance**: No global lookups or singleton access overhead
6. **Security**: Reduced attack surface by eliminating global state mutation

### Anti-Patterns to Avoid

```typescript
// WRONG: Global singleton access
class BadTraceProvider {
  getTracer() {
    const globalSdk = window.__OTEL_SDK__;  // Global access - forbidden
    return globalSdk.createTracer();
  }
}

// WRONG: Static state access
class BadSpanProcessor {
  process(span: ISpan) {
    GlobalConfig.exportUrl;  // Static access - forbidden
  }
}

// CORRECT: Dependency injection
export function createSpanProcessor(config: ISpanProcessorConfig): ISpanProcessor {
  // All dependencies accessed directly from injected config
  config.exporter;      // Injected exporter
  config.batchSize;     // Injected batch size
  config.exportTimeout; // Injected timeout
  config.logger;        // Injected logger
  // Implementation uses only injected dependencies
}
```

## Core Architectural Principles

The following principles are listed in **priority order**, with #1 being the highest priority foundational requirement and subsequent principles building upon and supporting the earlier ones:

### 1. Interface-First Design

The OTelWebSDK must strictly adhere to an interface-first design pattern to ensure optimal API design, type safety, and maintainability:

#### **Public Interface Design**
- **All public components must have dedicated interfaces** with proper `I` prefix (e.g., `ITracerProvider`, `ILogger`, `IMeterProvider`)
- **Public interfaces must include comprehensive TypeDoc documentation** with detailed descriptions, examples, and default values
- **All properties and methods in interfaces must have explicit return types** to ensure type safety
- **Public interfaces are the only exports in the public API** - implementation classes SHOULD never directly exposed

#### **Internal Interface Design**
- **Internal interfaces must use `_I` prefix** and be marked with `@internal` JSDoc tags to exclude them from public API documentation
- **Internal interfaces extend public interfaces when appropriate** to provide additional implementation-specific functionality
- **Internal interfaces are not exported in public API** and provide access to implementation details for internal components only

#### **Implementation Encapsulation**
- **Implementation classes must be private or internal** and never exported in the public API
- **All implementation details must be encapsulated** behind the interface contracts
- **Implementation classes are hidden behind interfaces** with no direct access to internal state or methods

#### **Factory Function Pattern**
- **Factory functions must follow the `create*` naming pattern** (e.g., `createOTelWebSdk`, `createTracerProvider`)
- **Factory functions must return interface types, not implementation types** to maintain proper encapsulation
- **Factory functions handle all initialization complexity** including configuration validation, dependency setup, and plugin initialization
- **Implementation classes are never exposed directly** - only through their corresponding interfaces

#### **Enhanced Configuration Interfaces**
- **Configuration interfaces must have detailed JSDoc documentation** with descriptions, examples, and default values for all properties
- **Dedicated interfaces for specific component types** (e.g., metric types, span options, logger configurations)
- **Nested interfaces for configuration options** to organize related settings and improve readability
- **Proper typing for all configuration options** with backward compatibility for existing configurations

#### **Interface Benefits Implementation**
- **Improved type safety and compile-time checking** through strict interface contracts
- **Better encapsulation of implementation details** preventing access to internal APIs
- **Easier testing through interface mocking** enabling comprehensive unit testing
- **Better tree-shaking for reduced bundle size** by eliminating unused implementation code
- **Enhanced IDE support with better IntelliSense** through detailed interface documentation

#### **Naming Conventions**
- **Public interfaces**: `I` prefix (e.g., `ITracerProvider`, `ISpan`, `ILogger`)
- **Internal interfaces**: `_I` prefix with `@internal` JSDoc tags (e.g., `_ISpanProcessor`, `_IExporter`)
- **Factory functions**: `create*` pattern (e.g., `createOTelWebSdk`, `createBatchSpanProcessor`)
- **Const enums**: lowercase `e` prefix for internal use (e.g., `eSpanKind`, `eLogSeverity`, `eSpanStatusCode`)
- **Public enum types**: corresponding types without `e` prefix using `createEnumStyle` pattern (e.g., `SpanKind`, `LogSeverity`, `SpanStatusCode`)

#### **Enum Design Pattern**

The SDK follows the ApplicationInsights-JS enum pattern using `createEnumStyle` for optimal tree-shaking and type safety:

**Internal Const Enums (Not Exported):**
```typescript
/**
 * Internal const enum for span kinds - used internally by the SDK
 * @internal
 */
export const enum eSpanKind {
  INTERNAL = 0,
  SERVER = 1,
  CLIENT = 2,
  PRODUCER = 3,
  CONSUMER = 4
}

/**
 * Internal const enum for log severity levels - used internally by the SDK
 * @internal
 */
export const enum eLogSeverity {
  TRACE = 1,
  DEBUG = 5,
  INFO = 9,
  WARN = 13,
  ERROR = 17,
  FATAL = 21
}
```

**Public Exported Types (Using createEnumStyle):**
```typescript
import { createEnumStyle } from "@microsoft/applicationinsights-core-js";

/**
 * Public enum-style object for span kinds
 * Provides both key => value and value => key mappings for runtime use
 */
export const SpanKind = (/* @__PURE__ */createEnumStyle<typeof eSpanKind>({
  INTERNAL: eSpanKind.INTERNAL,
  SERVER: eSpanKind.SERVER,
  CLIENT: eSpanKind.CLIENT,
  PRODUCER: eSpanKind.PRODUCER,
  CONSUMER: eSpanKind.CONSUMER
}));

/**
 * Type definition for span kind values
 * Allows both numeric values and enum object values
 */
export type SpanKind = number | eSpanKind;

/**
 * Public enum-style object for log severity levels
 */
export const LogSeverity = (/* @__PURE__ */createEnumStyle<typeof eLogSeverity>({
  TRACE: eLogSeverity.TRACE,
  DEBUG: eLogSeverity.DEBUG,
  INFO: eLogSeverity.INFO,
  WARN: eLogSeverity.WARN,
  ERROR: eLogSeverity.ERROR,
  FATAL: eLogSeverity.FATAL
}));

/**
 * Type definition for log severity values
 */
export type LogSeverity = number | eLogSeverity;
```

**Usage Pattern Benefits:**
1. **Internal SDK Code**: Uses const enums directly for optimal performance and tree-shaking
2. **Public API**: Consumers use the exported enum-style objects and types
3. **Tree-Shaking Optimization**: Unused enum values are eliminated from final bundle
4. **Type Safety**: Full TypeScript support with proper type checking
5. **Runtime Flexibility**: Supports object properties, const enum values, and numeric values
6. **Developer Experience**: Multiple usage patterns accommodate different developer preferences

#### **Documentation Standards**
- **Comprehensive JSDoc comments for all public interfaces** with purpose, usage examples, and implementation notes
- **Interface relationship diagrams** showing inheritance hierarchies and component relationships
- **Mapping interfaces to OpenTelemetry specification concepts** for standards compliance
- **Complete usage examples** demonstrating proper interface usage patterns
- **Enum documentation with value explanations** and mapping to OpenTelemetry specification values
- **Clear distinction between internal const enums and public enum objects** with appropriate `@internal` tags

### 2. Closure-Based Implementation OR DynamicProto-JS Classes
- **Implementation Choice**: Use EITHER closure pattern for interface implementations OR DynamicProto-JS for class-based implementations
- **Closure Pattern**: Use closures when implementing interfaces - provides private member hiding with direct object property assignment
- **DynamicProto Classes**: Use DynamicProto-JS when you need class inheritance - provides private member hiding with prototype-based inheritance
- **Bundle Size Optimization**: Both patterns provide optimal bundle size through tree-shaking and dead code elimination
- **Private Member Hiding**: Both patterns provide true encapsulation - closures through closure variables, DynamicProto through internal closures
- **Usage Guideline**: Use closures for interface implementations, use DynamicProto only when class inheritance is required

### 3. Factory Function Pattern with Dependency Injection
- **Controlled Instantiation**: All components created through factory functions following `create*` naming convention
- **Inversion of Control**: Dependencies are injected rather than accessed globally or through singletons
- **Dependency Resolution**: Built-in dependency resolution and lifecycle management without global state
- **Configuration Validation**: Comprehensive validation and sanitization of all configuration inputs
- **Error Handling**: Graceful failure modes with detailed error reporting
- **Explicit Dependencies**: All required dependencies must be explicitly provided, eliminating hidden globals

### 4. Inversion of Control (IoC) Pattern
- **Dependency Injection**: All dependencies are explicitly provided through factory functions and configuration
- **No Global Properties**: The SDK MUST NOT rely on global variables, singletons, or static state
- **Explicit Instance Management**: All SDK instances must be explicitly created and managed by consumers
- **Isolation**: Multiple SDK instances can coexist without interference
- **Context Propagation**: Explicit context passing eliminates hidden global state dependencies
- **Testability**: Enhanced testing capabilities through controlled instance creation and dependency injection

### 5. Modular Architecture
- **Selective Loading**: Components can be imported individually to minimize bundle size
- **Plugin Architecture**: Extensible design supporting custom exporters, processors, and instrumentations
- **Lazy Loading**: Components are initialized only when needed
- **Version Compatibility**: Backward and forward compatibility through interface versioning

### 6. Performance-First Design
- **Minimal Overhead**: Designed to have negligible impact on application performance
- **Async Operations**: Non-blocking telemetry collection and export
- **Batching**: Intelligent batching strategies to reduce network overhead
- **Resource Management**: Automatic cleanup and resource management

### 7. Key Implementation Principals / Features

The SDK implements a complete set of enterprise-grade features following strict architectural patterns:

#### **Core Implementation Patterns**
1. **Interface-First Design**: TypeScript interfaces define all public contracts and public APIs
2. **Factory-First Architecture**: Use factory functions to create instances instead of exposing constructors directly, providing explicit instantiation with dependency injection
3. **IoC Pattern**: No global state, explicit dependency management throughout all components
4. **No Global Singletons**: The design avoids using global variables like context, api, trace, and logs - all state is contained within explicitly created instances managed by the SDK Factory
5. **Closure-Based Implementation**: Use closures instead of classes for bundle size optimization, true hiding of internal private properties/state and reduced bundle size
6. **Modular Architecture**: Supports tree-shaking to create minimal bundle sizes by only including used code with interfaces for all arguments to avoid tight coupling - individual components can be selectively imported

#### **OpenTelemetry Compliance and Extensions**
7. **Full OTel Compliance**: Complete **compatible** implementation of OpenTelemetry's trace, logs, and basic metrics APIs following the official specification
8. **Multi-Tenant Support**: Support for multiple named instances enables team/project isolation and independent resource management:
   - **Shared Resource Optimization**: Multiple SDK instances share timers, connection pools, export queues, and object pools to minimize overhead
   - **Instance Isolation**: Each SDK instance maintains its own configuration, processors, and instrumentations while sharing underlying resources
   - **Explicit Instance Creation**: Users must explicitly create instances of all components through the Factory, giving them full control over the lifecycle and configuration

#### **Performance and Extensibility Features**
9. **High-Performance Architecture**: Minimal overhead design with advanced batching, resource management, and bundle optimization
10. **Context Management**: Better control over context propagation with explicit context creation and management
11. **Extensibility**: Support for custom exporters, processors, and samplers to extend functionality
12. **DynamicProto-JS**: When classes are required, use DynamicProto-JS for complex implementations to optimize bundle size while maintaining prototype inheritance benefits
13. **Azure Monitor Integration**: Seamless integration with Azure Monitor through specialized exporters

## SDK Instance Factory Architecture

The OTelWebSDK uses a **SDK Instance Factory** as the primary interface for consumers following strict **Inversion of Control (IoC) principles**. The SDK Factory serves as the factory for creating SDK instances with full dependency injection.

### Key IoC Requirements

- **No Global Context Dependencies**: Helper functions MUST NOT rely on globals to obtain context or configuration
- **Explicit Dependency Injection**: All required dependencies (context, configuration, managers) must be explicitly passed as arguments
- **Factory as Primary Interface**: All SDK instances MUST be created through `factory.newInst()`
- **No Manual Registration**: Instances are automatically registered during creation

### IoC-Compliant Consumer Pattern

```typescript
// CORRECT: IoC-compliant pattern
import { createSdkFactory } from '@microsoft/applicationinsights-otelwebsdk-js';

// 1. Create factory (no global state dependency)
const factory = createSdkFactory('my-application');

// 2. Factory creates instance with dependency injection
const sdk = factory.newInst('my-service', {
  connectionString: 'InstrumentationKey=key',
  resource: {
    'service.name': 'my-service',
    'service.version': '1.0.0'
  }
});

// 3. Use SDK normally (dependencies already injected)
await sdk.initialize();
const tracer = sdk.tracerProvider.getTracer('operations');

// CORRECT: Helper function with explicit dependencies
function createNewInst(factory: ISdkFactory, instanceName: string, config: any) {
  // GOOD: All dependencies explicitly passed as arguments
  // No hidden globals, no implicit context - everything is explicit
  return factory.newInst(instanceName, config);
}

// Usage: Dependencies are clear and explicit
const myInstance = createNewInst(factory, 'my-service', { connectionString: 'key' });
```

### Anti-Pattern (Violates IoC)

```typescript
// WRONG: Helper function relies on globals to get context
function createNewInst(config: any) {
  // BAD: Getting context from global state
  const currentContext = globalState.getCurrentContext(); // Violates IoC!
  const factory = currentContext.getFactory(); // Uses hidden global dependency
  return factory.newInst('service', config);
}

// WRONG: Function doesn't explicitly declare its dependencies
function createNewInst(config: any) {
  // BAD: Hidden dependency on global factory
  const factory = getGlobalFactory(); // Where does this come from? Not explicit!
  return factory.newInst('service', config);
}
```

**IoC Violation**: These functions hide their dependencies, making testing difficult and creating implicit global state requirements.

### SDK Factory Architecture

The SDK Factory orchestrates multiple SDK instances while optimizing resource usage:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               SDK Factory Architecture                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Application Layer                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Team A    │  │   Team B    │  │   Team C    │  │   Team D    │             │
│  │ Application │  │ Application │  │ Application │  │ Application │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                │                    │
│         └────────────────┼────────────────┼────────────────┘                    │
│                          │                │                                     │
│  ┌──────────────────────▼────────────────▼───────────────────────────────────┐ │
│  │                          SDK Factory                                      │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │ │
│  │  │ Instance        │  │ Resource        │  │ Configuration   │            │ │
│  │  │ Registry        │  │ Coordinator     │  │ Manager         │            │ │
│  │  │                 │  │                 │  │                 │            │ │
│  │  │ - Create        │  │ - Connection    │  │ - Policies      │            │ │
│  │  │ - Register      │  │   Pooling       │  │ - Inheritance   │            │ │
│  │  │ - Lifecycle     │  │ - Timer Coord   │  │ - Validation    │            │ │
│  │  │ - Cleanup       │  │ - Batch Coord   │  │ - Updates       │            │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘            │ │
│  └──────────────────────┬────────────────────────────────────────────────────┘ │
│                         │                                                       │
│  ┌──────────────────────▼─────────────────────────────────────────────────────┐ │
│  │                     SDK Instance Layer                                     │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │ │
│  │  │  Team A     │ │  Team B     │ │  Team C     │ │  Team D     │           │ │
│  │  │  SDK Inst   │ │  SDK Inst   │ │  SDK Inst   │ │  SDK Inst   │           │ │
│  │  │             │ │             │ │             │ │             │           │ │
│  │  │ - Isolated  │ │ - Isolated  │ │ - Isolated  │ │ - Isolated  │           │ │
│  │  │   Config    │ │   Config    │ │   Config    │ │   Config    │           │ │
│  │  │ - Team      │ │ - Team      │ │ - Team      │ │ - Team      │           │ │
│  │  │   Context   │ │   Context   │ │   Context   │ │   Context   │           │ │
│  │  │ - Telemetry │ │ - Telemetry │ │ - Telemetry │ │ - Telemetry │           │ │
│  │  │   Namespace │ │   Namespace │ │   Namespace │ │   Namespace │           │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │ │
│  └──────────────────────┬────────────────────────────────────────────────────┘ │
│                         │                                                       │
│  ┌──────────────────────▼─────────────────────────────────────────────────────┐ │
│  │                     Shared Resources Layer                                 │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │ │
│  │  │ Connection  │ │ Timer       │ │ Export      │ │ Processing  │           │ │
│  │  │ Pool        │ │ Scheduler   │ │ Coordinator │ │ Pipeline    │           │ │
│  │  │             │ │             │ │             │ │             │           │ │
│  │  │ - Optimize  │ │ - Sync      │ │ - Batch     │ │ - Shared    │           │ │
│  │  │   Network   │ │   Export    │ │   Optimize  │ │   Processors│           │ │
│  │  │ - Pool      │ │ - Reduce    │ │ - Team      │ │ - Parallel  │           │ │
│  │  │   Reuse     │ │   Overhead  │ │   Isolation │ │   Processing│           │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

This architecture enables:

### Multi-Tenant Benefits
- **Tenant Isolation**: Each team gets their own SDK instance with isolated configuration and telemetry context
- **Resource Efficiency**: Shared connections, timers, and processing resources across instances
- **Centralized Management**: Enterprise-wide policies and monitoring capabilities
- **Independent Lifecycle**: Teams can manage their SDK instances independently
- **Namespace Separation**: Automatic telemetry namespacing prevents team conflicts

### Resource Coordination
- **Connection Pooling**: Efficient sharing of network connections across tenant instances
- **Timer Synchronization**: Coordinated export schedules to reduce browser overhead
- **Batch Optimization**: Intelligent batching that considers all team instances
- **Processing Pipeline Sharing**: Shared processors for common operations while maintaining isolation

## Dependency Injection Flow Architecture

Shows how dependencies are injected throughout the SDK without global state:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          Dependency Injection Architecture                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ Configuration Layer                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │                           IOTelWebSdkConfig                                 │ │
│ │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │ │
│ │  │ Connection  │ │ Exporters   │ │ Processors  │ │ Resource    │           │ │
│ │  │ Config      │ │ Config      │ │ Config      │ │ Config      │           │ │
│ │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │ │
│ └─────────────────────────────────┬───────────────────────────────────────────┘ │
│                                   │                                             │
│ Factory Creation Layer            │                                             │
│ ┌─────────────────────────────────▼─────────────────────────────────────────┐   │
│ │                       createOTelWebSdk(config)                           │   │
│ │                                                                           │   │
│ │  Dependencies Validated & Injected:                                      │   │
│ │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │   │
│ │  │ ✓ Resource  │ │ ✓ Logger    │ │ ✓ Context   │ │ ✓ Clock     │         │   │
│ │  │   Required  │ │   Required  │ │   Manager   │ │   Injectable│         │   │
│ │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘         │   │
│ └─────────────────────────────────┬─────────────────────────────────────────┘   │
│                                   │                                             │
│ Provider Creation Layer           │                                             │
│ ┌─────────────────────────────────▼─────────────────────────────────────────┐   │
│ │                         Provider Factory Functions                       │   │
│ │  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────┐  │   │
│ │  │ createTraceProvider │  │ createLogProvider   │  │ createMeter      │  │   │
│ │  │ (traceConfig)       │  │ (logConfig)         │  │ Provider         │  │   │
│ │  │                     │  │                     │  │ (meterConfig)    │  │   │
│ │  │ Injects:            │  │ Injects:            │  │                  │  │   │
│ │  │ • Resource          │  │ • Resource          │  │ Injects:         │  │   │
│ │  │ • SpanProcessors    │  │ • LogProcessors     │  │ • Resource       │  │   │
│ │  │ • Sampler           │  │ • LogExporters      │  │ • MetricReaders  │  │   │
│ │  │ • IdGenerator       │  │ • Logger            │  │ • MetricExporter │  │   │
│ │  │ • ContextManager    │  │ • ContextManager    │  │ • Logger         │  │   │
│ │  │ • Logger            │  │ • Clock             │  │ • Clock          │  │   │
│ │  │ • Clock             │  │ • Performance       │  │ • Performance    │  │   │
│ │  └─────────────────────┘  └─────────────────────┘  └──────────────────┘  │   │
│ └─────────────────────────────────┬─────────────────────────────────────────┘   │
│                                   │                                             │
│ Implementation Layer              │                                             │
│ ┌─────────────────────────────────▼─────────────────────────────────────────┐   │
│ │                      DynamicProto + Closure Pattern                      │   │
│ │  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────┐  │   │
│ │  │ TraceProviderImpl   │  │ LogProviderImpl     │  │ MeterProviderImpl│  │   │
│ │  │                     │  │                     │  │                  │  │   │
│ │  │ Closure Variables:  │  │ Closure Variables:  │  │ Closure Variables│  │   │
│ │  │ let _resource;      │  │ let _resource;      │  │ let _resource;   │  │   │
│ │  │ let _processors;    │  │ let _processors;    │  │ let _readers;    │  │   │
│ │  │ let _sampler;       │  │ let _exporters;     │  │ let _exporters;  │  │   │
│ │  │ let _tracers;       │  │ let _loggers;       │  │ let _meters;     │  │   │
│ │  │ let _isShutdown;    │  │ let _isShutdown;    │  │ let _isShutdown; │  │   │
│ │  │                     │  │                     │  │                  │  │   │
│ │  │ All dependencies    │  │ All dependencies    │  │ All dependencies │  │   │
│ │  │ injected via        │  │ injected via        │  │ injected via     │  │   │
│ │  │ factory config      │  │ factory config      │  │ factory config   │  │   │
│ │  └─────────────────────┘  └─────────────────────┘  └──────────────────┘  │   │
│ └─────────────────────────────────┬─────────────────────────────────────────┘   │
│                                   │                                             │
│ Component Creation Layer          │                                             │
│ ┌─────────────────────────────────▼─────────────────────────────────────────┐   │
│ │                      Component Factory Functions                         │   │
│ │  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────┐  │   │
│ │  │ createTracer()      │  │ createLogger()      │  │ createMeter()    │  │   │
│ │  │                     │  │                     │  │                  │  │   │
│ │  │ Dependencies        │  │ Dependencies        │  │ Dependencies     │  │   │
│ │  │ from Provider:      │  │ from Provider:      │  │ from Provider:   │  │   │
│ │  │ • Resource          │  │ • Resource          │  │ • Resource       │  │   │
│ │  │ • Processors        │  │ • Processors        │  │ • Readers        │  │   │
│ │  │ • Sampler           │  │ • Exporters         │  │ • Exporters      │  │   │
│ │  │ • ContextManager    │  │ • ContextManager    │  │ • Clock          │  │   │
│ │  │ • Logger            │  │ • Logger            │  │ • Logger         │  │   │
│ │  └─────────────────────┘  └─────────────────────┘  └──────────────────┘  │   │
│ └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│ Benefits:                                                                   │
│ • No global state or singletons                                                │
│ • All dependencies explicit and testable                                       │
│ • Clean interfaces with dependency injection                                   │
│ • True isolation between SDK instances                                         │
│ • Enhanced performance through closures                                        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Key Dependency Injection Principles

1. **Explicit Dependencies**: All components declare their dependencies upfront through factory function parameters
2. **No Hidden Globals**: Zero reliance on global variables, window properties, or static state
3. **Constructor Injection**: Dependencies provided at creation time, not accessed later
4. **Interface-Based**: Components depend on interfaces, enabling easy testing and swapping
5. **Lifecycle Clarity**: Parent components manage the lifecycle of their dependencies
6. **Performance Optimization**: Closure-based implementation with injected dependencies for optimal runtime performance

## Application Insights SDK Requirements

Building on OpenTelemetry standards, the SDK inherits and extends the proven requirements from the Microsoft Application Insights JavaScript SDK to ensure enterprise-grade reliability and functionality:

### 7. Dynamic Configuration Management
- **Runtime Configuration Updates**: Support for configuration changes after SDK initialization without requiring restart
- **Hot Reload Capability**: Ability to update connection strings, sampling rates, and feature flags dynamically
- **Configuration Validation**: Real-time validation of configuration changes with rollback on failure
- **Configuration Persistence**: Automatic persistence of valid configuration changes across application restarts
- **Gradual Configuration Rollout**: Support for staged configuration deployment and A/B testing scenarios
- **Reactive Configuration Pattern**: Configuration changes propagated through reactive event patterns rather than explicit APIs

```typescript
// Dynamic configuration implemented through reactive patterns
const sdk = createOTelWebSdk(initialConfig);
await sdk.initialize();

// Configuration changes handled reactively via event callbacks
sdk.onConfigChange((newConfig: IOTelWebSdkConfig) => {
  console.log('Configuration updated:', newConfig);
  // SDK automatically applies validated configuration changes
});

// Configuration updates can come from various sources:
// - Remote configuration services
// - Feature flag systems
// - Environment variable changes
// - Runtime API calls

// Example: Remote configuration update triggers reactive pattern
// External system pushes config change -> SDK validates -> onConfigChange fires -> Components adapt
```

### 8. Complete Unload and Cleanup Support
- **Instance Unload**: Complete removal of SDK instances with all associated hooks, timers, and event listeners
- **Memory Leak Prevention**: Comprehensive cleanup of closures, event handlers, and DOM modifications
- **Hook Removal**: Automatic removal of all instrumentation hooks (XHR, fetch, unhandled errors, etc.)
- **Resource Cleanup**: Proper disposal of timers, intervals, observers, and background processes
- **Graceful Shutdown**: Coordinated shutdown ensuring in-flight telemetry is properly handled

```typescript
interface IUnloadManager {
  unload(): Promise<IUnloadResult>;
  unloadWithTimeout(timeoutMs: number): Promise<IUnloadResult>;
  onUnloadComplete(callback: (result: IUnloadResult) => void): IDisposable;
  getUnloadStatus(): IUnloadStatus;
  forceUnload(): Promise<IUnloadResult>; // Emergency cleanup
}

interface IUnloadResult {
  success: boolean;
  cleanupItems: string[];
  failedCleanup: string[];
  duration: number;
  pendingTelemetry: number;
}

// Example unload sequence
const sdk = createOTelWebSdk(config);
await sdk.initialize();

// ... application usage ...

// Clean shutdown
const unloadResult = await sdk.unload();
if (!unloadResult.success) {
  console.warn('Some cleanup items failed:', unloadResult.failedCleanup);
}
```

### 9. Enterprise Multi-Tenant Support
- **Tenant Isolation**: Independent SDK instances per team with isolated configuration and telemetry contexts
- **Resource Sharing**: Efficient sharing of connections, timers, and processing resources across tenant instances
- **Namespace Management**: Automatic namespacing of telemetry data to prevent team conflicts
- **Configuration Inheritance**: Team-specific configuration overrides with enterprise-wide default policies
- **Coordinated Management**: Central management capabilities for monitoring and controlling team instances

```typescript
interface IEnterpriseManager {
  createTeamInstance(teamId: string, config?: Partial<IOTelWebSdkConfig>): IOTelWebSdk;
  getTeamInstance(teamId: string): IOTelWebSdk | undefined;
  getAllTeamInstances(): Map<string, IOTelWebSdk>;
  setEnterprisePolicy(policy: IEnterprisePolicy): void;
  unloadTeamInstance(teamId: string): Promise<void>;
  unloadAllTeams(): Promise<IEnterpriseUnloadResult>;
}

interface IEnterprisePolicy {
  defaultSamplingRate: number;
  allowedConnectionStrings: string[];
  requiredTelemetryProcessors: string[];
  dataRetentionPolicy: IDataRetentionPolicy;
  complianceSettings: IComplianceSettings;
}

// Example enterprise usage
const enterpriseManager = createEnterpriseManager(enterpriseConfig);

// Team A - E-commerce
const ecommerceSDK = enterpriseManager.createTeamInstance('ecommerce', {
  customProperties: { 'team.name': 'ecommerce', 'cost.center': 'retail' }
});

// Team B - Analytics
const analyticsSDK = enterpriseManager.createTeamInstance('analytics', {
  customProperties: { 'team.name': 'analytics', 'cost.center': 'insights' }
});
```

### 10. Bundle Size Optimization
- **Tree-Shaking Friendly**: Full support for dead code elimination with no side effects
- **Modular Loading**: Individual components can be imported to minimize bundle size
- **Code Splitting**: Automatic code splitting for large applications with dynamic imports
- **Compression Optimization**: Optimal minification and compression for production builds
- **Size Monitoring**: Built-in bundle size analysis and optimization recommendations

```typescript
// Selective imports for minimal bundle size
import { createTraceProvider } from '@microsoft/otel-web-sdk/trace';
import { createOTLPExporter } from '@microsoft/otel-web-sdk/exporters/otlp';

// Or full SDK import with tree-shaking
import { createOTelWebSdk } from '@microsoft/otel-web-sdk';

// Bundle size targets:
// Core SDK: ~15-20KB gzipped
// With all providers: ~25-35KB gzipped  
// With auto-instrumentation: ~40-55KB gzipped
// Full feature set: ~60-80KB gzipped (still smaller than most alternatives)
```

### 11. Universal JavaScript Runtime Support
- **Platform Detection**: Automatic detection of runtime environment (Browser, Web Worker, Node.js, SSR)
- **API Adaptation**: Runtime-specific API usage with graceful fallbacks for missing features
- **SSR Compatibility**: Full support for Server-Side Rendering scenarios with hydration
- **Web Worker Support**: Complete functionality in Web Worker and Service Worker environments
- **Node.js Integration**: Seamless operation in Node.js environments for SSR and build tools

```typescript
interface IRuntimeAdapter {
  readonly platform: 'browser' | 'webworker' | 'node' | 'unknown';
  readonly capabilities: IRuntimeCapabilities;
  
  detectEnvironment(): IRuntimeEnvironment;
  getPerformanceNow(): (() => number);
  getStorage(): IStorageAdapter | null;
  getNetworkAdapter(): INetworkAdapter;
  getTimerAdapter(): ITimerAdapter;
}

interface IRuntimeCapabilities {
  hasPerformance: boolean;
  hasStorage: boolean;
  hasWebWorkers: boolean;
  hasServiceWorkers: boolean;
  hasDOM: boolean;
  hasConsole: boolean;
  hasProcess: boolean;
  supportsStreams: boolean;
}

// Example runtime adaptation
const runtimeAdapter = createRuntimeAdapter();

if (runtimeAdapter.platform === 'browser') {
  // Use browser-specific optimizations
  enableWebVitalsTracking();
  enableUserInteractionTracking();
} else if (runtimeAdapter.platform === 'node') {
  // Use Node.js-specific features for SSR
  enableServerSideInstrumentation();
}

// SSR example
function renderWithTelemetry(component: ReactComponent): string {
  const sdk = createOTelWebSdk({
    platform: 'ssr',
    enableClientSideHydration: true,
    telemetryEndpoint: process.env.TELEMETRY_ENDPOINT
  });
  
  return ReactDOMServer.renderToString(
    <TelemetryProvider sdk={sdk}>
      {component}
    </TelemetryProvider>
  );
}
```

### Integration with OpenTelemetry Standards

These Application Insights requirements seamlessly integrate with OpenTelemetry standards:

- **Dynamic Configuration** extends OTel configuration management with runtime updates
- **Unload Support** ensures proper cleanup of OTel providers, processors, and exporters
- **Multi-Tenant Support** leverages OTel's modular design for isolated instances
- **Bundle Size** optimization works with OTel's tree-shakable architecture
- **Runtime Support** adapts OTel APIs to different JavaScript environments

This dual approach provides OpenTelemetry standard compliance while delivering the enterprise-grade features that Application Insights users depend on.

## Detailed Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          OTelWebSDK Architecture                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐          │
│  │  Application    │    │  Framework      │    │  User Code      │          │
│  │  Code           │    │  Integration    │    │                 │          │
│  └─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘          │
│            │                      │                      │                  │
│            └──────────────────────┼──────────────────────┘                  │
│                                   │                                         │
│  ┌─────────────────────────────────▼─────────────────────────────────┐      │
│  │                     IOTelWebSDK Interface                         │      │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │      │
│  │  │ITraceProvider│ │ILogProvider │ │IMeterProvider│ │IContextMgr │  │      │
│  │  │             │ │             │ │  (Basic)    │ │             │  │      │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │      │
│  └─────────────────────────────────┬─────────────────────────────────┘      │
│                                    │                                        │
│  ┌─────────────────────────────────▼─────────────────────────────────┐      │
│  │                    Factory Function Layer                         │      │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │      │
│  │  │createOTel   │ │createTrace  │ │createLog    │               │      │
│  │  │WebSdk()     │ │Provider()   │ │Provider()   │ │Provider()   │  │      │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │      │
│  └─────────────────────────────────┬─────────────────────────────────┘      │
│                                    │                                        │
│  ┌─────────────────────────────────▼─────────────────────────────────┐      │
│  │                 Implementation Layer (Hidden)                     │      │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │      │
│  │  │OTelWebSdk   │ │TraceProvider│ │LogProvider  │ │MeterProvider│  │      │
│  │  │Impl         │ │Impl         │ │Impl         │ │Impl         │  │      │
│  │  │(DynamicProto│ │(DynamicProto│ │(DynamicProto│ │(DynamicProto│  │      │
│  │  │ + Closures) │ │ + Closures) │ │ + Closures) │ │ + Closures) │  │      │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │      │
│  └─────────────────────────────────┬─────────────────────────────────┘      │
│                                    │                                        │
│  ┌─────────────────────────────────▼─────────────────────────────────┐      │
│  │                      Processing Pipeline                          │      │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │      │
│  │  │Span         │ │Log Record   │ │Metric       │ │Context      │  │      │
│  │  │Processors   │ │Processors   │ │Readers      │ │Propagators  │  │      │
│  │  │- Simple     │ │- Simple     │ │- Periodic   │ │- W3C        │  │      │
│  │  │- Batch      │ │- Batch      │ │- Manual     │ │- B3         │  │      │
│  │  │- Sampling   │ │- Filter     │ │- Push       │ │- Jaeger     │  │      │
│  │  │- Custom     │ │- Enrichment │ │- Pull       │ │- Baggage    │  │      │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │      │
│  └─────────────────────────────────┬─────────────────────────────────┘      │
│                                    │                                        │
│  ┌─────────────────────────────────▼─────────────────────────────────┐      │
│  │                       Export Layer                                │      │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │      │
│  │  │Span         │ │Log          │ │Metric       │ │Custom       │  │      │
│  │  │Exporters    │ │Exporters    │ │Exporters    │ │Exporters    │  │      │
│  │  │- Azure      │ │- Azure      │ │- Azure      │ │- Pluggable  │  │      │
│  │  │  Monitor    │ │  Monitor    │ │  Monitor    │ │- Community  │  │      │
│  │  │- OTLP       │ │- OTLP       │ │- Prometheus │ │- Enterprise │  │      │
│  │  │- Console    │ │- Console    │ │- OTLP       │ │- Debug      │  │      │
│  │  │- Jaeger     │ │- Splunk     │ │- Custom     │ │- Test       │  │      │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │      │
│  └─────────────────────────────────┬─────────────────────────────────┘      │
│                                    │                                        │
└────────────────────────────────────┼─────────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼─────────────────────────────────────────┐
│                            Backend Systems                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │
│  │Azure Monitor│ │OTLP         │ │Prometheus   │ │Custom       │             │
│  │- App        │ │- Collector  │ │- Server     │ │- Proprietary│             │
│  │  Insights   │ │- Gateway    │ │- Agent      │ │- Legacy     │             │
│  │- Log        │ │- Vendor     │ │- Pushgateway│ │- Future     │             │
│  │  Analytics  │ │  Distros    │ │- Federation │ │  Systems    │             │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘             │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Implementation Patterns: Closures OR DynamicProto Classes

The SDK uses two distinct implementation patterns depending on the specific requirements:

### Pattern 1: Closure-Based Interface Implementation

For most interface implementations, the SDK uses closures with direct object property assignment:

### Benefits of Closure Pattern

1. **Superior Bundle Size Optimization**: Closure variables can be aggressively minified by modern bundlers
2. **True Private State**: Internal variables remain completely inaccessible from outside the closure
3. **Enhanced Tree-Shaking**: More effective dead code elimination for minimal bundle sizes
4. **Browser Compatibility**: Works consistently across all target browsers including legacy environments
5. **Efficient Implementation**: Direct property assignment with optimized execution patterns
6. **Runtime Optimization**: V8 and other engines can better optimize closure-based code

### Implementation Pattern

```typescript
export function createTraceProvider(config: ITraceProviderConfig): ITraceProvider {
  // Private closure variables - completely encapsulated
  let _config = { ...defaultConfig, ...config };
  let _tracers = new Map<string, ITracer>();
  let _processors: ISpanProcessor[] = [];
  let _isShutdown = false;
  let _logger = createLogger("TraceProvider");

  // Validation and setup
  validateConfiguration(_config);
  
  // Create the interface instance
  let _self = {} as ITraceProvider;

  // Define methods directly on the interface instance
  // Public method implementations with closure access
  _self.getTracer = (name: string, version?: string, options?: ITracerOptions): ITracer => {
    if (_isShutdown) {
      _logger.warn("TraceProvider is shutdown, returning no-op tracer");
      return createNoOpTracer();
    }
    
    const key = `${name}@${version || 'unknown'}`;
    let tracer = _tracers.get(key);
    
    if (!tracer) {
      tracer = createTracer({
        name,
        version,
        traceProvider: _self,
        resource: _config.resource,
        ...options
      });
      _tracers.set(key, tracer);
    }
    
    return tracer;
  };

  _self.addSpanProcessor = (processor: ISpanProcessor): void => {
    if (_isShutdown) {
      throw new Error("Cannot add processor to shutdown TraceProvider");
    }
    
    _processors.push(processor);
    // Notify existing tracers of new processor
    _tracers.forEach(tracer => tracer._addProcessor(processor));
  };

  _self.shutdown = async (): Promise<void> => {
    if (_isShutdown) return;
    
    _isShutdown = true;
    
    // Shutdown all processors in parallel
    await Promise.all(_processors.map(processor => 
      processor.shutdown().catch(err => 
        _logger.error("Error shutting down processor", err)
      )
    ));
    
    // Clear references for garbage collection
    _tracers.clear();
    _processors.length = 0;
  };

  return _self;
}
```

### Pattern 2: DynamicProto-JS Classes (When Inheritance is Needed)

When class inheritance or complex prototype chains are required, use DynamicProto-JS:

```typescript
import { dynamicProto } from "@microsoft/dynamicproto-js";

export function createComplexProcessor(config: IProcessorConfig): ISpanProcessor {
  // Private closure variables
  let _config = { ...config };
  let _isShutdown = false;
  
  // Create class instance
  let _self = {} as ISpanProcessor;
  
  // Use DynamicProto for complex inheritance scenarios
  dynamicProto(BaseProcessor, _self, (_self) => {
    
    _self.onStart = (span: ISpan): void => {
      // Implementation with access to closure variables
      if (!_isShutdown) {
        // Process span using _config
      }
    };
    
    _self.onEnd = (span: ISpan): void => {
      // Implementation
    };
    
  });
  
  return _self;
}

/**
 * @DynamicProtoStub
 */
function BaseProcessor() {
  // Stub for DynamicProto
}
```
  let _self = {} as ITraceProvider;

  // Define methods directly on the interface instance
  // Public method implementations with closure access
  _self.getTracer = (name: string, version?: string, options?: ITracerOptions): ITracer => {
    if (_isShutdown) {
      _logger.warn("TraceProvider is shutdown, returning no-op tracer");
      return createNoOpTracer();
    }
    
    const key = `${name}@${version || 'unknown'}`;
    let tracer = _tracers.get(key);
    
    if (!tracer) {
      tracer = createTracer({
        name,
        version,
        traceProvider: _self,
        resource: _config.resource,
        ...options
      });
      _tracers.set(key, tracer);
    }
    
    return tracer;
  };

  _self.addSpanProcessor = (processor: ISpanProcessor): void => {
    if (_isShutdown) {
      throw new Error("Cannot add processor to shutdown TraceProvider");
    }
    
    _processors.push(processor);
    // Notify existing tracers of new processor
    _tracers.forEach(tracer => tracer._addProcessor(processor));
  };

  _self.shutdown = async (): Promise<void> => {
    if (_isShutdown) return;
    
    _isShutdown = true;
    
    // Shutdown all processors in parallel
    await Promise.all(_processors.map(processor => 
      processor.shutdown().catch(err => 
        _logger.error("Error shutting down processor", err)
      )
    ));
    
    // Clear references for garbage collection
    _tracers.clear();
    _processors.length = 0;
  };

  return _self;
}

### Performance Characteristics

- **Initialization**: ~2-5ms for full SDK setup including all providers
- **Span Creation**: <0.1ms per span with minimal memory allocation
- **Context Propagation**: <0.05ms per operation with optimized header handling
- **Bundle Size**: 15-25KB gzipped for full SDK (vs 40-60KB for class-based implementations)
- **Memory Usage**: DynamicProto provides 50-70% reduction through shared prototypes; closures optimize per-instance overhead

## Interface Design and Naming Conventions

The SDK follows strict architectural patterns for interface design to ensure consistency, maintainability, and future-proofing:

### Interface Hierarchy and Organization

```typescript
// Core SDK Interfaces
export interface IOTelWebSdk extends IOTelSdk {
  readonly traceProvider: ITraceProvider;
  readonly loggerProvider: ILoggerProvider;
  readonly meterProvider: IMeterProvider;
  readonly contextManager: IContextManager;
}

// Provider Interfaces
export interface ITraceProvider extends IProvider {
  getTracer(name: string, version?: string, options?: ITracerOptions): ITracer;
  addSpanProcessor(processor: ISpanProcessor): void;
  getActiveSpanProcessors(): ISpanProcessor[];
}

export interface ILoggerProvider extends IProvider {
  getLogger(name: string, version?: string, options?: ILoggerOptions): ILogger;
  addLogRecordProcessor(processor: ILogRecordProcessor): void;
  getActiveLogRecordProcessors(): ILogRecordProcessor[];
}

// Basic Metrics Provider - focused on simple metric generation only
export interface IMeterProvider extends IProvider {
  getMeter(name: string, version?: string, options?: IMeterOptions): IMeter;
  addMetricReader(reader: IMetricReader): void;
  getActiveMetricReaders(): IMetricReader[];
  // Note: Advanced features like metric views, complex aggregations, and 
  // sophisticated metric processing are intentionally excluded for lightweight implementation
}
```

### Naming Convention Standards

- **Public Interfaces**: `I` prefix (e.g., `ITraceProvider`, `ISpan`, `ILogger`)
- **Internal Interfaces**: `_I` prefix with `@internal` JSDoc tags (e.g., `_ISpanProcessor`, `_IExporter`)
- **Configuration Interfaces**: Descriptive names with `Config` suffix (e.g., `ITraceProviderConfig`, `ISpanOptions`)
- **Factory Functions**: `create*` pattern (e.g., `createOTelWebSdk`, `createBatchSpanProcessor`)
- **Const Enums**: lowercase `e` prefix for internal use (e.g., `eSpanKind`, `eLogSeverity`)
- **Public Enum Objects**: corresponding names without `e` prefix using `createEnumStyle` pattern

### Interface Evolution Strategy

1. **Semantic Versioning**: Interface changes follow strict semantic versioning
2. **Deprecation Path**: Clear deprecation warnings with migration guides
3. **Extension Points**: Interfaces designed with future extension capabilities
4. **Backward Compatibility**: New methods added as optional with sensible defaults

## Module Structure and Organization

The SDK follows a modular architecture that promotes maintainability, testability, and selective loading:

```bash
otel-web-sdk/
├── src/
│   ├── core/
│   │   ├── interfaces/
│   │   │   └── ...
│   │   ├── impl/
│   │   │   └── ...
│   │   ├── factories/
│   │   │   └── ...
│   │   └── index.ts
│   ├── trace/
│   │   ├── interfaces/
│   │   │   └── ...
│   │   ├── impl/
│   │   │   ├── processors/
│   │   │   ├── exporters/
│   │   │   ├── samplers/
│   │   │   └── ...
│   │   ├── factories/
│   │   │   └── ...
│   │   └── index.ts
│   ├── logs/
│   │   ├── interfaces/
│   │   │   └── ...
│   │   ├── impl/
│   │   │   ├── processors/
│   │   │   ├── exporters/
│   │   │   └── ...
│   │   ├── factories/
│   │   │   └── ...
│   │   └── index.ts
│   ├── context/
│   │   ├── interfaces/
│   │   │   └── ...
│   │   ├── impl/
│   │   │   ├── propagators/
│   │   │   ├── storage/
│   │   │   └── ...
│   │   ├── factories/
│   │   │   └── ...
│   │   └── index.ts
│   ├── instrumentation/
│   │   ├── auto/
│   │   │   └── ...
│   │   ├── manual/
│   │   │   └── ...
│   │   └── index.ts
│   ├── platform/
│   │   ├── browser/
│   │   ├── webworker/
│   │   ├── node/
│   │   └── ...
│   ├── utils/
│   │   ├── performance/
│   │   ├── validation/
│   │   ├── serialization/
│   │   ├── testing/
│   │   └── ...
│   └── index.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── performance/
│   ├── browser/
│   └── ...
├── examples/
│   ├── basic/
│   ├── react/
│   ├── angular/
│   ├── vue/
│   └── ...
├── docs/
│   ├── api/
│   ├── guides/
│   ├── migration/
│   └── ...
├── tools/
│   ├── build/
│   ├── test/
│   ├── size-analysis/
│   └── ...
├── package.json
├── tsconfig.json
├── rollup.config.js
└── README.md
```

### Module Loading Strategy

1. **Entry Point**: Single main entry point with selective imports
2. **Tree Shaking**: Full support for dead code elimination
3. **Lazy Loading**: Components loaded only when needed
4. **Code Splitting**: Automatic splitting for large applications
5. **Platform Detection**: Automatic platform-specific loading

## Configuration Management Architecture

The SDK implements a sophisticated configuration system designed for flexibility, validation, and runtime adaptability:

### Configuration Hierarchy

```typescript
interface IOTelWebSdkConfig {
  // Connection and endpoint configuration
  connectionString?: string;
  instrumentationKey?: string;  // Legacy support
  endpoint?: string;
  
  // Resource identification
  resource?: IResourceConfig;
  
  // Provider-specific configuration
  tracing?: ITraceProviderConfig;
  logging?: ILoggerProviderConfig;
  
  // Global settings
  disabled?: boolean;
  debug?: boolean;
  environment?: string;
  
  // Performance and limits
  performance?: IPerformanceConfig;
  limits?: ILimitsConfig;
  
  // Extension points
  plugins?: IPluginConfig[];
  instrumentations?: IInstrumentationConfig[];
  
  // Runtime behavior
  shutdownTimeout?: number;
  flushTimeout?: number;
  enableAutoInstrumentation?: boolean;
}
```

### Configuration Principles

1. **Hierarchical Override**: Configuration flows from global → provider → component levels
2. **Runtime Validation**: All configuration validated at creation time with detailed error messages
3. **Hot Reloading**: Support for runtime configuration updates where safe
4. **Environment Detection**: Automatic detection of browser, framework, and deployment environment
5. **Secure Defaults**: All defaults chosen for security and performance
6. **Schema Validation**: JSON Schema validation for configuration objects

### Configuration Sources

```typescript
// Priority order (highest to lowest):
// 1. Explicit configuration passed to factory functions
// 2. Environment variables (when available)
// 3. Configuration providers (remote config, etc.)
// 4. Default configuration

const configManager = createConfigManager({
  sources: [
    new ExplicitConfigSource(userConfig),
    new EnvironmentConfigSource(),
    new RemoteConfigSource(configEndpoint),
    new DefaultConfigSource()
  ],
  validation: {
    strict: true,
    throwOnError: true,
    logValidationErrors: true
  }
});
```

## Error Handling and Resilience Architecture

The SDK implements comprehensive error handling to ensure reliability in production environments:

### Error Categories and Handling

1. **Configuration Errors**: Validation failures, invalid settings
   - Throw immediately during initialization
   - Provide detailed error messages with correction suggestions
   - Include configuration path and expected values

2. **Network Errors**: Export failures, connectivity issues
   - Implement exponential backoff with jitter
   - Circuit breaker pattern for persistent failures
   - Fallback to local storage when possible

3. **Runtime Errors**: Unexpected exceptions during telemetry collection
   - Graceful degradation to no-op behavior
   - Error reporting to configured error handlers
   - Continue operation without affecting application

4. **Resource Errors**: Memory pressure, quota exceeded
   - Automatic throttling and backpressure
   - Resource cleanup and garbage collection
   - Performance monitoring and alerting

### Error Handling Pattern

```typescript
interface IErrorHandler {
  handleError(error: Error, context: IErrorContext): void;
}

interface IErrorContext {
  component: string;
  operation: string;
  telemetryType: 'trace' | 'log' | 'metric';
  recoverable: boolean;
  metadata?: Record<string, any>;
}

// Example implementation
class SDKErrorHandler implements IErrorHandler {
  private _errorCallbacks: ((error: Error, context: IErrorContext) => void)[] = [];
  private _circuitBreakers = new Map<string, ICircuitBreaker>();
  
  handleError(error: Error, context: IErrorContext): void {
    // Log error with context
    this._logger.error(`Error in ${context.component}.${context.operation}`, {
      error: error.message,
      stack: error.stack,
      context
    });
    
    // Update circuit breaker state
    const breaker = this._circuitBreakers.get(context.component);
    if (breaker && !context.recoverable) {
      breaker.recordFailure();
    }
    
    // Notify error callbacks
    this._errorCallbacks.forEach(callback => {
      try {
        callback(error, context);
      } catch (callbackError) {
        // Prevent callback errors from affecting SDK operation
        this._logger.warn("Error in error callback", callbackError);
      }
    });
  }
}
```

## Future-Proofing Strategies

The architecture is designed to adapt to evolving requirements and emerging standards:

### OpenTelemetry Specification Evolution

1. **Specification Tracking**: Automated monitoring of OpenTelemetry specification changes
2. **Feature Flags**: New features hidden behind feature flags for gradual rollout
3. **Version Compatibility**: Support for multiple OpenTelemetry specification versions
4. **Migration Tools**: Automated migration assistance for breaking changes
5. **Preview Features**: Early access to upcoming specification features

### Technology Evolution Preparedness

1. **Web Standards**: Ready for new browser APIs and web standards
2. **Framework Integration**: Pluggable architecture for new JavaScript frameworks
3. **Platform Expansion**: Design supports expansion to new platforms (IoT, mobile)
4. **Transport Protocols**: Extensible transport layer for new protocols
5. **Data Formats**: Support for emerging telemetry data formats

### Extensibility Architecture

```typescript
// Plugin architecture for future extensibility
interface ISDKPlugin {
  readonly name: string;
  readonly version: string;
  readonly dependencies?: string[];
  
  initialize(sdk: IOTelWebSdk): Promise<void>;
  shutdown(): Promise<void>;
  
  // Optional extension points
  onBeforeSpanStart?(span: ISpan): ISpan;
  onAfterSpanEnd?(span: ISpan): void;
  onBeforeLogEmit?(logRecord: ILogRecord): ILogRecord;
}

// Extension point registration
interface IExtensionRegistry {
  registerPlugin(plugin: ISDKPlugin): void;
  registerInstrumentation(instrumentation: IInstrumentation): void;
  registerExporter(type: TelemetryType, exporter: IExporter): void;
  registerProcessor(type: TelemetryType, processor: IProcessor): void;
  registerPropagator(propagator: IPropagator): void;
}
```

### Backward Compatibility Strategy

1. **Interface Versioning**: Semantic versioning for all public interfaces
2. **Deprecation Timeline**: 12-month deprecation period for breaking changes
3. **Migration Guides**: Comprehensive guides for version upgrades
4. **Compatibility Layers**: Adapters for legacy API compatibility
5. **Feature Detection**: Runtime feature detection for progressive enhancement

### Performance Future-Proofing

1. **WebAssembly Ready**: Architecture supports WebAssembly modules for performance-critical operations
2. **Web Workers**: Full support for Web Worker environments
3. **Streaming**: Prepared for streaming telemetry APIs
4. **Compression**: Pluggable compression algorithms for data export
5. **Caching**: Intelligent caching strategies for offline scenarios

### Security and Privacy Evolution

1. **Privacy Regulations**: Built-in support for emerging privacy regulations
2. **Data Minimization**: Configurable data collection minimization
3. **Encryption**: Support for client-side encryption of sensitive telemetry
4. **Audit Trails**: Comprehensive audit logging for compliance
5. **Data Governance**: Fine-grained control over data collection and export

## Processing Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          Dependency Injection Architecture                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ Configuration Layer                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │                           IOTelWebSdkConfig                                 │ │
│ │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │ │
│ │  │ Connection  │ │ Exporters   │ │ Processors  │ │ Resource    │           │ │
│ │  │ Config      │ │ Config      │ │ Config      │ │ Config      │           │ │
│ │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │ │
│ └─────────────────────────────────┬───────────────────────────────────────────┘ │
│                                   │                                             │
│ Factory Creation Layer            │                                             │
│ ┌─────────────────────────────────▼─────────────────────────────────────────┐   │
│ │                       createOTelWebSdk(config)                           │   │
│ │                                                                           │   │
│ │  Dependencies Validated & Injected:                                      │   │
│ │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │   │
│ │  │ ✓ Resource  │ │ ✓ Logger    │ │ ✓ Context   │ │ ✓ Clock     │         │   │
│ │  │   Required  │ │   Required  │ │   Manager   │ │   Injectable│         │   │
│ │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘         │   │
│ └─────────────────────────────────┬─────────────────────────────────────────┘   │
│                                   │                                             │
│ Provider Creation Layer           │                                             │
│ ┌─────────────────────────────────▼─────────────────────────────────────────┐   │
│ │                         Provider Factory Functions                       │   │
│ │  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────┐  │   │
│ │  │ createTraceProvider │  │ createLogProvider   │  │ createMeter      │  │   │
│ │  │ (traceConfig)       │  │ (logConfig)         │  │ Provider         │  │   │
│ │  │                     │  │                     │  │ (meterConfig)    │  │   │
│ │  │ Injects:            │  │ Injects:            │  │                  │  │   │
│ │  │ • Resource          │  │ • Resource          │  │ Injects:         │  │   │
│ │  │ • SpanProcessors    │  │ • LogProcessors     │  │ • Resource       │  │   │
│ │  │ • Sampler           │  │ • LogExporters      │  │ • MetricReaders  │  │   │
│ │  │ • IdGenerator       │  │ • Logger            │  │ • MetricExporter │  │   │
│ │  │ • ContextManager    │  │ • ContextManager    │  │ • Logger         │  │   │
│ │  │ • Logger            │  │ • Clock             │  │ • Clock          │  │   │
│ │  │ • Clock             │  │ • Performance       │  │ • Performance    │  │   │
│ │  └─────────────────────┘  └─────────────────────┘  └──────────────────┘  │   │
│ └─────────────────────────────────┬─────────────────────────────────────────┘   │
│                                   │                                             │
│ Implementation Layer              │                                             │
│ ┌─────────────────────────────────▼─────────────────────────────────────────┐   │
│ │                      DynamicProto + Closure Pattern                      │   │
│ │  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────┐  │   │
│ │  │ TraceProviderImpl   │  │ LogProviderImpl     │  │ MeterProviderImpl│  │   │
│ │  │                     │  │                     │  │                  │  │   │
│ │  │ Closure Variables:  │  │ Closure Variables:  │  │ Closure Variables│  │   │
│ │  │ let _resource;      │  │ let _resource;      │  │ let _resource;   │  │   │
│ │  │ let _processors;    │  │ let _processors;    │  │ let _readers;    │  │   │
│ │  │ let _sampler;       │  │ let _exporters;     │  │ let _exporters;  │  │   │
│ │  │ let _tracers;       │  │ let _loggers;       │  │ let _meters;     │  │   │
│ │  │ let _isShutdown;    │  │ let _isShutdown;    │  │ let _isShutdown; │  │   │
│ │  │                     │  │                     │  │                  │  │   │
│ │  │ All dependencies    │  │ All dependencies    │  │ All dependencies │  │   │
│ │  │ injected via        │  │ injected via        │  │ injected via     │  │   │
│ │  │ factory config      │  │ factory config      │  │ factory config   │  │   │
│ │  └─────────────────────┘  └─────────────────────┘  └──────────────────┘  │   │
│ └─────────────────────────────────┬─────────────────────────────────────────┘   │
│                                   │                                             │
│ Component Creation Layer          │                                             │
│ ┌─────────────────────────────────▼─────────────────────────────────────────┐   │
│ │                      Component Factory Functions                         │   │
│ │  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────┐  │   │
│ │  │ createTracer()      │  │ createLogger()      │  │ createMeter()    │  │   │
│ │  │                     │  │                     │  │                  │  │   │
│ │  │ Dependencies        │  │ Dependencies        │  │ Dependencies     │  │   │
│ │  │ from Provider:      │  │ from Provider:      │  │ from Provider:   │  │   │
│ │  │ • Resource          │  │ • Resource          │  │ • Resource       │  │   │
│ │  │ • Processors        │  │ • Processors        │  │ • Readers        │  │   │
│ │  │ • Sampler           │  │ • Exporters         │  │ • Exporters      │  │   │
│ │  │ • ContextManager    │  │ • ContextManager    │  │ • Clock          │  │   │
│ │  │ • Logger            │  │ • Logger            │  │ • Logger         │  │   │
│ │  └─────────────────────┘  └─────────────────────┘  └──────────────────┘  │   │
│ └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│ Benefits:                                                                   │
│ • No global state or singletons                                                │
│ • All dependencies explicit and testable                                       │
│ • Clean interfaces with dependency injection                                   │
│ • True isolation between SDK instances                                         │
│ • Enhanced performance through closures                                        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Processing Pipeline Architecture

Detailed view of how telemetry flows through the processing pipeline:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             Processing Pipeline Architecture                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ Telemetry Generation Layer                                                      │
│ ┌─────────────────────┐  ┌─────────────────────┐                               │
│ │      Traces         │  │        Logs         │                               │
│ │                     │  │                     │                               │
│ │ tracer.startSpan()  │  │ logger.info()       │                               │
│ │ span.setAttribute() │  │ logger.error()      │                               │
│ │ span.addEvent()     │  │ logger.debug()      │  │ gauge.set()         │       │
│ │ span.end()          │  │                     │  │                     │       │
│ └──────────┬──────────┘  └──────────┬──────────┘  └──────────┬──────────┘       │
│            │                        │                        │                  │
│            ▼                        ▼                                             │
│ ┌─────────────────────┐  ┌─────────────────────┐                                │
│ │   Span Creation     │  │  LogRecord Creation │                                │
│ │                     │  │                     │                                │
│ │ • Validate data     │  │ • Validate data     │                                │
│ │ • Apply resource    │  │ • Apply resource    │                                │
│ │ • Set timestamps    │  │ • Set timestamps    │                                │
│ │ • Generate IDs      │  │ • Set severity      │                                │
│ └──────────┬──────────┘  └──────────┬──────────┘                                │
│            │                        │                                          │
│            ▼                        ▼                                          │
│ ┌───────────────────────────────────────────────────────────────────────────┐   │
│ │                             Processor Layer                              │   │
│ │  ┌─────────────────┐  ┌─────────────────┐                                │   │
│ │  │ Span Processors │  │ Log Processors  │                                │   │
│ │  │                 │  │                 │                                │   │
│ │  │ SimpleProcessor │  │ SimpleProcessor │                                │   │
│ │  │ ├─onStart()      │  │ ├─onEmit()      │                                │   │
│ │  │ └─onEnd()        │  │ └─forceFlush()  │                                │   │
│ │  │                 │  │                 │                                │   │
│ │  │ BatchProcessor  │  │ BatchProcessor  │                                │   │
│ │  │ ├─buffer spans  │  │ ├─buffer logs   │                                │   │
│ │  │ ├─batch export  │  │ ├─batch export  │                                │   │
│ │  │ └─timer flush   │  │ └─timer flush   │                                │   │
│ │  │                 │  │                 │                                │   │
│ │  │ SamplingProc.   │  │ FilterProcessor │                                │   │
│ │  │ ├─sample decision│  │ ├─level filter  │                                │   │
│ │  │ └─drop/keep     │  │ └─attribute filt│                                │   │
│ │  │                 │  │                 │                                │   │
│ │  │ CustomProcessor │  │ EnrichProcessor │                                │   │
│ │  │ ├─transform      │  │ ├─add context   │                                │   │
│ │  │ └─custom logic  │  │ └─add metadata  │                                │   │
│ │  └─────────────────┘  └─────────────────┘                                │   │
│ └──────────────────────────────┬──────────────────────────────────────────────┘   │
│                                │                                                  │
│                                ▼                                                  │
│ ┌───────────────────────────────────────────────────────────────────────────┐   │
│ │                            Export Coordination                           │   │
│ │  ┌─────────────────┐  ┌─────────────────┐                                │   │
│ │  │ Span Export     │  │ Log Export      │                                │   │
│ │  │ Coordination    │  │ Coordination    │  │ Coordination            │    │   │
│ │  │                 │  │                 │  │                         │    │   │
│ │  │ • Batch sizes   │  │ • Batch sizes   │  │ • Collection intervals  │    │   │
│ │  │ • Export timing │  │ • Export timing │  │ • Export timing         │    │   │
│ │  │ • Retry logic   │  │ • Retry logic   │  │ • Retry logic           │    │   │
│ │  │ • Error handling│  │ • Error handling│                                │   │
│ │  │ • Backpressure  │  │ • Backpressure  │                                │   │
│ │  └─────────────────┘  └─────────────────┘                                │   │
│ └──────────────────────────────┬──────────────────────────────────────────────┘   │
│                                │                                                  │
│                                ▼                                                  │
│ ┌───────────────────────────────────────────────────────────────────────────┐   │
│ │                             Exporter Layer                               │   │
│ │  ┌─────────────────┐  ┌─────────────────┐                                │   │
│ │  │ Span Exporters  │  │ Log Exporters   │                                │   │
│ │  │                 │  │                 │                                │   │
│ │  │ AzureMonitor    │  │ AzureMonitor    │                                │   │
│ │  │ ├─format spans  │  │ ├─format logs   │                                │   │
│ │  │ ├─compress      │  │ ├─compress      │                                │   │
│ │  │ └─HTTP POST     │  │ └─HTTP POST     │                                │   │
│ │  │                 │  │                 │                                │   │
│ │  │ OTLP Exporter   │  │ OTLP Exporter   │                                │   │
│ │  │ ├─protobuf      │  │ ├─protobuf      │                                │   │
│ │  │ ├─gRPC/HTTP     │  │ ├─gRPC/HTTP     │                                │   │
│ │  │ └─standards     │  │ └─standards     │                                │   │
│ │  │                 │  │                 │                                │   │
│ │  │ Console Export  │  │ Console Export  │                                │   │
│ │  │ ├─debug output  │  │ ├─debug output  │                                │   │
│ │  │ └─development   │  │ └─development   │                                │   │
│ │  │                 │  │                 │                                │   │
│ │  │ Custom Export   │  │ Custom Export   │                                │   │
│ │  │ ├─extensible    │  │ ├─extensible    │                                │   │
│ │  │ └─pluggable     │  │ └─pluggable     │                                │   │
│ │  └─────────────────┘  └─────────────────┘                                │   │
│ └──────────────────────────────┬──────────────────────────────────────────────┘   │
│                                │                                                  │
│                                ▼                                                  │
│ ┌───────────────────────────────────────────────────────────────────────────┐   │
│ │                           Backend Systems                                │   │
│ │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐    │   │
│ │  │ Azure Monitor   │  │ OTLP Collectors │  │ Custom Backends         │    │   │
│ │  │ - Application   │  │ - OpenTelemetry │  │ - Prometheus            │    │   │
│ │  │   Insights      │  │   Collector     │  │ - Jaeger                │    │   │
│ │  │ - Log Analytics │  │ - Vendor        │  │ - Zipkin                │    │   │
│ │  │ - Metrics       │  │   Distributions │  │ - Splunk                │    │   │
│ │  │   Explorer      │  │ - Cloud Vendor  │  │ - Datadog               │    │   │
│ │  └─────────────────┘  └─────────────────┘  └─────────────────────────┘    │   │
│ └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Context Propagation Architecture

Shows how context flows through the application and across service boundaries:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Context Propagation Architecture                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ Application Execution Flow                                                      │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │                               Active Context                                │ │
│ │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │ │
│ │  │ Root Span   │  │ Child Span  │  │ Log Context │  │ Baggage     │         │ │
│ │  │             │  │             │  │             │  │             │         │ │
│ │  │ TraceID:    │  │ TraceID:    │  │ TraceID:    │  │ user.id:    │         │ │
│ │  │ abc123...   │  │ abc123...   │  │ abc123...   │  │ user123     │         │ │
│ │  │             │  │             │  │             │  │             │         │ │
│ │  │ SpanID:     │  │ SpanID:     │  │ SpanID:     │  │ session.id: │         │ │
│ │  │ def456...   │  │ ghi789...   │  │ ghi789...   │  │ sess456     │         │ │
│ │  │             │  │             │  │             │  │             │         │ │
│ │  │ ParentID:   │  │ ParentID:   │  │ TraceFlags: │  │ team.name:  │         │ │
│ │  │ (none)      │  │ def456...   │  │ sampled     │  │ frontend    │         │ │
│ │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘         │ │
│ └──────────────────────────┬────────────────────────────────────────────────┘ │
│                            │                                                    │
│ Local Context Management   │                                                    │
│ ┌──────────────────────────▼────────────────────────────────────────────────┐   │
│ │                     Context Manager                                       │   │
│ │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐    │   │
│ │  │ Context Storage │  │ Context Stack   │  │ Context Operations      │    │   │
│ │  │                 │  │                 │  │                         │    │   │
│ │  │ • Active        │  │ • Push Context  │  │ • context.with(ctx, fn) │    │   │
│ │  │   Context       │  │ • Pop Context   │  │ • context.active()      │    │   │
│ │  │ • Async         │  │ • Context Chain │  │ • context.setSpan()     │    │   │
│ │  │   Locals        │  │ • Parent Links  │  │ • context.getSpan()     │    │   │
│ │  │ • Thread        │  │ • Nested Scopes │  │ • context.setBaggage()  │    │   │
│ │  │   Storage       │  │                 │  │ • context.getBaggage()  │    │   │
│ │  └─────────────────┘  └─────────────────┘  └─────────────────────────┘    │   │
│ └──────────────────────────┬────────────────────────────────────────────────┘   │
│                            │                                                    │
│ Cross-Service Propagation  │                                                    │
│ ┌──────────────────────────▼────────────────────────────────────────────────┐   │
│ │                       Propagators                                        │   │
│ │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐    │   │
│ │  │ W3C TraceContext│  │ W3C Baggage     │  │ Custom Propagators      │    │   │
│ │  │                 │  │                 │  │                         │    │   │
│ │  │ Header:         │  │ Header:         │  │ • B3 (Zipkin)           │    │   │
│ │  │ traceparent     │  │ baggage         │  │ • Jaeger                │    │   │
│ │  │                 │  │                 │  │ • X-Ray                 │    │   │
│ │  │ Format:         │  │ Format:         │  │ • OpenTracing           │    │   │
│ │  │ 00-{traceId}-   │  │ key1=value1,    │  │ • Custom headers        │    │   │
│ │  │ {spanId}-{flag} │  │ key2=value2     │  │                         │    │   │
│ │  │                 │  │                 │  │ inject(context, carrier)│    │   │
│ │  │ Extract/Inject: │  │ Extract/Inject: │  │ extract(carrier) -> ctx │    │   │
│ │  │ HTTP headers    │  │ HTTP headers    │  │                         │    │   │
│ │  └─────────────────┘  └─────────────────┘  └─────────────────────────┘    │   │
│ └──────────────────────────┬────────────────────────────────────────────────┘   │
│                            │                                                    │
│ Outgoing Request Flow      │                                                    │
│ ┌──────────────────────────▼────────────────────────────────────────────────┐   │
│ │                      HTTP Request                                        │   │
│ │                                                                          │   │
│ │  Application Code                     HTTP Headers                       │   │
│ │  ┌─────────────────┐                 ┌─────────────────────────────┐     │   │
│ │  │ fetch('/api')   │────────────────▶│ traceparent:                │     │   │
│ │  │                 │                 │ 00-abc123...def456...01     │     │   │
│ │  │ Current Context:│                 │                             │     │   │
│ │  │ • TraceID       │                 │ baggage:                    │     │   │
│ │  │ • SpanID        │                 │ user.id=user123,            │     │   │
│ │  │ • Baggage       │                 │ session.id=sess456,         │     │   │
│ │  │                 │                 │ team.name=frontend          │     │   │
│ │  └─────────────────┘                 └─────────────────────────────┘     │   │
│ └──────────────────────────┬────────────────────────────────────────────────┘   │
│                            │                                                    │
│ Incoming Request Flow      │                                                    │
│ ┌──────────────────────────▼────────────────────────────────────────────────┐   │
│ │                      HTTP Response                                       │   │
│ │                                                                          │   │
│ │  Server Code                          HTTP Headers                       │   │
│ │  ┌─────────────────────────────┐     ┌─────────────────────────────┐     │   │
│ │  │ app.get('/api', (req) => {  │◀────│ traceparent:                │     │   │
│ │  │                             │     │ 00-abc123...def456...01     │     │   │
│ │  │   const context =           │     │                             │     │   │
│ │  │     propagation.extract(req)│     │ baggage:                    │     │   │
│ │  │                             │     │ user.id=user123,            │     │   │
│ │  │   const span = tracer       │     │ session.id=sess456,         │     │   │
│ │  │     .startSpan('handler',   │     │ team.name=frontend          │     │   │
│ │  │       { parent: context })  │     │                             │     │   │
│ │  │                             │     │                             │     │   │
│ │  │   // Extracted Context:     │     │                             │     │   │
│ │  │   // • Parent TraceID       │     │                             │     │   │
│ │  │   // • Parent SpanID        │     │                             │     │   │
│ │  │   // • Inherited Baggage    │     │                             │     │   │
│ │  │ })                          │     │                             │     │   │
│ │  └─────────────────────────────┘     └─────────────────────────────┘     │   │
│ └──────────────────────────┬────────────────────────────────────────────────┘   │
│                            │                                                    │
│ Async Operation Flow       │                                                    │
│ ┌──────────────────────────▼────────────────────────────────────────────────┐   │
│ │                     Async Context Continuity                             │   │
│ │  ┌───────────────────────────────────────────────────────────────────────┐  │   │
│ │  │  Promise Chain                                                        │  │   │
│ │  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐   │  │   │
│ │  │  │ Initial     │    │ Promise     │    │ Final                   │   │  │   │
│ │  │  │ Context     │───▶│ Context     │───▶│ Context                 │   │  │   │
│ │  │  │             │    │             │    │                         │   │  │   │
│ │  │  │ TraceID:    │    │ TraceID:    │    │ TraceID:                │   │  │   │
│ │  │  │ abc123...   │    │ abc123...   │    │ abc123...               │   │  │   │
│ │  │  │             │    │             │    │                         │   │  │   │
│ │  │  │ SpanID:     │    │ SpanID:     │    │ SpanID:                 │   │  │   │
│ │  │  │ original    │    │ promise     │    │ final                   │   │  │   │
│ │  │  └─────────────┘    └─────────────┘    └─────────────────────────┘   │  │   │
│ │  └───────────────────────────────────────────────────────────────────────┘  │   │
│ │                                                                            │   │
│ │  ┌───────────────────────────────────────────────────────────────────────┐  │   │
│ │  │  Event Loop / Callback Chain                                         │  │   │
│ │  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐   │  │   │
│ │  │  │ Callback 1  │    │ Callback 2  │    │ Callback N              │   │  │   │
│ │  │  │ Context     │───▶│ Context     │───▶│ Context                 │   │  │   │
│ │  │  │ Preserved   │    │ Preserved   │    │ Preserved               │   │  │   │
│ │  │  └─────────────┘    └─────────────┘    └─────────────────────────┘   │  │   │
│ │  └───────────────────────────────────────────────────────────────────────┘  │   │
│ └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│ Benefits:                                                                   │
│ • End-to-end traceability across services                                      │
│ • Automatic context inheritance in async operations                            │
│ • Standards-compliant propagation (W3C)                                        │
│ • Baggage for cross-cutting concerns                                           │
│ • Multiple propagator support for interoperability                            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Implementation Phases

The SDK implementation follows a structured 6-phase approach designed to deliver incremental value while building upon architectural foundations:

### Overview of Implementation Phases

1. **Phase 1: Core Architecture Foundation** - Interface design, factory functions, and development infrastructure
2. **Phase 2: Core Implementation** - Unified SDK implementation with IoC patterns and context management
3. **Phase 3: Tracer Provider Implementation** - Complete distributed tracing capabilities
4. **Phase 4: Logger Provider Implementation** - Structured logging with trace correlation
5. **Phase 5: Basic Metric Provider Implementation** - Simple metrics collection (counters, histograms, gauges)
6. **Phase 6: Exporters and Integrations** - Production-ready exporters and framework integrations

### Detailed Implementation Specifications

For comprehensive implementation planning including detailed technical tasks, milestones, and timeline, see:

**[OTelWebSdk-Implementation.md - Implementation Phases](./OTelWebSdk-Implementation.md#implementation-phases)**

The Implementation document provides:
- Detailed technical tasks and objectives for each phase
- Cross-references to architectural patterns and requirements defined in this document
- Specific interface requirements and implementation patterns
- Timeline and milestone planning
- Resource coordination and dependency management

## Next Steps and Implementation Roadmap

### Phase 1: Core Architecture Implementation
- Interface definitions and factory function framework
- Closure + DynamicProto pattern implementation
- **Inversion of Control implementation with dependency injection**
- Basic configuration and error handling
- Core SDK lifecycle management

### Phase 2: Telemetry Providers
- Trace provider with span management
- Log provider with structured logging
- Metric provider with instrument types
- Context propagation implementation

### Phase 3: Processing and Export
- Processor pipeline implementation
- Azure Monitor exporters
- OTLP exporters
- Performance optimization

### Phase 4: Advanced Features
- Auto-instrumentation implementation
- Framework-specific integrations
- Advanced sampling and filtering
- Monitoring and diagnostics

### Phase 5: Future-Proofing Features
- Plugin architecture implementation
- Extension registry system
- Migration tools and compatibility layers
- Performance monitoring and alerting

## Quality Assurance and Operations

### Testing Strategy
Comprehensive testing approach covering:
- **Unit Testing**: Component-level validation with Dynamic Proto patterns
- **Integration Testing**: Cross-component interaction verification
- **Performance Testing**: Benchmarking and regression detection
- **Browser Compatibility**: Cross-browser validation and fallback testing

For detailed testing strategies and implementation examples, see [Testing Strategy](./OTelWebSdk-Testing.md).

### Performance Optimization
Advanced performance techniques including:
- **Lazy Initialization**: Minimize startup impact
- **Object Pooling**: Efficient memory management
- **Batch Processing**: Optimized data export
- **Performance Monitoring**: Real-time performance tracking

For comprehensive performance strategies and optimization techniques, see [Performance Strategy](./OTelWebSdk-Performance.md).

### Migration Support
Support for migrating from existing telemetry solutions:
- **Application Insights Migration**: API mapping and compatibility layers
- **OpenTelemetry Community Migration**: Configuration and API conversion
- **Custom Telemetry Migration**: Generic migration framework
- **Data Continuity**: Validation and dual-tracking strategies

For detailed migration guides and tools, see [Migration Guide](./OTelWebSdk-Migration.md).

## Unified Architecture: Web-Specific Requirements + Multi-Instance SDK Factory

The OTelWebSdk combines unique web application requirements with a multi-instance SDK factory to deliver enterprise-grade observability. This unified approach addresses both the technical constraints of browser environments and the organizational needs of multi-team development.

### **Web-Specific Requirements Driving Multi-Instance SDK Factory Design**

The multi-instance SDK factory directly addresses the unique challenges of web applications:

#### **1. Browser Environment Optimizations**
- **Bundle Size Management**: Factory coordinates selective loading to minimize impact
  - Shared module loading across teams reduces redundant code
  - Tree-shaking optimization through centralized dependency management
  - Progressive loading of instrumentation based on actual team needs

- **Memory Management**: Factory prevents leaks through coordinated lifecycle management
  - Centralized cleanup coordination across all team instances
  - Shared object pools and resource reuse to minimize memory footprint
  - Automatic garbage collection triggering for long-running SPAs

- **Network Efficiency**: Factory optimizes telemetry transmission
  - Intelligent batching across team boundaries for fewer network calls
  - Shared connection pooling and keep-alive management
  - Coordinated retry logic and circuit breaker patterns

```typescript
// Factory optimizes resource usage across teams
const factory = createSdkFactory();

// Team A gets access to shared instrumentations automatically
const teamA = factory.newInst('team-a', {
  connectionString: 'InstrumentationKey=team-a-key',
  samplingRate: 100
});

// Team B also gets shared instrumentations + their own additions
const teamB = factory.newInst('team-b', {
  connectionString: 'InstrumentationKey=team-b-key',
  instrumentations: ['user-interaction'], // Team-specific instrumentations
  samplingRate: 50
});

// Factory coordinates: Single XHR/fetch/errors hooks shared across teams
// Each team gets isolated telemetry context while sharing infrastructure
```

#### **2. Rich Web Telemetry Through Factory Coordination**
- **Cross-Team Performance Correlation**: Factory enables holistic performance monitoring
  - Unified Core Web Vitals tracking across team components
  - Cross-team user journey tracking and session correlation
  - Global performance budgets and alerting across team boundaries

- **Shared Context Management**: Factory maintains consistent context across teams
  - User session state shared across team components
  - Device context and browser capabilities detected once, shared everywhere
  - Consistent correlation IDs and distributed tracing across team boundaries

```typescript
// Manager provides unified web telemetry context
const factory = createSdkFactory();

// Teams automatically get rich web context
const ecommerceSDK = factory.newInst('ecommerce', {
  contextOverrides: { 'team.domain': 'shopping' },
  // Global web context shared across all teams
  webVitalsTracking: true,
  userSessionManagement: true,
  globalPerformanceBudgets: {
    'core.web.vitals.lcp': 2500,
    'core.web.vitals.fid': 100
  }
});

// Automatic Core Web Vitals tracking with team context
ecommerceSDK.trackPageView({
  name: 'Product Listing',
  // Automatically includes shared web vitals + team context
});
```

### **Multi-Instance SDK Factory Goals**

The factory serves as the **primary entry point** for all SDK creation and lifecycle management, directly addressing web application needs:

#### **3. Centralized SDK Factory with Web Optimizations**
- **Smart Instance Creation**: Factory creates SDK instances with web-optimized configurations
  - Automatic platform detection (browser, web worker, SSR) and adaptation
  - Browser capability detection and graceful degradation
  - Optimal configuration inheritance based on environment constraints

- **Resource Efficiency**: Factory coordinates shared resources for minimal web impact
  - Single timer pool shared across all team instances
  - Shared network connections with optimal batching strategies
  - Coordinated instrumentation hooks to prevent duplicate event listeners

```typescript
// Manager automatically optimizes for web environment
const factory = createSdkFactory();

// Automatic platform detection and optimization
if (factory.platform === 'browser') {
  // Browser-specific optimizations automatically applied
  console.log('Web Vitals tracking enabled');
  console.log('User interaction monitoring active');
} else if (factory.platform === 'webworker') {
  // Web worker optimizations
  console.log('Limited DOM instrumentation for worker context');
}

// All team instances inherit optimal web configuration
const teamSDK = factory.newInst('analytics', {});
```

#### **4. Multi-Tenant Architecture for Enterprise Web Apps**
- **Shared Infrastructure**: Teams share web-optimized resources without conflicts
  - Single DOM modification coordinator to prevent team interference
  - Shared performance observers (Intersection, Performance, Mutation)
  - Consolidated error handling for unhandled exceptions and promise rejections

- **Configuration Inheritance**: Web-specific defaults with team customization
  - Enterprise-wide web performance standards and compliance settings
  - Team-specific sampling rates while maintaining global telemetry coherence
  - Consistent privacy and GDPR compliance across all team components

```typescript
// Enterprise-wide web standards with team flexibility
const factory = createSdkFactory();

// Team A - inherits enterprise standards + their own needs
const teamA = factory.newInst('frontend-team', {
  instrumentations: ['user-interaction'],
  // Enterprise web policy applied to all teams
  webStandards: {
    enableCoreWebVitals: true,
    privacyCompliance: 'GDPR',
    performanceBudgets: { lcp: 2500, fid: 100, cls: 0.1 },
    requiredInstrumentations: ['xhr', 'fetch', 'errors']
  },
  samplingRate: 100 // Higher sampling for critical team
});

// Team B - different needs, same enterprise compliance
const teamB = factory.newInst('widget-team', {
  samplingRate: 10, // Lower sampling for high-volume widgets
  excludeUrls: ['/internal/', '/admin/']
});
```

#### **5. Coordinated Web Telemetry Management**
- **Cross-Team Correlation**: Manager enables holistic web application monitoring
  - Unified user journey tracking across team boundaries
  - Cross-team performance impact analysis and attribution
  - Global web application health monitoring and alerting

- **Intelligent Export Coordination**: Manager optimizes telemetry transmission for web
  - Coordinated batching to minimize network impact on user experience
  - Adaptive sampling based on network conditions and battery status
  - Progressive Web App support with offline telemetry queuing

```typescript
// Manager enables cross-team web application insights
const factory = createSdkFactory();

// Configure global web telemetry coordination
// Teams automatically participate in coordinated telemetry
const checkoutTeam = factory.newInst('checkout', {
  crossTeamCorrelation: {
    enableUserJourneyTracking: true,
    enablePerformanceAttribution: true,
    enableGlobalErrorCorrelation: true
  },
  exportOptimization: {
    adaptiveToNetworkConditions: true,
    respectBatteryStatus: true,
    enableOfflineQueuing: true,
    maxBatchSize: 50 // Optimized for web transmission
  }
});
const paymentTeam = factory.newInst('payment', {});

// Manager automatically correlates user journey across teams
// checkout -> payment flow tracked holistically
```

#### **6. ⚙️ Dynamic Configuration with Web-Specific Adaptations**
- **Runtime Configuration Updates**: Manager supports hot configuration changes for web apps
  - Dynamic feature flag updates without application restart
  - A/B testing configuration changes with immediate effect
  - Performance budget adjustments based on real user monitoring data

- **Progressive Enhancement**: Manager adapts configuration based on browser capabilities
  - Feature detection and graceful fallback for unsupported ES2020+ runtimes
  - Progressive enhancement for modern browser APIs
  - Adaptive telemetry collection based on device capabilities

```typescript
// Dynamic web configuration management
const factory = createSdkFactory();

// Manager adapts to browser capabilities automatically
factory.onCapabilityChange((capabilities) => {
  if (capabilities.supportsPerformanceObserver) {
    // Enable advanced performance monitoring
    factory.updateConfig({
      enableAdvancedPerformanceTracking: true
    });
  }
  
  if (capabilities.hasServiceWorker) {
    // Enable offline telemetry capabilities
    factory.updateConfig({
      enableOfflineTelemetry: true
    });
  }
});

// Hot configuration updates for A/B testing
await factory.updateConfig({
  experimentalFeatures: {
    'new-user-interaction-tracking': true
  },
  samplingRateOverrides: {
    'experiment-group-a': 50,
    'experiment-group-b': 100
  }
});
```

#### **7. Complete Lifecycle Management with Web Cleanup**
- **Coordinated Unload**: Manager ensures complete cleanup across all team instances
  - DOM cleanup coordination to prevent memory leaks
  - Event listener removal across all team instrumentations
  - Service worker cleanup and cache management

- **Web-Specific Resource Management**: Manager handles browser-specific cleanup
  - Page visibility API integration for resource optimization
  - Beacon API usage for reliable telemetry transmission on unload
  - Progressive Web App state management

```typescript
// Comprehensive web lifecycle management
const factory = createSdkFactory();

// Page unload coordination
window.addEventListener('beforeunload', async (event) => {
  // Manager coordinates graceful shutdown across all teams
  await factory.unloadAllInstances();
  
  // Uses beacon API for final telemetry transmission
  factory.flushPendingTelemetry();
});

// Automatic cleanup on visibility change
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    factory.pauseNonCriticalTelemetry();
  } else {
    factory.resumeTelemetry();
  }
});
```

### **Application Insights SDK Requirements Integration**

The multi-instance SDK factory seamlessly integrates proven Application Insights requirements:

#### **8. Enterprise Multi-Team Architecture**
- **Team Isolation**: Independent SDK instances with isolated telemetry contexts
- **Shared Resource Efficiency**: Common infrastructure shared without conflicts
- **Enterprise Governance**: Centralized policy enforcement with team flexibility

#### **9. Web-Optimized Bundle Management**
- **Intelligent Loading**: Manager coordinates module loading to minimize bundle impact
- **Tree-Shaking Optimization**: Centralized dependency management for better elimination
- **Progressive Enhancement**: Feature detection and adaptive loading

#### **10. Universal Runtime Support with Web Focus**
- **Platform Adaptation**: Manager detects and adapts to runtime environment
- **SSR Compatibility**: Seamless server-side rendering with client-side hydration
- **Web Worker Support**: Full functionality in worker contexts

### **Benefits of Unified Architecture**

This combined approach delivers unique value:

1. **Web-Native Performance**: Manager coordination ensures minimal impact on web application performance
2. **Enterprise Scale**: Multi-team support without sacrificing individual team needs  
3. **Comprehensive Observability**: Rich web telemetry with cross-team correlation capabilities
4. **Migration Friendly**: Easy adoption path from existing Application Insights implementations
5. **Universal Compatibility**: Supports all JavaScript environments while optimizing for web

The multi-instance SDK factory transforms web-specific requirements from constraints into coordinated capabilities, enabling enterprise-scale observability that enhances rather than hinders web application performance.
