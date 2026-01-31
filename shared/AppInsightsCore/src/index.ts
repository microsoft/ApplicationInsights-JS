// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
export { IConfiguration } from "./interfaces/ai/IConfiguration";
export { IChannelControls, MinChannelPriorty, IInternalOfflineSupport } from "./interfaces/ai/IChannelControls";
export { IChannelControlsHost } from "./interfaces/ai/IChannelControlsHost";
export { ITelemetryPlugin, IPlugin } from "./interfaces/ai/ITelemetryPlugin";
export { IExceptionConfig } from "./interfaces/ai/IExceptionConfig";
export { IAppInsightsCore, ILoadedPlugin } from "./interfaces/ai/IAppInsightsCore";
export { ITelemetryItem, ICustomProperties, Tags } from "./interfaces/ai/ITelemetryItem";
export { IBaseProcessingContext, IProcessTelemetryContext, IProcessTelemetryUnloadContext, IProcessTelemetryUpdateContext } from "./interfaces/ai/IProcessTelemetryContext";
export { INotificationListener } from "./interfaces/ai/INotificationListener";
export { ITelemetryPluginChain } from "./interfaces/ai/ITelemetryPluginChain";
export { IDiagnosticLogger } from "./interfaces/ai/IDiagnosticLogger";
export { InstrumentorHooksCallback, IInstrumentHooksCallbacks, IInstrumentHooks, IInstrumentHook, IInstrumentCallDetails } from "./interfaces/ai/IInstrumentHooks";
export { IUnloadableComponent } from "./interfaces/ai/IUnloadableComponent";
export { IPayloadData, SendPOSTFunction, IXHROverride, OnCompleteCallback } from "./interfaces/ai/IXHROverride"
export { IUnloadHook, ILegacyUnloadHook } from "./interfaces/ai/IUnloadHook";
export { eEventsDiscardedReason, EventsDiscardedReason, eBatchDiscardedReason, BatchDiscardedReason } from "./enums/ai/EventsDiscardedReason";
export { eDependencyTypes, DependencyTypes } from "./enums/ai/DependencyTypes";
export { SendRequestReason, TransportType } from "./enums/ai/SendRequestReason";
//export { StatsType, eStatsType } from "./enums/ai/StatsType";
export { TelemetryUpdateReason } from "./enums/ai/TelemetryUpdateReason";
export { TelemetryUnloadReason } from "./enums/ai/TelemetryUnloadReason";
export { eActiveStatus, ActiveStatus } from "./enums/ai/InitActiveStatusEnum"
export { throwAggregationError } from "./core/AggregationError";
export { AppInsightsCore } from "./core/AppInsightsCore";
export { BaseTelemetryPlugin } from "./core/BaseTelemetryPlugin";
export { randomValue, random32, mwcRandomSeed, mwcRandom32, newId } from "./utils/RandomHelper";
export { Undefined, newGuid, generateW3CId } from "./utils/CoreUtils";
export { runTargetUnload, doUnloadAll } from "./core/AsyncUtils";
export {
    normalizeJsName, toISOString, getExceptionName, strContains, setValue, getSetValue,
    proxyAssign, proxyFunctions, proxyFunctionAs, createClassFromInterface, optimizeObject,
    isNotUndefined, isNotNullOrUndefined, objExtend, isFeatureEnabled, getResponseText, formatErrorMessageXdr, formatErrorMessageXhr, prependTransports,
    openXhr, _appendHeader, _getAllResponseHeaders, setObjStringTag, setProtoTypeName
} from "./utils/HelperFuncs";
export { parseResponse } from "./core/ResponseHelpers";
export { IXDomainRequest, IBackendResponse } from "./interfaces/ai/IXDomainRequest";
export { _ISenderOnComplete, _ISendPostMgrConfig, _ITimeoutOverrideWrapper, _IInternalXhrOverride } from "./interfaces/ai/ISenderPostManager";
export { SenderPostManager } from "./core/SenderPostManager";
//export { IStatsBeat, IStatsBeatConfig, IStatsBeatKeyMap as IStatsBeatEndpoints, IStatsBeatState} from "./interfaces/ai/IStatsBeat";
//export { IStatsEventData } from "./interfaces/ai/IStatsEventData";
//export { IStatsMgr, IStatsMgrConfig } from "./interfaces/ai/IStatsMgr";
//export { createStatsMgr } from "./core/StatsBeat";
export {
    isArray, isTypeof, isUndefined, isNullOrUndefined, isStrictUndefined, objHasOwnProperty as hasOwnProperty, isObject, isFunction,
    strEndsWith, strStartsWith, isDate, isError, isString, isNumber, isBoolean, arrForEach, arrIndexOf,
    arrReduce, arrMap, strTrim, objKeys, objCreate, objDefine, objDefineProp, objDefineAccessors, throwError, isSymbol,
    isNotTruthy, isTruthy, objFreeze, objSeal, objToString, objDeepFreeze as deepFreeze,
    getInst as getGlobalInst, hasWindow, getWindow, hasDocument, getDocument, hasNavigator, getNavigator, hasHistory,
    getHistory, dumpObj, asString, objForEachKey, getPerformance, utcNow as dateNow, perfNow,
    ObjDefinePropDescriptor
} from "@nevware21/ts-utils";
export { EnumValue, createEnumStyle, createValueMap } from "./enums/EnumHelperFuncs";
export {
    attachEvent, detachEvent, addEventHandler, addEventListeners, addPageUnloadEventListener, addPageHideEventListener, addPageShowEventListener,
    removeEventHandler, removeEventListeners, removePageUnloadEventListener, removePageHideEventListener, removePageShowEventListener, eventOn, eventOff,
    mergeEvtNamespace, _IRegisteredEvents, __getRegisteredEvents
} from "./internal/EventHelpers";

