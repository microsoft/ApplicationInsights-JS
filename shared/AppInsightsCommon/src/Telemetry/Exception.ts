// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    IDiagnosticLogger, arrForEach, arrMap, isArray, isError, isFunction, isNullOrUndefined, isObject, isString, strTrim
} from "@microsoft/applicationinsights-core-js";
import { asString, getWindow, objFreeze, strIndexOf } from "@nevware21/ts-utils";
import { strNotSpecified } from "../Constants";
import { FieldType } from "../Enums/Enums";
import { IExceptionData } from "../Interfaces/Contracts/IExceptionData";
import { IExceptionDetails } from "../Interfaces/Contracts/IExceptionDetails";
import { IStackFrame } from "../Interfaces/Contracts/IStackFrame";
import { SeverityLevel } from "../Interfaces/Contracts/SeverityLevel";
import { IAutoExceptionTelemetry, IExceptionDetailsInternal, IExceptionInternal, IStackDetails } from "../Interfaces/IExceptionTelemetry";
import { ISerializable } from "../Interfaces/Telemetry/ISerializable";
import {
    dataSanitizeException, dataSanitizeMeasurements, dataSanitizeMessage, dataSanitizeProperties, dataSanitizeString
} from "./Common/DataSanitizer";

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

const STACKFRAME_BASE_SIZE = 58; // '{"method":"","level":,"assembly":"","fileName":"","line":}'.length

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
const IS_FRAME = /^\s{0,50}(from\s|at\s|Line\s{1,5}\d{1,10}\s{1,5}of|\w{1,50}@\w{1,80}|[^\(\s\n]+:[0-9\?]+(?::[0-9\?]+)?)/;

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
const FULL_STACK_FRAME_1 = /^(?:\s{0,50}at)?\s{0,50}([^\@\()\s]+)?\s{0,50}(?:\s|\@|\()\s{0,5}([^\(\s\n\]]+):([0-9\?]+):([0-9\?]+)\)?$/;

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
const FULL_STACK_FRAME_2 = /^(?:\s{0,50}at)?\s{0,50}([^\@\()\s]+)?\s{0,50}(?:\s|\@|\()\s{0,5}([^\(\s\n\]]+):([0-9\?]+)\)?$/;

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
const FULL_STACK_FRAME_3 = /^(?:\s{0,50}at)?\s{0,50}([^\@\()\s]+)?\s{0,50}(?:\s|\@|\()\s{0,5}([^\(\s\n\)\]]+)\)?$/;

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
const EXTRACT_FILENAME = /(?:^|\(|\s{0,10}[\w\)]+\@)?([^\(\n\s\]\)]+)(?:\:([0-9]+)(?:\:([0-9]+))?)?\)?(?:,|$)/;

/**
 * Attempt to extract the filename, line number, and column number from a string.
 */
