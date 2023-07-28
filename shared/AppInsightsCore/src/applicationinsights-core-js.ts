// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
export { IConfiguration } from "./JavaScriptSDK.Interfaces/IConfiguration";
export { IChannelControls, MinChannelPriorty } from "./JavaScriptSDK.Interfaces/IChannelControls";
export { ITelemetryPlugin, IPlugin } from "./JavaScriptSDK.Interfaces/ITelemetryPlugin";
export { IAppInsightsCore, ILoadedPlugin } from "./JavaScriptSDK.Interfaces/IAppInsightsCore";
export { ITelemetryItem, ICustomProperties, Tags } from "./JavaScriptSDK.Interfaces/ITelemetryItem";
export { IBaseProcessingContext, IProcessTelemetryContext, IProcessTelemetryUnloadContext, IProcessTelemetryUpdateContext, GetExtCfgMergeType } from "./JavaScriptSDK.Interfaces/IProcessTelemetryContext";
export { INotificationListener } from "./JavaScriptSDK.Interfaces/INotificationListener";
export { ITelemetryPluginChain } from "./JavaScriptSDK.Interfaces/ITelemetryPluginChain";
export { IDiagnosticLogger } from "./JavaScriptSDK.Interfaces/IDiagnosticLogger";
export { InstrumentorHooksCallback, IInstrumentHooksCallbacks, IInstrumentHooks, IInstrumentHook, IInstrumentCallDetails } from "./JavaScriptSDK.Interfaces/IInstrumentHooks";
export { IUnloadableComponent } from "./JavaScriptSDK.Interfaces/IUnloadableComponent";
export { eEventsDiscardedReason, EventsDiscardedReason } from "./JavaScriptSDK.Enums/EventsDiscardedReason";
export { SendRequestReason } from "./JavaScriptSDK.Enums/SendRequestReason";
export { TelemetryUpdateReason } from "./JavaScriptSDK.Enums/TelemetryUpdateReason";
export { TelemetryUnloadReason } from "./JavaScriptSDK.Enums/TelemetryUnloadReason";
export { AppInsightsCore } from "./JavaScriptSDK/AppInsightsCore";
export { BaseCore } from "./JavaScriptSDK/BaseCore";
export { BaseTelemetryPlugin } from "./JavaScriptSDK/BaseTelemetryPlugin";
export { randomValue, random32, mwcRandomSeed, mwcRandom32, newId } from "./JavaScriptSDK/RandomHelper";
export {
    CoreUtils, ICoreUtils, EventHelper, IEventHelper, Undefined, newGuid, perfNow, generateW3CId,
    disableCookies, canUseCookies, getCookie, setCookie, deleteCookie, _legacyCookieMgr
} from "./JavaScriptSDK/CoreUtils";
export {
    isTypeof, isUndefined, isNullOrUndefined, hasOwnProperty, isObject, isFunction, normalizeJsName,
    objForEachKey, strEndsWith, strStartsWith, isDate, isArray, isError, isString, isNumber, isBoolean, toISOString, arrForEach, arrIndexOf,
    arrMap, arrReduce, strTrim, objKeys, objDefineAccessors, dateNow, getExceptionName, throwError, strContains, isSymbol,
    setValue, getSetValue, isNotTruthy, isTruthy, proxyAssign, proxyFunctions, proxyFunctionAs, createClassFromInterface, optimizeObject,
    isNotUndefined, isNotNullOrUndefined, objFreeze, objSeal, objExtend, objToString, deepFreeze, isPlainObject
} from "./JavaScriptSDK/HelperFuncs";
export { EnumValue, createEnumStyle, EnumMap, createEnumMap, createValueMap } from "./JavaScriptSDK.Enums/EnumHelperFuncs";
export {
    attachEvent, detachEvent, addEventHandler, addEventListeners, addPageUnloadEventListener, addPageHideEventListener, addPageShowEventListener,
    removeEventHandler, removeEventListeners, removePageUnloadEventListener, removePageHideEventListener, removePageShowEventListener, eventOn, eventOff,
    mergeEvtNamespace, _IRegisteredEvents, __getRegisteredEvents
} from "./JavaScriptSDK/EventHelpers";

