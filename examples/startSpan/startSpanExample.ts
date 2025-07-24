// Example usage of the new startSpan implementation
// This shows how to use the startSpan API to create spans and set distributed trace context

import { AppInsightsCore } from "../../shared/AppInsightsCore/src/JavaScriptSDK/AppInsightsCore";
import { OTelSpanKind } from "../../shared/AppInsightsCore/src/OpenTelemetry/interfaces/trace/IOTelSpanOptions";
import { SpanStatusCode } from "../../shared/AppInsightsCore/src/OpenTelemetry/interfaces/trace/IOTelSpan";

// Example 1: Basic span creation
function exampleBasicSpanUsage() {
    const core = new AppInsightsCore();
    
    // Initialize core (simplified)
    core.initialize({
        instrumentationKey: "your-ikey-here"
    }, []);
    
    // Create a span - this will automatically set it as the active trace context
    const span = core.startSpan("my-operation", {
        kind: OTelSpanKind.INTERNAL,
        attributes: {
            "operation.type": "example",
            "user.id": "123"
        }
    });
    
    // Do some work...
    span.setAttribute("result", "success");
    span.addEvent("Processing started");
    
    // Create a child span that will inherit the trace context
    const childSpan = core.startSpan("child-operation", {
        kind: OTelSpanKind.CLIENT,
        attributes: {
            "http.method": "GET",
            "http.url": "https://api.example.com/data"
        }
    });
    
    // Simulate some async work
    setTimeout(() => {
        childSpan.addEvent("API call completed");
        childSpan.setStatus({ code: SpanStatusCode.OK });
        childSpan.end();
        
        // Parent span completes
        span.addEvent("Processing completed");
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
    }, 100);
}

// Example 2: Manual parent context management
function exampleManualParentContext() {
    const core = new AppInsightsCore();
    
    // Get the current active trace context
    const currentTraceCtx = core.getTraceCtx();
    
    if (currentTraceCtx) {
        // Create a new span with explicit parent
        const span = core.startSpan("background-task", {
            kind: OTelSpanKind.INTERNAL,
            attributes: {
                "task.type": "background"
            }
        }, currentTraceCtx);
        
        // This span is now active and will propagate to HTTP requests, etc.
        span.addEvent("Task started");
        
        // Do some work...
        setTimeout(() => {
            span.addEvent("Task completed");
            span.end();
        }, 500);
    }
}

// Example 3: Integration with existing telemetry
function exampleWithTelemetry() {
    const core = new AppInsightsCore();
    
    // Start a span for a user action
    const userActionSpan = core.startSpan("user-checkout", {
        kind: OTelSpanKind.SERVER,
        attributes: {
            "user.id": "user123",
            "action": "checkout",
            "cart.items": 5
        }
    });
    
    // Now all subsequent telemetry will inherit this trace context
    // including dependency calls, custom events, etc.
    
    // Simulate processing steps
    userActionSpan.addEvent("Validating cart");
    
    // Create child span for payment processing
    const paymentSpan = core.startSpan("process-payment", {
        kind: OTelSpanKind.CLIENT,
        attributes: {
            "payment.method": "credit_card",
            "payment.amount": 99.99
        }
    });
    
    // Simulate payment processing
    setTimeout(() => {
        paymentSpan.addEvent("Payment authorized");
        paymentSpan.setStatus({ code: SpanStatusCode.OK });
        paymentSpan.end();
        
        userActionSpan.addEvent("Checkout completed");
        userActionSpan.setStatus({ code: SpanStatusCode.OK });
        userActionSpan.end();
    }, 200);
}

export {
    exampleBasicSpanUsage,
    exampleManualParentContext,
    exampleWithTelemetry
};
