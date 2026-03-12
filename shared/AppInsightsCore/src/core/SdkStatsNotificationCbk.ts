// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

import { ITimerHandler, objCreate, objHasOwn, scheduleTimeout } from "@nevware21/ts-utils";
import { IAppInsightsCore } from "../interfaces/ai/IAppInsightsCore";
import { INotificationListener } from "../interfaces/ai/INotificationListener";
import { ITelemetryItem } from "../interfaces/ai/ITelemetryItem";
import { MetricDataType } from "../telemetry/ai/DataTypes";

var _version = "#version#";
var FLUSH_INTERVAL = 900000; // 15 min default
var MET_SUCCESS = "Item_Success_Count";
var MET_DROPPED = "Item_Dropped_Count";
var MET_RETRY = "Item_Retry_Count";
var DROP_CLIENT_EXCEPTION = "CLIENT_EXCEPTION";

// Guard against prototype-polluting keys
function _safeKey(key: string): boolean {
    return key !== "__proto__" && key !== "constructor" && key !== "prototype";
}

// Map baseType to spec telemetry_type values
var _typeMap: { [key: string]: string } = {
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

/**
 * Configuration for SDK Stats periodic reporting.
 */
export interface ISdkStatsConfig {
    /**
     * Flush interval in ms.
     * @defaultValue 900000 (15 minutes)
     */
    int?: number;
}

/**
 * Extended INotificationListener interface for SDK Stats that includes flush and unload operations.
 */
export interface ISdkStatsNotifCbk extends INotificationListener {
    /**
     * Flush accumulated counts and emit metrics via the configured track function.
     */
    flush: () => void;
    /**
     * Flush remaining counts and cancel the timer.
     */
    unload: () => void;
}

/**
 * Creates an INotificationListener that accumulates success/dropped/retry counts and periodically
 * flushes them as Item_Success_Count, Item_Dropped_Count, and Item_Retry_Count metrics via core.track().
 * Language is hardcoded to "JavaScript" and version is set at build time.
 * Reads config.sdkStats.int dynamically from core.config on each flush.
 * @param core - The IAppInsightsCore instance (provides track() and config)
 * @returns An INotificationListener with flush and unload methods
 */
/*#__NO_SIDE_EFFECTS__*/
export function createSdkStatsNotifCbk(core: IAppInsightsCore): ISdkStatsNotifCbk {
    var _successCounts: { [telType: string]: number } = objCreate(null);
    var _droppedCounts: { [code: string]: { [telType: string]: number } } = objCreate(null);
    var _retryCounts: { [code: string]: { [telType: string]: number } } = objCreate(null);
    var _timer: ITimerHandler;
    var _interval = (core.config.sdkStats && core.config.sdkStats.int) || FLUSH_INTERVAL;

    function _ensureTimer() {
        if (!_timer) {
            _timer = scheduleTimeout(_flush, _interval);
        }
    }

    function _getTelType(item: ITelemetryItem): string {
        var bt = item.baseType;
        return (bt && objHasOwn(_typeMap, bt) && _typeMap[bt]) || "CUSTOM_EVENT";
    }

    function _isSdkStatsMetric(item: ITelemetryItem): boolean {
        var n = item.name;
        return n === MET_SUCCESS || n === MET_DROPPED || n === MET_RETRY;
    }

    function _incSuccess(items: ITelemetryItem[]) {
        if (!items || !items.length) {
            return;
        }
        var changed = false;
        for (var i = 0; i < items.length; i++) {
            if (!_isSdkStatsMetric(items[i])) {
                var t = _getTelType(items[i]);
                if (_safeKey(t)) {
                    _successCounts[t] = (_successCounts[t] || 0) + 1;
                    changed = true;
                }
            }
        }
        if (changed) {
            _ensureTimer();
        }
    }

    /**
     * Common helper to increment a bucketed counter (dropped or retry) keyed by code and telemetry type.
     */
    function _incBucketed(counters: { [code: string]: { [telType: string]: number } }, items: ITelemetryItem[], code: string) {
        if (items && items.length && _safeKey(code)) {
            var bucket = counters[code];
            if (!bucket) {
                bucket = counters[code] = objCreate(null);
            }
            var changed = false;
            for (var i = 0; i < items.length; i++) {
                if (!_isSdkStatsMetric(items[i])) {
                    var t = _getTelType(items[i]);
                    if (_safeKey(t)) {
                        bucket[t] = (bucket[t] || 0) + 1;
                        changed = true;
                    }
                }
            }
            if (changed) {
                _ensureTimer();
            }
        }
    }

    function _createMetric(name: string, value: number, telType: string, code?: string, codePropKey?: string): ITelemetryItem {
        var props: { [key: string]: any } = {
            telemetry_type: telType,
            language: "JavaScript",
            version: _version,
            computeType: "unknown"
        };

        if (code && codePropKey) {
            props[codePropKey] = code;
        }

        return {
            name: name,
            baseType: MetricDataType,
            baseData: {
                name: name,
                average: value,
                sampleCount: 1,
                properties: props
            }
        } as ITelemetryItem;
    }

    function _mapDropCode(reason: number, sendType?: number): string {
        // Maps eEventsDiscardedReason to spec drop.code values
        // 1 = NonRetryableStatus → actual HTTP status code when available
        if (reason === 1 && sendType) {
            return "" + sendType;
        }
        return DROP_CLIENT_EXCEPTION;
    }

    /**
     * Common helper to flush bucketed counters (dropped or retry).
     * @param counters - The bucketed counter object
     * @param metricName - The metric name to emit (e.g. MET_DROPPED or MET_RETRY)
     * @param codePropKey - The property key for the code dimension (e.g. "drop.code" or "retry.code")
     */
    function _flushBucketed(counters: { [code: string]: { [telType: string]: number } }, metricName: string, codePropKey: string) {
        for (var code in counters) {
            if (objHasOwn(counters, code)) {
                var bucket = counters[code];
                for (var telType in bucket) {
                    if (objHasOwn(bucket, telType)) {
                        var cnt = bucket[telType];
                        if (cnt > 0) {
                            core.track(_createMetric(metricName, cnt, telType, code, codePropKey));
                        }
                    }
                }
            }
        }
    }

    function _flush() {
        if (_timer) {
            _timer.cancel();
            _timer = null;
        }

        // Re-read interval from core.config in case it changed dynamically
        var statsCfg = (core.config && core.config.sdkStats) || {};
        _interval = statsCfg.int || FLUSH_INTERVAL;

        // Flush success counts
        for (var telType in _successCounts) {
            if (objHasOwn(_successCounts, telType)) {
                var cnt = _successCounts[telType];
                if (cnt > 0) {
                    core.track(_createMetric(MET_SUCCESS, cnt, telType));
                }
            }
        }

        // Flush dropped and retry counts via common helper
        _flushBucketed(_droppedCounts, MET_DROPPED, "drop.code");
        _flushBucketed(_retryCounts, MET_RETRY, "retry.code");

        // Reset accumulators
        _successCounts = objCreate(null);
        _droppedCounts = objCreate(null);
        _retryCounts = objCreate(null);
    }

    return {
        eventsSent: _incSuccess,
        eventsDiscarded: function (events: ITelemetryItem[], reason: number, sendType?: number) {
            var code = _mapDropCode(reason, sendType);
            _incBucketed(_droppedCounts, events, code);
        },
        eventsRetry: function (events: ITelemetryItem[], statusCode: number) {
            var code = "" + statusCode; // numeric status code as string per spec
            _incBucketed(_retryCounts, events, code);
        },
        flush: _flush,
        unload: function () {
            // Flush remaining counts before unload
            _flush();
        }
    };
}
