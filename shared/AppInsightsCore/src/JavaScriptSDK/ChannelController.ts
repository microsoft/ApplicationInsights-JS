// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

import { IAppInsightsCore } from "../JavaScriptSDK.Interfaces/IAppInsightsCore"
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { IChannelControls } from "../JavaScriptSDK.Interfaces/IChannelControls";
import { IPlugin, ITelemetryPlugin } from "../JavaScriptSDK.Interfaces/ITelemetryPlugin";
import { ITelemetryItem } from "../JavaScriptSDK.Interfaces/ITelemetryItem";
import { IProcessTelemetryContext } from "../JavaScriptSDK.Interfaces/IProcessTelemetryContext";
import { CoreUtils } from "./CoreUtils";
import { _InternalLogMessage } from "./DiagnosticLogger";
import { BaseTelemetryPlugin } from './BaseTelemetryPlugin';
import { ProcessTelemetryContext } from './ProcessTelemetryContext';
import { initializePlugins } from './TelemetryHelpers';

const ChannelControllerPriority = 500;
const ChannelValidationMessage = "Channel has invalid priority";

let _arrForEach = CoreUtils.arrForEach;
let _objDefineAccessors = CoreUtils.objDefineAccessors;

function _checkQueuePriority(queue:IChannelControls[]) {
    _arrForEach(queue, queueItem => {
        if (queueItem.priority < ChannelControllerPriority) {
            throw Error(ChannelValidationMessage + queueItem.identifier);
        }
    });
}

function _addChannelQueue(channelQueues:IChannelControls[][], queue:IChannelControls[]) {
    if (queue && queue.length > 0) {
        queue = queue.sort((a, b) => { // sort based on priority within each queue
            return a.priority - b.priority;
        });

        _checkQueuePriority(queue);
        channelQueues.push(queue);
    }
}

function _createChannelQueues(channels:IChannelControls[][], extensions: IPlugin[]) {
    let channelQueues:IChannelControls[][] = [];

    if (channels) {
        // Add and sort the configuration channel queues
        _arrForEach(channels, queue => _addChannelQueue(channelQueues, queue));
    }

    if (extensions) {
        // Create a new channel queue for any extensions with a priority > the ChannelControllerPriority
        let extensionQueue:IChannelControls[] = [];
        _arrForEach(extensions as IChannelControls[], plugin => {
            if (plugin.priority > ChannelControllerPriority) {
                extensionQueue.push(plugin);
            }
        });
    
        _addChannelQueue(channelQueues, extensionQueue);
    }

    return channelQueues;
}

export class ChannelController extends BaseTelemetryPlugin {

    identifier: string = "ChannelControllerPlugin";

    setNextPlugin: (next: ITelemetryPlugin) => {}; // channel controller is last in pipeline

    priority: number = ChannelControllerPriority; // in reserved range 100 to 200

    private _channelQueue: IChannelControls[][];

    public processTelemetry(item: ITelemetryItem, itemCtx: IProcessTelemetryContext) {
        if (this._channelQueue) {
            _arrForEach(this._channelQueue, queues => {
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

    public getChannelControls(): IChannelControls[][] {
        return this._channelQueue;
    }

    public initialize(config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[]) {
        let _self = this;
        if (_self.isInitialized()) {
            // already initialized
            return;
        }

        super.initialize(config, core, extensions);

        if ((config as any).isCookieUseDisabled) {
            CoreUtils.disableCookies();
        }
        
        let channelQueue = _self._channelQueue = _createChannelQueues((config||{}).channels, extensions);

        // Initialize the Queues
        _arrForEach(channelQueue, queue => initializePlugins(new ProcessTelemetryContext(queue, config, core), extensions));
    }

    /**
     * Static constructor, attempt to create accessors
     */
    // tslint:disable-next-line
    private static _staticInit = (() => {
        // Dynamically create get/set property accessors
        _objDefineAccessors(ChannelController.prototype, "ChannelControls", ChannelController.prototype.getChannelControls);
        _objDefineAccessors(ChannelController.prototype, "channelQueue", ChannelController.prototype.getChannelControls);
    })();
}