// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the
export {
    correlationIdSetPrefix, correlationIdGetPrefix, correlationIdCanIncludeCorrelationHeader, correlationIdGetCorrelationContext,
    correlationIdGetCorrelationContextValue, dateTimeUtilsNow, dateTimeUtilsDuration, isInternalApplicationInsightsEndpoint
} from "./Utils/Util";
export { parseConnectionString, ConnectionStringParser } from "./ConnectionStringParser";
export { ConnectionString } from "./Interfaces/ConnectionString";
export { FieldType } from "./Enums/Enums";
export { IRequestHeaders, RequestHeaders, eRequestHeaders } from "./RequestResponseHeaders";
export {
    DisabledPropertyName, ProcessLegacy, SampleRate, HttpMethod, DEFAULT_BREEZE_ENDPOINT, DEFAULT_BREEZE_PATH, strNotSpecified,
    STR_EVENTS_DISCARDED, STR_EVENTS_SEND_REQUEST, STR_EVENTS_SENT, STR_PERF_EVENT, STR_OFFLINE_DROP, STR_OFFLINE_SENT,
    STR_OFFLINE_STORE, STR_GET_PERF_MGR, STR_CORE, STR_DISABLED, STR_PRIORITY, STR_PROCESS_TELEMETRY
} from "./Constants";
export { IData as AIData } from "./Interfaces/Contracts/IData";
export { IBase as AIBase } from "./Interfaces/Contracts/IBase";
export { ISerializable } from "./Interfaces/Telemetry/ISerializable";
export { IEnvelope } from "./Interfaces/Telemetry/IEnvelope";
export { Envelope } from "./Telemetry/Common/Envelope";
export { Event } from "./Telemetry/Event";
export { Exception } from "./Telemetry/Exception";
export { Metric } from "./Telemetry/Metric";
export { PageView } from "./Telemetry/PageView";
export { IPageViewData } from "./Interfaces/Contracts/IPageViewData";
export { RemoteDependencyData } from "./Telemetry/RemoteDependencyData";
export { IEventTelemetry } from "./Interfaces/IEventTelemetry";
export { ITraceTelemetry } from "./Interfaces/ITraceTelemetry";
export { IMetricTelemetry } from "./Interfaces/IMetricTelemetry";
export { IDependencyTelemetry } from "./Interfaces/IDependencyTelemetry";
export { IExceptionTelemetry, IAutoExceptionTelemetry, IExceptionInternal } from "./Interfaces/IExceptionTelemetry";
export { IPageViewTelemetry, IPageViewTelemetryInternal } from "./Interfaces/IPageViewTelemetry";
export { IPageViewPerformanceTelemetry, IPageViewPerformanceTelemetryInternal } from "./Interfaces/IPageViewPerformanceTelemetry";
export { ITelemetryContext } from "./Interfaces/ITelemetryContext";
export { Trace } from "./Telemetry/Trace";
export { PageViewPerformance } from "./Telemetry/PageViewPerformance";
export { Data } from "./Telemetry/Common/Data";
export { eSeverityLevel, SeverityLevel } from "./Interfaces/Contracts/SeverityLevel";
export { IConfig, ConfigurationManager } from "./Interfaces/IConfig";
export { IStorageBuffer } from "./Interfaces/IStorageBuffer";
export { IContextTagKeys, ContextTagKeys } from "./Interfaces/Contracts/ContextTagKeys";
export { Extensions, CtxTagKeys } from "./Interfaces/PartAExtensions";
export {
    DataSanitizerValues,
    dataSanitizeKeyAndAddUniqueness, dataSanitizeKey, dataSanitizeString, dataSanitizeUrl, dataSanitizeMessage,
    dataSanitizeException, dataSanitizeProperties, dataSanitizeMeasurements, dataSanitizeId, dataSanitizeInput,
    dsPadNumber
} from "./Telemetry/Common/DataSanitizer";
export { TelemetryItemCreator, createTelemetryItem } from "./TelemetryItemCreator";
export { ICorrelationConfig } from "./Interfaces/ICorrelationConfig";
export { IAppInsights } from "./Interfaces/IAppInsights";
export { eDistributedTracingModes, DistributedTracingModes, EventPersistence } from "./Enums/Enums";
export { stringToBoolOrDefault, msToTimeSpan, getExtensionByName, isCrossOriginError } from "./Utils/HelperFuncs";
export { createDomEvent } from "./Utils/DomHelperFuncs";
export {
    utlDisableStorage, utlEnableStorage, utlCanUseLocalStorage, utlGetLocalStorage, utlSetLocalStorage, utlRemoveStorage,
    utlCanUseSessionStorage, utlGetSessionStorageKeys, utlGetSessionStorage, utlSetSessionStorage, utlRemoveSessionStorage, utlSetStoragePrefix
} from "./Utils/StorageHelperFuncs";
export { urlParseUrl, urlGetAbsoluteUrl, urlGetPathName, urlGetCompleteUrl, urlParseHost, urlParseFullHost } from "./Utils/UrlHelperFuncs";
export { IThrottleLimit, IThrottleInterval, IThrottleMgrConfig, IThrottleLocalStorageObj, IThrottleResult } from "./Interfaces/IThrottleMgr";
export { IOfflineListener, createOfflineListener, IOfflineState, eOfflineValue, OfflineCallback } from "./Offline";
export {
    createTraceParent, parseTraceParent, isValidTraceId, isValidSpanId, isValidTraceParent, isSampledFlag, formatTraceParent,
    findW3cTraceParent, findAllScripts, createDistributedTraceContextFromTrace, INVALID_TRACE_ID, INVALID_SPAN_ID, scriptsInfo
} from "./Utils/TraceParent";

