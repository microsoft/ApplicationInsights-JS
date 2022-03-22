// Copyright (c) Microsoft Corporation. All rights reserved.
// // Licensed under the MIT License.

import { SendRequestReason } from "../JavaScriptSDK.Enums/SendRequestReason";
import { TelemetryUnloadReason } from "../JavaScriptSDK.Enums/TelemetryUnloadReason";
import { TelemetryUpdateReason } from "../JavaScriptSDK.Enums/TelemetryUpdateReason";
import { IAppInsightsCore } from "../JavaScriptSDK.Interfaces/IAppInsightsCore";
import { IChannelControls } from "../JavaScriptSDK.Interfaces/IChannelControls";
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { IBaseProcessingContext, IProcessTelemetryContext, IProcessTelemetryUnloadContext, IProcessTelemetryUpdateContext } from "../JavaScriptSDK.Interfaces/IProcessTelemetryContext";
import { ITelemetryItem } from "../JavaScriptSDK.Interfaces/ITelemetryItem";
import { IPlugin } from "../JavaScriptSDK.Interfaces/ITelemetryPlugin";
import { ITelemetryPluginChain } from "../JavaScriptSDK.Interfaces/ITelemetryPluginChain";
import { ITelemetryUnloadState } from "../JavaScriptSDK.Interfaces/ITelemetryUnloadState";
import { ITelemetryUpdateState } from "../JavaScriptSDK.Interfaces/ITelemetryUpdateState";
import { arrForEach, isArray, objFreeze, throwError } from "./HelperFuncs";
import { strPause, strProcessNext, strResume, strTeardown } from "./InternalConstants";
import { createProcessTelemetryContext, createTelemetryProxyChain } from "./ProcessTelemetryContext";
import { initializePlugins } from "./TelemetryHelpers";

export const ChannelControllerPriority = 500;
const ChannelValidationMessage = "Channel has invalid priority - ";

export interface IChannelController extends IChannelControls {
    flush(isAsync: boolean, callBack: (flushComplete?: boolean) => void, sendReason: SendRequestReason, cbTimeout?: number): void;

    getChannel<T extends IPlugin = IPlugin>(pluginIdentifier: string): T;
}

export interface IInternalChannelController extends IChannelController {
    _setQueue: (channels: _IInternalChannels[]) => void;
}

export interface _IInternalChannels {
    queue: IChannelControls[];
    chain: ITelemetryPluginChain;
}

function _addChannelQueue(channelQueue: _IInternalChannels[], queue: IChannelControls[], config: IConfiguration, core: IAppInsightsCore) {
    if (queue && isArray(queue) && queue.length > 0) {
        queue = queue.sort((a, b) => { // sort based on priority within each queue
            return a.priority - b.priority;
        });

        arrForEach(queue, queueItem => {
            if (queueItem.priority < ChannelControllerPriority) {
                throwError(ChannelValidationMessage + queueItem.identifier);
            }
        });

        channelQueue.push({
            queue: objFreeze(queue),
            chain: createTelemetryProxyChain(queue, config, core)
        });
    }
}

