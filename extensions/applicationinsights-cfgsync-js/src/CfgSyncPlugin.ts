/**
* CfgSyncPlugin.ts
* @copyright Microsoft 2018
*/

import dynamicProto from "@microsoft/dynamicproto-js";
import { DisabledPropertyName, IConfig } from "@microsoft/applicationinsights-common";
import {
    BaseTelemetryPlugin, IAppInsightsCore, IConfigDefaults, IConfiguration, IPlugin, IProcessTelemetryContext,
    IProcessTelemetryUnloadContext, ITelemetryItem, ITelemetryPluginChain, ITelemetryUnloadState, createProcessTelemetryContext,
    createUniqueNamespace, eventOff, eventOn, getGlobal, getJSON, isFetchSupported, isXhrSupported, mergeEvtNamespace, onConfigChange,
    sendCustomEvent
} from "@microsoft/applicationinsights-core-js";
import { doAwaitResponse } from "@nevware21/ts-async";
import { ITimerHandler, isFunction, isNullOrUndefined, isPlainObject, objDeepFreeze, scheduleTimeout } from "@nevware21/ts-utils";
import { applyCdnfeatureCfg, replaceByNonOverrideCfg } from "./CfgSyncHelperFuncs";
import {
    ICfgSyncConfig, ICfgSyncEvent, ICfgSyncMode, NonOverrideCfg, OnCompleteCallback, SendGetFunction
} from "./Interfaces/ICfgSyncConfig";
import { ICfgSyncPlugin } from "./Interfaces/ICfgSyncPlugin";

const EVENT_NAME = "ai_cfgsync";
const STR_GET_METHOD = "GET";
const FETCH_TIMEOUT = 1800000; // 30 minutes
const udfVal: undefined = undefined;
let defaultNonOverrideCfg: NonOverrideCfg  = {instrumentationKey: true, connectionString: true, endpointUrl: true }
const _defaultConfig: IConfigDefaults<ICfgSyncConfig> = objDeepFreeze({
    syncMode: ICfgSyncMode.Broadcast,
    blkCdnCfg: udfVal,
    customEvtName: udfVal,
    cfgUrl: udfVal,
    overrideSyncFn: udfVal,
    overrideFetchFn: udfVal,
    onCfgChangeReceive: udfVal,
    scheduleFetchTimeout: FETCH_TIMEOUT,
    nonOverrideConfigs: defaultNonOverrideCfg,
    enableAjax: false
});

export class CfgSyncPlugin extends BaseTelemetryPlugin implements ICfgSyncPlugin {

    public priority = 198;
    public identifier = "AppInsightsCfgSyncPlugin";

