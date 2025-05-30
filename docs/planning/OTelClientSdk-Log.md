# OpenTelemetry Web SDK Log Implementation

This document describes the log implementation of the OpenTelemetry Web SDK using closures and DynamicProto-JS.

## Log Provider Interfaces

```typescript
/**
 * Public interface for the Log Provider configuration
 */
export interface ILogConfig {
  /** Minimum log level to send */
  logLevel?: LogLevel;
  /** Maximum number of logs to batch before sending */
  maxBatchSize?: number;
  /** Maximum batch wait time in milliseconds */
  maxBatchWaitTimeMs?: number;
  /** Maximum log attributes */
  maxLogAttributes?: number;
  /** Custom attributes to add to all logs */
  defaultAttributes?: Record<string, any>;
}

/**
 * Log levels
 */
export const enum eLogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5,
  NONE = 6
}

/**
 * Log level type without e-prefix
 */
export type LogLevel = eLogLevel;

/**
 * Severity number for log records
 */
export const enum eSeverityNumber {
  UNSPECIFIED = 0,
  TRACE = 1,
  DEBUG = 2,
  INFO = 3,
  WARN = 4,
  ERROR = 5,
  FATAL = 6
}

/**
 * Severity number type without e-prefix
 */
export type SeverityNumber = eSeverityNumber;

/**
 * Public interface for the Log Provider
 */
export interface ILogProvider {
  /**
   * Returns a logger instance for the given name and options
   * @param name The name of the logger (usually the component name)
   * @param options Optional logger configuration options
   * @returns A logger instance
   */
  getLogger(name: string, options?: ILoggerOptions): ILogger;
}

/**
 * @internal
 * Internal interface for the Log Provider
 */
export interface _ILogProviderInternal extends ILogProvider {
  _processLogData(log: ILogRecord): void;
  _forceFlush(): Promise<void>;
  _getLogLevel(): LogLevel;
}

/**
 * Interface for logger options
 */
export interface ILoggerOptions {
  /** Schema URL for the logger */
  schemaUrl?: string;
  /** Custom attributes for the logger */
  attributes?: Record<string, any>;
  /** Minimum log level for this logger */
  logLevel?: LogLevel;
}
```

## Logger Interface

```typescript
/**
 * Interface for a logger instance
 */
export interface ILogger {
  /**
   * Log a message at TRACE level
   * @param message The message to log
   * @param context Optional context with attributes
   */
  trace(message: string, context?: ILogContext): void;
  
  /**
   * Log a message at DEBUG level
   * @param message The message to log
   * @param context Optional context with attributes
   */
  debug(message: string, context?: ILogContext): void;
  
  /**
   * Log a message at INFO level
   * @param message The message to log
   * @param context Optional context with attributes
   */
  info(message: string, context?: ILogContext): void;
  
  /**
   * Log a message at WARN level
   * @param message The message to log
   * @param context Optional context with attributes
   */
  warn(message: string, context?: ILogContext): void;
  
  /**
   * Log a message at ERROR level
   * @param message The message to log
   * @param context Optional context with attributes
   */
  error(message: string, context?: ILogContext): void;
  
  /**
   * Log a message at FATAL level
   * @param message The message to log
   * @param context Optional context with attributes
   */
  fatal(message: string, context?: ILogContext): void;
  
  /**
   * Log a message at a specified level
   * @param level The log level
   * @param message The message to log
   * @param context Optional context with attributes
   */
  log(level: LogLevel, message: string, context?: ILogContext): void;
}

/**
 * @internal
 * Internal interface for the Logger
 */
export interface _ILoggerInternal extends ILogger {
  _getName(): string;
  _getAttributes(): Record<string, any>;
}

/**
 * Interface for log context
 */
export interface ILogContext {
  /** Additional attributes for the log */
  attributes?: Record<string, any>;
  /** Exception to include with the log */
  exception?: Error;
  /** Resource information */
  resource?: IResource;
}
```

## Log Record Interface

```typescript
/**
 * Interface for a log record
 */
export interface ILogRecord {
  /** The timestamp of the log */
  timestamp: HrTime;
  /** The log level */
  level: LogLevel;
  /** The log message */
  message: string;
  /** The attributes of the log */
  attributes: Record<string, any>;
  /** The resource associated with the log */
  resource?: IResource;
  /** The exception associated with the log */
  exception?: ILogException;
  /** The name of the logger that created this log */
  logger: string;
}

/**
 * @internal
 * Internal interface for a log record
 */
export interface _ILogRecordInternal extends ILogRecord {
  _getFormattedMessage(): string;
  _getSeverityText(): string;
}

/**
 * Interface for a log exception
 */
export interface ILogException {
  /** The exception type */
  type: string;
  /** The exception message */
  message: string;
  /** The exception stack trace */
  stacktrace?: string;
}
```

## Log Provider Implementation with Closures

