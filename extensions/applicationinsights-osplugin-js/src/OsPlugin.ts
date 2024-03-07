/**
* OsPlugin.ts
* @author Siyu Niu (siyuniu)
* @copyright Microsoft 2024
*/
import dynamicProto from "@microsoft/dynamicproto-js";
import {
    BaseTelemetryPlugin, IAppInsightsCore, IConfigDefaults, IExtendedConfiguration, IPlugin, IProcessTelemetryContext,
    IProcessTelemetryUnloadContext, ITelemetryItem, ITelemetryUnloadState, _eExtendedInternalMessageId, _throwInternal,
    addPageHideEventListener, addPageUnloadEventListener, arrForEach, createProcessTelemetryContext, createUniqueNamespace, eLoggingSeverity,
    mergeEvtNamespace, onConfigChange, removePageHideEventListener, removePageUnloadEventListener, setProcessTelemetryTimings
} from "@microsoft/1ds-core-js";
import { doAwaitResponse } from "@nevware21/ts-async";
import { objDeepFreeze, objDefineAccessors } from "@nevware21/ts-utils";
import { IOSPluginConfiguration } from "./DataModels";

const defaultgetOSTimeoutMs = 5000;
interface platformVersionInterface {
    brands?: { brand: string, version: string }[],
    mobile?: boolean,
    platform?: string,
    platformVersion?: string

}
interface UserAgentHighEntropyData {
    platformVersion: platformVersionInterface
}
interface ModernNavigator {
    userAgentData?: {
      getHighEntropyValues?: (fields: ["platformVersion"]) => Promise<UserAgentHighEntropyData>;
    };
  }
const defaultOSConfig: IConfigDefaults<IOSPluginConfiguration> = objDeepFreeze({
    getOSTimeoutMs: defaultgetOSTimeoutMs
});

interface IDelayedEvent {
    ctx: IProcessTelemetryContext;
    item: ITelemetryItem;
}

export class OsPlugin extends BaseTelemetryPlugin {
    public identifier = "OsPlugin";
    public priority = 195;
    public version = "#version#";

