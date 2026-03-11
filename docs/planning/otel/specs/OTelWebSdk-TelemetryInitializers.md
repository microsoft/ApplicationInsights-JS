# OTelWebSdk Telemetry Initializers Specification

## Overview

The OTelWebSdk provides comprehensive telemetry processing capabilities through both **lightweight telemetry initializers** (a core SDK feature) and full OpenTelemetry processors. This dual approach enables teams to choose the optimal processing mechanism for their specific performance requirements while maintaining full OpenTelemetry ecosystem standards compliance.

## Design Philosophy

### **Standards Compliance First**

The OTelWebSdk is built on OpenTelemetry standards as the primary foundation:

- **Full OpenTelemetry Processor Support**: Complete implementation of OpenTelemetry `SpanProcessor`, `LogRecordProcessor`, and `MetricProcessor` interfaces
- **OpenTelemetry API Compatibility**: All telemetry flows through standard OpenTelemetry APIs (TraceAPI, LogsAPI, MetricsAPI)
- **Ecosystem Interoperability**: Works seamlessly with existing OpenTelemetry instrumentations, exporters, and processors
- **Specification Compliance**: Adheres to OpenTelemetry semantic conventions and data models

### **Performance-Optimized Lightweight Processors**

Lightweight telemetry initializers are provided as a **first-class SDK feature** designed specifically for web application performance requirements:

- **Performance Optimization**: ~1-2μs per telemetry item vs ~5-10μs for full OpenTelemetry processors
- **Bundle Size Efficiency**: ~0.5KB vs 2-3KB per processor for simple scenarios
- **Web Application Focus**: Purpose-built for common web telemetry processing patterns
- **Simplified Development**: Callback-based pattern optimized for data enrichment and filtering
- **Application Insights Compatibility**: Maintains familiar patterns while providing modern OpenTelemetry foundation

### **Hybrid Processing Pipeline**

The SDK supports both processing approaches simultaneously:

```typescript
// Full OpenTelemetry processors (primary approach)
sdk.addSpanProcessor(new BatchSpanProcessor(exporter));
sdk.addLogRecordProcessor(new SimpleLogRecordProcessor(logExporter));

// Lightweight initializers (supplementary approach)
sdk.addTelemetryInitializer(addUserContext);
sdk.addTelemetryInitializer(sanitizeUrls);
```

## OpenTelemetry Processor Support

### **Standard OpenTelemetry Processors**

The SDK provides complete support for all OpenTelemetry processor types:

#### **Span Processors**

```typescript
import { BatchSpanProcessor, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

// Batch processing for production
const batchProcessor = new BatchSpanProcessor(spanExporter, {
  maxExportBatchSize: 100,
  scheduledDelayMillis: 5000,
  exportTimeoutMillis: 30000,
  maxQueueSize: 2048
});

sdk.addSpanProcessor(batchProcessor);

// Simple processing for development
const simpleProcessor = new SimpleSpanProcessor(spanExporter);
sdk.addSpanProcessor(simpleProcessor);

// Custom span processor
class CustomSpanProcessor implements SpanProcessor {
  onStart(span: Span, parentContext: Context): void {
    // Custom span enrichment
    span.setAttributes({
      'custom.processor': 'active',
      'custom.startTime': Date.now()
    });
  }

  onEnd(span: ReadableSpan): void {
    // Custom span completion logic
    const duration = span.duration[0] * 1000 + span.duration[1] / 1000000;
    if (duration > 1000) {
      console.warn('Slow span detected:', span.name, duration + 'ms');
    }
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }

  forceFlush(): Promise<void> {
    return Promise.resolve();
  }
}

sdk.addSpanProcessor(new CustomSpanProcessor());
```

#### **Log Record Processors**

