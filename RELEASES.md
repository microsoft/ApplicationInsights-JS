# Releases

> Note: ES3/IE8 compatibility will be removed in the future v3.x.x releases (scheduled for mid-late 2022), so if you need to retain ES3 compatibility you will need to remain on the 2.x.x versions of the SDK or your runtime will need install polyfill's to your ES3 environment before loading / initializing the SDK.

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

#### New Offline Channel

This release also includes the new `offline` channel which is a new channel that is designed to support offline scenarios. The `offline` channel is designed to store telemetry items in local storage and then send them when the user comes back online.
To take full advantage of the initial version you will need to implement your own IOfflineListener to handle situations where you may have "network" connectivity but not internet access. As the `navigator.onLine` property if available will only tell you if you have network connectivity and not internet access.

### Changelog

- #2186 [main] offlineListener preparation
- #2241 [Main][Task]26451789: Add Offline Support
- #2259 [Main][Task]26694421: Add Offline Support Publish Group
- #2267 [Main][Task]26681220: Better handle timers in offline channel
- #2028 [BUG] AI (Internal): 72 tracking
  - Sets the default value for the `disableUserInitMessage` to `true` (was previously false since adding)
- #2193 [main] Add extra config in sender to let users define transports type
- #2200 [main] [doc] Highlight an issue with the default UMD module format when loading from the CDN into an environment that may have require.js
- #2208 [Main][Task]26079397: Add disableBeaconSplit sender config and fix potential duplicated events during unload/fallback sender
  - #2236 [Main][Task]26396663: Set default disableBeaconSplit to true
- #2204 [BUG] Beacon sender reports error for success when diagnostics are enabled
- #2214 [main] Merge Release-3.0 to main
- #2221 [main] Fixup the ci.yml to address internal hash changes between different node versions
- #2216 [Main][Task]26138416: Fix FetchKeepAliveSender send duplicated events during unload
- #2228 [main] minor release preparation
- #2229 [main] [doc] add requireJs problem in SdkLoadFailure.md
- #2132 [BUG] Submitting NaN via trackEvent results in HTTP 400 Error Code
- #2238 [Main] Merge release-3.0 to main
- #2244 Internal Task: Update npm pack sequence
- #2249 [main][1ds] Enhance Retry Policy Testing for Alignment with Collector Policy
- #2245 [main] [snippet update] add functions to set configs of snippet
- #2250 [main] [doc] minor comment update for avoidOptions
- #2251 [Main][1DS][Post] Add support for the ext.metadata to NOT be included
- #2253 [Main] Update Tests to support upcoming change in nevware21/tsutils dumpObj to better support JSON stringify and handle PURE comments
- #2255 [main] #2225 pass customer exception id into telemetry
- #2247 [main] [1ds-post] export add header func for auth-plugin to consume
- #2209 [BUG] stopTrackEvent requires property values to be strings
  - #2268 [main] Add example of how to use stopTrackEvent #2209
  - #2270 [main] correct types define for stopTrackEvent and stopTrackPage for #2209
- #2258 [BUG] ITelemetryItem uses intersection type instead of union type for tags property  
  - #2269 [main] **[Possible Break]** Removed Tags[] from ITelemetryItem as this was breaking later versions of TypeScript by using the intersection type instead of union type for tags property
