# OpenTelemetry Web SDK Trace Implementation

This document describes the trace implementation of the OpenTelemetry Web SDK using closures and DynamicProto-JS.

## Trace Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Trace Provider Architecture                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Factory Creation Layer                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │  createTraceProvider(config: ITraceProviderConfig): ITraceProvider          │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │ │
│  │  │ Dependency  │ │ Sampler     │ │ ID          │ │ Context     │           │ │
│  │  │ Validation  │ │ Injection   │ │ Generator   │ │ Manager     │           │ │
│  │  │             │ │             │ │ Injection   │ │ Injection   │           │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                     │                                           │
│  Trace Provider Interface Layer     │                                           │
│  ┌─────────────────────────────────▼─────────────────────────────────────────┐   │
│  │                         ITraceProvider                                   │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │   │
│  │  │ getTracer() │ │ addSpan     │ │ forceFlush()│ │ shutdown()  │         │   │
│  │  │             │ │ Processor() │ │             │ │             │         │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘         │   │
│  └─────────────────────────────────┬─────────────────────────────────────────┘   │
│                                    │                                             │
│  Tracer Creation Layer             │                                             │
│  ┌─────────────────────────────────▼─────────────────────────────────────────┐   │
│  │                           ITracer Instances                              │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │   │
│  │  │ startSpan() │ │ startActive │ │ Span        │ │ Context     │         │   │
│  │  │             │ │ Span()      │ │ Management  │ │ Propagation │         │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘         │   │
│  └─────────────────────────────────┬─────────────────────────────────────────┘   │
│                                    │                                             │
│  Span Lifecycle Layer              │                                             │
│  ┌─────────────────────────────────▼─────────────────────────────────────────┐   │
│  │                         ISpan Implementation                             │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │   │
│  │  │ setAttribute│ │ addEvent()  │ │ setStatus() │ │ end()       │         │   │
│  │  │ ()          │ │             │ │             │ │             │         │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘         │   │
│  └─────────────────────────────────┬─────────────────────────────────────────┘   │
│                                    │                                             │
│  Processing Pipeline                │                                             │
│  ┌─────────────────────────────────▼─────────────────────────────────────────┐   │
│  │                        Span Processors                                   │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │   │
│  │  │ Simple      │ │ Batch       │ │ Sampling    │ │ Custom      │         │   │
│  │  │ Processor   │ │ Processor   │ │ Processor   │ │ Processors  │         │   │
│  │  │             │ │             │ │             │ │             │         │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘         │   │
│  └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Trace Provider Interfaces

```typescript
/**
 * Public interface for the Trace Provider configuration
 */
export interface ITraceConfig {
  /** Sampling ratio (0 to 1) */
  samplingRatio?: number;
  /** Maximum number of spans to batch before sending */
  maxBatchSize?: number;
  /** Maximum batch wait time in milliseconds */
  maxBatchWaitTimeMs?: number;
  /** Maximum span attributes */
  maxSpanAttributes?: number;
  /** Maximum span events */
  maxSpanEvents?: number;
  /** Maximum span links */
  maxSpanLinks?: number;
  /** Custom ID generator */
  idGenerator?: IIdGenerator;
}

/**
 * Public interface for the Trace Provider
 */
export interface ITraceProvider {
  /**
   * Returns a tracer instance for the given name, version, and options
   * @param name - The name of the tracer (usually the component name)
   * @param version - Optional version of the component
   * @param options - Optional tracer configuration options
   * @returns A tracer instance
   */
  getTracer(name: string, version?: string, options?: ITracerOptions): ITracer;
}

/**
 * @internal
 * Internal interface for the Trace Provider
 */
export interface _ITraceProviderInternal extends ITraceProvider {
  _getActiveSpan(): ISpan | undefined;
  _processSpanData(span: ISpan): void;
  _forceFlush(): Promise<void>;
}

/**
 * Interface for tracer options
 */
export interface ITracerOptions {
  /** Schema URL for the tracer */
  schemaUrl?: string;
  /** Custom attributes for the tracer */
  attributes?: Record<string, any>;
}
```

## Tracer Interface

