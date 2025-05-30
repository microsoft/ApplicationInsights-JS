# OpenTelemetry Web SDK Metric Implementation

This document describes the metric implementation of the OpenTelemetry Web SDK using closures and DynamicProto-JS.

## Metric Provider Interfaces

```typescript
/**
 * Public interface for the Metric Provider configuration
 */
export interface IMeterConfig {
  /** Maximum number of metrics to batch before sending */
  maxBatchSize?: number;
  /** Maximum batch wait time in milliseconds */
  maxBatchWaitTimeMs?: number;
  /** Default aggregation temporality */
  defaultAggregationTemporality?: AggregationTemporality;
  /** Custom attributes to add to all metrics */
  defaultAttributes?: Record<string, any>;
}

/**
 * Metric aggregation temporality
 */
export const enum eAggregationTemporality {
  UNSPECIFIED = 0,
  DELTA = 1,
  CUMULATIVE = 2
}

/**
 * Aggregation temporality type without e-prefix
 */
export type AggregationTemporality = eAggregationTemporality;

/**
 * Public interface for the Metric Provider
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
 * Internal interface for the Metric Provider
 */
export interface _IMeterProviderInternal extends IMeterProvider {
  _processMetricData(metric: IMetricData): void;
  _forceFlush(): Promise<void>;
  _getAggregationTemporality(): AggregationTemporality;
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

## Meter Interface

```typescript
/**
 * Public interface for a meter
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
   * Creates an up-down counter instrument
   * @param name The name of the instrument
   * @param options Configuration options
   * @returns An up-down counter instrument
   */
  createUpDownCounter(name: string, options?: ICounterOptions): IUpDownCounter;
  
  /**
   * Creates a gauge instrument
   * @param name The name of the instrument
   * @param options Configuration options
   * @returns A gauge instrument
   */
  createObservableGauge(name: string, options?: IObservableOptions): IObservableGauge;
  
  /**
   * Creates an observable counter instrument
   * @param name The name of the instrument
   * @param options Configuration options
   * @returns An observable counter instrument
   */
  createObservableCounter(name: string, options?: IObservableOptions): IObservableCounter;
  
  /**
   * Creates an observable up-down counter instrument
   * @param name The name of the instrument
   * @param options Configuration options
   * @returns An observable up-down counter instrument
   */
  createObservableUpDownCounter(name: string, options?: IObservableOptions): IObservableUpDownCounter;
}

/**
 * @internal
 * Internal interface for a meter
 */
export interface _IMeterInternal extends IMeter {
  _getName(): string;
  _getVersion(): string | undefined;
  _getAttributes(): Record<string, any>;
  _collectAllMetrics(): Promise<IMetricData[]>;
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
  /** Whether the counter can have negative values */
  monotonic?: boolean;
}

/**
 * Histogram options
 */
export interface IHistogramOptions extends IInstrumentOptions {
  /** Explicit bucket boundaries */
  boundaries?: number[];
}

/**
 * Observable options
 */
export interface IObservableOptions extends IInstrumentOptions {
  /** Callback to collect the value */
  callback?: (observer: IObserver) => void;
}

/**
 * Value types
 */
export const enum eValueType {
  INT,
  DOUBLE
}

/**
 * Value type without e-prefix
 */
export type ValueType = eValueType;
```

## Metric Instruments Interfaces

```typescript
/**
 * Interface for a counter instrument
 */
export interface ICounter {
  /**
   * Record a value
   * @param value The value to record
   * @param attributes Attributes to associate with the value
   */
  add(value: number, attributes?: Record<string, any>): void;
}

/**
 * Interface for an up-down counter instrument
 */
export interface IUpDownCounter {
  /**
   * Record a value
   * @param value The value to record
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
 * Interface for observer callback
 */
export interface IObserver {
  /**
   * Observe a value
   * @param value The value to observe
   * @param attributes Attributes to associate with the value
   */
  observe(value: number, attributes?: Record<string, any>): void;
}

/**
 * Interface for an observable gauge instrument
 */
export interface IObservableGauge {
  /**
   * Add a callback for observing values
   * @param callback The callback to add
   * @returns This instrument for chaining
   */
  addCallback(callback: (observer: IObserver) => void): IObservableGauge;
  
  /**
   * Remove a callback
   * @param callback The callback to remove
   * @returns This instrument for chaining
   */
  removeCallback(callback: (observer: IObserver) => void): IObservableGauge;
}

/**
 * Interface for an observable counter instrument
 */
export interface IObservableCounter {
  /**
   * Add a callback for observing values
   * @param callback The callback to add
   * @returns This instrument for chaining
   */
  addCallback(callback: (observer: IObserver) => void): IObservableCounter;
  
