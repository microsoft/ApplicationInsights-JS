// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { IUnloadHook } from "../JavaScriptSDK.Interfaces/IUnloadHook";
import { IDynamicConfigHandler } from "./IDynamicConfigHandler";
import { IDynamicPropertyHandler } from "./IDynamicPropertyHandler";

export interface IWatchDetails<T extends IConfiguration> {
    cfg: T;
    hdlr: IDynamicConfigHandler<T>;
}

export type WatcherFunction<T extends IConfiguration> = (details: IWatchDetails<T>) => void;

/**
 * @internal
 */
export interface _WatcherChangeDetails<T extends IConfiguration> {
    d: _IDynamicDetail<T>;
}

/**
 * @internal
 */
export interface _IDynamicDetail<T extends IConfiguration> extends IDynamicPropertyHandler<T> {

    /**
     * Add the watcher for monitoring changes
     */
    add: (handler: IWatcherHandler<T>) => void;
}

export interface IWatcherHandler<T extends IConfiguration> extends IUnloadHook {
    fn: WatcherFunction<T>;
    rm: () => void;
}