```typescript
import { SimpleLogRecordProcessor, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';

// Batch log processing
const logBatchProcessor = new BatchLogRecordProcessor(logExporter, {
  maxExportBatchSize: 50,
  scheduledDelayMillis: 3000,
  exportTimeoutMillis: 10000,
  maxQueueSize: 1000
});

sdk.addLogRecordProcessor(logBatchProcessor);

// Custom log processor
class CustomLogProcessor implements LogRecordProcessor {
  onEmit(logRecord: LogRecord): void {
    // Enrich log records
    logRecord.setAttributes({
      'log.processor': 'custom',
      'log.timestamp': Date.now()
    });
    
    // Apply filtering
    if (logRecord.severityText === 'DEBUG' && !isDevelopment()) {
      return; // Filter out debug logs in production
    }
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }

  forceFlush(): Promise<void> {
    return Promise.resolve();
  }
}

sdk.addLogRecordProcessor(new CustomLogProcessor());
```

#### **Metric Processors**

```typescript
// Custom metric processor for advanced scenarios
class CustomMetricProcessor implements MetricProcessor {
  process(metrics: MetricData[]): MetricData[] {
    return metrics.map(metric => {
      // Add custom attributes to all metrics
      return {
        ...metric,
        attributes: {
          ...metric.attributes,
          'metric.processor': 'custom',
          'metric.environment': getEnvironment()
        }
      };
    });
  }
}

// Note: Metric processors are less commonly customized
// Most metric processing happens at the exporter level
```

### **OpenTelemetry Processing Benefits**

- **Complete Lifecycle Control**: Full control over telemetry from creation to export
- **Advanced Batching**: Sophisticated batching strategies for optimal performance
- **Error Handling**: Comprehensive error handling with retry logic
- **Resource Management**: Advanced resource management and cleanup
- **Extensibility**: Full processor lifecycle hooks for complex scenarios
- **Export Control**: Fine-grained control over when and how telemetry is exported

## Application Insights-Style Telemetry Initializers

### **Lightweight Callback Pattern**

Telemetry initializers provide a simple callback-based approach for common telemetry processing scenarios:

```typescript
interface ITelemetryInitializer {
  (item: ITelemetryItem): boolean | void;
}

interface ITelemetryItem {
  name: string;
  time: string;
  baseType: string;
  baseData: any;
  data: {
    customProperties?: { [key: string]: string };
    customMeasurements?: { [key: string]: number };
  };
  tags?: { [key: string]: string };
}
```

### **Common Use Cases**

#### **Data Enrichment**

```typescript
// Add application context to all telemetry
sdk.addTelemetryInitializer((item: ITelemetryItem) => {
  item.data.customProperties = item.data.customProperties || {};
  item.data.customProperties['app.version'] = getAppVersion();
  item.data.customProperties['app.environment'] = getEnvironment();
  item.data.customProperties['app.region'] = getRegion();
  
  // Add build information
  const buildInfo = getBuildInfo();
  item.data.customProperties['build.number'] = buildInfo.number;
  item.data.customProperties['build.commit'] = buildInfo.commit;
  
  return true; // Continue processing
});

// Add user context
sdk.addTelemetryInitializer((item: ITelemetryItem) => {
  const userContext = getCurrentUser();
  if (userContext) {
    item.tags = item.tags || {};
    item.tags['ai.user.id'] = userContext.anonymousId;
    
    item.data.customProperties = item.data.customProperties || {};
    item.data.customProperties['user.role'] = userContext.role;
    item.data.customProperties['user.subscription'] = userContext.subscription;
    item.data.customProperties['user.tenant'] = userContext.tenant;
  }
});

// Add performance context
sdk.addTelemetryInitializer((item: ITelemetryItem) => {
  const performance = getPerformanceMetrics();
  if (performance) {
    item.data.customMeasurements = item.data.customMeasurements || {};
    item.data.customMeasurements['memory.used'] = performance.memory.usedJSHeapSize;
    item.data.customMeasurements['memory.total'] = performance.memory.totalJSHeapSize;
    item.data.customMeasurements['timing.domContentLoaded'] = performance.timing.domContentLoadedEventEnd;
  }
});
```

#### **Privacy and GDPR Compliance**

