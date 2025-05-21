"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringToBoolOrDefault = stringToBoolOrDefault;
exports.msToTimeSpan = msToTimeSpan;
exports.getExtensionByName = getExtensionByName;
exports.isCrossOriginError = isCrossOriginError;
var applicationinsights_core_js_1 = require("@microsoft/applicationinsights-core-js");
var ts_utils_1 = require("@nevware21/ts-utils");
var strEmpty = "";
function stringToBoolOrDefault(str, defaultValue) {
    if (defaultValue === void 0) { defaultValue = false; }
    if (str === undefined || str === null) {
        return defaultValue;
    }
    return str.toString().toLowerCase() === "true";
}
/**
 * Convert ms to c# time span format
 */
function msToTimeSpan(totalms) {
    if (isNaN(totalms) || totalms < 0) {
        totalms = 0;
    }
    totalms = (0, ts_utils_1.mathRound)(totalms);
    var ms = strEmpty + totalms % 1000;
    var sec = strEmpty + (0, ts_utils_1.mathFloor)(totalms / 1000) % 60;
    var min = strEmpty + (0, ts_utils_1.mathFloor)(totalms / (1000 * 60)) % 60;
    var hour = strEmpty + (0, ts_utils_1.mathFloor)(totalms / (1000 * 60 * 60)) % 24;
    var days = (0, ts_utils_1.mathFloor)(totalms / (1000 * 60 * 60 * 24));
    ms = ms.length === 1 ? "00" + ms : ms.length === 2 ? "0" + ms : ms;
    sec = sec.length < 2 ? "0" + sec : sec;
    min = min.length < 2 ? "0" + min : min;
    hour = hour.length < 2 ? "0" + hour : hour;
    return (days > 0 ? days + "." : strEmpty) + hour + ":" + min + ":" + sec + "." + ms;
}
function getExtensionByName(extensions, identifier) {
    var extension = null;
    (0, applicationinsights_core_js_1.arrForEach)(extensions, function (value) {
        if (value.identifier === identifier) {
            extension = value;
            return -1;
        }
    });
    return extension;
}
function isCrossOriginError(message, url, lineNumber, columnNumber, error) {
    return !error && (0, applicationinsights_core_js_1.isString)(message) && (message === "Script error." || message === "Script error");
}
