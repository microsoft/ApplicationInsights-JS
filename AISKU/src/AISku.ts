// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

import dynamicProto from "@microsoft/dynamicproto-js";
import { AnalyticsPlugin, ApplicationInsights } from "@microsoft/applicationinsights-analytics-js";
import { CfgSyncPlugin, ICfgSyncConfig, ICfgSyncMode } from "@microsoft/applicationinsights-cfgsync-js";
import { Sender } from "@microsoft/applicationinsights-channel-js";
import {
    AnalyticsPluginIdentifier, ConnectionString, DEFAULT_BREEZE_PATH, IAutoExceptionTelemetry, IConfig, IDependencyTelemetry,
    IEventTelemetry, IExceptionTelemetry, IMetricTelemetry, IPageViewPerformanceTelemetry, IPageViewTelemetry, IRequestHeaders,
    ITelemetryContext as Common_ITelemetryContext, IThrottleInterval, IThrottleLimit, IThrottleMgrConfig, ITraceTelemetry,
    PropertiesPluginIdentifier, ThrottleMgr, parseConnectionString
} from "@microsoft/applicationinsights-common";
import {
    AppInsightsCore, FeatureOptInMode, IAppInsightsCore, IChannelControls, IConfigDefaults, IConfiguration, ICookieMgr, ICustomProperties,
    IDiagnosticLogger, IDistributedTraceContext, IDynamicConfigHandler, ILoadedPlugin, INotificationManager, IPlugin,
    ITelemetryInitializerHandler, ITelemetryItem, ITelemetryPlugin, ITelemetryUnloadState, IUnloadHook, UnloadHandler, WatcherFunction,
    _eInternalMessageId, _throwInternal, addPageHideEventListener, addPageUnloadEventListener, cfgDfMerge, cfgDfValidate,
    createDynamicConfig, createProcessTelemetryContext, createUniqueNamespace, doPerf, eLoggingSeverity, hasDocument, hasWindow, isArray,
    isFeatureEnabled, isFunction, isNullOrUndefined, isReactNative, isString, mergeEvtNamespace, onConfigChange, proxyAssign, proxyFunctions,
    removePageHideEventListener, removePageUnloadEventListener
} from "@microsoft/applicationinsights-core-js";
import {
    AjaxPlugin as DependenciesPlugin, DependencyInitializerFunction, DependencyListenerFunction, IDependencyInitializerHandler,
    IDependencyListenerHandler
} from "@microsoft/applicationinsights-dependencies-js";
import { PropertiesPlugin } from "@microsoft/applicationinsights-properties-js";
import { IPromise, createPromise, createSyncPromise, doAwaitResponse } from "@nevware21/ts-async";
import { arrForEach, arrIndexOf, isPromiseLike, objDefine, objForEachKey, strIndexOf, throwUnsupported } from "@nevware21/ts-utils";
import { IApplicationInsights } from "./IApplicationInsights";
import {
    CONFIG_ENDPOINT_URL, SSR_DISABLED_FEATURE, STR_ADD_TELEMETRY_INITIALIZER, STR_CLEAR_AUTHENTICATED_USER_CONTEXT, STR_EVT_NAMESPACE, STR_GET_COOKIE_MGR,
    STR_GET_PLUGIN, STR_POLL_INTERNAL_LOGS, STR_SET_AUTHENTICATED_USER_CONTEXT, STR_SNIPPET, STR_START_TRACK_EVENT, STR_START_TRACK_PAGE,
    STR_STOP_TRACK_EVENT, STR_STOP_TRACK_PAGE, STR_TRACK_DEPENDENCY_DATA, STR_TRACK_EVENT, STR_TRACK_EXCEPTION, STR_TRACK_METRIC,
    STR_TRACK_PAGE_VIEW, STR_TRACK_TRACE
} from "./InternalConstants";
import { Snippet } from "./Snippet";
import { isServerSideRenderingEnvironment } from "./ApplicationInsightsContainer";

export { IRequestHeaders };

let _internalSdkSrc: string;

// This is an exclude list of properties that should not be updated during initialization
// They include a combination of private and internal property names
const _ignoreUpdateSnippetProperties = [
    STR_SNIPPET, "dependencies", "properties", "_snippetVersion", "appInsightsNew", "getSKUDefaults"
];

const IKEY_USAGE = "iKeyUsage";
const CDN_USAGE = "CdnUsage";
const SDK_LOADER_VER = "SdkLoaderVer";
const ZIP_PAYLOAD = "zipPayload";

const UNDEFINED_VALUE: undefined = undefined;

const default_limit = {
    samplingRate: 100,
    maxSendNumber: 1
} as IThrottleLimit;

const default_interval = {
    monthInterval: 3,
    daysOfMonth: [28]
} as IThrottleInterval;

const default_throttle_config = {
    disabled: true,
    limit: cfgDfMerge<IThrottleLimit>(default_limit),
    interval: cfgDfMerge<IThrottleInterval>(default_interval)
} as IThrottleMgrConfig;

