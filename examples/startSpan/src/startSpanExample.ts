// Example usage of the new startSpan implementation with withSpan helper
// This shows how to use the startSpan API to create spans and set distributed trace context
//
// The withSpan helper provides several benefits:
// 1. Automatic span context management - sets span as active during execution
// 2. Context restoration - restores previous active span after execution
// 3. Exception safety - ensures context is restored even if function throws
// 4. Cleaner code - eliminates manual span context management
// 5. Nested span support - handles complex span hierarchies automatically

import { AppInsightsCore, OTelSpanKind, eOTelSpanStatusCode, withSpan } from "@microsoft/applicationinsights-core-js";

// Example 1: Basic span creation with withSpan helper
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
    
    if (span) {
        // Use withSpan to execute work within the span's context
        const result = withSpan(core, span, () => {
            // Do some work within the span context...
            span.setAttribute("result", "success");
            // span.addEvent("Processing started"); // Not implemented yet
            
            // Create a child span that will automatically inherit the current active context
            const childSpan = core.startSpan("child-operation", {
                kind: OTelSpanKind.CLIENT,
                attributes: {
                    "http.method": "GET",
                    "http.url": "https://api.example.com/data"
                }
            });
            
            if (childSpan) {
                // Execute child work within its own span context
                withSpan(core, childSpan, () => {
                    // childSpan.addEvent("API call completed"); // Not implemented yet
                    childSpan.setStatus({ code: eOTelSpanStatusCode.OK });
                });
                childSpan.end();
            }
            
            return "operation completed";
        });
        
        // Complete the parent span
        // span.addEvent("Processing completed"); // Not implemented yet
        span.setStatus({ code: eOTelSpanStatusCode.OK });
        span.end();
        
        console.log("Operation result:", result);
    }
}

// Example 2: Manual parent context management with withSpan
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
            // Use withSpan to execute work within the span context
            // This ensures the span is properly active during execution
            withSpan(core, span, () => {
                // span.addEvent("Task started"); // Not implemented yet
                
                // Simulate some background work
                // In real scenarios, this could make HTTP requests, database calls, etc.
                // All will inherit this span's context automatically
                console.log("Executing background task with trace context:", span.spanContext().traceId);
                
                // Create a child operation within this context
                const childSpan = core.startSpan("background-subtask", {
                    kind: OTelSpanKind.INTERNAL,
                    attributes: {
                        "subtask.type": "data-processing"
                    }
                });
                
                if (childSpan) {
                    withSpan(core, childSpan, () => {
                        // This subtask automatically inherits the parent context
                        childSpan.setAttribute("processed.items", 42);
                    });
                    childSpan.end();
                }
                
                return "background work completed";
            });
            
            // span.addEvent("Task completed"); // Not implemented yet
            span.end();
        }
    }
}

// Example 3: Integration with existing telemetry using withSpan
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
        // Use withSpan to execute the entire checkout process within the span context
        const result = withSpan(core, userActionSpan, () => {
            // Now all subsequent telemetry will inherit this trace context
            // including dependency calls, custom events, etc.
            
            // Simulate processing steps
            // userActionSpan.addEvent("Validating cart"); // Not implemented yet
            console.log("Processing checkout for user in trace context:", userActionSpan.spanContext().traceId);
            
            // Create child span for payment processing
            const paymentSpan = core.startSpan("process-payment", {
                kind: OTelSpanKind.CLIENT,
                attributes: {
                    "payment.method": "credit_card",
                    "payment.amount": 99.99
                }
            });
            
            if (paymentSpan) {
                // Execute payment processing within its own span context
                const paymentResult = withSpan(core, paymentSpan, () => {
                    // paymentSpan.addEvent("Payment authorized"); // Not implemented yet
                    paymentSpan.setAttribute("payment.processor", "stripe");
                    paymentSpan.setAttribute("payment.status", "authorized");
                    paymentSpan.setStatus({ code: eOTelSpanStatusCode.OK });
                    
                    return { success: true, transactionId: "txn_12345" };
                });
                
                paymentSpan.end();
                
                // Update parent span with payment result
                userActionSpan.setAttribute("payment.success", paymentResult.success);
                userActionSpan.setAttribute("transaction.id", paymentResult.transactionId);
                
                return {
                    checkoutSuccess: true,
                    payment: paymentResult,
                    completedAt: new Date().toISOString()
                };
            }
            
            return { checkoutSuccess: false, error: "Payment processing failed" };
        });
        
        // Complete the user action span
        // userActionSpan.addEvent("Checkout completed"); // Not implemented yet
        userActionSpan.setStatus({ code: eOTelSpanStatusCode.OK });
        userActionSpan.end();
        
        console.log("Checkout completed:", result);
        return result;
    }
    
    return null;
}

export {
    exampleBasicSpanUsage,
    exampleManualParentContext,
    exampleWithTelemetry
};
