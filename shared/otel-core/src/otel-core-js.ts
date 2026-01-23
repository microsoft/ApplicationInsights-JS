// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Trace Support
export { createOTelApi, traceApiDefaultConfigValues } from "./otel/api/OTelApi";
export { OTelSdk } from "./otel/sdk/OTelSdk";



// ==========================================================================
// OpenTelemetry exports
// ==========================================================================

// Context
export { createContextManager } from "./otel/api/context/contextManager";
export { createContext } from "./otel/api/context/context";

// Enums
export { eOTelSamplingDecision, OTelSamplingDecision } from "./enums/OTel/trace/OTelSamplingDecision";
export { eOTelSpanKind, OTelSpanKind } from "./enums/OTel/trace/OTelSpanKind";
export { eOTelSpanStatusCode, OTelSpanStatusCode } from "./enums/OTel/trace/OTelSpanStatus";

// OpenTelemetry Attribute Support
export { eAttributeChangeOp, AttributeChangeOp } from "./enums/OTel/eAttributeChangeOp";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

// Config
export { IOTelAttributeLimits } from "./interfaces/OTel/config/IOTelAttributeLimits";
export { IOTelConfig } from "./interfaces/OTel/config/IOTelConfig";
export { IOTelErrorHandlers } from "./interfaces/OTel/config/IOTelErrorHandlers";
export { IOTelTraceCfg } from "./interfaces/OTel/config/IOTelTraceCfg";

// Context
export { IOTelContextManager } from "./interfaces/OTel/context/IOTelContextManager";
export { IOTelContext } from "./interfaces/OTel/context/IOTelContext";

// Resources
export { IOTelResource, OTelMaybePromise, OTelRawResourceAttribute } from "./interfaces/OTel/resources/IOTelResource";

// Baggage
export { IOTelBaggage } from "./interfaces/OTel/baggage/IOTelBaggage";
export { IOTelBaggageEntry } from "./interfaces/OTel/baggage/IOTelBaggageEntry";
export { OTelBaggageEntryMetadata, otelBaggageEntryMetadataSymbol } from "./interfaces/OTel/baggage/OTelBaggageEntryMetadata";

// Trace
export { IOTelIdGenerator } from "./interfaces/OTel/trace/IOTelIdGenerator";
export { IOTelInstrumentationScope } from "./interfaces/OTel/trace/IOTelInstrumentationScope";
export { IOTelLink } from "./interfaces/OTel/trace/IOTelLink";
export { IOTelTracerCtx } from "./interfaces/OTel/trace/IOTelTracerCtx";
export { IOTelTraceState } from "./interfaces/OTel/trace/IOTelTraceState";
export { IReadableSpan } from "./interfaces/OTel/trace/IReadableSpan";
export { IOTelSampler } from "./interfaces/OTel/trace/IOTelSampler";
export { IOTelSamplingResult } from "./interfaces/OTel/trace/IOTelSamplingResult";
export { IOTelSpan } from "./interfaces/OTel/trace/IOTelSpan";
export { IOTelSpanContext } from "./interfaces/OTel/trace/IOTelSpanContext";
export { IOTelSpanOptions } from "./interfaces/OTel/trace/IOTelSpanOptions";
export { IOTelSpanStatus } from "./interfaces/OTel/trace/IOTelSpanStatus";
export { IOTelTimedEvent } from "./interfaces/OTel/trace/IOTelTimedEvent";
export { IOTelTracerProvider } from "./interfaces/OTel/trace/IOTelTracerProvider";
export { IOTelTracer } from "./interfaces/OTel/trace/IOTelTracer";
export { IOTelTracerOptions } from "./interfaces/OTel/trace/IOTelTracerOptions";

export { IOTelApi } from "./interfaces/OTel/IOTelApi";
export { IOTelApiCtx } from "./interfaces/OTel/IOTelApiCtx";
export { IOTelSdk } from "./interfaces/OTel/IOTelSdk";
export { IOTelSdkCtx } from "./interfaces/OTel/IOTelSdkCtx";