const PARSE_FILENAME_LINE_COL = /([^\(\s\n]+):([0-9]+):([0-9]+)$/;

/**
 * Attempt to extract the filename and line number from a string.
 */
const PARSE_FILENAME_LINE_ONLY = /([^\(\s\n]+):([0-9]+)$/;

const NoMethod = "<no_method>";
const strError = "error";
const strStack = "stack";
const strStackDetails = "stackDetails";
const strErrorSrc = "errorSrc";
const strMessage = "message";
const strDescription = "description";

interface _ParseSequence {
    /**
     * The regular expression to match the frame
     */
    re: RegExp;

    /**
     * The expected number of matches in the regex, if this number is detected it will be considered a match
     */
    len: number;

    /**
     * The index into the matches to be used as the method name
     */
    m?: number;

    /**
     * The index into the matches to be used as the filename
     */
    fn: number;

    /**
     * The index into the matches to be used as the line number
     */
    ln?: number;

    /**
     * The index into the matches to be used as the column number
     */
    col?: number;
    
    /**
     * A function to pre-process the frame before it is parsed, this is persistent and any changes
     * will affect all subsequent frames
     * @param frame
     * @returns
     */
    pre?: (frame: string) => string;
    
    /**
     * A Check function to determine if the frame should be processed or dropped
     * @param frame
     * @returns
     */
    chk?: (frame: string) => boolean;

    /**
     * Convert / Handle the matching frame
     * @param frame - The frame to be processed
     * @param matches - The matches from the regex
     * @returns
     */
    hdl?: (frame: IStackFrame, parseSequence: _ParseSequence, matches: RegExpMatchArray) => void;
}

const _parseSequence: _ParseSequence[] = [
    { re: FULL_STACK_FRAME_1, len: 5, m: 1, fn: 2, ln: 3, col: 4 },
    { chk: _ignoreNative, pre: _scrubAnonymous, re: FULL_STACK_FRAME_2, len: 4, m: 1, fn: 2, ln: 3 },
    { re: FULL_STACK_FRAME_3, len: 3, m: 1, fn: 2, hdl: _handleFilename },
    { re: EXTRACT_FILENAME, len: 2, fn: 1, hdl: _handleFilename }
];

function _scrubAnonymous(frame: string) {
    return frame.replace(/(\(anonymous\))/, "<anonymous>");
}

function _ignoreNative(frame: string) {
    return strIndexOf(frame, "[native") < 0;
}

function _stringify(value: any, convertToString: boolean) {
    let result = value;
    if (result && !isString(result)) {
        if (JSON && JSON.stringify) {
            result = JSON.stringify(value);
            if (convertToString && (!result || result === "{}")) {
                if (isFunction(value.toString)) {
                    result = value.toString();
                } else {
                    result = "" + value;
                }
            }
        } else {
            result = "" + value + " - (Missing JSON.stringify)";
        }
    }

    return result || "";
}

function _formatMessage(theEvent: any, errorType: string) {
    let evtMessage = theEvent;
    if (theEvent) {
        if (evtMessage && !isString(evtMessage)) {
            evtMessage = theEvent[strMessage] || theEvent[strDescription] || evtMessage;
        }

        // Make sure the message is a string
        if (evtMessage && !isString(evtMessage)) {
            // tslint:disable-next-line: prefer-conditional-expression
            evtMessage = _stringify(evtMessage, true);
        }

        if (theEvent["filename"]) {
            // Looks like an event object with filename
            evtMessage = evtMessage + " @" + (theEvent["filename"] || "") + ":" + (theEvent["lineno"] || "?") + ":" + (theEvent["colno"] || "?");
        }
    }
    
    // Automatically add the error type to the message if it does already appear to be present
    if (errorType && errorType !== "String" && errorType !== "Object" && errorType !== "Error" && strIndexOf(evtMessage || "", errorType) === -1) {
        evtMessage = errorType + ": " + evtMessage;
    }

    return evtMessage || "";
}

function _isExceptionDetailsInternal(value:any): value is IExceptionDetailsInternal {
    try {
        if (isObject(value)) {
            return "hasFullStack" in value && "typeName" in value;
        }
    } catch (e) {
        // This can happen with some native browser objects, but should not happen for the type we are checking for
    }

    return false;
}

function _isExceptionInternal(value:any): value is IExceptionInternal {
    try {
        if (isObject(value)) {
            return ("ver" in value && "exceptions" in value && "properties" in value);
        }
    } catch (e) {
        // This can happen with some native browser objects, but should not happen for the type we are checking for
    }

    return false;
}

function _isStackDetails(details:any): details is IStackDetails {
    return details && details.src && isString(details.src) && details.obj && isArray(details.obj);
}

function _convertStackObj(errorStack:string): IStackDetails {
    let src = errorStack || "";
    if (!isString(src)) {
        if (isString(src[strStack])) {
            src = src[strStack];
        } else {
            src = "" + src;
        }
    }

    let items = src.split("\n");
    return {
        src,
        obj: items
    };
}

function _getOperaStack(errorMessage:string): IStackDetails {
    var stack: string[] = [];
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

function _getStackFromErrorObj(errorObj:any): IStackDetails {
    let details = null;
    if (errorObj) {
        try {
            /* Using bracket notation is support older browsers (IE 7/8 -- dont remember the version) that throw when using dot
            notation for undefined objects and we don't want to loose the error from being reported */
            if (errorObj[strStack]) {
                // Chrome/Firefox
                details = _convertStackObj(errorObj[strStack]);
            } else if (errorObj[strError] && errorObj[strError][strStack]) {
                // Edge error event provides the stack and error object
                details = _convertStackObj(errorObj[strError][strStack]);
            } else if (errorObj["exception"] && errorObj.exception[strStack]) {
                details = _convertStackObj(errorObj.exception[strStack]);
            } else if (_isStackDetails(errorObj)) {
                details = errorObj;
            } else if (_isStackDetails(errorObj[strStackDetails])) {
                details = errorObj[strStackDetails];
            } else if (getWindow() && getWindow()["opera"] && errorObj[strMessage]) {
                // Opera
                details = _getOperaStack(errorObj.message);
            } else if (errorObj["reason"] && errorObj.reason[strStack]) {
                // UnhandledPromiseRejection
                details = _convertStackObj(errorObj.reason[strStack]);
            } else if (isString(errorObj)) {
                details = _convertStackObj(errorObj);
            } else {
                let evtMessage = errorObj[strMessage] || errorObj[strDescription] || "";

                if (isString(errorObj[strErrorSrc])) {
                    if (evtMessage) {
                        evtMessage += "\n";
                    }

                    evtMessage += " from " + errorObj[strErrorSrc];
                }

                if (evtMessage) {
                    details = _convertStackObj(evtMessage);
                }
            }
        } catch (e) {
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

function _formatStackTrace(stackDetails: IStackDetails) {
    let stack = "";

    if (stackDetails) {
        if (stackDetails.obj) {
            stack = stackDetails.obj.join("\n");
        } else {
            stack = stackDetails.src || "";
        }
    
    }

    return stack;
}

function _parseStack(stack:IStackDetails): _IParsedStackFrame[] {
    let parsedStack: _IParsedStackFrame[];
    let frames = stack.obj;
    if (frames && frames.length > 0) {
        parsedStack = [];
        let level = 0;

        let foundStackStart = false;
        let totalSizeInBytes = 0;
        arrForEach(frames, (frame) => {
            if (foundStackStart || _isStackFrame(frame)) {
                let theFrame = asString(frame);

                // Once we have found the first stack frame we treat the rest of the lines as part of the stack
                foundStackStart = true;
                let parsedFrame: _IParsedStackFrame = _extractStackFrame(theFrame, level);
                if (parsedFrame) {
                    totalSizeInBytes += parsedFrame.sizeInBytes;
                    parsedStack.push(parsedFrame);
                    level++;
                }
            }
        });

        // DP Constraint - exception parsed stack must be < 32KB
        // remove frames from the middle to meet the threshold
        const exceptionParsedStackThreshold = 32 * 1024;
        if (totalSizeInBytes > exceptionParsedStackThreshold) {
            let left = 0;
            let right = parsedStack.length - 1;
            let size = 0;
            let acceptedLeft = left;
            let acceptedRight = right;

            while (left < right) {
                // check size
                const lSize = parsedStack[left].sizeInBytes;
                const rSize = parsedStack[right].sizeInBytes;
                size += lSize + rSize;

                if (size > exceptionParsedStackThreshold) {

                    // remove extra frames from the middle
                    const howMany = acceptedRight - acceptedLeft + 1;
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

function _getErrorType(errorType: any) {
    // Gets the Error Type by passing the constructor (used to get the true type of native error object).
    let typeName = "";
    if (errorType) {
        typeName = errorType.typeName || errorType.name || "";
        if (!typeName) {
            try {
                var funcNameRegex = /function (.{1,200})\(/;
                var results = (funcNameRegex).exec((errorType).constructor.toString());
                typeName = (results && results.length > 1) ? results[1] : "";
            } catch (e) {
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
export function _formatErrorCode(errorObj:any) {
    if (errorObj) {
        try {
            if (!isString(errorObj)) {
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

                if (strIndexOf(result, errorType) !== 0 && errorType !== "String") {
                    return errorType + ":" + result;
                }

                return result;
            }
        } catch (e) {
            // eslint-disable-next-line no-empty -- Ignoring any failures as nothing we can do
        }
    }

    // Fallback to just letting the object format itself into a string
    return "" + (errorObj || "");
}

export class Exception implements IExceptionData, ISerializable {

    public static envelopeType = "Microsoft.ApplicationInsights.{0}.Exception";
    public static dataType = "ExceptionData";

    public id?: string;
    public problemGroup?: string;
    public isManual?: boolean;

    public aiDataContract = {
        ver: FieldType.Required,
        exceptions: FieldType.Required,
        severityLevel: FieldType.Default,
        properties: FieldType.Default,
        measurements: FieldType.Default
    }

    /**
     * Schema version
     */
    public ver: number; /* 2 */

    /**
     * Exception chain - list of inner exceptions.
     */
    public exceptions: IExceptionDetails[]; /* [] */
 
    /**
     * Severity level. Mostly used to indicate exception severity level when it is reported by logging library.
     */
    public severityLevel: SeverityLevel;
 
    /**
     * Collection of custom properties.
     */
    public properties: any;
 
    /**
     * Collection of custom measurements.
     */
    public measurements: any;
 
    /**
     * Constructs a new instance of the ExceptionTelemetry object
     */
    constructor(logger: IDiagnosticLogger, exception: Error | IExceptionInternal | IAutoExceptionTelemetry, properties?: {[key: string]: any}, measurements?: {[key: string]: number}, severityLevel?: SeverityLevel, id?: string) {
        let _self = this;
        _self.ver = 2; // TODO: handle the CS"4.0" ==> breeze 2 conversion in a better way
        if (!_isExceptionInternal(exception)) {
            if (!properties) {
                properties = { };
            }
            if (id){
                properties.id = id;
            }
            
            _self.exceptions = [_createExceptionDetails(logger, exception, properties)];
            _self.properties = dataSanitizeProperties(logger, properties);
            _self.measurements = dataSanitizeMeasurements(logger, measurements);
            if (severityLevel) {
                _self.severityLevel = severityLevel;
            }
            if (id) {
                _self.id = id;
            }
        } else {
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
            if (!isNullOrUndefined(exception.isManual)) {
                _self.isManual = exception.isManual;
            }
        }
    }

    public static CreateAutoException(
        message: string | Event,
        url: string,
        lineNumber: number,
        columnNumber: number,
        error: any,
        evt?: Event|string,
        stack?: string,
        errorSrc?: string
    ): IAutoExceptionTelemetry {

        let errorType = _getErrorType(error || evt || message);

        return {
            message: _formatMessage(message, errorType),
            url,
            lineNumber,
            columnNumber,
            error: _formatErrorCode(error || evt || message),
            evt: _formatErrorCode(evt || message),
            typeName: errorType,
            stackDetails: _getStackFromErrorObj(stack || error || evt),
            errorSrc
        }
    }

    public static CreateFromInterface(logger: IDiagnosticLogger, exception: IExceptionInternal, properties?: any, measurements?: { [key: string]: number }): Exception {
        const exceptions: _IExceptionDetails[] = exception.exceptions
            && arrMap(exception.exceptions, (ex: IExceptionDetailsInternal) => _createExDetailsFromInterface(logger, ex));
        const exceptionData = new Exception(logger, {...exception, exceptions}, properties, measurements);
        return exceptionData;
    }

    public toInterface(): IExceptionInternal {
        const { exceptions, properties, measurements, severityLevel, problemGroup, id, isManual } = this;

        const exceptionDetailsInterface = exceptions instanceof Array
            && arrMap(exceptions, (exception: _IExceptionDetails) => exception.toInterface())
            || undefined;

        return {
            ver: "4.0", // TODO: handle the CS"4.0" ==> breeze 2 conversion in a better way
            exceptions: exceptionDetailsInterface,
            severityLevel,
            properties,
            measurements,
            problemGroup,
            id,
            isManual
        } as IExceptionInternal;
    }

    /**
     * Creates a simple exception with 1 stack frame. Useful for manual constracting of exception.
     */
    public static CreateSimpleException(message: string, typeName: string, assembly: string, fileName: string,
        details: string, line: number): Exception {

        return {
            exceptions: [
                {
                    hasFullStack: true,
                    message,
                    stack: details,
                    typeName
                } as IExceptionDetails
            ]
        } as Exception;
    }

    public static formatError = _formatErrorCode;
}

const exDetailsAiDataContract = objFreeze({
    id: FieldType.Default,
    outerId: FieldType.Default,
    typeName: FieldType.Required,
    message: FieldType.Required,
    hasFullStack: FieldType.Default,
    stack: FieldType.Default,
    parsedStack: FieldType.Array
});

interface _IExceptionDetails extends IExceptionDetails, ISerializable {
    toInterface: () => IExceptionDetailsInternal;
}

function _toInterface() {
    let _self = this;
    const parsedStack = isArray(_self.parsedStack)
        && arrMap(_self.parsedStack, (frame: _IParsedStackFrame) => _parsedFrameToInterface(frame));

    const exceptionDetailsInterface: IExceptionDetailsInternal = {
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

export function _createExceptionDetails(logger: IDiagnosticLogger, exception: Error | IExceptionDetailsInternal | IAutoExceptionTelemetry, properties?: {[key: string]: any}): _IExceptionDetails {

    let id: number;
    let outerId: number;
    let typeName: string;
    let message: string;
    let hasFullStack: boolean;
    let theStack: string;
    let parsedStack: IStackFrame[];

    if (!_isExceptionDetailsInternal(exception)) {
        let error = exception as any;
        let evt = error && error.evt;
        if (!isError(error)) {
            error = error[strError] || evt || error;
        }

        typeName = dataSanitizeString(logger, _getErrorType(error)) || strNotSpecified;
        message = dataSanitizeMessage(logger, _formatMessage(exception || error, typeName)) || strNotSpecified;
        const stack = exception[strStackDetails] || _getStackFromErrorObj(exception);
        parsedStack = _parseStack(stack);

        // after parsedStack is inited, iterate over each frame object, sanitize its assembly field
        if (isArray(parsedStack)){
            arrMap(parsedStack, (frame: IStackFrame) => {
                frame.assembly = dataSanitizeString(logger, frame.assembly);
                frame.fileName = dataSanitizeString(logger, frame.fileName);
            });
        }
      
        theStack = dataSanitizeException(logger, _formatStackTrace(stack));
        hasFullStack = isArray(parsedStack) && parsedStack.length > 0;

        if (properties) {
            properties.typeName = properties.typeName || typeName;
        }
    } else {
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

export function _createExDetailsFromInterface(logger:IDiagnosticLogger, exception: IExceptionDetailsInternal): _IExceptionDetails {
    const parsedStack = (isArray(exception.parsedStack)
        && arrMap(exception.parsedStack, frame => _stackFrameFromInterface(frame)))
        || exception.parsedStack;

    const exceptionDetails = _createExceptionDetails(logger, {...exception, parsedStack});

    return exceptionDetails;
}

function _parseFilename(theFrame: IStackFrame, fileName: string) {
    const lineCol = fileName.match(PARSE_FILENAME_LINE_COL);
    if (lineCol && lineCol.length >= 4) {
        theFrame.fileName = lineCol[1];
        theFrame.line = parseInt(lineCol[2]);
    } else {
        const lineNo = fileName.match(PARSE_FILENAME_LINE_ONLY);
        if (lineNo && lineNo.length >= 3) {
            theFrame.fileName = lineNo[1];
            theFrame.line = parseInt(lineNo[2]);
        } else {
            theFrame.fileName = fileName;
        }
    }
}

function _handleFilename(theFrame: IStackFrame, sequence: _ParseSequence, matches: RegExpMatchArray) {
    let filename = theFrame.fileName;
    
    if (sequence.fn && matches && matches.length > sequence.fn) {
        if (sequence.ln && matches.length > sequence.ln) {
            filename = strTrim(matches[sequence.fn] || "");
            theFrame.line = parseInt(strTrim(matches[sequence.ln] || "")) || 0;
        } else {
            filename = strTrim(matches[sequence.fn] || "");
        }
    }

    if (filename) {
        _parseFilename(theFrame, filename);
    }
}

function _isStackFrame(frame: string) {
    let result = false;
    if (frame && isString(frame)) {
        let trimmedFrame = strTrim(frame);
        if (trimmedFrame) {
            result = IS_FRAME.test(trimmedFrame);
        }
    }

    return result;
}

export interface _IParsedStackFrame extends IStackFrame, ISerializable {
    sizeInBytes: number;
}

const stackFrameAiDataContract = objFreeze({
    level: FieldType.Required,
    method: FieldType.Required,
    assembly: FieldType.Default,
    fileName: FieldType.Default,
    line: FieldType.Default
});

export function _extractStackFrame(frame: string, level: number): _IParsedStackFrame | undefined {
    let theFrame: _IParsedStackFrame;

    if (frame && isString(frame) && strTrim(frame)) {
        theFrame = {
            aiDataContract: stackFrameAiDataContract,
            level: level,
            assembly: strTrim(frame),
            method: NoMethod,
            fileName: "",
            line: 0,
            sizeInBytes: 0
        };

        let idx = 0;
        while(idx < _parseSequence.length) {
            let sequence = _parseSequence[idx];
            if (sequence.chk && !sequence.chk(frame)) {
                break;
            }
            if (sequence.pre) {
                frame = sequence.pre(frame);
            }

            // Attempt to "parse" the stack frame
            const matches = frame.match(sequence.re);
            if (matches && matches.length >= sequence.len) {
                if (sequence.m) {
                    theFrame.method = strTrim(matches[sequence.m] || NoMethod);
                }

                if (sequence.hdl) {
                    // Run any custom handler
                    sequence.hdl(theFrame, sequence, matches);
                } else if (sequence.fn) {
                    if (sequence.ln) {
                        theFrame.fileName = strTrim(matches[sequence.fn] || "");
                        theFrame.line = parseInt(strTrim(matches[sequence.ln] || "")) || 0;
                    } else {
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

function _stackFrameFromInterface(frame: IStackFrame): _IParsedStackFrame {
    let parsedFrame: _IParsedStackFrame = {
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

function _populateFrameSizeInBytes(frame: _IParsedStackFrame): _IParsedStackFrame {
    let sizeInBytes = STACKFRAME_BASE_SIZE;
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

export function _parsedFrameToInterface(frame: _IParsedStackFrame): IStackFrame {
    return {
        level: frame.level,
        method: frame.method,
        assembly: frame.assembly,
        fileName: frame.fileName,
        line: frame.line
    };
}
