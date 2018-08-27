/**
 * PropertiesPlugin.ts
 * @author Basel Rustum (barustum)
 * @copyright Microsoft 2018
 */

import { 
    ITelemetryPlugin, IConfiguration, 
    IAppInsightsCore, IPlugin, ITelemetryItem
} from 'applicationinsights-core-js';

export default class PropertiesPlugin implements ITelemetryPlugin {
    public priority = 10;
    public identifier = "AppInsightsPropertiesPlugin";

    private _nextPlugin: ITelemetryPlugin;

    initialize: (config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[]) => void;

    /**
     * Add Part A fields to the event
     * @param event The event that needs to be processed
     */
    processTelemetry(event: ITelemetryItem) {
        this._nextPlugin.processTelemetry(event);
    }

    /**
     * Sets the next plugin that comes after this plugin
     * @param nextPlugin The next plugin
     */
    setNextPlugin(nextPlugin: ITelemetryPlugin) {
        this._nextPlugin = nextPlugin;
    }
}