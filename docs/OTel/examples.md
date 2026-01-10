# OpenTelemetry Examples and Patterns

## Overview

This guide provides examples and patterns for using the OpenTelemetry APIs in the Application Insights JavaScript SDK. These examples demonstrate real-world scenarios and best practices for instrumentation.

## Table of Contents

- [Getting Started](#getting-started)
- [Basic Patterns](#basic-patterns)
- [Advanced Patterns](#advanced-patterns)
- [Real-World Scenarios](#real-world-scenarios)
- [Integration Examples](#integration-examples)
- [Performance Patterns](#performance-patterns)
- [Testing and Debugging](#testing-and-debugging)

## Getting Started

### Setup

```typescript
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { OTelSpanKind, SpanStatusCode } from '@microsoft/applicationinsights-core-js';

// Initialize Application Insights
const appInsights = new ApplicationInsights({
    config: {
        connectionString: 'YOUR_CONNECTION_STRING',
        enableAutoRouteTracking: true
    }
});

appInsights.loadAppInsights();

// Get the OpenTelemetry API
const otelApi = appInsights.otelApi;
const trace = otelApi.trace;

// Create a tracer for your application
const tracer = trace.getTracer('my-application');
```

## Basic Patterns

### Pattern 1: Simple Span Creation

```typescript
// Create and end a simple span
function trackOperation(operationName: string): void {
    const span = tracer.startSpan(operationName);
    
    if (span) {
        span.setAttribute('operation.type', 'manual');
        span.setAttribute('timestamp', Date.now());
        
        try {
            // Perform operation
            performWork();
            
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
}

// Usage
trackOperation('user-action');
```

### Pattern 2: Using startActiveSpan

```typescript
// Automatic span lifecycle management
async function fetchUserData(userId: string): Promise<any> {
    return tracer.startActiveSpan('fetch-user-data', async (span) => {
        span.setAttribute('user.id', userId);
        span.setAttribute('operation', 'read');
        
        try {
            const response = await fetch(`/api/users/${userId}`);
            
            span.setAttribute('http.status_code', response.status);
            span.setAttribute('http.method', 'GET');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            span.setStatus({ code: SpanStatusCode.OK });
            
            return data;
        } catch (error) {
            span.recordException(error);
            span.setStatus({ code: SpanStatusCode.ERROR });
            throw error;
        }
        // Span automatically ended
    });
}

// Usage
const userData = await fetchUserData('user123');
```

### Pattern 3: Parent-Child Spans

```typescript
async function processOrder(orderId: string): Promise<any> {
    return tracer.startActiveSpan('process-order', async (parentSpan) => {
        parentSpan.setAttribute('order.id', orderId);
        parentSpan.setAttributes({
            'operation': 'checkout',
            'service': 'order-processing'
        });
        
        // Child span 1: Validate inventory
        await tracer.startActiveSpan('validate-inventory', async (span) => {
            span.setAttribute('check.type', 'inventory');
            const available = await checkInventory(orderId);
            span.setAttribute('inventory.available', available);
        });
        
        // Child span 2: Process payment
        const paymentResult = await tracer.startActiveSpan('process-payment', async (span) => {
            span.setAttribute('payment.method', 'credit_card');
            const result = await processPayment(orderId);
            span.setAttribute('payment.success', result.success);
            return result;
        });
        
        // Child span 3: Send notification
        await tracer.startActiveSpan('send-notification', async (span) => {
            span.setAttribute('notification.type', 'email');
            await sendOrderConfirmation(orderId);
        });
        
        parentSpan.setAttribute('order.completed', true);
        return { orderId, payment: paymentResult };
    });
}
```

### Pattern 4: Multiple Tracers

```typescript
// Create tracers for different services/components
class Application {
    private userTracer = trace.getTracer('user-service');
    private apiTracer = trace.getTracer('api-client');
    private dbTracer = trace.getTracer('database-layer');
    
    async authenticateUser(username: string, password: string) {
        return this.userTracer.startActiveSpan('authenticate', async (span) => {
            span.setAttribute('auth.username', username);
            span.setAttribute('auth.method', 'password');
            
            // Use database tracer for DB operations
            const user = await this.dbTracer.startActiveSpan('query-user', async (dbSpan) => {
                dbSpan.setAttribute('db.operation', 'SELECT');
                dbSpan.setAttribute('db.table', 'users');
                return await this.queryUser(username);
            });
            
            // Use API tracer for external API calls
            await this.apiTracer.startActiveSpan('verify-token', async (apiSpan) => {
                apiSpan.setAttribute('api.endpoint', '/verify');
                await this.verifyWithExternalService(user.token);
            });
            
            return user;
        });
    }
}
```

## Advanced Patterns

### Pattern 5: Context Propagation Across Async Boundaries

```typescript
import { withSpan } from '@microsoft/applicationinsights-core-js';

// Preserve context across setTimeout/setInterval
function scheduleWithContext(fn: () => void, delay: number): void {
    const span = trace.getActiveSpan();
    
    setTimeout(() => {
        if (span) {
            withSpan(appInsights.core, span, fn);
        } else {
            fn();
        }
    }, delay);
}

// Usage
tracer.startActiveSpan('parent-operation', (span) => {
    span.setAttribute('scheduling', 'async-task');
    
    scheduleWithContext(() => {
        // This executes with parent span context
        console.log('Active span:', trace.getActiveSpan()?.name);
    }, 1000);
});
```

### Pattern 6: Distributed Tracing

```typescript
// Service A: Create span and propagate context
class ServiceA {
    async callServiceB(data: any): Promise<any> {
        return tracer.startActiveSpan('call-service-b', async (span) => {
            span.setAttribute('service.target', 'service-b');
            
            // Get span context for propagation
            const spanContext = span.spanContext();
            
            // Create W3C traceparent header
            const traceparent = `00-${spanContext.traceId}-${spanContext.spanId}-01`;
            
            const response = await fetch('http://service-b/api/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'traceparent': traceparent
                },
                body: JSON.stringify(data)
            });
            
            span.setAttribute('http.status_code', response.status);
            return response.json();
        });
    }
}

// Service B: Receive and continue trace
class ServiceB {
    handleRequest(headers: Record<string, string>, data: any): any {
        // Parse traceparent header
        const traceparent = headers['traceparent'];
        const [version, traceId, parentSpanId, flags] = traceparent.split('-');
        
        // Create context from propagated info
        const parentContext = {
            traceId: traceId,
            spanId: parentSpanId,
            traceFlags: parseInt(flags, 16)
        };
        
        // Validate and wrap context
        if (trace.isSpanContextValid(parentContext)) {
            const wrappedSpan = trace.wrapSpanContext(parentContext);
            const scope = trace.setActiveSpan(wrappedSpan);
            
            try {
                // Create child span that continues the distributed trace
                return tracer.startActiveSpan('process-request', (span) => {
                    span.setAttribute('service', 'service-b');
                    span.setAttribute('data.size', JSON.stringify(data).length);
                    
                    return this.processData(data);
                });
            } finally {
                scope?.restore();
            }
        } else {
            // Process without trace context
            return this.processData(data);
        }
    }
}
```

### Pattern 7: Conditional Tracing

```typescript
class TracingConfig {
    private enableTracing: boolean = true;
    private sampleRate: number = 1.0; // 100%
    
    shouldTrace(): boolean {
        return this.enableTracing && Math.random() < this.sampleRate;
    }
    
    setSampleRate(rate: number): void {
        this.sampleRate = Math.max(0, Math.min(1, rate));
    }
}

const config = new TracingConfig();

function conditionalTrace<T>(
    operationName: string,
    fn: () => T
): T {
    if (!config.shouldTrace()) {
        return fn();
    }
    
    return tracer.startActiveSpan(operationName, (span) => {
        span.setAttribute('sampled', true);
        return fn();
    });
}

// Usage
const result = conditionalTrace('expensive-operation', () => {
    return performExpensiveOperation();
});
```

### Pattern 8: Span Suppression

```typescript
import { suppressTracing, unsuppressTracing, isTracingSuppressed } from '@microsoft/applicationinsights-core-js';

// Suppress tracing for specific operations
function performWithoutTracing<T>(fn: () => T): T {
    const wasSupressed = isTracingSuppressed(appInsights.core);
    
    if (!wasSupressed) {
        suppressTracing(appInsights.core);
    }
    
    try {
        return fn();
    } finally {
        if (!wasSupressed) {
            unsuppressTracing(appInsights.core);
        }
    }
}

// Usage
tracer.startActiveSpan('parent', (span) => {
    span.setAttribute('traced', true);
    
    // This won't create spans
    performWithoutTracing(() => {
        const innerSpan = tracer.startSpan('should-not-trace');
        console.log('Inner span:', innerSpan); // null
    });
    
    // This will create spans again
    const childSpan = tracer.startSpan('will-trace');
    console.log('Child span:', childSpan); // span object
});
```

## Real-World Scenarios

### Scenario 1: E-Commerce Checkout Flow

```typescript
class CheckoutService {
    private tracer = trace.getTracer('checkout-service');
    
    async checkout(cartId: string, userId: string): Promise<any> {
        return this.tracer.startActiveSpan('checkout', async (checkoutSpan) => {
            checkoutSpan.setAttributes({
                'cart.id': cartId,
                'user.id': userId,
                'checkout.started': new Date().toISOString()
            });
            
            try {
                // Step 1: Validate cart
                const cart = await this.tracer.startActiveSpan('validate-cart', async (span) => {
                    span.setAttribute('cart.id', cartId);
                    const cart = await this.getCart(cartId);
                    span.setAttribute('cart.items', cart.items.length);
                    span.setAttribute('cart.total', cart.total);
                    
                    if (cart.items.length === 0) {
                        throw new Error('Cart is empty');
                    }
                    
                    return cart;
                });
                
                // Step 2: Calculate totals
                const totals = await this.tracer.startActiveSpan('calculate-totals', async (span) => {
                    span.setAttribute('cart.subtotal', cart.subtotal);
                    const totals = await this.calculateTotals(cart);
                    span.setAttributes({
                        'cart.tax': totals.tax,
                        'cart.shipping': totals.shipping,
                        'cart.total': totals.total
                    });
                    return totals;
                });
                
                // Step 3: Process payment
                const payment = await this.tracer.startActiveSpan('process-payment', async (span) => {
                    span.setAttributes({
                        'payment.amount': totals.total,
                        'payment.currency': 'USD',
                        'payment.method': 'credit_card'
                    });
                    
                    const result = await this.processPayment(userId, totals.total);
                    
                    span.setAttributes({
                        'payment.transaction_id': result.transactionId,
                        'payment.status': result.status,
                        'payment.success': result.success
                    });
                    
                    if (!result.success) {
                        throw new Error('Payment failed');
                    }
                    
                    return result;
                });
                
                // Step 4: Create order
                const order = await this.tracer.startActiveSpan('create-order', async (span) => {
                    span.setAttribute('order.user_id', userId);
                    const order = await this.createOrder(userId, cart, payment);
                    span.setAttributes({
                        'order.id': order.id,
                        'order.status': order.status,
                        'order.created': order.createdAt
                    });
                    return order;
                });
                
                // Step 5: Send confirmations
                await this.tracer.startActiveSpan('send-confirmations', async (span) => {
                    span.setAttribute('order.id', order.id);
                    
                    await Promise.all([
                        this.sendEmailConfirmation(userId, order),
                        this.sendSMSNotification(userId, order)
                    ]);
                    
                    span.setAttribute('notifications.sent', 2);
                });
                
                checkoutSpan.setAttributes({
                    'checkout.completed': new Date().toISOString(),
                    'checkout.success': true,
                    'order.id': order.id
                });
                
                checkoutSpan.setStatus({ code: SpanStatusCode.OK });
                
                return order;
                
            } catch (error) {
                checkoutSpan.recordException(error);
                checkoutSpan.setAttributes({
                    'checkout.error': error.message,
                    'checkout.success': false
                });
                checkoutSpan.setStatus({ 
                    code: SpanStatusCode.ERROR,
                    message: error.message 
                });
                throw error;
            }
        });
    }
}
```

### Scenario 2: API Client with Retry Logic

```typescript
class RetryableAPIClient {
    private tracer = trace.getTracer('api-client');
    private maxRetries = 3;
    private retryDelay = 1000;
    
    async fetchWithRetry<T>(
        url: string,
        options?: RequestInit
    ): Promise<T> {
        return this.tracer.startActiveSpan('fetch-with-retry', async (span) => {
            span.setAttributes({
                'http.url': url,
                'http.method': options?.method || 'GET',
                'retry.max_attempts': this.maxRetries
            });
            
            let lastError: Error | null = null;
            
            for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
                const attemptSpan = this.tracer.startSpan(`attempt-${attempt}`);
                
                try {
                    attemptSpan?.setAttributes({
                        'retry.attempt': attempt,
                        'retry.is_retry': attempt > 1
                    });
                    
                    const response = await fetch(url, options);
                    
                    attemptSpan?.setAttributes({
                        'http.status_code': response.status,
                        'http.response_size': response.headers.get('content-length')
                    });
                    
                    if (response.ok) {
                        attemptSpan?.setStatus({ code: SpanStatusCode.OK });
                        attemptSpan?.end();
                        
                        span.setAttributes({
                            'retry.succeeded_on_attempt': attempt,
                            'http.status_code': response.status
                        });
                        span.setStatus({ code: SpanStatusCode.OK });
                        
                        return response.json();
                    }
                    
                    throw new Error(`HTTP ${response.status}`);
                    
                } catch (error) {
                    lastError = error as Error;
                    
                    attemptSpan?.recordException(error);
                    attemptSpan?.setAttributes({
                        'retry.error': error.message,
                        'retry.failed': true
                    });
                    attemptSpan?.setStatus({ code: SpanStatusCode.ERROR });
                    attemptSpan?.end();
                    
                    if (attempt < this.maxRetries) {
                        span.setAttribute(`retry.attempt_${attempt}_failed`, true);
                        await this.delay(this.retryDelay * attempt);
                    }
                }
            }
            
            // All retries failed
            span.recordException(lastError!);
            span.setAttributes({
                'retry.exhausted': true,
                'retry.final_error': lastError!.message
            });
            span.setStatus({ 
                code: SpanStatusCode.ERROR,
                message: 'All retry attempts failed'
            });
            
            throw lastError;
        });
    }
    
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Usage
const client = new RetryableAPIClient();
const data = await client.fetchWithRetry('/api/data');
```

### Scenario 3: Background Job Processing

```typescript
import { withSpan } from '@microsoft/applicationinsights-core-js';

class JobProcessor {
    private tracer = trace.getTracer('job-processor');
    private processingJobs = new Map<string, IReadableSpan>();
    
    async processJob(job: Job): Promise<void> {
        const jobSpan = this.tracer.startSpan('process-job', {
            kind: OTelSpanKind.CONSUMER,
            attributes: {
                'job.id': job.id,
                'job.type': job.type,
                'job.priority': job.priority,
                'job.queued_at': job.queuedAt
            }
        });
        
        if (!jobSpan) return;
        
        this.processingJobs.set(job.id, jobSpan);
        
        try {
            await withSpan(appInsights.core, jobSpan, async () => {
                jobSpan.setAttribute('job.started_at', new Date().toISOString());
                
                // Process job steps
                await this.validateJob(job);
                await this.executeJob(job);
                await this.finalizeJob(job);
                
                jobSpan.setAttributes({
                    'job.completed_at': new Date().toISOString(),
                    'job.status': 'completed',
                    'job.success': true
                });
                
                jobSpan.setStatus({ code: SpanStatusCode.OK });
            });
            
        } catch (error) {
            jobSpan.recordException(error);
            jobSpan.setAttributes({
                'job.status': 'failed',
                'job.error': error.message,
                'job.success': false
            });
            jobSpan.setStatus({ code: SpanStatusCode.ERROR });
            
            await this.handleJobFailure(job, error);
            
        } finally {
            this.processingJobs.delete(job.id);
            jobSpan.end();
        }
    }
    
    private async validateJob(job: Job): Promise<void> {
        return this.tracer.startActiveSpan('validate-job', async (span) => {
            span.setAttribute('job.id', job.id);
            
            // Validation logic
            const isValid = await this.runValidation(job);
            
            span.setAttribute('job.valid', isValid);
            
            if (!isValid) {
                throw new Error('Job validation failed');
            }
        });
    }
    
    private async executeJob(job: Job): Promise<void> {
        return this.tracer.startActiveSpan('execute-job', async (span) => {
            span.setAttribute('job.id', job.id);
            
            // Execute job-specific logic
            const result = await this.runJobLogic(job);
            
            span.setAttributes({
                'job.result.status': result.status,
                'job.result.items_processed': result.itemsProcessed
            });
        });
    }
    
    private async finalizeJob(job: Job): Promise<void> {
        return this.tracer.startActiveSpan('finalize-job', async (span) => {
            span.setAttribute('job.id', job.id);
            
            // Cleanup, notifications, etc.
            await this.sendCompletionNotification(job);
            await this.updateJobStatus(job, 'completed');
            
            span.setAttribute('job.finalized', true);
        });
    }
}
```

## Integration Examples

### Integration 1: React Component Instrumentation

```typescript
import React, { useEffect } from 'react';
import { OTelSpanKind } from '@microsoft/applicationinsights-core-js';

const UserDashboard: React.FC<{ userId: string }> = ({ userId }) => {
    const tracer = trace.getTracer('react-components');
    
    useEffect(() => {
        const span = tracer.startSpan('load-dashboard', {
            kind: OTelSpanKind.INTERNAL,
            attributes: {
                'component': 'UserDashboard',
                'user.id': userId
            }
        });
        
        // Load data
        loadDashboardData(userId)
            .then(data => {
                span?.setAttribute('data.loaded', true);
                span?.setAttribute('data.items', data.length);
                span?.setStatus({ code: SpanStatusCode.OK });
            })
            .catch(error => {
                span?.recordException(error);
                span?.setStatus({ code: SpanStatusCode.ERROR });
            })
            .finally(() => {
                span?.end();
            });
        
        return () => {
            // Cleanup
        };
    }, [userId]);
    
    const handleAction = (action: string) => {
        tracer.startActiveSpan('user-action', (span) => {
            span.setAttributes({
                'action.type': action,
                'component': 'UserDashboard',
                'user.id': userId
            });
            
            performAction(action);
        });
    };
    
    return (
        <div>
            <button onClick={() => handleAction('refresh')}>Refresh</button>
        </div>
    );
};
```

### Integration 2: Express Middleware

```typescript
import express from 'express';

function tracingMiddleware(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
): void {
    const tracer = trace.getTracer('express-server');
    
    const span = tracer.startSpan('http-request', {
        kind: OTelSpanKind.SERVER,
        attributes: {
            'http.method': req.method,
            'http.url': req.url,
            'http.route': req.route?.path,
            'http.user_agent': req.get('user-agent')
        }
    });
    
    if (!span) {
        return next();
    }
    
    // Store span in request for child spans
    (req as any).span = span;
    
    const startTime = Date.now();
    
    // Override res.end to capture response
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
        const duration = Date.now() - startTime;
        
        span.setAttributes({
            'http.status_code': res.statusCode,
            'http.duration_ms': duration
        });
        
        if (res.statusCode >= 500) {
            span.setStatus({ 
                code: SpanStatusCode.ERROR,
                message: `HTTP ${res.statusCode}`
            });
        } else {
            span.setStatus({ code: SpanStatusCode.OK });
        }
        
        span.end();
        
        return originalEnd.apply(res, args);
    };
    
    next();
}

// Usage
const app = express();
app.use(tracingMiddleware);
```

## Performance Patterns

### Pattern 9: Batch Operations

```typescript
class BatchProcessor {
    private tracer = trace.getTracer('batch-processor');
    
    async processBatch<T>(items: T[], processor: (item: T) => Promise<void>): Promise<void> {
        return this.tracer.startActiveSpan('process-batch', async (span) => {
            span.setAttributes({
                'batch.size': items.length,
                'batch.started': new Date().toISOString()
            });
            
            let successCount = 0;
            let errorCount = 0;
            
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                
                try {
                    await this.tracer.startActiveSpan(`process-item-${i}`, async (itemSpan) => {
                        itemSpan.setAttribute('item.index', i);
                        await processor(item);
                        successCount++;
                    });
                } catch (error) {
                    errorCount++;
                    span.recordException(error);
                }
            }
            
            span.setAttributes({
                'batch.completed': new Date().toISOString(),
                'batch.success_count': successCount,
                'batch.error_count': errorCount,
                'batch.success_rate': successCount / items.length
            });
            
            if (errorCount > 0) {
                span.setStatus({ 
                    code: SpanStatusCode.ERROR,
                    message: `${errorCount} items failed`
                });
            } else {
                span.setStatus({ code: SpanStatusCode.OK });
            }
        });
    }
}
```

### Pattern 10: Lazy Loading with Tracing

```typescript
class LazyLoader<T> {
    private tracer = trace.getTracer('lazy-loader');
    private cache = new Map<string, T>();
    
    async load(key: string, loader: () => Promise<T>): Promise<T> {
        // Check cache first
        if (this.cache.has(key)) {
            return this.cache.get(key)!;
        }
        
        return this.tracer.startActiveSpan('lazy-load', async (span) => {
            span.setAttributes({
                'cache.key': key,
                'cache.hit': false
            });
            
            const value = await loader();
            this.cache.set(key, value);
            
            span.setAttributes({
                'cache.stored': true,
                'cache.size': this.cache.size
            });
            
            return value;
        });
    }
}
```

## Using ITraceHost Methods Directly

The [`ITraceHost`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ITraceHost.html) interface provides direct access to span lifecycle methods through `appInsights` (AISKU) or `core` (AppInsightsCore). These methods give you lower-level control over span creation and context management.

### Pattern: Direct startSpan Usage

The `startSpan` method creates a new span without automatically setting it as the active span. This gives you explicit control over context management.

```typescript
import { OTelSpanKind } from '@microsoft/applicationinsights-core-js';

// Using AISKU
const span = appInsights.startSpan('manual-operation', {
    kind: OTelSpanKind.INTERNAL,
    attributes: {
        'operation.type': 'manual',
        'user.id': 'user123'
    }
});

if (span) {
    try {
        // Do work - span is NOT automatically active
        performOperation();
        
        // Manually add attributes as needed
        span.setAttribute('result', 'success');
        span.setAttribute('items.processed', 42);
        
        span.setStatus({ code: eOTelSpanStatusCode.OK });
    } catch (error) {
        span.recordException(error);
        span.setStatus({ 
            code: eOTelSpanStatusCode.ERROR,
            message: error.message 
        });
    } finally {
        span.end();
    }
}
```

### Pattern: activeSpan for Context Awareness

The `activeSpan` method retrieves the currently active span, useful for adding attributes or checking trace context.

```typescript
// Check if there's an active span and add context
function addUserContextToActiveSpan(userId: string, userName: string): void {
    const activeSpan = appInsights.getActiveSpan();
    
    if (activeSpan && activeSpan.isRecording()) {
        activeSpan.setAttribute('user.id', userId);
        activeSpan.setAttribute('user.name', userName);
        activeSpan.setAttribute('context.added.at', Date.now());
    }
}

// Usage in your application
function handleUserAction(userId: string): void {
    // Some parent span is already active
    addUserContextToActiveSpan(userId, 'John Doe');
    
    // Continue with operation...
}
```

### Pattern: activeSpan with createNew Parameter

Control whether to create a non-recording span when no active span exists:

```typescript
// Performance-optimized check - don't create non-recording span
function hasActiveTrace(): boolean {
    const span = appInsights.getActiveSpan(false);
    return span !== null;
}

// Create non-recording span if needed (default behavior)
function getOrCreateActiveSpan(): IReadableSpan | null {
    return appInsights.getActiveSpan(true);
}

// Conditional tracing based on active context
function maybeTraceOperation(operationName: string): void {
    if (hasActiveTrace()) {
        // We're in a traced context, add details
        const activeSpan = appInsights.getActiveSpan();
        activeSpan?.setAttribute('operation', operationName);
    }
    
    performOperation();
}
```

### Pattern: setActiveSpan for Manual Context Management

The `setActiveSpan` method gives you explicit control over the active span context:

```typescript
// Create and manually set a span as active
const parentSpan = appInsights.startSpan('parent-operation', {
    kind: OTelSpanKind.SERVER,
    attributes: { 'http.method': 'POST' }
});

if (parentSpan) {
    // Set this span as the active span
    const scope = appInsights.setActiveSpan(parentSpan);
    
    try {
        // Any child spans created now will use parentSpan as parent
        const childSpan = appInsights.startSpan('child-operation');
        
        if (childSpan) {
            // childSpan automatically has parentSpan as its parent
            childSpan.setAttribute('child.data', 'value');
            childSpan.end();
        }
        
        parentSpan.setAttribute('children.created', 1);
        
    } finally {
        // Restore previous active span
        scope.restore();
        parentSpan.end();
    }
}
```

### Pattern: Scope Management with ISpanScope

The [`ISpanScope`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ISpanScope.html) returned by `setActiveSpan` allows you to restore context:

```typescript
function executeWithTemporaryContext(operationName: string): void {
    // Create a temporary span context
    const tempSpan = appInsights.startSpan(operationName);
    
    if (tempSpan) {
        const scope = appInsights.setActiveSpan(tempSpan);
        
        try {
            // Access the scope properties
            console.log('Current span:', scope.span.name);
            console.log('Previous span:', scope.prvSpan?.name || 'none');
            
            // Do work in this context
            performWork();
            
            // Manually restore early if needed
            scope.restore();
            
            // Continue work outside the temporary context
            performMoreWork();
            
        } finally {
            tempSpan.end();
        }
    }
}
```

### Pattern: Combining Host Methods for Complex Workflows

```typescript
import { OTelSpanKind, eOTelSpanStatusCode } from '@microsoft/applicationinsights-core-js';

class WorkflowEngine {
    private executionCount = 0;
    
    executeWorkflow(workflowName: string, steps: Array<() => Promise<void>>): Promise<void> {
        // Create a span for the entire workflow
        const workflowSpan = appInsights.startSpan(`workflow.${workflowName}`, {
            kind: OTelSpanKind.INTERNAL,
            attributes: {
                'workflow.name': workflowName,
                'workflow.steps': steps.length,
                'execution.count': ++this.executionCount
            }
        });
        
        if (!workflowSpan) {
            return Promise.all(steps.map(step => step())).then(() => {});
        }
        
        // Set workflow span as active
        const workflowScope = appInsights.setActiveSpan(workflowSpan);
        
        return (async () => {
            try {
                for (let i = 0; i < steps.length; i++) {
                    // Create a span for each step
                    const stepSpan = appInsights.startSpan(`workflow.step.${i + 1}`, {
                        kind: OTelSpanKind.INTERNAL,
                        attributes: {
                            'step.index': i,
                            'step.name': steps[i].name || `step-${i + 1}`
                        }
                    });
                    
                    if (stepSpan) {
                        const stepScope = appInsights.setActiveSpan(stepSpan);
                        
                        try {
                            await steps[i]();
                            stepSpan.setStatus({ code: eOTelSpanStatusCode.OK });
                        } catch (error) {
                            stepSpan.recordException(error);
                            stepSpan.setStatus({ 
                                code: eOTelSpanStatusCode.ERROR,
                                message: `Step ${i + 1} failed: ${error.message}`
                            });
                            throw error;
                        } finally {
                            stepScope.restore();
                            stepSpan.end();
                        }
                    } else {
                        await steps[i]();
                    }
                }
                
                workflowSpan.setAttribute('workflow.completed', true);
                workflowSpan.setStatus({ code: eOTelSpanStatusCode.OK });
                
            } catch (error) {
                workflowSpan.setAttribute('workflow.failed', true);
                workflowSpan.recordException(error);
                workflowSpan.setStatus({ 
                    code: eOTelSpanStatusCode.ERROR,
                    message: `Workflow failed: ${error.message}`
                });
                throw error;
                
            } finally {
                workflowScope.restore();
                workflowSpan.end();
            }
        })();
    }
}

// Usage
const workflow = new WorkflowEngine();

workflow.executeWorkflow('user-onboarding', [
    async () => { /* validate input */ },
    async () => { /* create user account */ },
    async () => { /* send welcome email */ },
    async () => { /* initialize preferences */ }
]).then(() => {
    console.log('Workflow completed successfully');
}).catch(error => {
    console.error('Workflow failed:', error);
});
```

### Pattern: Accessing Active Span in Nested Functions

```typescript
// Middleware pattern that checks active span
function withAuthentication<T>(operation: () => T): T {
    const activeSpan = appInsights.getActiveSpan();
    
    // Add authentication context to active span if it exists
    if (activeSpan && activeSpan.isRecording()) {
        const authToken = getCurrentAuthToken();
        activeSpan.setAttribute('auth.method', authToken ? 'token' : 'anonymous');
        activeSpan.setAttribute('auth.validated', true);
    }
    
    return operation();
}

// Usage - activeSpan is automatically propagated
const span = appInsights.startSpan('api-request');
if (span) {
    const scope = appInsights.setActiveSpan(span);
    
    try {
        // The activeSpan in withAuthentication will be 'span'
        const result = withAuthentication(() => {
            return performSecureOperation();
        });
        
        span.setAttribute('result', 'success');
    } finally {
        scope.restore();
        span.end();
    }
}
```

## Testing and Debugging

### Testing Pattern: Span Verification

```typescript
import { isReadableSpan } from '@microsoft/applicationinsights-core-js';

describe('Tracing Tests', () => {
    it('should create span with correct attributes', () => {
        const span = tracer.startSpan('test-operation');
        
        expect(span).toBeTruthy();
        expect(isReadableSpan(span)).toBe(true);
        
        span?.setAttribute('test.key', 'test-value');
        
        const spanContext = span?.spanContext();
        expect(spanContext?.traceId).toBeTruthy();
        expect(spanContext?.spanId).toBeTruthy();
        
        span?.end();
    });
    
    it('should create parent-child relationship', () => {
        tracer.startActiveSpan('parent', (parentSpan) => {
            const parentContext = parentSpan.spanContext();
            
            const childSpan = tracer.startSpan('child');
            const childContext = childSpan?.spanContext();
            
            // Same trace ID
            expect(childContext?.traceId).toBe(parentContext.traceId);
            
            // Different span IDs
            expect(childContext?.spanId).not.toBe(parentContext.spanId);
            
            childSpan?.end();
        });
    });
    
    it('should manage active span context correctly', () => {
        const span1 = appInsights.startSpan('span-1');
        const span2 = appInsights.startSpan('span-2');
        
        expect(span1).toBeTruthy();
        expect(span2).toBeTruthy();
        
        // Set span1 as active
        const scope1 = appInsights.setActiveSpan(span1!);
        expect(appInsights.getActiveSpan(false)?.spanContext().spanId).toBe(span1!.spanContext().spanId);
        
        // Set span2 as active (nested)
        const scope2 = appInsights.setActiveSpan(span2!);
        expect(appInsights.getActiveSpan(false)?.spanContext().spanId).toBe(span2!.spanContext().spanId);
        
        // Restore to span1
        scope2.restore();
        expect(appInsights.getActiveSpan(false)?.spanContext().spanId).toBe(span1!.spanContext().spanId);
        
        // Restore to previous context
        scope1.restore();
        
        span1?.end();
        span2?.end();
    });
});
```

### Debugging Pattern: Span Inspection

```typescript
function debugSpan(span: IReadableSpan | null): void {
    if (!span) {
        console.log('No span provided');
        return;
    }
    
    console.group('Span Debug Info');
    console.log('Name:', span.name);
    console.log('Kind:', span.kind);
    console.log('Started:', span.startTime);
    console.log('Ended:', span.ended);
    console.log('Duration:', span.duration);
    
    const context = span.spanContext();
    console.log('Trace ID:', context.traceId);
    console.log('Span ID:', context.spanId);
    console.log('Trace Flags:', context.traceFlags);
    
    console.log('Attributes:', span.attributes);
    console.log('Status:', span.status);
    console.log('Is Recording:', span.isRecording());
    
    console.groupEnd();
}

// Usage
const span = tracer.startSpan('debug-me');
span?.setAttribute('debug', true);
debugSpan(span);
span?.end();
```

## See Also

- [Main README](./README.md) - OpenTelemetry compatibility overview
- [OTel API Documentation](./otelApi.md) - Main API reference
- [Trace API Documentation](./traceApi.md) - Tracer and span management
- [withSpan Helper](./withSpan.md) - Context management helper
- [useSpan Helper](./useSpan.md) - Scope-aware context helper

---

These examples demonstrate real-world usage patterns for OpenTelemetry in Application Insights. Adapt them to your specific needs and follow the best practices outlined in each pattern.
