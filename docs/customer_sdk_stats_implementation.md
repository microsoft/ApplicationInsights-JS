# Customer-Facing SDK Stats — Implementation Plan

## Table of Contents

- [Overview](#overview)
- [Goals & Constraints](#goals--constraints)
- [Architecture](#architecture)
  - [High-Level Data Flow](#high-level-data-flow)
  - [Key Design Decisions](#key-design-decisions)
- [Refactoring the Existing StatsBeat Code](#refactoring-the-existing-statsbeat-code)
  - [What Changes](#what-changes)
  - [What Stays](#what-stays)
- [Implementation Details](#implementation-details)
  - [Phase 1: Sender Notification Gaps](#phase-1-sender-notification-gaps)
  - [Phase 2: Refactor StatsBeat → Customer SDK Stats Listener](#phase-2-refactor-statsbeat--customer-sdk-stats-listener)
  - [Phase 3: AISKU Integration](#phase-3-aisku-integration)
  - [Phase 4: Configuration & Feature Gating](#phase-4-configuration--feature-gating)
- [File-by-File Changes](#file-by-file-changes)
- [Interfaces & Types](#interfaces--types)
- [Metric Payload Format](#metric-payload-format)
- [Bundle Size Strategy](#bundle-size-strategy)
- [Testing Plan](#testing-plan)
- [Rollout & Migration](#rollout--migration)

---

## Overview

This document describes the implementation plan for **Customer-Facing SDK Stats** in the Application Insights JavaScript SDK. The feature emits three custom metrics — `Item_Success_Count`, `Item_Dropped_Count`, and `Item_Retry_Count` — to the **customer's own Application Insights resource** every 15 minutes, enabling self-service troubleshooting of telemetry delivery issues.

The implementation **refactors** the existing (commented-out) internal StatsBeat code to:

1. **Use the Notification Manager** instead of custom sender logic — the Sender channel fires `eventsSent` / `eventsDiscarded` / retry notifications, and a listener accumulates counts.
2. **Send metrics via `core.track()`** to the customer's own instrumentation key (not a stats-specific iKey).
3. **Minimize bundle size impact** using the project's established patterns (`dynamicProto`, `const enum`, `__DynamicConstants`, no ES6+ operators, etc.).

Reference spec: [Customer-Facing SDKStats Spec](../customer_facing_sdk_stats_spec.md)

---

## Goals & Constraints

| Goal | Detail |
|------|--------|
| **Three metrics** | `Item_Success_Count`, `Item_Dropped_Count`, `Item_Retry_Count` — spec-required names and dimensions |
| **Customer's iKey** | Metrics are sent to the customer's own AI resource, NOT a separate stats endpoint |
| **15-minute interval** | Counters accumulate and flush on a configurable short interval (default 900s) |
| **On by default** | Feature is enabled by default; kill switch via `featureOptIn` config |
| **Minimal size impact** | Target < 2KB minified gzip addition to the AISKU bundle |
| **ES5 compatible** | No `?.`, `??`, `...`, `async/await` |
| **No separate sender** | Reuse `core.track()` → existing Sender pipeline → customer's endpoint |
| **Notification-driven** | Counters are fed from `INotificationListener` callbacks, not by modifying Sender internals |

---

## Architecture

### High-Level Data Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         Application Code                                 │
│                   appInsights.trackEvent(...)                             │
└──────────────┬───────────────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       AppInsightsCore                                    │
│                      core.track(item)                                    │
│                           │                                              │
│                    Plugin Pipeline                                        │
│                           │                                              │
│              ┌────────────┼────────────┐                                 │
│              ▼            ▼            ▼                                  │
│          Analytics   Properties    Sender                                │
│                                       │                                  │
│                          ┌────────────┴────────────┐                     │
│                          │   HTTP Send (fetch/xhr)  │                    │
│                          │                          │                    │
│                          ▼                          ▼                    │
│                     On Success              On Error/Retry               │
│                          │                          │                    │
│                          ▼                          ▼                    │
│              ┌─────────────────────────────────────────────┐             │
│              │     NotificationManager dispatches:         │             │
│              │     • eventsSent(items)                     │             │
│              │     • eventsDiscarded(items, reason)  [NEW] │             │
│              │     • eventsRetry(items, reason)      [NEW] │             │
│              └────────────────┬────────────────────────────┘             │
│                               │                                          │
│                               ▼                                          │
│              ┌─────────────────────────────────────────────┐             │
│              │   SdkStatsNotificationListener              │             │
│              │   (INotificationListener implementation)    │             │
│              │                                             │             │
│              │   Accumulates per 15-min window:            │             │
│              │   • success counts (by telemetry_type)      │             │
│              │   • dropped counts (by code + type)         │             │
│              │   • retry counts (by code + type)           │             │
│              │                                             │             │
│              │   On timer flush:                           │             │
│              │   → core.track(Item_Success_Count metric)   │             │
│              │   → core.track(Item_Dropped_Count metric)   │             │
│              │   → core.track(Item_Retry_Count metric)     │             │
│              └─────────────────────────────────────────────┘             │
│                                                                          │
│  core.track(metric) → same pipeline → Sender → customer endpoint        │
└──────────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Notification-driven accumulation**: Rather than hooking into Sender internals, the SDK Stats listener subscribes to `INotificationManager` events. This keeps the Sender code clean and makes SDK Stats a loosely-coupled consumer.

2. **`core.track()` for emission**: SDK Stats metrics flow through the same telemetry pipeline as customer telemetry. They use the customer's own iKey (already set on the core) and go through sampling, batching, and sending like any other metric. Because these are low-volume (3 metrics per 15 min per dimension), the overhead is negligible.

3. **No `IStatsBeat` interface reuse for customer stats**: The existing `IStatsBeat` / `IStatsMgr` / `INetworkStatsbeat` interfaces were designed for internal stats with endpoint-to-iKey mapping and glob-based routing. Customer SDK Stats has a simpler model (everything goes to the customer's iKey), so we create a new, lighter-weight listener. The old interfaces can be retained for future internal stats if needed.

4. **Listener registered in AISKU**: The `SdkStatsNotificationListener` is created and registered during AISKU initialization. This keeps it out of the core package and makes it tree-shakeable for consumers who don't use the full SKU.

---

## Refactoring the Existing StatsBeat Code

### What Changes

| File | Change |
|------|--------|
| `shared/AppInsightsCore/src/core/StatsBeat.ts` | **Retain** the file but decouple from customer stats. The internal stats manager (`createStatsMgr`) remains available for future internal stats use if needed. No immediate code changes needed since it's already commented out of exports. |
| `channels/applicationinsights-channel-js/src/Sender.ts` | **Add** notification dispatch calls for `eventsSent`, `eventsDiscarded`, and a new `eventsRetry` notification. Existing commented-out statsbeat code is left in place for reference. |
| `shared/AppInsightsCore/src/index.ts` | **Keep** statsbeat exports commented out. They are not needed for customer SDK stats. |

### What Stays

- All existing commented-out statsbeat code in `Sender.ts`, `AppInsightsCore.ts`, and `IAppInsightsCore.ts` remains untouched for potential future internal stats use.
- `StatsBeat.ts`, its interfaces (`IStatsBeat`, `IStatsMgr`, `INetworkStatsbeat`, etc.), and enums (`eStatsType`) remain in the codebase for potential future internal stats use. They are not exported and add zero bundle cost.
- The `INotificationListener` / `INotificationManager` infrastructure — this is the foundation for the new approach.

---

## Implementation Details

### Phase 1: Sender Notification Gaps

**Problem**: The current `applicationinsights-channel-js` Sender only fires `eventsSendRequest`. It does NOT fire `eventsSent` or `eventsDiscarded`. The customer SDK Stats listener needs these events to count successes, drops, and retries.

**Changes to `Sender.ts`**:

#### 1a. Fire `eventsSent` on success

In `_onSuccess()`, after clearing the buffer, dispatch `eventsSent` through the notification manager:

```typescript
function _onSuccess(payload: IInternalStorageItem[], countOfItemsInPayload: number) {
    _self._buffer && _self._buffer.clearSent(payload);
    // Notify listeners of successful send
    let mgr = _getNotifyMgr();
    if (mgr) {
        // Extract original ITelemetryItem[] from the payload
        let items = _extractTelemetryItems(payload);
        items && mgr.eventsSent(items);
    }
}
```

#### 1b. Fire `eventsDiscarded` on non-retryable failure

In `_onError()`, dispatch `eventsDiscarded` with the appropriate reason:

```typescript
function _onError(payload: IInternalStorageItem[], message: string, event?: ErrorEvent) {
    _throwInternal(_self.diagLog(),
        eLoggingSeverity.WARNING,
        _eInternalMessageId.OnError,
        "Failed to send telemetry.",
        { message });
    _self._buffer && _self._buffer.clearSent(payload);
    // Notify listeners of discarded events
    let mgr = _getNotifyMgr();
    if (mgr) {
        let items = _extractTelemetryItems(payload);
        items && mgr.eventsDiscarded(items, eEventsDiscardedReason.NonRetryableStatus);
    }
}
```

#### 1c. Add retry notification

The `INotificationListener` currently has no retry-specific callback. We have two options:

**Option A (Recommended): Reuse `eventsSendRequest` with retry reason**
The existing `eventsSendRequest(sendReason, isAsync)` already has `SendRequestReason.Retry = 5`. We can extend this to also pass the events being retried, or add a lightweight new callback.

**Option B: Add a new `eventsRetry` callback to `INotificationListener`**
Add `eventsRetry?(events: ITelemetryItem[], statusCode: number): void` to the listener interface.

**Recommendation**: Option B — a dedicated `eventsRetry` callback — because it provides the events and status code needed for SDK Stats dimensions. This follows the existing pattern of `eventsSent` and `eventsDiscarded`.

In `_checkResponsStatus()` and `_resendPayload()`, fire the retry notification:

```typescript
// In the retry path of _checkResponsStatus:
if (!_isRetryDisabled && _isRetriable(status)) {
    _resendPayload(payload);
    // Notify listeners of retry
    let mgr = _getNotifyMgr();
    if (mgr && mgr.eventsRetry) {
        let items = _extractTelemetryItems(payload);
        items && mgr.eventsRetry(items, status);
    }
    // ... existing logging
}
```

#### 1d. Helper: `_extractTelemetryItems`

A helper that extracts the original `ITelemetryItem[]` from the Sender's `IInternalStorageItem[]` payload. Each `IInternalStorageItem` wraps an `ITelemetryItem` in its `.item` property.

```typescript
function _extractTelemetryItems(payload: IInternalStorageItem[]): ITelemetryItem[] {
    if (payload && payload.length) {
        let items: ITelemetryItem[] = [];
        arrForEach(payload, (p) => {
            p && p.item && items.push(p.item);
        });
        return items.length ? items : null;
    }
    return null;
}
```

### Phase 2: Refactor StatsBeat → Customer SDK Stats Listener

Create a new file for the customer SDK stats listener. This is the core of the feature.

#### New file: `shared/AppInsightsCore/src/core/SdkStatsNotificationCbk.ts`

This file exports a factory function `createSdkStatsNotifCbk()` that returns an `INotificationListener`. The listener:

1. Accumulates success/dropped/retry counts in a lightweight counter object
2. Groups counts by `telemetry_type` (and by `drop.code`/`retry.code` for dropped/retried items)
3. On a 15-minute timer, flushes accumulated counts as `Item_Success_Count`, `Item_Dropped_Count`, `Item_Retry_Count` metrics via a provided `track` callback
4. Resets counters after flush

```typescript
// shared/AppInsightsCore/src/core/SdkStatsNotificationCbk.ts

import { ITimerHandler, scheduleTimeout } from "@nevware21/ts-utils";
import { INotificationListener } from "../interfaces/ai/INotificationListener";
import { ITelemetryItem } from "../interfaces/ai/ITelemetryItem";

const FLUSH_INTERVAL = 900000; // 15 min default
const MET_SUCCESS = "Item_Success_Count";
const MET_DROPPED = "Item_Dropped_Count";
const MET_RETRY = "Item_Retry_Count";

// Map baseType to spec telemetry_type values
const _typeMap: { [key: string]: string } = {
    "EventData": "CUSTOM_EVENT",
    "MetricData": "CUSTOM_METRIC",
    "RemoteDependencyData": "DEPENDENCY",
    "ExceptionData": "EXCEPTION",
    "PageviewData": "PAGE_VIEW",
    "PageviewPerformanceData": "PAGE_VIEW",
    "MessageData": "TRACE",
    "RequestData": "REQUEST",
    "AvailabilityData": "AVAILABILITY"
};

export interface ISdkStatsConfig {
    /** The track function to call when flushing metrics. Typically core.track(). */
    trk: (item: ITelemetryItem) => void;
    /** SDK language identifier, e.g. "JavaScript" */
    lang: string;
    /** SDK version string */
    ver: string;
    /** Flush interval override in ms (default 900000 = 15 min) */
    int?: number;
}

export function createSdkStatsNotifCbk(cfg: ISdkStatsConfig): INotificationListener & { flush: () => void } {
    // ... accumulator state, timer, flush logic
    // See "Detailed Implementation" section below
}
```

**Detailed Implementation Sketch** (follows project patterns):

```typescript
export function createSdkStatsNotifCbk(cfg: ISdkStatsConfig): INotificationListener & { flush: () => void } {
    let _successCounts: Record<string, number> = {};  // telemetry_type → count
    let _droppedCounts: Record<string, Record<string, number>> = {};  // dropCode → { telemetry_type → count }
    let _retryCounts: Record<string, Record<string, number>> = {};    // retryCode → { telemetry_type → count }
    let _timer: ITimerHandler;
    let _interval = cfg.int || FLUSH_INTERVAL;

    function _ensureTimer() {
        if (!_timer) {
            _timer = scheduleTimeout(_flush, _interval);
        }
    }

    function _getTelType(item: ITelemetryItem): string {
        return _typeMap[item.baseType] || "CUSTOM_EVENT";
    }

    function _incSuccess(items: ITelemetryItem[]) {
        for (let i = 0; i < items.length; i++) {
            let t = _getTelType(items[i]);
            _successCounts[t] = (_successCounts[t] || 0) + 1;
        }
        _ensureTimer();
    }

    function _incDropped(items: ITelemetryItem[], code: string) {
        if (!_droppedCounts[code]) {
            _droppedCounts[code] = {};
        }
        let bucket = _droppedCounts[code];
        for (let i = 0; i < items.length; i++) {
            let t = _getTelType(items[i]);
            bucket[t] = (bucket[t] || 0) + 1;
        }
        _ensureTimer();
    }

    function _incRetry(items: ITelemetryItem[], code: string) {
        if (!_retryCounts[code]) {
            _retryCounts[code] = {};
        }
        let bucket = _retryCounts[code];
        for (let i = 0; i < items.length; i++) {
            let t = _getTelType(items[i]);
            bucket[t] = (bucket[t] || 0) + 1;
        }
        _ensureTimer();
    }

    function _createMetric(name: string, value: number, props: { [key: string]: any }): ITelemetryItem {
        // Merge standard dimensions
        props["language"] = cfg.lang;
        props["version"] = cfg.ver;
        props["computeType"] = "unknown"; // Browser SDK cannot reliably detect compute type

        return {
            name: name,
            baseType: "MetricData",
            baseData: {
                ver: 2,
                metrics: [{ name: name, value: value }],
                properties: props
            }
        };
    }

    function _flush() {
        _timer && _timer.cancel();
        _timer = null;

        // Flush success counts
        for (var telType in _successCounts) {
            if (_successCounts.hasOwnProperty(telType)) {
                var cnt = _successCounts[telType];
                if (cnt > 0) {
                    cfg.trk(_createMetric(MET_SUCCESS, cnt, {
                        "telemetry_type": telType
                    }));
                }
            }
        }

        // Flush dropped counts
        for (var code in _droppedCounts) {
            if (_droppedCounts.hasOwnProperty(code)) {
                var bucket = _droppedCounts[code];
                for (var telType in bucket) {
                    if (bucket.hasOwnProperty(telType)) {
                        var cnt = bucket[telType];
                        if (cnt > 0) {
                            cfg.trk(_createMetric(MET_DROPPED, cnt, {
                                "telemetry_type": telType,
                                "drop.code": code
                            }));
                        }
                    }
                }
            }
        }

        // Flush retry counts
        for (var code in _retryCounts) {
            if (_retryCounts.hasOwnProperty(code)) {
                var bucket = _retryCounts[code];
                for (var telType in bucket) {
                    if (bucket.hasOwnProperty(telType)) {
                        var cnt = bucket[telType];
                        if (cnt > 0) {
                            cfg.trk(_createMetric(MET_RETRY, cnt, {
                                "telemetry_type": telType,
                                "retry.code": code
                            }));
                        }
                    }
                }
            }
        }

        // Reset accumulators
        _successCounts = {};
        _droppedCounts = {};
        _retryCounts = {};
    }

    return {
        eventsSent: _incSuccess,
        eventsDiscarded: (events: ITelemetryItem[], reason: number) => {
            // Map EventsDiscardedReason to spec drop codes
            var code = _mapDropCode(reason);
            _incDropped(events, code);
        },
        eventsRetry: (events: ITelemetryItem[], statusCode: number) => {
            var code = "" + statusCode; // numeric status code as string per spec
            _incRetry(events, code);
        },
        flush: _flush,
        unload: () => {
            // Flush remaining counts before unload
            _flush();
            _timer && _timer.cancel();
            _timer = null;
        }
    };
}

function _mapDropCode(reason: number): string {
    // Maps eEventsDiscardedReason to spec drop.code values
    // 0=Unknown → "CLIENT_EXCEPTION"
    // 1=NonRetryableStatus → will be overridden by actual status code in enhanced notification
    // 2=InvalidEvent → "CLIENT_EXCEPTION"
    // 5=QueueFull → "CLIENT_EXCEPTION"
    // 6=BeaconSendFailure → "CLIENT_EXCEPTION"
    switch (reason) {
        case 1: return "NonRetryableStatus"; // Overridden with actual code when available
        default: return "CLIENT_EXCEPTION";
    }
}
```

> **NOTE on `eventsDiscarded` enhancement**: To populate `drop.code` with the actual HTTP status code (e.g., `"402"`, `"403"`), we need the Sender to pass the status code when calling `eventsDiscarded`. We propose adding an optional 4th parameter or using a convention where the `sendType` parameter carries the status code for `NonRetryableStatus` scenarios. See the [Interfaces & Types](#interfaces--types) section.

### Phase 3: AISKU Integration

The listener is created and registered during AISKU initialization in `AISKU/src/AISku.ts`.

```typescript
// Inside the dynamicProto constructor of AppInsightsSku

// After core.initialize() and channel setup:
if (isFeatureEnabled("SdkStats", cfg, true)) {  // on by default
    let statsListener = createSdkStatsNotifCbk({
        trk: (item) => { core.track(item); },
        lang: "JavaScript",
        ver: EnvelopeCreator.Version,
        int: cfg.sdkStatsExportInterval || FLUSH_INTERVAL
    });
    core.addNotificationListener(statsListener);
    // Store reference for unload
    _sdkStatsListener = statsListener;
}
```

On unload:
```typescript
if (_sdkStatsListener) {
    _sdkStatsListener.flush();
    core.removeNotificationListener(_sdkStatsListener);
    _sdkStatsListener = null;
}
```

### Phase 4: Configuration & Feature Gating

#### Configuration surface

| Config Property | Type | Default | Description |
|----------------|------|---------|-------------|
| `featureOptIn.SdkStats.mode` | `FeatureOptInMode` | `enable` (3) | Enables/disables the feature. Set to `disable` (1) to opt out. |
| `sdkStatsExportInterval` | `number` | `900` (seconds) | Short export interval. Min 60s. |

#### Feature gating

```typescript
// The feature is ON by default using isFeatureEnabled with default=true
if (isFeatureEnabled("SdkStats", cfg, true)) {
    // Initialize listener
}
```

This means:
- **No config** → enabled (default)
- `featureOptIn: { "SdkStats": { mode: FeatureOptInMode.disable } }` → disabled
- `featureOptIn: { "SdkStats": { mode: FeatureOptInMode.enable } }` → enabled (explicit)

---

## File-by-File Changes

### New Files

| File | Description |
|------|-------------|
| `shared/AppInsightsCore/src/core/SdkStatsNotificationCbk.ts` | Factory function `createSdkStatsNotifCbk()` → `INotificationListener` that accumulates and flushes SDK Stats metrics |

### Modified Files

| File | Changes |
|------|---------|
| **`shared/AppInsightsCore/src/interfaces/ai/INotificationListener.ts`** | Add optional `eventsRetry?(events: ITelemetryItem[], statusCode: number): void` callback |
| **`shared/AppInsightsCore/src/interfaces/ai/INotificationManager.ts`** | Add `eventsRetry?(events: ITelemetryItem[], statusCode: number): void` dispatch method |
| **`shared/AppInsightsCore/src/core/NotificationManager.ts`** | Implement `eventsRetry` dispatch using `_runListeners` (same pattern as `eventsSent`) |
| **`shared/AppInsightsCore/src/constants/InternalConstants.ts`** | Add `STR_EVENTS_RETRY = "eventsRetry"` constant |
| **`shared/AppInsightsCore/src/index.ts`** | Export `createSdkStatsNotifCbk` and `ISdkStatsConfig` |
| **`channels/applicationinsights-channel-js/src/Sender.ts`** | (1) Fire `eventsSent` in `_onSuccess`, (2) Fire `eventsDiscarded` in `_onError`, (3) Fire `eventsRetry` in retry paths of `_checkResponsStatus`, (4) Add `_extractTelemetryItems` helper |
| **`channels/applicationinsights-channel-js/src/Interfaces.ts`** | Ensure `IInternalStorageItem.item` is typed as `ITelemetryItem` (verify this already exists) |
| **`AISKU/src/AISku.ts`** | Register `SdkStatsNotificationListener` on initialization, unregister on teardown |

### Files to Clean Up (Remove Dead Code)

| File | Action |
|------|--------|
| `shared/AppInsightsCore/Tests/Unit/src/StatsBeat.Tests.ts` | Remove or update for new approach |
| `channels/applicationinsights-channel-js/Tests/Unit/src/StatsBeat.tests.ts` | Remove or update |

---

## Interfaces & Types

### Updated `INotificationListener`

```typescript
export interface INotificationListener {
    // ... existing callbacks ...

    /**
     * [Optional] A function called when events are being retried.
     * @param events - The array of events that are being retried.
     * @param statusCode - The HTTP status code that triggered the retry.
     * @since 3.x.x
     */
    eventsRetry?(events: ITelemetryItem[], statusCode: number): void;
}
```

### Updated `INotificationManager`

```typescript
export interface INotificationManager {
    // ... existing methods ...

    /**
     * Notification for events being retried.
     * @param events - The array of events that are being retried.
     * @param statusCode - The HTTP status code that triggered the retry.
     */
    eventsRetry?(events: ITelemetryItem[], statusCode: number): void;
}
```

### Enhanced `eventsDiscarded` Convention

To carry the HTTP status code for `NonRetryableStatus` drops, we use the existing `sendType` parameter as the status code when `reason === eEventsDiscardedReason.NonRetryableStatus`:

```typescript
// In Sender, when a non-retryable status code triggers a drop:
mgr.eventsDiscarded(items, eEventsDiscardedReason.NonRetryableStatus, statusCode);
//                                                                   ^^^^^^^^^^
//                                 sendType parameter repurposed as HTTP status code
```

The listener checks `reason === 1 (NonRetryableStatus)` and reads `sendType` as the actual drop code:

```typescript
eventsDiscarded: (events, reason, sendType) => {
    var code;
    if (reason === 1 && sendType) { // NonRetryableStatus
        code = "" + sendType; // HTTP status code as string
    } else {
        code = "CLIENT_EXCEPTION";
    }
    _incDropped(events, code);
}
```

### `ISdkStatsConfig`

```typescript
export interface ISdkStatsConfig {
    /** Track function (typically core.track bound) */
    trk: (item: ITelemetryItem) => void;
    /** SDK language name */
    lang: string;
    /** SDK version */
    ver: string;
    /** Flush interval in ms (default 900000) */
    int?: number;
}
```

---

## Metric Payload Format

All three metrics follow the Application Insights custom metric envelope format. The metrics are sent as `ITelemetryItem` objects via `core.track()`, which means the Sender will wrap them in standard envelopes with the customer's iKey and `ai.internal.sdkVersion` tag automatically.

### Item_Success_Count

```json
{
    "name": "Item Success Count",
    "baseType": "MetricData",
    "baseData": {
        "ver": 2,
        "metrics": [{ "name": "Item_Success_Count", "value": 150 }],
        "properties": {
            "language": "JavaScript",
            "version": "3.x.x",
            "computeType": "unknown",
            "telemetry_type": "DEPENDENCY"
        }
    }
}
```

### Item_Dropped_Count

```json
{
    "name": "Item Dropped Count",
    "baseType": "MetricData",
    "baseData": {
        "ver": 2,
        "metrics": [{ "name": "Item_Dropped_Count", "value": 5 }],
        "properties": {
            "language": "JavaScript",
            "version": "3.x.x",
            "computeType": "unknown",
            "telemetry_type": "TRACE",
            "drop.code": "402",
            "drop.reason": "Exceeded daily quota"
        }
    }
}
```

### Item_Retry_Count

```json
{
    "name": "Item Retry Count",
    "baseType": "MetricData",
    "baseData": {
        "ver": 2,
        "metrics": [{ "name": "Item_Retry_Count", "value": 20 }],
        "properties": {
            "language": "JavaScript",
            "version": "3.x.x",
            "computeType": "unknown",
            "telemetry_type": "DEPENDENCY",
            "retry.code": "429"
        }
    }
}
```

---

## Bundle Size Strategy

The following techniques keep the SDK Stats feature's bundle size impact minimal:

### 1. Factory Function (No Class)

`createSdkStatsNotifCbk` returns a plain object literal implementing `INotificationListener`. No `dynamicProto` needed because there is no class — just a closure returning an object. This is the smallest possible pattern for a self-contained module.

### 2. String Constant Reuse

Metric names and property keys are assigned to short local `var` names:
```typescript
var MET_S = "Item_Success_Count";
var MET_D = "Item_Dropped_Count";
var MET_R = "Item_Retry_Count";
var P_LANG = "language";
var P_VER = "version";
```
The minifier compresses these to single characters, saving bytes across all usages.

### 3. Shared `_createMetric` Helper

One function creates all three metric types, differing only by name and properties. Avoids code duplication for envelope construction.

### 4. `for..in` Loops Instead of `Object.keys().forEach()`

Uses `for..in` with `hasOwnProperty` checks — ES5 compatible, no helper imports.

### 5. No ES6+ Operators

- No `?.` (optional chaining) — use explicit null checks
- No `??` (nullish coalescing) — use `||`
- No `...` (spread) — use manual property assignment
- No `async/await` — use `scheduleTimeout` for timer

### 6. `const enum` for Internal Constants

Any new enum values (e.g., for drop reason mapping) use `const enum` to inline as integers.

### 7. `__DynamicConstants` Integration

After implementation, run `npm run lint-fix` and the Grunt build task to auto-generate `__DynamicConstants.ts` entries for frequently-used strings.

### 8. Tree-Shakeable Export

The factory function is marked with `/*#__NO_SIDE_EFFECTS__*/` so bundlers can tree-shake it if unused:

```typescript
/*#__NO_SIDE_EFFECTS__*/
export function createSdkStatsNotifCbk(cfg: ISdkStatsConfig): INotificationListener & { flush: () => void } {
    // ...
}
```

### 9. Place in Core, Not a New Package

Placing the listener in `shared/AppInsightsCore` avoids a new package/build artifact. The function is small enough (~1KB minified) to not warrant its own package.

---

## Testing Plan

### Unit Tests

#### `shared/AppInsightsCore/Tests/Unit/src/SdkStatsNotificationCbk.Tests.ts`

| Test | Description |
|------|-------------|
| **Counts success by telemetry_type** | Send `eventsSent` with items of different `baseType`, verify accumulated counts per `telemetry_type` |
| **Counts drops with status code** | Send `eventsDiscarded` with `NonRetryableStatus` reason and status code, verify `drop.code` is correct |
| **Counts drops with CLIENT_EXCEPTION** | Send `eventsDiscarded` with non-status reasons, verify `drop.code` = `CLIENT_EXCEPTION` |
| **Counts retries by status code** | Send `eventsRetry` with 429/503 status codes, verify `retry.code` values |
| **Flushes on 15-min timer** | Use `useFakeTimers`, advance by 15 min, verify metrics are emitted via `trk` callback |
| **Resets counters after flush** | After flush, verify all counters are zero |
| **Multiple flushes accumulate independently** | Two timer periods, verify each period's metrics are independent |
| **No metrics emitted when counts are zero** | Zero activity → no `trk` calls on flush |
| **Unload flushes remaining** | Call `unload()`, verify final flush occurs |
| **telemetry_type mapping** | Verify all `baseType` → `telemetry_type` mappings per spec |
| **SDK Stats metrics don't count themselves** | Verify that Item_Success_Count/Item_Dropped_Count/Item_Retry_Count metrics emitted by the listener are tagged to be excluded from counting (or verify the system doesn't double-count) |

#### `channels/applicationinsights-channel-js/Tests/Unit/src/Sender.Tests.ts`

| Test | Description |
|------|-------------|
| **eventsSent fired on 200** | Mock fetch → 200, verify `eventsSent` notification is dispatched with correct items |
| **eventsDiscarded fired on non-retryable status** | Mock fetch → 403, verify `eventsDiscarded` is dispatched with reason `NonRetryableStatus` and status code |
| **eventsRetry fired on retryable status** | Mock fetch → 429, verify `eventsRetry` is dispatched with status code |
| **eventsDiscarded on beacon failure** | Beacon API failure → verify `eventsDiscarded` with `BeaconSendFailure` reason |
| **Partial success (206)** | Mock 206 with partial response, verify `eventsSent` for accepted, `eventsRetry`/`eventsDiscarded` for failed |

#### `AISKU/Tests/Unit/src/SdkStatsIntegration.Tests.ts`

| Test | Description |
|------|-------------|
| **Listener registered on init** | Initialize AISKU, verify notification listener is registered |
| **Feature disabled via config** | Set `featureOptIn.SdkStats.mode = disable`, verify no listener registered |
| **End-to-end: track → send → count** | Track events, mock successful send, advance timer, verify SDK Stats metrics appear in pipeline |
| **Unload removes listener** | Call `appInsights.unload()`, verify listener is removed |
| **Dynamic config change** | Change `featureOptIn.SdkStats` after init, verify listener responds |

### Test Patterns

All tests follow project conventions:
- Extend `AITestClass`
- Use `this.testCase()` with `IPromise` return for async
- Use `this.useFakeTimers()` for timer control
- Call `core.unload(false)` in cleanup
- Test both static and dynamic configuration changes

---

## Rollout & Migration

### Phase 1: Internal Validation
1. Implement Sender notifications (`eventsSent` / `eventsDiscarded` / `eventsRetry`)
2. Implement `SdkStatsNotificationCbk`
3. Unit test thoroughly
4. Integration test in AISKU

### Phase 2: Opt-In Preview
1. Ship with `featureOptIn` default set to `disable`
2. Document opt-in via `featureOptIn: { "SdkStats": { mode: 3 } }`
3. Validate with internal dogfood customers

### Phase 3: On-By-Default
1. Flip `featureOptIn` default to `enable` (the `isFeatureEnabled("SdkStats", cfg, true)` call uses `true` as default)
2. Document kill switch in README
3. Per spec: ignore legacy `APPLICATIONINSIGHTS_SDKSTATS_ENABLED_PREVIEW` env var
4. Use new metric names (`Item_Success_Count` etc.), not legacy `preview.*` names

### Migration from Internal StatsBeat

- The old `IStatsBeat` / `IStatsMgr` / `createStatsMgr()` code was never shipped active (entirely commented out)
- No backward compatibility concerns — there is no public API surface to maintain
- The old code remains in the codebase uncommitted/unexported for potential future internal stats use
- Existing commented-out statsbeat integration points in `Sender.ts`, `AppInsightsCore.ts`, and `IAppInsightsCore.ts` are left in place for reference

---

## Appendix: Mapping `baseType` → `telemetry_type`

| SDK `baseType` | Spec `telemetry_type` |
|---|---|
| `EventData` | `CUSTOM_EVENT` |
| `MetricData` | `CUSTOM_METRIC` |
| `RemoteDependencyData` | `DEPENDENCY` |
| `ExceptionData` | `EXCEPTION` |
| `PageviewData` | `PAGE_VIEW` |
| `PageviewPerformanceData` | `PAGE_VIEW` |
| `MessageData` | `TRACE` |
| `RequestData` | `REQUEST` |
| `AvailabilityData` | `AVAILABILITY` |

## Appendix: Drop Code Mapping

| `eEventsDiscardedReason` | Spec `drop.code` |
|---|---|
| `NonRetryableStatus` (1) | Actual HTTP status code (e.g., `"402"`, `"403"`) |
| `InvalidEvent` (2) | `"CLIENT_EXCEPTION"` |
| `SizeLimitExceeded` (3) | `"CLIENT_EXCEPTION"` |
| `KillSwitch` (4) | `"CLIENT_EXCEPTION"` |
| `QueueFull` (5) | `"CLIENT_EXCEPTION"` |
| `BeaconSendFailure` (6) | `"CLIENT_EXCEPTION"` |
| `Unknown` (0) | `"CLIENT_EXCEPTION"` |

## Appendix: Retry Code Mapping

| Scenario | Spec `retry.code` |
|---|---|
| HTTP 401, 403, 408, 429, 500, 502, 503, 504 | Actual status code as string (e.g., `"429"`) |
| Network exception during send | `"CLIENT_EXCEPTION"` |
| Timeout during send | `"CLIENT_TIMEOUT"` |

## Appendix: Self-Counting Prevention

SDK Stats metrics themselves are telemetry items that flow through the pipeline. To prevent them from being counted (creating an infinite feedback loop), the listener should check the `name` property of items in `eventsSent`/`eventsDiscarded`/`eventsRetry` and skip any items where `name` matches `"Item Success Count"`, `"Item Dropped Count"`, or `"Item Retry Count"`.

```typescript
function _isSdkStatsMetric(item: ITelemetryItem): boolean {
    var n = item.name;
    return n === "Item Success Count" || n === "Item Dropped Count" || n === "Item Retry Count";
}

// In eventsSent handler:
function _incSuccess(items: ITelemetryItem[]) {
    for (var i = 0; i < items.length; i++) {
        if (!_isSdkStatsMetric(items[i])) {
            var t = _getTelType(items[i]);
            _successCounts[t] = (_successCounts[t] || 0) + 1;
        }
    }
    _ensureTimer();
}
```