export { IOTelTraceApi } from "./interfaces/OTel/trace/IOTelTraceApi";
export { IOTelSpanCtx } from "./interfaces/OTel/trace/IOTelSpanCtx";

export { createTraceApi } from "./otel/api/trace/traceApi";

// Trace
export { createNonRecordingSpan } from "./otel/api/trace/nonRecordingSpan";
export { isSpanContext, wrapDistributedTrace, createOTelSpanContext } from "./otel/api/trace/spanContext";
export { createTracer } from "./otel/api/trace/tracer";
export { createOTelTraceState, isOTelTraceState } from "./otel/api/trace/traceState";
export {
    deleteContextSpan, getContextSpan, setContextSpan, setContextSpanContext, getContextActiveSpanContext, isSpanContextValid, wrapSpanContext,
    isReadableSpan, isTracingSuppressed, suppressTracing, unsuppressTracing
} from "./otel/api/trace/utils";

// OpenTelemetry Error Classes
export { OpenTelemetryError, OpenTelemetryErrorConstructor, getOpenTelemetryError, throwOTelError } from "./otel/api/errors/OTelError";
export { OTelInvalidAttributeError, throwOTelInvalidAttributeError } from "./otel/api/errors/OTelInvalidAttributeError";
export { OTelNotImplementedError, throwOTelNotImplementedError } from "./otel/api/errors/OTelNotImplementedError";
export { OTelSpanError, throwOTelSpanError } from "./otel/api/errors/OTelSpanError";

export { IOTelAttributes, OTelAttributeValue, ExtendedOTelAttributeValue } from "./interfaces/OTel/IOTelAttributes";
export { OTelException, IOTelExceptionWithCode, IOTelExceptionWithMessage, IOTelExceptionWithName } from "./interfaces/OTel/IException";
export { IOTelHrTime, OTelTimeInput } from "./interfaces/OTel/time";

// Logs
export { IOTelLogger } from "./interfaces/OTel/logs/IOTelLogger";
export { IOTelLogRecord, LogBody, LogAttributes } from "./interfaces/OTel/logs/IOTelLogRecord";
export { IOTelLogRecordProcessor } from "./interfaces/OTel/logs/IOTelLogRecordProcessor";
export { ReadableLogRecord } from "./interfaces/OTel/logs/IOTelReadableLogRecord";
export { IOTelSdkLogRecord } from "./interfaces/OTel/logs/IOTelSdkLogRecord";
export { IOTelLoggerProvider } from "./interfaces/OTel/logs/IOTelLoggerProvider";
export { IOTelLoggerOptions } from "./interfaces/OTel/logs/IOTelLoggerOptions";
export { IOTelLoggerProviderSharedState } from "./interfaces/OTel/logs/IOTelLoggerProviderSharedState";
export { IOTelLogRecordLimits } from "./interfaces/OTel/logs/IOTelLogRecordLimits";

// SDK Logs
export { createLoggerProvider, DEFAULT_LOGGER_NAME } from "./otel/sdk/OTelLoggerProvider";
export { createLogger } from "./otel/sdk/OTelLogger";
export { createMultiLogRecordProcessor } from "./otel/sdk/OTelMultiLogRecordProcessor";
export { loadDefaultConfig, reconfigureLimits } from "./otel/sdk/config";

// ==========================================================================
// Application Insights Common exports
// ==========================================================================

