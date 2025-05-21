"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Exception = void 0;
exports._formatErrorCode = _formatErrorCode;
exports._createExceptionDetails = _createExceptionDetails;
exports._createExDetailsFromInterface = _createExDetailsFromInterface;
exports._extractStackFrame = _extractStackFrame;
exports._parsedFrameToInterface = _parsedFrameToInterface;
var applicationinsights_core_js_1 = require("@microsoft/applicationinsights-core-js");
var ts_utils_1 = require("@nevware21/ts-utils");
var Constants_1 = require("../Constants");
var DataSanitizer_1 = require("./Common/DataSanitizer");
// These Regex covers the following patterns
// 1. Chrome/Firefox/IE/Edge:
//    at functionName (filename:lineNumber:columnNumber)
//    at functionName (filename:lineNumber)
//    at filename:lineNumber:columnNumber
//    at filename:lineNumber
//    at functionName@filename:lineNumber:columnNumber
// 2. Safari / Opera:
//    functionName@filename:lineNumber:columnNumber
//    functionName@filename:lineNumber
//    filename:lineNumber:columnNumber
//    filename:lineNumber
//    Line ## of scriptname script filename:lineNumber:columnNumber
//    Line ## of scriptname script filename
// 3. IE/Edge (Additional formats)
//    at functionName@filename:lineNumber
var STACKFRAME_BASE_SIZE = 58; // '{"method":"","level":,"assembly":"","fileName":"","line":}'.length
/**
 * Check if the string conforms to what looks like a stack frame line and not just a general message
 * comment or other non-stack related info.
 *
 * This  should be used to filter out any leading "message" lines from a stack trace, before attempting to parse
 * the individual stack frames. Once you have estabilsted the start of the stack frames you can then use the
 * FULL_STACK_FRAME_1, FULL_STACK_FRAME_2, FULL_STACK_FRAME_3, and EXTRACT_FILENAME to parse the individual
 * stack frames to extract the method, filename, line number, and column number.
 * These may still provide invalid matches, so the sequence of execution is important to avoid providing
 * an invalid parsed stack.
 */
