// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
//  @skip-file-minify

import { createEnumStyle } from "../JavaScriptSDK.Enums/EnumHelperFuncs";

const FAILED = "Failed";
const FAILED_MONITOR_AJAX = FAILED + "MonitorAjax";
const TRACK = "Track";
const START = "Start";
const STOP = "Stop";
const EVENT = "Event";
const AUTH_CONTEXT = "AuthContext";
const EXCEPTION = "Exception";
const LOCAL = "Local";
const SESSION = "Session";
const STORAGE = "Storage";
const BROWSER = "Browser";
const CANNOT = "Cannot";
const BUFFER = "Buffer";
const INSTRUMENTATION_KEY = "InstrumentationKey";

export const enum eLoggingSeverity {
    /**
     * Error will be sent as internal telemetry
     */
    CRITICAL = 1,

    /**
     * Error will NOT be sent as internal telemetry, and will only be shown in browser console
     */
    WARNING = 2
}

export const LoggingSeverity = createEnumStyle<typeof eLoggingSeverity>({
    CRITICAL: eLoggingSeverity.CRITICAL,
    WARNING: eLoggingSeverity.WARNING
});
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
    InstrumentationKeyDeprecation = 106
}

/**
 * Internal message ID. Please create a new one for every conceptually different message. Please keep alphabetically ordered
 */
