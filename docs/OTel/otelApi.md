# OTel API Reference

## Overview

The [`IOTelApi`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IOTelApi.html) interface is the main entry point for OpenTelemetry functionality in the Application Insights JavaScript SDK. It provides access to tracers, the trace API, and configuration settings. This API closely follows the OpenTelemetry specification while integrating seamlessly with Application Insights.

## Table of Contents

- [Getting the OTel API](#getting-the-otel-api)
- [Interface Definition](#interface-definition)
- [Properties](#properties)
- [Creating an OTel API Instance](#creating-an-otel-api-instance)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

## Getting the OTel API

### From AISKU (Web SDK)

```typescript
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const appInsights = new ApplicationInsights({
    config: {
        connectionString: 'YOUR_CONNECTION_STRING'
    }
});
appInsights.loadAppInsights();

// Get the OpenTelemetry API
const otelApi = appInsights.otelApi;
```

**Note:** The `otelApi` and `trace` properties are only available on the AISKU (`appInsights`) instance, not on `AppInsightsCore`.

## Interface Definition

```typescript
export interface IOTelApi extends IOTelTracerProvider {
    /**
     * The configuration object that contains all OpenTelemetry-specific settings.
     */
    cfg: IOTelConfig;

    /**
     * The current ITraceHost instance for this IOTelApi instance.
     */
    host: ITraceHost;
    
    /**
     * The current ITraceApi instance for this IOTelApi instance.
     */
    trace: ITraceApi;
}
```

### Extended from [`IOTelTracerProvider`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IOTelTracerProvider.html)

Since [`IOTelApi`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IOTelApi.html) extends [`IOTelTracerProvider`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IOTelTracerProvider.html), it also provides:

```typescript
/**
 * Get a tracer for a specific instrumentation scope
 * @param name - The name of the tracer/instrumentation library
 * @param version - Optional version of the instrumentation library
 * @param options - Optional tracer configuration options
 * @returns A tracer instance
 */
getTracer(name: string, version?: string, options?: IOTelTracerOptions): IOTelTracer;
```

## Properties

### cfg: IOTelConfig

The configuration object containing all OpenTelemetry-specific settings.

**Type:** [`IOTelConfig`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IOTelConfig.html)

**Description:** Provides access to tracing configuration, error handlers, and other OpenTelemetry options. Changes to this configuration after initialization may not take effect until the next telemetry operation.

**Example:**
```typescript
const otelApi = appInsights.otelApi;

// Access trace configuration
if (otelApi.cfg.traceCfg) {
    console.log('Tracing enabled:', !otelApi.cfg.traceCfg.suppressTracing);
}

// Check for error handlers
if (otelApi.cfg.errorHandlers) {
    console.log('Custom error handlers configured');
}
```

### host: ITraceHost

The trace host instance that manages span lifecycle and active span context.

**Type:** [`ITraceHost`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ITraceHost.html)

**Description:** This is effectively the OpenTelemetry ContextAPI without the static methods. It provides methods for managing the active span context and creating spans.

**Key Methods:**
- `startSpan(name, options?, context?)` - Create a new span
- `getActiveSpan()` - Get the current active span
- `setActiveSpan(span)` - Set a span as the active span
- `getTraceCtx()` - Get the current trace context

`setActiveSpan` requires a non-null span (`IReadableSpan`); clearing the active span by passing `null` is not supported.

**Example:**
```typescript
const otelApi = appInsights.otelApi;

// Get the current active span
const activeSpan = otelApi.host.getActiveSpan();
if (activeSpan) {
    console.log('Active span:', activeSpan.name);
    console.log('Trace ID:', activeSpan.spanContext().traceId);
}

// Create a span directly via host
const span = otelApi.host.startSpan('operation-name', {
    kind: OTelSpanKind.INTERNAL,
    attributes: { 'custom.attribute': 'value' }
});
```

### trace: ITraceApi

The trace API providing utilities for tracer and span management.

**Type:** [`ITraceApi`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ITraceApi.html)

**Description:** Provides the OpenTelemetry TraceAPI interface without static methods. This is the recommended way to get tracers and manage span contexts.

**Key Methods:**
- `getTracer(name, version?, options?)` - Get or create a tracer
- `getActiveSpan()` - Get the current active span
- `setActiveSpan(span)` - Set the active span
- `wrapSpanContext(spanContext)` - Create a non-recording span from context
- `isSpanContextValid(spanContext)` - Validate a span context

**Example:**
```typescript
const otelApi = appInsights.otelApi;

// Get a tracer via trace API
const tracer = otelApi.trace.getTracer('my-service');

// Check for active span
const activeSpan = otelApi.trace.getActiveSpan();
if (activeSpan) {
    console.log('Current operation:', activeSpan.name);
}

// Validate a span context
const isValid = otelApi.trace.isSpanContextValid(spanContext);
```

## Creating an OTel API Instance

Typically, you don't create `IOTelApi` instances directly. They are created and managed by the Application Insights core. However, for advanced scenarios, you can use the `createOTelApi` function:

### createOTelApi Function

```typescript
function createOTelApi(otelApiCtx: IOTelApiCtx): IOTelApi;
```

**Parameters:**
- `otelApiCtx: IOTelApiCtx` - The context containing the host instance

**Returns:** A new [`IOTelApi`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IOTelApi.html) instance

**Example:**
```typescript
import { createOTelApi } from '@microsoft/applicationinsights-core-js';

// Advanced: Create a custom OTel API instance
const otelApiCtx = {
    host: appInsightsCore
};

const customOtelApi = createOTelApi(otelApiCtx);
```

### IOTelApiCtx Interface

```typescript
export interface IOTelApiCtx {
    /**
     * The host instance (AppInsightsCore) that provides tracing capabilities
     */
    host: ITraceHost;
}
```

## Usage Examples

### Example 1: Basic API Access

```typescript
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const appInsights = new ApplicationInsights({
    config: {
        connectionString: 'YOUR_CONNECTION_STRING',
        traceCfg: {
            suppressTracing: false
        }
    }
});
appInsights.loadAppInsights();

// Get the OTel API
const otelApi = appInsights.otelApi;

// Access different parts of the API
console.log('Has trace API:', !!otelApi.trace);
console.log('Has host:', !!otelApi.host);
console.log('Configuration available:', !!otelApi.cfg);
```

### Example 2: Getting Tracers

```typescript
const otelApi = appInsights.otelApi;

// Get a tracer directly from the API
const tracer1 = otelApi.getTracer('service-a');

// Or get it via the trace property (recommended)
const tracer2 = otelApi.trace.getTracer('service-b');

// Both approaches work and return cached instances
const tracer3 = otelApi.trace.getTracer('service-a');
console.log(tracer1 === tracer3); // true - same cached instance
```

### Example 3: Working with Active Spans

```typescript
const otelApi = appInsights.otelApi;
const tracer = otelApi.trace.getTracer('my-app');

// Create and set an active span
const span = tracer.startSpan('operation');
otelApi.trace.setActiveSpan(span);

// Later, get the active span
const activeSpan = otelApi.trace.getActiveSpan();
if (activeSpan) {
    activeSpan.setAttribute('additional.info', 'added later');
}

// Clear the active span
otelApi.trace.setActiveSpan(null);
span.end();
```

### Example 4: Span Context Utilities

```typescript
const otelApi = appInsights.otelApi;

// Check if a span context is valid
const spanContext = {
    traceId: '00000000000000000000000000000001',
    spanId: '0000000000000001',
    traceFlags: 1
};

if (otelApi.trace.isSpanContextValid(spanContext)) {
    // Wrap the context in a non-recording span
    const wrappedSpan = otelApi.trace.wrapSpanContext(spanContext);
    
    // Use the wrapped span (e.g., for context propagation)
    otelApi.trace.setActiveSpan(wrappedSpan);
    
    // ... perform operations that should have this context
    
    otelApi.trace.setActiveSpan(null);
}
```

### Example 5: Multiple Service Components

```typescript
const otelApi = appInsights.otelApi;

// Define different tracers for different parts of your application
const tracers = {
    userService: otelApi.trace.getTracer('user-service'),
    paymentService: otelApi.trace.getTracer('payment-service'),
    notificationService: otelApi.trace.getTracer('notification-service')
};

// Use the appropriate tracer for each operation
function authenticateUser(userId: string) {
    const span = tracers.userService.startSpan('authenticate');
    span.setAttribute('user.id', userId);
    // ... authentication logic
    span.end();
}

function processPayment(amount: number) {
    const span = tracers.paymentService.startSpan('process-payment');
    span.setAttribute('payment.amount', amount);
    // ... payment logic
    span.end();
}

function sendNotification(type: string) {
    const span = tracers.notificationService.startSpan('send-notification');
    span.setAttribute('notification.type', type);
    // ... notification logic
    span.end();
}
```

### Example 6: Accessing Configuration

```typescript
const otelApi = appInsights.otelApi;

// Check if tracing is enabled
function isTracingEnabled(): boolean {
    return otelApi.cfg?.traceCfg?.suppressTracing !== true;
}

// Conditionally create spans based on configuration
function createSpanIfEnabled(name: string): IReadableSpan | null {
    if (!isTracingEnabled()) {
        return null;
    }
    
    const tracer = otelApi.trace.getTracer('my-service');
    return tracer.startSpan(name);
}

// Use the conditional span creation
const span = createSpanIfEnabled('optional-trace');
if (span) {
    span.setAttribute('traced', true);
    // ... do work
    span.end();
}
```

### Example 7: Integration with Host Methods

```typescript
const otelApi = appInsights.otelApi;

// Use host methods directly for lower-level control
const span = otelApi.host.startSpan('low-level-operation', {
    kind: OTelSpanKind.INTERNAL,
    attributes: {
        'operation.type': 'direct-host-call'
    }
});

// Set it as active using the host
const scope = otelApi.host.setActiveSpan(span);

try {
    // Perform work with span active
    console.log('Current trace context:', otelApi.host.getTraceCtx());
    
    // Create child span (automatically uses active span as parent)
    const childSpan = otelApi.host.startSpan('child-operation');
    childSpan?.end();
    
} finally {
    // Restore previous context
    scope?.restore();
    span.end();
}
```

## Best Practices

### 1. Prefer Direct startSpan for Most Scenarios

**Recommended approach:**
```typescript
// Direct startSpan from AISKU - simplest for most use cases
appInsights.startSpan('operation-name', (span) => {
    span.setAttribute('key', 'value');
    // operation code
});
```

**Use getTracer for service organization:**
```typescript
// Only needed when organizing multiple services/components
const tracer = otelApi.trace.getTracer('my-service');
tracer.startActiveSpan('operation', (span) => {
    // ...
});
```

### 2. Use the Trace API for Tracer Access

**Recommended:**
```typescript
const tracer = otelApi.trace.getTracer('my-service');
```

**Also Valid:**
```typescript
const tracer = otelApi.getTracer('my-service');
```

Both work, but using `otelApi.trace.getTracer()` is more explicit and follows OpenTelemetry conventions.

### 3. Cache the OTel API Reference

```typescript
// Good - cache the reference
const otelApi = appInsights.otelApi;
const tracer = otelApi.trace.getTracer('my-service');

// Less efficient - repeated property access
appInsights.otelApi.trace.getTracer('my-service');
```

### 4. Check for Null/Undefined

While rare, always check for null when working with spans:

```typescript
const span = tracer.startSpan('operation');
if (span) {
    // Safe to use span
    span.setAttribute('key', 'value');
    span.end();
}
```

### 5. Organize Tracers by Service/Component

```typescript
// Good - clear organization
class UserService {
    private tracer = otelApi.trace.getTracer('user-service');
    
    authenticate(userId: string) {
        const span = this.tracer.startSpan('authenticate');
        // ...
    }
}

class PaymentService {
    private tracer = otelApi.trace.getTracer('payment-service');
    
    processPayment(amount: number) {
        const span = this.tracer.startSpan('process-payment');
        // ...
    }
}
```

### 5. Use Configuration Safely

```typescript
// Safe configuration access with fallbacks
function getTraceCfg(otelApi: IOTelApi): ITraceCfg | null {
    return otelApi?.cfg?.traceCfg || null;
}

// Check before using
const traceCfg = getTraceCfg(otelApi);
if (traceCfg && !traceCfg.suppressTracing) {
    // Create spans
}
```

### 6. Prefer Trace API Methods Over Direct Host Access

**Recommended:**
```typescript
const activeSpan = otelApi.trace.getActiveSpan();
otelApi.trace.setActiveSpan(span);
```

**Direct (lower level):**
```typescript
const activeSpan = otelApi.host.getActiveSpan();
otelApi.host.setActiveSpan(span);
```

The trace API methods provide better abstraction and follow OpenTelemetry conventions.

## See Also

- [Trace API Documentation](./traceApi.md) - Detailed tracer and span management
- [withSpan Helper](./withSpan.md) - Executing code with active span context
- [useSpan Helper](./useSpan.md) - Executing code with span scope parameter
- [Examples Guide](./examples.md) - Comprehensive usage examples
- [Main README](./README.md) - OpenTelemetry compatibility overview

## Related Interfaces

- [`IOTelConfig`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IOTelConfig.html) - OpenTelemetry configuration settings
- [`ITraceHost`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ITraceHost.html) - Host interface for span management
- [`ITraceApi`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ITraceApi.html) - Trace API interface
- [`IOTelTracer`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IOTelTracer.html) - Tracer interface for creating spans
- [`IOTelTracerProvider`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IOTelTracerProvider.html) - Provider interface for getting tracers
- [`IOTelTracerOptions`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IOTelTracerOptions.html) - Options for tracer creation
