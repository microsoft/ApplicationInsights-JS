# OpenTelemetry Web SDK - Complete Implementation Context

This is the **single authoritative document** for implementing the OpenTelemetry Web SDK. It contains all architectural requirements, interface definitions, implementation patterns, usage examples, and validation criteria needed for correct implementation.

## Document Purpose

- **Complete Implementation Guide**: All patterns, interfaces, and requirements in one place
- **Validation Reference**: Used to verify all contributions follow established patterns
- **AI Assistance Context**: Provides GitHub Copilot with complete context for code generation
- **Self-Contained**: No external document references required

---

## Executive Summary

The OpenTelemetry Web SDK is a modern, enterprise-grade telemetry solution for web applications providing:

- **Full OpenTelemetry API Compliance**: Traces, logs, and basic metrics
- **Multi-Instance Architecture**: Multiple SDK instances without global state conflicts
- **Web-Optimized Performance**: Minimal bundle size with ES2020+ target; SDK Loader handles < ES2015 browsers by either skipping SDK download entirely or loading an ES5-compatible No-Op implementation (API exists but does nothing)
- **Enterprise Features**: Dynamic configuration, complete unload/cleanup, multi-tenant support
- **Application Insights Integration**: Support for migration from existing Application Insights implementations

### Key Differentiators from Standard OpenTelemetry

| Aspect | Standard OTel | OTelWebSdk |
|--------|---------------|------------|
| Global State | Uses global providers | NO global state - IoC pattern |
| Multi-Instance | Single global instance | Multiple isolated instances |
| Bundle Size | Larger | Optimized for web (tree-shaking) |
| Browser Support | Modern only | ES2020+ full SDK; < ES2015 via SDK Loader (no SDK or ES5 No-Op) |
| Unload Support | Limited | Complete cleanup and unload |
| Multi-Team | Shared configuration | Team isolation with resource sharing |

---

## CRITICAL Architectural Requirements

### 1. NO Global State

**MANDATORY**: The SDK MUST NOT use any global variables, window properties, or static state.

```typescript
// ❌ WRONG: Global singleton access
class BadProvider {
  getTracer() {
    return globalTracerRegistry.get('default'); // Uses global state
  }
}

// ❌ WRONG: Static state access
class BadProcessor {
  process(span: IOTelSpan) {
    static _counter++; // Static state
    window.spanCount = _counter; // Window property
  }
}

// ✅ CORRECT: Dependency injection through factory
export function createTraceProvider(config: ITraceProviderConfig): IOTelTraceProvider {
  // All dependencies from config - no global access
  let _resource = config.resource;
  let _processors = config.spanProcessors;
  let _sampler = config.sampler;
  
  // Implementation uses only injected dependencies
}
```

### 2. NO OpenTelemetry Package Imports

**MANDATORY**: Never import `@opentelemetry/*` packages directly.

Many OpenTelemetry packages have side effects that automatically register global implementations. Instead:

- Define **interface-only** contracts compatible with OpenTelemetry via duck typing
- Use `IOTel` prefix for OpenTelemetry-compatible interfaces
- This enables ecosystem compatibility while maintaining multi-instance isolation
- Only exposes the interfaces, type and enums as the public API (No Concrete Classes)

```typescript
// ❌ WRONG: Importing OpenTelemetry packages directly
import { trace } from '@opentelemetry/api';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';

// ✅ CORRECT: Define compatible interfaces
export interface IOTelTraceProvider {
  getTracer(name: string, version?: string): IOTelTracer;
  // ...
}
```

### 3. Interface-First Design

**MANDATORY**: All components must have dedicated interfaces defined BEFORE implementation.

**Naming Conventions**:
| Type | Prefix | Example |
|------|--------|---------|
| Public Interfaces | `I` | `ISdkConfig`, `ISdkLoader` |
| OpenTelemetry Compatible | `IOTel` | `IOTelTraceProvider`, `IOTelSpan`, `IOTelLogger` |
| Internal Interfaces | `_I` + `@internal` tag | `_ISpanProcessor` |
| Factory Functions | `create*` | `createOTelWebSdk`, `createTraceProvider` |
| Const Enums (internal) | `e` prefix | `eSpanKind`, `eLogSeverity` |
| Public Enum Objects | No prefix | `SpanKind`, `LogSeverity` |

**Interface Requirements**:
- All public interfaces MUST have comprehensive TypeDoc documentation
- All properties and methods MUST have explicit return types
- Factory functions MUST return interface types, NOT implementation types
- Implementation classes (only if required) MUST be private/internal, never exported

```typescript
/**
 * Configuration interface for the OpenTelemetry Web SDK
 * @description Provides all configuration options for SDK initialization
 * @example
 * ```typescript
 * const config: IOTelWebSdkConfig = {
 *   resource: myResource,
 *   logger: myLogger,
 *   spanProcessors: [myProcessor]
 * };
 * ```
 */
export interface IOTelWebSdkConfig {
  /** REQUIRED: Resource information for this SDK instance */
  resource: IOTelResource;
  
  /** REQUIRED: Logger for SDK internal diagnostics */
  logger: IOTelLogger;
  
  /** Connection string for telemetry ingestion */
  connectionString?: string;
  
  // ... all properties with documentation
}
```