// Utils
export {
    correlationIdSetPrefix, correlationIdGetPrefix, correlationIdCanIncludeCorrelationHeader, correlationIdGetCorrelationContext,
    correlationIdGetCorrelationContextValue, dateTimeUtilsNow, dateTimeUtilsDuration, isInternalApplicationInsightsEndpoint
} from "./utils/AppInsights/Util";
export { parseConnectionString, ConnectionStringParser } from "./telemetry/ConnectionStringParser";
export { ConnectionString } from "./interfaces/AppInsights/ConnectionString";
export { FieldType } from "./enums/AppInsights/Enums";
export { IRequestHeaders, RequestHeaders, eRequestHeaders } from "./telemetry/RequestResponseHeaders";
export {
    DisabledPropertyName, ProcessLegacy, SampleRate, HttpMethod, DEFAULT_BREEZE_ENDPOINT, DEFAULT_BREEZE_PATH, strNotSpecified,
    STR_EVENTS_DISCARDED, STR_EVENTS_SEND_REQUEST, STR_EVENTS_SENT, STR_PERF_EVENT, STR_OFFLINE_DROP, STR_OFFLINE_SENT,
    STR_OFFLINE_STORE, STR_GET_PERF_MGR, STR_CORE, STR_DISABLED, STR_PRIORITY, STR_PROCESS_TELEMETRY
} from "./constants/Constants";

// Contracts
export { IData as AIData } from "./interfaces/AppInsights/contracts/IData";
export { IBase as AIBase } from "./interfaces/AppInsights/contracts/IBase";
export { ISerializable } from "./interfaces/AppInsights/telemetry/ISerializable";
export { IEnvelope } from "./interfaces/AppInsights/telemetry/IEnvelope";

// Telemetry
export { Envelope } from "./telemetry/AppInsights/Common/Envelope";
export { Event } from "./telemetry/AppInsights/Event";
export { Exception } from "./telemetry/AppInsights/Exception";
export { Metric } from "./telemetry/AppInsights/Metric";
export { PageView } from "./telemetry/AppInsights/PageView";
export { IPageViewData } from "./interfaces/AppInsights/contracts/IPageViewData";
export { RemoteDependencyData } from "./telemetry/AppInsights/RemoteDependencyData";
export { IEventTelemetry } from "./interfaces/AppInsights/IEventTelemetry";
export { ITraceTelemetry } from "./interfaces/AppInsights/ITraceTelemetry";
export { IMetricTelemetry } from "./interfaces/AppInsights/IMetricTelemetry";
export { IDependencyTelemetry } from "./interfaces/AppInsights/IDependencyTelemetry";
export { IExceptionTelemetry, IAutoExceptionTelemetry, IExceptionInternal } from "./interfaces/AppInsights/IExceptionTelemetry";
export { IPageViewTelemetry, IPageViewTelemetryInternal } from "./interfaces/AppInsights/IPageViewTelemetry";
export { IPageViewPerformanceTelemetry, IPageViewPerformanceTelemetryInternal } from "./interfaces/AppInsights/IPageViewPerformanceTelemetry";
export { ITelemetryContext } from "./interfaces/AppInsights/ITelemetryContext";
export { Trace } from "./telemetry/AppInsights/Trace";
export { PageViewPerformance } from "./telemetry/AppInsights/PageViewPerformance";
export { Data } from "./telemetry/AppInsights/Common/Data";
export { eSeverityLevel, SeverityLevel } from "./interfaces/AppInsights/contracts/SeverityLevel";
export { IConfig, ConfigurationManager } from "./interfaces/AppInsights/IConfig";
export { IStorageBuffer } from "./interfaces/AppInsights/IStorageBuffer";
export { IContextTagKeys, ContextTagKeys } from "./interfaces/AppInsights/contracts/ContextTagKeys";
export { Extensions, CtxTagKeys } from "./interfaces/AppInsights/PartAExtensions";
export {
    DataSanitizerValues,
    dataSanitizeKeyAndAddUniqueness, dataSanitizeKey, dataSanitizeString, dataSanitizeUrl, dataSanitizeMessage,
    dataSanitizeException, dataSanitizeProperties, dataSanitizeMeasurements, dataSanitizeId, dataSanitizeInput,
    dsPadNumber
} from "./telemetry/AppInsights/Common/DataSanitizer";
export { TelemetryItemCreator, createTelemetryItem } from "./telemetry/TelemetryItemCreator";
export { ICorrelationConfig } from "./interfaces/AppInsights/ICorrelationConfig";
export { IAppInsights } from "./interfaces/AppInsights/IAppInsights";
export { eDistributedTracingModes, DistributedTracingModes, EventPersistence } from "./enums/AppInsights/Enums";
export { stringToBoolOrDefault, msToTimeSpan, getExtensionByName, isCrossOriginError } from "./utils/AppInsights/HelperFuncs";
export { createDomEvent } from "./utils/AppInsights/DomHelperFuncs";
export {
    utlDisableStorage, utlEnableStorage, utlCanUseLocalStorage, utlGetLocalStorage, utlSetLocalStorage, utlRemoveStorage,
    utlCanUseSessionStorage, utlGetSessionStorageKeys, utlGetSessionStorage, utlSetSessionStorage, utlRemoveSessionStorage, utlSetStoragePrefix
} from "./utils/AppInsights/StorageHelperFuncs";
export { urlParseUrl, urlGetAbsoluteUrl, urlGetPathName, urlGetCompleteUrl, urlParseHost, urlParseFullHost } from "./utils/AppInsights/UrlHelperFuncs";
export { IThrottleLimit, IThrottleInterval, IThrottleMgrConfig, IThrottleLocalStorageObj, IThrottleResult } from "./interfaces/AppInsights/IThrottleMgr";
export { IOfflineListener, createOfflineListener, IOfflineState, eOfflineValue, OfflineCallback } from "./utils/Offline";
export {
    createTraceParent, parseTraceParent, isValidTraceId, isValidSpanId, isValidTraceParent, isSampledFlag, formatTraceParent,
    findW3cTraceParent, findAllScripts, createDistributedTraceContextFromTrace, INVALID_TRACE_ID, INVALID_SPAN_ID, scriptsInfo
} from "./utils/AppInsights/TraceParent";

