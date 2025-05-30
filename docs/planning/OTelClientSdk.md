# OTelClientSdk Implementation Plan

## 1. Interface-First Design Pattern:
- Added public interfaces with proper I prefix for all components
  - All public components have dedicated interfaces (e.g. `ITraceProvider`, `ILogger`)
  - Public interfaces include comprehensive JSDoc documentation
  - All properties and methods in interfaces have explicit return types
  - Public interfaces are exported in public API
- Applied proper enum naming and usage conventions
  - Defined all enums as const enums with lowercase "e" prefix (e.g. `eLogLevel`)
  - Created corresponding types without the "e" prefix (e.g. `LogLevel`)
  - Exported both enum and type when public
  - Used type names in interfaces rather than enum names
- Added internal interfaces with _I prefix and @internal JSDoc tags
  - Internal interfaces extend public interfaces when appropriate
  - @internal JSDoc tags ensure they're excluded from public API docs
  - Internal interfaces are not exported in public API
  - Internal interfaces provide access to implementation details for internal components
- Changed implementations to use private or internal classes
  - Implementation classes are not exported in public API
  - Implementation classes are hidden behind interfaces
  - All implementation details are encapsulated
- Added factory functions to create instances instead of exposing constructors
  - Factory functions follow the `create*` naming pattern
  - Factory functions return interface types, not implementation types
  - Factory functions handle all initialization complexity
  - Implementation classes are never exposed directly

## 2. Core Components Implementation:
- Created OTelClientSdk class implementing IOTelClientSdk interface
  - Created comprehensive IOTelClientSdk interface with all public methods
  - Encapsulated implementation details in private methods or properties
  - Made implementation inherit from interface
  - Added proper typing for all methods and properties
- Implemented createOTelClientSdk factory function for instance creation
  - Factory function handles configuration validation
  - Factory function sets up all dependencies
  - Factory function initializes plugins and processors
  - Returns interface type rather than implementation class
- Designed provider components with interface-first approach
  - Created ITraceProvider, ILoggerProvider, IMeterProvider interfaces
  - Implemented hidden implementation classes
  - Created factory functions for all providers (createTraceProvider, etc.)
  - Ensured proper typing throughout the API
- Designed ContextManager with interface-first approach
  - Created IContextManager interface
  - Defined IContext interface for context objects
  - Implemented factory functions for context creation
  - Designed propagator interfaces for context propagation

## 3. Detailed Interface Definitions:
- Enhanced configuration interfaces with better JSDoc documentation
  - Added detailed descriptions for all configuration properties
  - Added examples in JSDoc comments
  - Added default values in documentation
  - Improved type definitions for complex configuration objects
- Added more specific interfaces for metric types, span options, etc.
  - Created dedicated interfaces for each metric type (ICounter, IHistogram, etc.)
  - Added specific span option interfaces
  - Created dedicated logger configuration interfaces
  - Added detailed attribute validation interfaces
- Created nested interfaces for configuration options
  - Organized related configuration options into nested interfaces
  - Improved readability and maintainability
  - Added proper typing for all configuration options
  - Ensured backward compatibility with existing configurations
- Implemented proper enum patterns for improved type-safety
  - Example: 
    ```typescript
    // Enum definition with e-prefix
    export const enum eLogLevel {
      Verbose = 0,
      Info = 1,
      Warning = 2,
      Error = 3
    }
    
    // Type definition without e-prefix
    export type LogLevel = eLogLevel;
    
    // Usage in interfaces
    export interface ILoggerOptions {
      level: LogLevel;  // Uses type, not enum
    }
    ```

