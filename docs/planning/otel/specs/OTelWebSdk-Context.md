# OpenTelemetry Web SDK Context Implementation

This document describes the context implementation of the OpenTelemetry Web SDK using closures and DynamicProto-JS.

## Context Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             Context Manager Architecture                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Factory Creation Layer                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │  createContextManager(config: IContextManagerConfig): IContextManager      │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │ │
│  │  │ Context     │ │ Async       │ │ Storage     │ │ Propagation │           │ │
│  │  │ Storage     │ │ Hooks       │ │ Strategy    │ │ Headers     │           │ │
│  │  │ Strategy    │ │ Config      │ │             │ │             │           │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                     │                                           │
│  Context Manager Interface Layer    │                                           │
│  ┌─────────────────────────────────▼─────────────────────────────────────────┐   │
│  │                         IContextManager                                  │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │   │
│  │  │ active()    │ │ with()      │ │ bind()      │ │ root()      │         │   │
│  │  │             │ │             │ │             │ │             │         │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘         │   │
│  └─────────────────────────────────┬─────────────────────────────────────────┘   │
│                                    │                                             │
│  Context Implementation Layer      │                                             │
│  ┌─────────────────────────────────▼─────────────────────────────────────────┐   │
│  │                          IContext Instances                              │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │   │
│  │  │ setValue()  │ │ getValue()  │ │ deleteValue │ │ Context     │         │   │
│  │  │             │ │             │ │ ()          │ │ Inheritance │         │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘         │   │
│  └─────────────────────────────────┬─────────────────────────────────────────┘   │
│                                    │                                             │
│  Context Propagation Layer         │                                             │
│  ┌─────────────────────────────────▼─────────────────────────────────────────┐   │
│  │                         Context Propagation                              │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │   │
│  │  │ W3C Trace   │ │ Baggage     │ │ Custom      │ │ Header      │         │   │
│  │  │ Context     │ │ Propagation │ │ Propagators │ │ Extraction  │         │   │
│  │  │             │ │             │ │             │ │ & Injection │         │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘         │   │
│  └─────────────────────────────────┬─────────────────────────────────────────┘   │
│                                    │                                             │
│  Storage Strategy Layer            │                                             │
│  ┌─────────────────────────────────▼─────────────────────────────────────────┐   │
│  │                         Context Storage                                  │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │   │
│  │  │ AsyncLocal  │ │ Zone.js     │ │ Manual      │ │ Browser     │         │   │
│  │  │ Storage     │ │ Storage     │ │ Storage     │ │ Storage     │         │   │
│  │  │             │ │             │ │             │ │ Strategy    │         │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘         │   │
│  └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Context Manager Interfaces

```typescript
/**
 * Public interface for the Context Manager configuration
 */
export interface IContextConfig {
  /** Maximum number of nested contexts */
  maxContextNesting?: number;
  /** Whether to use async hooks for context tracking */
  useAsyncHooks?: boolean;
}

/**
 * Public interface for the Context Manager
 */
export interface IContextManager {
  /**
   * Returns the active context
   */
  active(): IContext;
  
  /**
   * Calls the given function with the provided context
   * @param context The context to use
   * @param fn The function to call
   * @returns The return value of fn
   */
  with<T>(context: IContext, fn: () => T): T;
  
  /**
   * Binds a function to a context
   * @param context The context to bind
   * @param fn The function to bind
   * @returns A new function that will call fn with the provided context
   */
  bind<T extends Function>(context: IContext, fn: T): T;
  
  /**
   * Creates a new root context
   * @returns A new root context
   */
  root(): IContext;
}

/**
 * @internal
 * Internal interface for the Context Manager
 */
export interface _IContextManagerInternal extends IContextManager {
  _setActiveContext(context: IContext): void;
  _getActiveContext(): IContext;
}
```

## Context Interface

```typescript
/**
 * Public interface for context
 */
export interface IContext {
  /**
   * Sets a value in the context
   * @param key The key to set
   * @param value The value to set
   * @returns A new context with the value set
   */
  setValue<T>(key: string, value: T): IContext;
  
  /**
   * Gets a value from the context
   * @param key The key to get
   * @returns The value or undefined
   */
  getValue<T>(key: string): T | undefined;
  
  /**
   * Deletes a value from the context
   * @param key The key to delete
   * @returns A new context with the value deleted
   */
  deleteValue(key: string): IContext;
}

/**
 * @internal
 * Internal interface for context
 */
export interface _IContextInternal extends IContext {
  _getValues(): Map<string, any>;
  _getParent(): IContext | undefined;
}
```

## Context Manager Implementation with Closures

