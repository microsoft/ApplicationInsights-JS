# OTelWebSdk Usage Examples

This document provides comprehensive usage examples for the OpenTelemetry Web SDK, demonstrating various patterns and scenarios for implementing telemetry in web applications.

## Basic Usage Examples

**Note**: Examples demonstrate patterns and concepts. Exact APIs and configuration options will be finalized during implementation design.

```typescript
// Standard OTel - Uses global state (problematic for multi-team apps)
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('my-app'); // Global tracer provider
const span = tracer.startSpan('user-action');
span.end();

// Problem: All teams share the same global configuration
// Problem: Cannot isolate SDK instances or configurations
// Problem: Difficult to unload or cleanup specific team's telemetry

// OTelWebSdk - Avoids globals, provides isolated instances
const factory = createSdkFactory();
const sdk = factory.newInst('my-team', {
  connectionString: 'InstrumentationKey=team-specific-key'
});

// Each SDK instance provides its own tracer provider accessor
const tracer = sdk.getTracer('my-service');

const span = tracer.startSpan('page-load');
span.setAttributes({
  'page.name': 'Product Page',
  'page.category': 'electronics',
  'web.vitals.lcp': 2100,
  'web.vitals.fid': 50,
  'web.vitals.cls': 0.05,
  'user.session.id': 'session-123',
  'browser.name': 'Chrome',
  'browser.version': '118.0'
});
span.end();

// Basic metrics collection (simple counters, histograms, gauges only)
const meter = sdk.getMeter('my-app-metrics');
const pageViewCounter = meter.createCounter('page_views_total', {
  description: 'Total number of page views'
});
const loadTimeHistogram = meter.createHistogram('page_load_time_ms', {
  description: 'Page load time in milliseconds'
});

// Simple metric recording
pageViewCounter.add(1, { 'page.name': 'Product Page' });
loadTimeHistogram.record(1250, { 'page.type': 'product' });

// Optional: Application Insights compatibility layer (secondary goal)
// These methods would be implemented as convenience methods over OpenTelemetry APIs
sdk.trackPageView({
  name: 'Product Page',
  uri: '/products/123',
  properties: { category: 'electronics' }
});
```

### Instance Isolation Benefits

```typescript
// Multiple teams can coexist without interference
const teamA = factory.newInst('team-a', {
  connectionString: 'InstrumentationKey=team-a-key',
  samplingRate: 100
});

const teamB = factory.newInst('team-b', {
  connectionString: 'InstrumentationKey=team-b-key', 
  samplingRate: 10 // Different sampling rate
});

// Each team gets isolated API accessors - no global conflicts
const tracerA = teamA.getTracer('service-a'); // Team A's tracer
const tracerB = teamB.getTracer('service-b'); // Team B's tracer

// Teams can unload independently without affecting others
await teamA.unload(); // Only Team A's telemetry stops
// Team B continues working normally

// Compare to global approach where unloading affects everyone:
// trace.disable(); // This would break ALL teams using global APIs
```

### Multi-Team Benefits

```typescript
// Standard OpenTelemetry - Global providers cause team conflicts
import { trace } from '@opentelemetry/api';

// All teams forced to share same global configuration
const globalTracer = trace.getTracer('team-a'); // Uses global trace provider and it's processors

// Problems:
// - Teams cannot have different connection strings
// - Teams cannot have different samplers
// - Teams cannot unload independently
// - Teams cannot have isolated configurations
// - Instrumentations are forced to use the globals

// OTelWebSdk - Team isolation without globals
const factory = createSdkFactory();

// Team A - E-commerce (isolated instance)
const ecommerceSDK = factory.newInst('ecommerce-team', {
  connectionString: 'InstrumentationKey=ecommerce-key',
  tracerConfig: { serviceName: 'ecommerce-frontend' },
  contextOverrides: { 'team.name': 'ecommerce' },
  samplingRate: 100 // High sampling for critical team
});

// Team B - Analytics (completely separate instance)
const analyticsSDK = factory.newInst('analytics-team', {
  connectionString: 'InstrumentationKey=analytics-key',
  tracerConfig: { serviceName: 'analytics-widgets' },
  contextOverrides: { 'team.name': 'analytics' },
  samplingRate: 10 // Lower sampling for high-volume widgets
});

// Teams get isolated providers / processors from their SDK instances
const ecomTracer = ecommerceSDK.getTracer('shopping'); // Team A's tracer
const analyticsTracer = analyticsSDK.getTracer('widgets'); // Team B's tracer

// No global state means no conflicts between teams
// Each team manages their own telemetry lifecycle
// Factory optimizes shared resources (connections, timers) behind the scenes
// Provided OTelWebSdk Instrumentations are isolated to each instance
```

