// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { arrAppend, arrForEach, dumpObj } from "@nevware21/ts-utils";
import { _eInternalMessageId, eLoggingSeverity } from "../JavaScriptSDK.Enums/LoggingEnums";
import { IDiagnosticLogger } from "../JavaScriptSDK.Interfaces/IDiagnosticLogger";
import { ILegacyUnloadHook, IUnloadHook } from "../JavaScriptSDK.Interfaces/IUnloadHook";
import { _throwInternal } from "./DiagnosticLogger";

let _maxHooks: number | undefined;
let _hookAddMonitor: (state: string, hooks: Array<ILegacyUnloadHook | IUnloadHook>) => void | undefined;

/**
 * Interface which identifiesAdd this hook so that it is automatically removed during unloading
 * @param hooks - The single hook or an array of IInstrumentHook objects
 */
export interface IUnloadHookContainer {
    add: (hooks: IUnloadHook | IUnloadHook[] | Iterator<IUnloadHook> | ILegacyUnloadHook | ILegacyUnloadHook[] | Iterator<ILegacyUnloadHook>) => void;
    run: (logger?: IDiagnosticLogger) => void;
}

/**
 * Test hook for setting the maximum number of unload hooks and calling a monitor function when the hooks are added or removed
 * This allows for automatic test failure when the maximum number of unload hooks is exceeded
 * @param maxHooks - The maximum number of unload hooks
 * @param addMonitor - The monitor function to call when hooks are added or removed
 */
export function _testHookMaxUnloadHooksCb(maxHooks?: number, addMonitor?: (state: string, hooks: Array<ILegacyUnloadHook | IUnloadHook>) => void) {
    _maxHooks = maxHooks;
    _hookAddMonitor = addMonitor;
}

/**
 * Create a IUnloadHookContainer which can be used to remember unload hook functions to be executed during the component unloading
 * process.
 * @returns A new IUnloadHookContainer instance
 */
export function createUnloadHookContainer(): IUnloadHookContainer {
    let _hooks: Array<ILegacyUnloadHook | IUnloadHook> = [];

    function _doUnload(logger: IDiagnosticLogger) {
        let oldHooks = _hooks;
        _hooks = [];

        // Remove all registered unload hooks
        arrForEach(oldHooks, (fn) => {
            // allow either rm or remove callback function
            try{
                ((fn as IUnloadHook).rm || (fn as ILegacyUnloadHook).remove).call(fn);
            } catch (e) {
                _throwInternal(logger, eLoggingSeverity.WARNING, _eInternalMessageId.PluginException, "Unloading:" + dumpObj(e));
            }
        });

        if (_maxHooks && oldHooks.length > _maxHooks) {
            _hookAddMonitor ? _hookAddMonitor("doUnload", oldHooks) : _throwInternal(null, eLoggingSeverity.CRITICAL, _eInternalMessageId.MaxUnloadHookExceeded, "Max unload hooks exceeded. An excessive number of unload hooks has been detected.");
        }
    }

    function _addHook(hooks: IUnloadHook | IUnloadHook[] | Iterator<IUnloadHook> | ILegacyUnloadHook | ILegacyUnloadHook[] | Iterator<ILegacyUnloadHook>) {
        if (hooks) {
            arrAppend(_hooks, hooks);
            if (_maxHooks && _hooks.length > _maxHooks) {
                _hookAddMonitor ? _hookAddMonitor("Add", _hooks) : _throwInternal(null, eLoggingSeverity.CRITICAL, _eInternalMessageId.MaxUnloadHookExceeded, "Max unload hooks exceeded. An excessive number of unload hooks has been detected.");
            }
        }
    }

    return {
        run: _doUnload,
        add: _addHook
    };
}
