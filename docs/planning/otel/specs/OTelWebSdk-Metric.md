# OpenTelemetry Web SDK Basic Metric Implementation

This document describes the basic metric implementation of the OpenTelemetry Web SDK using closures and DynamicProto-JS. This implementation focuses on simple metric generation without complex aggregations, views, or advanced features.

## Basic Metric Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             Basic Metric Provider Architecture                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Factory Creation Layer                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │  createMeterProvider(config: IBasicMeterConfig): IMeterProvider             │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                           │ │
│  │  │ Resource    │ │ Basic       │ │ Simple      │                           │ │
│  │  │ Injection   │ │ Readers     │ │ Export      │                           │ │
│  │  │             │ │ Injection   │ │             │                           │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘                           │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                     │                                           │
│  Meter Provider Interface Layer     │                                           │
│  ┌─────────────────────────────────▼─────────────────────────────────────────┐   │
│  │                          IMeterProvider (Basic)                          │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                         │   │
│  │  │ getMeter()  │ │ addMetric   │ │ shutdown()  │                         │   │
│  │  │             │ │ Reader()    │ │             │                         │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘                         │   │
│  └─────────────────────────────────┬─────────────────────────────────────────┘   │
│                                    │                                             │
│  Meter Instance Layer              │                                             │
│  ┌─────────────────────────────────▼─────────────────────────────────────────┐   │
│  │                          IMeter Instances (Basic)                        │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                         │   │
│  │  │ create      │ │ create      │ │ create      │                         │   │
│  │  │ Counter()   │ │ Histogram() │ │ Gauge()     │                         │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘                         │   │
│  └─────────────────────────────────┬─────────────────────────────────────────┘   │
│                                    │                                             │
│  Instrument Implementation Layer   │                                             │
│  ┌─────────────────────────────────▼─────────────────────────────────────────┐   │
│  │                         Basic Metric Instruments                         │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                         │   │
│  │  │ ICounter    │ │ IHistogram  │ │ IGauge      │                         │   │
│  │  │ .add()      │ │ .record()   │ │ .set()      │                         │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘                         │   │
│  └─────────────────────────────────┬─────────────────────────────────────────┘   │
│                                    │                                             │
│  Simple Collection Layer           │                                             │
│  ┌─────────────────────────────────▼─────────────────────────────────────────┐   │
│  │                         Basic Metric Collection                          │   │
│  │  ┌─────────────┐ ┌─────────────┐                                         │   │
│  │  │ Simple      │ │ Basic       │                                         │   │
│  │  │ Reader      │ │ Exporter    │                                         │   │
│  │  └─────────────┘ └─────────────┘                                         │   │
│  └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Basic Metric Provider Interfaces

```typescript
/**
 * Basic configuration for the Meter Provider
 */
export interface IBasicMeterConfig {
  /** Maximum number of metrics to batch before sending */
  maxBatchSize?: number;
  /** Maximum batch wait time in milliseconds */
  maxBatchWaitTimeMs?: number;
  /** Custom attributes to add to all metrics */
  defaultAttributes?: Record<string, any>;
}

/**
 * Basic interface for the Meter Provider
 */
export interface IMeterProvider {
  /**
   * Returns a meter instance for the given name, version, and options
   * @param name The name of the meter (usually the component name)
   * @param version Optional version of the component
   * @param options Optional meter configuration options
   * @returns A meter instance
   */
  getMeter(name: string, version?: string, options?: IMeterOptions): IMeter;
}

/**
 * @internal
 * Internal interface for the basic Meter Provider
 */
export interface _IMeterProviderInternal extends IMeterProvider {
  _processMetricData(metric: IMetricData): void;
  _shutdown(): Promise<void>;
}

/**
 * Interface for meter options
 */
export interface IMeterOptions {
  /** Schema URL for the meter */
  schemaUrl?: string;
  /** Custom attributes for the meter */
  attributes?: Record<string, any>;
}
```

## Basic Meter Interface