```typescript
// URL sanitization for privacy compliance
sdk.addTelemetryInitializer((item: ITelemetryItem) => {
  if (item.baseType === 'PageviewData' && item.baseData?.uri) {
    const uri = new URL(item.baseData.uri);
    
    // Remove sensitive query parameters
    const sensitiveParams = [
      'ssn', 'email', 'password', 'token', 'session', 'auth',
      'api_key', 'secret', 'private', 'confidential'
    ];
    
    sensitiveParams.forEach(param => {
      uri.searchParams.delete(param);
      // Also remove variations (case-insensitive)
      for (const [key] of uri.searchParams) {
        if (key.toLowerCase().includes(param.toLowerCase())) {
          uri.searchParams.delete(key);
        }
      }
    });
    
    item.baseData.uri = uri.toString();
  }
  
  return true;
});

// PII removal from exception messages
sdk.addTelemetryInitializer((item: ITelemetryItem) => {
  if (item.baseType === 'ExceptionData' && item.baseData?.exceptions) {
    item.baseData.exceptions.forEach(exception => {
      if (exception.message) {
        // Remove email patterns
        exception.message = exception.message.replace(
          /[\w.-]+@[\w.-]+\.\w+/g, 
          '[email]'
        );
        
        // Remove phone patterns
        exception.message = exception.message.replace(
          /\b(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
          '[phone]'
        );
        
        // Remove SSN patterns
        exception.message = exception.message.replace(
          /\b\d{3}-?\d{2}-?\d{4}\b/g,
          '[ssn]'
        );
        
        // Remove credit card patterns
        exception.message = exception.message.replace(
          /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
          '[credit-card]'
        );
      }
      
      // Sanitize stack traces
      if (exception.stack) {
        exception.stack = sanitizeStackTrace(exception.stack);
      }
    });
  }
  
  return true;
});

// Remove sensitive data from custom properties
sdk.addTelemetryInitializer((item: ITelemetryItem) => {
  if (item.data.customProperties) {
    const sensitiveKeys = [
      'password', 'secret', 'token', 'key', 'auth', 'credential',
      'ssn', 'social', 'credit', 'card', 'account', 'routing'
    ];
    
    Object.keys(item.data.customProperties).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        item.data.customProperties[key] = '[redacted]';
      }
    });
  }
  
  return true;
});
```

#### **Performance-Based Sampling and Filtering**

```typescript
// Intelligent sampling based on telemetry characteristics
sdk.addTelemetryInitializer((item: ITelemetryItem) => {
  // High-frequency event sampling
  if (item.name === 'mouse-move' || item.name === 'scroll') {
    // Sample at 1% for high-frequency events
    return Math.random() < 0.01;
  }
  
  // Dependency duration-based sampling
  if (item.baseType === 'RemoteDependencyData' && item.baseData?.duration) {
    const duration = parseFloat(item.baseData.duration);
    
    // Always keep slow requests (>2 seconds)
    if (duration > 2000) return true;
    
    // Sample fast requests (< 100ms) at 10%
    if (duration < 100) return Math.random() < 0.1;
    
    // Keep medium requests (100ms-2s) at 50%
    return Math.random() < 0.5;
  }
  
  // Success vs error sampling
  if (item.baseType === 'RequestData') {
    const success = item.baseData?.success;
    if (success === false) {
      // Always keep errors
      return true;
    } else {
      // Sample successful requests at 25%
      return Math.random() < 0.25;
    }
  }
  
  return true; // Keep by default
});

// Rate limiting for specific events
const eventRateLimiter = createRateLimiter({
  'user-click': { maxPerMinute: 60 },
  'page-scroll': { maxPerMinute: 30 },
  'api-call': { maxPerMinute: 100 }
});

sdk.addTelemetryInitializer((item: ITelemetryItem) => {
  if (item.baseType === 'EventData') {
    const eventName = item.name;
    if (!eventRateLimiter.allow(eventName)) {
      // Event exceeds rate limit
      return false;
    }
  }
  
  return true;
});
```

#### **Business Context Enrichment**

