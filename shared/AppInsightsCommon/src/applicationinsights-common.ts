// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the
export {
    IUtil, Util, ICorrelationIdHelper, CorrelationIdHelper,
    IDateTimeUtils, DateTimeUtils, dateTimeUtilsNow, dateTimeUtilsDuration,
    IUrlHelper, UrlHelper, isInternalApplicationInsightsEndpoint,
    createDistributedTraceContextFromTrace
} from "./Util";
export { ThrottleMgr } from "./ThrottleMgr";
export { parseConnectionString, ConnectionStringParser } from "./ConnectionStringParser";
export { FieldType } from "./Enums";
export { IRequestHeaders, RequestHeaders, eRequestHeaders } from "./RequestResponseHeaders";
export { DisabledPropertyName, ProcessLegacy, SampleRate, HttpMethod, DEFAULT_BREEZE_ENDPOINT, DEFAULT_BREEZE_PATH, strNotSpecified } from "./Constants";
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
export { Trace } from "./Telemetry/Trace";
export { PageViewPerformance } from "./Telemetry/PageViewPerformance";
export { Data } from "./Telemetry/Common/Data";
export { eSeverityLevel, SeverityLevel } from "./Interfaces/Contracts/SeverityLevel";
export { IConfig, ConfigurationManager } from "./Interfaces/IConfig";
export { IStorageBuffer } from "./Interfaces/IStorageBuffer";
export { IChannelControlsAI } from "./Interfaces/IChannelControlsAI";
export { IContextTagKeys, ContextTagKeys } from "./Interfaces/Contracts/ContextTagKeys";
export {
    DataSanitizerValues, IDataSanitizer, DataSanitizer,
    dataSanitizeKeyAndAddUniqueness, dataSanitizeKey, dataSanitizeString, dataSanitizeUrl, dataSanitizeMessage,
    dataSanitizeException, dataSanitizeProperties, dataSanitizeMeasurements, dataSanitizeId, dataSanitizeInput,
    dsPadNumber
} from "./Telemetry/Common/DataSanitizer";
export { TelemetryItemCreator, createTelemetryItem } from "./TelemetryItemCreator";
export { ICorrelationConfig } from "./Interfaces/ICorrelationConfig";
export { IAppInsights } from "./Interfaces/IAppInsights";
export { IWeb } from "./Interfaces/Context/IWeb";
export { CtxTagKeys, Extensions } from "./Interfaces/PartAExtensions";
export { ISession } from "./Interfaces/Context/ISession";
export { ITelemetryContext } from "./Interfaces/ITelemetryContext";
export { IApplication } from "./Interfaces/Context/IApplication";
export { IDevice } from "./Interfaces/Context/IDevice";
export { IInternal } from "./Interfaces/Context/IInternal";
export { ILocation } from "./Interfaces/Context/ILocation";
export { ISample } from "./Interfaces/Context/ISample";
export { IOperatingSystem } from "./Interfaces/Context/IOperatingSystem";
export { IPropertiesPlugin } from "./Interfaces/IPropertiesPlugin";
export { IUser, IUserContext } from "./Interfaces/Context/IUser";
export { ITelemetryTrace, ITraceState } from "./Interfaces/Context/ITelemetryTrace";
export { IRequestContext } from "./Interfaces/IRequestContext";
export { IThrottleLocalStorageObj, IThrottleMgrConfig, IThrottleResult, IThrottleLimit, IThrottleInterval } from "./Interfaces/IThrottleMgr";
export { eDistributedTracingModes, DistributedTracingModes, IThrottleMsgKey } from "./Enums";
export { stringToBoolOrDefault, msToTimeSpan, getExtensionByName, isCrossOriginError } from "./HelperFuncs";
export {
    isBeaconsSupported as isBeaconApiSupported,
    ITraceParent, createTraceParent, parseTraceParent, isValidTraceId, isValidSpanId, isValidTraceParent, isSampledFlag, formatTraceParent, findW3cTraceParent
} from "@microsoft/applicationinsights-core-js"
export { createDomEvent } from "./DomHelperFuncs";
export {
    utlDisableStorage, utlEnableStorage, utlCanUseLocalStorage, utlGetLocalStorage, utlSetLocalStorage, utlRemoveStorage,
    utlCanUseSessionStorage, utlGetSessionStorageKeys, utlGetSessionStorage, utlSetSessionStorage, utlRemoveSessionStorage, utlSetStoragePrefix
} from "./StorageHelperFuncs";
export { urlParseUrl, urlGetAbsoluteUrl, urlGetPathName, urlGetCompleteUrl, urlParseHost, urlParseFullHost } from "./UrlHelperFuncs";

export const PropertiesPluginIdentifier = "AppInsightsPropertiesPlugin";
export const BreezeChannelIdentifier = "AppInsightsChannelPlugin";
export const AnalyticsPluginIdentifier = "ApplicationInsightsAnalytics";
