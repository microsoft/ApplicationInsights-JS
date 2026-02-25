// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

import { ITimerHandler, objCreate, objHasOwn, scheduleTimeout } from "@nevware21/ts-utils";
import { INotificationListener } from "../interfaces/ai/INotificationListener";
import { ITelemetryItem } from "../interfaces/ai/ITelemetryItem";

var FLUSH_INTERVAL = 900000; // 15 min default
var MET_SUCCESS = "Item_Success_Count";
var MET_DROPPED = "Item_Dropped_Count";
var MET_RETRY = "Item_Retry_Count";
var P_LANG = "language";
var P_VER = "version";
var P_COMPUTE = "computeType";
var P_TEL_TYPE = "telemetry_type";
var P_DROP_CODE = "drop.code";
var P_RETRY_CODE = "retry.code";
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
 * Configuration interface for the SDK Stats notification callback.
 */
export interface ISdkStatsConfig {
    /**
     * The track function to call when flushing metrics. Typically core.track().
     */
    trk: (item: ITelemetryItem) => void;
    /**
     * SDK language identifier, e.g. "JavaScript"
     */
    lang: string;
    /**
     * SDK version string.
     */
    ver: string;
    /**
     * Flush interval override in ms (default 900000 = 15 min).
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
 * @param cfg - The SDK stats configuration
 * @returns An INotificationListener with flush and unload methods
 */
/*#__NO_SIDE_EFFECTS__*/
export function createSdkStatsNotifCbk(cfg: ISdkStatsConfig): ISdkStatsNotifCbk {
    var _successCounts: { [telType: string]: number } = objCreate(null);
    var _droppedCounts: { [code: string]: { [telType: string]: number } } = objCreate(null);
    var _retryCounts: { [code: string]: { [telType: string]: number } } = objCreate(null);
    var _timer: ITimerHandler;
    var _interval = cfg.int || FLUSH_INTERVAL;

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
        for (var i = 0; i < items.length; i++) {
            if (!_isSdkStatsMetric(items[i])) {
                var t = _getTelType(items[i]);
                if (_safeKey(t)) {
                    _successCounts[t] = (_successCounts[t] || 0) + 1;
                }
            }
        }
        _ensureTimer();
    }

    function _incDropped(items: ITelemetryItem[], code: string) {
        if (!_safeKey(code)) {
            return;
        }
        var bucket: { [telType: string]: number };
        if (objHasOwn(_droppedCounts, code)) {
            bucket = _droppedCounts[code];
        } else {
            bucket = objCreate(null);
            _droppedCounts[code] = bucket;
        }
        for (var i = 0; i < items.length; i++) {
            if (!_isSdkStatsMetric(items[i])) {
                var t = _getTelType(items[i]);
                if (_safeKey(t)) {
                    bucket[t] = (bucket[t] || 0) + 1;
                }
            }
        }
        _ensureTimer();
    }

    function _incRetry(items: ITelemetryItem[], code: string) {
        if (!_safeKey(code)) {
            return;
        }
        var bucket: { [telType: string]: number };
        if (objHasOwn(_retryCounts, code)) {
            bucket = _retryCounts[code];
        } else {
            bucket = objCreate(null);
            _retryCounts[code] = bucket;
        }
        for (var i = 0; i < items.length; i++) {
            if (!_isSdkStatsMetric(items[i])) {
                var t = _getTelType(items[i]);
                if (_safeKey(t)) {
                    bucket[t] = (bucket[t] || 0) + 1;
                }
            }
        }
        _ensureTimer();
    }

    function _createMetric(name: string, value: number, props: { [key: string]: any }): ITelemetryItem {
        // Merge standard dimensions
        props[P_LANG] = cfg.lang;
        props[P_VER] = cfg.ver;
        props[P_COMPUTE] = "unknown"; // Browser SDK cannot reliably detect compute type

        return {
            name: name,
            baseType: "MetricData",
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

    function _flush() {
        if (_timer) {
            _timer.cancel();
            _timer = null;
        }

        var telType: string;
        var code: string;
        var cnt: number;
        var bucket: { [telType: string]: number };

        // Flush success counts
        for (telType in _successCounts) {
            if (objHasOwn(_successCounts, telType)) {
                cnt = _successCounts[telType];
                if (cnt > 0) {
                    var successProps: { [key: string]: any } = {};
                    successProps[P_TEL_TYPE] = telType;
                    cfg.trk(_createMetric(MET_SUCCESS, cnt, successProps));
                }
            }
        }

        // Flush dropped counts
        for (code in _droppedCounts) {
            if (objHasOwn(_droppedCounts, code)) {
                bucket = _droppedCounts[code];
                for (telType in bucket) {
                    if (objHasOwn(bucket, telType)) {
                        cnt = bucket[telType];
                        if (cnt > 0) {
                            var dropProps: { [key: string]: any } = {};
                            dropProps[P_TEL_TYPE] = telType;
                            dropProps[P_DROP_CODE] = code;
                            cfg.trk(_createMetric(MET_DROPPED, cnt, dropProps));
                        }
                    }
                }
            }
        }

        // Flush retry counts
        for (code in _retryCounts) {
            if (objHasOwn(_retryCounts, code)) {
                bucket = _retryCounts[code];
                for (telType in bucket) {
                    if (objHasOwn(bucket, telType)) {
                        cnt = bucket[telType];
                        if (cnt > 0) {
                            var retryProps: { [key: string]: any } = {};
                            retryProps[P_TEL_TYPE] = telType;
                            retryProps[P_RETRY_CODE] = code;
                            cfg.trk(_createMetric(MET_RETRY, cnt, retryProps));
                        }
                    }
                }
            }
        }

        // Reset accumulators
        _successCounts = objCreate(null);
        _droppedCounts = objCreate(null);
        _retryCounts = objCreate(null);
    }

    return {
        eventsSent: _incSuccess,
        eventsDiscarded: function (events: ITelemetryItem[], reason: number, sendType?: number) {
            var code = _mapDropCode(reason, sendType);
            _incDropped(events, code);
        },
        eventsRetry: function (events: ITelemetryItem[], statusCode: number) {
            var code = "" + statusCode; // numeric status code as string per spec
            _incRetry(events, code);
        },
        flush: _flush,
        unload: function () {
            // Flush remaining counts before unload
            _flush();
            if (_timer) {
                _timer.cancel();
                _timer = null;
            }
        }
    };
}