export {
    getGlobalInst, hasWindow, getWindow, hasDocument, getDocument, getCrypto, getMsCrypto,
    hasNavigator, getNavigator, hasHistory, getHistory, getLocation, getPerformance, hasJSON, getJSON,
    isReactNative, getConsole, dumpObj, isIE, getIEVersion, isSafari,
    setEnableEnvMocks, isBeaconsSupported, isFetchSupported, useXDomainRequest, isXhrSupported,
    findMetaTag, findNamedServerTiming, sendCustomEvent, dispatchEvent, createCustomDomEvent
} from "./JavaScriptSDK/EnvUtils";
export {
    getGlobal,
    objCreateFn as objCreate,
    strShimPrototype as strPrototype,
    strShimFunction as strFunction,
    strShimUndefined as strUndefined,
    strShimObject as strObject
} from "@microsoft/applicationinsights-shims";
export { NotificationManager } from "./JavaScriptSDK/NotificationManager";
export { INotificationManager } from "./JavaScriptSDK.Interfaces/INotificationManager";
export { IPerfEvent } from "./JavaScriptSDK.Interfaces/IPerfEvent";
export { IPerfManager, IPerfManagerProvider } from "./JavaScriptSDK.Interfaces/IPerfManager";
export { PerfEvent, PerfManager, doPerf, getGblPerfMgr, setGblPerfMgr } from "./JavaScriptSDK/PerfManager";
export { safeGetLogger, DiagnosticLogger, _InternalLogMessage, _throwInternal, _warnToConsole, _logInternalMessage } from "./JavaScriptSDK/DiagnosticLogger";
export {
    ProcessTelemetryContext, createProcessTelemetryContext
    // Explicitly NOT exporting createProcessTelemetryUnloadContext() and createProcessTelemetryUpdateContext() as these should only be created internally
} from "./JavaScriptSDK/ProcessTelemetryContext";
export { initializePlugins, sortPlugins, unloadComponents } from "./JavaScriptSDK/TelemetryHelpers";
export { _InternalMessageId, _eInternalMessageId, LoggingSeverity, eLoggingSeverity } from "./JavaScriptSDK.Enums/LoggingEnums";
export { InstrumentProto, InstrumentProtos, InstrumentFunc, InstrumentFuncs, InstrumentEvent } from "./JavaScriptSDK/InstrumentHooks";
export { ICookieMgr, ICookieMgrConfig } from "./JavaScriptSDK.Interfaces/ICookieMgr";
export {
    createCookieMgr, safeGetCookieMgr, uaDisallowsSameSiteNone, areCookiesSupported
} from "./JavaScriptSDK/CookieMgr";
export { IDbgExtension } from "./JavaScriptSDK.Interfaces/IDbgExtension";
export { getDebugListener, getDebugExt } from "./JavaScriptSDK/DbgExtensionUtils"
export { TelemetryInitializerFunction, ITelemetryInitializerHandler, ITelemetryInitializerContainer } from "./JavaScriptSDK.Interfaces/ITelemetryInitializers";
export { createUniqueNamespace } from "./JavaScriptSDK/DataCacheHelper";
export { UnloadHandler, IUnloadHandlerContainer, createUnloadHandlerContainer } from "./JavaScriptSDK/UnloadHandlerContainer";
export { ITelemetryUpdateState } from "./JavaScriptSDK.Interfaces/ITelemetryUpdateState";
export { ITelemetryUnloadState } from "./JavaScriptSDK.Interfaces/ITelemetryUnloadState";
export { IDistributedTraceContext } from "./JavaScriptSDK.Interfaces/IDistributedTraceContext";
export { ITraceParent } from "./JavaScriptSDK.Interfaces/ITraceParent";
export {
    createTraceParent, parseTraceParent, isValidTraceId, isValidSpanId, isValidTraceParent, isSampledFlag, formatTraceParent, findW3cTraceParent
} from "./JavaScriptSDK/W3cTraceParent";
