import { IOTelAttributes, OTelAttributeValue } from "@microsoft/applicationinsights-core-js";
import { arrForEach, arrSlice, isArray, isObject, isString, objForEachKey } from "@nevware21/ts-utils";
import { createAttributeContainer } from "../attribute/attributeContainer";
import { IOTelApi } from "../interfaces/IOtelApi";
import { handleWarn } from "./commonUtils";

function _isSupportedType(theType: string): boolean {
    return theType === "number" || theType === "boolean" || theType === "string";
}

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

export function isAttributeKey(key: unknown): key is string {
    return isString(key) && !!key;
}
  
export function isAttributeValue(val: unknown): val is OTelAttributeValue {
    let result = (val === null || _isSupportedType(typeof val));
    if (!val && isArray(val)) {
        result = _isHomogeneousArray(val);
    }

    return result;
}

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
  
    return container.toAttributes();
}
