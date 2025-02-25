// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { IStatsBeatEvent } from "../JavaScriptSDK.Interfaces/IStatsBeatEvent";
import { IStatsbeatManager } from "../JavaScriptSDK.Interfaces/IStatsBeatManager";

// /**
//  * This defines an internal stats beat manager for tracking and reporting the internal performance of the SDK
//  */
export class StatsBeatManager implements IStatsbeatManager{


constructor(manager?: IStatsbeatManager) {
    let _networkCounter: NetworkStatsbeat;
    let _sender: Sender;
    let _isEnabled = false;
    let _config: IConfiguration & IConfig;
    let _statsbeatMetrics: { properties?: {} } = {};
    dynamicProto(StatsBeatManager, this, (_self) => {

        _self.initialize = (config, core, extensions, pluginChain, endpoint) => {
            if (manager && manager.initialize) {
                manager.initialize(config, core, extensions, pluginChain, endpoint);
            }
        }