```typescript
/**
 * Basic interface for a meter - supports only simple metric types
 */
export interface IMeter {
  /**
   * Creates a counter instrument
   * @param name The name of the instrument
   * @param options Configuration options
   * @returns A counter instrument
   */
  createCounter(name: string, options?: ICounterOptions): ICounter;
  
  /**
   * Creates a histogram instrument
   * @param name The name of the instrument
   * @param options Configuration options
   * @returns A histogram instrument
   */
  createHistogram(name: string, options?: IHistogramOptions): IHistogram;
  
  /**
   * Creates a gauge instrument
   * @param name The name of the instrument
   * @param options Configuration options
   * @returns A gauge instrument
   */
  createGauge(name: string, options?: IGaugeOptions): IGauge;
}

/**
 * @internal
 * Internal interface for a basic meter
 */
export interface _IMeterInternal extends IMeter {
  _getName(): string;
  _getVersion(): string | undefined;
  _getAttributes(): Record<string, any>;
}

/**
 * Base instrument options
 */
export interface IInstrumentOptions {
  /** Description of the instrument */
  description?: string;
  /** Unit of the instrument */
  unit?: string;
  /** Attributes to include with all measurements */
  attributes?: Record<string, any>;
}

/**
 * Counter options
 */
export interface ICounterOptions extends IInstrumentOptions {
  // Basic counter has no additional options
}

/**
 * Histogram options
 */
export interface IHistogramOptions extends IInstrumentOptions {
  /** Simple bucket boundaries (optional) */
  boundaries?: number[];
}

/**
 * Gauge options
 */
export interface IGaugeOptions extends IInstrumentOptions {
  // Basic gauge has no additional options
}
```

## Basic Metric Instruments Interfaces

```typescript
/**
 * Interface for a counter instrument
 */
export interface ICounter {
  /**
   * Record a value
   * @param value The value to record (must be positive)
   * @param attributes Attributes to associate with the value
   */
  add(value: number, attributes?: Record<string, any>): void;
}

/**
 * Interface for a histogram instrument
 */
export interface IHistogram {
  /**
   * Record a value
   * @param value The value to record
   * @param attributes Attributes to associate with the value
   */
  record(value: number, attributes?: Record<string, any>): void;
}

/**
 * Interface for a gauge instrument
 */
export interface IGauge {
  /**
   * Set the current value
   * @param value The value to set
   * @param attributes Attributes to associate with the value
   */
  set(value: number, attributes?: Record<string, any>): void;
}
```

## Basic Metric Data Interfaces

```typescript
/**
 * Interface for basic metric data
 */
export interface IMetricData {
  /** The name of the metric */
  name: string;
  /** The description of the metric */
  description: string;
  /** The unit of the metric */
  unit: string;
  /** The type of the metric */
  type: BasicMetricType;
  /** The data points of the metric */
  dataPoints: IMetricDataPoint[];
  /** The timestamp when the metric was recorded */
  timestamp: number;
}

/**
 * Interface for a metric data point
 */
export interface IMetricDataPoint {
  /** The value of the data point */
  value: number | IHistogramValue;
  /** The attributes of the data point */
  attributes: Record<string, any>;
  /** The timestamp of the data point */
  timestamp: number;
}

/**
 * Interface for histogram value (simplified)
 */
export interface IHistogramValue {
  /** The sum of all values */
  sum: number;
  /** The count of values */
  count: number;
  /** The min value */
  min?: number;
  /** The max value */
  max?: number;
  /** The bucket counts (if using buckets) */
  buckets?: number[];
  /** The bucket boundaries (if using buckets) */
  boundaries?: number[];
}

/**
 * Basic metric types
 */
export enum BasicMetricType {
  COUNTER,
  HISTOGRAM,
  GAUGE
}
```

## Basic Meter Provider Implementation with Closures

```typescript
/**
 * Create a basic Meter Provider
 * @param config Configuration for the Meter Provider
 * @param contextManager The context manager to use
 * @returns A new basic Meter Provider instance
 */
export function createMeterProvider(config: IBasicMeterConfig = {}, contextManager: IContextManager): IMeterProvider {
  // Private closure variables
  let _meters: Map<string, IMeter> = new Map();
  let _config = config || {};
  let _contextManager = contextManager;
  let _maxBatchSize = _config.maxBatchSize ?? 100;
  let _maxBatchWaitTimeMs = _config.maxBatchWaitTimeMs ?? 5000;
  let _defaultAttributes = _config.defaultAttributes || {};
  let _metricProcessor = createBasicMetricProcessor({
    maxBatchSize: _maxBatchSize,
    maxBatchWaitTimeMs: _maxBatchWaitTimeMs
  });
  
  // Create the instance
  let _self = {} as _IMeterProviderInternal;
  
  // Define methods using DynamicProto
  dynamicProto({} as any, _self, (self: _IMeterProviderInternal) => {
    // Get a meter
    self.getMeter = (name: string, version?: string, options?: IMeterOptions): IMeter => {
      const key = `${name}@${version || ''}`;
      
      if (!_meters.has(key)) {
        _meters.set(key, createMeter(name, version, options, _self, _contextManager));
      }
      
      return _meters.get(key)!;
    };
    
    // Process metric data
    self._processMetricData = (metric: IMetricData): void => {
      _metricProcessor.onEmit(metric);
    };
    
    // Shutdown the meter provider
    self._shutdown = (): Promise<void> => {
      return _metricProcessor.shutdown();
    };
  });
  
  return _self;
}
```

