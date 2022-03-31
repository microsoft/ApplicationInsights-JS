// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { SendRequestReason } from "../JavaScriptSDK.Enums/SendRequestReason";
import { IProcessTelemetryUnloadContext } from "./IProcessTelemetryContext";
import { ITelemetryPlugin } from "./ITelemetryPlugin";
import { ITelemetryUnloadState } from "./ITelemetryUnloadState";

"use strict";

/**
 * Provides data transmission capabilities
 */
export interface IChannelControls extends ITelemetryPlugin {

    /**
     * Pause sending data
     */
    pause(): void;

    /**
     * Resume sending data
     */
    resume(): void;

    /**
     * Tear down the plugin and remove any hooked value, the plugin should be removed so that it is no longer initialized and
     * therefore could be re-initialized after being torn down. The plugin should ensure that once this has been called any further
     * processTelemetry calls are ignored and it just calls the processNext() with the provided context.
     * @param unloadCtx - This is the context that should be used during unloading.
     * @param unloadState - The details / state of the unload process, it holds details like whether it should be unloaded synchronously or asynchronously and the reason for the unload.
     * @returns boolean - true if the plugin has or will call processNext(), this for backward compatibility as previously teardown was synchronous and returned nothing.
     */
    teardown: (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) => void | boolean;

    /**
     * Flush to send data immediately; channel should default to sending data asynchronously
     * @param async - send data asynchronously when true
     * @param callBack - if specified, notify caller when send is complete, the channel should return true to indicate to the caller that it will be called.
     * If the caller doesn't return true the caller should assume that it may never be called.
     * @param sendReason - specify the reason that you are calling "flush" defaults to ManualFlush (1) if not specified
     * @returns - true if the callback will be return after the flush is complete otherwise the caller should assume that any provided callback will never be called
     */
    flush(async: boolean, callBack?: (flushComplete?: boolean) => void, sendReason?: SendRequestReason): boolean | void;
}

export const MinChannelPriorty: number = 100;