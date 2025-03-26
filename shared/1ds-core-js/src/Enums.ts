/**
* Enums.ts
* @author Abhilash Panwar (abpanwar)
* @copyright Microsoft 2018
* File containing the enums as constants.
*/

import { _eInternalMessageId, createEnumStyle } from "@microsoft/applicationinsights-core-js";

/**
 * The eValueKind contains a set of values that specify value kind of the property.
 * Either PII (Personal Identifiable Information) or customer content.
 */
export const enum eValueKind {
    /**
     * No kind.
     */
    NotSet = 0,

    /**
     * An LDAP distinguished name. For example, CN=Jeff Smith,OU=Sales,DC=Fabrikam,DC=COM.
     */
    Pii_DistinguishedName = 1,

    /**
     * Generic information.
     */
    Pii_GenericData = 2,

    /**
     * An IPV4 Internet address. For example, 192.0.2.1.
     */
    Pii_IPV4Address = 3,

    /**
     * An IPV6 Internet address. For example, 2001:0db8:85a3:0000:0000:8a2e:0370:7334.
     */
    Pii_IPv6Address = 4,

    /**
     * The Subject of an e-mail message.
     */
    Pii_MailSubject = 5,

    /**
     * A telephone number.
     */
    Pii_PhoneNumber = 6,

    /**
     * A query string.
     */
    Pii_QueryString = 7,

    /**
     * An SIP (Session Internet Protocol) address.
     */
    Pii_SipAddress = 8,

    /**
     * An e-mail address.
     */
    Pii_SmtpAddress = 9,

    /**
     * An user ID.
     */
    Pii_Identity = 10,

    /**
     * A URI (Uniform Resource Identifier).
     */
    Pii_Uri = 11,

    /**
     * The fully-qualified domain name.
     */
    Pii_Fqdn = 12,

    /**
     * Scrubs the last octet in a IPV4 Internet address.
     * For example: 10.121.227.147 becomes 10.121.227.*
     */
    Pii_IPV4AddressLegacy = 13,

    /**
     * Scrubs the last 4 Hextets (last 64-bits) of an IPv6 address
     */
    Pii_IPv6ScrubLastHextets = 14,

    /**
     * Drops the value altogether, rather than hashing
     */
    Pii_DropValue = 15,

    /**
     * Generic content.
     */
    CustomerContent_GenericContent = 32
}

/**
 * The ValueKind contains a set of values that specify value kind of the property.
 * Either PII (Personal Identifiable Information) or customer content.
 */
export const ValueKind = createEnumStyle<typeof eValueKind>({
    NotSet: eValueKind.NotSet,
    Pii_DistinguishedName: eValueKind.Pii_DistinguishedName,
    Pii_GenericData: eValueKind.Pii_GenericData,
    Pii_IPV4Address: eValueKind.Pii_IPV4Address,
    Pii_IPv6Address: eValueKind.Pii_IPv6Address,
    Pii_MailSubject: eValueKind.Pii_MailSubject,
    Pii_PhoneNumber: eValueKind.Pii_PhoneNumber,
    Pii_QueryString: eValueKind.Pii_QueryString,
    Pii_SipAddress: eValueKind.Pii_SipAddress,
    Pii_SmtpAddress: eValueKind.Pii_SmtpAddress,
    Pii_Identity: eValueKind.Pii_Identity,
    Pii_Uri: eValueKind.Pii_Uri,
    Pii_Fqdn: eValueKind.Pii_Fqdn,
    Pii_IPV4AddressLegacy: eValueKind.Pii_IPV4AddressLegacy,
    Pii_IPv6ScrubLastHextets: eValueKind.Pii_IPv6ScrubLastHextets,
    Pii_DropValue: eValueKind.Pii_DropValue,
    CustomerContent_GenericContent: eValueKind.CustomerContent_GenericContent
});
export type ValueKind = number | eValueKind

/**
 * The EventLatency contains a set of values that specify the latency with which an event is sent.
 */
export const enum EventLatencyValue {
    /**
     * Normal latency.
     */
    Normal = 1,
    /**
     * Cost deferred latency. At the moment this latency is treated as Normal latency.
     */
    CostDeferred = 2,
    /**
     * Real time latency.
     */
    RealTime = 3,

    /**
     * Bypass normal batching/timing and send as soon as possible, this will still send asynchronously.
     * Added in v3.1.1
     */
    Immediate = 4
}