- #2272 [release 3.0.8] Fix channel test
- #2271 Cherry-pick from release-3.0 branch
  - [Release-3.0] [Release] Increase version to 3.0.8 ([Release-3.0] [Release] Increase version to 3.0.8 #2264)
  - [Release-3.0] Update namespaced types (DTS) generation to include referenced bundles


## 3.0.8 (Feb, 7th, 2024)

This release changes the new beacon splitting code (added in 3.0.4) to be `disabled` by default. This change is to address the issue where the SDK was splitting the payload into multiple requests when the payload size exceeded the maximum allowed size for a single request. This issue was introduced in the 3.0.4 release and only affects the `sendBeacon` usage during page unload, it does not affect the `fetch` usage during page unload. This change is to address the issue where the SDK was splitting the payload into multiple requests when the payload size exceeded the maximum allowed size for a single request. This issue was introduced in the 3.0.4 release and only affects the `sendBeacon` usage during page unload, it does not affect the `fetch` usage during page unload.

### Changelog

- #2235 [BUG] - CRITICAL - Application runs out of memory
  - #2236 [release-3.0] Cherry-Pick: [Main][Task]26396663: Set default disableBeaconSplit to true
- #2242 [release-3.0] Update components
  - Update @microsoft/dynamicProto-js to address possible prototype pollution issue
- #2254 [Release3.0] Update Tests to support upcoming change in nevware21/tsutils dumpObj to better support JSON stringify and handle PURE comments
- [Release 3.0] Update components for release #2261
  - Update @nevware21/ts-utils version for better minification support

## 3.0.7 (Dec 14th, 2023)

### Changelog

This release is a hotfix for issue #2216, which is simular to the issue fixed in `3.0.6` but for the `fetch` (with the keep-alive flag).

### Changelog

- #2216 [release-3.0] Cherrypick (main): fix fetchkeepalive
- #2221 [release-3.0] Cherrypick (main): Fixup the ci.yml to address internal hash changes between different node versions

## 3.0.6 (Dec 7th, 2023)

This release fixes an issue with the `sendBeacon` usage during page unload, where the SDK was not correctly splitting the payload into multiple requests when the payload size exceeded the maximum allowed size for a single request. This issue was introduced in the 3.0.4 release and only affects the `sendBeacon` usage during page unload, it does not affect the `fetch` usage during page unload.

### Changelog

- #2195 [BUG] Beacon sender causes flood of thousands of requests on page unload
- #2201 [BUG] applicationinsights.azure.com/v2/track making hundreds of thousands of requests when third party cookies are disabled
- #2205 [BUG] Duplicate customEvent entries
- #2204 [BUG] Beacon sender reports error for success when diagnostics are enabled

## 3.0.5 (Nov 1st, 2023)

### Changelog

- #2184 [main] deactive send beacon when local storage is available 
- #2185 [main] retrieve reponseText when fetch in HttpManager
- #2188 [main] generate typedoc
- #2190 [Main][Task]25648004: Export ISenderConfig from Sender
- #2191 [Main][Task]25649658: Update AISKU Light to add default baseType and baseData when calling track function 

## 3.0.4 (Oct 16th, 2023)

### Changelog

- #2162 [BUG] window is not defined at _getStackFromErrorObj 
- #2163 [BUG] Using App Insights connection string leads to double slash 
- #2164 [BUG] Fetch with empty string as first parameter does not include traceparent and does not successfully save dependency to Application Insights
- #2165 [main] use proper URL for tracking when fetch is passed an empty string 
- #2180  [BUG] Same timestamp on multiple pageView-events after upgrade to 3.0.3 
- CfgSyncPlugin improvment
  - #2166 [main] correct throttle configdefault setting in aisku 
  - #2168 [Main][Task]24499167: add cfgSync plugin doc 
  - #2171 [main] test aisku config could correctly merge new config fetch from cdn 
  - #2175 [main] Update Service Notifications to not send message twice 
  - #2177 [Main]Set CfgSync version to 3.0.3 
  - #2160 [Main] Include Config sync in publish group 
- Documentation update
  - #2169 [Main][Task]24499172: add throttle manager doc 
  - #2170 [Main][Task]24499174: Add service notification doc 
- Github workflow improvement 
  - #2173 Add Issue state reporting script 
- Sender Update
  - #2113 [Main][Task]16238553: Provide an override option for the Sender

## 3.0.3 (Sep 20th, 2023)

### Changelog

- #2157 [Main] Bug New minified bundles are corrupting global scope
- #2120 Missing traceparent header when running multiple SDK instances
  - #2144 [Main][Part 2] Missing traceparent header when running multiple SDK instances #2120
  - #2141 [Main][Bug] Missing traceparent header when running multiple SDK instances #2120
- #2149 [BUG] Fetch with empty string as first parameter ignores second parameter when fetch tracking is enabled
  - #2152 [main] allow empty string as first parameter to fetch
- #2127 [Main] Add automated ability to reset the npm latest tag to a specific build
- #2106 Consider export IClickAnalyticsConfiguration from the click plugin?
- #2086 [BUG] Field 'fileName' on type 'StackFrame' is too long. Expected: 1024 characters
  - #2118 [Main] [BUG] Field 'fileName' on type 'StackFrame' is too long. Expected: 1024 characters #2086
- #2094 _getVerifiedStorageObject - contentious sessionStorage element
  - #2110 [main] add prefix before storage name when setting it
- #2137 [Main] Fix: edge case where the navigation entry is not present
- #2135 Update @nevware21 base versions
- #2104 [main] Use the navigation entry timeing for page load event start time
- #2116 [Main] Fixup setVersion to support automated nightly release
- #2097 disablePageUnloadEvents lost somewhere #2097
- Internal Task 15757413: [VSCode] [1DS] Move 1DS Core and 1DS Post to GitHub #2102
- #2089 [BUG] The v3.x exporting of the TelemetryContext does not export the sessionManager "type"
- [BUG] Readme Issue for perfmarkmeasure @microsoft/applicationinsights-applicationinsights-perfmarkmeasure-js@ #2150
- #2139 V3 Public CDN URL
- #2093 Update project clean to make faster

- Add support for service level notifications (disabled by default in this release, will be enabled by default in a future release)
  - #2147 [main] throttle manager in aisku sending message
  - #2133 [Main][Task]24841107: Refactor throttleMgr to support multiple message keys
  - #2090 [Main][Task]17874465:Support Config sync across instances
  - #2125 [Main][Task]24677395:add configurations for CDN to enable specific users opt-in implementation
  - #2115 [Main][Task]24662146: cfgSync plugin improvement: timer handling for fetch/xhr

- SDK Loader Updates (version 7 - will be published after this release is deployed to the CDN)
  - #2091 rework web snippet (Convert to TypeScript)
  - #2099 change loader src when detect IE
  - #2098 Extend the config part in Min
  - #2131 [main] Adding round robin retry for snippet script src loading

## 3.0.2 (May 23rd, 2023)

### Changelog

- #2068 [BUG] SDK fails to initialize when the config includes objects with properties that are not configurable
- #2075 [BUG] ClickAnalytics throwing errors in console
- #2065 Type 'T' does not satisfy the constraint 'IConfiguration'
- #2079 [BUG] The SDK is not limiting the sdkVersion length, which causes the night builds to cause an error
- #2061 [BUG] hasDocument should be invoked as function
- #2064 [Main] Task 20788238: [AI] Add ApplicationInsights namespace and workaround to support v2 and v3 loaded from the CDN
- #2070 [Main] Update Minify script to always sort imports

## 3.0.1 (May 2nd, 2023)

### Changelog

- #2057 [Main] Add ability to disable the pollInternalLogs via config and change to stop using setInterval #2055
- #2051 [Main] Fix Perf Tests
- #2053 [Main] [BUG] Typing issue with generated types causing Type X is not assignable to type Y #2052
- #2058 [Bug] Fix issues related to dynamic config listeners during unloading
  - Add Promise support during unloading

## 3.0.0 (Apr 12th, 2023)

#### Major release with breaking changes from v2.x see [v3.x Breaking Changes](https://microsoft.github.io/ApplicationInsights-JS/upgrade/v3_BreakingChanges.html) for details.

Maintained from the `main` branch, v2.x is in maintenance mode on the `master` branch

### Changelog

- All code from 2.8.12 has been merged into the `main` branch and therefore this release

#### Major Changes

- Removed ES3 (IE8) Support
- Enabled dynamic config changes after initialization
  - #1427 Dynamically updating config (for extensions in my case)

- Too many individual commits to include as most revolve around the breaking changes and enabling dynamic configuration support for each extension
  - All Extensions now **share** the same configuration object `core.config` in previous releases each component maintained their own copy with their own default values, now all defaults and configuration values are exposed on the shared config.
  - By default the config object passed in during initialization is NOT the same object as that used as the shared config. Any previous assumptions around this being the same object will now be broken as this was a previously unsupported scenario.
  - All properties of the config object are now using get/set functions (via Object.defineProperty) to allow listeners to be registered (`core.onCfgChange` and internally `onConfigChange`) so that the callback function will be called if any referenced config property is changed. Yes, this means you can register your own configuration listener via `core.onCfgChange` see the [AISku Manual Test](./AISKU/Tests/Manual//HelloWorld.html) for an example.
  - All properties present during initialization are converted into dynamic properties and may be monitored, properties added "after" creation (initialization) are not. This is to continue to support IE which does not support `Proxy` implementation which also means we are not using the `Proxy` class.
  - Extensions are now responsible for listening and responding to the configuration changes that they want to support
  - Updating the config `extensions` and `channels` is NOT supported, you must use the individual plugin add / remove functions if you want to dynamically add / remove extensions / channels
  - Support for parallel channels was removed from the Core and SKU's and extracted to the new `TeeChannel`, if you require this support you will need to use npm and include this module. 
- v2.x Extension support.
  - While the basic API and support for Backward compatibility for the v2.x extension (plugin) API was maintained, due to the breaking changes (specifically the removal of the namespaced helpers) this will only support self contained components (without recompiling). Any npm module that attempts to import and use a removed helper function will potentially break and will need to be updated to use the newer or replacement helper functions (see the v3.x Breaking Changes for details), if you find an issue and are not able to work around please [raise an issue](https://github.com/microsoft/ApplicationInsights-JS/issues).

## 2.8.13 (May 1st, 2023)

### Changelog

- #2052 [BUG] Typing issue with generated types causing Type X is not assignable to type Y
- #2055 Add ability to disable the pollInternalLogs via config and change to stop using setInterval
- #2049 [Master] Fix Perf Tests

## 2.8.12 (Apr, 11th, 2023)

### Changelog

- #2014 [BUG] The documentation for enableDebug is incorrect, it should reference enableDebugExceptions
- #2027 [BUG] SDK LOAD Failure reporting not working
- #2034 [BUG] Failed XHR request after ever tracked item when gathered logs exceed maxBatchSizeInBytes while offline
- #2037 [Master] Add local storage-based implementation #1419
  - Add support for user provided storage option for Sender
- #2029 [Master] Add npm-pack and npm-publish tasks
- #2026 [Master] Fix examples, Throttle tests and export dependency types from Sku

## 2.8.11 (Mar 8th, 2023)

### Changelog

- #1996 [BUG] SharedWorker does not Instrument fetch correctly
- #1995 [BUG] App Insights not auto-capturing from a Web Worker
  - Stops logging that workers can emit the PageView Performance event
- #1792 [BUG] Documentation should clarify that node apps should use applicationinsights, not this package
- #1794 [BUG] link on AISKULight goes to not found page
- #1990 Field 'assembly' on type 'StackFrame' is too long. Expected: 1024 characters [BUG]
- Update documentation and tests to replace `instrumentationKey` usage with `connectionString`
  - #1997 Change Readme
  - #1999 Add snippet connection string tests
- #1991 Internal Task 17133116: Add Policheck exclusion file
- #1989 [AI][Task]17099792: Add sample and doc to dependency plugin

## 2.8.10 (Feb 6th, 2023)

### Changelog

- #1940 [BUG] Application Insights reports 'not_specified' to Azure when tracking unhandled browser exception
- #1979 [BUG][ThrottleMgr] Incorrectly fires based on the number of days past
- #1970 Add the Aborted flag to the dependency initializer / listeners
- #1981 [AI][Task]16961420: fix throttleMgr incorrectly fires based on the number of days past
- #1956 [AI Light][Task]14130466: Instrumentation key API is being deprecated - need to add support
- #1962 Add --no-sandbox to test runs

## 2.8.9 (Oct 25th, 2022)

- Updates Chrome Debug Extension to 0.3.9

### Changelog

- #1920 Update to DynamicProto v1.1.7
- #1935 Update to @microsoft/applicationinsights-shims: 2.0.2
  - #1911 Uncaught ReferenceError: global is not defined
- #1912 Update PerfTests to use the latest version
- #1916 [Bug] Fix randomly failing tests
- #1915 Fix CodeQL Identified potential Issues
- #1906 [Task]14569737: add throttle cdn config
- #1930 Remove the source-map-loader from the package.json as we don't use it.

## Shims 2.0.2 (Oct 24th, 2022)

## Changelog

- #1911 Uncaught ReferenceError: global is not defined

## 2.8.8 (Oct 3rd, 2022)

- Updates Chrome Debug Extension to 0.3.8

### Changelog

- #1679 [BUG] enableUnhandledPromiseRejectionTracking shows no error trace
  - #1900 [Task]15465575: add getErrorstackObj from reason.stack
- #1901 [Feature] Add option to block the creation and usage of the cookies by name
- #1904 Fixed release notes, previously used a deprecated file.

## 2.8.7 (Sept 7th, 2022)

- Updates Chrome Debug Extension to 0.3.7

### Changelog

- #1863 [BUG]urlCollectQuery not work for applicationinsights-clickanalytics-js
  - #1874 Add clickanalytics plugin url config back
- #1875 [BUG] error thrown using basic version + NPM setup
  - fix(AISKULight): call getSKUDefaults after it's defined, change this
- #1878 [JS SDK] Update Retry logic to handle additional response codes
- #1890 [BUG] Behavior difference for an empty endpointUrl when upgrading from v1 to v2
- #1895 Fix incorrect disableFetchTracking documentation
- #1887 maxAjaxCallsPerView doesn't account for filtering by TelemetryInitializer
  - adds addDependencyInitializer()

## 2.8.6 (Aug 2nd, 2022)

- React plugin is now located and released from [it's own repo](https://github.com/microsoft/applicationinsights-react-js)
- React Native plugin is now located and released from [it's own repo](https://github.com/microsoft/applicationinsights-react-native)
- Updates Chrome Debug Extension to 0.3.6

### Changelog

- #1862 [BUG] Remote Dependency requests don't "always" have the correct ai.operation.id tag (page view race condition)
- #1870 [BUG] Performance improvements when calling newGuid multiple times (like 10,000)
- #1865 Update and add legal compliance notices and license terms
- #1866 Remove React-JS and React-Native code from this repo

## 2.8.5 (Jul 6th, 2022)

- Updates React Plugin to v3.3.5 (with v2.8.5 as dependency) -- using React 17
- Updates React Native Plugin to 2.5.5 (with v2.8.5 as dependency)
- Updates Chrome Debug Extension to 0.3.5

### Changelog

- #1636 [BUG] measurements not being sent when using stopTrackEvent(name, properties, measurements);
- #1857 [BUG] CDN Packaging is not exposing the internal tools (CoreUtils / Telemetry / etc)
  - This was caused by the updated tree-shaking component that we used, fixing this has increased the CDN payload but it provides backward compatibility again
- #1852 [BUG] Snippet initialization with IE8 fails with minified code (works with un-minified code)
  - This was specific to IE8 usages
- #1076 Refactor code to provide better tree shaking and minification of generated code
  - Final stage which provides automatic name crunching, however, because of the fix for #1857 the CDN package size does not show the full effect of this improvement
- #1860 Address Component Governance issues

## 2.8.4 (Jun 1st, 2022)

- Updates React Plugin to v3.3.4 (with v2.8.4 as dependency) -- using React 17
- Updates React Native Plugin to 2.5.4 (with v2.8.4 as dependency)
- Updates Chrome Debug Extension to 0.3.4

### Changelog

- #198 Run-time Telemetry initializers for Ajax requests
- #176 Single Page Application Page View Tracking
- #1776 How to modify traceflag in traceparent header?
- #1846 Task 7496325: Add Distributed tracing population for the properties for the core
- #1838 [master] Task 14447552: Fix Component Governance vulnerabilities
- #1841 Adding Microsoft SECURITY.MD
- #1845 add readme for ikey error messge
- #1840 add disableIkeyMessage config

## 2.8.3 (May 3rd, 2022)

- Updates React Plugin to v3.3.3 (with v2.8.3 as dependency) -- using React 17
- Updates React Native Plugin to 2.5.3 (with v2.8.3 as dependency)
- Updates Chrome Debug Extension to 0.3.3

This release has been manually validated to work with IE8 both directly and by extending the provided classes. While the previous version 2.8.2 also fully supported IE8 it did not handle classes extending the all of Core classes correctly in multiple cases. If you need to support IE8 it is strongly advised that you upgrade to, validate and use this version.

### Changelog

- #1831 Updates to dynamicProto() v1.1.6 which provides a final edge case fix for IE8
  - [#50](https://github.com/microsoft/DynamicProto-JS/issues/50) [IE8] Fix in 1.1.5 only handles 2 levels of dynamically nested classes
- #1828 Update README.md to redirect to Node.JS
- #1829 Extracting HOC tracked component class base for re-use
- #1804 [BUG] Error type in AppInsightsErrorBoundary after upgrading to react 18

## 2.8.2 (May 2nd, 2022)

- Updates React Plugin to v3.3.2 (with v2.8.2 as dependency) -- using React 17
- Updates React Native Plugin to 2.5.2 (with v2.8.2 as dependency)
- Updates Chrome Debug Extension to 0.3.2

This patch release restores complete ES3 support (broken in 2.8.0) and IE8 support (broken eariler via dynamicProto()) for the Sdk.

### Changelog

- #1822 [BUG] v2.8.1 with a Hosted IE environment fails to initialize for a hosted instance of IE #1822 (#1824)
- #1823 [BUG] IE8 Support was broken by several components #1823
- Also updates to dynamicProto() v1.1.5 to restore IE8 support

## 2.8.1 (Apr 22nd, 2022)

- Updates React Plugin to v3.3.1 (with v2.8.1 as dependency) -- using React 17
- Updates React Native Plugin to 2.5.1 (with v2.8.1 as dependency)
- Updates Chrome Debug Extension to 0.3.1

This patch release restores TypeScript 3.x support for the Sdk.

### Changelog

- #1807 [BUG] Angular project doesn't build after install latest version v.2.8.0
- #1810 v2.8.0 has incompatible TypeScript 3.x type declaration
- #1812 [BUG] Browser exceptions are no longer automatically tracked after 2.8.0
- #1814 [BUG]SPFx React project doesn't build after latest version of @microsoft/application-insights-core-js v.2.8.0 got published

## 2.8.0 (Apr 16th, 2022)

- Updates React Plugin to v3.3.0 (with v2.8.0 as dependency) -- using React 17
- Updates React Native Plugin to 2.5.0 (with v2.8.0 as dependency)
- Updates Chrome Debug Extension to 0.3.0

### Potential Breaking Change

- `fetch` Ajax tracking was also been change to be on by default from this version moving forward, if you are running in an environment without `fetch` support and you are using an incompatible polyfill (that doesn't identify itself as a polyfill) or the SDK you start seeing recursive or duplicate (`fetch` and `XHR` requests) being reported you WILL need to add `disableFetchTracking` with a value of `true` to your configuration to disable this functionality.
- TypeScript 4.x required for some typings from the core EnumHelperFuncs.d.ts  (Fixed in v2.8.1)

### Significant changes

This release adds support for the SDK to

- TelemetryInitializers have been moved to `BaseCore` so they are now available as part of all Sku's and not just those using the `analytics` plugin (@microsoft/applicationinsights-analytics-js) using the `appInsights.addTelemetryInitializer(...)`
- Web Events (addEventHandler) now support "event namespaces" (similar to jQuery) to enable the removing of events by just specifying the namespace and new specific `eventOn(...)` and `eventOff(...)` API's.
- Fully unload, removing all internal event handlers (may be re-initialized) via the `appInsights.unload(...)` function.
- Dynamically add a plugin to an already initialized SDK (optionally replacing an existing) via new `appInsights.addPlugin(...)` function
- New helper to get any plugin from an initialized SDK via `appInsights.getPlugin("...identifier...")`
- Dynamically remove a plugin via the `appInsights.getPlugin("...identifier..").remove()`
- Enable / Disable any plugin (even if the plugin doesn't support disabling itself) via `appInsights.getPlugin("...identifier...").setEnabled(true/false)`
- The standard name fro the `analytics` plugin @microsoft/applicationinsights-analytics-js has been renamed and is now exported as `AnalyticsPlugin`, for backward compatibility it is also exported as it's previous name `ApplicationInsights`, if you are using it directly it is recommended that you update to use the new exported name.

While this release contains a substantial amount of additional functionality and code, there has also been significant minification efforts (which also drove some of the SDK naming) to keep the minified code around the same size. We intend to keep working on additional improvements to attempt to bring the size changes down further. However, the minification improvements do generally cause a lower level of GZip compression most because of the removal of duplicate names. The main readme for the [AISKU](https://github.com/microsoft/ApplicationInsights-JS/tree/master/AISKU) has a table of the CDN base SKU sizes, as the CDN version includes all public API's (older versions for backward compatibility and newer smaller versions) when using NPM you should see smaller sizes than those shown.

> Note:
> Due to the above changes required to support the above, there may be some minor TypeScript Type compatibility warnings when you attempt to use components from v2.8.0 with older SDK's (forward compatibility), backward compatibility, using Core v2.8.0 with older components is supported and v2.8.0 is completely backward compatible. This is due to some API's now support both older (for back compat) and new enhanced arguments, we have attempted to keep these changes to a minimum.
> If you are getting typing errors such as "Argument of type 'XXXXX' os not assignable to parameter of type 'YYYY'", please ensure that you are using all v2.8.0 components and raise an issue if this does not resolve you issue. As a work around casting to work around this warning should not cause any issues.

> Due the the size of this change, the above date is the NPM release date and CDN deployment will be over an extended period.

### Changelog

- Task 13064945: Enable the option to remove all "added" SDK event listeners as part of calling teardown()
  - Partial, foundational support for #1427 Dynamically updating config (for extensions in my case)
- #1773 [BUG] IConfig and IConfiguration define different configuration "names" for the cookie manager config 
- #1779 Allow including custom properties in useTrackMetric
- #1791 Merge remote-tracking branch `upstream/beta` into `master`
  * Update version update script to support default "next" release version (major/minor) not just patch (#1756)
  * Additional Performance enhancements to use provided functions rather than internal polyfill's (#1758)
  * Enable GitHub Actions on [beta] branch
  * Beta Part 1: Part of Mega Dynamic Load/Unload support (#1766)
    - Refactor TelemetryPluginChain ready to start supporting load/unload
    - Move TelemetryInitializer to BaseCore
    - add getPlugin (will be used for remove)
    - Address Channel flush issue
  * Additional Performance enhancements to use provided functions rather than internal polyfill's (#1758)
  * Beta Part 2: Part of Mega Dynamic Load/Unload support (#1768)
    - Add Event Namespace support
    - Minification of constant values
    - Add part of the unload functionality (required for unified `teardown()` functionality)
  * Beta Part 3: Part of Mega Dynamic Load/Unload support (#1780)
    - Add Core SDK Unload support
  * Fix telemetry chain for null and undefined
  * Beta Part 4: Part of Mega Dynamic Load/Unload support (#1781)
    - Fix function typing issues
    - Update Analytics Extension to start supporting teardown / unload (more tests required)
    - Adds namespace option to instrumentation hooks (for debugging teardown issues)
    - Update AITest Class to log and optionally assert events and hooks that have not been removed
    - Add Update callback when plugins are added / removed (will be extended for config updates)
    - Some minor minification improvements
  * Add missing enum definition
  * Update Sender tests
  * Beta Part 5: Part of Mega Dynamic Load/Unload support (#1782)
    - Add Missing Exports
    - AnalyticsPlugin: Implement teardown and initial test validation
    - Dependencies Plugin: Implement teardown and initial test validation
    - Add flush() to IAppInsightsCore
  * AI Beta: Minor bug fixes and additional debug info (#1787)
  * Lint fixes: Enable Automatic formatting fixes (#1788)
  * Beta Part 6: Part of Mega Dynamic Load/Unload support (#1782) (#1789)
    - Add basic minimal unload / teardown support to all remaining components
    - Update rollup cleanup dependencies
  * Beta: Component Governance Updates to address known dependency issues (#1790)
- #1793 Master Minification Improvements
- #1796 Minification - Change to only use const enums internally
- #1798 More Common Minification Updates
- #1468 Enable fetch automatic dependency tracking by default
- #1805 Finalize and Update the processTelemetry helper functions

## 2.7.4 (Feb 28th, 2022)

- Updates React Plugin to v3.2.4 (with v2.7.4 as dependency)
- Updates React Native Plugin to 2.4.4 (with v2.7.4 as dependency)
- Updates Chrome Debug Extension to 0.2.4

This release is primarily a performance improvement release where we will now use any built in (or provided polyfill) function
over the internal polyfills for

- String trim()
- String endsWith()
- String startsWith()
- Additional Date toISOString()
- Array isArray()
- Array indexOf()
- Array map()
- Array reduce()
- Object freeze()
- Object seal()

### Changelog

- #1754 update react plugin readme
- #1758 Additional Performance enhancements to use provided functions rather than internal polyfill's

## 2.7.3 (Jan 31st, 2022)

- Updates the @microsoft/applicationinsights-shims module to 2.0.1
- Updates React Plugin to v3.2.3 (with v2.7.3 as dependency)
- Updates React Native Plugin to 2.4.3 (with v2.7.3 as dependency)
- Updates Chrome Debug Extension to 0.2.3

### Changelog

- #1735 [BUG] Dependency tracking is disabled when using an Embedded IE browser control
- #1736 [BUG] New Fetch keepAlive support can cause duplicate events to be sent during unload processing
- #1745 [Documentation] Document the deployed Module formats and release process
- #1746 [Documentation] Update AISku Size tracking
- #1744 Address CodeQL issues from https://github.com/microsoft/ApplicationInights-JS/security/code-scanning 
- Update to Rush 5.61.3 and NPM 8.4.0
- #1750 [Performance] Use the Date.toISOString() native function if it exists
- #1753 [Performance] Cache the result of the getGlobal() to reduce the number of typeof expressions

## 2.7.2 (Dec 7th, 2021)

### Changelog

- #1729 [BUG] Addition of stdDev metric support has broken custom metric reporting from #1680
- #1727 [BUG] Cannot track exception from service worker
- #1731 Component Governance - Upgrade to npm v8.1.4

## 2.7.1 (Nov 4th, 2021)

### Changelog

- #1667 Allow properly disposing AI
  - expose internal log poller #1674
- #1683 Add support to optionally configure the events used for detecting and handling when page unload and flushing occurs
- #1655 [BUG] When using Multiple instances of AI only the first instance is correctly reporting ajax events
- #1093 "Pause" sending of messages
- #1692 [BUG] Field 'ai.operation.name' on type 'ContextTagKeys' is too long. Expected: 1024 characters"
- #1691 [BUG] Multiple errors are getting thrown and swallowed during initialization when no instrumentation Key is provided
  - DiagnosticLogger: Fix typo in defining the console function #1699
- #1676 React Plugin trackTrace method
  - add trackTrace and expose analytics extension to react plugin #1697
- #1680 [BUG] trackMetric does not track stdDev nor sum #1701
- fix readme traceID generate method #1687
- Update package.json to include the repository #1696
- Governance Updates -- update used dependencies #1694
- Refactor publishing script to combine shared content and support separate nightly container. #1677
- Enable EsLint auto fixing rules for extra-semicolons, dangling commas and tailing spaces #1669
- Update Perf Mark and Measure documentation and some exports #1666
- Update Release script to provide better automated creation of nightly builds #1664

## 2.7.0 (Sept 7th, 2021)

___Major change___: Upgrades build environment to TypeScript __4.x__
- No known breaking, configuration or definition changes

### Changelog

- #1640 [BUG] enableAjaxErrorStatusText: false (which is the default setting) does not turn off logging error response body
- #1642 trackEvent() doesn't allow replacing the iKey
- #1647 [BUG] customProperties parameter missing from trackException function
- #1648 Update error reporting when a plugin throws an exception
- #1650 [DebugPlugin] Add an option to disable DebugPlugin processTelemetry logging
- #1653 Some requests are returning a CORB error for responses containing text content type
  - The warning is only being reported via the sendBeacon request, therefore not loss of events
  - Changes the 'unload' operations to try and use fetch with keepalive if available, fallsback to sendBeacon()
  - Also attempts to send as manay events as possible via sendBeacon, when the payload size is > 64kb
- #1656 [BUG] 'Cannot use 'in' operator to search for 'ver' in Timeout', name: 'TypeError'}​​​​​
- #1660 [BUG] ITelemetryTrace parentId cannot be set to undefined

Includes: [2.7.0-beta.1 Milestone](https://github.com/microsoft/ApplicationInsights-JS/milestone/54)

- #1171 ___Update to TypeScript 4.x___
- #1526 [TypeScript Compile Error] Property 'sessionManager' does not exist on type 'ITelemetryContext'
  - #1627 Add sesId to allow access to sessionManager session info
- #1471 Convert undefined to blank in customDimensions?
  - #1630 Convert undefined custom properties to empty string
- #1585 ai_user cookie not present after re-enabling the cookie
- #1561 How to enrich dependencies logs with context at the beginning of api call?
  - #1624 Provide a way to enrich dependencies logs with context at the beginning of api call
- #1633 Add GitHub Automated Lock closed issue action

### New feature (may be release after primary release - out of band)

- #617 Add performance.mark and performance.measure for performance browser tool integration

### <span style='color:blue'>2.7.0-beta.1</span> (August 24th, 2021)

- #1171 ___Update to TypeScript 4.x___
- #1526 [TypeScript Compile Error] Property 'sessionManager' does not exist on type 'ITelemetryContext'
  - #1627 Add sesId to allow access to sessionManager session info
- #1471 Convert undefined to blank in customDimensions?
  - #1630 Convert undefined custom properties to empty string
- #1585 ai_user cookie not present after reenabling the cookie
- #1561 How to enrich dependencies logs with context at the beginning of api call?
  - #1624 Provide a way to enrich dependencies logs with context at the beginning of api call
- #1633 Add GitHub Automated Lock closed issue action

### Update React plugin to <span style='color:blue'>v3.2.0-beta.1</span>

- Update Core dependency to v2.7.0-beta.1 Core changes

### Update React Native plugin to <span style='color:blue'>v2.4.0-beta.1</span>

- Update Core dependency to v2.7.0-beta.1 Core changes

## 2.6.5 (August 3rd, 2021)

[2.6.5 Milestone](https://github.com/microsoft/ApplicationInsights-JS/milestone/53)

## Changelog

- #1608 [BUG] empty messages for unhandled promise rejections
- #1610 [BUG] error logging an error--need to null-check reason
- #1621 [Task] Create and publish Sub Resource Integrity (SRI) hashes for the generated scripts
- #1607 Remove AngularPlugin code from master and direct to new repo and angularplugin-legacy branch
- #1606 Split Tests into Unit / Perf and update all active tests to use common test project
- #1613 Update Dependencies
- #1617 Add Stale Issue / PR GitHub Action

### Update React plugin to v3.1.5

- Update Core dependency to ^2.6.5 Core changes

### Update React Native plugin to v2.3.5

- Update Core dependency to ^2.6.5 Core changes

## 2.6.4 (July 6th, 2021)

[2.6.4 Milestone](https://github.com/microsoft/ApplicationInsights-JS/milestone/52)

## Changelog

- #1567 [BUG] Unit of "PageVisitTime" is well hidden
- #1579 Add 307 Redirect Response
- #1580 [BUG] URL without host fails in CanIncludeCorrelationHeader
- #1586 [BUG] namePrefix is not getting assigned to ai_user Cookie
  - #1587 ai_user cookie should use userCookiePostfix for user cookie storage
- #1590 Task 9901543: Remediate security vulnerabilities (Build Dependencies)
- #1596 Apply the eslint fixes (from Component Governance policy Checks)
- #1597 [BUG] The Pointer Events for the DebugPlugin are getting blocked
- #1599 Add visibilitychange event to the set of events tracked for triggering page unload
- #1602 [BUG] DebugPlugin - helpers.js:334 Uncaught TypeError: Cannot convert a Symbol value to a string
- #1472 [Enhancement] Add config to exclude a specific request auto tracking
- #1446 [FEATURE REQUEST] Ability to stop requests being tracked for array of domains

### Update React plugin to v3.1.4

- Update Core dependency to ^2.6.4 Core changes

### Update React Native plugin to v2.3.4

- Update Core dependency to ^2.6.4 Core changes

## 2.6.3 (June 8th, 2021)

[2.6.3 Milestone](https://github.com/microsoft/ApplicationInsights-JS/milestone/50)

### Changelog

- #1268 Investigate and add a sender that uses fetch when XMLHttpRequest is not available
- #1545 Cannot modify the request headers and cookies when using a custom endpoint
- #1546 [Typings] Update the TypeScript typings to identify the readonly properties/fields and dynamic values of the snippet
- #1541 ITelemetryContext.user is sometimes null - setAuthenticatedUserContext throws
- #1569 [BUG] Authorization header included when enableRequestHeaderTracking is enabled
  - As part of this change the ["Authorization", "X-API-Key", "WWW-Authenticate"] headers will NO longer be logged when ```enableRequestHeaderTracking``` is enabled, if you want these headers to be sent to AzureMonitor you will need to override the default ```ignoreHeaders``` config which excludes them (See the [Configuration settings](https://github.com/Microsoft/ApplicationInsights-JS#configuration)).
- #1558 [BUG] Durations reported as zero (00:00:00.000) in Angular SPA for router changes
- #363 Script error: Browser exception message not providing information type and method
- #1568 Add VSCode specific exclusions
- #1572 Task 9901543: Remediate security vulnerabilities

### Update React plugin to v3.1.3

- Update Core dependency to ^2.6.3 Core changes
- Update DynamicProto version 1.1.4 (Removes unnecessary dependencies)

### Update React Native plugin to v2.3.3

- Update to React-Native 0.64.2
- Update Core dependency to ^2.6.3 Core changes
- Update DynamicProto version 1.1.4 (Removes unnecessary dependencies)

## 2.6.2 (April 22nd, 2021)

[2.6.2 Milestone](https://github.com/microsoft/ApplicationInsights-JS/milestone/49)

### Changelog

- #1536 Update DynamicProto version 1.1.2 (Fixes IE7 mode issue originally reported in #1534)
- #1280 Investigate removing the globals __extends() and __assign() populated by applicationinsights-shims
- #1523 Remove exposing global instances of __extends() and __assign() and update sideEffects usage (by removing globals)
- #1538 [BUG] Telemetry Buffer Getting Cleared in Offline Mode - Online Status Incorrectly Initialized in Offline Listener
- #1528 [BUG] correlationHeaderExcludePatterns is not honored in Ajax calls
- #1516 [BUG] App insight library will flush telemetry using beforeUnload event but this event is cancellable
- #1509 [BUG] Investigate changing the sideEffects: false to list only the files that include the shims module from the all AI modules so that webpack can evaluate correctly
- #1517 [BUG] addHousekeepingBeforeUnload should also be listening to the 'unload' event
- #1524 [BUG] Config items are not functional for current snippet disableFlushOnBeforeUnload, disableFlushOnBeforeUnload and maybe others
- #1440 [BUG] PageViewPerformanceManager.populatePageViewPerformanceEvent() is always returning zero for the network time
- #1393 [BUG] enableAutoRouteTracking should also update the Operation Name with the hashroute
- [BUG] Add test coverage for #1518
- #1510 Update PageView operation name to include the hash
- #1522 add click plugin version to sdkversion tag
- #1535 add click plugin js to cdn

### Update React plugin to v3.1.1 (April 26th, 2021)

- Update Core dependency to ^2.6.2 Core changes
- Update Shims dependency to ^2.0.0 (to address the __extends() and __assign()) issue
- #1536 Update DynamicProto version 1.1.2 (Fixes IE7 mode issue originally reported in #1534)

### Update React Native plugin to v2.3.1

- Update Core dependency to ^2.6.2 Core changes
- Update Shims dependency to ^2.0.0 (to address the __extends() and __assign()) issue
- #1536 Update DynamicProto version 1.1.2 (Fixes IE7 mode issue originally reported in #1534)

## 2.6.1 (Hotfix - March 30th, 2021)

[2.6.1 (Hotfix) Milestone](https://github.com/microsoft/ApplicationInsights-JS/milestone/48)

### Changelog

- #1518 P1 - [BUG] v2.6.0 is not re-hydrating the automatic session id correctly for each request
- #1512 Expose the getCookieMgr() on the snippet proxy and analytics web instances

## 2.6.0 (March 23rd, 2021)

[2.6.0 Milestone](https://github.com/microsoft/ApplicationInsights-JS/milestone/47)

### Version bump is due to the following major changes

A large amount of [Tree-Shaking improvements](https://github.com/microsoft/ApplicationInsights-JS#tree-shaking-support-and-enhancements) have been included in this version, please [see the recommendations](TreeShakingRecommendations.md) you may need to apply to your code to take complete advantage of these changes to reduce the overall module sizes (when using NPM packages)

Also includes major changes to the cookie management, please [see the readme cookie configuration section](https://github.com/microsoft/ApplicationInsights-JS#icookiemgrconfig) and [cookie handling changes](https://github.com/microsoft/ApplicationInsights-JS#cookie-handling).

### Changelog

- General Performance improvements / optimizations
- #1059 Enable W3C distributed tracing on by default with backward compatibility
- #1076 Multiple Treeshaking enhancements, [see recommendations](TreeShakingRecommendations.md)
- #1091 Enable cookie support after the SDK has been initialized
- #1125 Disable Cookies
- #1276 [BUG] Does not work with Closure Compiler (possible fix, now generates `applicationinsights-web.d.ts` (This version is namespaced) and `applicationinsights-web.rollup.d.ts` in the dist folder
- #1434 Ability to specify cookie Path so that AI works behind App Gateway
- #1473 [BUG] New dts gneration doesn't work when the environment doesn't have powershell (introduced for #1276)
- #1474 Add initial stamp endpoint redirection logic
- #1478 [Bug] Ajax tracking for XHR and fetch is not always setting the start time correctly
- #1496 [BUG] applicationinsights-web npm package does not have types or a types folder.
- #1498 [BUG][ES6] TypeError: xxx is not a function or TypeError: DynamicProto [XXXX] is not in class heirarchy of [Object] #28
- #1503 [BUG] New Perf tests are randomly failing when the build environment is busy (tests added as part of #1076 and #1091)
- Some documentation updates

### Update React plugin to v3.1.0

- Update Core dependency to ^2.6.0 Core changes
- #1470 Update applicationinsights-react-js to react 17

### Update React Native plugin to v2.3.0

- Update Core dependency to ^2.6.0 Core changes

## 2.5.11 (January 15th, 2021)

[2.5.11 Milestone](https://github.com/microsoft/ApplicationInsights-JS/milestone/46)

### Changelog

- #1452 [BUG] v2.5.10 Snippet Initialization fails to redirect proxied functions -- causing terminal exception
- #1433 Typo in 'disableInstrumentaionKeyValidation' config property.

### Update Click Analytics plugin to v2.5.11

- Update Core dependency to ^2.5.11 Core changes
- #1441 [BUG] Fix issues based on pageName,clickevent name and improved the way we collect useful telemetry data
- Updated Docs


## 2.5.10 (November 16th, 2020)

[2.5.10 Milestone](https://github.com/microsoft/ApplicationInsights-JS/milestone/45)

### New extension @microsoft/applicationinsights-clickanalytics-js

Provides the ability to gather telemetry in Web pages to automatic track clicks using data meta tags.

### Changelog

- #1420 Fix issues with for..in usage with prototype extension libraries like ember.js and prototype.js
- #1417 Adding nuspec for new Snippet nuget package
- #1415 Update Publishing scripts to allow different container names -- replaces the cdn switch #1415
- #1411 [BUG] - License file link is invalid #1411
- #1410 Remove mention of resolution in Device Information
- #1408 Update publish scripts to support a sub-container
- #1409 Initial release of new Click Analytics Plugin
- #1407 Adding logger during core constructor
- #1403 [Feature Request] Snippet - Add an easier way to inject queue items as part of the snippet config (version 5 of snippet)
- #1402 [BUG] "ReferenceError: method is not defined" from 2.5.5+
- #420 CDN endpoint

### Update React plugin to v3.0.5

- Update Core dependency to ^2.5.10 Core changes

### Update React Native plugin to v2.2.9

- Update Core dependency to ^2.5.10 Core changes

## 2.5.9 (October 5th, 2020)

[2.5.9 Milestone](https://github.com/microsoft/ApplicationInsights-JS/milestone/44)

### Changelog

- #1395 Update publishing scripts to support automation
- #1391 Increase the randomness and size of the sessionId (newId())
- #1390 using older version of types/cheerio dependecy
- #1389 take out SPO support
- #1388 Bump shims version for React, React-Native and Angular to latest.
- #1384 Add sideEffects field to applicationinsights-shims package.json
  - Use updated Shims module (v1.0.2)
- #1381 [BUG] NPM package for @microsoft/applicationinsights-angularplugin-js does not have a dist folder
- #1377 [BUG] Session storage buffers being initialized though configured not to use
- #1375 Make AI JS SDK for with NativeScript-Angular
  - Use updated Shims module (v1.0.1)
- #1374 indexof is wrongly cased
- #1365 correlationHeaderExcludePatterns added to IConfig
- #1364 [BUG] PerfManager and NotificationManager are not exported in AISKU
- #1363 [BUG] correlationHeaderExcludePatterns missing from types
- #1361 Debug plugin readme changes
- #1359 Add trackMetric method for Angular plugin
- #1358 Add snippet setup for SPO extension solution and update README

### New Package applicationinsights-shims v1.0.2

- #1384 Add sideEffects field to applicationinsights-shims package.json

### New Package applicationinsights-shims v1.0.1

- #1375 Make AI JS SDK for with NativeScript-Angular

### Update React plugin to v3.0.4

- Update Core dependency to ^2.5.9 Core changes

### Update React Native plugin to v2.2.8

- Update Core dependency to ^2.5.9 Core changes

## 2.5.8 (August 31st, 2020)

[2.5.8 Milestone](https://github.com/microsoft/ApplicationInsights-JS/milestone/43)

### Changelog

- #1356 add documentation on how to make snippet changes
- #1355 update angular package name
- #1350 [BUG] The new IPerfEvent is using Date.now() which is not supported in an ES3 environment
- #1349 Update angular plugin track pageview logic and test
- #1343 [BUG] IPerfManager interface - the create() function is defined to return an IPerfEvent and not an IPerfEvent?
- #1340 Instrumentation Key validation
- #1018 Error Mismatched anonymous define() module
  - #1352 add .cjs.js and .cjs.min.js

### Update applicationinsights-rollup-es3 to v1.1.3

- #1350 [BUG] The new IPerfEvent is using Date.now() which is not supported in an ES3 environment
  - Added additional checks for Date.now() and Performance Api perf.now()

### Update React plugin to v3.0.3

- Update Core dependency to ^2.5.8 Core changes

### Update React Native plugin to v2.2.7

- Update Core dependency to ^2.5.8 Core changes

## 2.5.7 (August 7th, 2020)

[2.5.7 Milestone](https://github.com/microsoft/ApplicationInsights-JS/milestone/42)

### Changelog

- #1335 Add Performance / Testing support
  - Added IPerfManager and IPerfEvent interfaces to allow performance review / monitoring of the internal operations
  - [Performance Manager Documentation](./docs/PerformanceMonitoring.md)
- #1334 [BUG] Getting XMLHttpRequest and XDomainRequest is not defined errors for gatsby environment
- #1333 [BUG] DebugPlugin various updates
- #1331 AppInsightsCore: Enable setting NotificationManager during initialization
  - #1076 Refactor code to provide better tree shaking and minification of generated code
  - Updated Sender and support classes to move all private properties and methods into constructor closure
- #1328 applicationinsights-debugplugin-js: fixed various issues and updating to beta-2
- #1323 Add Retry as a SendRequestReason
- #1324[BUG] Type 'ReactNativePlugin' is not assignable to type 'ITelemetryPlugin'
  - Refactored the Plugin to extend BaseTelemetryPlugin (part of the #1076 work)
- #1321 [BUG] @microsoft/applicationinsights-web fails to initialize with latest version
- #1319 fix incorrect references to configuration parameter names
- #1316 Update dependency version of DynamicProto
  - Move all private properties and methods into constructor closure
  - #1316 Update dependency version of DynamicProto

### Updated React plugin to v3.0.2

- Update Core dependency to ^2.5.7 Core changes
- #1335 Add Performance / Testing support
  - Added IPerfManager and IPerfEvent interfaces to allow performance review / monitoring of the internal operations 
  - [Performance Manager Documentation](./docs/PerformanceMonitoring.md)

### Updated React Native plugin to v2.2.6

- Update Core dependency to ^2.5.7 Core changes
- #1335 Add Performance / Testing support
  - Added IPerfManager and IPerfEvent interfaces to allow performance review / monitoring of the internal operations 
  - [Performance Manager Documentation](./docs/PerformanceMonitoring.md)
- #1324 [BUG] Type 'ReactNativePlugin' is not assignable to type 'ITelemetryPlugin'
  - Refactored the Plugin to extend BaseTelemetryPlugin (part of the #1076 work)
- #1076 Refactor code to provide better tree shaking and minification of generated code
  - Move all private properties and methods into constructor closure
  - #1316 Update dependency version of DynamicProto

## 2.5.6 (Jul 6th, 2020)

[2.5.6 Milestone](https://github.com/microsoft/ApplicationInsights-JS/milestone/40)

### New (Beta) extension applicationinsights-debugplugin-js

- Created the initial extension to help developers understand, track, visualize and fix issues with events
- This extension injects a UI onto your page details for the component is available at https://github.com/microsoft/ApplicationInsights-JS/tree/master/extensions/applicationinsights-debugplugin-js
- This is a beta release so the UI, config etc are not yet complete, feedback for features, suggestions or changes are welcome -- please create an Issue
- The detailed view is still under construction and contains known bugs, these will be address in the next few months (releases) as we build out the module. We had not originally planed to have any detailed view as part of this initial beta release.

### Changelog

- #1311 Allow the generated modules to extend the namespace defined by "name" in rollup config -- rather than always replace.
  - Changes the way the "Microsoft.ApplicationInsights" is defined for each module to all modules to be added to the same namespace
- #1309 When using prototype js the SessionStorage become corrupted causing requests internal exceptions
- #1303 Task 7027291: Investigate CDN Configuration to support custom domain (automate CDN deployment scripts)
- #1299 Releasing core queue as soon as possible (fixes lost events from page load immediate unload with no additional events)
- #1297 Created initial applicationinsights-debugplugin-js
- #1289 [Documentation] doc: SPO set up instruction
- #1286 [Documentation] Update JS SDK Snippet documentation with bug fixes (new v4 snippet)
- #1283 [BUG] (Snippet v3) AppInsights stub methods captured incorrect method names in the closure
- #1262 [BUG] Custom properties added with addTelemetryInitializer are ignored for exceptions
- #1245 React Native - AI (Internal): 19 message: "Could not add handler for beforeunload and pagehide"
  - Add isReactNative() function for detecting the runtime environment
- #1095 Add an Error Boundary to the React plugin
- #1089 Blocking certain URIs/Patterns from fetch tracking (patch included)
  - Added new config 'correlationHeaderExcludePatterns' to allow disabling correlation headers using regular expressions

### Updated React plugin to v3.0.1

- #1311 Allow the generated modules to extend the namespace defined by "name" in rollup config -- rather than always replace.
  - Changes the way the "Microsoft.ApplicationInsights" is defined for each module to all modules to be added to the same namespace

### Update applicationinsights-rollup-es3 to v1.1.2

- #1311 Allow the generated modules to extend the namespace defined by "name" in rollup config -- rather than always replace.

## 2.5.5 (Jun 2nd, 2020)

[2.5.5 Milestone](https://github.com/microsoft/ApplicationInsights-JS/milestone/39)

### Updated React plugin to v3.0.0

- Updated to TypeScript 3.x
- Removed React plugin from main rush pipeline
- #991 Don't work with React HOOKS
  - #1120 Introducing React Hooks for AppInsights #1120

### New Package applicationinsights-shims v1.0.0

- Created to remove dependency on TSLib as v 1.13.0 has introduced build breaks
  - provides internal implementation of __extends() and __assign() when no pre-existing version is present

### Changelog

- #1278 Add optional 'eventsSendRequest' notification to NotificationManager
- #1269 TsLib v1.13.0 has breaking change (Remove dependency on TSLib)
  - Added new package **'applicationinsights-shims@1.0.0'**
- Removed React plugin from main rush pipeline
- #991 Don't work with React HOOKS
  - #1120 Introducing React Hooks for AppInsights #1120
- #1274 Fix for withAITracking wrapping functional components.
- Using crypto to generate GUIDs when available (Make GUID more random)
- #1260 [BUG] Can't include Correlation Header on IE can fail
- #1258 Update snippet to support reporting script load failures
- #1251 [BUG] ajax.ts is using string trim() which is not supported on IE7/8
- #1249 Identify whether the script is being consumed via the CDN or NPM package
- Several minor documentation updates

## 2.5.4 (Apr 7th, 2020)

[2.5.4 Milestone](https://github.com/microsoft/ApplicationInsights-JS/milestone/37)

### Changelog

- #1242 Upgrading the tslib dependency to 1.11.1
- #1233 [BUG] Duplicate React dependency
- #1232 [BUG] window.appInsights.properties is marked private
  - Fix issue by always exposing window.appInsights.context
- #1240 [BUG] Telemetry correlation headers are not included for all fetch requests
- #1229 [BUG] Unable to include telemetry correlation headers
- #1227 SPFX - undefinedundefined is not defined
- #1221 npm @microsoft/applicationinsights-web: license information missing in package.json
- #1191 [BUG] ICustomProperties does not support setting values

## 2.5.3 (Mar 25th, 2020)

[2.5.3 Milestone](https://github.com/microsoft/ApplicationInsights-JS/milestone/38)

### Changelog

- #1224 [BUG] When running in IE7/8 the app insights doesn't initialize and gets stuck in a loop (long running script)

## 2.5.2 (Mar 11th, 2020)

### Changelog

- #1217 [BUG] App Insights fails when the XHR object is not extensible (or frozen)
- #1186 [BUG] App Insights initialization setting 'enableAjaxErrorStatusText is not working #1218

## 2.5.1 (Mar 9th, 2020)

### Changelog

- #1210 [BUG] Typescript error when using @microsoft/applicationinsights-web 2.5.0 and "noImplicitAny"/"strict" option
- #1207 [BUG] The latest version 2.4.4 cannot connect front-end with back-end on the Application Map on Application Insights

## 2.5.0 (Mar 9th, 2020)

### Changelog

- #1204 When a fetch polyfill is installed there reporting endpoint is also causing events to be sent
- #1202 ai_user and ai_session cookies not set #1203
- #1201 add to auto track exceptions in react native plugin
- #1199 Build is breaking when you do a "rush update --full --purge --recheck" due to tslib v1.11.0 update
- #1194 XHR/Fetch enhancement - add additional telemetry from window.performance #1195
- #1193 add sanitizer for operationName
- #1189 Add the option to specify the refUri with stopTrackPage #1190
- #1186 App Insights initialization setting 'enableAjaxErrorStatusText' is not working #1187

#### XHR/Fetch enhancement

Adds additional performance data derived from the window.performance.getEntries() for the fetch or XHR request.

Configuration options
| Name | Default | Description |
|------|---------|-------------|
| enableAjaxPerfTracking | false | Default false. Flag to enable looking up and including additional browser window.performance timings in the reported ajax (XHR and fetch) reported metrics. 
| maxAjaxPerfLookupAttempts | 3 | Defaults to 3. The maximum number of times to look for the window.performance timings (if available), this is required as not all browsers populate the window.performance before reporting the end of the XHR request and for fetch requests this is added after its complete.
| ajaxPerfLookupDelay | 25 | Defaults to 25ms. The amount of time to wait before re-attempting to find the windows.performance timings for an ajax request, time is in milliseconds and is passed directly to setTimeout().

#### Auto track exception React Native Plugin

This has been enabled by default in the updated version.
It can be disabled by adding the ```disableExceptionCollection``` config value with a value of true.

## 2.4.4 (Feb 5th, 2020)

### Changelog

- #1182 Fix error TS2430: Interface 'Window' incorrectly extends interface 'WindowEventHandlers'
- #1185 Rollback namespace overwrite change

## 2.4.3

## Changelog

- Syntax error tools/rollup-es3/src/es3/Es3Tokens.ts #1179

## 2.4.2

### ES3 Support

An additional conversion was required for ES3 support as TypeScript was adding a getter for embedding a constant enum into the Common class.

### Changelog

 - #1177 Add additional checks and polyfil for TypeScript get translations for constants

## v 2.4.1...2.4.0

### ES3 Support

With this release the source files can be loaded in an ES3 environment (IE7/8) and send requests to the server. As part of this change you will now receive requests from users using an older browser, prior to this version users using an ES3 base browser will (most likely) have been getting a javascript error, which would have caused no data to be sent.

### Enable support for reusing plugins in multiple instances of AppInsights #1132

We have added upport to enable reusing the same plugin in different instances of AppInsights, owned by the same application (but using different Instrumentation keys) is required so that they can reuse a single Plugin instance for all instances.

This changes introduces a new [`IProcessTelemetryContext`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IProcessTelemetryContext.html) interface that is passed to the processTelemetry() method so that the plugins can use the current request context for the event rather than the context during initialization.

To assist with creating plugins we have also introduced a base class that you can use for creating new plugins [BaseTelemetryPlugin](https://github.com/microsoft/ApplicationInsights-JS/blob/master/shared/AppInsightsCore/src/JavaScriptSDK/BaseTelemetryPlugin.ts), details are included on the [Readme](https://github.com/microsoft/ApplicationInsights-JS/blob/master/README.md)

### Changelog

- #1175 [BUG] Typescript build with 2.4.0 breaks #1173
- #1174 Legacy Manage SameSite Cookie Settings #1126
- #1172 Update SameSite logic to handle UserAgents that don't support the attribute
- #1169 Fixup Rollup ES3 plugin package.json
- #1167 Add better support for referencing global objects from a window and web workers
- #1164 add null check for sessionManager
- #1162 [BUG]AppInsights not working in IE7 #1142
- #1161 include response error data
- #1159 Export Common Telemetry classes in Snippet
- #1157 fix: only change SameSite when secure
- #1154 Queue events when track is called and not all extensions are initialized
- #1153 Do not clean telemetryInitializers during initialization
- #1150 Remove interface code from API reference and link
- #1135 fix: dont block corr on empty location host
- #1133 Enable support for reusing plugins in multiple instances of AppInsights #1132
- #1129 fix: console logging not honoring setting
- #1122 fix anchor link
- #1116 Move tslib to sku dependencies
- #1113 [Enhancement] AI is not catching all "Unload" dom events #1080

## v 2.3.1
### Changelog
- #1102 Enable support for IE8
- #1096 Add extra window nullchecks for non-browser environments
- #1105 Fix issue where operation name is overwritten

## v 2.3.0...2.2.4

### Changelog
- #1066 Adds Connection String support
- #1061, #1065,#1067, #1088 misc bug fixes

## v 2.2.4

### Changelog
- #1054 Fix issue with AppInsightsCore refactor

## v 2.2.3
### Changelog
- #1051 Add to call track trace on user init sending browser info to the end point when loggingLevelTelemetry config is on
- #1050 Address issue https://github.com/MicrosoftDocs/azure-docs/issues/39011
- #1049 Fix issue with PageViewPerformance event being sent with undefined name property
- #1041 Add tslint error screening
- #1038 Re-organize repo folders
- #1035 Update to use PerformanceNavigationInterface for supported browsers

## v 2.2.2
### Changelog
- #1030 Fix issue with appId correlation being appended with an incorrect format

## v 2.2.1
### Changelog
- #1015 Update to use beaconSender for page unload when browser supports Beacon API
- #1028 Fix issue where window.location is not defined
- #1021 Fix issue with not parsing correlationContext
- #1020 Disable by default logging to console internal SDK errors. Enable by default logging as telemetry for internal SDK errors

## v 2.2.0
### Changelog
- #946 **Feature**: Adds automatic incoming/outgoing header tracking. *Outgoing header tracking is experimental and may be miss some headers*
- #973 **Feature**: Support propagation of W3C compatible distributed tracing headers
- #983: Fix issue regarding incorrect referrer uri when using `enableAutoRouteTracking`
- #984: Fix issue where adding custom properties/tags would not work in telemetry processors
- #999: Fix IE issue when using `enableAutoRouteTracking`
- #1000

## v 2.1.1
Patch release containing fixes to automatic Single Page Application route change tracking via `enableAutoRouteTracking`

### Changelog
#970 - Fixes #967 #969

## v 2.1.0
### Highlights

#### Source Map Support
> *You do not need to upgrade for drag and drop to work. It will work on all previous and future versions of the javascript (and Node.js) SDK

https://i.imgur.com/Efue9nU.gif
You can now drag and drop your source maps onto your Exception Telemetry in the Azure Portal to unminify your callstack. Please open an issue or use the Feedback button in the Portal if a source map you've uploaded is not working as intended. This is a first iteration and in a future update, your source maps will be automatically unminified.

#### SPA Route Change Tracking
You can set `enableAutoRouteTracking: true` to enable state based route tracking for your Single Page Application (React, Angular, Vue, etc). You do not need to install a separate plugin to use this configuration option.

This setting will cause a new Page View telemetry item to be sent each time your app's route changes (**including** Hash route changes).

### Changelog
- #920 Resolve jest testing issues when using React plugin
- #928 Make analytics plugin have last priority
- #936 Fallback to XHR Sender when beacon sender tries to send >64 KB
- #947 Add SPA route change tracking
- #948 Docs: Source map support
- #952 Re-enable `samplingPercentage` functionality
- #918, #919, #932 #933 #935 #939 #940 #951

## v 2.0.1

### trackException Change
This update has a couple of **non-breaking** API changes. Namely, `trackException` is now consistent with the Node.js SDK. The only change here is the named argument is renamed from **`error`** to **`exception`**. A shim is in place so **any existing usages of `trackException` will still work**, and the old field is marked as optional, so any type-checked files will still "compile". There are no breaking changes with this change, but you are encouraged to use `exception` as your named argument field as error will be deprecated in a future major version.

#### Old
```js
appInsights.trackException({ error: new Error() });
```
#### New
```js
appInsights.trackException({ exception: new Error() });
```

### Correlation Header Domain Whitelisting #869

Second, the ability to only send correlation headers to specific, whitelisted domains is now available as a configuration option , `correlationHeaderDomains`. It accepts an `array` of domain `strings`. Wildcards ("*") are okay. By populating this array, all other domains which your application makes requests to will **not** have correlation headers included. This setting makes it easy to avoid OPTIONS requests to services outside of your control.

You can use the inclusion list and the exclusion list in conjunction with each other to add correlation headers to a particular domain, `example.com`, and at the same time exclude headers from a prefixed version of it, `no-headers.example.com`.

###  Tag Override Change #903

Performing custom tag overrides is now more consistent with all of the other Application Insights SDKs, in that it is modified via a simple key-value dictionary. There are no breaking changes with this update, and if you are setting any tags via the old way, they will still work as they do now. You are encouraged to update them since the old way will be deprecated in a future major version release.

#### Old
```js
var telemetryInitializer = (item) => {
  item.tags.push({ "ai.cloud.role": "My Web App" });
};
appInsights.addTelemetryInitializer(telemetryInitializer);
```
#### New
```js
var telemetryInitializer = (item) => {
  item.tags["ai.cloud.role"] = "My Web App";
};
appInsights.addTelemetryInitializer(telemetryInitializer);
```

### Changelog
#869 - config: add ability to whitelist specific domains for adding correlation headers
#893 - docs: fix sample configuration settings
#899 - common: replace Array.some with Array.forEach to simplify polyfill story, add tests
#902 - snippet: add missing methods to lazy loaders
#903 - tags can now be set with same API as other AI SDKs
#904 - rename IExceptionTelemetry.error --> IExceptionTelemetry.exception
#905 - react: fix plugin causing jest tests to fail
#907 - docs: add mention of how to update current context's operation
#908 - react: remove analytics package dependency
#910 - docs: update context refresh information
#913 - Remove code from adding libVer from extensions
#918 - automatically add `ai.operation.name` tag, add `id` to pageview telemetry
#919 - fix issue with `namePrefix` not affecting send buffers

## v 2.0.0

### Changelog
- #878 Fix issue with missing pageviewperformance
- #881 Change access level of some non-exposed methods
- #883 Allow `id` to be set in `Exception` telemetry
