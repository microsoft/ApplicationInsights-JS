# OpenTelemetry Tracing API in Application Insights JavaScript SDK

## Overview

The Application Insights JavaScript SDK provides an OpenTelemetry (OTel) compatible tracing API, allowing you to instrument your applications using familiar OpenTelemetry-like APIs for distributed tracing while automatically sending telemetry to Azure Application Insights. This implementation focuses on **tracing support only** (not metrics or logs) and bridges the gap between OpenTelemetry's vendor-neutral instrumentation patterns and Application Insights' powerful monitoring capabilities.

**Note:** This is an OpenTelemetry-compatible tracing API implementation, not a full OpenTelemetry SDK. It provides a Tracing API interface following OpenTelemetry conventions but does not include all span operations, metrics or logging APIs.

## What is OpenTelemetry?

OpenTelemetry is an open-source observability framework for cloud-native software. It provides a single set of APIs, libraries, and conventions for capturing distributed traces, metrics, and logs from your applications.

**Application Insights Implementation:** The Application Insights JavaScript SDK implements an OpenTelemetry like compatible tracing API. This means you can use familiar OpenTelemetry tracing patterns for distributed trace instrumentation. However, this is not a full OpenTelemetry SDK implementation - only the tracing API is supported (metrics and logs APIs are not included).

## Why Use the OpenTelemetry-compatible Tracing API?

- **Familiar API**: Use OpenTelemetry-like tracing APIs following industry-standard patterns
- **Tracing Standards**: Implement distributed tracing using OpenTelemetry conventions
- **Automatic Telemetry**: Spans automatically create Application Insights trace telemetry
- **Rich Context**: Full distributed tracing with parent-child span relationships
- **Service Identification**: Organize traces by service name and version
- **Type Safety**: Full TypeScript support with proper interfaces
- **Backward Compatibility**: Works alongside existing Application Insights code
- **Single SDK**: No need for separate OpenTelemetry packages for tracing

## Core Concepts

### 1. **OTel API** ([`IOTelApi`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IOTelApi.html))

The main entry point for OpenTelemetry functionality. Provides access to tracers and the trace API.

### 2. **Trace API** ([`ITraceApi`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ITraceApi.html))

Manages tracer instances and provides utilities for span context management.

### 3. **Tracer** ([`IOTelTracer`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IOTelTracer.html))

Creates and manages spans. Each tracer typically represents a specific component or service.

### 4. **Span** ([`IReadableSpan`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IReadableSpan.html))

Represents a unit of work in a distributed trace. Contains timing, attributes, and context information.

### 5. **Tracer Methods**

- **`startActiveSpan`**: Creates a span, sets it as active, executes a callback, and automatically ends the span (recommended)
- **`startSpan`**: Creates a new span without setting it as active (manual lifecycle management)
  - **Note:** Does NOT change the active span or modify the current traceId/spanId on IDistributedTraceContext
  - You must manually call `setActiveSpan()` if you want to change the active context

### 6. **Standalone Helper Functions**

- **`startActiveSpan`**: Creates a span, sets it as active, executes a callback, and automatically ends the span (recommended)
- **`withSpan`**: Executes code with a span as the active context
- **`useSpan`**: Similar to `withSpan` but provides the span scope as a parameter
- **`wrapSpanContext`**: Creates a non-recording span from a span context
- **`isSpanContextValid`**: Validates span context information

### 7. **Application Insights Functions** ([`ITraceHost`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ITraceHost.html))

Direct access to OpenTelemetry trace operations available on `appInsights` or `core` instances:
- **`startActiveSpan(name, options?, fn)`**: Create a span with automatic lifecycle management (recommended)
- **`startSpan(name, options?, parent?)`**: Create a new span with explicit parent control
  - **Note:** Does NOT change the active span or modify the current traceId/spanId on IDistributedTraceContext
- **`getActiveSpan(createNew?)`**: Get the currently active span
- **`setActiveSpan(span)`**: Set a span as the active span and manage context

These methods provide direct control over span lifecycle and context management as the main appInsights manages an
internal **Tracer** ([`IOTelTracer`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IOTelTracer.html)).

## Quick Start

### Installation

The OpenTelemetry-compatible tracing APIs are built into the Application Insights packages:

```bash
npm install @microsoft/applicationinsights-web
# or for core only (by default does not initialize any trace provider
# which means core.startSpan() will return null)
npm install @microsoft/applicationinsights-core-js
```

**No additional OpenTelemetry packages are required** for tracing. The tracing API is included in the core SDK.

### Basic Usage

```typescript
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

// Initialize Application Insights
const appInsights = new ApplicationInsights({
    config: {
        connectionString: 'YOUR_CONNECTION_STRING'
    }
});
appInsights.loadAppInsights();

// Get the OpenTelemetry API
const otelApi = appInsights.otelApi;

// Get a tracer for your service
const tracer = otelApi.trace.getTracer('my-service');

// Create a span
const span = tracer.startSpan('user-operation');
span.setAttribute('user.id', '12345');
span.setAttribute('operation.type', 'checkout');

try {
    // Perform your operation
    await processCheckout();
    span.setStatus({ code: SpanStatusCode.OK });
} catch (error) {
    span.setStatus({ 
        code: SpanStatusCode.ERROR,
        message: error.message 
    });
} finally {
    span.end(); // Always end the span
}
```