### 4. Factory Function Pattern

**MANDATORY**: All components created through factory functions following `create*` naming convention.

```typescript
// Factory function signature - returns interface, not implementation
export function createOTelWebSdk(config: IOTelWebSdkConfig): IOTelWebSdk;
export function createTraceProvider(config: ITraceProviderConfig): IOTelTraceProvider;
export function createLogProvider(config: ILogProviderConfig): IOTelLogProvider;
export function createMeterProvider(config: IMeterProviderConfig): IOTelMeterProvider;
```

**Factory Requirements**:
- Handle all initialization complexity
- Validate all configuration inputs
- Inject dependencies - never access them globally
- Return interface types only
- Hide implementation details

### 5. Enum Design Pattern

**MANDATORY**: Use `createEnumStyle` helper for publicly exported enums, as this generates a smaller footprint for older runtimes.

```typescript
// Internal const enum (not exported, for SDK internal use)
export const enum eSpanKind {
  INTERNAL = 0,
  SERVER = 1,
  CLIENT = 2,
  PRODUCER = 3,
  CONSUMER = 4
}

// Public enum-style object (exported for consumers)
import { createEnumStyle } from "@microsoft/applicationinsights-core-js";

export const SpanKind = (/* @__PURE__ */createEnumStyle<typeof eSpanKind>({
  INTERNAL: eSpanKind.INTERNAL,
  SERVER: eSpanKind.SERVER,
  CLIENT: eSpanKind.CLIENT,
  PRODUCER: eSpanKind.PRODUCER,
  CONSUMER: eSpanKind.CONSUMER
}));

// Type definition
export type SpanKind = number | eSpanKind;
```

### 6. Configuration Handling

**MANDATORY**: Components MUST use the passed-in config directly and NEVER copy it using spread operator.

```typescript
// ❌ WRONG: Copying config with spread operator
export function createTraceProvider(config: ITraceProviderConfig): IOTelTraceProvider {
  let _config = { ...config }; // NEVER do this - breaks dynamic config
  let _processors = [...config.spanProcessors]; // NEVER copy arrays from config
}

// ✅ CORRECT: Use config directly with onConfigChange for local optimizations
export function createTraceProvider(config: ITraceProviderConfig): IOTelTraceProvider {
  // Use config directly - NEVER copy it
  // For local variable optimization, use onConfigChange callback
  let _resource: IOTelResource;
  let _samplingRate: number;
  
  // Register for config changes - SAVE the returned IUnloadHook
  let _configUnload = onConfigChange(config, () => {
    _resource = config.resource;
    _samplingRate = config.samplingRate ?? 1.0;
  });
  
  // During shutdown/unload, call _configUnload.rm() to unregister the listener
  // Access config properties directly or use cached local variables
  // Local variables are updated automatically when config changes
}
```

**Why This Matters**:
- The SDK supports **dynamic configuration** - config values can change at runtime
- Copying config with spread creates a static snapshot that won't reflect updates
- `onConfigChange` callbacks are invoked when config properties change
- Local variables wrapped in `onConfigChange` stay synchronized with config
- `onConfigChange` returns an `IUnloadHook` instance - MUST save it and call `.rm()` during component shutdown

---

## Implementation Patterns

### Pattern 1: Closure-Based Implementation (REQUIRED for simple interfaces)

Use closures for interface implementations when class inheritance is NOT needed:

```typescript
export function createTraceProvider(config: ITraceProviderConfig): IOTelTraceProvider {
  // Validate required dependencies upfront
  if (!config.resource) {
    throw new Error("Resource must be provided to TraceProvider");
  }
  if (!config.spanProcessors) {
    throw new Error("SpanProcessors must be provided to TraceProvider");
  }
  
  // Private closure variables - completely encapsulated
  // IMPORTANT: Do NOT copy config - use it directly or cache with onConfigChange
  let _tracers = new Map<string, IOTelTracer>();
  let _isShutdown = false;
  
  // Local cached values for performance - updated via onConfigChange
  let _resource: IOTelResource;
  let _contextManager: IOTelContextManager;
  
  // Register for config changes - SAVE the returned IUnloadHook
  let _configUnload = onConfigChange(config, () => {
    _resource = config.resource;
    _contextManager = config.contextManager;
  });
  
  // Create the interface instance
  let _self = {} as IOTelTraceProvider;
  
  // Define methods directly on the interface instance
  _self.getTracer = (name: string, version?: string, options?: IOTelTracerOptions): IOTelTracer => {
    if (_isShutdown) {
      throw new Error("TraceProvider is shutdown");
    }
    
    const key = `${name}@${version || 'unknown'}`;
    let tracer = _tracers.get(key);
    
    if (!tracer) {
      tracer = createTracer({
        name,
        version,
        resource: _resource,               // Use cached local variable
        processors: config.spanProcessors, // Access config directly for arrays
        contextManager: _contextManager,   // Use cached local variable
        options: options                   // Pass options object directly
      });
      _tracers.set(key, tracer);
    }
    
    return tracer;
  };
  
  _self.addSpanProcessor = (processor: IOTelSpanProcessor): void => {
    if (_isShutdown) {
      throw new Error("TraceProvider is shutdown");
    }
    // Add directly to config's processor array - NOT a local copy
    config.spanProcessors.push(processor);
  };
  
  _self.forceFlush = async (): Promise<void> => {
    // Access config.spanProcessors directly
    const flushPromises = config.spanProcessors.map(p => p.forceFlush());
    await Promise.all(flushPromises);
  };
  
  _self.shutdown = async (): Promise<void> => {
    if (_isShutdown) return;
    _isShutdown = true;
    
    // Unregister config change listener - call rm() on the saved IUnloadHook
    _configUnload.rm();
    
    // Access config.spanProcessors directly
    const shutdownPromises = config.spanProcessors.map(p => p.shutdown());
    await Promise.all(shutdownPromises);
    _tracers.clear();
  };
  
  return _self;
}
```

