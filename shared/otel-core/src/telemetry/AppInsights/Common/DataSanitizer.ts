// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { asString, isObject, isString, objForEachKey, strSubstr, strSubstring, strTrim } from "@nevware21/ts-utils";
import { _eInternalMessageId, eLoggingSeverity } from "../../../enums/AppInsights/LoggingEnums";
import { IConfiguration } from "../../../interfaces/AppInsights/IConfiguration";
import { IDiagnosticLogger } from "../../../interfaces/AppInsights/IDiagnosticLogger";
import { fieldRedaction, getJSON, hasJSON } from "../../../utils/AppInsights/EnvUtils";

export const enum DataSanitizerValues {
    /**
     * Max length allowed for custom names.
     */
    MAX_NAME_LENGTH = 150,

     /**
      * Max length allowed for Id field in page views.
      */
    MAX_ID_LENGTH = 128,
 
     /**
      * Max length allowed for custom values.
      */
    MAX_PROPERTY_LENGTH = 8192,
 
     /**
      * Max length allowed for names
      */
    MAX_STRING_LENGTH = 1024,
 
     /**
      * Max length allowed for url.
      */
    MAX_URL_LENGTH = 2048,
 
     /**
      * Max length allowed for messages.
      */
    MAX_MESSAGE_LENGTH = 32768,
 
     /**
      * Max length allowed for exceptions.
      */
    MAX_EXCEPTION_LENGTH = 32768
}

export function dataSanitizeKeyAndAddUniqueness(logger: IDiagnosticLogger, key: any, map: any) {
    const origLength = key.length;
    let field = dataSanitizeKey(logger, key);

    // validation truncated the length.  We need to add uniqueness
    if (field.length !== origLength) {
        let i = 0;
        let uniqueField = field;
        while (map[uniqueField] !== undefined) {
            i++;
            uniqueField = strSubstring(field, 0, DataSanitizerValues.MAX_NAME_LENGTH - 3) + dsPadNumber(i);
        }
        field = uniqueField;
    }
    return field;
}

export function dataSanitizeKey(logger: IDiagnosticLogger, name: any) {
    let nameTrunc: String;
    if (name) {
        // Remove any leading or trailing whitespace
        name = strTrim(asString(name));

        // truncate the string to 150 chars
        if (name.length > DataSanitizerValues.MAX_NAME_LENGTH) {
            nameTrunc = strSubstring(name, 0, DataSanitizerValues.MAX_NAME_LENGTH);
            if (logger) {
                logger.throwInternal(
                    eLoggingSeverity.WARNING,
                    _eInternalMessageId.NameTooLong,
                    "name is too long.  It has been truncated to " + DataSanitizerValues.MAX_NAME_LENGTH + " characters.",
                    { name });
            }
        }
    }

    return nameTrunc || name;
}

export function dataSanitizeString(logger: IDiagnosticLogger, value: any, maxLength: number = DataSanitizerValues.MAX_STRING_LENGTH) {
    let valueTrunc : String;
    if (value) {
        maxLength = maxLength ? maxLength : DataSanitizerValues.MAX_STRING_LENGTH; // in case default parameters dont work
        value = strTrim(asString(value));
        if (value.length > maxLength) {
            valueTrunc = strSubstring(value, 0, maxLength);
            if (logger) {
                logger.throwInternal(
                    eLoggingSeverity.WARNING,
                    _eInternalMessageId.StringValueTooLong,
                    "string value is too long. It has been truncated to " + maxLength + " characters.",
                    { value });
            }
        }
    }

    return valueTrunc || value;
}

export function dataSanitizeUrl(logger: IDiagnosticLogger, url: any, config?: IConfiguration) {
    if (isString(url)) {
        url = fieldRedaction(url, config);
    }
    return dataSanitizeInput(logger, url, DataSanitizerValues.MAX_URL_LENGTH, _eInternalMessageId.UrlTooLong);
}

export function dataSanitizeMessage(logger: IDiagnosticLogger, message: any) {
    let messageTrunc : String;
    if (message) {
        if (message.length > DataSanitizerValues.MAX_MESSAGE_LENGTH) {
            messageTrunc = strSubstring(message, 0, DataSanitizerValues.MAX_MESSAGE_LENGTH);
            if (logger) {
                logger.throwInternal(
                    eLoggingSeverity.WARNING, _eInternalMessageId.MessageTruncated,
                    "message is too long, it has been truncated to " + DataSanitizerValues.MAX_MESSAGE_LENGTH + " characters.",
                    { message });
            }
        }
    }

    return messageTrunc || message;
}

export function dataSanitizeException(logger: IDiagnosticLogger, exception: any) {
    let exceptionTrunc : String;
    if (exception) {
        // Make surte its a string
        let value:string = "" + exception;
        if (value.length > DataSanitizerValues.MAX_EXCEPTION_LENGTH) {
            exceptionTrunc = strSubstring(value, 0, DataSanitizerValues.MAX_EXCEPTION_LENGTH);
            if (logger) {
                logger.throwInternal(
                    eLoggingSeverity.WARNING, _eInternalMessageId.ExceptionTruncated, "exception is too long, it has been truncated to " + DataSanitizerValues.MAX_EXCEPTION_LENGTH + " characters.",
                    { exception });
            }
        }
    }

    return exceptionTrunc || exception;
}

export function dataSanitizeProperties(logger: IDiagnosticLogger, properties: any) {
    if (properties) {
        const tempProps: any = {};
        objForEachKey(properties, (prop, value) => {
            if (isObject(value) && hasJSON()) {
                // Stringify any part C properties
                try {
                    value = getJSON().stringify(value);
                } catch (e) {
                    if (logger) {
                        logger.throwInternal(eLoggingSeverity.WARNING, _eInternalMessageId.CannotSerializeObjectNonSerializable, "custom property is not valid", { exception: e });
                    }
                }
            }
            value = dataSanitizeString(logger, value, DataSanitizerValues.MAX_PROPERTY_LENGTH);
            prop = dataSanitizeKeyAndAddUniqueness(logger, prop, tempProps);
            tempProps[prop] = value;
        });
        properties = tempProps;
    }

    return properties;
}

export function dataSanitizeMeasurements(logger: IDiagnosticLogger, measurements: any) {
    if (measurements) {
        const tempMeasurements: any = {};
        objForEachKey(measurements, (measure, value) => {
            measure = dataSanitizeKeyAndAddUniqueness(logger, measure, tempMeasurements);
            tempMeasurements[measure] = value;
        });

        measurements = tempMeasurements;
    }

    return measurements;
}

export function dataSanitizeId(logger: IDiagnosticLogger, id: string): string {
    return id ? dataSanitizeInput(logger, id, DataSanitizerValues.MAX_ID_LENGTH, _eInternalMessageId.IdTooLong).toString() : id;
}

export function dataSanitizeInput(logger: IDiagnosticLogger, input: any, maxLength: number, _msgId: _eInternalMessageId) {
    let inputTrunc : String;
    if (input) {
        input = strTrim(asString(input));
        if (input.length > maxLength) {
            inputTrunc = strSubstring(input, 0, maxLength);
            if (logger) {
                logger.throwInternal(
                    eLoggingSeverity.WARNING,
                    _msgId,
                    "input is too long, it has been truncated to " + maxLength + " characters.",
                    { data: input },
                    true);
            }
        }
    }

    return inputTrunc || input;
}

export function dsPadNumber(num: number) {
    const s = "00" + num;
    return strSubstr(s, s.length - 3);
}
