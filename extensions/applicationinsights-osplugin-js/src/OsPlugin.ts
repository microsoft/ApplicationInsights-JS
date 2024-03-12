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
import { doAwaitResponse } from "@nevware21/ts-async";
import { objDeepFreeze, objDefineAccessors } from "@nevware21/ts-utils";
import { IOSPluginConfiguration } from "./DataModels";

const defaultgetOSTimeoutMs = 5000;
const strExt = "ext";
const maxRetry = 3;
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
    getOSTimeoutMs: defaultgetOSTimeoutMs,
    endpointIsBreeze: true
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

        let _platformVersionResponse: platformVersionInterface;
        let _retrieveFullVersion: boolean;
        let _endpointIsBreeze: boolean;

        let _eventQueue: IDelayedEvent[];
        let _evtNamespace: string | string[];
        let _excludePageUnloadEvents: string[];

        let _os: string;
        let _osVer: number;
        let _retryTime: number;
    
        dynamicProto(OsPlugin, this, (_self, _base) => {

            _initDefaults();

            _self.initialize = (coreConfig: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[]) => {
                let _self = this;
                _core = core;
                super.initialize(coreConfig, core, extensions);
                let identifier = _self.identifier;
                _evtNamespace = mergeEvtNamespace(createUniqueNamespace(identifier), core.evtNamespace && core.evtNamespace());

                _os = sessionStorage.getItem("ai_os");
                _osVer = parseInt(sessionStorage.getItem("ai_osVer"));
                if(_os && _osVer){
                    _retrieveFullVersion = true;
                }
                _self._addHook(onConfigChange(coreConfig, (details)=> {
                    let coreConfig = details.cfg;
                    let ctx = createProcessTelemetryContext(null, coreConfig, core);
                    _ocConfig = ctx.getExtCfg<IOSPluginConfiguration>(identifier, defaultOSConfig);
                    _getOSTimeoutMs = _ocConfig.getOSTimeoutMs;
                    _endpointIsBreeze = _ocConfig.endpointIsBreeze;
                  
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

                if (!_retrieveFullVersion && !_getOSInProgress && _retryTime < maxRetry) {
                    // Start Requesting OS version process
                    _getOSInProgress = true;
                    // Timeout request if it takes more than 5 seconds (by default)
                    _getOSTimeout = setTimeout(() => {
                        _completeOsRetrieve();
                    }, _getOSTimeoutMs);
                    startRetrieveOsVersion();
                    _retryTime++;
                }
        
                if (_getOSInProgress) {
                    _eventQueue.push({
                        ctx: itemCtx,
                        item: event
                    });
                } else {
                    if (_retrieveFullVersion){
                        if (_endpointIsBreeze){
                            setValue(getSetValue(event, strExt), Extensions.OSExt, _os + _osVer);
                        } else {
                            setValue(getSetValue(event, strExt), Extensions.OSExt, _os);
                            setValue(getSetValue(event, strExt), "osVer", _osVer);
                        }
                    }
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
                                    sessionStorage.setItem("ai_os", _os);
                                    sessionStorage.setItem("ai_osVer", _osVer.toString());
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
                    if (_retrieveFullVersion){
                        if (_endpointIsBreeze){
                            setValue(getSetValue(evt.item, strExt), Extensions.OSExt, _os + _osVer);
                        } else {
                            setValue(getSetValue(evt.item, strExt), Extensions.OSExt, _os);
                            setValue(getSetValue(evt.item, strExt), "osVer", _osVer);
                        }
                    }
                    evt.ctx.processNext(evt.item);
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
                _retryTime = 0;
            }

            // For backward compatibility
            objDefineAccessors(_self, "_platformVersionResponse", () => _platformVersionResponse);
            objDefineAccessors(_self, "_eventQueue", () => _eventQueue);
            objDefineAccessors(_self, "_getOSInProgress", () => _getOSInProgress);
            objDefineAccessors(_self, "_evtNamespace", () => "." + _evtNamespace);
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
