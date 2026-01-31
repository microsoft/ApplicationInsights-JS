import dynamicProto from "@microsoft/dynamicproto-js"
import {
    IDiagnosticLogger, _eInternalMessageId, _throwInternal, eLoggingSeverity, getJSON, isArray, isFunction, isNullOrUndefined, isObject, objForEachKey
} from "@microsoft/applicationinsights-core-js";
import { FieldType, ISerializable } from "@microsoft/applicationinsights-core-js";

const enum eSerializeType {
    String = 1,
    Number = 2
}

/**
 * Used to "tag" objects that are currently being serialized to detect circular references
 */
const circularReferenceCheck = "__aiCircularRefCheck";

function _serializeObject(logger: IDiagnosticLogger, source: ISerializable, name: string): any {
    let output: any = {};

    if (!source) {
        _throwInternal(logger, eLoggingSeverity.CRITICAL, _eInternalMessageId.CannotSerializeObject, "cannot serialize object because it is null or undefined", { name }, true);
        return output;
    }

    if ((source as any)[circularReferenceCheck]) {
        _throwInternal(logger, eLoggingSeverity.WARNING, _eInternalMessageId.CircularReferenceDetected, "Circular reference detected while serializing object", { name }, true);
        return output;
    }

    if (!source.aiDataContract) {
        // special case for measurements/properties/tags
        if (name === "measurements") {
            output = _serializeStringMap(logger, source, eSerializeType.Number, name);
        } else if (name === "properties") {
            output = _serializeStringMap(logger, source, eSerializeType.String, name);
        } else if (name === "tags") {
            output = _serializeStringMap(logger, source, eSerializeType.String, name);
        } else if (isArray(source)) {
            output = _serializeArray(logger, source as any, name);
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

    (source as any)[circularReferenceCheck] = true;
    objForEachKey(source.aiDataContract, (field, contract) => {
        const fieldType = isFunction(contract) ? contract() : contract;
        const isRequired =  fieldType & FieldType.Required;
        const isHidden = fieldType & FieldType.Hidden;
        const isArray = fieldType & FieldType.Array;
        const isPresent = (source as any)[field] !== undefined;
        const isObj = isObject((source as any)[field]) && (source as any)[field] !== null;

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
                    value = _serializeArray(logger, (source as any)[field], field);
                } else {
                    // recurse on the source object in this field
                    value = _serializeObject(logger, (source as any)[field], field);
                }
            } else {
                // assign the source field to the output even if undefined or required
                value = (source as any)[field];
            }

            // only emit this field if the value is defined
            if (value !== undefined) {
                output[field] = value;
            }
        }
    });

    delete (source as any)[circularReferenceCheck];
    return output;
}

function _serializeArray(logger: IDiagnosticLogger, sources: ISerializable[], name: string): any[] {
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
                const item = _serializeObject(logger, source, name + "[" + i + "]");
                output.push(item);
            }
        }
    }

    return output;
}

function _serializeStringMap(logger: IDiagnosticLogger, map: any, expectedType: eSerializeType, name: string) {
    let output: any;
    if (map) {
        output = {};
        objForEachKey(map, (field, value) => {
            let serializedValue: string | number;
            if (value === undefined) {
                serializedValue = "undefined";
            } else if (value === null) {
                serializedValue = "null";
            }

            if (expectedType === eSerializeType.String && !serializedValue) {
                if (!value.toString) {
                    serializedValue = "invalid field: toString() is not defined.";
                } else {
                    serializedValue = value.toString();
                }
            } else if (expectedType === eSerializeType.Number && !serializedValue) {
                serializedValue = parseFloat(value);
            }

            if (serializedValue || !isNullOrUndefined(value)) {
                output[field] = serializedValue;
            }
        });
    }

    return output;
}

export class Serializer {

    constructor(logger: IDiagnosticLogger) {
        dynamicProto(Serializer, this, (_self) => {
            /**
             * Serializes the current object to a JSON string.
             */
            _self.serialize = (input: ISerializable): string => {
                const output = _serializeObject(logger, input, "root");
                try {
                    return getJSON().stringify(output);
                } catch (e) {
                    // if serialization fails return an empty string
                    _throwInternal(logger, eLoggingSeverity.CRITICAL, _eInternalMessageId.CannotSerializeObject, (e && isFunction(e.toString)) ? e.toString() : "Error serializing object", null, true);
                }
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