export {
    getCrypto, getMsCrypto, getLocation, hasJSON, getJSON,
    isReactNative, getConsole, isIE, getIEVersion, isSafari,
    setEnableEnvMocks, isBeaconsSupported, isFetchSupported, useXDomainRequest, isXhrSupported,
    findMetaTag, findNamedServerTiming, sendCustomEvent, dispatchEvent, createCustomDomEvent, fieldRedaction
} from "./utils/EnvUtils";
export {
    getGlobal,
    strShimPrototype as strPrototype,
    strShimFunction as strFunction,
    strShimUndefined as strUndefined,
    strShimObject as strObject
} from "@microsoft/applicationinsights-shims";
export { NotificationManager } from "./core/NotificationManager";
export { INotificationManager } from "./interfaces/ai/INotificationManager";
export { IPerfEvent } from "./interfaces/ai/IPerfEvent";
export { IPerfManager, IPerfManagerProvider } from "./interfaces/ai/IPerfManager";
export { PerfEvent, PerfManager, doPerf, getGblPerfMgr, setGblPerfMgr } from "./core/PerfManager";
export { IFeatureOptInDetails, IFeatureOptIn } from "./interfaces/ai/IFeatureOptIn";
export { FeatureOptInMode, CdnFeatureMode } from "./enums/ai/FeatureOptInEnums"
export { safeGetLogger, DiagnosticLogger, _InternalLogMessage, _throwInternal, _warnToConsole, _logInternalMessage } from "./diagnostics/DiagnosticLogger";
export {
    createProcessTelemetryContext
    // Explicitly NOT exporting createProcessTelemetryUnloadContext() and createProcessTelemetryUpdateContext() as these should only be created internally
} from "./core/ProcessTelemetryContext";
export { initializePlugins, sortPlugins, unloadComponents, createDistributedTraceContext, isDistributedTraceContext } from "./core/TelemetryHelpers";
export { _eInternalMessageId, _InternalMessageId, LoggingSeverity, eLoggingSeverity } from "./enums/ai/LoggingEnums";
export { InstrumentProto, InstrumentProtos, InstrumentFunc, InstrumentFuncs, InstrumentEvent } from "./core/InstrumentHooks";
export { ICookieMgr, ICookieMgrConfig } from "./interfaces/ai/ICookieMgr";
export {
    createCookieMgr, safeGetCookieMgr, uaDisallowsSameSiteNone, areCookiesSupported
} from "./core/CookieMgr";
export { IDbgExtension } from "./interfaces/ai/IDbgExtension";
export { getDebugListener, getDebugExt } from "./core/DbgExtensionUtils"
export { TelemetryInitializerFunction, ITelemetryInitializerHandler, ITelemetryInitializerContainer } from "./interfaces/ai/ITelemetryInitializers";
export { createUniqueNamespace } from "./utils/DataCacheHelper";
export { UnloadHandler, IUnloadHandlerContainer, createUnloadHandlerContainer } from "./core/UnloadHandlerContainer";
export { IUnloadHookContainer, createUnloadHookContainer,  _testHookMaxUnloadHooksCb } from "./core/UnloadHookContainer";
export { ITelemetryUpdateState } from "./interfaces/ai/ITelemetryUpdateState";
export { ITelemetryUnloadState } from "./interfaces/ai/ITelemetryUnloadState";
export { IDistributedTraceContext, IDistributedTraceInit } from "./interfaces/ai/IDistributedTraceContext";
export { ITraceParent } from "./interfaces/ai/ITraceParent";
export {
    createTraceParent, parseTraceParent, isValidTraceId, isValidSpanId, isValidTraceParent, isSampledFlag, formatTraceParent, findW3cTraceParent,
    findAllScripts
} from "./utils/TraceParent";

