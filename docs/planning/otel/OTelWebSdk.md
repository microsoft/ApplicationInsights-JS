# OpenTelemetry Web SDK Specification

## Executive Summary

The OpenTelemetry Web SDK is a modern, enterprise-grade telemetry solution designed specifically for web applications. It provides full OpenTelemetry API compliance while addressing the unique challenges of browser environments and multi-team development scenarios.

**Key Differentiators:**
- **Multi-Instance Architecture**: Multiple SDK instances can coexist without conflicts, enabling team isolation
- **Web-Optimized Performance**: Minimal bundle size, superior browser compatibility (ES2020+ with ES5 fallback)
- **Enterprise Features**: Dynamic configuration, complete cleanup/unload, multi-tenant support
- **Comprehensive Telemetry**: Full distributed tracing, structured logging, basic metrics, plus web-specific instrumentation

**Primary Use Cases:**
- Large-scale web applications with multiple development teams
- Enterprise applications requiring compliance and governance controls  
- Modern web frameworks (React, Angular, Vue, Next.js, etc.)
- Progressive Web Apps and Single Page Applications
- Applications requiring migration from existing telemetry solutions

## Overview

The OpenTelemetry Web SDK is designed as a modern, modular implementation that follows the OpenTelemetry specification while providing enhanced flexibility and performance for web applications. It delivers a complete observability solution encompassing distributed tracing, structured logging, and basic metrics collection through a multi-instance SDK factory that enables multiple teams to efficiently share resources while maintaining isolation. This factory pattern is particularly beneficial for modern web applications where multiple teams or components need isolated telemetry contexts in the same runtime while sharing underlying infrastructure.

## Why a Web-Specific OpenTelemetry SDK?

### **Web Application Requirements & Challenges**

While standard OpenTelemetry SDKs provide excellent observability for backend services, web applications have distinct requirements that justify a specialized implementation:

