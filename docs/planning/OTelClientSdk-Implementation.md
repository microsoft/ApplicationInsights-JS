# OTelClientSdk Implementation Plan

This document serves as the comprehensive implementation plan for the OTelClientSdk. This SDK provides a modern, modular implementation that follows the OpenTelemetry specification while avoiding global singletons and requiring explicit instance creation. The implementation leverages existing interfaces in the shared/OpenTelemetry/src folder and extends them to provide a complete OpenTelemetry solution.

## Implementation Plan Files

- [OTelClientSdk-Architecture.md](./OTelClientSdk-Architecture.md) - High-level architecture and design principles
- [OTelClientSdk-Core.md](./OTelClientSdk-Core.md) - Core SDK implementation with interfaces and factory functions
- [OTelClientSdk-Trace.md](./OTelClientSdk-Trace.md) - Trace provider implementation
- [OTelClientSdk-Log.md](./OTelClientSdk-Log.md) - Log provider implementation
- [OTelClientSdk-Metric.md](./OTelClientSdk-Metric.md) - Metric provider implementation
- [OTelClientSdk-Context.md](./OTelClientSdk-Context.md) - Context management implementation

## Implementation Phases

1. **Phase 1: Infrastructure Setup**
   - Define interfaces for all components based on OpenTelemetry specification
   - Integrate with existing interfaces in shared/OpenTelemetry/src
   - Create factory functions for component instantiation
   - Set up project structure including npm package configuration
   - Create build tools and test infrastructure

2. **Phase 2: Core Implementation**
   - Implement the unified OTelClientSdk class
   - Implement the context manager with explicit context handling
   - Set up configuration handling with dynamic configuration support
   - Implement resource management for telemetry source identification
   - Create common utilities for attribute handling and validation

3. **Phase 3: Trace Provider Implementation**
   - Implement trace provider and tracer interfaces
   - Implement span creation and management with proper context
   - Add sampling strategies including parent-based sampling
   - Implement span processors (simple and batch)
   - Create span exporters including Azure Monitor exporter
   - Implement W3C trace context propagation

4. **Phase 4: Log Provider Implementation**
   - Implement log provider and logger interfaces
   - Implement log record creation with severity levels
   - Add filtering capabilities based on severity and attributes
   - Implement log record processors (simple and batch)
   - Create log record exporters including Azure Monitor exporter
   - Add structured logging support

5. **Phase 5: Metric Provider Implementation**
   - Implement meter provider and meter interfaces
   - Implement metrics collection for various instrument types
   - Add aggregation support for different metric types
   - Implement views for customizing metrics collection
   - Create metric exporters including Azure Monitor exporter
   - Add exemplars support for metrics

6. **Phase 6: Exporters and Integrations**
   - Enhance Azure Monitor exporters with advanced features
   - Create browser-specific instrumentations (XHR, fetch, user interaction)
   - Add framework integrations (React, Angular, Vue)
   - Implement automatic instrumentation capabilities
   - Create compatibility layers for easier migration
   - Provide comprehensive examples and documentation

## Key Implementation Features

- **No Global Singletons**: The design avoids using global variables like context, api, trace, and log. All state is contained within explicitly created instances.
- **Explicit Instance Creation**: Users must explicitly create instances of all components, giving them full control over the lifecycle and configuration.
- **Full OTel Compliance**: Complete implementation of OpenTelemetry's trace, log, and metrics APIs following the official specification.
- **Modular Design**: Components can be selectively imported to minimize bundle size and only include what's needed.
- **Context Management**: Better control over context propagation with explicit context creation and management.
- **Extensibility**: Support for custom exporters, processors, and samplers to extend functionality.
- **Closures-Based Implementation**: Use closures instead of classes for internal implementations to improve performance and reduce bundle size.
- **DynamicProto-JS**: Use DynamicProto-JS for complex implementations to optimize performance while maintaining prototype inheritance benefits.
- **Factory Functions**: Use factory functions to create instances instead of exposing constructors directly.
- **Interface-First Design**: Define all public APIs as interfaces for better maintainability and type safety.
- **Tree-Shakable**: Support for tree-shaking to create minimal bundle sizes by only including used code.
- **Azure Monitor Integration**: Seamless integration with Azure Monitor through specialized exporters.

## Implementation Timeline

- **Month 1**: Phases 1 and 2
- **Month 2**: Phases 3 and 4
- **Month 3**: Phases 5 and 6

## Integration with Existing Interfaces

The OTelClientSdk implements and extends the interfaces from the shared/OpenTelemetry/src folder:

- **IOTelSdk**: Base interface extended by OTelClientSdk 
- **IOTelApi**: Extended to support explicit context management
- **IOTelTraceApi**: Implemented with non-global trace functionality
- **IOTelContextManager**: Extended with improved context propagation capabilities

## Core Components and Architecture

The OTelClientSdk consists of several core components working together to provide a complete observability solution:

### Main Client SDK

The `OTelClientSdk` class serves as the main entry point, providing access to all providers and functionality:

```typescript
export interface OTelClientConfig extends IOTelConfig {
  connectionString?: string;
  instrumentationKey?: string;
  endpoint?: string;
}

export class OTelClientSdk implements IOTelSdk {
  public readonly traceProvider: TraceProvider;
  public readonly loggerProvider: LoggerProvider;
  public readonly meterProvider: MeterProvider;
  public readonly contextManager: ContextManager;
  
  constructor(config: OTelClientConfig, resource?: Resource) {
    // Implementation
  }
  
  // Methods for shutdown, flush, etc.
}
```

### Provider Components

Each provider is responsible for a specific type of telemetry:

1. **TraceProvider**: Creates and manages tracers for distributed tracing
2. **LoggerProvider**: Creates and manages loggers for structured logging
3. **MeterProvider**: Creates and manages meters for metrics collection
4. **ContextManager**: Manages context propagation across the application

### Processing Pipeline

The SDK implements a processing pipeline for each telemetry type:

```
┌─────────────┐     ┌───────────────┐     ┌──────────────┐     ┌──────────────┐
│ Telemetry   │ ──> │ Processors    │ ──> │ Exporters    │ ──> │ Backend      │
│ Generation  │     │ (Batching,    │     │ (Protocol    │     │ Systems      │
│             │     │  Filtering)   │     │  Adapters)   │     │              │
└─────────────┘     └───────────────┘     └──────────────┘     └──────────────┘
```

## Detailed Design Principles

### 1. No Global Singletons

Unlike the standard OpenTelemetry API which relies on global singletons, this implementation requires explicit creation of all components:

```typescript
// No globals - everything is explicitly created
const sdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key-here'
});

// Get providers from the instance
const tracer = sdk.traceProvider.getTracer('my-component');
const logger = sdk.loggerProvider.getLogger('my-component');
```

### 2. Explicit Context Management

Context is explicitly managed without relying on global state:

```typescript
// Create a context
const ctx = createContext();

// Set active span in context
const newCtx = setSpan(ctx, span);

// Use context in operations
tracer.startActiveSpan('operation', {}, newCtx, (span) => {
  // Operation code
});
```

### 3. Modular Processing Pipeline

The SDK supports configurable processing pipelines:

```typescript
// Create exporters
const spanExporter = createAzureMonitorSpanExporter(config);

// Create processors
const spanProcessor = createBatchSpanProcessor(spanExporter, {
  maxQueueSize: 100,
  scheduledDelayMs: 5000
});

// Add processors to providers
sdk.traceProvider.addSpanProcessor(spanProcessor);
```

### 4. Framework Agnostic with Integrations

The core SDK is framework agnostic but provides integrations for popular frameworks:

```typescript
// Core SDK - works anywhere
const sdk = createOTelClientSdk(config);

// React integration
const TracingProvider = createReactTracingProvider(sdk);

// React component
<TracingProvider>
  <App />
</TracingProvider>
```

## Code Examples

### Basic SDK Initialization

```typescript
import { createOTelClientSdk, Resource } from '@microsoft/applicationinsights-otelclientsdk';

// Create resource information
const resource = new Resource({
  'service.name': 'my-service',
  'service.version': '1.0.0',
  'deployment.environment': 'production'
});

// Create the SDK with Azure Monitor integration
const sdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key-here',
  resource
});

// Application shutdown
window.addEventListener('unload', async () => {
  await sdk.shutdown();
});
```

### Using Tracing

```typescript
// Get a tracer
const tracer = sdk.traceProvider.getTracer('my-component');

// Create and manage spans
function performOperation() {
  const span = tracer.startSpan('my-operation');
  span.setAttribute('operation.type', 'database');
  
  try {
    // Your operation code here
    span.addEvent('operation.progress', { progress: '50%' });
    
    // Create a child span
    const childSpan = tracer.startSpan('child-operation', {
      parent: span
    });
    
    try {
      // Child operation code
    } finally {
      childSpan.end();
    }
    
    span.setStatus({ code: 'ok' });
  } catch (error) {
    span.recordException(error);
    span.setStatus({
      code: 'error',
      message: error.message
    });
  } finally {
    span.end();
  }
}
```

### Using Logging

