// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ITelemetryContext } from "@microsoft/applicationinsights-common";
import { IProcessTelemetryContext, ITelemetryItem } from "@microsoft/applicationinsights-core-js";
import { _SessionManager } from "../Context/Session";

export interface IPropTelemetryContext extends ITelemetryContext {
    readonly sessionManager: _SessionManager; // The session manager that manages session on the base of cookies.

    applySessionContext(evt: ITelemetryItem, itemCtx?: IProcessTelemetryContext): void;
    applyOperatingSystemContxt(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext): void;
    applyApplicationContext(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext): void;
    applyDeviceContext(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext): void;
    applyInternalContext(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext): void;
    applyLocationContext(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext): void;
    applyOperationContext(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext): void;
    applyWebContext(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext): void;
    applyUserContext(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext): void;
    cleanUp(event:ITelemetryItem, itemCtx?: IProcessTelemetryContext): void;
}