var IS_FRAME = /^\s{0,50}(from\s|at\s|Line\s{1,5}\d{1,10}\s{1,5}of|\w{1,50}@\w{1,80}|[^\(\s\n]+:[0-9\?]+(?::[0-9\?]+)?)/;
/**
 * Parse a well formed stack frame with both the line and column numbers
 * ----------------------------------
 * **Primary focus of the matching**
 * - at functionName (filename:lineNumber:columnNumber)
 * - at filename:lineNumber:columnNumber
 * - at functionName@filename:lineNumber:columnNumber
 * - functionName (filename:lineNumber:columnNumber)
 * - filename:lineNumber:columnNumber
 * - functionName@filename:lineNumber:columnNumber
 */
var FULL_STACK_FRAME_1 = /^(?:\s{0,50}at)?\s{0,50}([^\@\()\s]+)?\s{0,50}(?:\s|\@|\()\s{0,5}([^\(\s\n\]]+):([0-9\?]+):([0-9\?]+)\)?$/;
/**
 * Parse a well formed stack frame with only a line number.
 * ----------------------------------
 * > Note: this WILL also match with line and column number, but the line number is included with the filename
 * > you should attempt to match with FULL_STACK_FRAME_1 first.
 *
 * **Primary focus of the matching (run FULL_STACK_FRAME_1 first)**
 * - at functionName (filename:lineNumber)
 * - at filename:lineNumber
 * - at functionName@filename:lineNumber
 * - functionName (filename:lineNumber)
 * - filename:lineNumber
 * - functionName@filename:lineNumber
 *
 * **Secondary matches**
 * - at functionName (filename:lineNumber:columnNumber)
 * - at filename:lineNumber:columnNumber
 * - at functionName@filename:lineNumber:columnNumber
 * - functionName (filename:lineNumber:columnNumber)
 * - filename:lineNumber:columnNumber
 * - functionName@filename:lineNumber:columnNumber
 */
var FULL_STACK_FRAME_2 = /^(?:\s{0,50}at)?\s{0,50}([^\@\()\s]+)?\s{0,50}(?:\s|\@|\()\s{0,5}([^\(\s\n\]]+):([0-9\?]+)\)?$/;
/**
 * Attempt to Parse a frame that doesn't include a line or column number.
 * ----------------------------------
 * > Note: this WILL also match lines with a line or line and column number, you should attempt to match with
 * both FULL_STACK_FRAME_1 and FULL_STACK_FRAME_2 first to avoid false positives.
 *
 * **Unexpected Invalid Matches** (Matches that should be avoided -- by using the FULL_STACK_FRAME_1 and FULL_STACK_FRAME_2 first)
 * - at https://localhost:44365/static/node_bundles/@microsoft/blah/js/bundle.js:144112:27
 * - at https://localhost:44365/static/node_bundles/@microsoft/blah/js/bundle.js:144112:27
 *
 * **Primary focus of the matching (run FULL_STACK_FRAME_1 first)**
 * - at functionName@filename
 * - at functionName (filename)
 * - at functionName filename
 * - at filename  <- Will actuall match this as the "method" and not the filename (care should be taken to avoid this)
 * - functionName@filename
 * - functionName (filename)
 * - functionName filename
 * - functionName
 *
 * **Secondary matches** (The line and column numbers will be included with the matched filename)
 * - at functionName (filename:lineNumber:columnNumber)
 * - at functionName (filename:lineNumber)
 * - at filename:lineNumber:columnNumber
 * - at filename:lineNumber
 * - at functionName@filename:lineNumber:columnNumber
 * - at functionName@filename:lineNumber
 * - functionName (filename:lineNumber:columnNumber)
 * - functionName (filename:lineNumber)
 * - filename:lineNumber:columnNumber
 * - filename:lineNumber
 * - functionName@filename:lineNumber:columnNumber
 * - functionName@filename:lineNumber
  */
var FULL_STACK_FRAME_3 = /^(?:\s{0,50}at)?\s{0,50}([^\@\()\s]+)?\s{0,50}(?:\s|\@|\()\s{0,5}([^\(\s\n\)\]]+)\)?$/;
/**
 * Attempt to extract the filename (with or without line and column numbers) from a string.
 * ----------------------------------
 * > Note: this will only match the filename (with any line or column numbers) and will
 * > return what looks like the filename, however, it will also match random strings that
 * > look like a filename, so care should be taken to ensure that the filename is actually
 * > a filename before using it.
 * >
 * > It is recommended to use this in conjunction with the FULL_STACK_FRAME_1, FULL_STACK_FRAME_2, and FULL_STACK_FRAME_3
 * > to ensure first to reduce false matches, if all of these fail then you can use this to extract the filename from a random
 * > strings to identify any potential filename from a known stack frame line.
 *
 * **Known Invalid matching**
 *
 * This regex will basically match any "final" string of a line or one that is trailed by a comma, so this should not
 * be used as the "only" matching regex, but rather as a final fallback to extract the filename from a string.
 * If you are certain that the string line is a stack frame and not part of the exception message (lines before the stack)
 * or trailing comments, then you can use this to extract the filename and then further parse with PARSE_FILENAME_LINE_COL
 * and PARSE_FILENAME_LINE_ONLY to extract any potential the line and column numbers.
 *
 * **Primary focus of the matching**
 * - at (anonymous) @ VM60:1
 * - Line 21 of linked script file://localhost/C:/Temp/stacktrace.js
 * - Line 11 of inline#1 script in http://localhost:3000/static/js/main.206f4846.js:2:296748
 * - Line 68 of inline#2 script in file://localhost/teststack.html
 * - at Global code (http://example.com/stacktrace.js:11:1)
 */
