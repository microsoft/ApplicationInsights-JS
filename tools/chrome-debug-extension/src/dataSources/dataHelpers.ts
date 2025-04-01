// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import _ from "lodash";
import { arrForEach, isArray, isString, normalizeJsName } from "@microsoft/applicationinsights-core-js";
import {
    DynamicValueConverter, IConfiguration, IDataEventTypeCondition, IDynamicField, ISpecialFieldNames
} from "../configuration/IConfiguration";
import { defaultDataEventTypes, defaultExcludeFromCondensedList, defaultSessionId } from "../configuration/defaultConfiguration";
import { DataEventType, IDataEvent } from "./IDataEvent";
import { mathTrunc } from "@nevware21/ts-utils";

let _regExpMap: { [key: string]: RegExp } = {};

function _createRegEx(value: string) {
    // Escape any slashes first!
    value = value.replace(/\\/g, "\\\\");
    // eslint-disable-next-line security/detect-non-literal-regexp
    value = value.replace(/([\+\?\|\{\}\[\]\(\)\^\$\#\.\=\!\:\/])/g, "\\$1");
    value = value.replace(/\*/g, ".*");
    return new RegExp("(" + value + ")");
}

function _isMatch(source: string, value: string) {
    if (source.indexOf("*") !== -1) {
        const name = normalizeJsName(source);
        // Looks like it contains a wildcard match
        let regEx = _regExpMap[name] || (_regExpMap[name] = _createRegEx(source));
        return regEx.test(value);
    }

    return source === value;
}

export interface ICounts {
    all: number;
    appLogic: number;
    performance: number;
    warning: number;
    fatalError: number;
}

export function getEventType(dataEvent: IDataEvent, configuration: IConfiguration): DataEventType {
    let prioritizedDataEventTypeTests: IDataEventTypeCondition[] = configuration.prioritizedDataEventTypeTests || [];
    
    for (const dataEventTypeTest of prioritizedDataEventTypeTests) {
        const fieldValue = getFieldValueAsString(dataEvent, dataEventTypeTest.fieldName);
        if (fieldValue && _isMatch(dataEventTypeTest.fieldValue, fieldValue)) {
            return dataEventTypeTest.dataEventType;
        }
    }
    
    // Default to using the default set if the configuration found nothing
    for (const dataEventTypeTest of defaultDataEventTypes) {
        const fieldValue = getFieldValueAsString(dataEvent, dataEventTypeTest.fieldName);
        if (fieldValue && _isMatch(dataEventTypeTest.fieldValue, fieldValue)) {
            return dataEventTypeTest.dataEventType;
        }
    }

    return "other";
}

export function getDynamicFieldValue(dataEvent: IDataEvent, dynamicFields?: IDynamicField[]): string {
    if (dynamicFields === undefined) {
        return "";
    }

    for (const dynamicField of dynamicFields) {
        const rawValue = getFieldValueAsString(dataEvent, dynamicField.name);
        if (rawValue) {
            return applyConverter(rawValue, dynamicField.converter) || "";
        }
    }
    return "";
}

export function getCondensedDetails(dataEvent: IDataEvent, configuration: IConfiguration): any {
    if (!dataEvent.condensedDetails) {
        // Construct
        dataEvent.condensedDetails = JSON.parse(JSON.stringify((dataEvent||{}).data || {}));

        var excludeFields = (configuration || {}).fieldsToExcludeFromCondensedList;
        if (excludeFields) {
            arrForEach(excludeFields, (toExclude) => {
                _.unset(dataEvent.condensedDetails, toExclude);
            });
        } else {
            for (const toExclude of defaultExcludeFromCondensedList) {
                _.unset(dataEvent.condensedDetails, toExclude);
            }
        }
    }

    return dataEvent.condensedDetails;
}

export function applyConverter(
    value: string | undefined,
    converter?: DynamicValueConverter
): string | undefined {
    if (value === undefined) {
        return undefined;
    }

    switch (converter) {
    case "RemoveSafeTags": {
        return value.replace("<safe>", "").replace("</safe>", "");
    }
    case "NumberToWholeMilliseconds": {
        return `${mathTrunc(Number.parseInt(value, 10))} ms`;
    }
    case "TruncateWithDigitGrouping": {
        return `${mathTrunc(Number.parseInt(value, 10)).toLocaleString()}`;
    }
    default: {
        return value;
    }
    }
}

export function getSessionId(dataEvent: IDataEvent, configuration: IConfiguration): string | undefined {
    let specialFieldNames: ISpecialFieldNames = (configuration.specialFieldNames || {});
    const value = getFieldValueAsString(dataEvent, specialFieldNames.sessionId) || getFieldValueAsString(dataEvent, defaultSessionId);

    if (value && specialFieldNames.sessionIdRegex) {
        const matches = value.match(new RegExp(specialFieldNames.sessionIdRegex));
        if (matches && matches.length > 1) {
            return matches[1];
        } else {
            return undefined;
        }
    } else {
        return value;
    }
}

export function getFieldValueAsString(dataEvent: IDataEvent, fieldNames?: string|string[]): string | undefined {
    if (dataEvent && fieldNames) {
        let names: string[] = [];
        if (isArray(fieldNames)) {
            names = fieldNames as string[];
        } else if (isString(fieldNames)) {
            names = [fieldNames];
        }
    
        for (let lp = 0; lp < names.length; lp++) {
            const value = _.get(dataEvent, names[lp]) || _.get(dataEvent.data, names[lp]);
            if (value !== undefined && value["toString"] !== undefined) {
                return value.toString();
            }
        }
    }

    return undefined;
}
