// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { IAppInsightsCore } from "../JavaScriptSDK.Interfaces/IAppInsightsCore"
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { ITelemetryPlugin, IPlugin } from "../JavaScriptSDK.Interfaces/ITelemetryPlugin";
import { IChannelControls } from "../JavaScriptSDK.Interfaces/IChannelControls";
import { ITelemetryItem } from "../JavaScriptSDK.Interfaces/ITelemetryItem";
import { CoreUtils } from "./CoreUtils";
import { _InternalLogMessage } from "./DiagnosticLogger";

"use strict";

const ChannelControllerPriority = 500;
const ChannelValidationMessage = "Channel has invalid priority";

export class ChannelController implements ITelemetryPlugin {

    private channelQueue: Array<IChannelControls[]>;

    public processTelemetry(item: ITelemetryItem) {
        this.channelQueue.forEach(queues => {
            // pass on to first item in queue
            if (queues.length > 0) {
                queues[0].processTelemetry(item);
            }
        });
    }

    public get ChannelControls(): Array<IChannelControls[]> {
        return this.channelQueue;
    }

    identifier: string = "ChannelControllerPlugin";

    setNextPlugin: (next: ITelemetryPlugin) => {}; // channel controller is last in pipeline

    priority: number = ChannelControllerPriority; // in reserved range 100 to 200

    initialize(config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[]) {
        if ((<any>config).isCookieUseDisabled) {
            CoreUtils.disableCookies();
        }

        this.channelQueue = new Array<IChannelControls[]>();
        if (config.channels) {
            let invalidChannelIdentifier = undefined;
            config.channels.forEach(queue => {

                if (queue && queue.length > 0) {
                    queue = queue.sort((a, b) => { // sort based on priority within each queue
                        return a.priority - b.priority;
                    });

                    // Initialize each plugin
                    queue.forEach(queueItem => {
                        if (queueItem.priority < ChannelControllerPriority) {
                            invalidChannelIdentifier = queueItem.identifier;
                        }
                        queueItem.initialize(config, core, extensions)
                    });

                    if (invalidChannelIdentifier) {
                        throw Error(ChannelValidationMessage + invalidChannelIdentifier);
                    }

                    for (let i = 1; i < queue.length; i++) {
                        queue[i - 1].setNextPlugin(queue[i]); // setup processing chain
                    }

                    this.channelQueue.push(queue);
                }
            });
        }

        let arr = new Array<IChannelControls>();

        for (let i = 0; i < extensions.length; i++) {
            let plugin = <IChannelControls>extensions[i];
            if (plugin.priority > ChannelControllerPriority) {
                arr.push(plugin);
            }
        }

        if (arr.length > 0) {
            // sort if not sorted
            arr = arr.sort((a, b) => {
                return a.priority - b.priority;
            });

            // Initialize each plugin
            arr.forEach(queueItem => queueItem.initialize(config, core, extensions));

            // setup next plugin
            for (let i = 1; i < arr.length; i++) {
                arr[i - 1].setNextPlugin(arr[i]);
            }

            this.channelQueue.push(arr);
        }
    }
}