/**
 * The EventLatency contains a set of values that specify the latency with which an event is sent.
 */
export const EventLatency = createEnumStyle<typeof EventLatencyValue>({
    /**
     * Normal latency.
     */
    Normal: EventLatencyValue.Normal,
    /**
     * Cost deferred latency. At the moment this latency is treated as Normal latency.
     */
    CostDeferred: EventLatencyValue.CostDeferred,
    /**
     * Real time latency.
     */
    RealTime: EventLatencyValue.RealTime,

    /**
     * Bypass normal batching/timing and send as soon as possible, this will still send asynchronously.
     * Added in v3.1.1
     */
    Immediate: EventLatencyValue.Immediate
});
export type EventLatency = number | EventLatencyValue

/**
 * Enum for property types.
 */
export const enum eEventPropertyType {
    Unspecified = 0,
    String = 1,
    Int32 = 2,
    UInt32 = 3,
    Int64 = 4,
    UInt64 = 5,
    Double = 6,
    Bool = 7,
    Guid = 8,
    DateTime = 9
}

/**
 * Enum for property types.
 */
export const EventPropertyType = createEnumStyle<typeof eEventPropertyType>({
    Unspecified: eEventPropertyType.Unspecified,
    String: eEventPropertyType.String,
    Int32: eEventPropertyType.Int32,
    UInt32: eEventPropertyType.UInt32,
    Int64: eEventPropertyType.Int64,
    UInt64: eEventPropertyType.UInt64,
    Double: eEventPropertyType.Double,
    Bool: eEventPropertyType.Bool,
    Guid: eEventPropertyType.Guid,
    DateTime: eEventPropertyType.DateTime
});
export type EventPropertyType = number | eEventPropertyType

/**
 * The EventPersistence contains a set of values that specify the event's persistence.
 */
export const enum EventPersistenceValue {
    /**
     * Normal persistence.
     */
    Normal = 1,
    /**
     * Critical persistence.
     */
    Critical = 2
}

/**
 * The EventPersistence contains a set of values that specify the event's persistence.
 */
export const EventPersistence = createEnumStyle<typeof EventPersistenceValue>({
    /**
     * Normal persistence.
     */
    Normal: EventPersistenceValue.Normal,

    /**
     * Critical persistence.
     */
    Critical: EventPersistenceValue.Critical
});
export type EventPersistence = number | EventPersistenceValue;

/**
 * Define a specific way to send an event synchronously
 */
export const enum EventSendType {
    /**
     * Batch and send the event asynchronously, this is the same as either setting the event `sync` flag to false or not setting at all.
     */
    Batched = 0, // For backward compatibility numeric 0 === false as a numeric

    /**
     * Attempt to send the event synchronously, this is the same as setting the event `sync` flag to true
     */
    Synchronous = 1, // For backward compatibility numeric 1 === true as a numeric

    /**
     * Attempt to send the event synchronously with a preference for the sendBeacon() API.
     * As per the specification, the payload of the event (when converted to JSON) must not be larger than 64kb,
     * the sendHook is also not supported or used when sendBeacon.
     */
    SendBeacon = 2,

    /**
     * Attempt to send the event synchronously with a preference for the fetch() API with the keepalive flag,
     * the SDK checks to ensure that the fetch() implementation supports the 'keepalive' flag and if not it
     * will fallback to either sendBeacon() or a synchronous XHR request.
     * As per the specification, the payload of the event (when converted to JSON) must not be larger than 64kb.
     * Note: Not all browsers support the keepalive flag so for those environments the events may still fail
     */
     SyncFetch = 3
}

/**
 * The TraceLevel contains a set of values that specify the trace level for the trace messages.
 */
export const enum eTraceLevel {
    /**
     * None.
     */
    NONE = 0,
    /**
     * Error trace.
     */
    ERROR = 1,
    /**
     * Warning trace.
     */
    WARNING = 2,
    /**
     * Information trace.
     */
    INFORMATION = 3
}

export const TraceLevel = createEnumStyle<typeof eTraceLevel>({
    NONE: eTraceLevel.NONE,
    ERROR: eTraceLevel.ERROR,
    WARNING: eTraceLevel.WARNING,
    INFORMATION: eTraceLevel.INFORMATION
});
export type TraceLevel = number | eTraceLevel;

