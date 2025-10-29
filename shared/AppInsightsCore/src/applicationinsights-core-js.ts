// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
export {
    IConfiguration, IAppInsightsCore, IDiagnosticLogger,
    IChannelControls, MinChannelPriorty, IInternalOfflineSupport,
    IChannelControlsHost,
    ITelemetryPlugin, IPlugin,
    IExceptionConfig,
    ILoadedPlugin,
    ITelemetryItem, ICustomProperties, Tags,
    IBaseProcessingContext, IProcessTelemetryContext, IProcessTelemetryUnloadContext, IProcessTelemetryUpdateContext,
    INotificationListener,
    ITelemetryPluginChain,
    InstrumentorHooksCallback, IInstrumentHooksCallbacks, IInstrumentHooks, IInstrumentHook, IInstrumentCallDetails,
    IUnloadableComponent,
    IPayloadData, SendPOSTFunction, IXHROverride, OnCompleteCallback,
    IUnloadHook, ILegacyUnloadHook,
    eEventsDiscardedReason, EventsDiscardedReason, eBatchDiscardedReason, BatchDiscardedReason,
    SendRequestReason, TransportType,
    TelemetryUpdateReason,
    TelemetryUnloadReason,
    eActiveStatus, ActiveStatus,
    IXDomainRequest, IBackendResponse,
    _ISenderOnComplete, _ISendPostMgrConfig, _ITimeoutOverrideWrapper, _IInternalXhrOverride,
    createEnumStyle,
    INotificationManager,
    IPerfEvent,
    IPerfManager, IPerfManagerProvider,
    IFeatureOptInDetails, IFeatureOptIn,
    FeatureOptInMode, CdnFeatureMode,
    _eInternalMessageId, _InternalMessageId, LoggingSeverity, eLoggingSeverity,
    ICookieMgr, ICookieMgrConfig,
    IDbgExtension,
    TelemetryInitializerFunction, ITelemetryInitializerHandler, ITelemetryInitializerContainer,
    ITelemetryUpdateState,
    ITelemetryUnloadState,
    IDistributedTraceContext,
    ITraceParent,
    IConfigCheckFn, IConfigDefaultCheck, IConfigDefaults, IConfigSetFn,
    IDynamicConfigHandler,
    IDynamicPropertyHandler,
    IWatchDetails, IWatcherHandler, WatcherFunction,
    eW3CTraceFlags,
    IW3cTraceState,
    createUniqueNamespace
} from "@microsoft/applicationinsights-common";
export { throwAggregationError } from "./JavaScriptSDK/AggregationError";
export { AppInsightsCore } from "./JavaScriptSDK/AppInsightsCore";
export { BaseTelemetryPlugin } from "./JavaScriptSDK/BaseTelemetryPlugin";
export { randomValue, random32, mwcRandomSeed, mwcRandom32, newId, newGuid, generateW3CId } from "@microsoft/applicationinsights-common";
export { runTargetUnload, doUnloadAll } from "./JavaScriptSDK/AsyncUtils";
export {
    normalizeJsName, toISOString, getExceptionName, strContains, setValue, getSetValue,
    proxyAssign, proxyFunctions, proxyFunctionAs, createClassFromInterface, optimizeObject,
    isNotUndefined, isNotNullOrUndefined, objExtend, isFeatureEnabled, getResponseText, formatErrorMessageXdr, formatErrorMessageXhr, prependTransports,
    openXhr, _appendHeader, _getAllResponseHeaders, convertAllHeadersToMap, setObjStringTag, setProtoTypeName
} from "@microsoft/applicationinsights-common";
export { parseResponse } from "./JavaScriptSDK/ResponseHelpers";
export { SenderPostManager } from "./JavaScriptSDK/SenderPostManager";
export {
    isArray, isTypeof, isUndefined, isNullOrUndefined, objHasOwnProperty as hasOwnProperty, isObject, isFunction,
    strEndsWith, strStartsWith, isDate, isError, isString, isNumber, isBoolean, arrForEach, arrIndexOf,
    arrReduce, arrMap, strTrim, objKeys, objDefineAccessors, throwError, isSymbol,
    isNotTruthy, isTruthy, objFreeze, objSeal, objToString, objDeepFreeze as deepFreeze,
    getInst as getGlobalInst, hasWindow, getWindow, hasDocument, getDocument, hasNavigator, getNavigator, hasHistory,
    getHistory, dumpObj, asString, objForEachKey, getPerformance, utcNow as dateNow, perfNow
} from "@nevware21/ts-utils";
export {
    attachEvent, detachEvent, addEventHandler, addEventListeners, addPageUnloadEventListener, addPageHideEventListener, addPageShowEventListener,
    removeEventHandler, removeEventListeners, removePageUnloadEventListener, removePageHideEventListener, removePageShowEventListener, eventOn, eventOff,
    mergeEvtNamespace, _IRegisteredEvents, __getRegisteredEvents
} from "./JavaScriptSDK/EventHelpers";

