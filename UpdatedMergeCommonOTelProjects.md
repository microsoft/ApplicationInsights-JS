# Updated Plan: Merge AppInsightsCore, AppInsightsCommon, and OpenTelemetry Projects

## Project Goal & Context

**Objective:** Create a unified core infrastructure for the Application Insights JavaScript SDK by consolidating three separate shared packages into two new, purpose-built packages.

### What This Merge Accomplishes

**Creating 2 New Packages:**
1. **`@microsoft/otel-core-js`** - The new unified common core for ALL projects in the repository
2. **`@microsoft/otel-noop-js`** - Separated no-operation (noop) implementations for lightweight scenarios

**Consolidating 3 Existing Packages:**
1. **`@microsoft/applicationinsights-core-js`** (AppInsightsCore) → merge into `otel-core-js`
2. **`@microsoft/applicationinsights-common`** (AppInsightsCommon) → merge into `otel-core-js`
3. **`@microsoft/otel-core-js`** (OpenTelemetry) → merge into `otel-core-js` + split noop → `otel-noop-js`

**Why This Merge:**
- **Eliminates duplication** - Three packages had overlapping functionality and shared dependencies
- **Simplifies maintenance** - Single core package easier to maintain than three separate ones
- **Clearer architecture** - Organized by functionality (config, diagnostics, telemetry) rather than historical boundaries
- **Better tree-shaking** - Consumers can import only what they need from unified package
- **Separates concerns** - Noop implementations in separate package for minimal bundle size scenarios

**Package Relationships After Merge:**
```
┌─────────────────────────────────────────────────────┐
│  @microsoft/otel-core-js                            │
│  (NEW - Unified core for entire repository)         │
│  - Core SDK (AppInsightsCore)                       │
│  - Configuration management                          │
│  - Telemetry items & contracts                      │
│  - Diagnostics & logging                            │
│  - OpenTelemetry API & SDK implementations          │
│  - Shared utilities & helpers                       │
└─────────────────────────────────────────────────────┘
            ▲                    ▲                    ▲
            │                    │                    │
   ┌────────┴────────┐  ┌────────┴────────┐  ┌────────┴────────┐
   │     AISKU       │  │   AISKULight    │  │   Extensions    │
   │  (Full SDK)     │  │  (Lightweight)  │  │  (Plugins)      │
   └─────────────────┘  └─────────────────┘  └─────────────────┘

┌─────────────────────────────────────────────────────┐
│  @microsoft/otel-noop-js                            │
│  (NEW - Lightweight noop implementations)           │
│  - Noop telemetry plugin                            │
│  - Noop logger                                      │
│  - Noop span/tracer                                 │
│  - Used for testing & minimal scenarios             │
└─────────────────────────────────────────────────────┘
```

**Source Package Retirement:**
After merge completion, these packages will be deleted:
- ❌ `@microsoft/applicationinsights-core-js` - Replaced by `@microsoft/otel-core-js`
- ❌ `@microsoft/applicationinsights-common` - Replaced by `@microsoft/otel-core-js`
- ❌ `@microsoft/otel-core-js` (existing package in `shared/OpenTelemetry`) - Folder renamed to `shared/otel-core` and merged with `@microsoft/otel-noop-js`

---

## Document Purpose

This document reflects the **actual implementation** of merging three core shared packages (AppInsightsCore, AppInsightsCommon, and OpenTelemetry) into a single unified `otel-core` project. It captures lessons learned, actual steps taken, and provides a template for future similar migrations or branch merges.

**Document Version:** 2.1  
**Last Updated:** January 20, 2026

## Executive Summary

**Merge Operation:** Consolidating 3 shared packages → 2 new purpose-built packages

**Source Packages (To Be Merged):**
- `@microsoft/applicationinsights-core-js` (AppInsightsCore) - 32 files
- `@microsoft/applicationinsights-common` (AppInsightsCommon) - 134 files
- `@microsoft/otel-core-js` (OpenTelemetry) - 112 files
- **Total& Success Criteria

### Primary Goals

1. **Create Unified Core Package (`@microsoft/otel-core-js`)**
   - Merge AppInsightsCore, AppInsightsCommon, OpenTelemetry into single package
   - Organize by functionality, not historical boundaries
   - Maintain zero compilation errors throughout the process
   - Preserve all functionality from source packages

2. **Extract Noop Implementations (`@microsoft/otel-noop-js`)**
   - Separate noop code from OpenTelemetry into dedicated package
   - Enable lightweight scenarios without full core package
   - Maintain clean separation of concerns

3. **Update All Consuming Packages**
   - Update rush.json with new package definitions
   - Update gruntfile.js build configurations
   - Update package.json dependencies across all projects
   - Update import statements in all consuming code
   - Validate clean builds across entire repository

4. **Maintain Code Quality**
   - Zero TypeScript compilation errors at all times
   - Preserve all existing functionality
   - No breaking changes to public APIs
   - All tests continue to pass

### Success Criteria

**Critical Requirements (Must Complete for Success):**
- otel-core-js compiles cleanly with zero errors
- otel-noop-js compiles cleanly with zero errors
- All consuming packages updated to reference new packages
- All consuming packages compile successfully
- Complete test suite passes
- Comprehensive documentation in place

**Supporting Requirements (Needed for Maintainability):**
- Clear migration path documented
- Rollback plan documented
- Lessons learned captured for future merges
- AI-executable instructions for file migration

**Optional Enhancements (Nice to Have):**
- Performance benchmarks showing no regression
- Bundle size analysis showing reduction potential
- Migration tool/script for future similar operations

**Key Achievements (When Complete):**
- Single unified core package that ALL repository projects depend on
- Organized by functionality (config, diagnostics, telemetry, core, otel)
- Separated noop implementations for lightweight scenarios
- Zero duplication across packages

## Actual Folder Structure Implemented

