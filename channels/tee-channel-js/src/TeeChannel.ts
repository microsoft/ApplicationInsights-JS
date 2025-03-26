// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import dynamicProto from "@microsoft/dynamicproto-js";
import { IConfig } from "@microsoft/applicationinsights-common";
import {
    BaseTelemetryPlugin, IAppInsightsCore, IChannelControls, IChannelControlsHost, IConfigDefaults, IConfiguration, IPlugin,
    IProcessTelemetryContext, IProcessTelemetryUnloadContext, IProcessTelemetryUpdateContext, ITelemetryItem, ITelemetryPluginChain,
    ITelemetryUnloadState, ITelemetryUpdateState, SendRequestReason, cfgDfBoolean, createProcessTelemetryContext, initializePlugins,
    onConfigChange, proxyFunctions
} from "@microsoft/applicationinsights-core-js";
import { IPromise } from "@nevware21/ts-async";
import { arrForEach, isArray, objDeepFreeze, objFreeze, throwError } from "@nevware21/ts-utils";
import { ChannelControllerPriority, IChannelController, _IInternalChannels, createChannelControllerPlugin } from "./ChannelController";
import { ITeeChannelConfig } from "./Interfaces/ITeeChannelConfig";

const ChannelValidationMessage = "Channel has invalid priority - ";

const defaultTeeChannelConfig: IConfigDefaults<ITeeChannelConfig> = objDeepFreeze({
    teeChannels: null,
    ignoreCoreChannels: cfgDfBoolean()
});

function _addChannelQueue(channelQueue: _IInternalChannels[], queue: IChannelControls[], core: IAppInsightsCore, teeChannel?: IChannelControls) {
    if (queue && isArray(queue) && queue.length > 0) {
        queue = queue.sort((a, b) => { // sort based on priority within each queue
            return a.priority - b.priority;
        });

        let _queue: IChannelControls[] = [];
        arrForEach(queue, queueItem => {
            if (queueItem.priority < ChannelControllerPriority) {
                throwError(ChannelValidationMessage + queueItem.identifier);
            }
            if (queueItem !== teeChannel) {
                _queue.push(queueItem);
            }
        });

        channelQueue.push({
            queue: objFreeze(_queue)
        });
        
    }
}

function _createChannelQueues(config: ITeeChannelConfig, core: IAppInsightsCore, teeChannel?: TeeChannel) {
    let channelQueue: _IInternalChannels[] = [];

    if (config) {
        if (!config.ignoreCoreChannels && core.config.channels) {
            // Add and sort the configuration channel queues
            arrForEach(core.config.channels, (queue, idx) => {
                if (idx > 0) {
                    _addChannelQueue(channelQueue, queue, core, teeChannel);
                }
            });
        }

        if (config.teeChannels) {
            // Add and sort the configuration channel queues
            arrForEach(config.teeChannels, queue => _addChannelQueue(channelQueue, queue, core, teeChannel));
        }
    }

    return channelQueue;
}

export class TeeChannel extends BaseTelemetryPlugin implements IChannelControlsHost {
    public readonly identifier: string = "TeeChannelController";
    public readonly priority: number = 999;

    /**
     * Returns whether the plugin has been initialized
     */
    public isInitialized: () => boolean;

    constructor() {
        super();

        let _channelController: IChannelController;
        let _isInitialized: boolean;

        dynamicProto(TeeChannel, this, (_self, base) => {

            _initDefaults();

            _self.initialize = (config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: ITelemetryPluginChain) => {
                if (!_isInitialized) {
                    _isInitialized = true;
    
                    _initChannels(_self, core);
                }
            };

            _self.getTeeChannels = (): IChannelControls[][] => {
                let controls: IChannelControls[][] = [];
                let channelQueues = _channelController.getQueues()
                if (channelQueues) {
                    arrForEach(channelQueues, (channels) => {
                        controls.push(channels.queue);
                    });
                }

                return objFreeze(controls);
            };

            _self.isInitialized = () => {
                return _isInitialized
            };

            _self.teardown = (unloadCtx: IProcessTelemetryUnloadContext, unloadState: ITelemetryUnloadState) => {
                return _channelController.teardown(unloadCtx, unloadState, () => {
                    _isInitialized = false;
                });
            };

            proxyFunctions(_self, _channelController, [
                "processTelemetry",
                "update",
                "pause",
                "resume",
                "getChannel",
                "flush"
            ]);
        });

        function _initDefaults() {
            _channelController = createChannelControllerPlugin();
            _isInitialized = false;
        }

        function _initChannels(self: TeeChannel, core: IAppInsightsCore) {
            // This function will be re-called whenever any referenced configuration is changed
            self._addHook(onConfigChange(core.config, (details) => {
                let ctx = createProcessTelemetryContext(null, details.cfg, core);
                let theConfig = ctx.getExtCfg(self.identifier, defaultTeeChannelConfig);

                let channelQueue = _createChannelQueues(theConfig, core, self);

                arrForEach(channelQueue, (channels) => {
                    if (channels && channels.queue.length > 0) {
                        initializePlugins(ctx.createNew(channels.queue), details.cfg.extensions);
                    }
                });

                _channelController.init(channelQueue, core);
            }));
        }
    }

    public initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public getTeeChannels(): IChannelControls[][] {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    public processTelemetry(telemetryItem: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Tear down the plugin and remove any hooked value, the plugin should be removed so that it is no longer initialized and
     * therefore could be re-initialized after being torn down. The plugin should ensure that once this has been called any further
     * processTelemetry calls are ignored and it just calls the processNext() with the provided context.
     * @param unloadCtx - This is the context that should be used during unloading.
     * @param unloadState - The details / state of the unload process, it holds details like whether it should be unloaded synchronously or asynchronously and the reason for the unload.
     * @returns boolean - true if the plugin has or will call processNext(), this for backward compatibility as previously teardown was synchronous and returned nothing.
     */
    public teardown(unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState): void | boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * The the plugin should re-evaluate configuration and update any cached configuration settings.
     * @param updateCtx - This is the context that should be used during updating.
     * @param updateState - The details / state of the update process, it holds details like the current and previous configuration.
     * @returns boolean - true if the plugin has or will call updateCtx.processNext(), this allows the plugin to perform any asynchronous operations.
     */
    public update(updateCtx: IProcessTelemetryUpdateContext, updateState: ITelemetryUpdateState): void | boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
 
    /**
     * Pause the sending (transmission) of events, this will cause all events to be batched only until the maximum limits are
     * hit at which point new events are dropped. Will also cause events to NOT be sent during page unload, so if Session storage
     * is disabled events will be lost.
     * SessionStorage Limit is 2000 events, In-Memory (Array) Storage is 10,000 events (can be configured via the eventsLimitInMem).
     */
    public pause(): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Resume the sending (transmission) of events, this will restart the timer and any batched events will be sent using the normal
     * send interval.
     */
    public resume(): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

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
    public flush(isAsync: boolean, callBack: (flushComplete?: boolean) => void, sendReason: SendRequestReason, cbTimeout?: number): void | IPromise<boolean> {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Flush the batched events synchronously (if possible -- based on configuration).
     * Will not flush if the Send has been paused.
     */
    public onunloadFlush() {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Get and return the named channel instance (if present) from the queues
     * @param pluginIdentifier - The identifier name of the plugin
     */
    public getChannel<T extends IPlugin = IPlugin>(pluginIdentifier: string): T {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

}