## Multi-Instance SDK Factory Usage Examples

### Overview

The OTelWebSdk supports various multi-instance patterns for different organizational and technical requirements:

**Core Usage Patterns:**
- **Multi-Team Coordination**: Teams working independently with shared resource optimization
- **Legacy Compatibility**: Backward-compatible patterns for existing applications  
- **OpenTelemetry + Application Insights**: Combined API usage with instance isolation
- **Advanced Multi-Instance**: Complex enterprise scenarios with multiple managers
- **Comprehensive Configuration**: Full configuration examples with all available options

**Multi-Instance Benefits:**
- **Team Independence**: Each team gets isolated SDK instances with independent configuration
- **Resource Optimization**: Factory coordinates shared resources (connections, timers) efficiently
- **Instance Management**: Factory provides instance tracking, discovery, and lifecycle coordination
- **Dynamic Control**: Runtime instance management with proper cleanup and resource reclamation

**Key Capabilities Demonstrated:**
- **Isolated Configuration**: Teams can have different connection strings, sampling rates, and contexts
- **Factory Coordination**: Shared resource optimization while maintaining team isolation  
- **Instance Discovery**: Check for existing instances and avoid duplicates
- **Coordinated Cleanup**: Proper resource management and memory cleanup

### Multi-Instance Multi-Team Usage (Recommended)

```typescript
import { 
  createSdkFactory
} from '@microsoft/applicationinsights-otelwebsdk-js';

// ===== Primary Entry Point: Get or Create Factory =====
const factory = createSdkFactory();

// ===== Team A: E-commerce Team =====
const ecommerceSDK = factory.createSDKInstance('ecommerce-team', {
  // Team-specific overrides while inheriting manager defaults
  tracerConfig: {
    serviceName: 'ecommerce-frontend',
    serviceVersion: '2.1.0'
  },
  contextOverrides: {
    'team.name': 'ecommerce',
    'team.component': 'shopping-cart'
  },
  appInsightsConfig: {
    enableAutoRouteTracking: true,
    // Inherits other settings from manager
  }
});

// ===== Team B: Analytics Team =====
const analyticsSDK = factory.createSDKInstance('analytics-team', {
  tracerConfig: {
    serviceName: 'analytics-widgets',
    serviceVersion: '1.5.2'
  },
  contextOverrides: {
    'team.name': 'analytics',
    'team.component': 'dashboard'
  },
  appInsightsConfig: {
    enableAjaxPerfTracking: true,
    excludeRequestFromAutoTrackingPatterns: [/\/internal-metrics$/]
  }
});

// ===== Team C: Platform Team =====
const platformSDK = factory.createSDKInstance('platform-team', {
  tracerConfig: {
    serviceName: 'platform-services',
    serviceVersion: '3.0.0'
  },
  contextOverrides: {
    'team.name': 'platform',
    'team.component': 'shared-services'
  }
});

// Initialize instances individually (each team manages their own lifecycle)
await ecommerceSDK.initialize();
await analyticsSDK.initialize(); 
await platformSDK.initialize();

// ===== Teams Use Their Isolated SDK Instances =====

// Team A - E-commerce telemetry (OpenTelemetry primary)
// Option 1: Direct provider access
const ecomTracerProvider = ecommerceSDK.getTracerProvider();
const ecomTracer = ecomTracerProvider.getTracer('shopping-cart', '2.1.0');

// Option 2: Convenience method (delegates to provider)
const ecomTracerConv = ecommerceSDK.getTracer('shopping-cart', '2.1.0');

const span = ecomTracer.startSpan('add-to-cart');
span.setAttributes({
  'product.id': '123',
  'product.category': 'electronics',
  'cart.total_items': 3,
  'team.name': 'ecommerce'
});
span.end();

// Optional: Application Insights compatibility methods
ecommerceSDK.trackPageView?.({
  name: 'Product Page',
  uri: '/products/laptop-123',
  properties: { category: 'electronics', price: 999 }
});

// Team B - Analytics telemetry (shares same connection, different context)
const analyticsMeterProvider = analyticsSDK.getMeterProvider();
const analyticsMeter = analyticsMeterProvider.getMeter('dashboard', '1.5.2');
const widgetRenderTime = analyticsMeter.createHistogram('widget.render.duration');

widgetRenderTime.record(150, {
  'widget.type': 'sales-chart',
  'team.name': 'analytics'
});

// ===== Factory Benefits =====
console.log(`Total teams sharing SDK: ${factory.getInstanceCount()}`); // 3
console.log(`Active SDK instances: ${factory.getInstanceNames()}`); // ['ecommerce-team', 'analytics-team', 'platform-team']

// Check if a team already has an instance (avoid duplicates)
if (factory.hasInstance('ecommerce-team')) {
  console.log('E-commerce team already has an SDK instance');
  // Get existing instance
  const existingSDK = factory.getInst('ecommerce-team');
}

// ===== Cleanup (Coordinated Through Factory) =====
// Teams can unload individually (factory tracks automatically)
await ecommerceSDK.unload(); // Factory count decreases automatically

// Or factory can coordinate shutdown of all instances
await factory.unloadAllInstances();
console.log(`Remaining instances: ${factory.getInstanceCount()}`); // 0
```

