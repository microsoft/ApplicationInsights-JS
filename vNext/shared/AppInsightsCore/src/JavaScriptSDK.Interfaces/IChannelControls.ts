// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
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
     * @param async: send data asynchronously when true
     * @param callBack: if specified, notify caller when send is complete 
     */
    flush(async: boolean, callBack?: () => void): void;

    /**
     * Try to send data immediately using beaconSender when page unload; channel should default to sending data asynchronously.
     * Fall back to xhr sender if beacon is not supported.
     * @param async: send data asynchronously when true
     */
    unload(async: boolean): void;
}

export const MinChannelPriorty: number = 100;