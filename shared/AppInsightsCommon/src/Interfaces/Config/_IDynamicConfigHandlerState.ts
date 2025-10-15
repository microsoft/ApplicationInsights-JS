// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IDynamicConfigHandler } from "./IDynamicConfigHandler";
import { IDynamicPropertyHandler } from "./IDynamicPropertyHandler";
import { _IDynamicDetail, IWatcherHandler, WatcherFunction } from "./IDynamicWatcher";

/**
 * @internal
 * Interface for internal communication to notifying state changes
 */
export interface _IDynamicGetter {
    /**
     * Cause any listeners of this property to be notified that the value has changed.
     * Primarily used to ensure that listeners of child properties of an object that is getting replaced
     * will be notified.
     */
    chng: () => void;
}

/**
 * @internal
 * Interface for the global dynamic config handler
 */
export interface _IDynamicConfigHandlerState<T> {
    prop: symbol;       // Identify that this is a dynamic property
    ro: symbol;         // Identify that this property is read-only
    rf: symbol;         // Identify that this property is referenced and should be updated in-place
    blkVal: symbol;     // Identify that the value of this property should not be converted to be dynamic
    
    /**
     * Link to the handler
     */
    hdlr: IDynamicConfigHandler<T>;

    /**
     * Identifies the current active handler
     */
    act?: IWatcherHandler<T>;

    /**
     * Enable / Disable updates to dynamic readonly properties
     */
    upd?: boolean;

    /**
     * Helper to call any listeners that are waiting to be notified
     */
    notify: () => void;

    /**
     * Add this property handler to the collection to be notified
     */
    add: (handler: IDynamicPropertyHandler<T>) => void;

    /**
     * Add this handler as a handler for
     */
    trk: (handler: IWatcherHandler<T>, detail: _IDynamicDetail<T>) => void;

    /**
     * Use the provided handler to listen for changes
     */
    use: (activeHandler: IWatcherHandler<T>, callback: WatcherFunction<T>) => void;
}