    constructor() {
        super();

        let _extensionConfig: ICfgSyncConfig;
        let _mainConfig: IConfiguration & IConfig; // throttle config should be wrapped in IConfiguration
        let _evtName: string;
        let _evtNamespace: string | string[];
        let _cfgUrl: string;
        let _timeoutHandle: ITimerHandler;
        let _receiveChanges: boolean;
        let _broadcastChanges: boolean;
        let _blkCdnCfg: boolean;
        let _fetchTimeout: number;
        let _retryCnt: number;
        let _onCfgChangeReceive: (event: ICfgSyncEvent) => void;
        let _nonOverrideConfigs: NonOverrideCfg;
        let _fetchFn: SendGetFunction;
        let _overrideFetchFn: SendGetFunction;
        let _overrideSyncFn: (config?:IConfiguration & IConfig, customDetails?: any) => boolean;
        let _paused = false;
        let _enableAjax: boolean;

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

            _self.pause = () => {
                _paused = true;
                _clearScheduledTimer();
            }

            _self.resume = () => {
                _paused = false;
                _setupTimer();
            }

            // used for V2 to manaully trigger config udpate
            _self.setCfg = (config?: IConfiguration & IConfig) => {
                return _setCfg(config);
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
                return [_broadcastChanges, _receiveChanges, _evtName, _blkCdnCfg, _nonOverrideConfigs];
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
                _blkCdnCfg = null;
                _enableAjax = false;
                _overrideFetchFn = null;
                _overrideSyncFn = null;
                _onCfgChangeReceive = null;
            }

            function _populateDefaults(config: IConfiguration) {
                let identifier = _self.identifier;
                let core = _self.core;
               
                _self._addHook(onConfigChange(config, () => {
                    let ctx = createProcessTelemetryContext(null, config, core);
                    _extensionConfig = ctx.getExtCfg(identifier, _defaultConfig);
                    let preBlkCdn = _blkCdnCfg;
                    _blkCdnCfg = !!_extensionConfig.blkCdnCfg;
                    _enableAjax = !!_extensionConfig.enableAjax;
                    // avoid initial call
                    if (!isNullOrUndefined(preBlkCdn) && preBlkCdn !== _blkCdnCfg) {
                        if (!_blkCdnCfg && _cfgUrl) {
                            _fetchFn && _fetchFn(_cfgUrl, _onFetchComplete, _broadcastChanges);
                        } else {
                            _clearScheduledTimer();
                        }
                    }

                    if (isNullOrUndefined(_receiveChanges)) {
                        _receiveChanges = _extensionConfig.syncMode === ICfgSyncMode.Receive;
                    }
                    if (isNullOrUndefined(_broadcastChanges)) {
                        _broadcastChanges = _extensionConfig.syncMode === ICfgSyncMode.Broadcast;
                    }
                   
                    let newEvtName =  _extensionConfig.customEvtName || EVENT_NAME;
                    if (_evtName !== newEvtName) {
                        if (_receiveChanges) {
                            _updateEventListenerName(newEvtName);

                        } else {
                            _eventOff();
                            _evtName = newEvtName;
                        }

                    }

                    if (isNullOrUndefined(_cfgUrl)) {
                        _cfgUrl = _extensionConfig.cfgUrl;
                    }
                    // if cfgUrl is set, we will ignore core config change
                    if (!_cfgUrl) {
                        _mainConfig = config;
                        
                        if (_broadcastChanges) {
                            _sendCfgsyncEvents();
                        }
                    }
                }));
               
                _overrideSyncFn = _extensionConfig.overrideSyncFn;
                _overrideFetchFn = _extensionConfig.overrideFetchFn;
                _onCfgChangeReceive = _extensionConfig.onCfgChangeReceive;
                _nonOverrideConfigs = _extensionConfig.nonOverrideConfigs; // override values should not be changed
               
                _fetchTimeout = _extensionConfig.scheduleFetchTimeout;
                _fetchFn = _getFetchFnInterface();
                _retryCnt = 0;
                
                // NOT support cfgURL change to avoid mutiple fetch calls
                if (_cfgUrl && !_blkCdnCfg) {
                    _fetchFn && _fetchFn(_cfgUrl, _onFetchComplete, _broadcastChanges);
                }
            }

            function _setCfg(config?: IConfiguration & IConfig, isAutoSync?: boolean) {
                if (config) {
                    _mainConfig = config;
                    if (!!isAutoSync && !_paused) {
                        return _sendCfgsyncEvents();
                    }
                    if (_receiveChanges && !_paused) {
                        _self.core.updateCfg(config);
                        return true;
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
                        if (!_enableAjax) {
                            init[DisabledPropertyName] = true;
                        }

                        const request = new Request(url, init);
                        if (!_enableAjax) {
                            try {
                                // Also try and tag the request (just in case the value in init is not copied over)
                                request[DisabledPropertyName] = true;
                            } catch(e) {
                                // If the environment has locked down the XMLHttpRequest (preventExtensions and/or freeze), this would
                                // cause the request to fail and we no telemetry would be sent
                            }
                        }
                  
                        doAwaitResponse(fetch(request), (result) => {
                            let response = result.value;
                          
                            if (!result.rejected) {
                                if (response.ok) {
                                    doAwaitResponse(response.text(), (res) => {
                                        _doOnComplete(oncomplete, response.status, res.value, isAutoSync);
                                    });
                                } else {
                                    _doOnComplete(oncomplete, response.status, null, isAutoSync);
                                }
                            } else {
                                _doOnComplete(oncomplete, 400);
                            }
                        });
                    } catch (e) {
                        // eslint-disable-next-line no-empty
                    }
                }
            }

            function _xhrSender(url: string, oncomplete: OnCompleteCallback, isAutoSync?: boolean) {
                try {
                    let xhr = new XMLHttpRequest();
                    if (!_enableAjax) {
                        xhr[DisabledPropertyName] = true;
                    }
                    xhr.open(STR_GET_METHOD, url);
                    xhr.onreadystatechange = () => {
                        if (xhr.readyState === XMLHttpRequest.DONE) {
                            _doOnComplete(oncomplete, xhr.status, xhr.responseText, isAutoSync);
                        }
                    };
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
                            let cdnCfg = JSON.parse(response); //comments are not allowed
                            let cfg = applyCdnfeatureCfg(cdnCfg, _self.core);
                            let newCfg = cfg && isPlainObject(cfg) && _replaceTartgetByKeys(cfg);
                            newCfg && _setCfg(newCfg, isAutoSync);
                            //cfg && _setCfg(cfg, isAutoSync);
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
                                    newCfg && _setCfg(newCfg);
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
                    _timeoutHandle = scheduleTimeout(() => {
                        _timeoutHandle = null;
                        _fetchFn(_cfgUrl, _onFetchComplete, _broadcastChanges);
                    }, _fetchTimeout);
                    _timeoutHandle.unref();
                }
            }

            function _clearScheduledTimer() {
                _timeoutHandle && _timeoutHandle.cancel();
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
     * @param config - current configs
     */
    public getCfg(): IConfiguration & IConfig {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Manually set configs of current instance.
     * @param config - new configs
    */
    public setCfg(config?: IConfiguration & IConfig): boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Manually broadcast configs of current instance to all other instances.
     * @param customDetails - additional details should also be sent out to other instances
    */
    public sync(customDetails?: any): boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Manually update event name.
     * If current instance is the main instance, then following config changes will be sent out under this new event name.
     * If current instance is listener instances, it will listen to event details under this new name.
     * @param eventName - new event name
     */
    public updateEventListenerName(eventName?: string): boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Pause the sending/receiving of events
     */
    public pause(): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Resume the sending/receiving of events
     */
    public resume(): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
   
    // /**
    //  * Add Part A fields to the event
    //  * @param event - The event that needs to be processed
    //  */
    public processTelemetry(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}
