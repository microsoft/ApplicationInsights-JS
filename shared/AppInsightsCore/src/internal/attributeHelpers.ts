import { arrForEach, arrSlice, isArray, isObject, isString, objForEachKey } from "@nevware21/ts-utils";
import { IOTelApi } from "../interfaces/otel/IOTelApi";
import { IOTelAttributes, OTelAttributeValue } from "../interfaces/otel/IOTelAttributes";
import { createAttributeContainer } from "../otel/attribute/attributeContainer";
import { handleWarn } from "./handleErrors";

/*#__NO_SIDE_EFFECTS__*/
function _isSupportedType(theType: string): boolean {
    return theType === "number" || theType === "boolean" || theType === "string";
}

/*#__NO_SIDE_EFFECTS__*/
function _isHomogeneousArray(arr: unknown[]): boolean {
    let type: string | undefined;
    let result = true;

    arrForEach(arr, (element) => {
        // null/undefined elements are allowed
        if (element !== null) {
            let elType = typeof element;
  
            if (!type) {
                result = _isSupportedType(elType);
                type = elType;
            } else {
                result = (type === elType);
            }
        }

        if (!result) {
            return -1;
        }
    });
  
    return result;
}

/**
  * Helper to determine if the provided key is a valid attribute key
  * @param key - The key to check
  * @returns true if the key is a valid attribute key
  */
/*#__NO_SIDE_EFFECTS__*/
export function isAttributeKey(key: unknown): key is string {
    return isString(key) && !!key;
}
  
/**
 * Helper to determine if the provided value is a valid attribute value
 * @param val - The value to check
 * @returns true if the value is a valid attribute value
 */
/*#__NO_SIDE_EFFECTS__*/
export function isAttributeValue(val: unknown): val is OTelAttributeValue {
    let result = (val === null || _isSupportedType(typeof val));
    if (val && isArray(val)) {
        result = _isHomogeneousArray(val);
    }

    return result;
}

/**
 * Sanitize the provided attributes to ensure they conform to OTel attribute requirements
 * @param otelApi - The OpenTelemetry API instance
 * @param attributes - The attributes to sanitize
 * @returns The sanitized attributes
 */
/*#__NO_SIDE_EFFECTS__*/
export function sanitizeAttributes(otelApi: IOTelApi, attributes: unknown): IOTelAttributes {
    let container = createAttributeContainer(otelApi.cfg);
  
    if (!isObject(attributes) || attributes == null) {
        return {};
    }
  
    objForEachKey(attributes, (key: string, val: unknown) => {
        if (!isAttributeKey(key)) {
            handleWarn(otelApi.cfg.errorHandlers, "Invalid attribute key: " + key);
        } else if (!isAttributeValue(val)) {
            handleWarn(otelApi.cfg.errorHandlers, "Invalid attribute value set for : " + key);
        } else if (isArray(val)) {
            container.set(key, arrSlice(val as any) as OTelAttributeValue);
        } else {
            container.set(key, val);
        }
    });
  
    return container.attributes;
}
