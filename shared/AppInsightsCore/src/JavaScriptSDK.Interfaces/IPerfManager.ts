// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { ITelemetryItem } from "../JavaScriptSDK.Interfaces/ITelemetryItem";
import { IPerfEvent } from './../JavaScriptSDK.Interfaces/IPerfEvent';

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
     * Create a new event and start timing
     * @param src The source name of the event 
     * @param payload - The payload of the event 
     * @param isAsync - Is the event occuring from a async event
     */
    create(src: string, payload?: any, isAsync?: boolean): IPerfEvent;

    /**
     * 
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
