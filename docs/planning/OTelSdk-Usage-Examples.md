# OTelClientSdk Usage Examples

This document provides code examples for common scenarios when using the OTelClientSdk. These examples demonstrate how to configure and use the SDK for tracing, logging, and metrics with explicit instance creation and interface-based design.

## Table of Contents

- [Interface-First Design](#interface-first-design)
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

## Interface-First Design

All public APIs in the OTelClientSdk follow an interface-first design pattern:

- Public interfaces are prefixed with `I` (e.g., `ITraceProvider`, `ILogger`)
- Internal interfaces are prefixed with `_I` and marked with `@internal` JSDoc tags
- Implementation classes are not exposed publicly
- Factory functions are used to create instances instead of constructors

This approach provides several key benefits:

1. **Clear API Contracts**: Interfaces define explicit contracts that implementations must follow
2. **Type Safety**: TypeScript enforces proper usage through interface types
3. **Improved Bundle Size**: Implementation details can be hidden for better tree-shaking
4. **Easier Testing**: Interfaces make it easier to mock components for testing
5. **Better Documentation**: JSDoc comments on interfaces provide clear guidance

### Interface vs. Implementation Example

In a traditional class-based approach:

```typescript
// Traditional class-based approach
class TraceProvider {
  constructor(config) { /* ... */ }
  
  getTracer(name, version) { /* ... */ }
  addSpanProcessor(processor) { /* ... */ }
  shutdown() { /* ... */ }
}

// Usage
const traceProvider = new TraceProvider(config);
const tracer = traceProvider.getTracer('my-component');
```

In our interface-first approach:

```typescript
// Interface definition
export interface ITraceProvider {
  getTracer(name: string, version?: string): ITracer;
  addSpanProcessor(processor: ISpanProcessor): void;
  shutdown(): Promise<void>;
  forceFlush(): Promise<void>;
}

// Factory function for creating instances (implementation hidden)
export function createTraceProvider(config?: ITraceConfig, resource?: IResource): ITraceProvider {
  // Implementation details hidden from consumers
  return /* internal implementation */;
}

// Usage with explicit typing
const traceProvider: ITraceProvider = createTraceProvider(config);
const tracer: ITracer = traceProvider.getTracer('my-component');
```

### Benefits of Interface-First Design in Action

#### 1. Better Type Safety

```typescript
// The compiler enforces type safety
const tracer: ITracer = sdk.traceProvider.getTracer('my-component');

// Type error: Property 'invalidMethod' does not exist on type 'ITracer'
tracer.invalidMethod(); // Compiler catches this error
```

#### 2. Easier Testing with Mocks

```typescript
// Create a mock implementation for testing
const mockTracer: ITracer = {
  startSpan: jest.fn().mockReturnValue(mockSpan),
  startActiveSpan: jest.fn().mockImplementation((name, options, context, callback) => {
    return callback(mockSpan);
  }),
  // Other required interface methods...
};

// Test your code with the mock
function functionUnderTest(tracer: ITracer) {
  const span = tracer.startSpan('operation');
  // Do something with span
  span.end();
}

functionUnderTest(mockTracer);
expect(mockTracer.startSpan).toHaveBeenCalledWith('operation');
```

#### 3. Implementation Hiding for Better Bundle Size

```typescript
// Only the interface and factory function are exported
export interface IMeterProvider { /* ... */ }
export function createMeterProvider(): IMeterProvider { /* ... */ }

// Implementation details stay internal
// NOT exported:
class MeterProviderImpl implements _IMeterProviderInternal { /* ... */ }
```

#### 4. JSDoc Comments for Better Documentation

```typescript
/**
 * Logger interface for emitting log records
 * @public
 */
export interface ILogger {
  /**
   * Emits a log record
   * @param logRecord - The log record to emit
   * @param timestamp - Optional timestamp for the log record
   * @param context - Optional context containing correlation IDs
   */
  emit(logRecord: ILogRecord, timestamp?: TimeInput, context?: IContext): void;
  
  /**
   * Creates and emits a log record
   * @param severity - Severity level for the log
   * @param message - Log message
   * @param attributes - Optional attributes to attach to the log
   * @param context - Optional context containing correlation IDs
   */
  log(severity: SeverityNumber, message: string, attributes?: LogAttributes, context?: IContext): void;
}
```

### Internal Interface Example

For SDK maintainers, internal interfaces provide additional implementation details:

```typescript
/**
 * Internal interface for logger implementation details
 * @internal Not part of public API
 */
export interface _ILoggerInternal extends ILogger {
  /**
   * Gets the instrumentation library info
   * @internal
   */
  _getInstrumentationLibraryInfo(): IInstrumentationLibraryInfo;
  
  /**
   * Gets the log record processor pipeline
   * @internal
   */
  _getLogRecordProcessors(): ReadonlyArray<ILogRecordProcessor>;
}
```

## Basic Setup

### Simple SDK Initialization

```typescript
import { 
  createOTelClientSdk, 
  IOTelClientSdk, 
  IResource, 
  createResource 
} from '@microsoft/applicationinsights-otelclientsdk';

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
  IOTelClientSdk,
  ITraceProvider,
  ILoggerProvider,
  IMeterProvider,
  ISpanProcessor,
  ILogRecordProcessor,
  IMetricReader,
  ISpanExporter,
  ILogRecordExporter,
  IMetricExporter,
  createBatchSpanProcessor, 
  createAzureMonitorSpanExporter,
  createBatchLogRecordProcessor,
  createAzureMonitorLogRecordExporter,
  createMetricReader,
  createAzureMonitorMetricExporter,
  createResource,
  IResource
} from '@microsoft/applicationinsights-otelclientsdk';

// Create exporters
const spanExporter: ISpanExporter = createAzureMonitorSpanExporter({
  connectionString: 'InstrumentationKey=your-key-here'
});

const logExporter: ILogRecordExporter = createAzureMonitorLogRecordExporter({
  connectionString: 'InstrumentationKey=your-key-here'
});

const metricExporter: IMetricExporter = createAzureMonitorMetricExporter({
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
  IOTelClientSdk,
  ISampler,
  SamplingDecision,
  createTraceIdRatioSampler,
  createParentBasedSampler
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
  IOTelClientSdk,
  ISpanExporter, 
  ISpanProcessor,
  createBatchSpanProcessor,
  createAzureMonitorSpanExporter
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
  IOTelClientSdk,
  IInstrumentation,
  registerBrowserInstrumentation,
  createFetchInstrumentation,
  createXMLHttpRequestInstrumentation,
  createUserInteractionInstrumentation,
  createDocumentLoadInstrumentation
} from '@microsoft/applicationinsights-otelclientsdk';

// Create the SDK
const sdk: IOTelClientSdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key-here'
});

// Create instrumentations
const instrumentations: IInstrumentation[] = [
  createFetchInstrumentation({
    ignoreUrls: [/localhost:8080\/status/]
  }),
  createXMLHttpRequestInstrumentation({
    ignoreUrls: [/localhost:8080\/status/]
  }),
  createUserInteractionInstrumentation(),
  createDocumentLoadInstrumentation()
];

// Register browser instrumentation
registerBrowserInstrumentation(sdk, {
  instrumentations
});
```

### Single Page Application (SPA) Router Integration

```typescript
import { 
  createOTelClientSdk,
  IOTelClientSdk,
  IRouterInstrumentation,
  createRouterInstrumentation
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
  IOTelClientSdk,
  ITracer, 
  ISpan,
  ISpanStatus,
  SpanKind, 
  SpanStatusCode 
} from '@microsoft/applicationinsights-otelclientsdk';

const sdk: IOTelClientSdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key-here'
});

// Get a tracer
const tracer: ITracer = sdk.traceProvider.getTracer('my-component', '1.0.0');

// Create and end a span
const span: ISpan = tracer.startSpan('process-data', {
  kind: SpanKind.INTERNAL,
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
  span.setStatus({ code: SpanStatusCode.OK });
} catch (e) {
  // Record the exception
  span.recordException(e);
  
  // Set error status
  const status: ISpanStatus = {
    code: SpanStatusCode.ERROR,
    message: e.message
  };
  span.setStatus(status);
  
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
  ISpanStatus,
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
    
    const status: ISpanStatus = {
      code: SpanStatusCode.ERROR,
      message: e.message
    };
    span.setStatus(status);
    throw e;
  }
});
```

## Logging Examples

### Basic Logging

```typescript
import { 
  createOTelClientSdk,
  IOTelClientSdk,
  ILogger,
  ILogRecord,
  SeverityNumber 
} from '@microsoft/applicationinsights-otelclientsdk';

const sdk: IOTelClientSdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key-here'
});

// Get a logger
const logger: ILogger = sdk.loggerProvider.getLogger('my-component', '1.0.0');

// Create log record objects
const infoLog: ILogRecord = {
  severityNumber: SeverityNumber.INFO,
  severityText: 'INFO',
  body: 'Application started successfully',
  attributes: {
    'app.version': '1.0.0'
  }
};

const errorLog: ILogRecord = {
  severityNumber: SeverityNumber.ERROR,
  severityText: 'ERROR',
  body: 'Failed to connect to database',
  attributes: {
    'db.name': 'customers',
    'error.type': 'connection_failed'
  }
};

// Emit logs
logger.emit(infoLog);
logger.emit(errorLog);
```

### Structured Logging

```typescript
import { 
  createOTelClientSdk,
  IOTelClientSdk,
  ILogger,
  ILogRecord,
  SeverityNumber 
} from '@microsoft/applicationinsights-otelclientsdk';

const sdk: IOTelClientSdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key-here'
});

const logger: ILogger = sdk.loggerProvider.getLogger('my-component');

// Structured logging with object bodies
const errorLog: ILogRecord = {
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
};

logger.emit(errorLog);
```

## Metrics Examples

### Counter Metric

```typescript
import { 
  createOTelClientSdk,
  IOTelClientSdk,
  IMeter,
  ICounter,
  AttributeValue 
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
  const attributes: Record<string, AttributeValue> = {
    'http.route': route,
    'http.status_code': statusCode
  };
  
  requestCounter.add(1, attributes);
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
  IHistogram,
  AttributeValue 
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
  const attributes: Record<string, AttributeValue> = {
    'http.route': route
  };
  
  requestDuration.record(durationMs, attributes);
}

// Usage
trackRequestDuration('/api/users', 45.2);
trackRequestDuration('/api/orders', 132.7);
```

## Context Propagation

### Manual Context Propagation

```typescript
import { 
  createOTelClientSdk,
  IOTelClientSdk,
  ITracer,
  ISpan,
  IContext,
  IContextManager,
  IPropagator,
  SpanKind,
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
  kind: SpanKind.CLIENT
});

// Create a context with the span
let ctx: IContext = contextManager.active();
ctx = contextManager.setValue(ctx, 'userdata.id', 'user-123');
ctx = contextManager.setValue(ctx, 'active.span', parentSpan);

// Send an HTTP request with context propagation
async function makeHttpRequest(url: string, method: string, context: IContext): Promise<Response> {
  // Extract span from context
  const span = contextManager.getValue(context, 'active.span') as ISpan;
  const userId = contextManager.getValue(context, 'userdata.id') as string;
  
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

## Framework Integration

### React Integration

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  createOTelClientSdk, 
  IOTelClientSdk,
  ITracer,
  ISpan,
  createReactPlugin,
  IReactPlugin
} from '@microsoft/applicationinsights-otelclientsdk';
import { ReactPluginConfig } from '@microsoft/applicationinsights-otelclientsdk-react';

// Create SDK context
const OTelContext = createContext<IOTelClientSdk | null>(null);

// Create a Provider component using interfaces
interface TracingProviderProps {
  connectionString: string;
  serviceName: string;
  serviceVersion?: string;
  children: React.ReactNode;
}

export function OTelProvider({ connectionString, serviceName, serviceVersion, children }: TracingProviderProps) {
  const [sdk, setSdk] = useState<IOTelClientSdk | null>(null);
  
  useEffect(() => {
    // Create the SDK with React integration
    const newSdk: IOTelClientSdk = createOTelClientSdk({
      connectionString,
      resource: {
        'service.name': serviceName,
        'service.version': serviceVersion || '1.0.0'
      }
    });
    
    // Create and register React plugin
    const reactPlugin: IReactPlugin = createReactPlugin();
    reactPlugin.initialize(newSdk);
    
    setSdk(newSdk);
    
    // Clean up on unmount
    return () => {
      newSdk.shutdown().catch(console.error);
    };
  }, [connectionString, serviceName, serviceVersion]);
  
  return (
    <OTelContext.Provider value={sdk}>
      {children}
    </OTelContext.Provider>
  );
}

// Hook for using the SDK
export function useOTel(): IOTelClientSdk | null {
  return useContext(OTelContext);
}

// Hook for creating traced components
export function useTracer(componentName: string): ITracer | null {
  const sdk = useOTel();
  return sdk ? sdk.traceProvider.getTracer(componentName) : null;
}

// Usage example
function App() {
  return (
    <OTelProvider 
      connectionString="InstrumentationKey=your-key-here"
      serviceName="my-react-app" 
      serviceVersion="1.0.0"
    >
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <TracedComponent />
      </ErrorBoundary>
    </OTelProvider>
  );
}

// Component with tracing
function TracedComponent() {
  const tracer = useTracer('TracedComponent');
  
  useEffect(() => {
    if (tracer) {
      // Create operation span
      const span: ISpan = tracer.startSpan('component-loaded');
      span.setAttribute('component.name', 'TracedComponent');
      
      // End span on component unmount
      return () => span.end();
    }
  }, [tracer]);
  
  return <div>Traced component content</div>;
}
```

### Angular Integration

```typescript
import { NgModule, Injectable } from '@angular/core';
import { 
  createOTelClientSdk, 
  IOTelClientSdk,
  ITracer,
  ISpan,
  createAngularPlugin,
  IAngularPlugin
} from '@microsoft/applicationinsights-otelclientsdk';
import { AngularPluginConfig } from '@microsoft/applicationinsights-otelclientsdk-angular';

// Service using interface-first design
@Injectable({ providedIn: 'root' })
export class OTelService {
  private sdk: IOTelClientSdk;
  private tracer: ITracer;
  
  constructor() {
    // Create SDK instance
    this.sdk = createOTelClientSdk({
      connectionString: 'InstrumentationKey=your-key-here',
      resource: {
        'service.name': 'angular-app',
        'service.version': '1.0.0'
      }
    });
    
    // Initialize Angular plugin
    const angularPlugin: IAngularPlugin = createAngularPlugin({
      router: true,
      trackErrors: true
    });
    angularPlugin.initialize(this.sdk);
    
    // Get a tracer for the service
    this.tracer = this.sdk.traceProvider.getTracer('angular-app');
  }
  
  // Get tracer for components
  getTracer(name: string): ITracer {
    return this.sdk.traceProvider.getTracer(name);
  }
  
  // Create a span
  startSpan(name: string, attributes: Record<string, any> = {}): ISpan {
    const span = this.tracer.startSpan(name);
    
    Object.entries(attributes).forEach(([key, value]) => {
      span.setAttribute(key, value);
    });
    
    return span;
  }
  
  // Shutdown SDK
  shutdown(): Promise<void> {
    return this.sdk.shutdown();
  }
}

// Module setup
@NgModule({
  providers: [OTelService]
})
export class OTelModule { }

// Usage in a component
@Component({
  selector: 'app-traced',
  template: '<div>Traced Component</div>'
})
export class TracedComponent implements OnInit, OnDestroy {
  private span?: ISpan;
  private tracer: ITracer;
  
  constructor(private otelService: OTelService) {
    this.tracer = otelService.getTracer('TracedComponent');
  }
  
  ngOnInit(): void {
    // Start a span when component initializes
    this.span = this.tracer.startSpan('component-loaded');
    this.span.setAttribute('component.name', 'TracedComponent');
  }
  
  ngOnDestroy(): void {
    // End span when component is destroyed
    if (this.span) {
      this.span.end();
    }
  }
}
```

### Vue Integration

```typescript
import Vue from 'vue';
import { 
  createOTelClientSdk, 
  IOTelClientSdk,
  ITracer,
  ISpan,
  createVuePlugin,
  IVuePlugin
} from '@microsoft/applicationinsights-otelclientsdk';
import { VuePluginConfig } from '@microsoft/applicationinsights-otelclientsdk-vue';

// Create SDK
const sdk: IOTelClientSdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key-here',
  resource: {
    'service.name': 'vue-app',
    'service.version': '1.0.0'
  }
});

// Create Vue plugin
const vuePlugin: IVuePlugin = createVuePlugin({
  router: true,
  trackComponents: true
});

// Install plugin
Vue.use(vuePlugin, { sdk });

// Add to Vue instance
new Vue({
  el: '#app',
  beforeCreate() {
    // Set up in component
    this.$otel = {
      tracer: sdk.traceProvider.getTracer('vue-component'),
      startSpan(name: string, attributes = {}) {
        const span = this.tracer.startSpan(name);
        
        Object.entries(attributes).forEach(([key, value]) => {
          span.setAttribute(key, value);
        });
        
        return span;
      }
    };
  },
  mounted() {
    // Track component mounted
    const span: ISpan = this.$otel.startSpan('component-mounted', {
      'component.name': this.$options.name || 'RootComponent'
    });
    
    this.$once('hook:beforeDestroy', () => {
      span.end();
    });
  }
});
```
