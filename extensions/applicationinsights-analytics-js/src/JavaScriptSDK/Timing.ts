// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { dateTimeUtilsDuration } from "@microsoft/applicationinsights-common";
import { IDiagnosticLogger, _eInternalMessageId, _throwInternal, eLoggingSeverity } from "@microsoft/applicationinsights-core-js";

/**
 * Internal interface for Timing.
 * @internal
 */
export interface ITiming {
    action: (name?: string, url?: string, duration?: number, properties?: { [key: string]: string }, measurements?: { [key: string]: number }) => void;
    start: (name: string) => void;
    stop: (name: string, url: string, properties?: { [key: string]: string }, measurements?: { [key: string]: number }) => void;
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
        start: (name: string) => {
            if (typeof _events[name] !== "undefined") {
                _throwInternal(logger,
                    eLoggingSeverity.WARNING, _eInternalMessageId.StartCalledMoreThanOnce, "start was called more than once for this event without calling stop.",
                    { name, key: name }, true);
            }
    
            _events[name] = +new Date;
        },
        stop: (name: string, url: string, properties?: { [key: string]: string }, measurements?: { [key: string]: number }) => {
            const start = _events[name];
            if (isNaN(start)) {
                _throwInternal(logger,
                    eLoggingSeverity.WARNING, _eInternalMessageId.StopCalledWithoutStart, "stop was called without a corresponding start.",
                    { name, key: name }, true);
            } else {
                const end = +new Date;
                const duration = dateTimeUtilsDuration(start, end);
                timing.action(name, url, duration, properties, measurements);
            }
    
            delete _events[name];
            _events[name] = undefined;
        }
    };

    return timing;
}
