# OpenTelemetry Client SDK Core Implementation

This document describes the core implementation of the OpenTelemetry Client SDK using closures and DynamicProto-JS.

## Core SDK Interfaces

```typescript
/**
 * Public interface for the OpenTelemetry Client SDK configuration
 */
export interface IOTelClientSdkConfig extends Record<string, any> {
  /** Configuration for the trace provider */
  traceConfig?: Record<string, any>;
  /** Configuration for the log provider */
  logConfig?: Record<string, any>;
  /** Configuration for the meter provider */
  meterConfig?: Record<string, any>;
  /** Configuration for the context manager */
  contextConfig?: Record<string, any>;
  /** List of exporters to use */
  exporters?: IExporter[];
  /** List of error handlers */
  errorHandlers?: IErrorHandler[];
  /** List of instrumentations to register */
  instrumentations?: IInstrumentation[];
}

/**
 * Public interface for the OpenTelemetry Client SDK
 */
export interface IOTelClientSdk {
  /** Access to the trace functionality */
  readonly trace: ITraceProvider;
  /** Access to the logging functionality */
  readonly log: ILogProvider;
  /** Access to the metrics functionality */
  readonly meter: IMeterProvider;
  /** Access to the context management functionality */
  readonly context: IContextManager;
  /** Access to the instrumentation manager */
  readonly instrumentationManager: IInstrumentationManager;
  /** Access to the configuration */
  readonly config: IConfiguration;
  
  /** Initialize the SDK and all its components */
  initialize(): void;
  /** Shut down the SDK and flush any pending telemetry */
  shutdown(): Promise<void>;  /** Register an instrumentation to the SDK */
  registerInstrumentation(instrumentation: IInstrumentation): IOTelClientSdk;
  /** Unregister an instrumentation from the SDK */
  unregisterInstrumentation(instrumentation: IInstrumentation): IOTelClientSdk;
}

/**
 * @internal
 * Internal interface for the OpenTelemetry Client SDK
 */
export interface _IOTelClientSdkInternal extends IOTelClientSdk {
  _getExporters(): IExporter[];
  _getErrorHandlers(): IErrorHandler[];
}
```

## Core SDK Factory Function with Closure Pattern

```typescript
/**
 * Create a new instance of the OpenTelemetry Client SDK
 * @param config - Configuration for the SDK
 * @returns An initialized SDK instance
 */
export function createOTelClientSdk(config: IOTelClientSdkConfig = {}): IOTelClientSdk {
  // Private closure variables
  let _initialized = false;
  
  // Create dynamic config using the AppInsights Core
  const _configHandler = createDynamicConfig(config || {});
  const _config = _configHandler.cfg;
  
  let _exporters: IExporter[] = _config.exporters || [];
  let _errorHandlers: IErrorHandler[] = _config.errorHandlers || [];
  
  // Create instrumentation manager
  const _instrumentationManager = createInstrumentationManager();
  
  // Setup core components with the dynamic config
  const _contextManager = createContextManager(_config);
  const _traceProvider = createTraceProvider(_config, _contextManager);
  const _logProvider = createLogProvider(_config, _contextManager);
  const _meterProvider = createMeterProvider(_config, _contextManager);
    
  // Create the instance with direct method implementations
  const _self: _IOTelClientSdkInternal = {
    // Properties with getters
    get trace() { return _traceProvider; },
    get log() { return _logProvider; },
    get meter() { return _meterProvider; },
    get context() { return _contextManager; },
    get instrumentationManager() { return _instrumentationManager; },
    get config() { return _config; }, // Return the dynamic config object
    
    // Initialize the SDK
    initialize() {
      if (!_initialized) {
        _initialized = true;
        
        // Initialize all components
        _exporters.forEach(exporter => {
          try {
            exporter.initialize();
          } catch (e) {
            _handleError(e, "Failed to initialize exporter");
          }
        });
        
        // Initialize all instrumentations
        _instrumentationManager.enableAllInstrumentations();
      }
    },
    
    // Shutdown the SDK
    shutdown() {
      if (_initialized) {
        _initialized = false;
        
        // Disable all instrumentations
        _instrumentationManager.disableAllInstrumentations();
        
        // Create a promise that resolves when all exporters are shut down
        return Promise.all(_exporters.map(exporter => {
          try {
            return exporter.shutdown();
          } catch (e) {
            _handleError(e, "Failed to shut down exporter");
            return Promise.resolve();
          }
        }));
      }
      
      return Promise.resolve();
    },
    
    // Register instrumentation
    registerInstrumentation(instrumentation: IInstrumentation) {
      _instrumentationManager.registerInstrumentation(instrumentation);
      
      // If already initialized, enable the instrumentation immediately
      if (_initialized) {
        instrumentation.enable();
      }
      
      return this;
    },
    
    // Unregister instrumentation
    unregisterInstrumentation(instrumentation: IInstrumentation) {
      // Disable the instrumentation if needed
      if (_initialized) {
        instrumentation.disable();
      }
      
      _instrumentationManager.unregisterInstrumentation(instrumentation);
      
      return this;
    },
    
    // Internal methods
    _getExporters() {
      return _exporters;
    },
    
    _getErrorHandlers() {
      return _errorHandlers;
    }
  };
  
  /**
   * Helper function to handle errors
   */
  function _handleError(error: Error, message: string) {
    _errorHandlers.forEach(handler => {
      try {
        handler.onError(error, message);
      } catch (e) {
        // Swallow error handler errors
        console.error("Error handler failed", e);
      }
    });
  }
  
  return _self;
}
```

