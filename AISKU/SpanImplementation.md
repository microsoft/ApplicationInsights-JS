# OpenTelemetry-like Span Implementation

## Overview

ApplicationInsights now includes an OpenTelemetry-like span implementation that uses a provider pattern. This allows different SKUs to provide their own span implementations while the core SDK manages the lifecycle.

## Architecture

### Provider Pattern

The implementation uses a provider pattern similar to OpenTelemetry's TracerProvider:

- **Core SDK**: Manages span lifecycle through `ITraceProvider` interface
- **Web Package**: Provides concrete `AppInsightsTraceProvider` implementation
- **Other SKUs**: Can provide their own implementations

### Key Interfaces

- `IOTelSpan`: OpenTelemetry-like span interface (simplified)
- `IOTelSpanContext`: Span context with trace information
- `ITraceProvider`: Provider interface for creating spans
- `SpanOptions`: Options for creating spans

## Usage

### 1. Setup the Provider

```typescript
import { ApplicationInsights, AppInsightsTraceProvider } from "@microsoft/applicationinsights-web";

// Initialize ApplicationInsights
const appInsights = new ApplicationInsights({
    config: {
        connectionString: "YOUR_CONNECTION_STRING_HERE"
    }
});
appInsights.loadAppInsights();

// Register the trace provider
const traceProvider = new AppInsightsTraceProvider();
appInsights.appInsightsCore?.setTraceProvider(traceProvider);
```

### 2. Create and Use Spans

```typescript
import { SpanKind } from "@microsoft/applicationinsights-core-js";

// Start a span
const span = appInsights.appInsightsCore?.startSpan("operation-name", {
    kind: SpanKind.CLIENT,
    attributes: {
        "user.id": "12345",
        "operation.type": "http-request"
    }
});

if (span) {
    try {
        // Do some work...
        span.setAttribute("result", "success");
        
        // Create a child span
        const childSpan = appInsights.appInsightsCore?.startSpan(
            "child-operation", 
            {
                kind: SpanKind.INTERNAL
            }, 
            span.spanContext()  // Parent context
        );

        if (childSpan) {
            childSpan.setAttribute("step", "processing");
            childSpan.end();
        }

    } catch (error) {
        span.setAttribute("error", true);
        span.setAttribute("error.message", error.message);
    } finally {
        span.end();
    }
}
```

### 3. Check Provider Availability

```typescript
// Check if a trace provider is registered
const provider = appInsights.appInsightsCore?.getTraceProvider();
if (provider && provider.isAvailable()) {
    console.log(`Provider: ${provider.getProviderId()}`);
    // Use spans...
} else {
    console.log("No trace provider available");
}
```

## Provider Implementation

To create a custom trace provider for a different SKU:

```typescript
import { ITraceProvider, IOTelSpan, SpanOptions, IDistributedTraceContext } from "@microsoft/applicationinsights-core-js";

export class CustomTraceProvider implements ITraceProvider {
    public getProviderId(): string {
        return "custom-provider";
    }

    public isAvailable(): boolean {
        return true;
    }

    public createSpan(
        name: string,
        options?: SpanOptions,
        parent?: IDistributedTraceContext
    ): IOTelSpan {
        // Return your custom span implementation
        return new CustomSpan(name, options, parent);
    }
}
```

## Span Interface

The `IOTelSpan` interface provides these methods:

```typescript
interface IOTelSpan {
    // Core methods
    spanContext(): IOTelSpanContext;
    setAttribute(key: string, value: string | number | boolean): IOTelSpan;
    setAttributes(attributes: Record<string, string | number | boolean>): IOTelSpan;
    updateName(name: string): IOTelSpan;
    end(endTime?: number): void;
    isRecording(): boolean;
}
```

## Differences from OpenTelemetry

This is a simplified implementation focused on ApplicationInsights needs:

- **Removed**: `addEvent()` and `setStatus()` methods
- **Simplified**: Attribute handling for ES5 compatibility
- **Focused**: Integration with ApplicationInsights telemetry system

## Benefits

1. **Flexibility**: Different SKUs can provide tailored implementations
2. **Clean Separation**: Core manages lifecycle, providers handle creation
3. **OpenTelemetry-like**: Familiar API for developers
4. **Extensible**: Easy to add new span providers
5. **Type Safe**: Full TypeScript support with proper interfaces
