// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import dynamicProto from "@microsoft/dynamicproto-js";
import { Sender } from "@microsoft/applicationinsights-channel-js";
import { DEFAULT_BREEZE_PATH, IConfig, parseConnectionString } from "@microsoft/applicationinsights-common";
import {
    AppInsightsCore, IConfiguration, ILoadedPlugin, IPlugin, ITelemetryItem, ITelemetryPlugin, UnloadHandler, isNullOrUndefined,
    proxyFunctions, throwError
} from "@microsoft/applicationinsights-core-js";

/**
 * @export
 * @class ApplicationInsights
 */
export class ApplicationInsights {
    public config: IConfiguration & IConfig;

    /**
     * Creates an instance of ApplicationInsights.
     * @param {IConfiguration & IConfig} config
     * @memberof ApplicationInsights
     */
    constructor(config: IConfiguration & IConfig) {
        let core = new AppInsightsCore();

        // initialize the queue and config in case they are undefined
        if (
            isNullOrUndefined(config) ||
            (isNullOrUndefined(config.instrumentationKey) && isNullOrUndefined(config.connectionString))
        ) {
            throwError("Invalid input configuration");
        }

        dynamicProto(ApplicationInsights, this, (_self) => {
            
            if (config.connectionString) {
                const cs = parseConnectionString(config.connectionString);
                const ingest = cs.ingestionendpoint;
                config.endpointUrl = ingest ? (ingest + DEFAULT_BREEZE_PATH) : config.endpointUrl; // only add /v2/track when from connectionstring
                config.instrumentationKey = cs.instrumentationkey || config.instrumentationKey;
            }

            _self.config = config;
            
            _initialize();
            
            _self.initialize = _initialize;
            
            _self.getSKUDefaults = () => {
                _self.config.diagnosticLogInterval =
                _self.config.diagnosticLogInterval && _self.config.diagnosticLogInterval > 0 ? _self.config.diagnosticLogInterval : 10000;
            };
            _self.getSKUDefaults();

            proxyFunctions(_self, core, [
                "track",
                "flush",
                "pollInternalLogs",
                "stopPollingInternalLogs",
                "unload",
                "getPlugin",
                "addPlugin",
                "evtNamespace",
                "addUnloadCb"
            ]);

            function _initialize(): void {
                core.initialize(_self.config, [new Sender()]);
                core.pollInternalLogs();
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
     * @param {ITelemetryItem} item
     * @memberof ApplicationInsights
     */
    public track(item: ITelemetryItem) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Immediately send all batched telemetry
     * @param {boolean} [async=true]
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

    public getSKUDefaults() {
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
}

export {
    IConfiguration,
    AppInsightsCore,
    IAppInsightsCore,
    CoreUtils,
    ITelemetryItem,
    ILoadedPlugin,
    arrForEach,
    SendRequestReason,
    _eInternalMessageId,
    _InternalMessageId,
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
