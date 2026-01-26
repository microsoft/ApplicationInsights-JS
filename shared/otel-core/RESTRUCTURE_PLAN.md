# otel-core-js File Restructuring Plan

## Document Purpose

This document outlines a plan to restructure the `@microsoft/otel-core-js` package to:
1. **Maintain logical separation** between OpenTelemetry (OTel) and Application Insights (AI) specific code
2. **Elevate common/shared code** to parent directories when appropriate
3. **Reduce unnecessary nesting** while preserving clarity
4. **Improve discoverability** of exports and functionality

**Document Version:** 2.0  
**Created:** January 23, 2026  
**Completed:** January 23, 2026  
**Status:** ✅ COMPLETE - All phases executed successfully

---

## Current Directory Structure Analysis

### Current Structure Overview

```
shared/otel-core/src/
├── otel-core-js.ts                    # Main entry point (273+ exports)
├── __DynamicConstants.ts              # Auto-generated constants
│
├── config/
│   └── AppInsights/                   # 7 files - AI config management
│       ├── ConfigDefaultHelpers.ts
│       ├── ConfigDefaults.ts
│       ├── DynamicConfig.ts
│       ├── DynamicProperty.ts
│       ├── DynamicState.ts
│       ├── DynamicSupport.ts
│       └── IDynamicWatcher.ts
│
├── constants/
│   ├── Constants.ts                   # Common constants
│   ├── CoreInternalConstants.ts       # Internal constants
│   ├── InternalConstants.ts           # Internal constants
│   └── __DynamicConstants.ts          # Auto-generated
│
├── core/
│   └── AppInsights/                   # 19 files - AI core SDK classes
│       ├── AggregationError.ts
│       ├── AppInsightsCore.ts
│       ├── AsyncUtils.ts
│       ├── BaseTelemetryPlugin.ts
│       ├── Constants.ts
│       ├── CookieMgr.ts
│       ├── DbgExtensionUtils.ts
│       ├── EventHelpers.ts
│       ├── InstrumentHooks.ts
│       ├── NotificationManager.ts
│       ├── PerfManager.ts
│       ├── ProcessTelemetryContext.ts
│       ├── ResponseHelpers.ts
│       ├── SenderPostManager.ts
│       ├── StatsBeat.ts
│       ├── TelemetryHelpers.ts
│       ├── TelemetryInitializerPlugin.ts
│       ├── UnloadHandlerContainer.ts
│       └── UnloadHookContainer.ts
│
├── diagnostics/
│   └── AppInsights/                   # 2 files - AI diagnostic logging
│       ├── DiagnosticLogger.ts
│       └── ThrottleMgr.ts
│
├── enums/
│   ├── AppInsights/                   # 12 files - AI enums
│   │   ├── EnumHelperFuncs.ts
│   │   ├── Enums.ts
│   │   ├── EventsDiscardedReason.ts
│   │   ├── FeatureOptInEnums.ts
│   │   ├── InitActiveStatusEnum.ts
│   │   ├── LoggingEnums.ts
│   │   ├── SendRequestReason.ts
│   │   ├── StatsType.ts
│   │   ├── TelemetryUnloadReason.ts
│   │   ├── TelemetryUpdateReason.ts
│   │   ├── TraceHeadersMode.ts
│   │   └── W3CTraceFlags.ts
│   │
│   └── OTel/                          # 4 files + subdirs - OTel enums
│       ├── eAttributeChangeOp.ts
│       ├── logs/
│       │   └── eOTelSeverityNumber.ts
│       └── trace/
│           ├── OTelSamplingDecision.ts
│           ├── OTelSpanKind.ts
│           └── OTelSpanStatus.ts
│
├── interfaces/
│   ├── AppInsights/                   # 50+ files - AI interfaces
│   │   ├── config/                    # 5 files - Dynamic config interfaces
│   │   ├── context/                   # 11 files - Context interfaces
│   │   ├── contracts/                 # 21 files - Telemetry contracts
│   │   ├── telemetry/                 # 2 files - Telemetry interfaces
│   │   └── [40+ interface files]      # Core AI interfaces
│   │
│   └── OTel/                          # 40+ files - OTel interfaces
│       ├── attribute/                 # 1 file
│       ├── baggage/                   # 3 files
│       ├── config/                    # 5 files
│       ├── context/                   # 2 files
│       ├── logs/                      # 14 files
│       ├── metrics/                   # 2 files + meter/ subdirectory
│       │   └── meter/                 # 18 files
│       ├── propagation/               # 1 file
│       ├── resource/                  # 1 file
│       ├── resources/                 # 1 file
│       ├── trace/                     # 18 files
│       └── [6 interface files]        # Core OTel interfaces
│
├── internal/
│   └── otel/                          # 5 files - OTel internal utilities
│       ├── attributeHelpers.ts
│       ├── commonUtils.ts
│       ├── InternalConstants.ts
│       ├── LoggerProviderSharedState.ts
│       └── timeHelpers.ts
│
├── otel/                              # OTel implementations
│   ├── api/                           # OTel API implementations
│   │   ├── context/                   # 2 files
│   │   │   ├── context.ts
│   │   │   └── contextManager.ts
│   │   ├── errors/                    # 4 files
│   │   │   ├── OTelError.ts
│   │   │   ├── OTelInvalidAttributeError.ts
│   │   │   ├── OTelNotImplementedError.ts
│   │   │   └── OTelSpanError.ts
│   │   ├── trace/                     # 7 files
│   │   │   ├── nonRecordingSpan.ts
│   │   │   ├── span.ts
│   │   │   ├── spanContext.ts
│   │   │   ├── traceApi.ts
│   │   │   ├── tracer.ts
│   │   │   ├── traceState.ts
│   │   │   └── utils.ts
│   │   └── OTelApi.ts
│   │
│   ├── attribute/                     # 1 file
│   │   └── attributeContainer.ts
│   │
│   ├── resource/                      # 1 file
│   │   └── resource.ts
│   │
│   └── sdk/                           # 6 files - OTel SDK implementations
│       ├── config.ts
│       ├── OTelLogger.ts
│       ├── OTelLoggerProvider.ts
│       ├── OTelLogRecord.ts
│       ├── OTelMultiLogRecordProcessor.ts
│       └── OTelSdk.ts
│
├── telemetry/
│   ├── AppInsights/                   # 7 files + Common/
│   │   ├── Common/                    # 4 files - Common telemetry helpers
│   │   │   ├── Data.ts
│   │   │   ├── DataPoint.ts
│   │   │   ├── DataSanitizer.ts
│   │   │   └── Envelope.ts
│   │   ├── Event.ts
│   │   ├── Exception.ts
│   │   ├── Metric.ts
│   │   ├── PageView.ts
│   │   ├── PageViewPerformance.ts
│   │   ├── RemoteDependencyData.ts
│   │   └── Trace.ts
│   │
│   ├── ConnectionStringParser.ts      # Common (used by both)
│   ├── RequestResponseHeaders.ts      # Common (used by both)
│   ├── TelemetryItemCreator.ts        # Common (used by both)
│   └── W3cTraceState.ts               # Common (W3C standard)
│
├── types/
│   └── OTel/                          # 1 file
│       └── OTelAnyValue.ts
│
└── utils/
    ├── AppInsights/                   # 12 files - AI utilities
    │   ├── CoreUtils.ts
    │   ├── DataCacheHelper.ts
    │   ├── DomHelperFuncs.ts
    │   ├── EnvUtils.ts
    │   ├── EventHelpers.ts
    │   ├── HelperFuncs.ts
    │   ├── HelperFuncsCore.ts
    │   ├── RandomHelper.ts
    │   ├── StorageHelperFuncs.ts
    │   ├── TraceParent.ts
    │   ├── UrlHelperFuncs.ts
    │   └── Util.ts
    │
    ├── Offline.ts                     # Common utility
    └── UnloadHandlerContainer.ts      # Common utility
```

