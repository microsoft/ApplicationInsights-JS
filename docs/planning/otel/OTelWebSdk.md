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
- **Asynchronous Factory Access**: For CDN loading
- **Named Factory Pattern**: For multi-project scenarios
- **Direct Factory Creation**: For custom scenarios

### Factory Loading Patterns

**CRITICAL: Factory Availability and Callback Requirements**

⚠️ **The `createSdkFactory()` function return value is ONLY immediately available for NPM package imports. For all CDN loading scenarios, you MUST use callbacks.**

| Loading Method | Synchronous Access | Pattern Required |
|----------------|-------------------|------------------|
| **NPM Package** | ✅ `const factory = createSdkFactory()` | Direct assignment valid |
| **CDN Script Tag** | ❌ Return may be null/undefined | **MUST use callbacks** |
| **CDN Dynamic Loading** | ❌ Return may be null/undefined | **MUST use callbacks** |
| **Mixed CDN/NPM** | ❌ Return may be null/undefined | **MUST use callbacks** |

**Why Callbacks Are Required for CDN:**
- The loader loads first, then dynamically loads the actual SDK
- `createSdkFactory()` returns `null`/`undefined` until SDK is fully loaded
- Only the `onInit` callback guarantees a valid factory instance

The factory supports both synchronous and asynchronous loading patterns for different deployment scenarios.

#### **Factory Access Patterns**

```typescript
// NPM usage - only valid when SDK is imported via NPM package
// Note: This ONLY works with npm packages, NOT with CDN loading
import { createSdkFactory } from '@microsoft/otel-web-sdk';
const factory = createSdkFactory(); // Safe with NPM - factory and SDK is immediately available
console.log(`Using SDK version: ${factory.info.ver}`);

// CDN usage with callbacks (REQUIRED pattern for CDN loading)
// Note: The loader provides createSdkFactory() which can then load the actual SDK
// NEVER rely on return value - always use callbacks for CDN scenarios
createSdkFactory({
  src: 'https://js.monitor.azure.com/scripts/otel/otel-web-sdk.min.js',
  onInit: (factory) => {
    console.log(`SDK loaded successfully, version: ${factory.info.ver}`);
    // Initialize SDK here since synchronous call may return null/undefined
    const sdk = factory.newInst('my-app', config);
    sdk.initialize();
  },
  onError: (error) => {
    console.error('Failed to load SDK:', error.message);
    // Handle error or fallback logic here
  }
});
// Return value ignored - may be null/undefined during CDN loading
```

#### **Asynchronous Factory Access**

```typescript
// Async loading for CDN scenarios
// Note: The loader provides createSdkFactoryAsync() which can then load the actual SDK (The loader is available as an npm package, direct script or from the CDN)

const factory = await createSdkFactoryAsync();

// Load from specific CDN URL
const factory = await createSdkFactoryAsync({
  src: 'https://js.monitor.azure.com/scripts/otel/otel-web-sdk.min.js',
  timeout: 10000                       // 10 second timeout
});

// Handle loading failures
try {
  const factory = await createSdkFactoryAsync({
    src: 'https://js.monitor.azure.com/scripts/otel/v2.0.0/otel-web-sdk.js'
  });
} catch (error) {
  console.error('Failed to load from CDN:', error.message);
}
```

#### **CDN Loading with Callbacks**

```typescript
// Load from CDN with callbacks (returns promise)
// Note: The loader provides createSdkFactory() and createSdkFactoryAsync() which can then load the actual SDK (The loader is available as an npm package, direct script or from the CDN)

const factory = await createSdkFactoryAsync({
  src: 'https://js.monitor.azure.com/scripts/otel/otel-web-sdk.min.js',
  onInit: (factory) => {
    console.log(`SDK loaded successfully, version: ${factory.info.ver}`);
  },
  onError: (error) => {
    console.error('Failed to load SDK:', error.message);
  }
});

// Load from CDN with callbacks only (synchronous if already loaded)
const factory = createSdkFactory({
  src: 'https://js.monitor.azure.com/scripts/otel/otel-web-sdk.min.js',
  onInit: (factory) => {
    console.log(`SDK loaded successfully, version: ${factory.info.ver}`);
    // Initialize SDK here
    const sdk = factory.newInst('my-app', config);
    sdk.initialize();
  },
  onError: (error) => {
    console.error('Failed to load SDK:', error.message);
    // Handle error or fallback logic here
  }
});
// Returns factory immediately if already loaded, null/undefined if still loading or unavailable
// Note: For NPM usage or when SDK source is not available, may return null/undefined
// Recommended to use onInit callback for reliable initialization
if (factory) {
  console.log(`Factory available immediately: ${factory.info.ver}`);
}
```