## Basic Meter Implementation with Closures

```typescript
/**
 * Create a basic Meter
 * @param name The name of the meter
 * @param version The version of the meter
 * @param options Options for the meter
 * @param meterProvider The meter provider to use
 * @param contextManager The context manager to use
 * @returns A new basic Meter instance
 */
export function createMeter(
  name: string,
  version?: string,
  options?: IMeterOptions,
  meterProvider: _IMeterProviderInternal,
  contextManager: IContextManager
): IMeter {
  // Private closure variables
  let _name = name;
  let _version = version;
  let _options = options || {};
  let _attributes = _options.attributes || {};
  let _meterProvider = meterProvider;
  let _contextManager = contextManager;
  let _instruments: Map<string, any> = new Map();
  
  // Create the instance
  let _self = {} as _IMeterInternal;
  
  // Define methods using DynamicProto
  dynamicProto({} as any, _self, (self: _IMeterInternal) => {
    // Create a counter
    self.createCounter = (name: string, options?: ICounterOptions): ICounter => {
      const key = `counter:${name}`;
      if (!_instruments.has(key)) {
        _instruments.set(key, createCounter(name, options, _meterProvider));
      }
      
      return _instruments.get(key) as ICounter;
    };
    
    // Create a histogram
    self.createHistogram = (name: string, options?: IHistogramOptions): IHistogram => {
      const key = `histogram:${name}`;
      if (!_instruments.has(key)) {
        _instruments.set(key, createHistogram(name, options, _meterProvider));
      }
      
      return _instruments.get(key) as IHistogram;
    };
    
    // Create a gauge
    self.createGauge = (name: string, options?: IGaugeOptions): IGauge => {
      const key = `gauge:${name}`;
      if (!_instruments.has(key)) {
        _instruments.set(key, createGauge(name, options, _meterProvider));
      }
      
      return _instruments.get(key) as IGauge;
    };
    
    // Internal methods
    self._getName = (): string => {
      return _name;
    };
    
    self._getVersion = (): string | undefined => {
      return _version;
    };
    
    self._getAttributes = (): Record<string, any> => {
      return { ..._attributes };
    };
  });
  
  return _self;
}
```

## Basic Metric Instruments Implementation with Closures