```typescript
/**
 * Create a new Context Manager
 * @param config Configuration for the Context Manager
 * @returns A new Context Manager instance
 */
export function createContextManager(config: IContextConfig = {}): IContextManager {
  // Private closure variables
  let _config = config;
  let _activeContext: IContext;
  let _maxNesting = _config.maxContextNesting ?? 100;
  let _useAsyncHooks = _config.useAsyncHooks ?? false;
  
  // Create a root context
  _activeContext = createContext();
  
  // Create the instance
  let _self = {} as _IContextManagerInternal;
  
  // Define methods using DynamicProto
  dynamicProto({} as any, _self, (self: _IContextManagerInternal) => {
    // Get the active context
    self.active = (): IContext => {
      return _getActiveContext();
    };
    
    // Run a function with a context
    self.with = <T>(context: IContext, fn: () => T): T => {
      const previousContext = _activeContext;
      _setActiveContext(context);
      
      try {
        return fn();
      } finally {
        _setActiveContext(previousContext);
      }
    };
    
    // Bind a function to a context
    self.bind = <T extends Function>(context: IContext, fn: T): T => {
      return ((...args: any[]) => {
        return self.with(context, () => fn(...args));
      }) as unknown as T;
    };
    
    // Create a new root context
    self.root = (): IContext => {
      return createContext();
    };
    
    // Internal method to set the active context
    self._setActiveContext = (context: IContext): void => {
      _setActiveContext(context);
    };
    
    // Internal method to get the active context
    self._getActiveContext = (): IContext => {
      return _getActiveContext();
    };
  });
  
  /**
   * Set the active context
   * @param context The context to set as active
   */
  function _setActiveContext(context: IContext): void {
    _activeContext = context;
    
    // If using async hooks, register the context with the async hooks
    if (_useAsyncHooks) {
      _registerWithAsyncHooks(context);
    }
  }
  
  /**
   * Get the active context
   * @returns The active context
   */
  function _getActiveContext(): IContext {
    // If using async hooks, get the context from the async hooks
    if (_useAsyncHooks) {
      const asyncContext = _getFromAsyncHooks();
      if (asyncContext) {
        return asyncContext;
      }
    }
    
    return _activeContext;
  }
  
  /**
   * Register a context with async hooks
   * @param context The context to register
   */
  function _registerWithAsyncHooks(context: IContext): void {
    // This would use the AsyncLocalStorage API if available
    // For simplicity, we're not implementing this here
  }
  
  /**
   * Get the context from async hooks
   * @returns The context or undefined
   */
  function _getFromAsyncHooks(): IContext | undefined {
    // This would retrieve from the AsyncLocalStorage API if available
    // For simplicity, we're not implementing this here
    return undefined;
  }
  
  return _self;
}
```

## Context Implementation with Closures

```typescript
/**
 * Create a new Context
 * @param parent The parent context
 * @param values The values for the context
 * @returns A new Context instance
 */
export function createContext(parent?: IContext, values?: Map<string, any>): IContext {
  // Private closure variables
  let _parent = parent;
  let _values = values ? new Map(values) : new Map<string, any>();
  
  // Create the instance
  let _self = {} as _IContextInternal;
  
  // Define methods using DynamicProto
  dynamicProto({} as any, _self, (self: _IContextInternal) => {
    // Set a value
    self.setValue = <T>(key: string, value: T): IContext => {
      const newValues = new Map(_values);
      newValues.set(key, value);
      return createContext(_parent, newValues);
    };
    
    // Get a value
    self.getValue = <T>(key: string): T | undefined => {
      if (_values.has(key)) {
        return _values.get(key) as T;
      }
      
      if (_parent) {
        return (_parent as _IContextInternal).getValue<T>(key);
      }
      
      return undefined;
    };
    
    // Delete a value
    self.deleteValue = (key: string): IContext => {
      // If the value is not in this context, create a copy with the value deleted from the parent
      if (!_values.has(key) && _parent) {
        return createContext(_parent.deleteValue(key));
      }
      
      const newValues = new Map(_values);
      newValues.delete(key);
      return createContext(_parent, newValues);
    };
    
    // Internal methods
    self._getValues = (): Map<string, any> => {
      return new Map(_values);
    };
    
    self._getParent = (): IContext | undefined => {
      return _parent;
    };
  });
  
  return _self;
}
```

## Baggage Interface and Implementation

