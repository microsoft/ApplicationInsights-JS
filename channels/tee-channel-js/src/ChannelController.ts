// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    IAppInsightsCore, IBaseProcessingContext, IChannelControls, IPlugin, IProcessTelemetryContext, IProcessTelemetryUnloadContext,
    IProcessTelemetryUpdateContext, ITelemetryItem, ITelemetryUnloadState, ITelemetryUpdateState, SendRequestReason, TelemetryUnloadReason,
    TelemetryUpdateReason, createProcessTelemetryContext
} from "@microsoft/applicationinsights-core-js";
import { IPromise, createPromise } from "@nevware21/ts-async";
import { ITimerHandler, arrForEach, scheduleTimeout } from "@nevware21/ts-utils";

export const ChannelControllerPriority = 500;

export interface IChannelController {

    init: (channelQueue: _IInternalChannels[], core: IAppInsightsCore) => void;

    getQueues: () => _IInternalChannels[];

    /**
     * Call back for telemetry processing before it it is sent
     * @param env - This is the current event being reported
     * @param itemCtx - This is the context for the current request, ITelemetryPlugin instances
     * can optionally use this to access the current core instance or define / pass additional information
     * to later plugins (vs appending items to the telemetry item)
     */
    processTelemetry: (env: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => void;

    /**
     * The the plugin should re-evaluate configuration and update any cached configuration settings or
     * plugins. If implemented this method will be called whenever a plugin is added or removed and if
     * the configuration has bee updated.
     * @param updateCtx - This is the context that should be used during updating.
     * @param updateState - The details / state of the update process, it holds details like the current and previous configuration.
     * @returns boolean - true if the plugin has or will call updateCtx.processNext(), this allows the plugin to perform any asynchronous operations.
     */
    update?: (updateCtx: IProcessTelemetryUpdateContext, updateState: ITelemetryUpdateState) => void | boolean;

    /**
     * Pause sending data
     */
    pause(): void;

    /**
     * Resume sending data
     */
    resume(): void;

    /**
     * Tear down the plugin and remove any hooked value, the plugin should be removed so that it is no longer initialized and
     * therefore could be re-initialized after being torn down. The plugin should ensure that once this has been called any further
     * processTelemetry calls are ignored and it just calls the processNext() with the provided context.
     * @param unloadCtx - This is the context that should be used during unloading.
     * @param unloadState - The details / state of the unload process, it holds details like whether it should be unloaded synchronously or asynchronously and the reason for the unload.
     * @returns boolean - true if the plugin has or will call processNext(), this for backward compatibility as previously teardown was synchronous and returned nothing.
     */
    teardown: (unloadCtx: IProcessTelemetryUnloadContext, unloadState: ITelemetryUnloadState, onComplete: () => void) => void | boolean;

    /**
     * Flush any batched events immediately; Will not flush if the paused and channel should default to sending data asynchronously.
     * If executing asynchronously and you DO NOT pass a callback function then a [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html)
     * will be returned which will resolve once the flush is complete. The actual implementation of the `IPromise`
     * will be a native Promise (if supported) or the default as supplied by [ts-async library](https://github.com/nevware21/ts-async)
     * @param async - send data asynchronously when true
     * @param callBack - if specified, notify caller when send is complete, the channel should return true to indicate to the caller that it will be called.
     * If the caller doesn't return true the caller should assume that it may never be called.
     * @param sendReason - specify the reason that you are calling "flush" defaults to ManualFlush (1) if not specified
     * @returns - If a callback is provided `true` to indicate that callback will be called after the flush is complete otherwise the caller
     * should assume that any provided callback will never be called, Nothing or if occurring asynchronously a
     * [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html) which will be resolved once the unload is complete,
     * the [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html) will only be returned when no callback is provided
     * and isAsync is true.
     */
    flush(isAsync: boolean, callBack: (flushComplete?: boolean) => void, sendReason: SendRequestReason, cbTimeout?: number): void;

    /**
     * Get and return the named channel instance (if present) from the queues
     * @param pluginIdentifier - The identifier name of the plugin
     */
    getChannel<T extends IPlugin = IPlugin>(pluginIdentifier: string): T;
}

export interface _IInternalChannels {
    queue: IChannelControls[];
}

function _getTelCtx(core: IAppInsightsCore) {
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
                let chainCtx = itemCtx.createNew(channels.queue) as T;
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

export function createChannelControllerPlugin(): IChannelController {

    let _channelQueue: _IInternalChannels[] = [];
    let _core: IAppInsightsCore = null;

    function _doUpdate(updateCtx: IProcessTelemetryUpdateContext, updateState: ITelemetryUpdateState) {
        let theUpdateState: ITelemetryUpdateState = updateState || {
            reason: TelemetryUpdateReason.Unknown
        };

        _processChannelQueue(_channelQueue, updateCtx, (chainCtx: IProcessTelemetryUpdateContext) => {
            chainCtx.processNext(theUpdateState);
        }, () => {
            updateCtx.processNext(theUpdateState);
        });

        return true;
    }

    function _getChannel<T extends IPlugin = IPlugin>(pluginIdentifier: string): T {
        let thePlugin: T = null;

        if (_channelQueue && _channelQueue.length > 0) {
            arrForEach(_channelQueue, (channels) => {
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

    let channelController: IChannelController = {
        init: (channelQueue: _IInternalChannels[], core: IAppInsightsCore) => {
            _channelQueue = channelQueue;
            _core = core;
        },
        getQueues: () => {
            return _channelQueue;
        },
        processTelemetry: (item: ITelemetryItem, itemCtx: IProcessTelemetryContext) => {
            _processChannelQueue(_channelQueue, itemCtx || _getTelCtx(_core), (chainCtx: IProcessTelemetryContext) => {
                chainCtx.processNext(item);
            }, () => {
                itemCtx.processNext(item);
            });
        },
        update: _doUpdate,
        pause: () => {
            _processChannelQueue(_channelQueue, _getTelCtx(_core), (chainCtx: IProcessTelemetryContext) => {
                chainCtx.iterate<IChannelControls>((plugin) => {
                    plugin.pause && plugin.pause();
                });
            }, null);
        },
        resume: () => {
            _processChannelQueue(_channelQueue, _getTelCtx(_core), (chainCtx: IProcessTelemetryContext) => {
                chainCtx.iterate<IChannelControls>((plugin) => {
                    plugin.resume && plugin.resume();
                });
            }, null);
        },
        teardown: (unloadCtx: IProcessTelemetryUnloadContext, unloadState: ITelemetryUnloadState, onComplete: () => void) => {
            let theUnloadState: ITelemetryUnloadState = unloadState || {
                reason: TelemetryUnloadReason.ManualTeardown,
                isAsync: false
            };
    
            _processChannelQueue(_channelQueue, unloadCtx, (chainCtx: IProcessTelemetryUnloadContext) => {
                chainCtx.processNext(theUnloadState);
            }, () => {
                unloadCtx.processNext(theUnloadState);
                onComplete && onComplete();
            });
    
            return true;
        },
        getChannel: _getChannel,
        flush: (isAsync: boolean, callBack: (flushComplete?: boolean) => void, sendReason: SendRequestReason, cbTimeout?: number) => {
            // Setting waiting to one so that we don't call the callBack until we finish iterating
            let waiting = 1;
            let doneIterating = false;
            let cbTimer: ITimerHandler = null;
            let result: boolean | IPromise<boolean> = true;

            cbTimeout = cbTimeout || 5000;

            if (isAsync && !callBack) {
                result = createPromise((resolve) => {
                    callBack = resolve;
                });
            }

            function doCallback() {
                waiting--;
                if (doneIterating && waiting === 0) {
                    cbTimer && cbTimer.cancel();
                    cbTimer = null;

                    callBack && callBack(doneIterating);
                    callBack = null;
                }
            }

            _processChannelQueue(_channelQueue, _getTelCtx(_core), (chainCtx: IProcessTelemetryContext) => {
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
                                    cbTimer = scheduleTimeout(() => {
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

            return result;
        }
    };

    return channelController;
}
