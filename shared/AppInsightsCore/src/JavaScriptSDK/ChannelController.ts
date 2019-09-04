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

    identifier: string = "ChannelControllerPlugin";

    setNextPlugin: (next: ITelemetryPlugin) => {}; // channel controller is last in pipeline

    priority: number = ChannelControllerPriority; // in reserved range 100 to 200

    private channelQueue: IChannelControls[][];

    public processTelemetry(item: ITelemetryItem) {
        this.channelQueue.forEach(queues => {
            // pass on to first item in queue
            if (queues.length > 0) {
                queues[0].processTelemetry(item);
            }
        });
    }

    public get ChannelControls(): IChannelControls[][] {
        return this.channelQueue;
    }

    initialize(config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[]) {
        if ((config as any).isCookieUseDisabled) {
            CoreUtils.disableCookies();
        }

        this.channelQueue = new Array<IChannelControls[]>();
        if (config.channels) {
            let invalidChannelIdentifier;
            config.channels.forEach(queue => {

                if (queue && queue.length > 0) {
                    queue = queue.sort((a, b) => { // sort based on priority within each queue
                        return a.priority - b.priority;
                    });

                    for (let i = 1; i < queue.length; i++) {
                        queue[i - 1].setNextPlugin(queue[i]); // setup processing chain
                    }

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

                    this.channelQueue.push(queue);
                }
            });
        }

        let arr = new Array<IChannelControls>();

        for (let i = 0; i < extensions.length; i++) {
            const plugin = extensions[i] as IChannelControls;
            if (plugin.priority > ChannelControllerPriority) {
                arr.push(plugin);
            }
        }

        if (arr.length > 0) {
            // sort if not sorted
            arr = arr.sort((a, b) => {
                return a.priority - b.priority;
            });
            // setup next plugin
            for (let i = 1; i < arr.length; i++) {
                arr[i - 1].setNextPlugin(arr[i]);
            }
            // Initialize each plugin
            arr.forEach(queueItem => queueItem.initialize(config, core, extensions));

            this.channelQueue.push(arr);
        }
    }
}