### Using `startActiveSpan` Helper (Recommended)

The `startActiveSpan` standalone helper function provides automatic context management:

```typescript
import { startActiveSpan } from '@microsoft/applicationinsights-core-js';

const result = await startActiveSpan(appInsights, 'process-payment', async (scope) => {
    scope.span.setAttribute('payment.method', 'credit_card');
    
    try {
        const response = await processPayment();
        scope.span.setAttribute('payment.status', 'success');
        return response;
    } catch (error) {
        scope.span.setStatus({ 
            code: SpanStatusCode.ERROR,
            message: error.message 
        });
        throw error;
    }
    // Span is automatically ended when function completes
});
```

### Using startSpan Directly on the SKU

The Application Insights SKU instance (`appInsights`) is itself a tracer, so you can call `startSpan` directly without obtaining a tracer first.

**Important:** `startSpan()` creates a span but does NOT set it as the active span. This means:
- The span will not automatically become the parent of subsequently created spans
- The current traceId/spanId on `IDistributedTraceContext` is NOT modified
- If you need the span to be active, use `startActiveSpan()` helper or manually call `setActiveSpan(span)`

```typescript
// Direct usage - creates span but does NOT set it as active
const span = appInsights.startSpan('quick-operation', {
    kind: OTelSpanKind.INTERNAL,
    attributes: {
        'user.id': '12345',
        'operation.type': 'data-fetch'
    }
});

if (span) {
    try {
        // Perform operation
        const data = await fetchData();
        span.setAttribute('items.count', data.length);
        span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
        span.setStatus({ 
            code: SpanStatusCode.ERROR,
            message: error.message 
        });
    } finally {
        span.end();
    }
}
```

**When to use direct `startSpan` vs obtaining a tracer:**
- **Use `appInsights.startSpan()` directly** (Recommended) - For most scenarios, provides simple and direct span creation
- **Use `appInsights.trace.getTracer('service-name')`** - Only when you need to organize spans by different services or components with specific names for better categorization

Both approaches create identical telemetry, but using the direct `startSpan` method is simpler and recommended for most applications.

## Documentation Structure

This folder contains comprehensive documentation on all OpenTelemetry features:

### Core API Documentation
- **[OTel API](./otelApi.md)** - Main OpenTelemetry API interface and creation
- **[Trace API](./traceApi.md)** - Tracer management and span utilities

### Helper Functions
- **[startActiveSpan](./startActiveSpan.md)** - Create spans with automatic lifecycle management (recommended)
- **[withSpan](./withSpan.md)** - Execute code with active span context
- **[useSpan](./useSpan.md)** - Execute code with span scope parameter

### Guides and Examples
- **[Examples](./examples.md)** - Comprehensive usage examples and patterns

## Key Features

### Automatic Telemetry Creation

When you end a span, Application Insights automatically:
- Creates trace telemetry with full context
- Includes all span attributes as custom properties
- Preserves parent-child relationships via trace/span IDs
- Calculates accurate timing and duration
- Recognizes Azure SDK attributes (including both legacy and current OpenTelemetry semantic conventions)

### Nested Spans

Create hierarchical traces with parent-child relationships:

```typescript
tracer.startActiveSpan('parent-operation', (parentSpan) => {
    parentSpan.setAttribute('step', 'starting');
    
    // Child spans automatically inherit parent context
    tracer.startActiveSpan('child-operation', (childSpan) => {
        childSpan.setAttribute('detail', 'processing');
        // Work here
    });
    
    parentSpan.setAttribute('step', 'completed');
});
```

### Distributed Tracing

Propagate trace context across service boundaries:

```typescript
// Service A: Create a span and extract context
const span = tracer.startSpan('api-call');
const traceContext = span.spanContext();

// Pass traceContext to Service B (e.g., via HTTP headers)
const headers = {
    'traceparent': `00-${traceContext.traceId}-${traceContext.spanId}-01`
};

// Service B: Create child span from propagated context
const childSpan = tracer.startSpan('process-request', {
    parent: traceContext
});
```

### Multiple Services/Components

Use different tracers for different parts of your application:

```typescript
const userServiceTracer = otelApi.trace.getTracer('user-service');
const paymentTracer = otelApi.trace.getTracer('payment-service');

// Each tracer can be used independently
const userSpan = userServiceTracer.startSpan('authenticate');
const paymentSpan = paymentTracer.startSpan('process-payment');
```

## Browser Compatibility

The OpenTelemetry implementation in Application Insights JavaScript SDK supports:

- Modern browsers (Chrome, Firefox, Safari, Edge) - ES5 target
- Internet Explorer 8+ (with ES5 polyfills)
- Mobile browsers (iOS Safari, Android Chrome)
- Non-browser runtimes (Node.js, Web Workers)

## Performance Considerations

The OpenTelemetry implementation is designed for minimal performance impact:

- **Lazy Initialization**: APIs are created only when accessed
- **Efficient Caching**: Tracers are cached and reused
- **Non-blocking**: Span operations don't block the browser UI
- **Minimal Allocations**: Optimized to reduce memory pressure
- **Tree-shakable**: Unused code can be eliminated by bundlers

## Migration Guide

### From OpenTelemetry SDK

If you're migrating from `@opentelemetry/api`:

1. Replace `@opentelemetry/api` tracing imports with Application Insights imports
2. Use `appInsights.otelApi` or `appInsights.trace` to access the tracing API
3. Most tracing API signatures are compatible
4. Telemetry automatically flows to Application Insights

**Important Limitations:**
- Only tracing APIs are supported (no metrics or logs APIs)
- This is an OpenTelemetry-compatible implementation, not the official OpenTelemetry SDK
- Some advanced OpenTelemetry features may not be available

### Multiple Ways to Create Spans

Application Insights provides several methods to create spans:

**Using Direct startSpan (Recommended):**
```typescript
const span = appInsights.startSpan('operation', options);
```

**Using Tracer API (for organizing by service):**
```typescript
const tracer = appInsights.trace.getTracer('my-service');
const span = tracer.startSpan('operation', options);
```

**Using startActiveSpan (for automatic context management):**
```typescript
appInsights.startActiveSpan('operation', (span) => {
    // Work with automatic context and lifecycle management
});
```

The direct `startSpan` method is recommended for most scenarios. Use tracers when you need to organize spans by service name.

## API Compatibility

This implementation provides an OpenTelemetry-compatible tracing API based on OpenTelemetry API v1.9.0 specifications:

- **Trace API v1.x** - Core tracing functionality (tracers, spans, context)
- **Context API v1.x** - Active span context management (via ITraceHost)
- **Span interface specifications** - Compatible span attributes, events, and status

**Scope:** Only tracing APIs are implemented. This is not a complete OpenTelemetry SDK - metrics and logs APIs are not included.

## Best Practices

1. **Use `startActiveSpan` for most scenarios** - Provides automatic lifecycle management
2. **Always end spans** - Either manually or via `startActiveSpan`
3. **Set span status** - Indicate success/failure explicitly with status codes
4. **Use descriptive names** - Span names should clearly identify operations
5. **Add relevant attributes** - Enrich spans with contextual information
6. **Use service-specific tracers** - Organize telemetry by service/component

## Common Patterns

### Error Handling

```typescript
const span = tracer.startSpan('risky-operation');
try {
    await performOperation();
    span.setStatus({ code: SpanStatusCode.OK });
} catch (error) {
    span.setStatus({ 
        code: SpanStatusCode.ERROR,
        message: error.message 
    });
    span.setAttribute('error', true);
    span.setAttribute('error.message', error.message);
    throw error;
} finally {
    span.end();
}
```

### Async Operations

```typescript
tracer.startActiveSpan('async-work', async (span) => {
    span.setAttribute('started', Date.now());
    
    const result = await doAsyncWork();
    
    span.setAttribute('completed', Date.now());
    return result;
});
```

### Background Tasks

```typescript
import { withSpan } from '@microsoft/applicationinsights-core-js';

const span = tracer.startSpan('background-task');
withSpan(appInsights.core, span, async () => {
    // All nested operations inherit this span context
    await processBackgroundWork();
});
span.end();
```

## Troubleshooting

### Spans Not Creating Telemetry

- Ensure spans are ended with `span.end()`
- Check that Application Insights is initialized
- Verify instrumentation key is correct

### Missing Parent-Child Relationships

- Use `startActiveSpan` or `withSpan`/`useSpan` helpers
- Ensure parent span is active when creating child spans
- Check that span contexts are properly propagated

### Performance Issues

- Don't create excessive spans in tight loops
- Use sampling if generating high volume of traces
- Consider span lifecycle and ensure spans are ended promptly

## Additional Resources

- [Application Insights Documentation](https://docs.microsoft.com/azure/azure-monitor/app/javascript)
- [OpenTelemetry Specification](https://opentelemetry.io/docs/specs/otel/)
- [Distributed Tracing Guide](../Dependency.md)
- [Performance Monitoring](../PerformanceMonitoring.md)

## Support and Feedback

For issues, questions, or feedback:
- [GitHub Issues](https://github.com/microsoft/ApplicationInsights-JS/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/azure-application-insights)

---
Learn about [startActiveSpan](./startActiveSpan.md) for the recommended way to create spans
- 
**Next Steps:**
- Read the [OTel API documentation](./otelApi.md) for detailed API reference
- Explore [comprehensive examples](./examples.md) for common scenarios
- Learn about [withSpan](./withSpan.md) and [useSpan](./useSpan.md) helpers
