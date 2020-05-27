// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IDiagnosticLogger, LoggingSeverity, _InternalMessageId, CoreUtils, hasJSON, getJSON } from '@microsoft/applicationinsights-core-js';

export class DataSanitizer {

    /**
     * Max length allowed for custom names.
     */
    public static MAX_NAME_LENGTH = 150;

    /**
     * Max length allowed for Id field in page views.
     */
    public static MAX_ID_LENGTH = 128;

    /**
     * Max length allowed for custom values.
     */
    public static MAX_PROPERTY_LENGTH = 8192;

    /**
     * Max length allowed for names
     */
    public static MAX_STRING_LENGTH = 1024;

    /**
     * Max length allowed for url.
     */
    public static MAX_URL_LENGTH = 2048;

    /**
     * Max length allowed for messages.
     */
    public static MAX_MESSAGE_LENGTH = 32768;

    /**
     * Max length allowed for exceptions.
     */
    public static MAX_EXCEPTION_LENGTH = 32768;

    public static sanitizeKeyAndAddUniqueness(logger: IDiagnosticLogger, key: any, map: any) {
        const origLength = key.length;
        let field = DataSanitizer.sanitizeKey(logger, key);

        // validation truncated the length.  We need to add uniqueness
        if (field.length !== origLength) {
            let i = 0;
            let uniqueField = field;
            while (map[uniqueField] !== undefined) {
                i++;
                uniqueField = field.substring(0, DataSanitizer.MAX_NAME_LENGTH - 3) + DataSanitizer.padNumber(i);
            }
            field = uniqueField;
        }
        return field;
    }

    public static sanitizeKey(logger: IDiagnosticLogger, name: any) {
        let nameTrunc: String;
        if (name) {
            // Remove any leading or trailing whitepace
            name = DataSanitizer.trim(name.toString());

            // truncate the string to 150 chars
            if (name.length > DataSanitizer.MAX_NAME_LENGTH) {
                nameTrunc = name.substring(0, DataSanitizer.MAX_NAME_LENGTH);
                logger.throwInternal(
                    LoggingSeverity.WARNING,
                    _InternalMessageId.NameTooLong,
                    "name is too long.  It has been truncated to " + DataSanitizer.MAX_NAME_LENGTH + " characters.",
                    { name }, true);
            }
        }

        return nameTrunc || name;
    }

    public static sanitizeString(logger: IDiagnosticLogger, value: any, maxLength: number = DataSanitizer.MAX_STRING_LENGTH) {
        let valueTrunc : String;
        if (value) {
            maxLength = maxLength ? maxLength : DataSanitizer.MAX_STRING_LENGTH; // in case default parameters dont work
            value = DataSanitizer.trim(value);
            if (value.toString().length > maxLength) {
                valueTrunc = value.toString().substring(0, maxLength);
                logger.throwInternal(
                    LoggingSeverity.WARNING,
                    _InternalMessageId.StringValueTooLong,
                    "string value is too long. It has been truncated to " + maxLength + " characters.",
                    { value }, true);
            }
        }

        return valueTrunc || value;
    }

    public static sanitizeUrl(logger: IDiagnosticLogger, url: any) {
        return DataSanitizer.sanitizeInput(logger, url, DataSanitizer.MAX_URL_LENGTH, _InternalMessageId.UrlTooLong);
    }

    public static sanitizeMessage(logger: IDiagnosticLogger, message: any) {
        let messageTrunc : String;
        if (message) {
            if (message.length > DataSanitizer.MAX_MESSAGE_LENGTH) {
                messageTrunc = message.substring(0, DataSanitizer.MAX_MESSAGE_LENGTH);
                logger.throwInternal(
                    LoggingSeverity.WARNING, _InternalMessageId.MessageTruncated,
                    "message is too long, it has been truncated to " + DataSanitizer.MAX_MESSAGE_LENGTH + " characters.",
                    { message },
                    true);
            }
        }

        return messageTrunc || message;
    }

    public static sanitizeException(logger: IDiagnosticLogger, exception: any) {
        let exceptionTrunc : String;
        if (exception) {
            if (exception.length > DataSanitizer.MAX_EXCEPTION_LENGTH) {
                exceptionTrunc = exception.substring(0, DataSanitizer.MAX_EXCEPTION_LENGTH);
                logger.throwInternal(
                    LoggingSeverity.WARNING, _InternalMessageId.ExceptionTruncated, "exception is too long, it has been truncated to " + DataSanitizer.MAX_EXCEPTION_LENGTH + " characters.",
                    { exception }, true);
            }
        }

        return exceptionTrunc || exception;
    }

    public static sanitizeProperties(logger: IDiagnosticLogger, properties: any) {
        if (properties) {
            const tempProps = {};
            for (let prop in properties) {
                let value = properties[prop];
                if (CoreUtils.isObject(value) && hasJSON()) {
                    // Stringify any part C properties
                    try {
                        value = getJSON().stringify(value);
                    } catch (e) {
                        logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.CannotSerializeObjectNonSerializable, "custom property is not valid", { exception: e}, true);
                    }
                }
                value = DataSanitizer.sanitizeString(logger, value, DataSanitizer.MAX_PROPERTY_LENGTH);
                prop = DataSanitizer.sanitizeKeyAndAddUniqueness(logger, prop, tempProps);
                tempProps[prop] = value;
            }
            properties = tempProps;
        }

        return properties;
    }

    public static sanitizeMeasurements(logger: IDiagnosticLogger, measurements: any) {
        if (measurements) {
            const tempMeasurements = {};
            for (let measure in measurements) {
                const value = measurements[measure];
                measure = DataSanitizer.sanitizeKeyAndAddUniqueness(logger, measure, tempMeasurements);
                tempMeasurements[measure] = value;
            }
            measurements = tempMeasurements;
        }

        return measurements;
    }

    public static sanitizeId(logger: IDiagnosticLogger, id: string): string {
        return id ? DataSanitizer.sanitizeInput(logger, id, DataSanitizer.MAX_ID_LENGTH, _InternalMessageId.IdTooLong).toString() : id;
    }

    public static sanitizeInput(logger: IDiagnosticLogger, input: any, maxLength: number, _msgId: _InternalMessageId) {
        let inputTrunc : String;
        if (input) {
            input = DataSanitizer.trim(input);
            if (input.length > maxLength) {
                inputTrunc = input.substring(0, maxLength);
                logger.throwInternal(
                    LoggingSeverity.WARNING,
                    _msgId,
                    "input is too long, it has been truncated to " + maxLength + " characters.",
                    { data: input },
                    true);
            }
        }

        return inputTrunc || input;
    }

    public static padNumber(num: number) {
        const s = "00" + num;
        return s.substr(s.length - 3);
    }

    /**
     * helper method to trim strings (IE8 does not implement String.prototype.trim)
     */
    public static trim(str: any): string {
        if (!CoreUtils.isString(str)) { return str; }
        return str.replace(/^\s+|\s+$/g, "");
    }
}