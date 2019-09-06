import { Util, ISerializable, FieldType } from '@microsoft/applicationinsights-common';
import { IDiagnosticLogger, LoggingSeverity, _InternalMessageId } from '@microsoft/applicationinsights-core-js';

export class Serializer {

    private _logger: IDiagnosticLogger;

    constructor(logger: IDiagnosticLogger) {
        this._logger = logger;
    }

    /**
     * Serializes the current object to a JSON string.
     */
    public serialize(input: ISerializable): string {
        const output = this._serializeObject(input, "root");
        return JSON.stringify(output);
    }

    private _serializeObject(source: ISerializable, name: string): any {
        const circularReferenceCheck = "__aiCircularRefCheck";
        let output = {};

        if (!source) {
            this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.CannotSerializeObject, "cannot serialize object because it is null or undefined", { name }, true);
            return output;
        }

        if (source[circularReferenceCheck]) {
            this._logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.CircularReferenceDetected, "Circular reference detected while serializing object", { name }, true);
            return output;
        }

        if (!source.aiDataContract) {
            // special case for measurements/properties/tags
            if (name === "measurements") {
                output = this._serializeStringMap(source, "number", name);
            } else if (name === "properties") {
                output = this._serializeStringMap(source, "string", name);
            } else if (name === "tags") {
                output = this._serializeStringMap(source, "string", name);
            } else if (Util.isArray(source)) {
                output = this._serializeArray(source as any, name);
            } else {
                this._logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.CannotSerializeObjectNonSerializable, "Attempting to serialize an object which does not implement ISerializable", { name }, true);

                try {
                    // verify that the object can be stringified
                    JSON.stringify(source);
                    output = source;
                } catch (e) {
                    // if serialization fails return an empty string
                    this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.CannotSerializeObject, (e && typeof e.toString === 'function') ? e.toString() : "Error serializing object", null, true);
                }
            }

            return output;
        }

        source[circularReferenceCheck] = true;
        for (const field in source.aiDataContract) {

            const contract = source.aiDataContract[field];
            const isRequired = (typeof contract === "function") ? (contract() & FieldType.Required) : (contract & FieldType.Required);
            const isHidden = (typeof contract === "function") ? (contract() & FieldType.Hidden) : (contract & FieldType.Hidden);
            const isArray = contract & FieldType.Array;

            const isPresent = source[field] !== undefined;
            const isObject = typeof source[field] === "object" && source[field] !== null;

            if (isRequired && !isPresent && !isArray) {
                this._logger.throwInternal(
                    LoggingSeverity.CRITICAL,
                    _InternalMessageId.MissingRequiredFieldSpecification,
                    "Missing required field specification. The field is required but not present on source",
                    { field, name });

                // If not in debug mode, continue and hope the error is permissible
                continue;
            }

            if (isHidden) {
                // Don't serialize hidden fields
                continue;
            }

            let value;
            if (isObject) {
                if (isArray) {
                    // special case; resurse on each object in the source array
                    value = this._serializeArray(source[field], field);
                } else {
                    // recurse on the source object in this field
                    value = this._serializeObject(source[field], field);
                }
            } else {
                // assign the source field to the output even if undefined or required
                value = source[field];
            }

            // only emit this field if the value is defined
            if (value !== undefined) {
                output[field] = value;
            }
        }

        delete source[circularReferenceCheck];
        return output;
    }

    private _serializeArray(sources: ISerializable[], name: string): any[] {
        let output;

        if (!!sources) {
            if (!Util.isArray(sources)) {
                this._logger.throwInternal(
                    LoggingSeverity.CRITICAL,
                    _InternalMessageId.ItemNotInArray,
                    "This field was specified as an array in the contract but the item is not an array.\r\n",
                    { name }, true);
            } else {
                output = [];
                for (let i = 0; i < sources.length; i++) {
                    const source = sources[i];
                    const item = this._serializeObject(source, name + "[" + i + "]");
                    output.push(item);
                }
            }
        }

        return output;
    }

    private _serializeStringMap(map, expectedType, name) {
        let output;
        if (map) {
            output = {};
            for (const field in map) {
                const value = map[field];
                if (expectedType === "string") {
                    if (value === undefined) {
                        output[field] = "undefined";
                    } else if (value === null) {
                        output[field] = "null";
                    } else if (!value.toString) {
                        output[field] = "invalid field: toString() is not defined.";
                    }
                    else {
                        output[field] = value.toString();
                    }
                }
                else if (expectedType === "number") {
                    if (value === undefined) {
                        output[field] = "undefined";
                    } else if (value === null) {
                        output[field] = "null";
                    } else {
                        const num = parseFloat(value);
                        if (isNaN(num)) {
                            output[field] = "NaN";
                        }
                        else {
                            output[field] = num;
                        }
                    }
                }
                else {
                    output[field] = "invalid field: " + name + " is of unknown type.";
                    this._logger.throwInternal(LoggingSeverity.CRITICAL, output[field], null, true);
                }
            }
        }

        return output;
    }
}