// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
//  @skip-file-minify

import { createEnumStyle } from "../JavaScriptSDK.Enums/EnumHelperFuncs";

export const enum eLoggingSeverity {
    /**
     * No Logging will be enabled
     */
    DISABLED = 0,

    /**
     * Error will be sent as internal telemetry
     */
    CRITICAL = 1,

    /**
     * Error will NOT be sent as internal telemetry, and will only be shown in browser console
     */
    WARNING = 2,

    /**
     * The Error will NOT be sent as an internal telemetry, and will only be shown in the browser
     * console if the logging level allows it.
     */
    DEBUG = 3
}

export const LoggingSeverity = (/* @__PURE__ */createEnumStyle<typeof eLoggingSeverity>({
    DISABLED: eLoggingSeverity.DISABLED,
    CRITICAL: eLoggingSeverity.CRITICAL,
    WARNING: eLoggingSeverity.WARNING,
    DEBUG: eLoggingSeverity.DEBUG
}));
export type LoggingSeverity = number | eLoggingSeverity;

export const enum _eInternalMessageId {
    BrowserDoesNotSupportLocalStorage = 0,
    BrowserCannotReadLocalStorage = 1,
    BrowserCannotReadSessionStorage = 2,
    BrowserCannotWriteLocalStorage = 3,
    BrowserCannotWriteSessionStorage = 4,
    BrowserFailedRemovalFromLocalStorage = 5,
    BrowserFailedRemovalFromSessionStorage = 6,
    CannotSendEmptyTelemetry = 7,
    ClientPerformanceMathError = 8,
    ErrorParsingAISessionCookie = 9,
    ErrorPVCalc = 10,
    ExceptionWhileLoggingError = 11,
    FailedAddingTelemetryToBuffer = 12,
    FailedMonitorAjaxAbort = 13,
    FailedMonitorAjaxDur = 14,
    FailedMonitorAjaxOpen = 15,
    FailedMonitorAjaxRSC = 16,
    FailedMonitorAjaxSend = 17,
    FailedMonitorAjaxGetCorrelationHeader = 18,
    FailedToAddHandlerForOnBeforeUnload = 19,
    FailedToSendQueuedTelemetry = 20,
    FailedToReportDataLoss = 21,
    FlushFailed = 22,
    MessageLimitPerPVExceeded = 23,
    MissingRequiredFieldSpecification = 24,
    NavigationTimingNotSupported = 25,
    OnError = 26,
    SessionRenewalDateIsZero = 27,
    SenderNotInitialized = 28,
    StartTrackEventFailed = 29,
    StopTrackEventFailed = 30,
    StartTrackFailed = 31,
    StopTrackFailed = 32,
    TelemetrySampledAndNotSent = 33,
    TrackEventFailed = 34,
    TrackExceptionFailed = 35,
    TrackMetricFailed = 36,
    TrackPVFailed = 37,
    TrackPVFailedCalc = 38,
    TrackTraceFailed = 39,
    TransmissionFailed = 40,
    FailedToSetStorageBuffer = 41,
    FailedToRestoreStorageBuffer = 42,
    InvalidBackendResponse = 43,
    FailedToFixDepricatedValues = 44,
    InvalidDurationValue = 45,
    TelemetryEnvelopeInvalid = 46,
    CreateEnvelopeError = 47,
    MaxUnloadHookExceeded = 48,

    // User actionable
    CannotSerializeObject = 48,
    CannotSerializeObjectNonSerializable = 49,
    CircularReferenceDetected = 50,
    ClearAuthContextFailed = 51,
    ExceptionTruncated = 52,
    IllegalCharsInName = 53,
    ItemNotInArray = 54,
    MaxAjaxPerPVExceeded = 55,
    MessageTruncated = 56,
    NameTooLong = 57,
    SampleRateOutOfRange = 58,
    SetAuthContextFailed = 59,
    SetAuthContextFailedAccountName = 60,
    StringValueTooLong = 61,
    StartCalledMoreThanOnce = 62,
    StopCalledWithoutStart = 63,
    TelemetryInitializerFailed = 64,
    TrackArgumentsNotSpecified = 65,
    UrlTooLong = 66,
    SessionStorageBufferFull = 67,
    CannotAccessCookie = 68,
    IdTooLong = 69,
    InvalidEvent = 70,
    FailedMonitorAjaxSetRequestHeader = 71,
    SendBrowserInfoOnUserInit = 72,
    PluginException = 73,
    NotificationException = 74,
    SnippetScriptLoadFailure = 99,
    InvalidInstrumentationKey = 100,
    CannotParseAiBlobValue = 101,
    InvalidContentBlob = 102,
    TrackPageActionEventFailed = 103,
    FailedAddingCustomDefinedRequestContext = 104,
    InMemoryStorageBufferFull = 105,
    InstrumentationKeyDeprecation = 106,
    ConfigWatcherException = 107,
    DynamicConfigException = 108,
    DefaultThrottleMsgKey = 109,
    CdnDeprecation = 110,
    SdkLdrUpdate = 111,
    InitPromiseException = 112,
    StatsBeatManagerException = 113,
    StatsBeatException = 114,
}

export type _InternalMessageId = number | _eInternalMessageId;