```typescript
// Add business-specific context
sdk.addTelemetryInitializer((item: ITelemetryItem) => {
  const businessContext = getBusinessContext();
  if (businessContext) {
    item.data.customProperties = item.data.customProperties || {};
    
    // Organizational context
    item.data.customProperties['business.unit'] = businessContext.unit;
    item.data.customProperties['cost.center'] = businessContext.costCenter;
    item.data.customProperties['department'] = businessContext.department;
    item.data.customProperties['region'] = businessContext.region;
    
    // Customer context
    item.data.customProperties['customer.tier'] = businessContext.customerTier;
    item.data.customProperties['customer.segment'] = businessContext.segment;
    
    // Feature context
    const activeFeatures = getActiveFeatureFlags();
    Object.entries(activeFeatures).forEach(([feature, enabled]) => {
      item.data.customProperties[`feature.${feature}`] = enabled.toString();
    });
  }
  
  return true;
});

// Add session-specific business context
sdk.addTelemetryInitializer((item: ITelemetryItem) => {
  const sessionContext = getSessionContext();
  if (sessionContext) {
    item.data.customProperties = item.data.customProperties || {};
    item.data.customProperties['session.duration'] = sessionContext.getDuration().toString();
    item.data.customProperties['session.pageViews'] = sessionContext.pageViewCount.toString();
    item.data.customProperties['session.userActions'] = sessionContext.userActionCount.toString();
    item.data.customProperties['session.errors'] = sessionContext.errorCount.toString();
    
    // Shopping cart context (for e-commerce)
    if (sessionContext.cart) {
      item.data.customMeasurements = item.data.customMeasurements || {};
      item.data.customMeasurements['cart.items'] = sessionContext.cart.itemCount;
      item.data.customMeasurements['cart.value'] = sessionContext.cart.totalValue;
    }
  }
  
  return true;
});
```

### **Advanced Initializer Patterns**

#### **Conditional Processing**

```typescript
// Environment-specific processing
sdk.addTelemetryInitializer((item: ITelemetryItem) => {
  const environment = getEnvironment();
  
  if (environment === 'development') {
    // Add debug information in development
    item.data.customProperties = item.data.customProperties || {};
    item.data.customProperties['debug.enabled'] = 'true';
    item.data.customProperties['debug.timestamp'] = new Date().toISOString();
    
    // Add source location for debugging
    if (item.baseType === 'ExceptionData') {
      const stack = new Error().stack;
      item.data.customProperties['debug.sourceLocation'] = extractSourceLocation(stack);
    }
  } else if (environment === 'production') {
    // Remove debug properties in production
    if (item.data.customProperties) {
      Object.keys(item.data.customProperties).forEach(key => {
        if (key.startsWith('debug.')) {
          delete item.data.customProperties[key];
        }
      });
    }
  }
  
  return true;
});

// User role-based processing
sdk.addTelemetryInitializer((item: ITelemetryItem) => {
  const user = getCurrentUser();
  
  if (user?.role === 'admin') {
    // Add additional context for admin users
    item.data.customProperties = item.data.customProperties || {};
    item.data.customProperties['admin.privileges'] = user.privileges.join(',');
    item.data.customProperties['admin.lastLogin'] = user.lastLogin?.toISOString();
  } else if (user?.role === 'beta-tester') {
    // Add beta testing context
    item.data.customProperties = item.data.customProperties || {};
    item.data.customProperties['beta.cohort'] = user.betaCohort;
    item.data.customProperties['beta.features'] = user.enabledBetaFeatures.join(',');
  }
  
  return true;
});
```

#### **Error Handling and Resilience**

```typescript
// Robust error handling in initializers
sdk.addTelemetryInitializer((item: ITelemetryItem) => {
  const startTime = performance.now();
  
  try {
    // Potentially expensive operation
    const enrichmentData = getExpensiveEnrichmentData();
    
    if (enrichmentData) {
      item.data.customProperties = item.data.customProperties || {};
      Object.assign(item.data.customProperties, enrichmentData);
    }
    
    const processingTime = performance.now() - startTime;
    
    // Monitor initializer performance
    if (processingTime > 5) { // 5ms threshold
      console.warn(`Slow telemetry initializer: ${processingTime}ms`);
      
      // Track slow initializer performance
      trackSlowInitializer({
        duration: processingTime,
        itemType: item.baseType,
        itemName: item.name
      });
    }
    
    return true;
  } catch (error) {
    // Graceful error handling - don't block telemetry
    console.error('Telemetry initializer error:', error);
    
    // Optionally add error context
    item.data.customProperties = item.data.customProperties || {};
    item.data.customProperties['initializer.error'] = error.message;
    
    return true; // Continue processing despite errors
  }
});
```

