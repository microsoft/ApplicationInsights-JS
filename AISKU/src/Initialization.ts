// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

import dynamicProto from "@microsoft/dynamicproto-js";
import { AnalyticsPlugin, ApplicationInsights } from "@microsoft/applicationinsights-analytics-js";
import { Sender } from "@microsoft/applicationinsights-channel-js";
import {
    AnalyticsPluginIdentifier, BreezeChannelIdentifier, ConfigurationManager, ConnectionStringParser, ContextTagKeys, CorrelationIdHelper,
    CtxTagKeys, DEFAULT_BREEZE_ENDPOINT, DEFAULT_BREEZE_PATH, Data, DataSanitizer, DateTimeUtils, DisabledPropertyName,
    DistributedTracingModes, Envelope, Event, Exception, Extensions, FieldType, HttpMethod, IAppInsights, IAutoExceptionTelemetry, IConfig,
    ICorrelationIdHelper, IDataSanitizer, IDateTimeUtils, IDependencyTelemetry, IEventTelemetry, IExceptionTelemetry, IMetricTelemetry,
    IPageViewPerformanceTelemetry, IPageViewTelemetry, IPropertiesPlugin, IRequestHeaders, ITelemetryContext as Common_ITelemetryContext,
    ITraceTelemetry, IUrlHelper, IUtil, Metric, PageView, PageViewPerformance, ProcessLegacy, PropertiesPluginIdentifier,
    RemoteDependencyData, RequestHeaders, SampleRate, SeverityLevel, TelemetryItemCreator, Trace, UrlHelper, Util, parseConnectionString
} from "@microsoft/applicationinsights-common";
import {
    AppInsightsCore, IAppInsightsCore, IChannelControls, IConfiguration, ICookieMgr, ICustomProperties, IDiagnosticLogger,
    IDistributedTraceContext, ILoadedPlugin, INotificationManager, IPlugin, ITelemetryInitializerHandler, ITelemetryItem, ITelemetryPlugin,
    ITelemetryUnloadState, UnloadHandler, _eInternalMessageId, _throwInternal, addPageHideEventListener, addPageUnloadEventListener,
    arrForEach, arrIndexOf, createUniqueNamespace, doPerf, eLoggingSeverity, hasDocument, hasWindow, isArray, isFunction, isNullOrUndefined,
    isReactNative, isString, mergeEvtNamespace, objForEachKey, proxyAssign, proxyFunctions, removePageHideEventListener,
    removePageUnloadEventListener, throwError
} from "@microsoft/applicationinsights-core-js";
import {
    AjaxPlugin as DependenciesPlugin, DependencyInitializerFunction, IDependenciesPlugin, IDependencyInitializerHandler
} from "@microsoft/applicationinsights-dependencies-js";
import {
    DependencyListenerFunction, IDependencyListenerHandler
} from "@microsoft/applicationinsights-dependencies-js/types/DependencyListener";
import { PropertiesPlugin } from "@microsoft/applicationinsights-properties-js";
import {
    STR_ADD_TELEMETRY_INITIALIZER, STR_CLEAR_AUTHENTICATED_USER_CONTEXT, STR_EVT_NAMESPACE, STR_GET_COOKIE_MGR, STR_GET_PLUGIN,
    STR_POLL_INTERNAL_LOGS, STR_SET_AUTHENTICATED_USER_CONTEXT, STR_SNIPPET, STR_START_TRACK_EVENT, STR_START_TRACK_PAGE,
    STR_STOP_TRACK_EVENT, STR_STOP_TRACK_PAGE, STR_TRACK_DEPENDENCY_DATA, STR_TRACK_EVENT, STR_TRACK_EXCEPTION, STR_TRACK_METRIC,
    STR_TRACK_PAGE_VIEW, STR_TRACK_TRACE
} from "./InternalConstants";

export { IUtil, ICorrelationIdHelper, IUrlHelper, IDateTimeUtils, IRequestHeaders };

let _internalSdkSrc: string;

// This is an exclude list of properties that should not be updated during initialization
// They include a combination of private and internal property names
const _ignoreUpdateSnippetProperties = [
    STR_SNIPPET, "dependencies", "properties", "_snippetVersion", "appInsightsNew", "getSKUDefaults"
];

