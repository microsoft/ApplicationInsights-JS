# Releases

> Note: ES3/IE8 compatibility will be removed in the future v3.x.x releases (scheduled for mid-late 2022), so if you need to retain ES3 compatibility you will need to remain on the 2.x.x versions of the SDK or your runtime will need install polyfill's to your ES3 environment before loading / initializing the SDK.

<!-- ## Unreleased Changes -->


### Changelog

## 3.3.11 (January 12th, 2026)

### Changelog

- #2642 Separate BeaconSendFailure and BeaconSendFailure from SizeLimitExceeded
- #2675 Fix offline channel recovery for Offline -> Online (#2674)
- #2666 Fix unload() to return promise when called without parameters
- #2667 Add a check to prevent non-string URLs from being passed to fieldRedaction method

#### Infrastructure changes

- #2684 Fix minor issue with E2E test
- #2681 Add redact URL configuration in readme
- #2676 Fix Flakey Ajax test which has race condition
- #2670 Fix static web CDN test assertion (Fixes failing CI tests)

### Web snippet 1.2.3 (November 10, 2025)

- #2659 [Web-Snippet] [BUG] @microsoft/applicationinsights-web-snippet Fix Snippet Loader Error 

## 3.3.10 (Sept 22nd, 2025)

### Changelog

- #2649 [Main][Task] 27922617: Provide Custom Provider Under Web Worker for Offline Channel
- #2638 [Main][Task] 34470593: Update Async Tests Under Dependencies Extension To Use the Modern AsyncQueue Pattern 
- #2637 [Main][Task] 34470593: Update AISKU Async Tests To Use the Modern AsyncQueue Pattern
- #2636 Fix TypeError in Click Analytics Data Collector
- #2633 Fix flush method root cause - handle async callbacks in _doSend with proper error handling
- #2632 [Feature] Implement cookie caching when disabled and automatic flushing when enabled with backward compatibility option
- #2625 Add Azure API Management proxy documentation to FAQ sections
- #2607 Update Async Tests Under AISKULight to Use the Modern AsyncQueue Pattern
- #2597 Fix TypeScript compatibility issue with ITelemetryPlugin interface
- #2595 Fix trackPageView not resetting maxAjaxCallsPerView counter
- #2583 Create IAnalyticsConfig interface to properly define AnalyticsPlugin configuration subset
- #2625 Add Azure API Management proxy documentation to FAQ sections
- #2627 Add weekly GitHub action to delete closed and merged branches
- #2635 Fix issue #2634 moving the conditional check for filtering
- #2549 Redacting urls before sending to telemetry data
- #2622 Suppressed credentials inline to avoid credscan false positive

### Potential breaking changes

Renamed `flush` method parameter from `async` to `isAsync` in `IChannelControls` interface to avoid potential keyword conflicts (only affects code that relies on named parameters)
  - Fixed return type of `flush` method to properly include `boolean` when callbacks complete synchronously
  - Fixed root cause where `_doSend()` couldn't handle asynchronous callbacks from `preparePayload()` when compression is enabled
  - `await applicationInsights.flush()` now works correctly with compression enabled
  - Added proper error handling and promise rejection propagation through async callback chains
  - Improved handling of both synchronous and asynchronous callback execution patterns
  - No polling overhead - uses direct callback invocation for better performance

**Interfaces change:**
```typescript
// Before:
flush(async: boolean = true, callBack?: (flushComplete?: boolean) => void): void | IPromise<boolean>;

// After: 
flush(isAsync: boolean = true, callBack?: (flushComplete?: boolean) => void, sendReason?: SendRequestReason): boolean | void | IPromise<boolean>;
```

**This is only a breaking change if you rely on named parameters.** If you have custom channels or plugins that implement the `IChannelControls` interface directly and rely on passing named parameters, you will need to update the parameter name from `async` to `isAsync` in your implementation.


This release also includes:
- Support for custom providers for Offline Channel which has added `customProvider` and `customUnloadProvider` interfaces to the `IOfflineChannelConfiguration`.
- `IAnalyticsConfig` is exported for Analytics extension.
- `redactUrls` and `redactQueryParams` are added to `IConfiguration` to support URL redaction.