**Closure Pattern Benefits**:
- Superior bundle size optimization (minifier can rename closure variables)
- True private state - completely inaccessible from outside
- Enhanced tree-shaking
- Browser compatibility

---

## Core Interfaces (Required)

### Main SDK Interface

```typescript
export interface IOTelWebSdk {
  /** Get a tracer for creating spans */
  getTracer(name: string, version?: string, options?: IOTelTracerOptions): IOTelTracer;
  
  /** Get a logger for emitting log records */
  getLogger(name: string, version?: string, options?: IOTelLoggerOptions): IOTelLogger;
  
  /** Get a meter for recording metrics (basic: counters, histograms, gauges only) */
  getMeter(name: string, version?: string, options?: IOTelMeterOptions): IOTelMeter;
  
  /** Update SDK configuration at runtime */
  updateConfig(config: Partial<IOTelWebSdkConfig>): Promise<void>;
  
  /** Completely unload the SDK and cleanup all resources */
  unload(onDone?: (result: IUnloadResult) => void, timeoutMs?: number): Promise<IUnloadResult>;
  
  /** Get current configuration (read-only) */
  getConfig(): Readonly<IOTelWebSdkConfig>;
  
  /** Get SDK instance statistics */
  getStats(): ISDKInstanceStats;
}
```

### SDK Factory Interface

```typescript
export interface ISdkFactory {
  /** Factory information */
  readonly info: ISdkFactoryInfo;
  
  /** Create a new SDK instance */
  newInst(name: string, config: IOTelWebSdkConfig): IOTelWebSdk;
  
  /** Get an existing instance by name */
  getInst(name: string): IOTelWebSdk | undefined;
  
  /** Check if instance exists */
  hasInstance(name: string): boolean;
  
  /** Get count of managed instances */
  getInstanceCount(): number;
  
  /** Get names of all instances */
  getInstanceNames(): string[];
  
  /** Unload all managed instances */
  unloadAllInstances(): Promise<void>;
}

export interface ISdkFactoryInfo {
  /** Unique factory ID */
  id: string;
  
  /** SDK version */
  ver: string;
  
  /** How factory was loaded */
  loadMethod: 'npm' | 'cdn' | 'dynamic';
}
```

---

## Configuration Requirements

### Required Dependencies (Must Be Injected)

All SDK components MUST receive these dependencies through configuration:

```typescript
export interface IOTelWebSdkConfig {
  /** REQUIRED: Resource information for telemetry source identification */
  resource: IOTelResource;
  
  /** REQUIRED: Logger for SDK internal diagnostics */
  logger: IOTelLogger;
  
  /** REQUIRED: Performance timing function (injected for testability) */
  performanceNow: () => number;
  
  /** REQUIRED: Span processors for trace pipeline */
  spanProcessors: IOTelSpanProcessor[];
  
  /** REQUIRED: Log processors for log pipeline */
  logProcessors: IOTelLogProcessor[];
  
  /** REQUIRED: Metric readers for metric pipeline */
  metricReaders: IOTelMetricReader[];
  
  /** REQUIRED: Context manager implementation */
  contextManager: IOTelContextManager;
  
  /** REQUIRED: ID generator for span/trace IDs */
  idGenerator: IOTelIdGenerator;
  
  /** REQUIRED: Sampler implementation */
  sampler: IOTelSampler;
}
```

---

## Performance Requirements

### Frame Budget: 5ms Guideline

**GUIDELINE**: Telemetry operations should complete within 5ms to avoid UI jank.

| Operation | Target Time |
|-----------|------------|
| SDK Initialization | < 5ms (p95) |
| Span Creation | < 0.1ms (p95) |
| Attribute Addition | < 0.05ms (p95) |
| Context Propagation | < 0.1ms (p95) |
| Span Completion | < 0.2ms (p95) |

### Timer Management Requirements

**MANDATORY**: Follow these timer rules:

- **MUST NOT use interval timers** that run continuously without purpose
- **On-Demand Timer Usage**: Timers MUST only be started when there is a specific action to perform
- **Automatic Timer Cleanup**: All timers MUST be stopped immediately when there is no pending work
- **Timer Coalescing**: Minimize timer count by coalescing multiple operations within each SDK instance

