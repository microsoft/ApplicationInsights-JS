# OTelClientSdk Interface-First Design Pattern

This document describes the interface-first design pattern used throughout the OTelClientSdk implementation. This approach provides significant benefits for SDK design, including improved encapsulation, better type safety, and optimized bundle sizes.

## Core Principles

The interface-first design pattern follows these core principles:

1. **Interfaces Define Contracts**: All public components are defined by interfaces
2. **Implementation Details are Hidden**: Concrete implementations are not exposed
3. **Factory Functions Create Instances**: No direct use of constructors
4. **Strong Type Safety**: TypeScript interfaces provide compile-time checks
5. **Comprehensive Documentation**: Interfaces include detailed JSDoc comments

## Interface Naming Conventions

The SDK follows strict naming conventions for interfaces:

- **Public Interfaces**: Prefixed with `I` (e.g., `ITraceProvider`, `ILogger`)
- **Internal Interfaces**: Prefixed with `_I` (e.g., `_ITraceProviderInternal`)
- **Implementation Classes**: Not exported, private to the module
- **Factory Functions**: Follow the `create*` naming pattern (e.g., `createTraceProvider`)

## Interface Design Patterns

### 1. Public Interface Definition

```typescript
/**
 * Interface for a span in distributed tracing
 * @public
 */
export interface ISpan {
  /**
   * Returns the SpanContext associated with this Span
   * @returns The SpanContext of this Span
   */
  spanContext(): ISpanContext;
  
  /**
   * Sets an attribute on the span
   * @param key - The attribute key
   * @param value - The attribute value
   * @returns This Span instance for chaining
   */
  setAttribute(key: string, value: SpanAttributeValue): ISpan;
  
  /**
   * Sets multiple attributes at once
   * @param attributes - The attributes to set
   * @returns This Span instance for chaining
   */
  setAttributes(attributes: SpanAttributes): ISpan;
  
  /**
   * Adds an event to the span
   * @param name - The name of the event
   * @param attributes - Optional attributes for the event
   * @param timestamp - Optional timestamp for the event
   * @returns This Span instance for chaining
   */
  addEvent(name: string, attributes?: SpanAttributes, timestamp?: TimeInput): ISpan;
  
  /**
   * Sets the status of the span
   * @param status - The status to set
   * @returns This Span instance for chaining
   */
  setStatus(status: ISpanStatus): ISpan;
  
  /**
   * Updates the span name
   * @param name - The new name of the span
   * @returns This Span instance for chaining
   */
  updateName(name: string): ISpan;
  
  /**
   * Ends the span
   * @param endTime - Optional end time for the span
   */
  end(endTime?: TimeInput): void;
  
  /**
   * Checks if the span is recording information
   * @returns True if the span is recording information
   */
  isRecording(): boolean;
}
```

### 2. Internal Interface Definition

```typescript
/**
 * Internal interface for span implementation details
 * @internal
 */
export interface _ISpanInternal extends ISpan {
  /**
   * Gets the parent span context if available
   * @internal
   */
  _getParentSpanContext(): ISpanContext | undefined;
  
  /**
   * Gets all events recorded in the span
   * @internal
   */
  _getEvents(): ReadonlyArray<ISpanEvent>;
  
  /**
   * Gets all attributes set on the span
   * @internal
   */
  _getAttributes(): ReadonlyMap<string, SpanAttributeValue>;
  
  /**
   * Gets the resource associated with this span
   * @internal
   */
  _getResource(): IResource;
  
  /**
   * Sets whether the span is recording or not
   * @param recording - Whether the span should record information
   * @internal
   */
  _setRecording(recording: boolean): void;
}
```

### 3. Implementation Class (Not Exported)

