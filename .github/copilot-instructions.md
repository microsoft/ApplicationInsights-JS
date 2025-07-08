# GitHub Copilot Instructions for Application Insights JavaScript SDK

## Project Overview
This is the **Microsoft Application Insights JavaScript SDK** - a browser-based telemetry library for monitoring web applications. The SDK tracks page views, user interactions, performance metrics, exceptions, and custom events.

## Architecture & Structure

### Monorepo Structure
- **AISKU/**: Main Application Insights SDK package
- **AISKULight/**: Lightweight version of the SDK
- **shared/**: Core shared libraries (AppInsightsCore, AppInsightsCommon, 1ds-core-js)
- **extensions/**: Plugin-based extensions (analytics, dependencies, React, Angular, etc.)
- **channels/**: Data transmission channels (online, offline, tee)
- **tools/**: Build and development tools
- **examples/**: Sample implementations

### Key Technologies
- **TypeScript/JavaScript**: Primary languages (ES5 target for browser compatibility)
- **Rush**: Monorepo management tool
- **Rollup**: Module bundler
- **Grunt**: Task runner
- **Dynamic Proto**: Dynamic prototype pattern for performance

## Code Style & Patterns

### TypeScript/JavaScript Conventions
- Use **ES5-compatible** syntax for browser support
- Prefer `function` declarations over arrow functions for better IE compatibility
- Use `var` instead of `let/const` in some contexts for ES5 compatibility
- Always use semicolons
- Use 4-space indentation
- Maximum line length: 140 characters

### Naming Conventions
- **Classes**: PascalCase (e.g., `PageViewManager`, `TelemetryContext`)
- **Interfaces**: PascalCase with `I` prefix (e.g., `ITelemetryItem`, `IPageViewTelemetry`)
- **Methods/Functions**: camelCase (e.g., `trackPageView`, `sendTelemetry`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_DURATION_ALLOWED`)
- **Private variables**: underscore prefix (e.g., `_logger`, `_hasInitialized`)

### Dynamic Proto Pattern
This project uses a unique `dynamicProto` pattern for performance optimization:

```typescript
export class MyClass {
    constructor() {
        dynamicProto(MyClass, this, (_self, _base) => {
            // Instance methods and properties defined here
            _self.myMethod = () => {
                // Method implementation
            };
        });
    }
}
```

### Error Handling
- Use `_throwInternal` for logging diagnostic errors
- Always include telemetry context in error messages
- Use appropriate logging severity levels: `CRITICAL`, `WARNING`, `INFORMATION`

```typescript
_throwInternal(_logger,
    eLoggingSeverity.WARNING,
    _eInternalMessageId.InvalidDurationValue,
    "Invalid page load duration value",
    { total, network, request, response, dom });
```

### Performance Considerations
- Minimize object allocations in hot paths
- Use `doPerf()` wrapper for performance tracking
- Avoid synchronous operations that could block the browser
- Implement lazy initialization where possible
- Use object pooling for frequently created objects

## Browser Compatibility

### Target Support
- **Modern browsers**: Chrome, Firefox, Safari, Edge
- **Legacy support**: Internet Explorer 8+ (ES5 compatibility required)
- **Mobile browsers**: iOS Safari, Android Chrome

### Compatibility Patterns
- Feature detection over browser detection
- Graceful degradation for missing APIs
- Polyfills for missing functionality (when necessary)
- Safe API usage with null checks

```typescript
const perf = getPerformance();
if (perf && perf.timing && perf.timing.navigationStart) {
    // Use performance API
}
```

## Telemetry & Data Collection

### Core Telemetry Types
- **Page Views**: `IPageViewTelemetry` - Track page navigation
- **Events**: `IEventTelemetry` - Custom user actions
- **Metrics**: `IMetricTelemetry` - Numeric measurements
- **Exceptions**: `IExceptionTelemetry` - Error tracking
- **Dependencies**: `IDependencyTelemetry` - External calls
- **Traces**: `ITraceTelemetry` - Logging messages

### Data Privacy & Compliance
- Never collect PII (personally identifiable information) by default
- Sanitize URLs and remove sensitive query parameters
- Implement data sampling and throttling
- Support opt-out mechanisms
- Follow GDPR/privacy regulations

### Performance Monitoring
- Use `IPerfManager` and `IPerfEvent` for internal performance tracking
- Collect browser timing APIs (Navigation Timing, Resource Timing)
- Track page load performance metrics
- Monitor SDK overhead and impact

## Plugin Architecture

### Plugin Development
- Extend `BaseTelemetryPlugin` for new plugins
- Implement `ITelemetryPlugin` interface
- Use `IProcessTelemetryContext` for processing pipeline
- Support plugin chaining and dependencies

```typescript
export class MyPlugin extends BaseTelemetryPlugin {
    public processTelemetry(evt: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        // Process telemetry
        this.processNext(evt, itemCtx);
    }
}
```

### Extension Points
- **Telemetry Initializers**: Modify telemetry before sending
- **Dependency Listeners**: Track AJAX/fetch calls
- **Channels**: Custom data transmission
- **Samplers**: Control telemetry volume

## Testing Patterns

### Unit Testing
- Use framework-agnostic test patterns
- Mock browser APIs consistently
- Test both success and failure scenarios
- Verify telemetry data structure and content

### Browser Testing
- Cross-browser compatibility testing
- Performance regression testing
- Memory leak detection
- Network failure scenarios

### Test Organization
- Collocate tests with source code in `Tests/` directories
- Use descriptive test names
- Group related tests in test suites
- Mock external dependencies

## Configuration & Initialization

### SDK Configuration
- Support both snippet and npm installation
- Provide sensible defaults
- Allow runtime configuration changes
- Validate configuration parameters

```typescript
const config: IConfiguration = {
    instrumentationKey: "your-key",
    enableAutoRouteTracking: true,
    disableTelemetry: false,
    samplingPercentage: 100
};
```

### Initialization Patterns
- Lazy initialization to minimize startup impact
- Graceful handling of initialization failures
- Support for multiple SDK instances
- Plugin dependency resolution

## Performance Guidelines

### Bundle Size Optimization
- Tree-shaking friendly exports
- Conditional feature loading
- Minimize third-party dependencies
- Use rollup for optimal bundling

### Runtime Performance
- Avoid blocking the main thread
- Use requestIdleCallback when available
- Batch telemetry operations
- Implement efficient queuing mechanisms

### Memory Management
- Clean up event listeners on teardown
- Avoid memory leaks in long-running applications
- Use weak references where appropriate
- Implement proper disposal patterns

## Common Patterns & Anti-Patterns

### ✅ Good Practices
- Use TypeScript interfaces for contracts
- Implement proper error boundaries
- Follow the plugin architecture
- Use performance monitoring internally
- Sanitize all user inputs
- Support both sync and async operations

### ❌ Anti-Patterns
- Don't block the browser UI thread
- Avoid throwing unhandled exceptions
- Don't collect sensitive user data
- Avoid tight coupling between components
- Don't ignore browser compatibility
- Avoid memory leaks in event handlers

## Documentation Standards

### Code Comments
- Use JSDoc format for public APIs
- Document complex algorithms and business logic
- Include examples for public methods
- Explain browser compatibility considerations

### Interface Documentation
- Document all public interfaces thoroughly
- Include parameter validation requirements
- Specify return value contracts
- Note any side effects or state changes

## Build & Deployment

### Build Process
- Rush for monorepo management
- TypeScript compilation with strict settings
- Rollup bundling with multiple output formats
- Minification and size optimization

### Release Process
- Semantic versioning
- Automated testing before release
- Bundle size monitoring
- Browser compatibility verification

---

*This document helps GitHub Copilot understand the unique patterns, architecture, and requirements of the Application Insights JavaScript SDK project.*