var EXTRACT_FILENAME = /(?:^|\(|\s{0,10}[\w\)]+\@)?([^\(\n\s\]\)]+)(?:\:([0-9]+)(?:\:([0-9]+))?)?\)?(?:,|$)/;
/**
 * Attempt to extract the filename, line number, and column number from a string.
 */
var PARSE_FILENAME_LINE_COL = /([^\(\s\n]+):([0-9]+):([0-9]+)$/;
/**
 * Attempt to extract the filename and line number from a string.
 */
var PARSE_FILENAME_LINE_ONLY = /([^\(\s\n]+):([0-9]+)$/;
var NoMethod = "<no_method>";
var strError = "error";
var strStack = "stack";
var strStackDetails = "stackDetails";
var strErrorSrc = "errorSrc";
var strMessage = "message";
var strDescription = "description";
var _parseSequence = [
    { re: FULL_STACK_FRAME_1, len: 5, m: 1, fn: 2, ln: 3, col: 4 },
    { chk: _ignoreNative, pre: _scrubAnonymous, re: FULL_STACK_FRAME_2, len: 4, m: 1, fn: 2, ln: 3 },
    { re: FULL_STACK_FRAME_3, len: 3, m: 1, fn: 2, hdl: _handleFilename },
    { re: EXTRACT_FILENAME, len: 2, fn: 1, hdl: _handleFilename }
];
function _scrubAnonymous(frame) {
    return frame.replace(/(\(anonymous\))/, "<anonymous>");
}
function _ignoreNative(frame) {
    return (0, ts_utils_1.strIndexOf)(frame, "[native") < 0;
}
function _stringify(value, convertToString) {
    var result = value;
    if (result && !(0, applicationinsights_core_js_1.isString)(result)) {
        if (JSON && JSON.stringify) {
            result = JSON.stringify(value);
            if (convertToString && (!result || result === "{}")) {
                if ((0, applicationinsights_core_js_1.isFunction)(value.toString)) {
                    result = value.toString();
                }
                else {
                    result = "" + value;
                }
            }
        }
        else {
            result = "" + value + " - (Missing JSON.stringify)";
        }
    }
    return result || "";
}
function _formatMessage(theEvent, errorType) {
    var evtMessage = theEvent;
    if (theEvent) {
        if (evtMessage && !(0, applicationinsights_core_js_1.isString)(evtMessage)) {
            evtMessage = theEvent[strMessage] || theEvent[strDescription] || evtMessage;
        }
        // Make sure the message is a string
        if (evtMessage && !(0, applicationinsights_core_js_1.isString)(evtMessage)) {
            // tslint:disable-next-line: prefer-conditional-expression
            evtMessage = _stringify(evtMessage, true);
        }
        if (theEvent["filename"]) {
            // Looks like an event object with filename
            evtMessage = evtMessage + " @" + (theEvent["filename"] || "") + ":" + (theEvent["lineno"] || "?") + ":" + (theEvent["colno"] || "?");
        }
    }
    // Automatically add the error type to the message if it does already appear to be present
    if (errorType && errorType !== "String" && errorType !== "Object" && errorType !== "Error" && (0, ts_utils_1.strIndexOf)(evtMessage || "", errorType) === -1) {
        evtMessage = errorType + ": " + evtMessage;
    }
    return evtMessage || "";
}
function _isExceptionDetailsInternal(value) {
    try {
        if ((0, applicationinsights_core_js_1.isObject)(value)) {
            return "hasFullStack" in value && "typeName" in value;
        }
    }
    catch (e) {
        // This can happen with some native browser objects, but should not happen for the type we are checking for
    }
    return false;
}
function _isExceptionInternal(value) {
    try {
        if ((0, applicationinsights_core_js_1.isObject)(value)) {
            return ("ver" in value && "exceptions" in value && "properties" in value);
        }
    }
    catch (e) {
        // This can happen with some native browser objects, but should not happen for the type we are checking for
    }
    return false;
}
function _isStackDetails(details) {
    return details && details.src && (0, applicationinsights_core_js_1.isString)(details.src) && details.obj && (0, applicationinsights_core_js_1.isArray)(details.obj);
}
function _convertStackObj(errorStack) {
    var src = errorStack || "";
    if (!(0, applicationinsights_core_js_1.isString)(src)) {
        if ((0, applicationinsights_core_js_1.isString)(src[strStack])) {
            src = src[strStack];
        }
        else {
            src = "" + src;
        }
    }
    var items = src.split("\n");
    return {
        src: src,
        obj: items
    };
}
function _getOperaStack(errorMessage) {
    var stack = [];
    var lines = errorMessage.split("\n");
    for (var lp = 0; lp < lines.length; lp++) {
        var entry = lines[lp];
        if (lines[lp + 1]) {
            entry += "@" + lines[lp + 1];
            lp++;
        }
        stack.push(entry);
    }
    return {
        src: errorMessage,
        obj: stack
    };
}
function _getStackFromErrorObj(errorObj) {
    var details = null;
    if (errorObj) {
        try {
            /* Using bracket notation is support older browsers (IE 7/8 -- dont remember the version) that throw when using dot
            notation for undefined objects and we don't want to loose the error from being reported */
            if (errorObj[strStack]) {
                // Chrome/Firefox
                details = _convertStackObj(errorObj[strStack]);
            }
            else if (errorObj[strError] && errorObj[strError][strStack]) {
                // Edge error event provides the stack and error object
                details = _convertStackObj(errorObj[strError][strStack]);
            }
            else if (errorObj["exception"] && errorObj.exception[strStack]) {
                details = _convertStackObj(errorObj.exception[strStack]);
            }
            else if (_isStackDetails(errorObj)) {
                details = errorObj;
            }
            else if (_isStackDetails(errorObj[strStackDetails])) {
                details = errorObj[strStackDetails];
            }
            else if ((0, ts_utils_1.getWindow)() && (0, ts_utils_1.getWindow)()["opera"] && errorObj[strMessage]) {
                // Opera
                details = _getOperaStack(errorObj.message);
            }
            else if (errorObj["reason"] && errorObj.reason[strStack]) {
                // UnhandledPromiseRejection
                details = _convertStackObj(errorObj.reason[strStack]);
            }
            else if ((0, applicationinsights_core_js_1.isString)(errorObj)) {
                details = _convertStackObj(errorObj);
            }
            else {
                var evtMessage = errorObj[strMessage] || errorObj[strDescription] || "";
                if ((0, applicationinsights_core_js_1.isString)(errorObj[strErrorSrc])) {
                    if (evtMessage) {
                        evtMessage += "\n";
                    }
                    evtMessage += " from " + errorObj[strErrorSrc];
                }
                if (evtMessage) {
                    details = _convertStackObj(evtMessage);
                }
            }
        }
        catch (e) {
            // something unexpected happened so to avoid failing to report any error lets swallow the exception
            // and fallback to the callee/caller method
            details = _convertStackObj(e);
        }
    }
    return details || {
        src: "",
        obj: null
    };
}
function _formatStackTrace(stackDetails) {
    var stack = "";
    if (stackDetails) {
        if (stackDetails.obj) {
            stack = stackDetails.obj.join("\n");
        }
        else {
            stack = stackDetails.src || "";
        }
    }
    return stack;
}
function _parseStack(stack) {
    var parsedStack;
    var frames = stack.obj;
    if (frames && frames.length > 0) {
        parsedStack = [];
        var level_1 = 0;
        var foundStackStart_1 = false;
        var totalSizeInBytes_1 = 0;
        (0, applicationinsights_core_js_1.arrForEach)(frames, function (frame) {
            if (foundStackStart_1 || _isStackFrame(frame)) {
                var theFrame = (0, ts_utils_1.asString)(frame);
                // Once we have found the first stack frame we treat the rest of the lines as part of the stack
                foundStackStart_1 = true;
                var parsedFrame = _extractStackFrame(theFrame, level_1);
                if (parsedFrame) {
                    totalSizeInBytes_1 += parsedFrame.sizeInBytes;
                    parsedStack.push(parsedFrame);
                    level_1++;
                }
            }
        });
        // DP Constraint - exception parsed stack must be < 32KB
        // remove frames from the middle to meet the threshold
        var exceptionParsedStackThreshold = 32 * 1024;
        if (totalSizeInBytes_1 > exceptionParsedStackThreshold) {
            var left = 0;
            var right = parsedStack.length - 1;
            var size = 0;
            var acceptedLeft = left;
            var acceptedRight = right;
            while (left < right) {
                // check size
                var lSize = parsedStack[left].sizeInBytes;
                var rSize = parsedStack[right].sizeInBytes;
                size += lSize + rSize;
                if (size > exceptionParsedStackThreshold) {
                    // remove extra frames from the middle
                    var howMany = acceptedRight - acceptedLeft + 1;
                    parsedStack.splice(acceptedLeft, howMany);
                    break;
                }
                // update pointers
                acceptedLeft = left;
                acceptedRight = right;
                left++;
                right--;
            }
        }
    }
    return parsedStack;
}
function _getErrorType(errorType) {
    // Gets the Error Type by passing the constructor (used to get the true type of native error object).
    var typeName = "";
    if (errorType) {
        typeName = errorType.typeName || errorType.name || "";
        if (!typeName) {
            try {
                var funcNameRegex = /function (.{1,200})\(/;
                var results = (funcNameRegex).exec((errorType).constructor.toString());
                typeName = (results && results.length > 1) ? results[1] : "";
            }
            catch (e) {
                // eslint-disable-next-line no-empty -- Ignoring any failures as nothing we can do
            }
        }
    }
    return typeName;
}
/**
 * Formats the provided errorObj for display and reporting, it may be a String, Object, integer or undefined depending on the browser.
 * @param errorObj - The supplied errorObj
 */
function _formatErrorCode(errorObj) {
    if (errorObj) {
        try {
            if (!(0, applicationinsights_core_js_1.isString)(errorObj)) {
                var errorType = _getErrorType(errorObj);
                var result = _stringify(errorObj, false);
                if (!result || result === "{}") {
                    if (errorObj[strError]) {
                        // Looks like an MS Error Event
                        errorObj = errorObj[strError];
                        errorType = _getErrorType(errorObj);
                    }
                    result = _stringify(errorObj, true);
                }
                if ((0, ts_utils_1.strIndexOf)(result, errorType) !== 0 && errorType !== "String") {
                    return errorType + ":" + result;
                }
                return result;
            }
        }
        catch (e) {
            // eslint-disable-next-line no-empty -- Ignoring any failures as nothing we can do
        }
    }
    // Fallback to just letting the object format itself into a string
    return "" + (errorObj || "");
}
var Exception = /** @class */ (function () {
    /**
     * Constructs a new instance of the ExceptionTelemetry object
     */
    function Exception(logger, exception, properties, measurements, severityLevel, id) {
        this.aiDataContract = {
            ver: 1 /* FieldType.Required */,
            exceptions: 1 /* FieldType.Required */,
            severityLevel: 0 /* FieldType.Default */,
            properties: 0 /* FieldType.Default */,
            measurements: 0 /* FieldType.Default */
        };
        var _self = this;
        _self.ver = 2; // TODO: handle the CS"4.0" ==> breeze 2 conversion in a better way
        if (!_isExceptionInternal(exception)) {
            if (!properties) {
                properties = {};
            }
            if (id) {
                properties.id = id;
            }
            _self.exceptions = [_createExceptionDetails(logger, exception, properties)];
            _self.properties = (0, DataSanitizer_1.dataSanitizeProperties)(logger, properties);
            _self.measurements = (0, DataSanitizer_1.dataSanitizeMeasurements)(logger, measurements);
            if (severityLevel) {
                _self.severityLevel = severityLevel;
            }
            if (id) {
                _self.id = id;
            }
        }
        else {
            _self.exceptions = exception.exceptions || [];
            _self.properties = exception.properties;
            _self.measurements = exception.measurements;
            if (exception.severityLevel) {
                _self.severityLevel = exception.severityLevel;
            }
            if (exception.id) {
                _self.id = exception.id;
                exception.properties.id = exception.id;
            }
            if (exception.problemGroup) {
                _self.problemGroup = exception.problemGroup;
            }
            // bool/int types, use isNullOrUndefined
            if (!(0, applicationinsights_core_js_1.isNullOrUndefined)(exception.isManual)) {
                _self.isManual = exception.isManual;
            }
        }
    }
    Exception.CreateAutoException = function (message, url, lineNumber, columnNumber, error, evt, stack, errorSrc) {
        var errorType = _getErrorType(error || evt || message);
        return {
            message: _formatMessage(message, errorType),
            url: url,
            lineNumber: lineNumber,
            columnNumber: columnNumber,
            error: _formatErrorCode(error || evt || message),
            evt: _formatErrorCode(evt || message),
            typeName: errorType,
            stackDetails: _getStackFromErrorObj(stack || error || evt),
            errorSrc: errorSrc
        };
    };
    Exception.CreateFromInterface = function (logger, exception, properties, measurements) {
        var exceptions = exception.exceptions
            && (0, applicationinsights_core_js_1.arrMap)(exception.exceptions, function (ex) { return _createExDetailsFromInterface(logger, ex); });
        var exceptionData = new Exception(logger, __assign(__assign({}, exception), { exceptions: exceptions }), properties, measurements);
        return exceptionData;
    };
    Exception.prototype.toInterface = function () {
        var _a = this, exceptions = _a.exceptions, properties = _a.properties, measurements = _a.measurements, severityLevel = _a.severityLevel, problemGroup = _a.problemGroup, id = _a.id, isManual = _a.isManual;
        var exceptionDetailsInterface = exceptions instanceof Array
            && (0, applicationinsights_core_js_1.arrMap)(exceptions, function (exception) { return exception.toInterface(); })
            || undefined;
        return {
            ver: "4.0", // TODO: handle the CS"4.0" ==> breeze 2 conversion in a better way
            exceptions: exceptionDetailsInterface,
            severityLevel: severityLevel,
            properties: properties,
            measurements: measurements,
            problemGroup: problemGroup,
            id: id,
            isManual: isManual
        };
    };
    /**
     * Creates a simple exception with 1 stack frame. Useful for manual constracting of exception.
     */
    Exception.CreateSimpleException = function (message, typeName, assembly, fileName, details, line) {
        return {
            exceptions: [
                {
                    hasFullStack: true,
                    message: message,
                    stack: details,
                    typeName: typeName
                }
            ]
        };
    };
    Exception.envelopeType = "Microsoft.ApplicationInsights.{0}.Exception";
    Exception.dataType = "ExceptionData";
    Exception.formatError = _formatErrorCode;
    return Exception;
}());
exports.Exception = Exception;
var exDetailsAiDataContract = (0, ts_utils_1.objFreeze)({
    id: 0 /* FieldType.Default */,
    outerId: 0 /* FieldType.Default */,
    typeName: 1 /* FieldType.Required */,
    message: 1 /* FieldType.Required */,
    hasFullStack: 0 /* FieldType.Default */,
    stack: 0 /* FieldType.Default */,
    parsedStack: 2 /* FieldType.Array */
});
function _toInterface() {
    var _self = this;
    var parsedStack = (0, applicationinsights_core_js_1.isArray)(_self.parsedStack)
        && (0, applicationinsights_core_js_1.arrMap)(_self.parsedStack, function (frame) { return _parsedFrameToInterface(frame); });
    var exceptionDetailsInterface = {
        id: _self.id,
        outerId: _self.outerId,
        typeName: _self.typeName,
        message: _self.message,
        hasFullStack: _self.hasFullStack,
        stack: _self[strStack],
        parsedStack: parsedStack || undefined
    };
    return exceptionDetailsInterface;
}
function _createExceptionDetails(logger, exception, properties) {
    var id;
    var outerId;
    var typeName;
    var message;
    var hasFullStack;
    var theStack;
    var parsedStack;
    if (!_isExceptionDetailsInternal(exception)) {
        var error = exception;
        var evt = error && error.evt;
        if (!(0, applicationinsights_core_js_1.isError)(error)) {
            error = error[strError] || evt || error;
        }
        typeName = (0, DataSanitizer_1.dataSanitizeString)(logger, _getErrorType(error)) || Constants_1.strNotSpecified;
        message = (0, DataSanitizer_1.dataSanitizeMessage)(logger, _formatMessage(exception || error, typeName)) || Constants_1.strNotSpecified;
        var stack = exception[strStackDetails] || _getStackFromErrorObj(exception);
        parsedStack = _parseStack(stack);
        // after parsedStack is inited, iterate over each frame object, sanitize its assembly field
        if ((0, applicationinsights_core_js_1.isArray)(parsedStack)) {
            (0, applicationinsights_core_js_1.arrMap)(parsedStack, function (frame) {
                frame.assembly = (0, DataSanitizer_1.dataSanitizeString)(logger, frame.assembly);
                frame.fileName = (0, DataSanitizer_1.dataSanitizeString)(logger, frame.fileName);
            });
        }
        theStack = (0, DataSanitizer_1.dataSanitizeException)(logger, _formatStackTrace(stack));
        hasFullStack = (0, applicationinsights_core_js_1.isArray)(parsedStack) && parsedStack.length > 0;
        if (properties) {
            properties.typeName = properties.typeName || typeName;
        }
    }
    else {
        typeName = exception.typeName;
        message = exception.message;
        theStack = exception[strStack];
        parsedStack = exception.parsedStack || [];
        hasFullStack = exception.hasFullStack;
    }
    return {
        aiDataContract: exDetailsAiDataContract,
        id: id,
        outerId: outerId,
        typeName: typeName,
        message: message,
        hasFullStack: hasFullStack,
        stack: theStack,
        parsedStack: parsedStack,
        toInterface: _toInterface
    };
}
function _createExDetailsFromInterface(logger, exception) {
    var parsedStack = ((0, applicationinsights_core_js_1.isArray)(exception.parsedStack)
        && (0, applicationinsights_core_js_1.arrMap)(exception.parsedStack, function (frame) { return _stackFrameFromInterface(frame); }))
        || exception.parsedStack;
    var exceptionDetails = _createExceptionDetails(logger, __assign(__assign({}, exception), { parsedStack: parsedStack }));
    return exceptionDetails;
}
function _parseFilename(theFrame, fileName) {
    var lineCol = fileName.match(PARSE_FILENAME_LINE_COL);
    if (lineCol && lineCol.length >= 4) {
        theFrame.fileName = lineCol[1];
        theFrame.line = parseInt(lineCol[2]);
    }
    else {
        var lineNo = fileName.match(PARSE_FILENAME_LINE_ONLY);
        if (lineNo && lineNo.length >= 3) {
            theFrame.fileName = lineNo[1];
            theFrame.line = parseInt(lineNo[2]);
        }
        else {
            theFrame.fileName = fileName;
        }
    }
}
function _handleFilename(theFrame, sequence, matches) {
    var filename = theFrame.fileName;
    if (sequence.fn && matches && matches.length > sequence.fn) {
        if (sequence.ln && matches.length > sequence.ln) {
            filename = (0, applicationinsights_core_js_1.strTrim)(matches[sequence.fn] || "");
            theFrame.line = parseInt((0, applicationinsights_core_js_1.strTrim)(matches[sequence.ln] || "")) || 0;
        }
        else {
            filename = (0, applicationinsights_core_js_1.strTrim)(matches[sequence.fn] || "");
        }
    }
    if (filename) {
        _parseFilename(theFrame, filename);
    }
}
function _isStackFrame(frame) {
    var result = false;
    if (frame && (0, applicationinsights_core_js_1.isString)(frame)) {
        var trimmedFrame = (0, applicationinsights_core_js_1.strTrim)(frame);
        if (trimmedFrame) {
            result = IS_FRAME.test(trimmedFrame);
        }
    }
    return result;
}
var stackFrameAiDataContract = (0, ts_utils_1.objFreeze)({
    level: 1 /* FieldType.Required */,
    method: 1 /* FieldType.Required */,
    assembly: 0 /* FieldType.Default */,
    fileName: 0 /* FieldType.Default */,
    line: 0 /* FieldType.Default */
});
function _extractStackFrame(frame, level) {
    var theFrame;
    if (frame && (0, applicationinsights_core_js_1.isString)(frame) && (0, applicationinsights_core_js_1.strTrim)(frame)) {
        theFrame = {
            aiDataContract: stackFrameAiDataContract,
            level: level,
            assembly: (0, applicationinsights_core_js_1.strTrim)(frame),
            method: NoMethod,
            fileName: "",
            line: 0,
            sizeInBytes: 0
        };
        var idx = 0;
        while (idx < _parseSequence.length) {
            var sequence = _parseSequence[idx];
            if (sequence.chk && !sequence.chk(frame)) {
                break;
            }
            if (sequence.pre) {
                frame = sequence.pre(frame);
            }
            // Attempt to "parse" the stack frame
            var matches = frame.match(sequence.re);
            if (matches && matches.length >= sequence.len) {
                if (sequence.m) {
                    theFrame.method = (0, applicationinsights_core_js_1.strTrim)(matches[sequence.m] || NoMethod);
                }
                if (sequence.hdl) {
                    // Run any custom handler
                    sequence.hdl(theFrame, sequence, matches);
                }
                else if (sequence.fn) {
                    if (sequence.ln) {
                        theFrame.fileName = (0, applicationinsights_core_js_1.strTrim)(matches[sequence.fn] || "");
                        theFrame.line = parseInt((0, applicationinsights_core_js_1.strTrim)(matches[sequence.ln] || "")) || 0;
                    }
                    else {
                        _parseFilename(theFrame, matches[sequence.fn] || "");
                    }
                }
                // We found a match so stop looking
                break;
            }
            idx++;
        }
    }
    return _populateFrameSizeInBytes(theFrame);
}
function _stackFrameFromInterface(frame) {
    var parsedFrame = {
        aiDataContract: stackFrameAiDataContract,
        level: frame.level,
        method: frame.method,
        assembly: frame.assembly,
        fileName: frame.fileName,
        line: frame.line,
        sizeInBytes: 0
    };
    return _populateFrameSizeInBytes(parsedFrame);
}
function _populateFrameSizeInBytes(frame) {
    var sizeInBytes = STACKFRAME_BASE_SIZE;
    if (frame) {
        sizeInBytes += frame.method.length;
        sizeInBytes += frame.assembly.length;
        sizeInBytes += frame.fileName.length;
        sizeInBytes += frame.level.toString().length;
        sizeInBytes += frame.line.toString().length;
        frame.sizeInBytes = sizeInBytes;
    }
    return frame;
}
function _parsedFrameToInterface(frame) {
    return {
        level: frame.level,
        method: frame.method,
        assembly: frame.assembly,
        fileName: frame.fileName,
        line: frame.line
    };
}
