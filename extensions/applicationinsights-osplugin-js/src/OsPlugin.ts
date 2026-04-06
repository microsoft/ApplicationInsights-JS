/**
* OsPlugin.ts
* @author Siyu Niu (siyuniu)
* @copyright Microsoft 2024
*/
import dynamicProto from "@microsoft/dynamicproto-js";
import {
    BaseTelemetryPlugin, Extensions, IAppInsightsCore, IConfig, IConfigDefaults, IConfiguration, IPlugin, IProcessTelemetryContext,
    IProcessTelemetryUnloadContext, ITelemetryItem, ITelemetryUnloadState, Undefined, _eInternalMessageId, _throwInternal, addPageHideEventListener,
    addPageUnloadEventListener, arrForEach, createProcessTelemetryContext, createUniqueNamespace, eLoggingSeverity, getSetValue,
    mergeEvtNamespace, onConfigChange, removePageHideEventListener, removePageUnloadEventListener, safeGetLogger, setValue,
    utlGetSessionStorage, utlSetSessionStorage
} from "@microsoft/applicationinsights-core-js";
import { IPromise, doAwaitResponse } from "@nevware21/ts-async";
import { ITimerHandler, asString, fnCall, getNavigator, isString, objDeepFreeze, scheduleTimeout } from "@nevware21/ts-utils";
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

interface ModernNavigator extends Navigator {
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
    public priority = 195;              // Note: we want this to run after the AnalyticsPlugin so that it correctly sets whether we are allowed to use session storage
    public version = "#version#";

