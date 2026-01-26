// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { strUndefined } from "@microsoft/otel-core-js";
import { getInst } from "@nevware21/ts-utils";
import { ApplicationInsightsContainer } from "./ApplicationInsightsContainer";
import { Snippet } from "./Snippet";

// ----------------------------------------------------------------------------------------------------
// Exports available from the Cdn bundles
// ----------------------------------------------------------------------------------------------------
export {
    AppInsightsSku as ApplicationInsights
} from "./AISku";
export { IApplicationInsights } from "./IApplicationInsights";

export { Snippet };
export {
    LoggingSeverity,
    PerfEvent,
    PerfManager,
    doPerf,
    newId,
    newGuid,
    random32,
    randomValue,
    generateW3CId,
    findW3cTraceParent,
    findMetaTag,
    mergeEvtNamespace,
    eventOn,
    eventOff,
    addEventHandler,
    removeEventHandler,
    isBeaconsSupported
} from "@microsoft/otel-core-js";

export {
    RequestHeaders,
    DisabledPropertyName,
    DEFAULT_BREEZE_ENDPOINT,
    SeverityLevel,
    DistributedTracingModes,
    PropertiesPluginIdentifier,
    BreezeChannelIdentifier,
    AnalyticsPluginIdentifier
} from "@microsoft/otel-core-js";

// ----------------------------------------------------------------------------------------------------
// End of Exports available from the Cdn bundles
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// Additional exports available from applicationinsights-web.ts (interfaces and enums for typedoc)
// ----------------------------------------------------------------------------------------------------
export {
    IConfiguration,
    IAppInsightsCore,
    eLoggingSeverity,
    ITelemetryItem,
    ITelemetryPlugin,
    IPerfEvent,
    IPerfManager,
    IPerfManagerProvider,
    INotificationListener,
    IPlugin,
    IDiagnosticLogger,
    ITelemetryPluginChain,
    ICustomProperties,
    INotificationManager,
    IProcessTelemetryContext,
    ILoadedPlugin
} from "@microsoft/otel-core-js";

export {
    IConfig,
    IDependencyTelemetry,
    IPageViewPerformanceTelemetry,
    IPageViewTelemetry,
    IExceptionTelemetry,
    IAutoExceptionTelemetry,
    ITraceTelemetry,
    IMetricTelemetry,
    IEventTelemetry,
    IAppInsights,
    eSeverityLevel,
    IRequestHeaders,
    EventPersistence
} from "@microsoft/otel-core-js";

export { ISenderConfig } from "@microsoft/applicationinsights-channel-js";

export { IAppInsightsInternal } from "@microsoft/applicationinsights-analytics-js";

export {
    IDependenciesPlugin,
    DependencyListenerFunction,
    DependencyInitializerFunction,
    IDependencyInitializerHandler,
    IDependencyListenerHandler
} from "@microsoft/applicationinsights-dependencies-js";

export {
    ICfgSyncPlugin,
    ICfgSyncConfig,
    ICfgSyncEvent,
    ICfgSyncMode,
    NonOverrideCfg,
    OnCompleteCallback,
    SendGetFunction
} from "@microsoft/applicationinsights-cfgsync-js";

// ----------------------------------------------------------------------------------------------------
// End of Additional exports
// ----------------------------------------------------------------------------------------------------


function _logWarn(aiName:string, message:string) {
    // TODO: Find better place to warn to console when SDK initialization fails
    var _console = getInst<Console>("console");
    if (_console && _console.warn) {
        _console.warn("Failed to initialize AppInsights JS SDK for instance " + (aiName || "<unknown>") + " - " + message);
    }
}

// should be global function that should load as soon as SDK loads
try {

    // E2E sku on load initializes core and pipeline using snippet as input for configuration
    // tslint:disable-next-line: no-var-keyword
    var aiName;
    if (typeof window !== strUndefined) {
        var _window = window;
        aiName = _window["appInsightsSDK"] || "appInsights";
        if (document.currentScript) {
            aiName = document.currentScript.getAttribute("data-ai-name") || aiName;
        }
        if (typeof JSON !== strUndefined) {
            // get snippet or initialize to an empty object

            if (_window[aiName] !== undefined) {
                // this is the typical case for browser+snippet
                const snippet: Snippet = _window[aiName] || ({ version: 2.0 } as any);

                // overwrite snippet with full appInsights
                // only initiaize if required and detected snippet version is >= 2 or not defined
                if ((snippet.version >= 2 && (_window[aiName] as any).initialize) || snippet.version === undefined ) {
                    ApplicationInsightsContainer.getAppInsights(snippet, snippet.version);
                }
            }
        } else {
            _logWarn(aiName, "Missing JSON - you must supply a JSON polyfill!");
        }
    } else {
        _logWarn(aiName, "Missing window");
    }
    // Hack: If legacy SDK exists, skip this step (Microsoft.ApplicationInsights exists).
    // else write what was there for v2 SDK prior to rollup bundle output name change.
    // e.g Microsoft.ApplicationInsights.ApplicationInsights, Microsoft.ApplicationInsights.Telemetry
    // @todo uncomment once integration tests for this can be added
    // if (typeof window !== strUndefined && window && ((window as any).Microsoft && !(window as any).Microsoft.ApplicationInsights)) {
    //     (window as any).Microsoft = (window as any).Microsoft || {};
    //     (window as any).Microsoft.ApplicationInsights = {
    //         ApplicationInsights, Telemetry
    //     };
    // }
} catch (e) {
    _logWarn(aiName, e.message);
}