### Potential behavioral changes

This release enhances the cookie management behavior when cookies are disabled. Previously, when cookies were disabled, calls to `cookieMgr.set()` would return `false` and cookie values would be lost. Now, these operations are cached in memory and automatically applied when cookies are re-enabled to allow for cookie compliance banners and delayed approval.

**Behavior changes:**
- `cookieMgr.set()` now returns `true` when cookies are disabled (because values are cached), instead of `false`
- `cookieMgr.get()` now returns cached values when cookies are disabled, instead of empty strings
- `cookieMgr.del()` operations are now cached and applied when cookies are re-enabled
- Applications can now recover cookie state after temporary cookie blocking scenarios

**These changes improve data persistence and are considered enhancements rather than breaking changes.** If your application logic depends on the previous behavior of `set()` returning `false` when cookies are disabled, you may need to check `cookieMgr.isEnabled()` instead, or configure `disableCookieCache: true` in your `cookieCfg` to maintain the previous behavior.

## 3.3.9 (June 25th, 2025)

This release contains an important fix for a change introduced in v3.3.7 that caused the `autoCaptureHandler` to incorrectly evaluate elements within `trackElementsType`, resulting in some click events not being auto-captured. See more details [here](https://github.com/microsoft/ApplicationInsights-JS/issues/2589).

### Changelog

- #2556 Update SDK Loader to rename the snippet postfix file to avoid CodeQL scanning issues
- #2586 [AI][Task] 33246973: Update Readme on Error Handler
- #2581 Export ICorrelationConfig interface from dependencies extension
- #2587 Click Analytics - Fix capturning of HTML events

## Web Snippet Release 1.2.2 (June 2nd, 2025)

This release adds support for Trusted Types in the Application Insights JavaScript SDK snippet loader. See more details [here](https://github.com/microsoft/ApplicationInsights-JS/blob/main/tools/applicationinsights-web-snippet/trustedTypeSupport.md).

### Changelog
- #2407 Custom Trusted Type Policy Support for Snippet Script Injection

## 3.3.8 (May 22nd, 2025)

This release contains an important fix for a change introduced in v3.3.7 that caused a ReferenceError exception to be thrown when running in strict mode. See more details [here](https://github.com/microsoft/ApplicationInsights-JS/issues/2529).

### Changelog

- #2524 Update Components to address governance issues
- #2536 Fix ReferenceError in Click Analytics v3.3.7 by reordering variable declaration
- #2530 Add negative isArray check to _isConfigDefaults

## 3.3.7 (May 7th, 2025)

### Potential breaking change

This release contains a potential breaking change due to the new compress api feaure added. If you are using a Proxy to redirect your telemetry to your own endpoint or are relying on the events to be uncompressed (this feature is initially disabled and it is intended to be enabled by the service in the near future), it is recommended to either update collection endpoint to support GZip or to explicitly disable the feature. See more details [here](https://github.com/Microsoft/ApplicationInsights-JS?tab=readme-ov-file#feature).

### Changelog

- #2518 Remove Generated docs from the repo
- #2514 Address issues with isFeatureEnabled changes
- #2517 Update Components to address governance issues
- #2501 [Main][Task]31233527:Change Default RequestSizeLimitBytes
- #2507 [main] Handle race condition during unload
- #2513 [Main][Task]32698211: Add a Config to Allow Users to Change Max Number of Events Per Batch
  - **Note**: New Config `maxEvtPerBatch` is added to the post channel `IChannelConfiguration`.
- #2511 [Main][Task]31233527: Add a Config to Allow Users to Change RequestSizeLimitBytes
  - **Note**: New Config `requestLimit` is added to the post channel `IChannelConfiguration`.
- #2506 Drop correlation header to be passed on the dependency
  - **Note**: Option to drop the enrichment of correlation header during dependency processing is added to `DependencyListenerFunction`
- #2504 [main] [Click analytics] not logging no native html input elements
  - **Note**: `trackElementTypes` is added to `IClickAnalyticsConfiguration` to allow additional, configurable HTML element types to be tracked in addition to the default set
- #2451 [main] enable compress api in 1ds-post-channel and applicationinsights-channel
  - **Note**: Using compress api feature is added through feature flag `zipPayload` and is currently disabled by default. See [how to enable this feature](https://github.com/Microsoft/ApplicationInsights-JS?tab=readme-ov-file#feature) and [more details](https://github.com/microsoft/ApplicationInsights-JS/blob/123ba4cd38f1478e91547d36c41668599834c734/shared/AppInsightsCore/src/JavaScriptSDK.Interfaces/IConfiguration.ts#L192).
- #2489 [main][stats beat] implement stats beat in application insights

## 3.3.6 (March 4th, 2025)

### Changelog

- #2481 [Main][Task]31338239: Add Config to allow excluding the configuration endpoints from being reported
- #2486 Minification improvements

## 3.3.5 (Feb 3rd, 2025)

### Changelog

#### Issues

- #2430 [BUG] Type signature for stopTrackEvent is incorrect
- #2442 [BUG] [Snippet] Unhandled exceptions are reported twice
- #2470 [BUG] @microsoft/applicationinsights-channel-js lacks a proper repository URL
- #2467 [BUG] The regex used to parse the stack trace appears to be skipping anonymous lines
  - This fixes the portal missing stack frames which are from anonymous functions due to missed parsing of stack frames with unexpected formatting.

#### Commits

- #2428 [main] [snippet] Integrate 1DS with AI Snippet Generation
- #2443 Update Stale Issue action
- #2445 [main] snippet generation fix for pr #2428
- #2446 [main] eliminate warning raised by tsdoc
- #2447 [main] [debug plugin] upgrade manifast to v3
- #2450 [main][doc] Type signature for stopTrackEvent is incorrect #2430
- #2448 [main] fix tsdoc error for param and type tag
- #2452 [main][fix] rush fix
- #2459 [Main][Task]30499129: Turn on CDN Deprecation Message with Sampling Rate with 10% Each Day
- #2458 URGENT ACTION: Stop using az416426.vo.msecnd.net
- #2460 [ThrottleMgr] Turn on Test CDN Deprecation Message with Sampling Rate with 100% Each Day
- #2461 Update config version to 1.0.1
- #2463 [main][cfgsync] update test based on new config setting
- #2462 [main][debug tool] fix the way of calling chrome storage and add new url
- #2464 Update Code Owners
- #2465 [main][debug tool] enable check compressed data
- #2468 [Main][Task]31041354: Increase CDN Deprecation Message Sampling Rate to 20%
- #2471 [Main][Task]31111291: Fix Repo links in package.json
- #2455 [main] fix rush warning message
- #2473 Update rush version

## 3.3.4 (Oct 30th 2024)

### Changelog

- #2426 [Main][Task]29626594: PerfManager Should be Created without Customized CreatePerfMgr Function
- #2421 [Main]: Make file size checks flexible for nightly/dev builds
- #2434 [Main][Task]29884493: Add a Function to Export Offline Listener From Sender
- #2437 [Main][Task]29519727: Better Handle Sender Dynamic Changes
- #2438 [Main][Task]29445623: Update CfgSync Config Readme
- #2439 [BUG] Sourcemap load errors in debugger from dependencies
- #2429 Readme - Remove double negative

## 3.3.3 (Sep 23rd 2024)

### Changelog

- #2401 [Main][Task]28966399: Separate critical events and non-critical events for Offline Support
  - **Note**: New Config `splitEvts` is added to Offline Channel Config. By enabling it, offline events will be batched and saved separately based on persistence level
- #2413 [Main][Task] 29445638: Fix Promise Initialization Sender Config Issue
  - **Note**: the issue [ApplicationInsights Channel (Sender) endpoint Url Promise is Always Pending](https://github.com/microsoft/ApplicationInsights-JS/issues/2414) is resolved
- #2416 [Main][Task]29519574: Update AISKU Light to better handle Init Promise
- #2418 [Main][Task]29465842: Update Promise Initialization Post Channel
- #2404 [main] fix expCfg to be optional
- #2407 [main] Custom Trusted Type Policy Support for Snippet Script Injection
- #2409 [main] Trusted Type Policy Support for nounce tag

## 3.3.2 (Sep 3rd, 2024)

### Changelog

- #2396 [Main] Update generated typedoc documentation
- #2397[Main] Change tslib peerDependency from "*" to open range
- #2391 [Main] enhance exception telemetry with customer log Information
  - Note: Config `expCfg` is moved from `IConfig` to `IConfiguration`(this change is going to cause the TypeScript type error).

## 3.3.1 (Aug 7th, 2024)

### Changelog

- #2379 [Main][Task]28644993: Update Online Sender Status Code Check with Offline Mode
- #2380 [Main][Task]28751664: Fix Offline Circular Dependency
- #2386 [Main][Task]28846327: Fix Offline Default Max in Storage Time to 7 Days
- #2387 [Main][Task]27760339: Typedoc is not including ILoadedPlugin
- #2381 [Main] [CDN Publishing] Cleanup AzureRM scripts from AI and 1DS
- #2377 Fix Nightly Size Tests
- #2389 [main] fix AI Basic Sku by exporting proxy function
- #2373 add withCredentials config
- #2388 [main] enhance exception telemetry with optional script Information
  - !! **New config `expCfg`** is available to provide more details of exception telemetry. See more details [here](https://microsoft.github.io/ApplicationInsights-JS/exceptionTelemetry)


### Web snippet additional update to 1.2.1 (July 10th, 2024)

This release includes fix for dependency problem in version 1.2.0, check [#2369](https://github.com/microsoft/ApplicationInsights-JS/issues/2369) for more detail.

### Changelog
- #2374 [main][snippet] remove the snippet dependency on web package

### Web snippet additional update to 1.2.0 (June 21st, 2024)

This release includes support for multiple snippet loading. Snippets with different names (passed in by the user via configuration; check [##2355](https://github.com/microsoft/ApplicationInsights-JS/issues/2355) and README for more details) can now run simultaneously.


Additionally, users can pass in a customized configuration with getSdkLoaderScript to get a ready-to-use snippet.

Users can also enable Integrity Check and minimize snippet loading time by setting sri to true.


### Changelog
- #2365 [main][snippet] prepare new snippet release, add support for more config 
- #2360 [main] set script attribut to avoid race condition when multiple sdks are inited #2355 
- #2339 [main] create snippet mini loader

## 3.3.0 (July 1st, 2024)

### Potential breaking change

This release contains a potential break change due to enhancing the definition of the [IConfiguration](https://github.com/microsoft/ApplicationInsights-JS/blob/main/shared/AppInsightsCore/src/JavaScriptSDK.Interfaces/IConfiguration.ts) to support Promise types for the connectionString, instrumentationKey and endpointURL; any extension that relies on these base interfaces will VERY likely cause TypeScript to fail with potential warnings about the types being different.

### Changelog

- #2371 Bump @microsoft/rush from 5.97.1 to 5.129.6
- #2340 [Main][Task]27939476: Initialization with iKey and endpoint to be promises

!! potential breaking changes. IConfiguration support Promise types for the connectionString, instrumentationKey and endpointURL
- #2366 [Sdk Loader] Increase version to 1.2.0
- #2367 [main] update the way to generate ajax perforamance mark prefix 

## 3.2.2 (June 11th, 2024)

### Changelog

- #2356 [Main][Task]27488189: Modify offline support enums for isolated mode
- #2357 [Main][Task]28050373: Expose Offline Support SendNextBatch function
- #2358 [Main][Task]27080650: Initialization Should Handle Offline Support Dependency
- #2362 [Main]Publishing: Add support for Az Modules instead of AzureRM Modules
- #2360 set script attribut to avoid race condition when multiple sdks are inited

## 3.2.1 (May 9th, 2024)

### Changelog

- #2333 [Main][Task]27749889: Change AISKU Sync Mode to Receive
- #2335 [Main][Task]27681441: Fix async tests for MsAzure Migration
- #2338 [Main][Task]27923018: Post Channel getOfflineSupport should set correct headers and url based on payload data
- #2342 [Main][Task]27923018: 1ds post getOffline support url fix


## 3.2.0 (Apr 23rd, 2024)

!! CfgSync plugin is turned on. Throttling Ikey depreciation message is enabled with sampling rate 0.0001%
[##2317](https://github.com/microsoft/ApplicationInsights-JS/pull/2317)

!! Sender has breaking changes. The key used for session storage is changed and items stored in the storage now contain retry counts.
[##2324](https://github.com/microsoft/ApplicationInsights-JS/pull/2324)

### Changelog

- #2371 [Main][Task]27365739 Turn on Ikey depreciation message with sampling rate 0.0001%
- #2319 [Main] Fix config release script overwrite flag and cache time
- #2321 [Main] Default request headers content-type for 1ds should be x-json-stream only ing
- #2324 [Main][Task]27079894 Add a max retry count for Sender
- #2325 [Main][Task]25716927: Change default CfgSync values to turn on the ikey deprecation message
- #2331 [Main] Resetting the DataCacheHelper version number back to current version (from 3.0.5)
- #2332 [Main][Task]27742145: Change nonOverrideCfgs to be added only during initialization
- #2333 [Main][Task]27749889: Change AISKU Sync Mode to Receive

## 3.1.2 (Mar 21st, 2024)

!! Critical Bug fix for Memoery Leak !!
[#2311](https://github.com/microsoft/ApplicationInsights-JS/issues/2311)

It also contains a packaging fix for webpack [#2307](https://github.com/microsoft/ApplicationInsights-JS/issues/2307) (caused by [#2306]](https://github.com/microsoft/ApplicationInsights-JS/issues/2306) ) and 

### Changelog

- #2307 ApplicationInsights-JS latest version 3.1.1 giving TypeError: Cannot read properties of undefined (reading 'getCrypto')
- #2306 [BUG] Circular dependencies
- #2311 [BUG] Excessive memory usage for SPA where unload hooks keep accumulating
- #2299 [Main][Task]27156360: Add json config cdn details to tool folder
- #2308 [Main][Task]27221819: Remove node 14 (from ci.yml)

## 3.1.1 (Mar 12th, 2024)

### Changelog

- #2296 [BUG] remove 403 as a “retriable” error code
- #2276 Update api-docs (typedoc) with the current 3.1.0 release details
- #2281 [Main][Task]26681188: Handle endpoint url change for offline channel and add notification mgr
- #2282 Addng two new PII Kind values for IPv6 scrubbing and dropping data.
- #2285 [Main][Task]25693679: Extract common sendPost implementation for online and offline sender
- #2197 [main] [BUG] using EndPointUrl (and IngestionEndpoint) results in Telemetry sent to incorrect urls
- #2288 [Main][Task]27064950: Add doc on adding offline support channel
- #2295 [Main][Task]27064983: Update post channel to use sender post common interfaces from core
- #2290 chore: remove extraneous console log from debug plugin

### Web snippet additional update to 1.1.2 (March 1st, 2024)
Refer to #2284 [Web-Snippet] [BUG] @microsoft/applicationinsights-web-snippet version 1.1.1 type problem 

### Web snippet additional update to 1.1.1 (Feb 16th, 2024)
Refer to #2277 [Web-Snippet] dependency chain issues

## 3.1.0 (Feb 14th, 2024)

### Interface changes / Breaking changes

This release includes support for a new Offline Channel which has changed the `IChannelsControls` interface to include additional support for the new `offline` channel. This change is to support the new `offline` channel and is a breaking change for any custom channels that implement the `IChannelsControls` interface. If you have a custom channel that implements the `IChannelsControls` interface you will need to update your implementation to include the new `offline` channel.

### Configuration default changes

As this is a minor version bump we have also change some default values for the following configuration options:

- `disableUserInitMessage` is now `true` by default to disable the user init message.

### Potential breaking change

This release contains a potential break change with 'tags' type [change](https://github.com/microsoft/ApplicationInsights-JS/pull/2269)

While the interface changes are breaking changes, the changes are not expected to affect the majority of users as when the code attempted to serialize the `tags` property it would have failed due to the `Tags[]` type being used instead of the correct `Tags` type.

#### Old

```ts
    tags?: Tags & Tags[]; 
```

#### New

```ts
    tags?: Tags;

```

