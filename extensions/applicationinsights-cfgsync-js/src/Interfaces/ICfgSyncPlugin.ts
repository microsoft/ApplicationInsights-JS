import { IConfig } from "@microsoft/applicationinsights-common";
import { IConfiguration } from "@microsoft/applicationinsights-core-js";

export declare interface ICfgSyncPlugin {
    /**
     * Get current configs of current instance.
     * @param config current configs
     */
    getCfg(): IConfiguration & IConfig;
    /**
     * Manually set configs of current instance.
     * @param config new configs
     */
    setCfg(config?:IConfiguration & IConfig): boolean;
    /**
     * Manually broadcast configs of current instance to all other instances.
     * @param customDetails additional details should also be sent out to other instances
     */
    sync(customDetails?: any): boolean;
    /**
     * Manually update event name.
     * If current instance is the main instance, then following config changes will be sent out under this new event name.
     * If current instance is listener instances, it will listen to event details under this new name.
     * @param eventName new event name
     */
    updateEventListenerName(eventName?: string): boolean;
}