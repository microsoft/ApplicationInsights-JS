# OTelClientSdk Usage Examples

This document provides code examples for common scenarios when using the OTelClientSdk. These examples demonstrate how to configure and use the SDK for tracing, logging, and metrics with explicit instance creation, leveraging interfaces for clean API design.

## Table of Contents

- [Basic Setup](#basic-setup)
- [Advanced Configuration](#advanced-configuration)
- [Web Browser Integration](#web-browser-integration)
- [Tracing Examples](#tracing-examples)
- [Logging Examples](#logging-examples)
- [Metrics Examples](#metrics-examples)
- [Context Propagation](#context-propagation)
- [Resource Management](#resource-management)
- [Custom Processors](#custom-processors)
- [Framework Integration](#framework-integration)
- [Migrating from Standard OpenTelemetry SDK](#migrating-from-standard-opentelemetry-sdk)
- [Migrating from Classic ApplicationInsights SDK](#migrating-from-classic-applicationinsights-sdk)
- [Configuration Management](#configuration-management)

## Basic Setup

### Simple SDK Initialization

```typescript
import { createOTelClientSdk, createResource, IOTelClientSdk, IResource } from '@microsoft/applicationinsights-otelclientsdk';

// Create the resource that represents your application
const resource: IResource = createResource({
  'service.name': 'my-web-app',
  'service.version': '1.0.0',
  'deployment.environment': 'production'
});

// Create the SDK with Azure Monitor integration
const sdk: IOTelClientSdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key-here',
  resource
});

// Application shutdown
window.addEventListener('unload', async () => {
  await sdk.shutdown();
});
```

### Configuring Providers

```typescript
import { 
  createOTelClientSdk, 
  createBatchSpanProcessor, 
  createAzureMonitorSpanExporter,
  createBatchLogRecordProcessor,
  createAzureMonitorLogRecordExporter,
  createMetricReader,
  createAzureMonitorMetricExporter,
  createResource,
  IOTelClientSdk,
  ISpanProcessor,
  ILogRecordProcessor,
  IMetricReader,
  IResource
} from '@microsoft/applicationinsights-otelclientsdk';

// Create exporters
const spanExporter = createAzureMonitorSpanExporter({
  connectionString: 'InstrumentationKey=your-key-here'
});

const logExporter = createAzureMonitorLogRecordExporter({
  connectionString: 'InstrumentationKey=your-key-here'
});

const metricExporter = createAzureMonitorMetricExporter({
  connectionString: 'InstrumentationKey=your-key-here'
});

// Create processors
const spanProcessor: ISpanProcessor = createBatchSpanProcessor(spanExporter, {
  maxQueueSize: 100,
  scheduledDelayMs: 5000
});

const logProcessor: ILogRecordProcessor = createBatchLogRecordProcessor(logExporter, {
  maxQueueSize: 100,
  scheduledDelayMs: 5000
});

const metricReader: IMetricReader = createMetricReader(metricExporter, {
  exportIntervalMs: 60000
});

// Create the SDK
const sdk: IOTelClientSdk = createOTelClientSdk({
  resource: createResource({
    'service.name': 'my-web-app',
    'service.version': '1.0.0'
  })
});

// Configure providers
sdk.traceProvider.addSpanProcessor(spanProcessor);
sdk.loggerProvider.addLogRecordProcessor(logProcessor);
sdk.meterProvider.addMetricReader(metricReader);
```

## Advanced Configuration

### Sampling Configuration

```typescript
import { 
  createOTelClientSdk, 
  createParentBasedSampler,
  createTraceIdRatioSampler,
  SamplingDecision,
  IOTelClientSdk,
  ISampler
} from '@microsoft/applicationinsights-otelclientsdk';

// Create a sampler that samples 20% of traces
const rootSampler: ISampler = createTraceIdRatioSampler(0.2);

// Create a parent-based sampler that respects parent sampling decisions
const sampler: ISampler = createParentBasedSampler({
  root: rootSampler,
  remoteParentSampled: { shouldSample: () => SamplingDecision.RECORD_AND_SAMPLE },
  remoteParentNotSampled: { shouldSample: () => SamplingDecision.NOT_RECORD },
  localParentSampled: { shouldSample: () => SamplingDecision.RECORD_AND_SAMPLE },
  localParentNotSampled: { shouldSample: () => SamplingDecision.NOT_RECORD }
});

// Create the SDK with the custom sampler
const sdk: IOTelClientSdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key-here',
  traceConfig: {
    sampler
  }
});
```

### Configuring Export Behavior

```typescript
import { 
  createOTelClientSdk, 
  createBatchSpanProcessor,
  createAzureMonitorSpanExporter,
  IOTelClientSdk,
  ISpanExporter,
  ISpanProcessor
} from '@microsoft/applicationinsights-otelclientsdk';

const spanExporter: ISpanExporter = createAzureMonitorSpanExporter({
  connectionString: 'InstrumentationKey=your-key-here',
  throttleOptions: {
    maxQps: 100,
    maxBackoffSeconds: 30
  }
});

const spanProcessor: ISpanProcessor = createBatchSpanProcessor(spanExporter, {
  maxQueueSize: 2000,           // Maximum number of spans to queue
  scheduledDelayMs: 5000,       // How long to wait before sending a batch
  exportTimeoutMs: 30000,       // How long to wait for export before timing out
  maxExportBatchSize: 512       // Maximum batch size
});

const sdk: IOTelClientSdk = createOTelClientSdk({});
sdk.traceProvider.addSpanProcessor(spanProcessor);
```

## Web Browser Integration

### Auto-Instrumentation

```typescript
import { 
  createOTelClientSdk,
  registerBrowserInstrumentation,
  FetchInstrumentation,
  XMLHttpRequestInstrumentation,
  UserInteractionInstrumentation,
  DocumentLoadInstrumentation,
  IOTelClientSdk,
  IInstrumentation
} from '@microsoft/applicationinsights-otelclientsdk';

// Create the SDK
const sdk: IOTelClientSdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key-here'
});

// Register browser instrumentation
registerBrowserInstrumentation(sdk, {
  instrumentations: [
    new FetchInstrumentation({
      ignoreUrls: [/localhost:8080\/status/]
    }),
    new XMLHttpRequestInstrumentation({
      ignoreUrls: [/localhost:8080\/status/]
    }),
    new UserInteractionInstrumentation(),
    new DocumentLoadInstrumentation()
  ] as IInstrumentation[]
});
```

### Single Page Application (SPA) Router Integration

```typescript
import { 
  createOTelClientSdk,
  createRouterInstrumentation,
  IOTelClientSdk,
  IRouterInstrumentation
} from '@microsoft/applicationinsights-otelclientsdk';
import { Router } from 'your-router-library';

// Create the SDK
const sdk: IOTelClientSdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key-here'
});

// Create router instrumentation
const routerInstrumentation: IRouterInstrumentation = createRouterInstrumentation({
  historyMode: true
});

// Initialize router
const router = new Router();

// Register router with instrumentation
routerInstrumentation.registerRouter(router);
routerInstrumentation.start(sdk);
```

## Tracing Examples

### Creating and Managing Spans

```typescript
import { 
  createOTelClientSdk, 
  eSpanKind, 
  eSpanStatusCode,
  SpanKind,
  SpanStatusCode,
  IOTelClientSdk,
  ITracer,
  ISpan
} from '@microsoft/applicationinsights-otelclientsdk';

const sdk: IOTelClientSdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key-here'
});

// Get a tracer
const tracer: ITracer = sdk.traceProvider.getTracer('my-component', '1.0.0');

// Create and end a span
const span: ISpan = tracer.startSpan('process-data', {
  kind: eSpanKind.INTERNAL,
  attributes: {
    'data.size': 1024,
    'data.type': 'json'
  }
});

// Add attributes
span.setAttribute('processing.batchId', '12345');

// Add events
span.addEvent('data.validation.started', {
  timestamp: performance.now()
});

span.addEvent('data.validation.completed', {
  validationTime: 15,
  records: 100
});

// Handle errors
try {
  // Do work...
  
  // Set success status
  span.setStatus({ code: eSpanStatusCode.OK });
} catch (e) {
  // Record the exception
  span.recordException(e);
  
  // Set error status
  span.setStatus({
    code: eSpanStatusCode.ERROR,
    message: e.message
  });
  
  throw e;
} finally {
  // End the span
  span.end();
}
```

### Creating Active Spans

```typescript
import { 
  createOTelClientSdk, 
  IOTelClientSdk,
  ITracer,
  ISpan,
  SpanStatusCode
} from '@microsoft/applicationinsights-otelclientsdk';

const sdk: IOTelClientSdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key-here'
});

const tracer: ITracer = sdk.traceProvider.getTracer('my-component');

// Using startActiveSpan to automatically manage span lifetime
const result = tracer.startActiveSpan('process-data', {}, undefined, (span: ISpan) => {
  try {
    // Do work...
    span.setAttribute('processing.items', 100);
    
    const result = processItems();
    
    // Span is automatically ended when the callback completes
    return result;
  } catch (e) {
    span.recordException(e);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: e.message
    });
    throw e;
  }
});
```

### Nested Spans

```typescript
import { 
  createOTelClientSdk,
  IOTelClientSdk,
  ITracer,
  ISpan
} from '@microsoft/applicationinsights-otelclientsdk';

const sdk: IOTelClientSdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key-here'
});

const tracer: ITracer = sdk.traceProvider.getTracer('my-component');

async function processData() {
  return tracer.startActiveSpan('process-data', {}, undefined, async (parentSpan: ISpan) => {
    // Do initial work...
    parentSpan.setAttribute('data.type', 'customer');
    
    // Create child spans
    await tracer.startActiveSpan('validate-data', {}, undefined, async (validationSpan: ISpan) => {
      // Validation logic
      validationSpan.addEvent('validation.complete');
    });
    
    await tracer.startActiveSpan('transform-data', {}, undefined, async (transformSpan: ISpan) => {
      // Transform logic
      transformSpan.setAttribute('transformation.type', 'normalize');
    });
    
    await tracer.startActiveSpan('save-data', {}, undefined, async (saveSpan: ISpan) => {
      // Save logic
      saveSpan.setAttribute('database.operation', 'insert');
    });
    
    return { success: true };
  });
}
```

## Logging Examples

### Basic Logging

```typescript
import { 
  createOTelClientSdk, 
  eSeverityNumber,
  SeverityNumber,
  IOTelClientSdk,
  ILogger,
  ILogRecord
} from '@microsoft/applicationinsights-otelclientsdk';

const sdk: IOTelClientSdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key-here'
});

// Get a logger
const logger: ILogger = sdk.loggerProvider.getLogger('my-component', '1.0.0');

// Log with different severity levels
logger.emit({
  severityNumber: eSeverityNumber.INFO,
  severityText: 'INFO',
  body: 'Application started successfully',
  attributes: {
    'app.version': '1.0.0'
  }
} as ILogRecord);

logger.emit({
  severityNumber: eSeverityNumber.ERROR,
  severityText: 'ERROR',
  body: 'Failed to connect to database',
  attributes: {
    'db.name': 'customers',
    'error.type': 'connection_failed'
  }
} as ILogRecord);
```

### Structured Logging

```typescript
import { 
  createOTelClientSdk, 
  SeverityNumber,
  IOTelClientSdk,
  ILogger,
  ILogRecord
} from '@microsoft/applicationinsights-otelclientsdk';

const sdk: IOTelClientSdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key-here'
});

const logger: ILogger = sdk.loggerProvider.getLogger('my-component');

// Structured logging with object bodies
logger.emit({
  severityNumber: SeverityNumber.ERROR,
  severityText: 'ERROR',
  body: {
    message: 'Payment processing failed',
    transaction: {
      id: 'tx_12345',
      amount: 99.95,
      currency: 'USD'
    },
    customer: {
      id: 'cust_987',
      region: 'us-west'
    },
    error: {
      code: 'INSUFFICIENT_FUNDS',
      details: 'Available balance too low for transaction'
    }
  }
} as ILogRecord);
```

### Linking Logs to Traces

```typescript
import { 
  createOTelClientSdk, 
  SeverityNumber, 
  SpanStatusCode,
  IOTelClientSdk,
  ITracer,
  ILogger,
  ISpan,
  ILogRecord
} from '@microsoft/applicationinsights-otelclientsdk';

const sdk: IOTelClientSdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key-here'
});

const tracer: ITracer = sdk.traceProvider.getTracer('my-component');
const logger: ILogger = sdk.loggerProvider.getLogger('my-component');

// Start a span
const span: ISpan = tracer.startSpan('process-payment');

try {
  // Link logs to the current span
  logger.emit({
    severityNumber: SeverityNumber.INFO,
    severityText: 'INFO',
    body: 'Starting payment processing',
    attributes: {
      'payment.id': 'pay_12345'
    },
    spanContext: span.spanContext() // This connects the log to the span
  } as ILogRecord);
  
  // Process payment...
  
  logger.emit({
    severityNumber: SeverityNumber.INFO,
    severityText: 'INFO',
    body: 'Payment processed successfully',
    attributes: {
      'payment.id': 'pay_12345',
      'payment.status': 'completed'
    },
    spanContext: span.spanContext()
  } as ILogRecord);
  
  span.setStatus({ code: SpanStatusCode.OK });
} catch (e) {
  logger.emit({
    severityNumber: SeverityNumber.ERROR,
    severityText: 'ERROR',
    body: `Payment processing failed: ${e.message}`,
    attributes: {
      'payment.id': 'pay_12345',
      'payment.status': 'failed',
      'error.type': e.name,
      'error.message': e.message
    },
    spanContext: span.spanContext()
  } as ILogRecord);
  
  span.recordException(e);
  span.setStatus({ code: SpanStatusCode.ERROR, message: e.message });
} finally {
  span.end();
}
```

## Metrics Examples

### Counter Metric

```typescript
import { 
  createOTelClientSdk,
  IOTelClientSdk,
  IMeter,
  ICounter
} from '@microsoft/applicationinsights-otelclientsdk';

const sdk: IOTelClientSdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key-here'
});

// Get a meter
const meter: IMeter = sdk.meterProvider.getMeter('my-component', '1.0.0');

// Create a counter
const requestCounter: ICounter = meter.createCounter('http.requests', {
  description: 'Number of HTTP requests',
  unit: '1'
});

// Record metric values
function recordRequest(route: string, statusCode: number): void {
  requestCounter.add(1, {
    'http.route': route,
    'http.status_code': statusCode
  });
}

// Usage
recordRequest('/api/users', 200);
recordRequest('/api/orders', 500);
```

### Histogram Metric

```typescript
import { 
  createOTelClientSdk,
  IOTelClientSdk,
  IMeter,
  IHistogram
} from '@microsoft/applicationinsights-otelclientsdk';

const sdk: IOTelClientSdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key-here'
});

const meter: IMeter = sdk.meterProvider.getMeter('my-component');

// Create a histogram
const requestDuration: IHistogram = meter.createHistogram('http.request.duration', {
  description: 'HTTP request duration',
  unit: 'ms'
});

// Record duration measurements
function trackRequestDuration(route: string, durationMs: number): void {
  requestDuration.record(durationMs, {
    'http.route': route
  });
}

// Usage
trackRequestDuration('/api/users', 45.2);
trackRequestDuration('/api/orders', 132.7);
```

### Up/Down Counter

```typescript
import { 
  createOTelClientSdk,
  IOTelClientSdk,
  IMeter,
  IUpDownCounter
} from '@microsoft/applicationinsights-otelclientsdk';

const sdk: IOTelClientSdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key-here'
});

const meter: IMeter = sdk.meterProvider.getMeter('my-component');

// Create an up/down counter for active connections
const activeConnections: IUpDownCounter = meter.createUpDownCounter('system.connections.active', {
  description: 'Number of active connections',
  unit: '1'
});

// Track connections
function connectionOpened(clientId: string): void {
  activeConnections.add(1, {
    'client.id': clientId
  });
}

function connectionClosed(clientId: string): void {
  activeConnections.add(-1, {
    'client.id': clientId
  });
}

// Usage
connectionOpened('client-123');
connectionOpened('client-456');
connectionClosed('client-123');
```

## Context Propagation

### Manual Context Propagation

```typescript
import { 
  createOTelClientSdk, 
  SpanKind,
  IOTelClientSdk,
  ITracer,
  ISpan,
  IContext,
  IContextManager,
  IPropagator,
  SpanStatusCode
} from '@microsoft/applicationinsights-otelclientsdk';

const sdk: IOTelClientSdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key-here'
});

const tracer: ITracer = sdk.traceProvider.getTracer('my-component');
const contextManager: IContextManager = sdk.contextManager;
const propagator: IPropagator = sdk.propagator;

// Start a parent span
const parentSpan: ISpan = tracer.startSpan('parent-operation', {
  kind: eSpanKind.CLIENT
});

// Create a context with the span
let ctx: IContext = contextManager.active();
ctx = contextManager.setValue(ctx, 'userdata.id', 'user-123');
ctx = contextManager.setValue(ctx, 'active.span', parentSpan);

// Send an HTTP request with context propagation
async function makeHttpRequest(url: string, method: string, context: IContext): Promise<Response> {
  // Extract span from context
  const span = contextManager.getValue<ISpan>(context, 'active.span');
  const userId = contextManager.getValue<string>(context, 'userdata.id');
  
  // Create headers object
  const headers: Record<string, string> = {};
  
  // Inject trace context into headers
  propagator.inject(context, headers, (carrier, key, value) => {
    carrier[key] = value;
  });
  
  console.log(`Making ${method} request to ${url} with userId: ${userId}`);
  console.log('Propagated headers:', headers);
  
  // Make the request with propagated headers
  const response = await fetch(url, {
    method,
    headers
  });
  
  return response;
}

// Use the context manager to execute with the context
contextManager.with(ctx, async () => {
  try {
    await makeHttpRequest('https://api.example.com/data', 'GET', ctx);
    parentSpan.setStatus({ code: SpanStatusCode.OK });
  } catch (e) {
    parentSpan.recordException(e);
    parentSpan.setStatus({ code: SpanStatusCode.ERROR, message: e.message });
  } finally {
    parentSpan.end();
  }
});
```

### Extracting Context

```typescript
import { 
  createOTelClientSdk,
  SpanKind,
  SpanStatusCode,
  IOTelClientSdk,
  ITracer,
  IContextManager,
  IPropagator,
  IContext,
  ISpan
} from '@microsoft/applicationinsights-otelclientsdk';

const sdk: IOTelClientSdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key-here'
});

const tracer: ITracer = sdk.traceProvider.getTracer('my-component');
const contextManager: IContextManager = sdk.contextManager;
const propagator: IPropagator = sdk.propagator;

// Server-side code receiving a request
function handleRequest(req: { headers: Record<string, string> }): any {
  // Create a new context
  let ctx: IContext = contextManager.createContext();
  
  // Extract trace context from request headers
  ctx = propagator.extract(ctx, req.headers, (carrier, key) => {
    return carrier[key];
  });
  
  // Start a new span as child of the extracted context
  return contextManager.with(ctx, () => {
    const span: ISpan = tracer.startSpan('handle-request', {
      kind: eSpanKind.SERVER
    });
    
    try {
      // Process the request
      const result = processRequest(req);
      span.setStatus({ code: eSpanStatusCode.OK });
      return result;
    } catch (e) {
      span.recordException(e);
      span.setStatus({ code: eSpanStatusCode.ERROR, message: e.message });
      throw e;
    } finally {
      span.end();
    }
  });
}
```

## Resource Management

### Creating and Configuring Resources

```typescript
import { 
  createOTelClientSdk, 
  createResource, 
  SEMRESATTRS_SERVICE_NAME,
  IOTelClientSdk,
  IResource
} from '@microsoft/applicationinsights-otelclientsdk';

// Create a resource with service information
const resource: IResource = createResource({
  [SEMRESATTRS_SERVICE_NAME]: 'inventory-service',
  'service.version': '2.5.7',
  'service.instance.id': 'instance-1',
  'deployment.environment': 'production'
});

// Service-level attributes
const serviceResource: IResource = createResource({
  'service.namespace': 'ecommerce',
  'service.codebase': 'git@github.com:example/inventory-service.git'
});

// Host-level attributes
const hostResource: IResource = createResource({
  'host.name': 'web-1',
  'host.type': 'container',
  'cloud.provider': 'azure',
  'cloud.region': 'westus2'
});

// Merge resources
const mergedResource: IResource = resource.merge(serviceResource).merge(hostResource);

// Create the SDK with the merged resource
const sdk: IOTelClientSdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key-here',
  resource: mergedResource
});
```

## Custom Processors

### Custom Span Processor

```typescript
import { 
  createOTelClientSdk,
  IOTelClientSdk,
  ISpanProcessor,
  ISpan
} from '@microsoft/applicationinsights-otelclientsdk';

// Create a custom span processor that adds attributes to all spans
class EnrichmentSpanProcessor implements ISpanProcessor {
  private readonly _commonAttributes: Record<string, string>;
  
  constructor(attributes: Record<string, string>) {
    this._commonAttributes = attributes;
  }
  
  onStart(span: ISpan): void {
    // Add common attributes to every span when it starts
    Object.entries(this._commonAttributes).forEach(([key, value]) => {
      span.setAttribute(key, value);
    });
  }
  
  onEnd(span: ISpan): void {
    // No action needed on end
  }
  
  async shutdown(): Promise<void> {
    // No resources to clean up
  }
  
  async forceFlush(): Promise<void> {
    // No batching, nothing to flush
  }
}

// Create the SDK
const sdk: IOTelClientSdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key-here'
});

// Add the custom processor
sdk.traceProvider.addSpanProcessor(new EnrichmentSpanProcessor({
  'deployment.id': 'deployment-abc123',
  'team.name': 'frontend-team'
}));
```

### Custom Log Processor

```typescript
import { 
  createOTelClientSdk, 
  createBatchLogRecordProcessor,
  createAzureMonitorLogRecordExporter,
  SeverityNumber,
  IOTelClientSdk,
  ILogRecordProcessor,
  ILogRecord
} from '@microsoft/applicationinsights-otelclientsdk';

// Create a custom log processor that filters logs
class FilteringLogProcessor implements ILogRecordProcessor {
  private readonly _severityThreshold: number;
  private readonly _nextProcessor: ILogRecordProcessor;
  
  constructor(severityThreshold: number, nextProcessor: ILogRecordProcessor) {
    this._severityThreshold = severityThreshold;
    this._nextProcessor = nextProcessor;
  }
  
  onEmit(logRecord: ILogRecord): void {
    // Only forward logs that meet the severity threshold
    if (logRecord.severityNumber >= this._severityThreshold) {
      this._nextProcessor.onEmit(logRecord);
    }
  }
  
  async shutdown(): Promise<void> {
    return this._nextProcessor.shutdown();
  }
  
  async forceFlush(): Promise<void> {
    return this._nextProcessor.forceFlush();
  }
}

// Create the SDK
const sdk: IOTelClientSdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key-here'
});

// Create the regular processor
const batchProcessor = createBatchLogRecordProcessor(
  createAzureMonitorLogRecordExporter({
    connectionString: 'InstrumentationKey=your-key-here'
  })
);

// Add the custom filtering processor
sdk.loggerProvider.addLogRecordProcessor(
  new FilteringLogProcessor(eSeverityNumber.WARN, batchProcessor)
);
```

## Framework Integration

### React Integration

```typescript
import React from 'react';
import ReactDOM from 'react-dom';
import { 
  createOTelClientSdk, 
  createReactTracingProvider,
  createReactErrorBoundary,
  IOTelClientSdk,
  ITracingProviderProps,
  IErrorBoundaryProps
} from '@microsoft/applicationinsights-otelclientsdk-react';

// Create the SDK
const sdk: IOTelClientSdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key-here'
});

// Create React providers
const TracingProvider = createReactTracingProvider(sdk);
const ErrorBoundary = createReactErrorBoundary(sdk);

// Your React application
const App = () => {
  return (
    <div>
      <h1>My Application</h1>
      {/* Application components */}
    </div>
  );
};

// Props for tracing provider
const tracingProps: ITracingProviderProps = {
  serviceName: "my-react-app",
  serviceVersion: "1.0.0"
};

// Props for error boundary
const errorProps: IErrorBoundaryProps = {
  fallback: <div>Something went wrong</div>
};

// Render with providers
ReactDOM.render(
  <TracingProvider {...tracingProps}>
    <ErrorBoundary {...errorProps}>
      <App />
    </ErrorBoundary>
  </TracingProvider>,
  document.getElementById('root')
);
```

### Angular Integration

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { 
  OTelClientSdkModule, 
  createOTelClientSdk,
  IOTelClientSdk,
  IOTelClientSdkModuleOptions 
} from '@microsoft/applicationinsights-otelclientsdk-angular';

import { AppComponent } from './app.component';

// Create the SDK
const sdk: IOTelClientSdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key-here'
});

// Module options
const moduleOptions: IOTelClientSdkModuleOptions = {
  sdk,
  serviceName: 'my-angular-app',
  serviceVersion: '1.0.0',
  instrumentationOptions: {
    routingInstrumentation: true,
    httpClientInstrumentation: true,
    errorHandlerInstrumentation: true
  }
};

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    OTelClientSdkModule.forRoot(moduleOptions)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

## Migrating from Standard OpenTelemetry SDK

### Before: Standard OpenTelemetry SDK

```typescript
import * as api from '@opentelemetry/api';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { Resource } from '@opentelemetry/resources';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { ZoneContextManager } from '@opentelemetry/context-zone';

// Create a standard OTel provider
const provider = new WebTracerProvider({
  resource: new Resource({
    'service.name': 'my-service'
  })
});

// Configure span processor and exporter
const exporter = new OTLPTraceExporter({
  url: 'https://your-collector-url/v1/traces'
});
provider.addSpanProcessor(new BatchSpanProcessor(exporter));

// Register provider and instrumentations
provider.register({
  contextManager: new ZoneContextManager()
});

// Register instrumentations
registerInstrumentations({
  instrumentations: [
    new FetchInstrumentation()
  ]
});

// Get a tracer from global API
const tracer = api.trace.getTracer('my-component');

// Create spans
const span = tracer.startSpan('my-operation');
span.setAttribute('key', 'value');
span.end();
```

### After: OTelClientSdk

```typescript
import { 
  createOTelClientSdk, 
  createBatchSpanProcessor,
  createOTLPTraceExporter,
  registerBrowserInstrumentation,
  createResource,
  IOTelClientSdk,
  ITracer,
  ISpan,
  FetchInstrumentation
} from '@microsoft/applicationinsights-otelclientsdk';

// Create the SDK with explicit instance creation
const sdk: IOTelClientSdk = createOTelClientSdk({
  resource: createResource({
    'service.name': 'my-service'
  })
});

// Configure exporter and processor
const exporter = createOTLPTraceExporter({
  url: 'https://your-collector-url/v1/traces'
});
sdk.traceProvider.addSpanProcessor(createBatchSpanProcessor(exporter));

// Register instrumentations
registerBrowserInstrumentation(sdk, {
  instrumentations: [
    new FetchInstrumentation()
  ]
});

// Get a tracer directly from the provider
const tracer: ITracer = sdk.traceProvider.getTracer('my-component');

// Create spans (similar API)
const span: ISpan = tracer.startSpan('my-operation');
span.setAttribute('key', 'value');
span.end();
```

## Migrating from Classic ApplicationInsights SDK

### Before: Classic ApplicationInsights

```typescript
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

// Initialize AppInsights
const appInsights = new ApplicationInsights({
  config: {
    instrumentationKey: 'your-key',
    enableAutoRouteTracking: true,
    enableCorsCorrelation: true,
    enableRequestHeaderTracking: true,
    enableResponseHeaderTracking: true
  }
});

appInsights.loadAppInsights();

// Track events and metrics
appInsights.trackEvent({
  name: 'UserLogin',
  properties: {
    'user.id': 'user-123',
    'user.type': 'premium'
  }
});

appInsights.trackMetric({
  name: 'processingTime',
  average: 42.5
});

// Track page views
appInsights.trackPageView();

// Track dependencies
appInsights.trackDependencyData({
  id: 'dependency-123',
  name: 'GET /api/data',
  duration: 123,
  success: true,
  responseCode: 200,
  type: 'HTTP'
});

// Track exceptions
try {
  throw new Error('Something went wrong');
} catch (error) {
  appInsights.trackException({
    exception: error
  });
}
```

### After: OTelClientSdk

```typescript
import { 
  createOTelClientSdk, 
  eSeverityNumber,
  eSpanKind,
  eSpanStatusCode,
  SeverityNumber,
  SpanKind,
  SpanStatusCode,
  IOTelClientSdk,
  ITracer,
  ILogger,
  IMeter,
  ISpan,
  ILogRecord,
  IHistogram
} from '@microsoft/applicationinsights-otelclientsdk';

// Create the SDK
const sdk: IOTelClientSdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key'
});

// Get providers
const tracer: ITracer = sdk.traceProvider.getTracer('app-component');
const logger: ILogger = sdk.loggerProvider.getLogger('app-component');
const meter: IMeter = sdk.meterProvider.getMeter('app-component');

// Track events (using logs)
logger.emit({
  severityText: 'INFO',
  body: 'UserLogin',
  attributes: {
    'user.id': 'user-123',
    'user.type': 'premium'
  }
} as ILogRecord);

// Track metrics
const processingTime: IHistogram = meter.createHistogram('processingTime');
processingTime.record(42.5);

// Track page views (using spans)
tracer.startSpan('pageView', {
  kind: SpanKind.CLIENT,
  attributes: {
    'page.url': window.location.href,
    'page.title': document.title
  }
}).end();

// Track dependencies (using spans)
const dependencySpan: ISpan = tracer.startSpan('GET /api/data', {
  kind: SpanKind.CLIENT,
  attributes: {
    'http.method': 'GET',
    'http.url': '/api/data',
    'http.status_code': 200
  }
});
dependencySpan.setStatus({ code: SpanStatusCode.OK });
dependencySpan.end();

// Track exceptions
try {
  throw new Error('Something went wrong');
} catch (error) {
  const span: ISpan = tracer.startSpan('error');
  span.recordException(error);
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: error.message
  });
  span.end();
  
  // Also log the error
  logger.emit({
    severityNumber: SeverityNumber.ERROR,
    severityText: 'ERROR',
    body: error.message,
    attributes: {
      'error.type': error.name,
      'error.stack': error.stack
    }
  } as ILogRecord);
}
```

## Configuration Management

### Responding to Configuration Changes

```typescript
import { 
  createOTelClientSdk,
  IOTelClientSdk
} from '@microsoft/applicationinsights-otelclientsdk';
import { onConfigChange } from '@microsoft/applicationinsights-core-js';

// Create the SDK
const sdk: IOTelClientSdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key-here'
});

// Create a component that listens to configuration changes
class MyComponent {
  private _configWatcher;
  private _isEnabled: boolean = false;
  
  constructor(sdk: IOTelClientSdk) {
    // Listen for configuration changes using onConfigChange
    this._configWatcher = onConfigChange(sdk.config, (updatedConfig) => {
      // Check for specific configuration changes
      if ('myComponent.enabled' in updatedConfig) {
        this._isEnabled = !!updatedConfig['myComponent.enabled'];
        console.log(`MyComponent is now ${this._isEnabled ? 'enabled' : 'disabled'}`);
      }
      
      if ('myComponent.featureFlag' in updatedConfig) {
        this._handleFeatureFlag(updatedConfig['myComponent.featureFlag']);
      }
    });
    
    // Initial state from configuration
    this._isEnabled = !!sdk.config['myComponent.enabled'];
  }
  
  private _handleFeatureFlag(value: any): void {
    console.log(`Feature flag updated: ${value}`);
  }
  
  dispose(): void {
    // Clean up the configuration change listener when no longer needed
    if (this._configWatcher) {
      this._configWatcher.rm();
      this._configWatcher = null;
    }
  }
}

// Create the component
const myComponent = new MyComponent(sdk);

// Later, update the configuration
sdk.config['myComponent.enabled'] = true;
sdk.config['myComponent.featureFlag'] = 'beta-feature';

// Clean up when done
myComponent.dispose();
```
