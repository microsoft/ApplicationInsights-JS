// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { arrForEach, dumpObj } from "@nevware21/ts-utils";
import { _eInternalMessageId, eLoggingSeverity } from "../JavaScriptSDK.Enums/LoggingEnums";
import { IProcessTelemetryUnloadContext } from "../JavaScriptSDK.Interfaces/IProcessTelemetryContext";
import { ITelemetryUnloadState } from "../JavaScriptSDK.Interfaces/ITelemetryUnloadState";
import { _throwInternal } from "./DiagnosticLogger";

export type UnloadHandler = (itemCtx: IProcessTelemetryUnloadContext, unloadState: ITelemetryUnloadState) => void;

export interface IUnloadHandlerContainer {
    add: (handler: UnloadHandler) => void;
    run: (itemCtx: IProcessTelemetryUnloadContext, unloadState: ITelemetryUnloadState) => void
}

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
