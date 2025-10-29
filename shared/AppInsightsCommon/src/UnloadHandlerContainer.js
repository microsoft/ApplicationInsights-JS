// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { arrForEach, dumpObj } from "@nevware21/ts-utils";
export function createUnloadHandlerContainer() {
    var handlers = [];
    function _addHandler(handler) {
        if (handler) {
            handlers.push(handler);
        }
    }
    function _runHandlers(unloadCtx, unloadState) {
        arrForEach(handlers, function (handler) {
            try {
                handler(unloadCtx, unloadState);
            }
            catch (e) {
                unloadCtx.diagLog().throwInternal(2 /* eLoggingSeverity.WARNING */, 73 /* _eInternalMessageId.PluginException */, "Unexpected error calling unload handler - " + dumpObj(e));
            }
        });
        handlers = [];
    }
    return {
        add: _addHandler,
        run: _runHandlers
    };
}
//# sourceMappingURL=UnloadHandlerContainer.js.map