---

## Issues with Current Structure

### 1. Inconsistent Nesting
- Some directories have only `AppInsights/` subdirectory (config, core, diagnostics)
- Others have both `AppInsights/` and `OTel/` (enums, interfaces)
- Some have files at both levels (utils, telemetry)

### 2. Redundant Directory Levels
- `config/AppInsights/` - Only AI config exists, no OTel config here
- `core/AppInsights/` - Only AI core exists
- `diagnostics/AppInsights/` - Only AI diagnostics exists
- `types/OTel/` - Only OTel types exist

### 3. Common Code Not Elevated
- Files like `W3cTraceState.ts`, `ConnectionStringParser.ts` are in `telemetry/` root but logically belong to shared utilities
- `Offline.ts` and `UnloadHandlerContainer.ts` are at `utils/` root but could be better organized

### 4. Duplicate/Scattered Constants
- `constants/Constants.ts` at root
- `core/AppInsights/Constants.ts` - AI-specific
- `internal/otel/InternalConstants.ts` - OTel internal

### 5. Metrics Index File Violation
- `interfaces/OTel/metrics/meter/index.ts` exists - violates the "no directory-level index.ts" rule

---

## Proposed Restructured Directory Layout

### Design Principles

1. **Top-level directories for shared/common code** - No subdirectory prefix when code is used by both AI and OTel
2. **`ai/` subdirectory for Application Insights specific code** - Rename `AppInsights/` to `ai/` for brevity
3. **`otel/` subdirectory for OpenTelemetry specific code** - Keep as-is
4. **Flatten unnecessary nesting** - If only one subdirectory exists, evaluate if nesting is needed
5. **Group by functionality** - Keep related code together
6. **Remove directory-level index.ts files** - All exports through root `otel-core-js.ts`

