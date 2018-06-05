export enum LoggingSeverity {
    /**
     * Error will be sent as internal telemetry
     */
    CRITICAL = 0,

    /**
     * Error will NOT be sent as internal telemetry, and will only be shown in browser console
     */
    WARNING = 1
}

/**
 * Internal message ID. Please create a new one for every conceptually different message. Please keep alphabetically ordered
 */
export enum _InternalMessageId {
    // Non user actionable
    BrowserDoesNotSupportLocalStorage,
    BrowserCannotReadLocalStorage,
    BrowserCannotReadSessionStorage,
    BrowserCannotWriteLocalStorage,
    BrowserCannotWriteSessionStorage,
    BrowserFailedRemovalFromLocalStorage,
    BrowserFailedRemovalFromSessionStorage,
    CannotSendEmptyTelemetry,
    ClientPerformanceMathError,
    ErrorParsingAISessionCookie,
    ErrorPVCalc,
    ExceptionWhileLoggingError,
    FailedAddingTelemetryToBuffer,
    FailedMonitorAjaxAbort,
    FailedMonitorAjaxDur,
    FailedMonitorAjaxOpen,
    FailedMonitorAjaxRSC,
    FailedMonitorAjaxSend,
    FailedMonitorAjaxGetCorrelationHeader,
    FailedToAddHandlerForOnBeforeUnload,
    FailedToSendQueuedTelemetry,
    FailedToReportDataLoss,
    FlushFailed,
    MessageLimitPerPVExceeded,
    MissingRequiredFieldSpecification,
    NavigationTimingNotSupported,
    OnError,
    SessionRenewalDateIsZero,
    SenderNotInitialized,
    StartTrackEventFailed,
    StopTrackEventFailed,
    StartTrackFailed,
    StopTrackFailed,
    TelemetrySampledAndNotSent,
    TrackEventFailed,
    TrackExceptionFailed,
    TrackMetricFailed,
    TrackPVFailed,
    TrackPVFailedCalc,
    TrackTraceFailed,
    TransmissionFailed,
    FailedToSetStorageBuffer,
    FailedToRestoreStorageBuffer,
    InvalidBackendResponse,
    FailedToFixDepricatedValues,
    InvalidDurationValue,
    TelemetryEnvelopeInvalid,
    CreateEnvelopeError,

    // User actionable
    CannotSerializeObject,
    CannotSerializeObjectNonSerializable,
    CircularReferenceDetected,
    ClearAuthContextFailed,
    ExceptionTruncated,
    IllegalCharsInName,
    ItemNotInArray,
    MaxAjaxPerPVExceeded,
    MessageTruncated,
    NameTooLong,
    SampleRateOutOfRange,
    SetAuthContextFailed,
    SetAuthContextFailedAccountName,
    StringValueTooLong,
    StartCalledMoreThanOnce,
    StopCalledWithoutStart,
    TelemetryInitializerFailed,
    TrackArgumentsNotSpecified,
    UrlTooLong,
    SessionStorageBufferFull,
    CannotAccessCookie,
    IdTooLong,
}

/**
* Type of storage to differentiate between local storage and session storage
*/
export enum StorageType {
    LocalStorage,
    SessionStorage
}

/**
 * Enum is used in aiDataContract to describe how fields are serialized. 
 * For instance: (Fieldtype.Required | FieldType.Array) will mark the field as required and indicate it's an array
 */
export enum FieldType { Default = 0, Required = 1, Array = 2, Hidden = 4 };