// Config-related exports
export { IConfigCheckFn, IConfigDefaultCheck, IConfigDefaults, IConfigSetFn } from "./interfaces/AppInsights/config/IConfigDefaults";
export { IDynamicConfigHandler, _IInternalDynamicConfigHandler } from "./interfaces/AppInsights/config/IDynamicConfigHandler";
export { IDynamicPropertyHandler } from "./interfaces/AppInsights/config/IDynamicPropertyHandler";
export { IWatchDetails, IWatcherHandler, WatcherFunction, _IDynamicDetail } from "./interfaces/AppInsights/config/IDynamicWatcher";
export { _IDynamicConfigHandlerState, _IDynamicGetter } from "./interfaces/AppInsights/config/_IDynamicConfigHandlerState";

// Enum utilities
export { createEnumStyle } from "./enums/AppInsights/EnumHelperFuncs";

// W3C Trace-related exports
export { eW3CTraceFlags } from "./enums/AppInsights/W3CTraceFlags";
export { IDistributedTraceContext } from "./interfaces/AppInsights/IDistributedTraceContext";
export { ITraceParent } from "./interfaces/AppInsights/ITraceParent";
export { IW3cTraceState } from "./interfaces/AppInsights/IW3cTraceState";
export { eTraceHeadersMode } from "./enums/AppInsights/TraceHeadersMode";

// Stats and telemetry interfaces
export { INetworkStatsbeat } from "./interfaces/AppInsights/INetworkStatsbeat";
export { IStatsBeat, IStatsBeatState, IStatsBeatKeyMap, IStatsBeatConfig, IStatsEndpointConfig } from "./interfaces/AppInsights/IStatsBeat";
export { IStatsMgr, IStatsMgrConfig } from "./interfaces/AppInsights/IStatsMgr";
export { eStatsType } from "./enums/AppInsights/StatsType";