### Proposed Structure

```
shared/otel-core/src/
├── otel-core-js.ts                    # Main entry point (unchanged)
├── __DynamicConstants.ts              # Auto-generated (unchanged)
│
├── config/                            # Configuration management
│   ├── ConfigDefaultHelpers.ts        # ⬆️ Elevated from config/AppInsights/
│   ├── ConfigDefaults.ts              # ⬆️ Elevated from config/AppInsights/
│   ├── DynamicConfig.ts               # ⬆️ Elevated from config/AppInsights/
│   ├── DynamicProperty.ts             # ⬆️ Elevated from config/AppInsights/
│   ├── DynamicState.ts                # ⬆️ Elevated from config/AppInsights/
│   └── DynamicSupport.ts              # ⬆️ Elevated from config/AppInsights/
│   # Note: IDynamicWatcher.ts moves to interfaces/config/
│
├── constants/                         # All constants consolidated
│   ├── Constants.ts                   # Common constants (keep)
│   ├── InternalConstants.ts           # Merged internal constants
│   └── __DynamicConstants.ts          # delete auto build generated file
│   # Note: core/AppInsights/Constants.ts merged or renamed
│
├── core/                              # Core SDK classes - ELEVATED
│   ├── AggregationError.ts            # ⬆️ Elevated from core/AppInsights/
│   ├── AppInsightsCore.ts             # ⬆️ Elevated from core/AppInsights/
│   ├── AsyncUtils.ts                  # ⬆️ Elevated from core/AppInsights/
│   ├── BaseTelemetryPlugin.ts         # ⬆️ Elevated from core/AppInsights/
│   ├── CookieMgr.ts                   # ⬆️ Elevated from core/AppInsights/
│   ├── DbgExtensionUtils.ts           # ⬆️ Elevated from core/AppInsights/
│   ├── EventHelpers.ts                # ⬆️ Elevated from core/AppInsights/
│   ├── InstrumentHooks.ts             # ⬆️ Elevated from core/AppInsights/
│   ├── NotificationManager.ts         # ⬆️ Elevated from core/AppInsights/
│   ├── PerfManager.ts                 # ⬆️ Elevated from core/AppInsights/
│   ├── ProcessTelemetryContext.ts     # ⬆️ Elevated from core/AppInsights/
│   ├── ResponseHelpers.ts             # ⬆️ Elevated from core/AppInsights/
│   ├── SenderPostManager.ts           # ⬆️ Elevated from core/AppInsights/
│   ├── StatsBeat.ts                   # ⬆️ Elevated from core/AppInsights/
│   ├── TelemetryHelpers.ts            # ⬆️ Elevated from core/AppInsights/
│   ├── TelemetryInitializerPlugin.ts  # ⬆️ Elevated from core/AppInsights/
│   ├── UnloadHandlerContainer.ts      # ⬆️ Elevated from core/AppInsights/
│   └── UnloadHookContainer.ts         # ⬆️ Elevated from core/AppInsights/
│
├── diagnostics/                       # Diagnostic and logging - ELEVATED
│   ├── DiagnosticLogger.ts            # ⬆️ Elevated from diagnostics/AppInsights/
│   └── ThrottleMgr.ts                 # ⬆️ Elevated from diagnostics/AppInsights/
│
├── enums/                             # Enum definitions
│   ├── EnumHelperFuncs.ts             # ⬆️ Elevated - shared helper
│   │
│   ├── ai/                            # AI-specific enums (renamed from AppInsights)
│   │   ├── Enums.ts
│   │   ├── EventsDiscardedReason.ts
│   │   ├── FeatureOptInEnums.ts
│   │   ├── InitActiveStatusEnum.ts
│   │   ├── LoggingEnums.ts
│   │   ├── SendRequestReason.ts
│   │   ├── StatsType.ts
│   │   ├── TelemetryUnloadReason.ts
│   │   ├── TelemetryUpdateReason.ts
│   │   ├── TraceHeadersMode.ts
│   │   └── W3CTraceFlags.ts           # Consider: W3C is a standard, could be common
│   │
│   └── otel/                          # OTel-specific enums (flattened)
│       ├── eAttributeChangeOp.ts
│       ├── eOTelSeverityNumber.ts     # ⬆️ Elevated from enums/OTel/logs/
│       ├── OTelSamplingDecision.ts    # ⬆️ Elevated from enums/OTel/trace/
│       ├── OTelSpanKind.ts            # ⬆️ Elevated from enums/OTel/trace/
│       └── OTelSpanStatus.ts          # ⬆️ Elevated from enums/OTel/trace/
│
├── interfaces/                        # Interface definitions
│   ├── IException.ts                  # COMMON - OTel exception interface (from OTel/)
│   ├── IExportResult.ts               # COMMON - export result (from OTel/)
│   ├── time.ts                        # COMMON - time interfaces (from OTel/)
│   │
│   ├── config/                        # NEW - Common config interfaces
│   │   ├── IConfigDefaults.ts         # From ai/config/
│   │   ├── IDynamicConfigHandler.ts   # From ai/config/
│   │   ├── IDynamicPropertyHandler.ts # From ai/config/
│   │   ├── IDynamicWatcher.ts         # From ai/config/ and config/AppInsights/
│   │   └── _IDynamicConfigHandlerState.ts  # From ai/config/
│   │
│   ├── ai/                            # AI-specific interfaces (renamed from AppInsights)
│   │   ├── context/                   # Context interfaces (11 files)
│   │   ├── contracts/                 # Telemetry contracts (21 files)
│   │   ├── telemetry/                 # Telemetry interfaces (2 files)
│   │   └── [40+ interface files]      # Core AI interfaces (unchanged)
│   │
│   └── otel/                          # OTel-specific interfaces (lowercase)
│       ├── attribute/                 # 1 file
│       ├── baggage/                   # 3 files
│       ├── config/                    # 5 files
│       ├── context/                   # 2 files
│       ├── logs/                      # 14 files
│       ├── metrics/                   # Flattened - meter/ contents elevated
│       │   ├── IOTelMetricsApi.ts
│       │   ├── eValueType.ts
│       │   ├── IBatchObservableCallback.ts
│       │   ├── ICounter.ts
│       │   ├── IGauge.ts
│       │   ├── IHistogram.ts
│       │   ├── IMeter.ts
│       │   ├── IMeterOptions.ts
│       │   ├── IMeterProvider.ts
│       │   ├── IMetricAdvice.ts
│       │   ├── IMetricAttributes.ts
│       │   ├── IMetricOptions.ts
│       │   ├── IObservable.ts
│       │   ├── IObservableCounter.ts
│       │   ├── IObservableGauge.ts
│       │   ├── IObservableResult.ts
│       │   ├── IObservableUpDownCounter.ts
│       │   └── IUpDownCounter.ts
│       ├── propagation/               # 1 file
│       ├── resource/                  # Merge with resources/ - 2 files total
│       ├── trace/                     # 18 files
│       ├── IOTelApi.ts
│       ├── IOTelApiCtx.ts
│       ├── IOTelAttributes.ts
│       ├── IOTelSdk.ts
│       └── IOTelSdkCtx.ts
│
├── internal/                          # Internal utilities (non-exported)
│   ├── InternalConstants.ts           # ⬆️ Consolidated internal constants
│   ├── attributeHelpers.ts            # ⬆️ Elevated from internal/otel/
│   ├── commonUtils.ts                 # ⬆️ Elevated from internal/otel/
│   ├── LoggerProviderSharedState.ts   # ⬆️ Elevated from internal/otel/
│   └── timeHelpers.ts                 # ⬆️ Elevated from internal/otel/
│
├── otel/                              # OTel implementations (KEEP STRUCTURE)
│   ├── api/                           # OTel API implementations
│   │   ├── context/                   # 2 files
│   │   ├── errors/                    # 4 files
│   │   ├── trace/                     # 7 files
│   │   └── OTelApi.ts
│   │
│   ├── attribute/                     # 1 file
│   ├── resource/                      # 1 file
│   │
│   └── sdk/                           # OTel SDK implementations
│       ├── config.ts
│       ├── OTelLogger.ts
│       ├── OTelLoggerProvider.ts
│       ├── OTelLogRecord.ts
│       ├── OTelMultiLogRecordProcessor.ts
│       └── OTelSdk.ts
│
├── telemetry/                         # Telemetry creation
│   ├── ConnectionStringParser.ts      # COMMON (keep at root)
│   ├── RequestResponseHeaders.ts      # COMMON (keep at root)
│   ├── TelemetryItemCreator.ts        # COMMON (keep at root)
│   ├── W3cTraceState.ts               # COMMON - W3C standard
│   │
│   └── ai/                            # AI telemetry types (renamed from AppInsights)
│       ├── Common/                    # Common helpers (could flatten)
│       │   ├── Data.ts
│       │   ├── DataPoint.ts
│       │   ├── DataSanitizer.ts
│       │   └── Envelope.ts
│       ├── Event.ts
│       ├── Exception.ts
│       ├── Metric.ts
│       ├── PageView.ts
│       ├── PageViewPerformance.ts
│       ├── RemoteDependencyData.ts
│       └── Trace.ts
│
├── types/                             # Type definitions - FLATTENED
│   └── OTelAnyValue.ts                # ⬆️ Elevated from types/OTel/
│
└── utils/                             # Utility functions
    ├── Offline.ts                     # COMMON (keep at root)
    │
    └── ai/                            # AI utilities (renamed from AppInsights)
        ├── CoreUtils.ts
        ├── DataCacheHelper.ts
        ├── DomHelperFuncs.ts
        ├── EnvUtils.ts
        ├── EventHelpers.ts
        ├── HelperFuncs.ts
        ├── HelperFuncsCore.ts
        ├── RandomHelper.ts
        ├── StorageHelperFuncs.ts
        ├── TraceParent.ts
        ├── UrlHelperFuncs.ts
        └── Util.ts
```