```typescript
/**
 * Interface for a tracer instance
 */
export interface ITracer {
  /**
   * Start a new span
   * @param name - The name of the span
   * @param options - Optional configuration options for the span
   * @param context - Optional context to use as parent
   * @returns A new span instance
   */
  startSpan(name: string, options?: ISpanOptions, context?: IContext): ISpan;
  
  /**
   * Start a new span and make it the active span in the context
   * @param name - The name of the span 
   * @param options - Optional configuration options for the span
   * @param context - Optional context to use as parent
   * @param fn - The function to run with the span
   * @returns The return value of fn
   */
  startActiveSpan<T extends (...args: any[]) => any>(
    name: string, 
    options: ISpanOptions | undefined,
    context: IContext | undefined,
    fn: (span: ISpan) => ReturnType<T>
  ): ReturnType<T>;
}

/**
 * @internal
 * Internal interface for the Tracer
 */
export interface _ITracerInternal extends ITracer {
  _getName(): string;
  _getVersion(): string | undefined;
  _getAttributes(): Record<string, any>;
}
```

## Span Interface

```typescript
/**
 * Interface for span options
 */
export interface ISpanOptions {
  /** The kind of span */
  kind?: SpanKind;
  /** The attributes for the span */
  attributes?: Record<string, any>;
  /** The links for the span */
  links?: ILink[];
  /** The start time for the span */
  startTime?: TimeInput;
}

/**
 * Interface for a span link
 */
export interface ILink {
  /** The context for the linked span */
  context: ISpanContext;
  /** The attributes for the link */
  attributes?: Record<string, any>;
}

/**
 * Interface for a span
 */
export interface ISpan {
  /**
   * Returns the SpanContext associated with this Span
   * @returns The SpanContext
   */
  spanContext(): ISpanContext;
  
  /**
   * Sets an attribute on the Span
   * @param key The attribute key
   * @param value The attribute value
   * @returns This Span instance for chaining
   */
  setAttribute(key: string, value: any): ISpan;
  
  /**
   * Sets multiple attributes on the Span
   * @param attributes The attributes to set
   * @returns This Span instance for chaining
   */
  setAttributes(attributes: Record<string, any>): ISpan;
  
  /**
   * Adds an event to the Span
   * @param name The name of the event
   * @param attributes The attributes for the event
   * @param timestamp The timestamp for the event
   * @returns This Span instance for chaining
   */
  addEvent(name: string, attributes?: Record<string, any>, timestamp?: TimeInput): ISpan;
  
  /**
   * Sets the status of the Span
   * @param status The status to set
   * @returns This Span instance for chaining
   */
  setStatus(status: ISpanStatus): ISpan;
  
  /**
   * Updates the name of the Span
   * @param name The new name for the Span
   * @returns This Span instance for chaining
   */
  updateName(name: string): ISpan;
  
  /**
   * Ends the Span
   * @param endTime The end time for the Span
   */
  end(endTime?: TimeInput): void;
  
  /**
   * Returns whether this Span is recording
   * @returns True if the Span is recording
   */
  isRecording(): boolean;
  
  /**
   * Records an exception as an event
   * @param exception The exception to record
   * @param attributes Additional attributes to add
   * @returns This Span instance for chaining
   */
  recordException(exception: Error | string, attributes?: Record<string, any>): ISpan;
}

/**
 * Interface for a span status
 */
export interface ISpanStatus {
  /** The status code */
  code: SpanStatusCode;
  /** The status message */
  message?: string;
}

/**
 * Span status codes
 */
export enum SpanStatusCode {
  /** The operation has been validated by an operator */
  UNSET = 0,
  /** The operation completed successfully */
  OK = 1,
  /** The operation contains an error */
  ERROR = 2
}

/**
 * Interface for a span context
 */
export interface ISpanContext {
  /** The trace ID */
  traceId: string;
  /** The span ID */
  spanId: string;
  /** The trace flags */
  traceFlags: number;
  /** The trace state */
  traceState?: TraceState;
  /** Whether this context is remote */
  isRemote?: boolean;
}

/**
 * @internal 
 * Internal interface for a span
 */
export interface _ISpanInternal extends ISpan {
  _getStartTime(): HrTime;
  _getEndTime(): HrTime | undefined;
  _getDuration(): HrTime;
  _getEvents(): IEvent[];
  _getLinks(): ILink[];
  _getAttributes(): Record<string, any>;
  _getStatus(): ISpanStatus;
  _getName(): string;
  _getKind(): SpanKind;
  _getResource(): IResource;
  _getParentSpanId(): string | undefined;
}
```

## Trace Provider Implementation with Closures

