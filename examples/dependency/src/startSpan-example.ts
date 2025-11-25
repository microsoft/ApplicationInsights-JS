// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IReadableSpan } from "@microsoft/applicationinsights-core-js";
import {
    ApplicationInsights,
    OTelSpanKind
} from "@microsoft/applicationinsights-web";

/**
 * Example demonstrating the simplified OpenTelemetry-like span interface
 * which focuses on ApplicationInsights telemetry needs.
 *
 * Key features of the simplified interface:
 * - setAttribute/setAttributes for additional properties
 * - updateName for changing span names
 * - end() to complete spans
 * - isRecording() to check if span is active
 * - spanContext() for getting trace/span IDs
 *
 * Note: This implementation does NOT include:
 * - addEvent() - events are not part of this simplified interface
 * - setStatus() - status tracking is not part of this simplified interface
 *
 * Attributes set on spans are sent as additional properties with ApplicationInsights telemetry.
 */
export class StartSpanExample {
    private _appInsights: ApplicationInsights;

    constructor(appInsights: ApplicationInsights) {
        this._appInsights = appInsights;
    }

    /**
     * Basic span creation example showing simplified interface
     */
    public basicSpanExample(): IReadableSpan | null {
        if (!this._appInsights) {
            return null;
        }

        // Create a root span with attributes
        const span = this._appInsights.appInsights.core.startSpan("user-action", {
            kind: OTelSpanKind.SERVER,
            attributes: {
                "user.id": "user123",
                "action.type": "button_click",
                "component": "ui"
            }
        });

        // Check if span is available before using it
        if (!span) {
            console.warn("Span creation failed - tracing may not be enabled");
            return null;
        }

        // Set additional individual attributes
        span.setAttribute("session.id", "session456");
        span.setAttribute("page.url", window.location.href);

        // Set multiple attributes at once
        span.setAttributes({
            "browser.name": navigator.userAgent,
            "screen.resolution": `${screen.width}x${screen.height}`,
            "timestamp": Date.now()
        });

        // Update the span name if needed
        span.updateName("user-button-click");

        // Check if span is still recording
        console.log("Span is recording:", span.isRecording());

        // Get span context for trace/span IDs
        const spanContext = span.spanContext();
        console.log("Trace ID:", spanContext.traceId);
        console.log("Span ID:", spanContext.spanId);

        // End the span after some work
        setTimeout(() => {
            if (span) {
                span.end();
                console.log("Span ended. Still recording:", span.isRecording());
            }
        }, 1000);

        return span;
    }

    /**
     * Example showing child span creation for nested operations
     */
    public nestedSpanExample(): { parent: IReadableSpan, child: IReadableSpan } | null {
        if (!this._appInsights) {
            return null;
        }

        // Create parent span for overall operation
        const parentSpan = this._appInsights.appInsights.core.startSpan("data-processing", {
            kind: OTelSpanKind.INTERNAL,
            attributes: {
                "operation.type": "batch_process",
                "data.source": "user_upload"
            }
        });

        // Create child span for specific sub-operation
        // The child will automatically inherit the parent's trace context
        const childSpan = this._appInsights.appInsights.core.startSpan("validate-data", {
            kind: OTelSpanKind.INTERNAL,
            attributes: {
                "validation.rules": "strict",
                "data.format": "csv"
            }
        });

        // Check if spans are available before using them
        if (!parentSpan || !childSpan) {
            console.warn("Span creation failed - tracing may not be enabled");
            // Clean up any successfully created spans
            if (parentSpan) {
                parentSpan.end();
            }
            if (childSpan) {
                childSpan.end();
            }
            return null;
        }

        // Both spans share the same trace ID but have different span IDs
        console.log("Parent Trace ID:", parentSpan.spanContext().traceId);
        console.log("Child Trace ID:", childSpan.spanContext().traceId);
        console.log("Parent Span ID:", parentSpan.spanContext().spanId);
        console.log("Child Span ID:", childSpan.spanContext().spanId);

        // Simulate nested operations
        setTimeout(() => {
            // Child operation completes first
            if (childSpan) {
                childSpan.setAttribute("validation.result", "passed");
                childSpan.setAttribute("records.validated", 1500);
                childSpan.end();
            }

            // Parent operation completes after child
            setTimeout(() => {
                if (parentSpan) {
                    parentSpan.setAttribute("processing.result", "success");
                    parentSpan.setAttribute("total.records", 1500);
                    parentSpan.end();
                }
            }, 200);
        }, 800);

        return { parent: parentSpan, child: childSpan };
    }