### Legacy Compatibility Usage (Backward Compatible)

```typescript
import { createSdkFactory } from '@microsoft/applicationinsights-otelwebsdk-js';

// Consistent IoC pattern
const factory = createSdkFactory();
const sdk = factory.newInst('legacy-app', {
  connectionString: 'InstrumentationKey=your-key-here'
});

await sdk.initialize();
```
console.log(`Instances managed: ${defaultFactory.getInstanceCount()}`); // 1
console.log(`Instance names: ${defaultFactory.getInstanceNames()}`); // ['legacy-app']

// Standard usage remains the same
sdk.trackPageView({ name: 'Home Page' });
const tracer = sdk.getTracer('my-service');

// Cleanup works as before (automatically unregisters from factory)
await sdk.unload();
```

### OpenTelemetry + Application Insights API Usage

```typescript
import { 
  getOTelWebSDKManager 
} from '@microsoft/applicationinsights-otelwebsdk-js';

// Avoid: Standard OpenTelemetry globals (causes multi-team issues)
// import { trace, metrics } from '@opentelemetry/api';
// const globalTracer = trace.getTracer('my-service'); // Don't use globals!

// Correct: Create isolated SDK instance through factory
const factory = getOTelWebSDKManager();
const sdk = factory.newInst('my-app', {
  connectionString: 'InstrumentationKey=your-key-here'
});

await sdk.initialize();

// ===== Instance-Specific OpenTelemetry API Accessors =====

// Use standard OpenTelemetry API accessors from SDK instance
const tracer = sdk.trace.getTracer('my-service', '1.0.0');
const logger = sdk.logs.getLogger('my-service', '1.0.0');

// Create spans using standard OpenTelemetry API but with instance isolation
const span = tracer.startSpan('user-action');
span.setAttributes({
  'user.id': '12345',
  'action.type': 'button-click'
});
span.addEvent('validation-started');
span.setStatus({ code: SpanStatusCode.OK });
span.end();

