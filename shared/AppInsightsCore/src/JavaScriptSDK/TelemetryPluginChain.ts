// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

import { ITelemetryItem } from '../JavaScriptSDK.Interfaces/ITelemetryItem';
import { IProcessTelemetryContext } from "../JavaScriptSDK.Interfaces/IProcessTelemetryContext";
import { ITelemetryPluginChain } from "../JavaScriptSDK.Interfaces/ITelemetryPluginChain";
import { IPlugin, ITelemetryPlugin } from '../JavaScriptSDK.Interfaces/ITelemetryPlugin';
import { CoreUtils } from "./CoreUtils";
import { _InternalLogMessage } from "./DiagnosticLogger";
import { LoggingSeverity, _InternalMessageId } from '../JavaScriptSDK.Enums/LoggingEnums';

let _isFunction = CoreUtils.isFunction;

export class TelemetryPluginChain implements ITelemetryPluginChain {

    /**
     * Returns the underlying plugin that is being proxied for the processTelemetry call
     */
    getPlugin: () => ITelemetryPlugin;

    /**
     * Returns the next plugin
     */
    getNext: () => ITelemetryPluginChain;

    /**
     * Sets the next proxy to be executed as the next plugin
     * (Should only be used during initialization, which is why it's not defined on the interface)
     */
    setNext: (nextPlugin:ITelemetryPluginChain) => void;

    /**
     * Call back for telemetry processing before it it is sent
     * @param env - This is the current event being reported
     * @param itemCtx - This is the context for the current request, ITelemetryPlugin instances 
     * can optionally use this to access the current core instance or define / pass additional information
     * to later plugins (vs appending items to the telemetry item)
     */
    processTelemetry: (env: ITelemetryItem, itemCtx: IProcessTelemetryContext) => void;

    /**
     * Internal flag used to try and identify root cause failures
     */
    private _hasRun: boolean;

    constructor(plugin:ITelemetryPlugin, defItemCtx:IProcessTelemetryContext) {
        let _self = this;
        let _nextProxy:ITelemetryPluginChain = null;
        let _hasProcessTelemetry = _isFunction(plugin.processTelemetry);
        let _hasSetNext = _isFunction(plugin.setNextPlugin);

        _self._hasRun = false;

        _self.getPlugin = () => {
            return plugin;
        };

        _self.getNext = () => {
            return _nextProxy;
        };

        _self.setNext = (nextPlugin:ITelemetryPluginChain) => {
            _nextProxy = nextPlugin;
        }

        _self.processTelemetry = (env: ITelemetryItem, itemCtx:IProcessTelemetryContext) => {
            if (!itemCtx) {
                // Looks like a plugin didn't pass the (optional) context, so restore to the default
                itemCtx = defItemCtx;
            }

            if (plugin && _hasProcessTelemetry) {
                _self._hasRun = true;
                try {

                    // Ensure that we keep the context in sync (for processNext()), just in case a plugin
                    // doesn't calls processTelemetry() instead of itemContext.processNext() or some 
                    // other form of error occurred
                    itemCtx.setNext(_nextProxy);
                    if (_hasSetNext) {
                        // Backward compatibility setting the next plugin on the instance
                        plugin.setNextPlugin(_nextProxy);
                    }

                    // Set a flag on the next plugin so we know if it was attempted to be executed
                    _nextProxy && ((_nextProxy as TelemetryPluginChain)._hasRun = false);

                    plugin.processTelemetry(env, itemCtx);
                } catch (error) {
                    let hasRun = _nextProxy && (_nextProxy as TelemetryPluginChain)._hasRun;
                    if (!_nextProxy || !hasRun) {
                        // Either we have no next plugin or the current one did not attempt to call the next plugin
                        // Which means the current one is the root of the failure so log/report this failure
                        itemCtx.diagLog().throwInternal(
                            LoggingSeverity.CRITICAL,
                            _InternalMessageId.PluginException,
                            "Plugin [" + plugin.identifier + "] failed during processTelemetry - " + error);
                    }

                    if (_nextProxy && !hasRun) {
                        // As part of the failure the current plugin did not attempt to call the next plugin in the cahin
                        // So rather than leave the pipeline dead in the water we call the next plugin
                        _nextProxy.processTelemetry(env, itemCtx);
                    }
                }
            } else if (_nextProxy) {
                _self._hasRun = true;

                // The underlying plugin is either not defined or does not have a processTelemetry implementation
                // so we still want the next plugin to be executed.
                _nextProxy.processTelemetry(env, itemCtx);
            }
        };
    }
}
