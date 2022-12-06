// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import dynamicProto from "@microsoft/dynamicproto-js";
import { Sender } from "@microsoft/applicationinsights-channel-js";
import { DEFAULT_BREEZE_PATH, IConfig, parseConnectionString } from "@microsoft/applicationinsights-common";
import {
    AppInsightsCore, IConfigDefaults, IConfiguration, IDynamicConfigHandler, ILoadedPlugin, IPlugin, ITelemetryItem, ITelemetryPlugin,
    IUnloadHook, UnloadHandler, WatcherFunction, createDynamicConfig, onConfigChange, proxyFunctions
} from "@microsoft/applicationinsights-core-js";
import { objDefineProp } from "@nevware21/ts-utils";

const defaultConfigValues: IConfigDefaults<IConfiguration> = {
    diagnosticLogInterval: { isVal: _chkDiagLevel, v: 10000 }
};

function _chkDiagLevel(value: number) {
    // Make sure we have a value > 0
    return value && value > 0;
}

/**
 * @export
 * @class ApplicationInsights
 */
export class ApplicationInsights {
    public readonly config: IConfiguration & IConfig;

    /**
     * Creates an instance of ApplicationInsights.
     * @param config
     * @memberof ApplicationInsights
     */
    constructor(config: IConfiguration & IConfig) {
        let core = new AppInsightsCore();
        let _config: IConfiguration & IConfig;

        dynamicProto(ApplicationInsights, this, (_self) => {

            // Define _self.config
            objDefineProp(_self, "config", {
                configurable: true,
                enumerable: true,
                get: () => _config
            });

            _initialize();
          
            _self.initialize = _initialize;
        
            proxyFunctions(_self, core, [
                "track",
                "flush",
                "pollInternalLogs",
                "stopPollingInternalLogs",
                "unload",
                "getPlugin",
                "addPlugin",
                "evtNamespace",
                "addUnloadCb",
                "onCfgChange"
            ]);

            function _initialize(): void {
                let cfgHandler: IDynamicConfigHandler<IConfiguration & IConfig> = createDynamicConfig(config || ({} as any), defaultConfigValues);
                _config = cfgHandler.cfg;
    
                core.addUnloadHook(onConfigChange(cfgHandler, () => {
                    console.log(_config.connectionString)
                    if (_config.connectionString) {
                        const cs = parseConnectionString(_config.connectionString);
                        const ingest = cs.ingestionendpoint;
                        _config.endpointUrl = ingest ? (ingest + DEFAULT_BREEZE_PATH) : _config.endpointUrl; // only add /v2/track when from connectionstring
                        _config.instrumentationKey = cs.instrumentationkey || _config.instrumentationKey;
                    }
                }));
    
                // initialize core
                core.initialize(_config, [new Sender()]);
            }
        });
    }

    /**
     * Initialize this instance of ApplicationInsights
     *
     * @memberof ApplicationInsights
     */
    public initialize(): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Send a manually constructed custom event
     *
     * @param item
     * @memberof ApplicationInsights
     */
    public track(item: ITelemetryItem) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Immediately send all batched telemetry
     * @param [async=true]
     * @memberof ApplicationInsights
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
     */
    public unload(isAsync?: boolean, unloadComplete?: () => void): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Find and return the (first) plugin with the specified identifier if present
     * @param pluginIdentifier
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
     * Watches and tracks changes for accesses to the current config, and if the accessed config changes the
     * handler will be recalled.
     * @param handler
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
    ITelemetryPlugin
    
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
export { Sender } from "@microsoft/applicationinsights-channel-js";