  /**
   * Remove a callback
   * @param callback The callback to remove
   * @returns This instrument for chaining
   */
  removeCallback(callback: (observer: IObserver) => void): IObservableCounter;
}

/**
 * Interface for an observable up-down counter instrument
 */
export interface IObservableUpDownCounter {
  /**
   * Add a callback for observing values
   * @param callback The callback to add
   * @returns This instrument for chaining
   */
  addCallback(callback: (observer: IObserver) => void): IObservableUpDownCounter;
  
  /**
   * Remove a callback
   * @param callback The callback to remove
   * @returns This instrument for chaining
   */
  removeCallback(callback: (observer: IObserver) => void): IObservableUpDownCounter;
}
```

## Metric Data Interfaces

```typescript
/**
 * Interface for metric data
 */
export interface IMetricData {
  /** The name of the metric */
  name: string;
  /** The description of the metric */
  description: string;
  /** The unit of the metric */
  unit: string;
  /** The type of the metric */
  type: MetricType;
  /** The data points of the metric */
  dataPoints: IMetricDataPoint[];
  /** The aggregation temporality */
  aggregationTemporality: AggregationTemporality;
  /** Whether the metric is monotonic */
  isMonotonic: boolean;
}

/**
 * Interface for a metric data point
 */
export interface IMetricDataPoint {
  /** The value of the data point */
  value: number | IHistogramValue;
  /** The attributes of the data point */
  attributes: Record<string, any>;
  /** The start time of the data point */
  startTime: HrTime;
  /** The end time of the data point */
  endTime: HrTime;
}

/**
 * Interface for histogram value
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
  /** The bucket counts */
  buckets: number[];
  /** The bucket boundaries */
  boundaries: number[];
}

/**
 * Metric types
 */
export const enum eMetricType {
  COUNTER,
  UP_DOWN_COUNTER,
  HISTOGRAM,
  GAUGE
}

/**
 * Metric type without e-prefix
 */
export type MetricType = eMetricType;
```

## Metric Provider Implementation with Closures

```typescript
/**
 * Create a new Meter Provider
 * @param config Configuration for the Meter Provider
 * @param contextManager The context manager to use
 * @returns A new Meter Provider instance
 */
