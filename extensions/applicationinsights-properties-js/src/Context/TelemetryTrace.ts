// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ITelemetryTrace, ITraceState, dataSanitizeString  } from "@microsoft/applicationinsights-common";
import { generateW3CId, getLocation, IDiagnosticLogger } from "@microsoft/applicationinsights-core-js";

export class TelemetryTrace implements ITelemetryTrace {

    public traceID: string;
    public parentID: string;
    public traceState: ITraceState;
    public name: string;

    constructor(id?: string, parentId?: string, name?: string, logger?: IDiagnosticLogger) {
        const _self = this;
        _self.traceID = id || generateW3CId();
        _self.parentID = parentId;
        _self.name = name;
        let location = getLocation();
        if (!name && location && location.pathname) {
            _self.name = location.pathname;
        }

        _self.name = dataSanitizeString(logger, _self.name);
    }
}