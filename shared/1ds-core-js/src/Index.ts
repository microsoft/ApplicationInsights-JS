/**
* Index.ts
* @author Abhilash Panwar (abpanwar)
* @copyright Microsoft 2018
* File to export public classes, interfaces and enums.
*/
import { AppInsightsCore } from "./AppInsightsCore";
import {
    FieldValueSanitizerFunc, FieldValueSanitizerTypes, IEventProperty, IEventTiming, IExtendedConfiguration, IExtendedTelemetryItem,
    IFieldSanitizerDetails, IFieldValueSanitizerProvider, IPropertyStorageOverride, IValueSanitizer
} from "./DataModels";
import {
    EventLatency, EventLatencyValue, EventPersistence, EventPersistenceValue, EventPropertyType, EventSendType, FieldValueSanitizerType,
    GuidStyle, TraceLevel, ValueKind, _ExtendedInternalMessageId, _eExtendedInternalMessageId, eEventPropertyType, eTraceLevel, eValueKind
} from "./Enums";
import { ValueSanitizer } from "./ValueSanitizer";

export {
    ValueKind, eValueKind, IExtendedConfiguration, IPropertyStorageOverride,
    EventLatency, EventPersistence, TraceLevel, eTraceLevel, IEventProperty, IExtendedTelemetryItem,
    AppInsightsCore, _ExtendedInternalMessageId, _eExtendedInternalMessageId, EventPropertyType, eEventPropertyType,
    IEventTiming, GuidStyle,
    FieldValueSanitizerFunc, FieldValueSanitizerType, FieldValueSanitizerTypes, IFieldSanitizerDetails,
    IFieldValueSanitizerProvider, IValueSanitizer, ValueSanitizer,
    EventLatencyValue, EventPersistenceValue, EventSendType
};

export {
    IAppInsightsCore, IChannelControls, IPlugin, INotificationManager, NotificationManager, INotificationListener,
    IConfiguration, ITelemetryItem, ITelemetryPlugin, BaseTelemetryPlugin, IProcessTelemetryContext, ProcessTelemetryContext, ITelemetryPluginChain,
    MinChannelPriorty, EventsDiscardedReason, IDiagnosticLogger, DiagnosticLogger, LoggingSeverity, SendRequestReason,
    IPerfEvent, IPerfManager, IPerfManagerProvider, PerfEvent, PerfManager, doPerf, ICustomProperties, Tags,
    AppInsightsCore as InternalAppInsightsCore, _InternalLogMessage, _InternalMessageId, eActiveStatus, ActiveStatus,
    createEnumStyle, eLoggingSeverity, _eInternalMessageId, _throwInternal, _warnToConsole, _logInternalMessage,
    // The HelperFuncs functions
    isTypeof, isUndefined, isNullOrUndefined, hasOwnProperty, isObject, isFunction, attachEvent, detachEvent, normalizeJsName,
    objForEachKey, strStartsWith, strEndsWith, strContains, strTrim, isDate, isArray, isError, isString, isNumber, isBoolean,
    toISOString, arrForEach, arrIndexOf, arrMap, arrReduce, objKeys, objDefineAccessors, dateNow, getExceptionName, throwError,
    setValue, getSetValue, isNotTruthy, isTruthy, proxyAssign, proxyFunctions, proxyFunctionAs, optimizeObject,
    addEventHandler, newGuid, perfNow, newId, generateW3CId, safeGetLogger, objFreeze, objSeal,
    // EnvUtils
    getGlobal, getGlobalInst, hasWindow, getWindow, hasDocument, getDocument, getCrypto, getMsCrypto,
    hasNavigator, getNavigator, hasHistory, getHistory, getLocation, getPerformance, hasJSON, getJSON,
    isReactNative, getConsole, dumpObj, isIE, getIEVersion, strUndefined, strObject, strPrototype, strFunction,
    setEnableEnvMocks, strUndefined as Undefined,
    // Random
    randomValue, random32,
    // Cookie Handling
    ICookieMgr, ICookieMgrConfig, uaDisallowsSameSiteNone as disallowsSameSiteNone,
    areCookiesSupported, areCookiesSupported as cookieAvailable, createCookieMgr, safeGetCookieMgr,
    // Aliases
    toISOString as getISOString,
    isBeaconsSupported, isFetchSupported, isXhrSupported, useXDomainRequest,
    addPageHideEventListener, addPageShowEventListener, addEventListeners, addPageUnloadEventListener,
    removeEventHandler, removeEventListeners, removePageUnloadEventListener, removePageHideEventListener, removePageShowEventListener, eventOn, eventOff, mergeEvtNamespace,
    createUniqueNamespace,
    _IRegisteredEvents, __getRegisteredEvents,
    TelemetryInitializerFunction, ITelemetryInitializerHandler, ITelemetryInitializerContainer,
    createProcessTelemetryContext,
    IProcessTelemetryUnloadContext, UnloadHandler, IUnloadHandlerContainer, ITelemetryUnloadState, createUnloadHandlerContainer, TelemetryUnloadReason,
    ITelemetryUpdateState, IUnloadableComponent,
    IDistributedTraceContext, createTraceParent, parseTraceParent, isValidTraceId, isValidSpanId, isValidTraceParent, isSampledFlag, formatTraceParent, findW3cTraceParent,
    IUnloadHook, ILegacyUnloadHook, IUnloadHookContainer,
    
    // Dynamic Config definitions
    IConfigCheckFn, IConfigDefaultCheck, IConfigDefaults, IConfigSetFn, IDynamicConfigHandler, IDynamicPropertyHandler,
    IWatchDetails, IWatcherHandler, WatcherFunction,
    createDynamicConfig, onConfigChange, getDynamicConfigHandler, blockDynamicConversion, forceDynamicConversion,
    IPayloadData, IXHROverride, OnCompleteCallback, SendPOSTFunction, IInternalOfflineSupport, _ISendPostMgrConfig, IBackendResponse, _ISenderOnComplete, SenderPostManager,
    getResponseText, formatErrorMessageXdr, formatErrorMessageXhr, prependTransports, parseResponse, convertAllHeadersToMap, _getAllResponseHeaders, _appendHeader, _IInternalXhrOverride,
    _ITimeoutOverrideWrapper, IXDomainRequest, isFeatureEnabled, FeatureOptInMode,
    TransportType,

    // Test Hooks
    _testHookMaxUnloadHooksCb
} from "@microsoft/applicationinsights-core-js";

export {
    isValueAssigned, isLatency, isUint8ArrayAvailable, getTenantId, sanitizeProperty,
    Version, FullVersionString, getCommonSchemaMetaData, getCookieValue,
    extend, createGuid, isDocumentObjectAvailable, isWindowObjectAvailable,
    setProcessTelemetryTimings, getTime,
    isArrayValid, isValueKind, getFieldValueType,
    isChromium,     // Replace with ai-core version once published in ai-core
    openXhr,
    isGreaterThanZero
} from "./Utils";