// Use active span pattern (works with instance-specific context)
tracer.startActiveSpan('database-query', async (span) => {
  try {
    // Database operation
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

// Context management through instance
const activeContext = sdk.context.active();
sdk.context.with(activeContext, () => {
  // Work with instance-specific context
});

// Emit structured logs with instance-specific context
logger.emit({
  severityText: 'INFO',
  body: 'User action completed',
  attributes: {
    'user.id': '12345',
    'action.type': 'button-click',
    'session.id': 'session-abc123'
  }
});

// Create metrics with instance-specific meter
tracer.startActiveSpan('database-query', async (span) => {
  try {
    const result = await fetchUserData();
    span.setAttributes({
      'db.operation': 'SELECT',
      'db.table': 'users'
    });
    return result;
  } catch (error) {
    span.recordException(error);
    span.setStatus({ 
      code: SpanStatusCode.ERROR, 
      message: error.message 
    });
    throw error;
  } finally {
    span.end();
  }
});

// Get OpenTelemetry logger
const logger = sdk.getLogger('my-service', '1.0.0');

// Emit structured logs
logger.emit({
  severityText: 'INFO',
  body: 'User logged in successfully',
  attributes: {
    'user.id': '12345',
    'session.id': 'abc-def-123'
  }
});

// Context management
const ctx = sdk.setContextValue(userKey, { id: '12345' }, sdk.getActiveContext());
sdk.setActiveContext(ctx, () => {
  // Code executed with user context active
  console.log('User context is active');
});

// ===== Application Insights Extensions =====

// Track page views (Web-specific)
sdk.trackPageView({
  name: 'Home Page',
  uri: 'https://myapp.com/home',
  properties: {
    'page.section': 'dashboard',
    'user.tier': 'premium'
  },
  measurements: {
    'load.time': 1250
  }
});

// Track custom events
sdk.trackEvent({
  name: 'Feature Used',
  properties: {
    'feature.name': 'advanced-search',
    'user.id': '12345'
  },
  measurements: {
    'search.results': 42
  }
});

// Track exceptions with Application Insights format
sdk.trackException({
  exception: new Error('Payment processing failed'),
  severityLevel: SeverityLevel.Error,
  properties: {
    'payment.method': 'credit-card',
    'amount': 99.99
  }
});

// Track dependencies (AJAX calls, external services)
sdk.trackDependency({
  name: 'GET /api/users',
  data: 'https://api.example.com/users',
  duration: 250,
  success: true,
  resultCode: 200,
  type: 'HTTP',
  target: 'api.example.com',
  properties: {
    'request.id': 'req-123'
  }
});

// Track traces/logs
sdk.trackTrace({
  message: 'User session started',
  severityLevel: SeverityLevel.Information,
  properties: {
    'user.id': '12345',
    'session.duration': 30
  }
});

// Set context information
sdk.setUserContext({
  id: '12345',
  authenticatedUserId: 'user@example.com',
  accountId: 'account-456'
});

sdk.setSessionContext({
  id: 'session-789',
  isFirst: false
});

sdk.setDeviceContext({
  type: 'Browser',
  model: 'Chrome',
  os: 'Windows',
  osVersion: '10',
  resolution: '1920x1080'
});

// Add telemetry initializer for custom processing
sdk.addTelemetryInitializer((item) => {
  // Add custom tags to all telemetry
  item.tags['ai.user.authUserId'] = getCurrentUserId();
  item.tags['ai.cloud.role'] = 'frontend';
  
  // Modify or filter telemetry
  if (item.baseType === 'ExceptionData') {
    // Add additional context to exceptions
    item.baseData.properties = item.baseData.properties || {};
    item.baseData.properties['app.version'] = getAppVersion();
  }
  
  return true; // true = send telemetry, false = filter out
});

// Enable automatic tracking
sdk.enableAutoTracking({
  enableRequestHeaderTracking: true,
  enableResponseHeaderTracking: false,
  enableAjaxPerfTracking: true,
  enableUnhandledPromiseRejectionTracking: true,
  excludeRequestFromAutoTrackingPatterns: [
    /\/health$/,
    /\/metrics$/
  ]
});

// Time user actions
const timer = sdk.startTrackingUserAction('checkout-process');
// ... user performs checkout ...
timer.stop(); // Automatically tracks duration

// Cleanup when done
await sdk.unload();
```

## Advanced Multi-Instance Usage Patterns

### Multiple Manager Usage for Complex Scenarios

```typescript
import { createSdkFactory } from '@microsoft/applicationinsights-otelwebsdk-js';

// ===== Scenario: Multi-Project Enterprise Application =====

// Project Alpha - Main Application
const factory = createSdkFactory();
const alphaInstance = factory.newInst('main-app', {
  connectionString: 'InstrumentationKey=alpha-key'
});

// Project Beta - Micro-frontend
const betaInstance = factory.newInst('micro-frontend', {
  connectionString: 'InstrumentationKey=beta-key'
});

await alphaInstance.initialize();
await betaInstance.initialize();

// ===== Factory-based Management =====
// All instances managed through factory
const factory = createSdkFactory();

// Independent control
await defaultMgr.getSharedResources().exportQueue.flush();
await alphaMgr.shutdownAll();
console.log(`Beta instances: ${betaMgr.getInstanceCount()}`);
```

### Factory-based Multi-Team Usage

```typescript
import { createSdkFactory } from '@microsoft/applicationinsights-otelwebsdk-js';

// Create SDK instances for different teams using factory
const factory = createSdkFactory();
const teamCInstance = factory.createSDKInstance('team-c', {
  connectionString: 'InstrumentationKey=team-c-key'
});

const teamDInstance = factory.createSDKInstance('team-d', {
  connectionString: 'InstrumentationKey=team-d-key'
});

// Initialize the instances
await teamCInstance.initialize();
await teamDInstance.initialize();

// Each team manages their own SDK instance independently
const tracerC = teamCInstance.getTracer('team-c-service');
const tracerD = teamDInstance.getTracer('team-d-service');
```

### Advanced Resource Control

```typescript
import { createSdkFactory } from '@microsoft/applicationinsights-otelwebsdk-js';

// Create SDK instance with resource control
const factory = createSdkFactory();
const instance = factory.newInst('my-instance', {
  resourceControls: {
    maxQueueSize: 1000,
    maxConnections: 2,
    timerMinimumInterval: 1000
  }
});
```

## Comprehensive Configuration Usage

```typescript
import { createSdkFactory } from '@microsoft/applicationinsights-otelwebsdk-js';

// Create SDK with comprehensive configuration
const factory = createSdkFactory();
const sdk = factory.newInst('comprehensive-example', {
  // Connection configuration
  connectionString: 'InstrumentationKey=your-key-here;IngestionEndpoint=https://your-endpoint.com/',
  
  // OpenTelemetry configuration
  tracerConfig: {
    serviceName: 'my-web-application',
    serviceVersion: '1.2.3',
    serviceInstanceId: 'instance-456'
  },
  
  // Context overrides for all telemetry
  contextOverrides: {
    'service.namespace': 'production',
    'deployment.environment': 'prod-west-us',
    'team.name': 'frontend',
    'application.tier': 'web'
  },
  
  // Resource attributes (OpenTelemetry Resource)
  resourceAttributes: {
    'host.name': 'web-server-01',
    'os.type': 'windows',
    'container.id': 'container-789'
  },
  
  // OpenTelemetry providers configuration
  providers: {
    // Tracer provider with custom configuration
    tracerProvider: {
      spanLimits: {
        attributeValueLengthLimit: 1024,
        attributeCountLimit: 128,
        eventCountLimit: 128,
        linkCountLimit: 128
      },
      
      // Span processors
      spanProcessors: [{
        type: 'batch',
        options: {
          maxQueueSize: 2048,
          maxExportBatchSize: 512,
          exportTimeoutMillis: 30000,
          scheduledDelayMillis: 5000
        }
      }],
      
      // Sampling configuration
      sampler: {
        type: 'traceid-ratio',
        ratio: 0.1 // 10% sampling
      }
    },
    
    // Metric provider configuration
    meterProvider: {
      readers: [{
        type: 'periodic-exporting',
        exportIntervalMillis: 30000
      }]
    }
  },
  
  // Application Insights specific configuration
  appInsightsConfig: {
    enableAutoRouteTracking: true,
    enableRequestHeaderTracking: true,
    enableAjaxPerfTracking: true,
    enableUnhandledPromiseRejectionTracking: true,
    samplingPercentage: 100,
    maxBatchSizeInBytes: 1024 * 1024, // 1MB
    maxBatchInterval: 15000, // 15 seconds
    excludeRequestFromAutoTrackingPatterns: [
      /\/health$/,
      /\/metrics$/,
      /\/ping$/
    ]
  },
  
  // Context and session management
  contextConfig: {
    enableCookieUsage: true,
    enableSessionStorageBuffer: true,
    sessionRenewalMs: 30 * 60 * 1000, // 30 minutes
    sessionExpirationMs: 24 * 60 * 60 * 1000 // 24 hours
  },
  
  // Performance monitoring
  performanceConfig: {
    enablePerformanceTimingBuffer: true,
    enablePerfMgr: true,
    perfEvtsSendAll: false
  },
  
  // Privacy and compliance
  privacyConfig: {
    enableWebAnalytics: true,
    enableDebug: false,
    enableCorsCorrelation: true,
    correlationHeaderExcludedDomains: [
      'third-party-analytics.com',
      'cdn.example.com'
    ],
    distributedTracingMode: DistributedTracingModes.AI_AND_W3C
  }
});

await sdk.initialize();
```

---

For more information about architecture and implementation details, see:
- [OTelWebSdk.md](../OTelWebSdk.md) - Main specification document
- [OTelWebSdk-Instrumentation.md](./OTelWebSdk-Instrumentation.md) - Dynamic instrumentation management