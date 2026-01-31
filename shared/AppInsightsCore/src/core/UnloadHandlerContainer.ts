// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { arrForEach, dumpObj } from "@nevware21/ts-utils";
import { _throwInternal } from "../diagnostics/DiagnosticLogger";
import { _eInternalMessageId, eLoggingSeverity } from "../enums/ai/LoggingEnums";
import { IProcessTelemetryUnloadContext } from "../interfaces/ai/IProcessTelemetryContext";
import { ITelemetryUnloadState } from "../interfaces/ai/ITelemetryUnloadState";

export type UnloadHandler = (itemCtx: IProcessTelemetryUnloadContext, unloadState: ITelemetryUnloadState) => void;

export interface IUnloadHandlerContainer {
    add: (handler: UnloadHandler) => void;
    run: (itemCtx: IProcessTelemetryUnloadContext, unloadState: ITelemetryUnloadState) => void
}

/*#__NO_SIDE_EFFECTS__*/
export function createUnloadHandlerContainer(): IUnloadHandlerContainer {
    let handlers: UnloadHandler[] = [];

    function _addHandler(handler: UnloadHandler) {
        if (handler) {
            handlers.push(handler);
        }
    }

    function _runHandlers(unloadCtx: IProcessTelemetryUnloadContext, unloadState: ITelemetryUnloadState) {
        arrForEach(handlers, (handler) => {
            try {
                handler(unloadCtx, unloadState);
            } catch (e) {
                _throwInternal(
                    unloadCtx.diagLog(),
                    eLoggingSeverity.WARNING,
                    _eInternalMessageId.PluginException,
                    "Unexpected error calling unload handler - " + dumpObj(e));
            }
        });
        handlers = [];
    }

    return {
        add: _addHandler,
        run: _runHandlers
    }
}
