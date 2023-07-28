/**
* CfgSyncPlugin.ts
* @copyright Microsoft 2018
*/

import dynamicProto from "@microsoft/dynamicproto-js";
import { IConfig } from "@microsoft/applicationinsights-common";
import {
    BaseTelemetryPlugin, IAppInsightsCore, IConfiguration, IPlugin, IProcessTelemetryContext, IProcessTelemetryUnloadContext, ITelemetryItem,
    ITelemetryPluginChain, ITelemetryUnloadState, createProcessTelemetryContext, createUniqueNamespace, eventOff, eventOn, getGlobal,
    getJSON, isFetchSupported, isFunction, isNullOrUndefined, isPlainObject, isString, isXhrSupported, mergeEvtNamespace, objExtend,
    objForEachKey, sendCustomEvent
} from "@microsoft/applicationinsights-core-js";
import { replaceByNonOverrideCfg } from "./CfgSyncHelperFuncs";
import {
    ICfgSyncConfig, ICfgSyncEvent, ICfgSyncMode, NonOverrideCfg, OnCompleteCallback, SendGetFunction
} from "./Interfaces/ICfgSyncConfig";
import { ICfgSyncPlugin } from "./Interfaces/ICfgSyncPlugin";

const EVENT_NAME = "ai_cfgsync";
const STR_GET_METHOD = "GET";
const FETCH_SPAN = 1800000; // 30 minutes
const udfVal: undefined = undefined;
let defaultNonOverrideCfg: NonOverrideCfg  = {instrumentationKey: true, connectionString: true, endpointUrl: true };
function _getDefaultConfig(): ICfgSyncConfig {
    const config: ICfgSyncConfig = {
        syncMode: ICfgSyncMode.Broadcast,
        customEvtName: udfVal,
        cfgUrl: udfVal, // as long as it is set to NOT NUll, we will NOT use config from core
        overrideSyncFn: udfVal,
        overrideFetchFn: udfVal,
        onCfgChangeReceive: udfVal,
        scheduleFetchTimeout: FETCH_SPAN,
        nonOverrideConfigs: defaultNonOverrideCfg
    };
    return config;
}


export class CfgSyncPlugin extends BaseTelemetryPlugin implements ICfgSyncPlugin {

    public priority = 198;
    public identifier = "AppInsightsCfgSyncPlugin";
    public static getDefaultConfig = _getDefaultConfig;

