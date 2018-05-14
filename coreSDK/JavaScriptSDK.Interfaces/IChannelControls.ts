module Microsoft.ApplicationInsights.Core {

    "use strict";

    /**
     * Provides data transmission capabilities
     */
    export interface IChannelControls {

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
}