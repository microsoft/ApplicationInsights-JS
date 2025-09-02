# OpenTelemetry Web SDK - Dynamic Instrumentation Management

This document details the comprehensive dynamic instrumentation system that enables teams to manage telemetry collection granularly without impacting the entire SDK lifecycle.

## Dynamic Instrumentation Management

The OTelWebSdk provides comprehensive support for dynamic instrumentation loading and unloading, enabling teams to manage telemetry collection granularly without impacting the entire SDK lifecycle.

### Individual Instrumentation Lifecycle

Unlike traditional SDKs that require full restart for instrumentation changes, the OTelWebSdk supports fine-grained instrumentation management:

#### **Loading Instrumentations Dynamically**

The SDK provides a comprehensive instrumentation management interface that supports:

**Core Operations:**
- **Runtime Loading**: Load individual instrumentations at runtime with configuration options
- **Status Checking**: Query whether specific instrumentations are currently loaded
- **Instance Access**: Retrieve loaded instrumentation instances for direct manipulation
- **Inventory Management**: List all currently loaded instrumentations for monitoring
- **Selective Unloading**: Unload specific instrumentations without affecting others
- **Hot-Swap Capability**: Replace instrumentations for A/B testing by unloading and loading different variants

**Configuration Options:**
- **Enable/Disable State**: Control instrumentation activation state
- **Custom Properties**: Add instrumentation-specific metadata and context
- **Performance Monitoring**: Optional Application Insights `doPerf`/`IPerfManager` integration

**Load Result Information:**
- **Success/Failure Status**: Track instrumentation loading outcomes
- **Error Details**: Access detailed error information for failed loads
- **Performance Metrics**: Monitor load time and memory impact
- **Validation Results**: Ensure instrumentation compatibility and requirements

#### **Dynamic Instrumentation Usage Patterns**

**Basic Instrumentation Management:**
Teams can directly load instrumentations through the SDK instance after initialization. The SDK provides methods to dynamically load instrumentations like XHR tracking with full configuration including custom properties for team identification. The SDK tracks all loaded instrumentations and allows selective unloading for performance optimization while maintaining operation.

**Runtime Monitoring:**
Teams can query the SDK directly for the current state of loaded instrumentations to understand their telemetry collection scope. Individual instrumentations can be unloaded based on performance requirements or business logic while the SDK continues operating with remaining instrumentations.

**Performance Integration:**
All instrumentation operations may include optional performance monitoring integration with the Application Insights performance monitoring framework for observability.

### A/B Testing and Experimentation

The dynamic instrumentation system enables sophisticated A/B testing scenarios through the underlying capabilities of dynamic loading/unloading and configuration management. Teams can implement their own experiment frameworks using these capabilities:

**Experiment Implementation Capabilities:**
The SDK provides the foundational capabilities that teams can use to implement experiment group management. Teams can determine user experiment groups and load different instrumentations based on their assignment logic. Control groups might use basic click tracking, while variant groups use enhanced interaction tracking or experimental gesture tracking with different experiment metadata.

**Runtime Experiment Support:**
The system's hot-swapping capabilities enable experiment transitions during active sessions. Teams can implement experiment switching logic that transitions from basic tracking to enhanced tracking mid-session while maintaining experiment attribution and continuity.

**Experiment Attribution Support:**
All instrumentation configurations support custom properties for experiment group identification, enabling teams to implement proper attribution and analysis of A/B test results across different tracking approaches.

### Performance-Aware Loading

The SDK is designed to be performance-conscious when loading instrumentations, with guidelines and best practices to respect browser performance constraints. Teams should be mindful of the 5ms frame budget guideline to prevent UI jank, ensuring smooth user experience.

**Optional Performance Monitoring:**
When enabled, instrumentation operations can optionally integrate with the Application Insights `doPerf`/`IPerfManager` framework for performance observability including timing instrumentation, operation monitoring, and resource usage tracking.

### Performance Metrics and Frame Budget Guidelines

When performance monitoring is enabled, comprehensive metrics are available:

**Operation Metrics:**
- Total operation counts and execution duration tracking
- Frame budget compliance monitoring (5ms guideline)
- Memory footprint monitoring to prevent bloat in long-running applications

