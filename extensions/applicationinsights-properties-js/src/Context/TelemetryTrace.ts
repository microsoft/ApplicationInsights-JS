// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Util, ITelemetryTrace, ITraceState, DataSanitizer  } from '@microsoft/applicationinsights-common';
import { getLocation, IDiagnosticLogger } from '@microsoft/applicationinsights-core-js';

export class TelemetryTrace implements ITelemetryTrace {

    public traceID: string;
    public parentID: string;
    public traceState: ITraceState;
    public name: string;

    constructor(id?: string, parentId?: string, name?: string, logger?: IDiagnosticLogger) {
        this.traceID = id || Util.generateW3CId();
        this.parentID = parentId;
        this.name = name;
        let location = getLocation();
        if (!name && location && location.pathname) {
            this.name = location.pathname;
        }
        this.name = DataSanitizer.sanitizeString(logger, this.name);
    }
}