---

## Testing Requirements

### Test Framework Requirements

The testing framework for this SDK must support:

1. **Coverage Reporting**: Full code coverage tracking and reporting capabilities
2. **Instance Cleanup Validation**: Automatic detection and enforcement that all SDK instances are properly cleaned up after each test
3. **Test Failure on Cleanup Issues**: Tests MUST fail automatically if any resources, hooks, or instances are not properly unloaded/shutdown after test completion
4. **Dynamic Configuration Testing**: Support for testing configuration changes at runtime

### Cleanup Enforcement

The test framework MUST:
- Track all SDK instances created during a test
- Verify all instances have been unloaded/shutdown before test completion
- Automatically fail tests that leave orphaned instances or resources
- Report which resources were not cleaned up to aid debugging

### Common Anti-Patterns to Avoid

- ❌ Skipping `unload()` or `shutdown()` cleanup
- ❌ Testing only static configuration (must test dynamic config changes)
- ❌ Leaving hooks or resources active between tests
- ❌ Not validating that cleanup actually occurred

---

## Code Style Requirements

### TypeScript Conventions

**MANDATORY**: All conventions MUST be enforced by ESLint rules with auto-fix enabled during builds.

- Use **4-space indentation**
- Maximum line length: **140 characters**
- Always use semicolons
- Use `let/const` in TypeScript (use `var` in JavaScript for ES5 compatibility)

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Classes | PascalCase | `PageViewManager`, `TelemetryContext` |
| Interfaces | PascalCase with `I` prefix | `ITelemetryItem`, `IPageViewTelemetry` |
| Methods/Functions | camelCase | `trackPageView`, `sendTelemetry` |
| Constants | UPPER_SNAKE_CASE | `MAX_DURATION_ALLOWED` |
| Private variables | underscore prefix | `_logger`, `_hasInitialized` |
| Enums | `e` prefix for const enums | `eLoggingSeverity`, `eInternalMessageId` |

### Error Handling

**MANDATORY**: Error handling MUST use configured error handlers via the `IOTelErrorHandlers` interface and the helper functions from `handleErrors.ts`:

**Helper Functions** (pass handlers from config):
- `handleAttribError(handlers, message, key, value)` - Attribute validation errors
- `handleSpanError(handlers, message, spanName)` - Span-specific errors
- `handleDebug(handlers, message)` - Debug messages
- `handleWarn(handlers, message)` - Warning messages
- `handleError(handlers, message)` - Error messages
- `handleNotImplemented(handlers, message)` - Not implemented warnings

**Behavior**:
- Functions use configured handler callbacks when provided
- Fall back to console logging when handlers are not configured
- Enables configurable reporting levels and debug mode throw/break behavior

**Truly internal errors** (where handlers are not available) may fall back to console logging.

```typescript
// Usage - access handlers from config
export function createTraceProvider(config: ITraceProviderConfig): IOTelTraceProvider {
  let _handlers = config.errorHandlers;
  
  if (!config.resource) {
    handleError(_handlers, "Resource must be provided to TraceProvider");
  }
  // ...
}
```

---

## Validation Checklist

Use this checklist to validate contributions:

### Architecture Compliance

- [ ] No global state or singleton access
- [ ] No `@opentelemetry/*` package imports
- [ ] All public APIs have dedicated interfaces
- [ ] Factory functions return interface types
- [ ] Dependencies injected through configuration

### Implementation Compliance

- [ ] Uses closure pattern with factory functions
- [ ] Private state encapsulated in closures
- [ ] All required dependencies validated upfront
- [ ] Error handling uses `IOTelErrorHandlers` with helper functions
- [ ] Config used directly - NO spread operator to copy config
- [ ] Local config caching uses `onConfigChange` callback
- [ ] `onConfigChange` returns `IUnloadHook` - saved and `.rm()` called during shutdown

### Interface Compliance

- [ ] Interface naming follows conventions (I, IOTel, _I)
- [ ] Factory functions follow `create*` pattern
- [ ] Enums use `createEnumStyle` for public exports
- [ ] Complete TypeDoc documentation on public interfaces

### Performance Compliance

- [ ] No interval timers without purpose
- [ ] Operations within frame budget guidelines
- [ ] Proper resource cleanup on shutdown/unload

### Testing Compliance

- [ ] Test framework supports coverage reporting
- [ ] Instance cleanup validated automatically
- [ ] Tests fail if resources not cleaned up after unload
- [ ] Dynamic configuration changes tested

---

## Quick Reference

### Factory Usage (NPM)

```typescript
import { createSdkFactory } from '@microsoft/applicationinsights-otelwebsdk-js';

const factory = createSdkFactory();
const sdk = factory.newInst('my-app', {
  connectionString: 'InstrumentationKey=your-key',
  resource: myResource,
  logger: myLogger,
  // ... other required dependencies
});

await sdk.initialize();

// Get tracer and create spans
const tracer = sdk.getTracer('my-service');
const span = tracer.startSpan('operation');
span.setAttributes({ 'key': 'value' });
span.end();

// Cleanup
await sdk.unload();
```