// Dynamic Config definitions
export { IConfigCheckFn, IConfigDefaultCheck, IConfigDefaults, IConfigSetFn } from "./interfaces/config/IConfigDefaults";
export { IDynamicConfigHandler } from "./interfaces/config/IDynamicConfigHandler";
export { IDynamicPropertyHandler } from "./interfaces/config/IDynamicPropertyHandler";
export { IWatchDetails, IWatcherHandler, WatcherFunction } from "./interfaces/config/IDynamicWatcher";
export { createDynamicConfig, onConfigChange } from "./config/DynamicConfig";
export { getDynamicConfigHandler, blockDynamicConversion, forceDynamicConversion } from "./config/DynamicSupport";
export { cfgDfValidate, cfgDfMerge, cfgDfBoolean, cfgDfFunc, cfgDfString, cfgDfSet, cfgDfBlockPropValue } from "./config/ConfigDefaultHelpers";

// W3c TraceState support
export { eW3CTraceFlags } from "./enums/W3CTraceFlags";
export { IW3cTraceState } from "./interfaces/ai/IW3cTraceState";
export { createW3cTraceState, findW3cTraceState, isW3cTraceState, snapshotW3cTraceState } from "./telemetry/W3cTraceState";

// OpenTelemetry Trace support
export { IOTelTraceState } from "./interfaces/otel/trace/IOTelTraceState";
export { IOTelSpan } from "./interfaces/otel/trace/IOTelSpan";
export { IOTelTracer } from "./interfaces/otel/trace/IOTelTracer";
export { IOTelTracerProvider, IOTelTracerOptions } from "./interfaces/otel/trace/IOTelTracerProvider";
export { ITraceProvider, ITraceHost, ISpanScope } from "./interfaces/ai/ITraceProvider";
export { IOTelSpanOptions } from "./interfaces/otel/trace/IOTelSpanOptions";
export { createOTelTraceState } from "./otel/api/trace/traceState";
export { createSpan } from "./otel/api/trace/span";
export { createTraceProvider } from "./otel/api/trace/traceProvider";
export { isSpanContextValid, wrapSpanContext, isReadableSpan, suppressTracing, unsuppressTracing, isTracingSuppressed, useSpan, withSpan, startActiveSpan } from "./otel/api/trace/utils";

