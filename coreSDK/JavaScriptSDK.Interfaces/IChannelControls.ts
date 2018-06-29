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
}

export const MinChannelPriorty: number = 100;