export function createMeterProvider(config: IMeterConfig = {}, contextManager: IContextManager): IMeterProvider {
  // Private closure variables
  let _meters: Map<string, IMeter> = new Map();
  let _config = config || {};
  let _contextManager = contextManager;
  let _maxBatchSize = _config.maxBatchSize ?? 512;
  let _maxBatchWaitTimeMs = _config.maxBatchWaitTimeMs ?? 5000;
  let _defaultTemporality = _config.defaultAggregationTemporality ?? AggregationTemporality.CUMULATIVE;
  let _defaultAttributes = _config.defaultAttributes || {};
  let _metricProcessor = createBatchMetricProcessor({
    maxBatchSize: _maxBatchSize,
    maxBatchWaitTimeMs: _maxBatchWaitTimeMs
  });
  
  // Create the instance with a class
  class MeterProviderImpl implements _IMeterProviderInternal {
    constructor() {
      // Define methods using DynamicProto
      dynamicProto(MeterProviderImpl, this, (_self: _IMeterProviderInternal) => {
        // Get a meter
        _self.getMeter = (name: string, version?: string, options?: IMeterOptions): IMeter => {
          const key = `${name}@${version || ''}`;
          
          if (!_meters.has(key)) {
            _meters.set(key, createMeter(name, version, options, _self, _contextManager));
          }
          
          return _meters.get(key)!;
        };
        
        // Process metric data
        _self._processMetricData = (metric: IMetricData): void => {
          _metricProcessor.onEmit(metric);
        };
        
        // Force flush
        _self._forceFlush = (): Promise<void> => {
          return _metricProcessor.forceFlush();
        };
        
        // Get aggregation temporality
        _self._getAggregationTemporality = (): AggregationTemporality => {
          return _defaultTemporality;
        };
      });
    }

    // Interface methods that will be replaced by dynamicProto
    getMeter(name: string, version?: string, options?: IMeterOptions): IMeter {
      return {} as IMeter; // Placeholder implementation
    }
    _processMetricData(metric: IMetricData): void {}
    _forceFlush(): Promise<void> {
      return Promise.resolve();
    }
    _getAggregationTemporality(): AggregationTemporality {
      return _defaultTemporality;
    }
  }
  
  return new MeterProviderImpl();
}
```

## Meter Implementation with Closures

```typescript
/**
 * Create a new Meter
 * @param name The name of the meter
 * @param version The version of the meter
 * @param options Options for the meter
 * @param meterProvider The meter provider to use
 * @param contextManager The context manager to use
 * @returns A new Meter instance
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
  let _observableCallbacks: Map<string, Set<(observer: IObserver) => void>> = new Map();
  
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
    
    // Create an up-down counter
    self.createUpDownCounter = (name: string, options?: ICounterOptions): IUpDownCounter => {
      const key = `up-down-counter:${name}`;
      if (!_instruments.has(key)) {
        _instruments.set(key, createUpDownCounter(name, options, _meterProvider));
      }
      
      return _instruments.get(key) as IUpDownCounter;
    };
    
    // Create an observable gauge
    self.createObservableGauge = (name: string, options?: IObservableOptions): IObservableGauge => {
      const key = `observable-gauge:${name}`;
      if (!_instruments.has(key)) {
        _instruments.set(key, createObservableGauge(name, options, _meterProvider, _observableCallbacks));
      }
      
      return _instruments.get(key) as IObservableGauge;
    };
    
    // Create an observable counter
    self.createObservableCounter = (name: string, options?: IObservableOptions): IObservableCounter => {
      const key = `observable-counter:${name}`;
      if (!_instruments.has(key)) {
        _instruments.set(key, createObservableCounter(name, options, _meterProvider, _observableCallbacks));
      }
      
      return _instruments.get(key) as IObservableCounter;
    };
    
    // Create an observable up-down counter
    self.createObservableUpDownCounter = (name: string, options?: IObservableOptions): IObservableUpDownCounter => {
      const key = `observable-up-down-counter:${name}`;
      if (!_instruments.has(key)) {
        _instruments.set(key, createObservableUpDownCounter(name, options, _meterProvider, _observableCallbacks));
      }
      
      return _instruments.get(key) as IObservableUpDownCounter;
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
    
    self._collectAllMetrics = (): Promise<IMetricData[]> => {
      const metricDataPromises: Promise<IMetricData[]>[] = [];
      
      // Collect from all observable instruments
      _observableCallbacks.forEach((callbacks, instrumentKey) => {
        const [type, name] = instrumentKey.split(':', 2);
        const observer = createObserver(name, type as any, _meterProvider);
        
        callbacks.forEach(callback => {
          try {
            callback(observer);
          } catch (e) {
            console.error(`Error collecting metrics for ${name}`, e);
          }
        });
        
        metricDataPromises.push(observer._collect());
      });
      
      // Return all collected metrics
      return Promise.all(metricDataPromises)
        .then(results => results.flat());
    };
  });
  
  return _self;
}
```

## Metric Instruments Implementation with Closures

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
  let _monotonic = _options.monotonic !== false;
  let _meterProvider = meterProvider;
  let _values: Map<string, number> = new Map();
  
  // Create the instance
  let _self = {} as ICounter;
  
  // Define methods using DynamicProto
  dynamicProto({} as any, _self, (self: ICounter) => {
    // Add a value
    self.add = (value: number, attributes: Record<string, any> = {}): void => {
      if (value < 0 && _monotonic) {
        console.error(`Attempted to add a negative value to a monotonic counter: ${_name}`);
        return;
      }
      
      const key = _getAttributeKey(attributes);
      const currentValue = _values.get(key) || 0;
      _values.set(key, currentValue + value);
      
      // Create metric data
      const metricData = _createMetricData(attributes, currentValue + value);
      
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
    const now = hrTime();
    const startTime = [0, 0] as HrTime; // For cumulative, start time is 0
    
    return {
      name: _name,
      description: _description,
      unit: _unit,
      type: MetricType.COUNTER,
      dataPoints: [
        {
          value,
          attributes: { ..._attributes, ...attributes },
          startTime,
          endTime: now
        }
      ],
      aggregationTemporality: _meterProvider._getAggregationTemporality(),
      isMonotonic: _monotonic
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
    const now = hrTime();
    const startTime = [0, 0] as HrTime; // For cumulative, start time is 0
    
    return {
      name: _name,
      description: _description,
      unit: _unit,
      type: MetricType.HISTOGRAM,
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
          startTime,
          endTime: now
        }
      ],
      aggregationTemporality: _meterProvider._getAggregationTemporality(),
      isMonotonic: false
    };
  }
  
  return _self;
}
```

## Observable Instruments Implementation

```typescript
/**
 * Create an observer
 * @param name The name of the instrument
 * @param type The type of the instrument
 * @param meterProvider The meter provider to use
 * @returns A new observer instance
 */
