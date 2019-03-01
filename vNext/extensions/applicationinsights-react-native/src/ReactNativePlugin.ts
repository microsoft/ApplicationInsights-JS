/**
 * ReactNativePlugin.ts
 * @copyright Microsoft 2019
 */

import {
    ITelemetryPlugin,
    ITelemetryItem,
    IPlugin,
    IConfiguration,
    IAppInsightsCore
} from '@microsoft/applicationinsights-core-js';
import { ConfigurationManager, DeviceExtensionKeys } from '@microsoft/applicationinsights-common';
import DeviceInfo from 'react-native-device-info';

import { INativeDevice, IReactNativePluginConfig } from './Interfaces';

export class ReactNativePlugin implements ITelemetryPlugin {
    private _initialized: boolean = false;
    private _device: INativeDevice;
    private _config: IReactNativePluginConfig;

    identifier: string = 'AppInsightsReactNativePlugin';
    priority: number = 199;
    _nextPlugin?: ITelemetryPlugin;

    constructor(config?: IReactNativePluginConfig) {
        this._config = config || this._getDefaultConfig();
        this._device = {};
    }

    public initialize(
        config?: IReactNativePluginConfig | object, // need `| object` to coerce to interface
        core?: IAppInsightsCore,
        extensions?: IPlugin[]
    ) {
        const inConfig = config || {};
        const defaultConfig = this._getDefaultConfig();
        for (const option in defaultConfig) {
            this._config[option] = ConfigurationManager.getConfig(
                inConfig as any,
                option,
                this.identifier,
                this._config[option]
            );
        }
        if (!this._config.disableDeviceCollection) {
            this._collectDeviceInfo();
        }
        this._initialized = true;
    }

    public processTelemetry(item: ITelemetryItem) {
        this._applyDeviceContext(item);
        if (this._nextPlugin) {
            this._nextPlugin.processTelemetry(item);
        }
    }

    public setNextPlugin(next: ITelemetryPlugin) {
        this._nextPlugin = next;
    }

    public setDeviceId(newId: string) {
        this._device.id = newId;
    }

    public setDeviceModel(newModel: string) {
        this._device.model = newModel;
    }

    public setDeviceType(newType: string) {
        this._device.deviceClass = newType;
    }

    /**
     * Automatically collects native device info for this device
     */
    private _collectDeviceInfo() {
        this._device.deviceClass = DeviceInfo.getDeviceType();
        this._device.id = DeviceInfo.getUniqueID(); // Installation ID
        this._device.model = DeviceInfo.getModel();
    }

    private _applyDeviceContext(item: ITelemetryItem) {
        if (this._device) {
            item.ext = item.ext || {};
            if (typeof this._device.id === 'string') {
                item.ext[DeviceExtensionKeys.localId] = this._device.id;
            }
            if (typeof this._device.model === 'string') {
                item.ext[DeviceExtensionKeys.model] = this._device.model;
            }
            if (typeof this._device.deviceClass === 'string') {
                item.ext[DeviceExtensionKeys.deviceClass] = this._device.deviceClass;
            }
        }
    }

    private _getDefaultConfig(): IReactNativePluginConfig {
        return {
            // enable autocollection by default
            disableDeviceCollection: false
        };
    }
}
