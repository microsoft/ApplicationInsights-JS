"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataSanitizeKeyAndAddUniqueness = dataSanitizeKeyAndAddUniqueness;
exports.dataSanitizeKey = dataSanitizeKey;
exports.dataSanitizeString = dataSanitizeString;
exports.dataSanitizeUrl = dataSanitizeUrl;
exports.dataSanitizeMessage = dataSanitizeMessage;
exports.dataSanitizeException = dataSanitizeException;
exports.dataSanitizeProperties = dataSanitizeProperties;
exports.dataSanitizeMeasurements = dataSanitizeMeasurements;
exports.dataSanitizeId = dataSanitizeId;
exports.dataSanitizeInput = dataSanitizeInput;
exports.dsPadNumber = dsPadNumber;
var applicationinsights_core_js_1 = require("@microsoft/applicationinsights-core-js");
var ts_utils_1 = require("@nevware21/ts-utils");
function dataSanitizeKeyAndAddUniqueness(logger, key, map) {
    var origLength = key.length;
    var field = dataSanitizeKey(logger, key);
    // validation truncated the length.  We need to add uniqueness
    if (field.length !== origLength) {
        var i = 0;
        var uniqueField = field;
        while (map[uniqueField] !== undefined) {
            i++;
            uniqueField = (0, ts_utils_1.strSubstring)(field, 0, 150 /* DataSanitizerValues.MAX_NAME_LENGTH */ - 3) + dsPadNumber(i);
        }
        field = uniqueField;
    }
    return field;
}
function dataSanitizeKey(logger, name) {
    var nameTrunc;
    if (name) {
        // Remove any leading or trailing whitespace
        name = (0, applicationinsights_core_js_1.strTrim)((0, ts_utils_1.asString)(name));
        // truncate the string to 150 chars
        if (name.length > 150 /* DataSanitizerValues.MAX_NAME_LENGTH */) {
            nameTrunc = (0, ts_utils_1.strSubstring)(name, 0, 150 /* DataSanitizerValues.MAX_NAME_LENGTH */);
            (0, applicationinsights_core_js_1._throwInternal)(logger, applicationinsights_core_js_1.eLoggingSeverity.WARNING, applicationinsights_core_js_1._eInternalMessageId.NameTooLong, "name is too long.  It has been truncated to " + 150 /* DataSanitizerValues.MAX_NAME_LENGTH */ + " characters.", { name: name }, true);
        }
    }
    return nameTrunc || name;
}
function dataSanitizeString(logger, value, maxLength) {
    if (maxLength === void 0) { maxLength = 1024 /* DataSanitizerValues.MAX_STRING_LENGTH */; }
    var valueTrunc;
    if (value) {
        maxLength = maxLength ? maxLength : 1024 /* DataSanitizerValues.MAX_STRING_LENGTH */; // in case default parameters dont work
        value = (0, applicationinsights_core_js_1.strTrim)((0, ts_utils_1.asString)(value));
        if (value.length > maxLength) {
            valueTrunc = (0, ts_utils_1.strSubstring)(value, 0, maxLength);
            (0, applicationinsights_core_js_1._throwInternal)(logger, applicationinsights_core_js_1.eLoggingSeverity.WARNING, applicationinsights_core_js_1._eInternalMessageId.StringValueTooLong, "string value is too long. It has been truncated to " + maxLength + " characters.", { value: value }, true);
        }
    }
    return valueTrunc || value;
}
function dataSanitizeUrl(logger, url) {
    return dataSanitizeInput(logger, url, 2048 /* DataSanitizerValues.MAX_URL_LENGTH */, applicationinsights_core_js_1._eInternalMessageId.UrlTooLong);
}
function dataSanitizeMessage(logger, message) {
    var messageTrunc;
    if (message) {
        if (message.length > 32768 /* DataSanitizerValues.MAX_MESSAGE_LENGTH */) {
            messageTrunc = (0, ts_utils_1.strSubstring)(message, 0, 32768 /* DataSanitizerValues.MAX_MESSAGE_LENGTH */);
            (0, applicationinsights_core_js_1._throwInternal)(logger, applicationinsights_core_js_1.eLoggingSeverity.WARNING, applicationinsights_core_js_1._eInternalMessageId.MessageTruncated, "message is too long, it has been truncated to " + 32768 /* DataSanitizerValues.MAX_MESSAGE_LENGTH */ + " characters.", { message: message }, true);
        }
    }
    return messageTrunc || message;
}
function dataSanitizeException(logger, exception) {
    var exceptionTrunc;
    if (exception) {
        // Make surte its a string
        var value = "" + exception;
        if (value.length > 32768 /* DataSanitizerValues.MAX_EXCEPTION_LENGTH */) {
            exceptionTrunc = (0, ts_utils_1.strSubstring)(value, 0, 32768 /* DataSanitizerValues.MAX_EXCEPTION_LENGTH */);
            (0, applicationinsights_core_js_1._throwInternal)(logger, applicationinsights_core_js_1.eLoggingSeverity.WARNING, applicationinsights_core_js_1._eInternalMessageId.ExceptionTruncated, "exception is too long, it has been truncated to " + 32768 /* DataSanitizerValues.MAX_EXCEPTION_LENGTH */ + " characters.", { exception: exception }, true);
        }
    }
    return exceptionTrunc || exception;
}
function dataSanitizeProperties(logger, properties) {
    if (properties) {
        var tempProps_1 = {};
        (0, applicationinsights_core_js_1.objForEachKey)(properties, function (prop, value) {
            if ((0, applicationinsights_core_js_1.isObject)(value) && (0, applicationinsights_core_js_1.hasJSON)()) {
                // Stringify any part C properties
                try {
                    value = (0, applicationinsights_core_js_1.getJSON)().stringify(value);
                }
                catch (e) {
                    (0, applicationinsights_core_js_1._throwInternal)(logger, applicationinsights_core_js_1.eLoggingSeverity.WARNING, applicationinsights_core_js_1._eInternalMessageId.CannotSerializeObjectNonSerializable, "custom property is not valid", { exception: e }, true);
                }
            }
            value = dataSanitizeString(logger, value, 8192 /* DataSanitizerValues.MAX_PROPERTY_LENGTH */);
            prop = dataSanitizeKeyAndAddUniqueness(logger, prop, tempProps_1);
            tempProps_1[prop] = value;
        });
        properties = tempProps_1;
    }
    return properties;
}
function dataSanitizeMeasurements(logger, measurements) {
    if (measurements) {
        var tempMeasurements_1 = {};
        (0, applicationinsights_core_js_1.objForEachKey)(measurements, function (measure, value) {
            measure = dataSanitizeKeyAndAddUniqueness(logger, measure, tempMeasurements_1);
            tempMeasurements_1[measure] = value;
        });
        measurements = tempMeasurements_1;
    }
    return measurements;
}
function dataSanitizeId(logger, id) {
    return id ? dataSanitizeInput(logger, id, 128 /* DataSanitizerValues.MAX_ID_LENGTH */, applicationinsights_core_js_1._eInternalMessageId.IdTooLong).toString() : id;
}
function dataSanitizeInput(logger, input, maxLength, _msgId) {
    var inputTrunc;
    if (input) {
        input = (0, applicationinsights_core_js_1.strTrim)((0, ts_utils_1.asString)(input));
        if (input.length > maxLength) {
            inputTrunc = (0, ts_utils_1.strSubstring)(input, 0, maxLength);
            (0, applicationinsights_core_js_1._throwInternal)(logger, applicationinsights_core_js_1.eLoggingSeverity.WARNING, _msgId, "input is too long, it has been truncated to " + maxLength + " characters.", { data: input }, true);
        }
    }
    return inputTrunc || input;
}
function dsPadNumber(num) {
    var s = "00" + num;
    return (0, ts_utils_1.strSubstr)(s, s.length - 3);
}
