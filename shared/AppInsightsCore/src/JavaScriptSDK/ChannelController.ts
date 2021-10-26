// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

import dynamicProto from "@microsoft/dynamicproto-js";
import { IAppInsightsCore } from "../JavaScriptSDK.Interfaces/IAppInsightsCore"
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { IChannelControls } from "../JavaScriptSDK.Interfaces/IChannelControls";
import { IPlugin, ITelemetryPlugin  } from "../JavaScriptSDK.Interfaces/ITelemetryPlugin";
import { ITelemetryPluginChain } from "../JavaScriptSDK.Interfaces/ITelemetryPluginChain";
import { ITelemetryItem } from "../JavaScriptSDK.Interfaces/ITelemetryItem";
import { IProcessTelemetryContext } from "../JavaScriptSDK.Interfaces/IProcessTelemetryContext";
import { _InternalLogMessage } from "./DiagnosticLogger";
import { BaseTelemetryPlugin } from "./BaseTelemetryPlugin";
import { ProcessTelemetryContext } from "./ProcessTelemetryContext";
import { initializePlugins } from "./TelemetryHelpers";
import { arrForEach, objDefineAccessors, throwError } from "./HelperFuncs";

const ChannelControllerPriority = 500;
const ChannelValidationMessage = "Channel has invalid priority";

export class ChannelController extends BaseTelemetryPlugin {

    identifier: string = "ChannelControllerPlugin";
    priority: number = ChannelControllerPriority; // in reserved range 100 to 200

    public setNextPlugin: (next: ITelemetryPlugin | ITelemetryPluginChain) => void;

    constructor() {
        super();
        let _channelQueue: IChannelControls[][];

        dynamicProto(ChannelController, this, (_self, _base) => {
            _self.setNextPlugin = (next: ITelemetryPlugin | ITelemetryPluginChain) => {
                // The Channel controller is last in pipeline
            };

            _self.processTelemetry = (item: ITelemetryItem, itemCtx: IProcessTelemetryContext) => {
                if (_channelQueue) {
                    arrForEach(_channelQueue, queues => {
                        // pass on to first item in queue
                        if (queues.length > 0) {
                            // Copying the item context as we could have mutiple chains that are executing asynchronously
                            // and calling _getDefTelCtx as it's possible that the caller doesn't pass any context
                            let chainCtx = this._getTelCtx(itemCtx).createNew(queues);
                            chainCtx.processNext(item);
                        }
                    });
                }
            };

            _self.getChannelControls = (): IChannelControls[][] => {
                return _channelQueue;
            };
                
            _self.initialize = (config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[]) => {
                if (_self.isInitialized()) {
                    // already initialized
                    return;
                }

                _base.initialize(config, core, extensions);

                _createChannelQueues((config||{}).channels, extensions);
        
                // Initialize the Queues
                arrForEach(_channelQueue, queue => initializePlugins(new ProcessTelemetryContext(queue, config, core), extensions));
            }
        });

        function _checkQueuePriority(queue:IChannelControls[]) {
            arrForEach(queue, queueItem => {
                if (queueItem.priority < ChannelControllerPriority) {
                    throwError(ChannelValidationMessage + queueItem.identifier);
                }
            });
        }
        
        function _addChannelQueue(queue:IChannelControls[]) {
            if (queue && queue.length > 0) {
                queue = queue.sort((a, b) => { // sort based on priority within each queue
                    return a.priority - b.priority;
                });
        
                _checkQueuePriority(queue);
                _channelQueue.push(queue);
            }
        }
        
        function _createChannelQueues(channels:IChannelControls[][], extensions: IPlugin[]) {
            _channelQueue = [];
        
            if (channels) {
                // Add and sort the configuration channel queues
                arrForEach(channels, queue => _addChannelQueue(queue));
            }
        
            if (extensions) {
                // Create a new channel queue for any extensions with a priority > the ChannelControllerPriority
                let extensionQueue:IChannelControls[] = [];
                arrForEach(extensions as IChannelControls[], plugin => {
                    if (plugin.priority > ChannelControllerPriority) {
                        extensionQueue.push(plugin);
                    }
                });
            
                _addChannelQueue(extensionQueue);
            }
        }
    }

    public processTelemetry(item: ITelemetryItem, itemCtx: IProcessTelemetryContext) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public getChannelControls(): IChannelControls[][] {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    public initialize(config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[]) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Static constructor, attempt to create accessors
     */
    // tslint:disable-next-line
    private static _staticInit = (() => {
        let proto = ChannelController.prototype;
        // Dynamically create get/set property accessors
        objDefineAccessors(proto, "ChannelControls", proto.getChannelControls);
        objDefineAccessors(proto, "channelQueue", proto.getChannelControls);
    })();
}