---

## Detailed Change Plan

### Phase A: Remove Violations and Consolidate

#### A.1: Remove Directory-Level index.ts Files
- **DELETE**: `interfaces/OTel/metrics/meter/index.ts`
- Update all imports that reference this index to use explicit file paths
- Update `otel-core-js.ts` to export all meter interfaces explicitly

#### A.2: Consolidate Constants
- **MERGE** `core/AppInsights/Constants.ts` into `constants/Constants.ts` (or rename to distinguish)
- **MERGE** `constants/InternalConstants.ts` and `internal/otel/InternalConstants.ts` into single `internal/InternalConstants.ts`
- **KEEP** `constants/CoreInternalConstants.ts` if it has distinct purpose

#### A.3: Merge Duplicate Resource Directories
- **MERGE** `interfaces/OTel/resource/` and `interfaces/OTel/resources/` into single `interfaces/otel/resource/`

---

### Phase B: Elevate Single-Subdirectory Contents

#### B.1: Elevate config/AppInsights/ to config/
Files to move up one level:
```
config/AppInsights/ConfigDefaultHelpers.ts  → config/ConfigDefaultHelpers.ts
config/AppInsights/ConfigDefaults.ts        → config/ConfigDefaults.ts
config/AppInsights/DynamicConfig.ts         → config/DynamicConfig.ts
config/AppInsights/DynamicProperty.ts       → config/DynamicProperty.ts
config/AppInsights/DynamicState.ts          → config/DynamicState.ts
config/AppInsights/DynamicSupport.ts        → config/DynamicSupport.ts
config/AppInsights/IDynamicWatcher.ts       → interfaces/config/IDynamicWatcher.ts (interface)
```

