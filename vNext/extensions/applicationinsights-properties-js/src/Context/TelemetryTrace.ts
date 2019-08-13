// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Util, ITelemetryTrace, ITraceState  } from '@microsoft/applicationinsights-common';

export class TelemetryTrace implements ITelemetryTrace {

    public traceID: string;
    public parentID: string;
    public traceState: ITraceState;
    public name: string;

    constructor(id?: string, parentId?: string, name?: string) {
        this.traceID = id || Util.generateW3CId();
        this.parentID = parentId;
        this.name = name;
        if (window && window.location && window.location.pathname) {
            this.name = window.location.pathname;
        }
    }
}