**Benefits of Optional Performance Framework:**

1. **Optional Monitoring**: Performance tracking can be enabled when needed for observability
2. **Performance Metrics**: Built-in observability of SDK performance impact when enabled
3. **Performance Trends**: Historical performance data for optimization when monitoring is active
4. **Detailed Diagnostics**: Precise timing and resource usage tracking when configured
5. **Configurable Overhead**: Teams can choose between minimal overhead or detailed observability
6. **Targeted Analysis**: Enable monitoring for specific instrumentations or scenarios

### Understanding the 5ms Frame Budget Guideline

The OTelWebSdk follows a 5ms frame budget guideline to help ensure telemetry operations don't impact user experience. This conservative guideline provides significant headroom for smooth animations and interactions:

#### **Frame Budget vs Frame Rate Relationship**

| Frame Rate | Frame Duration | Telemetry Budget (5ms) | Remaining for App |
|------------|----------------|------------------------|-------------------|
| **120fps** | 8.33ms | 5ms (60% of frame) | 3.33ms |
| **60fps** | 16.67ms | 5ms (30% of frame) | 11.67ms |
| **30fps** | 33.33ms | 5ms (15% of frame) | 28.33ms |

#### **Why 5ms is Conservative**

- **High Refresh Displays**: On 120Hz displays (8.33ms frames), 5ms still leaves 3.33ms for application logic
- **Standard Displays**: On 60Hz displays (16.67ms frames), 5ms leaves 11.67ms for smooth animations
- **Performance Headroom**: Even on slower devices targeting 30fps (33.33ms frames), 5ms uses only 15% of the frame budget
- **Real-World Margin**: Accounts for browser overhead, garbage collection, and other background tasks

#### **Practical Benefits**

**Telemetry Operation Breakdown:**
The SDK is designed with a 5ms guideline across all telemetry operations including event capture (~1ms), data processing (~2ms), batching/queuing (~1ms), and buffer time (~1ms). This guideline helps ensure total telemetry time stays within performance boundaries.

**Application Performance Protection:**
Following the guideline helps preserve frame time for critical application functions including animation rendering, user input handling, business logic execution, and DOM updates. This helps ensure telemetry collection doesn't interfere with user experience.

#### **Conservative Design Philosophy**

The 5ms guideline helps ensure telemetry is **non-intrusive**:
- Designed to avoid visible UI jank or stuttering
- Helps preserve smooth scrolling and animations
- Designed to maintain responsive user interactions
- Provides safety margin for unexpected performance variations
- Designed to work well across all device performance tiers

### Coordinated Multi-Team Instrumentation

The factory coordinates instrumentation loading across teams to prevent conflicts:

**Shared Resource Coordination:**
When multiple teams load the same instrumentation (like XHR tracking), the factory efficiently reuses existing hooks and event listeners rather than creating duplicates. This prevents DOM pollution and resource waste while maintaining team isolation.

**Independent Team Management:**
Each team can independently unload their instrumentations without affecting other teams. The factory maintains reference counting to ensure shared instrumentations remain active as long as any team requires them, only cleaning up resources when all teams have unloaded.

**Conflict Prevention:**
The coordination system prevents teams from interfering with each other's instrumentation while maximizing resource sharing efficiency.

### Resource Cleanup and Memory Management

Individual instrumentation unloading ensures proper resource cleanup through SDK methods:

**SDK Instrumentation Management:**
The SDK provides direct methods for instrumentation lifecycle management including loading, unloading, and status checking. When unloading an instrumentation, the SDK ensures proper cleanup by stopping telemetry collection, removing event listeners and hooks, disposing of resources and timers, and clearing instrumentation-specific memory allocations.

**Automatic Resource Management:**
The SDK automatically handles reference counting for shared instrumentations across teams, ensuring resources are only cleaned up when no teams require them. This prevents premature cleanup while ensuring efficient memory management.

### Third-Party Instrumentation Registration

The OTelWebSdk supports registration and dynamic loading of custom third-party instrumentations:

**Third-Party Instrumentation Interface:**
Custom instrumentations must implement a standardized interface including name, version, vendor identification, and optional dependencies. The lifecycle includes initialize, enable, disable, and dispose methods for complete resource management.

