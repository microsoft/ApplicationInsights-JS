// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    IDiagnosticLogger, arrForEach, arrMap, isArray, isError, isFunction, isNullOrUndefined, isObject, isString, strTrim
} from "@microsoft/applicationinsights-core-js";
import { strNotSpecified } from "../Constants";
import { FieldType } from "../Enums";
import { IExceptionData } from "../Interfaces/Contracts/IExceptionData";
import { IExceptionDetails } from "../Interfaces/Contracts/IExceptionDetails";
import { IStackFrame } from "../Interfaces/Contracts/IStackFrame";
import { SeverityLevel } from "../Interfaces/Contracts/SeverityLevel";
import {
    IAutoExceptionTelemetry, IExceptionDetailsInternal, IExceptionInternal, IExceptionStackFrameInternal, IStackDetails
} from "../Interfaces/IExceptionTelemetry";
import { ISerializable } from "../Interfaces/Telemetry/ISerializable";
import {
    dataSanitizeException, dataSanitizeMeasurements, dataSanitizeMessage, dataSanitizeProperties, dataSanitizeString
} from "./Common/DataSanitizer";

const NoMethod = "<no_method>";
const strError = "error";
const strStack = "stack";
const strStackDetails = "stackDetails";
const strErrorSrc = "errorSrc";
const strMessage = "message";
const strDescription = "description";

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
    if (errorType && errorType !== "String" && errorType !== "Object" && errorType !== "Error" && (evtMessage || "").indexOf(errorType) === -1) {
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
            } else if (window && window["opera"] && errorObj[strMessage]) {
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
            arrForEach(stackDetails.obj, (entry) => {
                stack += entry + "\n";
            });
        } else {
            stack = stackDetails.src || "";
        }
    
    }

    return stack;
}