/**
 *
 * @export
 * @interface Snippet
 */
export interface Snippet {
    config: IConfiguration & IConfig;
    queue?: Array<() => void>;
    sv?: string;
    version?: number;
}

export interface IApplicationInsights extends IAppInsights, IDependenciesPlugin, IPropertiesPlugin {
    appInsights: ApplicationInsights;
    flush: (async?: boolean) => void;
    onunloadFlush: (async?: boolean) => void;
    getSender: () => Sender;
    setAuthenticatedUserContext(authenticatedUserId: string, accountId?: string, storeInCookie?: boolean): void;
    clearAuthenticatedUserContext(): void;

    /**
     * Unload and Tear down the SDK and any initialized plugins, after calling this the SDK will be considered
     * to be un-initialized and non-operational, re-initializing the SDK should only be attempted if the previous
     * unload call return `true` stating that all plugins reported that they also unloaded, the recommended
     * approach is to create a new instance and initialize that instance.
     * This is due to possible unexpected side effects caused by plugins not supporting unload / teardown, unable
     * to successfully remove any global references or they may just be completing the unload process asynchronously.
     */
    unload(isAsync?: boolean, unloadComplete?: () => void): void;

    /**
     * Find and return the (first) plugin with the specified identifier if present
     * @param pluginIdentifier
     */
    getPlugin<T extends IPlugin = IPlugin>(pluginIdentifier: string): ILoadedPlugin<T>;
  
    /**
     * Add a new plugin to the installation
     * @param plugin - The new plugin to add
     * @param replaceExisting - should any existing plugin be replaced
     * @param doAsync - Should the add be performed asynchronously
     */
    addPlugin<T extends IPlugin = ITelemetryPlugin>(plugin: T, replaceExisting: boolean, doAsync: boolean, addCb?: (added?: boolean) => void): void;
  
    /**
     * Returns the unique event namespace that should be used when registering events
     */
    evtNamespace(): string;
  
    /**
     * Add a handler that will be called when the SDK is being unloaded
     * @param handler - the handler
     */
    addUnloadCb(handler: UnloadHandler): void;
}

// Re-exposing the Common classes as Telemetry, the list was taken by reviewing the generated code for the build while using
// the previous configuration :-
// import * as Common from "@microsoft/applicationinsights-common"
// export const Telemetry = Common;

let fieldType = {
    Default: FieldType.Default,
    Required: FieldType.Required,
    Array: FieldType.Array,
    Hidden: FieldType.Hidden
};

/**
 * Telemetry type classes, e.g. PageView, Exception, etc
 */
export const Telemetry = {
    __proto__: null as any,
    PropertiesPluginIdentifier,
    BreezeChannelIdentifier,
    AnalyticsPluginIdentifier,
    Util,
    CorrelationIdHelper,
    UrlHelper,
    DateTimeUtils,
    ConnectionStringParser,
    FieldType: fieldType,
    RequestHeaders,
    DisabledPropertyName,
    ProcessLegacy,
    SampleRate,
    HttpMethod,
    DEFAULT_BREEZE_ENDPOINT,
    Envelope,
    Event,
    Exception,
    Metric,
    PageView,
    RemoteDependencyData,
    Trace,
    PageViewPerformance,
    Data,
    SeverityLevel,
    ConfigurationManager,
    ContextTagKeys,
    DataSanitizer: DataSanitizer as IDataSanitizer,
    TelemetryItemCreator,
    CtxTagKeys,
    Extensions,
    DistributedTracingModes
};

/**
 * Application Insights API
 * @class Initialization
 * @implements {IApplicationInsights}
 */
export class Initialization implements IApplicationInsights {
    public snippet: Snippet;
    public config: IConfiguration & IConfig;
    public appInsights: ApplicationInsights;
    public core: IAppInsightsCore;
    public context: Common_ITelemetryContext;