#### **Chained Processing**

```typescript
// Initializers execute in registration order
// Design for proper chaining and dependencies

// 1. First: Add basic context
sdk.addTelemetryInitializer(addBasicContext);

// 2. Second: Add user context (may depend on basic context)
sdk.addTelemetryInitializer(addUserContext);

// 3. Third: Add business context (may depend on user context)
sdk.addTelemetryInitializer(addBusinessContext);

// 4. Fourth: Apply privacy filtering (after all context is added)
sdk.addTelemetryInitializer(applyPrivacyFiltering);

// 5. Fifth: Apply sampling (final step before sending)
sdk.addTelemetryInitializer(applySampling);

function addBasicContext(item: ITelemetryItem): boolean {
  item.data.customProperties = item.data.customProperties || {};
  item.data.customProperties['app.version'] = APP_VERSION;
  item.data.customProperties['app.environment'] = ENVIRONMENT;
  return true;
}

function addUserContext(item: ITelemetryItem): boolean {
  const user = getCurrentUser();
  if (user) {
    // User context depends on basic context being present
    item.data.customProperties['user.id'] = user.id;
    item.data.customProperties['user.type'] = user.type;
  }
  return true;
}

function addBusinessContext(item: ITelemetryItem): boolean {
  // Business context may depend on user context
  const user = getCurrentUser();
  if (user?.organization) {
    item.data.customProperties['org.id'] = user.organization.id;
    item.data.customProperties['org.tier'] = user.organization.tier;
  }
  return true;
}

function applyPrivacyFiltering(item: ITelemetryItem): boolean {
  // Apply privacy rules after all context is added
  return sanitizeForPrivacy(item);
}

function applySampling(item: ITelemetryItem): boolean {
  // Final sampling decision based on complete context
  return shouldSampleItem(item);
}
```

## Performance Comparison

### **Telemetry Initializers vs OpenTelemetry Processors**

| Aspect | Telemetry Initializers | OpenTelemetry Processors |
|--------|------------------------|---------------------------|
| **Processing Time** | ~1-2μs per item | ~5-10μs per item |
| **Bundle Size** | ~0.5KB per initializer | ~2-3KB per processor |
| **Memory Overhead** | Minimal (callback only) | Higher (processor instance + state) |
| **Initialization Cost** | Near-zero | Class instantiation + setup |
| **Error Handling** | Simple try/catch | Complex state management |
| **Lifecycle Management** | Automatic | Manual (onStart, onEnd, shutdown) |
| **Flexibility** | Simple callback pattern | Full processor lifecycle |
| **Use Cases** | Data enrichment, filtering | Complex transformations, batching |
| **Learning Curve** | Minimal | OpenTelemetry knowledge required |
| **Migration Effort** | Direct from App Insights | Requires refactoring |

### **When to Use Each Approach**

#### **Use Telemetry Initializers For:**

- **Data Enrichment**: Adding context, properties, and measurements
- **Privacy Filtering**: Removing PII and sensitive data
- **Simple Sampling**: Basic sampling and rate limiting
- **Context Addition**: User, session, business context
- **Quick Filtering**: Simple true/false filtering decisions
- **Migration**: Moving from Application Insights
- **Performance Critical**: Low-latency scenarios
- **Simple Logic**: Straightforward transformations

#### **Use OpenTelemetry Processors For:**

- **Complex Processing**: Advanced telemetry transformations
- **Batching Logic**: Custom batching strategies
- **Export Control**: Fine-grained export management
- **Lifecycle Hooks**: Need onStart, onEnd callbacks
- **State Management**: Processing that requires state
- **Resource Management**: Advanced resource handling
- **Standard Compliance**: Pure OpenTelemetry compatibility
- **Advanced Scenarios**: Complex business logic

