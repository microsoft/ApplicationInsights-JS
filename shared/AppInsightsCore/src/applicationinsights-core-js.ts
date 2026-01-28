// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
export { IConfiguration } from "./JavaScriptSDK.Interfaces/IConfiguration";
export { IChannelControls, MinChannelPriorty, IInternalOfflineSupport } from "./JavaScriptSDK.Interfaces/IChannelControls";
export { IChannelControlsHost } from "./JavaScriptSDK.Interfaces/IChannelControlsHost";
export { ITelemetryPlugin, IPlugin } from "./JavaScriptSDK.Interfaces/ITelemetryPlugin";
export { IExceptionConfig } from "./JavaScriptSDK.Interfaces/IExceptionConfig";
export { IAppInsightsCore, ILoadedPlugin } from "./JavaScriptSDK.Interfaces/IAppInsightsCore";
export { ITelemetryItem, ICustomProperties, Tags } from "./JavaScriptSDK.Interfaces/ITelemetryItem";
export { IBaseProcessingContext, IProcessTelemetryContext, IProcessTelemetryUnloadContext, IProcessTelemetryUpdateContext } from "./JavaScriptSDK.Interfaces/IProcessTelemetryContext";
export { INotificationListener } from "./JavaScriptSDK.Interfaces/INotificationListener";
export { ITelemetryPluginChain } from "./JavaScriptSDK.Interfaces/ITelemetryPluginChain";
export { IDiagnosticLogger } from "./JavaScriptSDK.Interfaces/IDiagnosticLogger";
export { InstrumentorHooksCallback, IInstrumentHooksCallbacks, IInstrumentHooks, IInstrumentHook, IInstrumentCallDetails } from "./JavaScriptSDK.Interfaces/IInstrumentHooks";
export { IUnloadableComponent } from "./JavaScriptSDK.Interfaces/IUnloadableComponent";
export { IPayloadData, SendPOSTFunction, IXHROverride, OnCompleteCallback } from "./JavaScriptSDK.Interfaces/IXHROverride"
export { IUnloadHook, ILegacyUnloadHook } from "./JavaScriptSDK.Interfaces/IUnloadHook";
export { eEventsDiscardedReason, EventsDiscardedReason, eBatchDiscardedReason, BatchDiscardedReason } from "./JavaScriptSDK.Enums/EventsDiscardedReason";
export { eDependencyTypes, DependencyTypes } from "./JavaScriptSDK.Enums/DependencyTypes";
export { SendRequestReason, TransportType } from "./JavaScriptSDK.Enums/SendRequestReason";
//export { StatsType, eStatsType } from "./JavaScriptSDK.Enums/StatsType";
export { TelemetryUpdateReason } from "./JavaScriptSDK.Enums/TelemetryUpdateReason";
export { TelemetryUnloadReason } from "./JavaScriptSDK.Enums/TelemetryUnloadReason";
export { eActiveStatus, ActiveStatus } from "./JavaScriptSDK.Enums/InitActiveStatusEnum"
export { throwAggregationError } from "./JavaScriptSDK/AggregationError";
export { AppInsightsCore } from "./JavaScriptSDK/AppInsightsCore";
export { BaseTelemetryPlugin } from "./JavaScriptSDK/BaseTelemetryPlugin";
export { randomValue, random32, mwcRandomSeed, mwcRandom32, newId } from "./JavaScriptSDK/RandomHelper";
export { Undefined, newGuid, generateW3CId } from "./JavaScriptSDK/CoreUtils";
export { runTargetUnload, doUnloadAll } from "./JavaScriptSDK/AsyncUtils";
export {
    normalizeJsName, toISOString, getExceptionName, strContains, setValue, getSetValue,
    proxyAssign, proxyFunctions, proxyFunctionAs, createClassFromInterface, optimizeObject,
    isNotUndefined, isNotNullOrUndefined, objExtend, isFeatureEnabled, getResponseText, formatErrorMessageXdr, formatErrorMessageXhr, prependTransports,
    openXhr, _appendHeader, _getAllResponseHeaders, setObjStringTag, setProtoTypeName
} from "./JavaScriptSDK/HelperFuncs";
export { parseResponse } from "./JavaScriptSDK/ResponseHelpers";
export { IXDomainRequest, IBackendResponse } from "./JavaScriptSDK.Interfaces/IXDomainRequest";
export { _ISenderOnComplete, _ISendPostMgrConfig, _ITimeoutOverrideWrapper, _IInternalXhrOverride } from "./JavaScriptSDK.Interfaces/ISenderPostManager";
export { SenderPostManager } from "./JavaScriptSDK/SenderPostManager";
//export { IStatsBeat, IStatsBeatConfig, IStatsBeatKeyMap as IStatsBeatEndpoints, IStatsBeatState} from "./JavaScriptSDK.Interfaces/IStatsBeat";
//export { IStatsEventData } from "./JavaScriptSDK.Interfaces/IStatsEventData";
//export { IStatsMgr, IStatsMgrConfig } from "./JavaScriptSDK.Interfaces/IStatsMgr";
//export { createStatsMgr } from "./JavaScriptSDK/StatsBeat";
export {
    isArray, isTypeof, isUndefined, isNullOrUndefined, isStrictUndefined, objHasOwnProperty as hasOwnProperty, isObject, isFunction,
    strEndsWith, strStartsWith, isDate, isError, isString, isNumber, isBoolean, arrForEach, arrIndexOf,
    arrReduce, arrMap, strTrim, objKeys, objCreate, objDefine, objDefineProp, objDefineAccessors, throwError, isSymbol,
    isNotTruthy, isTruthy, objFreeze, objSeal, objToString, objDeepFreeze as deepFreeze,
    getInst as getGlobalInst, hasWindow, getWindow, hasDocument, getDocument, hasNavigator, getNavigator, hasHistory,
    getHistory, dumpObj, asString, objForEachKey, getPerformance, utcNow as dateNow, perfNow,
    ObjDefinePropDescriptor
} from "@nevware21/ts-utils";
export { EnumValue, createEnumStyle, createValueMap } from "./JavaScriptSDK.Enums/EnumHelperFuncs";
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
} from "./JavaScriptSDK/EnvUtils";
export {
    getGlobal,
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
export { IFeatureOptInDetails, IFeatureOptIn } from "./JavaScriptSDK.Interfaces/IFeatureOptIn";
export { FeatureOptInMode, CdnFeatureMode } from "./JavaScriptSDK.Enums/FeatureOptInEnums"
export { safeGetLogger, DiagnosticLogger, _InternalLogMessage, _throwInternal, _warnToConsole, _logInternalMessage } from "./JavaScriptSDK/DiagnosticLogger";
export {
    createProcessTelemetryContext
    // Explicitly NOT exporting createProcessTelemetryUnloadContext() and createProcessTelemetryUpdateContext() as these should only be created internally
} from "./JavaScriptSDK/ProcessTelemetryContext";
export { initializePlugins, sortPlugins, unloadComponents, createDistributedTraceContext, isDistributedTraceContext } from "./JavaScriptSDK/TelemetryHelpers";
export { _eInternalMessageId, _InternalMessageId, LoggingSeverity, eLoggingSeverity } from "./JavaScriptSDK.Enums/LoggingEnums";
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
export { IUnloadHookContainer, createUnloadHookContainer,  _testHookMaxUnloadHooksCb } from "./JavaScriptSDK/UnloadHookContainer";
export { ITelemetryUpdateState } from "./JavaScriptSDK.Interfaces/ITelemetryUpdateState";
export { ITelemetryUnloadState } from "./JavaScriptSDK.Interfaces/ITelemetryUnloadState";
export { IDistributedTraceContext, IDistributedTraceInit } from "./JavaScriptSDK.Interfaces/IDistributedTraceContext";
export { ITraceParent } from "./JavaScriptSDK.Interfaces/ITraceParent";
export {
    createTraceParent, parseTraceParent, isValidTraceId, isValidSpanId, isValidTraceParent, isSampledFlag, formatTraceParent, findW3cTraceParent,
    findAllScripts
} from "./JavaScriptSDK/W3cTraceParent";

// Dynamic Config definitions
export { IConfigCheckFn, IConfigDefaultCheck, IConfigDefaults, IConfigSetFn } from "./Config/IConfigDefaults";
export { IDynamicConfigHandler } from "./Config/IDynamicConfigHandler";
export { IDynamicPropertyHandler } from "./Config/IDynamicPropertyHandler";
export { IWatchDetails, IWatcherHandler, WatcherFunction } from "./Config/IDynamicWatcher";
export { createDynamicConfig, onConfigChange } from "./Config/DynamicConfig";
export { getDynamicConfigHandler, blockDynamicConversion, forceDynamicConversion } from "./Config/DynamicSupport";
export { cfgDfValidate, cfgDfMerge, cfgDfBoolean, cfgDfFunc, cfgDfString, cfgDfSet, cfgDfBlockPropValue } from "./Config/ConfigDefaultHelpers";

// W3c TraceState support
export { eW3CTraceFlags } from "./JavaScriptSDK.Enums/W3CTraceFlags";
export { IW3cTraceState } from "./JavaScriptSDK.Interfaces/IW3cTraceState";
export { createW3cTraceState, findW3cTraceState, isW3cTraceState, snapshotW3cTraceState } from "./JavaScriptSDK/W3cTraceState";

// OpenTelemetry Trace support
export { IOTelTraceState } from "./OpenTelemetry/interfaces/trace/IOTelTraceState";
export { IOTelSpan } from "./OpenTelemetry/interfaces/trace/IOTelSpan";
export { IOTelTracer } from "./OpenTelemetry/interfaces/trace/IOTelTracer";
export { IOTelTracerProvider, IOTelTracerOptions } from "./OpenTelemetry/interfaces/trace/IOTelTracerProvider";
export { ITraceProvider, ITraceHost, ISpanScope } from "./JavaScriptSDK.Interfaces/ITraceProvider";
export { IOTelSpanOptions } from "./OpenTelemetry/interfaces/trace/IOTelSpanOptions";
export { createOTelTraceState } from "./OpenTelemetry/trace/traceState";
export { createSpan } from "./OpenTelemetry/trace/span";
export { createTraceProvider } from "./OpenTelemetry/trace/traceProvider";
export { isSpanContextValid, wrapSpanContext, isReadableSpan, suppressTracing, unsuppressTracing, isTracingSuppressed, useSpan, withSpan, startActiveSpan } from "./OpenTelemetry/trace/utils";

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
} from "./OpenTelemetry/attribute/SemanticConventions"