```typescript
/**
 * Create a new Trace Provider
 * @param config Configuration for the Trace Provider
 * @param contextManager The context manager to use
 * @returns A new Trace Provider instance
 */
export function createTraceProvider(config: ITraceConfig = {}, contextManager: IContextManager): ITraceProvider {
  // Private closure variables
  let _tracers: Map<string, ITracer> = new Map();
  let _config = config || {};
  let _contextManager = contextManager;
  let _samplingRatio = _config.samplingRatio ?? 1.0;
  let _maxBatchSize = _config.maxBatchSize ?? 512;
  let _maxBatchWaitTimeMs = _config.maxBatchWaitTimeMs ?? 5000;
  let _maxSpanAttributes = _config.maxSpanAttributes ?? 32;
  let _maxSpanEvents = _config.maxSpanEvents ?? 128;
  let _maxSpanLinks = _config.maxSpanLinks ?? 32;
  let _idGenerator = _config.idGenerator || createIdGenerator();
  let _spanProcessor = createBatchSpanProcessor({
    maxBatchSize: _maxBatchSize,
    maxBatchWaitTimeMs: _maxBatchWaitTimeMs
  });
  let _sampler = createSampler(_samplingRatio);
  
  // Create the instance
  let _self = {} as _ITraceProviderInternal;
  
  // Define methods using DynamicProto
  dynamicProto({} as any, _self, (self: _ITraceProviderInternal) => {
    // Get a tracer
    self.getTracer = (name: string, version?: string, options?: ITracerOptions): ITracer => {
      const key = `${name}@${version || ''}`;
      
      if (!_tracers.has(key)) {
        _tracers.set(key, createTracer(name, version, options, _self, _contextManager));
      }
      
      return _tracers.get(key)!;
    };
    
    // Get the active span from the context manager
    self._getActiveSpan = (): ISpan | undefined => {
      const context = _contextManager.active();
      return getSpan(context);
    };
    
    // Process a span after it has ended
    self._processSpanData = (span: ISpan): void => {
      if (isSpanInternal(span)) {
        _spanProcessor.onEnd(span as _ISpanInternal);
      }
    };
    
    // Force flush any pending spans
    self._forceFlush = (): Promise<void> => {
      return _spanProcessor.forceFlush();
    };
  });
  
  return _self;
}

/**
 * Check if a span is an internal span
 * @param span The span to check
 * @returns True if the span is an internal span
 */
function isSpanInternal(span: ISpan): span is _ISpanInternal {
  return '_getStartTime' in span;
}

/**
 * Get the span from a context
 * @param context The context to get the span from
 * @returns The span or undefined
 */
function getSpan(context: IContext): ISpan | undefined {
  return context.getValue(ACTIVE_SPAN_KEY) as ISpan | undefined;
}
```

## Tracer Implementation with Closures

```typescript
/**
 * Create a new Tracer
 * @param name The name of the tracer
 * @param version The version of the tracer
 * @param options Options for the tracer
 * @param traceProvider The trace provider to use
 * @param contextManager The context manager to use
 * @returns A new Tracer instance
 */
export function createTracer(
  name: string, 
  version?: string, 
  options?: ITracerOptions, 
  traceProvider: _ITraceProviderInternal,
  contextManager: IContextManager
): ITracer {
  // Private closure variables
  let _name = name;
  let _version = version;
  let _options = options || {};
  let _attributes = _options.attributes || {};
  let _traceProvider = traceProvider;
  let _contextManager = contextManager;
  
  // Create the instance
  let _self = {} as _ITracerInternal;
  
  // Define methods using DynamicProto
  dynamicProto({} as any, _self, (self: _ITracerInternal) => {
    // Start a span
    self.startSpan = (name: string, options?: ISpanOptions, context?: IContext): ISpan => {
      const ctx = context || _contextManager.active();
      const parentSpan = getSpan(ctx);
      const parentSpanContext = parentSpan?.spanContext();
      
      // Create the span
      const span = createSpan(
        name,
        options || {},
        parentSpanContext,
        _traceProvider,
        _self
      );
      
      return span;
    };
    
    // Start an active span
    self.startActiveSpan = <T extends (...args: any[]) => any>(
      name: string,
      options: ISpanOptions | undefined,
      context: IContext | undefined,
      fn: (span: ISpan) => ReturnType<T>
    ): ReturnType<T> => {
      const span = self.startSpan(name, options, context);
      const ctx = context || _contextManager.active();
      const newContext = setSpan(ctx, span);
      
      return _contextManager.with(newContext, () => {
        try {
          return fn(span);
        } finally {
          span.end();
        }
      });
    };
    
    // Get the name
    self._getName = (): string => {
      return _name;
    };
    
    // Get the version
    self._getVersion = (): string | undefined => {
      return _version;
    };
    
    // Get the attributes
    self._getAttributes = (): Record<string, any> => {
      return { ..._attributes };
    };
  });
  
  return _self;
}

/**
 * Set the span in a context
 * @param context The context to set the span in
 * @param span The span to set
 * @returns A new context with the span set
 */
function setSpan(context: IContext, span: ISpan): IContext {
  return context.setValue(ACTIVE_SPAN_KEY, span);
}
```