```
otel-core/
├── package.json                    # Combined dependencies from all 3 packages
├── tsconfig.json                   # Unified TypeScript configuration
├── rollup.config.js                # Combined build configuration
├── README.md                       # Comprehensive package documentation
├── MIGRATION.md                    # User migration guide
├── API.md                          # API reference documentation
├── MIGRATION_VERIFICATION.md       # Migration audit trail
├── typedoc.json                    # API doc generation config
├── LICENSE
├── NOTICE
├── PRIVACY
│
├── src/
│   ├── index.ts                    # Main entry point (273 exports)
│   ├── InternalConstants.ts        # Consolidated constants
│   │
│   ├── interfaces/                 # All interface definitions
│   │   ├── IException.ts           # Shared OTel interface
│   │   ├── IExportResult.ts        # Shared OTel interface
│   │   ├── time.ts                 # Shared time interface
│   │   │
│   │   ├── AppInsights/            # AppInsights-specific interfaces
│   │   │   ├── IAppInsightsCore.ts
│   │   │   ├── ITelemetryPlugin.ts
│   │   │   ├── ITelemetryItem.ts
│   │   │   ├── IDiagnosticLogger.ts
│   │   │   ├── INotificationManager.ts
│   │   │   ├── telemetry/          # From AppInsightsCommon/Interfaces/
│   │   │   │   ├── ITelemetry.ts
│   │   │   │   ├── IMetric.ts
│   │   │   │   ├── ITrace.ts
│   │   │   │   └── ...
│   │   │   ├── config/             # Configuration interfaces
│   │   │   │   ├── IDynamicConfig.ts
│   │   │   │   └── IDynamicWatcher.ts
│   │   │   ├── plugin/             # Plugin-related interfaces
│   │   │   └── core/               # Core SDK interfaces
│   │   │       ├── IUnloadHookContainer.ts
│   │   │       ├── IUnloadHandlerContainer.ts
│   │   │       └── IPluginState.ts
│   │   │
│   │   └── OTel/                   # OpenTelemetry interfaces
│   │       ├── IOTelApi.ts
│   │       ├── IOTelSdk.ts
│   │       ├── IOTelApiCtx.ts
│   │       ├── IOTelSdkCtx.ts
│   │       ├── IOTelAttributes.ts
│   │       ├── IException.ts       # OTel-specific
│   │       ├── IExportResult.ts    # OTel-specific
│   │       ├── attribute/
│   │       │   └── IAttributeContainer.ts
│   │       ├── baggage/
│   │       ├── config/
│   │       │   └── IOTelAttributeLimits.ts
│   │       ├── context/
│   │       │   └── IOTelContext.ts
│   │       ├── logs/
│   │       │   ├── IOTelLogger.ts
│   │       │   └── IOTelLogRecord.ts
│   │       ├── metrics/
│   │       ├── propagation/
│   │       ├── resource/
│   │       │   └── IOTelResource.ts
│   │       ├── resources/
│   │       └── trace/
│   │           ├── IOTelTracer.ts
│   │           └── IOTelSpan.ts
│   │
│   ├── enums/                      # All enum definitions
│   │   ├── EnumHelperFuncs.ts      # Shared enum utilities
│   │   │
│   │   ├── AppInsights/            # From AppInsightsCommon/Enums/
│   │   │   ├── Enums.ts
│   │   │   ├── EventsDiscardedReason.ts
│   │   │   ├── FeatureOptInEnums.ts
│   │   │   ├── InitActiveStatusEnum.ts
│   │   │   ├── LoggingEnums.ts
│   │   │   ├── SendRequestReason.ts
│   │   │   ├── StatsType.ts
│   │   │   ├── TelemetryUnloadReason.ts
│   │   │   ├── TelemetryUpdateReason.ts
│   │   │   ├── TraceHeadersMode.ts
│   │   │   └── W3CTraceFlags.ts
│   │   │
│   │   └── OTel/                   # From OpenTelemetry/enums/
│   │       ├── eAttributeChangeOp.ts
│   │       ├── logs/
│   │       │   └── eOTelSeverityNumber.ts
│   │       └── trace/
│   │           └── eOTelSpanKind.ts
│   │
│   ├── types/                      # Type definitions
│   │   ├── AppInsights/            # AppInsights types
│   │   └── OTel/                   # OpenTelemetry types
│   │       └── OTelAnyValue.ts
│   │
│   ├── config/                     # Configuration management
│   │   ├── config.ts               # Config utilities
│   │   ├── ConfigDefaults.ts       # From AppInsightsCore
│   │   ├── ConfigDefaultHelpers.ts
│   │   ├── DynamicConfig.ts        # Runtime config updates
│   │   ├── DynamicProperty.ts
│   │   ├── DynamicState.ts
│   │   └── DynamicSupport.ts
│   │
│   ├── diagnostics/                # Diagnostic and logging utilities
│   │   ├── DiagnosticLogger.ts     # From AppInsightsCore
│   │   └── otel/                   # OTel logging implementations
│   │       ├── OTelLogger.ts
│   │       ├── OTelLoggerProvider.ts
│   │       ├── OTelLogRecord.ts
│   │       ├── OTelMultiLogRecordProcessor.ts
│   │       └── noopStubs/          # NotImplemented stubs
│   │           ├── noopLogger.ts
│   │           └── noopLogRecordProcessor.ts
│   │
│   ├── core/                       # Core SDK functionality
│   │   ├── AppInsightsCore.ts      # From AppInsightsCore/JavaScriptSDK/
│   │   ├── BaseTelemetryPlugin.ts
│   │   ├── NotificationManager.ts
│   │   ├── PerfManager.ts
│   │   ├── ProcessTelemetryContext.ts
│   │   ├── CookieMgr.ts
│   │   ├── EventHelpers.ts
│   │   ├── InstrumentHooks.ts
│   │   ├── SenderPostManager.ts
│   │   ├── StatsBeat.ts
│   │   ├── DbgExtensionUtils.ts
│   │   ├── AggregationError.ts
│   │   └── Constants.ts
│   │
│   ├── telemetry/                  # Telemetry creation and handling
│   │   ├── TelemetryItemCreator.ts # From AppInsightsCommon
│   │   ├── ConnectionStringParser.ts
│   │   ├── RequestResponseHeaders.ts
│   │   ├── W3cTraceState.ts
│   │   ├── Event.ts                # From AppInsightsCommon/Telemetry/
│   │   ├── Exception.ts
│   │   ├── Metric.ts
│   │   ├── Trace.ts
│   │   ├── PageView.ts
│   │   ├── PageViewData.ts
│   │   ├── PageViewPerformance.ts
│   │   └── RemoteDependencyData.ts
│   │
│   ├── utils/                      # Shared utility functions
│   │   ├── ThrottleMgr.ts          # From AppInsightsCore/Diagnostics/
│   │   ├── AsyncUtils.ts           # From AppInsightsCore/JavaScriptSDK/
│   │   ├── ResponseHelpers.ts
│   │   ├── DbgExtensionUtils.ts
│   │   ├── Offline.ts              # From AppInsightsCommon
│   │   ├── UnloadHandlerContainer.ts
│   │   ├── notImplemented.ts       # Noop stub helper
│   │   ├── CoreUtils.ts            # From AppInsightsCommon/Utils/
│   │   ├── DataCacheHelper.ts
│   │   ├── Util.ts
│   │   ├── HashCodeScoreGenerator.ts
│   │   ├── StringUtils.ts
│   │   └── Extensions.ts
│   │
│   ├── constants/                  # Constant definitions
│   │   ├── Constants.ts            # From AppInsightsCommon
│   │   └── CoreConstants.ts
│   │
│   ├── otel/                       # OpenTelemetry implementations
│   │   ├── OTelApi.ts              # Bridge - From AppInsightsCore
│   │   ├── OTelSdk.ts              # Bridge - From AppInsightsCore
│   │   │
│   │   ├── api/                    # OpenTelemetry API implementations
│   │   │   ├── context/
│   │   │   │   └── OTelContext.ts
│   │   │   ├── errors/
│   │   │   │   └── OTelError.ts
│   │   │   └── trace/
│   │   │       ├── OTelTracer.ts
│   │   │       └── OTelSpan.ts
│   │   │
│   │   ├── sdk/                    # OpenTelemetry SDK implementations
│   │   │   └── config.ts
│   │   │
│   │   ├── attribute/              # Attribute handling
│   │   │   └── attributeContainer.ts
│   │   │
│   │   └── resource/               # Resource handling
│   │       └── resource.ts
│   │
│   └── internal/                   # Internal utilities
│       └── otel/                   # OTel internal utilities
│           ├── attributeHelpers.ts
│           ├── commonUtils.ts
│           ├── InternalConstants.ts
│           ├── LoggerProviderSharedState.ts
│           ├── timeHelpers.ts
│           └── noopStubs/          # NotImplemented stubs
│               └── noopLogRecordProcessor.ts
│
├── Tests/
│   ├── Unit/
│   │   ├── src/
│   │   │   └── index.tests.ts      # Main test entry point
│   │   ├── AppInsights/            # Tests from Core & Common
│   │   │   ├── Core/               # AppInsightsCore tests (18 files)
│   │   │   │   ├── index.tests.ts
│   │   │   │   ├── ApplicationInsightsCore.Tests.ts
│   │   │   │   ├── AppInsightsCoreSize.Tests.ts
│   │   │   │   ├── CookieManager.Tests.ts
│   │   │   │   ├── DynamicConfig.Tests.ts
│   │   │   │   ├── Dynamic.Tests.ts
│   │   │   │   ├── EventHelper.Tests.ts
│   │   │   │   ├── EventsDiscardedReason.Tests.ts
│   │   │   │   ├── HelperFunc.Tests.ts
│   │   │   │   ├── LoggingEnum.Tests.ts
│   │   │   │   ├── SendPostManager.Tests.ts
│   │   │   │   ├── StatsBeat.Tests.ts
│   │   │   │   ├── ThrottleMgr.tests.ts
│   │   │   │   ├── UpdateConfig.Tests.ts
│   │   │   │   ├── errors.Tests.ts
│   │   │   │   └── traceState.Tests.ts
│   │   │   └── Common/             # AppInsightsCommon tests (12 files)
│   │   │       ├── AppInsightsCommon.tests.ts
│   │   │       ├── ConnectionStringParser.tests.ts
│   │   │       ├── Exception.tests.ts
│   │   │       ├── RequestHeaders.tests.ts
│   │   │       ├── SeverityLevel.tests.ts
│   │   │       ├── ThrottleMgr.tests.ts
│   │   │       ├── Util.tests.ts
│   │   │       ├── W3cTraceParentTests.ts
│   │   │       ├── W3CTraceStateModes.tests.ts
│   │   │       └── W3TraceState.Tests.ts
│   │   └── OTel/                   # OpenTelemetry tests (9 files)
│   │       ├── index.tests.ts
│   │       ├── api/
│   │       │   └── OTelApi.Tests.ts
│   │       ├── attribute/
│   │       │   └── AttributeContainer.Tests.ts
│   │       ├── internal/
│   │       │   └── commonUtils.Tests.ts
│   │       ├── sdk/
│   │       │   ├── OTelLogger.Tests.ts
│   │       │   ├── OTelLoggerProvider.Tests.ts
│   │       │   ├── OTelLogRecord.Tests.ts
│   │       │   └── OTelMultiLogRecordProcessor.Tests.ts
│   │       └── trace/
│   │           └── span.Tests.ts
│   ├── Perf/
│   ├── tsconfig.json
│   ├── PerfTests.html
│   └── UnitTests.html
│
├── build/                          # Build outputs
├── dist-es5/                       # ES5 distribution
├── browser/                        # Browser builds
└── types/                          # TypeScript definitions
```

## Implementation Phases

⚠️ **CRITICAL REQUIREMENT**: At the end of EACH phase, the entire repository MUST be compilable with zero TypeScript errors AND all tests must pass. This ensures incremental validation and prevents accumulation of cascading errors.

### 🔑 Key Principles for ALL Phases

These principles apply to every phase and must be followed rigorously:

1. **"Export As You Go"** - Add exports to index.ts IMMEDIATELY when moving/adding files
2. **Fix Imports Immediately** - Update all import paths as soon as files are moved
3. **Incremental Validation** - Compile and test after each significant change
4. **Update Build Infrastructure** - Update rush.json and gruntfile.js in each phase as needed
5. **Work in Small Batches** - For file moves, work in groups of 10-20 files maximum
6. **Test After Each Phase** - Entire repository must compile and all tests must pass
7. **🚫 BANNED - Wildcard & Directory index.ts** - No `export *`, no `import *`, no directory-level index.ts files. Only explicit exports in single root index.ts

---

## 🚫 CRITICAL: Repository-Wide Export/Import Rules

**These rules apply to ALL phases and the ENTIRE repository:**

❌ **BANNED**:
- `export * from './path'` - Wildcard exports are BANNED
- `import * as X from './path'` - Wildcard imports are BANNED  
- Directory-level index.ts files (e.g., `src/interfaces/index.ts`, `src/enums/index.ts`) are BANNED

✅ **REQUIRED**:
- Only ONE index.ts per package at the root (`src/index.ts`)
- All exports MUST be explicit: `export { SpecificItem } from './path/to/file'`
- All imports MUST be specific: `import { SpecificItem } from '@microsoft/package'` or `import { Item } from './relative/path'`

**Example of correct exports in src/index.ts**:
```typescript
// ✅ CORRECT - Explicit named exports
export { IOTelContext, IOTelApiCtx } from './interfaces/IOTelContext';
export { OTelTracer } from './otel/OTelTracer';
export { eLoggingSeverity, eInternalMessageId } from './enums/LoggingEnums';

// ❌ WRONG - These are BANNED
// export * from './interfaces';
// export * from './otel';
```

---

### Phase 1: Rename OpenTelemetry Folder to otel-core

**Goal**: Rename the existing `shared/OpenTelemetry` folder to `shared/otel-core` while keeping the package name `@microsoft/otel-core-js`. Update all folder references across the entire repository. This establishes the foundation package that will receive the merged code in later phases.

**Why This First**: Starting with a rename (rather than creating from scratch) preserves git history and ensures we have a working, compilable base package before adding complexity.

**End State**: Package renamed, all imports updated, entire repository compiles and tests pass.

#### 1.1: Rename Package Directory
```powershell
# From repository root
cd shared
git mv OpenTelemetry otel-core
cd ..
```

#### 1.2: Update package.json
**File**: `shared/otel-core/package.json`

Keep the existing package name `@microsoft/otel-core-js` and the existing version (check actual version, likely `0.0.1-alpha`):

⚠️ **IMPORTANT**: Check the ACTUAL version in the existing package.json. The version may be `0.0.1-alpha` rather than `4.0.0-alpha.1`. Use the actual version consistently.