```typescript
// Not exported - internal implementation only
class SpanImpl implements _ISpanInternal {
  private _context: ISpanContext;
  private _parentSpanContext?: ISpanContext;
  private _name: string;
  private _kind: SpanKind;
  private _startTime: HrTime;
  private _endTime?: HrTime;
  private _attributes: Map<string, SpanAttributeValue> = new Map();
  private _events: ISpanEvent[] = [];
  private _status: ISpanStatus = { code: SpanStatusCode.UNSET };
  private _recording: boolean = true;
  private _resource: IResource;
  private _ended: boolean = false;
  
  constructor(
    name: string,
    context: ISpanContext,
    kind: SpanKind,
    parentSpanContext: ISpanContext | undefined,
    resource: IResource,
    startTime?: TimeInput
  ) {
    this._name = name;
    this._context = context;
    this._kind = kind;
    this._parentSpanContext = parentSpanContext;
    this._resource = resource;
    this._startTime = toHrTime(startTime ?? hrTime());
  }
  
  // Implementation of ISpan methods
  
  spanContext(): ISpanContext {
    return this._context;
  }
  
  setAttribute(key: string, value: SpanAttributeValue): ISpan {
    if (this._ended || !this._recording) return this;
    
    if (key && value !== undefined) {
      this._attributes.set(key, value);
    }
    
    return this;
  }
  
  setAttributes(attributes: SpanAttributes): ISpan {
    if (this._ended || !this._recording) return this;
    
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        if (value !== undefined) {
          this._attributes.set(key, value);
        }
      });
    }
    
    return this;
  }
  
  // Other implementation methods...
  
  // Implementation of _ISpanInternal methods
  
  _getParentSpanContext(): ISpanContext | undefined {
    return this._parentSpanContext;
  }
  
  _getEvents(): ReadonlyArray<ISpanEvent> {
    return this._events;
  }
  
  _getAttributes(): ReadonlyMap<string, SpanAttributeValue> {
    return this._attributes;
  }
  
  _getResource(): IResource {
    return this._resource;
  }
  
  _setRecording(recording: boolean): void {
    this._recording = recording;
  }
}
```

### 4. Factory Function

```typescript
/**
 * Creates a new span
 * @param name - The name of the span
 * @param options - Options for creating the span
 * @param context - The parent context
 * @param resource - The resource associated with this span
 * @returns A new span instance
 * @public
 */
export function createSpan(
  name: string,
  options: ISpanOptions,
  context: IContext,
  resource: IResource
): ISpan {
  const parentSpanContext = getSpanContext(context);
  
  const spanContext = generateSpanContext(parentSpanContext, options.sampler);
  
  return new SpanImpl(
    name,
    spanContext,
    options.kind || SpanKind.INTERNAL,
    parentSpanContext,
    resource,
    options.startTime
  );
}
```

## Benefits of Interface-First Design

### 1. Encapsulation and Information Hiding

- Implementation details are hidden from consumers
- Internal state and methods are not accessible
- Changes to implementation don't affect consumers
- Better separation of concerns

### 2. Type Safety and Compile-Time Checks

- TypeScript enforces interface contracts
- IDE provides better IntelliSense support
- Compilation errors catch interface misuse
- Method signatures are well-defined

### 3. Bundle Size Optimization

- Tree-shaking works better with interfaces
- Unused methods can be removed during bundling
- Implementation details not needed in final bundle
- Better code splitting and lazy loading

### 4. Testability

- Interfaces are easier to mock for testing
- Unit tests can test against interfaces
- Test doubles can implement interfaces
- Better isolation of components for testing

### 5. API Stability

- Interfaces provide stable contracts
- Changes to implementation don't break API
- Versioning can be managed at interface level
- Better backward compatibility

## Using the Pattern for Custom Components

When extending the SDK with custom components, follow the same pattern:

1. Define your interface with proper JSDoc comments
2. Create an internal implementation class
3. Provide a factory function to create instances
4. Only expose the interface and factory function

```typescript
// 1. Define the interface
export interface ICustomProcessor extends ISpanProcessor {
  setFilter(filter: (span: ISpan) => boolean): void;
}

// 2. Create implementation (not exported)
class CustomProcessorImpl implements ICustomProcessor {
  // Implementation details
}

// 3. Provide a factory function
export function createCustomProcessor(options?: ICustomProcessorOptions): ICustomProcessor {
  return new CustomProcessorImpl(options);
}

// 4. Usage
const processor = createCustomProcessor({ maxQueueSize: 100 });
sdk.traceProvider.addSpanProcessor(processor);
```

## Best Practices

1. **Complete Interfaces**: Ensure interfaces fully describe the component's capabilities
2. **Comprehensive JSDoc**: Document all interface methods and properties
3. **Consistent Naming**: Follow the naming conventions consistently
4. **Minimal Surface Area**: Only expose what consumers need
5. **Factory Function Design**: Make factory functions easy to use with sensible defaults
6. **Error Handling**: Define error handling behavior in interfaces
7. **Immutable Interfaces**: Consider making interfaces immutable where appropriate
8. **Interface Segregation**: Split large interfaces into smaller, focused ones

## Conclusion

The interface-first design pattern provides a robust foundation for SDK development. It improves encapsulation, type safety, and maintainability while enabling better tree-shaking for optimized bundle sizes. By consistently applying this pattern throughout the OTelClientSdk, we ensure a high-quality, developer-friendly API that meets modern TypeScript best practices.
