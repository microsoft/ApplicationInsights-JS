// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Util, ITelemetryTrace, ITraceState  } from '@microsoft/applicationinsights-common';
import { getWindow } from '@microsoft/applicationinsights-core-js';

export class TelemetryTrace implements ITelemetryTrace {

    public traceID: string;
    public parentID: string;
    public traceState: ITraceState;
    public name: string;

    constructor(id?: string, parentId?: string, name?: string) {
        this.traceID = id || Util.generateW3CId();
        this.parentID = parentId;
        this.name = name;
        let _window = getWindow();
        if (!name && _window && _window.location && _window.location.pathname) {
            this.name = _window.location.pathname;
        }
    }
}