export {
    AzureMonitorSampleRate, ApplicationInsightsCustomEventName, MicrosoftClientIp, ApplicationInsightsMessageName,
    ApplicationInsightsExceptionName, ApplicationInsightsPageViewName, ApplicationInsightsAvailabilityName,
    ApplicationInsightsEventName, ApplicationInsightsBaseType, ApplicationInsightsMessageBaseType,
    ApplicationInsightsExceptionBaseType, ApplicationInsightsPageViewBaseType, ApplicationInsightsAvailabilityBaseType,
    ApplicationInsightsEventBaseType, ATTR_ENDUSER_ID, ATTR_ENDUSER_PSEUDO_ID, ATTR_HTTP_ROUTE, SEMATTRS_NET_PEER_IP,
    SEMATTRS_NET_PEER_NAME, SEMATTRS_NET_HOST_IP, SEMATTRS_PEER_SERVICE, SEMATTRS_HTTP_USER_AGENT, SEMATTRS_HTTP_METHOD,
    SEMATTRS_HTTP_URL, SEMATTRS_HTTP_STATUS_CODE, SEMATTRS_HTTP_ROUTE, SEMATTRS_HTTP_HOST, SEMATTRS_DB_SYSTEM,
    SEMATTRS_DB_STATEMENT, SEMATTRS_DB_OPERATION, SEMATTRS_DB_NAME, SEMATTRS_RPC_SYSTEM, SEMATTRS_RPC_GRPC_STATUS_CODE,
    SEMATTRS_EXCEPTION_TYPE, SEMATTRS_EXCEPTION_MESSAGE, SEMATTRS_EXCEPTION_STACKTRACE, SEMATTRS_HTTP_SCHEME,
    SEMATTRS_HTTP_TARGET, SEMATTRS_HTTP_FLAVOR, SEMATTRS_NET_TRANSPORT, SEMATTRS_NET_HOST_NAME, SEMATTRS_NET_HOST_PORT,
    SEMATTRS_NET_PEER_PORT, SEMATTRS_HTTP_CLIENT_IP, SEMATTRS_ENDUSER_ID, ATTR_CLIENT_ADDRESS, ATTR_CLIENT_PORT,
    ATTR_SERVER_ADDRESS, ATTR_SERVER_PORT, ATTR_URL_FULL, ATTR_URL_PATH, ATTR_URL_QUERY, ATTR_URL_SCHEME,
    ATTR_ERROR_TYPE, ATTR_NETWORK_LOCAL_ADDRESS, ATTR_NETWORK_LOCAL_PORT, ATTR_NETWORK_PROTOCOL_NAME,
    ATTR_NETWORK_PEER_ADDRESS, ATTR_NETWORK_PEER_PORT, ATTR_NETWORK_PROTOCOL_VERSION, ATTR_NETWORK_TRANSPORT,
    ATTR_USER_AGENT_ORIGINAL, ATTR_HTTP_REQUEST_METHOD, ATTR_HTTP_RESPONSE_STATUS_CODE, ATTR_EXCEPTION_TYPE,
    ATTR_EXCEPTION_MESSAGE, ATTR_EXCEPTION_STACKTRACE, EXP_ATTR_ENDUSER_ID, EXP_ATTR_ENDUSER_PSEUDO_ID,
    EXP_ATTR_SYNTHETIC_TYPE, DBSYSTEMVALUES_MONGODB, DBSYSTEMVALUES_COSMOSDB, DBSYSTEMVALUES_MYSQL,
    DBSYSTEMVALUES_POSTGRESQL, DBSYSTEMVALUES_REDIS, DBSYSTEMVALUES_DB2, DBSYSTEMVALUES_DERBY, DBSYSTEMVALUES_MARIADB,
    DBSYSTEMVALUES_MSSQL, DBSYSTEMVALUES_ORACLE, DBSYSTEMVALUES_SQLITE, DBSYSTEMVALUES_OTHER_SQL, DBSYSTEMVALUES_HSQLDB,
    DBSYSTEMVALUES_H2
} from "./otel/attribute/SemanticConventions"