## Span Implementation with Closures

```typescript
/**
 * Create a new Span
 * @param name The name of the span
 * @param options The options for the span
 * @param parentContext The parent context
 * @param traceProvider The trace provider to use
 * @param tracer The tracer that created this span
 * @returns A new Span instance
 */
export function createSpan(
  name: string,
  options: ISpanOptions,
  parentContext: ISpanContext | undefined,
  traceProvider: _ITraceProviderInternal,
  tracer: _ITracerInternal
): ISpan {
  // Private closure variables
  let _name = name;
  let _kind = options.kind || SpanKind.INTERNAL;
  let _attributes: Record<string, any> = { ...options.attributes };
  let _links: ILink[] = [...(options.links || [])];
  let _events: IEvent[] = [];
  let _status: ISpanStatus = { code: SpanStatusCode.UNSET };
  let _startTime = hrTimeFromTimeInput(options.startTime || performance.now());
  let _endTime: HrTime | undefined;
  let _ended = false;
  let _recording = true;
  let _traceProvider = traceProvider;
  let _tracer = tracer;
  
  // Generate span context
  let _spanContext = generateSpanContext(parentContext);
  
  // Create the instance
  let _self = {} as _ISpanInternal;
  
  // Define methods using DynamicProto
  dynamicProto({} as any, _self, (self: _ISpanInternal) => {
    // Get the span context
    self.spanContext = (): ISpanContext => {
      return _spanContext;
    };
    
    // Set an attribute
    self.setAttribute = (key: string, value: any): ISpan => {
      if (_recording && !_ended && isValidAttributeValue(value)) {
        _attributes[key] = value;
      }
      return self;
    };
    
    // Set attributes
    self.setAttributes = (attributes: Record<string, any>): ISpan => {
      if (_recording && !_ended) {
        Object.entries(attributes).forEach(([key, value]) => {
          if (isValidAttributeValue(value)) {
            _attributes[key] = value;
          }
        });
      }
      return self;
    };
    
    // Add an event
    self.addEvent = (name: string, attributes?: Record<string, any>, timestamp?: TimeInput): ISpan => {
      if (_recording && !_ended) {
        _events.push({
          name,
          attributes: attributes || {},
          timestamp: hrTimeFromTimeInput(timestamp || performance.now())
        });
      }
      return self;
    };
    
    // Set the status
    self.setStatus = (status: ISpanStatus): ISpan => {
      if (_recording && !_ended) {
        _status = status;
      }
      return self;
    };
    
    // Update the name
    self.updateName = (name: string): ISpan => {
      if (_recording && !_ended) {
        _name = name;
      }
      return self;
    };
    
    // End the span
    self.end = (endTime?: TimeInput): void => {
      if (!_ended) {
        _ended = true;
        _endTime = hrTimeFromTimeInput(endTime || performance.now());
        _traceProvider._processSpanData(self);
      }
    };
    
    // Check if recording
    self.isRecording = (): boolean => {
      return _recording && !_ended;
    };
    
    // Record an exception
    self.recordException = (exception: Error | string, attributes?: Record<string, any>): ISpan => {
      if (_recording && !_ended) {
        const exceptionAttributes = {
          'exception.type': typeof exception === 'string' ? 'string' : exception.name,
          'exception.message': typeof exception === 'string' ? exception : exception.message,
          'exception.stacktrace': typeof exception === 'string' ? '' : (exception.stack || ''),
          ...attributes
        };
        
        self.addEvent('exception', exceptionAttributes);
      }
      return self;
    };
    
    // Internal methods
    self._getStartTime = (): HrTime => _startTime;
    self._getEndTime = (): HrTime | undefined => _endTime;
    self._getDuration = (): HrTime => {
      if (!_endTime) {
        return [0, 0];
      }
      return hrTimeDuration(_startTime, _endTime);
    };
    self._getEvents = (): IEvent[] => [..._events];
    self._getLinks = (): ILink[] => [..._links];
    self._getAttributes = (): Record<string, any> => ({ ..._attributes });
    self._getStatus = (): ISpanStatus => ({ ..._status });
    self._getName = (): string => _name;
    self._getKind = (): SpanKind => _kind;
    self._getResource = (): IResource => createResource(_tracer._getAttributes());
    self._getParentSpanId = (): string | undefined => parentContext?.spanId;
  });
  
  return _self;
}

/**
 * Generate a span context from a parent context
 * @param parentContext The parent context
 * @returns A new span context
 */
function generateSpanContext(parentContext?: ISpanContext): ISpanContext {
  if (!parentContext) {
    return {
      traceId: generateTraceId(),
      spanId: generateSpanId(),
      traceFlags: 0x01,  // SAMPLED
      isRemote: false
    };
  }
  
  return {
    traceId: parentContext.traceId,
    spanId: generateSpanId(),
    traceFlags: parentContext.traceFlags,
    traceState: parentContext.traceState,
    isRemote: false
  };
}

/**
 * Generate a trace ID
 * @returns A new trace ID
 */
function generateTraceId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

/**
 * Generate a span ID
 * @returns A new span ID
 */
function generateSpanId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

/**
 * Convert bytes to hex string
 * @param bytes The bytes to convert
 * @returns A hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert a TimeInput to HrTime
 * @param time The time input
 * @returns An HrTime
 */
function hrTimeFromTimeInput(time: TimeInput): HrTime {
  if (Array.isArray(time)) {
    return time as HrTime;
  }
  
  const now = performance.now();
  const seconds = Math.floor(now / 1000);
  const nanos = Math.floor((now % 1000) * 1e6);
  
  return [seconds, nanos];
}

/**
 * Check if a value is a valid attribute value
 * @param value The value to check
 * @returns True if the value is valid
 */
function isValidAttributeValue(value: any): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  
  const type = typeof value;
  return type === 'string' || 
         type === 'number' || 
         type === 'boolean' || 
         Array.isArray(value) || 
         value instanceof Date;
}
```

