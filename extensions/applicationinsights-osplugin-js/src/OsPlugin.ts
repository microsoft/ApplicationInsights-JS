/**
* OsPlugin.ts
* @author Siyu Niu (siyuniu)
* @copyright Microsoft 2024
*/
import dynamicProto from "@microsoft/dynamicproto-js";
import { Extensions, IConfig } from "@microsoft/applicationinsights-common";
import {
    BaseTelemetryPlugin, IAppInsightsCore, IConfigDefaults, IConfiguration, IPlugin, IProcessTelemetryContext,
    IProcessTelemetryUnloadContext, ITelemetryItem, ITelemetryUnloadState, _eInternalMessageId, _throwInternal, addPageHideEventListener,
    addPageUnloadEventListener, arrForEach, createProcessTelemetryContext, createUniqueNamespace, eLoggingSeverity, getSetValue,
    mergeEvtNamespace, onConfigChange, removePageHideEventListener, removePageUnloadEventListener, setValue
} from "@microsoft/applicationinsights-core-js";
import { IPromise, doAwaitResponse } from "@nevware21/ts-async";
import { isString, objDeepFreeze } from "@nevware21/ts-utils";
import { IOSPluginConfiguration } from "./DataModels";

const defaultMaxTimeout = 200;
const strExt = "ext";
interface platformVersionInterface {
    platform?: string,
    platformVersion?: string
}
interface UserAgentHighEntropyData {
    platformVersion: platformVersionInterface
}
interface ModernNavigator {
    userAgentData?: {
      getHighEntropyValues?: (fields: ["platformVersion"]) => IPromise<UserAgentHighEntropyData>;
    };
  }
const defaultOSConfig: IConfigDefaults<IOSPluginConfiguration> = objDeepFreeze({
    maxTimeout: defaultMaxTimeout,
    mergeOsNameVersion: undefined
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
        let _maxTimeout: number;

        let _platformVersionResponse: platformVersionInterface;
        let _retrieveFullVersion: boolean;
        let _mergeOsNameVersion: boolean;

        let _eventQueue: IDelayedEvent[];
        let _evtNamespace: string | string[];
        let _excludePageUnloadEvents: string[];

        let _os: string;
        let _osVer: number;
        let _firstAttempt: boolean;
    
        dynamicProto(OsPlugin, this, (_self, _base) => {

            _initDefaults();

            _self.initialize = (coreConfig: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[]) => {
                let _self = this;
                _core = core;
                super.initialize(coreConfig, core, extensions);
                let identifier = _self.identifier;
                _evtNamespace = mergeEvtNamespace(createUniqueNamespace(identifier), core.evtNamespace && core.evtNamespace());

                _platformVersionResponse = JSON.parse(sessionStorage.getItem("ai_osplugin"));
                if(_platformVersionResponse){
                    _retrieveFullVersion = true;
                    _osVer = parseInt(_platformVersionResponse.platformVersion);
                    _os = _platformVersionResponse.platform;
                }
                _self._addHook(onConfigChange(coreConfig, (details)=> {
                    let coreConfig = details.cfg;
                    let ctx = createProcessTelemetryContext(null, coreConfig, core);
                    _ocConfig = ctx.getExtCfg<IOSPluginConfiguration>(identifier, defaultOSConfig);
                    _maxTimeout = _ocConfig.maxTimeout;
                    if (_ocConfig.mergeOsNameVersion !== undefined){
                        _mergeOsNameVersion = _ocConfig.mergeOsNameVersion;
                    } else if (core.getPlugin("Sender").plugin){
                        _mergeOsNameVersion = true;
                    } else {
                        _mergeOsNameVersion = false;
                    }
                  
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

                if (!_retrieveFullVersion && !_getOSInProgress && _firstAttempt) {
                    // Start Requesting OS version process
                    _getOSInProgress = true;
                    startRetrieveOsVersion();
                    _firstAttempt = false;
                }
        
                if (_getOSInProgress) {
                    _eventQueue.push({
                        ctx: itemCtx,
                        item: event
                    });
                } else {
                    updateTeleItemWithOs(event);
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
             * Wait for the response from the browser for the OS version and store info in the session storage
             */
            function startRetrieveOsVersion() {
                // Timeout request if it takes more than 5 seconds (by default)
                _getOSTimeout = setTimeout(() => {
                    _completeOsRetrieve();
                }, _maxTimeout);

                if (navigator.userAgent) {
                    const getHighEntropyValues = (navigator as ModernNavigator).userAgentData?.getHighEntropyValues;
                    if (getHighEntropyValues) {
                        doAwaitResponse(getHighEntropyValues(["platformVersion"]), (response:any) => {
                            if (!response.rejected) {
                                _platformVersionResponse = response.value;
                                _retrieveFullVersion = true;
                                if (_platformVersionResponse.platformVersion && _platformVersionResponse.platform) {
                                    _os = _platformVersionResponse.platform;
                                    _osVer = parseInt(_platformVersionResponse.platformVersion);
                                    if (_os === "Windows"){
                                        if (_osVer == 0){
                                            _osVer = 8;
                                        } else if (_osVer < 13){
                                            _osVer = 10;
                                        } else{
                                            _osVer = 11;
                                        }
                                    }
                                    sessionStorage.setItem("ai_osplugin", JSON.stringify({platform: _os, platformVersion: _osVer}));
                                }
                            } else {
                                _throwInternal(_core.logger,
                                    eLoggingSeverity.CRITICAL,
                                    _eInternalMessageId.PluginException,
                                    "Could not retrieve operating system: " + response.reason);
                            }
                            _completeOsRetrieve();
                        });
                    }
                }
            }

            function updateTeleItemWithOs(event: ITelemetryItem) {
                if (_retrieveFullVersion){
                    let extOS = getSetValue(getSetValue(event, strExt), Extensions.OSExt);
                    if (_mergeOsNameVersion){
                        setValue(extOS, "osVer", _os + _osVer, isString);
                    } else {
                        setValue(extOS, "os", _os, isString);
                        setValue(extOS, "osVer", _osVer, isString);
                    }
                }
            }
        
            /**
            * Complete retrieving operating system info process, cleanup and release the event queue
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
                    updateTeleItemWithOs(evt.item);
                    evt.ctx.processNext(evt.item);
                });
                _eventQueue = [];
            }

            function _initDefaults() {
                _core = null;
                _ocConfig = null;
                _getOSInProgress = false;
                _getOSTimeout = null;
                _maxTimeout = null;
                _retrieveFullVersion = false;
                _eventQueue = [];
                _firstAttempt = true;
            }
            
            // Special internal method to allow the DebugPlugin to hook embedded objects
            _self["_getDbgPlgTargets"] = () => {
                return [_platformVersionResponse, _eventQueue, _getOSInProgress];
            };
        });
    }
    public initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[]) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
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