```typescript
/**
 * Create a counter instrument
 * @param name The name of the counter
 * @param options Options for the counter
 * @param meterProvider The meter provider to use
 * @returns A new counter instance
 */
export function createCounter(
  name: string,
  options: ICounterOptions = {},
  meterProvider: _IMeterProviderInternal
): ICounter {
  // Private closure variables
  let _name = name;
  let _options = options;
  let _description = _options.description || '';
  let _unit = _options.unit || '';
  let _attributes = _options.attributes || {};
  let _meterProvider = meterProvider;
  let _values: Map<string, number> = new Map();
  
  // Create the instance
  let _self = {} as ICounter;
  
  // Define methods using DynamicProto
  dynamicProto({} as any, _self, (self: ICounter) => {
    // Add a value
    self.add = (value: number, attributes: Record<string, any> = {}): void => {
      if (value < 0) {
        console.error(`Attempted to add a negative value to counter: ${_name}`);
        return;
      }
      
      const key = _getAttributeKey(attributes);
      const currentValue = _values.get(key) || 0;
      const newValue = currentValue + value;
      _values.set(key, newValue);
      
      // Create metric data
      const metricData = _createMetricData(attributes, newValue);
      
      // Process the metric data
      _meterProvider._processMetricData(metricData);
    };
  });
  
  /**
   * Get a key for attributes
   * @param attributes The attributes to get a key for
   * @returns A string key
   */
  function _getAttributeKey(attributes: Record<string, any>): string {
    const merged = { ..._attributes, ...attributes };
    const keys = Object.keys(merged).sort();
    
    return keys.map(key => `${key}:${merged[key]}`).join(',');
  }
  
  /**
   * Create metric data
   * @param attributes The attributes for the metric
   * @param value The value of the metric
   * @returns Metric data
   */
  function _createMetricData(attributes: Record<string, any>, value: number): IMetricData {
    return {
      name: _name,
      description: _description,
      unit: _unit,
      type: BasicMetricType.COUNTER,
      dataPoints: [
        {
          value,
          attributes: { ..._attributes, ...attributes },
          timestamp: Date.now()
        }
      ],
      timestamp: Date.now()
    };
  }
  
  return _self;
}

/**
 * Create a histogram instrument
 * @param name The name of the histogram
 * @param options Options for the histogram
 * @param meterProvider The meter provider to use
 * @returns A new histogram instance
 */
export function createHistogram(
  name: string,
  options: IHistogramOptions = {},
  meterProvider: _IMeterProviderInternal
): IHistogram {
  // Private closure variables
  let _name = name;
  let _options = options;
  let _description = _options.description || '';
  let _unit = _options.unit || '';
  let _attributes = _options.attributes || {};
  let _boundaries = _options.boundaries || [0, 5, 10, 25, 50, 100, 250, 500, 1000];
  let _meterProvider = meterProvider;
  let _histograms: Map<string, { sum: number, count: number, min: number, max: number, buckets: number[] }> = new Map();
  
  // Create the instance
  let _self = {} as IHistogram;
  
  // Define methods using DynamicProto
  dynamicProto({} as any, _self, (self: IHistogram) => {
    // Record a value
    self.record = (value: number, attributes: Record<string, any> = {}): void => {
      const key = _getAttributeKey(attributes);
      let histogram = _histograms.get(key);
      
      if (!histogram) {
        histogram = {
          sum: 0,
          count: 0,
          min: Number.MAX_VALUE,
          max: Number.MIN_VALUE,
          buckets: new Array(_boundaries.length + 1).fill(0)
        };
        _histograms.set(key, histogram);
      }
      
      // Update the histogram
      histogram.sum += value;
      histogram.count++;
      histogram.min = Math.min(histogram.min, value);
      histogram.max = Math.max(histogram.max, value);
      
      // Find the bucket for this value
      let bucketIndex = _boundaries.findIndex(boundary => value <= boundary);
      if (bucketIndex === -1) {
        bucketIndex = _boundaries.length;
      }
      histogram.buckets[bucketIndex]++;
      
      // Create metric data
      const metricData = _createMetricData(attributes, histogram);
      
      // Process the metric data
      _meterProvider._processMetricData(metricData);
    };
  });
  
  /**
   * Get a key for attributes
   * @param attributes The attributes to get a key for
   * @returns A string key
   */
  function _getAttributeKey(attributes: Record<string, any>): string {
    const merged = { ..._attributes, ...attributes };
    const keys = Object.keys(merged).sort();
    
    return keys.map(key => `${key}:${merged[key]}`).join(',');
  }
  
  /**
   * Create metric data
   * @param attributes The attributes for the metric
   * @param histogram The histogram value
   * @returns Metric data
   */
  function _createMetricData(attributes: Record<string, any>, histogram: { sum: number, count: number, min: number, max: number, buckets: number[] }): IMetricData {
    return {
      name: _name,
      description: _description,
      unit: _unit,
      type: BasicMetricType.HISTOGRAM,
      dataPoints: [
        {
          value: {
            sum: histogram.sum,
            count: histogram.count,
            min: histogram.min,
            max: histogram.max,
            buckets: histogram.buckets,
            boundaries: _boundaries
          },
          attributes: { ..._attributes, ...attributes },
          timestamp: Date.now()
        }
      ],
      timestamp: Date.now()
    };
  }
  
  return _self;
}

/**
 * Create a gauge instrument
 * @param name The name of the gauge
 * @param options Options for the gauge
 * @param meterProvider The meter provider to use
 * @returns A new gauge instance
 */
export function createGauge(
  name: string,
  options: IGaugeOptions = {},
  meterProvider: _IMeterProviderInternal
): IGauge {
  // Private closure variables
  let _name = name;
  let _options = options;
  let _description = _options.description || '';
  let _unit = _options.unit || '';
  let _attributes = _options.attributes || {};
  let _meterProvider = meterProvider;
  let _values: Map<string, number> = new Map();
  
  // Create the instance
  let _self = {} as IGauge;
  
  // Define methods using DynamicProto
  dynamicProto({} as any, _self, (self: IGauge) => {
    // Set a value
    self.set = (value: number, attributes: Record<string, any> = {}): void => {
      const key = _getAttributeKey(attributes);
      _values.set(key, value);
      
      // Create metric data
      const metricData = _createMetricData(attributes, value);
      
      // Process the metric data
      _meterProvider._processMetricData(metricData);
    };
  });
  
  /**
   * Get a key for attributes
   * @param attributes The attributes to get a key for
   * @returns A string key
   */
  function _getAttributeKey(attributes: Record<string, any>): string {
    const merged = { ..._attributes, ...attributes };
    const keys = Object.keys(merged).sort();
    
    return keys.map(key => `${key}:${merged[key]}`).join(',');
  }
  
  /**
   * Create metric data
   * @param attributes The attributes for the metric
   * @param value The value of the metric
   * @returns Metric data
   */
  function _createMetricData(attributes: Record<string, any>, value: number): IMetricData {
    return {
      name: _name,
      description: _description,
      unit: _unit,
      type: BasicMetricType.GAUGE,
      dataPoints: [
        {
          value,
          attributes: { ..._attributes, ...attributes },
          timestamp: Date.now()
        }
      ],
      timestamp: Date.now()
    };
  }
  
  return _self;
}
```

