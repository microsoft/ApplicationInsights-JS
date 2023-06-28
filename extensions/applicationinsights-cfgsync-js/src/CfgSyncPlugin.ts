/**
* CfgSyncPlugin.ts
* @copyright Microsoft 2018
*/

import dynamicProto from "@microsoft/dynamicproto-js";
import { IConfig } from "@microsoft/applicationinsights-common";
import {
    BaseTelemetryPlugin, IAppInsightsCore, IConfigDefaults, IConfiguration, IPlugin, IProcessTelemetryContext,
    IProcessTelemetryUnloadContext, ITelemetryItem, ITelemetryPluginChain, ITelemetryUnloadState, createProcessTelemetryContext, eventOff,
    eventOn, getGlobal, isFetchSupported, isXhrSupported, onConfigChange, sendCustomEvent, setValue
} from "@microsoft/applicationinsights-core-js";
import { doAwaitResponse } from "@nevware21/ts-async";
import { arrForEach, isFunction, isNullOrUndefined, objDeepFreeze } from "@nevware21/ts-utils";
import { ICfgSyncConfig, ICfgSyncEvent } from "./Interfaces/ICfgSyncConfig";
import { ICfgSyncPlugin } from "./Interfaces/ICfgSyncPlugin";

const evtName = "cfgsync";
const STR_GET_METHOD = "GET";
const udfVal: undefined = undefined;
const _defaultConfig: IConfigDefaults<ICfgSyncConfig> = objDeepFreeze({
    disableAutoSync: false,
    customEvtName: udfVal,
    cfgUrl: udfVal, // as long as it is set to NOT NUll, we will NOT use config from core
    receiveChanges: false,
    overrideSyncFunc: udfVal,
    overrideFetchFunc: udfVal,
    onCfgChangeReceive: udfVal,
    nonOverrideConfigs:["instrumentationKey", "connectionString", "endpointUrl"]
});

export class CfgSyncPlugin extends BaseTelemetryPlugin implements ICfgSyncPlugin {

    public priority = 198;
    public identifier = "AppInsightsCfgSyncPlugin";