// OpenTelemetry Core API Interfaces
export { IOTelApi } from "./interfaces/otel/IOTelApi";
export { IOTelApiCtx } from "./interfaces/otel/IOTelApiCtx";
export { IOTelAttributes, OTelAttributeValue, ExtendedOTelAttributeValue } from "./interfaces/otel/IOTelAttributes";
export { OTelException } from "./interfaces/otel/IOTelException";
export { IOTelHrTime, OTelTimeInput } from "./interfaces/IOTelHrTime";
export { createOTelApi } from "./otel/api/OTelApi";

// OpenTelemetry Trace Interfaces
export { ITraceApi } from "./interfaces/otel/trace/IOTelTraceApi";
export { IOTelSpanCtx } from "./interfaces/otel/trace/IOTelSpanCtx";
export { IOTelSpanStatus } from "./interfaces/otel/trace/IOTelSpanStatus";
export { IReadableSpan } from "./interfaces/otel/trace/IReadableSpan";

// OpenTelemetry Configuration Interfaces
export { IOTelConfig } from "./interfaces/otel/config/IOTelConfig";
export { IOTelAttributeLimits } from "./interfaces/otel/config/IOTelAttributeLimits";
export { IOTelErrorHandlers } from "./interfaces/otel/config/IOTelErrorHandlers";
export { ITraceCfg } from "./interfaces/otel/config/IOTelTraceCfg";

// OpenTelemetry Attribute Support
export { IAttributeContainer, IAttributeChangeInfo } from "./interfaces/otel/attribute/IAttributeContainer";
export { eAttributeChangeOp, AttributeChangeOp } from "./enums/otel/eAttributeChangeOp";
export { createAttributeContainer, addAttributes, isAttributeContainer, createAttributeSnapshot } from "./otel/attribute/attributeContainer";
export { eAttributeFilter, AttributeFilter } from "./interfaces/otel/attribute/IAttributeContainer";

// OpenTelemetry Enums
export { eOTelSpanKind, OTelSpanKind } from "./enums/otel/OTelSpanKind";
export { eOTelSpanStatusCode, OTelSpanStatusCode } from "./enums/otel/OTelSpanStatus";

// OpenTelemetry Helper Utilities
export {
    hrTime, hrTimeToTimeStamp, hrTimeDuration, hrTimeToMilliseconds, timeInputToHrTime, millisToHrTime, hrTimeToNanoseconds,
    addHrTimes, hrTimeToMicroseconds, zeroHrTime, nanosToHrTime, isTimeInput, isTimeInputHrTime, isTimeSpan
} from "./internal/timeHelpers";
export { isAttributeValue, isAttributeKey, sanitizeAttributes } from "./internal/attributeHelpers";
export {
    getSyntheticType, isSyntheticSource, serializeAttribute, getUrl, getPeerIp, getHttpMethod, getHttpUrl, getHttpHost, getHttpScheme,
    getHttpTarget, getNetPeerName, getNetPeerPort, getUserAgent, getLocationIp, getHttpStatusCode, getHttpClientIp,
    getDependencyTarget, isSqlDB
} from "./internal/commonUtils";

// OpenTelemetry Error Handlers
export {
    handleAttribError, handleSpanError, handleDebug, handleWarn, handleError, handleNotImplemented
} from "./internal/handleErrors";

// OpenTelemetry Error Classes
export { OpenTelemetryError, OpenTelemetryErrorConstructor, getOpenTelemetryError, throwOTelError } from "./otel/api/errors/OTelError";
export { OTelInvalidAttributeError, throwOTelInvalidAttributeError } from "./otel/api/errors/OTelInvalidAttributeError";
export { OTelSpanError, throwOTelSpanError } from "./otel/api/errors/OTelSpanError";

// ========================================
// Application Insights Common Exports
// ========================================

// Utility functions
export {
    correlationIdSetPrefix, correlationIdGetPrefix, correlationIdCanIncludeCorrelationHeader,
    correlationIdGetCorrelationContext, correlationIdGetCorrelationContextValue,
    dateTimeUtilsNow, dateTimeUtilsDuration, isInternalApplicationInsightsEndpoint,
    createDistributedTraceContextFromTrace
} from "./utils/Util";