export const enum _eExtendedInternalMessageId {
    AuthHandShakeError = 501,
    AuthRedirectFail = 502,
    BrowserCannotReadLocalStorage = 503,
    BrowserCannotWriteLocalStorage = 504,
    BrowserDoesNotSupportLocalStorage = 505,
    CannotParseBiBlobValue = 506,
    CannotParseDataAttribute = 507,
    CVPluginNotAvailable = 508,
    DroppedEvent = 509,
    ErrorParsingAISessionCookie = 510,
    ErrorProvidedChannels = 511,
    FailedToGetCookies = 512,
    FailedToInitializeCorrelationVector = 513,
    FailedToInitializeSDK = 514,
    InvalidContentBlob = 515,
    InvalidCorrelationValue = 516,
    SessionRenewalDateIsZero = 517,
    SendPostOnCompleteFailure = 518,
    PostResponseHandler = 519,
    SDKNotInitialized = 520
}

// export const _ExtendedInternalMessageId = objFreeze({
//     ..._InternalMessageId,
//     ...createEnumStyle<typeof _eExtendedInternalMessageId>({
//     AuthHandShakeError: _eExtendedInternalMessageId.AuthHandShakeError,
//     AuthRedirectFail: _eExtendedInternalMessageId.AuthRedirectFail,
//     BrowserCannotReadLocalStorage: _eExtendedInternalMessageId.BrowserCannotReadLocalStorage,
//     BrowserCannotWriteLocalStorage: _eExtendedInternalMessageId.BrowserCannotWriteLocalStorage,
//     BrowserDoesNotSupportLocalStorage: _eExtendedInternalMessageId.BrowserDoesNotSupportLocalStorage,
//     CannotParseBiBlobValue: _eExtendedInternalMessageId.CannotParseBiBlobValue,
//     CannotParseDataAttribute: _eExtendedInternalMessageId.CannotParseDataAttribute,
//     CVPluginNotAvailable: _eExtendedInternalMessageId.CVPluginNotAvailable,
//     DroppedEvent: _eExtendedInternalMessageId.DroppedEvent,
//     ErrorParsingAISessionCookie: _eExtendedInternalMessageId.ErrorParsingAISessionCookie,
//     ErrorProvidedChannels: _eExtendedInternalMessageId.ErrorProvidedChannels,
//     FailedToGetCookies: _eExtendedInternalMessageId.FailedToGetCookies,
//     FailedToInitializeCorrelationVector: _eExtendedInternalMessageId.FailedToInitializeCorrelationVector,
//     FailedToInitializeSDK: _eExtendedInternalMessageId.FailedToInitializeSDK,
//     InvalidContentBlob: _eExtendedInternalMessageId.InvalidContentBlob,
//     InvalidCorrelationValue: _eExtendedInternalMessageId.InvalidCorrelationValue,
//     SessionRenewalDateIsZero: _eExtendedInternalMessageId.SessionRenewalDateIsZero,
//     SendPostOnCompleteFailure: _eExtendedInternalMessageId.SendPostOnCompleteFailure,
//     PostResponseHandler: _eExtendedInternalMessageId.PostResponseHandler,
//     SDKNotInitialized: _eExtendedInternalMessageId.SDKNotInitialized
// })});
export type _ExtendedInternalMessageId = number | _eExtendedInternalMessageId | _eInternalMessageId;

// Following the format styles as defined by .Net (https://docs.microsoft.com/en-us/dotnet/api/system.guid.tostring?view=netcore-3.1)
export const enum GuidStyle {
    Numeric = "N",          // 'N' - 32 digits,
    Digits = "D",           // 'D' - 32 digits separated by hyphens,
    Braces = "B",           // 'B' - 32 digits separated by hyphens, enclosed in braces,
    Parentheses = "P"       // 'P' 32 digits separated by hyphens, enclosed in parentheses
}

export const enum FieldValueSanitizerType {
    NotSet = 0x00,

    String = 0x01,

    Number = 0x02,

    Boolean = 0x03,

    Object = 0x04,

    Array = 0x1000,

    EventProperty = 0x2000
}

/**
 * An enumeration that identifies the transport type that are requested to be used, if the requested
 * transport is not available ir supported the SDK may choose the first available transport or it
 * will log a warning to the diagnostic logger.
 */
export const enum TransportType {
    /**
     * Use the default available api
     */
    NotSet = 0,

    /**
     * Use XMLHttpRequest or XMLDomainRequest if available
     */
    Xhr = 1,

    /**
     * Use the Fetch api if available
     */
    Fetch = 2,

    /**
     * Use sendBeacon api if available
     */
    Beacon =  3
}
