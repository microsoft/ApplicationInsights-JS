/**
* DataModels.ts
* @author Abhilash Panwar (abpanwar) Hector Hernandez (hectorh)
* @copyright Microsoft 2018
* File containing the interfaces for Web JS SDK.
*/
import { IConfiguration, ITelemetryItem } from "@microsoft/applicationinsights-core-js";
import { EventLatencyValue, EventPersistenceValue, EventSendType, FieldValueSanitizerType } from "./Enums";

/**
 * An interface used to create an event property value along with tagging it as PII, or customer content.
 * <b>Caution:</b> Customer content and PII are mutually exclusive. You can use only one of them at a time.
 * If you use both, then the property will be considered invalid, and therefore won't be sent.
 */
export interface IEventProperty {
    /**
     * The value for the property.
     */
    value: string | number | boolean | string[] | number[] | boolean[];

    /**
     * [Optional] The value kind associated with property value. The constant enum ValueKind should be used to specify the
     * different kinds.
     */
    kind?: number /*| ValueKind*/;

    /**
     * [Optional] The data type for the property. Valid values accepted by onecollector are
     * "string", "bool", "double", "int64", "datetime", "guid".
     *  The EventPropertyType constant enum should be used to specify the different property type values.
     */
    propertyType?: number /*| EventPropertyType*/;
}

/**
 * An interface used to create an event, along with its name, properties, type, timestamp, and priority.
 */
export interface IExtendedTelemetryItem extends ITelemetryItem {
    /**
     * Properties to be captured about the telemetry item.
     * Custom properties (alternatively referred to as Part C properties for a Common Schema event) can be
     * directly added under data.
     */
    data?: {
        [key: string]: string | number | boolean | string[] | number[] | boolean[] | IEventProperty | object;
    };
    /**
     * Telemetry properties pertaining to domain about which data is being captured. Example, duration, referrerUri for browser page.
     * These are alternatively referred to as Part B properties for a Common Schema event.
     */
    baseData?: {
        [key: string]: string | number | boolean | string[] | number[] | boolean[] | IEventProperty | object;
    };
    /**
     * An EventLatency value, that specifies the latency for the event.The EventLatency constant should be
     * used to specify the different latency values.
     */
    latency?: number | EventLatencyValue;
    /**
     * [Optional] An EventPersistence value, that specifies the persistence for the event. The EventPersistence constant
     * should be used to specify the different persistence values.
     */
    persistence?: number | EventPersistenceValue;
    /**
     * [Optional] A boolean that specifies whether the event should be sent as a sync request.
     */
    sync?: boolean | EventSendType;
    /**
     * [Optional] A timings object.
     */
    timings?: IEventTiming;
}

/**
 * The IExtendedConfiguration interface holds the configuration details passed to core during initialize.
 */
export interface IExtendedConfiguration extends IConfiguration {
    /**
     * [Optional] The property storage override that should be used to store
     * internal SDK properties, otherwise stored as cookies. It is needed where cookies are not available.
     */
    propertyStorageOverride?: IPropertyStorageOverride;

    /**
     * [Optional] A boolean that indicated whether to disable the use of cookies by the 1DS Web SDK. The cookies added by the SDK are
     * MicrosoftApplicationsTelemetryDeviceId. If cookies are disabled, then session events are not sent unless propertyStorageOverride
     * is provided to store the values elsewhere.
     */
    disableCookiesUsage?: boolean;

    /**
     * [Optional] Name of the Anon cookie.  The value will be set in the qsp header to collector requests.  Collector will use this value to look for specific cookie to use for anid property.
     */
    anonCookieName?: string;

    /**
     * [Optional] Disables additional internal event timings that are added during processing of events, the timings are not sent as part telemetry items to the server
     */
    disableEventTimings?: boolean;

    /**
     * [Optional] Enables support for objects with compound keys which indirectly represent an object where the "key" of the object contains a "." as part of it's name.
     * @example
     * ```typescript
     * event: { "somedata.embeddedvalue": 123 }
     * ```
     */
    enableCompoundKey?: boolean;

    /**
     * Add "&w=0" parameter to support UA Parsing when web-workers don't have access to Document.
     * Default is false
     */
    enableWParam?: boolean;
 
     // End of Internal note: remove these after consuming the ApplicationInsights Core version that defines these on IConfiguration
 }

/**
 * An interface used for telemetry event timings.
 */
export interface IEventTiming {
    /**
     * Time when 1DS Core calls track
     */
    trackStart?: number;
    /**
     * Array of times when each plugin configured in 1DS calls processTelemetry method
     */
    processTelemetryStart?: { [key: string]: number; };
    /**
     * Array of times when a specific channel tried to send the telemetry to configured endpoint
     */
    sendEventStart?: { [key: string]: number; };
    /**
     * Array of times when a specific channel received a response from endpoint or request timed out
     */
    sendEventCompleted?: { [key: string]: number; };
    /**
     * Array of times when a specific channel started serialization of the telemetry event
     */
    serializationStart?: { [key: string]: number; };
    /**
     * Array of times when a specific channel completed serialization of the telemetry event
     */
    serializationCompleted?: { [key: string]: number; };
}

