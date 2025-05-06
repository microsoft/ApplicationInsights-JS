// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ITelemetryTrace, ITraceState, dataSanitizeString } from "@microsoft/applicationinsights-common";
import { IConfiguration, IDiagnosticLogger, fieldRedaction, generateW3CId, getLocation } from "@microsoft/applicationinsights-core-js";

export class TelemetryTrace implements ITelemetryTrace {

    public traceID: string;
    public parentID: string;
    public traceState: ITraceState;
    public traceFlags: number;
    public name: string;

    constructor(id?: string, parentId?: string, name?: string, logger?: IDiagnosticLogger, config?: IConfiguration) {
        const _self = this;
        _self.traceID = id || generateW3CId();
        _self.parentID = parentId;
        let location = getLocation();
        if (location && config?.redactionEnabled) {
            location.href = fieldRedaction(location);
        }
        if (!name && location && location.pathname) {
            name = location.pathname;
        }

        _self.name = dataSanitizeString(logger, name);
    }
}
