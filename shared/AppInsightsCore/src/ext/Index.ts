/**
* Index.ts - 1DS-specific exports (now part of AppInsightsCore package)
*/
import { AppInsightsExtCore } from "./AppInsightsExtCore";
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
    AppInsightsExtCore, _ExtendedInternalMessageId, _eExtendedInternalMessageId,
    EventPropertyType, eEventPropertyType, IEventTiming, GuidStyle,
    FieldValueSanitizerFunc, FieldValueSanitizerType, FieldValueSanitizerTypes,
    IFieldSanitizerDetails, IFieldValueSanitizerProvider, IValueSanitizer, ValueSanitizer,
    EventLatencyValue, EventPersistenceValue, EventSendType
};

export {
    isValueAssigned, isLatency, isUint8ArrayAvailable, getTenantId, sanitizeProperty,
    Version, FullVersionString, getCommonSchemaMetaData, getCookieValue,
    extend, createGuid, isDocumentObjectAvailable, isWindowObjectAvailable,
    setProcessTelemetryTimings, getTime,
    isArrayValid, isValueKind, getFieldValueType,
    isChromium, openXhr, isGreaterThanZero
} from "./Utils";

// Only export BaseCore if you want it in the public API (was NOT exported in original 1ds-core-js)
// export { BaseCore } from "./BaseCore";

export { createExtendedTelemetryItemFromSpan } from "./extSpanUtils";
