# Move Layout Plan: AppInsightsCore → otel-core Structure

This document outlines the file reorganization plan to align the MSNev2/AppInsightsCore structure with the MSNev3/otel-core layout. Follow the steps in order to complete the migration.

---

## Prerequisites

> **Required:** The [`MergeCommonToCore-Plan.md`](MergeCommonToCore-Plan.md) must be completed before executing this plan.
>
> This plan assumes:
> - The `src/Common/` folder exists (created by the MergeCommon plan)
> - All internal packages already import from `@microsoft/applicationinsights-core-js`
> - The AppInsightsCommon package is configured as a re-export layer
>
> See [Execution Order](MergeCommonToCore-Plan.md#execution-order) for the complete restructure sequence.

---

## Critical Requirements

### 1. Git History Preservation
**ALL file moves MUST use `git mv` to preserve file history.**

```powershell
# CORRECT - preserves history
git mv "src/JavaScriptSDK/CoreUtils.ts" "src/utils/CoreUtils.ts"

# INCORRECT - loses history (DO NOT USE)
Move-Item "src/JavaScriptSDK/CoreUtils.ts" "src/utils/CoreUtils.ts"
```

### 2. Import Path Updates
After each batch of file moves, ALL import statements must be updated immediately. The repo must remain buildable after every phase.

### 3. BANNED: Deep Path Imports
**NEVER** use imports that reference internal source paths:
```typescript
// ❌ BANNED - Deep path imports into src/ folder structure
import { IDistributedTraceInit } from "@microsoft/applicationinsights-core-js/src/JavaScriptSDK.Interfaces/IDistributedTraceContext";
import { IAppInsightsCore } from "@microsoft/applicationinsights-core-js/src/applicationinsights-core-js";

// ✅ CORRECT - Import from package public API
import { IDistributedTraceInit, IAppInsightsCore } from "@microsoft/applicationinsights-core-js";
```

All public types/interfaces MUST be exported from the package's main entry point.

### 4. BANNED: Internal index.ts Imports
**NEVER** import from index.ts files within the same project. Always import directly from the source file.

The **ONLY** index.ts file that should exist is in the project root (`src/index.ts`). Do not create index.ts files in subdirectories.

```typescript
// ❌ BANNED - Importing from index.ts within the same project
import { CoreUtils } from "./utils/index";
import { DiagnosticLogger } from "../diagnostics/index";
import { IConfiguration } from "./interfaces/ai/index";

// ✅ CORRECT - Import directly from the source file
import { CoreUtils } from "./utils/CoreUtils";
import { DiagnosticLogger } from "../diagnostics/DiagnosticLogger";
import { IConfiguration } from "./interfaces/ai/IConfiguration";
```

**Rationale:**
- Prevents circular dependency issues
- Makes dependencies explicit and traceable
- Improves tree-shaking effectiveness
- Only the root `src/index.ts` should aggregate exports for the public API

### 5. Rush Update Before Building
**This is a Rush-based monorepo.** After making changes to file structures, imports, or dependencies, you MUST run Rush update before attempting to build:

```powershell
# Required before building after structural changes
rush update --recheck --full

# If you encounter dependency issues, use the more aggressive purge option:
rush update --recheck --purge --full
```

**When to run Rush update:**
- After moving source files and updating import paths
- After moving test files
- After modifying package.json dependencies
- Before any `npx grunt` build commands

### 6. Plan Documents Must NOT Be Committed
**The following plan documents are for execution guidance only and MUST NOT be committed as part of the migration:**

- `shared/AppInsightsCore/MOVE_LAYOUT_PLAN.md` (this document)
- `MergeCommonToCore-Plan.md` (root-level merge plan)

These documents contain internal planning details and should be deleted or kept locally after the migration is complete. Do not include them in any pull requests or commits related to the restructure.

---

## Build Pipeline Configuration

### Critical: Browser Output Name Must NOT Change
The browser bundle output name **MUST remain `applicationinsights-core-js`** regardless of the internal entry point renaming. This is essential for backward compatibility with consuming applications.

### rollup.config.js (shared/AppInsightsCore/rollup.config.js)
The rollup configuration separates the internal entry point from the output name:

```javascript
// OLD:
const entryPointName = "applicationinsights-core-js";
// ...
export default createUnVersionedConfig(banner,
    {
        namespace: "Microsoft.ApplicationInsights",
        version: version,
        node: {
            entryPoint: entryPointName,
            outputName: entryPointName
        },
        browser: {
            entryPoint: entryPointName,
            outputName: entryPointName
        },
    },
    [ "applicationinsights-core-js" ],
    false
);

// NEW:
const entryPointName = "index";
const browserOutputName = "applicationinsights-core-js";  // MUST NOT CHANGE
// ...
export default createUnVersionedConfig(banner,
    {
        namespace: "Microsoft.ApplicationInsights",
        version: version,
        node: {
            entryPoint: entryPointName,
            outputName: entryPointName      // Node output uses index
        },
        browser: {
            entryPoint: entryPointName,
            outputName: browserOutputName    // Browser keeps original name
        }
    },
    ["index"],
    false
);
```

**Key Points:**
- `entryPointName = "index"` - Points to the renamed `src/index.ts`
- `browserOutputName = "applicationinsights-core-js"` - **NEVER change this**
- Node output uses `index` (acceptable for npm package consumers)
- Browser output uses `applicationinsights-core-js` (CDN compatibility)

### api-extractor.json (shared/AppInsightsCore/api-extractor.json)
The API extractor configuration points to the generated type definitions:

```json
// OLD:
"mainEntryPointFilePath": "<projectFolder>/build/types/applicationinsights-core-js.d.ts"

// NEW:
"mainEntryPointFilePath": "<projectFolder>/build/types/index.d.ts"
```

This references `index.d.ts` (generated from `index.ts`) which is correct after the rename.

### Root gruntfile.js
The grunt configuration requires THREE changes:

#### 1. Update InternalConstants Path (line ~295)
```javascript
if (pkg['name'] === "@microsoft/applicationinsights-core-js") {
    nameMaps = aiCoreDefaultNameReplacements;
    // OLD: internalConstants = [ "./src/JavaScriptSDK/InternalConstants.ts" ];
    internalConstants = [ "./src/constants/InternalConstants.ts" ];  // NEW
}
```

#### 2. Remove unitTestName from AppInsightsCommon Config (line ~482)
```javascript
// OLD:
"common":               {
                            path: "./shared/AppInsightsCommon",
                            unitTestName: "aicommon.tests.js"
                        },

// NEW - Remove unitTestName (tests moved to AppInsightsCore):
"common":               {
                            path: "./shared/AppInsightsCommon"
                        },
```

#### 3. Disable commontest Tasks (lines ~861-862)
```javascript
// OLD:
grunt.registerTask("commontest", tsTestActions("common"));
grunt.registerTask("common-mintest", tsTestActions("common", true));

// NEW - Empty arrays (tests are now in AppInsightsCore):
grunt.registerTask("commontest", []);
grunt.registerTask("common-mintest", []);
```

### Build Outputs After Migration
After the entry point rename, the build outputs should be:

| Output Type | File Name | Notes |
|-------------|-----------|-------|
| Browser Bundle | `applicationinsights-core-js.js` | **UNCHANGED** - CDN compatibility |
| Browser Bundle (min) | `applicationinsights-core-js.min.js` | **UNCHANGED** |
| Node Entry | `index.js` | Entry point for npm consumers |
| Type Definitions | `applicationinsights-core-js.d.ts` | Generated by api-extractor |

---

## Source Structure Changes

### Previous Structure (`src/`)
```
├── applicationinsights-core-js.ts
├── __DynamicConstants.ts
├── Config/
├── Common/
│   ├── Interfaces/
│   │   ├── Context/
│   │   ├── Contracts/
│   │   └── Telemetry/
│   └── Telemetry/
│       └── Common/
├── JavaScriptSDK/
├── JavaScriptSDK.Enums/
├── JavaScriptSDK.Interfaces/
└── OpenTelemetry/
    ├── attribute/
    ├── enums/
    ├── errors/
    ├── helpers/
    ├── interfaces/
    ├── noop/
    └── trace/
```

### New Structure (`src/`)
```
├── index.ts
├── __DynamicConstants.ts
├── config/
├── constants/
├── core/
├── diagnostics/
├── enums/
│   ├── ai/
│   └── otel/
├── interfaces/
│   ├── ai/
│   │   ├── context/
│   │   ├── contracts/
│   │   └── telemetry/
│   ├── config/
│   └── otel/
│       ├── attribute/
│       ├── config/
│       └── trace/
├── internal/
├── otel/
│   ├── api/
│   │   ├── errors/
│   │   └── trace/
│   └── attribute/
├── telemetry/
│   └── ai/
│       └── Common/
└── utils/
```

---

## Source File Move Tables

### Entry Point
| Source | Target |
|--------|--------|
| `applicationinsights-core-js.ts` | `index.ts` |

### Config (`Config/` → `config/` + `interfaces/config/`)
| Source | Target |
|--------|--------|
| `Config/ConfigDefaultHelpers.ts` | `config/ConfigDefaultHelpers.ts` |
| `Config/ConfigDefaults.ts` | `config/ConfigDefaults.ts` |
| `Config/DynamicConfig.ts` | `config/DynamicConfig.ts` |
| `Config/DynamicProperty.ts` | `config/DynamicProperty.ts` |
| `Config/DynamicState.ts` | `config/DynamicState.ts` |
| `Config/DynamicSupport.ts` | `config/DynamicSupport.ts` |
| `Config/IDynamicWatcher.ts` | `config/IDynamicWatcher.ts` |
| `Config/IConfigDefaults.ts` | `interfaces/config/IConfigDefaults.ts` |
| `Config/IDynamicConfigHandler.ts` | `interfaces/config/IDynamicConfigHandler.ts` |
| `Config/IDynamicPropertyHandler.ts` | `interfaces/config/IDynamicPropertyHandler.ts` |
| `Config/_IDynamicConfigHandlerState.ts` | `interfaces/config/_IDynamicConfigHandlerState.ts` |

### JavaScriptSDK → core/
| Source | Target |
|--------|--------|
| `JavaScriptSDK/AggregationError.ts` | `core/AggregationError.ts` |
| `JavaScriptSDK/AppInsightsCore.ts` | `core/AppInsightsCore.ts` |
| `JavaScriptSDK/AsyncUtils.ts` | `core/AsyncUtils.ts` |
| `JavaScriptSDK/BaseTelemetryPlugin.ts` | `core/BaseTelemetryPlugin.ts` |
| `JavaScriptSDK/CookieMgr.ts` | `core/CookieMgr.ts` |
| `JavaScriptSDK/DbgExtensionUtils.ts` | `core/DbgExtensionUtils.ts` |
| `JavaScriptSDK/InstrumentHooks.ts` | `core/InstrumentHooks.ts` |
| `JavaScriptSDK/NotificationManager.ts` | `core/NotificationManager.ts` |
| `JavaScriptSDK/PerfManager.ts` | `core/PerfManager.ts` |
| `JavaScriptSDK/ProcessTelemetryContext.ts` | `core/ProcessTelemetryContext.ts` |
| `JavaScriptSDK/ResponseHelpers.ts` | `core/ResponseHelpers.ts` |
| `JavaScriptSDK/SenderPostManager.ts` | `core/SenderPostManager.ts` |
| `JavaScriptSDK/StatsBeat.ts` | `core/StatsBeat.ts` |
| `JavaScriptSDK/TelemetryHelpers.ts` | `core/TelemetryHelpers.ts` |
| `JavaScriptSDK/TelemetryInitializerPlugin.ts` | `core/TelemetryInitializerPlugin.ts` |
| `JavaScriptSDK/UnloadHandlerContainer.ts` | `core/UnloadHandlerContainer.ts` |
| `JavaScriptSDK/UnloadHookContainer.ts` | `core/UnloadHookContainer.ts` |

### JavaScriptSDK → utils/
| Source | Target |
|--------|--------|
| `JavaScriptSDK/CoreUtils.ts` | `utils/CoreUtils.ts` |
| `JavaScriptSDK/DataCacheHelper.ts` | `utils/DataCacheHelper.ts` |
| `JavaScriptSDK/EnvUtils.ts` | `utils/EnvUtils.ts` |
| `JavaScriptSDK/HelperFuncs.ts` | `utils/HelperFuncs.ts` |
| `JavaScriptSDK/RandomHelper.ts` | `utils/RandomHelper.ts` |
| `JavaScriptSDK/W3cTraceParent.ts` | `utils/TraceParent.ts` |

### JavaScriptSDK → constants/
| Source | Target |
|--------|--------|
| `JavaScriptSDK/Constants.ts` | `constants/Constants.ts` |
| `JavaScriptSDK/InternalConstants.ts` | `constants/InternalConstants.ts` |

### JavaScriptSDK → diagnostics/
| Source | Target |
|--------|--------|
| `JavaScriptSDK/DiagnosticLogger.ts` | `diagnostics/DiagnosticLogger.ts` |

### JavaScriptSDK → internal/
| Source | Target |
|--------|--------|
| `JavaScriptSDK/EventHelpers.ts` | `internal/EventHelpers.ts` |

### JavaScriptSDK → telemetry/
| Source | Target |
|--------|--------|
| `JavaScriptSDK/W3cTraceState.ts` | `telemetry/W3cTraceState.ts` |

### JavaScriptSDK.Enums → enums/
| Source | Target |
|--------|--------|
| `JavaScriptSDK.Enums/EnumHelperFuncs.ts` | `enums/EnumHelperFuncs.ts` |
| `JavaScriptSDK.Enums/W3CTraceFlags.ts` | `enums/W3CTraceFlags.ts` |

### JavaScriptSDK.Enums → enums/ai/
| Source | Target |
|--------|--------|
| `JavaScriptSDK.Enums/DependencyTypes.ts` | `enums/ai/DependencyTypes.ts` |
| `JavaScriptSDK.Enums/EventsDiscardedReason.ts` | `enums/ai/EventsDiscardedReason.ts` |
| `JavaScriptSDK.Enums/FeatureOptInEnums.ts` | `enums/ai/FeatureOptInEnums.ts` |
| `JavaScriptSDK.Enums/InitActiveStatusEnum.ts` | `enums/ai/InitActiveStatusEnum.ts` |
| `JavaScriptSDK.Enums/LoggingEnums.ts` | `enums/ai/LoggingEnums.ts` |
| `JavaScriptSDK.Enums/SendRequestReason.ts` | `enums/ai/SendRequestReason.ts` |
| `JavaScriptSDK.Enums/StatsType.ts` | `enums/ai/StatsType.ts` |
| `JavaScriptSDK.Enums/TelemetryUnloadReason.ts` | `enums/ai/TelemetryUnloadReason.ts` |
| `JavaScriptSDK.Enums/TelemetryUpdateReason.ts` | `enums/ai/TelemetryUpdateReason.ts` |
| `JavaScriptSDK.Enums/TraceHeadersMode.ts` | `enums/ai/TraceHeadersMode.ts` |

### JavaScriptSDK.Interfaces → interfaces/ai/
| Source | Target |
|--------|--------|
| `JavaScriptSDK.Interfaces/IAppInsightsCore.ts` | `interfaces/ai/IAppInsightsCore.ts` |
| `JavaScriptSDK.Interfaces/IChannelControls.ts` | `interfaces/ai/IChannelControls.ts` |
| `JavaScriptSDK.Interfaces/IChannelControlsHost.ts` | `interfaces/ai/IChannelControlsHost.ts` |
| `JavaScriptSDK.Interfaces/IConfiguration.ts` | `interfaces/ai/IConfiguration.ts` |
| `JavaScriptSDK.Interfaces/ICookieMgr.ts` | `interfaces/ai/ICookieMgr.ts` |
| `JavaScriptSDK.Interfaces/IDbgExtension.ts` | `interfaces/ai/IDbgExtension.ts` |
| `JavaScriptSDK.Interfaces/IDiagnosticLogger.ts` | `interfaces/ai/IDiagnosticLogger.ts` |
| `JavaScriptSDK.Interfaces/IDistributedTraceContext.ts` | `interfaces/ai/IDistributedTraceContext.ts` |
| `JavaScriptSDK.Interfaces/IExceptionConfig.ts` | `interfaces/ai/IExceptionConfig.ts` |
| `JavaScriptSDK.Interfaces/IFeatureOptIn.ts` | `interfaces/ai/IFeatureOptIn.ts` |
| `JavaScriptSDK.Interfaces/IInstrumentHooks.ts` | `interfaces/ai/IInstrumentHooks.ts` |
| `JavaScriptSDK.Interfaces/INetworkStatsbeat.ts` | `interfaces/ai/INetworkStatsbeat.ts` |
| `JavaScriptSDK.Interfaces/INotificationListener.ts` | `interfaces/ai/INotificationListener.ts` |
| `JavaScriptSDK.Interfaces/INotificationManager.ts` | `interfaces/ai/INotificationManager.ts` |
| `JavaScriptSDK.Interfaces/IPerfEvent.ts` | `interfaces/ai/IPerfEvent.ts` |
| `JavaScriptSDK.Interfaces/IPerfManager.ts` | `interfaces/ai/IPerfManager.ts` |
| `JavaScriptSDK.Interfaces/IProcessTelemetryContext.ts` | `interfaces/ai/IProcessTelemetryContext.ts` |
| `JavaScriptSDK.Interfaces/ISenderPostManager.ts` | `interfaces/ai/ISenderPostManager.ts` |
| `JavaScriptSDK.Interfaces/IStatsBeat.ts` | `interfaces/ai/IStatsBeat.ts` |
| `JavaScriptSDK.Interfaces/IStatsEventData.ts` | `interfaces/ai/IStatsEventData.ts` |
| `JavaScriptSDK.Interfaces/IStatsMgr.ts` | `interfaces/ai/IStatsMgr.ts` |
| `JavaScriptSDK.Interfaces/ITelemetryInitializers.ts` | `interfaces/ai/ITelemetryInitializers.ts` |
| `JavaScriptSDK.Interfaces/ITelemetryItem.ts` | `interfaces/ai/ITelemetryItem.ts` |
| `JavaScriptSDK.Interfaces/ITelemetryPlugin.ts` | `interfaces/ai/ITelemetryPlugin.ts` |
| `JavaScriptSDK.Interfaces/ITelemetryPluginChain.ts` | `interfaces/ai/ITelemetryPluginChain.ts` |
| `JavaScriptSDK.Interfaces/ITelemetryUnloadState.ts` | `interfaces/ai/ITelemetryUnloadState.ts` |
| `JavaScriptSDK.Interfaces/ITelemetryUpdateState.ts` | `interfaces/ai/ITelemetryUpdateState.ts` |
| `JavaScriptSDK.Interfaces/ITraceParent.ts` | `interfaces/ai/ITraceParent.ts` |
| `JavaScriptSDK.Interfaces/ITraceProvider.ts` | `interfaces/ai/ITraceProvider.ts` |
| `JavaScriptSDK.Interfaces/IUnloadableComponent.ts` | `interfaces/ai/IUnloadableComponent.ts` |
| `JavaScriptSDK.Interfaces/IUnloadHook.ts` | `interfaces/ai/IUnloadHook.ts` |
| `JavaScriptSDK.Interfaces/IW3cTraceState.ts` | `interfaces/ai/IW3cTraceState.ts` |
| `JavaScriptSDK.Interfaces/IXDomainRequest.ts` | `interfaces/ai/IXDomainRequest.ts` |
| `JavaScriptSDK.Interfaces/IXHROverride.ts` | `interfaces/ai/IXHROverride.ts` |

### Common/ Root Files
| Source | Target |
|--------|--------|
| `Common/ConnectionStringParser.ts` | `telemetry/ConnectionStringParser.ts` |
| `Common/Constants.ts` | `constants/CoreInternalConstants.ts` |
| `Common/DomHelperFuncs.ts` | `utils/DomHelperFuncs.ts` |
| `Common/Enums.ts` | `enums/ai/Enums.ts` |
| `Common/HelperFuncs.ts` | `utils/HelperFuncsCore.ts` |
| `Common/Offline.ts` | `utils/Offline.ts` |
| `Common/RequestResponseHeaders.ts` | `telemetry/RequestResponseHeaders.ts` |
| `Common/StorageHelperFuncs.ts` | `utils/StorageHelperFuncs.ts` |
| `Common/TelemetryItemCreator.ts` | `telemetry/TelemetryItemCreator.ts` |
| `Common/ThrottleMgr.ts` | `diagnostics/ThrottleMgr.ts` |
| `Common/UrlHelperFuncs.ts` | `utils/UrlHelperFuncs.ts` |
| `Common/Util.ts` | `utils/Util.ts` |

### Common/Interfaces → interfaces/ai/
| Source | Target |
|--------|--------|
| `Common/Interfaces/ConnectionString.ts` | `interfaces/ai/ConnectionString.ts` |
| `Common/Interfaces/IAppInsights.ts` | `interfaces/ai/IAppInsights.ts` |
| `Common/Interfaces/IConfig.ts` | `interfaces/ai/IConfig.ts` |
| `Common/Interfaces/ICorrelationConfig.ts` | `interfaces/ai/ICorrelationConfig.ts` |
| `Common/Interfaces/IDependencyTelemetry.ts` | `interfaces/ai/IDependencyTelemetry.ts` |
| `Common/Interfaces/IEventTelemetry.ts` | `interfaces/ai/IEventTelemetry.ts` |
| `Common/Interfaces/IExceptionTelemetry.ts` | `interfaces/ai/IExceptionTelemetry.ts` |
| `Common/Interfaces/IMetricTelemetry.ts` | `interfaces/ai/IMetricTelemetry.ts` |
| `Common/Interfaces/IPageViewPerformanceTelemetry.ts` | `interfaces/ai/IPageViewPerformanceTelemetry.ts` |
| `Common/Interfaces/IPageViewTelemetry.ts` | `interfaces/ai/IPageViewTelemetry.ts` |
| `Common/Interfaces/IPartC.ts` | `interfaces/ai/IPartC.ts` |
| `Common/Interfaces/IPropertiesPlugin.ts` | `interfaces/ai/IPropertiesPlugin.ts` |
| `Common/Interfaces/IRequestContext.ts` | `interfaces/ai/IRequestContext.ts` |
| `Common/Interfaces/IRequestTelemetry.ts` | `interfaces/ai/IRequestTelemetry.ts` |
| `Common/Interfaces/IStorageBuffer.ts` | `interfaces/ai/IStorageBuffer.ts` |
| `Common/Interfaces/ITelemetryContext.ts` | `interfaces/ai/ITelemetryContext.ts` |
| `Common/Interfaces/IThrottleMgr.ts` | `interfaces/ai/IThrottleMgr.ts` |
| `Common/Interfaces/ITraceTelemetry.ts` | `interfaces/ai/ITraceTelemetry.ts` |
| `Common/Interfaces/PartAExtensions.ts` | `interfaces/ai/PartAExtensions.ts` |

### Common/Interfaces/Context → interfaces/ai/context/
| Source | Target |
|--------|--------|
| `Common/Interfaces/Context/IApplication.ts` | `interfaces/ai/context/IApplication.ts` |
| `Common/Interfaces/Context/IDevice.ts` | `interfaces/ai/context/IDevice.ts` |
| `Common/Interfaces/Context/IInternal.ts` | `interfaces/ai/context/IInternal.ts` |
| `Common/Interfaces/Context/ILocation.ts` | `interfaces/ai/context/ILocation.ts` |
| `Common/Interfaces/Context/IOperatingSystem.ts` | `interfaces/ai/context/IOperatingSystem.ts` |
| `Common/Interfaces/Context/ISample.ts` | `interfaces/ai/context/ISample.ts` |
| `Common/Interfaces/Context/ISession.ts` | `interfaces/ai/context/ISession.ts` |
| `Common/Interfaces/Context/ISessionManager.ts` | `interfaces/ai/context/ISessionManager.ts` |
| `Common/Interfaces/Context/ITelemetryTrace.ts` | `interfaces/ai/context/ITelemetryTrace.ts` |
| `Common/Interfaces/Context/IUser.ts` | `interfaces/ai/context/IUser.ts` |
| `Common/Interfaces/Context/IWeb.ts` | `interfaces/ai/context/IWeb.ts` |

### Common/Interfaces/Contracts → interfaces/ai/contracts/
| Source | Target |
|--------|--------|
| `Common/Interfaces/Contracts/AvailabilityData.ts` | `interfaces/ai/contracts/AvailabilityData.ts` |
| `Common/Interfaces/Contracts/ContextTagKeys.ts` | `interfaces/ai/contracts/ContextTagKeys.ts` |
| `Common/Interfaces/Contracts/DataPointType.ts` | `interfaces/ai/contracts/DataPointType.ts` |
| `Common/Interfaces/Contracts/DependencyKind.ts` | `interfaces/ai/contracts/DependencyKind.ts` |
| `Common/Interfaces/Contracts/DependencySourceType.ts` | `interfaces/ai/contracts/DependencySourceType.ts` |
| `Common/Interfaces/Contracts/IBase.ts` | `interfaces/ai/contracts/IBase.ts` |
| `Common/Interfaces/Contracts/IData.ts` | `interfaces/ai/contracts/IData.ts` |
| `Common/Interfaces/Contracts/IDataPoint.ts` | `interfaces/ai/contracts/IDataPoint.ts` |
| `Common/Interfaces/Contracts/IDomain.ts` | `interfaces/ai/contracts/IDomain.ts` |
| `Common/Interfaces/Contracts/IEnvelope.ts` | `interfaces/ai/contracts/IEnvelope.ts` |
| `Common/Interfaces/Contracts/IEventData.ts` | `interfaces/ai/contracts/IEventData.ts` |
| `Common/Interfaces/Contracts/IExceptionData.ts` | `interfaces/ai/contracts/IExceptionData.ts` |
| `Common/Interfaces/Contracts/IExceptionDetails.ts` | `interfaces/ai/contracts/IExceptionDetails.ts` |
| `Common/Interfaces/Contracts/IMessageData.ts` | `interfaces/ai/contracts/IMessageData.ts` |
| `Common/Interfaces/Contracts/IMetricData.ts` | `interfaces/ai/contracts/IMetricData.ts` |
| `Common/Interfaces/Contracts/IPageViewData.ts` | `interfaces/ai/contracts/IPageViewData.ts` |
| `Common/Interfaces/Contracts/IPageViewPerfData.ts` | `interfaces/ai/contracts/IPageViewPerfData.ts` |
| `Common/Interfaces/Contracts/IRemoteDependencyData.ts` | `interfaces/ai/contracts/IRemoteDependencyData.ts` |
| `Common/Interfaces/Contracts/IStackFrame.ts` | `interfaces/ai/contracts/IStackFrame.ts` |
| `Common/Interfaces/Contracts/SeverityLevel.ts` | `interfaces/ai/contracts/SeverityLevel.ts` |

### Common/Interfaces/Telemetry → interfaces/ai/telemetry/
| Source | Target |
|--------|--------|
| `Common/Interfaces/Telemetry/IEnvelope.ts` | `interfaces/ai/telemetry/IEnvelope.ts` |
| `Common/Interfaces/Telemetry/ISerializable.ts` | `interfaces/ai/telemetry/ISerializable.ts` |

### Common/Telemetry → telemetry/ai/
| Source | Target |
|--------|--------|
| `Common/Telemetry/DataTypes.ts` | `telemetry/ai/DataTypes.ts` |
| `Common/Telemetry/EnvelopeTypes.ts` | `telemetry/ai/EnvelopeTypes.ts` |
| `Common/Telemetry/Event.ts` | `telemetry/ai/Event.ts` |
| `Common/Telemetry/Exception.ts` | `telemetry/ai/Exception.ts` |
| `Common/Telemetry/Metric.ts` | `telemetry/ai/Metric.ts` |
| `Common/Telemetry/PageView.ts` | `telemetry/ai/PageView.ts` |
| `Common/Telemetry/PageViewPerformance.ts` | `telemetry/ai/PageViewPerformance.ts` |
| `Common/Telemetry/RemoteDependencyData.ts` | `telemetry/ai/RemoteDependencyData.ts` |
| `Common/Telemetry/Trace.ts` | `telemetry/ai/Trace.ts` |

### Common/Telemetry/Common → telemetry/ai/Common/
| Source | Target |
|--------|--------|
| `Common/Telemetry/Common/Data.ts` | `telemetry/ai/Common/Data.ts` |
| `Common/Telemetry/Common/DataPoint.ts` | `telemetry/ai/Common/DataPoint.ts` |
| `Common/Telemetry/Common/DataSanitizer.ts` | `telemetry/ai/Common/DataSanitizer.ts` |
| `Common/Telemetry/Common/Envelope.ts` | `telemetry/ai/Common/Envelope.ts` |

### OpenTelemetry → otel/api/
| Source | Target |
|--------|--------|
| `OpenTelemetry/otelApi.ts` | `otel/api/OTelApi.ts` |

### OpenTelemetry/attribute → otel/attribute/
| Source | Target |
|--------|--------|
| `OpenTelemetry/attribute/attributeContainer.ts` | `otel/attribute/attributeContainer.ts` |
| `OpenTelemetry/attribute/SemanticConventions.ts` | `otel/attribute/SemanticConventions.ts` |
| `OpenTelemetry/attribute/IAttributeContainer.ts` | `interfaces/otel/attribute/IAttributeContainer.ts` |

### OpenTelemetry/enums → enums/otel/
| Source | Target |
|--------|--------|
| `OpenTelemetry/enums/eAttributeChangeOp.ts` | `enums/otel/eAttributeChangeOp.ts` |
| `OpenTelemetry/enums/trace/OTelSamplingDecision.ts` | `enums/otel/OTelSamplingDecision.ts` |
| `OpenTelemetry/enums/trace/OTelSpanKind.ts` | `enums/otel/OTelSpanKind.ts` |
| `OpenTelemetry/enums/trace/OTelSpanStatus.ts` | `enums/otel/OTelSpanStatus.ts` |

### OpenTelemetry/errors → otel/api/errors/
| Source | Target |
|--------|--------|
| `OpenTelemetry/errors/OTelError.ts` | `otel/api/errors/OTelError.ts` |
| `OpenTelemetry/errors/OTelInvalidAttributeError.ts` | `otel/api/errors/OTelInvalidAttributeError.ts` |
| `OpenTelemetry/errors/OTelSpanError.ts` | `otel/api/errors/OTelSpanError.ts` |

### OpenTelemetry/helpers → internal/
| Source | Target |
|--------|--------|
| `OpenTelemetry/helpers/attributeHelpers.ts` | `internal/attributeHelpers.ts` |
| `OpenTelemetry/helpers/common.ts` | `internal/commonUtils.ts` |
| `OpenTelemetry/helpers/handleErrors.ts` | `internal/handleErrors.ts` |
| `OpenTelemetry/helpers/timeHelpers.ts` | `internal/timeHelpers.ts` |

### OpenTelemetry/noop → internal/
| Source | Target |
|--------|--------|
| `OpenTelemetry/noop/noopHelpers.ts` | `internal/noopHelpers.ts` |

### OpenTelemetry/interfaces → interfaces/otel/
| Source | Target |
|--------|--------|
| `OpenTelemetry/interfaces/IOTelApi.ts` | `interfaces/otel/IOTelApi.ts` |
| `OpenTelemetry/interfaces/IOTelApiCtx.ts` | `interfaces/otel/IOTelApiCtx.ts` |
| `OpenTelemetry/interfaces/IOTelAttributes.ts` | `interfaces/otel/IOTelAttributes.ts` |
| `OpenTelemetry/interfaces/IOTelException.ts` | `interfaces/otel/IOTelException.ts` |
| `OpenTelemetry/interfaces/IOTelHrTime.ts` | `interfaces/IOTelHrTime.ts` |

### OpenTelemetry/interfaces/config → interfaces/otel/config/
| Source | Target |
|--------|--------|
| `OpenTelemetry/interfaces/config/IOTelAttributeLimits.ts` | `interfaces/otel/config/IOTelAttributeLimits.ts` |
| `OpenTelemetry/interfaces/config/IOTelConfig.ts` | `interfaces/otel/config/IOTelConfig.ts` |
| `OpenTelemetry/interfaces/config/IOTelErrorHandlers.ts` | `interfaces/otel/config/IOTelErrorHandlers.ts` |
| `OpenTelemetry/interfaces/config/IOTelSpanLimits.ts` | `interfaces/otel/config/IOTelSpanLimits.ts` |
| `OpenTelemetry/interfaces/config/ITraceCfg.ts` | `interfaces/otel/config/IOTelTraceCfg.ts` |

### OpenTelemetry/interfaces/trace → interfaces/otel/trace/
| Source | Target |
|--------|--------|
| `OpenTelemetry/interfaces/trace/IOTelSpan.ts` | `interfaces/otel/trace/IOTelSpan.ts` |
| `OpenTelemetry/interfaces/trace/IOTelSpanCtx.ts` | `interfaces/otel/trace/IOTelSpanCtx.ts` |
| `OpenTelemetry/interfaces/trace/IOTelSpanOptions.ts` | `interfaces/otel/trace/IOTelSpanOptions.ts` |
| `OpenTelemetry/interfaces/trace/IOTelSpanStatus.ts` | `interfaces/otel/trace/IOTelSpanStatus.ts` |
| `OpenTelemetry/interfaces/trace/IOTelTracer.ts` | `interfaces/otel/trace/IOTelTracer.ts` |
| `OpenTelemetry/interfaces/trace/IOTelTracerProvider.ts` | `interfaces/otel/trace/IOTelTracerProvider.ts` |
| `OpenTelemetry/interfaces/trace/IOTelTraceState.ts` | `interfaces/otel/trace/IOTelTraceState.ts` |
| `OpenTelemetry/interfaces/trace/IReadableSpan.ts` | `interfaces/otel/trace/IReadableSpan.ts` |
| `OpenTelemetry/interfaces/trace/ITraceApi.ts` | `interfaces/otel/trace/IOTelTraceApi.ts` |

### OpenTelemetry/trace → otel/api/trace/
| Source | Target |
|--------|--------|
| `OpenTelemetry/trace/span.ts` | `otel/api/trace/span.ts` |
| `OpenTelemetry/trace/traceApi.ts` | `otel/api/trace/traceApi.ts` |
| `OpenTelemetry/trace/traceProvider.ts` | `otel/api/trace/traceProvider.ts` |
| `OpenTelemetry/trace/tracer.ts` | `otel/api/trace/tracer.ts` |
| `OpenTelemetry/trace/tracerProvider.ts` | `otel/api/trace/tracerProvider.ts` |
| `OpenTelemetry/trace/traceState.ts` | `otel/api/trace/traceState.ts` |
| `OpenTelemetry/trace/utils.ts` | `otel/api/trace/utils.ts` |

---

## Test Structure Changes

### Important: Test Migration Strategy

Tests are migrated from TWO sources into AppInsightsCore:

1. **AppInsightsCore Tests** - Use `git mv` to preserve history (files already in this repo)
2. **AppInsightsCommon Tests** - Use `git mv` from `../../AppInsightsCommon/Tests/Unit/src/` to `./Tests/Unit/src/ai/Common/`
   - These tests are being consolidated into AppInsightsCore as part of the Common→Core merge
   - After moving, the AppInsightsCommon/Tests folder should be deleted

**Note on GlobalTestHooks.Test.ts:**
- AppInsightsCommon has its own `GlobalTestHooks.Test.ts` 
- AppInsightsCore also has `GlobalTestHooks.Test.ts`
- Only the AppInsightsCore version is kept (moved to `ai/Core/GlobalTestHooks.Test.ts`)
- The AppInsightsCommon version is deleted (not duplicated)

### Previous Test Structure

**AppInsightsCore (`Tests/Unit/src/`):**
```
├── aiunittests.ts
├── GlobalTestHooks.Test.ts
├── TestPlugins.ts
├── AppInsightsCoreSize.Tests.ts
├── ApplicationInsightsCore.Tests.ts
├── CookieManager.Tests.ts
├── Dynamic.Tests.ts
├── DynamicConfig.Tests.ts
├── EventHelper.Tests.ts
├── EventsDiscardedReason.Tests.ts
├── HelperFunc.Tests.ts
├── LoggingEnum.Tests.ts
├── SendPostManager.Tests.ts
├── StatsBeat.Tests.ts
├── UpdateConfig.Tests.ts
├── W3cTraceParentTests.ts
├── W3TraceState.Tests.ts
└── OpenTelemetry/
    ├── attributeContainer.Tests.ts
    ├── commonUtils.Tests.ts
    ├── errors.Tests.ts
    ├── otelNegative.Tests.ts
    ├── span.Tests.ts
    ├── traceState.Tests.ts
    └── traceUtils.Tests.ts
```

**AppInsightsCommon (`Tests/Unit/src/`) - To be migrated:**
```
├── appinsights-common.tests.ts    # Entry point - DELETE
├── GlobalTestHooks.Test.ts        # Duplicate - DELETE
├── AppInsightsCommon.tests.ts     # Move to ai/Common/
├── ConnectionStringParser.tests.ts
├── Exception.tests.ts
├── RequestHeaders.tests.ts
├── SeverityLevel.tests.ts
├── ThrottleMgr.tests.ts           # Move to ai/Core/ (diagnostics)
├── Util.tests.ts
└── W3CTraceStateModes.tests.ts
```

### New Test Structure (`Tests/Unit/src/`) - MSNev3 Aligned
```
├── aiunittests.ts
├── ai/
│   ├── Common/                          # Common/telemetry tests (9 files)
│   │   ├── AppInsightsCommon.tests.ts
│   │   ├── ConnectionStringParser.tests.ts
│   │   ├── Exception.tests.ts
│   │   ├── RequestHeaders.tests.ts
│   │   ├── SeverityLevel.tests.ts
│   │   ├── Util.tests.ts
│   │   ├── W3cTraceParentTests.ts
│   │   ├── W3CTraceStateModes.tests.ts
│   │   └── W3TraceState.Tests.ts
│   └── Core/                            # Core implementation tests (17 files)
│       ├── AppInsightsCoreSize.Tests.ts
│       ├── ApplicationInsightsCore.Tests.ts
│       ├── CookieManager.Tests.ts
│       ├── Dynamic.Tests.ts
│       ├── DynamicConfig.Tests.ts
│       ├── errors.Tests.ts
│       ├── EventHelper.Tests.ts
│       ├── EventsDiscardedReason.Tests.ts
│       ├── GlobalTestHooks.Test.ts
│       ├── HelperFunc.Tests.ts
│       ├── LoggingEnum.Tests.ts
│       ├── SendPostManager.Tests.ts
│       ├── StatsBeat.Tests.ts
│       ├── TestPlugins.ts
│       ├── ThrottleMgr.tests.ts
│       ├── traceState.Tests.ts
│       └── UpdateConfig.Tests.ts
├── api/                                 # Empty (future OTel API tests)
├── attribute/
│   └── attributeContainer.Tests.ts
├── internal/
│   ├── commonUtils.Tests.ts
│   └── otelNegative.Tests.ts
├── sdk/                                 # Empty (future OTel SDK tests)
└── trace/
    ├── span.Tests.ts
    └── traceUtils.Tests.ts
```

### Test File Move Table

#### → ai/Core/ (17 files)

**From AppInsightsCore root Tests/Unit/src/:**

| Source | Target |
|--------|--------|
| `ApplicationInsightsCore.Tests.ts` | `ai/Core/ApplicationInsightsCore.Tests.ts` |
| `AppInsightsCoreSize.Tests.ts` | `ai/Core/AppInsightsCoreSize.Tests.ts` |
| `CookieManager.Tests.ts` | `ai/Core/CookieManager.Tests.ts` |
| `Dynamic.Tests.ts` | `ai/Core/Dynamic.Tests.ts` |
| `DynamicConfig.Tests.ts` | `ai/Core/DynamicConfig.Tests.ts` |
| `UpdateConfig.Tests.ts` | `ai/Core/UpdateConfig.Tests.ts` |
| `SendPostManager.Tests.ts` | `ai/Core/SendPostManager.Tests.ts` |
| `StatsBeat.Tests.ts` | `ai/Core/StatsBeat.Tests.ts` |
| `EventsDiscardedReason.Tests.ts` | `ai/Core/EventsDiscardedReason.Tests.ts` |
| `LoggingEnum.Tests.ts` | `ai/Core/LoggingEnum.Tests.ts` |
| `EventHelper.Tests.ts` | `ai/Core/EventHelper.Tests.ts` |
| `HelperFunc.Tests.ts` | `ai/Core/HelperFunc.Tests.ts` |
| `GlobalTestHooks.Test.ts` | `ai/Core/GlobalTestHooks.Test.ts` |
| `TestPlugins.ts` | `ai/Core/TestPlugins.ts` |

**From AppInsightsCore Tests/Unit/src/OpenTelemetry/:**

| Source | Target |
|--------|--------|
| `OpenTelemetry/errors.Tests.ts` | `ai/Core/errors.Tests.ts` |
| `OpenTelemetry/traceState.Tests.ts` | `ai/Core/traceState.Tests.ts` |

**From AppInsightsCommon Tests/Unit/src/ (moved to ai/Core/):**

| Source (AppInsightsCommon) | Target |
|----------------------------|--------|
| `ThrottleMgr.tests.ts` | `ai/Core/ThrottleMgr.tests.ts` |

#### → ai/Common/ (9 files) - FROM AppInsightsCommon
**Source Location: `../../AppInsightsCommon/Tests/Unit/src/`**

These files are moved from the AppInsightsCommon package into AppInsightsCore:

| Source (in AppInsightsCommon) | Target (in AppInsightsCore) |
|-------------------------------|----------------------------|
| `AppInsightsCommon.tests.ts` | `ai/Common/AppInsightsCommon.tests.ts` |
| `ConnectionStringParser.tests.ts` | `ai/Common/ConnectionStringParser.tests.ts` |
| `Exception.tests.ts` | `ai/Common/Exception.tests.ts` |
| `RequestHeaders.tests.ts` | `ai/Common/RequestHeaders.tests.ts` |
| `SeverityLevel.tests.ts` | `ai/Common/SeverityLevel.tests.ts` |
| `Util.tests.ts` | `ai/Common/Util.tests.ts` |
| `W3CTraceStateModes.tests.ts` | `ai/Common/W3CTraceStateModes.tests.ts` |

**From AppInsightsCore root (already present, move to ai/Common/):**

| Source (in AppInsightsCore) | Target |
|-----------------------------|--------|
| `W3cTraceParentTests.ts` | `ai/Common/W3cTraceParentTests.ts` |
| `W3TraceState.Tests.ts` | `ai/Common/W3TraceState.Tests.ts` |

#### → attribute/
| Source | Target |
|--------|--------|
| `OpenTelemetry/attributeContainer.Tests.ts` | `attribute/attributeContainer.Tests.ts` |

#### → internal/
| Source | Target |
|--------|--------|
| `OpenTelemetry/commonUtils.Tests.ts` | `internal/commonUtils.Tests.ts` |
| `OpenTelemetry/otelNegative.Tests.ts` | `internal/otelNegative.Tests.ts` |

#### → trace/
| Source | Target |
|--------|--------|
| `OpenTelemetry/span.Tests.ts` | `trace/span.Tests.ts` |
| `OpenTelemetry/traceUtils.Tests.ts` | `trace/traceUtils.Tests.ts` |

#### Files Deleted from AppInsightsCommon (after moving tests to Core)
| Source | Notes |
|--------|-------|
| `appinsights-common.tests.ts` | Entry point file - no longer needed |
| `GlobalTestHooks.Test.ts` | Duplicate - Core has its own version |
| `../../AppInsightsCommon/Tests/UnitTests.html` | Test HTML runner - no longer needed |
| `../../AppInsightsCommon/Tests/tsconfig.json` | Test config - no longer needed |

---

## Configuration Updates

### tsconfig.json
Replace the `include` section:
```json
{
  "include": [
    "./src/index.ts",
    "./src/__DynamicConstants.ts",
    "./src/config/**/*.ts",
    "./src/constants/**/*.ts",
    "./src/core/**/*.ts",
    "./src/diagnostics/**/*.ts",
    "./src/enums/**/*.ts",
    "./src/interfaces/**/*.ts",
    "./src/internal/**/*.ts",
    "./src/otel/**/*.ts",
    "./src/telemetry/**/*.ts",
    "./src/utils/**/*.ts"
  ]
}
```

### Test Import Path Rules
After moving test files, update all import paths in test files:

**For ai/Core/ and ai/Common/ files** (5 levels deep):
- Use `../../../../../src/` for source imports
- Change `from '../TestPlugins'` to `from './TestPlugins'`

**For attribute/, internal/, trace/ files** (4 levels deep):
- Use `../../../../src/` for source imports

### aiunittests.ts Content
```typescript
import '@microsoft/applicationinsights-shims';

// ai/Core tests - Core implementation tests
import { ApplicationInsightsCoreTests } from "./ai/Core/ApplicationInsightsCore.Tests";
import { CookieManagerTests } from "./ai/Core/CookieManager.Tests";
import { AppInsightsCoreSizeCheck } from "./ai/Core/AppInsightsCoreSize.Tests";
import { SendPostManagerTests } from './ai/Core/SendPostManager.Tests';
// import { StatsBeatTests } from './ai/Core/StatsBeat.Tests';  // Currently disabled
import { DynamicTests } from "./ai/Core/Dynamic.Tests";
import { DynamicConfigTests } from "./ai/Core/DynamicConfig.Tests";
import { UpdateConfigTests } from "./ai/Core/UpdateConfig.Tests";
import { ThrottleMgrTest } from './ai/Core/ThrottleMgr.tests';
import { LoggingEnumTests } from "./ai/Core/LoggingEnum.Tests";
import { EventsDiscardedReasonTests } from "./ai/Core/EventsDiscardedReason.Tests";
import { EventHelperTests } from "./ai/Core/EventHelper.Tests";
import { HelperFuncTests } from './ai/Core/HelperFunc.Tests';
import { OTelTraceApiTests } from './ai/Core/traceState.Tests';
import { OpenTelemetryErrorsTests } from './ai/Core/errors.Tests';
import { GlobalTestHooks } from "./ai/Core/GlobalTestHooks.Test";

// ai/Common tests - Common telemetry tests
import { W3cTraceParentTests } from "./ai/Common/W3cTraceParentTests";
import { W3cTraceStateTests } from './ai/Common/W3TraceState.Tests';
import { ConnectionStringParserTests } from './ai/Common/ConnectionStringParser.tests';
import { RequestHeadersTests } from './ai/Common/RequestHeaders.tests';
import { W3CTraceStateModesTests } from './ai/Common/W3CTraceStateModes.tests';
import { DataSanitizerTests } from './ai/Common/AppInsightsCommon.tests';
import { ExceptionTests } from './ai/Common/Exception.tests';
import { SeverityLevelTests } from './ai/Common/SeverityLevel.tests';
import { UtilTests } from './ai/Common/Util.tests';

// Internal tests
import { CommonUtilsTests } from './internal/commonUtils.Tests';
import { OTelNegativeTests } from './internal/otelNegative.Tests';

// Trace tests
import { SpanTests } from './trace/span.Tests';
import { TraceUtilsTests } from './trace/traceUtils.Tests';

// Attribute tests
import { AttributeContainerTests } from './attribute/attributeContainer.Tests';

export function runTests() {
    new GlobalTestHooks().registerTests();
    
    // Config tests
    new DynamicTests().registerTests();
    new DynamicConfigTests().registerTests();
    new UpdateConfigTests().registerTests();
    
    // Core tests
    new ApplicationInsightsCoreTests().registerTests();
    new CookieManagerTests(false).registerTests();
    new CookieManagerTests(true).registerTests();
    new AppInsightsCoreSizeCheck().registerTests();
    new SendPostManagerTests().registerTests();
    // new StatsBeatTests(false).registerTests();  // Currently disabled
    // new StatsBeatTests(true).registerTests();   // Currently disabled
    
    // Diagnostics tests
    new ThrottleMgrTest().registerTests();
    
    // Enum tests
    new LoggingEnumTests().registerTests();
    new EventsDiscardedReasonTests().registerTests();
    
    // Internal tests
    new EventHelperTests().registerTests();
    new CommonUtilsTests().registerTests();
    new OTelNegativeTests().registerTests();
    
    // Telemetry tests
    new W3cTraceParentTests().registerTests();
    new W3cTraceStateTests().registerTests();
    new ConnectionStringParserTests().registerTests();
    new RequestHeadersTests().registerTests();
    new W3CTraceStateModesTests().registerTests();
    new DataSanitizerTests().registerTests();
    new ExceptionTests().registerTests();
    new SeverityLevelTests().registerTests();
    
    // Utils tests
    new HelperFuncTests().registerTests();
    new UtilTests().registerTests();
    
    // OTel tests
    new OTelTraceApiTests().registerTests();
    new OpenTelemetryErrorsTests().registerTests();
    new SpanTests().registerTests();
    new AttributeContainerTests().registerTests();
    new TraceUtilsTests().registerTests();
}
```

**Note:** StatsBeat.Tests.ts is present in ai/Core/ but currently commented out in the test runner. The file exists and should be moved as part of the migration.

---

## Additional Required Fixes (Outside AppInsightsCore)

### AISKU Test Files - Fix Banned Imports
The following files use banned deep path imports that must be fixed:

**AISKU/Tests/Unit/src/SpanHelperUtils.Tests.ts**
```typescript
// ❌ Remove this import:
import { IDistributedTraceInit } from "@microsoft/applicationinsights-core-js/src/JavaScriptSDK.Interfaces/IDistributedTraceContext";

// ✅ Add to existing import from public API:
import {
    createDistributedTraceContext,
    eOTelSpanKind,
    eOTelSpanStatusCode,
    IDistributedTraceInit,  // Add here
    isReadableSpan,
    isSpanContextValid,
    ITelemetryItem,
    wrapSpanContext
} from "@microsoft/applicationinsights-core-js";
```

**AISKU/Tests/Unit/src/UseSpan.Tests.ts**
```typescript
// ❌ Remove this import:
import { IAppInsightsCore } from "@microsoft/applicationinsights-core-js/src/applicationinsights-core-js";

// ✅ Add to existing import from public API:
import {
    IAppInsightsCore,  // Add here
    IReadableSpan, eOTelSpanKind, eOTelSpanStatusCode, useSpan, ITelemetryItem, ISpanScope, ITraceHost
} from "@microsoft/applicationinsights-core-js";
```

---

## AppInsightsCommon Deprecation (Merge into Core)

As part of this migration, the `@microsoft/applicationinsights-common` package is being deprecated. All functionality has been merged into `@microsoft/applicationinsights-core-js`.

### Delete AppInsightsCommon Tests Folder
Remove the entire Tests folder since tests are now in AppInsightsCore:

```powershell
Set-Location "D:\MSNev2\ApplicationInsights-JS\shared\AppInsightsCommon"

# Delete test files
git rm "Tests/Unit/src/appinsights-common.tests.ts"
git rm "Tests/Unit/src/AppInsightsCommon.tests.ts"
git rm "Tests/Unit/src/ConnectionStringParser.tests.ts"
git rm "Tests/Unit/src/Exception.tests.ts"
git rm "Tests/Unit/src/GlobalTestHooks.Test.ts"
git rm "Tests/Unit/src/RequestHeaders.tests.ts"
git rm "Tests/Unit/src/SeverityLevel.tests.ts"
git rm "Tests/Unit/src/ThrottleMgr.tests.ts"
git rm "Tests/Unit/src/Util.tests.ts"
git rm "Tests/Unit/src/W3CTraceStateModes.tests.ts"

# Delete test config files
git rm "Tests/UnitTests.html"
git rm "Tests/tsconfig.json"
```

### Update AppInsightsCommon package.json
Add deprecation notice:

```json
{
    "name": "@microsoft/applicationinsights-common",
    "version": "3.3.11",
    "description": "Microsoft Application Insights Common JavaScript Library (Compatibility Layer - Deprecated)",
    "deprecated": "This package has been merged into @microsoft/applicationinsights-core-js. Please update your imports to use @microsoft/applicationinsights-core-js instead.",
    // ... rest of package.json unchanged
}
```

### Rewrite applicationinsights-common.ts as Re-export Layer
Replace the entire content of `shared/AppInsightsCommon/src/applicationinsights-common.ts` with re-exports from core:

```typescript
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * @deprecated The @microsoft/applicationinsights-common package has been merged
 * into @microsoft/applicationinsights-core-js for simplified dependency management
 * and improved tree-shaking capabilities.
 *
 * Please migrate your imports:
 *
 * @example
 * // Before:
 * import { IConfig, ContextTagKeys } from "@microsoft/applicationinsights-common";
 *
 * // After:
 * import { IConfig, ContextTagKeys } from "@microsoft/applicationinsights-core-js";
 *
 * This compatibility layer will be maintained through version 3.x and removed in 4.0.0.
 *
 * @see https://github.com/microsoft/ApplicationInsights-JS/blob/main/docs/upgrade/MergeCommonToCore.md
 */

// Re-export everything from core for backward compatibility
export {
    // Utility functions
    correlationIdSetPrefix, correlationIdGetPrefix, correlationIdCanIncludeCorrelationHeader,
    correlationIdGetCorrelationContext, correlationIdGetCorrelationContextValue,
    dateTimeUtilsNow, dateTimeUtilsDuration, isInternalApplicationInsightsEndpoint,
    createDistributedTraceContextFromTrace,

    // Throttle manager
    ThrottleMgr,

    // Connection string parsing
    parseConnectionString, ConnectionStringParser,

    // Enums
    FieldType, eDistributedTracingModes, DistributedTracingModes, EventPersistence,
    eSeverityLevel, SeverityLevel,

    // Request/Response
    eRequestHeaders, RequestHeaders,

    // Constants
    DisabledPropertyName, ProcessLegacy, SampleRate, HttpMethod,
    DEFAULT_BREEZE_ENDPOINT, DEFAULT_BREEZE_PATH, strNotSpecified,

    // Contracts
    AIData, AIBase, IDomain,
    IStackFrame, IExceptionDetails, IExceptionData, IEventData, IMessageData,
    IMetricData, IDataPoint, DataPointType, IPageViewPerfData,
    DependencyKind, DependencySourceType,

    // Telemetry interfaces
    ISerializable, IEnvelope, IPageViewData, IRemoteDependencyData,
    IEventTelemetry, ITraceTelemetry, IMetricTelemetry, IDependencyTelemetry,
    IExceptionTelemetry, IAutoExceptionTelemetry, IExceptionInternal,
    IPageViewTelemetry, IPageViewTelemetryInternal,
    IPageViewPerformanceTelemetry, IPageViewPerformanceTelemetryInternal,
    IRequestTelemetry,

    // Telemetry classes
    Envelope, Event, Exception, Metric, PageView, PageViewPerformance,
    RemoteDependencyData, Trace, Data,

    // Configuration
    IConfig, ConfigurationManager, IStorageBuffer, ICorrelationConfig,

    // Context tags
    IContextTagKeys, ContextTagKeys, CtxTagKeys, Extensions,

    // Data types
    EventDataType, ExceptionDataType, MetricDataType, PageViewDataType,
    PageViewPerformanceDataType, RemoteDependencyDataType, RequestDataType, TraceDataType,

    // Envelope types
    EventEnvelopeType, ExceptionEnvelopeType, MetricEnvelopeType, PageViewEnvelopeType,
    PageViewPerformanceEnvelopeType, RemoteDependencyEnvelopeType, RequestEnvelopeType,
    TraceEnvelopeType,

    // Data sanitization
    DataSanitizerValues, dataSanitizeKeyAndAddUniqueness, dataSanitizeKey,
    dataSanitizeString, dataSanitizeUrl, dataSanitizeMessage, dataSanitizeException,
    dataSanitizeProperties, dataSanitizeMeasurements, dataSanitizeId, dataSanitizeInput,
    dsPadNumber,

    // Telemetry creation
    TelemetryItemCreator, createTelemetryItem,

    // Application Insights interfaces
    IAppInsights, ITelemetryContext, IPropertiesPlugin, IRequestContext,

    // Context interfaces
    IWeb, ISession, ISessionManager, IApplication, IDevice, IInternal,
    ILocation, ISample, IOperatingSystem, IUser, IUserContext, ITelemetryTrace,

    // Helper functions
    stringToBoolOrDefault, msToTimeSpan, getExtensionByName, isCrossOriginError,

    // Trace parent
    ITraceParent, createTraceParent, parseTraceParent, isValidTraceId, isValidSpanId,
    isValidTraceParent, isSampledFlag, formatTraceParent, findW3cTraceParent,
    findAllScripts, isBeaconsSupported,

    // DOM helpers
    createDomEvent,

    // Storage helpers
    utlDisableStorage, utlEnableStorage, utlCanUseLocalStorage, utlGetLocalStorage,
    utlSetLocalStorage, utlRemoveStorage, utlCanUseSessionStorage,
    utlGetSessionStorageKeys, utlGetSessionStorage, utlSetSessionStorage,
    utlRemoveSessionStorage, utlSetStoragePrefix,

    // URL helpers
    urlParseUrl, urlGetAbsoluteUrl, urlGetPathName, urlGetCompleteUrl,
    urlParseHost, urlParseFullHost,

    // Throttle manager interfaces
    IThrottleLimit, IThrottleInterval, IThrottleMgrConfig,
    IThrottleLocalStorageObj, IThrottleResult,

    // Offline support
    IOfflineListener, createOfflineListener, IOfflineState,
    eOfflineValue, OfflineCallback,

    // Request headers interface
    IRequestHeaders,

    // Plugin identifiers
    PropertiesPluginIdentifier, BreezeChannelIdentifier, AnalyticsPluginIdentifier

} from "@microsoft/applicationinsights-core-js";

// Type re-exports (zero runtime cost)
export type { ConnectionString } from "@microsoft/applicationinsights-core-js";
```

---

## Execution Script

```powershell
# =============================================================================
# Complete Migration Script - AppInsightsCore
# Run from: D:\MSNev2\ApplicationInsights-JS\shared\AppInsightsCore
# =============================================================================

Set-Location "D:\MSNev2\ApplicationInsights-JS\shared\AppInsightsCore"

# -----------------------------------------------------------------------------
# STEP 1: Create Source Directory Structure
# -----------------------------------------------------------------------------

$srcDirs = @(
    "src/config",
    "src/constants",
    "src/core",
    "src/diagnostics",
    "src/enums/ai",
    "src/enums/otel",
    "src/interfaces/ai/context",
    "src/interfaces/ai/contracts",
    "src/interfaces/ai/telemetry",
    "src/interfaces/config",
    "src/interfaces/otel/attribute",
    "src/interfaces/otel/config",
    "src/interfaces/otel/trace",
    "src/internal",
    "src/otel/api/errors",
    "src/otel/api/trace",
    "src/otel/attribute",
    "src/telemetry/ai/Common",
    "src/utils"
)

foreach ($dir in $srcDirs) {
    New-Item -ItemType Directory -Force -Path $dir
}

# -----------------------------------------------------------------------------
# STEP 2: Move Source Files (use git mv for each)
# See "Source File Move Tables" section above for complete list
# Example:
# git mv "src/applicationinsights-core-js.ts" "src/index.ts"
# git mv "src/Config/DynamicConfig.ts" "src/config/DynamicConfig.ts"
# ... etc for all files listed in tables
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# STEP 3: Update Source Import Paths
# After moving all source files, update all import statements
# Use find/replace for each mapping in Import Path Mapping Table
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# STEP 4: Update tsconfig.json
# Replace include section as shown in Configuration Updates section
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# STEP 4b: Rush Update (Required before building)
# This is a Rush-based monorepo - must update dependencies after any changes
# -----------------------------------------------------------------------------

Set-Location "D:\MSNev2\ApplicationInsights-JS"
rush update --recheck --full

# If you encounter dependency issues, use the more aggressive purge option:
# rush update --recheck --purge --full

# -----------------------------------------------------------------------------
# STEP 5: Build and Test Source Migration
# -----------------------------------------------------------------------------

Set-Location "D:\MSNev2\ApplicationInsights-JS\shared\AppInsightsCore"
npx grunt core
npx grunt coreunittest

# -----------------------------------------------------------------------------
# STEP 6: Create Test Directory Structure
# -----------------------------------------------------------------------------

$testDirs = @(
    "Tests/Unit/src/ai/Common",
    "Tests/Unit/src/ai/Core",
    "Tests/Unit/src/api",
    "Tests/Unit/src/attribute",
    "Tests/Unit/src/internal",
    "Tests/Unit/src/sdk",
    "Tests/Unit/src/trace"
)

Set-Location "D:\MSNev2\ApplicationInsights-JS\shared\AppInsightsCore"
foreach ($dir in $testDirs) {
    New-Item -ItemType Directory -Force -Path $dir
}

# -----------------------------------------------------------------------------
# STEP 7: Move Test Files
# See "Test File Move Table" section for complete list
# -----------------------------------------------------------------------------

Set-Location "D:\MSNev2\ApplicationInsights-JS\shared\AppInsightsCore\Tests\Unit\src"

# Move AppInsightsCore root tests to ai/Core/
git mv "ApplicationInsightsCore.Tests.ts" "ai/Core/"
git mv "AppInsightsCoreSize.Tests.ts" "ai/Core/"
git mv "CookieManager.Tests.ts" "ai/Core/"
git mv "Dynamic.Tests.ts" "ai/Core/"
git mv "DynamicConfig.Tests.ts" "ai/Core/"
git mv "UpdateConfig.Tests.ts" "ai/Core/"
git mv "SendPostManager.Tests.ts" "ai/Core/"
git mv "StatsBeat.Tests.ts" "ai/Core/"
git mv "EventsDiscardedReason.Tests.ts" "ai/Core/"
git mv "LoggingEnum.Tests.ts" "ai/Core/"
git mv "EventHelper.Tests.ts" "ai/Core/"
git mv "HelperFunc.Tests.ts" "ai/Core/"
git mv "GlobalTestHooks.Test.ts" "ai/Core/"
git mv "TestPlugins.ts" "ai/Core/"

# Move AppInsightsCore OpenTelemetry tests to appropriate locations
git mv "OpenTelemetry/errors.Tests.ts" "ai/Core/"
git mv "OpenTelemetry/traceState.Tests.ts" "ai/Core/"
git mv "OpenTelemetry/attributeContainer.Tests.ts" "attribute/"
git mv "OpenTelemetry/commonUtils.Tests.ts" "internal/"
git mv "OpenTelemetry/otelNegative.Tests.ts" "internal/"
git mv "OpenTelemetry/span.Tests.ts" "trace/"
git mv "OpenTelemetry/traceUtils.Tests.ts" "trace/"

# Move AppInsightsCore root W3c tests to ai/Common/
git mv "W3cTraceParentTests.ts" "ai/Common/"
git mv "W3TraceState.Tests.ts" "ai/Common/"

# -----------------------------------------------------------------------------
# STEP 7b: Move Tests from AppInsightsCommon to AppInsightsCore
# Run from repository root
# -----------------------------------------------------------------------------

Set-Location "D:\MSNev2\ApplicationInsights-JS"

# Move ThrottleMgr to ai/Core/ (it tests diagnostics functionality)
git mv "shared/AppInsightsCommon/Tests/Unit/src/ThrottleMgr.tests.ts" "shared/AppInsightsCore/Tests/Unit/src/ai/Core/"

# Move other test files from AppInsightsCommon to AppInsightsCore/Tests/Unit/src/ai/Common/
git mv "shared/AppInsightsCommon/Tests/Unit/src/AppInsightsCommon.tests.ts" "shared/AppInsightsCore/Tests/Unit/src/ai/Common/"
git mv "shared/AppInsightsCommon/Tests/Unit/src/ConnectionStringParser.tests.ts" "shared/AppInsightsCore/Tests/Unit/src/ai/Common/"
git mv "shared/AppInsightsCommon/Tests/Unit/src/Exception.tests.ts" "shared/AppInsightsCore/Tests/Unit/src/ai/Common/"
git mv "shared/AppInsightsCommon/Tests/Unit/src/RequestHeaders.tests.ts" "shared/AppInsightsCore/Tests/Unit/src/ai/Common/"
git mv "shared/AppInsightsCommon/Tests/Unit/src/SeverityLevel.tests.ts" "shared/AppInsightsCore/Tests/Unit/src/ai/Common/"
git mv "shared/AppInsightsCommon/Tests/Unit/src/Util.tests.ts" "shared/AppInsightsCore/Tests/Unit/src/ai/Common/"
git mv "shared/AppInsightsCommon/Tests/Unit/src/W3CTraceStateModes.tests.ts" "shared/AppInsightsCore/Tests/Unit/src/ai/Common/"

# Remove duplicate/unused files from AppInsightsCommon
git rm "shared/AppInsightsCommon/Tests/Unit/src/appinsights-common.tests.ts"
git rm "shared/AppInsightsCommon/Tests/Unit/src/GlobalTestHooks.Test.ts"
git rm "shared/AppInsightsCommon/Tests/UnitTests.html"
git rm "shared/AppInsightsCommon/Tests/tsconfig.json"

# -----------------------------------------------------------------------------
# STEP 8: Update Test Import Paths
# -----------------------------------------------------------------------------

# Fix ai/Core and ai/Common files - need ../../../../../src/ (5 levels)
Get-ChildItem -Path "ai/Core","ai/Common" -Filter "*.ts" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    # Fix various depth patterns to 5 levels
    $content = $content -replace '\.\.\/\.\.\/\.\.\/src/', '../../../../../src/'
    $content = $content -replace '\.\.\/\.\.\/\.\.\/\.\.\/src/', '../../../../../src/'
    $content = $content -replace "from '\.\./TestPlugins'", "from './TestPlugins'"
    Set-Content $_.FullName -Value $content -NoNewline
}

# Fix internal, attribute, trace files - need ../../../../src/ (4 levels)
Get-ChildItem -Path "internal","attribute","trace" -Filter "*.ts" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace '\.\.\/\.\.\/\.\.\/src/', '../../../../src/'
    Set-Content $_.FullName -Value $content -NoNewline
}

# -----------------------------------------------------------------------------
# STEP 9: Update aiunittests.ts
# Replace entire content with the aiunittests.ts content shown above
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# STEP 10: Clean up empty directories
# -----------------------------------------------------------------------------

Remove-Item -Recurse -Force OpenTelemetry -ErrorAction SilentlyContinue

# -----------------------------------------------------------------------------
# STEP 10b: Rush Update (Required before building after test file moves)
# -----------------------------------------------------------------------------

Set-Location "D:\MSNev2\ApplicationInsights-JS"
rush update --recheck --full

# -----------------------------------------------------------------------------
# STEP 11: Build and Test
# -----------------------------------------------------------------------------

Set-Location "D:\MSNev2\ApplicationInsights-JS\shared\AppInsightsCore"
npx grunt core
npx grunt coreunittest

# -----------------------------------------------------------------------------
# STEP 12: Fix AISKU Banned Imports
# -----------------------------------------------------------------------------

Set-Location "D:\MSNev2\ApplicationInsights-JS"

# Fix SpanHelperUtils.Tests.ts
$file = "AISKU/Tests/Unit/src/SpanHelperUtils.Tests.ts"
$content = Get-Content $file -Raw
$content = $content -replace "import \{ IDistributedTraceInit \} from `"@microsoft/applicationinsights-core-js/src/JavaScriptSDK\.Interfaces/IDistributedTraceContext`";", ""
$content = $content -replace "isReadableSpan,", "IDistributedTraceInit,`n    isReadableSpan,"
Set-Content $file -Value $content -NoNewline

# Fix UseSpan.Tests.ts
$file = "AISKU/Tests/Unit/src/UseSpan.Tests.ts"
$content = Get-Content $file -Raw
$content = $content -replace "import \{ IAppInsightsCore \} from `"@microsoft/applicationinsights-core-js/src/applicationinsights-core-js`";", ""
$content = $content -replace "IReadableSpan,", "IAppInsightsCore,`n    IReadableSpan,"
Set-Content $file -Value $content -NoNewline

# -----------------------------------------------------------------------------
# STEP 12b: Rush Update (Required before final verification)
# -----------------------------------------------------------------------------

Set-Location "D:\MSNev2\ApplicationInsights-JS"
rush update --recheck --full

# -----------------------------------------------------------------------------
# STEP 13: Final Verification
# -----------------------------------------------------------------------------

Set-Location "D:\MSNev2\ApplicationInsights-JS\shared\AppInsightsCore"
npx grunt core
npx grunt coreunittest

# Verify git history preserved
git log --follow --oneline -5 src/core/AppInsightsCore.ts
git log --follow --oneline -5 Tests/Unit/src/ai/Core/ApplicationInsightsCore.Tests.ts
```

---

## Verification Checklist

After completing the migration, verify:

### Build Verification
- [ ] `rush update --recheck --full` - Rush update completed successfully before building
- [ ] `npx grunt core` - Build passes with no errors
- [ ] `npx grunt coreunittest` - All 801 tests pass
- [ ] `npx grunt common` - AppInsightsCommon build passes (as re-export layer)
- [ ] Browser bundle output is `applicationinsights-core-js.js` (NOT `index.js`)

### Git History Verification
- [ ] `git log --follow src/core/AppInsightsCore.ts` - Shows full history
- [ ] `git log --follow src/utils/CoreUtils.ts` - Shows full history
- [ ] `git log --follow Tests/Unit/src/ai/Core/ApplicationInsightsCore.Tests.ts` - Shows full history
- [ ] `git log --follow Tests/Unit/src/ai/Common/AppInsightsCommon.tests.ts` - Shows history from AppInsightsCommon

### Structure Verification
- [ ] All old source directories removed: `Config/`, `JavaScriptSDK/`, `Common/`, `OpenTelemetry/`, `JavaScriptSDK.Enums/`, `JavaScriptSDK.Interfaces/`
- [ ] All old test directories removed: `Tests/Unit/src/Common/`, `Tests/Unit/src/OpenTelemetry/`
- [ ] New source directories exist: `config/`, `constants/`, `core/`, `diagnostics/`, `enums/`, `interfaces/`, `internal/`, `otel/`, `telemetry/`, `utils/`
- [ ] New test directories exist: `ai/Core/`, `ai/Common/`, `attribute/`, `internal/`, `trace/`

### Import Verification
- [ ] No deep path imports exist (`grep -r "/src/" *.ts` returns no matches for external packages)
- [ ] No internal index.ts imports exist (only `src/index.ts` should have index.ts)
- [ ] All TestPlugins imports use `./TestPlugins` (not `../TestPlugins`)

### Configuration Verification
- [ ] `tsconfig.json` - Updated with new include paths
- [ ] `rollup.config.js` - Uses `browserOutputName = "applicationinsights-core-js"`
- [ ] `api-extractor.json` - Points to `index.d.ts`
- [ ] `gruntfile.js` - InternalConstants path updated, commontest tasks empty

### Test Count Verification
- [ ] `ai/Core/` contains 17 test files
- [ ] `ai/Common/` contains 9 test files
- [ ] `attribute/` contains 1 test file
- [ ] `internal/` contains 2 test files
- [ ] `trace/` contains 2 test files
- [ ] Total: 31 test files + aiunittests.ts = 32 files

### Functionality Preservation
- [ ] All exports from `@microsoft/applicationinsights-core-js` continue to work
- [ ] All exports from `@microsoft/applicationinsights-common` work via re-export layer
- [ ] No functionality was deleted - only relocated
