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
        var output = this._serializeObject(input, "root");
        return JSON.stringify(output);
    }

    private _serializeObject(source: ISerializable, name: string): any {
        var circularReferenceCheck = "__aiCircularRefCheck";
        var output = {};

        if (!source) {
            this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.CannotSerializeObject, "cannot serialize object because it is null or undefined", { name: name }, true);
            return output;
        }

        if (source[circularReferenceCheck]) {
            this._logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.CircularReferenceDetected, "Circular reference detected while serializing object", { name: name }, true);
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
                output = this._serializeArray(<any>source, name);
            } else {
                this._logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.CannotSerializeObjectNonSerializable, "Attempting to serialize an object which does not implement ISerializable", { name: name }, true);

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
        for (var field in source.aiDataContract) {

            var contract = source.aiDataContract[field];
            var isRequired = (typeof contract === "function") ? (contract() & FieldType.Required) : (contract & FieldType.Required);
            var isHidden = (typeof contract === "function") ? (contract() & FieldType.Hidden) : (contract & FieldType.Hidden);
            var isArray = contract & FieldType.Array;

            var isPresent = source[field] !== undefined;
            var isObject = typeof source[field] === "object" && source[field] !== null;

            if (isRequired && !isPresent && !isArray) {
                this._logger.throwInternal(
                    LoggingSeverity.CRITICAL,
                    _InternalMessageId.MissingRequiredFieldSpecification,
                    "Missing required field specification. The field is required but not present on source",
                    { field: field, name: name });

                // If not in debug mode, continue and hope the error is permissible
                continue;
            }

            if (isHidden) {
                // Don't serialize hidden fields
                continue;
            }

            var value;
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

    private _serializeArray(sources: Array<ISerializable>, name: string): Array<any> {
        var output = undefined;

        if (!!sources) {
            if (!Util.isArray(sources)) {
                this._logger.throwInternal(
                    LoggingSeverity.CRITICAL,
                    _InternalMessageId.ItemNotInArray,
                    "This field was specified as an array in the contract but the item is not an array.\r\n",
                    { name: name }, true);
            } else {
                output = [];
                for (var i = 0; i < sources.length; i++) {
                    var source = sources[i];
                    var item = this._serializeObject(source, name + "[" + i + "]");
                    output.push(item);
                }
            }
        }

        return output;
    }

    private _serializeStringMap(map, expectedType, name) {
        var output = undefined;
        if (map) {
            output = {};
            for (var field in map) {
                var value = map[field];
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
                        var num = parseFloat(value);
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