#### **1. Browser Environment Constraints**
- **Bundle Size Sensitivity**: Web applications must minimize JavaScript bundle size for performance
- **Tree-Shaking Requirements**: Dead code elimination is critical for production builds
- **Browser Compatibility**: Runtime requirement with graceful detection and fallback for unsupported browsers
  - **Minimum Language Support**: This SDK will target ES2020 features (async/await, optional chaining, nullish coalescing, etc.)
  - **Graceful Degradation**: The SDK will provide a loader/initialization **that targets ES5 (or earlier)** to ensure successful loading, parsing, and execution in older runtimes so it can detect unsupported environments and provide fallback behavior (such as reporting why the SDK can't load or falling back to a basic non-OpenTelemetry based SDK)
  - **CDN Safety**: Bundle variants MUST avoid syntax errors in older browsers while providing feature detection
  - **Runtime Detection**: Automatic capability detection to prevent crashes in unsupported environments
- **Memory Management**: Prevent memory leaks in long-running single-page applications
- **Network Efficiency**: Optimize telemetry transmission for mobile and low-bandwidth scenarios

#### **2. Web-Specific Telemetry Needs**
- **Page View Tracking**: Navigate between SPA routes and traditional page loads
- **Dependency Tracking**: Track all Ajax style requests (XMLHttpRequest, fetch, sendBeacon) from the page
- **Browser Performance Metrics**: Navigation timing, resource timing, frame rates
- **Client-Side Error Tracking**: Unhandled exceptions, promise rejections, console errors
- **User Session Management**: Session boundaries, user identification, device context
- **Real User Monitoring (RUM)**: Actual user performance vs synthetic monitoring
- **User Experience Monitoring**: Core Web Vitals, paint timing, user interactions

#### **3. Enterprise Multi-Team Development Challenges**
- **Multi-Tenant Architecture**: Multiple teams/libraries need shared telemetry configuration with optimized resource usage
- **Version Isolation**: Teams require independent SDK versions due to different release cycles and upgrade timelines
  - **NPM Package Isolation**: Different teams can use different major/minor versions of the SDK package independently
  - **CDN Version Independence**: Teams can load different CDN versions without conflicts or global state pollution
  - **Semantic Versioning Compliance**: Patch/minor versions maintain backward compatibility; major versions may introduce breaking changes with comprehensive documentation and compatibility requirements
  - **Independent Upgrade Paths**: Teams can upgrade SDK versions on their own schedule within semantic versioning constraints
- **Progressive Migration Support**: Teams transition from isolated to multi-tenant instances when ready, without forced coordination
- **Instance Isolation**: Teams need independent telemetry contexts without conflicts between versions or instances
- **Configuration Consistency**: When using shared SDK factory, teams inherit centralized enterprise defaults and apply team-specific overrides during SDK instance creation
- **Resource Efficiency**: Optimal resource sharing when teams use compatible multi-tenant instances, complete isolation when needed
- **Lifecycle Management**: Coordinated initialization and cleanup across components, SDK versions, and deployment modes

#### **4. Emerging Web Standards and Runtime Diversity**
- **Multi-Runtime Requirements**: Support across diverse JavaScript execution environments beyond traditional browsers
- **Server-Side Partial Rendering (SSPR)**: Modern frameworks that blend server and client rendering requiring unified telemetry
- **Edge Computing Environments**: Cloudflare Workers, Vercel Edge Functions, Deno Deploy, and similar edge runtimes
- **Modern Web Frameworks**: Next.js App Router, SvelteKit, Nuxt.js, Remix, Astro, Qwik, and Solid Start
- **Hybrid Rendering Patterns**: Static Site Generation (SSG), Incremental Static Regeneration (ISR), and streaming SSR
- **Web Standards Evolution**: Web Workers, Service Workers, Shared Array Buffers, and emerging browser APIs

**Key Framework Requirements:**

The SDK must provide seamless integration across modern web frameworks and rendering patterns:

- **Next.js App Router**: Support for Server Components and client-side hydration with correlation
- **SvelteKit Universal Rendering**: Server-side load tracking with client-side correlation
- **Remix Progressive Enhancement**: Loader/action telemetry with SSR and client interaction tracking
- **Edge Runtime Compatibility**: Native support for Cloudflare Workers, Vercel Edge Functions, and Deno Deploy
- **Framework-Agnostic APIs**: Consistent telemetry APIs that work across all supported frameworks

**Universal Framework Patterns:**

- **Astro Islands**: Partial hydration with telemetry correlation across islands
- **Qwik Resumability**: Fine-grained hydration tracking and performance monitoring
- **Solid Start**: Streaming SSR with progressive enhancement telemetry
- **Fresh (Deno)**: Island-based architecture with edge runtime support
- **Enhanced SPA Frameworks**: Angular Universal, Vue Nuxt.js, React Server Components

### **OTelWebSdk Capabilities & Implementation Goals**

The OTelWebSdk addresses these web application challenges through a comprehensive solution that delivers:

#### **Primary Goals**

1. **Full OpenTelemetry API Support for Tracing and Logs**
   - Complete OpenTelemetry compatible tracing API implementation with web-optimized performance
   - Full OpenTelemetry logs API support for structured logging in web applications
   - Standards compliance for interoperability with OpenTelemetry ecosystem
   - Web-optimized implementation for performance and bundle size
   - Browser-specific adaptations without breaking OTel contracts

2. **Enterprise Multi-Tenant Support**
   - **BOTH multi-tenant instances AND version isolation are primary goals** - not alternatives but complementary capabilities
   - **Strategic Migration Path**: Primary goal is migrating teams from isolated versions to efficient multi-tenant instances
   - **Version Isolation Requirement**: MUST support complete version isolation so teams can use different versions independently
   - **Multi-version coexistence**: Different SDK versions (NPM packages or CDN) operate without conflicts within the same environment
   - **Semantic Versioning Compatibility**: Following semver - patch/minor versions maintain backward compatibility, major versions may introduce breaking changes
   - **Breaking Change Documentation**: All breaking changes in major versions MUST be clearly documented with migration guidance
   - **Centralized configuration management**: Works across both multi-tenant instances and isolated versions with team-specific customization
   - **Progressive migration support**: Teams can migrate from isolated to multi-tenant instances when ready, without coordination requirements (API surface is either identical or very similar)

3. **Dynamic Configuration Management**
   - Runtime configuration updates without application restart (following existing ApplicationInsights dynamic configuration pattern)
   - Includes updates for connection strings, feature flags, etc.
   - Configuration validation with rollback on failure
   - **Remote Feature Control**: Centralized feature flag management with real-time updates
   - **Local Override Capabilities**: Local development and testing overrides for remote configurations
   - **Feature A/B Testing**: Built-in experimentation framework for feature rollouts and testing

4. **Complete Unload and Cleanup Support**
   - Complete removal of SDK instances with all associated hooks and timers
   - Comprehensive memory leak prevention and resource cleanup
   - Graceful shutdown ensuring in-flight telemetry is properly handled
   - Automatic cleanup of instrumentation hooks and DOM modifications (includes internal tagging and removal of any hooks)

5. **Dynamic Instrumentation Loading and Unloading**
   - Runtime plugin management
     - Lazy loading of modules and instrumentation
     - Individual unloading without SDK shutdown
     - Provide Memory-efficient instrumentation disposal and garbage collection
   - Coordinated module loading to prevent team conflicts (includes load and execution ordering)
   - Performance framework available to enable instrumentations to monitor performance
   - Granular control over instrumentation lifecycle and resource cleanup

6. **Compliance**
   - Privacy controls, GDPR compliance, data residency options
   - Cookie and storage controls with configurable consent management
   - Local/session storage usage controls and automatic cleanup
   - Data retention policies and automated compliance reporting
   - Configurable data scrubbing and anonymization capabilities
   - Audit trails and governance controls for enterprise environments

7. **Extensibility**
   - Plugin architecture for custom telemetry scenarios
   - Extensible processor and exporter framework
   - Custom instrumentation hooks and lifecycle management
   - Third-party integration support and adapter patterns

8. **Performance Excellence**
   - Minimal impact on application startup and runtime performance
   - Optimized memory usage and garbage collection patterns
   - Non-blocking telemetry collection with intelligent batching
   - Performance budgets and real-time performance monitoring
     - **Integrated Performance Framework**: Built on Application Insights `doPerf` and `IPerfManager` for automatic monitoring
     - **CPU Time Limits**: Ensures telemetry operations don't block main thread or degrade user experience
     - **Memory Thresholds**: Monitors and limits memory usage to prevent performance degradation
   - Efficient resource utilization across shared SDK instances
   - **Critical Timer Management Requirements**:
     - **MUST NOT use interval timers**: No background timers that run continuously without purpose
     - **On-Demand Timer Usage**: Timers MUST only be started when there is a specific action to perform
     - **Automatic Timer Cleanup**: All timers MUST be stopped immediately when there is no pending work
     - **Timer Coalescing**: Within each SDK instance, minimize timer count by coalescing multiple operations
     - **Battery and CPU Conservation**: Prevents excessive CPU usage and allows runtime to sleep properly
     - **Resource Impact Minimization**: Reduces background resource consumption and wake-up events

9. **Lightweight Telemetry Processors**
   - High-performance callback-based telemetry initializers designed for web application performance requirements
   - Lightweight processors optimized for common scenarios without full OpenTelemetry processor overhead
   - Simplified API specifically designed for telemetry enrichment, filtering, and sanitization
   - Performance-optimized processing pipeline for web applications
   - First-class SDK feature that provides Application Insights callback pattern while maintaining OpenTelemetry standards compliance

#### **Secondary Goals**

- **Developer Experience**: Type-safe APIs, comprehensive tooling, excellent debugging
- **Rich Web Telemetry**: Comprehensive browser performance monitoring beyond basic OTel
- **Migration Support**: Comprehensive migration tools and guides for existing telemetry solutions
- **Testing Excellence**: Extensive testing framework with performance validation and cross-browser support
- **Performance Optimization**: Advanced performance monitoring and optimization strategies
- **Cloud Integration**: Native Azure integration(s) while maintaining portability
- **Code Splitting for CDN Deployments**: For each released version, the CDN may provide variants that support dynamic imports to assist with page load time optimization - enabled by the foundational architectural goals of avoiding globals and using inversion of control patterns
- **Application Insights API Compatibility**: Backward compatibility support / shim to provide existing Application Insights API surface while processing through OTelWebSdk
  - `trackPageView()`, `trackEvent()`, `trackException()`, `trackDependency()` methods, basically emitting events.
  - Provides simplified Migration path for existing Application Insights implementations

### **Benefits Over Standard OpenTelemetry SDK**

#### **Performance Benefits**

| Aspect | Standard OTel | OTelWebSdk |
|--------|---------------|------------|
| **Bundle Size** | Larger bundle size | Significantly smaller with web optimizations |
| **Tree Shaking** | Limited | Full support |
| **Browser Compatibility** | Modern browsers only | ES2020+ with graceful detection/fallback |
| **Memory Usage** | Backend-optimized | SPA-optimized with support for leak prevention and detection |
| **Network Efficiency** | General purpose | Web-optimized batching/compression |

#### **Web Telemetry Benefits**

- **Page View Tracking**: Automatic SPA route change detection and traditional page load monitoring (not available in core OTel)
- **Core Web Vitals Integration**: Built-in Largest Contentful Paint (LCP), First Input Delay (FID), Cumulative Layout Shift (CLS) tracking
- **Browser Performance Metrics**: Navigation Timing API, Resource Timing API, Paint Timing API integration
- **User Experience Monitoring**: User interaction tracking, session management, device context collection
- **Client-Side Error Tracking**: Comprehensive unhandled exception capture, promise rejection monitoring, console error tracking
- **Real User Monitoring (RUM)**: Actual user performance measurement vs synthetic monitoring capabilities
- **Automatic Anonymous Session Management**: Intelligent session boundary detection, anonymous session ID generation, and cross-tab session correlation
- **Anonymous User Tracking**: Privacy-compliant user identification across sessions without PII collection
- **Multi-Runtime Support**: Native support for edge computing (Cloudflare Workers, Vercel Edge, Deno Deploy)
- **Modern Framework Integration**: Purpose-built support for Next.js, SvelteKit, Remix, Astro, Qwik, and other modern frameworks
- **Server-Side Rendering Correlation**: Seamless telemetry correlation between SSR and client-side hydration
- **Progressive Web App Support**: Service Worker integration, offline telemetry queuing, background sync capabilities
- **Memory Leak Prevention**: SPA-optimized memory management with automatic cleanup for long-running applications
- **Bundle Size Optimization**: Tree-shaking support and modular architecture for minimal production bundles
- **Browser Compatibility Range**: ES2020+ runtime with ES5-compatible loader for graceful degradation
- **Network-Aware Batching**: Intelligent telemetry batching optimized for mobile and low-bandwidth scenarios
- **Frame Budget Awareness**: 5ms frame budget compliance to prevent UI jank and maintain 60fps performance
- **Dynamic Configuration**: Runtime configuration updates without application restart (hot reload capabilities)
- **Remote Feature Management**: Centralized feature flag control with local override capabilities for development
- **Feature A/B Testing Framework**: Built-in experimentation support for gradual feature rollouts and testing
- **Complete Unload Support**: Full SDK cleanup and resource deallocation for dynamic loading scenarios
- **Multi-Team Isolation**: Independent telemetry contexts for multiple teams without global state conflicts
- **Version Coexistence**: Different SDK versions can operate simultaneously during migration periods
- **Enterprise Compliance**: Built-in GDPR compliance, data residency controls, and audit trail capabilities
- **Cookie and Storage Controls**: Configurable consent management, storage usage controls, and automatic cleanup
- **Privacy-First Design**: Anonymous session/user tracking without PII collection, configurable data anonymization
- **Cross-Browser Consistency**: Unified behavior across all supported browsers/runtimes with automatic feature detection
- **Application Insights Compatibility**: Migration path from existing Application Insights implementations through OpenTelemetry

#### **Multi-Tenant Architecture Benefits**

The OTelWebSdk supports **two distinct patterns** for multi-tenant scenarios (where "tenants" typically represent different teams, business units, or applications):

##### **Pattern 1: Multi-Tenant SDK (Same Version, Isolated Tenants)**
Multiple tenants share the same SDK version but with completely isolated configurations and contexts.

1. **Shared Infrastructure, Isolated Configuration**
   - Tenants share the same SDK version and core infrastructure
   - Each tenant gets isolated telemetry contexts, processors, and exporters
   - Independent tenant-specific configuration with enterprise defaults
   - Efficient resource sharing (timers, HTTP clients) with logical isolation

2. **Configuration Independence per Tenant**
   - Tenant-specific configuration with no shared defaults or overrides
   - Independent feature flag management and A/B testing per tenant
   - Separate compliance and privacy controls per tenant instance
   - Per-tenant performance budgets and resource allocation

3. **Error Containment Between Tenants**
   - SDK failures in one tenant's context don't affect other tenants
   - Independent error handling and recovery mechanisms per tenant
   - Isolated plugin/instrumentation failures with graceful degradation
   - Per-tenant health monitoring and diagnostics

##### **Pattern 2: Multi-Version Coexistence (Different SDK Versions)**
Different teams can use completely different SDK versions simultaneously without conflicts.

1. **Version Safety and Compatibility**
   - Multiple SDK versions can coexist safely within the same application
   - No shared global state or configuration between different versions
   - Teams control their own upgrade schedules without coordination requirements
   - Complete independence between SDK versions

2. **Independent Migration Paths**
   - Tenants can migrate independently without application-wide coordination
   - Safe development and testing with production instances running concurrently
   - Gradual rollout capabilities with instant fallback options
   - Zero-downtime migration path from legacy to modern telemetry

##### **Shared Benefits (Both Patterns)**

- **Semantic Versioning Support**: Semver compatibility maintained across all deployment patterns
  - Patch/minor versions maintain backward compatibility
  - Breaking changes clearly documented in major versions with migration guidance
  - Teams can stay on stable versions while others adopt newer versions
- **Efficient Timer Management**: Critical performance optimization for client-side environments
  - No interval timers running continuously in the background
  - On-demand timer usage only when actions are pending
  - Automatic cleanup when no work is queued
  - Timer coalescing within each SDK instance to minimize resource usage
  - Battery and CPU conservation through proper sleep/wake behavior
- **Minimal Resource Overhead**: Efficient resource sharing where possible (timers, HTTP clients, event listeners)
- **Performance Optimization**: Single telemetry pipeline with isolated processing contexts
- **Enterprise Governance**: Centralized policy enforcement with tenant flexibility

### **Architecture Comparison**

| Traditional SDK | Multi-Tenant (Same Version) | Multi-Version Coexistence |
|-----------------|----------------------------|--------------------------|
| Single configuration | Per-tenant configuration with shared infrastructure | Completely independent configurations |
| Version coupling | Same version, isolated tenants | Independent version management |
| Shared failure points | Tenant-isolated fault domains | Version-isolated fault domains |
| Global state conflicts | Clean tenant isolation | Complete version isolation |
| Difficult testing | Safe concurrent tenant testing | Safe concurrent version testing |
| Coordinated upgrades | Independent tenant configuration | Independent version migration |

### **Usage Examples**

The OTelWebSdk provides multiple usage patterns for different scenarios:

**Key Usage Patterns:**
- **Basic Instance Creation**: Simple SDK instantiation with isolated configuration
- **Multi-Team Coordination**: Teams working independently with shared resource optimization
- **Instance Isolation**: Complete separation of telemetry contexts and configurations
- **OpenTelemetry + Application Insights**: Combined API usage for comprehensive telemetry
- **Advanced Multi-Instance**: Complex enterprise scenarios with multiple factories
- **Legacy Compatibility**: Backward-compatible patterns for existing applications

**Benefits Demonstrated:**
- **Instance Isolation**: Teams get independent configurations without global conflicts
- **Multi-Team Support**: Teams can work independently while sharing optimized resources
- **Dynamic Management**: Runtime configuration and lifecycle management
- **Comprehensive Telemetry**: OpenTelemetry standard with Application Insights extensions

For comprehensive usage examples including code samples, multi-team patterns, and configuration options, see **[OTelWebSdk-UsageExamples.md](./specs/OTelWebSdk-UsageExamples.md)**.

### **When to Use OTelWebSdk vs Standard OpenTelemetry**

#### **Use OTelWebSdk When:**
- Building web applications (SPAs, PWAs, static sites)
- **Dynamic Configuration Management**: Need runtime configuration updates without restart
- **Complete Unload Support**: Require full SDK cleanup and memory leak prevention
- **Dynamic Instrumentation Loading**: Want runtime plugin management and A/B testing
- **Multi-Tenant Architecture**: Multiple teams need shared SDK instances with isolation
- **Enterprise Compliance Controls**: Need GDPR compliance, data residency, audit trails
- **Web-Optimized Performance**: Require bundle size optimization and browser-specific adaptations
- **Rich Browser Telemetry**: Want Core Web Vitals, user interactions, session management beyond basic OTel
- **High-Level Delivery Guarantees**: Need built-in reliability patterns beyond OpenTelemetry priorities:
- **Guaranteed Telemetry Delivery**: Automatic retry logic with exponential backoff and circuit breaker patterns
- **Data Integrity Assurance**: Built-in validation, sanitization, and corruption detection for telemetry data
- **Reliable Batching**: Smart batching algorithms that guarantee optimal payload sizes and delivery timing
- **Graceful Degradation**: Automatic fallback mechanisms when primary telemetry endpoints fail
- **Resource Protection**: Built-in throttling and resource management to prevent telemetry from impacting application performance
- **Session Continuity**: Persistent telemetry state across page reloads and navigation in SPAs
- **Network Resilience**: Automatic adaptation to varying network conditions and offline scenarios
- Using or migrating from Application Insights with OpenTelemetry compatibility

#### **Use Standard OpenTelemetry When:**
- Building backend services or APIs
- Working in non-browser environments (Node.js servers)
- Have simple telemetry requirements with basic "best effort" delivery (don't need guaranteed delivery)
- Comfortable with manual implementation of reliability patterns
- Don't need web-specific optimizations or enterprise-grade delivery guarantees
- Want to avoid any vendor-specific extensions
- Working in environments where basic telemetry export is sufficient
- Standalone simple constrained runtime requirements

## Browser Compatibility Strategy

The OTelWebSdk implements a comprehensive browser compatibility strategy that balances modern JavaScript features with broad browser support through intelligent detection and graceful degradation.

### **Runtime Requirements**

- **Primary Target**: **ES2020+** for main SDK functionality
  - Modern async/await, optional chaining (`?.`), nullish coalescing (`??`)
  - Dynamic imports, modules, and advanced JavaScript features
  - Optimal performance and developer experience

- **Loader Compatibility**: **ES5-compatible** detection and bootstrapping
  - Universal parsing and execution across all browsers
  - Safe feature detection without syntax errors
  - Graceful fallback mechanism activation

### **Browser Support Matrix**

| Browser Category | Language Support | SDK Functionality | Fallback Behavior |
|------------------|------------------|-------------------|-------------------|
| **Modern Browsers** | ES2020+ | Full SDK with all features | N/A |
| **Legacy Browsers** | ES2015+ | Loader only (detection and fallback) | Graceful degradation, optional basic tracking |
| **Unsupported Legacy** | < ES2015 | None | Silent failure or basic image beacon tracking |

**Specific Browser Support:**
- **Chrome**: 80+ (full SDK), 60+ (loader only), < 60 (graceful degradation)
- **Firefox**: 75+ (full SDK), 60+ (loader only), < 60 (graceful degradation)  
- **Safari**: 13+ (full SDK), 11+ (loader only), < 11 (graceful degradation)
- **Edge**: 80+ (full SDK), 18+ (loader only), < 18 (graceful degradation)
- **Internet Explorer**: 11 (graceful degradation only)

### **Runtime Environment Detection**

#### **Comprehensive Environment Support**
- **Browser Main Thread**: Full functionality with web-specific optimizations
- **Web Workers**: Core telemetry with limited DOM access
- **Service Workers**: Background telemetry with offline capability
- **Node.js SSR**: Server-side rendering support with conditional browser features
- **Edge Runtimes**: Cloudflare Workers, Vercel Edge, Deno Deploy compatibility

### **Graceful Degradation Patterns**

#### **Feature-Based Fallbacks**
- **Modern APIs → Legacy APIs**: fetch → XMLHttpRequest → image beacon
- **Advanced Timing → Basic Timing**: PerformanceObserver → performance.timing → Date.now()
- **Rich Context → Simple Context**: Structured logging → basic console logging
- **Complex Processing → Simple Processing**: Full processors → basic initializers

#### **Polyfill Strategy**
- **Internal Polyfills**: Hidden implementations for missing features
- **No Global Pollution**: SDK never modifies global prototypes or window objects
- **Bundle Size Conscious**: Only essential polyfills included per variant

### **Development and Testing**

#### **Bundle Size Optimization**
- **Tree Shaking**: Full dead code elimination for unused features
- **Code Splitting**: Dynamic imports for optional functionality  
- **Compression**: Optimal minification and gzip compression
- **Size Budgets**: Automated bundle size monitoring and limits

### **Migration and Upgrade Path**

- **Backward Compatibility**: Maintained within semantic versioning
- **Progressive Enhancement**: Gradual adoption of newer browser features
- **Future-Proof**: Architecture ready for emerging web standards
- **Deprecation Policy**: Clear timeline for legacy browser support removal

This browser compatibility strategy ensures the OTelWebSdk can run effectively across the diverse web ecosystem while providing optimal performance and features for modern browsers.

## Architecture Overview

The OTelWebSdk implements a modern, scalable architecture emphasizing:

- **Interface-First Design**: All components implement well-defined TypeScript interfaces with no concrete dependencies
- **Inversion of Control (IoC)**: Complete dependency injection pattern with no global state or singletons
- **Factory-Based Instantiation**: Controlled SDK lifecycle through factory functions
- **Resource Sharing**: Efficient coordination while maintaining instance isolation  
- **OpenTelemetry Compliance**: Full adherence to OpenTelemetry specifications
- **Explicit Dependency Management**: All dependencies injected through constructors, enabling testability and modularity

For comprehensive architectural details including IoC principles, dependency injection patterns, component interactions, multi-instance factory design, and implementation guidelines, see **[OTelWebSdk-Architecture.md](./specs/OTelWebSdk-Architecture.md)**.

### Anti-Patterns to Avoid

#### **CRITICAL: Never Import OpenTelemetry Packages Directly**

**The SDK MUST NOT import or depend on `@opentelemetry/*` packages** as many have side effects that automatically register global implementations, breaking the interface-first/factory function approach. These packages often cause:

- **Global provider registration** that conflicts with multi-instance isolation
- **Automatic instrumentation setup** that prevents controlled lifecycle management  
- **Static configuration loading** that breaks dynamic configuration capabilities
- **Side effect execution at module load time** that interferes with graceful degradation

**Correct Approach:** The SDK must define its own **interface-only** contracts that are compatible with OpenTelemetry specifications through duck typing. This enables OpenTelemetry ecosystem compatibility while maintaining:

- **Prevents Global State**: Avoids automatic global provider registration
- **Enables Multi-Instance**: Multiple SDK instances can coexist without conflicts  
- **Maintains Isolation**: Teams get truly isolated telemetry contexts
- **Interface Compatibility**: Still works with OpenTelemetry ecosystem via duck typing
- **Bundle Size**: Avoids pulling in unused OpenTelemetry infrastructure
- **Tree-Shaking**: Ensures dead code elimination works properly

### Key Implementation Principles

The SDK implementation follows specific architectural patterns detailed in the [Architecture document](./specs/OTelWebSdk-Architecture.md):

- **Interface-First Design**: TypeScript interfaces define all public contracts
- **Factory Function Pattern**: Controlled instantiation with dependency injection  
- **IoC Pattern**: No global state, explicit dependency management
- **Closure-Based Implementation**: For bundle size optimization and true private state management
- **High-Performance Architecture**: Minimal overhead design with advanced batching, resource management, and bundle optimization
- **Modular Architecture**: Tree-shakable, plugin-based extensibility

## Application Insights SDK Requirements

Building on OpenTelemetry standards, the SDK inherits and extends the proven requirements from the Microsoft Application Insights JavaScript SDK to ensure enterprise-grade reliability and functionality:

### 7. Enterprise Multi-Team Support
- **Dual Primary Goals**: Both multi-tenant instance efficiency AND complete version isolation are equally critical requirements
- **Progressive Migration Strategy**: Primary goal is enabling teams to migrate from isolated versions to multi-tenant instances for optimal resource usage when ready, without forced coordination or version compatibility constraints
- **Complete Team and Instance Isolation**: Independent SDK instances per team with isolated configuration and telemetry contexts that prevent team conflicts across SDK versions and deployment modes - each team gets completely isolated telemetry contexts through dedicated SDK instances and configurations
- **Complete Version Isolation Support**: Enterprise teams have different release cycles, upgrade timelines, and risk tolerances - therefore the SDK MUST support complete isolation across all deployment scenarios: teams using different NPM package versions, teams loading different CDN versions, or mixed deployments where some teams use NPM while others use CDN. This isolation prevents any team's SDK version choice from breaking other teams' implementations.
- **Semantic Versioning Compliance**: Backward compatibility must be maintained within major versions; breaking changes allowed in major version increments with comprehensive documentation and compatibility matrix for components
- **Resource Sharing Optimization**: Efficient sharing of connections, timers, and processing resources occurs only between SDK instances created by the same shared factory - different SDK versions or separate factory instances operate in complete isolation and never share resources, ensuring perfect version isolation without reliance on globals
- **Configuration Inheritance**: When multiple SDK instances are created from the same shared factory, child instances inherit the factory's default configuration settings (unless explicitly overridden during instance creation) - this enables consistent baseline configuration across teams using the same factory while allowing team-specific customization

### 8. Bundle Size Optimization
- **Tree-Shaking Friendly**: Full support for dead code elimination with no side effects
- **Modular Loading**: Individual components can be imported to minimize bundle size
- **Compression Optimization**: Optimal minification and compression for production builds
- **Size Validation**: Unit tests that enforce bundle size limits and prevent size regressions in CI/CD pipeline

### 9. Universal JavaScript Runtime Support
- **Platform Detection**: Automatic detection of runtime environment (Browser, Web Worker, SSR, Edge) with graceful degradation for unsupported features - the SDK MUST NOT install global polyfills as this can break end-user applications that have their own polyfills or rely on missing functionality for their own detection logic
- **API Adaptation**: Graceful use of modern browser APIs with feature detection and fallbacks - SDK uses internal polyfills hidden by internal function aliases that support bundle size optimization and code minification while never modifying global scope
- **Browser Requirements**: Main SDK will target ES2020+ language support (via TypeScript) but will provide graceful fallbacks internally
- **Emerging Runtime Support**: Compatibility with modern frameworks (Next.js, SvelteKit, Remix, Nuxt.js, Astro, Qwik, Solid Start), server-side rendering patterns (React Server Components, SSG, ISR, streaming SSR), edge runtimes (Cloudflare Workers, Vercel Edge Functions, Deno Deploy, Bun), and hybrid rendering patterns will be provided by Platform Detection and API Adaptation techniques without requiring runtime-specific code
- **Web Worker Support**: Complete functionality in Web Worker and Service Worker environments

## Dynamic Instrumentation Management

The OTelWebSdk provides comprehensive support for dynamic instrumentation loading and unloading, enabling teams to manage telemetry collection granularly without impacting the entire SDK lifecycle.

**Key Capabilities:**
- **Runtime Loading**: Load individual instrumentations at runtime with configuration options
- **Hot-Swap Support**: Replace instrumentations for A/B testing without SDK restart
- **Resource Cleanup**: Complete instrumentation unloading with proper memory management
- **Third-Party Support**: Registration and management of custom instrumentations
- **Performance Monitoring**: Optional Application Insights performance framework integration

**Benefits:**
- Zero-downtime updates and safe experimentation
- Performance optimization through selective loading/unloading
- Memory efficiency and error isolation
- Team independence and third-party ecosystem support

For detailed instrumentation management, see **[OTelWebSdk-Instrumentation.md](./specs/OTelWebSdk-Instrumentation.md)**.

## Lightweight Telemetry Processors

The OTelWebSdk prioritizes **OpenTelemetry standards compliance** while providing **lightweight telemetry initializers** as a first-class SDK feature designed for performance-optimized telemetry processing scenarios.

### OpenTelemetry Standards First

The SDK implements full **OpenTelemetry processor interfaces** (`SpanProcessor`, `LogRecordProcessor`, `MetricProcessor`) as the primary telemetry processing mechanism, ensuring:

- **Standards Compliance**: Full compatibility with OpenTelemetry ecosystem
- **Interoperability**: Works with any OpenTelemetry-compatible tooling and exporters
- **Future-Proof**: Aligned with evolving OpenTelemetry standards and best practices
- **Ecosystem Integration**: Seamless integration with OpenTelemetry instrumentation libraries

### Lightweight Telemetry Initializers

As a core SDK feature, the OTelWebSdk provides **callback-based telemetry initializers** specifically designed for high-performance, low-overhead telemetry processing scenarios:

- **Performance Optimized**: ~1-2μs per telemetry item vs ~5-10μs for full OpenTelemetry processors
- **Bundle Size Efficient**: ~0.5KB vs 2-3KB per processor for simple scenarios  
- **Low Overhead**: Simple callback functions ideal for data enrichment and filtering
- **Purpose-Built**: Designed specifically for common web application telemetry processing needs
- **Migration Compatible**: Provides familiar patterns for Application Insights users transitioning to OpenTelemetry

This lightweight processing approach is a strategic SDK feature that addresses the unique performance requirements of web applications while maintaining full OpenTelemetry standards compliance.

For comprehensive documentation on telemetry processing capabilities, implementation patterns, performance comparisons, and migration guidance, see:

**[Telemetry Initializers Specification](./specs/OTelWebSdk-TelemetryInitializers.md)**

### Processing Architecture

The SDK supports both processing approaches with proper prioritization:

```typescript
// 1. OpenTelemetry processors (recommended for complex processing)
sdk.addSpanProcessor(new BatchSpanProcessor(exporter));
sdk.addLogRecordProcessor(new SimpleLogRecordProcessor(exporter));

// 2. Lightweight telemetry initializers (optimized for performance-critical scenarios)
sdk.addTelemetryInitializer((item) => {
  item.data.customProperties['app.version'] = '2.1.0';
  return true;
});
```

The telemetry processing pipeline executes **OpenTelemetry processors first**, followed by lightweight telemetry initializers, ensuring standards compliance while providing performance-optimized processing for common scenarios.

## Multi-Instance SDK Factory Implementation

### Core Factory Interface

The multi-instance SDK factory is implemented through a sophisticated interface that coordinates multiple SDK instances while optimizing resource usage.

For complete interface definitions, see [OTelWebSdk-Interfaces.md](./specs/OTelWebSdk-Interfaces.md).


### Factory Access Patterns

The SDK provides multiple factory access patterns to support different deployment scenarios:

- **Synchronous Factory Access**: For immediate SDK access
- **Asynchronous Factory Access**: For CDN loading and version fetching
- **Named Factory Pattern**: For multi-project scenarios
- **Direct Factory Creation**: For custom scenarios

### Version-Aware and Async Factory Loading

The factory supports both synchronous and asynchronous loading patterns with version specification and compatibility checking.

#### **Synchronous Factory Access**

```typescript
// Basic usage - gets existing factory or creates new one
const factory = createSdkFactory();
console.log(`Using SDK version: ${factory.version}`);

// Version-aware access with options
const factory = createSdkFactory({
  version: '1.5.0',                    // Request specific version
  versionStrategy: 'compatible',       // Accept compatible versions
  allowFallback: true                  // Fall back if exact version unavailable
});

// Verify version compatibility
if (factory.version !== '1.5.0') {
  console.warn(`Using ${factory.version} instead of requested 1.5.0`);
}
```

#### **Asynchronous Factory Access**

```typescript
// Async loading for CDN scenarios
const factory = await createSdkFactoryAsync();

// Request specific version with CDN loading
const factory = await createSdkFactoryAsync({
  version: '1.5.0',
  versionStrategy: 'exact',
  timeout: 10000,                      // 10 second timeout
  cdnBaseUrl: 'https://custom-cdn.com/otel-web-sdk'
});

// Handle loading failures
try {
  const factory = await createSdkFactoryAsync({
    version: '2.0.0',
    versionStrategy: 'exact',
    allowFallback: false
  });
} catch (error) {
  console.error('Failed to load exact version 2.0.0:', error.message);
  // Fallback to any available version
  const factory = await createSdkFactoryAsync({ versionStrategy: 'any' });
}
```

#### **Version Strategy Behaviors**

```typescript
interface IVersionMatchResult {
  requested: string;
  resolved: string;
  strategy: string;
  source: 'local' | 'cdn' | 'cache';
  compatible: boolean;
  fallbackUsed: boolean;
}

// Version strategy examples
const strategies = {
  'exact': '1.5.0',           // Must be exactly 1.5.0
  'compatible': '^1.5.0',     // Accepts 1.5.x, 1.6.x, but not 2.x
  'latest': 'latest',         // Gets latest available version
  'any': '*'                  // Accepts any version
};

// Check version resolution details
const factory = await createSdkFactoryAsync({
  version: '1.5.0',
  versionStrategy: 'compatible'
});

const versionInfo: IVersionMatchResult = factory.buildInfo.versionMatch;
console.log({
  requested: versionInfo.requested,        // "1.5.0"
  resolved: versionInfo.resolved,          // "1.5.2"  
  compatible: versionInfo.compatible,      // true
  fallbackUsed: versionInfo.fallbackUsed   // false
});
```

#### **CDN Dynamic Loading**

```typescript
// Automatic CDN loading when version not locally available
const factory = await createSdkFactoryAsync({
  version: '1.6.0',
  versionStrategy: 'exact',
  cdnBaseUrl: 'https://cdn.jsdelivr.net/npm/@microsoft/otel-web-sdk'
});

// The factory will:
// 1. Check for existing local version 1.6.0
// 2. If not found, load from CDN
// 3. Verify integrity and compatibility
// 4. Return factory with requested version

// Custom loading with progress callback
const factory = await createSdkFactoryAsync({
  version: '1.6.0',
  onProgress: (progress: ILoadProgress) => {
    console.log(`Loading: ${progress.percent}% - ${progress.stage}`);
  }
});

interface ILoadProgress {
  percent: number;
  stage: 'checking' | 'downloading' | 'verifying' | 'initializing';
  bytesLoaded?: number;
  totalBytes?: number;
}
```

#### **Multi-Version Coordination**

```typescript
// Application with multiple SDK versions
const legacyFactory = await createSdkFactoryAsync({
  version: '1.4.0',
  versionStrategy: 'exact'
});

const modernFactory = await createSdkFactoryAsync({
  version: '1.6.0', 
  versionStrategy: 'exact'
});

// Each factory manages its own instances with version isolation
const legacySDK = legacyFactory.newInst('legacy-component', legacyConfig);
const modernSDK = modernFactory.newInst('modern-component', modernConfig);

// Cross-version compatibility checking
const compatibility = checkVersionCompatibility(
  legacyFactory.version,
  modernFactory.version
);

if (!compatibility.canCoexist) {
  console.warn('Version conflict detected:', compatibility.issues);
}
```

#### **Factory Error Handling**

```typescript
// Comprehensive error handling for async loading
async function initializeWithErrorHandling() {
  try {
    // Try exact version first
    return await createSdkFactoryAsync({
      version: '1.5.0',
      versionStrategy: 'exact',
      timeout: 5000
    });
  } catch (exactError) {
    console.warn('Exact version failed:', exactError.message);
    
    try {
      // Fallback to compatible version
      return await createSdkFactoryAsync({
        version: '1.5.0',
        versionStrategy: 'compatible',
        timeout: 5000
      });
    } catch (compatibleError) {
      console.warn('Compatible version failed:', compatibleError.message);
      
      // Final fallback to any version
      return createSdkFactory(); // Synchronous fallback
    }
  }
}

// Usage with comprehensive error handling
const factory = await initializeWithErrorHandling();
console.log(`Successfully loaded SDK version ${factory.version}`);
```

#### **Build Information Access**

```typescript
// Access detailed build information
const factory = createSdkFactory();
const buildInfo = factory.buildInfo;

console.log({
  version: buildInfo.version,           // "1.5.2"
  buildDate: buildInfo.buildDate,       // "2025-07-30T10:30:00Z"
  buildNumber: buildInfo.buildNumber,   // "12345"
  gitCommit: buildInfo.gitCommit,       // "abc123def456"
  distribution: buildInfo.distribution  // "cdn" | "npm" | "custom"
});

// Version comparison utilities
import { compareVersions, isVersionCompatible } from '@microsoft/otel-web-sdk/utils';

const isNewer = compareVersions('1.5.2', '1.5.0'); // 1 (newer)
const compatible = isVersionCompatible('1.5.0', '^1.5.0'); // true
```

### Instance Creation and Configuration

```typescript
interface IOTelWebSdk {
  // OpenTelemetry API Accessors (Primary)
  readonly trace: TraceAPI;
  readonly logs: LogsAPI;
  readonly metrics: MetricsAPI; // Basic metrics support - simple counters, histograms, gauges
  readonly context: ContextAPI;
  readonly diag: DiagAPI;
  
  // Telemetry Processing (OpenTelemetry + Lightweight)
  addTelemetryInitializer(initializer: ITelemetryInitializer): void;
  removeTelemetryInitializer(initializer: ITelemetryInitializer): void;
  addSpanProcessor(processor: SpanProcessor): void;
  addLogRecordProcessor(processor: LogRecordProcessor): void;
  
  // Instrumentation Management
  getInstrumentationManager(): IInstrumentationManager;
  
  // Lifecycle Management
  initialize(): Promise<void>;
  unload(): Promise<void>;
  flush(): Promise<void>;
  
  // Instance Information
  getInstanceName(): string;
  getConfiguration(): IOTelWebSDKConfig;
  isInitialized(): boolean;
  
  // Application Insights Compatibility Layer (Secondary/Optional)
  // These are implemented as OpenTelemetry instrumentations
  trackPageView?(pageView: IPageViewTelemetry): void;
  trackEvent?(event: IEventTelemetry): void;
  trackException?(exception: IExceptionTelemetry): void;
  trackDependency?(dependency: IDependencyTelemetry): void;
  trackMetric?(metric: IMetricTelemetry): void;
  trackTrace?(trace: ITraceTelemetry): void;
  
  // Legacy Context Configuration (Optional)
  setUserContext?(user: IUserContext): void;
  setSessionContext?(session: ISessionContext): void;
  setDeviceContext?(device: IDeviceContext): void;
  
  // Legacy Auto-tracking (Optional)
  enableAutoTracking?(config?: IAutoTrackingConfig): void;
  disableAutoTracking?(): void;
  startTrackingUserAction?(name: string): IUserActionTimer;
}
```

### Resource Sharing Architecture

The manager implements sophisticated resource sharing to minimize memory footprint and network usage:

```typescript
class OTelWebSDKManager implements IOTelWebSDKManager {
  private _instances: Map<string, IOTelWebSdk> = new Map();
  private _sharedResources: ISharedResources;
  private _sharedConfig: Partial<IOTelWebSDKConfig> = {};
  private _initialized: boolean = false;

  constructor(private _config: IManagerConfig = {}) {
    this._sharedResources = this._createSharedResources();
  }

  getInst(name: string): IOTelWebSdk | undefined {
    return this._instances.get(name);
  }

  newInst(name: string, config: Partial<IOTelWebSDKConfig>): IOTelWebSdk {
    if (this._instances.has(name)) {
      throw new Error(`SDK instance '${name}' already exists. Use getInst() to retrieve existing instance.`);
    }

    if (this._config.maxInstances && this._instances.size >= this._config.maxInstances) {
      throw new Error(`Maximum instances (${this._config.maxInstances}) exceeded`);
    }

    // Merge shared configuration with instance-specific overrides
    const mergedConfig = this._mergeConfigs(this._sharedConfig, config);
    
    const instance = new OTelWebSDK(name, mergedConfig, this._sharedResources);
    this._instances.set(name, instance);
    
    // Auto-initialize if manager is already initialized
    if (this._initialized) {
      instance.initialize();
    }
    
    return instance;
  }

  async initializeAllInstances(): Promise<void> {
    const initPromises = Array.from(this._instances.values()).map(instance => 
      instance.initialize()
    );
    
    await Promise.all(initPromises);
    this._initialized = true;
  }

  async unloadAllInstances(): Promise<void> {
    const unloadPromises = Array.from(this._instances.values()).map(instance => 
      instance.unload()
    );
    
    await Promise.all(unloadPromises);
    this._instances.clear();
    this._initialized = false;
  }

  getSharedResources(): ISharedResources {
    return this._sharedResources;
  }

  private _createSharedResources(): ISharedResources {
    return {
      exportQueue: new SharedExportQueue(this._config.sharedResourceLimits?.maxQueueSize || 1000),
      connectionPool: new SharedConnectionPool(this._config.sharedResourceLimits?.maxConnections || 2),
      timerManager: new SharedTimerManager(this._config.sharedResourceLimits?.timerMinInterval || 1000),
      performanceObserver: new SharedPerformanceObserver()
    };
  }

  private _mergeConfigs(
    baseConfig: Partial<IOTelWebSDKConfig>, 
    overrides: Partial<IOTelWebSDKConfig>
  ): IOTelWebSDKConfig {
    // Deep merge configuration with proper inheritance rules
    return {
      ...baseConfig,
      ...overrides,
      tracerConfig: {
        ...baseConfig.tracerConfig,
        ...overrides.tracerConfig
      },
      appInsightsConfig: {
        ...baseConfig.appInsightsConfig,
        ...overrides.appInsightsConfig
      },
      contextConfig: {
        ...baseConfig.contextConfig,
        ...overrides.contextConfig
      }
    };
  }
}
```

### Multi-Manager Support

For complex enterprise scenarios, the SDK supports multiple named managers:

```typescript
// Default factory (singleton)
const defaultFactory = createSdkFactory();

// Named factories for different projects/environments
const productionFactory = createSdkFactory('production');
const stagingFactory = createSdkFactory('staging');
const developmentFactory = createSdkFactory('development');

// Each factory maintains its own instance pool and shared resources
console.log(`Production instances: ${productionFactory.getInstanceCount()}`);
console.log(`Staging instances: ${stagingFactory.getInstanceCount()}`);

// Independent lifecycle management
await productionFactory.initializeAllInstances();
await stagingFactory.unloadAllInstances();
```

### Shared Resource Implementation

```typescript
class SharedExportQueue implements IExportQueue {
  private _queue: ITelemetryItem[] = [];
  private _maxSize: number;
  private _batchTimer: ITimerHandle | null = null;
  private _processing: boolean = false;

  constructor(maxSize: number = 1000) {
    this._maxSize = maxSize;
  }

  enqueue(item: ITelemetryItem): void {
    if (this._queue.length >= this._maxSize) {
      // Drop oldest items or apply sampling
      this._queue.shift();
    }
    
    this._queue.push(item);
    this._scheduleBatch();
  }

  async flush(): Promise<void> {
    if (this._processing || this._queue.length === 0) {
      return;
    }

    this._processing = true;
    const batch = this._queue.splice(0, 100); // Process in batches

    try {
      await this._processBatch(batch);
    } finally {
      this._processing = false;
      
      // Continue processing if more items arrived
      if (this._queue.length > 0) {
        this._scheduleBatch();
      }
    }
  }

  private _scheduleBatch(): void {
    if (this._batchTimer) return;
    
    this._batchTimer = setTimeout(() => {
      this._batchTimer = null;
      this.flush();
    }, 5000); // 5-second batching interval
  }

  private async _processBatch(items: ITelemetryItem[]): Promise<void> {
    // Group items by endpoint and send efficiently
    const groups = this._groupByEndpoint(items);
    
    const exportPromises = Array.from(groups.entries()).map(([endpoint, groupItems]) =>
      this._exportToEndpoint(endpoint, groupItems)
    );
    
    await Promise.all(exportPromises);
  }
}

class SharedConnectionPool implements IConnectionPool {
  private _connections: Map<string, IConnection> = new Map();
  private _maxConnections: number;

  constructor(maxConnections: number = 2) {
    this._maxConnections = maxConnections;
  }

  getConnection(endpoint: string): IConnection {
    if (!this._connections.has(endpoint)) {
      if (this._connections.size >= this._maxConnections) {
        // Reuse least recently used connection
        const lruEndpoint = this._findLRUConnection();
        this._connections.delete(lruEndpoint);
      }
      
      this._connections.set(endpoint, this._createConnection(endpoint));
    }
    
    return this._connections.get(endpoint)!;
  }

  private _createConnection(endpoint: string): IConnection {
    return new OptimizedConnection(endpoint, {
      keepAlive: true,
      maxConcurrency: 6,
      retryConfig: {
        maxRetries: 3,
        backoffMs: 1000
      }
    });
  }
}
```

## Factory Setup and Distribution Strategies

The OTelWebSdk factory requires different strategies for sharing and distribution depending on how teams consume the SDK. This section details how the factory handles NPM vs CDN loading scenarios and prevents conflicts.

### **NPM Distribution: Isolated Factories with Optional Global Registry**

When teams import the SDK via NPM, each import creates an isolated factory instance by default. This prevents accidental sharing but requires explicit coordination for multi-team scenarios.

#### **Default NPM Behavior: Isolated Factories**

```typescript
// Team A's package
import { createSdkFactory } from '@microsoft/otel-web-sdk';
const teamAFactory = createSdkFactory(); // Creates isolated factory

// Team B's package  
import { createSdkFactory } from '@microsoft/otel-web-sdk';
const teamBFactory = createSdkFactory(); // Creates separate isolated factory
```

**Isolation Benefits:**
- No accidental interference between teams
- Independent versioning and configuration
- Clear ownership boundaries
- Simplified testing and development

#### **NPM Global Registry: Coordinated Sharing**

For teams that want to share resources, the SDK provides a global registry mechanism:

```typescript
// Application bootstrap (runs first)
import { createSdkFactory, enableGlobalRegistry } from '@microsoft/otel-web-sdk';

// Enable global factory sharing with version specification
enableGlobalRegistry('my-app-v1', {
  enforceVersionCompatibility: true,
  requiredVersion: '^1.5.0'  // Require compatible version
});

const sharedFactory = createSdkFactory({
  version: '1.5.0',
  versionStrategy: 'compatible'
});
// This factory will now be shared across all teams using the same namespace

// Team A (anywhere in the app)
import { createSdkFactory } from '@microsoft/otel-web-sdk';
const factory = createSdkFactory(); // Gets the shared factory instance

// Team B (anywhere in the app)  
import { createSdkFactory } from '@microsoft/otel-web-sdk';
const factory = createSdkFactory(); // Gets the same shared factory instance
```

**Global Registry Features:**
- **Namespace Protection**: Prevents conflicts between different applications
- **Lazy Creation**: Factory created on first access
- **Version Checking**: Ensures compatible SDK versions across teams
- **Opt-in Model**: Teams must explicitly enable sharing

#### **NPM Factory Registry Implementation**

```typescript
interface IGlobalFactoryRegistry {
  enableGlobalRegistry(namespace: string, options?: IRegistryOptions): void;
  disableGlobalRegistry(): void;
  isGlobalRegistryEnabled(): boolean;
  getFactoryNamespace(): string | undefined;
}

interface IRegistryOptions {
  enforceVersionCompatibility?: boolean;
  maxFactoryAge?: number; // Auto-cleanup after milliseconds
  warningCallback?: (message: string) => void;
}

// Registry prevents version conflicts
enableGlobalRegistry('my-app-v1', {
  enforceVersionCompatibility: true, // Throws on version mismatch
  warningCallback: (msg) => console.warn(`OTel Factory: ${msg}`)
});
```

### **CDN Distribution: Single Instance with Version Protection**

When loaded via CDN, the SDK automatically ensures only one instance exists globally while protecting against version conflicts.

#### **CDN Auto-Detection and Protection**

```typescript
// CDN Version Protection (built into SDK)
(function(window) {
  const GLOBAL_KEY = '__OTEL_WEB_SDK_FACTORY__';
  const CURRENT_VERSION = '1.2.3';
  
  // Check for existing SDK instance
  if (window[GLOBAL_KEY]) {
    const existing = window[GLOBAL_KEY];
    
    // Version compatibility check
    if (existing.version !== CURRENT_VERSION) {
      console.warn(`OTel Web SDK: Multiple versions detected. ` +
        `Using existing v${existing.version}, ignoring v${CURRENT_VERSION}`);
    }
    
    // Return existing factory instead of creating new one
    return existing.factory;
  }
  
  // Create new factory and register globally
  const factory = createSdkFactory();
  window[GLOBAL_KEY] = {
    version: CURRENT_VERSION,
    factory: factory,
    loadTime: Date.now()
  };
  
  return factory;
})(typeof window !== 'undefined' ? window : global);
```

#### **CDN Loading Patterns**

**Standard CDN Loading (Synchronous):**
```html
<!-- Single CDN load - automatic sharing -->
<script src="https://cdn.jsdelivr.net/npm/@microsoft/otel-web-sdk@1.5.0/dist/browser/otel-web-sdk.min.js"></script>
<script>
  // All teams get the same factory instance
  const factory = window.createSdkFactory();
  console.log(`Loaded version: ${factory.version}`); // "1.5.0"
</script>
```

**Dynamic CDN Loading (Asynchronous):**
```html
<script>
  // Load specific version dynamically
  (async function() {
    try {
      const factory = await createSdkFactoryAsync({
        version: '1.5.0',
        versionStrategy: 'compatible',
        cdnBaseUrl: 'https://cdn.jsdelivr.net/npm/@microsoft/otel-web-sdk'
      });
      
      console.log(`Dynamically loaded version: ${factory.version}`);
      window.telemetryFactory = factory; // Make available globally
    } catch (error) {
      console.error('Failed to load SDK:', error);
    }
  })();
</script>
```

**Multiple CDN Versions (Protection Active):**
```html
<!-- First version loads successfully -->
<script src="https://cdn.jsdelivr.net/npm/@microsoft/otel-web-sdk@1.5.0/dist/browser/otel-web-sdk.min.js"></script>

<!-- Second version detects existing and stops -->
<script src="https://cdn.jsdelivr.net/npm/@microsoft/otel-web-sdk@1.5.2/dist/browser/otel-web-sdk.min.js"></script>

<script>
  // Both scripts return the same v1.5.0 factory (first one loaded)
  const factory = window.createSdkFactory(); 
  console.log(`Using version: ${factory.version}`); // "1.5.0" (not 1.5.2)
  
  // Version info shows which version was actually loaded
  console.log(`Build info:`, factory.buildInfo);
</script>
```

**Version-Aware CDN Loading:**
```html
<script>
  // Request specific version with fallback strategy
  (async function() {
    const factory = await createSdkFactoryAsync({
      version: '1.5.2',
      versionStrategy: 'compatible',
      allowFallback: true,
      onVersionMismatch: (requested, resolved) => {
        console.log(`Requested ${requested}, using ${resolved}`);
      }
    });
    
    // Check if we got the exact version we wanted
    if (factory.version === '1.5.2') {
      console.log('Got exact version');
    } else {
      console.log(`Using compatible version ${factory.version}`);
    }
  })();
</script>
```

#### **CDN Version Detection Interface**

```typescript
interface ICDNVersionInfo {
  version: string;
  loadTime: number;
  source: 'cdn' | 'npm' | 'custom';
  factory: IOTelWebSDKManager;
}

// Access version information
const versionInfo: ICDNVersionInfo = window.__OTEL_WEB_SDK_FACTORY__;

// Check if factory was loaded via CDN
if (versionInfo.source === 'cdn') {
  console.log(`Using CDN version ${versionInfo.version} loaded at ${new Date(versionInfo.loadTime)}`);
}
```

### **Hybrid Loading: NPM + CDN Coordination**

In complex applications where some teams use NPM and others use CDN loading, the SDK provides coordination mechanisms.

#### **CDN-First Strategy**

```typescript
// Check if CDN version exists before creating NPM factory
import { createSdkFactory, hasCDNFactory } from '@microsoft/otel-web-sdk';

let factory: IOTelWebSDKManager;

if (hasCDNFactory()) {
  // Use existing CDN factory
  factory = window.createSdkFactory();
  console.log('Using existing CDN factory');
} else {
  // Create NPM factory
  factory = createSdkFactory();
  console.log('Created new NPM factory');
}
```

#### **Version Compatibility Checks**

```typescript
import { createSdkFactory, checkVersionCompatibility } from '@microsoft/otel-web-sdk';

const factory = createSdkFactory();

// Verify compatibility if mixing NPM/CDN
const compatibility = checkVersionCompatibility();
if (!compatibility.isCompatible) {
  console.warn(`Version mismatch: NPM v${compatibility.npmVersion} vs CDN v${compatibility.cdnVersion}`);
}
```

### **Factory Distribution Best Practices**

#### **For Library Authors**

```typescript
// Good: Check for existing factory first
export function initializeMyLibrary() {
  let factory: IOTelWebSDKManager;
  
  // Try global factory first (CDN or shared NPM)
  if (typeof window !== 'undefined' && window.__OTEL_WEB_SDK_FACTORY__) {
    factory = window.__OTEL_WEB_SDK_FACTORY__.factory;
  } else {
    // Fallback to isolated NPM factory
    factory = createSdkFactory();
  }
  
  return factory.newInst('my-library', myConfig);
}

// Bad: Always create new factory
export function initializeMyLibrary() {
  const factory = createSdkFactory(); // Might create duplicate
  return factory.newInst('my-library', myConfig);
}
```

#### **For Application Developers**

```typescript
// Good: Explicit factory strategy
// 1. Decide on factory strategy early
enableGlobalRegistry('my-app-v1'); // For NPM coordination

// 2. Initialize shared factory once
const appFactory = createSdkFactory();

// 3. Export factory for teams to use
export { appFactory as sharedTelemetryFactory };

// Bad: Let each team create their own
// Teams randomly calling createSdkFactory() without coordination
```

### **Debugging Factory Issues**

#### **Factory Inspection Tools**

```typescript
// Built-in debugging utilities
const debug = getOTelFactoryDebugInfo();

console.log({
  factoryCount: debug.factoryCount,        // How many factories exist
  instances: debug.instanceCount,          // Total SDK instances
  loadMethod: debug.loadMethod,            // 'npm', 'cdn', 'hybrid'
  versions: debug.versions,                // All detected versions
  globalRegistry: debug.globalRegistry,    // Registry status
  memoryUsage: debug.estimatedMemoryKB     // Approximate memory usage
});
```

#### **Common Issues and Solutions**

| Issue | Symptom | Solution |
|-------|---------|----------|
| **Multiple Factories** | Duplicate telemetry, high memory usage | Enable global registry or use CDN |
| **Version Conflicts** | Console warnings, inconsistent behavior | Coordinate on single version across teams |
| **Missing Telemetry** | Some teams not sending data | Check factory sharing configuration |
| **Memory Leaks** | Growing memory usage | Ensure proper instance cleanup |

This distribution strategy ensures teams can work independently when needed while providing clear paths for coordination and resource sharing when beneficial.

For comprehensive multi-instance usage examples including multi-team patterns, advanced configurations, legacy compatibility, OpenTelemetry + Application Insights usage, and complete code samples, see **[OTelWebSdk-UsageExamples.md](./specs/OTelWebSdk-UsageExamples.md)**.

## Benefits of Multi-Instance SDK Factory

### 1. **Standards Compliance**
- Full OpenTelemetry API compatibility
- Interoperability with other OTel libraries
- Future-proof observability strategy

### 2. **Application Insights Integration**
- Seamless translation to AI telemetry format
- Preserves all AI-specific features
- No migration required for existing AI users

### 3. **Instance Management**
- Clean object-oriented lifecycle
- Automatic resource cleanup
- Multi-instance support for complex applications

### 4. **Developer Experience**
- Single SDK for both OTel and AI APIs
- Type-safe interfaces throughout
- Comprehensive configuration options
- Rich web-specific extensions

### 5. **Performance Optimized**
- Tree-shakable architecture
- Lazy initialization
- Efficient telemetry batching
- Minimal browser runtime overhead

### 6. **Enterprise Ready**
- Multi-team instance isolation
- Shared resource optimization
- Configurable sampling and filtering
- Privacy-compliant data collection







## SDK Lifecycle Flow

```
Application Startup                Manager Coordination             SDK Instance Management
        │                               │                               │
        │ 1. Import SDK                 │                               │
        │ import { createSdkFactory }      │                               │
        │                               │                               │
        │                               │                               │
        │ 2. Get SDK Factory            │                               │
        │ const factory =               │                               │
        │   createSdkFactory('default')    │                               │
        ├─────────────────────────────▶│                               │
        │                               │ 3. Create/Get Factory          │
        │                               │ - Initialize shared resources │
        │                               │ - Setup resource pools        │
        │                               │ - Configure timer management  │
        │                               │                               │
        │ 4. Create SDK Instance        │                               │
        │ const sdk = factory.newInst() │                               │
        ├─────────────────────────────▶│                               │
        │                               │ 5. Coordinate Instance Creation│
        │                               ├─────────────────────────────▶│
        │                               │                               │ 6. Create Instance
        │                               │                               │ - Validate configuration
        │                               │                               │ - Register with manager
        │                               │                               │ - Access shared resources
        │                               │                               │ - Setup providers
        │                               │                               │
        │ 7. Initialize SDK             │                               │
        │ await sdk.initialize()        │                               │
        ├─────────────────────────────▶│                               │
        │                               │ 8. Coordinate Initialization  │
        │                               ├─────────────────────────────▶│
        │                               │                               │ 9. Initialize Components
        │                               │                               │ - Start processors
        │                               │                               │ - Initialize auto-instruments
        │                               │                               │ - Setup exporters
        │ ◀────────────────────────────┤ 10. Report Ready              │ - Register with shared pools
        │ SDK initialized successfully  │ ◀─────────────────────────────┤
        │                               │                               │
        │ 11. Use SDK                   │                               │
        │ tracer = sdk.traceProvider.   │                               │
        │          getTracer()          ├─────────────────────────────▶│
        │ logger = sdk.loggerProvider.  │                               │ 12. Runtime Operations
        │          getLogger()          │                               │ - Create telemetry
        │ meter = sdk.meterProvider.    │                               │ - Process through pipelines
        │         getMeter()            │                               │ - Use shared resources
        │                               │                               │ - Batch with other instances
        │                               │                               │
        │ 13. Manager Operations        │                               │
        │ count = manager.              │                               │
        │         getInstanceCount()    │                               │
        │ instance = manager.           │                               │
        │            getInstance('x')   │                               │
        │                               │ 14. Coordinate Queries        │
        │                               │ - Query instance registry     │
        │                               │ - Return instance references  │
        │                               │ - Provide status information  │
        │                               │                               │
Application Shutdown                Manager Coordination             Instance Management
        │                               │                               │
        │ 15. Shutdown Instances        │                               │
        │ await manager.shutdownAll()   │                               │
        ├─────────────────────────────▶│                               │
        │                               │ 16. Coordinate Shutdown       │
        │                               ├─────────────────────────────▶│
        │                               │                               │ 17. Instance Shutdown
        │                               │                               │ - Flush pending telemetry
        │                               │                               │ - Stop processors
        │                               │                               │ - Close connections
        │                               │                               │ - Unregister from manager
        │                               │                               │
        │                               │ 18. Manager Cleanup           │
        │                               │ - Shutdown shared resources   │
        │                               │ - Clear instance registry     │
        │                               │ - Close connection pools      │
        │ ◀────────────────────────────┤ 19. Report Complete           │
        │ All instances shutdown        │                               │
        │                               │                               │
        │ 20. Optional: Full Cleanup    │                               │
        │ await manager.unloadAll()     │                               │
        ├──────────────────────────────▶│                              │
        │                               │ 21. Complete Unload           │
        │                               │ - Remove all patches/hooks    │
        │                               │ - Clear all references        │
        │                               │ - Reset to pristine state     │
        │◀─────────────────────────────┤ 22. Manager Unloaded          │
        │ All SDK resources removed     │                               │
```

## Implementation Documentation

The OTelWebSDK implements the OpenTelemetry specification interfaces with a focus on explicit instance management:

- **IOTelSdk**: Base interface implemented by OTelWebSdk following the OpenTelemetry specification
- **IOTelApi**: Core API interface supporting explicit context management as per OpenTelemetry standards
- **IOTelTraceApi**: Trace API implementation with non-global trace functionality following OpenTelemetry trace specification
- **IOTelContextManager**: Context management implementation with improved context propagation capabilities per OpenTelemetry context specification

## Core Components and Architecture

The OTelWebSdk consists of several core components working together to provide a complete observability solution, all following strict interface-first design principles and coordinated by the SDK Manager.

For complete interface definitions including SDK Manager, Web SDK instances, and Provider components, see **[OTelWebSdk-Interfaces.md](./specs/OTelWebSdk-Interfaces.md)**.

### Detailed Architecture and Design Patterns

For comprehensive architectural details including:
- Component interaction diagrams
- Processing pipeline flows  
- Detailed design principles and patterns
- Implementation examples with IoC patterns
- Multi-instance coordination mechanisms

See the [Architecture Documentation](./specs/OTelWebSdk-Architecture.md).

## Implementation Documentation

### Operational Documentation

- **[Testing Strategy](./specs/OTelWebSdk-Testing.md)** - Comprehensive testing approach including unit, integration, performance, and cross-browser testing
- **[Performance Strategy](./specs/OTelWebSdk-Performance.md)** - Performance optimization techniques, monitoring, and benchmarking
- **[Migration Guide](./specs/OTelWebSdk-Migration.md)** - Migration strategies and tools for existing telemetry solutions
- **[Interface Definitions](./specs/OTelWebSdk-Interfaces.md)** - Complete interface definitions and type contracts

## Implementation Roadmap

The OTelWebSdk follows a structured 6-phase implementation approach designed to deliver incremental value while building upon architectural foundations.

For comprehensive implementation planning including detailed technical tasks, timelines, milestones, and immediate next steps, see **[OTelWebSdk-Implementation.md](./specs/OTelWebSdk-Implementation.md)**.

### Quick Reference
- **Month 1**: Core SDK with basic tracing
- **Month 2**: Complete telemetry stack  
- **Month 3**: Production-ready with Azure Monitor integration

### Related Documentation
- **[Implementation Planning](./specs/OTelWebSdk-Implementation.md)** - Detailed phases, tasks, and timeline
- **[Architectural Design](./specs/OTelWebSdk-Architecture.md)** - IoC principles and technical requirements