// Config-related exports that Core needs
export { IConfigCheckFn, IConfigDefaultCheck, IConfigDefaults, IConfigSetFn } from "./Interfaces/Config/IConfigDefaults";
export { IDynamicConfigHandler, _IInternalDynamicConfigHandler } from "./Interfaces/Config/IDynamicConfigHandler";
export { IDynamicPropertyHandler } from "./Interfaces/Config/IDynamicPropertyHandler";
export { IWatchDetails, IWatcherHandler, WatcherFunction, _IDynamicDetail } from "./Interfaces/Config/IDynamicWatcher";
export { _IDynamicConfigHandlerState, _IDynamicGetter } from "./Interfaces/Config/_IDynamicConfigHandlerState";

// Enum utilities
export { createEnumStyle } from "./Enums/EnumHelperFuncs";

// W3C Trace-related exports
export { eW3CTraceFlags } from "./Enums/W3CTraceFlags";
export { IDistributedTraceContext } from "./Interfaces/IDistributedTraceContext";
export { ITraceParent } from "./Interfaces/ITraceParent";
export { IW3cTraceState } from "./Interfaces/IW3cTraceState";

export { eTraceHeadersMode } from "./Enums/TraceHeadersMode";

// Stats and telemetry interfaces
export { INetworkStatsbeat } from "./Interfaces/INetworkStatsbeat";
export { IStatsBeat, IStatsBeatState, IStatsBeatKeyMap, IStatsBeatConfig, IStatsEndpointConfig } from "./Interfaces/IStatsBeat";
export { IStatsMgr, IStatsMgrConfig } from "./Interfaces/IStatsMgr";
export { eStatsType } from "./Enums/StatsType";

// Utility functions that Core imports
export {
    getCrypto, getMsCrypto, getLocation, hasJSON, getJSON,
    isReactNative, getConsole, isIE, getIEVersion, isSafari,
    setEnableEnvMocks, isBeaconsSupported, isFetchSupported, useXDomainRequest, isXhrSupported,
    findMetaTag, findNamedServerTiming, sendCustomEvent, dispatchEvent, createCustomDomEvent, fieldRedaction,
    findMetaTags, findNamedServerTimings
} from "./Utils/EnvUtils";
export { isBeaconsSupported as isBeaconApiSupported } from "./Utils/EnvUtils";

// Core helper functions that various modules need
export {
    normalizeJsName, toISOString, getExceptionName, strContains, setValue, getSetValue,
    proxyAssign, proxyFunctions, proxyFunctionAs, createClassFromInterface, optimizeObject,
    isNotUndefined, isNotNullOrUndefined, objExtend, isFeatureEnabled, getResponseText, formatErrorMessageXdr, formatErrorMessageXhr, prependTransports,
    openXhr, _appendHeader, _getAllResponseHeaders, convertAllHeadersToMap, setObjStringTag, setProtoTypeName, _getObjProto
} from "./Utils/HelperFuncsCore";
export { randomValue, random32, mwcRandomSeed, mwcRandom32, newId } from "./Utils/RandomHelper";