// Utility functions
export {
    getCrypto, getMsCrypto, getLocation, hasJSON, getJSON,
    isReactNative, getConsole, isIE, getIEVersion, isSafari,
    setEnableEnvMocks, isBeaconsSupported, isFetchSupported, useXDomainRequest, isXhrSupported,
    findMetaTag, findNamedServerTiming, sendCustomEvent, dispatchEvent, createCustomDomEvent, fieldRedaction,
    findMetaTags, findNamedServerTimings
} from "./utils/AppInsights/EnvUtils";
export { isBeaconsSupported as isBeaconApiSupported } from "./utils/AppInsights/EnvUtils";

// Core helper functions
export {
    normalizeJsName, toISOString, getExceptionName, strContains, setValue, getSetValue,
    proxyAssign, proxyFunctions, proxyFunctionAs, createClassFromInterface, optimizeObject,
    isNotUndefined, isNotNullOrUndefined, objExtend, isFeatureEnabled, getResponseText, formatErrorMessageXdr, formatErrorMessageXhr, prependTransports,
    openXhr, _appendHeader, _getAllResponseHeaders, convertAllHeadersToMap, setObjStringTag, setProtoTypeName, _getObjProto
} from "./utils/AppInsights/HelperFuncsCore";
export { randomValue, random32, mwcRandomSeed, mwcRandom32, newId } from "./utils/AppInsights/RandomHelper";

// Core interfaces
export { IAppInsightsCore } from "./interfaces/AppInsights/IAppInsightsCore";
export { IConfiguration } from "./interfaces/AppInsights/IConfiguration";
export { IDiagnosticLogger } from "./interfaces/AppInsights/IDiagnosticLogger";
export { IApplication } from "./interfaces/AppInsights/context/IApplication";
export { IDevice } from "./interfaces/AppInsights/context/IDevice";
export { IInternal } from "./interfaces/AppInsights/context/IInternal";
export { ILocation } from "./interfaces/AppInsights/context/ILocation";
export { IOperatingSystem } from "./interfaces/AppInsights/context/IOperatingSystem";
export { ISession } from "./interfaces/AppInsights/context/ISession";
export { ISessionManager } from "./interfaces/AppInsights/context/ISessionManager";
export { ISample } from "./interfaces/AppInsights/context/ISample";
export { ITelemetryTrace } from "./interfaces/AppInsights/context/ITelemetryTrace";
export { IUser, IUserContext } from "./interfaces/AppInsights/context/IUser";
export { IWeb } from "./interfaces/AppInsights/context/IWeb";
export { IPropertiesPlugin } from "./interfaces/AppInsights/IPropertiesPlugin";

