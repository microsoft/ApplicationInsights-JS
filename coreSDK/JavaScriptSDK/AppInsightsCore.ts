import { IAppInsightsCore } from "../JavaScriptSDK.Interfaces/IAppInsightsCore"
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { ITelemetryPlugin, IPlugin } from "../JavaScriptSDK.Interfaces/ITelemetryPlugin";
import { IChannelControls, MinChannelPriorty } from "../JavaScriptSDK.Interfaces/IChannelControls";
import { ITelemetryItem } from "../JavaScriptSDK.Interfaces/ITelemetryItem";
import { CoreUtils } from "./CoreUtils";

"use strict";

export class AppInsightsCore implements IAppInsightsCore {
    public config: IConfiguration;
    public static defaultConfig: IConfiguration;

    private _extensions: Array<IPlugin>;

    constructor() {
        this._extensions = new Array<IPlugin>();
    }

    initialize(config: IConfiguration, extensions: IPlugin[]): void {
        
        if (!extensions || extensions.length === 0) {
            // throw error
            throw Error("At least one sender channel is required");
        }
        
        if (!config || config.endpointUrl === null || config.instrumentationKey === null) {
            // throw error
        }

        this.config = config;

        // Initial validation
        extensions.forEach((extension: ITelemetryPlugin) => {
            if (extension.setNextPlugin === null || extension.processTelemetry === null || extension.identifier === null) {
                // Todo: throw detailed error
                throw Error("Invalid state");
            }
        });        

        this._extensions = extensions.sort((extA, extB) => {
            if (extA && (<any>extA).processTelemetry === 'function' && (<any>extB).processTelemetry === 'function') {
                return (<any>extA).priority > (<any>extB).priority ? 1 : -1;
            }

            if (extA && (<any>extA).processTelemetry === 'function' && (<any>extB).processTelemetry !== 'function') {
                // keep non telemetryplugin specific extensions at start
                return 1;
            }

            if (extA && (<any>extA).processTelemetry !== 'function' && (<any>extB).processTelemetry === 'function') {
                return -1;
            }
        });

        for (let idx = 0; idx < this._extensions.length - 2; idx++) {
            if (this._extensions[idx] && (<any>this._extensions[idx]).processTelemetry !== 'function') {
                // these are initialized only
                continue;
            }

            (<any>this._extensions[idx]).setNextPlugin(this._extensions[idx + 1]); // set next plugin
        }

        this._extensions.forEach(ext => ext.initialize(this.config, this, this._extensions)); // initialize

        // get defaults for configuration values as applicable
    }


    getTransmissionControl(): IChannelControls {
        for (let i = 0; i < this._extensions.length; i++) {
            let priority = (<any>this._extensions[i]).priority;
            if (CoreUtils.isNullOrUndefined(priority) && priority >= MinChannelPriorty) {
                let firstChannel = <any>this._extensions[i];
                return firstChannel as IChannelControls; // return first channel in list
            }
        }

        return null;
    }

    track(telemetryItem: ITelemetryItem) {
        if (telemetryItem === null) {
            // throw error
            throw Error("Invalid telemetry item");
        }

        // do base validation before sending it through the pipeline        
        this._validateTelmetryItem(telemetryItem);        

        // invoke any common telemetry processors before sending through pipeline

        let i = 0;
        while (true) {
            if ((<any>this._extensions[i]).processTelemetry) {
                (<any>this._extensions[i]).processTelemetry(telemetryItem); // pass on to first extension
                break;
            }
        }
    }

    private _validateTelmetryItem(telemetryItem: ITelemetryItem) {

        if (CoreUtils.isNullOrUndefined(telemetryItem.name)) {
            throw Error("telemetry name required");
        }

        if (CoreUtils.isNullOrUndefined(telemetryItem.timestamp)) {
            throw Error("telemetry timestamp required");
        }

        if (CoreUtils.isNullOrUndefined(telemetryItem.baseType)) {
            throw Error("telemetry baseType required");
        }

        if (CoreUtils.isNullOrUndefined(telemetryItem.instrumentationKey)) {
            throw Error("telemetry instrumentationKey required");
        }
    }
}