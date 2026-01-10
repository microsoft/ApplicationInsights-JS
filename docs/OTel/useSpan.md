# useSpan Helper Function

## Overview

The `useSpan` helper function is similar to `withSpan` but provides the [`ISpanScope`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ISpanScope.html) object as the first parameter to your callback function. This allows you to manually manage span context restoration or access scope properties when needed. It automatically manages span activation and ensures proper context restoration after execution completes.

## Table of Contents

- [Function Signature](#function-signature)
- [Parameters](#parameters)
- [Return Value](#return-value)
- [Key Features](#key-features)
- [Comparison with withSpan](#comparison-with-withspan)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Error Handling](#error-handling)

## Function Signature

```typescript
function useSpan<T extends ITraceHost, A extends unknown[], F extends (this: ThisParameterType<F> | ISpanScope<T>, scope: ISpanScope<T>, ...args: A) => ReturnType<F>>(
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

The callback function to execute with the span as the active context. The function receives the [`ISpanScope`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ISpanScope.html) as its first parameter, followed by any additional arguments.

**Signature:**
```typescript
(this: ThisParameterType<F> | ISpanScope<T>, scope: ISpanScope<T>, ...args: A) => ReturnType<F>
```

### thisArg?: any (optional)

The `this` context for the callback function. If not provided, the [`ISpanScope`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ISpanScope.html) instance is used as `this`.

### ..._args: any[] (optional)

Additional arguments to pass to the callback function (after the scope parameter).

## Return Value

Returns the result of executing the callback function. The return type matches the callback function's return type.

**For synchronous functions:**
```typescript
const result: number = useSpan(core, span, (scope) => {
    return 42;
});
```

**For asynchronous functions:**
```typescript
const result: Promise<string> = useSpan(core, span, async (scope) => {
    return await fetchData();
});
```

## Key Features

### 1. Scope Parameter Access

The callback receives an `ISpanScope` object as its first parameter, providing access to:
- `restore()` - Method to manually restore the previous active span
- The trace host instance (depending on implementation)

```typescript
useSpan(core, span, (scope) => {
    // Access the scope
    console.log('Scope available:', scope);
    
    // Can manually restore if needed
    // scope.restore();
});
```

### 2. Automatic Span Context Management

Sets the span as active during execution and restores the previous active span afterward (unless manually restored).

```typescript
useSpan(core, span, (scope) => {
    // span is active here
    console.log(core.getActiveSpan() === span); // true
});
// Previous active span is restored here
```

### 3. Manual Context Control

Unlike `withSpan`, you can manually restore the context within your callback if needed.

```typescript
useSpan(core, span, (scope) => {
    // Do some work with span active
    doWork();
    
    // Manually restore early if needed
    scope.restore();
    
    // Continue with previous context
    doMoreWork();
});
```

### 4. Exception Safety

Ensures the previous active span is restored even if the callback throws an error.

### 5. Async Support

Automatically handles both synchronous and asynchronous callbacks, including Promise-based functions.

## Comparison with withSpan

The main difference between `useSpan` and `withSpan` is how they pass parameters to the callback function.

### withSpan

Does NOT pass the scope to the callback:

```typescript
withSpan(core, span, (arg1, arg2) => {
    // arg1 and arg2 are your custom arguments
    // No access to scope
    console.log(arg1, arg2);
}, null, 'value1', 'value2');
```

### useSpan

Passes the scope as the FIRST parameter:

```typescript
useSpan(core, span, (scope, arg1, arg2) => {
    // scope is the ISpanScope object
    // arg1 and arg2 are your custom arguments
    console.log(scope, arg1, arg2);
    
    // Can manually restore
    scope.restore();
}, null, 'value1', 'value2');
```

**When to use which:**

| Use `withSpan` | Use `useSpan` |
|----------------|---------------|
| Don't need scope access | Need to manually restore context |
| Simple callback execution | Need scope for advanced scenarios |
| Most common scenarios | Complex context management |
| Cleaner callback signature | Need explicit control |

## Usage Examples

### Example 1: Basic Usage

```typescript
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { useSpan } from '@microsoft/applicationinsights-core-js';

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
const result = useSpan(appInsights, span, (scope) => {
    span.setAttribute('step', 'processing');
    
    // Perform work - span is active during execution
    const data = processData();
    
    span.setAttribute('result', 'success');
    return data;
});

span.end();
```

### Example 2: Manual Context Restoration

```typescript
const span = tracer.startSpan('complex-operation');

useSpan(appInsights, span, (scope) => {
    span.setAttribute('phase', 'with-context');
    
    // Do work with span active
    performWorkWithContext();
    
    // Manually restore context early
    scope.restore();
    
    span.setAttribute('phase', 'without-context');
    
    // Continue work with previous context
    performWorkWithoutContext();
});

span.end();
```

### Example 3: Conditional Context Restoration

```typescript
const span = tracer.startSpan('conditional-context');

useSpan(core, span, (scope, shouldRestoreEarly) => {
    span.setAttribute('processing', true);
    
    doInitialWork();
    
    if (shouldRestoreEarly) {
        console.log('Restoring context early');
        scope.restore();
    }
    
    // If restored early, runs with previous context
    // Otherwise, runs with span context
    doAdditionalWork();
}, null, true); // Pass shouldRestoreEarly = true

span.end();
```

### Example 4: Async Operations

```typescript
const span = tracer.startSpan('async-operation');

const result = await useSpan(core, span, async (scope) => {
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

### Example 5: Accessing Scope Properties

```typescript
const span = tracer.startSpan('scope-access');

useSpan(core, span, (scope) => {
    // Access scope properties
    console.log('Scope type:', typeof scope);
    console.log('Has restore method:', typeof scope.restore === 'function');
    
    // Perform work
    span.setAttribute('scope.available', true);
    
    // Demonstrate manual restore
    const shouldRestoreNow = checkCondition();
    if (shouldRestoreNow) {
        scope.restore();
    }
});

span.end();
```

### Example 6: Passing Additional Arguments

```typescript
function processWithContext(
    scope: ISpanScope,
    userId: string,
    action: string
): string {
    console.log('Scope:', scope);
    return `User ${userId} performed ${action}`;
}

const span = tracer.startSpan('user-action');

// Pass additional arguments to callback
const result = useSpan(
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

### Example 7: Error Handling with Manual Restoration

```typescript
const span = tracer.startSpan('error-handling');

try {
    useSpan(core, span, (scope) => {
        span.setAttribute('attempting', true);
        
        try {
            performRiskyOperation();
            span.setStatus({ code: SpanStatusCode.OK });
        } catch (error) {
            // Record error and restore context before handling
            span.recordException(error);
            span.setStatus({ code: SpanStatusCode.ERROR });
            
            // Restore context before error propagates
            scope.restore();
            
            throw error;
        }
    });
} catch (error) {
    // Context already restored
    console.error('Operation failed:', error);
} finally {
    span.end();
}
```

### Example 8: Nested Spans with Manual Control

```typescript
const parentSpan = tracer.startSpan('parent-operation');

useSpan(core, parentSpan, (parentScope) => {
    parentSpan.setAttribute('level', 1);
    
    // Create child span
    const childSpan = tracer.startSpan('child-operation');
    
    useSpan(core, childSpan, (childScope) => {
        childSpan.setAttribute('level', 2);
        
        // Access both scopes
        console.log('Parent scope:', parentScope);
        console.log('Child scope:', childScope);
        
        // Perform work
        doNestedWork();
        
        // Could manually restore child scope if needed
        // childScope.restore();
    });
    
    childSpan.end();
    
    // Parent scope is still active here
    console.log('Back to parent context');
});

parentSpan.end();
```

### Example 9: Complex Async Flow

```typescript
const span = tracer.startSpan('complex-async');

await useSpan(core, span, async (scope) => {
    span.setAttribute('stage', 'initial');
    
    // Phase 1: With span context
    await performPhase1();
    
    // Conditionally restore based on async result
    const shouldContinueWithContext = await checkContinuation();
    
    if (!shouldContinueWithContext) {
        scope.restore();
        span.setAttribute('context.restored.early', true);
    }
    
    // Phase 2: Might be with or without context
    await performPhase2();
    
    span.setAttribute('stage', 'completed');
});

span.end();
```

### Example 10: Scope Inspection

```typescript
const span = tracer.startSpan('scope-inspection');

useSpan(core, span, (scope) => {
    // Inspect scope
    console.log('Scope available:', !!scope);
    console.log('Scope has restore:', 'restore' in scope);
    
    // Log current state
    const currentSpan = core.getActiveSpan();
    console.log('Current span matches:', currentSpan === span);
    
    // Perform work
    doWork();
    
    // Demonstrate restoration
    console.log('Before restore - active span:', core.getActiveSpan()?.name);
    scope.restore();
    console.log('After restore - active span:', core.getActiveSpan()?.name);
});

span.end();
```

## Best Practices

### 1. Only Use useSpan When You Need the Scope

```typescript
// Good - need scope for manual restore
useSpan(core, span, (scope) => {
    doWork();
    if (needsEarlyRestore()) {
        scope.restore();
    }
    doMoreWork();
});

// Better - use withSpan if scope not needed
withSpan(core, span, () => {
    doWork();
    doMoreWork();
});
```

### 2. Be Careful with Manual Restoration

```typescript
// Good - restore at the right time
useSpan(core, span, (scope) => {
    doWorkNeedingContext();
    scope.restore();
    doWorkNotNeedingContext();
});

// Bad - restoring too early
useSpan(core, span, (scope) => {
    scope.restore(); // Too early!
    doWorkNeedingContext(); // Context already gone
});
```

### 3. Don't Restore Multiple Times

```typescript
// Good - restore once
useSpan(core, span, (scope) => {
    doWork();
    scope.restore();
});

// Bad - multiple restores
useSpan(core, span, (scope) => {
    scope.restore();
    // ... more code ...
    scope.restore(); // Second restore - unexpected behavior!
});
```

### 4. Always End Spans

```typescript
// Good - span is ended
const span = tracer.startSpan('operation');
try {
    useSpan(core, span, (scope) => {
        // Work
    });
} finally {
    span.end();
}

// Bad - span is never ended
const span = tracer.startSpan('operation');
useSpan(core, span, (scope) => {
    // Work
}); // Forgot to end span!
```

### 5. Use with startSpan, Not startActiveSpan

```typescript
// Good - use useSpan with startSpan
const span = tracer.startSpan('operation');
useSpan(core, span, (scope) => {
    // Work
});
span.end();

// Redundant - startActiveSpan already manages context
tracer.startActiveSpan('operation', (span) => {
    // No need for useSpan here
});
```

### 6. Handle Async Carefully

```typescript
// Good - proper async handling
const span = tracer.startSpan('async-op');
try {
    await useSpan(core, span, async (scope) => {
        await doAsyncWork();
    });
} finally {
    span.end();
}

// Bad - not awaiting
const span = tracer.startSpan('async-op');
useSpan(core, span, async (scope) => {
    await doAsyncWork();
}); // Not awaited!
span.end(); // Ends before async work completes
```

## Common Patterns

### Pattern 1: Conditional Context Management

```typescript
function executeWithOptionalContext<T>(
    span: IReadableSpan,
    fn: () => T,
    keepContextActive: boolean
): T {
    return useSpan(core, span, (scope) => {
        const result = fn();
        
        if (!keepContextActive) {
            scope.restore();
        }
        
        return result;
    });
}

// Usage
executeWithOptionalContext(span, doWork, false); // Restores context
executeWithOptionalContext(span, doWork, true);  // Keeps context
```

### Pattern 2: Scope-Aware Wrapper

```typescript
function withManagedScope<T>(
    operationName: string,
    fn: (scope: ISpanScope) => T
): T {
    const span = tracer.startSpan(operationName);
    try {
        return useSpan(core, span, fn);
    } finally {
        span.end();
    }
}

// Usage
withManagedScope('my-operation', (scope) => {
    console.log('Have scope:', scope);
    // Can manually restore if needed
    return performWork();
});
```

### Pattern 3: Early Exit with Restoration

```typescript
function processWithEarlyExit(data: any): any {
    const span = tracer.startSpan('process');
    
    return useSpan(core, span, (scope) => {
        if (!validateData(data)) {
            scope.restore();
            span.end();
            return null; // Early exit
        }
        
        const result = processData(data);
        span.end();
        return result;
    });
}
```

### Pattern 4: Scope Delegation

```typescript
function delegateWithScope<T>(
    span: IReadableSpan,
    operation: (restore: () => void) => T
): T {
    return useSpan(core, span, (scope) => {
        // Delegate restore capability to the operation
        return operation(() => scope.restore());
    });
}

// Usage
delegateWithScope(span, (restore) => {
    doWork();
    
    if (shouldStop()) {
        restore(); // Operation controls restoration
        return null;
    }
    
    return continueWork();
});
```

## Error Handling

### Automatic Context Restoration on Error

`useSpan` guarantees context restoration even when errors occur:

```typescript
const previousSpan = core.getActiveSpan();
const span = tracer.startSpan('operation');

try {
    useSpan(core, span, (scope) => {
        throw new Error('Operation failed');
    });
} catch (error) {
    // Context is restored to previousSpan
    console.log(core.getActiveSpan() === previousSpan); // true
} finally {
    span.end();
}
```

### Manual Restoration Before Error

```typescript
const span = tracer.startSpan('operation');

try {
    useSpan(core, span, (scope) => {
        try {
            performRiskyOperation();
        } catch (error) {
            // Restore context before handling error
            scope.restore();
            
            span.recordException(error);
            span.setStatus({ code: SpanStatusCode.ERROR });
            
            throw error;
        }
    });
} catch (error) {
    console.error('Handled:', error);
} finally {
    span.end();
}
```

### Async Error Handling

```typescript
const span = tracer.startSpan('async-operation');

try {
    await useSpan(core, span, async (scope) => {
        try {
            const result = await fetch('/api/data');
            if (!result.ok) {
                throw new Error(`HTTP ${result.status}`);
            }
            return result.json();
        } catch (error) {
            // Can restore before re-throwing if needed
            scope.restore();
            span.recordException(error);
            throw error;
        }
    });
} catch (error) {
    console.error('Request failed:', error);
} finally {
    span.end();
}
```

### Scope State After Restoration

```typescript
const span = tracer.startSpan('state-check');

useSpan(core, span, (scope) => {
    console.log('Before restore:', core.getActiveSpan() === span); // true
    
    scope.restore();
    
    console.log('After restore:', core.getActiveSpan() === span); // false
    
    // Calling restore again has no effect (already restored)
    scope.restore();
});

span.end();
```

## ISpanScope Interface

The `ISpanScope` interface provides methods and properties for managing span context:

```typescript
interface ISpanScope<T extends ITraceHost = ITraceHost> {
    /**
     * Restore the previous active span context
     */
    restore(): void;
    
    // Additional properties may be available depending on implementation
}
```

### Using the Scope

```typescript
useSpan(core, span, (scope) => {
    // Check if scope has restore method
    if (typeof scope.restore === 'function') {
        // Perform work
        doWork();
        
        // Restore when needed
        scope.restore();
    }
});
```

## See Also

- [withSpan Helper](./withSpan.md) - Similar helper without scope parameter
- [Trace API Documentation](./traceApi.md) - Tracer and span management
- [OTel API Documentation](./otelApi.md) - Main OpenTelemetry API
- [Examples Guide](./examples.md) - Comprehensive usage examples
- [Main README](./README.md) - OpenTelemetry compatibility overview

## Related Types

- `ITraceHost` - Host interface for span management
- `IReadableSpan` - Span interface
- `ISpanScope` - Scope for restoring active span context
- `IOTelTracer` - Tracer interface for creating spans