// Channel and plugin interfaces
export { IChannelControls, MinChannelPriorty, IInternalOfflineSupport } from "./interfaces/AppInsights/IChannelControls";
export { IChannelControlsHost } from "./interfaces/AppInsights/IChannelControlsHost";
export { ITelemetryPlugin, IPlugin } from "./interfaces/AppInsights/ITelemetryPlugin";
export { IExceptionConfig } from "./interfaces/AppInsights/IExceptionConfig";
export { ILoadedPlugin } from "./interfaces/AppInsights/IAppInsightsCore";
export { ITelemetryItem, ICustomProperties, Tags } from "./interfaces/AppInsights/ITelemetryItem";
export { IBaseProcessingContext, IProcessTelemetryContext, IProcessTelemetryUnloadContext, IProcessTelemetryUpdateContext } from "./interfaces/AppInsights/IProcessTelemetryContext";
export { INotificationListener } from "./interfaces/AppInsights/INotificationListener";
export { ITelemetryPluginChain } from "./interfaces/AppInsights/ITelemetryPluginChain";
export { InstrumentorHooksCallback, IInstrumentHooksCallbacks, IInstrumentHooks, IInstrumentHook, IInstrumentCallDetails } from "./interfaces/AppInsights/IInstrumentHooks";
export { IUnloadableComponent } from "./interfaces/AppInsights/IUnloadableComponent";
export { IPayloadData, SendPOSTFunction, IXHROverride, OnCompleteCallback } from "./interfaces/AppInsights/IXHROverride";
export { IUnloadHook, ILegacyUnloadHook } from "./interfaces/AppInsights/IUnloadHook";
export { IXDomainRequest, IBackendResponse } from "./interfaces/AppInsights/IXDomainRequest";
export { _ISenderOnComplete, _ISendPostMgrConfig, _ITimeoutOverrideWrapper, _IInternalXhrOverride } from "./interfaces/AppInsights/ISenderPostManager";
export { INotificationManager } from "./interfaces/AppInsights/INotificationManager";
export { IPerfEvent } from "./interfaces/AppInsights/IPerfEvent";
export { IPerfManager, IPerfManagerProvider } from "./interfaces/AppInsights/IPerfManager";
export { IFeatureOptInDetails, IFeatureOptIn } from "./interfaces/AppInsights/IFeatureOptIn";
export { ICookieMgr, ICookieMgrConfig } from "./interfaces/AppInsights/ICookieMgr";
export { IDbgExtension } from "./interfaces/AppInsights/IDbgExtension";
export { TelemetryInitializerFunction, ITelemetryInitializerHandler, ITelemetryInitializerContainer } from "./interfaces/AppInsights/ITelemetryInitializers";
export { ITelemetryUpdateState } from "./interfaces/AppInsights/ITelemetryUpdateState";
export { ITelemetryUnloadState } from "./interfaces/AppInsights/ITelemetryUnloadState";
export { IRequestContext } from "./interfaces/AppInsights/IRequestContext";

// Enums
export { eEventsDiscardedReason, EventsDiscardedReason, eBatchDiscardedReason, BatchDiscardedReason } from "./enums/AppInsights/EventsDiscardedReason";
export { SendRequestReason, TransportType } from "./enums/AppInsights/SendRequestReason";
export { TelemetryUpdateReason } from "./enums/AppInsights/TelemetryUpdateReason";
export { TelemetryUnloadReason } from "./enums/AppInsights/TelemetryUnloadReason";
export { eActiveStatus, ActiveStatus } from "./enums/AppInsights/InitActiveStatusEnum";
export { _eInternalMessageId, _InternalMessageId, LoggingSeverity, eLoggingSeverity } from "./enums/AppInsights/LoggingEnums";
export { FeatureOptInMode, CdnFeatureMode } from "./enums/AppInsights/FeatureOptInEnums";

// DataCache helper
export { createUniqueNamespace, createElmNodeData } from "./utils/AppInsights/DataCacheHelper";

// Plugin identifiers
export const PropertiesPluginIdentifier = "AppInsightsPropertiesPlugin";
export const BreezeChannelIdentifier = "AppInsightsChannelPlugin";
export const AnalyticsPluginIdentifier = "ApplicationInsightsAnalytics";

// W3c TraceState support
export { createW3cTraceState, findW3cTraceState, isW3cTraceState, snapshotW3cTraceState } from "./telemetry/W3cTraceState";

// Core Utils
export { Undefined, newGuid, generateW3CId } from "./utils/AppInsights/CoreUtils";

// ==========================================================================
// AppInsightsCore exports (merged from @microsoft/otel-core-js)
// ==========================================================================

// Core classes
export { throwAggregationError } from "./core/AppInsights/AggregationError";
export { AppInsightsCore } from "./core/AppInsights/AppInsightsCore";
export { BaseTelemetryPlugin } from "./core/AppInsights/BaseTelemetryPlugin";
export { runTargetUnload, doUnloadAll } from "./core/AppInsights/AsyncUtils";
export { parseResponse } from "./core/AppInsights/ResponseHelpers";
export { SenderPostManager } from "./core/AppInsights/SenderPostManager";