### Factory Usage (CDN - MUST use callbacks)

```typescript
createSdkFactory({
  src: 'https://js.monitor.azure.com/scripts/otel/otel-web-sdk.min.js',
  onInit: (factory) => {
    const sdk = factory.newInst('my-app', config);
    sdk.initialize();
  },
  onError: (error) => {
    console.error('Failed to load SDK:', error);
  }
});
```

---

## Telemetry Initializers (Lightweight Processors)

The SDK provides both full OpenTelemetry processors AND lightweight telemetry initializers for performance-critical scenarios.

### Telemetry Initializer Interface

```typescript
/**
 * Lightweight callback-based telemetry processor
 * ~1-2μs per item vs ~5-10μs for full OTel processors
 */
export interface ITelemetryInitializer {
  (item: ITelemetryItem): boolean | void;
}

export interface ITelemetryItem {
  name: string;
  time: string;
  baseType: string;
  baseData: any;
  data: {
    customProperties?: Record<string, string>;
    customMeasurements?: Record<string, number>;
  };
  tags?: Record<string, string>;
}
```

### When to Use Each Approach

| Use Telemetry Initializers For | Use OpenTelemetry Processors For |
|-------------------------------|----------------------------------|
| Data enrichment (adding context) | Complex transformations |
| Privacy filtering (removing PII) | Custom batching strategies |
| Simple sampling | Export control |
| Quick filtering decisions | Lifecycle hooks (onStart, onEnd) |
| Performance-critical paths | State management |
| Migration from Application Insights | Advanced scenarios |

### Telemetry Initializer Examples

```typescript
// Data Enrichment - Add application context
sdk.addTelemetryInitializer((item: ITelemetryItem) => {
  item.data.customProperties = item.data.customProperties || {};
  item.data.customProperties['app.version'] = getAppVersion();
  item.data.customProperties['app.environment'] = getEnvironment();
  return true; // Continue processing
});

// Privacy Filtering - Remove PII from URLs
sdk.addTelemetryInitializer((item: ITelemetryItem) => {
  if (item.baseType === 'PageviewData' && item.baseData?.uri) {
    const url = new URL(item.baseData.uri);
    const sensitiveParams = ['email', 'token', 'password', 'ssn'];
    sensitiveParams.forEach(param => url.searchParams.delete(param));
    item.baseData.uri = url.toString();
  }
  return true;
});

// PII Removal from Exceptions
sdk.addTelemetryInitializer((item: ITelemetryItem) => {
  if (item.baseType === 'ExceptionData' && item.baseData?.exceptions) {
    item.baseData.exceptions.forEach(exception => {
      if (exception.message) {
        // Remove email patterns
        exception.message = exception.message.replace(
          /[\w.-]+@[\w.-]+\.\w+/g, '[email]'
        );
        // Remove phone patterns
        exception.message = exception.message.replace(
          /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[phone]'
        );
      }
    });
  }
  return true;
});

// Performance-Based Sampling
sdk.addTelemetryInitializer((item: ITelemetryItem) => {
  // Sample high-frequency events at 1%
  if (item.name === 'mouse-move' || item.name === 'scroll') {
    return Math.random() < 0.01;
  }
  
  // Always keep errors
  if (item.baseType === 'ExceptionData') {
    return true;
  }
  
  // Sample successful requests at 25%
  if (item.baseType === 'RequestData' && item.baseData?.success) {
    return Math.random() < 0.25;
  }
  
  return true;
});

// User Context Enrichment
sdk.addTelemetryInitializer((item: ITelemetryItem) => {
  const user = getCurrentUser();
  if (user) {
    item.tags = item.tags || {};
    item.tags['ai.user.id'] = user.anonymousId;
    item.data.customProperties = item.data.customProperties || {};
    item.data.customProperties['user.role'] = user.role;
    item.data.customProperties['user.tier'] = user.subscription;
  }
  return true;
});
```

### Initializer Execution Order

```typescript
// Initializers execute in registration order
// Design for proper chaining:

// 1. Basic context (first)
sdk.addTelemetryInitializer(addBasicContext);

// 2. User context (may depend on basic context)
sdk.addTelemetryInitializer(addUserContext);

// 3. Business context (may depend on user context)
sdk.addTelemetryInitializer(addBusinessContext);

// 4. Privacy filtering (after all context added)
sdk.addTelemetryInitializer(applyPrivacyFiltering);

// 5. Sampling (final step)
sdk.addTelemetryInitializer(applySampling);
```

---

## Dynamic Instrumentation Management

The SDK supports runtime loading/unloading of instrumentations without restarting the SDK.

### Instrumentation Manager Interface

