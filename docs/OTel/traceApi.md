# Trace API Reference

## Overview

The [`ITraceApi`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ITraceApi.html) interface provides the OpenTelemetry Trace API functionality for managing tracers and span contexts. It serves as the primary interface for creating tracers and working with span context utilities. This API closely follows the OpenTelemetry specification while integrating seamlessly with Application Insights.

## Table of Contents

- [Getting the Trace API](#getting-the-trace-api)
- [Interface Definition](#interface-definition)
- [Methods](#methods)
  - [getTracer](#gettracer)
  - [getActiveSpan](#getactivespan)
  - [setActiveSpan](#setactivespan)
  - [wrapSpanContext](#wrapspancontext)
  - [isSpanContextValid](#isspancontextvalid)
- [Tracer Interface](#tracer-interface)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

## Getting the Trace API

```typescript
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const appInsights = new ApplicationInsights({
    config: {
        connectionString: 'YOUR_CONNECTION_STRING'
    }
});
appInsights.loadAppInsights();

// Get the Trace API
const otelApi = appInsights.otelApi;
const trace = otelApi.trace;

// Or directly
const trace = appInsights.trace;
```

## Interface Definition

```typescript
export interface ITraceApi {
    /**
     * Returns a Tracer, creating one if one with the given name and version
     * if one has not already been created.
     */
    getTracer(name: string, version?: string, options?: IOTelTracerOptions): IOTelTracer;

    /**
     * Wrap the given IDistributedTraceContext in a new non-recording IReadableSpan
     */
    wrapSpanContext(spanContext: IDistributedTraceContext): IReadableSpan;

    /**
     * Returns true if this IDistributedTraceContext is valid.
     */
    isSpanContextValid(spanContext: IDistributedTraceContext): boolean;

    /**
     * Gets the span from the current context, if one exists.
     */
    getActiveSpan(): IReadableSpan | undefined | null;

    /**
     * Set or clear the current active span.
     */
    setActiveSpan(span: IReadableSpan | undefined | null): ISpanScope | undefined | null;
}
```

## Methods

### getTracer

Returns a tracer instance, creating one if necessary. Tracers are cached by name@version combination.

```typescript
getTracer(name: string, version?: string, options?: IOTelTracerOptions): IOTelTracer;
```

**Parameters:**
- `name: string` - The name of the tracer or instrumentation library (required)
- `version?: string` - The version of the tracer or instrumentation library (optional)
- `options?: IOTelTracerOptions` - Additional configuration options (optional)

**Returns:** [`IOTelTracer`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IOTelTracer.html) - A tracer instance for creating spans

**Caching Behavior:**
- Tracers are cached by `name@version` combination
- Multiple calls with same name/version return the same cached instance
- Different versions of the same name create separate tracers

**Example:**
```typescript
const trace = otelApi.trace;

// Get a tracer with just a name
const tracer1 = trace.getTracer('my-service');

// Get a tracer with name and version (optional)
const tracer2 = trace.getTracer('user-service', '2.1.0');

// Get a tracer with options
const tracer3 = trace.getTracer('payment-service', '1.5.0', {
    schemaUrl: 'https://example.com/schema/v1'
});

// Subsequent call returns cached instance
const tracer4 = trace.getTracer('user-service', '2.1.0');
console.log(tracer2 === tracer4); // true
```

### getActiveSpan

Gets the currently active span from the current context, if one exists.

```typescript
getActiveSpan(): IReadableSpan | undefined | null;
```

**Parameters:** None

**Returns:** 
- [`IReadableSpan`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IReadableSpan.html) - The currently active span
- `undefined | null` - If no span is currently active

**Example:**
```typescript
const trace = otelApi.trace;

// Check if there's an active span
const activeSpan = trace.getActiveSpan();
if (activeSpan) {
    console.log('Active span:', activeSpan.name);
    console.log('Trace ID:', activeSpan.spanContext().traceId);
    console.log('Span ID:', activeSpan.spanContext().spanId);
    
    // Add attributes to the active span
    activeSpan.setAttribute('additional.context', 'added to active span');
} else {
    console.log('No active span');
}
```

**Use Cases:**
- Check if code is executing within a span context
- Add attributes to the current span from deeply nested code
- Retrieve trace context for logging or propagation

### setActiveSpan

Sets a span as the active span in the current context, or clears the active span.

```typescript
setActiveSpan(span: IReadableSpan | undefined | null): ISpanScope | undefined | null;
```

**Parameters:**
- `span: IReadableSpan | undefined | null` - The span to set as active, or null/undefined to clear

**Returns:** 
- [`ISpanScope`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ISpanScope.html) - A scope object that can be used to restore the previous active span
- `undefined | null` - If there is no defined host

**Important:** Always restore the previous context by calling `scope.restore()` when done.

**Example:**
```typescript
const trace = otelApi.trace;
const tracer = trace.getTracer('my-service');

// Create a span
const span = tracer.startSpan('operation');

// Set it as active
const scope = trace.setActiveSpan(span);

try {
    // Span is now active - child spans will use it as parent
    const childSpan = tracer.startSpan('child-operation');
    childSpan?.end();
} finally {
    // Always restore previous context
    scope?.restore();
    span.end();
}

// Clear the active span
trace.setActiveSpan(null);
```

**Advanced Example with Nested Scopes:**
```typescript
const trace = otelApi.trace;
const tracer = trace.getTracer('my-service');

const span1 = tracer.startSpan('operation-1');
const scope1 = trace.setActiveSpan(span1);

try {
    // span1 is active
    const span2 = tracer.startSpan('operation-2');
    const scope2 = trace.setActiveSpan(span2);
    
    try {
        // span2 is active
        console.log('Active:', trace.getActiveSpan()?.name); // 'operation-2'
    } finally {
        scope2?.restore(); // Restore to span1
        span2.end();
    }
    
    console.log('Active:', trace.getActiveSpan()?.name); // 'operation-1'
} finally {
    scope1?.restore(); // Restore to previous (or no active span)
    span1.end();
}
```

### wrapSpanContext

Wraps a distributed trace context in a new non-recording span. This is useful for context propagation without creating telemetry.

```typescript
wrapSpanContext(spanContext: IDistributedTraceContext): IReadableSpan;
```

**Parameters:**
- `spanContext: IDistributedTraceContext` - The span context to wrap

**Returns:** [`IReadableSpan`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IReadableSpan.html) - A non-recording span with the provided context

**Key Characteristics:**
- Creates a span that doesn't record telemetry
- Preserves trace context (trace ID, span ID, trace flags)
- Useful for propagating existing trace context
- Can be used as parent for new spans

**Example:**
```typescript
const trace = otelApi.trace;

// Received trace context from external source (e.g., HTTP header)
const incomingContext = {
    traceId: '00000000000000000000000000000001',
    spanId: '0000000000000001',
    traceFlags: 1
};

// Wrap the context in a non-recording span
const wrappedSpan = trace.wrapSpanContext(incomingContext);

// Set as active to propagate context
const scope = trace.setActiveSpan(wrappedSpan);

try {
    // Create child spans that inherit the external trace context
    const tracer = trace.getTracer('my-service');
    const childSpan = tracer.startSpan('process-request');
    
    // childSpan will have the same traceId and wrappedSpan's spanId as parent
    console.log('Trace ID:', childSpan?.spanContext().traceId);
    
    childSpan?.end();
} finally {
    scope?.restore();
}
```

**Distributed Tracing Example:**
```typescript
// Service A: Extract context from span
const span = tracer.startSpan('api-call');
const traceContext = span.spanContext();

// Send to Service B (e.g., via HTTP headers)
const headers = {
    'traceparent': `00-${traceContext.traceId}-${traceContext.spanId}-01`
};

// Service B: Receive and wrap context
function handleIncomingRequest(headers: Record<string, string>) {
    // Parse traceparent header
    const traceContext = parseTraceparent(headers['traceparent']);
    
    // Wrap in a non-recording span
    const wrappedSpan = trace.wrapSpanContext(traceContext);
    
    // Use as parent for new spans
    const scope = trace.setActiveSpan(wrappedSpan);
    try {
        const childSpan = tracer.startSpan('process-request');
        // childSpan maintains the distributed trace
        childSpan?.end();
    } finally {
        scope?.restore();
    }
}
```

### isSpanContextValid

Validates whether a span context has valid trace ID and span ID.

```typescript
isSpanContextValid(spanContext: IDistributedTraceContext): boolean;
```

**Parameters:**
- `spanContext: IDistributedTraceContext` - The span context to validate

**Returns:** `boolean` - `true` if the context is valid, `false` otherwise

**Validation Rules:**
- Trace ID must be valid (non-zero, proper length)
- Span ID must be valid (non-zero, proper length)
- Both must exist

**Example:**
```typescript
const trace = otelApi.trace;

// Valid context
const validContext = {
    traceId: '00000000000000000000000000000001',
    spanId: '0000000000000001',
    traceFlags: 1
};

console.log(trace.isSpanContextValid(validContext)); // true

// Invalid context (zero trace ID)
const invalidContext = {
    traceId: '00000000000000000000000000000000',
    spanId: '0000000000000001',
    traceFlags: 1
};

console.log(trace.isSpanContextValid(invalidContext)); // false

// Practical usage
function propagateContext(context: IDistributedTraceContext) {
    if (trace.isSpanContextValid(context)) {
        const wrappedSpan = trace.wrapSpanContext(context);
        return trace.setActiveSpan(wrappedSpan);
    } else {
        console.warn('Invalid trace context, not propagating');
        return null;
    }
}
```

## Tracer Interface

The [`IOTelTracer`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IOTelTracer.html) interface returned by `getTracer()` provides methods for creating spans.

### IOTelTracer Methods

#### startSpan

Creates a new span without setting it as active.

```typescript
startSpan(name: string, options?: IOTelSpanOptions): IReadableSpan | null;
```

**Parameters:**
- `name: string` - The span name
- `options?: IOTelSpanOptions` - Configuration options

**Example:**
```typescript
const tracer = trace.getTracer('my-service');

const span = tracer.startSpan('database-query', {
    kind: OTelSpanKind.CLIENT,
    attributes: {
        'db.system': 'postgresql',
        'db.operation': 'SELECT'
    }
});

if (span) {
    // Use span
    span.setAttribute('db.table', 'users');
    // ... perform operation
    span.end();
}
```

#### startActiveSpan

Creates a span, sets it as active, and executes a callback function. **This is the recommended method for creating spans** as it provides automatic lifecycle and context management.

```typescript
startActiveSpan<F extends (span: IReadableSpan, scope?: ISpanScope<ITraceHost>) => ReturnType<F>>(
    name: string,
    fn: F
): ReturnType<F>;

startActiveSpan<F extends (span: IReadableSpan, scope?: ISpanScope<ITraceHost>) => ReturnType<F>>(
    name: string,
    options: IOTelSpanOptions,
    fn: F
): ReturnType<F>;
```

**Parameters:**
- `name: string` - The span name
- `options?: IOTelSpanOptions` - Configuration options (optional)
- `fn: (span: IReadableSpan) => any` - The callback function

**Returns:** The result of the callback function

**Key Features:**
- Automatically sets the span as active during callback execution
- Automatically ends the span when callback completes (including async)
- Properly restores previous active span context
- Handles errors and ensures cleanup

**Example:**
```typescript
const tracer = trace.getTracer('my-service');

// Simple form
const result = tracer.startActiveSpan('operation', (span) => {
    span.setAttribute('key', 'value');
    return processData();
    // Span automatically ended when function returns
});

// With options
const result2 = tracer.startActiveSpan('api-call', 
    { 
        kind: OTelSpanKind.CLIENT,
        attributes: { 'http.method': 'GET' }
    },
    async (span) => {
        const response = await fetch('/api/data');
        span.setAttribute('http.status_code', response.status);
        return response.json();
    }
);
```

**See [startActiveSpan documentation](./startActiveSpan.md) for comprehensive usage guide.**

## Usage Examples

### Example 1: Basic Tracer Usage

```typescript
const trace = otelApi.trace;

// Get a tracer
const tracer = trace.getTracer('user-service');

// Create a simple span
const span = tracer.startSpan('authenticate-user');
if (span) {
    span.setAttribute('user.id', '12345');
    
    try {
        // Perform authentication
        const user = await authenticateUser();
        span.setAttribute('auth.success', true);
        span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
        span.recordException(error);
        span.setStatus({ 
            code: SpanStatusCode.ERROR,
            message: error.message 
        });
    } finally {
        span.end();
    }
}
```

### Example 2: Multiple Tracers

```typescript
const trace = otelApi.trace;

// Create tracers for different services
const userTracer = trace.getTracer('user-service');
const paymentTracer = trace.getTracer('payment-service');
const notificationTracer = trace.getTracer('notification-service');

// Use appropriate tracer for each operation
function handleCheckout(userId: string, amount: number) {
    // User service operation
    const userSpan = userTracer.startSpan('validate-user');
    userSpan?.setAttribute('user.id', userId);
    userSpan?.end();
    
    // Payment service operation
    const paymentSpan = paymentTracer.startSpan('process-payment');
    paymentSpan?.setAttribute('payment.amount', amount);
    paymentSpan?.end();
    
    // Notification service operation
    const notifySpan = notificationTracer.startSpan('send-receipt');
    notifySpan?.setAttribute('notification.type', 'email');
    notifySpan?.end();
}
```

### Example 3: Active Span Management

```typescript
const trace = otelApi.trace;
const tracer = trace.getTracer('my-app');

// Create parent span
const parentSpan = tracer.startSpan('parent-operation');
const scope = trace.setActiveSpan(parentSpan);

try {
    // Child spans automatically use parent
    const child1 = tracer.startSpan('child-1');
    child1?.setAttribute('order', 1);
    child1?.end();
    
    const child2 = tracer.startSpan('child-2');
    child2?.setAttribute('order', 2);
    child2?.end();
    
    // Check active span
    const active = trace.getActiveSpan();
    console.log('Active span:', active?.name); // 'parent-operation'
    
} finally {
    scope?.restore();
    parentSpan?.end();
}
```

### Example 4: Context Propagation

```typescript
const trace = otelApi.trace;

// Extract context from current span
function getCurrentTraceContext(): IDistributedTraceContext | null {
    const activeSpan = trace.getActiveSpan();
    return activeSpan ? activeSpan.spanContext() : null;
}

// Propagate context to async operation
async function performAsyncWork(context: IDistributedTraceContext | null) {
    if (context && trace.isSpanContextValid(context)) {
        // Wrap and set as active
        const wrappedSpan = trace.wrapSpanContext(context);
        const scope = trace.setActiveSpan(wrappedSpan);
        
        try {
            // Create child span with inherited context
            const tracer = trace.getTracer('async-worker');
            const span = tracer.startSpan('async-operation');
            
            // Work maintains trace context
            await doAsyncWork();
            
            span?.end();
        } finally {
            scope?.restore();
        }
    }
}

// Usage
const context = getCurrentTraceContext();
setTimeout(() => performAsyncWork(context), 1000);
```

### Example 5: Using startActiveSpan

```typescript
const trace = otelApi.trace;
const tracer = trace.getTracer('my-service');

// Automatic span lifecycle management
async function processOrder(orderId: string) {
    return tracer.startActiveSpan('process-order', async (span) => {
        span.setAttribute('order.id', orderId);
        
        // All nested operations inherit this span context
        const items = await fetchOrderItems(orderId);
        span.setAttribute('order.items', items.length);
        
        const total = await calculateTotal(items);
        span.setAttribute('order.total', total);
        
        return { orderId, items, total };
        // Span automatically ended when function returns
    });
}

// Nested startActiveSpan calls
function nestedOperations() {
    return tracer.startActiveSpan('parent', (parentSpan) => {
        parentSpan.setAttribute('level', 1);
        
        return tracer.startActiveSpan('child', (childSpan) => {
            childSpan.setAttribute('level', 2);
            
            // childSpan automatically has parentSpan as parent
            console.log('Parent trace ID:', parentSpan.spanContext().traceId);
            console.log('Child trace ID:', childSpan.spanContext().traceId);
            // Both have the same trace ID
            
            return 'result';
        });
    });
}
```

### Example 6: Conditional Tracing

```typescript
const trace = otelApi.trace;
const tracer = trace.getTracer('my-service');

function conditionalTrace(operation: string, enabled: boolean) {
    if (!enabled) {
        // Perform operation without tracing
        return performOperation(operation);
    }
    
    // Trace the operation
    return tracer.startActiveSpan(operation, (span) => {
        span.setAttribute('traced', true);
        return performOperation(operation);
    });
}

// Check if currently being traced
function isCurrentlyTraced(): boolean {
    return trace.getActiveSpan() !== null;
}

// Conditionally add details
function addTraceDetails(key: string, value: any) {
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
        activeSpan.setAttribute(key, value);
    }
}

// Usage
addTraceDetails('user.action', 'clicked-button');
```

## Best Practices

### 1. Prefer Direct startSpan from AISKU

**Recommended approach for simple cases:**
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
const tracer = otelApi.trace.getTracer('user-service');
tracer.startActiveSpan('authenticate', (span) => {
    // ...
});
```

**Note:** For new code, prefer using `startActiveSpan` over manual `startSpan` + lifecycle management.

### 2. Cache Tracer Instances

```typescript
// Good - cache tracers
class UserService {
    private tracer = otelApi.trace.getTracer('user-service');
    
    async authenticate(userId: string) {
        return this.tracer.startActiveSpan('authenticate', async (span) => {
            span.setAttribute('user.id', userId);
            // ...
        });
    }
}

// Less efficient - create tracer each time
function authenticate(userId: string) {
    const tracer = otelApi.trace.getTracer('user-service');
    // ...
}
```

### 3. Always Restore Context

```typescript
// Good - always restore
const scope = trace.setActiveSpan(span);
try {
    // ... operations
} finally {
    scope?.restore();
    span.end();
}

// Bad - forgetting to restore can leak context
const scope = trace.setActiveSpan(span);
// ... operations
span.end(); // Forgot to restore!
```

### 4. Prefer startActiveSpan

```typescript
// Recommended - automatic lifecycle
tracer.startActiveSpan('operation', (span) => {
    span.setAttribute('key', 'value');
    return doWork();
});

// Manual - requires careful management
const span = tracer.startSpan('operation');
const scope = trace.setActiveSpan(span);
try {
    span.setAttribute('key', 'value');
    return doWork();
} finally {
    scope?.restore();
    span.end();
}
```

### 5. Validate External Context

```typescript
// Good - validate before using
function handleExternalContext(context: any) {
    if (trace.isSpanContextValid(context)) {
        const span = trace.wrapSpanContext(context);
        // Use span
    } else {
        console.warn('Invalid trace context received');
    }
}

// Bad - assume context is valid
function handleExternalContext(context: any) {
    const span = trace.wrapSpanContext(context); // May fail!
}
```

### 5. Use Meaningful Tracer Names

```typescript
// Good - descriptive names
const authTracer = trace.getTracer('auth-service');
const dbTracer = trace.getTracer('database-layer');
const apiTracer = trace.getTracer('api-client');

// Less useful - generic names
const tracer1 = trace.getTracer('tracer');
const tracer2 = trace.getTracer('app');
```

### 6. Check for Active Span Before Adding Attributes

```typescript
// Safe - check before using
function addContextInfo(key: string, value: any) {
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
        activeSpan.setAttribute(key, value);
    }
}

// Works but creates unnecessary span
function addContextInfo(key: string, value: any) {
    const span = tracer.startSpan('temp');
    span?.setAttribute(key, value);
    span?.end(); // Creates telemetry unnecessarily
}
```

## See Also

- [startActiveSpan Documentation](./startActiveSpan.md) - Comprehensive guide to the recommended span creation method
- [OTel API Documentation](./otelApi.md) - Main OpenTelemetry API interface
- [withSpan Helper](./withSpan.md) - Executing code with active span context
- [useSpan Helper](./useSpan.md) - Executing code with span scope parameter
- [Examples Guide](./examples.md) - Comprehensive usage examples
- [Main README](./README.md) - OpenTelemetry compatibility overview

## Related Interfaces

- [`ITraceApi`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ITraceApi.html) - Trace API interface
- [`IOTelTracer`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IOTelTracer.html) - Tracer interface for creating spans
- [`IReadableSpan`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IReadableSpan.html) - Span interface
- [`IOTelSpanOptions`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IOTelSpanOptions.html) - Options for span creation
- [`IDistributedTraceContext`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IDistributedTraceContext.html) - Distributed trace context
- [`ISpanScope`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ISpanScope.html) - Scope for restoring active span context