// OpenTelemetry Core API Interfaces
export { IOTelApi } from "./OpenTelemetry/interfaces/IOTelApi";
export { IOTelApiCtx } from "./OpenTelemetry/interfaces/IOTelApiCtx";
export { IOTelAttributes, OTelAttributeValue, ExtendedOTelAttributeValue } from "./OpenTelemetry/interfaces/IOTelAttributes";
export { OTelException } from "./OpenTelemetry/interfaces/IOTelException";
export { IOTelHrTime, OTelTimeInput } from "./OpenTelemetry/interfaces/IOTelHrTime";
export { createOTelApi } from "./OpenTelemetry/otelApi";

// OpenTelemetry Trace Interfaces
export { ITraceApi } from "./OpenTelemetry/interfaces/trace/ITraceApi";
export { IOTelSpanCtx } from "./OpenTelemetry/interfaces/trace/IOTelSpanCtx";
export { IOTelSpanStatus } from "./OpenTelemetry/interfaces/trace/IOTelSpanStatus";
export { IReadableSpan } from "./OpenTelemetry/interfaces/trace/IReadableSpan";

// OpenTelemetry Configuration Interfaces
export { IOTelConfig } from "./OpenTelemetry/interfaces/config/IOTelConfig";
export { IOTelAttributeLimits } from "./OpenTelemetry/interfaces/config/IOTelAttributeLimits";
export { IOTelErrorHandlers } from "./OpenTelemetry/interfaces/config/IOTelErrorHandlers";
export { ITraceCfg } from "./OpenTelemetry/interfaces/config/ITraceCfg";

