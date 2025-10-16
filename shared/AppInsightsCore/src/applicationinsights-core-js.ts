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
    EnumValue, createEnumStyle, createValueMap,
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
export { randomValue, random32, mwcRandomSeed, mwcRandom32, newId } from "@microsoft/applicationinsights-common";
export { Undefined, newGuid, generateW3CId } from "./JavaScriptSDK/CoreUtils";
export { runTargetUnload, doUnloadAll } from "./JavaScriptSDK/AsyncUtils";
export {
    normalizeJsName, toISOString, getExceptionName, strContains, setValue, getSetValue,
    proxyAssign, proxyFunctions, proxyFunctionAs, createClassFromInterface, optimizeObject,
    isNotUndefined, isNotNullOrUndefined, objExtend, isFeatureEnabled, getResponseText, formatErrorMessageXdr, formatErrorMessageXhr, prependTransports,
    openXhr, _appendHeader, _getAllResponseHeaders, convertAllHeadersToMap, setObjStringTag, setProtoTypeName
} from "@microsoft/applicationinsights-common";
export { parseResponse } from "./JavaScriptSDK/ResponseHelpers";
export { SenderPostManager } from "./JavaScriptSDK/SenderPostManager";
//export { IStatsBeat, IStatsBeatConfig, IStatsBeatKeyMap as IStatsBeatEndpoints, IStatsBeatState} from "./JavaScriptSDK.Interfaces/IStatsBeat";
//export { IStatsEventData } from "./JavaScriptSDK.Interfaces/IStatsEventData";
//export { IStatsMgr, IStatsMgrConfig } from "./JavaScriptSDK.Interfaces/IStatsMgr";
//export { createStatsMgr } from "./JavaScriptSDK/StatsBeat";
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
    findMetaTag, findNamedServerTiming, sendCustomEvent, dispatchEvent, createCustomDomEvent, fieldRedaction
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
export { safeGetLogger, DiagnosticLogger, _InternalLogMessage, _warnToConsole, _logInternalMessage } from "./Diagnostics/DiagnosticLogger";
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
export {
    createTraceParent, parseTraceParent, isValidTraceId, isValidSpanId, isValidTraceParent, isSampledFlag, formatTraceParent, findW3cTraceParent,
    findAllScripts
} from "./JavaScriptSDK/W3cTraceParent";

// Dynamic Config definitions
export { createDynamicConfig, onConfigChange } from "./Config/DynamicConfig";
export { getDynamicConfigHandler, blockDynamicConversion, forceDynamicConversion } from "./Config/DynamicSupport";
export { cfgDfValidate, cfgDfMerge, cfgDfBoolean, cfgDfFunc, cfgDfString, cfgDfSet, cfgDfBlockPropValue } from "./Config/ConfigDefaultHelpers";

// W3c TraceState support
export { createW3cTraceState, findW3cTraceState, isW3cTraceState, snapshotW3cTraceState } from "./JavaScriptSDK/W3cTraceState";

// ==========================================================================
// OpenTelemetry exports
// ==========================================================================

// Context
export { createContextManager } from "./OpenTelemetry/context/contextManager";
export { createContext } from "./OpenTelemetry/context/context";

// Enums
export { eOTelSamplingDecision, OTelSamplingDecision } from "./OpenTelemetry/enums/trace/OTelSamplingDecision";
export { eOTelSpanKind, OTelSpanKind } from "./OpenTelemetry/enums/trace/OTelSpanKind";
export { eOTelSpanStatusCode, OTelSpanStatusCode } from "./OpenTelemetry/enums/trace/OTelSpanStatus";

// OpenTelemetry Attribute Support
export { eAttributeChangeOp, AttributeChangeOp } from "./OpenTelemetry/enums/eAttributeChangeOp";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

// Config
export { IOTelAttributeLimits } from "./OpenTelemetry/interfaces/config/IOTelAttributeLimits";
export { IOTelConfig } from "./OpenTelemetry/interfaces/config/IOTelConfig";
export { IOTelErrorHandlers } from "./OpenTelemetry/interfaces/config/IOTelErrorHandlers";
export { IOTelTraceCfg } from "./OpenTelemetry/interfaces/config/IOTelTraceCfg";

// Context
export { IOTelContextManager } from "./OpenTelemetry/interfaces/context/IOTelContextManager";
export { IOTelContext } from "./OpenTelemetry/interfaces/context/IOTelContext";

// Noop Support
export { INoopProxyConfig } from "./OpenTelemetry/interfaces/noop/INoopProxyConfig";

