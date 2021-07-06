/**
 * ReactNativePlugin.ts
 * @copyright Microsoft 2019
 */

import {
    ITelemetryPlugin,
    ITelemetryItem,
    IPlugin,
    IAppInsightsCore, 
    LoggingSeverity,
    _InternalMessageId,
    BaseTelemetryPlugin,
    IProcessTelemetryContext,//,
    arrForEach,
    dumpObj,
    getExceptionName,
    isObject,
    hasOwnProperty,
    isUndefined
} from '@microsoft/applicationinsights-core-js';
import { ConfigurationManager, IDevice, IExceptionTelemetry, IAppInsights, SeverityLevel, AnalyticsPluginIdentifier  } from '@microsoft/applicationinsights-common';
import DeviceInfo from 'react-native-device-info';

import { INativeDevice, IReactNativePluginConfig } from './Interfaces';
import dynamicProto from '@microsoft/dynamicproto-js';
import { getGlobal, strShimUndefined } from '@microsoft/applicationinsights-shims';

declare var global: Window;

/**
 * This is a helper function for the equivalent of arForEach(objKeys(target), callbackFn), this is a 
 * performance optimization to avoid the creation of a new array for large objects
 * @param target The target object to find and process the keys
 * @param callbackfn The function to call with the details
 */
 export function objForEachKey(target: any, callbackfn: (name: string, value: any) => void) {
    if (target && isObject(target)) {
        for (let prop in target) {
            if (hasOwnProperty(target, prop)) {
                callbackfn.call(target, prop, target[prop]);
            }
        }
    }
}

export class ReactNativePlugin extends BaseTelemetryPlugin {

    identifier: string = 'AppInsightsReactNativePlugin';
    priority: number = 140;
    _nextPlugin?: ITelemetryPlugin;

    private _setExceptionHandler: () => void;
    private _collectDeviceInfo: () => void;

    constructor(config?: IReactNativePluginConfig) {
        super();

        let _device: INativeDevice = {};
        let _config: IReactNativePluginConfig = config || _getDefaultConfig();
        let _analyticsPlugin: IAppInsights;
        let _defaultHandler;
    
        dynamicProto(ReactNativePlugin, this, (_self, _base) => {
            _self.initialize = (
                config?: IReactNativePluginConfig | object, // need `| object` to coerce to interface
                core?: IAppInsightsCore,
                extensions?: IPlugin[]
            ) => {
                if (!_self.isInitialized()) {
                    _base.initialize(config, core, extensions);

                    const inConfig = config || {};
                    const defaultConfig = _getDefaultConfig();
                    objForEachKey(defaultConfig, (option, value) => {
                        _config[option] = ConfigurationManager.getConfig(
                            inConfig as any,
                            option,
                            _self.identifier,
                            !isUndefined(_config[option]) ? _config[option] : value
                        );
                    });
        
                    if (!_config.disableDeviceCollection) {
                        _self._collectDeviceInfo();
                    }
        
                    if (extensions) {
                        arrForEach(extensions, ext => {
                            const identifier = (ext as ITelemetryPlugin).identifier;
                            if (identifier === AnalyticsPluginIdentifier) {
                                _analyticsPlugin = (ext as any) as IAppInsights;
                            }
                        });
                    }
        
                    if (!_config.disableExceptionCollection) {
                        _self._setExceptionHandler();
                    }
                }
            };

            _self.processTelemetry = (item: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => {
                _applyDeviceContext(item);
                _self.processNext(item, itemCtx);
            };
        
            _self.setDeviceId = (newId: string) => {
                _device.id = newId;
            };
        
            _self.setDeviceModel = (newModel: string) => {
                _device.model = newModel;
            };
        
            _self.setDeviceType = (newType: string) => {
                _device.deviceClass = newType;
            };
            
            /**
             * Automatically collects native device info for this device
             */
            _self._collectDeviceInfo = () => {
                try {
                    _device.deviceClass = DeviceInfo.getDeviceType();
                    _device.id = DeviceInfo.getUniqueId(); // Installation ID
                    _device.model = DeviceInfo.getModel();
                } catch (e) {
                    _self.diagLog().warnToConsole("Failed to get DeviceInfo: " + getExceptionName(e) + " - " + dumpObj(e));
                }
            }

            function _applyDeviceContext(item: ITelemetryItem) {
                if (_device) {
                    item.ext = item.ext || {};
                    item.ext.device = item.ext.device || ({} as IDevice);
                    if (typeof _device.id === 'string') {
                        item.ext.device.localId = _device.id;
                    }
                    if (typeof _device.model === 'string') {
                        item.ext.device.model = _device.model;
                    }
                    if (typeof _device.deviceClass === 'string') {
                        item.ext.device.deviceClass = _device.deviceClass;
                    }
                }
            }

            function _getGlobal(): any {
                if (typeof global !== strShimUndefined && global) {
                    return global as any;
                }

                return getGlobal() as any;
            }

            _self._setExceptionHandler = () => {
                const _global = _getGlobal();
                if (_global && _global.ErrorUtils) {
                    // intercept react-native error handling
                    _defaultHandler = (typeof _global.ErrorUtils.getGlobalHandler === 'function' && _global.ErrorUtils.getGlobalHandler()) || _global.ErrorUtils._globalHandler;
                    _global.ErrorUtils.setGlobalHandler(_trackException.bind(this));
                }
            }

            // default global error handler syntax: handleError(e, isFatal)
            function _trackException(e, isFatal) {
                const exception: IExceptionTelemetry = { exception: e, severityLevel: SeverityLevel.Error };

                if (_analyticsPlugin) {
                    _analyticsPlugin.trackException(exception);
                } else {
                    _self.diagLog().throwInternal(
                        LoggingSeverity.CRITICAL, _InternalMessageId.TelemetryInitializerFailed, "Analytics plugin is not available, ReactNative plugin telemetry will not be sent: ");
                }

                // call the _defaultHandler - react native also gets the error
                if (_defaultHandler) {
                    _defaultHandler.call(global, e, isFatal);
                }
            }

            // Test Hooks
            (_self as any)._config = _config;
            (_self as any)._getDbgPlgTargets = () => {
                return [_device];
            }
        });

        function _getDefaultConfig(): IReactNativePluginConfig {
            return {
                // enable auto collection by default
                disableDeviceCollection: false,
                disableExceptionCollection: false
            };
        }
    }

    public initialize(
        config?: IReactNativePluginConfig | object, // need `| object` to coerce to interface
        core?: IAppInsightsCore,
        extensions?: IPlugin[]) {

        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public processTelemetry(env: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public setDeviceId(newId: string) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public setDeviceModel(newModel: string) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public setDeviceType(newType: string) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}
