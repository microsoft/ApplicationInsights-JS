// Example usage of the new startSpan implementation
// This shows how to use the startSpan API to create spans and set distributed trace context

import { AppInsightsCore } from "../../shared/AppInsightsCore/src/JavaScriptSDK/AppInsightsCore";
import { OTelSpanKind } from "../../shared/AppInsightsCore/src/OpenTelemetry/interfaces/trace/IOTelSpanOptions";
import { eOTelSpanStatusCode } from "../../shared/AppInsightsCore/src/OpenTelemetry/enums/trace/OTelSpanStatus";

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
    if (span) {
        span.setAttribute("result", "success");
        // span.addEvent("Processing started"); // Not implemented yet
    }
    
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
        if (childSpan) {
            // childSpan.addEvent("API call completed"); // Not implemented yet
            childSpan.setStatus({ code: eOTelSpanStatusCode.OK });
            childSpan.end();
        }
        
        if (span) {
            // Parent span completes
            // span.addEvent("Processing completed"); // Not implemented yet
            span.setStatus({ code: eOTelSpanStatusCode.OK });
            span.end();
        }
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
        
        if (span) {
            // This span is now active and will propagate to HTTP requests, etc.
            // span.addEvent("Task started"); // Not implemented yet
            
            // Do some work...
            setTimeout(() => {
                // span.addEvent("Task completed"); // Not implemented yet
                span.end();
            }, 500);
        }
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
    
    if (userActionSpan) {
        // Now all subsequent telemetry will inherit this trace context
        // including dependency calls, custom events, etc.
        
        // Simulate processing steps
        // userActionSpan.addEvent("Validating cart"); // Not implemented yet
    
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
        if (paymentSpan) {
            // paymentSpan.addEvent("Payment authorized"); // Not implemented yet
            paymentSpan.setStatus({ code: eOTelSpanStatusCode.OK });
            paymentSpan.end();
        }
        
        if (userActionSpan) {
            // userActionSpan.addEvent("Checkout completed"); // Not implemented yet
            userActionSpan.setStatus({ code: eOTelSpanStatusCode.OK });
            userActionSpan.end();
        }
    }, 200);
    }
}

export {
    exampleBasicSpanUsage,
    exampleManualParentContext,
    exampleWithTelemetry
};