#### B.2: Elevate core/AppInsights/ to core/
Files to move up one level (19 files):
```
core/AppInsights/*.ts → core/*.ts
```

#### B.3: Elevate diagnostics/AppInsights/ to diagnostics/
Files to move up one level:
```
diagnostics/AppInsights/DiagnosticLogger.ts → diagnostics/DiagnosticLogger.ts
diagnostics/AppInsights/ThrottleMgr.ts      → diagnostics/ThrottleMgr.ts
```

#### B.4: Elevate internal/otel/ to internal/
Files to move up one level:
```
internal/otel/attributeHelpers.ts           → internal/attributeHelpers.ts
internal/otel/commonUtils.ts                → internal/commonUtils.ts
internal/otel/InternalConstants.ts          → internal/InternalConstants.ts
internal/otel/LoggerProviderSharedState.ts  → internal/LoggerProviderSharedState.ts
internal/otel/timeHelpers.ts                → internal/timeHelpers.ts
```

#### B.5: Elevate types/OTel/ to types/
Files to move up one level:
```
types/OTel/OTelAnyValue.ts → types/OTelAnyValue.ts
```

---

### Phase C: Rename AppInsights to ai

Rename all `AppInsights` subdirectories to `ai` for brevity and consistency:

#### C.1: Rename in enums/
```
enums/AppInsights/ → enums/ai/
```