export {
    getCrypto, getMsCrypto, getLocation, hasJSON, getJSON,
    isReactNative, getConsole, isIE, getIEVersion, isSafari,
    setEnableEnvMocks, isBeaconsSupported, isFetchSupported, useXDomainRequest, isXhrSupported,
    findMetaTag, findNamedServerTiming, sendCustomEvent, dispatchEvent, createCustomDomEvent, fieldRedaction,
    findW3cTraceParent, findW3cTraceState
} from "@microsoft/applicationinsights-common";
export {
    getGlobal,
    strShimPrototype as strPrototype,
    strShimFunction as strFunction,
    strShimUndefined as strUndefined,
    strShimObject as strObject
} from "@microsoft/applicationinsights-shims";
export { NotificationManager } from "./JavaScriptSDK/NotificationManager";
export { PerfEvent, PerfManager, doPerf, getGblPerfMgr, setGblPerfMgr } from "./JavaScriptSDK/PerfManager";
export { safeGetLogger, DiagnosticLogger, _InternalLogMessage, _warnToConsole, _logInternalMessage, _throwInternal } from "./Diagnostics/DiagnosticLogger";
export {
    ProcessTelemetryContext, createProcessTelemetryContext
    // Explicitly NOT exporting createProcessTelemetryUnloadContext() and createProcessTelemetryUpdateContext() as these should only be created internally
} from "./JavaScriptSDK/ProcessTelemetryContext";
export { initializePlugins, sortPlugins, unloadComponents, createDistributedTraceContext } from "./JavaScriptSDK/TelemetryHelpers";
export { InstrumentProto, InstrumentProtos, InstrumentFunc, InstrumentFuncs, InstrumentEvent } from "./JavaScriptSDK/InstrumentHooks";
export {
    createCookieMgr, safeGetCookieMgr, uaDisallowsSameSiteNone, areCookiesSupported
} from "./JavaScriptSDK/CookieMgr";
export { getDebugListener, getDebugExt } from "./JavaScriptSDK/DbgExtensionUtils"
export { UnloadHandler, IUnloadHandlerContainer, createUnloadHandlerContainer } from "./JavaScriptSDK/UnloadHandlerContainer";
export { IUnloadHookContainer, createUnloadHookContainer,  _testHookMaxUnloadHooksCb } from "./JavaScriptSDK/UnloadHookContainer";
export { ThrottleMgr } from "./Diagnostics/ThrottleMgr";

// Dynamic Config definitions
export { createDynamicConfig, onConfigChange } from "./Config/DynamicConfig";
export { getDynamicConfigHandler, blockDynamicConversion, forceDynamicConversion } from "./Config/DynamicSupport";
export { cfgDfValidate, cfgDfMerge, cfgDfBoolean, cfgDfFunc, cfgDfString, cfgDfSet, cfgDfBlockPropValue } from "./Config/ConfigDefaultHelpers";

// OpenTelemetry interface exports (re-exported from @microsoft/otel-core-js)
export {
    IOTelContextManager,
    IOTelContext,
    IOTelSpan,
    IOTelSpanContext,
    IOTelSpanOptions
} from "@microsoft/otel-core-js";