    constructor() {
        super();
        let _core: IAppInsightsCore;
        let _ocConfig: IOSPluginConfiguration;
        let _getOSTimeout: ITimerHandler | null;

        let _fetchedFullVersion: boolean;
        let _mergeOsNameVersion: boolean;

        let _eventQueue: IDelayedEvent[];
        let _evtNamespace: string | string[];
        let _excludePageUnloadEvents: string[] | null;
        let _disableFlushOnUnload: boolean;
        let _addedUnloadEvents: boolean;

        let _os: string | undefined | null;
        let _osVer: number | undefined | null;
    
        dynamicProto(OsPlugin, this, (_self, _base) => {

            _initDefaults();

            _self.initialize = (coreConfig: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[]) => {
                let _self = this;
                _core = core;
                super.initialize(coreConfig, core, extensions);
                let identifier = _self.identifier;

                _evtNamespace = mergeEvtNamespace(createUniqueNamespace(identifier), core.evtNamespace && core.evtNamespace());
                _fetchedFullVersion = _fetchCachedOSVersion(coreConfig);

                _self._addHook(onConfigChange(coreConfig, (details)=> {
                    let coreConfig = details.cfg;
                    let ctx = createProcessTelemetryContext(null, coreConfig, core);

                    _ocConfig = ctx.getExtCfg<IOSPluginConfiguration>(identifier, defaultOSConfig);

                    if (_ocConfig.mergeOsNameVersion !== undefined) {
                        _mergeOsNameVersion = _ocConfig.mergeOsNameVersion;
                    } else if (core.getPlugin("Sender").plugin){
                        _mergeOsNameVersion = true;
                    } else {
                        _mergeOsNameVersion = false;
                    }

                    let excludePageUnloadEvents = coreConfig.disablePageUnloadEvents || [];
                    let disableFlushOnUnload = coreConfig.disableFlushOnUnload || false;
                    let removeEvents = _excludePageUnloadEvents && _excludePageUnloadEvents !== excludePageUnloadEvents;

                    if (_disableFlushOnUnload !== disableFlushOnUnload) {
                        removeEvents = true;
                    }

                    if (removeEvents && _addedUnloadEvents) {
                        _removeUnloadHandlers();
                        _excludePageUnloadEvents = null;
                    }
                
                    if (!_excludePageUnloadEvents && !disableFlushOnUnload) {
                        _addUnloadHandlers(excludePageUnloadEvents);
                    }

                    _excludePageUnloadEvents = excludePageUnloadEvents;
                    _disableFlushOnUnload = disableFlushOnUnload;
                }));

                // Automatically start retrieving OS version without waiting for the first telemetry event
                if (!_fetchedFullVersion) {
                    // Start Requesting OS version process
                    _startRetrieveOsVersion(_ocConfig.maxTimeout as number);
                }
            };
        
            _self.processTelemetry = (event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => {
                itemCtx = _self._getTelCtx(itemCtx);

                if (_getOSTimeout) {
                    // We have a timer waiting for the OS version to be retrieved, queue the event
                    _eventQueue.push({
                        ctx: itemCtx,
                        item: event
                    });
                } else {
                    _updateTeleItemWithOs(event);
                    _self.processNext(event, itemCtx);
                }
            };

            _self._doTeardown = (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) => {
                _completeOsRetrieve();
                _removeUnloadHandlers();

                // Just register to remove all events associated with this namespace
                _initDefaults();
            };

            function _fetchCachedOSVersion(coreConfig: IConfiguration & IConfig) {
                let fetched = false;

                // Special case check for if the runtime doesn't include the AnalyticsPlugin
                if(coreConfig.isStorageUseDisabled !== true) {
                    try {
                        let platformVersionResponse: platformVersionInterface = JSON.parse(utlGetSessionStorage(safeGetLogger(_core), "ai_osplugin")) as platformVersionInterface;
                        if (platformVersionResponse) {
                            _os = platformVersionResponse.platform;
                            if (platformVersionResponse.platformVersion) {
                                let ver = parseInt(platformVersionResponse.platformVersion);
                                if (!isNaN(ver)) {
                                    _osVer = ver;
                                }
                            }

                            fetched = !!(_os && _osVer);
                        }
                    } catch (error) {
                        // do nothing
                    }
                }

                return fetched;
            }

            function _storeCachedOSVersion(coreConfig: IConfiguration & IConfig) {
                // Special case check for if the runtime doesn't include the AnalyticsPlugin
                if(coreConfig.isStorageUseDisabled !== true) {
                    try {
                        utlSetSessionStorage(safeGetLogger(_core), "ai_osplugin", JSON.stringify({platform: _os, platformVersion: _osVer}));
                    } catch (error) {
                        // do nothing
                    }
                }
            }

            function _addUnloadHandlers(excludePageUnloadEvents?: string[]) {
                function _unloading() {
                    _releaseEventQueue();
                    _removeUnloadHandlers();
                }

                // Only try and add unload handlers if we haven't already fetched the OS version
                if (!_addedUnloadEvents && !_fetchedFullVersion) {
                    // If page is closed release queue
                    addPageUnloadEventListener(_unloading, excludePageUnloadEvents, _evtNamespace);
                    addPageHideEventListener(_unloading, excludePageUnloadEvents, _evtNamespace);
                    _addedUnloadEvents = true;
                }
            }

            function _removeUnloadHandlers() {
                if (_addedUnloadEvents) {
                    removePageUnloadEventListener(null, _evtNamespace);
                    removePageHideEventListener(null, _evtNamespace);
                    _addedUnloadEvents = false;
                }
            }

            /**
             * Wait for the response from the browser for the OS version and store info in the session storage
             */
            function _startRetrieveOsVersion(maxTimeout: number) {
                if (_core && !_getOSTimeout) {
                    let nav: ModernNavigator | undefined = getNavigator() as ModernNavigator | undefined;
                    let userAgentData = (nav || {}).userAgentData;
                    if (userAgentData) {
                        const getHighEntropyValues = userAgentData.getHighEntropyValues;
                        if (getHighEntropyValues) {
                            // Timeout request if it takes more than 200 milliseconds (by default)
                            _getOSTimeout = scheduleTimeout(() => {
                                _completeOsRetrieve();
                            }, maxTimeout);

                            doAwaitResponse(fnCall(getHighEntropyValues, userAgentData, ["platformVersion"]), (response: any) => {
                                // Always mark as fetched regardless of success or failure
                                _fetchedFullVersion = true;
                                try {
                                    if (!response.rejected) {
                                        let platformVersionResponse = response.value;
                                        if (platformVersionResponse.platformVersion && platformVersionResponse.platform) {
                                            _os = platformVersionResponse.platform;
                                            _osVer = parseInt(platformVersionResponse.platformVersion);
                                            if (_os === "Windows" && !isNaN(_osVer)) {
                                                if (_osVer == 0){
                                                    _osVer = 8;
                                                } else if (_osVer < 13){
                                                    _osVer = 10;
                                                } else{
                                                    _osVer = 11;
                                                }
                                            }

                                            _storeCachedOSVersion((_core || {}).config as IConfig);
                                        }
                                    } else {
                                        _throwInternal(safeGetLogger(_core),
                                            eLoggingSeverity.CRITICAL,
                                            _eInternalMessageId.PluginException,
                                            "Could not retrieve operating system: " + response.reason);
                                    }
                                } finally {
                                    _completeOsRetrieve();
                                }
                            });
                        }
                    }
                }
            }

            function _updateTeleItemWithOs(event: ITelemetryItem) {
                if (_fetchedFullVersion && (_os || _osVer)) {
                    let extOS: any = getSetValue(getSetValue(event, strExt) as any, Extensions.OSExt);
                    if (_mergeOsNameVersion){
                        let mergedOS = (_os || "") + (_osVer ? asString(_osVer) : "");
                        setValue(extOS, "osVer", mergedOS, isString);
                    } else {
                        setValue(extOS, "osVer", _osVer);
                        setValue(extOS, "os", _os, isString);
                    }
                }
            }
        
            /**
            * Complete retrieving operating system info process, cleanup and release the event queue
            */
            function _completeOsRetrieve() {
                if (_getOSTimeout) {
                    _getOSTimeout.cancel();
                    _getOSTimeout = null;
                }

                _removeUnloadHandlers();
                _releaseEventQueue();
            }
        
            /**
            * Release internal event queue
            */
            function _releaseEventQueue() {
                arrForEach(_eventQueue, (evt) => {
                    _updateTeleItemWithOs(evt.item);
                    _self.processNext(evt.item, evt.ctx);
                });
                _eventQueue = [];
            }

            function _initDefaults() {
                _core = null;
                _ocConfig = null;
                _getOSTimeout = null;
                _eventQueue = [];
                _os = null;
                _osVer = null;
                _fetchedFullVersion = false;
                _addedUnloadEvents = false;
                _excludePageUnloadEvents = null;
            }
            
            // Special internal method to allow the DebugPlugin to hook embedded objects
            _self["_getDbgPlgTargets"] = () => {
                return [ { platform: _os, platformVersion: _osVer }, _eventQueue, !!_getOSTimeout];
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
