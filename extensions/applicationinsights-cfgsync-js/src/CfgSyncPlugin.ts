/**
* CfgSyncPlugin.ts
* @copyright Microsoft 2018
*/

import dynamicProto from "@microsoft/dynamicproto-js";
import { IConfig } from "@microsoft/applicationinsights-common";
import {
    BaseTelemetryPlugin, IAppInsightsCore, IConfigDefaults, IConfiguration, IPlugin, IProcessTelemetryContext,
    IProcessTelemetryUnloadContext, ITelemetryItem, ITelemetryPluginChain, ITelemetryUnloadState, createProcessTelemetryContext, eventOff,
    eventOn, getGlobal, onConfigChange, sendCustomEvent
} from "@microsoft/applicationinsights-core-js";
import { doAwaitResponse } from "@nevware21/ts-async";
import { isFunction, isNullOrUndefined, objDeepFreeze } from "@nevware21/ts-utils";
import { ICfgSyncConfig, ICfgSyncEvent } from "./Interfaces/ICfgSyncConfig";
import { ICfgSyncPlugin } from "./Interfaces/ICfgSyncPlugin";

const evtNamespace = "cfgsync";
const udfVal: undefined = undefined;
const _defaultConfig: IConfigDefaults<ICfgSyncConfig> = objDeepFreeze({
    disableAutoSync: false,
    customEvtNamespace: udfVal,
    cfgUrl: udfVal, // as long as it is set to NOT NUll, we will NOT use config from core
    receiveChanges: false,
    overrideSyncFunc: udfVal,
    overrideFetchFunc: udfVal,
    onCfgChangeReceive: udfVal
});

export class CfgSyncPlugin extends BaseTelemetryPlugin implements ICfgSyncPlugin {

    public priority = 198;
    public identifier = "AppInsightsCfgSyncPlugin";

    constructor() {
        super();

        let _extensionConfig: ICfgSyncConfig;
        let _mainConfig: IConfiguration & IConfig; // throttle config should be wrapped in IConfiguration
        let _isAutoSync: boolean;
        let _evtNamespace: string;
        let _cfgUrl: string;
        let _receiveChanges: boolean; // if it is set true, it won't send out any events
        let _onCfgChangeReceive: (event: ICfgSyncEvent) => void;
        let _overrideFetchFn: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
        let _overrideSyncFn: (config?:IConfiguration & IConfig) => boolean;

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

            _self.enableAutoSync = (val?: boolean) => {
                _isAutoSync = !!val;
            }

            _self.enableReceiveChanges = (val?: boolean) => {
                _receiveChanges = !!val;
            }

            _self._doTeardown = (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) => {
                _eventOff(_evtNamespace)
                _initDefaults();
            };

            _self["_getDbgPlgTargets"] = () => {
                return [_isAutoSync, _receiveChanges,  _evtNamespace];
            };
    
            function _initDefaults() {
                _mainConfig = null;
                _isAutoSync = null;
                _evtNamespace = null;
                _cfgUrl = null;
                _receiveChanges = null;
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
                // NOT support cfgURL change to avoid mutiple fetch calls
                if (_cfgUrl) {
                    _fetchCfg();
                }
                _receiveChanges = !!_extensionConfig.receiveChanges;
                _evtNamespace = _extensionConfig.customEvtNamespace || evtNamespace;
                _overrideFetchFn = _extensionConfig.overrideFetchFn;
                _overrideSyncFn = _extensionConfig.overrideSyncFn;
                _onCfgChangeReceive = _extensionConfig.onCfgChangeReceive;
               
                if (_receiveChanges) {
                    _addEventListener();
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

            function _eventOff(eventName?: string) {
                try {
                    let global = getGlobal();
                    if (global) {
                        eventOff(global, null, eventName);
                    }
                } catch (e) {
                    // eslint-disable-next-line no-empty
                }
            }

            function _sendCfgsyncEvents(customDetails?: string) {
                try {

                    if (!!_overrideSyncFn && isFunction(_overrideSyncFn)) {
                        return _overrideSyncFn(_mainConfig);
                    }
                    let customData = customDetails || null;
                    let details = {
                        cfg: _mainConfig,
                        customDetails: customData
                    } as ICfgSyncEvent;
                    return sendCustomEvent(_evtNamespace, details);

                } catch (e) {
                    // eslint-disable-next-line no-empty
                }
                return false;
            }

            function _updateEventListenerName(name?: string) {
                try {
                    if (_evtNamespace) {
                        _eventOff(_evtNamespace);
                    }
                    if (name) {
                        _evtNamespace = name;
                        _addEventListener(_evtNamespace);
                    }
                    return true;
                } catch (e) {
                    // eslint-disable-next-line no-empty
                }
                return false;
            }

            function _fetchCfg() {
                let global = getGlobal();
                let fetchFn = _overrideFetchFn || (global && global.fetch) || null;
                if (_cfgUrl && fetchFn && isFunction(fetchFn)) {
                    try {
                        let requestHeaders = new Headers();
                        const init: RequestInit = {
                            method: "GET",
                            headers: requestHeaders // TODO: should we add any hearders?
                        };
                        const request = new Request(_cfgUrl, init);
                        doAwaitResponse(fetchFn(request), (result) => {
                            if (!result.rejected) {
                                _setCfg(result.value)
                            }
                        });
                    } catch (e) {
                        // eslint-disable-next-line no-empty
                    }
                }
            }

            function _addEventListener(eventNamespace?: string) {
                
                if (_receiveChanges) {
                    let global = getGlobal();
                    if (global) {
                        try {
                            eventOn(global, null, (event: any) => {
                                if (_onCfgChangeReceive) {
                                    _onCfgChangeReceive(event);
                                } else {
                                    let cfg = (event as ICfgSyncEvent).cfg;
                                    cfg && _self.core.updateCfg(cfg);
                                }
                            }, eventNamespace);

                        } catch(e) {
                            // eslint-disable-next-line no-empty
                        }
                    }
                }
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

    public enableAutoSync(val?: boolean): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    public enableReceiveChanges(val?: boolean): void {
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