// We need to include all properties that we only reference that we want to be dynamically updatable here
// So they are converted even when not specified in the passed configuration
const defaultConfigValues: IConfigDefaults<IConfiguration & IConfig> = {
    connectionString: UNDEFINED_VALUE,
    endpointUrl: UNDEFINED_VALUE,
    instrumentationKey: UNDEFINED_VALUE,
    userOverrideEndpointUrl: UNDEFINED_VALUE,
    diagnosticLogInterval: cfgDfValidate(_chkDiagLevel, 10000),
    featureOptIn:{
        [IKEY_USAGE]: {mode: FeatureOptInMode.enable}, //for versions after 3.1.2 (>= 3.2.0)
        [CDN_USAGE]: {mode: FeatureOptInMode.disable},
        [SDK_LOADER_VER]: {mode: FeatureOptInMode.disable},
        [ZIP_PAYLOAD]: {mode: FeatureOptInMode.none},
        [SSR_DISABLED_FEATURE]: {mode: FeatureOptInMode.disable} // By default, SSR detection is enabled (so this feature is disabled)
    },
    throttleMgrCfg: cfgDfMerge<{[key:number]: IThrottleMgrConfig}>(
        {
            [_eInternalMessageId.DefaultThrottleMsgKey]:cfgDfMerge<IThrottleMgrConfig>(default_throttle_config),
            [_eInternalMessageId.InstrumentationKeyDeprecation]:cfgDfMerge<IThrottleMgrConfig>(default_throttle_config),
            [_eInternalMessageId.SdkLdrUpdate]:cfgDfMerge<IThrottleMgrConfig>(default_throttle_config),
            [_eInternalMessageId.CdnDeprecation]:cfgDfMerge<IThrottleMgrConfig>(default_throttle_config)
        }
    ),
    extensionConfig: cfgDfMerge<{[key: string]: any}>({
        ["AppInsightsCfgSyncPlugin"]: cfgDfMerge<ICfgSyncConfig>({
            cfgUrl: CONFIG_ENDPOINT_URL,
            syncMode: ICfgSyncMode.Receive
        })
    })
};

function _chkDiagLevel(value: number) {
    // Make sure we have a value > 0
    return value && value > 0;
}

function _parseCs(config: IConfiguration & IConfig, configCs: string | IPromise<string>) {
    return createSyncPromise<ConnectionString>((resolve, reject) => {
        doAwaitResponse(configCs, (res) => {
            let curCs = res && res.value;
            let parsedCs = null;
            if (!res.rejected && curCs) {
                // replace cs with resolved values in case of circular promises
                config.connectionString = curCs;
                parsedCs = parseConnectionString(curCs);
            }
            
            // if can't resolve cs promise, null will be returned
            resolve(parsedCs);
        });
    });
}

/**
 * Application Insights API
 * @group Entrypoint
 * @group Classes
 */
export class AppInsightsSku implements IApplicationInsights {
    public snippet: Snippet;

    /**
     * Access to the Dynamic Configuration for the current instance
     */
    public readonly config: IConfiguration & IConfig;

    public readonly appInsights: ApplicationInsights;

    public readonly core: IAppInsightsCore<IConfiguration & IConfig>;

    public readonly context: Common_ITelemetryContext;

    /**
     * An array of the installed plugins that provide a version
     */
    public readonly pluginVersionStringArr: string[];
    
    /**
     * The formatted string of the installed plugins that contain a version number
     */
    public readonly pluginVersionString: string;