// OpenTelemetry Attribute Support
export { IAttributeContainer, IAttributeChangeInfo } from "./OpenTelemetry/attribute/IAttributeContainer";
export { eAttributeChangeOp, AttributeChangeOp } from "./OpenTelemetry/enums/eAttributeChangeOp";
export { createAttributeContainer, addAttributes, isAttributeContainer, createAttributeSnapshot } from "./OpenTelemetry/attribute/attributeContainer";
export { eAttributeFilter, AttributeFilter } from "./OpenTelemetry/attribute/IAttributeContainer";

// OpenTelemetry Enums
export { eOTelSpanKind, OTelSpanKind } from "./OpenTelemetry/enums/trace/OTelSpanKind";
export { eOTelSpanStatusCode, OTelSpanStatusCode } from "./OpenTelemetry/enums/trace/OTelSpanStatus";

// OpenTelemetry Helper Utilities
export {
    hrTime, hrTimeToTimeStamp, hrTimeDuration, hrTimeToMilliseconds, timeInputToHrTime, millisToHrTime, hrTimeToNanoseconds,
    addHrTimes, hrTimeToMicroseconds, zeroHrTime, nanosToHrTime, isTimeInput, isTimeInputHrTime, isTimeSpan
} from "./OpenTelemetry/helpers/timeHelpers";
export { isAttributeValue, isAttributeKey, sanitizeAttributes } from "./OpenTelemetry/helpers/attributeHelpers";
export {
    getSyntheticType, isSyntheticSource, serializeAttribute, getUrl, getPeerIp, getHttpMethod, getHttpUrl, getHttpHost, getHttpScheme,
    getHttpTarget, getNetPeerName, getNetPeerPort, getUserAgent, getLocationIp, getHttpStatusCode, getHttpClientIp,
    getDependencyTarget, isSqlDB
} from "./OpenTelemetry/helpers/common";