    constructor() {
        super();

        let _extensionConfig: ICfgSyncConfig;
        let _mainConfig: IConfiguration & IConfig; // throttle config should be wrapped in IConfiguration
        let _isAutoSync: boolean;
        let _evtName: string;
        let _cfgUrl: string;
        let _receiveChanges: boolean; // if it is set true, it won't send out any events
        let _onCfgChangeReceive: (event: ICfgSyncEvent) => void;
        let _nonOverrideConfigs: string[];
        let _fetchFn: (url?: string) =>  Promise<Response> | void;
        let _overrideFetchFn: (url?: string) => Promise<Response> | void;
        let _overrideSyncFn: (config?:IConfiguration & IConfig, customDetails?: any) => boolean;

        dynamicProto(CfgSyncPlugin, this, (_self, _base) => {

            _initDefaults();

            _self.initialize = (config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain) => {
                _base.initialize(config, core, extensions, pluginChain);
                _populateDefaults(config);
            };

            // used for V2 to manaully trigger config udpate
            _self.setCfg = (config?: IConfiguration & IConfig) => {
                return _setCfg(config)
            }

            // to allow manually sync config or other events
            _self.sync = (customDetails?: any) => {
                return _sendCfgsyncEvents(customDetails);
            }

            _self.updateEventListenerName = (eventName?: string) => {
                return _updateEventListenerName(eventName);
            }

            // endpoint change?
            // configSync {
            //     endpoint redirect{{}}
            // }
            // cs & ikey

            _self._doTeardown = (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) => {
                _eventOff()
                _initDefaults();
            };

            _self["_getDbgPlgTargets"] = () => {
                return [_isAutoSync, _receiveChanges,  _evtName];
            };
    
            function _initDefaults() {
                _mainConfig = null;
                _isAutoSync = null;
                _evtName = null;
                _cfgUrl = null;
                _receiveChanges = null;
                _nonOverrideConfigs = null;
                _overrideFetchFn = null;
                _overrideSyncFn = null;
                _onCfgChangeReceive = null;
            }

            // for v3
            function _populateDefaults(config: IConfiguration) {
                let identifier = _self.identifier;
                let core = _self.core;
               
                _self._addHook(onConfigChange(config, () => {
                    let ctx = createProcessTelemetryContext(null, config, core);
                    _extensionConfig = ctx.getExtCfg(identifier, _defaultConfig);
                    _isAutoSync = !_extensionConfig.disableAutoSync;
                    let _newEvtName = _extensionConfig.customEvtName || evtName;
                    if (_evtName !== _newEvtName) {
                        _updateEventListenerName(_newEvtName);
                        _evtName = _newEvtName;
                    }

                    if (isNullOrUndefined(_cfgUrl)) {
                        _cfgUrl = _extensionConfig.cfgUrl;
                    }
                    // if cfgUrl is set, we will ignore core config change
                    if (!_cfgUrl) {
                        _mainConfig = config;
                        if (_isAutoSync) {
                            _sendCfgsyncEvents();
                        }
                    }
                }));
                _overrideSyncFn = _extensionConfig.overrideSyncFn;
                _overrideFetchFn = _extensionConfig.overrideFetchFn;
                _onCfgChangeReceive = _extensionConfig.onCfgChangeReceive;
                _getFetchFnInterface();
                _receiveChanges = !!_extensionConfig.receiveChanges;
                _nonOverrideConfigs = _extensionConfig.nonOverrideConfigs || [];
                if (_receiveChanges) {
                    _addEventListener();
                }
                // NOT support cfgURL change to avoid mutiple fetch calls
                if (_cfgUrl) {
                    _fetchFn && _fetchFn(_cfgUrl);
                }
                
            }

            function _setCfg(config?: IConfiguration & IConfig) {
                if (config) {
                    _mainConfig = config;
                    if (_isAutoSync) {
                        return _sendCfgsyncEvents();
                    }
                }
                return false;
            }

            function _eventOff() {
                try {
                    let global = getGlobal();
                    if (global && _evtName) {
                        eventOff(global, _evtName, null);
                    }
                } catch (e) {
                    // eslint-disable-next-line no-empty
                }
            }

            function _sendCfgsyncEvents(customDetails?: any) {
                try {

                    if (!!_overrideSyncFn && isFunction(_overrideSyncFn)) {
                        return _overrideSyncFn(_mainConfig, customDetails);
                    }
                    return sendCustomEvent(_evtName, _mainConfig, customDetails);

                } catch (e) {
                    // eslint-disable-next-line no-empty
                }
                return false;
            }

            function _updateEventListenerName(name?: string) {
                try {
                    if (_evtName) {
                        _eventOff();
                    }
                    if (name) {
                        _evtName = name;
                        _addEventListener(_evtName);
                    }
                    return true;
                } catch (e) {
                    // eslint-disable-next-line no-empty
                }
                return false;
            }

            


            function _getFetchFnInterface() {
                let _fetchFn = _overrideFetchFn
                if (_fetchFn == null) {
                    if (isFetchSupported()) {
                        _fetchFn = _fetchSender
                    } else if (isXhrSupported()) {
                        _fetchFn = _xhrSender
                    }
                }
            }


            function _fetchSender(url?: string) {
                let global = getGlobal();
                let fetchFn = _overrideFetchFn || (global && global.fetch) || null;
                if (_cfgUrl && fetchFn && isFunction(fetchFn)) {
                    try {
                        const init: RequestInit = {
                            method: STR_GET_METHOD
                        };
                        const request = new Request(_cfgUrl, init);
                        doAwaitResponse(fetch(request), (result) => {
                            if (!result.rejected) {
                                _setCfg(result.value)
                            }
                        });
                    } catch (e) {
                        // eslint-disable-next-line no-empty
                    }
                }
            }

            function _xhrSender(url?: string) {

                let xhr = new XMLHttpRequest();
                xhr.open(STR_GET_METHOD, _cfgUrl);

                xhr.onload = () => {
                    try {
                        if (xhr.readyState === xhr.DONE && xhr.status === 200) {
                            let res = xhr.response && xhr.response.cfg as IConfiguration & IConfig;
                            res && _setCfg(res);
                        }
                        

                    } catch (e) {
                        // eslint-disable-next-line no-empty
                    }
                }
                xhr.send();
            }
            

            function _addEventListener(eventName?: string) {
                
                if (_receiveChanges) {
                    let global = getGlobal();
                    if (global) {
                        try {
                            eventOn(global, _evtName, (event: any) => {
                                if (_onCfgChangeReceive) {
                                    _onCfgChangeReceive(event);
                                } else {
                                    let cfg = (event as ICfgSyncEvent).cfg;
                                    let newCfg = _replaceTartgetByKeys(cfg);
                                    cfg && _self.core.updateCfg(newCfg);
                                }
                            });

                        } catch(e) {
                            // eslint-disable-next-line no-empty
                        }
                    }
                }
            }

            function _replaceTartgetByKeys(cfg: IConfiguration & IConfig ): IConfiguration & IConfig {
                if (_nonOverrideConfigs && cfg) {
                    arrForEach(_nonOverrideConfigs, (val: string) => {
                        setValue(cfg, val as any, undefined);
                        // or use delete
                    });
                }
                return cfg;
            }

            _self.processTelemetry = (env: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => {
                _self.processNext(env, itemCtx);
            };

        });
    }

    public initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public setCfg(config?: IConfiguration & IConfig): boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    public sync(customDetails?: any): boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    public updateEventListenerName(eventName?: string): boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }
   
    // /**
    //  * Add Part A fields to the event
    //  * @param event - The event that needs to be processed
    //  */
    public processTelemetry(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}
