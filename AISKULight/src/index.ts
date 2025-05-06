// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import dynamicProto from "@microsoft/dynamicproto-js";
import { Sender } from "@microsoft/applicationinsights-channel-js";
import { DEFAULT_BREEZE_PATH, IConfig, parseConnectionString } from "@microsoft/applicationinsights-common";
import {
    AppInsightsCore, FeatureOptInMode, IConfigDefaults, IConfiguration, IDistributedTraceContext, IDynamicConfigHandler, ILoadedPlugin,
    IPlugin, ITelemetryInitializerHandler, ITelemetryItem, ITelemetryPlugin, ITelemetryUnloadState, IUnloadHook, UnloadHandler,
    WatcherFunction, cfgDfValidate, createDynamicConfig, onConfigChange, proxyFunctions
} from "@microsoft/applicationinsights-core-js";
import { IPromise, createSyncPromise, doAwaitResponse } from "@nevware21/ts-async";
import { isNullOrUndefined, isPromiseLike, isString, objDefine, throwError } from "@nevware21/ts-utils";

const UNDEFINED_VALUE: undefined = undefined;
const defaultConfigValues: IConfigDefaults<IConfiguration> = {
    diagnosticLogInterval: cfgDfValidate(_chkDiagLevel, 10000),
    connectionString: UNDEFINED_VALUE,
    endpointUrl: UNDEFINED_VALUE,
    instrumentationKey: UNDEFINED_VALUE,
    featureOptIn:{
        ["zipPayload"]: {mode: FeatureOptInMode.none}
    },
    extensionConfig: {}
};

function _chkDiagLevel(value: number) {
    // Make sure we have a value > 0
    return value && value > 0;
}


/**
 * @export
 */
export class ApplicationInsights {
    public readonly config: IConfiguration & IConfig;

    /**
     * Creates an instance of ApplicationInsights.
     * @param config - The configuration to use for this ApplicationInsights instance
     */
    constructor(config: IConfiguration & IConfig) {
        let core = new AppInsightsCore();
        let _config: IConfiguration & IConfig;

        // initialize the queue and config in case they are undefined
        if (
            isNullOrUndefined(config) ||
            (isNullOrUndefined(config.instrumentationKey) && isNullOrUndefined(config.connectionString))
        ) {
            throwError("Invalid input configuration");
        }

        dynamicProto(ApplicationInsights, this, (_self) => {
            
            // Define _self.config
            objDefine(_self, "config", {
                g: () => _config
            });

            _initialize();
          
            _self.initialize = _initialize;
            _self.track = _track;
        
            proxyFunctions(_self, core, [
                "flush",
                "pollInternalLogs",
                "stopPollingInternalLogs",
                "unload",
                "getPlugin",
                "addPlugin",
                "evtNamespace",
                "addUnloadCb",
                "onCfgChange",
                "getTraceCtx",
                "updateCfg",
                "addTelemetryInitializer"
            ]);

            function _initialize(): void {
                let cfgHandler: IDynamicConfigHandler<IConfiguration & IConfig> = createDynamicConfig(config || ({} as any), defaultConfigValues);
                _config = cfgHandler.cfg;
    
                core.addUnloadHook(onConfigChange(cfgHandler, () => {
                    let configCs =  _config.connectionString;
                
                    if (isPromiseLike(configCs)) {
                        let ikeyPromise = createSyncPromise<string>((resolve, reject) => {
                            doAwaitResponse(configCs, (res) => {
                                let curCs = res.value;
                                let ikey = _config.instrumentationKey;
                                if (!res.rejected && curCs) {
                                    // replace cs with resolved values in case of circular promises
                                    _config.connectionString = curCs;
                                    let resolvedCs = parseConnectionString(curCs);
                                    ikey = resolvedCs.instrumentationkey || ikey;
                                }
                                resolve(ikey);
                            });

                        });

                        let urlPromise = createSyncPromise<string>((resolve, reject) => {
                            doAwaitResponse(configCs, (res) => {
                                let curCs = res.value;
                                let url = _config.endpointUrl;
                                if (!res.rejected && curCs) {
                                    let resolvedCs = parseConnectionString(curCs);
                                    let ingest = resolvedCs.ingestionendpoint;
                                    url = ingest? ingest + DEFAULT_BREEZE_PATH : url;
                                }
                                resolve(url);
                            });

                        });

                        _config.instrumentationKey = ikeyPromise;
                        _config.endpointUrl = _config.userOverrideEndpointUrl || urlPromise;
                    
                    }
                    
                    if (isString(configCs)) {
                        const cs = parseConnectionString(configCs);
                        const ingest = cs.ingestionendpoint;
                        _config.endpointUrl = _config.userOverrideEndpointUrl ? _config.userOverrideEndpointUrl : (ingest + DEFAULT_BREEZE_PATH); // only add /v2/track when from connectionstring
                        _config.instrumentationKey = cs.instrumentationkey || _config.instrumentationKey;
                    }
                    // userOverrideEndpointUrl have the highest priority
                    _config.endpointUrl = _config.userOverrideEndpointUrl ? _config.userOverrideEndpointUrl : _config.endpointUrl;
                }));
    
                // initialize core
                core.initialize(_config, [new Sender()]);
            }
        });

        function _track(item: ITelemetryItem) {
            if (item) {
                // to pass sender.processTelemetry()
                item.baseData = item.baseData || {};
                item.baseType = item.baseType || "EventData";
            }
            core.track(item);
        }
    }