## Migration from Application Insights

### **Direct Migration Path**

Existing Application Insights telemetry initializers can be migrated with minimal changes:

```typescript
// Existing Application Insights pattern
appInsights.addTelemetryInitializer((envelope) => {
  envelope.tags['ai.user.authUserId'] = getCurrentUserId();
  envelope.data.baseData.properties = envelope.data.baseData.properties || {};
  envelope.data.baseData.properties['customProperty'] = 'value';
  return true;
});

// Equivalent OTelWebSdk pattern
sdk.addTelemetryInitializer((item) => {
  item.tags = item.tags || {};
  item.tags['ai.user.authUserId'] = getCurrentUserId();
  
  item.data.customProperties = item.data.customProperties || {};
  item.data.customProperties['customProperty'] = 'value';
  
  return true; // Must explicitly return true
});
```

### **Migration Differences**

| Application Insights | OTelWebSdk | Notes |
|----------------------|-------------|-------|
| `envelope.tags` | `item.tags` | Same structure |
| `envelope.data.baseData.properties` | `item.data.customProperties` | Simplified path |
| `envelope.data.baseData.measurements` | `item.data.customMeasurements` | Simplified path |
| `envelope.name` | `item.name` | Same |
| `envelope.time` | `item.time` | Same |
| Return value optional | Return value required | Must return boolean |

### **Migration Utilities**

```typescript
// Utility to wrap existing Application Insights initializers
function wrapAppInsightsInitializer(
  aiInitializer: (envelope: any) => boolean | void
): ITelemetryInitializer {
  return (item: ITelemetryItem) => {
    // Convert OTelWebSdk item to Application Insights envelope format
    const envelope = {
      name: item.name,
      time: item.time,
      tags: item.tags || {},
      data: {
        baseType: item.baseType,
        baseData: {
          ...item.baseData,
          properties: item.data.customProperties || {},
          measurements: item.data.customMeasurements || {}
        }
      }
    };
    
    // Call original initializer
    const result = aiInitializer(envelope);
    
    // Convert back to OTelWebSdk format
    item.tags = envelope.tags;
    item.data.customProperties = envelope.data.baseData.properties;
    item.data.customMeasurements = envelope.data.baseData.measurements;
    
    return result !== false; // Convert to boolean
  };
}

// Usage
const existingAIInitializer = (envelope) => {
  envelope.tags['custom.tag'] = 'value';
  return true;
};

sdk.addTelemetryInitializer(
  wrapAppInsightsInitializer(existingAIInitializer)
);
```

## Integration with OpenTelemetry Ecosystem

### **Hybrid Processing Pipeline**

The SDK supports seamless integration between telemetry initializers and OpenTelemetry processors:

```typescript
// Processing order:
// 1. Telemetry Initializers (lightweight, fast)
// 2. OpenTelemetry Processors (full featured)
// 3. Export

// Step 1: Lightweight processing
sdk.addTelemetryInitializer(addUserContext);
sdk.addTelemetryInitializer(sanitizeUrls);
sdk.addTelemetryInitializer(applySampling);

// Step 2: Full OpenTelemetry processing
sdk.addSpanProcessor(new BatchSpanProcessor(spanExporter));
sdk.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));

// Step 3: Export happens automatically through processors
```

### **Data Flow**

```
Telemetry Event
      ↓
Telemetry Initializers (Application Insights style)
      ↓
OpenTelemetry API Layer
      ↓
OpenTelemetry Processors
      ↓
OpenTelemetry Exporters
      ↓
Backend Systems
```

### **Best Practices**

#### **Use Initializers for Fast Path Processing**

```typescript
// Fast path: Use initializers for simple, common operations
sdk.addTelemetryInitializer(addUserContext);      // ~1μs
sdk.addTelemetryInitializer(addAppVersion);       // ~1μs
sdk.addTelemetryInitializer(sanitizeUrls);        // ~2μs

// Slow path: Use processors for complex operations
sdk.addSpanProcessor(new ComplexAnalyticsProcessor()); // ~10μs
```

#### **Maintain Clear Separation**