export { ThrottleMgr } from "./diagnostics/ThrottleMgr";
export { parseConnectionString, ConnectionStringParser } from "./telemetry/ConnectionStringParser";
export type { ConnectionString } from "./interfaces/ai/ConnectionString";
export { FieldType } from "./enums/ai/Enums";
export { IRequestHeaders, RequestHeaders, eRequestHeaders } from "./telemetry/RequestResponseHeaders";
export {
    DisabledPropertyName, ProcessLegacy, SampleRate, HttpMethod,
    DEFAULT_BREEZE_ENDPOINT, DEFAULT_BREEZE_PATH, strNotSpecified,
    ChannelControllerPriority
} from "./constants/Constants";

// Contracts
export { IData as AIData } from "./interfaces/ai/contracts/IData";
export { IBase as AIBase } from "./interfaces/ai/contracts/IBase";
export { IDomain } from "./interfaces/ai/contracts/IDomain";
export { ISerializable } from "./interfaces/ai/telemetry/ISerializable";
export { IEnvelope } from "./interfaces/ai/telemetry/IEnvelope";
export { IStackFrame } from "./interfaces/ai/contracts/IStackFrame";
export { IExceptionDetails } from "./interfaces/ai/contracts/IExceptionDetails";
export { IExceptionData } from "./interfaces/ai/contracts/IExceptionData";
export { IEventData } from "./interfaces/ai/contracts/IEventData";
export { IMessageData } from "./interfaces/ai/contracts/IMessageData";
export { IMetricData } from "./interfaces/ai/contracts/IMetricData";
export { IDataPoint } from "./interfaces/ai/contracts/IDataPoint";
export { DataPointType } from "./interfaces/ai/contracts/DataPointType";
export { IPageViewPerfData } from "./interfaces/ai/contracts/IPageViewPerfData";

// Telemetry classes
export { Envelope } from "./telemetry/ai/Common/Envelope";
export { Event } from "./telemetry/ai/Event";
export { Exception } from "./telemetry/ai/Exception";
export { Metric } from "./telemetry/ai/Metric";
export { PageView } from "./telemetry/ai/PageView";
export { IPageViewData } from "./interfaces/ai/contracts/IPageViewData";
export { RemoteDependencyData } from "./telemetry/ai/RemoteDependencyData";
export { IRemoteDependencyData } from "./interfaces/ai/contracts/IRemoteDependencyData";
export { Trace } from "./telemetry/ai/Trace";
export { PageViewPerformance } from "./telemetry/ai/PageViewPerformance";
export { Data } from "./telemetry/ai/Common/Data";
export { DataPoint } from "./telemetry/ai/Common/DataPoint";

// Telemetry interfaces
export { IEventTelemetry } from "./interfaces/ai/IEventTelemetry";
export { ITraceTelemetry } from "./interfaces/ai/ITraceTelemetry";
export { IMetricTelemetry } from "./interfaces/ai/IMetricTelemetry";
export { IDependencyTelemetry } from "./interfaces/ai/IDependencyTelemetry";
export { IExceptionTelemetry, IAutoExceptionTelemetry, IExceptionInternal } from "./interfaces/ai/IExceptionTelemetry";
export { IPageViewTelemetry, IPageViewTelemetryInternal } from "./interfaces/ai/IPageViewTelemetry";
export { IPageViewPerformanceTelemetry, IPageViewPerformanceTelemetryInternal } from "./interfaces/ai/IPageViewPerformanceTelemetry";
export { IRequestTelemetry } from "./interfaces/ai/IRequestTelemetry";

// Severity level
export { eSeverityLevel, SeverityLevel } from "./interfaces/ai/contracts/SeverityLevel";

// Configuration
export { IConfig, ConfigurationManager } from "./interfaces/ai/IConfig";
export { IStorageBuffer } from "./interfaces/ai/IStorageBuffer";
export { ICorrelationConfig } from "./interfaces/ai/ICorrelationConfig";

// Context tags and keys
export { IContextTagKeys, ContextTagKeys } from "./interfaces/ai/contracts/ContextTagKeys";
export { CtxTagKeys, Extensions } from "./interfaces/ai/PartAExtensions";

