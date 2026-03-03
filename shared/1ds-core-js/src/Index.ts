/**
* Index.ts
* Re-export package — all implementation merged into @microsoft/applicationinsights-core-js.
* This package exists for backward compatibility with consumers of @microsoft/1ds-core-js.
*/

// Re-export AppInsightsExtCore as AppInsightsCore so existing consumers are not broken
export { AppInsightsExtCore as AppInsightsCore } from "@microsoft/applicationinsights-core-js";

// Re-export all 1DS-specific types from core
export {
    ValueKind, eValueKind,
    EventLatency, EventLatencyValue,
    EventPersistence, EventPersistenceValue,
    EventPropertyType, eEventPropertyType,
    EventSendType,
    TraceLevel, eTraceLevel,
    _ExtendedInternalMessageId, _eExtendedInternalMessageId,
    GuidStyle, FieldValueSanitizerType,
    IExtendedConfiguration, IPropertyStorageOverride,
    IEventProperty, IExtendedTelemetryItem, IEventTiming,
    FieldValueSanitizerFunc, FieldValueSanitizerTypes,
    IFieldSanitizerDetails, IFieldValueSanitizerProvider, IValueSanitizer,
    ValueSanitizer,
    isValueAssigned, isLatency, isUint8ArrayAvailable, getTenantId, sanitizeProperty,
    Version, FullVersionString, getCommonSchemaMetaData, getCookieValue,
    extend, createGuid, isDocumentObjectAvailable, isWindowObjectAvailable,
    setProcessTelemetryTimings, getTime,
    isArrayValid, isValueKind, getFieldValueType,
    isChromium, isGreaterThanZero,
    createExtendedTelemetryItemFromSpan
} from "@microsoft/applicationinsights-core-js";

// Re-export all core types that were previously re-exported by this package
export {
    IAppInsightsCore, IChannelControls, IPlugin, INotificationManager, NotificationManager, INotificationListener,
    IConfiguration, ITelemetryItem, ITelemetryPlugin, BaseTelemetryPlugin, IProcessTelemetryContext, ITelemetryPluginChain,
    MinChannelPriorty, EventsDiscardedReason, IDiagnosticLogger, DiagnosticLogger, LoggingSeverity, SendRequestReason,
    IPerfEvent, IPerfManager, IPerfManagerProvider, PerfEvent, PerfManager, doPerf, ICustomProperties, Tags,
    AppInsightsCore as InternalAppInsightsCore, _InternalLogMessage, _InternalMessageId, eActiveStatus, ActiveStatus,
    createEnumStyle, eLoggingSeverity, _eInternalMessageId, _throwInternal, _warnToConsole, _logInternalMessage,
    isTypeof, isUndefined, isNullOrUndefined, hasOwnProperty, isObject, isFunction, attachEvent, detachEvent, normalizeJsName,
    objForEachKey, strStartsWith, strEndsWith, strContains, strTrim, isDate, isArray, isError, isString, isNumber, isBoolean,
    toISOString, arrForEach, arrIndexOf, arrMap, arrReduce, objKeys, objDefineAccessors, dateNow, getExceptionName, throwError,
    setValue, getSetValue, isNotTruthy, isTruthy, proxyAssign, proxyFunctions, proxyFunctionAs, optimizeObject,
    addEventHandler, newGuid, perfNow, newId, generateW3CId, safeGetLogger, objFreeze, objSeal, fieldRedaction,
    getGlobal, getGlobalInst, hasWindow, getWindow, hasDocument, getDocument, getCrypto, getMsCrypto,
    hasNavigator, getNavigator, hasHistory, getHistory, getLocation, getPerformance, hasJSON, getJSON,
    isReactNative, getConsole, dumpObj, isIE, getIEVersion, strUndefined, strObject, strPrototype, strFunction,
    setEnableEnvMocks, strUndefined as Undefined,
    randomValue, random32,
    ICookieMgr, ICookieMgrConfig, uaDisallowsSameSiteNone as disallowsSameSiteNone,
    areCookiesSupported, areCookiesSupported as cookieAvailable, createCookieMgr, safeGetCookieMgr,
    toISOString as getISOString, openXhr,
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
    IConfigCheckFn, IConfigDefaultCheck, IConfigDefaults, IConfigSetFn, IDynamicConfigHandler, IDynamicPropertyHandler,
    IWatchDetails, IWatcherHandler, WatcherFunction,
    createDynamicConfig, onConfigChange, getDynamicConfigHandler, blockDynamicConversion, forceDynamicConversion,
    IPayloadData, IXHROverride, OnCompleteCallback, SendPOSTFunction, IInternalOfflineSupport, _ISendPostMgrConfig, IBackendResponse, _ISenderOnComplete, SenderPostManager,
    getResponseText, formatErrorMessageXdr, formatErrorMessageXhr, prependTransports, parseResponse, _getAllResponseHeaders, _appendHeader, _IInternalXhrOverride,
    _ITimeoutOverrideWrapper, IXDomainRequest, isFeatureEnabled, FeatureOptInMode,
    TransportType,
    _testHookMaxUnloadHooksCb
} from "@microsoft/applicationinsights-core-js";