**Framework-Specific Instrumentations:**
Teams can create framework-specific instrumentations like React component tracking or Vue.js lifecycle monitoring. React instrumentations might hook into the component render cycle to track performance and errors, while Vue instrumentations could integrate with Vue's mixin system for lifecycle tracking.

**Registration and Discovery:**
The factory provides registration mechanisms for custom instrumentations, enabling teams to register and use framework-specific or business logic instrumentations. Multiple instrumentations can be registered simultaneously, and the system provides discovery capabilities to list available instrumentations.

**Business Logic Instrumentations:**
Custom instrumentations can track domain-specific events like e-commerce operations (cart additions, purchases) or application-specific workflows. These instrumentations integrate with custom events and business logic to provide comprehensive observability.

**Validation and Loading:**
The system includes validation capabilities to ensure instrumentation compatibility before loading, preventing runtime errors and ensuring smooth operation of custom telemetry collection.

## Implementation Examples

### Custom React Instrumentation

```typescript
// Example: Custom React instrumentation
class ReactInstrumentation implements IThirdPartyInstrumentation {
  readonly name = 'react-components';
  readonly version = '1.2.0';
  readonly vendor = 'acme-corp';
  readonly dependencies = ['react', 'react-dom'];
  
  private _hooks: Set<Function> = new Set();
  private _enabled = false;
  
  async initialize(config: IInstrumentationConfig): Promise<void> {
    // Validate React is available
    if (typeof React === 'undefined') {
      throw new Error('React is required for ReactInstrumentation');
    }
    
    // Setup component render tracking
    this._setupComponentTracking(config);
  }
  
  async enable(): Promise<void> {
    if (this._enabled) return;
    
    // Install React DevTools hooks
    this._installReactHooks();
    this._enabled = true;
  }
  
  async disable(): Promise<void> {
    if (!this._enabled) return;
    
    // Remove all React hooks
    this._hooks.forEach(unhook => unhook());
    this._hooks.clear();
    this._enabled = false;
  }
  
  async dispose(): Promise<void> {
    await this.disable();
    // Additional cleanup
  }
  
  private _setupComponentTracking(config: IInstrumentationConfig): void {
    // Implementation details...
  }
  
  private _installReactHooks(): void {
    // Hook into React render cycle
    const originalRender = React.Component.prototype.render;
    const self = this;
    
    React.Component.prototype.render = function(this: any) {
      const span = self._startComponentSpan(this.constructor.name);
      try {
        const result = originalRender.call(this);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    };
    
    // Store unhook function
    this._hooks.add(() => {
      React.Component.prototype.render = originalRender;
    });
  }
}

// Register third-party instrumentation with the factory
const factory = createSdkFactory();

// Register custom instrumentation
factory.registerInstrumentation('react-components', () => new ReactInstrumentation());

// Teams can now use the custom instrumentation
const sdk = factory.newInst('my-team', {
  connectionString: 'InstrumentationKey=your-key-here'
});

// Load the custom React instrumentation directly through SDK
await sdk.loadInstrumentation('react-components', {
  enabled: true,
  customProperties: {
    'team.name': 'frontend',
    'instrumentation.vendor': 'acme-corp'
  }
});
```

### Vue.js Instrumentation

```typescript
// Example: Third-party Vue.js instrumentation
class VueInstrumentation implements IThirdPartyInstrumentation {
  readonly name = 'vue-components';
  readonly version = '2.1.0';
  readonly vendor = 'vue-tools-inc';
  readonly dependencies = ['vue'];
  
  async initialize(config: IInstrumentationConfig): Promise<void> {
    if (typeof Vue === 'undefined') {
      throw new Error('Vue.js is required for VueInstrumentation');
    }
    
    // Setup Vue component lifecycle tracking
    Vue.mixin({
      beforeCreate() {
        this._instrumentationSpan = this.$tracer?.startSpan(`vue.component.${this.$options.name || 'anonymous'}`);
      },
      
      mounted() {
        this._instrumentationSpan?.addEvent('mounted');
      },
      
      beforeDestroy() {
        this._instrumentationSpan?.end();
      }
    });
  }
  
  async enable(): Promise<void> {
    // Enable Vue-specific telemetry collection
  }
  
  async disable(): Promise<void> {
    // Disable and cleanup Vue instrumentation
  }
  
  async dispose(): Promise<void> {
    await this.disable();
  }
}

// Register multiple third-party instrumentations
factory.registerInstrumentation('vue-components', () => new VueInstrumentation());
```

