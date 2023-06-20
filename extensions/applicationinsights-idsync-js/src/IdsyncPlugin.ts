/**
* IdsyncPlugin.ts
* @copyright Microsoft 2018
*/

import dynamicProto from "@microsoft/dynamicproto-js";
import { IConfig } from "@microsoft/applicationinsights-common";
import {
    BaseTelemetryPlugin, IAppInsightsCore, IConfigDefaults, IConfiguration, IPlugin, IProcessTelemetryContext,
    IProcessTelemetryUnloadContext, ITelemetryItem, ITelemetryPluginChain, ITelemetryUnloadState, createProcessTelemetryContext,
    eventOff,
    onConfigChange
} from "@microsoft/applicationinsights-core-js";
import { getDocument, getWindow, objDeepFreeze } from "@nevware21/ts-utils";
import { IIdsyncPlugin } from "./applicationinsights-idsync-js";
import { IIdsyncConfig } from "./Interfaces/IIdsyncConfig";
import { isFunction } from "lodash";

const udfVal: undefined = undefined;

const _defaultConfig: IConfigDefaults<IIdsyncConfig> = objDeepFreeze({
    disableAutoSync: false,
    customEvtNamespace: udfVal,
    overrideSyncFunc: udfVal
});

const evtNamespace = "idsync";

export default class IdSyncPlugin extends BaseTelemetryPlugin implements IIdsyncPlugin {

    public priority = 190; // TODO: Confirm priority numberd
    public identifier = "AppInsightsIdsyncPlugin"; // TODO: Confirm identifier name

    constructor() {
        super();

        let _extensionConfig: IIdsyncConfig;
        let _mainConfig: IConfiguration & IConfig; // throttle config should be wrapped in IConfiguration
        let _isAutoSync: boolean;
        let _evtNamespace: string;
        let _overrideSyncFunc: (config?:IConfiguration & IConfig) => boolean;

        dynamicProto(IdSyncPlugin, this, (_self, _base) => {

            _initDefaults();

            _self.initialize = (config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain) => {
                _base.initialize(config, core, extensions, pluginChain);
                _populateDefaults(config);
            };

            // used for V2 to manaully trigger config udpate
            _self.onMainInstChange = (config?: IConfiguration & IConfig) => {
                if (config) {
                    _mainConfig = config;
                    if (_isAutoSync) {
                        return _sendIdsyncEvents();
                    }
                }
                return false;
            }

            // to allow manually sync config or other events
            // TODO: should change any type here
            _self.sync = (customDetails?: any) => {
                return _sendIdsyncEvents(customDetails);
            }

            _self._doTeardown = (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) => {
                let win = getWindow();
                if (win) {
                    eventOff(win,  _evtNamespace , null);
                }
                _initDefaults();
            };
    
            function _initDefaults() {
                _mainConfig = null;
                _isAutoSync = null;
                _evtNamespace = null;
                _overrideSyncFunc = null;
            }

            // for v3
            function _populateDefaults(config: IConfiguration) {
                let identifier = _self.identifier;
                let core = _self.core;
               
                _self._addHook(onConfigChange(config, () => {
                    let ctx = createProcessTelemetryContext(null, config, core);
                    _extensionConfig = ctx.getExtCfg(identifier, _defaultConfig);
                    _mainConfig = config;
                    _isAutoSync = !_extensionConfig.disableAutoSync;
                    _evtNamespace = _extensionConfig.customEvtNamespace || evtNamespace;
                    _overrideSyncFunc = _extensionConfig.overrideSyncFunc;
                    if (_isAutoSync) {
                        _sendIdsyncEvents();
                    }
                }));
            }

            function _sendIdsyncEvents(customDetails?: string) {
                if (!!_overrideSyncFunc && isFunction(_overrideSyncFunc)) {
                    return _overrideSyncFunc(_mainConfig);
                }
                let win = getWindow();
                let doc = getDocument();
                if (win && doc) {
                    try {
                        let customData = customDetails || null;
                        let event = new CustomEvent( _evtNamespace , {detail: {
                            config: _mainConfig,
                            customDetail: customData
                        }});

                        doc.dispatchEvent(event);
                        return true;
                    } catch(e) {
                        // throw error
                    }
                   
                }
                return false;
            }

            _self.processTelemetry = (env: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => {
                _self.processNext(env, itemCtx);
            };

        });
    }

    public initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public  onMainInstChange(config?: IConfiguration & IConfig): boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    public sync(): boolean {
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