export function createObserver(
  name: string,
  type: MetricType,
  meterProvider: _IMeterProviderInternal
): IObserver & { _collect(): Promise<IMetricData[]> } {
  // Private closure variables
  let _name = name;
  let _type = type;
  let _meterProvider = meterProvider;
  let _observations: Map<string, { value: number, attributes: Record<string, any> }> = new Map();
  
  // Create the instance
  let _self = {} as IObserver & { _collect(): Promise<IMetricData[]> };
  
  // Define methods using DynamicProto
  dynamicProto({} as any, _self, (self: IObserver & { _collect(): Promise<IMetricData[]> }) => {
    // Observe a value
    self.observe = (value: number, attributes: Record<string, any> = {}): void => {
      const key = _getAttributeKey(attributes);
      _observations.set(key, { value, attributes });
    };
    
    // Collect all observations
    self._collect = (): Promise<IMetricData[]> => {
      if (_observations.size === 0) {
        return Promise.resolve([]);
      }
      
      const now = hrTime();
      const startTime = [0, 0] as HrTime; // For cumulative, start time is 0
      
      const dataPoints = Array.from(_observations.values()).map(observation => ({
        value: observation.value,
        attributes: observation.attributes,
        startTime,
        endTime: now
      }));
      
      const metricData = {
        name: _name,
        description: '',  // Would come from the instrument
        unit: '',  // Would come from the instrument
        type: _type,
        dataPoints,
        aggregationTemporality: _meterProvider._getAggregationTemporality(),
        isMonotonic: _type === MetricType.COUNTER
      };
      
      return Promise.resolve([metricData]);
    };
  });
  
  /**
   * Get a key for attributes
   * @param attributes The attributes to get a key for
   * @returns A string key
   */
  function _getAttributeKey(attributes: Record<string, any>): string {
    const keys = Object.keys(attributes).sort();
    
    return keys.map(key => `${key}:${attributes[key]}`).join(',');
  }
  
  return _self;
}

/**
 * Create an observable gauge instrument
 * @param name The name of the gauge
 * @param options Options for the gauge
 * @param meterProvider The meter provider to use
 * @param callbacksMap Map of callbacks by instrument
 * @returns A new observable gauge instance
 */
export function createObservableGauge(
  name: string,
  options: IObservableOptions = {},
  meterProvider: _IMeterProviderInternal,
  callbacksMap: Map<string, Set<(observer: IObserver) => void>>
): IObservableGauge {
  // Private closure variables
  let _name = name;
  let _options = options;
  let _meterProvider = meterProvider;
  let _callbacksMap = callbacksMap;
  let _key = `observable-gauge:${name}`;
  
  // Initialize callbacks set
  if (!_callbacksMap.has(_key)) {
    _callbacksMap.set(_key, new Set());
  }
  const _callbacks = _callbacksMap.get(_key)!;
  
  // Add initial callback if provided
  if (_options.callback) {
    _callbacks.add(_options.callback);
  }
  
  // Create the instance
  let _self = {} as IObservableGauge;
  
  // Define methods using DynamicProto
  dynamicProto({} as any, _self, (self: IObservableGauge) => {
    // Add a callback
    self.addCallback = (callback: (observer: IObserver) => void): IObservableGauge => {
      _callbacks.add(callback);
      return self;
    };
    
    // Remove a callback
    self.removeCallback = (callback: (observer: IObserver) => void): IObservableGauge => {
      _callbacks.delete(callback);
      return self;
    };
  });
  
  return _self;
}

// Similar implementations would exist for createObservableCounter and createObservableUpDownCounter
```

## Usage Example

```typescript
import { createOTelClientSdk } from "@microsoft/otel-web-sdk";

// Create a new SDK instance
const sdk = createOTelClientSdk({
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
const meter = sdk.meter.getMeter("my-component", "1.0.0");

// Create a counter
const requestCounter = meter.createCounter("http.requests", {
  description: "Number of HTTP requests",
  unit: "requests"
});

// Create a histogram
const responseTimeHistogram = meter.createHistogram("http.response_time", {
  description: "HTTP response times",
  unit: "ms",
  boundaries: [0, 10, 50, 100, 500, 1000]
});

// Create an observable gauge
let activeRequests = 0;
const activeRequestsGauge = meter.createObservableGauge("http.active_requests", {
  description: "Number of active HTTP requests",
  unit: "requests",
  callback: (observer) => {
    observer.observe(activeRequests);
  }
});

// Record metrics in application code
function handleRequest(request: any) {
  activeRequests++;
  const startTime = performance.now();
  
  // Record the request
  requestCounter.add(1, {
    "http.method": request.method,
    "http.route": request.route
  });
  
  try {
    // Process the request...
    return response;
  } finally {
    activeRequests--;
    const duration = performance.now() - startTime;
    
    // Record the response time
    responseTimeHistogram.record(duration, {
      "http.method": request.method,
      "http.route": request.route,
      "http.status_code": response.statusCode
    });
  }
}

// Shutdown the SDK when done
window.addEventListener("unload", () => {
  sdk.shutdown().catch(console.error);
});
```

## Next Steps

For detailed implementation of other components, refer to the following documents:

- [OTelClientSdk-Trace.md](./OTelClientSdk-Trace.md)
- [OTelClientSdk-Log.md](./OTelClientSdk-Log.md)
- [OTelClientSdk-Context.md](./OTelClientSdk-Context.md)