## Usage Example

```typescript
import { createOTelWebSdk } from "@microsoft/otel-web-sdk";

// Create a new SDK instance
const sdk = createOTelWebSdk({
  traceConfig: {
    samplingRatio: 0.5
  }
});

// Initialize the SDK
sdk.initialize();

// Use the trace provider to create a tracer
const tracer = sdk.trace.getTracer("my-component", "1.0.0");

// Create and end a span
const span = tracer.startSpan("my-operation");
span.setAttribute("http.method", "GET");
span.setAttribute("http.url", "https://example.com");

// Add events
span.addEvent("data.loaded", { items: 42 });

// Record exceptions
try {
  // Do some work...
  throw new Error("Something went wrong");
} catch (e) {
  span.recordException(e);
  span.setStatus({ code: SpanStatusCode.ERROR, message: e.message });
}

// End the span
span.end();

// Use the context manager to propagate context
const ctx = sdk.context.active();
const newCtx = ctx.setValue("user.id", "123");

sdk.context.with(newCtx, () => {
  // Start a child span that will automatically use the context
  const childSpan = tracer.startSpan("child-operation");
  // Do more work...
  childSpan.end();
});

// Shutdown the SDK when done
window.addEventListener("unload", () => {
  sdk.shutdown().catch(console.error);
});
```

## Next Steps

For detailed implementation of other components, refer to the following documents:

- [OTelWebSdk-Log.md](./OTelWebSdk-Log.md)
- [OTelWebSdk-Metric.md](./OTelWebSdk-Metric.md)
- [OTelWebSdk-Context.md](./OTelWebSdk-Context.md)

## Testing and Performance

### Trace-Specific Testing
For tracing-specific testing strategies including span lifecycle testing, context propagation validation, and performance benchmarking of trace operations, see [Testing Strategy](./OTelWebSdk-Testing.md).

### Performance Optimization
For trace performance optimization including span pooling, efficient attribute management, and trace export optimization, see [Performance Strategy](./OTelWebSdk-Performance.md).

### Migration from Existing Tracing
For migration strategies from Application Insights trackPageView/trackDependency and other tracing solutions, see [Migration Guide](./OTelWebSdk-Migration.md).