#### **Multi-Instance with Different Sources**

```typescript
// Application with multiple SDK sources
// Note: The loader provides createSdkFactory() and createSdkFactoryAsync() which can then load the actual SDK

const legacyFactory = await createSdkFactoryAsync({
  src: 'https://js.monitor.azure.com/scripts/otel/v1.4/otel-web-sdk.js'
});

const modernFactory = await createSdkFactoryAsync({
  src: 'https://js.monitor.azure.com/scripts/otel/latest/otel-web-sdk.js'
});

// Each factory manages its own instances with complete isolation
const legacySDK = legacyFactory.newInst('legacy-component', legacyConfig);
const modernSDK = modernFactory.newInst('modern-component', modernConfig);

// Factories loaded from different sources operate independently
console.log(`Legacy SDK version: ${legacyFactory.info.ver}`);
console.log(`Modern SDK version: ${modernFactory.info.ver}`);
```

#### **Multi-Version Coordination**

```typescript
// Application with multiple SDK sources
const legacyFactory = await createSdkFactoryAsync({
  src: 'https://js.monitor.azure.com/scripts/otel/v1.4/otel-web-sdk.js'
});

const modernFactory = await createSdkFactoryAsync({
  src: 'https://js.monitor.azure.com/scripts/otel/latest/otel-web-sdk.js'
});

// Each factory manages its own instances with complete isolation
const legacySDK = legacyFactory.newInst('legacy-component', legacyConfig);
const modernSDK = modernFactory.newInst('modern-component', modernConfig);

// Factories loaded from different sources operate independently
console.log(`Legacy SDK version: ${legacyFactory.info.ver}`);
console.log(`Modern SDK version: ${modernFactory.info.ver}`);
```

#### **Build Information Access**

```typescript
// NPM usage - synchronous access to SDK and build information
import { createSdkFactory } from '@microsoft/otel-web-sdk';
const factory = createSdkFactory(); // Valid: NPM ensures immediate availability (when use the SDK package)
const info = factory.info;

console.log({
  id: info.id,                 // "factory-abc123" - Unique factory instance ID
  ver: info.ver,               // "1.5.2" - SDK version
  loadMethod: info.loadMethod  // "npm" | "cdn" | "dynamic" - How factory was created
});

// CDN usage - access build information in callback (assumes the loader has been loaded and is available via window (loaded from the CDN))
window.createSdkFactory({
  onInit: (factory) => {
    const info = factory.info;
    console.log({
      id: info.id,
      ver: info.ver,
      loadMethod: info.loadMethod
    });
  }
});
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
  unload(onDone?: (result: IUnloadResult) => void, timeoutMs?: number): Promise<IUnloadResult>;
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

### Multi-Manager Support

For complex enterprise scenarios, the SDK supports multiple named managers:

```typescript
// NPM usage - synchronous factory access is valid
import { createSdkFactory } from '@microsoft/otel-web-sdk';

// Default factory (singleton)
const defaultFactory = createSdkFactory(); // Valid: NPM ensures immediate availability

// Named factories for different projects/environments
const productionFactory = createSdkFactory('production');  // Valid: NPM usage
const stagingFactory = createSdkFactory('staging');        // Valid: NPM usage
const developmentFactory = createSdkFactory('development'); // Valid: NPM usage

// Each factory operates independently with its own configuration
console.log(`Production factory: ${productionFactory.info.id}`);
console.log(`Staging factory: ${stagingFactory.info.id}`);

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

### **NPM Distribution: Isolated Factories**

When teams import the SDK via NPM, each import creates an isolated factory instance by default. This ensures complete isolation and prevents accidental sharing between teams.

#### **Default NPM Behavior: Isolated Factories**

```typescript
// Team A's package - NPM import (synchronous access is valid)
import { createSdkFactory } from '@microsoft/otel-web-sdk';
const teamAFactory = createSdkFactory(); // Valid: NPM ensures factory is immediately available

// Team B's package - NPM import (synchronous access is valid)
import { createSdkFactory } from '@microsoft/otel-web-sdk';
const teamBFactory = createSdkFactory(); // Valid: NPM ensures factory is immediately available
```

