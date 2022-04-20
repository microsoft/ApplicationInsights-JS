import dynamicProto from "@microsoft/dynamicproto-js"
import {
    IDiagnosticLogger, _eInternalMessageId, _throwInternal, eLoggingSeverity, getJSON, isArray, isFunction, isObject, objForEachKey
} from "@microsoft/applicationinsights-core-js";
import { FieldType, ISerializable } from "@microsoft/applicationinsights-common";

export class Serializer {

    constructor(logger: IDiagnosticLogger) {
        dynamicProto(Serializer, this, (_self) => {
            /**
             * Serializes the current object to a JSON string.
             */
            _self.serialize = (input: ISerializable): string => {
                const output = _serializeObject(input, "root");
                try {
                    return getJSON().stringify(output);
                } catch (e) {
                    // if serialization fails return an empty string
                    _throwInternal(logger, eLoggingSeverity.CRITICAL, _eInternalMessageId.CannotSerializeObject, (e && isFunction(e.toString)) ? e.toString() : "Error serializing object", null, true);
                }
            }

            function _serializeObject(source: ISerializable, name: string): any {
                const circularReferenceCheck = "__aiCircularRefCheck";
                let output = {};

                if (!source) {
                    _throwInternal(logger, eLoggingSeverity.CRITICAL, _eInternalMessageId.CannotSerializeObject, "cannot serialize object because it is null or undefined", { name }, true);
                    return output;
                }

                if (source[circularReferenceCheck]) {
                    _throwInternal(logger, eLoggingSeverity.WARNING, _eInternalMessageId.CircularReferenceDetected, "Circular reference detected while serializing object", { name }, true);
                    return output;
                }

                if (!source.aiDataContract) {
                    // special case for measurements/properties/tags
                    if (name === "measurements") {
                        output = _serializeStringMap(source, "number", name);
                    } else if (name === "properties") {
                        output = _serializeStringMap(source, "string", name);
                    } else if (name === "tags") {
                        output = _serializeStringMap(source, "string", name);
                    } else if (isArray(source)) {
                        output = _serializeArray(source as any, name);
                    } else {
                        _throwInternal(logger, eLoggingSeverity.WARNING, _eInternalMessageId.CannotSerializeObjectNonSerializable, "Attempting to serialize an object which does not implement ISerializable", { name }, true);

                        try {
                            // verify that the object can be stringified
                            getJSON().stringify(source);
                            output = source;
                        } catch (e) {
                            // if serialization fails return an empty string
                            _throwInternal(logger, eLoggingSeverity.CRITICAL, _eInternalMessageId.CannotSerializeObject, (e && isFunction(e.toString)) ? e.toString() : "Error serializing object", null, true);
                        }
                    }

                    return output;
                }

                source[circularReferenceCheck] = true;
                objForEachKey(source.aiDataContract, (field, contract) => {
                    const isRequired = (isFunction(contract)) ? (contract() & FieldType.Required) : (contract & FieldType.Required);
                    const isHidden = (isFunction(contract)) ? (contract() & FieldType.Hidden) : (contract & FieldType.Hidden);
                    const isArray = contract & FieldType.Array;

                    const isPresent = source[field] !== undefined;
                    const isObj = isObject(source[field]) && source[field] !== null;

                    if (isRequired && !isPresent && !isArray) {
                        _throwInternal(logger,
                            eLoggingSeverity.CRITICAL,
                            _eInternalMessageId.MissingRequiredFieldSpecification,
                            "Missing required field specification. The field is required but not present on source",
                            { field, name });

                        // If not in debug mode, continue and hope the error is permissible
                    } else if (!isHidden) {  // Don't serialize hidden fields
                        let value;
                        if (isObj) {
                            if (isArray) {
                                // special case; recurse on each object in the source array
                                value = _serializeArray(source[field], field);
                            } else {
                                // recurse on the source object in this field
                                value = _serializeObject(source[field], field);
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
                });

                delete source[circularReferenceCheck];
                return output;
            }

            function _serializeArray(sources: ISerializable[], name: string): any[] {
                let output: any[];

                if (!!sources) {
                    if (!isArray(sources)) {
                        _throwInternal(logger,
                            eLoggingSeverity.CRITICAL,
                            _eInternalMessageId.ItemNotInArray,
                            "This field was specified as an array in the contract but the item is not an array.\r\n",
                            { name }, true);
                    } else {
                        output = [];
                        for (let i = 0; i < sources.length; i++) {
                            const source = sources[i];
                            const item = _serializeObject(source, name + "[" + i + "]");
                            output.push(item);
                        }
                    }
                }

                return output;
            }

            function _serializeStringMap(map: any, expectedType: string, name: string) {
                let output: any;
                if (map) {
                    output = {};
                    objForEachKey(map, (field, value) => {
                        if (expectedType === "string") {
                            if (value === undefined) {
                                output[field] = "undefined";
                            } else if (value === null) {
                                output[field] = "null";
                            } else if (!value.toString) {
                                output[field] = "invalid field: toString() is not defined.";
                            } else {
                                output[field] = value.toString();
                            }
                        } else if (expectedType === "number") {
                            if (value === undefined) {
                                output[field] = "undefined";
                            } else if (value === null) {
                                output[field] = "null";
                            } else {
                                const num = parseFloat(value);
                                if (isNaN(num)) {
                                    output[field] = "NaN";
                                } else {
                                    output[field] = num;
                                }
                            }
                        } else {
                            output[field] = "invalid field: " + name + " is of unknown type.";
                            _throwInternal(logger, eLoggingSeverity.CRITICAL, output[field], null, true);
                        }
                    });
                }

                return output;
            }
        });
    }

    /**
     * Serializes the current object to a JSON string.
     */
    public serialize(input: ISerializable): string {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }
}