#### C.2: Rename in interfaces/
```
interfaces/AppInsights/ → interfaces/ai/
```

#### C.3: Rename in telemetry/
```
telemetry/AppInsights/ → telemetry/ai/
```

#### C.4: Rename in utils/
```
utils/AppInsights/ → utils/ai/
```

---

### Phase D: Flatten OTel Enum Subdirectories

#### D.1: Flatten enums/OTel/logs/ and enums/OTel/trace/
```
enums/OTel/logs/eOTelSeverityNumber.ts     → enums/otel/eOTelSeverityNumber.ts
enums/OTel/trace/OTelSamplingDecision.ts   → enums/otel/OTelSamplingDecision.ts
enums/OTel/trace/OTelSpanKind.ts           → enums/otel/OTelSpanKind.ts
enums/OTel/trace/OTelSpanStatus.ts         → enums/otel/OTelSpanStatus.ts
```

#### D.2: Rename OTel to otel (lowercase)
```
enums/OTel/ → enums/otel/
interfaces/OTel/ → interfaces/otel/
```

---

### Phase E: Flatten OTel Metrics Meter Subdirectory

#### E.1: Elevate meter/ contents to metrics/
```
interfaces/OTel/metrics/meter/*.ts → interfaces/otel/metrics/*.ts
```
(18 files to move up one level)

---

### Phase F: Elevate Shared Enum Helper

#### F.1: Move EnumHelperFuncs to enums root
```
enums/AppInsights/EnumHelperFuncs.ts → enums/EnumHelperFuncs.ts
```
This is used by both AI and OTel enum definitions.

---

### Phase G: Move Common OTel Interfaces to interfaces/ Root

#### G.1: Elevate truly common interfaces
```
interfaces/OTel/IException.ts    → interfaces/IException.ts
interfaces/OTel/IExportResult.ts → interfaces/IExportResult.ts
interfaces/OTel/time.ts          → interfaces/time.ts
```
These are fundamental types used across the package.

---

### Phase H: Create interfaces/config/ for Dynamic Config Interfaces

#### H.1: Move config interfaces from interfaces/ai/config/
```
interfaces/AppInsights/config/*.ts → interfaces/config/*.ts
```
These dynamic config interfaces are core infrastructure used throughout.

---

### Phase I: Clean Up utils/

#### I.1: Remove duplicate UnloadHandlerContainer.ts
- `utils/UnloadHandlerContainer.ts` appears to be duplicate of `core/AppInsights/UnloadHandlerContainer.ts`
- Verify and remove duplicate, keep one authoritative location

---

## Implementation Order

Execute phases in this order to minimize intermediate compilation errors:

1. **Phase A** - Remove violations (index.ts, consolidate constants) ✅ COMPLETE
2. **Phase B** - Elevate single-subdirectory contents (config, core, diagnostics, internal, types) ✅ COMPLETE
3. **Phase C** - Rename AppInsights → ai ✅ COMPLETE
4. **Phase D** - Flatten and lowercase OTel enums ✅ COMPLETE
5. **Phase E** - Flatten metrics/meter ✅ COMPLETE
6. **Phase F** - Elevate EnumHelperFuncs ✅ COMPLETE
7. **Phase G** - Elevate common OTel interfaces ✅ COMPLETE
8. **Phase H** - Create interfaces/config/ ✅ COMPLETE
9. **Phase I** - Clean up utils duplicates ✅ COMPLETE

**After each phase:**
- Update all import statements in affected files
- Update `otel-core-js.ts` exports
- Run `npm run build` to verify compilation
- Run `rush rebuild` to verify repository-wide compilation

**Final Verification:** ✅ `rush build` completed successfully with all packages building.

---

## Files Summary

### Files to Elevate (Move Up One Level)

| Current Location | New Location |
|-----------------|--------------|
| `config/AppInsights/*.ts` (7 files) | `config/*.ts` |
| `core/AppInsights/*.ts` (19 files) | `core/*.ts` |
| `diagnostics/AppInsights/*.ts` (2 files) | `diagnostics/*.ts` |
| `internal/otel/*.ts` (5 files) | `internal/*.ts` |
| `types/OTel/*.ts` (1 file) | `types/*.ts` |
| `enums/OTel/logs/*.ts` (1 file) | `enums/otel/*.ts` |
| `enums/OTel/trace/*.ts` (3 files) | `enums/otel/*.ts` |
| `interfaces/OTel/metrics/meter/*.ts` (18 files) | `interfaces/otel/metrics/*.ts` |
| `enums/AppInsights/EnumHelperFuncs.ts` | `enums/EnumHelperFuncs.ts` |

### Directories to Rename

| Current Name | New Name |
|-------------|----------|
| `enums/AppInsights/` | `enums/ai/` |
| `interfaces/AppInsights/` | `interfaces/ai/` |
| `telemetry/AppInsights/` | `telemetry/ai/` |
| `utils/AppInsights/` | `utils/ai/` |
| `enums/OTel/` | `enums/otel/` |
| `interfaces/OTel/` | `interfaces/otel/` |

### Files to Delete

| File | Reason |
|------|--------|
| `interfaces/OTel/metrics/meter/index.ts` | Violates no-index.ts rule |

### Files to Merge/Consolidate

| Files to Merge | Target |
|---------------|--------|
| `constants/InternalConstants.ts` + `internal/otel/InternalConstants.ts` | `internal/InternalConstants.ts` |
| `interfaces/OTel/resource/` + `interfaces/OTel/resources/` | `interfaces/otel/resource/` |

---

## Estimated Impact

- **Total files to move**: ~60 files
- **Directories to rename**: 6
- **Files to delete**: 1
- **Files to merge**: 2-4
- **Import statements to update**: 200+ (estimated)
- **Build cycles for validation**: 9 (one per phase)

---

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Breaking external imports | All exports via `otel-core-js.ts` - external API unchanged |
| Missing import updates | Use grep/search to find all references before moving |
| Build failures during migration | Complete each phase fully before moving to next |
| Test failures | Run full test suite after each phase |

---

## Next Steps

~~1. **Review this plan** with stakeholders~~
~~2. **Approve the naming conventions** (especially `ai/` vs `AppInsights/`)~~
~~3. **Create a backup branch** before starting~~
~~4. **Execute phases one at a time** with validation between each~~
~~5. **Update documentation** after completion~~

All restructuring phases have been completed successfully. The package now has:
- Cleaner directory structure with logical separation
- Common code elevated to parent directories
- Consistent naming (`ai/` for Application Insights, `otel/` for OpenTelemetry)
- Reduced nesting and improved discoverability
- All builds passing across the entire repository

---

## Open Questions - RESOLVED

1. **Should W3CTraceFlags.ts be considered common?** - Kept in `enums/ai/` for now, can be moved later if needed
2. **Should `telemetry/ai/Common/` be flattened?** - Kept as-is, the 4 files have logical grouping
3. **What about `utils/ai/EventHelpers.ts` vs `core/EventHelpers.ts`?** - These have different purposes, both kept
4. **Should `core/` remain AI-focused or become truly shared?** - Elevated to `core/` level (was `core/AppInsights/`)

---

*Document updated after successful completion of all phases.*