    constructor(snippet: Snippet) {
        // NOTE!: DON'T set default values here, instead set them in the _initDefaults() function as it is also called during teardown()
        let dependencies: DependenciesPlugin;
        let properties: PropertiesPlugin;
        let _sender: Sender;
        let _snippetVersion: string;
        let _evtNamespace: string;
        let _houseKeepingNamespace: string | string[];
        let _core: IAppInsightsCore<IConfiguration & IConfig>;
        let _config: IConfiguration & IConfig;
        let _analyticsPlugin: AnalyticsPlugin;
        let _cfgSyncPlugin: CfgSyncPlugin;
        let _throttleMgr: ThrottleMgr;
        let _iKeySentMessage: boolean;
        let _cdnSentMessage: boolean;
        let _sdkVerSentMessage: boolean;

        dynamicProto(AppInsightsSku, this, (_self) => {
            _initDefaults();

            objDefine(_self, "config", {
                g: function() {
                    return _config;
                }
            });

            arrForEach(["pluginVersionStringArr", "pluginVersionString"], (key: keyof AppInsightsSku) => {
                objDefine(_self, key, {
                    g: () => {
                        if (_core) {
                            return _core[key];
                        }
                        
                        return null;
                    }
                });
            });
            
            // initialize the queue and config in case they are undefined
            _snippetVersion = "" + (snippet.sv || snippet.version || "");
            snippet.queue = snippet.queue || [];
            snippet.version = snippet.version || 2.0; // Default to new version
            let cfgHandler: IDynamicConfigHandler<IConfiguration & IConfig> = createDynamicConfig(snippet.config || ({} as any), defaultConfigValues);
            _config = cfgHandler.cfg;

            _analyticsPlugin = new AnalyticsPlugin();

            objDefine(_self, "appInsights", {
                g: () => {
                    return _analyticsPlugin;
                }
            });

            properties = new PropertiesPlugin();
            dependencies = new DependenciesPlugin();
            _sender = new Sender();
            _core = new AppInsightsCore();

            objDefine(_self, "core", {
                g: () => {
                    return _core;
                }
            });

            // Will get recalled if any referenced values are changed
            _addUnloadHook(onConfigChange(cfgHandler, () => {
                let configCs = _config.connectionString;
                
                if (isPromiseLike(configCs)) {
                    let ikeyPromise = createSyncPromise<string>((resolve, reject) => {
                        doAwaitResponse(_parseCs(_config, configCs), (rsp) => {
                            if (!rsp.rejected) {
                                let ikey = _config.instrumentationKey;
                                let cs = rsp.value;
                                ikey = cs && cs.instrumentationkey || ikey;
                                resolve(ikey);
                            } else {
                                // parseCs will always resolve(unless timeout)
                                // return null in case any error happens
                                resolve(null);
                            }
                        });
                    });
                    
                    let url: IPromise<string> | string = _config.userOverrideEndpointUrl;
                    if (isNullOrUndefined(url)) {
                        url = createSyncPromise<string>((resolve, reject) => {
                            doAwaitResponse(_parseCs(_config, configCs), (rsp) => {
                                if (!rsp.rejected) {
                                    let url = _config.endpointUrl;
                                    let cs = rsp.value;
                                    let ingest = cs && cs.ingestionendpoint;
                                    url = ingest? ingest + DEFAULT_BREEZE_PATH : url;
                                    resolve(url);
                                } else {
                                    // parseCs will always resolve(unless timeout)
                                    // return null in case any error happens
                                    resolve(null);
                                }
                            });
                        });
                    }

                    _config.instrumentationKey = ikeyPromise;
                    _config.endpointUrl = url;
                }

                if (isString(configCs) && configCs) {
                    // confirm if promiselike function present
                    // handle cs promise here
                    // add cases to oneNote
                    const cs = parseConnectionString(configCs);
                    const ingest = cs.ingestionendpoint;
                    _config.endpointUrl =  _config.userOverrideEndpointUrl ? _config.userOverrideEndpointUrl : ingest + DEFAULT_BREEZE_PATH; // add /v2/track
                    _config.instrumentationKey = cs.instrumentationkey || _config.instrumentationKey;
                }
                // userOverrideEndpointUrl have the highest priority
                _config.endpointUrl = _config.userOverrideEndpointUrl ? _config.userOverrideEndpointUrl : _config.endpointUrl;
            }));

            _self.snippet = snippet;

            _self.flush = (async: boolean = true, callBack?: () => void) => {
                let result: void | IPromise<void>;

                doPerf(_core, () => "AISKU.flush", () => {
                    if (async && !callBack) {
                        result = createPromise((resolve) => {
                            callBack = resolve;
                        });
                    }

                    let waiting = 1;
                    const flushDone = () => {
                        waiting --;
                        if (waiting === 0) {
                            callBack();
                        }
                    };

                    arrForEach(_core.getChannels(), channel => {
                        if (channel) {
                            waiting++;
                            channel.flush(async, flushDone);
                        }
                    });

                    // decrement the initial "waiting"
                    flushDone();
                }, null, async);

                return result;
            };

            _self.onunloadFlush = (async: boolean = true) => {
                arrForEach(_core.getChannels(), (channel: IChannelControls & Sender) => {
                    if (channel.onunloadFlush) {
                        channel.onunloadFlush();
                    } else {
                        channel.flush(async);
                    }
                });
            };


        
            _self.loadAppInsights = (legacyMode: boolean = false, logger?: IDiagnosticLogger, notificationManager?: INotificationManager): IApplicationInsights => {
                if (legacyMode) {
                    throwUnsupported("Legacy Mode is no longer supported")
                }

                // Check for Server-Side Rendering environments and skip initialization if detected
                const isServerSideEnv = isServerSideRenderingEnvironment();
                const ssrDisabled = isFeatureEnabled(SSR_DISABLED_FEATURE, _config, false);
                if (isServerSideEnv && !ssrDisabled) {
                    // Log a message (if logger is available) mentioning the SDK is not loading in SSR mode
                    if (logger) {
                        logger.warnToConsole("Application Insights SDK is not initializing in server-side rendering environment. " +
                            "This is by design to avoid issues in Angular SSR and similar environments. " +
                            "To disable this check, set the feature flag 'ssr_disabled' to true in the config.");
                    } else if (typeof console !== "undefined" && console) {
                        console.warn("Application Insights SDK is not initializing in server-side rendering environment. " +
                            "This is by design to avoid issues in Angular SSR and similar environments. " +
                            "To disable this check, set the feature flag 'ssr_disabled' to true in the config.");
                    }
                    return _self;
                }

                function _updateSnippetProperties(snippet: Snippet) {
                    if (snippet) {
                        let snippetVer = "";
                        if (!isNullOrUndefined(_snippetVersion)) {
                            snippetVer += _snippetVersion;
                        }
                        if (_self.context && _self.context.internal) {
                            _self.context.internal.snippetVer = snippetVer || "-";
                        }

                        // apply updated properties to the global instance (snippet)
                        objForEachKey(_self, (field, value) => {
                            if (isString(field) &&
                                    !isFunction(value) &&
                                    field && field[0] !== "_" &&                                // Don't copy "internal" values
                                    arrIndexOf(_ignoreUpdateSnippetProperties, field) === -1) {
                                if (snippet[field] !== value) {
                                    snippet[field as string] = value;
                                }
                            }
                        });
                    }
                }

                doPerf(_self.core, () => "AISKU.loadAppInsights", () => {
                    // initialize core
                    _core.initialize(_config, [ _sender, properties, dependencies, _analyticsPlugin, _cfgSyncPlugin], logger, notificationManager);
                    objDefine(_self, "context", {
                        g: () => properties.context
                    });
                    if (!_throttleMgr){
                        _throttleMgr = new ThrottleMgr(_core);
                    }
                    let sdkSrc = _findSdkSourceFile();
                    if (sdkSrc && _self.context) {
                        _self.context.internal.sdkSrc = sdkSrc;
                    }
                    _updateSnippetProperties(_self.snippet);
        
                    // Empty queue of all api calls logged prior to sdk download
                    _self.emptyQueue();
                    _self.pollInternalLogs();
                    _self.addHousekeepingBeforeUnload(_self);

                    _addUnloadHook(onConfigChange(cfgHandler, () => {
                        var defaultEnable = false;
                        if (_config.throttleMgrCfg[_eInternalMessageId.DefaultThrottleMsgKey]){
                            defaultEnable = !_config.throttleMgrCfg[_eInternalMessageId.DefaultThrottleMsgKey].disabled;
                        }

                        if (!_throttleMgr.isReady() && _config.extensionConfig && _config.extensionConfig[_cfgSyncPlugin.identifier] && defaultEnable) {
                            // set ready state to true will automatically trigger flush()
                            _throttleMgr.onReadyState(true);
                        }

                        if (!_iKeySentMessage && !_config.connectionString && isFeatureEnabled(IKEY_USAGE, _config, true)) {
                            _throttleMgr.sendMessage( _eInternalMessageId.InstrumentationKeyDeprecation, "See Instrumentation key support at aka.ms/IkeyMigrate");
                            _iKeySentMessage = true;
                        }

                        if (!_cdnSentMessage && _self.context.internal.sdkSrc && _self.context.internal.sdkSrc.indexOf("az416426") != -1 && isFeatureEnabled(CDN_USAGE, _config, true)) {
                            _throttleMgr.sendMessage( _eInternalMessageId.CdnDeprecation, "See Cdn support notice at aka.ms/JsActiveCdn");
                            _cdnSentMessage = true;
                        }
                       
                        if (!_sdkVerSentMessage && parseInt(_snippetVersion) < 6 && isFeatureEnabled(SDK_LOADER_VER, _config, true)) {
                            _throttleMgr.sendMessage( _eInternalMessageId.SdkLdrUpdate, "An updated Sdk Loader is available, see aka.ms/SnippetVer");
                            _sdkVerSentMessage = true;
                        }
                        
                    }));
                });
                return _self;
            };

            _self.updateSnippetDefinitions = (snippet: Snippet) => {
                // apply full appInsights to the global instance
                // Note: This must be called before loadAppInsights is called
                proxyAssign(snippet, _self, (name: string) => {
                    // Not excluding names prefixed with "_" as we need to proxy some functions like _onError
                    return name && arrIndexOf(_ignoreUpdateSnippetProperties, name) === -1;
                });
            };
        
            _self.emptyQueue = () => {
                // call functions that were queued before the main script was loaded
                try {
                    if (isArray(_self.snippet.queue)) {
                        // note: do not check length in the for-loop conditional in case something goes wrong and the stub methods are not overridden.
                        const length = _self.snippet.queue.length;
                        for (let i = 0; i < length; i++) {
                            const call = _self.snippet.queue[i];
                            call();
                        }
        
                        _self.snippet.queue = undefined;
                        delete _self.snippet.queue;
                    }
                } catch (exception) {
                    const properties: any = {};
                    if (exception && isFunction(exception.toString)) {
                        properties.exception = exception.toString();
                    }
        
                    // need from core
                    // Microsoft.ApplicationInsights._InternalLogging.throwInternal(
                    //     eLoggingSeverity.WARNING,
                    //     _eInternalMessageId.FailedToSendQueuedTelemetry,
                    //     "Failed to send queued telemetry",
                    //     properties);
                }
            };

            _self.addHousekeepingBeforeUnload = (appInsightsInstance: IApplicationInsights): void => {
                // Add callback to push events when the user navigates away
        
                if (hasWindow() || hasDocument()) {
                    const performHousekeeping = () => {
                        // Adds the ability to flush all data before the page unloads.
                        // Note: This approach tries to push a sync request with all the pending events onbeforeunload.
                        // Firefox does not respect this.Other browsers DO push out the call with < 100% hit rate.
                        // Telemetry here will help us analyze how effective this approach is.
                        // Another approach would be to make this call sync with a acceptable timeout to reduce the
                        // impact on user experience.
        
                        // appInsightsInstance.context._sender.triggerSend();
                        appInsightsInstance.onunloadFlush(false);
        
                        // Back up the current session to local storage
                        // This lets us close expired sessions after the cookies themselves expire
                        if (isFunction(_self.core.getPlugin)) {
                            let loadedPlugin = this.core.getPlugin(PropertiesPluginIdentifier);
                            if (loadedPlugin) {
                                let propertiesPlugin: any = loadedPlugin.plugin;
                                if (propertiesPlugin && propertiesPlugin.context && propertiesPlugin.context._sessionManager) {
                                    propertiesPlugin.context._sessionManager.backup();
                                }
                            }
                        }
                    };
        
                    let added = false;

                    if (!_houseKeepingNamespace) {
                        _houseKeepingNamespace = mergeEvtNamespace(_evtNamespace, _core.evtNamespace && _core.evtNamespace());
                    }

                    // Will be recalled if any referenced config properties change
                    _addUnloadHook(onConfigChange(_config, (details) => {
                        let coreConfig = details.cfg;
                        let analyticsPlugin = appInsightsInstance.appInsights;
                        let ctx = createProcessTelemetryContext(null, coreConfig, analyticsPlugin.core);
                        let extConfig = ctx.getExtCfg<IConfig>(analyticsPlugin.identifier || AnalyticsPluginIdentifier);

                        // As we could get recalled, remove any previously registered event handlers first
                        _removePageEventHandlers();

                        let excludePageUnloadEvents = coreConfig.disablePageUnloadEvents;
                        if (!extConfig.disableFlushOnBeforeUnload) {
                            // Hook the unload event for the document, window and body to ensure that the client events are flushed to the server
                            // As just hooking the window does not always fire (on chrome) for page navigation's.
                            if (addPageUnloadEventListener(performHousekeeping, excludePageUnloadEvents, _houseKeepingNamespace)) {
                                added = true;
                            }
            
                            // We also need to hook the pagehide and visibilitychange events as not all versions of Safari support load/unload events.
                            if (addPageHideEventListener(performHousekeeping, excludePageUnloadEvents, _houseKeepingNamespace)) {
                                added = true;
                            }
            
                            // A reactNative app may not have a window and therefore the beforeunload/pagehide events -- so don't
                            // log the failure in this case
                            if (!added && !isReactNative()) {
                                _throwInternal(_core.logger,
                                    eLoggingSeverity.CRITICAL,
                                    _eInternalMessageId.FailedToAddHandlerForOnBeforeUnload,
                                    "Could not add handler for beforeunload and pagehide");
                            }
                        }

                        if (!added && !extConfig.disableFlushOnUnload) {
                            // If we didn't add the normal set then attempt to add the pagehide and visibilitychange only
                            addPageHideEventListener(performHousekeeping, excludePageUnloadEvents, _houseKeepingNamespace);
                        }
                    }));
                }
            };
        
            _self.getSender = (): Sender => {
                return _sender;
            };

            _self.unload = (isAsync?: boolean, unloadComplete?: (unloadState: ITelemetryUnloadState) => void, cbTimeout?: number): void | IPromise<ITelemetryUnloadState> => {
                let unloadDone = false;
                let result: IPromise<ITelemetryUnloadState>;
                if (isAsync && !unloadComplete) {
                    result = createPromise<ITelemetryUnloadState>((resolve) => {
                        // Set the callback to the promise resolve callback
                        unloadComplete = resolve;
                    });
                }

                function _unloadCallback(unloadState: ITelemetryUnloadState) {
                    if (!unloadDone) {
                        unloadDone = true;

                        _initDefaults();
                        unloadComplete && unloadComplete(unloadState);
                    }
                }

                _self.onunloadFlush(isAsync);

                _removePageEventHandlers();

                _core.unload && _core.unload(isAsync, _unloadCallback, cbTimeout);

                return result;
            };
        
            proxyFunctions(_self, _analyticsPlugin, [
                STR_GET_COOKIE_MGR,
                STR_TRACK_EVENT,
                STR_TRACK_PAGE_VIEW,
                "trackPageViewPerformance",
                STR_TRACK_EXCEPTION,
                "_onerror",
                STR_TRACK_TRACE,
                STR_TRACK_METRIC,
                STR_START_TRACK_PAGE,
                STR_STOP_TRACK_PAGE,
                STR_START_TRACK_EVENT,
                STR_STOP_TRACK_EVENT
            ]);

            proxyFunctions(_self, _getCurrentDependencies, [
                STR_TRACK_DEPENDENCY_DATA,
                "addDependencyListener",
                "addDependencyInitializer"
            ]);

            proxyFunctions(_self, _core, [
                STR_ADD_TELEMETRY_INITIALIZER,
                STR_POLL_INTERNAL_LOGS,
                "stopPollingInternalLogs",
                STR_GET_PLUGIN,
                "addPlugin",
                STR_EVT_NAMESPACE,
                "addUnloadCb",
                "getTraceCtx",
                "updateCfg",
                "onCfgChange"
            ]);

            proxyFunctions(_self, () => {
                let context = properties.context;
                return context ? context.user : null;
            }, [
                STR_SET_AUTHENTICATED_USER_CONTEXT,
                STR_CLEAR_AUTHENTICATED_USER_CONTEXT
            ]);
        
            // Using a function to support the dynamic adding / removal of plugins, so this will always return the current value
            function _getCurrentDependencies() {
                return dependencies;
            }

            function _initDefaults() {
                _evtNamespace = createUniqueNamespace("AISKU");
                _houseKeepingNamespace = null;
                dependencies = null;
                properties = null;
                _sender = null;
                _snippetVersion = null;
                _throttleMgr = null;
                _iKeySentMessage = false;
                _cdnSentMessage = false;
                _sdkVerSentMessage = false;
                _cfgSyncPlugin = new CfgSyncPlugin();
            }

            function _removePageEventHandlers() {
                // Remove any registered event handlers
                if (_houseKeepingNamespace) {
                    removePageUnloadEventListener(null, _houseKeepingNamespace);
                    removePageHideEventListener(null, _houseKeepingNamespace);
                }
            }

            function _addUnloadHook(hooks: IUnloadHook | IUnloadHook[] | Iterator<IUnloadHook>) {
                _core.addUnloadHook(hooks);
            }
        });
    }