/**
 * The IPropertyStorageOverride interface provides a custom interface for storing internal SDK properties - otherwise they are
 * stored as cookies.
 * You need this interface when you intend to run auto collection for common properties, or when you log a session in
 * a non browser environment.
 */
export interface IPropertyStorageOverride {
    /**
     * A function for passing key value pairs to be stored.
     * @param key   - The key for the key value pair.
     * @param value - The value for the key value pair.
     */
    setProperty: (key: string, value: string) => void;
    /**
     * A function that gets a value for a given key.
     * @param key - The key for which the value must be fetched.
     */
    getProperty: (key: string) => string;
}

export type FieldValueSanitizerFunc = (details: IFieldSanitizerDetails) => IEventProperty | null;

export type FieldValueSanitizerTypes = string | number | boolean | object | string[] | number[] | boolean[] | IEventProperty;

/**
 * This interface defines the object that is passed to any provided FieldValueSanitizerFunc, it provides not only the value to be sanitized but also
 * some context about the value like it's location within the envelope (serialized object), the format is defined via the
 * [Common Schema 4.0](https://aka.ms/CommonSchema) specification.
 */
export interface IFieldSanitizerDetails {

    /**
     * The path within the event where the value is stored
     */
    path: string;

    /**
     * The name of the field with the event path that will store the value
     */
    name: string;

    /**
     * Identifies the type of the property value
     */
    type: FieldValueSanitizerType;

    /**
     * The value for the property.
     */
    prop: IEventProperty;

    /**
     * A reference to the value sanitizer that created the details
     */
    sanitizer: IValueSanitizer;
}

/**
 * This interface is used during the serialization of individual fields when converting the events into envelope (serialized object) which is sent to the services,
 * the format is defined via the [Common Schema 4.0](https://aka.ms/CommonSchema) specification. The path and field names used are based
 * on how the data is serialized to the service (CS 4.0 location) and not specifically the location on the event object you pass into the track methods (unless they are the same).
 */
export interface IFieldValueSanitizerProvider {
    /**
     * Does this field value sanitizer handle this path / field combination
     * @param path - The field path
     * @param name - The name of the field
     */
    handleField(path: string, name: string): boolean;

    /**
     * Get the field sanitizer for this type of field based on the field type, value kind and/or event property type
     * @param path - The field path
     * @param name - The name of the field
     * @param theType - The type of field
     * @param theKind - The value kind of the field
     * @param propType - The property type of the field
     */
    getSanitizer(path: string, name: string, theType: FieldValueSanitizerType, theKind?: number/* ValueKind*/, propType?: number/*EventPropertyType*/): FieldValueSanitizerFunc | null | undefined;
}

/**
 * This interface is used during the serialization of events into envelope (serialized object) which is sent to the services, the format is defined via the
 * [Common Schema 4.0](https://aka.ms/CommonSchema) specification. The path and field names used are based on how the data is serialized
 * to the service (CS 4.0 location) and not specifically the location on the event object you pass into the track methods (unless they are the same).
 */
export interface IValueSanitizer {
    /**
     * Add a value sanitizer as a fallback sanitizer if this sanitizer can't handle the path/name.
     */
    addSanitizer: (sanitizer: IValueSanitizer) => void;

    /**
     * Adds a field sanitizer to the evaluation list
     */
    addFieldSanitizer: (fieldSanitizer: IFieldValueSanitizerProvider) => void;

    /**
     * Removes the value sanitizer as a fallback sanitizer if this sanitizer can't handle the path/name if present.
     */
    rmSanitizer: (theSanitizer: IValueSanitizer) => void;

    /**
     * Removes the field sanitizer to the evaluation list if present
     */
    rmFieldSanitizer: (theFieldSanitizer: IFieldValueSanitizerProvider) => void;

    /**
     * Does this field value sanitizer handle this path / field combination
     * @param path - The field path
     * @param name - The name of the field
     */
    handleField: (path: string, name: string) => boolean;

    /**
     * Sanitizes the value. It checks the that the property name and value are valid. It also
     * checks/populates the correct type and pii of the property value.
     * @param path - The root path of the property
     * @param name - The property name.
     * @param value - The property value or an IEventProperty containing value, type ,pii and customer content.
     * @param stringifyObjects - If supplied tells the sanitizer that it should JSON stringify() objects
     * @returns IEventProperty containing valid name, value, pii and type or null if invalid.
     */
    value: (path: string, name: string, value: FieldValueSanitizerTypes, stringifyObjects?: boolean) => IEventProperty | null;

    /**
     * Sanitizes the Property. It checks the that the property name and value are valid. It also
     * checks/populates the correct type and pii of the property value.
     * @param path - The root path of the property
     * @param name - The property name.
     * @param property - The property value or an IEventProperty containing value, type ,pii and customer content.
     * @param stringifyObjects - If supplied tells the sanitizer that it should JSON stringify() objects
     * @returns IEventProperty containing valid name, value, pii and type or null if invalid.
     */
    property: (path: string, name: string, property: IEventProperty, stringifyObjects?: boolean) => IEventProperty | null;
}