**Isolation Benefits:**
- No accidental interference between teams
- Independent versioning and configuration
- Clear ownership boundaries
- Simplified testing and development
- Complete adherence to "no globals" principle

### **CDN Distribution: Loader-Based Loading**

When loaded via CDN, teams load the SDK loader which then provides factory creation capabilities. The loader supports two distinct loading patterns.

**Important URL Distinction:**
- **Script tags** load the **loader** (`sdkldr.min.js`) which provides `createSdkFactory()` and `createSdkFactoryAsync()` functions
- **Factory functions** load the **SDK** (`otel-web-sdk.min.js`) which provides the actual telemetry functionality

**Loader Version Agnosticism:**
The loader itself is **version-agnostic** and can load any SDK version, including future releases. While the loader has a configured default SDK version (used when no `src` parameter is provided), the same loader can dynamically load different SDK versions by specifying the `src` parameter. This design enables:
- **Forward Compatibility**: Older loaders can load newer SDK versions
- **Flexible Deployment**: Teams can use stable loader versions while adopting newer SDK features
- **Migration Support**: Gradual rollout of new SDK versions without loader updates
- **Testing Scenarios**: Load specific SDK versions for testing or comparison

The Loader itself is available 
- via an npm package to allow direct usage
- as a stand-alone script (the same as the Application Insights SDK Loader is today)
- From the CDN by dropping a script tag on the page

#### **CDN Loading Patterns**

**Standard CDN Loading (Script Tag - Side effect of Global Registration):**
```html
<!-- Load SDK loader via script tag - registers window.createSdkFactory globally -->
<script src="https://js.monitor.azure.com/scripts/otel/sdkldr.min.js"></script>
<script>
  // Even with script tag loading, use callback pattern for reliability
  // The loader is available, but may need to load the actual SDK
  window.createSdkFactory({
    onInit: (factory) => {
      console.log(`SDK loaded successfully, version: ${factory.info.ver}`);
      // Create and initialize actual SDK instance
      const sdk = factory.newInst('my-app', config);
      sdk.initialize();
    },
    onError: (error) => {
      console.error('Failed to load SDK:', error.message);
    }
  });
</script>
```

**Direct Loader Placement (Inline - No Global Registration):**
```html
<script>
  // Loader code can be placed directly inline - does NOT register globally
  // This avoids any global state pollution while providing factory creation
  
  // Inline loader implementation here...
  // Note: Must use callback pattern since createSdkFactory() returns null/undefined until SDK loads
  createSdkFactory({
    src: 'https://js.monitor.azure.com/scripts/otel/otel-web-sdk.min.js', // SDK URL
    onInit: (factory) => {
      console.log(`SDK loaded successfully, version: ${factory.info.ver}`);
      // Create and initialize SDK instance
      const sdk = factory.newInst('my-app', config);
      sdk.initialize();
    },
    onError: (error) => {
      console.error('Failed to load SDK:', error.message);
    }
  });
</script>
```

**Explicit Version Loading:**
```html
<!-- Teams specify exact loader versions - registers window.createSdkFactory -->
<script src="https://js.monitor.azure.com/scripts/otel/v1.5.0/sdkldr.min.js"></script>
<script>
  // Even with versioned loader, use callback pattern for reliability
  window.createSdkFactory({
    onInit: (factory) => {
      console.log(`SDK loaded successfully, version: ${factory.info.ver}`);
      // Create and initialize actual SDK instance
      const sdk = factory.newInst('my-app', config);
      sdk.initialize();
      console.log(`SDK instance created with loader:`, factory.info);
    },
    onError: (error) => {
      console.error('Failed to load SDK:', error.message);
    }
  });
</script>
```

#### **Global Registration Rules**

**The ONLY case where global state is modified:**
- **Script Tag Loading**: When the loader is loaded via `<script src="...">`, it registers `window.createSdkFactory`
- **Purpose**: Provides convenient global access for script-tag based loading scenarios

**No Global Registration:**
- **Inline Placement**: Loader code placed directly returns factory function without global registration
- **All SDK Instances**: Actual SDK instances never register anything globally

### **Hybrid Loading: NPM + CDN Coordination**

In complex applications where some teams use NPM and others use CDN loading, teams should coordinate their factory strategy explicitly.

#### **Explicit Factory Strategy**