// OpenTelemetry Error Handlers
export {
    handleAttribError, handleSpanError, handleDebug, handleWarn, handleError, handleNotImplemented
} from "./OpenTelemetry/helpers/handleErrors";

// OpenTelemetry Error Classes
export { OpenTelemetryError, OpenTelemetryErrorConstructor, getOpenTelemetryError, throwOTelError } from "./OpenTelemetry/errors/OTelError";
export { OTelInvalidAttributeError, throwOTelInvalidAttributeError } from "./OpenTelemetry/errors/OTelInvalidAttributeError";
export { OTelSpanError, throwOTelSpanError } from "./OpenTelemetry/errors/OTelSpanError";

// ========================================
// Application Insights Common Exports
// ========================================

// Utility functions
export {
    correlationIdSetPrefix, correlationIdGetPrefix, correlationIdCanIncludeCorrelationHeader,
    correlationIdGetCorrelationContext, correlationIdGetCorrelationContextValue,
    dateTimeUtilsNow, dateTimeUtilsDuration, isInternalApplicationInsightsEndpoint,
    createDistributedTraceContextFromTrace
} from "./Common/Util";

export { ThrottleMgr } from "./Common/ThrottleMgr";
export { parseConnectionString, ConnectionStringParser } from "./Common/ConnectionStringParser";
export type { ConnectionString } from "./Common/Interfaces/ConnectionString";
export { FieldType } from "./Common/Enums";
export { IRequestHeaders, RequestHeaders, eRequestHeaders } from "./Common/RequestResponseHeaders";
export {
    DisabledPropertyName, ProcessLegacy, SampleRate, HttpMethod,
    DEFAULT_BREEZE_ENDPOINT, DEFAULT_BREEZE_PATH, strNotSpecified
} from "./Common/Constants";