## Error Handler Interface

```typescript
/**
 * Interface for error handlers
 */
export interface IErrorHandler {
  /**
   * Called when an error occurs in the SDK
   * @param error The error that occurred
   * @param message Additional context for the error
   */
  onError(error: Error, message?: string): void;
}
```

## Exporter Interface

```typescript
/**
 * Interface for telemetry exporters
 */
export interface IExporter {
  /**
   * Initialize the exporter
   */
  initialize(): void;
  
  /**
   * Exports a batch of telemetry items
   * @param items The telemetry items to export
   */
  export(items: ITelemetryItem[]): Promise<ExportResult>;
  
  /**
   * Shuts down the exporter
   */
  shutdown(): Promise<void>;
}

/**
 * Result of an export operation
 */
export const enum eExportResult {
  /** Telemetry items were successfully exported */
  SUCCESS = 0,
  /** Telemetry items failed to be exported */
  FAILED = 1,
  /** Exporter is not initialized */
  NOT_INITIALIZED = 2
}

/**
 * Type for export results
 */
export type ExportResult = eExportResult;
```

## Telemetry Item Interface

```typescript
/**
 * Interface for telemetry items
 */
export interface ITelemetryItem {
  /** The name of the telemetry item */
  name: string;
  /** The timestamp of the telemetry item */
  timestamp: number;
  /** The type of telemetry item */
  type: TelemetryType;
  /** The attributes of the telemetry item */
  attributes: Record<string, any>;
  /** The resource attributes of the telemetry item */
  resource?: Record<string, any>;
}

/**
 * Types of telemetry items
 */
export const enum eTelemetryType {
  SPAN = 0,
  LOG = 1,
  METRIC = 2
}

/**
 * Type for telemetry types
 */
export type TelemetryType = eTelemetryType;
```

## Resource Interface

```typescript
/**
 * Interface for a resource
 */
export interface IResource {
  /** The attributes of the resource */
  attributes: Record<string, any>;
  /** Get a specific attribute from the resource */
  getAttribute(key: string): any;
  /** Check if the resource has a specific attribute */
  hasAttribute(key: string): boolean;
  /** Merge with another resource */
  merge(other: IResource): IResource;
}

/**
 * Create a new resource
 * @param attributes The attributes of the resource
 * @returns A new resource instance
 */
export function createResource(attributes: Record<string, any> = {}): IResource {
  // Private closure variables
  const _attributes = { ...attributes };
  
  // Create the instance with direct method implementations
  const _self: IResource = {
    // Properties
    get attributes() { 
      return { ..._attributes }; 
    },
    
    // Get an attribute
    getAttribute(key: string) {
      return _attributes[key];
    },
    
    // Check if resource has an attribute
    hasAttribute(key: string) {
      return key in _attributes;
    },
    
    // Merge with another resource
    merge(other: IResource) {
      return createResource({
        ..._attributes,
        ...other.attributes
      });
    }
  };
  
  return _self;
}
```

## Configuration Management