// Core interfaces that moved to Common
export { IAppInsightsCore } from "./Interfaces/IAppInsightsCore";
export { IConfiguration } from "./Interfaces/IConfiguration";
export { IDiagnosticLogger } from "./Interfaces/IDiagnosticLogger";
export { IApplication } from "./Interfaces/Context/IApplication";
export { IDevice } from "./Interfaces/Context/IDevice";
export { IInternal } from "./Interfaces/Context/IInternal";
export { ILocation } from "./Interfaces/Context/ILocation";
export { IOperatingSystem } from "./Interfaces/Context/IOperatingSystem";
export { ISession } from "./Interfaces/Context/ISession";
export { ISessionManager } from "./Interfaces/Context/ISessionManager";
export { ISample } from "./Interfaces/Context/ISample";
export { ITelemetryTrace } from "./Interfaces/Context/ITelemetryTrace";
export { IUser, IUserContext } from "./Interfaces/Context/IUser";
export { IWeb } from "./Interfaces/Context/IWeb";
export { IPropertiesPlugin } from "./Interfaces/IPropertiesPlugin";

// All the other Core interfaces and enums that moved to Common
export { IChannelControls, MinChannelPriorty, IInternalOfflineSupport } from "./Interfaces/IChannelControls";
export { IChannelControlsHost } from "./Interfaces/IChannelControlsHost";
export { ITelemetryPlugin, IPlugin } from "./Interfaces/ITelemetryPlugin";
export { IExceptionConfig } from "./Interfaces/IExceptionConfig";
export { ILoadedPlugin } from "./Interfaces/IAppInsightsCore";
export { ITelemetryItem, ICustomProperties, Tags } from "./Interfaces/ITelemetryItem";
export { IBaseProcessingContext, IProcessTelemetryContext, IProcessTelemetryUnloadContext, IProcessTelemetryUpdateContext } from "./Interfaces/IProcessTelemetryContext";
export { INotificationListener } from "./Interfaces/INotificationListener";
export { ITelemetryPluginChain } from "./Interfaces/ITelemetryPluginChain";
export { InstrumentorHooksCallback, IInstrumentHooksCallbacks, IInstrumentHooks, IInstrumentHook, IInstrumentCallDetails } from "./Interfaces/IInstrumentHooks";
export { IUnloadableComponent } from "./Interfaces/IUnloadableComponent";
export { IPayloadData, SendPOSTFunction, IXHROverride, OnCompleteCallback } from "./Interfaces/IXHROverride";
export { IUnloadHook, ILegacyUnloadHook } from "./Interfaces/IUnloadHook";
export { IXDomainRequest, IBackendResponse } from "./Interfaces/IXDomainRequest";
export { _ISenderOnComplete, _ISendPostMgrConfig, _ITimeoutOverrideWrapper, _IInternalXhrOverride } from "./Interfaces/ISenderPostManager";
export { INotificationManager } from "./Interfaces/INotificationManager";
export { IPerfEvent } from "./Interfaces/IPerfEvent";
export { IPerfManager, IPerfManagerProvider } from "./Interfaces/IPerfManager";
export { IFeatureOptInDetails, IFeatureOptIn } from "./Interfaces/IFeatureOptIn";
export { ICookieMgr, ICookieMgrConfig } from "./Interfaces/ICookieMgr";
export { IDbgExtension } from "./Interfaces/IDbgExtension";
export { TelemetryInitializerFunction, ITelemetryInitializerHandler, ITelemetryInitializerContainer } from "./Interfaces/ITelemetryInitializers";
export { ITelemetryUpdateState } from "./Interfaces/ITelemetryUpdateState";
export { ITelemetryUnloadState } from "./Interfaces/ITelemetryUnloadState";
export { IRequestContext } from "./Interfaces/IRequestContext";

// All the enums that moved to Common
export { eEventsDiscardedReason, EventsDiscardedReason, eBatchDiscardedReason, BatchDiscardedReason } from "./Enums/EventsDiscardedReason";
export { SendRequestReason, TransportType } from "./Enums/SendRequestReason";
export { TelemetryUpdateReason } from "./Enums/TelemetryUpdateReason";
export { TelemetryUnloadReason } from "./Enums/TelemetryUnloadReason";
export { eActiveStatus, ActiveStatus } from "./Enums/InitActiveStatusEnum";
export { _eInternalMessageId, _InternalMessageId, LoggingSeverity, eLoggingSeverity } from "./Enums/LoggingEnums";
export { FeatureOptInMode, CdnFeatureMode } from "./Enums/FeatureOptInEnums";

// DataCache helper that Core needs
export { createUniqueNamespace, createElmNodeData } from "./Utils/DataCacheHelper";

export const PropertiesPluginIdentifier = "AppInsightsPropertiesPlugin";
export const BreezeChannelIdentifier = "AppInsightsChannelPlugin";
export const AnalyticsPluginIdentifier = "ApplicationInsightsAnalytics";