```typescript
export interface IInstrumentationManager {
  /** Load an instrumentation at runtime */
  load(name: string, config?: IOTelInstrumentationConfig): Promise<ILoadResult>;
  
  /** Check if instrumentation is loaded */
  isLoaded(name: string): boolean;
  
  /** Get loaded instrumentation instance */
  get(name: string): IInstrumentation | undefined;
  
  /** List all loaded instrumentations */
  list(): string[];
  
  /** Unload specific instrumentation */
  unload(name: string): Promise<void>;
}

export interface IOTelInstrumentationConfig {
  /** Whether instrumentation is enabled */
  enabled?: boolean;
  
  /** Custom properties for attribution */
  customProperties?: Record<string, string>;
  
  /** Performance monitoring integration */
  enablePerfMonitoring?: boolean;
}

export interface ILoadResult {
  /** Whether load was successful */
  success: boolean;
  
  /** Error if failed */
  error?: Error;
  
  /** Load time in milliseconds */
  loadTimeMs: number;
}
```

### Dynamic Instrumentation Usage

```typescript
// Load instrumentation at runtime
await sdk.getInstrumentationManager().load('xhr', {
  enabled: true,
  customProperties: { 'team.name': 'frontend' }
});

// Check if loaded
if (sdk.getInstrumentationManager().isLoaded('xhr')) {
  console.log('XHR tracking active');
}

// List all loaded
const loaded = sdk.getInstrumentationManager().list();
// ['xhr', 'fetch', 'errors']

// Unload for performance optimization
await sdk.getInstrumentationManager().unload('xhr');
```

### Third-Party Instrumentation Registration

```typescript
// Define custom instrumentation
class ReactInstrumentation implements IThirdPartyInstrumentation {
  readonly name = 'react-components';
  readonly version = '1.0.0';
  readonly vendor = 'my-org';
  
  async initialize(config: IOTelInstrumentationConfig): Promise<void> {
    // Setup React component tracking
  }
  
  async enable(): Promise<void> {
    // Start tracking
  }
  
  async disable(): Promise<void> {
    // Stop tracking
  }
  
  async dispose(): Promise<void> {
    await this.disable();
    // Cleanup resources
  }
}

// Register with factory
factory.registerInstrumentation('react-components', () => new ReactInstrumentation());

// Teams can now load it
await sdk.getInstrumentationManager().load('react-components');
```

### A/B Testing with Instrumentations

```typescript
// Hot-swap instrumentations for experiments
const experimentGroup = determineExperimentGroup(userId);

if (experimentGroup === 'control') {
  await sdk.getInstrumentationManager().load('basic-click-tracking');
} else {
  await sdk.getInstrumentationManager().load('enhanced-interaction-tracking', {
    customProperties: { 'experiment.group': 'variant-a' }
  });
}

// Switch mid-session
async function switchExperiment(newGroup: string): Promise<void> {
  await sdk.getInstrumentationManager().unload('basic-click-tracking');
  await sdk.getInstrumentationManager().load('enhanced-interaction-tracking', {
    customProperties: { 'experiment.group': newGroup }
  });
}
```

---

## Multi-Team Usage Examples

### Basic Multi-Team Setup

```typescript
import { createSdkFactory } from '@microsoft/applicationinsights-otelwebsdk-js';

const factory = createSdkFactory();

// Team A - E-commerce
const ecommerceSDK = factory.newInst('ecommerce-team', {
  connectionString: 'InstrumentationKey=ecommerce-key',
  resource: createResource({ 'service.name': 'ecommerce-frontend' }),
  // ... other required dependencies
});

// Team B - Analytics (completely separate)
const analyticsSDK = factory.newInst('analytics-team', {
  connectionString: 'InstrumentationKey=analytics-key',
  resource: createResource({ 'service.name': 'analytics-widgets' }),
  // ... other required dependencies
});

// Initialize independently
await ecommerceSDK.initialize();
await analyticsSDK.initialize();

// Each team uses their isolated instance
const ecomTracer = ecommerceSDK.getTracer('shopping-cart');
const analyticsTracer = analyticsSDK.getTracer('dashboard');

// Teams can unload independently
await ecommerceSDK.unload(); // Only ecommerce stops
// Analytics continues working
```

### Instance Discovery and Management

```typescript
// Check for existing instances (avoid duplicates)
if (factory.hasInstance('ecommerce-team')) {
  const existingSDK = factory.getInst('ecommerce-team');
  // Use existing instance
} else {
  const newSDK = factory.newInst('ecommerce-team', config);
}

// List all instances
console.log(`Active teams: ${factory.getInstanceNames()}`);
// ['ecommerce-team', 'analytics-team']

console.log(`Instance count: ${factory.getInstanceCount()}`);
// 2

// Coordinated shutdown
await factory.unloadAllInstances();
```

### CDN Loading with Callbacks (REQUIRED for CDN)

```typescript
// NEVER rely on synchronous return value for CDN loading
// ALWAYS use callbacks

createSdkFactory({
  src: 'https://js.monitor.azure.com/scripts/otel/otel-web-sdk.min.js',
  onInit: (factory) => {
    console.log(`SDK loaded: ${factory.info.ver}`);
    
    const sdk = factory.newInst('my-app', {
      connectionString: 'InstrumentationKey=your-key',
      // ... config
    });
    
    sdk.initialize().then(() => {
      const tracer = sdk.getTracer('my-service');
      // Start using
    });
  },
  onError: (error) => {
    console.error('SDK load failed:', error);
    // Implement fallback
  }
});

// The return value may be null/undefined during CDN loading!
// const factory = createSdkFactory({...}); // DON'T rely on this
```