```json
{
  "name": "@microsoft/otel-core-js",
  "version": "0.0.1-alpha",
  "description": "Unified core infrastructure for Application Insights JavaScript SDK",
  "scripts": {
    "build": "grunt otelCore",
    "test": "grunt otelCoreunittest",
    "lint-fix": "grunt otelCore-lint-fix"
  }
}
```

#### 1.3: Update rush.json
**File**: `rush.json`

Update the OpenTelemetry entry to point to the new folder location:
```json
{
  "projects": [
    // UPDATE the OpenTelemetry entry with new folder path:
    {
      "packageName": "@microsoft/otel-core-js",
      "projectFolder": "shared/otel-core",
      "reviewCategory": "production"
    }
  ]
}
```

#### 1.4: Update gruntfile.js
**File**: `gruntfile.js`

Update all OpenTelemetry references to otelCore:
```javascript
// Update task names and paths
'otelCore': {
    tsconfig: './shared/otel-core/tsconfig.json',
    outDir: './shared/otel-core/dist'
}

// Update registered tasks
grunt.registerTask("otelCore", tsBuildActions("otelCore", true));
grunt.registerTask("otelCore-min", minTasks("otelCore"));
grunt.registerTask("otelCore-restore", restoreTasks("otelCore"));
grunt.registerTask("otelCore-lint-fix", ["otelCore-restore"]);
grunt.registerTask("otelCoreunittest", tsTestActions("otelCore"));
```

#### 1.5: Verify Import Statements
**NOTE**: Since the package name remains `@microsoft/otel-core-js`, no import statement changes are required in Phase 1. The folder rename is transparent to consuming packages.

**Verify** imports are still working:
```powershell
grep -r "@microsoft/otel-core-js" --include="*.ts" --exclude-dir={node_modules,dist,build,temp} .
# Should return matches - these imports are still valid
```

#### 1.6: Verify Package Dependencies
Since the package name `@microsoft/otel-core-js` remains unchanged, no package.json updates are required for consuming packages.

**Packages that reference otel-core-js** (verify these still work after folder rename):
- `AISKU/package.json`
- `AISKULight/package.json`
- All `extensions/*/package.json`
- All `channels/*/package.json`

**Existing dependency** (no change needed):
```json
{
  "dependencies": {
    "@microsoft/otel-core-js": "4.0.0-alpha.1"
  }
}
```

⚠️ **Note**: Use the actual version number (not `workspace:*`) - Rush manages symlinks via `rush update`.

#### 1.7: Run Rush Update
```powershell
# From repository root to clean all previous dependency links and establish the correct configured ones
rush update --recheck --purge --full
```

This regenerates the dependency graph with the renamed package.

#### 1.8: Build and Test - Phase 1 Validation
```powershell
# Run lint-fix to ensure consistent formatting after import changes
cd shared/otel-core
npm run lint-fix
cd ../..

# Build the renamed package
cd shared/otel-core
npm run build
# MUST succeed with zero errors

# Build entire repository
cd ../..
rush update --recheck --purge --full
rush rebuild
# MUST succeed with zero errors

# Run all tests
rush test
# MUST pass all tests
```

⚠️ **Version Placeholders**: Some source files may contain `"#version#"` placeholders. These are automatically replaced during build by grunt tasks. Do NOT manually replace them in source code.

**✅ Success Criteria for Phase 1:**
- [ ] Folder renamed from `OpenTelemetry` to `otel-core`
- [ ] package.json keeps name `@microsoft/otel-core-js`
- [ ] rush.json updated with new folder path
- [ ] gruntfile.js updated with new folder path
- [ ] No import changes needed (package name unchanged)
- [ ] `rush update` completed successfully
- [ ] `rush rebuild` succeeds with zero errors
- [ ] `rush test` passes all tests
- [ ] Git history preserved

---

### Phase 2: Create otel-noop-js Package and Extract Noop Functionality

**Goal**: Create a separate `@microsoft/otel-noop-js` package and move all no-operation (noop) implementations from `otel-core` to this new package. This separation keeps the core package focused and allows minimal bundle sizes.

**Why This Second**: With otel-core established, extract noop functionality before merging more packages. This keeps concerns separated.

**End State**: otel-noop-js package exists with all noop implementations, otel-core has no noop code, entire repository compiles and tests pass.

#### 2.1: Create otel-noop-js Package Structure
```powershell
# From repository root
New-Item -ItemType Directory -Force -Path "shared/otel-noop/src"
New-Item -ItemType Directory -Force -Path "shared/otel-noop/Tests"
```

#### 2.2: Create package.json
**File**: `shared/otel-noop/package.json`

⚠️ **IMPORTANT**: 
- otel-noop-js depends on otel-core-js, NOT the other way around. otel-core-js must NOT depend on otel-noop-js.
- Check the ACTUAL version of otel-core-js and use it consistently (likely `0.0.1-alpha`).
- Also include `@nevware21/ts-utils` and `@nevware21/ts-async` as dependencies if noop implementations need them.

```json
{
  "name": "@microsoft/otel-noop-js",
  "version": "0.0.1-alpha",
  "description": "No-operation implementations for Application Insights JavaScript SDK",
  "main": "dist/es5/otel-noop.js",
  "module": "dist-es5/otel-noop.js",
  "types": "types/otel-noop-js.d.ts",
  "sideEffects": false,
  "dependencies": {
    "@microsoft/otel-core-js": "0.0.1-alpha",
    "@nevware21/ts-utils": "0.12.4",
    "@nevware21/ts-async": "0.6.1"
  },
  "scripts": {
    "build": "grunt otelNoop",
    "test": "grunt otelNoopunittest",
    "lint-fix": "grunt otelNoop-lint-fix"
  }
}
```

⚠️ **Notes**: 
- Rush manages symlinks via `rush update --recheck --purge --full`. Use actual version numbers, not `workspace:*`.
- npm script names ("build", "test") must match the grunt task names registered in gruntfile.js ("otelNoop", "otelNoopunittest").
- The "lint-fix" script calls a grunt task that runs the restore task (similar to AISKU's ai-restore pattern).
- The types field should match the actual output filename (e.g., `otel-noop-js.d.ts` not `otel-noop.d.ts`).

#### 2.3: Create tsconfig.json
**File**: `shared/otel-noop/tsconfig.json`

⚠️ **IMPORTANT**: Include `moduleResolution: "node"` to properly resolve @microsoft/otel-core-js imports.

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "declarationDir": "./types",
    "rootDir": "./src",
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "Tests"]
}
```

#### 2.4: Create rollup.config.js
**File**: `shared/otel-noop/rollup.config.js`

Copy from otel-core's rollup config and update:

⚠️ **CRITICAL - importCheck Behavior**: The `importCheckNames` parameter specifies imports that should be **BLOCKED**, not allowed. Do NOT include dependencies like otel-core-js in this list.

```javascript
// Key changes needed:
// 1. Update package name references
const packageName = "otel-noop";
const namespace = "Microsoft.ApplicationInsights";

// 2. Update entry point  
const entryPointPath = "src/otel-noop-js.ts";

// 3. Mark otel-core-js as external dependency
external: [
    "@microsoft/otel-core-js"
],

// 4. CRITICAL: importCheckNames should ONLY block self-references
// The third parameter is importCheckNames - these imports are BLOCKED
createUnVersionedConfig(banner, {...}, [ "otel-noop-js" ], false)

// ❌ WRONG - This blocks valid otel-core-js imports!
// createUnVersionedConfig(banner, {...}, [ "otel-noop-js", "otel-core-js" ], false)

// 5. Update output file names
output: {
    file: `browser/es5/ms.otel-noop.js`,
    // ... other output config
}
```

#### 2.4b: Create api-extractor.json
**File**: `shared/otel-noop/api-extractor.json`

⚠️ **CRITICAL**: The bundledPackages array MUST have whitespace between brackets (not `[]`). The `dtsgen.js` script uses a regex that requires at least one character.

⚠️ **CRITICAL**: Do NOT add `@microsoft/otel-core-js` to bundledPackages - this causes type incompatibility issues.

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/api-extractor/v7/api-extractor.schema.json",
  "mainEntryPointFilePath": "<projectFolder>/dist/types/otel-noop-js.d.ts",
  "bundledPackages": [
    ],
  "compiler": {
    "tsconfigFilePath": "<projectFolder>/tsconfig.json"
  },
  "apiReport": {
    "enabled": false
  },
  "docModel": {
    "enabled": false
  },
  "dtsRollup": {
    "enabled": true,
    "untrimmedFilePath": "<projectFolder>/types/otel-noop-js.d.ts"
  },
  "tsdocMetadata": {
    "enabled": false
  },
  "messages": {
    "compilerMessageReporting": {
      "default": { "logLevel": "warning" }
    },
    "extractorMessageReporting": {
      "default": { "logLevel": "warning" }
    },
    "tsdocMessageReporting": {
      "default": { "logLevel": "warning" }
    }
  }
}
```

**Why whitespace is required:**
```json
// ❌ WRONG - regex fails to match
"bundledPackages": [],

// ✅ CORRECT - whitespace between brackets
"bundledPackages": [
    ],
```

#### 2.4a: Create Test Entry Point
**File**: `shared/otel-noop/Tests/Unit/src/index.tests.ts`

⚠️ **IMPORTANT**: The entry point MUST be named `index.tests.ts` to match the grunt pattern.

Create test entry point file that gruntfile.js expects:
```typescript
/**
 * otel-noop-js unit tests entry point
 */

// Import test framework
import "@microsoft/ai-test-framework";

// Import all test suites (update as tests are added/moved)
import "./sdk/OTelLogger.Tests";
import "./sdk/OTelLoggerProvider.Tests";
// Add other test imports as tests are added
```

**Create test directory structure**:
```powershell
New-Item -ItemType Directory -Force -Path "shared/otel-noop/Tests/Unit/src/sdk"
New-Item -ItemType File -Path "shared/otel-noop/Tests/Unit/src/index.tests.ts"
```

⚠️ **Const Enum Warning**: If test files use const enums like `eW3CTraceFlags`, replace them with literal values:
```typescript
// ❌ WRONG - const enum not available at runtime
import { eW3CTraceFlags } from "@microsoft/otel-core-js";
span.traceFlags = eW3CTraceFlags.Sampled;

// ✅ CORRECT - use literal constant
const W3C_TRACE_FLAG_SAMPLED = 1;
span.traceFlags = W3C_TRACE_FLAG_SAMPLED;
```