```typescript
/**
 * Create a new Log Provider
 * @param config Configuration for the Log Provider
 * @param contextManager The context manager to use
 * @returns A new Log Provider instance
 */
export function createLogProvider(config: ILogConfig = {}, contextManager: IContextManager): ILogProvider {
  // Private closure variables
  let _loggers: Map<string, ILogger> = new Map();
  let _config = config || {};
  let _contextManager = contextManager;
  let _logLevel = _config.logLevel ?? LogLevel.INFO;
  let _maxBatchSize = _config.maxBatchSize ?? 512;
  let _maxBatchWaitTimeMs = _config.maxBatchWaitTimeMs ?? 5000;
  let _maxLogAttributes = _config.maxLogAttributes ?? 32;
  let _defaultAttributes = _config.defaultAttributes || {};
  let _logProcessor = createBatchLogProcessor({
    maxBatchSize: _maxBatchSize,
    maxBatchWaitTimeMs: _maxBatchWaitTimeMs
  });
  
  // Create the instance
  let _self = {} as _ILogProviderInternal;
  
  // Define methods using DynamicProto
  dynamicProto({} as any, _self, (self: _ILogProviderInternal) => {
    // Get a logger
    self.getLogger = (name: string, options?: ILoggerOptions): ILogger => {
      if (!_loggers.has(name)) {
        _loggers.set(name, createLogger(name, options, _self, _contextManager));
      }
      
      return _loggers.get(name)!;
    };
    
    // Process a log record
    self._processLogData = (log: ILogRecord): void => {
      _logProcessor.onEmit(log);
    };
    
    // Force flush any pending logs
    self._forceFlush = (): Promise<void> => {
      return _logProcessor.forceFlush();
    };
    
    // Get the current log level
    self._getLogLevel = (): LogLevel => {
      return _logLevel;
    };
  });
  
  return _self;
}
```

## Logger Implementation with Closures

```typescript
/**
 * Create a new Logger
 * @param name The name of the logger
 * @param options Options for the logger
 * @param logProvider The log provider to use
 * @param contextManager The context manager to use
 * @returns A new Logger instance
 */
export function createLogger(
  name: string,
  options: ILoggerOptions | undefined,
  logProvider: _ILogProviderInternal,
  contextManager: IContextManager
): ILogger {
  // Private closure variables
  let _name = name;
  let _options = options || {};
  let _attributes = _options.attributes || {};
  let _logProvider = logProvider;
  let _contextManager = contextManager;
  let _logLevel = _options.logLevel ?? _logProvider._getLogLevel();
  
  // Create the instance with a class
  class LoggerImpl implements _ILoggerInternal {
    constructor() {
      // Define methods using DynamicProto
      dynamicProto(LoggerImpl, this, (_self: _ILoggerInternal) => {
        // Log helper function
        function _logHelper(level: LogLevel, message: string, context?: ILogContext): void {
          if (level < _logLevel) {
            return;
          }
          
          const ctx = context || {};
          const timestamp = hrTime();
          const exception = ctx.exception ? {
            type: ctx.exception.name,
            message: ctx.exception.message,
            stacktrace: ctx.exception.stack
          } : undefined;
          
          const log: ILogRecord = {
            timestamp,
            level,
            message,
            attributes: {
              ..._attributes,
              ...ctx.attributes
            },
            resource: ctx.resource,
            exception,
            logger: _name
          };
          
          _logProvider._processLogData(log);
        }
        
        // Level-specific logging methods
        _self.trace = (message: string, context?: ILogContext): void => {
          _logHelper(LogLevel.TRACE, message, context);
        };
        
        _self.debug = (message: string, context?: ILogContext): void => {
          _logHelper(LogLevel.DEBUG, message, context);
        };
        
        _self.info = (message: string, context?: ILogContext): void => {
          _logHelper(LogLevel.INFO, message, context);
        };
        
        _self.warn = (message: string, context?: ILogContext): void => {
          _logHelper(LogLevel.WARN, message, context);
        };
        
        _self.error = (message: string, context?: ILogContext): void => {
          _logHelper(LogLevel.ERROR, message, context);
        };
        
        _self.fatal = (message: string, context?: ILogContext): void => {
          _logHelper(LogLevel.FATAL, message, context);
        };
        
        // Generic log method
        _self.log = (level: LogLevel, message: string, context?: ILogContext): void => {
          _logHelper(level, message, context);
        };
        
        // Internal methods
        _self._getName = (): string => {
          return _name;
        };
        
        _self._getAttributes = (): Record<string, any> => {
          return { ..._attributes };
        };
      });
    }

    // Interface methods that will be replaced by dynamicProto
    trace(message: string, context?: ILogContext): void {}
    debug(message: string, context?: ILogContext): void {}
    info(message: string, context?: ILogContext): void {}
    warn(message: string, context?: ILogContext): void {}
    error(message: string, context?: ILogContext): void {}
    fatal(message: string, context?: ILogContext): void {}
    log(level: LogLevel, message: string, context?: ILogContext): void {}
    _getName(): string { return _name; }
    _getAttributes(): Record<string, any> { return _attributes; }
  }
  
  return new LoggerImpl();
}
```