### OpenTelemetry API Usage (Instance-Specific)

```typescript
// Get instance-specific providers (NOT global)
const tracer = sdk.getTracer('my-service', '1.0.0');
const logger = sdk.getLogger('my-service', '1.0.0');
const meter = sdk.getMeter('my-service', '1.0.0');

// Create spans
const span = tracer.startSpan('user-action');
span.setAttributes({
  'user.id': '12345',
  'action.type': 'button-click'
});
span.addEvent('validation-started');
span.setStatus({ code: SpanStatusCode.OK });
span.end();

// Active span pattern
tracer.startActiveSpan('database-query', async (span) => {
  try {
    const result = await queryDatabase();
    span.setAttributes({ 'db.rows_affected': result.rowCount });
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    throw error;
  } finally {
    span.end();
  }
});

// Emit logs
logger.info('User logged in', {
  'user.id': '12345',
  'session.id': 'abc-123'
});

// Record metrics
const counter = meter.createCounter('page_views_total');
counter.add(1, { 'page.name': 'home' });

const histogram = meter.createHistogram('request_duration_ms');
histogram.record(150, { 'endpoint': '/api/users' });
```

### Application Insights Compatibility (Optional)

```typescript
// Optional backward-compatible methods
sdk.trackPageView?.({
  name: 'Product Page',
  uri: '/products/123',
  properties: { category: 'electronics' }
});

sdk.trackEvent?.({
  name: 'Feature Used',
  properties: { 'feature.name': 'advanced-search' }
});

sdk.trackException?.({
  exception: new Error('Payment failed'),
  severityLevel: SeverityLevel.ERROR
});

sdk.trackDependency?.({
  name: 'GET /api/users',
  duration: 250,
  success: true,
  resultCode: 200
});
```

---

## Performance Optimization Techniques

### Lazy Initialization Pattern

```typescript
export function createTraceProvider(config: ITraceProviderConfig): IOTelTraceProvider {
  let _tracers: Map<string, IOTelTracer> | null = null;
  
  function _getTracersMap(): Map<string, IOTelTracer> {
    if (!_tracers) {
      _tracers = new Map(); // Created only when first needed
    }
    return _tracers;
  }
  
  let _self = {} as IOTelTraceProvider;
  
  _self.getTracer = (name: string, version?: string): IOTelTracer => {
    const tracers = _getTracersMap();
    // ...
  };
  
  return _self;
}
```

### Object Pooling for Spans

```typescript
function createSpanPool(maxSize: number = 100): ISpanPool {
  let _pool: IOTelSpan[] = [];
  
  return {
    acquire(): IOTelSpan {
      if (_pool.length > 0) {
        return _pool.pop()!; // Reuse existing
      }
      return createNewSpan(); // Create new only when pool empty
    },
    
    release(span: IOTelSpan): void {
      if (_pool.length < maxSize) {
        resetSpan(span); // Clear data
        _pool.push(span); // Return to pool
      }
      // Else let GC handle it
    }
  };
}
```

### Efficient Attribute Management

```typescript
// Use type-specific Maps for attributes
function createAttributeStore(): IAttributeStore {
  let _strings: Map<string, string> | null = null;
  let _numbers: Map<string, number> | null = null;
  let _booleans: Map<string, boolean> | null = null;
  
  return {
    setString(key: string, value: string): void {
      if (!_strings) _strings = new Map();
      _strings.set(key, value);
    },
    
    setNumber(key: string, value: number): void {
      if (!_numbers) _numbers = new Map();
      _numbers.set(key, value);
    },
    
    // ... efficient iteration without object creation
  };
}
```

### Batch Processing

```typescript
function createBatchProcessor(config: IBatchConfig): IOTelSpanProcessor {
  let _queue: IOTelSpan[] = [];
  let _timer: any = null;
  
  function _scheduleExport(): void {
    // Only create timer when needed
    if (_timer || _queue.length === 0) return;
    
    _timer = setTimeout(() => {
      _timer = null;
      _flushBatch();
    }, config.delayMs);
  }
  
  async function _flushBatch(): Promise<void> {
    const batch = _queue.splice(0, config.maxBatchSize);
    if (batch.length > 0) {
      await config.exporter.export(batch);
    }
    
    // Schedule next if more items
    if (_queue.length > 0) {
      _scheduleExport();
    }
  }
  
  // ... processor implementation
}
```

### Performance Monitoring Integration

```typescript
// Optional integration with Application Insights doPerf/IPerfManager
export function createTracerWithPerf(
  config: ITracerConfig,
  perfManager?: IPerfManager
): IOTelTracer {
  let _self = {} as IOTelTracer;
  
  _self.startSpan = (name: string, options?: IOTelSpanOptions): IOTelSpan => {
    // Track SDK overhead when perfManager provided
    return doPerf(perfManager, () => `tracer.startSpan:${name}`, () => {
      return _createSpanInternal(name, options);
    });
  };
  
  return _self;
}
```

---