    /**
     * Example showing HTTP request tracking with spans
     */
    public httpRequestSpanExample(): IReadableSpan | null {
        if (!this._appInsights) {
            return null;
        }

        // Create span for HTTP request
        const httpSpan = this._appInsights.appInsights.core.startSpan("api-call", {
            kind: OTelSpanKind.CLIENT,
            attributes: {
                "http.method": "POST",
                "http.url": "https://api.example.com/data",
                "http.user_agent": navigator.userAgent
            }
        });

        // Check if span is available before using it
        if (!httpSpan) {
            console.warn("HTTP span creation failed - tracing may not be enabled");
            return null;
        }

        // Simulate making an HTTP request
        fetch("https://api.example.com/data", {
            method: "POST",
            body: JSON.stringify({ test: "data" }),
            headers: {
                "Content-Type": "application/json"
            }
        }).then(response => {
            // Set response attributes
            if (httpSpan) {
                httpSpan.setAttribute("http.status_code", response.status);
                httpSpan.setAttribute("http.response.size", response.headers.get("content-length") || 0);
                
                if (response.ok) {
                    httpSpan.setAttribute("http.result", "success");
                } else {
                    httpSpan.setAttribute("http.result", "error");
                    httpSpan.setAttribute("error.message", `HTTP ${response.status}`);
                }
            }

            return response.json();
        }).then(data => {
            if (httpSpan) {
                httpSpan.setAttribute("response.records", data?.length || 0);
                httpSpan.end();
            }
        }).catch(error => {
            if (httpSpan) {
                httpSpan.setAttribute("http.result", "error");
                httpSpan.setAttribute("error.message", error.message);
                httpSpan.setAttribute("error.type", error.name);
                httpSpan.end();
            }
        });

        return httpSpan;
    }

    /**
     * Example showing manual trace context management
     */
    public manualTraceContextExample(): void {
        if (!this._appInsights) {
            return;
        }

        // Get current trace context
        const currentContext = this._appInsights.appInsights.core.getTraceCtx();
        console.log("Current trace context:", currentContext);

        // Create a span - this automatically becomes the active trace context
        const span = this._appInsights.appInsights.core.startSpan("background-task", {
            kind: OTelSpanKind.INTERNAL,
            attributes: {
                "task.priority": "low"
            }
        });

        // Check if span is available before using it
        if (!span) {
            console.warn("Background task span creation failed - tracing may not be enabled");
            return;
        }

        // The span's context is now active for distributed tracing
        const newContext = this._appInsights.appInsights.core.getTraceCtx();
        console.log("New trace context after span creation:", newContext);

        // Any HTTP requests or other telemetry will now include this trace context
        setTimeout(() => {
            if (span) {
                span.setAttribute("task.result", "completed");
                span.end();
            }
            
            // Context remains until explicitly changed or another span is created
            console.log("Trace context after span end:", this._appInsights?.appInsights.core.getTraceCtx());
        }, 500);
    }

    /**
     * Example showing span attribute best practices for ApplicationInsights
     */
    public attributeBestPracticesExample(): IReadableSpan | null {
        if (!this._appInsights) {
            return null;
        }

        const span = this._appInsights.appInsights.core.startSpan("business-operation", {
            kind: OTelSpanKind.INTERNAL,
            attributes: {
                // Use semantic naming conventions
                "operation.name": "calculate_price",
                "operation.version": "1.2.0",
                
                // Include business context
                "customer.tier": "premium",
                "product.category": "electronics",
                
                // Include technical context
                "service.name": "pricing-service",
                "service.version": "2.1.3"
            }
        });

        // Check if span is available before using it
        if (!span) {
            console.warn("Span creation failed - tracing may not be enabled");
            return null;
        }

        // Add dynamic attributes during operation
        span.setAttributes({
            "calculation.start_time": Date.now(),
            "input.items_count": 5,
            "pricing.rules_applied": "discount,tax,shipping"
        });

        // Simulate business logic
        setTimeout(() => {
            // Ensure span is still available in callback
            if (span) {
                // Add result attributes
                span.setAttribute("calculation.duration_ms", 150);
                span.setAttribute("output.base_price", 299.99);
                span.setAttribute("output.final_price", 254.99);
                span.setAttribute("discount.applied", 45.00);
                
                // These attributes will be sent as additional properties
                // with ApplicationInsights telemetry for correlation and analysis
                span.end();
            }
        }, 150);

        return span;
    }
}

/**
 * Helper function to initialize ApplicationInsights with startSpan support
 */
export function createApplicationInsightsWithSpanSupport(connectionString: string): ApplicationInsights {
    const appInsights = new ApplicationInsights({
        config: {
            connectionString: connectionString,
            // Enable distributed tracing for span context propagation
            disableAjaxTracking: false,
            disableFetchTracking: false,
            enableCorsCorrelation: true,
            enableRequestHeaderTracking: true,
            enableResponseHeaderTracking: true
        }
    });

    appInsights.loadAppInsights();
    return appInsights;
}

/**
 * Usage example
 */
export function runStartSpanExamples() {
    // Initialize ApplicationInsights
    const appInsights = createApplicationInsightsWithSpanSupport(
        "InstrumentationKey=YOUR_INSTRUMENTATION_KEY_GOES_HERE"
    );

    // Create example instance
    const examples = new StartSpanExample(appInsights);

    // Run examples
    console.log("Running basic span example...");
    examples.basicSpanExample();

    setTimeout(() => {
        console.log("Running nested span example...");
        examples.nestedSpanExample();
    }, 1500);

    setTimeout(() => {
        console.log("Running HTTP request span example...");
        examples.httpRequestSpanExample();
    }, 3000);

    setTimeout(() => {
        console.log("Running manual trace context example...");
        examples.manualTraceContextExample();
    }, 4500);

    setTimeout(() => {
        console.log("Running attribute best practices example...");
        examples.attributeBestPracticesExample();
    }, 6000);
}