```typescript
// Data enrichment → Initializers
sdk.addTelemetryInitializer(addBasicContext);

// Complex processing → Processors
sdk.addSpanProcessor(new AdvancedProcessor());

// Export control → Processors
sdk.addSpanProcessor(new BatchSpanProcessor(exporter));
```

## Configuration and Management

### **Dynamic Initializer Management**

```typescript
// Add initializers
const userContextInitializer = (item) => {
  // Add user context
  return addUserContext(item);
};

sdk.addTelemetryInitializer(userContextInitializer);

// Remove initializers
sdk.removeTelemetryInitializer(userContextInitializer);

// Conditional registration
if (featureFlags.enableUserTracking) {
  sdk.addTelemetryInitializer(userContextInitializer);
}
```

### **Initializer Registry**

```typescript
class InitializerRegistry {
  private initializers = new Map<string, ITelemetryInitializer>();
  
  register(name: string, initializer: ITelemetryInitializer): void {
    this.initializers.set(name, initializer);
    sdk.addTelemetryInitializer(initializer);
  }
  
  unregister(name: string): void {
    const initializer = this.initializers.get(name);
    if (initializer) {
      sdk.removeTelemetryInitializer(initializer);
      this.initializers.delete(name);
    }
  }
  
  list(): string[] {
    return Array.from(this.initializers.keys());
  }
}

// Usage
const registry = new InitializerRegistry();
registry.register('userContext', addUserContext);
registry.register('businessContext', addBusinessContext);
registry.unregister('userContext');
```

## Testing and Debugging

### **Testing Initializers**

```typescript
// Unit testing telemetry initializers
describe('User Context Initializer', () => {
  it('should add user context when user is present', () => {
    // Arrange
    const mockUser = { id: '123', role: 'admin' };
    jest.spyOn(userService, 'getCurrentUser').mockReturnValue(mockUser);
    
    const item: ITelemetryItem = {
      name: 'test-event',
      time: new Date().toISOString(),
      baseType: 'EventData',
      baseData: {},
      data: {}
    };
    
    // Act
    const result = addUserContext(item);
    
    // Assert
    expect(result).toBe(true);
    expect(item.data.customProperties['user.id']).toBe('123');
    expect(item.data.customProperties['user.role']).toBe('admin');
  });
  
  it('should handle missing user gracefully', () => {
    // Arrange
    jest.spyOn(userService, 'getCurrentUser').mockReturnValue(null);
    
    const item: ITelemetryItem = {
      name: 'test-event',
      time: new Date().toISOString(),
      baseType: 'EventData',
      baseData: {},
      data: {}
    };
    
    // Act
    const result = addUserContext(item);
    
    // Assert
    expect(result).toBe(true);
    expect(item.data.customProperties).toBeUndefined();
  });
});
```

### **Debugging Initializers**

```typescript
// Debug wrapper for initializers
function debugInitializer(
  name: string, 
  initializer: ITelemetryInitializer
): ITelemetryInitializer {
  return (item: ITelemetryItem) => {
    console.log(`[${name}] Processing:`, item.name);
    
    const startTime = performance.now();
    const result = initializer(item);
    const duration = performance.now() - startTime;
    
    console.log(`[${name}] Result: ${result}, Duration: ${duration}ms`);
    
    if (duration > 5) {
      console.warn(`[${name}] Slow initializer detected: ${duration}ms`);
    }
    
    return result;
  };
}

// Usage
sdk.addTelemetryInitializer(
  debugInitializer('userContext', addUserContext)
);
```

## Summary

The OTelWebSdk provides a comprehensive telemetry processing solution that combines the best of both worlds:

- **OpenTelemetry Standards Compliance**: Full support for OpenTelemetry processors as the primary approach
- **Lightweight Alternatives**: Application Insights-style initializers for performance-critical scenarios
- **Migration Path**: Seamless migration from existing Application Insights implementations
- **Hybrid Architecture**: Use both approaches together for optimal performance and functionality

This dual approach enables teams to choose the right tool for each use case while maintaining compatibility with both the OpenTelemetry ecosystem and existing Application Insights implementations.