export const _InternalMessageId = createEnumStyle<typeof _eInternalMessageId>({
    // Non user actionable
    [BROWSER + "DoesNotSupport" + LOCAL + STORAGE as "BrowserDoesNotSupportLocalStorage"]: _eInternalMessageId.BrowserDoesNotSupportLocalStorage,
    [BROWSER + CANNOT + "Read" + LOCAL + STORAGE as "BrowserCannotReadLocalStorage"]: _eInternalMessageId.BrowserCannotReadLocalStorage,
    [BROWSER + CANNOT + "Read" + SESSION + STORAGE as "BrowserCannotReadSessionStorage"]: _eInternalMessageId.BrowserCannotReadSessionStorage,
    [BROWSER + CANNOT + "Write" + LOCAL + STORAGE as "BrowserCannotWriteLocalStorage"]: _eInternalMessageId.BrowserCannotWriteLocalStorage,
    [BROWSER + CANNOT + "Write" + SESSION + STORAGE as "BrowserCannotWriteSessionStorage"]: _eInternalMessageId.BrowserCannotWriteSessionStorage,
    [BROWSER + FAILED + "RemovalFrom" + LOCAL + STORAGE as "BrowserFailedRemovalFromLocalStorage"]: _eInternalMessageId.BrowserFailedRemovalFromLocalStorage,
    [BROWSER + FAILED + "RemovalFrom" + SESSION + STORAGE as "BrowserFailedRemovalFromSessionStorage"]: _eInternalMessageId.BrowserFailedRemovalFromSessionStorage,
    [CANNOT + "SendEmptyTelemetry" as "CannotSendEmptyTelemetry"]: _eInternalMessageId.CannotSendEmptyTelemetry,
    ClientPerformanceMathError: _eInternalMessageId.ClientPerformanceMathError,
    ["ErrorParsingAI" + SESSION + "Cookie" as "ErrorParsingAISessionCookie"]: _eInternalMessageId.ErrorParsingAISessionCookie,
    ErrorPVCalc: _eInternalMessageId.ErrorPVCalc,
    [EXCEPTION + "WhileLoggingError" as "ExceptionWhileLoggingError"]: _eInternalMessageId.ExceptionWhileLoggingError,
    [FAILED + "AddingTelemetryTo" + BUFFER as "FailedAddingTelemetryToBuffer"]: _eInternalMessageId.FailedAddingTelemetryToBuffer,
    [FAILED_MONITOR_AJAX + "Abort" as "FailedMonitorAjaxAbort"]: _eInternalMessageId.FailedMonitorAjaxAbort,
    [FAILED_MONITOR_AJAX + "Dur" as "FailedMonitorAjaxDur"]: _eInternalMessageId.FailedMonitorAjaxDur,
    [FAILED_MONITOR_AJAX + "Open" as "FailedMonitorAjaxOpen"]: _eInternalMessageId.FailedMonitorAjaxOpen,
    [FAILED_MONITOR_AJAX + "RSC" as "FailedMonitorAjaxRSC"]: _eInternalMessageId.FailedMonitorAjaxRSC,
    [FAILED_MONITOR_AJAX + "Send" as "FailedMonitorAjaxSend"]: _eInternalMessageId.FailedMonitorAjaxSend,
    [FAILED_MONITOR_AJAX + "GetCorrelationHeader" as "FailedMonitorAjaxGetCorrelationHeader"]: _eInternalMessageId.FailedMonitorAjaxGetCorrelationHeader,
    [FAILED + "ToAddHandlerForOnBeforeUnload" as "FailedToAddHandlerForOnBeforeUnload"]: _eInternalMessageId.FailedToAddHandlerForOnBeforeUnload,
    [FAILED + "ToSendQueuedTelemetry" as "FailedToSendQueuedTelemetry"]: _eInternalMessageId.FailedToSendQueuedTelemetry,
    [FAILED + "ToReportDataLoss" as "FailedToReportDataLoss"]: _eInternalMessageId.FailedToReportDataLoss,
    ["Flush" + FAILED as "FlushFailed"]: _eInternalMessageId.FlushFailed,
    MessageLimitPerPVExceeded: _eInternalMessageId.MessageLimitPerPVExceeded,
    MissingRequiredFieldSpecification: _eInternalMessageId.MissingRequiredFieldSpecification,
    NavigationTimingNotSupported: _eInternalMessageId.NavigationTimingNotSupported,
    OnError: _eInternalMessageId.OnError,
    [SESSION + "RenewalDateIsZero" as "SessionRenewalDateIsZero"]: _eInternalMessageId.SessionRenewalDateIsZero,
    SenderNotInitialized: _eInternalMessageId.SenderNotInitialized,
    [START + TRACK + EVENT + FAILED as "StartTrackEventFailed"]: _eInternalMessageId.StartTrackEventFailed,
    [STOP + TRACK + EVENT + FAILED as "StopTrackEventFailed"]: _eInternalMessageId.StopTrackEventFailed,
    [START + TRACK + FAILED as "StartTrackFailed"]: _eInternalMessageId.StartTrackFailed,
    [STOP + TRACK + FAILED as "StopTrackFailed"]: _eInternalMessageId.StopTrackFailed,
    TelemetrySampledAndNotSent: _eInternalMessageId.TelemetrySampledAndNotSent,
    [TRACK + EVENT + FAILED as "TrackEventFailed"]: _eInternalMessageId.TrackEventFailed,
    [TRACK + EXCEPTION + FAILED as "TrackExceptionFailed"]: _eInternalMessageId.TrackExceptionFailed,
    [TRACK + "Metric" + FAILED as "TrackMetricFailed"]: _eInternalMessageId.TrackMetricFailed,
    [TRACK + "PV" + FAILED as "TrackPVFailed"]: _eInternalMessageId.TrackPVFailed,
    [TRACK + "PV" + FAILED + "Calc" as "TrackPVFailedCalc"]: _eInternalMessageId.TrackPVFailedCalc,
    [TRACK + "Trace" + FAILED as "TrackTraceFailed"]: _eInternalMessageId.TrackTraceFailed,
    ["Transmission" + FAILED as "TransmissionFailed"]: _eInternalMessageId.TransmissionFailed,
    [FAILED + "ToSet" + STORAGE + BUFFER as "FailedToSetStorageBuffer"]: _eInternalMessageId.FailedToSetStorageBuffer,
    [FAILED + "ToRestore" + STORAGE + BUFFER as "FailedToRestoreStorageBuffer"]: _eInternalMessageId.FailedToRestoreStorageBuffer,
    InvalidBackendResponse: _eInternalMessageId.InvalidBackendResponse,
    [FAILED + "ToFixDepricatedValues" as "FailedToFixDepricatedValues"]: _eInternalMessageId.FailedToFixDepricatedValues,
    InvalidDurationValue: _eInternalMessageId.InvalidDurationValue,
    TelemetryEnvelopeInvalid: _eInternalMessageId.TelemetryEnvelopeInvalid,
    CreateEnvelopeError: _eInternalMessageId.CreateEnvelopeError,

    // User actionable
    [CANNOT + "SerializeObject" as "CannotSerializeObject"]: _eInternalMessageId.CannotSerializeObject,
    [CANNOT + "SerializeObjectNonSerializable" as "CannotSerializeObjectNonSerializable"]: _eInternalMessageId.CannotSerializeObjectNonSerializable,
    CircularReferenceDetected: _eInternalMessageId.CircularReferenceDetected,
    ["Clear" + AUTH_CONTEXT + FAILED as "ClearAuthContextFailed"]: _eInternalMessageId.ClearAuthContextFailed,
    [EXCEPTION + "Truncated" as "ExceptionTruncated"]: _eInternalMessageId.ExceptionTruncated,
    IllegalCharsInName: _eInternalMessageId.IllegalCharsInName,
    ItemNotInArray: _eInternalMessageId.ItemNotInArray,
    MaxAjaxPerPVExceeded: _eInternalMessageId.MaxAjaxPerPVExceeded,
    MessageTruncated: _eInternalMessageId.MessageTruncated,
    NameTooLong: _eInternalMessageId.NameTooLong,
    SampleRateOutOfRange: _eInternalMessageId.SampleRateOutOfRange,
    ["Set" + AUTH_CONTEXT + FAILED as "SetAuthContextFailed"]: _eInternalMessageId.SetAuthContextFailed,
    ["Set" + AUTH_CONTEXT + FAILED + "AccountName" as "SetAuthContextFailedAccountName"]: _eInternalMessageId.SetAuthContextFailedAccountName,
    StringValueTooLong: _eInternalMessageId.StringValueTooLong,
    StartCalledMoreThanOnce: _eInternalMessageId.StartCalledMoreThanOnce,
    StopCalledWithoutStart: _eInternalMessageId.StopCalledWithoutStart,
    ["TelemetryInitializer" + FAILED as "TelemetryInitializerFailed"]: _eInternalMessageId.TelemetryInitializerFailed,
    TrackArgumentsNotSpecified: _eInternalMessageId.TrackArgumentsNotSpecified,
    UrlTooLong: _eInternalMessageId.UrlTooLong,
    [SESSION + STORAGE + BUFFER + "Full" as "SessionStorageBufferFull"]: _eInternalMessageId.SessionStorageBufferFull,
    [CANNOT + "AccessCookie" as "CannotAccessCookie"]: _eInternalMessageId.CannotAccessCookie,
    IdTooLong: _eInternalMessageId.IdTooLong,
    InvalidEvent: _eInternalMessageId.InvalidEvent,
    [FAILED_MONITOR_AJAX + "SetRequestHeader" as "FailedMonitorAjaxSetRequestHeader"]: _eInternalMessageId.FailedMonitorAjaxSetRequestHeader,
    ["Send" + BROWSER + "InfoOnUserInit" as "SendBrowserInfoOnUserInit"]: _eInternalMessageId.SendBrowserInfoOnUserInit,
    ["Plugin" + EXCEPTION as "PluginException"]: _eInternalMessageId.PluginException,
    ["Notification" + EXCEPTION as "NotificationException"]: _eInternalMessageId.NotificationException,
    SnippetScriptLoadFailure: _eInternalMessageId.SnippetScriptLoadFailure,
    ["Invalid" + INSTRUMENTATION_KEY as "InvalidInstrumentationKey"]: _eInternalMessageId.InvalidInstrumentationKey,
    [CANNOT + "ParseAiBlobValue" as "CannotParseAiBlobValue"]: _eInternalMessageId.CannotParseAiBlobValue,
    InvalidContentBlob: _eInternalMessageId.InvalidContentBlob,
    [TRACK + "PageAction" + EVENT + FAILED as "TrackPageActionEventFailed"]: _eInternalMessageId.TrackPageActionEventFailed,
    [FAILED + "AddingCustomDefinedRequestContext" as "FailedAddingCustomDefinedRequestContext"]: _eInternalMessageId.FailedAddingCustomDefinedRequestContext,
    ["InMemory" + STORAGE + BUFFER + "Full" as "InMemoryStorageBufferFull"]: _eInternalMessageId.InMemoryStorageBufferFull,
    [INSTRUMENTATION_KEY + "Deprecation" as "InstrumentationKeyDeprecation"]: _eInternalMessageId.InstrumentationKeyDeprecation
});
export type _InternalMessageId = number | _eInternalMessageId;