// Data types and envelope types
export {
    EventDataType, ExceptionDataType, MetricDataType, PageViewDataType,
    PageViewPerformanceDataType, RemoteDependencyDataType, RequestDataType, TraceDataType
} from "./telemetry/ai/DataTypes";

export {
    EventEnvelopeType, ExceptionEnvelopeType, MetricEnvelopeType, PageViewEnvelopeType,
    PageViewPerformanceEnvelopeType, RemoteDependencyEnvelopeType, RequestEnvelopeType, TraceEnvelopeType
} from "./telemetry/ai/EnvelopeTypes";

// Data sanitization
export {
    DataSanitizerValues, dataSanitizeKeyAndAddUniqueness, dataSanitizeKey, dataSanitizeString,
    dataSanitizeUrl, dataSanitizeMessage, dataSanitizeException, dataSanitizeProperties,
    dataSanitizeMeasurements, dataSanitizeId, dataSanitizeInput, dsPadNumber
} from "./telemetry/ai/Common/DataSanitizer";

// Telemetry item creator
export { TelemetryItemCreator, createTelemetryItem } from "./telemetry/TelemetryItemCreator";

// Application Insights interfaces
export { IAppInsights } from "./interfaces/ai/IAppInsights";
export { ITelemetryContext } from "./interfaces/ai/ITelemetryContext";
export { IPropertiesPlugin } from "./interfaces/ai/IPropertiesPlugin";
export { IRequestContext } from "./interfaces/ai/IRequestContext";

// Context interfaces
export { IWeb } from "./interfaces/ai/context/IWeb";
export { ISession } from "./interfaces/ai/context/ISession";
export { ISessionManager } from "./interfaces/ai/context/ISessionManager";
export { IApplication } from "./interfaces/ai/context/IApplication";
export { IDevice } from "./interfaces/ai/context/IDevice";
export { IInternal } from "./interfaces/ai/context/IInternal";
export { ILocation } from "./interfaces/ai/context/ILocation";
export { ISample } from "./interfaces/ai/context/ISample";
export { IOperatingSystem } from "./interfaces/ai/context/IOperatingSystem";
export { IUser, IUserContext } from "./interfaces/ai/context/IUser";
export { ITelemetryTrace } from "./interfaces/ai/context/ITelemetryTrace";

// Enums
export { eDistributedTracingModes, DistributedTracingModes, EventPersistence } from "./enums/ai/Enums";

// Helper functions
export { stringToBoolOrDefault, msToTimeSpan, getExtensionByName, isCrossOriginError } from "./utils/HelperFuncsCore";
export { createDomEvent } from "./utils/DomHelperFuncs";

// Storage helpers
export {
    utlDisableStorage, utlEnableStorage, utlCanUseLocalStorage, utlGetLocalStorage,
    utlSetLocalStorage, utlRemoveStorage, utlCanUseSessionStorage, utlGetSessionStorageKeys,
    utlGetSessionStorage, utlSetSessionStorage, utlRemoveSessionStorage, utlSetStoragePrefix
} from "./utils/StorageHelperFuncs";

// URL helpers
export {
    urlParseUrl, urlGetAbsoluteUrl, urlGetPathName, urlGetCompleteUrl,
    urlParseHost, urlParseFullHost
} from "./utils/UrlHelperFuncs";

// Throttle manager interfaces
export {
    IThrottleLimit, IThrottleInterval, IThrottleMgrConfig,
    IThrottleLocalStorageObj, IThrottleResult
} from "./interfaces/ai/IThrottleMgr";

// Offline support
export {
    IOfflineListener, createOfflineListener, IOfflineState,
    eOfflineValue, OfflineCallback
} from "./utils/Offline";

// Plugin identifiers
export const PropertiesPluginIdentifier = "AppInsightsPropertiesPlugin";
export const BreezeChannelIdentifier = "AppInsightsChannelPlugin";
export const AnalyticsPluginIdentifier = "ApplicationInsightsAnalytics";