```typescript
// Option 1: Teams agree to use CDN loading with callbacks
// <script src="https://js.monitor.azure.com/scripts/otel/sdkldr.min.js"></script>
// All teams use: window.createSdkFactory({ onInit: (factory) => { ... } })

// Option 2: Teams agree to use NPM with shared factory (valid for NPM)
import { createSdkFactory } from '@microsoft/otel-web-sdk';
const sharedFactory = createSdkFactory(); // Valid: NPM ensures immediate availability
export { sharedFactory };

// Option 3: Teams use isolated NPM factories (default behavior for npm package)
import { createSdkFactory } from '@microsoft/otel-web-sdk';
const teamFactory = createSdkFactory(); // Valid: NPM ensures immediate availability
```
```

### **Factory Distribution Best Practices**

#### **For Library Authors**

```typescript
// Good: Use SDK factory provided by application
export function initializeMyLibrary(factory?: any) {
  // Use provided factory or create isolated one (only valid for NPM usage)
  const libFactory = factory || createSdkFactory(); // Valid: assumes NPM package import
  return libFactory.createSDKInstance('my-library', myConfig);
}

// Alternative: Let application decide factory strategy
export function initializeMyLibrary() {
  // Create isolated factory for this library (only valid for NPM usage)
  const factory = createSdkFactory(); // Valid: assumes NPM package import
  return factory.createSDKInstance('my-library', myConfig);
}

// CDN-aware library pattern (handles both NPM and CDN scenarios)
export function initializeMyLibrary(options?: { factory?: any }) {
  if (options?.factory) {
    // Use provided factory
    return options.factory.createSDKInstance('my-library', myConfig);
  }
  
  // For CDN scenarios, require application to provide factory
  throw new Error('Factory required - use initializeMyLibrary({ factory })');
}
```

#### **For Application Developers**

```typescript
// Good: Explicit factory strategy decision

// Strategy 1: CDN sharing - load once, all teams share (use callbacks)
// <script src="https://js.monitor.azure.com/scripts/otel/sdkldr.min.js"></script>
// All teams use: window.createSdkFactory({ onInit: (factory) => { ... } })

// Strategy 2: NPM sharing - create once, export for teams
import { createSdkFactory } from '@microsoft/otel-web-sdk';
const appFactory = createSdkFactory(); // Valid: NPM ensures immediate availability
export { appFactory as sharedTelemetryFactory };

// Strategy 3: NPM isolation - each team creates own factory
// Teams call: createSdkFactory() independently (valid for NPM usage)

// Good: Document the chosen strategy for your application
```

### **Debugging Factory Issues**

#### **Factory Inspection Tools**

```typescript
// NPM usage - synchronous access is valid
import { createSdkFactory } from '@microsoft/otel-web-sdk';
const factory = createSdkFactory(); // Valid: NPM ensures immediate availability
const info = factory.info;

console.log({
  id: info.id,                           // Unique factory instance ID
  ver: info.ver,                         // SDK version
  loadMethod: info.loadMethod            // 'npm', 'cdn', 'dynamic'
});

// For multiple NPM factories, inspect each one individually
const productionFactory = createSdkFactory('production'); // Valid: NPM usage
const stagingFactory = createSdkFactory('staging');       // Valid: NPM usage

console.log('Production factory:', {
  id: productionFactory.info.id,
  version: productionFactory.info.ver,
  loadMethod: productionFactory.info.loadMethod
});

console.log('Staging factory:', {
  id: stagingFactory.info.id,
  version: stagingFactory.info.ver,
  loadMethod: stagingFactory.info.loadMethod
});
```

#### **Common Issues and Solutions**

| Issue | Symptom | Solution |
|-------|---------|----------|
| **Multiple Factories** | Potential duplicate telemetry, high resource usage | Compare factory IDs via `factory.info.id` to identify duplicates |
| **Version Conflicts** | Console warnings, inconsistent behavior | Check each factory's version via `factory.info.ver` |
| **Missing Telemetry** | Some teams not sending data | Verify factory configuration and SDK instance creation |
| **Load Method Issues** | Unexpected factory behavior | Check `factory.info.loadMethod` to understand how factory was created |

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
        │ import { createSdkFactory }   │                               │
        │                               │                               │
        │                               │                               │
        │ 2. Get SDK Factory            │                               │
        │ const factory =               │                               │
        │   createSdkFactory('default') │                               │
        ├─────────────────────────────▶│                               │
        │                               │ 3. Create/Get Factory         │
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
        │ info = factory.info           │                               │
        │ instance = factory.           │                               │
        │            getInst('x')       │                               │
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
