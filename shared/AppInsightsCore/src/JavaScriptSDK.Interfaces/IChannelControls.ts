// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { IPromise } from "@nevware21/ts-async";
import { SendRequestReason } from "../JavaScriptSDK.Enums/SendRequestReason";
import { IProcessTelemetryUnloadContext } from "./IProcessTelemetryContext";
import { ITelemetryItem } from "./ITelemetryItem";
import { ITelemetryPlugin } from "./ITelemetryPlugin";
import { ITelemetryUnloadState } from "./ITelemetryUnloadState";
import { IPayloadData } from "./IXHROverride";

"use strict";

/**
 * Internal Interface
 */
export interface IInternalOfflineSupport {

    /**
     * Get current endpoint url
     * @returns endpoint
     */
    getUrl: () => string;
    /**
     * Create payload data
     * @returns IPayloadData
     */
    createPayload: (data: string | Uint8Array) => IPayloadData;
    /**
     * Serialize an item into a string
     * @param input - telemetry item
     * @param convertUndefined - convert undefined to a custom-defined object
     * @returns Serialized string
     */
    serialize?: (input: ITelemetryItem, convertUndefined?: any) => string;
    /**
     * Batch an array of strings into one string
     * @param arr - array of strings
     * @returns a string represent all items in the given array
     */
    batch?: (arr: string[]) => string;
  
    /**
     * If the item should be processed by offline channel
     * @param evt - telemetry item
     * @returns should process or not
     */
    shouldProcess?: (evt: ITelemetryItem) => boolean;

    /**
     * Create 1ds payload data
     * @param evts - ITelemetryItems
     * @returns IPayloadData
     */
      createOneDSPayload?: (evts: ITelemetryItem[]) => IPayloadData;

}

/**
 * Provides data transmission capabilities
 */
export interface IChannelControls extends ITelemetryPlugin {

    /**
     * Pause sending data
     */
    pause?(): void;

    /**
     * Resume sending data
     */
    resume?(): void;

    /**
     * Tear down the plugin and remove any hooked value, the plugin should be removed so that it is no longer initialized and
     * therefore could be re-initialized after being torn down. The plugin should ensure that once this has been called any further
     * processTelemetry calls are ignored and it just calls the processNext() with the provided context.
     * @param unloadCtx - This is the context that should be used during unloading.
     * @param unloadState - The details / state of the unload process, it holds details like whether it should be unloaded synchronously or asynchronously and the reason for the unload.
     * @returns boolean - true if the plugin has or will call processNext(), this for backward compatibility as previously teardown was synchronous and returned nothing.
     */
    teardown?: (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) => void | boolean;

    /**
     * Flush to send data immediately; channel should default to sending data asynchronously. If executing asynchronously and
     * you DO NOT pass a callback function then a [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html)
     * will be returned which will resolve once the flush is complete. The actual implementation of the `IPromise`
     * will be a native Promise (if supported) or the default as supplied by [ts-async library](https://github.com/nevware21/ts-async)
     * @param async - send data asynchronously when true
     * @param callBack - if specified, notify caller when send is complete, the channel should return true to indicate to the caller that it will be called.
     * If the caller doesn't return true the caller should assume that it may never be called.
     * @param sendReason - specify the reason that you are calling "flush" defaults to ManualFlush (1) if not specified
     * @returns - If a callback is provided `true` to indicate that callback will be called after the flush is complete otherwise the caller
     * should assume that any provided callback will never be called, Nothing or if occurring asynchronously a
     * [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html) which will be resolved once the unload is complete,
     * the [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html) will only be returned when no callback is provided
     * and async is true.
     */
    flush?(async: boolean, callBack?: (flushComplete?: boolean) => void, sendReason?: SendRequestReason): boolean | void | IPromise<boolean>;

    /**
     * Get offline support
     * @returns IInternalOfflineSupport
     */
    getOfflineSupport?: () => IInternalOfflineSupport;

}

export const MinChannelPriorty: number = 100;