    constructor() {
        super();

        let _extensionConfig: ICfgSyncConfig;
        let _mainConfig: IConfiguration & IConfig; // throttle config should be wrapped in IConfiguration
        let _evtName: string;
        let _evtNamespace: string | string[];
        let _cfgUrl: string;
        let _timeoutHandle: any;
        let _receiveChanges: boolean;
        let _broadcastChanges: boolean;
        let _fetchTimeout: number;
        let _retryCnt: number;
        let _onCfgChangeReceive: (event: ICfgSyncEvent) => void;
        let _nonOverrideConfigs: NonOverrideCfg;
        let _fetchFn: SendGetFunction;
        let _overrideFetchFn: SendGetFunction;
        let _overrideSyncFn: (config?:IConfiguration & IConfig, customDetails?: any) => boolean;

        dynamicProto(CfgSyncPlugin, this, (_self, _base) => {

            _initDefaults();

            _self.initialize = (config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain) => {
                _base.initialize(config, core, extensions, pluginChain);
                _evtNamespace = mergeEvtNamespace(createUniqueNamespace(_self.identifier), core.evtNamespace && core.evtNamespace());
                _populateDefaults(config);
            };

            _self.getCfg = () => {
                return _mainConfig;
            }

            // used for V2 to manaully trigger config udpate
            _self.setCfg = (config?: IConfiguration & IConfig) => {
                return _setCfg(config, _broadcastChanges);
            }

            _self.sync = (customDetails?: any) => {
                return _sendCfgsyncEvents(customDetails);
            }

            _self.updateEventListenerName = (eventName?: string) => {
                return _updateEventListenerName(eventName);
            }

            _self._doTeardown = (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) => {
                _eventOff();
                _clearScheduledTimer();
                _initDefaults();
            };

            _self["_getDbgPlgTargets"] = () => {
                return [_broadcastChanges, _receiveChanges, _evtName, _extensionConfig];
            };
    
            function _initDefaults() {
                _mainConfig = null;
                _evtName = null;
                _evtNamespace = null;
                _cfgUrl = null;
                _receiveChanges = null;
                _broadcastChanges = null;
                _nonOverrideConfigs = null;
                _timeoutHandle = null;
                _fetchTimeout = null;
                _retryCnt = null;
                _overrideFetchFn = null;
                _overrideSyncFn = null;
                _onCfgChangeReceive = null;
                _fetchFn = null;
            }

            function _populateDefaults(config: IConfiguration) {
                let ctx = createProcessTelemetryContext(null, config, _self.core);
                let identifier = _self.identifier;

                const defaultConfig = _getDefaultConfig();
                _extensionConfig = _extensionConfig || {} as ICfgSyncConfig;
                objForEachKey(defaultConfig, (field, value: any) => {
                    _extensionConfig[field] = ctx.getConfig(identifier, field, value);
                });
                _receiveChanges = _extensionConfig.syncMode === ICfgSyncMode.Receive;
                _broadcastChanges = _extensionConfig.syncMode === ICfgSyncMode.Broadcast;
                _evtName = _extensionConfig.customEvtName || EVENT_NAME;
                if (_receiveChanges) {
                    _updateEventListenerName(_evtName);
                }

                let extUrl = _extensionConfig.cfgUrl;
                if (extUrl && isString(extUrl)) {
                    _cfgUrl = extUrl;
                }
                // if cfgUrl is set, we will ignore core config change
                if (!_cfgUrl) {
                    _mainConfig = config;
                    if (_broadcastChanges) {
                        objExtend({}, config);
                        _sendCfgsyncEvents();
                    }
                }
                if (_extensionConfig.overrideSyncFn) {
                    _overrideSyncFn = _extensionConfig.overrideSyncFn;
                }
                if (_extensionConfig. overrideFetchFn) {
                    _overrideFetchFn = _extensionConfig. overrideFetchFn;
                }
                if ( _extensionConfig.onCfgChangeReceive) {
                    _onCfgChangeReceive = _extensionConfig.onCfgChangeReceive;
                }

                _nonOverrideConfigs = _extensionConfig.nonOverrideConfigs;
                _fetchTimeout = _extensionConfig.scheduleFetchTimeout;
                _retryCnt = 0;
                
                if (_cfgUrl) {
                    _fetchFn = _getFetchFnInterface();
                    _fetchFn && _fetchFn(_cfgUrl, _onFetchComplete, _broadcastChanges);
                }
            }

            function _setCfg(config?: IConfiguration & IConfig, isAutoSync?: boolean) {
                if (config) {
                    _mainConfig = config;
                    if (!!isAutoSync) {
                        return _sendCfgsyncEvents();
                    }
                }
                return false;
            }

            function _eventOff() {
                try {
                    let global = getGlobal();
                    if (global) {
                        eventOff(global, null, null,  _evtNamespace);
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
                    _eventOff();
                    if (name) {
                        _evtName = name;
                        _addEventListener();
                    }
                    return true;
                } catch (e) {
                    // eslint-disable-next-line no-empty
                }
                return false;
            }


            function _getFetchFnInterface() {
                let _fetchFn = _overrideFetchFn;
                if (isNullOrUndefined(_fetchFn)) {
                    if (isFetchSupported()) {
                        _fetchFn = _fetchSender;
                    } else if (isXhrSupported()) {
                        _fetchFn = _xhrSender;
                    }
                }
                return _fetchFn;
            }


            function _fetchSender(url: string, oncomplete: OnCompleteCallback, isAutoSync?:  boolean) {
                let global = getGlobal();
                let fetchFn = (global && global.fetch) || null;
                if (url && fetchFn && isFunction(fetchFn)) {
                    try {
                        const init: RequestInit = {
                            method: STR_GET_METHOD
                        };
                        const request = new Request(url, init);
                       
                        fetch(request).then((response) => {
                          
                            if (response.ok) {
                                response.text().then((text) => {
                                    _doOnComplete(oncomplete, response.status, text, isAutoSync);
                                })
                            } else {
                                _doOnComplete(oncomplete, response.status, null, isAutoSync);
                            }

                        }).catch((error) => {
                            _doOnComplete(oncomplete, 400);
                        });
                       
                    } catch (e) {
                        // eslint-disable-next-line no-empty
                    }
                }
            }

            function _xhrSender(url: string, oncomplete: OnCompleteCallback, isAutoSync?: boolean) {
                try {
                    let xhr = new XMLHttpRequest();
                    xhr.open(STR_GET_METHOD, url);
                    xhr.onreadystatechange = () => {
                        if (xhr.readyState === XMLHttpRequest.DONE) {
                            _doOnComplete(oncomplete, xhr.status, xhr.responseText, isAutoSync);
                        }
                    }
                    xhr.onerror = () => {
                        _doOnComplete(oncomplete, 400);
                    };
                    xhr.ontimeout = () => {
                        _doOnComplete(oncomplete, 400);
                    };
                    xhr.send();
                } catch (e) {
                    // eslint-disable-next-line no-empty
                }
            }

            function _onFetchComplete(status: number, response?: string, isAutoSync?: boolean) {
                try {
                    
                    if (status >= 200 && status < 400 && response) {
                        _retryCnt = 0; // any successful response will reset retry count to 0
                        let JSON = getJSON();
                        if (JSON) {
                            let cfg = JSON.parse(response); //comments are not allowed
                            cfg && _setCfg(cfg, isAutoSync);
                        }
                    } else {
                        _retryCnt ++;
                    }
                    
                    if (_retryCnt < 3) {
                        _setupTimer();
                    }
                    
                } catch (e) {
                    // eslint-disable-next-line no-empty
                }
            }

            function _doOnComplete(oncomplete: OnCompleteCallback, status: number, response?: string, isAutoSync?: boolean) {
                try {
                    oncomplete(status, response, isAutoSync);
                } catch (e) {
                    // eslint-disable-next-line no-empty
                }
            }

            function _addEventListener() {
                if (_receiveChanges) {
                    let global = getGlobal();
                    if (global) {
                        try {
                            eventOn(global, _evtName, (event: any) => {
                                // TODO: add more validation here
                                // may include a "name" or some other features to check
                                let cfgEvent = event && (event as any).detail;
                                if (_onCfgChangeReceive && cfgEvent) {
                                    _onCfgChangeReceive(cfgEvent);
                                } else {
                                    let cfg = cfgEvent && cfgEvent.cfg;
                                    let newCfg = cfg && isPlainObject(cfg) && _replaceTartgetByKeys(cfg);
                                    if (newCfg) {
                                        _mainConfig = newCfg;
                                    }
                                   
                                }
                            }, _evtNamespace, true);

                        } catch(e) {
                            // eslint-disable-next-line no-empty
                        }
                    }
                }
            }
            // 4 levels
            function _replaceTartgetByKeys<T=IConfiguration & IConfig>(cfg: T , level?: number) {
                let _cfg: IConfiguration & IConfig = null;
                try {
                    if (cfg) {
                        _cfg = replaceByNonOverrideCfg(cfg, _nonOverrideConfigs, 0, 5);
                    }
                } catch(e) {
                    // eslint-disable-next-line no-empty
                }
                return _cfg;
            }

            /**
             * Sets up the timer which triggers fetching cdn every 30mins after inital call
             */
            function _setupTimer() {
                if (!_timeoutHandle && _fetchTimeout) {
                    _timeoutHandle = setTimeout(() => {
                        _timeoutHandle = null;
                        _fetchFn(_cfgUrl, _onFetchComplete, _broadcastChanges);
                    }, _fetchTimeout);
                }
            }

            function _clearScheduledTimer() {
                clearTimeout(_timeoutHandle);
                _timeoutHandle = null;
                _retryCnt = 0;
            }
        

            _self.processTelemetry = (env: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => {
                _self.processNext(env, itemCtx);
            };

        });
    }

    public initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Get current configs of current instance.
     * @param config current configs
     */
    public getCfg(): IConfiguration & IConfig {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Manually set configs of current instance.
     * @param config new configs
    */
    public setCfg(config?: IConfiguration & IConfig): boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Manually broadcast configs of current instance to all other instances.
     * @param customDetails additional details should also be sent out to other instances
    */
    public sync(customDetails?: any): boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Manually update event name.
     * If current instance is the main instance, then following config changes will be sent out under this new event name.
     * If current instance is listener instances, it will listen to event details under this new name.
     * @param eventName new event name
     */
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
