import { ITelemetryPlugin } from "./ITelemetryPlugin";

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
     * Send data in buffer immediately
     */
    flush(): void;

    /**
     * Tear down transmission pipeline
     */
    teardown(): void;
}

export const MinChannelPriorty: number = 100;