    /**
     * Initialize this instance of ApplicationInsights
     *
     */
    public initialize(): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Send a manually constructed custom event
     * @param item - The custom event to send
     */
    public track(item: ITelemetryItem) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Immediately send all batched telemetry
     * @param async - Should the flush be performed asynchronously
     */
    public flush(async: boolean = true) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public pollInternalLogs(): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public stopPollingInternalLogs(): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Unload and Tear down the SDK and any initialized plugins, after calling this the SDK will be considered
     * to be un-initialized and non-operational, re-initializing the SDK should only be attempted if the previous
     * unload call return `true` stating that all plugins reported that they also unloaded, the recommended
     * approach is to create a new instance and initialize that instance.
     * This is due to possible unexpected side effects caused by plugins not supporting unload / teardown, unable
     * to successfully remove any global references or they may just be completing the unload process asynchronously.
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

    /**
     * Find and return the (first) plugin with the specified identifier if present
     * @param pluginIdentifier - The identifier of the plugin to search for
     */
    public getPlugin<T extends IPlugin = IPlugin>(pluginIdentifier: string): ILoadedPlugin<T> {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Add a new plugin to the installation
     * @param plugin - The new plugin to add
     * @param replaceExisting - should any existing plugin be replaced
     * @param doAsync - Should the add be performed asynchronously
     */
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
     * Gets the current distributed trace context for this instance if available
     */
    public getTraceCtx(): IDistributedTraceContext | null | undefined {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    public addTelemetryInitializer(telemetryInitializer: (item: ITelemetryItem) => boolean | void): ITelemetryInitializerHandler {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
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
     * Watches and tracks changes for accesses to the current config, and if the accessed config changes the
     * handler will be recalled.
     * @param handler - The handler to call when the configuration changes
     * @returns A watcher handler instance that can be used to remove itself when being unloaded
     */
    public onCfgChange(handler: WatcherFunction<IConfiguration>): IUnloadHook {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }
    
}

export {
    IConfiguration,
    AppInsightsCore,
    IAppInsightsCore,
    ITelemetryItem,
    ILoadedPlugin,
    arrForEach,
    SendRequestReason,
    _eInternalMessageId,
    isNullOrUndefined,
    throwError,
    proxyFunctions,
    IPlugin,
    ITelemetryPlugin,
    IOTelContextManager,
    IOTelContext,
    IOTelSpan,
    IOTelSpanContext,
    IOTelSpanOptions
} from "@microsoft/applicationinsights-core-js";

export {
    SeverityLevel,
    eSeverityLevel,
    IPageViewTelemetry,
    IDependencyTelemetry,
    IAutoExceptionTelemetry,
    IEventTelemetry,
    IMetricTelemetry,
    IPageViewPerformanceTelemetry,
    ITraceTelemetry
} from "@microsoft/applicationinsights-common";
export { Sender, ISenderConfig } from "@microsoft/applicationinsights-channel-js";