```typescript
/**
 * Public interface for Baggage
 */
export interface IBaggage {
  /**
   * Get a baggage value
   * @param key The key to get
   * @returns The baggage entry or undefined
   */
  get(key: string): IBaggageEntry | undefined;
  
  /**
   * Get all baggage entries
   * @returns An iterator of baggage entries
   */
  getAll(): [string, IBaggageEntry][];
  
  /**
   * Set a baggage value
   * @param key The key to set
   * @param value The value to set
   * @param metadata Optional metadata for the entry
   * @returns A new baggage with the entry set
   */
  set(key: string, value: string, metadata?: IBaggageMetadata): IBaggage;
  
  /**
   * Delete a baggage value
   * @param key The key to delete
   * @returns A new baggage with the entry deleted
   */
  delete(key: string): IBaggage;
  
  /**
   * Clear all baggage entries
   * @returns A new empty baggage
   */
  clear(): IBaggage;
}

/**
 * Interface for baggage entry
 */
export interface IBaggageEntry {
  /** The value of the entry */
  value: string;
  /** Optional metadata for the entry */
  metadata?: IBaggageMetadata;
}

/**
 * Interface for baggage metadata
 */
export interface IBaggageMetadata {
  /** The metadata value */
  value: string;
}

/**
 * Create a new Baggage
 * @param entries The initial baggage entries
 * @returns A new Baggage instance
 */
export function createBaggage(entries?: Map<string, IBaggageEntry>): IBaggage {
  // Private closure variables
  let _entries = entries ? new Map(entries) : new Map<string, IBaggageEntry>();
  
  // Create the instance
  let _self = {} as IBaggage;
  
  // Define methods using DynamicProto
  dynamicProto({} as any, _self, (self: IBaggage) => {
    // Get a baggage entry
    self.get = (key: string): IBaggageEntry | undefined => {
      return _entries.get(key);
    };
    
    // Get all baggage entries
    self.getAll = (): [string, IBaggageEntry][] => {
      return Array.from(_entries.entries());
    };
    
    // Set a baggage entry
    self.set = (key: string, value: string, metadata?: IBaggageMetadata): IBaggage => {
      const newEntries = new Map(_entries);
      newEntries.set(key, { value, metadata });
      return createBaggage(newEntries);
    };
    
    // Delete a baggage entry
    self.delete = (key: string): IBaggage => {
      const newEntries = new Map(_entries);
      newEntries.delete(key);
      return createBaggage(newEntries);
    };
    
    // Clear all baggage entries
    self.clear = (): IBaggage => {
      return createBaggage();
    };
  });
  
  return _self;
}

// Context keys
export const ACTIVE_SPAN_KEY = Symbol('active_span');
export const BAGGAGE_KEY = Symbol('baggage');

/**
 * Get the baggage from a context
 * @param context The context to get the baggage from
 * @returns The baggage or an empty baggage
 */
export function getBaggage(context: IContext): IBaggage {
  return context.getValue<IBaggage>(BAGGAGE_KEY as unknown as string) || createBaggage();
}

/**
 * Set the baggage in a context
 * @param context The context to set the baggage in
 * @param baggage The baggage to set
 * @returns A new context with the baggage set
 */
export function setBaggage(context: IContext, baggage: IBaggage): IContext {
  return context.setValue(BAGGAGE_KEY as unknown as string, baggage);
}
```

## Usage Example

```typescript
import { 
  createOTelWebSdk, 
  setBaggage, 
  getBaggage, 
  createBaggage 
} from "@microsoft/otel-web-sdk";

// Create a new SDK instance
const sdk = createOTelWebSdk();

// Initialize the SDK
sdk.initialize();

// Use the context manager
const contextManager = sdk.context;
const rootContext = contextManager.root();

// Set values in the context
const userContext = rootContext.setValue("user.id", "12345");

// Use baggage for distributed context
const baggage = createBaggage()
  .set("transaction.id", "abcdef")
  .set("tenant.id", "tenant1", { value: "sensitive" });

const baggageContext = setBaggage(userContext, baggage);

// Run code with the context
contextManager.with(baggageContext, () => {
  // Get the active context
  const ctx = contextManager.active();
  
  // Get values from the context
  const userId = ctx.getValue<string>("user.id");
  console.log(`User ID: ${userId}`);
  
  // Get baggage from the context
  const ctxBaggage = getBaggage(ctx);
  const transactionId = ctxBaggage.get("transaction.id")?.value;
  console.log(`Transaction ID: ${transactionId}`);
  
  // Create a span with the current context
  const tracer = sdk.trace.getTracer("my-component");
  const span = tracer.startSpan("my-operation");
  
  try {
    // Do some work...
  } finally {
    span.end();
  }
});

// Bind a function to a context
const boundFn = contextManager.bind(baggageContext, () => {
  // This function will always run with the baggageContext
  const ctx = contextManager.active();
  const userId = ctx.getValue<string>("user.id");
  console.log(`User ID: ${userId}`);
});

// Call the bound function
boundFn();

// Shutdown the SDK when done
window.addEventListener("unload", () => {
  sdk.shutdown().catch(console.error);
});
```

## Next Steps

For detailed implementation of other components, refer to the following documents:

- [OTelWebSdk-Trace.md](./OTelWebSdk-Trace.md)
- [OTelWebSdk-Log.md](./OTelWebSdk-Log.md)
- [OTelWebSdk-Metric.md](./OTelWebSdk-Metric.md)

## Testing and Performance

### Context-Specific Testing
For context management testing strategies including context propagation validation, async operation testing, and context isolation verification, see [Testing Strategy](./OTelWebSdk-Testing.md).

### Performance Optimization
For context performance optimization including efficient context storage, fast context switching, and memory management for context data, see [Performance Strategy](./OTelWebSdk-Performance.md).

### Migration from Existing Context Management
For migration strategies from custom context management solutions and integration with existing context frameworks, see [Migration Guide](./OTelWebSdk-Migration.md).