#### 2.5: Create Initial Entry Point
**File**: `shared/otel-noop/src/otel-noop-js.ts`

⚠️ **IMPORTANT**: The entry point filename should match the package name pattern (e.g., `otel-noop-js.ts` not `index.ts`). This is consistent with other packages in this repository.

```typescript
/**
 * @microsoft/otel-noop-js
 * No-operation implementations for lightweight scenarios
 */

// Re-export interfaces from otel-core-js for convenience
export { INoopProxyConfig } from "./interfaces/noop/INoopProxyConfig";

// Export noop implementations
export { createNoopProxy, _noopThis, _noopVoid } from "./api/noop/noopProxy";
export { createNoopContextMgr } from "./api/noop/noopContextMgr";
export { createNoopLogger } from "./api/noop/noopLogger";
export { createNoopLogRecordProcessor } from "./api/noop/noopLogRecordProcessor";
export { createNoopTracerProvider } from "./api/noop/noopTracerProvider";
```

#### 2.6: Identify Noop Files to Move
**From otel-core, identify all noop-related files**:
```powershell
cd shared/otel-core/src
Get-ChildItem -Recurse -Filter "*noop*" -Include *.ts
Get-ChildItem -Recurse -Filter "*Noop*" -Include *.ts
```

**Typical noop files** (verify in your codebase):
- `NoopLogger.ts` or `noopLogger.ts`
- `NoopTelemetryPlugin.ts`
- `NoopSpan.ts`, `NoopTracer.ts` (OTel noop implementations)
- Any files in `noop/` directories
- Related test files

#### 2.7: Move Noop Files to otel-noop-js
**For each noop file**:

⚠️ **CRITICAL**: Preserve the directory structure when moving files. Files in `otel-core/src/api/noop/` should go to `otel-noop/src/api/noop/`, etc.

```powershell
# Create matching directory structure first
New-Item -ItemType Directory -Force -Path "shared/otel-noop/src/api/noop"
New-Item -ItemType Directory -Force -Path "shared/otel-noop/src/interfaces/noop"

# Move files preserving structure
git mv shared/otel-core/src/api/noop/noopHelpers.ts shared/otel-noop/src/api/noop/noopHelpers.ts
git mv shared/otel-core/src/api/noop/noopProxy.ts shared/otel-noop/src/api/noop/noopProxy.ts
git mv shared/otel-core/src/api/noop/noopContextMgr.ts shared/otel-noop/src/api/noop/noopContextMgr.ts
git mv shared/otel-core/src/api/noop/noopLogger.ts shared/otel-noop/src/api/noop/noopLogger.ts
git mv shared/otel-core/src/api/noop/noopLogRecordProcessor.ts shared/otel-noop/src/api/noop/noopLogRecordProcessor.ts
git mv shared/otel-core/src/api/noop/noopTracerProvider.ts shared/otel-noop/src/api/noop/noopTracerProvider.ts
git mv shared/otel-core/src/interfaces/noop/INoopProxyConfig.ts shared/otel-noop/src/interfaces/noop/INoopProxyConfig.ts

# Move corresponding test files
git mv shared/otel-core/Tests/Unit/src/sdk/OTelLogger.Tests.ts shared/otel-noop/Tests/Unit/src/sdk/OTelLogger.Tests.ts
git mv shared/otel-core/Tests/Unit/src/sdk/OTelLoggerProvider.Tests.ts shared/otel-noop/Tests/Unit/src/sdk/OTelLoggerProvider.Tests.ts
```

#### 2.7a: Update Test Entry Points After Moving Tests
**After moving test files**, update BOTH test entry points:

**Update otel-core test entry point** - Remove moved test imports:
**File**: `shared/otel-core/Tests/Unit/src/index.tests.ts`
```typescript
// REMOVE these imports (tests moved to otel-noop):
// import "./sdk/OTelLogger.Tests";
// import "./sdk/OTelLoggerProvider.Tests";
```

**Update otel-noop test entry point** - Add moved test imports:
**File**: `shared/otel-noop/Tests/Unit/src/index.tests.ts`
```typescript
import "@microsoft/ai-test-framework";
import "./sdk/OTelLogger.Tests";
import "./sdk/OTelLoggerProvider.Tests";
```

#### 2.8: Update Imports in Moved Files
**For each moved file**, update any imports from relative otel-core paths to the new structure:

```typescript
// Before (in otel-core)
import { IDiagnosticLogger } from '../interfaces/IDiagnosticLogger';

// After (in otel-noop-js)
import { IDiagnosticLogger } from '@microsoft/otel-core-js';
```

**For NoopLogger specifically**, ensure it implements IDiagnosticLogger:
```typescript
// In shared/otel-noop/src/NoopLogger.ts
import { IDiagnosticLogger } from '@microsoft/otel-core-js';

/**
 * No-operation logger that implements IDiagnosticLogger interface
 */
export class NoopLogger implements IDiagnosticLogger {
    // Implement all IDiagnosticLogger methods as no-ops
    public throwInternal(severity: number, msgId: number, msg: string, properties?: object): void {
        // No-op
    }
    
    public warnToConsole(message: string): void {
        // No-op
    }
    
    // ... implement other interface methods
}

/**
 * Factory function to create logger with dependency injection
 * @param config - Optional configuration or dependencies
 */
export function createLogger(config?: any): IDiagnosticLogger {
    return new NoopLogger();
}
```

#### 2.9: Add Exports to otel-noop-js/src/index.ts
**Immediately after moving files**, add exports:

```typescript
/**
 * @microsoft/otel-noop-js
 * No-operation implementations for lightweight scenarios
 */

// Export both the class and factory function for NoopLogger
export { NoopLogger, createLogger } from './NoopLogger';
export { NoopTelemetryPlugin } from './NoopTelemetryPlugin';
export { NoopSpan, NoopTracer } from './otel/NoopImplementations';
// Add all noop exports
```

⚠️ **Design Pattern**: 
- **NoopLogger class** implements `IDiagnosticLogger` interface from otel-core-js
- **createLogger() factory** provides dependency injection capability
- Consumers can use `new NoopLogger()` directly or `createLogger(config)` for DI scenarios

