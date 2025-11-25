// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    ApplicationInsights, IConfiguration,
    DependencyListenerFunction, DependencyInitializerFunction, IDependencyInitializerHandler, IDependencyListenerHandler,
    OTelSpanKind
} from "@microsoft/applicationinsights-web";
import { generateNewConfig } from "./utils";

// Cache the previously initialized instance to avoid creating multiple instances
let _appInsights: ApplicationInsights;

export function initApplicationInsights(config?: IConfiguration) {
    
    if (!_appInsights) {
        // Make sure we have a configuration object
        config = config || {};
        if (!config.connectionString) {
            config.connectionString = "InstrumentationKey=YOUR_INSTRUMENTATION_KEY_GOES_HERE";
        }

        _appInsights = new ApplicationInsights({
            config: config
        });
       
        _appInsights.loadAppInsights();
        _appInsights.trackPageView(); // Manually call trackPageView to establish the current user/session/pageview

        return _appInsights;
    }

    return _appInsights;
}

/**
 * Use addDependencyListener to modify dependencyDetails if the SDK has been initialized
 */
export function addDependencyListener(dependencyListener: DependencyListenerFunction): IDependencyListenerHandler | null {
    if (_appInsights) {
        return _appInsights.addDependencyListener(dependencyListener);
    }
    return null;
}

/**
 * Use addDependencyInitializer to modify dependencyInitializerDetails if the SDK has been initialized
 */
export function addDependencyInitializer(dependencyInitializer: DependencyInitializerFunction): IDependencyInitializerHandler | null {
    if (_appInsights) {
        return _appInsights.addDependencyInitializer(dependencyInitializer);
    }
    return null;
}

/**
 * Use addDependencyInitializer to block any event from being reported
 */
export function stopDependencyEvent() {
    if (_appInsights) {
        _appInsights.addDependencyInitializer((details: any) => {
            // Check console to view details
            console.log("dependency event tracking is stopped, the following event will not be reported");
            console.log(details);
            // To stop any event from being reported
            return false;
        });
        return true;
    }
    return false;
   
}

/**
 * Get current config settings if the SDK has been initialized
 */
export function getConfig() {
    if (_appInsights) {
        let config = _appInsights["config"];
        console.log("current config");
        console.log(config);
        return config;
    }
    return null;
}

/**
 * Change current config settings dynamically if the SDK has been initialized
 */
export function changeConfig() {
    if (_appInsights) {
        let newConfig = generateNewConfig(); // generate new config object
        _appInsights.updateCfg(newConfig);   // change config merging any changes
        return true;
    }
    return false;
}

export function enableAjaxPerfTrackingConfig() {
    if (_appInsights && _appInsights.config.extensionConfig) {
        _appInsights.config.extensionConfig["AjaxDependencyPlugin"].enableAjaxPerfTracking = true;
        return true;
    }
    return false;
}

/**
 * Example of using the new OpenTelemetry trace API
 */
export function createSpanWithTraceAPI() {
    if (_appInsights) {
        // Get the OpenTelemetry trace API
        const trace = _appInsights.trace;
        
        // Get a tracer instance
        const tracer = trace.getTracer("example-service", "1.0.0");
        
        // Create a span using the OpenTelemetry API
        const span = tracer.startSpan("api-request", {
            kind: OTelSpanKind.SERVER,
            attributes: {
                "http.method": "POST",
                "http.url": "/api/users",
                "service.name": "user-service"
            }
        });

        if (!span) {
            console.warn("Failed to create span in createSpanWithTraceAPI");
            return null;
        }

        // Set additional attributes
        span.setAttribute("user.id", "12345");
        span.setAttributes({
            "request.size": 1024,
            "response.status_code": 200
        });

        // Simulate some async work
        setTimeout(() => {
            if (span) {
                // Update span name if needed
                span.updateName("api-request-completed");
                
                // End the span - this will automatically create telemetry
                span.end();
            }
        }, 800);

        return span;
    }
    return null;
}

/**
 * Example of using multiple tracers for different components
 */
export function createMultipleTracers() {
    if (_appInsights) {
        const trace = _appInsights.trace;
        
        // Get different tracers for different services
        const userServiceTracer = trace.getTracer("user-service", "1.2.3");
        const paymentServiceTracer = trace.getTracer("payment-service", "2.1.0");
        
        // Create spans from different tracers
        const userSpan = userServiceTracer.startSpan("validate-user", {
            attributes: { "component": "authentication" }
        });
        
        const paymentSpan = paymentServiceTracer.startSpan("process-payment", {
            attributes: { "component": "billing" }
        });

        if (!userSpan || !paymentSpan) {
            console.warn("Failed to create one or more spans in createMultipleTracers");
            return null;
        }

        // End spans after some work
        setTimeout(() => {
            if (userSpan) {
                userSpan.end();
            }
            if (paymentSpan) {
                paymentSpan.end();
            }
        }, 500);

        return { userSpan, paymentSpan };
    }
    return null;
}

/**
 * Example of using the new startSpan API for distributed tracing
 */
export function createExampleSpan() {
    if (_appInsights) {
        // Create a span for a user operation
        const span = _appInsights.core.startSpan("user-checkout", {
            kind: OTelSpanKind.SERVER,
            attributes: {
                "user.action": "checkout",
                "cart.items": 3,
                "component": "shopping-cart"
            }
        });

        // Check if span is available before using it
        if (!span) {
            console.warn("Span creation failed - tracing may not be enabled");
            return null;
        }

        // Set additional attributes
        span.setAttribute("order.total", 99.99);
        span.setAttributes({
            "payment.method": "credit_card",
            "shipping.method": "standard"
        });

        // Simulate some async work
        setTimeout(() => {
            if (span) {
                // Update span name if needed
                span.updateName("user-checkout-completed");
                
                // End the span
                span.end();
            }
        }, 1000);

        return span;
    }
    return null;
}

/**
 * Example of creating child spans for nested operations
 */
export function createChildSpanExample() {
    if (_appInsights) {
        // Create parent span
        const parentSpan = _appInsights.core.startSpan("process-order", {
            kind: OTelSpanKind.INTERNAL,
            attributes: {
                "order.id": "12345"
            }
        });

        // Create child span for payment processing
        const paymentSpan = _appInsights.core.startSpan("process-payment", {
            kind: OTelSpanKind.CLIENT,
            attributes: {
                "payment.processor": "stripe",
                "amount": 99.99
            }
        });

        // Check if spans are available before using them
        if (!parentSpan || !paymentSpan) {
            console.warn("Span creation failed - tracing may not be enabled");
            // Clean up any successfully created spans
            if (parentSpan) {
                parentSpan.end();
            }
            if (paymentSpan) {
                paymentSpan.end();
            }
            return null;
        }

        // Simulate payment processing
        setTimeout(() => {
            if (paymentSpan) {
                paymentSpan.setAttribute("payment.status", "success");
                paymentSpan.end();
            }

            // End parent span
            if (parentSpan) {
                parentSpan.setAttribute("order.status", "completed");
                parentSpan.end();
            }
        }, 500);

        return { parentSpan, paymentSpan };
    }
    return null;
}


