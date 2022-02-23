// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { SendRequestReason } from "../JavaScriptSDK.Enums/SendRequestReason";
import { ITelemetryPlugin } from "./ITelemetryPlugin";

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
     * Tear down transmission pipeline
     */
    teardown(): void;

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