export function createChannelControllerPlugin(channelQueue: _IInternalChannels[], core: IAppInsightsCore): IChannelController {

    function _getTelCtx() {
        return createProcessTelemetryContext(null, core.config, core, null)
    }

    function _processChannelQueue<T extends IBaseProcessingContext>(theChannels: _IInternalChannels[], itemCtx: T, processFn: (chainCtx: T) => void, onComplete: (() => void) | null) {
        let waiting = theChannels ? (theChannels.length + 1) : 1;

        function _runChainOnComplete() {
            waiting --;

            if (waiting === 0) {
                onComplete && onComplete();
                onComplete = null;
            }
        }

        if (waiting > 0) {
            arrForEach(theChannels, (channels) => {
                // pass on to first item in queue
                if (channels && channels.queue.length > 0) {
                    let channelChain = channels.chain;
                    let chainCtx = itemCtx.createNew(channelChain) as T;
                    chainCtx.onComplete(_runChainOnComplete);

                    // Cause this chain to start processing
                    processFn(chainCtx);
                } else {
                    waiting --;
                }
            });
        }

        _runChainOnComplete();
    }

    function _doUpdate(updateCtx: IProcessTelemetryUpdateContext, updateState: ITelemetryUpdateState) {
        let theUpdateState: ITelemetryUpdateState = updateState || {
            reason: TelemetryUpdateReason.Unknown
        };

        _processChannelQueue(channelQueue, updateCtx, (chainCtx: IProcessTelemetryUpdateContext) => {
            chainCtx[strProcessNext](theUpdateState);
        }, () => {
            updateCtx[strProcessNext](theUpdateState);
        });

        return true;
    }

    function _doTeardown(unloadCtx: IProcessTelemetryUnloadContext, unloadState: ITelemetryUnloadState) {
        let theUnloadState: ITelemetryUnloadState = unloadState || {
            reason: TelemetryUnloadReason.ManualTeardown,
            isAsync: false
        };

        _processChannelQueue(channelQueue, unloadCtx, (chainCtx: IProcessTelemetryUnloadContext) => {
            chainCtx[strProcessNext](theUnloadState);
        }, () => {
            unloadCtx[strProcessNext](theUnloadState);
            isInitialized = false;
        });

        return true;
    }

    function _getChannel<T extends IPlugin = IPlugin>(pluginIdentifier: string): T {
        let thePlugin: T = null;

        if (channelQueue && channelQueue.length > 0) {
            arrForEach(channelQueue, (channels) => {
                // pass on to first item in queue
                if (channels && channels.queue.length > 0) {
                    arrForEach(channels.queue, (ext: any) => {
                        if (ext.identifier === pluginIdentifier) {
                            thePlugin = ext;
                            // Cause arrForEach to stop iterating
                            return -1;
                        }
                    });

                    if (thePlugin) {
                        // Cause arrForEach to stop iterating
                        return -1;
                    }
                }
            });
        }

        return thePlugin;
    }

    let isInitialized = false;
    let channelController: IInternalChannelController = {
        identifier: "ChannelControllerPlugin",
        priority: ChannelControllerPriority,
        initialize: (config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: ITelemetryPluginChain) => {
            isInitialized = true;
            arrForEach(channelQueue, (channels) => {
                if (channels && channels.queue.length > 0) {
                    initializePlugins(createProcessTelemetryContext(channels.chain, config, core), extensions);
                }
            });
        },
        isInitialized: () => {
            return isInitialized
        },
        processTelemetry: (item: ITelemetryItem, itemCtx: IProcessTelemetryContext) => {
            _processChannelQueue(channelQueue, itemCtx || _getTelCtx(), (chainCtx: IProcessTelemetryContext) => {
                chainCtx[strProcessNext](item);
            }, () => {
                itemCtx[strProcessNext](item);
            });
        },
        update: _doUpdate,
        [strPause]: () => {
            _processChannelQueue(channelQueue, _getTelCtx(), (chainCtx: IProcessTelemetryContext) => {
                chainCtx.iterate<IChannelControls>((plugin) => {
                    plugin[strPause] && plugin[strPause]();
                });
            }, null);
        },
        [strResume]: () => {
            _processChannelQueue(channelQueue, _getTelCtx(), (chainCtx: IProcessTelemetryContext) => {
                chainCtx.iterate<IChannelControls>((plugin) => {
                    plugin[strResume] && plugin[strResume]();
                });
            }, null);
        },
        [strTeardown]: _doTeardown,
        getChannel: _getChannel,
        flush: (isAsync: boolean, callBack: (flushComplete?: boolean) => void, sendReason: SendRequestReason, cbTimeout?: number) => {
            // Setting waiting to one so that we don't call the callBack until we finish iterating
            let waiting = 1;
            let doneIterating = false;
            let cbTimer: any = null;

            cbTimeout = cbTimeout || 5000;

            function doCallback() {
                waiting--;
                if (doneIterating && waiting === 0) {
                    if (cbTimer) {
                        clearTimeout(cbTimer);
                        cbTimer = null;
                    }

                    callBack && callBack(doneIterating);
                    callBack = null;
                }
            }

            _processChannelQueue(channelQueue, _getTelCtx(), (chainCtx: IProcessTelemetryContext) => {
                chainCtx.iterate<IChannelControls>((plugin) => {
                    if (plugin.flush) {
                        waiting ++;

                        let handled = false;
                        // Not all channels will call this callback for every scenario
                        if (!plugin.flush(isAsync, () => {
                            handled = true;
                            doCallback();
                        }, sendReason)) {
                            if (!handled) {
                                // If any channel doesn't return true and it didn't call the callback, then we should assume that the callback
                                // will never be called, so use a timeout to allow the channel(s) some time to "finish" before triggering any
                                // followup function (such as unloading)
                                if (isAsync && cbTimer == null) {
                                    cbTimer = setTimeout(() => {
                                        cbTimer = null;
                                        doCallback();
                                    }, cbTimeout);
                                } else {
                                    doCallback();
                                }
                            }
                        }
                    }
                });
            }, () => {
                doneIterating = true;
                doCallback();
            });

            return true;
        },
        _setQueue: (queue: _IInternalChannels[]) => {
            channelQueue = queue;
        }
    };

    return channelController;
}

export function createChannelQueues(channels: IChannelControls[][], extensions: IPlugin[], config: IConfiguration, core: IAppInsightsCore) {
    let channelQueue: _IInternalChannels[] = [];

    if (channels) {
        // Add and sort the configuration channel queues
        arrForEach(channels, queue => _addChannelQueue(channelQueue, queue, config, core));
    }

    if (extensions) {
        // Create a new channel queue for any extensions with a priority > the ChannelControllerPriority
        let extensionQueue: IChannelControls[] = [];
        arrForEach(extensions as IChannelControls[], plugin => {
            if (plugin.priority > ChannelControllerPriority) {
                extensionQueue.push(plugin);
            }
        });
    
        _addChannelQueue(channelQueue, extensionQueue, config, core);
    }

    return channelQueue;
}