    constructor() {
        super();
        let _core: IAppInsightsCore;
        let _ocConfig: IOSPluginConfiguration;
        let _getOSInProgress: boolean;
        let _getOSTimeout: any;
        let _getOSTimeoutMs: number;

        let _platformVersion: platformVersionInterface;
        let _retrieveFullVersion: boolean;

        let _eventQueue: IDelayedEvent[];
        let _evtNamespace: string | string[];
        let _excludePageUnloadEvents: string[];

        let _os: string;
        let _osVer: number;
    
        dynamicProto(OsPlugin, this, (_self, _base) => {

            _initDefaults();

            _self.initialize = (coreConfig: IExtendedConfiguration, core: IAppInsightsCore, extensions: IPlugin[]) => {
                let _self = this;
                _core = core;
                super.initialize(coreConfig, core, extensions);
                let identifier = _self.identifier;
                _evtNamespace = mergeEvtNamespace(createUniqueNamespace(identifier), core.evtNamespace && core.evtNamespace());

                _self._addHook(onConfigChange(coreConfig, (details)=> {
                    let coreConfig = details.cfg;
                    let ctx = createProcessTelemetryContext(null, coreConfig, core);
                    _ocConfig = ctx.getExtCfg<IOSPluginConfiguration>(identifier, defaultOSConfig);
                    _getOSTimeoutMs = _ocConfig.getOSTimeoutMs;
                  
                    let excludePageUnloadEvents = coreConfig.disablePageUnloadEvents || [];

                    if (_excludePageUnloadEvents && _excludePageUnloadEvents !== excludePageUnloadEvents) {
                        removePageUnloadEventListener(null, _evtNamespace);
                        removePageHideEventListener(null, _evtNamespace);
                        _excludePageUnloadEvents = null;
                    }
                   
                    if (!_excludePageUnloadEvents) {
                        // If page is closed release queue
                        addPageUnloadEventListener(_doUnload, excludePageUnloadEvents, _evtNamespace);
                        addPageHideEventListener(_doUnload, excludePageUnloadEvents, _evtNamespace);
                    }
                    _excludePageUnloadEvents = excludePageUnloadEvents;
                }));
                function _doUnload() {
                    _releaseEventQueue();
                }
            };
        
            _self.processTelemetry = (event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => {
                itemCtx = _self._getTelCtx(itemCtx);
                setProcessTelemetryTimings(event, _self.identifier);
                // has not yet get the OS version
                if (!_retrieveFullVersion) {
                    // Start Requesting OS version
                    _getOSInProgress = true;
                    // Timeout handshake if it takes more than 5 seconds
                    _getOSTimeout = setTimeout(() => {
                        _completeOsRetrieve();
                    }, _getOSTimeoutMs);
                    startRetrieveOsVersion();
                }
        
                if (_getOSInProgress) {
                    _eventQueue.push({
                        ctx: itemCtx,
                        item: event
                    });
                } else {
                    event.ext.os = _os;
                    event.ext.osVer = _osVer;
                    _self.processNext(event, itemCtx);
                }
            };

            _self._doTeardown = (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) => {
                _completeOsRetrieve();
                removePageUnloadEventListener(null, _evtNamespace);
                removePageHideEventListener(null, _evtNamespace);
                // Just register to remove all events associated with this namespace
                _initDefaults();
            };

        
            /**
             * Attaches to message, to receive responses from Collector.
             */
            function startRetrieveOsVersion() {
                console.log("startRetrieveOsVersion");
                if (navigator.userAgent && navigator.userAgent.indexOf("Windows") > 0) {
                    const getHighEntropyValues = (navigator as ModernNavigator).userAgentData?.getHighEntropyValues;
                    if (getHighEntropyValues) {
                        doAwaitResponse(getHighEntropyValues(["platformVersion"]), (response:any) => {
                            console.log("response", JSON.stringify(response));
                            if (!response.rejected) {
                                let result = response.value;
                                _retrieveFullVersion = true;
                                console.log("getplatformVersion", JSON.stringify(result.platformVersion));
                                _platformVersion = result.platformVersion;
                                if (_platformVersion.platformVersion && _platformVersion.platform) {
                                    _os = _platformVersion.platform;
                                    _osVer = parseInt(_platformVersion.platformVersion);
                                    if (_os == "Windows"){
                                        if (_osVer >= 13){
                                            _osVer = 11;
                                        } else {
                                            _osVer = 10;
                                        }
                                    }
                                }
                            } else {
                                _throwInternal(_self.diagLog(),
                                    eLoggingSeverity.CRITICAL,
                                    _eExtendedInternalMessageId.AuthHandShakeError, "Error with os detection process: " + response.reason
                                );
                            }
                            _completeOsRetrieve();
                        });
                    }
                }
            }
        
            /**
            * Complete auth handhshake, cleanup and release the event queue
            */
            function _completeOsRetrieve() {
                if (_getOSTimeout) {
                    clearTimeout(_getOSTimeout);
                }
                _getOSInProgress = false;
                _releaseEventQueue();
            }
        
            /**
            * Release internal event queue
            */
            function _releaseEventQueue() {
                arrForEach(_eventQueue, (evt) => {
                    if (evt.item){
                        evt.item.ext.os = _os;
                        evt.item.ext.osVer = _osVer;
                        evt.ctx.processNext(evt.item);
                    }
                });
                _eventQueue = [];
            }

            function _initDefaults() {
                _core = null;
                _ocConfig = null;
                _getOSInProgress = false;
                _getOSTimeout = null;
                _getOSTimeoutMs = null;
                _retrieveFullVersion = false;
                _eventQueue = [];
            }

            // For backward compatibility
            objDefineAccessors(_self, "_platformVersion", () => _platformVersion);
            objDefineAccessors(_self, "_eventQueue", () => _eventQueue);
            objDefineAccessors(_self, "_getOSInProgress", () => _getOSInProgress);
            objDefineAccessors(_self, "_evtNamespace", () => "." + _evtNamespace);
        });
    }

    public initialize(coreConfig: IExtendedConfiguration, core: IAppInsightsCore, extensions: IPlugin[]) {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }

    /**
     * Process the event and add it to an internal queue if handshake in process
     * @param event - The event to process
     * @param itemCtx - This is the context for the current request, ITelemetryPlugin instances
     * can optionally use this to access the current core instance or define / pass additional information
     * to later plugins (vs appending items to the telemetry item)
     */
    public processTelemetry(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }


}
