import { isNullOrUndefined, isString, objForEachKey } from "@microsoft/applicationinsights-core-js";
import { arrForEach, arrIncludes, arrIndexOf, getLength } from "@nevware21/ts-utils";
import {
    FieldValueSanitizerFunc, FieldValueSanitizerTypes, IEventProperty, IFieldSanitizerDetails, IFieldValueSanitizerProvider, IValueSanitizer
} from "./DataModels";
import { FieldValueSanitizerType } from "./Enums";
import { STR_EMPTY } from "./InternalConstants";
import { getFieldValueType, isValueAssigned, isValueKind } from "./Utils";

interface ISanitizerMapValue {
    canHandle: boolean;
    handler?: IValueSanitizer;
    fieldHandler?: IFieldValueSanitizerProvider;
}

function _isSpecialName(name: string) {
    return (name == "__proto__" || name == "constructor" || name == "prototype");
}

export class ValueSanitizer implements IValueSanitizer {

    public static getFieldType = getFieldValueType;

    /**
     * Clear the current value sanitizer cache.
     */
    public clearCache: () => void;

    /**
     * Add a value sanitizer as a fallback sanitizer if this sanitizer can't handle the path/name.
     */
    public addSanitizer: (sanitizer: IValueSanitizer) => void;

    /**
     * Adds a field sanitizer to the evaluation list
     */
    public addFieldSanitizer: (fieldSanitizer: IFieldValueSanitizerProvider) => void;

    /**
     * Removes the value sanitizer as a fallback sanitizer if this sanitizer can't handle the path/name if present.
     */
    public rmSanitizer: (theSanitizer: IValueSanitizer) => void;

    /**
     * Removes the field sanitizer to the evaluation list if present
     */
    public rmFieldSanitizer: (theFieldSanitizer: IFieldValueSanitizerProvider) => void;

    /**
     * Does this field value sanitizer handle this path / field combination
     * @param path - The field path
     * @param name - The name of the field
     */
    public handleField: (path: string, name: string) => boolean;

    /**
     * Sanitizes the value. It checks the that the property name and value are valid. It also
     * checks/populates the correct type and pii of the property value.
     * @param path - The root path of the property
     * @param name - The property name.
     * @param value - The property value or an IEventProperty containing value, type ,pii and customer content.
     * @param stringifyObjects - If supplied tells the sanitizer that it should JSON stringify() objects
     * @returns IEventProperty containing valid name, value, pii and type or null if invalid.
     */
    public value: (path: string, name: string, value: FieldValueSanitizerTypes, stringifyObjects?: boolean) => IEventProperty | null;

    /**
     * Sanitizes the Property. It checks the that the property name and value are valid. It also
     * checks/populates the correct type and pii of the property value.
     * @param path - The root path of the property
     * @param name - The property name.
     * @param property - The property value or an IEventProperty containing value, type ,pii and customer content.
     * @param stringifyObjects - If supplied tells the sanitizer that it should JSON stringify() objects
     * @returns IEventProperty containing valid name, value, pii and type or null if invalid.
     */
    public property: (path: string, name: string, property: IEventProperty, stringifyObjects?: boolean) => IEventProperty | null;

    /**
     * Returns whether this ValueSanitizer is empty
     * @returns `true` if it contains no chained sanitizers or field sanitizers, otherwise `false`
     */
    public isEmpty?: () => boolean;

