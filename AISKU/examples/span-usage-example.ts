// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * Example showing how to use the ApplicationInsights span functionality
 * with the provider pattern.
 */

import { ApplicationInsights, eOTelSpanKind } from "@microsoft/applicationinsights-web";

// Initialize ApplicationInsights
const appInsights = new ApplicationInsights({
    config: {
        connectionString: "YOUR_CONNECTION_STRING_HERE"
    }
});
appInsights.loadAppInsights();

// Example usage
function exampleSpanUsage() {
    // Start a span
    const span = appInsights.startSpan("example-operation", {
        kind: eOTelSpanKind.CLIENT,
        attributes: {
            "operation.name": "example",
            "user.id": "12345"
        }
    });

    if (span) {
        try {
            // Do some work...
            span.setAttribute("result", "success");
            span.setAttribute("duration", 100);
            
            // Create a child span
            const childSpan = appInsights.startSpan("child-operation", {
                kind: eOTelSpanKind.INTERNAL,
                startTime: Date.now()
            }, span.spanContext());

            if (childSpan) {
                // Do child work...
                childSpan.setAttribute("child.data", "value");
                childSpan.end();
            }

        } catch (error: any) {
            span.setAttribute("error", true);
            span.setAttribute("error.message", error.message);
        } finally {
            span.end();
        }
    }
}

// Example of checking if trace provider is available
function checkTraceProviderAvailability() {
    const provider = appInsights.getTraceProvider();
    if (provider && provider.isAvailable()) {
        console.log(`Trace provider available: ${provider.getProviderId()}`);
        exampleSpanUsage();
    } else {
        console.log("No trace provider available");
    }
}

export { exampleSpanUsage, checkTraceProviderAvailability };
