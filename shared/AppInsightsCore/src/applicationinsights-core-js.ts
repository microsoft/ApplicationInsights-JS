// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import '@microsoft/applicationinsights-shims';
export { IConfiguration } from "./JavaScriptSDK.Interfaces/IConfiguration";
export { IChannelControls, MinChannelPriorty } from "./JavaScriptSDK.Interfaces/IChannelControls";
export { ITelemetryPlugin, IPlugin } from "./JavaScriptSDK.Interfaces/ITelemetryPlugin";
export { IAppInsightsCore } from "./JavaScriptSDK.Interfaces/IAppInsightsCore";
export { ITelemetryItem, ICustomProperties, Tags } from "./JavaScriptSDK.Interfaces/ITelemetryItem";
export { IProcessTelemetryContext } from "./JavaScriptSDK.Interfaces/IProcessTelemetryContext";
export { INotificationListener } from "./JavaScriptSDK.Interfaces/INotificationListener";
export { ITelemetryPluginChain } from "./JavaScriptSDK.Interfaces/ITelemetryPluginChain";
export { IDiagnosticLogger } from "./JavaScriptSDK.Interfaces/IDiagnosticLogger";
export { InstrumentorHooksCallback, IInstrumentHooksCallbacks, IInstrumentHooks, IInstrumentHook, IInstrumentCallDetails } from "./JavaScriptSDK.Interfaces/IInstrumentHooks";
export { EventsDiscardedReason } from "./JavaScriptSDK.Enums/EventsDiscardedReason";
export { SendRequestReason } from "./JavaScriptSDK.Enums/SendRequestReason";
export { AppInsightsCore } from "./JavaScriptSDK/AppInsightsCore";
export { BaseCore } from './JavaScriptSDK/BaseCore';
export { BaseTelemetryPlugin } from './JavaScriptSDK/BaseTelemetryPlugin';
export { CoreUtils, EventHelper, Undefined, normalizeJsName, doPerf } from "./JavaScriptSDK/CoreUtils";
export { 
    getGlobal, getGlobalInst, hasWindow, getWindow, hasDocument, getDocument, 
    hasNavigator, getNavigator, hasHistory, getHistory, getLocation, getPerformance, hasJSON, getJSON,
    isReactNative, getConsole, strUndefined, strObject, strPrototype, strFunction
} from "./JavaScriptSDK/EnvUtils";
export { NotificationManager } from "./JavaScriptSDK/NotificationManager";
export { INotificationManager } from "./JavaScriptSDK.Interfaces/INotificationManager";
export { IPerfEvent } from './JavaScriptSDK.Interfaces/IPerfEvent';
export { IPerfManager, IPerfManagerProvider } from './JavaScriptSDK.Interfaces/IPerfManager';
export { PerfEvent, PerfManager } from './JavaScriptSDK/PerfManager';
export { DiagnosticLogger, _InternalLogMessage } from './JavaScriptSDK/DiagnosticLogger';
export { ProcessTelemetryContext } from './JavaScriptSDK/ProcessTelemetryContext';
export { initializePlugins, sortPlugins } from "./JavaScriptSDK/TelemetryHelpers";
export { _InternalMessageId, LoggingSeverity } from './JavaScriptSDK.Enums/LoggingEnums';
export { InstrumentProto, InstrumentProtos, InstrumentFunc, InstrumentFuncs } from "./JavaScriptSDK/InstrumentHooks";