// Contracts
export { IData as AIData } from "./Common/Interfaces/Contracts/IData";
export { IBase as AIBase } from "./Common/Interfaces/Contracts/IBase";
export { IDomain } from "./Common/Interfaces/Contracts/IDomain";
export { ISerializable } from "./Common/Interfaces/Telemetry/ISerializable";
export { IEnvelope } from "./Common/Interfaces/Telemetry/IEnvelope";
export { IStackFrame } from "./Common/Interfaces/Contracts/IStackFrame";
export { IExceptionDetails } from "./Common/Interfaces/Contracts/IExceptionDetails";
export { IExceptionData } from "./Common/Interfaces/Contracts/IExceptionData";
export { IEventData } from "./Common/Interfaces/Contracts/IEventData";
export { IMessageData } from "./Common/Interfaces/Contracts/IMessageData";
export { IMetricData } from "./Common/Interfaces/Contracts/IMetricData";
export { IDataPoint } from "./Common/Interfaces/Contracts/IDataPoint";
export { DataPointType } from "./Common/Interfaces/Contracts/DataPointType";
export { IPageViewPerfData } from "./Common/Interfaces/Contracts/IPageViewPerfData";

// Telemetry classes
export { Envelope } from "./Common/Telemetry/Common/Envelope";
export { Event } from "./Common/Telemetry/Event";
export { Exception } from "./Common/Telemetry/Exception";
export { Metric } from "./Common/Telemetry/Metric";
export { PageView } from "./Common/Telemetry/PageView";
export { IPageViewData } from "./Common/Interfaces/Contracts/IPageViewData";
export { RemoteDependencyData } from "./Common/Telemetry/RemoteDependencyData";
export { IRemoteDependencyData } from "./Common/Interfaces/Contracts/IRemoteDependencyData";
export { Trace } from "./Common/Telemetry/Trace";
export { PageViewPerformance } from "./Common/Telemetry/PageViewPerformance";
export { Data } from "./Common/Telemetry/Common/Data";
export { DataPoint } from "./Common/Telemetry/Common/DataPoint";

// Telemetry interfaces
export { IEventTelemetry } from "./Common/Interfaces/IEventTelemetry";
export { ITraceTelemetry } from "./Common/Interfaces/ITraceTelemetry";
export { IMetricTelemetry } from "./Common/Interfaces/IMetricTelemetry";
export { IDependencyTelemetry } from "./Common/Interfaces/IDependencyTelemetry";
export { IExceptionTelemetry, IAutoExceptionTelemetry, IExceptionInternal } from "./Common/Interfaces/IExceptionTelemetry";
export { IPageViewTelemetry, IPageViewTelemetryInternal } from "./Common/Interfaces/IPageViewTelemetry";
export { IPageViewPerformanceTelemetry, IPageViewPerformanceTelemetryInternal } from "./Common/Interfaces/IPageViewPerformanceTelemetry";
export { IRequestTelemetry } from "./Common/Interfaces/IRequestTelemetry";

// Severity level
export { eSeverityLevel, SeverityLevel } from "./Common/Interfaces/Contracts/SeverityLevel";

// Configuration
export { IConfig, ConfigurationManager } from "./Common/Interfaces/IConfig";
export { IStorageBuffer } from "./Common/Interfaces/IStorageBuffer";
export { ICorrelationConfig } from "./Common/Interfaces/ICorrelationConfig";

// Context tags and keys
export { IContextTagKeys, ContextTagKeys } from "./Common/Interfaces/Contracts/ContextTagKeys";
export { CtxTagKeys, Extensions } from "./Common/Interfaces/PartAExtensions";

