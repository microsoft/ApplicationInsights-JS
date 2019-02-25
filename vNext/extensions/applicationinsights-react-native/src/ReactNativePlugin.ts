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
    priority: number = 200;
    _nextPlugin?: ITelemetryPlugin;

    constructor(config?: IReactNativePluginConfig) {
        this._config = config || this._getDefaultConfig();
        this._device = {};
    }

    public initialize(
        config: IConfiguration,
        core: IAppInsightsCore,
        extensions: IPlugin[]
    ) {
        const defaultConfig = this._getDefaultConfig();
        for (const option in defaultConfig) {
            this._config[option] = ConfigurationManager.getConfig(
                config,
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
        this._device.type = newType;
    }

    /**
     * Automatically collects native device info for this device
     */
    private _collectDeviceInfo() {
        this._device.type = DeviceInfo.getDeviceType();
        this._device.id = DeviceInfo.getUniqueID(); // Installation ID
        this._device.model = DeviceInfo.getModel();
    }

    private _applyDeviceContext(item: ITelemetryItem) {
        if (this._device) {
            item.ctx = item.ctx || {};
            if (typeof this._device.id === 'string') {
                item.ctx[DeviceExtensionKeys.localId] = this._device.id;
            }
            if (typeof this._device.model === 'string') {
                item.ctx[DeviceExtensionKeys.model] = this._device.model;
            }
            if (typeof this._device.type === 'string') {
                item.ctx[DeviceExtensionKeys.deviceType] = this._device.type;
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