```typescript
/**
 * Configuration Usage
 * 
 * The SDK uses the DynamicConfig system from ApplicationInsights-Core which provides:
 * - Dynamic configuration values
 * - Configuration change notifications
 * - Type-safe access to configuration properties
 * 
 * The configuration is accessed via the `config` property on the SDK instance.
 */

/**
 * Import the onConfigChange function
 */
import { onConfigChange } from '@microsoft/applicationinsights-core-js';

/**
 * Example of using onConfigChange to monitor configuration changes
 */

// Create SDK instance
const sdk = createOTelClientSdk({
  connectionString: 'InstrumentationKey=your-key-here'
});

// Monitor configuration changes
const configWatcher = onConfigChange(sdk.config, (updatedConfig) => {
  console.log('Configuration updated:', updatedConfig);
  
  // Check for specific settings
  if ('sampling.ratio' in updatedConfig) {
    console.log(`Sampling ratio updated to ${updatedConfig['sampling.ratio']}`);
  }
});

// Update configuration
sdk.config['sampling.ratio'] = 0.5;

// Later, when no longer needed
configWatcher.rm();
```

## Example of how to use onConfigChange

```typescript
// Example implementation showing proper use of onConfigChange

export class HttpClientInstrumentation extends BaseInstrumentation {
  private _originalFetch: typeof fetch;
  private _originalXHR: typeof XMLHttpRequest.prototype.open;
  private _configWatcher: IWatcherHandler;
  private _captureHeaders: boolean = false;
  private _captureBody: boolean = false;
  
  constructor(core: IOTelClientSdkCore) {
    super("http-client", "1.0.0", core.config);
    this._originalFetch = window.fetch;
    this._originalXHR = XMLHttpRequest.prototype.open;
    
    // Set up a config watcher that responds to changes automatically
    // This eliminates the need for manually tracking configuration changes
    this._configWatcher = onConfigChange(core.config, (details) => {
      this._updateSettings(details.cfg);
    });
  }
  
  private _updateSettings(config: IConfiguration): void {
    // Access configuration values directly
    const captureHeaders = config['http.captureHeaders'] || false;
    const captureBody = config['http.captureBody'] || false;
    
    // Update instrumentation behavior based on configuration
    if (captureHeaders) {
      // Enable header capturing
    }
    
    if (captureBody) {
      // Enable body capturing
    }
  }
  
  protected _onEnable(): void {
    // Instrument the fetch API
    // Implementation details...
  }
  
  protected _onDisable(): void {
    // Restore original methods
    window.fetch = this._originalFetch;
    XMLHttpRequest.prototype.open = this._originalXHR;
  }
  
  protected _onUpdate(config: IConfiguration): void {
    // This is still called when update() is explicitly called
    this._updateSettings(config);
  }
  
  public dispose(): void {
    // Clean up the config watcher
    if (this._configWatcher) {
      this._configWatcher.rm();
      this._configWatcher = null;
    }
    
    // Restore original methods if enabled
    if (this.isEnabled()) {
      this.disable();
    }
  }
}
```

## Instrumentation Interfaces

