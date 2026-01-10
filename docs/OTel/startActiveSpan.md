# startActiveSpan Helper Function

## Overview

The `startActiveSpan` helper function is the **recommended approach** for creating spans in most scenarios. It provides automatic span lifecycle management, automatic context management, and ensures proper cleanup. This standalone utility function creates a span, sets it as active, executes your callback function, and automatically ends the span when the callback completes.

**Important:** This documentation covers the **standalone helper function** from [utils.ts](../../shared/AppInsightsCore/src/OpenTelemetry/trace/utils.ts), not the IOTelTracer interface method. The helper function is designed for direct use when you have access to a trace host instance.

## Table of Contents

- [Function Signature](#function-signature)
- [Parameters](#parameters)
- [Return Value](#return-value)
- [Key Features](#key-features)
- [Comparison with Other Helpers](#comparison-with-other-helpers)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Error Handling](#error-handling)
- [Advanced Usage](#advanced-usage)

## Function Signature

The `startActiveSpan` helper has three overloads:

### Simple Form (No Options)

```typescript
function startActiveSpan<T extends ITraceHost, F extends (this: ThisParameterType<F> | ISpanScope<T>, scope?: ISpanScope<T>) => ReturnType<F>>(
    traceHost: T,
    name: string,
    fn: F,
    thisArg?: ThisParameterType<F>
): ReturnType<F>;
```

### With Options

```typescript
function startActiveSpan<T extends ITraceHost, F extends (this: ThisParameterType<F> | ISpanScope<T>, scope?: ISpanScope<T>) => ReturnType<F>>(
    traceHost: T,
    name: string,
    options: IOTelSpanOptions,
    fn: F,
    thisArg?: ThisParameterType<F>
): ReturnType<F>;
```

### Combined Overload

```typescript
function startActiveSpan<T extends ITraceHost, F extends (this: ThisParameterType<F> | ISpanScope<T>, scope?: ISpanScope<T>) => ReturnType<F>>(
    traceHost: T,
    name: string,
    optionsOrFn: IOTelSpanOptions | F,
    maybeFnOrThis?: F | ThisParameterType<F>,
    thisArg?: ThisParameterType<F>
): ReturnType<F>;
```

## Parameters

### traceHost: T extends ITraceHost

The trace host instance (typically an [`IAppInsightsCore`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IAppInsightsCore.html) or ApplicationInsights instance) that provides span creation and context management capabilities.

**Example:**
```typescript
import { startActiveSpan } from '@microsoft/applicationinsights-core-js';

// Using with core instance
startActiveSpan(appInsightsCore, 'operation-name', (scope) => {
    // Work here
});

// Using with AISKU instance
startActiveSpan(appInsights, 'operation-name', (scope) => {
    // Work here
});
```

### name: string

The name of the span, describing the operation being performed.

**Best Practices:**
- Use clear, descriptive names (e.g., `'process-payment'`, `'fetch-user-data'`)
- Keep names concise but meaningful
- Use consistent naming patterns across your application
- Avoid including variable data in span names (use attributes instead)

**Example:**
```typescript
startActiveSpan(appInsights, 'authenticate-user', (scope) => {
    // Work here
});
```

### options?: IOTelSpanOptions

Optional configuration for the span.

**Type:** [`IOTelSpanOptions`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IOTelSpanOptions.html)

**Common Options:**
```typescript
interface IOTelSpanOptions {
    kind?: OTelSpanKind;           // Span kind (INTERNAL, SERVER, CLIENT, etc.)
    attributes?: IOTelAttributes;   // Initial attributes
    links?: IOTelLink[];           // Links to other spans
    startTime?: number;            // Custom start time
}
```

**Example:**
```typescript
startActiveSpan(appInsights, 'api-call',
    {
        kind: OTelSpanKind.CLIENT,
        attributes: {
            'http.method': 'GET',
            'http.url': '/api/data'
        }
    },
    (scope) => {
        // Work here
    }
);
```

### fn: Function

The callback function to execute with the span as active context. The callback receives an optional [`ISpanScope`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ISpanScope.html) parameter that provides access to the span and restoration capability.

**Signature:**
```typescript
(this: ThisParameterType<F> | ISpanScope<T>, scope?: ISpanScope<T>) => any
```

**Parameters:**
- `scope` (optional) - The [`ISpanScope`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ISpanScope.html) object providing:
  - `scope.span` - The created [`IReadableSpan`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IReadableSpan.html) that is active during callback execution
  - `scope.restore()` - Method to manually restore the previous active span

**Context (`this`):**
- When `thisArg` is not provided, `this` is set to the `ISpanScope` object
- When `thisArg` is provided, `this` is set to that value

**Characteristics:**
- Can be synchronous or asynchronous (return a Promise)
- Return value is passed through
- Span is automatically ended when the function completes
- The span is automatically set as active during execution

**Example:**
```typescript
// Most common - access span via scope parameter
startActiveSpan(appInsights, 'operation', (scope) => {
    scope.span.setAttribute('key', 'value');
    return processData();
});

// Without scope parameter - access span via this
startActiveSpan(appInsights, 'operation', function() {
    this.span.setAttribute('key', 'value');
    return processData();
});

// Manual restoration (rarely needed)
startActiveSpan(appInsights, 'operation', (scope) => {
    scope.span.setAttribute('key', 'value');
    // Manual restoration for early exit
    scope.restore();
    return null;
});
```

**Note:** The `scope` parameter is optional. If not used, you can access the span via `this.span` within the callback (when no `thisArg` is provided).

### thisArg?: ThisParameterType<F>

Optional `this` context for the callback function. If not provided, the `ISpanScope` object is used as the `this` context.

**Example:**
```typescript
class MyClass {
    processWithContext() {
        return startActiveSpan(appInsights, 'operation', function(scope) {
            // this refers to MyClass instance
            console.log(this instanceof MyClass); // true
            scope.span.setAttribute('processed', true);
        }, this); // Pass this as thisArg
    }
}

## Return Value

Returns the result of executing the callback function. The return type matches whatever the callback returns.

**Synchronous callback:**
```typescript
const result: number = startActiveSpan(appInsights, 'sync-op', (scope) => {
    return 42;
});
```

**Asynchronous callback:**
```typescript
const result: Promise<string> = startActiveSpan(appInsights, 'async-op', async (scope) => {
    return await fetchData();
});

// Must await the result as the "activeSpan" is NOT restored
// until the promise is resolved or rejected
const data = await result;
```

## Key Features

### 1. Automatic Span Lifecycle

The span is automatically ended when the callback completes, whether it returns synchronously or asynchronously.

```typescript
startActiveSpan(appInsights, 'auto-lifecycle', (scope) => {
    scope.span.setAttribute('started', Date.now());
    performWork();
    // Span automatically ends here
});
```

### 2. Automatic Context Management

The span is automatically set as the active span during callback execution and restored afterward.

```typescript
startActiveSpan(appInsights, 'outer', (outerScope) => {
    console.log('Active span:', appInsights.getActiveSpan()?.name); // 'outer'
    
    startActiveSpan(appInsights, 'inner', (innerScope) => {
        console.log('Active span:', appInsights.getActiveSpan()?.name); // 'inner'
    });
    
    console.log('Active span:', appInsights.getActiveSpan()?.name); // 'outer' (restored)
});
```

### 3. Exception Safety

The span is properly ended even if the callback throws an error, ensuring no span leaks.

```typescript
try {
    startActiveSpan(appInsights, 'risky-op', (scope) => {
        throw new Error('Something went wrong');
        // Span is still ended
    });
} catch (error) {
    console.error('Error caught, span was still ended');
}
```

### 4. Parent Span Inheritance

Child spans created within the callback automatically use the active span as their parent.

```typescript
startActiveSpan(appInsights, 'parent', (parentScope) => {
    // Create child - automatically has parentScope.span as parent
    startActiveSpan(appInsights, 'child', (childScope) => {
        console.log('Same trace ID:', 
            parentScope.span.spanContext().traceId === childScope.span.spanContext().traceId
        );
    });
});
```

### 5. Async/Await Support

Seamlessly handles both synchronous and asynchronous operations.

```typescript
// Async example
await startActiveSpan(appInsights, 'async-work', async (scope) => {
    const data = await fetchData();
    scope.span.setAttribute('items', data.length);
    return data;
});
```

## Comparison with Other Helpers

### vs. withSpan

**startActiveSpan (Creates and manages span):**
```typescript
// Creates span, sets active, and automatically ends it
startActiveSpan(appInsights, 'operation', (scope) => {
    scope.span.setAttribute('key', 'value');
    return doWork();
    // Span automatically ended
});
```

**withSpan (Uses existing span):**
```typescript
// Uses an already-created span and sets it as active
const span = appInsights.startSpan('operation');
try {
    withSpan(appInsights, span, () => {
        // Use existing span as active
        doWork();
    });
} finally {
    span.end(); // Manual cleanup required
}
```

### vs. useSpan

**startActiveSpan (Creates span):**
```typescript
// Creates and manages a new span
startActiveSpan(appInsights, 'new-span', (scope) => {
    // Span created here
    scope.span.setAttribute('created', true);
    doWork();
});
```

**useSpan (Uses existing span with scope):**
```typescript
// Uses an already-created span and receives scope parameter
const span = appInsights.startSpan('existing-span');
try {
    useSpan(appInsights, span, (scope) => {
        // Use existing span via scope
        scope.span.setAttribute('used', true);
        doWork();
    });
} finally {
    span.end(); // Manual cleanup required
}
```

**When to Use:**
- **`startActiveSpan`**: When creating a new span for an operation (most common)
- **`withSpan`**: When you have an existing span and need to set it as active
- **`useSpan`**: When you need both an existing span active and want scope parameter access

## Usage Examples

### Example 1: Basic Usage

```typescript
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { startActiveSpan } from '@microsoft/applicationinsights-core-js';

const appInsights = new ApplicationInsights({
    config: {
        connectionString: 'YOUR_CONNECTION_STRING'
    }
});
appInsights.loadAppInsights();

// Simple span creation
function processOrder(orderId: string) {
    return startActiveSpan(appInsights, 'process-order', (scope) => {
        scope.span.setAttribute('order.id', orderId);
        scope.span.setAttribute('service', 'order-processing');
        
        const result = performOrderProcessing(orderId);
        
        scope.span.setAttribute('result', 'success');
        return result;
    });
}
```

### Example 2: Async Operations

```typescript
async function fetchUserProfile(userId: string) {
    return startActiveSpan(appInsights, 'fetch-user-profile', async (scope) => {
        scope.span.setAttribute('user.id', userId);
        scope.span.setAttribute('operation', 'read');
        
        try {
            const response = await fetch(`/api/users/${userId}`);
            scope.span.setAttribute('http.status_code', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            scope.span.setStatus({ code: SpanStatusCode.OK });
            
            return data;
        } catch (error) {
            scope.span.recordException(error);
            scope.span.setStatus({ 
                code: SpanStatusCode.ERROR,
                message: error.message 
            });
            throw error;
        }
    });
}

// Usage
const profile = await fetchUserProfile('user123');
```

### Example 3: With Options

```typescript
function makeApiCall(endpoint: string, method: string) {
    return startActiveSpan(
        appInsights,
        'api-call',
        {
            kind: OTelSpanKind.CLIENT,
            attributes: {
                'http.method': method,
                'http.url': endpoint,
                'service.name': 'api-client'
            }
        },
        async (scope) => {
            const startTime = Date.now();
            
            try {
                const response = await fetch(endpoint, { method });
                const duration = Date.now() - startTime;
                
                scope.span.setAttribute('http.status_code', response.status);
                scope.span.setAttribute('http.response_time', duration);
                scope.span.setStatus({ code: SpanStatusCode.OK });
                
                return response.json();
            } catch (error) {
                scope.span.recordException(error);
                scope.span.setStatus({ code: SpanStatusCode.ERROR });
                throw error;
            }
        }
    );
}
```

### Example 4: Nested Spans

```typescript
async function handleCheckout(cartId: string) {
    return startActiveSpan(appInsights, 'checkout', async (checkoutScope) => {
        checkoutScope.span.setAttribute('cart.id', cartId);
        checkoutScope.span.setAttributes({
            'operation': 'checkout',
            'service': 'e-commerce'
        });
        
        // Step 1: Validate cart (child span)
        await startActiveSpan(appInsights, 'validate-cart', async (scope) => {
            scope.span.setAttribute('validation.type', 'cart');
            const isValid = await validateCart(cartId);
            scope.span.setAttribute('validation.result', isValid);
            
            if (!isValid) {
                throw new Error('Invalid cart');
            }
        });
        
        // Step 2: Process payment (child span)
        const paymentResult = await startActiveSpan(appInsights, 'process-payment', async (scope) => {
            scope.span.setAttribute('payment.method', 'credit_card');
            scope.span.setAttribute('payment.provider', 'stripe');
            
            const result = await processPayment(cartId);
            scope.span.setAttribute('payment.transaction_id', result.transactionId);
            
            return result;
        });
        
        // Step 3: Send confirmation (child span)
        await startActiveSpan(appInsights, 'send-confirmation', async (scope) => {
            scope.span.setAttribute('notification.type', 'email');
            scope.span.setAttribute('notification.template', 'order-confirmation');
            
            await sendConfirmationEmail(cartId, paymentResult);
        });
        
        checkoutScope.span.setAttribute('checkout.completed', true);
        return { cartId, payment: paymentResult };
    });
}
```

### Example 5: Using this Context

```typescript
// Access span via this when no scope parameter is used
startActiveSpan(appInsights, 'user-action', function() {
    this.span.setAttribute('action.type', 'button-click');
    handleUserAction();
});

// With scope parameter (more explicit)
startActiveSpan(appInsights, 'user-action', (scope) => {
    scope.span.setAttribute('action.type', 'button-click');
    handleUserAction();
});
```

### Example 6: Error Handling

```typescript
async function riskyOperation(data: any) {
    return startActiveSpan(appInsights, 'risky-operation', async (scope) => {
        scope.span.setAttribute('operation.type', 'risky');
        scope.span.setAttribute('data.size', JSON.stringify(data).length);
        
        try {
            const result = await performRiskyWork(data);
            
            scope.span.setAttribute('result.success', true);
            scope.span.setStatus({ code: SpanStatusCode.OK });
            
            return result;
        } catch (error) {
            scope.span.setAttribute('result.success', false);
            scope.span.setAttribute('error.type', error.name);
            scope.span.recordException(error);
            scope.span.setStatus({ 
                code: SpanStatusCode.ERROR,
                message: error.message 
            });
            
            // Re-throw or handle as needed
            throw error;
        }
    });
}
```

### Example 7: Manual Restoration (Rare)

```typescript
function processWithManualControl(data: any) {
    return startActiveSpan(appInsights, 'process-data', (scope) => {
        scope.span.setAttribute('data.type', typeof data);
        
        // Perform initial processing
        const preprocessed = preprocessData(data);
        
        // Manually restore context early if needed
        if (shouldEndEarly(preprocessed)) {
            scope.restore();
            scope.span.end();
            return null;
        }
        
        // Continue processing with active context
        const result = transform(preprocessed);
        scope.span.setAttribute('result.ready', true);
        return result;
    });
}
```

### Example 8: With Custom This Context

```typescript
class DataProcessor {
    private serviceName = 'data-processor';
    
    processData(data: any) {
        return startActiveSpan(
            appInsights,
            'process-data',
            function(scope) {
                // this refers to DataProcessor instance
                scope.span.setAttribute('service', this.serviceName);
                scope.span.setAttribute('data.length', data.length);
                
                return this.transform(data);
            },
            this // Pass this as thisArg
        );
    }
    
    private transform(data: any) {
        // Transform logic
        return data;
    }
}
```

## Best Practices

### 1. Use startActiveSpan as Default

```typescript
// Good - use startActiveSpan for most scenarios
startActiveSpan(appInsights, 'operation', (scope) => {
    scope.span.setAttribute('key', 'value');
    return doWork();
});

// Less ideal - manual management only when needed
const span = appInsights.startSpan('operation');
try {
    span.setAttribute('key', 'value');
    return doWork();
} finally {
    span.end();
}
```

### 2. Add Meaningful Attributes

```typescript
// Good - descriptive attributes
startActiveSpan(appInsights, 'database-query', (scope) => {
    scope.span.setAttributes({
        'db.system': 'postgresql',
        'db.operation': 'SELECT',
        'db.table': 'users',
        'query.limit': 100
    });
    return queryDatabase();
});

// Less useful - minimal context
startActiveSpan(appInsights, 'query', (scope) => {
    return queryDatabase();
});
```

### 3. Set Appropriate Span Status

```typescript
startActiveSpan(appInsights, 'operation', async (scope) => {
    try {
        await performWork();
        scope.span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
        scope.span.recordException(error);
        scope.span.setStatus({ 
            code: SpanStatusCode.ERROR,
            message: error.message 
        });
        throw error;
    }
});
```

### 4. Use Descriptive Span Names

```typescript
// Good - clear and descriptive
startActiveSpan(appInsights, 'process-payment', (scope) => { });
startActiveSpan(appInsights, 'validate-user-credentials', (scope) => { });
startActiveSpan(appInsights, 'send-email-notification', (scope) => { });

// Less ideal - vague names
startActiveSpan(appInsights, 'process', (scope) => { });
startActiveSpan(appInsights, 'validate', (scope) => { });
startActiveSpan(appInsights, 'send', (scope) => { });
```

### 5. Handle Async Operations Properly

```typescript
// Good - await the result
const result = await startActiveSpan(appInsights, 'async-op', async (scope) => {
    return await doAsyncWork();
});

// Bad - not awaiting
startActiveSpan(appInsights, 'async-op', async (scope) => {
    return await doAsyncWork();
}); // Span ends immediately, not when promise settles
```

### 6. Don't Mutate Span After Callback

```typescript
// Good - all span operations inside callback
startActiveSpan(appInsights, 'operation', (scope) => {
    scope.span.setAttribute('start', Date.now());
    const result = doWork();
    scope.span.setAttribute('end', Date.now());
    return result;
});

// Bad - trying to use span after callback
let savedSpan;
startActiveSpan(appInsights, 'operation', (scope) => {
    savedSpan = scope.span; // Don't do this
    return doWork();
});
// savedSpan.setAttribute('late', 'value'); // Span already ended!
```

## Common Patterns

### Pattern 1: Service Layer Wrapper

```typescript
import { startActiveSpan } from '@microsoft/applicationinsights-core-js';
import { IAppInsightsCore } from '@microsoft/applicationinsights-core-js';

class ServiceLayer {
    constructor(private core: IAppInsightsCore) {}
    
    async executeWithTracing<T>(
        operationName: string,
        operation: () => T | Promise<T>,
        attributes?: Record<string, any>
    ): Promise<T> {
        return startActiveSpan(this.core, operationName, async (scope) => {
            if (attributes) {
                scope.span.setAttributes(attributes);
            }
            
            try {
                const result = await operation();
                scope.span.setStatus({ code: SpanStatusCode.OK });
                return result;
            } catch (error) {
                scope.span.recordException(error);
                scope.span.setStatus({ code: SpanStatusCode.ERROR });
                throw error;
            }
        });
    }
}

// Usage
const service = new ServiceLayer(appInsightsCore);
await service.executeWithTracing('fetch-data', async () => {
    return await fetchData();
}, { 'data.type': 'users' });
```

### Pattern 2: Automatic Parent-Child Relationships

```typescript
async function parentOperation() {
    return startActiveSpan(appInsights, 'parent', async (parentScope) => {
        parentScope.span.setAttribute('level', 'parent');
        
        // All child spans automatically have parent as parent
        await childOperation1();
        await childOperation2();
        await childOperation3();
        
        return 'complete';
    });
}

async function childOperation1() {
    return startActiveSpan(appInsights, 'child-1', async (scope) => {
        // Automatically linked to parent
        scope.span.setAttribute('level', 'child');
        await doWork();
    });
}
```

### Pattern 3: Conditional Tracing

```typescript
import { ISpanScope } from '@microsoft/applicationinsights-core-js';

function maybeTrace<T>(
    traceHost: ITraceHost,
    operationName: string,
    operation: (scope?: ISpanScope) => T,
    shouldTrace: boolean = true
): T {
    if (!shouldTrace) {
        return operation(undefined);
    }
    
    return startActiveSpan(traceHost, operationName, (scope) => {
        return operation(scope);
    });
}

// Usage
maybeTrace(appInsights, 'operation', (scope) => {
    scope?.span.setAttribute('traced', true);
    return doWork();
}, process.env.ENABLE_TRACING === 'true');
```

### Pattern 4: Batch Operations

```typescript
async function processBatch<T>(items: T[], processor: (item: T) => Promise<void>) {
    return startActiveSpan(appInsights, 'process-batch', async (batchScope) => {
        batchScope.span.setAttribute('batch.size', items.length);
        batchScope.span.setAttribute('batch.started', Date.now());
        
        let successful = 0;
        let failed = 0;
        
        for (let i = 0; i < items.length; i++) {
            await startActiveSpan(appInsights, `process-item-${i}`, async (itemScope) => {
                itemScope.span.setAttribute('item.index', i);
                
                try {
                    await processor(items[i]);
                    successful++;
                } catch (error) {
                    itemScope.span.recordException(error);
                    itemScope.span.setStatus({ code: SpanStatusCode.ERROR });
                    failed++;
                }
            });
        }
        
        batchScope.span.setAttributes({
            'batch.completed': Date.now(),
            'batch.successful': successful,
            'batch.failed': failed
        });
        
        return { successful, failed };
    });
}
```

## Error Handling

### Automatic Span Ending on Error

`startActiveSpan` guarantees the span is ended even when errors occur:

```typescript
try {
    startActiveSpan(appInsights, 'operation', (scope) => {
        throw new Error('Something went wrong');
        // Span is still ended automatically
    });
} catch (error) {
    console.error('Error occurred, but span was ended');
}
```

### Recording Exceptions

```typescript
startActiveSpan(appInsights, 'risky-operation', (scope) => {
    try {
        performRiskyWork();
        scope.span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
        scope.span.recordException(error);
        scope.span.setStatus({ 
            code: SpanStatusCode.ERROR,
            message: error.message 
        });
        throw error; // Re-throw if needed
    }
});
```

### Async Error Handling

```typescript
await startActiveSpan(appInsights, 'async-operation', async (scope) => {
    try {
        const result = await fetchData();
        scope.span.setStatus({ code: SpanStatusCode.OK });
        return result;
    } catch (error) {
        scope.span.recordException(error);
        scope.span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
    }
});
```

## Advanced Usage

### Custom Start Times

```typescript
startActiveSpan(
    appInsights,
    'delayed-operation',
    {
        startTime: performance.now() - 1000 // Started 1 second ago
    },
    (scope) => {
        scope.span.setAttribute('delayed', true);
        return processData();
    }
);
```

### Span Links

```typescript
const relatedSpanContext = previousSpan.spanContext();

startActiveSpan(
    appInsights,
    'linked-operation',
    {
        links: [{
            context: relatedSpanContext,
            attributes: { 'link.type': 'related' }
        }]
    },
    (scope) => {
        scope.span.setAttribute('has.links', true);
        return doWork();
    }
);
```

### Different Span Kinds

```typescript
// Client span for outgoing HTTP request
startActiveSpan(appInsights, 'http-request',
    { kind: OTelSpanKind.CLIENT },
    (scope) => fetch('/api/data')
);

// Server span for incoming request handling
startActiveSpan(appInsights, 'handle-request',
    { kind: OTelSpanKind.SERVER },
    (scope) => handleRequest(req)
);

// Internal span for internal operations
startActiveSpan(appInsights, 'process-data',
    { kind: OTelSpanKind.INTERNAL },
    (scope) => processData()
);
```

## See Also

- [Trace API Documentation](./traceApi.md) - Overview of trace API and helper functions
- [withSpan Helper](./withSpan.md) - Execute code with existing span as active
- [useSpan Helper](./useSpan.md) - Execute code with span scope parameter
- [Examples Guide](./examples.md) - Comprehensive usage examples
- [Main README](./README.md) - OpenTelemetry compatibility overview

## Related Interfaces

- [`ITraceHost`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ITraceHost.html) - Trace host interface (core or AISKU instance)
- [`ISpanScope`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ISpanScope.html) - Scope for restoring active span context
- [`IReadableSpan`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IReadableSpan.html) - Span interface
- [`IOTelSpanOptions`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IOTelSpanOptions.html) - Options for span creation
- [`IAppInsightsCore`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IAppInsightsCore.html) - Core instance (implements ITraceHost)