## Log Processor Implementation

```typescript
/**
 * Interface for log processor options
 */
export interface IBatchLogProcessorOptions {
  /** Maximum number of logs to batch before sending */
  maxBatchSize: number;
  /** Maximum batch wait time in milliseconds */
  maxBatchWaitTimeMs: number;
}

/**
 * Interface for a log processor
 */
export interface ILogProcessor {
  /**
   * Process a log record
   * @param log The log record to process
   */
  onEmit(log: ILogRecord): void;
  
  /**
   * Force flush any pending logs
   * @returns A promise that resolves when the flush is complete
   */
  forceFlush(): Promise<void>;
  
  /**
   * Shut down the processor
   * @returns A promise that resolves when the shutdown is complete
   */
  shutdown(): Promise<void>;
}

/**
 * Create a batch log processor
 * @param options Options for the processor
 * @returns A new batch log processor instance
 */
export function createBatchLogProcessor(options: IBatchLogProcessorOptions): ILogProcessor {
  // Private closure variables
  let _options = options;
  let _batch: ILogRecord[] = [];
  let _timer: number | undefined;
  let _shuttingDown = false;
  let _exporter: IExporter | undefined;
  
  // Helper function to export logs
  function _exportLogs(): Promise<void> {
    if (_batch.length === 0 || !_exporter) {
      return Promise.resolve();
    }
    
    const logsToExport = [..._batch];
    _batch = [];
    
    if (_exporter) {
      return _exporter.export(logsToExport.map(logToTelemetry))
        .then(() => {
          // Export complete
        })
        .catch((e) => {
          // Handle export error
          console.error("Failed to export logs", e);
        });
    }
    
    return Promise.resolve();
  }
  
  /**
   * Convert a log record to a telemetry item
   * @param log The log record to convert
   * @returns A telemetry item
   */
  function logToTelemetry(log: ILogRecord): ITelemetryItem {
    return {
      name: "log",
      timestamp: hrTimeToMilliseconds(log.timestamp),
      type: TelemetryType.LOG,
      attributes: {
        level: log.level,
        levelName: LogLevel[log.level],
        message: log.message,
        ...log.attributes
      },
      resource: log.resource?.attributes
    };
  }
  
  // Create the instance
  let _self = {} as ILogProcessor;
  
  // Define methods using DynamicProto
  dynamicProto({} as any, _self, (self: ILogProcessor) => {
    // Process a log
    self.onEmit = (log: ILogRecord): void => {
      if (_shuttingDown) {
        return;
      }
      
      _batch.push(log);
      
      if (_batch.length >= _options.maxBatchSize) {
        // Clear the timer if it exists
        if (_timer !== undefined) {
          clearTimeout(_timer);
          _timer = undefined;
        }
        
        // Export the batch
        _exportLogs();
      } else if (_timer === undefined) {
        // Start a timer to export the batch
        _timer = setTimeout(() => {
          _timer = undefined;
          _exportLogs();
        }, _options.maxBatchWaitTimeMs);
      }
    };
    
    // Force flush
    self.forceFlush = (): Promise<void> => {
      // Clear the timer if it exists
      if (_timer !== undefined) {
        clearTimeout(_timer);
        _timer = undefined;
      }
      
      // Export the batch
      return _exportLogs();
    };
    
    // Shutdown
    self.shutdown = (): Promise<void> => {
      _shuttingDown = true;
      
      // Clear the timer if it exists
      if (_timer !== undefined) {
        clearTimeout(_timer);
        _timer = undefined;
      }
      
      // Export the batch
      return _exportLogs();
    };
  });
  
  return _self;
}
```

## Usage Example

```typescript
import { createOTelClientSdk, LogLevel } from "@microsoft/otel-web-sdk";

// Create a new SDK instance
const sdk = createOTelClientSdk({
  logConfig: {
    logLevel: LogLevel.DEBUG,
    defaultAttributes: {
      'app.version': '1.0.0',
      'app.environment': 'production'
    }
  }
});

// Initialize the SDK
sdk.initialize();

// Get a logger
const logger = sdk.log.getLogger("my-component");

// Log messages at different levels
logger.debug("Debug message");
logger.info("Information message");
logger.warn("Warning message");

// Log with additional context
logger.error("An error occurred", {
  attributes: {
    'error.code': 500,
    'user.id': '12345'
  }
});

// Log with an exception
try {
  throw new Error("Something went wrong");
} catch (e) {
  logger.error("Failed to process request", {
    exception: e,
    attributes: {
      'request.id': '67890'
    }
  });
}

// Shutdown the SDK when done
window.addEventListener("unload", () => {
  sdk.shutdown().catch(console.error);
});
```

## Next Steps

For detailed implementation of other components, refer to the following documents:

- [OTelClientSdk-Metric.md](./OTelClientSdk-Metric.md)
- [OTelClientSdk-Context.md](./OTelClientSdk-Context.md)