## Basic Usage Example

```typescript
import { createOTelWebSdk } from "@microsoft/otel-web-sdk";

// Create a new SDK instance
const sdk = createOTelWebSdk({
  meterConfig: {
    defaultAttributes: {
      'app.version': '1.0.0',
      'app.environment': 'production'
    }
  }
});

// Initialize the SDK
sdk.initialize();

// Get a meter
const meter = sdk.metrics.getMeter("my-component", "1.0.0");

// Create basic instruments
const requestCounter = meter.createCounter("http.requests", {
  description: "Number of HTTP requests",
  unit: "requests"
});

const responseTimeHistogram = meter.createHistogram("http.response_time", {
  description: "HTTP response times",
  unit: "ms",
  boundaries: [0, 10, 50, 100, 500, 1000]
});

const activeConnectionsGauge = meter.createGauge("connections.active", {
  description: "Number of active connections",
  unit: "connections"
});

// Record metrics in application code
function handleRequest(request: any) {
  const startTime = performance.now();
  
  // Increment request counter
  requestCounter.add(1, {
    "http.method": request.method,
    "http.route": request.route
  });
  
  try {
    // Process the request...
    const response = processRequest(request);
    
    // Record response time
    const duration = performance.now() - startTime;
    responseTimeHistogram.record(duration, {
      "http.method": request.method,
      "http.route": request.route,
      "http.status_code": response.statusCode
    });
    
    return response;
  } catch (error) {
    // Record error
    requestCounter.add(1, {
      "http.method": request.method,
      "http.route": request.route,
      "error": "true"
    });
    
    throw error;
  }
}

// Update gauge values periodically
setInterval(() => {
  const activeConnections = getActiveConnectionCount();
  activeConnectionsGauge.set(activeConnections);
}, 5000);

// Shutdown the SDK when done
window.addEventListener("unload", () => {
  sdk.shutdown().catch(console.error);
});
```

## Next Steps

For detailed implementation of other components, refer to the following documents:

- [OTelWebSdk-Trace.md](./OTelWebSdk-Trace.md)
- [OTelWebSdk-Log.md](./OTelWebSdk-Log.md)
- [OTelWebSdk-Context.md](./OTelWebSdk-Context.md)

## Testing and Performance

### Basic Metric Testing
For basic metrics testing strategies including metric accuracy validation and simple export verification, see [Testing Strategy](./OTelWebSdk-Testing.md).

### Performance Optimization
For basic metric performance optimization including efficient metric collection and memory management, see [Performance Strategy](./OTelWebSdk-Performance.md).

### Migration from Existing Metrics
For migration strategies from Application Insights trackMetric to basic OpenTelemetry metrics, see [Migration Guide](./OTelWebSdk-Migration.md).

## Limitations

This basic metrics implementation intentionally excludes the following advanced features to maintain simplicity:

- **Observable instruments** (observableCounter, observableGauge, observableUpDownCounter)
- **UpDownCounter** instrument type
- **Views and view configuration** for customizing metric collection
- **Complex aggregation strategies** and custom aggregators
- **Exemplars support** for trace correlation
- **Advanced metric readers** (only basic push reader is supported)
- **Metric filtering and sampling** through views
- **Metric renaming and attribute transformation**

For comprehensive metrics implementation with these advanced features, refer to the comprehensive metrics roadmap in future SDK versions.
