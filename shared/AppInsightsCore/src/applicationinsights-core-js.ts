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
export { randomValue, random32, mwcRandomSeed, mwcRandom32 } from './JavaScriptSDK/RandomHelper';
export { CoreUtils, ICoreUtils, EventHelper, IEventHelper, Undefined, addEventHandler, disableCookies, newGuid, perfNow, newId, generateW3CId } from "./JavaScriptSDK/CoreUtils";
export {
    isTypeof, isUndefined, isNullOrUndefined, hasOwnProperty, isObject, isFunction, attachEvent, detachEvent, normalizeJsName, 
    objForEachKey, strEndsWith, isDate, isArray, isError, isString, isNumber, isBoolean, toISOString, arrForEach, arrIndexOf, 
    arrMap, arrReduce, strTrim, objKeys, objDefineAccessors, dateNow, getExceptionName, throwError, strContains,
    setValue, getSetValue, isNotTruthy, isTruthy, proxyAssign
} from './JavaScriptSDK/HelperFuncs';
export { 
    getGlobal, getGlobalInst, hasWindow, getWindow, hasDocument, getDocument, getCrypto, getMsCrypto,
    hasNavigator, getNavigator, hasHistory, getHistory, getLocation, getPerformance, hasJSON, getJSON,
    isReactNative, getConsole, dumpObj, isIE, getIEVersion, strUndefined, strObject, strPrototype, strFunction
} from "./JavaScriptSDK/EnvUtils";
export {
    objCreateFn as objCreate
} from '@microsoft/applicationinsights-shims';
export { NotificationManager } from "./JavaScriptSDK/NotificationManager";
export { INotificationManager } from "./JavaScriptSDK.Interfaces/INotificationManager";
export { IPerfEvent } from './JavaScriptSDK.Interfaces/IPerfEvent';
export { IPerfManager, IPerfManagerProvider } from './JavaScriptSDK.Interfaces/IPerfManager';
export { PerfEvent, PerfManager, doPerf } from './JavaScriptSDK/PerfManager';
export { DiagnosticLogger, _InternalLogMessage } from './JavaScriptSDK/DiagnosticLogger';
export { ProcessTelemetryContext } from './JavaScriptSDK/ProcessTelemetryContext';
export { initializePlugins, sortPlugins } from "./JavaScriptSDK/TelemetryHelpers";
export { _InternalMessageId, LoggingSeverity } from './JavaScriptSDK.Enums/LoggingEnums';
export { InstrumentProto, InstrumentProtos, InstrumentFunc, InstrumentFuncs } from "./JavaScriptSDK/InstrumentHooks";
export { strIKey, strExtensionConfig } from './JavaScriptSDK/Constants';