// Data types and envelope types
export {
    EventDataType, ExceptionDataType, MetricDataType, PageViewDataType,
    PageViewPerformanceDataType, RemoteDependencyDataType, RequestDataType, TraceDataType
} from "./Common/Telemetry/DataTypes";

export {
    EventEnvelopeType, ExceptionEnvelopeType, MetricEnvelopeType, PageViewEnvelopeType,
    PageViewPerformanceEnvelopeType, RemoteDependencyEnvelopeType, RequestEnvelopeType, TraceEnvelopeType
} from "./Common/Telemetry/EnvelopeTypes";

// Data sanitization
export {
    DataSanitizerValues, dataSanitizeKeyAndAddUniqueness, dataSanitizeKey, dataSanitizeString,
    dataSanitizeUrl, dataSanitizeMessage, dataSanitizeException, dataSanitizeProperties,
    dataSanitizeMeasurements, dataSanitizeId, dataSanitizeInput, dsPadNumber
} from "./Common/Telemetry/Common/DataSanitizer";

// Telemetry item creator
export { TelemetryItemCreator, createTelemetryItem } from "./Common/TelemetryItemCreator";

// Application Insights interfaces
export { IAppInsights } from "./Common/Interfaces/IAppInsights";
export { ITelemetryContext } from "./Common/Interfaces/ITelemetryContext";
export { IPropertiesPlugin } from "./Common/Interfaces/IPropertiesPlugin";
export { IRequestContext } from "./Common/Interfaces/IRequestContext";

// Context interfaces
export { IWeb } from "./Common/Interfaces/Context/IWeb";
export { ISession } from "./Common/Interfaces/Context/ISession";
export { ISessionManager } from "./Common/Interfaces/Context/ISessionManager";
export { IApplication } from "./Common/Interfaces/Context/IApplication";
export { IDevice } from "./Common/Interfaces/Context/IDevice";
export { IInternal } from "./Common/Interfaces/Context/IInternal";
export { ILocation } from "./Common/Interfaces/Context/ILocation";
export { ISample } from "./Common/Interfaces/Context/ISample";
export { IOperatingSystem } from "./Common/Interfaces/Context/IOperatingSystem";
export { IUser, IUserContext } from "./Common/Interfaces/Context/IUser";
export { ITelemetryTrace } from "./Common/Interfaces/Context/ITelemetryTrace";

// Enums
export { eDistributedTracingModes, DistributedTracingModes, EventPersistence } from "./Common/Enums";

// Helper functions
export { stringToBoolOrDefault, msToTimeSpan, getExtensionByName, isCrossOriginError } from "./Common/HelperFuncs";
export { createDomEvent } from "./Common/DomHelperFuncs";

// Storage helpers
export {
    utlDisableStorage, utlEnableStorage, utlCanUseLocalStorage, utlGetLocalStorage,
    utlSetLocalStorage, utlRemoveStorage, utlCanUseSessionStorage, utlGetSessionStorageKeys,
    utlGetSessionStorage, utlSetSessionStorage, utlRemoveSessionStorage, utlSetStoragePrefix
} from "./Common/StorageHelperFuncs";

// URL helpers
export {
    urlParseUrl, urlGetAbsoluteUrl, urlGetPathName, urlGetCompleteUrl,
    urlParseHost, urlParseFullHost
} from "./Common/UrlHelperFuncs";

// Throttle manager interfaces
export {
    IThrottleLimit, IThrottleInterval, IThrottleMgrConfig,
    IThrottleLocalStorageObj, IThrottleResult
} from "./Common/Interfaces/IThrottleMgr";

// Offline support
export {
    IOfflineListener, createOfflineListener, IOfflineState,
    eOfflineValue, OfflineCallback
} from "./Common/Offline";

// Plugin identifiers
export const PropertiesPluginIdentifier = "AppInsightsPropertiesPlugin";
export const BreezeChannelIdentifier = "AppInsightsChannelPlugin";
export const AnalyticsPluginIdentifier = "ApplicationInsightsAnalytics";