### Business Logic Instrumentation

```typescript
// Example: Custom business logic instrumentation
class EcommerceInstrumentation implements IThirdPartyInstrumentation {
  readonly name = 'ecommerce-business';
  readonly version = '1.0.0';
  readonly vendor = 'internal';
  
  async initialize(config: IInstrumentationConfig): Promise<void> {
    // Setup business event tracking
    window.addEventListener('cart-add', this._trackCartAdd.bind(this));
    window.addEventListener('purchase-complete', this._trackPurchase.bind(this));
  }
  
  private _trackCartAdd(event: CustomEvent): void {
    const tracer = this._getTracer();
    const span = tracer.startSpan('ecommerce.cart.add');
    span.setAttributes({
      'product.id': event.detail.productId,
      'product.price': event.detail.price,
      'cart.total_items': event.detail.cartSize
    });
    span.end();
  }
  
  private _trackPurchase(event: CustomEvent): void {
    const tracer = this._getTracer();
    const span = tracer.startSpan('ecommerce.purchase.complete');
    span.setAttributes({
      'purchase.order_id': event.detail.orderId,
      'purchase.total': event.detail.total,
      'purchase.currency': event.detail.currency
    });
    span.end();
  }
  
  async enable(): Promise<void> {
    // Business instrumentation is always passive, no additional enable needed
  }
  
  async disable(): Promise<void> {
    window.removeEventListener('cart-add', this._trackCartAdd);
    window.removeEventListener('purchase-complete', this._trackPurchase);
  }
  
  async dispose(): Promise<void> {
    await this.disable();
  }
}

// Bulk registration of instrumentations
factory.registerInstrumentations({
  'ecommerce-business': () => new EcommerceInstrumentation(),
  'custom-analytics': () => new CustomAnalyticsInstrumentation(),
  'performance-monitoring': () => new CustomPerformanceInstrumentation()
});

// Discovery and validation
console.log('Available instrumentations:', factory.getAvailableInstrumentations());
// Output: ['xhr', 'fetch', 'errors', 'react-components', 'vue-components', 'ecommerce-business', ...]

// Validate instrumentation before loading
const isValid = await factory.validateInstrumentation('react-components');
if (isValid) {
  await sdk.loadInstrumentation('react-components');
}
```

### Package-Based Third-Party Instrumentations

For npm packages, instrumentations can be automatically discovered and registered:

**Package Registration:**
Teams can register instrumentations from npm packages that follow OpenTelemetry conventions. These packages provide pre-built instrumentations for popular frameworks like React and Vue.js, with configurable options for component tracking, lifecycle monitoring, and privacy controls.

**Auto-Discovery:**
The system supports automatic discovery of instrumentation packages based on naming conventions and package prefixes. This enables teams to automatically detect and register community or vendor-provided instrumentations without manual configuration.

**Configuration Options:**
Package-based instrumentations support comprehensive configuration including feature toggles (component tracking, lifecycle monitoring), privacy controls (prop tracking), and discovery timeouts to prevent blocking during package scanning.

## Benefits of Dynamic Instrumentation Management

1. **Zero-Downtime Updates**: Change instrumentation without restarting the application
2. **Safe Experimentation**: A/B test different tracking approaches with easy rollback
3. **Performance Optimization**: Unload heavy instrumentations during critical user flows
4. **Targeted Collection**: Load specific instrumentations only when needed
5. **Memory Efficiency**: Reclaim memory by unloading unused instrumentations
6. **Error Isolation**: Faulty instrumentations can be unloaded without affecting others
7. **Granular Control**: Fine-tune telemetry collection at the instrumentation level
8. **Team Independence**: Teams can manage their instrumentations independently
9. **Third-Party Ecosystem**: Support for community and vendor-specific instrumentations
10. **Package Integration**: Seamless integration with npm-based instrumentation packages