// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/// <reference path="../../Logging.ts" />
/// <reference path="../../Util.ts"/>

module Microsoft.ApplicationInsights.Telemetry.Common {
    "use strict";

    export class DataSanitizer {

        /**
        * Max length allowed for custom names.
        */
        private static MAX_NAME_LENGTH = 150;

        /**
         * Max length allowed for Id field in page views.
         */
        private static MAX_ID_LENGTH = 128;

        /**
         * Max length allowed for custom values.
         */
        private static MAX_PROPERTY_LENGTH = 8192;

        /**
         * Max length allowed for names
         */
        private static MAX_STRING_LENGTH = 1024;

        /**
         * Max length allowed for url.
         */
        private static MAX_URL_LENGTH = 2048;

        /**
         * Max length allowed for messages.
         */
        private static MAX_MESSAGE_LENGTH = 32768;

        /**
         * Max length allowed for exceptions.
         */
        private static MAX_EXCEPTION_LENGTH = 32768;

        public static sanitizeKeyAndAddUniqueness(key, map) {
            var origLength = key.length;
            var field = DataSanitizer.sanitizeKey(key);

            // validation truncated the length.  We need to add uniqueness
            if (field.length !== origLength) {
                var i = 0;
                var uniqueField = field;
                while (map[uniqueField] !== undefined) {
                    i++;
                    uniqueField = field.substring(0, DataSanitizer.MAX_NAME_LENGTH - 3) + DataSanitizer.padNumber(i);
                }
                field = uniqueField;
            }
            return field;
        }

        public static sanitizeKey(name) {
            if (name) {
                // Remove any leading or trailing whitepace
                name = Util.trim(name.toString());

                // truncate the string to 150 chars
                if (name.length > DataSanitizer.MAX_NAME_LENGTH) {
                    name = name.substring(0, DataSanitizer.MAX_NAME_LENGTH);
                    _InternalLogging.throwInternal(
                        LoggingSeverity.WARNING,
                        _InternalMessageId.NameTooLong,
                        "name is too long.  It has been truncated to " + DataSanitizer.MAX_NAME_LENGTH + " characters.",
                        { name: name }, true);
                }
            }

            return name;
        }

        public static sanitizeString(value, maxLength: number = DataSanitizer.MAX_STRING_LENGTH) {
            if (value) {
                maxLength = maxLength ? maxLength: DataSanitizer.MAX_STRING_LENGTH; // in case default parameters dont work
                value = Util.trim(value);
                if (value.toString().length > maxLength) {
                    value = value.toString().substring(0, maxLength);
                    _InternalLogging.throwInternal(
                        LoggingSeverity.WARNING,
                        _InternalMessageId.StringValueTooLong,
                        "string value is too long. It has been truncated to " + maxLength + " characters.",
                        { value: value }, true);
                }
            }

            return value;
        }

        public static sanitizeUrl(url) {
            return DataSanitizer.sanitizeInput(url, DataSanitizer.MAX_URL_LENGTH, _InternalMessageId.UrlTooLong);
        }

        public static sanitizeMessage(message) {
            if (message) {
                if (message.length > DataSanitizer.MAX_MESSAGE_LENGTH) {
                    message = message.substring(0, DataSanitizer.MAX_MESSAGE_LENGTH);
                    _InternalLogging.throwInternal(
                        LoggingSeverity.WARNING, _InternalMessageId.MessageTruncated,
                        "message is too long, it has been truncated to " + DataSanitizer.MAX_MESSAGE_LENGTH + " characters.",
                        { message: message },
                        true);
                }
            }

            return message;
        }

        public static sanitizeException(exception) {
            if (exception) {
                if (exception.length > DataSanitizer.MAX_EXCEPTION_LENGTH) {
                    exception = exception.substring(0, DataSanitizer.MAX_EXCEPTION_LENGTH);
                    _InternalLogging.throwInternal(
                        LoggingSeverity.WARNING, _InternalMessageId.ExceptionTruncated, "exception is too long, it has been truncated to " + DataSanitizer.MAX_EXCEPTION_LENGTH + " characters.",
                        { exception: exception }, true);
                }
            }

            return exception;
        }

        public static sanitizeProperties(properties) {
            if (properties) {
                var tempProps = {};
                for (var prop in properties) {
                    var value = DataSanitizer.sanitizeString(properties[prop], DataSanitizer.MAX_PROPERTY_LENGTH);
                    prop = DataSanitizer.sanitizeKeyAndAddUniqueness(prop, tempProps);
                    tempProps[prop] = value;
                }
                properties = tempProps;
            }

            return properties;
        }

        public static sanitizeMeasurements(measurements) {
            if (measurements) {
                var tempMeasurements = {};
                for (var measure in measurements) {
                    var value = measurements[measure];
                    measure = DataSanitizer.sanitizeKeyAndAddUniqueness(measure, tempMeasurements);
                    tempMeasurements[measure] = value;
                }
                measurements = tempMeasurements;
            }

            return measurements;
        }

        public static sanitizeId(id: string): string {
                return id ? DataSanitizer.sanitizeInput(id, DataSanitizer.MAX_ID_LENGTH, _InternalMessageId.IdTooLong).toString() : id;
        }

        public static sanitizeInput(input: any, maxLength: number, _msgId: _InternalMessageId) {
            if (input) {
            input = Util.trim(input);
                if (input.length > maxLength) {
                    input = input.substring(0, maxLength);
                    _InternalLogging.throwInternal(
                        LoggingSeverity.WARNING,
                        _msgId,
                        "input is too long, it has been truncated to " + maxLength + " characters.",
                        { data: input },
                        true);
                }
            }

            return input;
        }

        public static padNumber(num) {
            var s = "00" + num;
            return s.substr(s.length - 3);
        }
    }
}