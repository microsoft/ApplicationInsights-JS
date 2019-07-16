export enum DistributedTracingModes {
    /**
     * (Default) Send Application Insights correlation headers
     */

    AI=0,

    /**
     * Send both W3C Trace Context headers and back-compatibility Application Insights headers
     */
    AI_AND_W3C,

    /**
     * Send W3C Trace Context headers
     */
    W3C
}