function _parseStack(stack:IStackDetails): _StackFrame[] {
    let parsedStack: _StackFrame[];
    let frames = stack.obj;
    if (frames && frames.length > 0) {
        parsedStack = [];
        let level = 0;

        let totalSizeInBytes = 0;

        arrForEach(frames, (frame) => {
            let theFrame = frame.toString();
            if (_StackFrame.regex.test(theFrame)) {
                const parsedFrame = new _StackFrame(theFrame, level++);
                totalSizeInBytes += parsedFrame.sizeInBytes;
                parsedStack.push(parsedFrame);
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
 * @param errorObj The supplied errorObj
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

                if (result.indexOf(errorType) !== 0 && errorType !== "String") {
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
            
            _self.exceptions = [new _ExceptionDetails(logger, exception, properties)];
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
        const exceptions: _ExceptionDetails[] = exception.exceptions
            && arrMap(exception.exceptions, (ex: IExceptionDetailsInternal) => _ExceptionDetails.CreateFromInterface(logger, ex));
        const exceptionData = new Exception(logger, {...exception, exceptions}, properties, measurements);
        return exceptionData;
    }

    public toInterface(): IExceptionInternal {
        const { exceptions, properties, measurements, severityLevel, problemGroup, id, isManual } = this;

        const exceptionDetailsInterface = exceptions instanceof Array
            && arrMap(exceptions, (exception: _ExceptionDetails) => exception.toInterface())
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

export class _ExceptionDetails implements IExceptionDetails, ISerializable {

    public aiDataContract = {
        id: FieldType.Default,
        outerId: FieldType.Default,
        typeName: FieldType.Required,
        message: FieldType.Required,
        hasFullStack: FieldType.Default,
        stack: FieldType.Default,
        parsedStack: FieldType.Array
    };

    /**
     * In case exception is nested (outer exception contains inner one), the id and outerId properties are used to represent the nesting.
     */
    public id: number;

    /**
     * The value of outerId is a reference to an element in ExceptionDetails that represents the outer exception
     */
    public outerId: number;
 
    /**
     * Exception type name.
     */
    public typeName: string;
     
    /**
     * Exception message.
     */
    public message: string;
 
    /**
     * Indicates if full exception stack is provided in the exception. The stack may be trimmed, such as in the case of a StackOverflow exception.
     */
    public hasFullStack: boolean;
 
    /**
     * Text describing the stack. Either stack or parsedStack should have a value.
     */
    public stack: string;
 
    /**
     * List of stack frames. Either stack or parsedStack should have a value.
     */
    public parsedStack: IStackFrame[]; /* [] */
 
    constructor(logger: IDiagnosticLogger, exception: Error | IExceptionDetailsInternal | IAutoExceptionTelemetry, properties?: {[key: string]: any}) {
        let _self = this;
        if (!_isExceptionDetailsInternal(exception)) {
            let error = exception as any;
            let evt = error && error.evt;
            if (!isError(error)) {
                error = error[strError] || evt || error;
            }

            _self.typeName = dataSanitizeString(logger, _getErrorType(error)) || strNotSpecified;
            _self.message = dataSanitizeMessage(logger, _formatMessage(exception || error, _self.typeName)) || strNotSpecified;
            const stack = exception[strStackDetails] || _getStackFromErrorObj(exception);
            _self.parsedStack = _parseStack(stack);

            // after parsedStack is inited, iterate over each frame object, sanitize its assembly field
            if (isArray(_self.parsedStack)){
                arrMap(_self.parsedStack, (frame: _StackFrame) => {
                    frame.assembly = dataSanitizeString(logger, frame.assembly);
                    frame.fileName = dataSanitizeString(logger, frame.fileName);
                });
            }
          
            _self[strStack] = dataSanitizeException(logger, _formatStackTrace(stack));
            _self.hasFullStack = isArray(_self.parsedStack) && _self.parsedStack.length > 0;

            if (properties) {
                properties.typeName = properties.typeName || _self.typeName;
            }
        } else {
            _self.typeName = exception.typeName;
            _self.message = exception.message;
            _self[strStack] = exception[strStack];
            _self.parsedStack = exception.parsedStack || [];
            _self.hasFullStack = exception.hasFullStack;
        }
    }

    public toInterface(): IExceptionDetailsInternal {
        let _self = this;
        const parsedStack = _self.parsedStack instanceof Array
            && arrMap(_self.parsedStack, (frame: _StackFrame) => frame.toInterface());

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

    public static CreateFromInterface(logger:IDiagnosticLogger, exception: IExceptionDetailsInternal): _ExceptionDetails {
        const parsedStack = (exception.parsedStack instanceof Array
            && arrMap(exception.parsedStack, frame => _StackFrame.CreateFromInterface(frame)))
            || exception.parsedStack;

        const exceptionDetails = new _ExceptionDetails(logger, {...exception, parsedStack});

        return exceptionDetails;
    }
}

export class _StackFrame implements IStackFrame, ISerializable {

    // regex to match stack frames from ie/chrome/ff
    // methodName=$2, fileName=$4, lineNo=$5, column=$6
    public static regex = /^([\s]+at)?[\s]{0,50}([^\@\()]+?)[\s]{0,50}(\@|\()([^\(\n]+):([0-9]+):([0-9]+)(\)?)$/;
    public static baseSize = 58; // '{"method":"","level":,"assembly":"","fileName":"","line":}'.length

    public sizeInBytes: number; /* 0 */

    public aiDataContract = {
        level: FieldType.Required,
        method: FieldType.Required,
        assembly: FieldType.Default,
        fileName: FieldType.Default,
        line: FieldType.Default
    };

    /**
     * Level in the call stack. For the long stacks SDK may not report every function in a call stack.
     */
    public level: number;

    /**
     * Method name.
     */
    public method: string;
 
    /**
     * Name of the assembly (dll, jar, etc.) containing this function.
     */
    public assembly: string;
 
    /**
     * File name or URL of the method implementation.
     */
    public fileName: string;
 
    /**
     * Line number of the code implementation.
     */
    public line: number;
 
    constructor(sourceFrame: string | IExceptionStackFrameInternal, level: number) {
        let _self = this;
        _self.sizeInBytes = 0;

        // Not converting this to isString() as typescript uses this logic to "understand" the different
        // types for the 2 different code paths
        if (typeof sourceFrame === "string") {
            const frame: string = sourceFrame;
            _self.level = level;
            _self.method = NoMethod;
            _self.assembly = strTrim(frame);
            _self.fileName = "";
            _self.line = 0;
            const matches = frame.match(_StackFrame.regex);
            if (matches && matches.length >= 5) {
                _self.method = strTrim(matches[2]) || _self.method;
                _self.fileName = strTrim(matches[4]);
                _self.line = parseInt(matches[5]) || 0;
            }
        } else {
            _self.level = sourceFrame.level;
            _self.method = sourceFrame.method;
            _self.assembly = sourceFrame.assembly;
            _self.fileName = sourceFrame.fileName;
            _self.line = sourceFrame.line;
            _self.sizeInBytes = 0;
        }

        _self.sizeInBytes += _self.method.length;
        _self.sizeInBytes += _self.fileName.length;
        _self.sizeInBytes += _self.assembly.length;

        // todo: these might need to be removed depending on how the back-end settles on their size calculation
        _self.sizeInBytes += _StackFrame.baseSize;
        _self.sizeInBytes += _self.level.toString().length;
        _self.sizeInBytes += _self.line.toString().length;
    }

    public static CreateFromInterface(frame: IExceptionStackFrameInternal) {
        return new _StackFrame(frame, null /* level is available in frame interface */);
    }

    public toInterface() {
        let _self = this;
        return {
            level: _self.level,
            method: _self.method,
            assembly: _self.assembly,
            fileName: _self.fileName,
            line: _self.line
        };
    }
}