    // Analytics Plugin

    /**
     * Get the current cookie manager for this instance
     */
    public getCookieMgr(): ICookieMgr {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Log a user action or other occurrence.
     * @param event - event to be sent
     * @param customProperties - properties that would be included as part of the event
     */
    public trackEvent(event: IEventTelemetry, customProperties?: ICustomProperties) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Logs that a page, or similar container was displayed to the user.
     * @param pageView - page view to be sent
     */
    public trackPageView(pageView?: IPageViewTelemetry) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Log a bag of performance information via the customProperties field.
     * @param pageViewPerformance - performance information to be sent
     */
    public trackPageViewPerformance(pageViewPerformance: IPageViewPerformanceTelemetry): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Log an exception that you have caught.
     * @param exception - exception to be sent
     * @param customProperties - Additional data used to filter pages and metrics in the portal. Defaults to empty.
     */
    public trackException(exception: IExceptionTelemetry, customProperties?: ICustomProperties): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Manually send uncaught exception telemetry. This method is automatically triggered
     * on a window.onerror event.
     * @param exception - The exception to be sent.
     */
    public _onerror(exception: IAutoExceptionTelemetry): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Log a diagnostic scenario such entering or leaving a function.
     * @param trace - trace to be sent
     * @param customProperties - Additional custom properties to include in the event.
     */
    public trackTrace(trace: ITraceTelemetry, customProperties?: ICustomProperties): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Log a numeric value that is not associated with a specific event. Typically used
     * to send regular reports of performance indicators.
     *
     * To send a single measurement, just use the `name` and `average` fields
     * of {@link IMetricTelemetry}.
     *
     * If you take measurements frequently, you can reduce the telemetry bandwidth by
     * aggregating multiple measurements and sending the resulting average and modifying
     * the `sampleCount` field of {@link IMetricTelemetry}.
     * @param metric - input object argument. Only `name` and `average` are mandatory.
     * @param customProperties - Additional custom properties to include in the event.
     */
    public trackMetric(metric: IMetricTelemetry, customProperties?: ICustomProperties): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
    /**
     * Starts the timer for tracking a page load time. Use this instead of `trackPageView` if you want to control when the page view timer starts and stops,
     * but don't want to calculate the duration yourself. This method doesn't send any telemetry. Call `stopTrackPage` to log the end of the page view
     * and send the event.
     * @param name - A string that idenfities this item, unique within this HTML document. Defaults to the document title.
     */
    public startTrackPage(name?: string): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Stops the timer that was started by calling `startTrackPage` and sends the pageview load time telemetry with the specified properties and measurements.
     * The duration of the page view will be the time between calling `startTrackPage` and `stopTrackPage`.
     * @param   name  - The string you used as the name in startTrackPage. Defaults to the document title.
     * @param   url   - a relative or absolute URL that identifies the page or other item. Defaults to the window location.
     * @param   properties - additional data used to filter pages and metrics in the portal. Defaults to empty.
     * @param   measurements - metrics associated with this page, displayed in Metrics Explorer on the portal. Defaults to empty.
     */
    public stopTrackPage(name?: string, url?: string, properties?: { [key: string]: string }, measurements?: { [key: string]: number }) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public startTrackEvent(name?: string): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Log an extended event that you started timing with `startTrackEvent`.
     * @param   name  - The string you used to identify this event in `startTrackEvent`.
     * @param   properties - map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
     * @param   measurements -  map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
     */
    public stopTrackEvent(name: string, properties?: { [key: string]: string }, measurements?: { [key: string]: number }) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public addTelemetryInitializer(telemetryInitializer: (item: ITelemetryItem) => boolean | void): ITelemetryInitializerHandler {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    // Properties Plugin

    /**
     * Set the authenticated user id and the account id. Used for identifying a specific signed-in user. Parameters must not contain whitespace or ,;=|
     *
     * The method will only set the `authenticatedUserId` and `accountId` in the current page view. To set them for the whole session, you should set `storeInCookie = true`
     * @param authenticatedUserId - The account ID to set
     * @param accountId - The account ID to set
     * @param storeInCookie - Whether the values should be set for the whole session
     */
    public setAuthenticatedUserContext(authenticatedUserId: string, accountId?: string, storeInCookie = false): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Clears the authenticated user id and account id. The associated cookie is cleared, if present.
     */
    public clearAuthenticatedUserContext(): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    // Dependencies Plugin

    /**
     * Log a dependency call (e.g. ajax)
     * @param dependencyData - dependency data object
     */
    public trackDependencyData(dependency: IDependencyTelemetry): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    // Misc

    /**
     * Attempt to flush data immediately; If executing asynchronously (the default) and
     * you DO NOT pass a callback function then a [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html)
     * will be returned which will resolve once the flush is complete. The actual implementation of the `IPromise`
     * will be a native Promise (if supported) or the default as supplied by [ts-async library](https://github.com/nevware21/ts-async)
     * @param async - send data asynchronously when true
     * @param callBack - if specified, notify caller when send is complete, the channel should return true to indicate to the caller that it will be called.
     * If the caller doesn't return true the caller should assume that it may never be called.
     * @returns - If a callback is provided `true` to indicate that callback will be called after the flush is complete otherwise the caller
     * should assume that any provided callback will never be called, Nothing or if occurring asynchronously a
     * [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html) which will be resolved once the unload is complete,
     * the [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html) will only be returned when no callback is provided
     * and async is true.
     */
    public flush(async?: boolean, callBack?: () => void): void | IPromise<void> {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Manually trigger an immediate send of all telemetry still in the buffer using beacon Sender.
     * Fall back to xhr sender if beacon is not supported.
     * @param [async=true]
     */
    public onunloadFlush(async: boolean = true) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Initialize this instance of ApplicationInsights
     * @returns {IApplicationInsights}
     * @param legacyMode - MUST always be false, it is no longer supported from v3.x onwards
     */
    public loadAppInsights(legacyMode: boolean = false, logger?: IDiagnosticLogger, notificationManager?: INotificationManager): IApplicationInsights {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Overwrite the lazy loaded fields of global window snippet to contain the
     * actual initialized API methods
     * @param snippet - The global snippet
     */
    public updateSnippetDefinitions(snippet: Snippet) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Call any functions that were queued before the main script was loaded
     */
    public emptyQueue() {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public pollInternalLogs(): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public stopPollingInternalLogs(): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public addHousekeepingBeforeUnload(appInsightsInstance: IApplicationInsights): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public getSender(): Sender {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Unload and Tear down the SDK and any initialized plugins, after calling this the SDK will be considered
     * to be un-initialized and non-operational, re-initializing the SDK should only be attempted if the previous
     * unload call return `true` stating that all plugins reported that they also unloaded, the recommended
     * approach is to create a new instance and initialize that instance.
     * This is due to possible unexpected side effects caused by plugins not supporting unload / teardown, unable
     * to successfully remove any global references or they may just be completing the unload process asynchronously.
     * If you pass isAsync as true and do not provide
     * If you pass isAsync as `true` (also the default) and DO NOT pass a callback function then an [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html)
     * will be returned which will resolve once the unload is complete. The actual implementation of the `IPromise`
     * will be a native Promise (if supported) or the default as supplied by [ts-async library](https://github.com/nevware21/ts-async)
     * @param isAsync - Can the unload be performed asynchronously (default)
     * @param unloadComplete - An optional callback that will be called once the unload has completed
     * @param cbTimeout - An optional timeout to wait for any flush operations to complete before proceeding with the
     * unload. Defaults to 5 seconds.
     * @returns Nothing or if occurring asynchronously a [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html)
     * which will be resolved once the unload is complete, the [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html)
     * will only be returned when no callback is provided and isAsync is true
     */
    public unload(isAsync?: boolean, unloadComplete?: (unloadState: ITelemetryUnloadState) => void, cbTimeout?: number): void | IPromise<ITelemetryUnloadState> {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    public getPlugin<T extends IPlugin = IPlugin>(pluginIdentifier: string): ILoadedPlugin<T> {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Add a new plugin to the installation
     * @param plugin - The new plugin to add
     * @param replaceExisting - should any existing plugin be replaced, default is false
     * @param doAsync - Should the add be performed asynchronously
     * @param addCb - [Optional] callback to call after the plugin has been added
     */
    public addPlugin<T extends IPlugin = ITelemetryPlugin>(plugin: T, replaceExisting?: boolean, doAsync?: boolean, addCb?: (added?: boolean) => void): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Update the configuration used and broadcast the changes to all loaded plugins
     * @param newConfig - The new configuration is apply
     * @param mergeExisting - Should the new configuration merge with the existing or just replace it. Default is to merge.
     */
    public updateCfg<T extends IConfiguration = IConfiguration>(newConfig: T, mergeExisting?: boolean): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Returns the unique event namespace that should be used
     */
    public evtNamespace(): string {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Add an unload handler that will be called when the SDK is being unloaded
     * @param handler - the handler
     */
    public addUnloadCb(handler: UnloadHandler): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Add an ajax listener which is called just prior to the request being sent and before the correlation headers are added, to allow you
     * to access the headers and modify the values used to generate the distributed tracing correlation headers. (added in v2.8.4)
     * @param dependencyListener - The Telemetry Initializer function
     * @returns - A IDependencyListenerHandler to enable the initializer to be removed
     */
    public addDependencyListener(dependencyListener: DependencyListenerFunction): IDependencyListenerHandler {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Add an dependency telemetry initializer callback function to allow populating additional properties or drop the request.
     * It is called after the dependency call has completed and any available performance details are available. A dependency
     * initializer is similar to the TelemetryInitializer function but it allows you to block the reporting of the dependency
     * request so that it doesn't count against the `maxAjaxCallsPerView`.
     * @param dependencyInitializer - The Dependency Telemetry Initializer function
     * @returns - A IDependencyInitializerHandler to enable the initializer to be removed
     */
    public addDependencyInitializer(dependencyInitializer: DependencyInitializerFunction): IDependencyInitializerHandler {
        return null;
    }

    /**
     * Gets the current distributed trace context for this instance if available
     */
    public getTraceCtx(): IDistributedTraceContext | null | undefined {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Watches and tracks changes for accesses to the current config, and if the accessed config changes the
     * handler will be recalled.
     * @param handler - The handler to call when the config changes
     * @returns A watcher handler instance that can be used to remove itself when being unloaded
     */
    public onCfgChange(handler: WatcherFunction<IConfiguration>): IUnloadHook {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }
}

// tslint:disable-next-line
export function _findSdkSourceFile() {
    if (_internalSdkSrc) {
        // Use the cached value
        return _internalSdkSrc;
    }

    let sdkSrc = null;
    let isModule = false;
    let cdns: string[] = [
        "://js.monitor.azure.com/",
        "://az416426.vo.msecnd.net/"
    ];

    try {
        // Try and determine whether the sdk is being loaded from the CDN
        // currentScript is only valid during initial processing
        let scrpt = (document || {} as any).currentScript;
        if (scrpt) {
            sdkSrc = scrpt.src;
        // } else {
        //     // We need to update to at least typescript 2.9 for this to work :-(
        //     // Leaving as a stub for now so after we upgrade this breadcrumb is available
        //     let meta = import.meta;
        //     sdkSrc = (meta || {}).url;
        //     isModule = true;
        }
    } catch (e) {
        // eslint-disable-next-line no-empty
    }

    if (sdkSrc) {
        try {
            let url = sdkSrc.toLowerCase();
            if (url) {
                let src = "";
                arrForEach(cdns, (value, idx) => {
                    if (strIndexOf(url, value) !== -1) {
                        src = "cdn" + (idx + 1);
                        if (strIndexOf(url, "/scripts/") === -1) {
                            if (strIndexOf(url, "/next/") !== -1) {
                                src += "-next";
                            } else if (strIndexOf(url, "/beta/") !== -1) {
                                src += "-beta";
                            }
                        }

                        _internalSdkSrc = src + (isModule ? ".mod" : "");
                        return -1;
                    }
                });
            }
        } catch (e) {
            // eslint-disable-next-line no-empty
        }

        // Cache the found value so we don't have to look it up again
        _internalSdkSrc = sdkSrc;
    }

    return _internalSdkSrc;
}