```typescript
// Get a logger
const logger = sdk.loggerProvider.getLogger('my-component');

// Log with different severity levels
logger.emit({
  severityNumber: 9, // INFO
  severityText: 'INFO',
  body: 'Application started successfully'
});

// Structured logging
logger.emit({
  severityNumber: 17, // ERROR
  severityText: 'ERROR',
  body: {
    message: 'Operation failed',
    operation: {
      name: 'data-processing',
      id: '12345'
    },
    error: {
      code: 'ERR_TIMEOUT',
      detail: 'Database connection timed out'
    }
  }
});

// Linking log to span
function operationWithLogging(span) {
  logger.emit({
    severityText: 'INFO',
    body: 'Operation in progress',
    spanContext: span.spanContext()
  });
}
```

### Using Metrics

```typescript
// Get a meter
const meter = sdk.meterProvider.getMeter('my-component');

// Create a counter
const requestCounter = meter.createCounter('http.requests', {
  description: 'Number of HTTP requests',
  unit: '1'
});

// Record metrics
function recordRequest(route, statusCode) {
  requestCounter.add(1, {
    'http.route': route,
    'http.status_code': statusCode
  });
}

// Create a histogram
const requestDuration = meter.createHistogram('http.request.duration', {
  description: 'HTTP request duration',
  unit: 'ms'
});

// Record durations
function trackRequestDuration(route, durationMs) {
  requestDuration.record(durationMs, {
    'http.route': route
  });
}
```

### Context Propagation

```typescript
// Manual context propagation
function outgoingRequest(url, headers, currentSpan) {
  const ctx = sdk.contextManager.active();
  const ctxWithSpan = sdk.contextManager.setSpan(ctx, currentSpan);
  
  // Inject context into headers
  sdk.propagator.inject(ctxWithSpan, headers, (carrier, key, value) => {
    carrier[key] = value;
  });
  
  // Make request with headers...
}

// Extract context from incoming request
function handleRequest(req) {
  const ctx = sdk.contextManager.active();
  
  // Extract context from request headers
  const extractedCtx = sdk.propagator.extract(ctx, req.headers, (carrier, key) => {
    return carrier[key];
  });
  
  // Use the extracted context
  const span = tracer.startSpan('handle-request', {}, extractedCtx);
  // Process request...
}
```

## Comparison with Standard OpenTelemetry

The OTelClientSdk differs from the standard OpenTelemetry JavaScript SDK in several important ways:

| Feature | Standard OpenTelemetry SDK | OTelClientSdk |
|---------|----------------------------|-----------------------------------|
| Global Access | Uses global singletons for API access | No globals - explicit instance creation |
| Instance Creation | Implicit through global registry | Explicit through factory functions |
| Context Management | Implicitly uses ambient context | Explicit context passing and management |
| Framework Integration | Limited built-in framework support | Rich framework integrations |
| Initialization | Multiple separate initialization points | Unified SDK initialization |
| Bundle Size | Larger baseline bundle | Tree-shakable with smaller bundles |
| Azure Monitor | Requires custom exporters | First-class Azure Monitor support |
| Implementation | Class-based | Closure-based with DynamicProto-JS |

## Migration Guide

### From Standard OpenTelemetry SDK

```typescript
// Standard OpenTelemetry
import * as api from '@opentelemetry/api';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { Resource } from '@opentelemetry/resources';

const provider = new WebTracerProvider({
  resource: new Resource({
    'service.name': 'my-service'
  })
});

provider.register();
const tracer = api.trace.getTracer('my-component');
```

```typescript
// OTelClientSdk
import { createOTelClientSdk, Resource } from '@microsoft/applicationinsights-otelclientsdk';

const sdk = createOTelClientSdk({
  resource: new Resource({
    'service.name': 'my-service'
  })
});

const tracer = sdk.traceProvider.getTracer('my-component');
```

### From ApplicationInsights JS SDK

```typescript
// Classic ApplicationInsights
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const appInsights = new ApplicationInsights({
  config: {
    instrumentationKey: 'your-key',
    enableAutoRouteTracking: true
  }
});
appInsights.loadAppInsights();
appInsights.trackEvent({name: 'UserLogin'});
```

```typescript
// OTelClientSdk
import { createOTelClientSdk } from '@microsoft/applicationinsights-otelclientsdk';

const sdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key'
});

// Enable auto instrumentation
enableBrowserInstrumentation(sdk);

// Track custom events
const logger = sdk.loggerProvider.getLogger('events');
logger.emit({
  severityText: 'INFO',
  body: 'UserLogin'
});
```

## Next Steps

1. Define detailed interface specifications for each component
2. Implement core SDK functionality
3. Create proof-of-concept implementations for key scenarios
4. Establish test framework and benchmarks
5. Implement integration with Azure Monitor backends