```typescript
/**
 * Interface for instrumentation
 */
export interface IInstrumentation {
  /** The name of the instrumentation */
  readonly name: string;
  /** The version of the instrumentation */
  readonly version: string;
  /** Enable the instrumentation */
  enable(): void;
  /** Disable the instrumentation */
  disable(): void;
  /** Whether the instrumentation is enabled */
  isEnabled(): boolean;  /** Update the instrumentation with new configuration */
  update(config: IConfiguration): void;
}

/**
 * Interface for instrumentation manager
 */
export interface IInstrumentationManager {
  /** Get all registered instrumentations */
  getInstrumentations(): IInstrumentation[];
  /** Register a new instrumentation */
  registerInstrumentation(instrumentation: IInstrumentation): void;
  /** Unregister an instrumentation */
  unregisterInstrumentation(instrumentation: IInstrumentation): void;
  /** Enable all instrumentations */
  enableAllInstrumentations(): void;
  /** Disable all instrumentations */
  disableAllInstrumentations(): void;
  /** Enable a specific instrumentation by name */
  enableInstrumentation(name: string): void;
  /** Disable a specific instrumentation by name */
  disableInstrumentation(name: string): void;
}

/**
 * Base class for instrumentations with DynamicProto support
 */
export abstract class BaseInstrumentation implements IInstrumentation {
  /** The name of the instrumentation */
  public readonly name: string;
  /** The version of the instrumentation */
  public readonly version: string;
  /** Whether the instrumentation is enabled */
  private _enabled: boolean = false;  /** Configuration */
  private _config: IConfiguration;
  
  /**
   * Create a new base instrumentation
   * @param name - The name of the instrumentation
   * @param version - The version of the instrumentation
   * @param config - Configuration for the instrumentation
   */
  constructor(name: string, version: string, config: IConfiguration) {
    this.name = name;
    this.version = version;
    this._config = config;
    
    // Add DynamicProto for proper prototype chain building
    dynamicProto(BaseInstrumentation, this, (_self) => {
      _self.enable = () => {
        if (!this._enabled) {
          this._enabled = true;
          this._onEnable();
        }
      };
      
      _self.disable = () => {
        if (this._enabled) {
          this._enabled = false;
          this._onDisable();
        }
      };
      
      _self.isEnabled = () => {
        return this._enabled;
      };
        _self.update = (newConfig: IConfiguration) => {
        this._config = newConfig;
        this._onUpdate(newConfig);
      };
    });
  }
  
  /**
   * Called when the instrumentation is enabled
   * @protected
   */
  protected abstract _onEnable(): void;
  
  /**
   * Called when the instrumentation is disabled
   * @protected
   */
  protected abstract _onDisable(): void;
  
  /**
   * Called when the instrumentation is updated with new configuration
   * @param config - The new configuration
   * @protected
   */
  protected abstract _onUpdate(config: IConfiguration): void;
}

// Example of how to use onConfigChange
const myConfigHandler = sdk.config.onConfigChange((updatedConfig) => {
  // React to all configuration changes
  console.log('Configuration changed:', updatedConfig);
  
  // Check for specific settings
  if ('sampling.ratio' in updatedConfig) {
    console.log(`Sampling ratio updated to: ${updatedConfig['sampling.ratio']}`);
  }
});

// Later, when no longer needed
myConfigHandler.rm();

/**
 * Create a new instrumentation manager
 * @returns A new instrumentation manager instance
 */
export function createInstrumentationManager(): IInstrumentationManager {
  // Private closure variables
  const _instrumentations: IInstrumentation[] = [];
  
  // Create the instance with direct method implementations
  const _self: IInstrumentationManager = {
    // Get all registered instrumentations
    getInstrumentations() {
      return [..._instrumentations];
    },
    
    // Register a new instrumentation
    registerInstrumentation(instrumentation: IInstrumentation) {
      // Check if the instrumentation already exists
      if (!_instrumentations.some(i => i.name === instrumentation.name)) {
        _instrumentations.push(instrumentation);
      }
    },
    
    // Unregister an instrumentation
    unregisterInstrumentation(instrumentation: IInstrumentation) {
      const index = _instrumentations.findIndex(i => i.name === instrumentation.name);
      if (index !== -1) {
        _instrumentations.splice(index, 1);
      }
    },
    
    // Enable all instrumentations
    enableAllInstrumentations() {
      _instrumentations.forEach(instrumentation => {
        try {
          instrumentation.enable();
        } catch (e) {
          console.error(`Failed to enable instrumentation: ${instrumentation.name}`, e);
        }
      });
    },
    
    // Disable all instrumentations
    disableAllInstrumentations() {
      _instrumentations.forEach(instrumentation => {
        try {
          instrumentation.disable();
        } catch (e) {
          console.error(`Failed to disable instrumentation: ${instrumentation.name}`, e);
        }
      });
    },
    
    // Enable a specific instrumentation by name
    enableInstrumentation(name: string) {
      const instrumentation = _instrumentations.find(i => i.name === name);
      if (instrumentation) {
        instrumentation.enable();
      }
    },
    
    // Disable a specific instrumentation by name
    disableInstrumentation(name: string) {
      const instrumentation = _instrumentations.find(i => i.name === name);
      if (instrumentation) {
        instrumentation.disable();
      }
    }
  };
  
  return _self;
}
```

## Usage Example