// Resources
export { IOTelResource, OTelMaybePromise, OTelRawResourceAttribute } from "./OpenTelemetry/interfaces/resources/IOTelResource";

// Baggage
export { IOTelBaggage } from "./OpenTelemetry/interfaces/baggage/IOTelBaggage";
export { IOTelBaggageEntry } from "./OpenTelemetry/interfaces/baggage/IOTelBaggageEntry";
export { OTelBaggageEntryMetadata, otelBaggageEntryMetadataSymbol } from "./OpenTelemetry/interfaces/baggage/OTelBaggageEntryMetadata";

// Trace
export { IOTelIdGenerator } from "./OpenTelemetry/interfaces/trace/IOTelIdGenerator";
export { IOTelInstrumentationScope } from "./OpenTelemetry/interfaces/trace/IOTelInstrumentationScope";
export { IOTelLink } from "./OpenTelemetry/interfaces/trace/IOTelLink";
export { IOTelTracerCtx } from "./OpenTelemetry/interfaces/trace/IOTelTracerCtx";
export { IOTelTraceState } from "./OpenTelemetry/interfaces/trace/IOTelTraceState";
export { IReadableSpan } from "./OpenTelemetry/interfaces/trace/IReadableSpan";
export { IOTelSampler } from "./OpenTelemetry/interfaces/trace/IOTelSampler";
export { IOTelSamplingResult } from "./OpenTelemetry/interfaces/trace/IOTelSamplingResult";
export { IOTelSpan } from "./OpenTelemetry/interfaces/trace/IOTelSpan";
export { IOTelSpanContext } from "./OpenTelemetry/interfaces/trace/IOTelSpanContext";
export { IOTelSpanOptions } from "./OpenTelemetry/interfaces/trace/IOTelSpanOptions";
export { IOTelSpanStatus } from "./OpenTelemetry/interfaces/trace/IOTelSpanStatus";
export { IOTelTimedEvent } from "./OpenTelemetry/interfaces/trace/IOTelTimedEvent";
export { IOTelTracerProvider } from "./OpenTelemetry/interfaces/trace/IOTelTracerProvider";
export { IOTelTracer } from "./OpenTelemetry/interfaces/trace/IOTelTracer";
export { IOTelTracerOptions } from "./OpenTelemetry/interfaces/trace/IOTelTracerOptions";

// Noop
export { createNoopContextMgr } from "./OpenTelemetry/noop/noopContextMgr";
export { _noopThis, _noopVoid } from "./OpenTelemetry/noop/noopHelpers";
export { createNoopProxy } from "./OpenTelemetry/noop/noopProxy";
export { createNoopTracerProvider } from "./OpenTelemetry/noop/noopTracerProvider";

// Trace
export { createNonRecordingSpan } from "./OpenTelemetry/trace/nonRecordingSpan";
export { isSpanContext, wrapDistributedTrace, createOTelSpanContext } from "./OpenTelemetry/trace/spanContext";
export { createTracer } from "./OpenTelemetry/trace/tracer";
export { createOTelTraceState, isOTelTraceState } from "./OpenTelemetry/trace/traceState";
export {
    deleteContextSpan, getContextSpan, setContextSpan, setContextSpanContext, getContextActiveSpanContext, isSpanContextValid, wrapSpanContext,
    isReadableSpan, isTracingSuppressed, suppressTracing, unsuppressTracing
} from "./OpenTelemetry/trace/utils";

// OpenTelemetry Error Classes
export { OpenTelemetryError, OpenTelemetryErrorConstructor, getOpenTelemetryError, throwOTelError } from "./OpenTelemetry/errors/OTelError";
export { OTelInvalidAttributeError, throwOTelInvalidAttributeError } from "./OpenTelemetry/errors/OTelInvalidAttributeError";
export { OTelNotImplementedError, throwOTelNotImplementedError } from "./OpenTelemetry/errors/OTelNotImplementedError";
export { OTelSpanError, throwOTelSpanError } from "./OpenTelemetry/errors/OTelSpanError";

export { IOTelAttributes, OTelAttributeValue, ExtendedOTelAttributeValue } from "./OpenTelemetry/interfaces/IOTelAttributes";
export { OTelException, IOTelExceptionWithCode, IOTelExceptionWithMessage, IOTelExceptionWithName } from "./OpenTelemetry/interfaces/IException";
export { IOTelHrTime, OTelTimeInput } from "./OpenTelemetry/interfaces/time";
