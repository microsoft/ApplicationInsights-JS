// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import _ from "lodash";
import { isArray, isString } from "@microsoft/applicationinsights-core-js";
import { defaultDataEventTypes, defaultSessionId } from "../configuration/defaultConfiguration";
import { DynamicValueConverter, IConfiguration, IDataEventTypeCondition, IDynamicField, ISpecialFieldNames } from "../configuration/IConfiguration";
import { DataEventType, IDataEvent } from "./IDataEvent";

let _regExpMap: { [key: string]: RegExp } = {};

function _createRegEx(str: string) {
    // eslint-disable-next-line security/detect-non-literal-regexp
    return new RegExp("^" + str.replace(/([.+?^=!:${}()|\[\]\/\\])/g, "\\$1").replace("*", ".*") + "$");
}

function _isMatch(source: string, value: string) {
    if (source.indexOf("*") !== -1) {
        // Looks like it contains a wildcard match
        let regEx = _regExpMap[source] || (_regExpMap[source] = _createRegEx(source));
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

export function getCondensedDetails(dataEvent: IDataEvent, configuration: IConfiguration): string {
    const condensedDetails = JSON.parse(JSON.stringify((dataEvent||{}).data || {}));

    if (configuration && configuration.fieldsToExcludeFromCondensedList) {
        for (const toExclude of configuration.fieldsToExcludeFromCondensedList) {
            _.unset(condensedDetails, toExclude);
        }
    }

    return condensedDetails;
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
            return `${Math.trunc(Number.parseInt(value, 10))} ms`;
        }
        case "TruncateWithDigitGrouping": {
            return `${Math.trunc(Number.parseInt(value, 10)).toLocaleString()}`;
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

// tslint:disable-next-line:no-any
export function getDetails(dataEvent: IDataEvent): any {
    const details = JSON.parse(JSON.stringify(dataEvent));

    // Filter out calculated fields
    delete details["sessionNumber"];
    delete details["type"];
    delete details["condensedDetails"];

    return details;
}
