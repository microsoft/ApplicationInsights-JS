// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { dateTimeUtilsDuration } from "@microsoft/applicationinsights-common";
import { IDiagnosticLogger, _eInternalMessageId, _throwInternal, eLoggingSeverity } from "@microsoft/applicationinsights-core-js";

/**
 * Used to record timed events and page views.
 */
export class Timing {

    public action: (name?: string, url?: string, duration?: number, properties?: { [key: string]: string }, measurements?: { [key: string]: number }) => void;
    public start: (name: string) => void;
    public stop: (name: string, url: string, properties?: { [key: string]: string }, measurements?: { [key: string]: number }) => void;

    constructor(logger: IDiagnosticLogger, name: string) {
        let _self = this;
        let _events: { [key: string]: number; } = {}

        _self.start = (name: string) => {
            if (typeof _events[name] !== "undefined") {
                _throwInternal(logger,
                    eLoggingSeverity.WARNING, _eInternalMessageId.StartCalledMoreThanOnce, "start was called more than once for this event without calling stop.",
                    { name, key: name }, true);
            }
    
            _events[name] = +new Date;
        }
    
        _self.stop = (name: string, url: string, properties?: { [key: string]: string }, measurements?: { [key: string]: number }) => {
            const start = _events[name];
            if (isNaN(start)) {
                _throwInternal(logger,
                    eLoggingSeverity.WARNING, _eInternalMessageId.StopCalledWithoutStart, "stop was called without a corresponding start.",
                    { name, key: name }, true);
            } else {
                const end = +new Date;
                const duration = dateTimeUtilsDuration(start, end);
                _self.action(name, url, duration, properties, measurements);
            }
    
            delete _events[name];
            _events[name] = undefined;
        }
    }
}