// Event helpers
export {
    attachEvent, detachEvent, addEventHandler, addEventListeners, addPageUnloadEventListener, addPageHideEventListener, addPageShowEventListener,
    removeEventHandler, removeEventListeners, removePageUnloadEventListener, removePageHideEventListener, removePageShowEventListener, eventOn, eventOff,
    mergeEvtNamespace, _IRegisteredEvents, __getRegisteredEvents
} from "./core/AppInsights/EventHelpers";

// NotificationManager
export { NotificationManager } from "./core/AppInsights/NotificationManager";

// PerfManager
export { PerfEvent, PerfManager, doPerf, getGblPerfMgr, setGblPerfMgr } from "./core/AppInsights/PerfManager";

// DiagnosticLogger
export { safeGetLogger, DiagnosticLogger, _InternalLogMessage, _warnToConsole, _logInternalMessage, _throwInternal } from "./diagnostics/AppInsights/DiagnosticLogger";

// ProcessTelemetryContext
export { ProcessTelemetryContext, createProcessTelemetryContext } from "./core/AppInsights/ProcessTelemetryContext";

// TelemetryHelpers
export { initializePlugins, sortPlugins, unloadComponents, createDistributedTraceContext } from "./core/AppInsights/TelemetryHelpers";

// InstrumentHooks
export { InstrumentProto, InstrumentProtos, InstrumentFunc, InstrumentFuncs, InstrumentEvent } from "./core/AppInsights/InstrumentHooks";

// CookieMgr
export { createCookieMgr, safeGetCookieMgr, uaDisallowsSameSiteNone, areCookiesSupported } from "./core/AppInsights/CookieMgr";

// DbgExtensionUtils
export { getDebugListener, getDebugExt } from "./core/AppInsights/DbgExtensionUtils";

// UnloadHandlerContainer
export { UnloadHandler, IUnloadHandlerContainer, createUnloadHandlerContainer } from "./core/AppInsights/UnloadHandlerContainer";

// UnloadHookContainer
export { IUnloadHookContainer, createUnloadHookContainer, _testHookMaxUnloadHooksCb } from "./core/AppInsights/UnloadHookContainer";

// ThrottleMgr
export { ThrottleMgr } from "./diagnostics/AppInsights/ThrottleMgr";

// Dynamic Config definitions
export { createDynamicConfig, onConfigChange } from "./config/AppInsights/DynamicConfig";
export { getDynamicConfigHandler, blockDynamicConversion, forceDynamicConversion } from "./config/AppInsights/DynamicSupport";
export { cfgDfValidate, cfgDfMerge, cfgDfBoolean, cfgDfFunc, cfgDfString, cfgDfSet, cfgDfBlockPropValue } from "./config/AppInsights/ConfigDefaultHelpers";

// Re-exports from ts-utils for convenience
export {
    isArray, isTypeof, isUndefined, isNullOrUndefined, objHasOwnProperty as hasOwnProperty, isObject, isFunction,
    strEndsWith, strStartsWith, isDate, isError, isString, isNumber, isBoolean, arrForEach, arrIndexOf,
    arrReduce, arrMap, strTrim, objKeys, objDefineAccessors, throwError, isSymbol,
    isNotTruthy, isTruthy, objFreeze, objSeal, objToString, objDeepFreeze as deepFreeze,
    getInst as getGlobalInst, hasWindow, getWindow, hasDocument, getDocument, hasNavigator, getNavigator, hasHistory,
    getHistory, dumpObj, asString, objForEachKey, getPerformance, utcNow as dateNow, perfNow
} from "@nevware21/ts-utils";

// Re-exports from shims for convenience
export {
    getGlobal,
    strShimPrototype as strPrototype,
    strShimFunction as strFunction,
    strShimUndefined as strUndefined,
    strShimObject as strObject
} from "@microsoft/applicationinsights-shims";
