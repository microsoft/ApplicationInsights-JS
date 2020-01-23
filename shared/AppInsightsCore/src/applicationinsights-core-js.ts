// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
export { IConfiguration } from "./JavaScriptSDK.Interfaces/IConfiguration";
export { IChannelControls, MinChannelPriorty } from "./JavaScriptSDK.Interfaces/IChannelControls";
export { ITelemetryPlugin, IPlugin } from "./JavaScriptSDK.Interfaces/ITelemetryPlugin";
export { IAppInsightsCore } from "./JavaScriptSDK.Interfaces/IAppInsightsCore";
export { ITelemetryItem, ICustomProperties, Tags } from "./JavaScriptSDK.Interfaces/ITelemetryItem";
export { IProcessTelemetryContext } from "./JavaScriptSDK.Interfaces/IProcessTelemetryContext";
export { INotificationListener } from "./JavaScriptSDK.Interfaces/INotificationListener";
export { ITelemetryPluginChain } from "./JavaScriptSDK.Interfaces/ITelemetryPluginChain";
export { IDiagnosticLogger } from "./JavaScriptSDK.Interfaces/IDiagnosticLogger";
export { EventsDiscardedReason } from "./JavaScriptSDK.Enums/EventsDiscardedReason";
export { AppInsightsCore } from "./JavaScriptSDK/AppInsightsCore";
export { BaseCore } from './JavaScriptSDK/BaseCore';
export { BaseTelemetryPlugin } from './JavaScriptSDK/BaseTelemetryPlugin';
export { CoreUtils, EventHelper } from "./JavaScriptSDK/CoreUtils";
export { 
    getGlobal, getGlobalInst, hasWindow, getWindow, hasDocument, getDocument, 
    hasNavigator, getNavigator, hasHistory, getHistory, getLocation, getPerformance, hasJSON, getJSON
} from "./JavaScriptSDK/EnvUtils";
export { NotificationManager } from "./JavaScriptSDK/NotificationManager";
export { INotificationManager } from "./JavaScriptSDK.Interfaces/INotificationManager";
export { DiagnosticLogger, _InternalLogMessage } from './JavaScriptSDK/DiagnosticLogger';
export { ProcessTelemetryContext } from './JavaScriptSDK/ProcessTelemetryContext';
export { initializePlugins, sortPlugins } from "./JavaScriptSDK/TelemetryHelpers";
export { _InternalMessageId, LoggingSeverity } from './JavaScriptSDK.Enums/LoggingEnums';