#### 2.9a: Replace Noop References in otel-core with NotImplemented Exceptions
⚠️ **CRITICAL**: otel-core-js must NOT depend on otel-noop-js. Any noop functionality still referenced in otel-core files (that aren't being moved) must be replaced.

**Find noop references in otel-core**:
```powershell
cd shared/otel-core/src
Get-ChildItem -Recurse -Filter "*.ts" | Select-String -Pattern "Noop|noop" | Where-Object { $_.Line -notmatch "^\s*//" }
```

**Use the existing `throwOTelNotImplementedError` helper** (already in otel-core):
```typescript
// In shared/otel-core/src/api/errors/notImplemented.ts (already exists)
import { throwOTelNotImplementedError } from "../api/errors/notImplemented";

// Usage in files that referenced noop implementations
// Replace noop calls with throwOTelNotImplementedError calls
throwOTelNotImplementedError("createNoopLogRecordProcessor");
```

**Example replacements in otel-core files:**
```typescript
// In src/internal/LoggerProviderSharedState.ts
// Before: return createNoopLogRecordProcessor();
// After:
import { throwOTelNotImplementedError } from "../api/errors/notImplemented";
throwOTelNotImplementedError("LoggerProviderSharedState requires a LogRecordProcessor");

// In src/sdk/OTelLoggerProvider.ts  
// Before: return createNoopLogger(...);
// After:
throwOTelNotImplementedError("shutdown logger requested");

// In src/api/trace/nonRecordingSpan.ts
// Replace _noopThis and _noopVoid with inline implementations:
function _noopThis<T>(theThis: T) { return theThis; }
function _noopVoid() { /* noop */ }
```

**Best Practice**: If otel-core-js needs a default logger, create a stub that implements `IDiagnosticLogger` and throws NotImplemented. This maintains type safety and makes it clear that `@microsoft/otel-noop-js` should be used for actual noop implementations.

#### 2.10: Update Imports Across Repository
**Find all files importing noop implementations from otel-core-js**:

```powershell
grep -r "NoopLogger\|NoopTelemetryPlugin\|NoopSpan" --include="*.ts" --exclude-dir={node_modules,dist,build,temp} . | grep "@microsoft/otel-core-js"
```

**Update those imports**:
```typescript
// Before
import { NoopLogger } from '@microsoft/otel-core-js';

// After - choose appropriate import based on usage
import { NoopLogger } from '@microsoft/otel-noop-js';           // Direct class usage
import { createLogger } from '@microsoft/otel-noop-js';         // Factory pattern with DI

// Usage examples:
const logger1 = new NoopLogger();                             // Direct instantiation
const logger2 = createLogger();                               // Factory (no config)
const logger3 = createLogger({ /* config */ });               // Factory with config injection
```

#### 2.11: Update rush.json
**File**: `rush.json`

Add otel-noop-js package:
```json
{
  "projects": [
    {
      "packageName": "@microsoft/otel-core-js",
      "projectFolder": "shared/otel-core",
      "reviewCategory": "production"
    },
    {
      "packageName": "@microsoft/otel-noop-js",
      "projectFolder": "shared/otel-noop",
      "reviewCategory": "production"
    }
  ]
}
```

#### 2.12: Update gruntfile.js
**File**: `gruntfile.js`

**Step 1: Add otel-noop-js to modules** in the `buildConfig` call (around line 725):
```javascript
var theBuildConfig = deepMerge(buildConfig({
    // Shared
    "otelCore":                 {
                                path: "./shared/otel-core",
                                unitTestName: "otel.unittests.js"
                            },
    "otelNoop":                 {
                                path: "./shared/otel-noop",
                                unitTestName: "otel-noop.unittests.js"
                            },
    
    // SKUs
    "aisku":                { 
                                path: "./AISKU", 
                                // ... rest of config
```

**Step 2: Register grunt tasks** (around line 1165, after otelCore tasks):
```javascript
grunt.registerTask("otelNoop", tsBuildActions("otelNoop", true));
grunt.registerTask("otelNoop-min", minTasks("otelNoop"));
grunt.registerTask("otelNoop-restore", restoreTasks("otelNoop"));
grunt.registerTask("otelNoop-lint-fix", ["otelNoop-restore"]);
grunt.registerTask("otelNoopunittest", tsTestActions("otelNoop"));
grunt.registerTask("otelNoop-mintest", tsTestActions("otelNoop", true));
```

⚠️ **Important**: The module name "otelNoop" (camelCase) must match in:
1. Module definition in buildConfig
2. All grunt.registerTask calls
3. npm scripts in package.json ("grunt otelNoop")
4. The "otelNoop-lint-fix" task runs restore to apply consistent formatting

#### 2.13: Run Rush Update
```powershell
rush update --recheck --purge --full
```

#### 2.14: Build and Test - Phase 2 Validation
```powershell
# Run lint-fix after file moves
cd shared/otel-core
npm run lint-fix
cd ../otel-noop
npm run lint-fix
cd ../..

# Build otel-noop
cd shared/otel-noop
npm run build
# MUST succeed with zero errors

# Build otel-core (should still work, minus noop files)
cd ../otel-core
npm run build
# MUST succeed with zero errors

# Build entire repository
cd ../..
rush update --recheck --purge --full
rush rebuild
# MUST succeed with zero errors

# Run all tests
rush test
# ⚠️ EXPECT POTENTIAL TEST FAILURES from NotImplemented exceptions
```

⚠️ **Dynamic Constants**: If any auto-generated files (like `InternalConstants.ts`) were moved, ensure the generation script is updated to output to the new location. Do NOT manually edit auto-generated files.

**If test failures occur:**
1. **Document the failures** - Note which tests are failing and why
2. **Identify the cause** - Are tests relying on noop implementations?
3. **STOP and request manual intervention** - Do NOT proceed to Phase 3
4. **Report findings**:
   ```
   Phase 2 Test Failures:
   - Test: [test name]
   - File: [file path]
   - Error: [NotImplemented exception message]
   - Reason: Test was using noop implementation from otel-core
   - Fix needed: Update test to use @microsoft/otel-noop-js or mock the functionality
   ```
5. **Wait for manual test fixes** before proceeding

**If all tests pass**: Proceed to Phase 3

**✅ Success Criteria for Phase 2:**
- [ ] otel-noop-js package created with proper structure
- [ ] otel-noop-js depends on otel-core-js (NOT the reverse)
- [ ] otel-core-js does NOT depend on otel-noop-js
- [ ] All noop files moved from otel-core to otel-noop-js
- [ ] All noop tests moved
- [ ] otel-noop-js entry point exports all noop implementations
- [ ] All imports updated to use `@microsoft/otel-noop-js`
- [ ] All noop references in otel-core replaced with NotImplemented exceptions
- [ ] rush.json includes otel-noop-js
- [ ] gruntfile.js includes otel-noop-js tasks
- [ ] api-extractor.json created with correct bundledPackages format (see note below)
- [ ] Consuming packages (e.g., AppInsightsCore) updated to import from otel-noop-js
- [ ] `rush rebuild` succeeds with zero errors
- [ ] `rush test` passes all tests OR test failures documented for manual fix
- [ ] otel-core has no noop code remaining

**⚠️ api-extractor.json Note:**
Create `shared/otel-noop/api-extractor.json` with bundledPackages having whitespace:
```json
{
  "bundledPackages": [
    ],
  // ... rest of config
}
```
Do NOT bundle otel-core-js types - this causes type incompatibility issues.

---

### Phase 3: Restructure otel-core File Organization

**Goal**: Reorganize the files within `otel-core` to match the planned directory structure (config/, diagnostics/, enums/, interfaces/, etc.). This prepares otel-core to receive the merged files from AppInsightsCommon and AppInsightsCore.

**Why This Third**: Before merging other packages, organize otel-core's existing files into the target structure. This establishes the pattern and makes subsequent merges cleaner.

**End State**: otel-core files organized into target directory structure, all imports fixed, entire repository compiles and tests pass.

**Target Directory Structure**:
```
shared/otel-core/src/
  ├── config/         # Configuration classes (lowercase)
  ├── diagnostics/    # Logging and diagnostics (lowercase)
  ├── enums/          # All enumerations
  ├── interfaces/     # TypeScript interfaces
  ├── telemetry/      # Telemetry items and helpers
  ├── utils/          # Utility functions
  ├── constants/      # Constants
  ├── internal/       # Internal utilities
  └── otel/           # OpenTelemetry-specific implementations
```

#### 3.1: Analyze Current otel-core Structure
```powershell
cd shared/otel-core/src
Get-ChildItem -Recurse -Filter "*.ts" | Select-Object FullName
```

Document current structure to plan moves.

#### 3.2: Create Target Directory Structure
```powershell
# From shared/otel-core/src
New-Item -ItemType Directory -Force -Path "config"
New-Item -ItemType Directory -Force -Path "diagnostics"
New-Item -ItemType Directory -Force -Path "enums"
New-Item -ItemType Directory -Force -Path "interfaces"
New-Item -ItemType Directory -Force -Path "telemetry"
New-Item -ItemType Directory -Force -Path "utils"
New-Item -ItemType Directory -Force -Path "constants"
New-Item -ItemType Directory -Force -Path "internal"
New-Item -ItemType Directory -Force -Path "otel"
```

#### 3.3: Move Files in Small Batches
**Work in batches of 10-20 files**. For each batch:

**Batch Example - Constants**:
```powershell
# Identify constant files
cd shared/otel-core/src
Get-ChildItem -Filter "*Constant*" -Include *.ts

# Move to constants/ directory
git mv OTelConstants.ts constants/OTelConstants.ts
git mv SomeOtherConstants.ts constants/SomeOtherConstants.ts
```

**Batch Example - Enums**:
```powershell
# Move enum files
git mv enums/OTel/*.ts enums/
# Flatten or organize as needed
```

**Batch Example - Interfaces**:
```powershell
# Move interface files
git mv interfaces/OTel/*.ts interfaces/
```

#### 3.4: Fix Imports in Moved Files (Immediately After Each Batch)
**For each moved file**, update its imports to reflect new relative paths:

```typescript
// Before (when file was in root or different location)
import { OTelConstants } from './OTelConstants';
import { IOTelContext } from '../interfaces/IOTelContext';

// After (in new location like telemetry/)
import { OTelConstants } from '../constants/OTelConstants';
import { IOTelContext } from '../interfaces/IOTelContext';
```

**Use PowerShell to help**:
```powershell
# Find files importing from old paths
cd shared/otel-core/src
Get-ChildItem -Recurse -Filter "*.ts" | Select-String -Pattern "from ['\"]\.\./"
```

#### 3.5: Update Exports in index.ts (Immediately After Each Batch)
**File**: `shared/otel-core/src/index.ts`

Update export paths as files move:
```typescript
// Exports organized by category
// Constants
export { OTelConstants, CONSTANT_A, CONSTANT_B } from './constants/OTelConstants';

// Enums
export { eOTelEnum, eSomeOtherEnum } from './enums/OTelEnums';

// Interfaces
export { IOTelContext } from './interfaces/IOTelContext';
export { IOTelSpan, ISpanOptions } from './interfaces/IOTelSpan';

// OTel implementations
export { OTelTracer } from './otel/OTelTracer';
export { OTelSpan } from './otel/OTelSpan';

// Utils
export { helperFunction1, helperFunction2 } from './utils/OTelHelpers';
```

#### 3.6: Compile and Validate After Each Batch
```powershell
# After each batch of moves
cd shared/otel-core
npm run build
# MUST succeed with zero errors

# If errors, fix imports before proceeding to next batch
```

#### 3.7: Update Test Imports
**Update test files** to use the package import (not relative paths):

```typescript
// Before (relative path)
import { OTelTracer } from '../../src/otel/OTelTracer';

// After (package import)
import { OTelTracer } from '@microsoft/otel-core-js';
```

#### 3.8: Build and Test - Phase 3 Validation
```powershell
# Run lint-fix after file reorganization
cd shared/otel-core
npm run lint-fix

# Build otel-core with new structure
npm run build
# MUST succeed with zero errors

# Verify browser builds exist
ls browser/es5/  # Should contain built JavaScript files

# Build entire repository
cd ../..
rush update --recheck --purge --full
rush rebuild
# MUST succeed with zero errors

# Run all tests
rush test
# MUST pass all tests
```

⚠️ **Path Casing**: Ensure consistent casing in imports (e.g., `config/` vs `Config/`). Use lowercase directory names as specified in target structure.

**✅ Success Criteria for Phase 3:**
- [ ] All otel-core files organized into target structure
- [ ] All imports fixed to use correct relative paths
- [ ] index.ts exports updated and organized
- [ ] All test imports use package imports (not relative)
- [ ] `rush rebuild` succeeds with zero errors
- [ ] `rush test` passes all tests
- [ ] Directory names use lowercase (config/, diagnostics/)

---

### Phase 4: Merge AppInsightsCommon into otel-core

**Goal**: Move all files and tests from `shared/AppInsightsCommon` into `otel-core` using the established directory structure. Update all imports across the repository. Remove the AppInsightsCommon package.

**Why This Fourth**: With otel-core's structure established, merge the first major package. AppInsightsCommon before AppInsightsCore because Core often depends on Common.

**End State**: AppInsightsCommon fully merged into otel-core, all imports updated, AppInsightsCommon package removed, entire repository compiles and tests pass.

#### 4.1: Analyze AppInsightsCommon Structure
```powershell
cd shared/AppInsightsCommon/src
Get-ChildItem -Recurse -Filter "*.ts" | Select-Object FullName | Out-File ../../../appinsights-common-files.txt
```

Review the file list and plan which files go into which otel-core directories.

#### 4.2: Create File Migration Plan
**Map AppInsightsCommon files to otel-core directories**:

| AppInsightsCommon File | Target otel-core Location |
|------------------------|---------------------------|
| `Enums.ts` | `enums/AppInsights/Enums.ts` |
| `Util.ts` | `utils/Util.ts` |
| `Constants.ts` | `constants/AIConstants.ts` |
| `Interfaces/IConfig.ts` | `interfaces/AppInsights/IConfig.ts` |
| `Telemetry/Event.ts` | `telemetry/AppInsights/Event.ts` |
| ... | ... |

#### 4.3: Move Files in Batches (10-20 files per batch)
**Recommended batch order**:
1. Constants (~5 files)
2. Enums (~10 files)
3. Basic interfaces (~15 files)
4. Utility functions (~10 files)
5. Telemetry interfaces (~15 files)
6. Telemetry implementations (~20 files)
7. Remaining files

**For each batch:**

**Example Batch 1 - Constants**:
```powershell
# Create subdirectory if needed
New-Item -ItemType Directory -Force -Path "shared/otel-core/src/constants"

# Move constants files
git mv shared/AppInsightsCommon/src/Constants.ts shared/otel-core/src/constants/AIConstants.ts
git mv shared/AppInsightsCommon/src/InternalConstants.ts shared/otel-core/src/constants/AIInternalConstants.ts
```

**Fix imports in moved files immediately**:
```typescript
// In the moved file, update imports
// Before (relative to AppInsightsCommon)
import { Util } from './Util';
import { IConfig } from './Interfaces/IConfig';

// After (relative to new location in otel-core)
import { Util } from '../utils/Util';
import { IConfig } from '../interfaces/AppInsights/IConfig';
```

**Add exports to otel-core/src/index.ts immediately**:
```typescript
// Constants from AppInsightsCommon
export { AIConstants, SOME_CONSTANT } from './constants/AIConstants';
export { InternalConstant1, InternalConstant2 } from './constants/AIInternalConstants';
```

**Compile and validate**:
```powershell
cd shared/otel-core
npm run build
# MUST succeed before proceeding to next batch
```

**If errors**: Fix them before moving to the next batch.

#### 4.4: Move Test Files
**After moving all source files**, move the corresponding test files:

```powershell
# Create test directory structure
New-Item -ItemType Directory -Force -Path "shared/otel-core/Tests/Unit/AppInsights"

# Move test files
git mv shared/AppInsightsCommon/Tests/Unit/*.tests.ts shared/otel-core/Tests/Unit/AppInsights/
```

**Update test imports**:
```typescript
// Before
import { Util } from '../../../src/Util';

// After (use package import)
import { Util } from '@microsoft/otel-core-js';
```

#### 4.5: Update Imports Across Repository
**Find all files importing from AppInsightsCommon**:

```powershell
grep -r "@microsoft/applicationinsights-common" --include="*.ts" --exclude-dir={node_modules,dist,build,temp} .
```

**Create PowerShell script to update imports**:
```powershell
$files = Get-ChildItem -Recurse -Include *.ts,*.tsx -Exclude node_modules,dist,build,temp |
    Select-String -Pattern '@microsoft/applicationinsights-common' -List |
    Select-Object -ExpandProperty Path

foreach ($file in $files) {
    $content = Get-Content $file -Raw
    $content = $content -replace '@microsoft/applicationinsights-common', '@microsoft/otel-core-js'
    Set-Content $file $content -NoNewline
}

Write-Host "Updated $($files.Count) files"
```

**Verify**:
```powershell
grep -r "@microsoft/applicationinsights-common" --include="*.ts" --exclude-dir={node_modules,dist,build,temp} .
# Should return no matches
```

#### 4.6: Update Package Dependencies
**Remove AppInsightsCommon from package.json files**:

In all consuming packages (`AISKU`, `AISKULight`, extensions, channels):
```json
{
  "dependencies": {
    // REMOVE:
    // "@microsoft/applicationinsights-common": "<version>",
    
    // Already have from Phase 1:
    "@microsoft/otel-core-js": "4.0.0-alpha.1"
  }
}
```

#### 4.7: Update rush.json
**File**: `rush.json`

Remove the AppInsightsCommon entry:
```json
{
  "projects": [
    // REMOVE:
    // {
    //   "packageName": "@microsoft/applicationinsights-common",
    //   "projectFolder": "shared/AppInsightsCommon"
    // }
  ]
}
```

#### 4.8: Update gruntfile.js
**File**: `gruntfile.js`

Remove AppInsightsCommon build tasks (if any standalone tasks exist).

#### 4.9: Remove AppInsightsCommon Package
**Only after all imports are updated and builds succeed**:

```powershell
# Comprehensive verification - check all file types
grep -r "applicationinsights-common" --include="*.ts" --include="*.json" --exclude-dir={node_modules,dist,build,temp} .
# Should be empty

# Verify no uncommitted changes in package being removed
cd shared/AppInsightsCommon
git status
cd ../..

# If all clear, remove the package directory
git rm -r shared/AppInsightsCommon
```

#### 4.10: Run Rush Update
```powershell
rush update --recheck --purge --full
```

#### 4.11: Build and Test - Phase 4 Validation
```powershell
# Run lint-fix after file merge
cd shared/otel-core
npm run lint-fix

# Build otel-core
npm run build
# MUST succeed with zero errors

# Build entire repository
cd ../..
rush update --recheck --purge --full
rush rebuild
# MUST succeed with zero errors

# Run all tests (including migrated AppInsightsCommon tests)
rush test
# MUST pass all tests
```

**✅ Success Criteria for Phase 4:**
- [ ] All AppInsightsCommon files moved to otel-core
- [ ] All AppInsightsCommon tests moved to otel-core
- [ ] All imports updated from `@microsoft/applicationinsights-common` to `@microsoft/otel-core-js`
- [ ] All package.json dependencies updated
- [ ] rush.json no longer references AppInsightsCommon
- [ ] AppInsightsCommon directory removed
- [ ] otel-core/src/index.ts exports all AppInsightsCommon symbols
- [ ] `rush rebuild` succeeds with zero errors
- [ ] `rush test` passes all tests

---

### Phase 5: Merge AppInsightsCore into otel-core

**Goal**: Move all files and tests from `shared/AppInsightsCore` into `otel-core` using the established directory structure. Update all imports across the repository. Remove the AppInsightsCore package.

**Why This Last**: AppInsightsCore is merged last because it often depends on both Common and OTel functionality, which are now both in otel-core.

**End State**: All three original packages (AppInsightsCore, AppInsightsCommon, OpenTelemetry) fully merged into otel-core, entire repository compiles and tests pass, only otel-core and otel-noop-js remain.

#### 5.1: Analyze AppInsightsCore Structure
```powershell
cd shared/AppInsightsCore/src
Get-ChildItem -Recurse -Filter "*.ts" | Select-Object FullName | Out-File ../../../appinsights-core-files.txt
```

Review the file list and plan which files go into which otel-core directories.

#### 5.2: Create File Migration Plan
**Map AppInsightsCore files to otel-core directories**:

| AppInsightsCore File | Target otel-core Location |
|----------------------|---------------------------|
| `AppInsightsCore.ts` | `core/AppInsightsCore.ts` |
| `BaseTelemetryPlugin.ts` | `core/BaseTelemetryPlugin.ts` |
| `LoggingEnums.ts` | `enums/AppInsights/LoggingEnums.ts` |
| `DiagnosticLogger.ts` | `diagnostics/DiagnosticLogger.ts` |
| `IConfiguration.ts` | `interfaces/AppInsights/IConfiguration.ts` |
| `DynamicConfig.ts` | `config/DynamicConfig.ts` |
| ... | ... |

#### 5.3: Move Files in Batches (10-20 files per batch)
**Recommended batch order**:
1. Enums and constants (~5 files)
2. Core interfaces (~15 files)
3. Config interfaces and classes (~10 files)
4. Diagnostic interfaces and classes (~8 files)
5. Core SDK classes (~15 files)
6. Plugin and context classes (~10 files)
7. Remaining utility files

**For each batch:**

**Example Batch 1 - Enums and Constants**:
```powershell
# Move enum files
git mv shared/AppInsightsCore/src/JavaScriptSDK.Enums/LoggingEnums.ts shared/otel-core/src/enums/AppInsights/LoggingEnums.ts

# Move constant files
git mv shared/AppInsightsCore/src/JavaScriptSDK/InternalConstants.ts shared/otel-core/src/constants/CoreInternalConstants.ts
```

**Fix imports in moved files immediately**:
```typescript
// In the moved file, update imports
// Before (relative to AppInsightsCore)
import { IConfiguration } from '../JavaScriptSDK.Interfaces/IConfiguration';

// After (relative to new location in otel-core)
import { IConfiguration } from '../interfaces/AppInsights/IConfiguration';
```

**Add exports to otel-core/src/index.ts immediately**:
```typescript
// Core SDK classes
export { AppInsightsCore } from './core/AppInsightsCore';
export { BaseTelemetryPlugin } from './core/BaseTelemetryPlugin';

// Logging enums
export { eLoggingSeverity, eInternalMessageId } from './enums/AppInsights/LoggingEnums';

// Diagnostics
export { DiagnosticLogger } from './diagnostics/DiagnosticLogger';

// Config
export { DynamicConfig, createDynamicConfig } from './config/DynamicConfig';
```

**Compile and validate**:
```powershell
cd shared/otel-core
npm run build
# MUST succeed before proceeding to next batch
```

#### 5.4: Move Test Files
**After moving all source files**, move the corresponding test files:

```powershell
# Create test directory structure if needed
New-Item -ItemType Directory -Force -Path "shared/otel-core/Tests/Unit/AppInsights/Core"

# Move test files
git mv shared/AppInsightsCore/Tests/Unit/*.tests.ts shared/otel-core/Tests/Unit/AppInsights/Core/
```

**Update test imports**:
```typescript
// Before
import { AppInsightsCore } from '../../../src/JavaScriptSDK/AppInsightsCore';

// After (use package import)
import { AppInsightsCore } from '@microsoft/otel-core-js';
```

#### 5.5: Update Imports Across Repository
**Find all files importing from AppInsightsCore**:

```powershell
grep -r "@microsoft/applicationinsights-core-js" --include="*.ts" --exclude-dir={node_modules,dist,build,temp} .
```

**Create PowerShell script to update imports**:
```powershell
$files = Get-ChildItem -Recurse -Include *.ts,*.tsx -Exclude node_modules,dist,build,temp |
    Select-String -Pattern '@microsoft/applicationinsights-core-js' -List |
    Select-Object -ExpandProperty Path

foreach ($file in $files) {
    $content = Get-Content $file -Raw
    $content = $content -replace '@microsoft/applicationinsights-core-js', '@microsoft/otel-core-js'
    Set-Content $file $content -NoNewline
}

Write-Host "Updated $($files.Count) files"
```

**Verify**:
```powershell
grep -r "@microsoft/applicationinsights-core-js" --include="*.ts" --exclude-dir={node_modules,dist,build,temp} .
# Should return no matches
```

#### 5.6: Update Package Dependencies
**Remove AppInsightsCore from package.json files**:

In all consuming packages (`AISKU`, `AISKULight`, extensions, channels):
```json
{
  "dependencies": {
    // REMOVE:
    // "@microsoft/applicationinsights-core-js": "<version>",
    
    // Already have from Phase 1:
    "@microsoft/otel-core-js": "4.0.0-alpha.1"
  }
}
```

#### 5.7: Update rush.json
**File**: `rush.json`

Remove the AppInsightsCore entry:
```json
{
  "projects": [
    // REMOVE:
    // {
    //   "packageName": "@microsoft/applicationinsights-core-js",
    //   "projectFolder": "shared/AppInsightsCore"
    // }
  ]
}
```

#### 5.8: Update gruntfile.js
**File**: `gruntfile.js`

Remove AppInsightsCore build tasks.

#### 5.9: Remove AppInsightsCore Package
**Only after all imports are updated and builds succeed**:

```powershell
# Comprehensive verification - check all file types
grep -r "applicationinsights-core-js" --include="*.ts" --include="*.json" --exclude-dir={node_modules,dist,build,temp} .
# Should be empty

# Verify no uncommitted changes in package being removed
cd shared/AppInsightsCore
git status
cd ../..

# If all clear, remove the package directory
git rm -r shared/AppInsightsCore
```

#### 5.10: Run Rush Update and Rebuild
```powershell
# Full update with clean state
rush update --recheck --purge --full

# Full rebuild to ensure everything compiles correctly
rush rebuild --verbose
```

⚠️ **Rush Rebuild**: After major structural changes, `rush rebuild` is safer than `rush build` as it forces a clean build of all packages, catching any missed dependencies or configuration issues.

#### 5.11: Final Build and Test - Phase 5 Validation
```powershell
# Run final lint-fix
cd shared/otel-core
npm run lint-fix

# Build otel-core with all merged content
npm run build
# MUST succeed with zero errors

# Verify browser builds
ls browser/es5/  # Should contain complete built files

# Build otel-noop-js
cd ../otel-noop-js
npm run build
# MUST succeed with zero errors

# Build entire repository (rush update + rush rebuild already done in 5.10)
cd ../..
rush build
# MUST succeed with zero errors

# Run all tests (including all migrated tests)
rush test
# MUST pass all tests
```

#### 5.12: Verify Final State
```powershell
# Verify shared/ directory structure
ls shared/
# Should show ONLY:
#   otel-core/
#   otel-noop-js/

# Verify no old package imports remain
grep -r "@microsoft/applicationinsights-core-js\|@microsoft/applicationinsights-common" --include="*.ts" .
# Should return no matches

# Verify new imports are used
grep -r "@microsoft/otel-core-js" --include="*.ts" | wc -l
# Should show many matches
```

**✅ Success Criteria for Phase 5:**
- [ ] All AppInsightsCore files moved to otel-core
- [ ] All AppInsightsCore tests moved to otel-core
- [ ] All imports updated from `@microsoft/applicationinsights-core-js` to `@microsoft/otel-core-js`
- [ ] All package.json dependencies updated
- [ ] rush.json no longer references AppInsightsCore
- [ ] AppInsightsCore directory removed
- [ ] otel-core/src/index.ts exports all AppInsightsCore symbols
- [ ] `shared/` directory contains ONLY `otel-core/` and `otel-noop-js/`
- [ ] `rush rebuild` succeeds with zero errors
- [ ] `rush test` passes all tests
- [ ] **MERGE COMPLETE**: 3 packages → 2 packages successfully merged

---

## Post-Merge Activities

After completing all 5 phases, perform these final activities:

### Documentation Updates
1. Update main README.md with new package structure
2. Create migration guide for external users
3. Update API documentation
4. Update CHANGELOG.md

### Performance Validation
1. Compare bundle sizes (before/after)
2. Verify tree-shaking still works
3. Run performance benchmarks

### Release Preparation
1. Tag as v4.0.0-alpha.1
2. Generate release notes
3. Publish alpha packages for testing
4. Communicate changes to stakeholders
## Lessons Learned

### What Went Well

1. **Phased Approach**: Breaking work into clear phases made progress trackable
2. **Documentation First**: Creating the merge plan before starting saved time
3. **Test Organization**: Organizing tests by domain (AppInsights/OTel) maintained clarity
4. **Zero Noop Code**: Extracting noop to separate package kept main package lean
5. **Verification Document**: Creating MIGRATION_VERIFICATION.md provided audit trail
6. **Single Gruntfile**: Consolidating build configuration simplified management

### Challenges Encountered

1. **Import Path Updates**: Required systematic search-and-replace across all files
2. **Circular Dependencies**: Some files had implicit circular dependencies
3. **Compilation Errors**: Type mismatches required fixing (354 errors initially)
4. **Test Entry Points**: Grunt required specific test entry file structure
5. **Dynamic Constants**: Auto-generated files needed special handling
6. **Monorepo Dependencies**: All consuming packages needed dependency updates
7. **Version Synchronization**: Ensuring all package.json files reference correct version
8. **Build System Updates**: Grunt task registrations and configurations needed cleanup
9. **Import Statement Updates**: 100+ TypeScript files across repository importing from old packages

---

## Implementation-Specific Learnings (Phase 1 & 2)

### Phase 1: Folder Rename Learnings

#### 1.1 Version Number Reality Check
⚠️ **CRITICAL**: The existing otel-core-js package version is `0.0.1-alpha`, NOT `4.0.0-alpha.1` as specified in the plan. When implementing:
- Check the ACTUAL version in the existing `package.json` before making changes
- Use the actual version number consistently across all dependencies
- Update the plan's version references to match reality

#### 1.2 Grunt Task Naming Convention
The gruntfile.js uses a specific naming pattern. When renaming from "openTelemetry" to "otelCore":
```javascript
// Correct pattern - registered tasks must match module name
grunt.registerTask("otelCore", tsBuildActions("otelCore", true));
grunt.registerTask("otelCore-min", minTasks("otelCore"));
grunt.registerTask("otelCore-restore", restoreTasks("otelCore"));
grunt.registerTask("otelCoreunittest", tsTestActions("otelCore"));  // NOTE: No hyphen before unittest
```

#### 1.3 Rush Update Behavior
After rush.json changes:
```powershell
# This is the safest approach after structural changes
rush update --recheck --purge --full
```
If you encounter npm shrinkwrap integrity errors, delete `common/temp/npm-shrinkwrap.json` and run `rush update --full` again.

---

### Phase 2: Noop Extraction Learnings

#### 2.1 Complete File Movement Required
**ALL noop files MUST be moved to otel-noop-js**, including:
- `src/api/noop/*.ts` - All noop helper files
- `src/interfaces/noop/*.ts` - All noop interfaces
- Corresponding test files

Do NOT leave any noop implementations in otel-core. Replace with `throwOTelNotImplementedError()`.

#### 2.2 ES5 Compatibility Issues
otel-core targets ES5 for browser compatibility. Several patterns are FORBIDDEN:

| ❌ Forbidden Pattern | ✅ Required Alternative | Import Source |
|---------------------|------------------------|---------------|
| `str.trim()` | `strTrim(str)` | `@nevware21/ts-utils` |
| `Object.keys(obj)` | `objKeys(obj)` | `@nevware21/ts-utils` |
| `Date.now()` | `utcNow()` | `@nevware21/ts-utils` |
| `...spread` operator | Explicit copy | N/A |
| `?.` optional chaining | `&&` checks | N/A |
| `??` nullish coalescing | `\|\|` | N/A |

**Example fixes applied in Phase 2:**
```typescript
// In src/sdk/config.ts
// Before: strName = raw.trim();
// After:
import { strTrim } from "@nevware21/ts-utils";
strName = strTrim(raw);

// In src/sdk/OTelLogRecord.ts
// Before: Object.keys(this._attrs)
// After:
import { objKeys, utcNow } from "@nevware21/ts-utils";
objKeys(this._attrs);
utcNow(); // Instead of Date.now()
```

#### 2.3 Rollup importCheck Plugin Behavior
⚠️ **CRITICAL - MISLEADING NAMING**: The `importCheckNames` array in rollup.config.js specifies imports that should be **BLOCKED**, not excluded from checking.

```javascript
// In shared/otel-noop/rollup.config.js
// The exclude array BLOCKS these imports from appearing in the bundle
createUnVersionedConfig(banner, {...}, [ "otel-noop-js" ], false)

// DO NOT include dependencies here:
// WRONG: [ "otel-noop-js", "otel-core-js" ] - This blocks importing from otel-core-js!
// CORRECT: [ "otel-noop-js" ] - Only block self-references
```

**How it works:**
- If a file imports from `@microsoft/otel-core-js`, that's a valid external dependency
- The importCheck plugin should NOT block it
- Only block imports from the package's own name (self-references)

#### 2.4 api-extractor.json bundledPackages Format
The `dtsgen.js` script uses a regex that requires at least one character between the brackets:

```json
// ❌ WRONG - regex fails to match
"bundledPackages": [],

// ✅ CORRECT - whitespace between brackets allows regex to match
"bundledPackages": [
    ],
```

**Why:** The script's regex pattern `[^\]]+` requires at least one character (including whitespace) between `[` and `]`.

#### 2.5 Type Bundling Causes Type Incompatibility
⚠️ **CRITICAL**: Do NOT bundle types from otel-core-js into otel-noop-js.

```json
// ❌ WRONG - causes type incompatibility
"bundledPackages": [
    "@microsoft/otel-core-js"
],

// ✅ CORRECT - import types instead of bundling
"bundledPackages": [
    ],
```

**Why:** If both packages bundle the same types, TypeScript sees them as different types, causing:
```
Type 'import("otel-noop-js").IOTelLogger' is not assignable to 
type 'import("otel-core-js").IOTelLogger'
```

**Solution:** Leave bundledPackages empty so types are imported with `import type { IOTelLogger } from '@microsoft/otel-core-js'`

#### 2.6 Test File Organization
Test files must follow the grunt pattern. The entry point must be named `index.tests.ts`:

```
shared/otel-noop/Tests/
  └── Unit/
      └── src/
          ├── index.tests.ts    # Main entry point (required by grunt)
          └── sdk/
              ├── OTelLogger.Tests.ts
              └── OTelLoggerProvider.Tests.ts
```

#### 2.7 Const Enum Runtime Availability
Const enums like `eW3CTraceFlags` are NOT available at runtime. In test files, use literal values:

```typescript
// ❌ WRONG - const enum not available at runtime
import { eW3CTraceFlags } from "@microsoft/otel-core-js";
span.traceFlags = eW3CTraceFlags.Sampled;

// ✅ CORRECT - use literal constant
const W3C_TRACE_FLAG_SAMPLED = 1;
span.traceFlags = W3C_TRACE_FLAG_SAMPLED;
```

#### 2.8 NPM Shrinkwrap Integrity Issues
After adding new package dependencies, you may encounter integrity check failures:

```powershell
# If you see: "Integrity checked failed for resolved"
# Solution: Delete temp shrinkwrap and regenerate
Remove-Item "common/temp/npm-shrinkwrap.json" -Force
rush update --full
```

#### 2.9 Dependency Direction
The dependency direction MUST be:
```
otel-noop-js → depends on → otel-core-js
```

otel-core-js must NOT depend on otel-noop-js. If otel-core needs noop behavior, it should throw NotImplemented exceptions.

#### 2.10 Consuming Package Updates
Any packages that import noop functionality from otel-core-js must:
1. Add `@microsoft/otel-noop-js` as a dependency
2. Update imports to use the new package

Example for `shared/AppInsightsCore/package.json`:
```json
{
  "dependencies": {
    "@microsoft/otel-core-js": "0.0.1-alpha",
    "@microsoft/otel-noop-js": "0.0.1-alpha"  // ADD THIS
  }
}
```

Example import update in `src/OTelApi.ts`:
```typescript
// Before
import { createNoopTracerProvider } from "@microsoft/otel-core-js";

// After
import { createNoopTracerProvider } from "@microsoft/otel-noop-js";
```

---

### Best Practices for Future Merges

1. **Create Verification Checklist**: Track file counts before/after
2. **Use Migration Scripts**: Automate repetitive tasks (import updates)
3. **Test Incrementally**: Don't wait until end to run tests
4. **Document Decisions**: Capture rationale for structural choices
5. **Keep Original Packages**: Don't delete until migration verified
6. **Update Build System Early**: Integrate with build tools first
7. **Create Clear Documentation**: README, MIGRATION, and API docs are critical
8. **Update All Dependencies**: Search entire monorepo for package references
9. **Maintain Version Consistency**: All dependency versions must match actual package versions
10. **Update Build Configuration**: Clean up task registrations and remove redundant entries
11. **Update Import Statements**: Use automated script to update all source file imports
12. **Run Dependency Manager**: Execute `rush update` or equivalent after all changes
13. **⚠️ CRITICAL: Export As You Go**: Add exports to index.ts DURING file migration, not after
14. **BANNED - Wildcard Imports/Exports**: Never use `export * from` or `import * as`. Only explicit exports allowed. No directory-level index.ts files.
15. **Compile Incrementally**: Run build after each file group migration to catch errors early
16. **Fix Path Casing Early**: Ensure consistent casing in imports (Config vs config, etc.)
17. **Run Lint-Fix After Moves**: Execute `npm run lint-fix` from each package after phase completion. The script calls a grunt task (e.g., `otelCore-lint-fix`) that runs the restore task to apply consistent formatting.
18. **Handle Dynamic Constants**: Auto-generated files (like InternalConstants.ts) should not be edited manually - update generation scripts instead
19. **Version Placeholders**: Don't manually replace `"#version#"` placeholders - grunt handles this during build
20. **Use Rush Rebuild**: After major changes, prefer `rush rebuild --verbose` over `rush build` for clean state
21. **ES5 Compatibility**: Use `@nevware21/ts-utils` helpers (strTrim, objKeys, utcNow) instead of native methods
22. **Rollup importCheck**: The importCheckNames array BLOCKS imports - only include self-references, not dependencies
23. **api-extractor bundledPackages**: Use whitespace format `[\n    ]` for empty arrays (regex requirement)
24. **Type Bundling**: Do NOT bundle dependency types - causes type incompatibility across packages
25. **Test Entry Point Naming**: Entry point must be `index.tests.ts` to match grunt pattern
26. **Const Enums in Tests**: Use literal values instead of const enums (not available at runtime)
27. **NPM Shrinkwrap Issues**: Delete `common/temp/npm-shrinkwrap.json` and run `rush update --full` if integrity errors occur

## Common Patterns for Branch Merges

### Pattern 1: Consolidating Packages

**When to Use:**
- Multiple packages with overlapping functionality
- Want to reduce maintenance burden
- Need clearer organizational structure

**Steps:**
1. Analyze dependencies and file relationships
2. Design target folder structure
3. Create migration plan with file mappings
4. Implement in phases (setup → move → test → cleanup)
5. Document thoroughly

### Pattern 2: Reorganizing by Functionality

**When to Use:**
- Historical structure doesn't match current use
- Want better discoverability
- Need clearer separation of concerns

**Steps:**
1. Group files by functionality (not by origin)
2. Create clear subdirectories (interfaces/, enums/, etc.)
3. Maintain domain separation (AppInsights vs OTel)
4. Use consistent naming conventions
5. Update all import paths systematically

### Pattern 3: Extracting Optional Code

**When to Use:**
- Have code used only in specific scenarios (testing, dev)
- Want to reduce main package size
- Need clear dependency boundaries

**Steps:**
1. Identify optional functionality (noop, test utils, etc.)
2. Create separate package structure
3. Replace with stubs that throw clear errors
4. Configure separate package to depend on main package
5. Update documentation about optional dependencies

## Replication Guide

### For Merging Similar Projects

1. **Preparation Phase**
   - [ ] Audit source packages (file counts, dependencies)
   - [ ] Design target structure
   - [ ] Create merge plan document
   - [ ] Set up version control branch

2. **Setup Phase**
   - [ ] Create target package directory
   - [ ] Set up package.json with combined dependencies
   - [ ] Configure build tools (TypeScript, Rollup, Grunt)
   - [ ] Create npm scripts

3. **Migration Phase**
   - [ ] Move interfaces first (dependencies for other files)
   - [ ] Move enums and types
   - [ ] Move core functionality
   - [ ] Move utilities and helpers
   - [ ] Update all import paths
   - [ ] Move and update tests

4. **Integration Phase**
   - [ ] Update build configuration
   - [ ] Verify compilation succeeds
   - [ ] Run all tests
   - [ ] Fix any circular dependencies
   - [ ] Generate API documentation

5. **Documentation Phase**
   - [ ] Create/update README.md
   - [ ] Create MIGRATION.md guide
   - [ ] Create API.md reference
   - [ ] Document breaking changes

6. **Cleanup Phase**
   - [ ] Verify all files migrated
   - [ ] Remove original packages
   - [ ] Remove temporary scripts
   - [ ] Update rush.json (remove old packages, add new ones)
   - [ ] Update all package.json dependencies across monorepo
   - [ ] Verify version consistency (all references match actual package version)
   - [ ] Update gruntfile.js (remove old package configurations and tasks)
   - [ ] **Update all import statements** (run fix-imports.ps1 script)
   - [ ] Verify no old imports remain
   - [ ] Run `rush update` to regenerate dependency graph
   - [ ] Update CI/CD configuration
   - [ ] Update consuming packages

### For Merging from Other Branches

1. **Assessment**
   - Compare file structures between branches
   - Identify new files in other branch
   - Identify modified files
   - Check for conflicts

2. **Strategy Selection**
   - **If other branch has old structure**: Cherry-pick changes and reorganize
   - **If other branch has new structure**: Standard merge with conflict resolution
   - **If mixed**: Migrate old structure files first, then merge

3. **Execution**
   ```bash
   # Create merge branch
   git checkout -b merge-branch-name
   
   # If reorganizing needed
   # 1. Copy new files to correct locations
   # 2. Update import paths
   # 3. Test compilation
   
   # Standard merge
   git merge other-branch
   
   # Resolve conflicts using new structure
   # Test thoroughly
   ```

## File Migration Checklist Template

Use this checklist for future migrations:

```markdown
### Package: [NAME]

**Source:** `[path]`  
**Target:** `[path]`  
**Files:** [count]

- [ ] Interfaces → `src/interfaces/[domain]/`
- [ ] Enums → `src/enums/[domain]/`
- [ ] Types → `src/types/[domain]/`
- [ ] Core functionality → `src/core/` or domain folder
- [ ] Utilities → `src/utils/`
- [ ] Constants → `src/constants/`
- [ ] Tests → `Tests/Unit/[domain]/`
- [ ] Update imports in moved files
- [ ] Verify compilation
- [ ] Verify tests pass
```

## Success Metrics

**Target Metrics (Achieved):**
- ✅ Single unified package (from 3)
- ✅ 273 source files (from 278)
- ✅ Zero noop code in main package
- ✅ All tests passing
- ✅ Build succeeds
- ✅ Documentation complete
- ✅ Migration guide available

**Quality Metrics:**
- Code organization: ✅ Logical by functionality
- Separation of concerns: ✅ Clear AppInsights vs OTel
- Tree-shaking: ✅ Side-effect-free exports
- Documentation: ✅ Comprehensive (README, MIGRATION, API)
- Test coverage: ✅ All original tests maintained

## Version History

- **v4.0.0-alpha.1** (January 15, 2026): Initial unified package release
  - Merged AppInsightsCore, AppInsightsCommon, and OpenTelemetry
  - Reorganized by functionality
  - Zero noop code (moved to otel-noop-js)
  - Comprehensive documentation

## References

### Created Documents
- [README.md](shared/otel-core/README.md) - Package documentation
- [MIGRATION.md](shared/otel-core/MIGRATION.md) - User migration guide
- [API.md](shared/otel-core/API.md) - API reference
- [MIGRATION_VERIFICATION.md](shared/otel-core/MIGRATION_VERIFICATION.md) - Audit trail
- [typedoc.json](shared/otel-core/typedoc.json) - API doc generation

### Original Packages (Removed)
- ~~shared/AppInsightsCore~~ → otel-core
- ~~shared/AppInsightsCommon~~ → otel-core
- ~~shared/OpenTelemetry~~ → otel-core

### New Packages
- shared/otel-core (`@microsoft/otel-core-js` - unified package)
- shared/otel-noop (`@microsoft/otel-noop-js` - noop implementations)

---

**Last Updated:** January 20, 2026  
**Status:** ✅ Phase 1 & 2 Complete - Ready for Phase 3