```typescript
import { 
  createOTelClientSdk, 
  BaseInstrumentation,
  IConfiguration,
  onConfigChange
} from "@microsoft/otel-client-sdk";

// Create a new SDK instance with configuration
const sdk = createOTelClientSdk({
  traceConfig: {
    samplingRatio: 0.5
  },
  logConfig: {
    logLevel: "info"
  }
});

// Create a custom instrumentation
class HttpInstrumentation extends BaseInstrumentation {
  private _originalFetch: typeof fetch;
  private _originalXHR: typeof XMLHttpRequest.prototype.open;
  
  constructor(config: IConfiguration) {
    super("http", "1.0.0", config);
    this._originalFetch = window.fetch;
    this._originalXHR = XMLHttpRequest.prototype.open;
  }
  
  protected _onEnable(): void {
    // Instrument fetch API
    window.fetch = (input, init) => {
      const tracer = sdk.trace.getTracer("http-instrumentation", "1.0.0");
      const span = tracer.startSpan(`HTTP ${init?.method || 'GET'}`, {
        attributes: {
          'http.url': typeof input === 'string' ? input : input.url,
          'http.method': init?.method || 'GET'
        }
      });
      
      return this._originalFetch.call(window, input, init)
        .then(response => {
          span.setAttribute('http.status_code', response.status);
          span.end();
          return response;
        })
        .catch(error => {
          span.setStatus({ code: 2, message: error.message });
          span.end();
          throw error;
        });
    };
    
    // Instrument XHR
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      const tracer = sdk.trace.getTracer("http-instrumentation", "1.0.0");
      const span = tracer.startSpan(`HTTP ${method}`, {
        attributes: {
          'http.url': url.toString(),
          'http.method': method
        }
      });
      
      this.addEventListener('load', () => {
        span.setAttribute('http.status_code', this.status);
        span.end();
      });
      
      this.addEventListener('error', (error) => {
        span.setStatus({ code: 2, message: 'XMLHttpRequest error' });
        span.end();
      });
      
      return this._originalXHR.apply(this, [method, url, ...args]);
    };
  }
  
  protected _onDisable(): void {
    // Restore original methods
    window.fetch = this._originalFetch;
    XMLHttpRequest.prototype.open = this._originalXHR;
  }
    protected _onUpdate(config: IConfiguration): void {
    // React to configuration changes
    const captureHeaders = config['http.captureHeaders'] || false;
    
    if (captureHeaders) {
      // Enhance instrumentation to capture headers
      console.log('HTTP instrumentation now capturing headers');
    } else {
      // Stop capturing headers
      console.log('HTTP instrumentation no longer capturing headers');
    }
  }
}

// Example of how to use onConfigChange
const myConfigHandler = sdk.config.onConfigChange((updatedConfig) => {
  // React to all configuration changes
  console.log('Configuration changed:', updatedConfig);
  
  // Check for specific settings
  if ('sampling.ratio' in updatedConfig) {
    console.log(`Sampling ratio updated to: ${updatedConfig['sampling.ratio']}`);
  }
});

// Later, when no longer needed
myConfigHandler.rm();

// Register the custom instrumentation with the SDK
const httpInstrumentation = new HttpInstrumentation(sdk.config);
sdk.registerInstrumentation(httpInstrumentation);

// Initialize the SDK (this will also enable all instrumentations)
sdk.initialize();

// Use the trace provider to create a tracer
const tracer = sdk.trace.getTracer("my-component", "1.0.0");

// Create and end a span
const span = tracer.startSpan("my-operation");
// Do some work...
span.end();

// Dynamically update configuration at runtime
sdk.config.setConfig('http.captureHeaders', true);

// Disable a specific instrumentation
sdk.instrumentationManager.disableInstrumentation("http");

// Enable it again later
sdk.instrumentationManager.enableInstrumentation("http");

// Shutdown the SDK when done
window.addEventListener("unload", () => {
  sdk.shutdown().catch(console.error);
});
```

## Next Steps

For detailed implementation of individual components, refer to the following documents:

- [OTelClientSdk-Trace.md](./OTelClientSdk-Trace.md)
- [OTelClientSdk-Log.md](./OTelClientSdk-Log.md)
- [OTelClientSdk-Metric.md](./OTelClientSdk-Metric.md)
- [OTelClientSdk-Context.md](./OTelClientSdk-Context.md)
