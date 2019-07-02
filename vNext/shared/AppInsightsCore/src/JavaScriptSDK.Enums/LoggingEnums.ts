// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
export enum LoggingSeverity {
    /**
     * Error will be sent as internal telemetry
     */
    CRITICAL = 1,

    /**
     * Error will NOT be sent as internal telemetry, and will only be shown in browser console
     */
    WARNING = 2,
}

/**
 * Internal message ID. Please create a new one for every conceptually different message. Please keep alphabetically ordered
 */
export const _InternalMessageId = {
    // Non user actionable
    BrowserDoesNotSupportLocalStorage: 0,
    BrowserCannotReadLocalStorage: 1,
    BrowserCannotReadSessionStorage: 2,
    BrowserCannotWriteLocalStorage: 3,
    BrowserCannotWriteSessionStorage: 4,
    BrowserFailedRemovalFromLocalStorage: 5,
    BrowserFailedRemovalFromSessionStorage: 6,
    CannotSendEmptyTelemetry: 7,
    ClientPerformanceMathError: 8,
    ErrorParsingAISessionCookie: 9,
    ErrorPVCalc: 10,
    ExceptionWhileLoggingError: 11,
    FailedAddingTelemetryToBuffer: 12,
    FailedMonitorAjaxAbort: 13,
    FailedMonitorAjaxDur: 14,
    FailedMonitorAjaxOpen: 15,
    FailedMonitorAjaxRSC: 16,
    FailedMonitorAjaxSend: 17,
    FailedMonitorAjaxSetRequestHeader: 18,
    FailedMonitorAjaxGetCorrelationHeader: 19,
    FailedToAddHandlerForOnBeforeUnload: 20,
    FailedToSendQueuedTelemetry: 21,
    FailedToReportDataLoss: 22,
    FlushFailed: 23,
    MessageLimitPerPVExceeded: 24,
    MissingRequiredFieldSpecification: 25,
    NavigationTimingNotSupported: 26,
    OnError: 27,
    SessionRenewalDateIsZero: 28,
    SenderNotInitialized: 29,
    StartTrackEventFailed: 30,
    StopTrackEventFailed: 31,
    StartTrackFailed: 32,
    StopTrackFailed: 33,
    TelemetrySampledAndNotSent: 34,
    TrackEventFailed: 35,
    TrackExceptionFailed: 36,
    TrackMetricFailed: 37,
    TrackPVFailed: 38,
    TrackPVFailedCalc: 39,
    TrackTraceFailed: 40,
    TransmissionFailed: 41,
    FailedToSetStorageBuffer: 42,
    FailedToRestoreStorageBuffer: 43,
    InvalidBackendResponse: 44,
    FailedToFixDepricatedValues: 45,
    InvalidDurationValue: 46,
    TelemetryEnvelopeInvalid: 47,
    CreateEnvelopeError: 48,

    // User actionable
    CannotSerializeObject: 49,
    CannotSerializeObjectNonSerializable: 50,
    CircularReferenceDetected: 51,
    ClearAuthContextFailed: 52,
    ExceptionTruncated: 53,
    IllegalCharsInName: 54,
    ItemNotInArray: 55,
    MaxAjaxPerPVExceeded: 56,
    MessageTruncated: 57,
    NameTooLong: 58,
    SampleRateOutOfRange: 59,
    SetAuthContextFailed: 60,
    SetAuthContextFailedAccountName: 61,
    StringValueTooLong: 62,
    StartCalledMoreThanOnce: 63,
    StopCalledWithoutStart: 64,
    TelemetryInitializerFailed: 65,
    TrackArgumentsNotSpecified: 66,
    UrlTooLong: 67,
    SessionStorageBufferFull: 68,
    CannotAccessCookie: 69,
    IdTooLong: 70,
    InvalidEvent: 71,
};
export type _InternalMessageId = number | typeof _InternalMessageId;
