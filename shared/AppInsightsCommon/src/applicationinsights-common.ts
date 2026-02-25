// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * @deprecated The @microsoft/applicationinsights-common package has been merged
 * into @microsoft/applicationinsights-core-js for simplified dependency management
 * and improved tree-shaking capabilities.
 *
 * Please migrate your imports from "@microsoft/applicationinsights-common" to
 * "@microsoft/applicationinsights-core-js".
 *
 * This compatibility layer will be maintained through version 3.x and removed in 4.0.0.
 */

// Re-export everything from core for backward compatibility
export {
    // Utility functions
    correlationIdSetPrefix, correlationIdGetPrefix, correlationIdCanIncludeCorrelationHeader,
    correlationIdGetCorrelationContext, correlationIdGetCorrelationContextValue,
    dateTimeUtilsNow, dateTimeUtilsDuration, isInternalApplicationInsightsEndpoint,
    createDistributedTraceContextFromTrace,
    
    // Throttle manager
    ThrottleMgr,
    
    // Connection string parsing
    parseConnectionString, ConnectionStringParser,
    
    // Enums
    FieldType, eDistributedTracingModes, DistributedTracingModes, EventPersistence,
    eSeverityLevel, SeverityLevel,
    
    // Request/Response
    eRequestHeaders, RequestHeaders,
    
    // Constants
    DisabledPropertyName, ProcessLegacy, SampleRate, HttpMethod,
    DEFAULT_BREEZE_ENDPOINT, DEFAULT_BREEZE_PATH, strNotSpecified,
    
    // Contracts (as AIData and AIBase for backward compatibility)
    AIData, AIBase,
    
    // Telemetry interfaces
    ISerializable, IEnvelope, IPageViewData, IRemoteDependencyData,
    IEventTelemetry, ITraceTelemetry, IMetricTelemetry, IDependencyTelemetry,
    IExceptionTelemetry, IAutoExceptionTelemetry, IExceptionInternal,
    IPageViewTelemetry, IPageViewTelemetryInternal,
    IPageViewPerformanceTelemetry, IPageViewPerformanceTelemetryInternal,
    IRequestTelemetry,
    
    // Telemetry classes
    Envelope, Event, Exception, Metric, PageView, PageViewPerformance,
    RemoteDependencyData, Trace, Data,
    
    // Data Sanitizer
    DataSanitizerValues,
    dataSanitizeKeyAndAddUniqueness, dataSanitizeKey, dataSanitizeString,
    dataSanitizeUrl, dataSanitizeMessage, dataSanitizeException,
    dataSanitizeProperties, dataSanitizeMeasurements, dataSanitizeId,
    dataSanitizeInput, dsPadNumber,
    
    // Configuration
    IConfig, ConfigurationManager, IStorageBuffer, ICorrelationConfig,
    
    // Context tags
    IContextTagKeys, ContextTagKeys, CtxTagKeys, Extensions,
    
    // Data types
    EventDataType, ExceptionDataType, MetricDataType, PageViewDataType,
    PageViewPerformanceDataType, RemoteDependencyDataType, RequestDataType, TraceDataType,
    
    // Envelope types
    EventEnvelopeType, ExceptionEnvelopeType, MetricEnvelopeType, PageViewEnvelopeType,
    PageViewPerformanceEnvelopeType, RemoteDependencyEnvelopeType, RequestEnvelopeType,
    TraceEnvelopeType,
    
    // Telemetry creation
    TelemetryItemCreator, createTelemetryItem,
    
    // Application Insights interfaces
    IAppInsights, ITelemetryContext, IPropertiesPlugin, IRequestContext,
    
    // Context interfaces
    IWeb, ISession, ISessionManager, IApplication, IDevice, IInternal,
    ILocation, ISample, IOperatingSystem, IUser, IUserContext, ITelemetryTrace,
    
    // Helper functions
    stringToBoolOrDefault, msToTimeSpan, getExtensionByName, isCrossOriginError,
    
    // Trace parent functions (re-exported from core)
    createTraceParent, parseTraceParent, isValidTraceId, isValidSpanId,
    isValidTraceParent, isSampledFlag, formatTraceParent, findW3cTraceParent,
    findAllScripts, isBeaconsSupported as isBeaconApiSupported,
    
    // DOM helpers
    createDomEvent,
    
    // Storage helpers
    utlDisableStorage, utlEnableStorage, utlCanUseLocalStorage, utlGetLocalStorage,
    utlSetLocalStorage, utlRemoveStorage, utlCanUseSessionStorage,
    utlGetSessionStorageKeys, utlGetSessionStorage, utlSetSessionStorage,
    utlRemoveSessionStorage, utlSetStoragePrefix,
    
    // URL helpers
    urlParseUrl, urlGetAbsoluteUrl, urlGetPathName, urlGetCompleteUrl,
    urlParseHost, urlParseFullHost,
    
    // Throttle manager interfaces
    IThrottleLimit, IThrottleInterval, IThrottleMgrConfig,
    IThrottleLocalStorageObj, IThrottleResult,
    
    // Offline support
    IOfflineListener, createOfflineListener, IOfflineState,
    eOfflineValue, OfflineCallback,
    
    // ITraceParent interface
    ITraceParent,
    
    // Plugin identifiers
    PropertiesPluginIdentifier, BreezeChannelIdentifier, AnalyticsPluginIdentifier
    
} from "@microsoft/applicationinsights-core-js";

// Type re-exports (zero runtime cost)
export type { ConnectionString, IRequestHeaders } from "@microsoft/applicationinsights-core-js";
