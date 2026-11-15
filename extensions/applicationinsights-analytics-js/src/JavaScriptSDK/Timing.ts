// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    IDiagnosticLogger, _eInternalMessageId, _throwInternal, dateTimeUtilsDuration, eLoggingSeverity
} from "@microsoft/applicationinsights-core-js";

/**
 * Internal interface for Timing.
 * @internal
 */
export interface ITiming {
    action: (name?: string, url?: string, duration?: number, properties?: { [key: string]: string }, measurements?: { [key: string]: number }, startTime?: number) => void;
    start: (name: string, timestamp?: number) => void;
    stop: (name: string, url: string, properties?: { [key: string]: string }, measurements?: { [key: string]: number }, timestamp?: number) => void;
}

/**
 * Factory function to create a Timing instance.
 * @param logger - Diagnostic logger
 * @param name - Name identifier for timing operations
 * @returns A new ITiming instance.
 * @internal
 */
export function createTiming(logger: IDiagnosticLogger, name: string): ITiming {
    let _events: { [key: string]: number; } = {}

    const timing: ITiming = {
        action: null, // Will be set by the caller
        start: (name: string, timestamp?: number) => {
            if (typeof _events[name] !== "undefined") {
                _throwInternal(logger,
                    eLoggingSeverity.WARNING, _eInternalMessageId.StartCalledMoreThanOnce, "start was called more than once for this event without calling stop.",
                    { name, key: name }, true);
            }
    
            _events[name] = typeof timestamp === "number" && !isNaN(timestamp) ? timestamp : +new Date;
        },
        stop: (name: string, url: string, properties?: { [key: string]: string }, measurements?: { [key: string]: number }, timestamp?: number) => {
            const start = _events[name];
            if (isNaN(start)) {
                _throwInternal(logger,
                    eLoggingSeverity.WARNING, _eInternalMessageId.StopCalledWithoutStart, "stop was called without a corresponding start.",
                    { name, key: name }, true);
            } else {
                const end = typeof timestamp === "number" && !isNaN(timestamp) ? timestamp : +new Date;
                const duration = start === 0 || end === 0 ? end - start : dateTimeUtilsDuration(start, end);
                timing.action(name, url, duration, properties, measurements, start);
            }
    
            delete _events[name];
            _events[name] = undefined;
        }
    };

    return timing;
}