    constructor(snippet: Snippet) {
        // NOTE!: DON'T set default values here, instead set them in the _initDefaults() function as it is also called during teardown()
        let dependencies: DependenciesPlugin;
        let properties: PropertiesPlugin;
        let _sender: Sender;
        let _snippetVersion: string;
        let _evtNamespace: string;
        let _houseKeepingNamespace: string | string[];
        let _core: IAppInsightsCore;
    
        dynamicProto(Initialization, this, (_self) => {
            _initDefaults();

            // initialize the queue and config in case they are undefined
            _snippetVersion = "" + (snippet.sv || snippet.version || "");
            snippet.queue = snippet.queue || [];
            snippet.version = snippet.version || 2.0; // Default to new version
            let config: IConfiguration & IConfig = snippet.config || ({} as any);

            if (config.connectionString) {
                const cs = parseConnectionString(config.connectionString);
                const ingest = cs.ingestionendpoint;
                config.endpointUrl = ingest ? (ingest + DEFAULT_BREEZE_PATH) : config.endpointUrl; // only add /v2/track when from connectionstring
                config.instrumentationKey = cs.instrumentationkey || config.instrumentationKey;
            }

            _self.appInsights = new AnalyticsPlugin();

            properties = new PropertiesPlugin();
            dependencies = new DependenciesPlugin();
            _sender = new Sender();
            _core = new AppInsightsCore();
            _self.core = _core;

            let isErrMessageDisabled = isNullOrUndefined(config.disableIkeyDeprecationMessage)? true:config.disableIkeyDeprecationMessage;
            if (!config.connectionString && !isErrMessageDisabled) {
                _throwInternal(_core.logger,
                    eLoggingSeverity.CRITICAL,
                    _eInternalMessageId.InstrumentationKeyDeprecation,
                    "Instrumentation key support will end soon, see aka.ms/IkeyMigrate");
            }

            _self.snippet = snippet;
            _self.config = config;
            _getSKUDefaults();

            _self.flush = (async: boolean = true) => {
                doPerf(_core, () => "AISKU.flush", () => {
                    arrForEach(_core.getTransmissionControls(), channels => {
                        arrForEach(channels, channel => {
                            channel.flush(async);
                        });
                    });
                }, null, async);
            };

            _self.onunloadFlush = (async: boolean = true) => {
                arrForEach(_core.getTransmissionControls(), channels => {
                    arrForEach(channels, (channel: IChannelControls & Sender) => {
                        if (channel.onunloadFlush) {
                            channel.onunloadFlush();
                        } else {
                            channel.flush(async);
                        }
                    })
                })
            };
        
            _self.loadAppInsights = (legacyMode: boolean = false, logger?: IDiagnosticLogger, notificationManager?: INotificationManager): IApplicationInsights => {
                function _updateSnippetProperties(snippet: Snippet) {
                    if (snippet) {
                        let snippetVer = "";
                        if (!isNullOrUndefined(_snippetVersion)) {
                            snippetVer += _snippetVersion;
                        }
                        if (legacyMode) {
                            snippetVer += ".lg";
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
                                snippet[field as string] = value;
                            }
                        });
                    }
                }
        
                // dont allow additional channels/other extensions for legacy mode; legacy mode is only to allow users to switch with no code changes!
                if (legacyMode && _self.config.extensions && _self.config.extensions.length > 0) {
                    throwError("Extensions not allowed in legacy mode");
                }
        
                doPerf(_self.core, () => "AISKU.loadAppInsights", () => {
                    const extensions: any[] = [];
        
                    extensions.push(_sender);
                    extensions.push(properties);
                    extensions.push(dependencies);
                    extensions.push(_self.appInsights);
        
                    // initialize core
                    _core.initialize(_self.config, extensions, logger, notificationManager);
                    _self.context = properties.context;
                    if (_internalSdkSrc && _self.context) {
                        _self.context.internal.sdkSrc = _internalSdkSrc;
                    }
                    _updateSnippetProperties(_self.snippet);
        
                    // Empty queue of all api calls logged prior to sdk download
                    _self.emptyQueue();
                    _self.pollInternalLogs();
                    _self.addHousekeepingBeforeUnload(_self);
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
                        if (isFunction(this.core.getPlugin)) {
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
                    let excludePageUnloadEvents = appInsightsInstance.appInsights.config.disablePageUnloadEvents;
                    if (!_houseKeepingNamespace) {
                        _houseKeepingNamespace = mergeEvtNamespace(_evtNamespace, _core.evtNamespace && _core.evtNamespace());
                    }

                    if (!appInsightsInstance.appInsights.config.disableFlushOnBeforeUnload) {
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
                            _throwInternal(appInsightsInstance.appInsights.core.logger,
                                eLoggingSeverity.CRITICAL,
                                _eInternalMessageId.FailedToAddHandlerForOnBeforeUnload,
                                "Could not add handler for beforeunload and pagehide");
                        }
                    }
        
                    if (!added && !appInsightsInstance.appInsights.config.disableFlushOnUnload) {
                        // If we didn't add the normal set then attempt to add the pagehide and visibilitychange only
                        addPageHideEventListener(performHousekeeping, excludePageUnloadEvents, _houseKeepingNamespace);
                    }
                }
            };
        
            _self.getSender = (): Sender => {
                return _sender;
            };

            _self.unload = (isAsync?: boolean, unloadComplete?: (unloadState: ITelemetryUnloadState) => void, cbTimeout?: number): void => {
                _self.onunloadFlush(isAsync);

                // Remove any registered event handlers
                if (_houseKeepingNamespace) {
                    removePageUnloadEventListener(null, _houseKeepingNamespace);
                    removePageHideEventListener(null, _houseKeepingNamespace);
                }

                _core.unload && _core.unload(isAsync, unloadComplete, cbTimeout);
            };
        
            proxyFunctions(_self, _self.appInsights, [
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
                "getTraceCtx"
            ]);

            proxyFunctions(_self, () => {
                let context = properties.context;
                return context ? context.user : null;
            }, [
                STR_SET_AUTHENTICATED_USER_CONTEXT,
                STR_CLEAR_AUTHENTICATED_USER_CONTEXT
            ]);
       

            function _getSKUDefaults() {
                _self.config.diagnosticLogInterval =
                    _self.config.diagnosticLogInterval && _self.config.diagnosticLogInterval > 0 ? _self.config.diagnosticLogInterval : 10000;
            }
        
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
     * @param {IEventTelemetry} event
     * @param {ICustomProperties} [customProperties]
     * @memberof Initialization
     */
    public trackEvent(event: IEventTelemetry, customProperties?: ICustomProperties) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Logs that a page, or similar container was displayed to the user.
     * @param {IPageViewTelemetry} pageView
     * @memberof Initialization
     */
    public trackPageView(pageView?: IPageViewTelemetry) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Log a bag of performance information via the customProperties field.
     * @param {IPageViewPerformanceTelemetry} pageViewPerformance
     * @memberof Initialization
     */
    public trackPageViewPerformance(pageViewPerformance: IPageViewPerformanceTelemetry): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Log an exception that you have caught.
     * @param {IExceptionTelemetry} exception
     * @param {{[key: string]: any}} customProperties   Additional data used to filter pages and metrics in the portal. Defaults to empty.
     * @memberof Initialization
     */
    public trackException(exception: IExceptionTelemetry, customProperties?: ICustomProperties): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Manually send uncaught exception telemetry. This method is automatically triggered
     * on a window.onerror event.
     * @param {IAutoExceptionTelemetry} exception
     * @memberof Initialization
     */
    public _onerror(exception: IAutoExceptionTelemetry): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Log a diagnostic scenario such entering or leaving a function.
     * @param {ITraceTelemetry} trace
     * @param {ICustomProperties} [customProperties]
     * @memberof Initialization
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
     * @param {IMetricTelemetry} metric input object argument. Only `name` and `average` are mandatory.
     * @param {ICustomProperties} [customProperties]
     * @memberof Initialization
     */
    public trackMetric(metric: IMetricTelemetry, customProperties?: ICustomProperties): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
    /**
     * Starts the timer for tracking a page load time. Use this instead of `trackPageView` if you want to control when the page view timer starts and stops,
     * but don't want to calculate the duration yourself. This method doesn't send any telemetry. Call `stopTrackPage` to log the end of the page view
     * and send the event.
     * @param name A string that idenfities this item, unique within this HTML document. Defaults to the document title.
     */
    public startTrackPage(name?: string): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Stops the timer that was started by calling `startTrackPage` and sends the pageview load time telemetry with the specified properties and measurements.
     * The duration of the page view will be the time between calling `startTrackPage` and `stopTrackPage`.
     * @param   name  The string you used as the name in startTrackPage. Defaults to the document title.
     * @param   url   String - a relative or absolute URL that identifies the page or other item. Defaults to the window location.
     * @param   properties  map[string, string] - additional data used to filter pages and metrics in the portal. Defaults to empty.
     * @param   measurements    map[string, number] - metrics associated with this page, displayed in Metrics Explorer on the portal. Defaults to empty.
     */
    public stopTrackPage(name?: string, url?: string, customProperties?: { [key: string]: any; }, measurements?: { [key: string]: number; }) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public startTrackEvent(name?: string): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Log an extended event that you started timing with `startTrackEvent`.
     * @param   name    The string you used to identify this event in `startTrackEvent`.
     * @param   properties  map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
     * @param   measurements    map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
     */
    public stopTrackEvent(name: string, properties?: { [key: string]: string; }, measurements?: { [key: string]: number; }) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public addTelemetryInitializer(telemetryInitializer: (item: ITelemetryItem) => boolean | void): ITelemetryInitializerHandler | void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    // Properties Plugin

    /**
     * Set the authenticated user id and the account id. Used for identifying a specific signed-in user. Parameters must not contain whitespace or ,;=|
     *
     * The method will only set the `authenticatedUserId` and `accountId` in the current page view. To set them for the whole session, you should set `storeInCookie = true`
     * @param {string} authenticatedUserId
     * @param {string} [accountId]
     * @param {boolean} [storeInCookie=false]
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
     * @param {IDependencyTelemetry} dependency
     * @memberof Initialization
     */
    public trackDependencyData(dependency: IDependencyTelemetry): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    // Misc

    /**
     * Manually trigger an immediate send of all telemetry still in the buffer.
     * @param {boolean} [async=true]
     * @memberof Initialization
     */
    public flush(async: boolean = true) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Manually trigger an immediate send of all telemetry still in the buffer using beacon Sender.
     * Fall back to xhr sender if beacon is not supported.
     * @param {boolean} [async=true]
     * @memberof Initialization
     */
    public onunloadFlush(async: boolean = true) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Initialize this instance of ApplicationInsights
     * @returns {IApplicationInsights}
     * @memberof Initialization
     */
    public loadAppInsights(legacyMode: boolean = false, logger?: IDiagnosticLogger, notificationManager?: INotificationManager): IApplicationInsights {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Overwrite the lazy loaded fields of global window snippet to contain the
     * actual initialized API methods
     * @param {Snippet} snippet
     * @memberof Initialization
     */
    public updateSnippetDefinitions(snippet: Snippet) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Call any functions that were queued before the main script was loaded
     * @memberof Initialization
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
     */
    public unload(isAsync?: boolean, unloadComplete?: () => void): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    public getPlugin<T extends IPlugin = IPlugin>(pluginIdentifier: string): ILoadedPlugin<T> {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    public addPlugin<T extends IPlugin = ITelemetryPlugin>(plugin: T, replaceExisting: boolean, doAsync: boolean, addCb?: (added?: boolean) => void): void {
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
}

// tslint:disable-next-line
(function () {
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
                for (let idx = 0; idx < cdns.length; idx++) {
                    if (url.indexOf(cdns[idx]) !== -1) {
                        src = "cdn" + (idx + 1);
                        if (url.indexOf("/scripts/") === -1) {
                            if (url.indexOf("/next/") !== -1) {
                                src += "-next";
                            } else if (url.indexOf("/beta/") !== -1) {
                                src += "-beta";
                            }
                        }

                        _internalSdkSrc = src + (isModule ? ".mod" : "");
                        break;
                    }
                }
            }
        } catch (e) {
            // eslint-disable-next-line no-empty
        }
    }
})();
