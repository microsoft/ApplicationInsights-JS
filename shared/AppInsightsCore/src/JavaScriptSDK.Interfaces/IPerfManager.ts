// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { IPerfEvent } from "./../JavaScriptSDK.Interfaces/IPerfEvent";

/**
 * Identifies an interface to a host that can provide an IPerfManager implementation
 */
export interface IPerfManagerProvider {
    /**
     * Get the current performance manager
     */
    getPerfMgr(): IPerfManager;

    /**
     * Set the current performance manager
     * @param perfMgr The performance manager
     */
    setPerfMgr(perfMgr: IPerfManager): void;
}

/**
 * This defines an internal performance manager for tracking and reporting the internal performance of the SDK -- It does
 * not represent or report any event to the server.
 */
export interface IPerfManager {
    /**
     * Create a new event and start timing, the manager may return null/undefined to indicate that it does not
     * want to monitor this source event.
     * @param src The source name of the event
     * @param payloadDetails - An optional callback function to fetch the payload details for the event.
     * @param isAsync - Is the event occurring from a async event
     */
    create(src: string, payloadDetails?: () => any, isAsync?: boolean): IPerfEvent | null | undefined;

    /**
     * Complete the perfEvent and fire any notifications.
     * @param perfEvent Fire the event which will also complete the passed event
     */
    fire(perfEvent: IPerfEvent): void;

    /**
     * Set an execution context value
     * @param key - The context key name
     * @param value - The value
     */
    setCtx(key: string, value: any): void;

    /**
     * Get the execution context value
     * @param key - The context key
     */
    getCtx(key: string): any;
}