## Browser Compatibility

### Runtime Requirements

| Target | Support Level |
|--------|--------------|
| ES2020+ browsers | Full SDK functionality |
| ES2015+ browsers | Loader only (detection + fallback) |
| < ES2015 | SDK Loader either: (1) skips SDK download entirely, or (2) downloads ES5-compatible No-Op implementation (API exists but does nothing) |

### Specific Browser Support

| Browser | Full SDK | Loader Only | Fallback (No SDK or ES5 No-Op) |
|---------|----------|-------------|-------------------------------|
| Chrome 80+ | ✓ | - | - |
| Firefox 75+ | ✓ | - | - |
| Safari 13+ | ✓ | - | - |
| Edge 80+ | ✓ | - | - |
| Chrome 60-79 | - | ✓ | - |
| IE 11 | - | - | ✓ |

### Graceful Degradation

```typescript
// Network API fallback chain
async function sendTelemetry(data: any): Promise<void> {
  if (typeof fetch !== 'undefined') {
    await fetch(endpoint, { method: 'POST', body: JSON.stringify(data) });
  } else if (typeof XMLHttpRequest !== 'undefined') {
    await sendWithXHR(endpoint, data);
  } else if (typeof navigator.sendBeacon === 'function') {
    navigator.sendBeacon(endpoint, JSON.stringify(data));
  } else {
    // Image beacon fallback
    new Image().src = `${endpoint}?data=${encodeURIComponent(JSON.stringify(data))}`;
  }
}
```

---

## Testing Strategies

### Test Categories Required

**Unit Tests**:
- Test individual factory functions and components in isolation
- Verify interface contracts are met
- Test error handling and validation
- Must cleanup all instances after each test

**Integration Tests**:
- Test full telemetry flow: span → processor → exporter
- Test multi-instance scenarios
- Test dynamic configuration changes
- Verify no resource leaks across test runs

**Performance Tests**:
- Benchmark critical operations (span creation, attribute setting)
- Verify operations meet frame budget guidelines
- Track performance regressions over time

### Test Requirements

All tests MUST:
- Clean up all SDK instances created during the test
- Verify no orphaned resources remain after test completion
- Test both success and failure scenarios
- Include dynamic configuration change scenarios where applicable

### Performance Benchmark Pattern

```typescript
export function runSpanCreationBenchmark(): IBenchmarkResult {
  const iterations = 10000;
  const config = createTestConfig();
  const provider = createTraceProvider(config);
  const tracer = provider.getTracer('benchmark');
  
  const startTime = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    const span = tracer.startSpan(`operation-${i}`);
    span.setAttributes({ 'iteration': i });
    span.end();
  }
  
  const duration = performance.now() - startTime;
  const avgPerSpan = duration / iterations;
  
  provider.shutdown();
  
  return {
    iterations,
    totalTimeMs: duration,
    avgTimePerOperationMs: avgPerSpan,
    operationsPerSecond: (iterations / duration) * 1000,
    passed: avgPerSpan < 0.1 // Target: < 0.1ms per span
  };
}
```

---

## Migration from Application Insights

### Configuration Mapping

| Application Insights | OTelWebSdk Equivalent |
|---------------------|----------------------|
| `instrumentationKey` | `connectionString` (includes key) |
| `enableAutoRouteTracking` | Load 'route-tracking' instrumentation |
| `samplingPercentage` | Configure sampler with ratio |
| `disableTelemetry` | Don't initialize SDK |
| `maxBatchInterval` | Configure batch processor delay |
| `maxBatchSizeInBytes` | Configure batch processor size |

### API Migration

```typescript
// Application Insights (before)
appInsights.trackPageView({ name: 'Home' });
appInsights.trackEvent({ name: 'ButtonClick' });
appInsights.trackException({ exception: error });

// OTelWebSdk (after)
// Option 1: Use compatibility methods if available
sdk.trackPageView?.({ name: 'Home' });
sdk.trackEvent?.({ name: 'ButtonClick' });
sdk.trackException?.({ exception: error });

// Option 2: Use OpenTelemetry APIs directly
const tracer = sdk.getTracer('my-app');
const span = tracer.startSpan('PageView', {
  attributes: { 'page.name': 'Home' }
});
span.end();

const logger = sdk.getLogger('my-app');
logger.error('Exception occurred', {
  'exception.type': error.name,
  'exception.message': error.message
});
```

### Telemetry Initializer Migration

```typescript
// Application Insights (before)
appInsights.addTelemetryInitializer((envelope) => {
  envelope.tags['ai.user.authUserId'] = getCurrentUserId();
  envelope.data.baseData.properties = envelope.data.baseData.properties || {};
  envelope.data.baseData.properties['customProp'] = 'value';
  return true;
});

// OTelWebSdk (after) - very similar pattern
sdk.addTelemetryInitializer((item) => {
  item.tags = item.tags || {};
  item.tags['ai.user.authUserId'] = getCurrentUserId();
  
  item.data.customProperties = item.data.customProperties || {};
  item.data.customProperties['customProp'] = 'value';
  
  return true; // MUST explicitly return boolean
});
```