    constructor(fieldSanitizerProvider?: IFieldValueSanitizerProvider) {
        let _self = this;

        // To aid with performance this is a lookup map to check if the field value sanitizer supports this field
        let _sanitizerMap: { [path: string]: { [field: string]: ISanitizerMapValue } } = {};
        let _sanitizers: IValueSanitizer[] = [];
        let _fieldSanitizers: IFieldValueSanitizerProvider[] = [];
        if (fieldSanitizerProvider) {
            _fieldSanitizers.push(fieldSanitizerProvider);
        }

        function _getFieldSanitizer(path: string, name: string): ISanitizerMapValue {
            let result: ISanitizerMapValue;
            let fieldLookup = _sanitizerMap[path];
            if (fieldLookup) {
                result = fieldLookup[name];
            }

            if (!result && result !== null) {
                // Null is a valid result indicating that the value sanitizer does not support this field
                if (isString(path) && isString(name)) {
                    if (_fieldSanitizers.length > 0) {
                        for (let lp = 0; lp < _fieldSanitizers.length; lp++) {
                            if (_fieldSanitizers[lp].handleField(path, name)) {
                                result = {
                                    canHandle: true, // This instance will handle so we won't assign the handler
                                    fieldHandler: _fieldSanitizers[lp]
                                };
                                break;
                            }
                        }
                    } else if (_sanitizers.length === 0) {
                        // Special use-case where there is no sanitizer to pass on to, so just resolving the field
                        // and returning the resulting value (same as sanitizeProperty())
                        result = {
                            canHandle: true
                        };
                    }
                }

                // We still don't have a handler so lets lookup the providers
                if (!result && result !== null) {
                    // Setting the result to null -- which means we and any contained sanitizers can't handle this field
                    result = null;
                    for (let lp = 0; lp < _sanitizers.length; lp++) {
                        if (_sanitizers[lp].handleField(path, name)) {
                            result = {
                                canHandle: true,
                                handler: _sanitizers[lp],
                                fieldHandler: null
                            };
                            break;
                        }
                    }
                }

                if (!fieldLookup) {
                    // Handle edge case to avoid prototype pollution
                    if (_isSpecialName(path)) {
                        return null;
                    }

                    fieldLookup = _sanitizerMap[path] = {};
                }

                // Handle edge case to avoid prototype pollution
                if (_isSpecialName(name)) {
                    return null;
                }

                fieldLookup[name] = result;
            }

            return result;
        }

        _self.clearCache = () => {
            _sanitizerMap = {};
        };

        _self.addSanitizer = (newSanitizer: IValueSanitizer) => {
            if (newSanitizer) {
                if (!arrIncludes(_sanitizers, newSanitizer)) {
                    _sanitizers.push(newSanitizer);
                }

                // Invalidate any previously mapped fields
                _sanitizerMap = {};
            }
        };

        _self.addFieldSanitizer = (fieldSanitizer: IFieldValueSanitizerProvider) => {
            if (fieldSanitizer) {
                if (!arrIncludes(_fieldSanitizers, fieldSanitizer)) {
                    _fieldSanitizers.push(fieldSanitizer);
                }

                // Invalidate any previously mapped fields
                _sanitizerMap = {};
            }
        };

        _self.rmSanitizer = (theSanitizer: IValueSanitizer) => {
            if (theSanitizer) {
                let idx = arrIndexOf(_sanitizers, theSanitizer);
                if (idx !== -1) {
                    _sanitizers.splice(idx, 1);
                    // Invalidate any previously mapped fields
                    _sanitizerMap = {};
                }

                // Try and remove the sanitizer from any chained sanitizer as well
                arrForEach(_sanitizers, (sanitizer) => {
                    sanitizer && sanitizer.rmSanitizer && sanitizer.rmSanitizer(theSanitizer);
                });
            }
        };

        _self.rmFieldSanitizer = (theFieldSanitizer: IFieldValueSanitizerProvider) => {
            if (theFieldSanitizer) {
                let idx = arrIndexOf(_fieldSanitizers, theFieldSanitizer);
                if (idx !== -1) {
                    _fieldSanitizers.splice(idx, 1);
                    // Invalidate any previously mapped fields
                    _sanitizerMap = {};
                }

                // Try and remove the field sanitizer from any chained sanitizer as well
                arrForEach(_sanitizers, (sanitizer) => {
                    sanitizer && sanitizer.rmFieldSanitizer && sanitizer.rmFieldSanitizer(theFieldSanitizer);
                });
            }
        };

        _self.isEmpty = () => {
            return (getLength(_sanitizers) + getLength(_fieldSanitizers)) === 0;
        };

        _self.handleField = (path: string, name: string): boolean => {
            let mapValue: ISanitizerMapValue = _getFieldSanitizer(path, name);
            return mapValue ? mapValue.canHandle : false;
        };

        _self.value = (path: string, name: string, value: FieldValueSanitizerTypes, stringifyObjects?: boolean): IEventProperty | null => {
            let mapValue: ISanitizerMapValue = _getFieldSanitizer(path, name);
            if (mapValue && mapValue.canHandle) {
                if (!mapValue.canHandle) {
                    return null;
                }

                if (mapValue.handler) {
                    // This value sanitizer can't handle this field so pass it only the next one
                    return mapValue.handler.value(path, name, value, stringifyObjects);
                }

                // Check that property is valid
                if (!isString(name) || isNullOrUndefined(value) || (value as any) === STR_EMPTY) {
                    return null;
                }

                let property = null;
                let fieldType = getFieldValueType(value);

                if ((fieldType & FieldValueSanitizerType.EventProperty) === FieldValueSanitizerType.EventProperty) {
                    let subType = fieldType & ~FieldValueSanitizerType.EventProperty;
                    property = value as IEventProperty;
                    if (!isValueAssigned(property.value) ||
                        (subType !== FieldValueSanitizerType.String &&
                        subType !== FieldValueSanitizerType.Number &&
                        subType !== FieldValueSanitizerType.Boolean &&
                        (subType & FieldValueSanitizerType.Array) !== FieldValueSanitizerType.Array)) {

                        // Not a supported IEventProperty type to be able to sanitize
                        return null;
                    }
                } else if (fieldType === FieldValueSanitizerType.String ||
                        fieldType === FieldValueSanitizerType.Number ||
                        fieldType === FieldValueSanitizerType.Boolean ||
                        (fieldType & FieldValueSanitizerType.Array) === FieldValueSanitizerType.Array) {
                    // If the property isn't IEventProperty (and is either string, number, boolean or array), convert it into one.
                    property = _convertToProperty(path, name, value);
                } else if (fieldType === FieldValueSanitizerType.Object) {
                    property = _convertToProperty(path, name, !!stringifyObjects ? JSON.stringify(value) : value);
                }

                if (property) {
                    return _handleProperty(mapValue, path, name, fieldType, property, stringifyObjects);
                }
            }

            return null;
        };

        _self.property = (path: string, name: string, property: IEventProperty, stringifyObjects?: boolean): IEventProperty | null => {
            let mapValue: ISanitizerMapValue = _getFieldSanitizer(path, name);
            if (!mapValue || !mapValue.canHandle) {
                return null;
            }

            // Check that property is valid
            if (!isString(name) || isNullOrUndefined(property) || !isValueAssigned(property.value)) {
                return null;
            }

            let fieldType: FieldValueSanitizerType = getFieldValueType(property.value);
            if (fieldType === FieldValueSanitizerType.NotSet) {
                // Not a supported field that we can sanitize or serialize
                return null;
            }

            return _handleProperty(mapValue, path, name, fieldType, property, stringifyObjects);
        };

        function _handleProperty(mapValue: ISanitizerMapValue, path: string, name: string, fieldType: FieldValueSanitizerType,
            property: IEventProperty, stringifyObjects?: boolean): IEventProperty | null {

            if (mapValue.handler) {
                // This value sanitizer can't handle this field so pass it only the next one
                return mapValue.handler.property(path, name, property, stringifyObjects);
            }

            // If either pii or cc is set convert value to string (since only string pii/cc is allowed).
            // If the value is a complex type like an array that can't be converted to string we will drop
            // the property.
            if (!isNullOrUndefined(property.kind)) {
                if ((fieldType & FieldValueSanitizerType.Array) === FieldValueSanitizerType.Array || !isValueKind(property.kind)) {
                    return null;
                }

                // Convert the value to a string and assign back to the original value
                property.value = property.value.toString();
            }

            return _callFieldSanitizer(mapValue.fieldHandler, path, name, fieldType, property);
        }

        function _convertToProperty(path: string, name: string, value: any): IEventProperty | null {
            if (isValueAssigned(value)) {
                return { value: value } as IEventProperty;
            }

            return null;
        }

        function _callFieldSanitizer(fieldProvider: IFieldValueSanitizerProvider, path: string, name: string, theType: FieldValueSanitizerType, property: IEventProperty) {
            if (property && fieldProvider) {
                let sanitizer: FieldValueSanitizerFunc = fieldProvider.getSanitizer(path, name, theType, property.kind, property.propertyType);
                if (sanitizer) {
                    // This is where we the field will call the handler to "scrub" the value. This the primary hook for the ClientHashing Plugin to
                    // be able to apply the hashFunc() / Sha256 conversion of the properties value
                    if (theType === FieldValueSanitizerType.Object) {
                        // Special case of an embedded object (ext.metadata, data.properties)
                        let newValue: any = { };
                        let propValue = property.value;
                        objForEachKey(propValue, (propKey, theValue) => {
                            let newPath = path + "." + name;
                            if (isValueAssigned(theValue)) {
                                let newProp = _convertToProperty(newPath, propKey, theValue);
                                newProp = _callFieldSanitizer(fieldProvider, newPath, propKey, getFieldValueType(theValue), newProp);
                                if (newProp) {
                                    newValue[propKey] = newProp.value;
                                }
                            }
                        });

                        property.value = newValue;
                    } else {
                        let details: IFieldSanitizerDetails = {
                            path: path,
                            name: name,
                            type: theType,
                            prop: property,
                            sanitizer: _self
                        };

                        property = sanitizer.call(_self, details);
                    }
                }
            }

            return property;
        }
    }
}