## 4. Implementation Requirements and Notes:
- Leveraging existing dynamic configuration from AppInsightsCore
  - Using the configuration system from shared/AppInsightsCore/src/Config
  - All configuration settings reactive to changes via notification listeners
  - Support for configuration callbacks through INotificationListener pattern
  - Hierarchical configuration inheritance using AppInsightsCore patterns
  - Example:
    ```typescript    // Using existing AppInsightsCore dynamic configuration
    import { 
      IConfiguration, 
      BaseTelemetryPlugin, 
      IPlugin,
      IAppInsightsCore,
      INotificationListener
    } from "@microsoft/applicationinsights-core-js";
    
    // Example SDK component using AppInsightsCore config
    class TracePlugin extends BaseTelemetryPlugin {
      initialize(config: IConfiguration, core: IAppInsightsCore) {
        // Access dynamic configuration values
        this._config = config;
          // Register for config changes
        const configHandler = core.config.onConfigChange(config => {
          // React to configuration changes
          this._updateSettings(config);
        });
        
        // When no longer needed
        configHandler.rm();
      }
    }
    ```
- Added support for dynamic instrumentation management
  - Dynamic loading and unloading of instrumentations
  - Runtime registration of instrumentation components
  - Proper cleanup on unload to prevent memory leaks
  - Event notifications for instrumentation lifecycle
- Followed proper dynamicProto usage patterns
  - Used dynamicProto ONLY within class implementations
  - Avoided dynamicProto in factory functions to prevent prototype overwrites
  - Used closures and object literals in factory functions instead
  - Ensured proper initialization order and state management
- Added a section on interface-first design benefits
  - Improved type safety and compile-time checking
  - Better encapsulation of implementation details
  - Easier testing through interface mocking
  - Better tree-shaking for reduced bundle size
  - Enhanced IDE support with better IntelliSense
- Included example implementation patterns
  - Demonstrated interface definition
  - Showed hidden implementation class
  - Explained factory function pattern
  - Proper dynamicProto usage example:
    ```typescript
    // Correct usage of dynamicProto within a class
    class TracerImpl implements _ITracerInternal {
      constructor(name: string) {
        this._name = name;
        // Use dynamicProto only inside a class
        dynamicProto(TracerImpl, this, (_self) => {
          _self.startSpan = (name, options) => {
            // Implementation
          };
        });
      }
    }
    
    // Correct factory function without dynamicProto
    export function createTracer(name: string): ITracer {
      // Use closure for private state
      const _name = name;
      const _spans: ISpan[] = [];
      
      // Return object literal implementing interface
      return {
        startSpan: (name, options) => {
          // Implementation
          return createSpan(name, options);
        },
        // Other methods
      };
    }
    ```
  - Provided complete usage examples
- Added notes on maintaining bundle size and type safety
  - Techniques for reducing bundle size with interfaces
  - Best practices for type safety
  - Advanced TypeScript features usage
  - Performance considerations for browser environments

## 5. Usage Examples:
- Created usage examples with factory functions instead of constructors
  - Replaced all `new Class()` calls with `createClass()` factory functions
  - Added proper interface typing for all variables
  - Demonstrated proper error handling
  - Showed shutdown and cleanup procedures
- Ensured examples work with the interface-based approach
  - Verified all examples are compatible with pure interface types
  - Added examples showing interface benefits
  - Demonstrated mocking for testing
  - Provided migration examples from class-based approaches

## 6. Interface Documentation:
- Added comprehensive JSDoc comments to all interfaces
  - Detailed descriptions of each interface's purpose
  - Documentation for all properties and methods
  - Examples showing proper usage
  - Notes on implementation considerations
- Created interface relationship diagrams
  - Visualized interface inheritance hierarchies
  - Showed component relationships
  - Mapped interfaces to OTel specification concepts
  - Demonstrated integration patterns

This implementation plan provides a comprehensive approach to building a modern OpenTelemetry SDK that follows best practices for SDK design:

- Strict interface contracts that ensure type safety
- Hidden implementation details for better encapsulation
- Factory functions for instance creation with simplified APIs
- Clear naming conventions for public vs internal APIs
- Standardized enum definitions with proper type abstractions
- Direct integration with existing AppInsightsCore configuration system
- Support for loading and unloading instrumentations at runtime
- Proper usage of dynamicProto only within class implementations
- Comprehensive documentation for all public interfaces
- Optimized bundle size through better tree-shaking
- Improved testability through interface-based design
