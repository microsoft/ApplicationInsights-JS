# GitHub Copilot Instructions for Application Insights JavaScript SDK

## Project Overview
This is the **Microsoft Application Insights JavaScript SDK** - a browser-based telemetry library for monitoring web applications. The SDK tracks page views, user interactions, performance metrics, exceptions, and custom events.

## Architecture & Structure

### Monorepo Structure
- **AISKU/**: Main Application Insights SDK package
- **AISKULight/**: Lightweight version of the SDK
- **shared/**: Core shared libraries (AppInsightsCore, AppInsightsCommon, 1ds-core-js)
- **extensions/**: Plugin-based extensions (analytics, dependencies, etc.)
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

### Required Before Each Commit
- Do not commit any changes that are only end-of-file whitespace changes
- Ensure all TypeScript files are formatted and imports are reordered correctly by running `npm run lint-fix` before committing
  - This will apply ESLint fixes to all TypeScript files
  - It will also reorder imports to maintain consistent style

### TypeScript/JavaScript Conventions
- Use **ES5-compatible** syntax for browser support and target ES5 for modern browsers
- Prefer `function` declarations over arrow functions for better IE compatibility
- Use `var` instead of `let/const` in JavaScript files for ES5 compatibility (use `let/const` in TypeScript files)
- Always use semicolons
- Use 4-space indentation
- Maximum line length: 140 characters

### Naming Conventions
- **Classes**: PascalCase (e.g., `PageViewManager`, `TelemetryContext`)
- **Interfaces**: PascalCase with `I` prefix (e.g., `ITelemetryItem`, `IPageViewTelemetry`)
- **Methods/Functions**: camelCase (e.g., `trackPageView`, `sendTelemetry`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_DURATION_ALLOWED`)
- **Private variables**: underscore prefix (e.g., `_logger`, `_hasInitialized`)
- **Enums**: PascalCase with `e` prefix (e.g., `eLoggingSeverity`, `eInternalMessageId`)
  - Must be const enums with integer values (not strings)
  - Use `createEnumStyle` helper for exported enums
  - All usage should reference the const enum directly

### Dynamic Proto Pattern
This project uses a unique `dynamicProto` pattern for performance optimization. This pattern should be used for all classes:

```typescript
export class MyClass {
    constructor() {
        dynamicProto(MyClass, this, (_self, _base) => {
            // Private variables should be included inside the constructor closure
            // They are not publicly visible on the class
            let _logger = _self._logger;
            let _hasInitialized = false;
            
            // Public methods need @DynamicProtoStub comment for TypeScript definitions
            _self.myMethod = () => {
                // Method implementation
            };
        });
    }
    
    /**
     * @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
     */
    public myMethod(): void {
        // This stub will be replaced by the dynamicProto implementation
    }
}
```

Key requirements:
- Use this pattern for all classes
- Private variables must be inside the constructor closure
- Public functions need `@DynamicProtoStub` comment for TypeScript definition generation
- Never add implementation code to the stub methods

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
- Minimize the size of generated JavaScript by avoiding certain TypeScript features:
  - Do not use the spread `...` operator
  - Do not use optional chaining `?.` operator
  - Do not use the nullish coalescing `??` operator - use `||` instead
  - These restrictions will be removed once ES5 support is discontinued

## Browser Compatibility

### Target Support
- **Modern browsers**: Chrome, Firefox, Safari, Edge (targeting ES5 for modern browsers)
- **Legacy support**: Internet Explorer 8+ (ES5 compatibility required)
- **Mobile browsers**: iOS Safari, Android Chrome
- **Non-browser runtimes**: Node.js and other browser-like environments (for worker contexts and server-side rendering)

### Compatibility Patterns
- Feature detection over browser detection
- Graceful degradation for missing APIs
- Use existing polyfills rather than creating new ones
- Safe API usage with null checks

### Async Operations Support
Support async operations using ts-async helpers instead of native async/await:
- Use `doAwait` for `await` operations
- Use `doAwaitResponse` to handle catch operations for asynchronous operations
- Use `createPromise`, `createSyncPromise`, `createIdlePromise` instead of declaring functions as `async`
- Return type should use `IPromise` instead of `Promise` for IE support

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

## Testing Patterns

### Unit Testing
- Use framework-agnostic test patterns
- Mock browser APIs consistently
- Test both success and failure scenarios
- Verify telemetry data structure and content

### Testing Framework Requirements
- **Extend AITestClass**: All test classes must extend `AITestClass` from `@microsoft/ai-test-framework`
- **Use Framework Tools**: Leverage existing framework helpers like `this.hookFetch()`, `this.useFakeTimers()`, and `this.onDone()`
- **Proper Registration**: Implement `registerTests()` method and use `this.testCase()` for test registration
- **Async Tests**: Return `IPromise` from test functions for asynchronous operations (do not use deprecated `testCaseAsync`)

### Critical Cleanup & Resource Management
- **Mandatory Core Cleanup**: Always call `appInsightsCore.unload(false)` in test cleanup to prevent hook pollution between tests
- **Extension Teardown**: Only call `teardown()` on extension instances that were NOT added to a core instance; `core.unload()` handles teardown for initialized extensions
- **Hook Validation**: The framework validates that all hooks are properly removed; tests will fail if cleanup is incomplete
- **Resource Isolation**: Each test must be completely isolated - no shared state or leftover hooks

### Configuration Testing Requirements
- **Static Configuration**: Test initial configuration setup and validation
- **Dynamic Configuration**: **REQUIRED** - All tests that touch configuration must include post-initialization configuration change tests
- **onConfigChange Testing**: Components using `onConfigChange` callbacks must be tested for runtime configuration updates
- **Configuration Validation**: Test both valid and invalid configuration scenarios with proper error handling

```typescript
// Example dynamic configuration test pattern
public testDynamicConfig() {
    // Initial setup with one config
    let initialConfig = { enableFeature: false };
    core.initialize(initialConfig, channels);
    
    // Verify initial behavior
    Assert.equal(false, component.isFeatureEnabled());
    
    // Update configuration dynamically
    core.config.enableFeature = true;
    // Note: core.onConfigChange() only registers callbacks, it doesn't trigger changes
    
    // To trigger config change detection, use one of these patterns:
    
    // Option 1: Using fake timers (synchronous)
    this.clock.tick(1); // Trigger 1ms timer for config change detection
    
    // Option 2: Async test without fake timers
    // return createPromise((resolve) => {
    //     setTimeout(() => {
    //         Assert.equal(true, component.isFeatureEnabled());
    //         resolve();
    //     }, 10);
    // });
    
    // Verify behavior changed (when using fake timers)
    Assert.equal(true, component.isFeatureEnabled());
}
```

### Package Organization & Dependencies
- **Respect Package Boundaries**: Place tests in the package that owns the functionality being tested
- **Dependency Injection**: Extensions must include dependencies in `config.extensions` array for proper initialization
- **Cross-Package Coordination**: Understand which package owns which functionality when testing integrated features
- **Import Resolution**: Use proper module imports and avoid direct file path dependencies

### HTTP API & Network Testing
- **Use Framework Helpers**: Use `this.hookFetch()` instead of custom fetch mocking implementations
- **XMLHttpRequest Testing**: Use framework's built-in mechanisms for XHR validation
- **Header Validation**: Test both presence and absence of headers based on different configuration modes
- **Network Scenarios**: Test success, failure, timeout, and edge cases consistently

### Async Testing Patterns
- **IPromise Return**: Use `this.testCase()` and return `IPromise` for asynchronous operations instead of deprecated `testCaseAsync`
- **Promise Handling**: Handle both resolution and rejection paths in async tests
- **Timing Control**: Use `this.clock.tick()` when `useFakeTimers: true` for deterministic timing
- **Cleanup in Async**: Ensure cleanup happens in both success and failure paths of async tests

```typescript
// Example async test pattern
this.testCase({
    name: "Async operation test",
    test: () => {
        return createPromise((resolve, reject) => {
            // Setup async operation
            someAsyncOperation().then(() => {
                try {
                    // Assertions
                    Assert.ok(true, "Operation succeeded");
                    resolve();
                } catch (e) {
                    reject(e);
                }
            }).catch(reject);
        });
    }
});
```

### Unit Testing Best Practices
- **Comprehensive Coverage**: Test all major code paths including edge cases and error conditions
- **Mock Browser APIs**: Mock browser APIs consistently using framework-provided mechanisms
- **Telemetry Validation**: Verify telemetry data structure, content, and proper formatting
- **State Testing**: Test both empty/null states and populated states for data structures

### Browser Testing
- **Cross-browser Compatibility**: Test across different browser environments and API availability
- **Performance Regression**: Monitor test execution time and detect performance regressions
- **Memory Leak Detection**: Verify proper cleanup and resource management in long-running scenarios
- **API Graceful Degradation**: Test behavior when browser APIs are unavailable or disabled

### Test Organization
- **Collocate Tests**: Place tests in `Tests/` directories within the same package as source code
- **Descriptive Naming**: Use clear, descriptive test names that explain the scenario being tested
- **Logical Grouping**: Group related tests in test suites within the same test class
- **Documentation**: Include comments explaining complex test scenarios and edge cases

### Common Anti-Patterns to Avoid
- **Skipping Cleanup**: Not calling `unload()` or `teardown()` methods leads to test interference
- **Custom Implementations**: Implementing custom mocks/helpers instead of using framework-provided tools
- **Configuration Gaps**: Testing only static configuration without dynamic configuration change scenarios
- **Hook Pollution**: Leaving hooks active between tests causing false positives/negatives
- **Incomplete Coverage**: Missing edge cases, error conditions, or state transitions
- **Deprecated Async**: Using deprecated `testCaseAsync` instead of `testCase` with `IPromise` return

## Configuration & Initialization

### SDK Configuration
- Support both snippet and npm installation
- Provide sensible defaults
- Allow runtime configuration changes
- Validate configuration parameters
- Configuration names should be descriptive but mindful of browser bundle size by keeping names concise and readable

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

### Code Organization & Tree-Shaking
- Each package should be side-effect free to enable proper tree-shaking
- All code should be tree-shakable - avoid global side effects
- Use lazy initialization for any globals via `ILazyValue` interface or similar patterns
- Distinguish between "value not yet checked/assigned" vs "resulting value is null/undefined"
- Export functions and classes individually rather than as default exports
- Avoid executing code at module load time

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
- Use TypeDoc format for public APIs
- Document complex algorithms and business logic
- Include examples for public methods
- Explain browser compatibility considerations

### Interface Documentation
- Document all public interfaces thoroughly using TypeDoc comments
- Include parameter validation requirements
- Include defaults and any relevant examples
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
