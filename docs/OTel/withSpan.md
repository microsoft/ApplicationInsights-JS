# withSpan Helper Function

## Overview

The `withSpan` helper function provides a convenient way to execute code within the context of an active span. It automatically manages span activation and restoration, ensuring that the previous active span context is properly restored after execution completes, even if an error occurs.

## Table of Contents

- [Function Signature](#function-signature)
- [Parameters](#parameters)
- [Return Value](#return-value)
- [Key Features](#key-features)
- [Usage Examples](#usage-examples)
- [Comparison with useSpan](#comparison-with-usespan)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Error Handling](#error-handling)

## Function Signature

```typescript
function withSpan<T extends ITraceHost, A extends unknown[], F extends (this: ThisParameterType<F> | ISpanScope<T>, ...args: A) => ReturnType<F>>(
    traceHost: T,
    span: IReadableSpan,
    fn: F,
    thisArg?: ThisParameterType<F>,
    ..._args: A
): ReturnType<F>;
```

## Parameters

### traceHost: ITraceHost

The trace host instance that manages span contexts. Typically, this is your `AppInsightsCore` instance or the AISKU instance.

**Type:** [`ITraceHost`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ITraceHost.html)

**Example:**
```typescript
const core = new AppInsightsCore();
// or
const appInsights = new ApplicationInsights({ ... });
```

### span: IReadableSpan

The span to set as the active span during the execution of the callback function.

**Type:** [`IReadableSpan`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IReadableSpan.html)

**Example:**
```typescript
const tracer = otelApi.trace.getTracer('my-service');
const span = tracer.startSpan('operation-name');
```

### fn: Function

The callback function to execute with the span as the active context. The function receives any additional arguments passed to `withSpan`.

**Signature:**
```typescript
(this: ThisParameterType<F> | ISpanScope<T>, ...args: A) => ReturnType<F>
```

### thisArg?: any (optional)

The `this` context for the callback function. If not provided, the [`ISpanScope`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ISpanScope.html) instance is used as `this`.

### ..._args: any[] (optional)

Additional arguments to pass to the callback function.

## Return Value

Returns the result of executing the callback function. The return type matches the callback function's return type.

**For synchronous functions:**
```typescript
const result: number = withSpan(core, span, () => {
    return 42;
});
```

**For asynchronous functions:**
```typescript
const result: Promise<string> = withSpan(core, span, async () => {
    return await fetchData();
});
```

## Key Features

### 1. Automatic Span Context Management

Sets the span as active during execution and restores the previous active span afterward.

```typescript
withSpan(core, span, () => {
    // span is active here
    console.log(core.getActiveSpan() === span); // true
});
// Previous active span is restored here
```

### 2. Context Restoration

Ensures the previous active span is restored even if the callback throws an error.

```typescript
const previousSpan = core.getActiveSpan();

try {
    withSpan(core, span, () => {
        throw new Error('Something went wrong');
    });
} catch (error) {
    // Previous span is still restored
    console.log(core.getActiveSpan() === previousSpan); // true
}
```

### 3. Exception Safety

Uses try-finally blocks internally to guarantee context restoration.

### 4. Async Support

Automatically handles both synchronous and asynchronous callbacks, including Promise-based functions.

```typescript
// Async callback
await withSpan(core, span, async () => {
    await doAsyncWork();
    // Context restored after promise settles
});
```

### 5. Nested Span Support

Handles complex span hierarchies automatically through proper context stacking.

```typescript
withSpan(core, parentSpan, () => {
    // parentSpan is active
    
    withSpan(core, childSpan, () => {
        // childSpan is active
    });
    
    // parentSpan is active again
});
```

## Usage Examples

### Example 1: Basic Usage

```typescript
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { withSpan } from '@microsoft/applicationinsights-core-js';

const appInsights = new ApplicationInsights({
    config: {
        connectionString: 'YOUR_CONNECTION_STRING'
    }
});
appInsights.loadAppInsights();

const tracer = appInsights.trace.getTracer('my-service');

// Create a span
const span = tracer.startSpan('operation');

// Execute code with span as active context
const result = withSpan(appInsights, span, () => {
    span.setAttribute('step', 'processing');
    
    // Perform work - span is active during execution
    const data = processData();
    
    span.setAttribute('result', 'success');
    return data;
});

span.end();
```

### Example 2: Async Operations

```typescript
const span = tracer.startSpan('async-operation');

const result = await withSpan(appInsights, span, async () => {
    span.setAttribute('started', Date.now());
    
    // Async work
    const response = await fetch('/api/data');
    const data = await response.json();
    
    span.setAttribute('completed', Date.now());
    span.setAttribute('items', data.length);
    
    return data;
});

span.end();
console.log('Result:', result);
```

### Example 3: Nested Spans

```typescript
const parentSpan = tracer.startSpan('parent-operation');

withSpan(core, parentSpan, () => {
    parentSpan.setAttribute('level', 1);
    
    // Create child span
    const childSpan = tracer.startSpan('child-operation');
    
    withSpan(core, childSpan, () => {
        childSpan.setAttribute('level', 2);
        
        // childSpan automatically has parentSpan as parent
        console.log('Parent ID:', parentSpan.spanContext().spanId);
        console.log('Child parent ID:', childSpan.spanContext().spanId);
    });
    
    childSpan.end();
});

parentSpan.end();
```

### Example 4: Passing Additional Arguments

```typescript
function processWithContext(userId: string, action: string): string {
    return `User ${userId} performed ${action}`;
}

const span = tracer.startSpan('user-action');

// Pass additional arguments to callback
const result = withSpan(
    core,
    span,
    processWithContext,
    null, // thisArg
    'user123', // userId
    'checkout' // action
);

span.end();
console.log(result); // 'User user123 performed checkout'
```

### Example 5: Custom This Context

```typescript
class UserService {
    private userId: string;
    
    constructor(userId: string) {
        this.userId = userId;
    }
    
    process(): string {
        return `Processing for user ${this.userId}`;
    }
}

const service = new UserService('user123');
const span = tracer.startSpan('service-operation');

// Preserve 'this' context
const result = withSpan(
    core,
    span,
    service.process,
    service // Use service as 'this'
);

span.end();
console.log(result); // 'Processing for user user123'
```

### Example 6: Error Handling

```typescript
const span = tracer.startSpan('risky-operation');

try {
    withSpan(core, span, () => {
        span.setAttribute('attempting', true);
        
        // Operation that might throw
        const result = performRiskyOperation();
        
        span.setStatus({ code: SpanStatusCode.OK });
        span.setAttribute('success', true);
        
        return result;
    });
} catch (error) {
    span.recordException(error);
    span.setStatus({ 
        code: SpanStatusCode.ERROR,
        message: error.message 
    });
    span.setAttribute('success', false);
} finally {
    span.end(); // Always end the span
}
```

### Example 7: Multiple Nested Operations

```typescript
const operationSpan = tracer.startSpan('complete-checkout');

withSpan(core, operationSpan, async () => {
    operationSpan.setAttribute('step', 'starting');
    
    // Validate user
    const validateSpan = tracer.startSpan('validate-user');
    await withSpan(core, validateSpan, async () => {
        validateSpan.setAttribute('user.id', '12345');
        await validateUser();
    });
    validateSpan.end();
    
    // Process payment
    const paymentSpan = tracer.startSpan('process-payment');
    await withSpan(core, paymentSpan, async () => {
        paymentSpan.setAttribute('amount', 99.99);
        await processPayment();
    });
    paymentSpan.end();
    
    // Send confirmation
    const confirmSpan = tracer.startSpan('send-confirmation');
    await withSpan(core, confirmSpan, async () => {
        confirmSpan.setAttribute('notification.type', 'email');
        await sendConfirmation();
    });
    confirmSpan.end();
    
    operationSpan.setAttribute('step', 'completed');
});

operationSpan.end();
```

### Example 8: Background Task

```typescript
const span = tracer.startSpan('background-task');

// Execute background work with trace context
withSpan(core, span, async () => {
    span.setAttribute('task.type', 'data-sync');
    span.setAttribute('started', new Date().toISOString());
    
    // All operations here inherit span context
    await syncDataToDatabase();
    
    span.setAttribute('completed', new Date().toISOString());
});

span.end();
```

### Example 9: Conditional Execution

```typescript
function executeWithTracing(operation: () => void, shouldTrace: boolean) {
    if (!shouldTrace) {
        // Execute without tracing
        return operation();
    }
    
    // Execute with tracing
    const span = tracer.startSpan('conditional-operation');
    try {
        return withSpan(core, span, operation);
    } finally {
        span.end();
    }
}

// Usage
executeWithTracing(() => {
    console.log('This is traced');
}, true);

executeWithTracing(() => {
    console.log('This is not traced');
}, false);
```

### Example 10: Integration with Existing Code

```typescript
// Existing function without tracing
async function fetchUserData(userId: string) {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
}

// Add tracing without modifying the function
async function fetchUserDataWithTracing(userId: string) {
    const span = tracer.startSpan('fetch-user-data');
    span.setAttribute('user.id', userId);
    
    try {
        const result = await withSpan(core, span, () => {
            return fetchUserData(userId);
        });
        
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
    } catch (error) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
    } finally {
        span.end();
    }
}
```

## Comparison with useSpan

`withSpan` and `useSpan` are similar but differ in how they pass parameters to the callback function.

### withSpan

Passes additional arguments directly to the callback:

```typescript
withSpan(core, span, (arg1, arg2) => {
    // arg1 and arg2 are your custom arguments
    console.log(arg1, arg2);
}, null, 'value1', 'value2');
```

### useSpan

Passes the `ISpanScope` as the first argument:

```typescript
useSpan(core, span, (scope, arg1, arg2) => {
    // scope is the ISpanScope
    // arg1 and arg2 are your custom arguments
    console.log(scope, arg1, arg2);
}, null, 'value1', 'value2');
```

**When to use which:**
- **`withSpan`**: When you don't need access to the span scope object
- **`useSpan`**: When you need to manually restore context or access scope properties

See the [useSpan documentation](./useSpan.md) for more details.

## Best Practices

### 1. Always End Spans

```typescript
// Good - span is ended
const span = tracer.startSpan('operation');
try {
    withSpan(core, span, () => {
        // Work
    });
} finally {
    span.end();
}

// Bad - span is never ended
const span = tracer.startSpan('operation');
withSpan(core, span, () => {
    // Work
}); // Forgot to end span!
```

### 2. Use with startSpan, Not startActiveSpan

```typescript
// Good - use withSpan with startSpan
const span = tracer.startSpan('operation');
withSpan(core, span, () => {
    // Work
});
span.end();

// Redundant - startActiveSpan already manages context
tracer.startActiveSpan('operation', (span) => {
    // No need for withSpan here
});
```

### 3. Handle Errors Appropriately

```typescript
const span = tracer.startSpan('operation');
try {
    withSpan(core, span, () => {
        // Work that might throw
        throw new Error('Failed');
    });
} catch (error) {
    // Record exception
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR });
} finally {
    span.end();
}
```

### 4. Don't Nest withSpan Unnecessarily

```typescript
// Good - each span with its own withSpan
const span1 = tracer.startSpan('operation-1');
withSpan(core, span1, () => {
    // Work
});
span1.end();

const span2 = tracer.startSpan('operation-2');
withSpan(core, span2, () => {
    // Work
});
span2.end();

// Less ideal - unnecessary nesting
withSpan(core, span1, () => {
    withSpan(core, span1, () => { // Redundant
        // Work
    });
});
```

### 5. Combine with Async/Await

```typescript
// Good - natural async/await usage
const span = tracer.startSpan('async-op');
try {
    const result = await withSpan(core, span, async () => {
        return await doAsyncWork();
    });
    span.setStatus({ code: SpanStatusCode.OK });
} finally {
    span.end();
}
```

## Common Patterns

### Pattern 1: Wrapper Functions

```typescript
function withTracing<T>(
    operationName: string,
    fn: () => T
): T {
    const span = tracer.startSpan(operationName);
    try {
        return withSpan(core, span, fn);
    } finally {
        span.end();
    }
}

// Usage
const result = withTracing('my-operation', () => {
    return performWork();
});
```

### Pattern 2: Decorator Pattern

```typescript
function traced(operationName: string) {
    return function(
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const original = descriptor.value;
        
        descriptor.value = function(...args: any[]) {
            const span = tracer.startSpan(operationName);
            try {
                return withSpan(core, span, () => {
                    return original.apply(this, args);
                }, this);
            } finally {
                span.end();
            }
        };
        
        return descriptor;
    };
}

// Usage
class MyService {
    @traced('process-data')
    processData(data: any) {
        // Automatically traced
        return data.processed;
    }
}
```

### Pattern 3: Context Preservation

```typescript
function preserveContext<T>(fn: () => T): () => T {
    const span = core.getActiveSpan();
    
    return () => {
        if (span) {
            return withSpan(core, span, fn);
        }
        return fn();
    };
}

// Usage
const contextualFn = preserveContext(() => {
    console.log('Maintaining trace context');
});

setTimeout(contextualFn, 1000); // Executes with preserved context
```

## Error Handling

### Automatic Context Restoration

`withSpan` guarantees context restoration even when errors occur:

```typescript
const previousSpan = core.getActiveSpan();
const span = tracer.startSpan('operation');

try {
    withSpan(core, span, () => {
        throw new Error('Operation failed');
    });
} catch (error) {
    // Context is restored to previousSpan
    console.log(core.getActiveSpan() === previousSpan); // true
} finally {
    span.end();
}
```

### Error Recording

```typescript
const span = tracer.startSpan('operation');

try {
    withSpan(core, span, () => {
        try {
            performRiskyOperation();
            span.setStatus({ code: SpanStatusCode.OK });
        } catch (error) {
            span.recordException(error);
            span.setStatus({ code: SpanStatusCode.ERROR });
            throw error; // Re-throw if needed
        }
    });
} catch (error) {
    // Handle error at outer level
    console.error('Operation failed:', error);
} finally {
    span.end();
}
```

### Promise Rejection

```typescript
const span = tracer.startSpan('async-operation');

try {
    await withSpan(core, span, async () => {
        const result = await fetch('/api/data');
        if (!result.ok) {
            throw new Error(`HTTP ${result.status}`);
        }
        return result.json();
    });
    span.setStatus({ code: SpanStatusCode.OK });
} catch (error) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR });
} finally {
    span.end();
}
```

## See Also

- [useSpan Helper](./useSpan.md) - Similar helper with scope parameter
- [Trace API Documentation](./traceApi.md) - Tracer and span management
- [OTel API Documentation](./otelApi.md) - Main OpenTelemetry API
- [Examples Guide](./examples.md) - Comprehensive usage examples
- [Main README](./README.md) - OpenTelemetry compatibility overview

## Related Types

- `ITraceHost` - Host interface for span management
- `IReadableSpan` - Span interface
- `ISpanScope` - Scope for restoring active span context
- `IOTelTracer` - Tracer interface for creating spans
