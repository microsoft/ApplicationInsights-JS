// Copyright (c) Microsoft Corporation. All rights reserved.
// // Licensed under the MIT License.

import { SendRequestReason } from "../JavaScriptSDK.Enums/SendRequestReason";
import { IAppInsightsCore } from "../JavaScriptSDK.Interfaces/IAppInsightsCore";
import { IChannelControls } from "../JavaScriptSDK.Interfaces/IChannelControls";
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { IProcessTelemetryContext } from "../JavaScriptSDK.Interfaces/IProcessTelemetryContext";
import { ITelemetryItem } from "../JavaScriptSDK.Interfaces/ITelemetryItem";
import { IPlugin } from "../JavaScriptSDK.Interfaces/ITelemetryPlugin";
import { ITelemetryPluginChain } from "../JavaScriptSDK.Interfaces/ITelemetryPluginChain";
import { arrForEach, isArray, objFreeze, throwError } from "./HelperFuncs";
import { createProcessTelemetryContext, createTelemetryProxyChain } from "./ProcessTelemetryContext";
import { initializePlugins } from "./TelemetryHelpers";

export const ChannelControllerPriority = 500;
const ChannelValidationMessage = "Channel has invalid priority - ";

export interface IChannelController extends IChannelControls {
    flush(isAsync: boolean, callBack: (flushComplete?: boolean) => void, sendReason: SendRequestReason, cbTimeout?: number): void
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

    function _getTelCtx(itemCtx: IProcessTelemetryContext) {
        if (!itemCtx) {
            // For some reason the previous plugin didn't pass down the itemCtx (perhaps an old plugin)
            itemCtx = createProcessTelemetryContext(null, core.config, core, null)
        }

        return itemCtx;
    }

    function _processChannelQueue(itemCtx: IProcessTelemetryContext, processFn: (chainCtx: IProcessTelemetryContext) => void, onComplete?: () => void) {
        if (channelQueue && channelQueue.length > 0) {
            let waiting = channelQueue.length;
            arrForEach(channelQueue, (channels) => {
                // pass on to first item in queue
                if (channels && channels.queue.length > 0) {
                    let channelChain = channels.chain;
                    let chainCtx = _getTelCtx(itemCtx).createNew(channelChain);
                    chainCtx.onComplete(() => {
                        waiting --;

                        if (waiting === 0) {
                            onComplete && onComplete();
                            onComplete = null;
                        }
                    });

                    // Cause this chain to start processing
                    processFn(chainCtx);
                } else {
                    waiting --;
                }
            });

            if (waiting === 0) {
                onComplete && onComplete();
            }
        } else {
            onComplete && onComplete();
        }
    }

    let isInitialized = false;
    let channelController: IChannelController = {
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
        isInitialized: () => { return isInitialized },
        processTelemetry: (item: ITelemetryItem, itemCtx: IProcessTelemetryContext) => {
            _processChannelQueue(itemCtx, (chainCtx: IProcessTelemetryContext) => {
                chainCtx.processNext(item);
            }, () => {
                itemCtx.processNext(item);
            });
        },
        pause: () => {
            _processChannelQueue(null, (chainCtx: IProcessTelemetryContext) => {
                chainCtx.iterate<IChannelControls>((plugin) => {
                    plugin.pause && plugin.pause();
                });
            });
        },
        resume: () => {
            _processChannelQueue(null, (chainCtx: IProcessTelemetryContext) => {
                chainCtx.iterate<IChannelControls>((plugin) => {
                    plugin.resume && plugin.resume();
                });
            });
        },
        teardown: () => {
            _processChannelQueue(null, (chainCtx: IProcessTelemetryContext) => {
                chainCtx.iterate<IChannelControls>((plugin) => {
                    plugin.teardown && plugin.teardown();
                });
            });
        },
        flush: (isAsync: boolean, callBack: (flushComplete?: boolean) => void, sendReason: SendRequestReason, cbTimeout?: number) => {
            let doneIterating = false;
            let waiting = 0;
            let cbTimer: any = null;

            cbTimeout = cbTimeout || 5000;

            function doCallback() {
                if (doneIterating && waiting === 0) {
                    if (cbTimer) {
                        clearTimeout(cbTimer);
                        cbTimer = null;
                    }

                    callBack && callBack(doneIterating);
                    callBack = null;
                }
            }

            // Setting waiting to one so that we don't call the callBack until we finish iterating
            waiting  = 1;
            _processChannelQueue(null, (chainCtx: IProcessTelemetryContext) => {
                chainCtx.iterate<IChannelControls>((plugin) => {
                    if (plugin.flush) {
                        waiting ++;

                        // Not all channels will call this callback for every scenario
                        if (!plugin.flush(isAsync, () => {
                            waiting--;
                            doCallback();
                        }, sendReason)) {
                            // If any channel doesn't return true we should assume that the callback will never be called, so use a timeout
                            // to allow the channel some time to "finish" before triggering any followup function (such as unloading)
                            if (cbTimer == null) {
                                cbTimer = setTimeout(() => {
                                    cbTimer = null;
                                    callBack && callBack(false);
                                    // Make sure we don't call the callback more than once
                                    callBack = null;
                                }, cbTimeout);
                            }
                        }
                    }
                });
            }, () => {
                waiting--;
                doneIterating = true;
                doCallback();
            });
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