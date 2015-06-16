/// <reference path="logging.ts" />
/// <reference path="util.ts" />

module Microsoft.ApplicationInsights {
    "use strict";

    export interface ISerializable {
        /**
         * The set of fields for a serializeable object. 
         * This defines the serialization order and a value of true/false
         * for each field defines whether the field is required or not.
         */
        aiDataContract: any;
    }

    export class Serializer {

        /**
         * Serializes the current object to a JSON string.
         */
        public static serialize(input: ISerializable): string {
            var output = Serializer._serializeObject(input, "root");
            return JSON.stringify(output);
        }

        private static _serializeObject(source: ISerializable, name: string): any {
            var circularReferenceCheck = "__aiCircularRefCheck";
            var output = {};

            if (!source) {
                _InternalLogging.throwInternalUserActionable(LoggingSeverity.CRITICAL, "cannot serialize " + name + " because it is null or undefined");
                return output;
            }

            if (source[circularReferenceCheck]) {
                _InternalLogging.throwInternalUserActionable(LoggingSeverity.WARNING, "Circular reference detected while serializing: '" + name);
                return output;
            }

            if (!source.aiDataContract) {
                // special case for measurements/properties/tags
                if (name === "measurements") {
                    output = Serializer._serializeStringMap(source, "number", name);
                } else if (name === "properties") {
                    output = Serializer._serializeStringMap(source, "string", name);
                } else if (name === "tags") {
                    output = Serializer._serializeStringMap(source, "string", name);
                } else if (Util.isArray(source)) {
                    output = Serializer._serializeArray(<any>source, name);
                } else {
                    _InternalLogging.throwInternalUserActionable(LoggingSeverity.WARNING, "Attempting to serialize an object which does not implement ISerializable: " + name);

                    try {
                        // verify that the object can be stringified
                        JSON.stringify(source);
                        output = source;
                    } catch (e) {
                        // if serialization fails return an empty string
                        _InternalLogging.throwInternalUserActionable(LoggingSeverity.CRITICAL, e && typeof e.toString === 'function' ? e.toString() : "Error serializing object");
                    }
                }

                return output;
            }

            source[circularReferenceCheck] = true;
            for (var field in source.aiDataContract) {
                var isRequired = source.aiDataContract[field];
                var isArray = typeof isRequired !== "boolean";
                var isPresent = source[field] !== undefined;
                var isObject = typeof source[field] === "object" && source[field] !== null;

                if (isRequired && !isPresent && !isArray) {
                    _InternalLogging.throwInternalNonUserActionable(
                        LoggingSeverity.CRITICAL,
                        "Missing required field specification: The field '" + field + "' is required but not present on source");

                    // If not in debug mode, continue and hope the error is permissible
                    continue;
                }

                var value;
                if (isObject) {
                    if (isArray) {
                        // special case; resurse on each object in the source array
                        value = Serializer._serializeArray(source[field], field);
                    } else {
                        // recurse on the source object in this field
                        value = Serializer._serializeObject(source[field], field);
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

        private static _serializeArray(sources: Array<ISerializable>, name: string): Array<any> {
            var output = undefined;

            if (!!sources) {
                if (!Util.isArray(sources)) {
                    _InternalLogging.throwInternalUserActionable(
                        LoggingSeverity.CRITICAL,
                        "This field was specified as an array in the contract but the item is not an array.\r\n" + name);
                } else {
                    output = [];
                    for (var i = 0; i < sources.length; i++) {
                        var source = sources[i];
                        var item = Serializer._serializeObject(source, name + "[" + i + "]");
                        output.push(item);
                    }
                }
            }

            return output;
        }

        private static _serializeStringMap(map, expectedType, name) {
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
                        _InternalLogging.throwInternalUserActionable(LoggingSeverity.CRITICAL, output[field]);
                    }
                }
            }

            return output;
        }
    }
}