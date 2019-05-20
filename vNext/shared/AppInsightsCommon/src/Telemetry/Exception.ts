// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { StackFrame } from '../Interfaces/Contracts/Generated/StackFrame';
import { ExceptionData } from '../Interfaces/Contracts/Generated/ExceptionData';
import { ExceptionDetails } from '../Interfaces/Contracts/Generated/ExceptionDetails';
import { ISerializable } from '../Interfaces/Telemetry/ISerializable';
import { DataSanitizer } from './Common/DataSanitizer';
import { FieldType } from '../Enums';
import { SeverityLevel } from '../Interfaces/Contracts/Generated/SeverityLevel';
import { Util } from '../Util';
import { IDiagnosticLogger, CoreUtils } from '@microsoft/applicationinsights-core-js';
import { IExceptionInternal, IExceptionTelemetry, IExceptionDetailsInternal, IExceptionStackFrameInternal } from '../Interfaces/IExceptionTelemetry';

export class Exception extends ExceptionData implements ISerializable {

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
    * Constructs a new instance of the ExceptionTelemetry object
    */
    constructor(logger: IDiagnosticLogger, exception: Error | IExceptionInternal, properties?: {[key: string]: any}, measurements?: {[key: string]: number}, severityLevel?: SeverityLevel) {
        super();

        if (exception instanceof Error) {
            this.exceptions = [new _ExceptionDetails(logger, exception)];
            this.properties = DataSanitizer.sanitizeProperties(logger, properties);
            this.measurements = DataSanitizer.sanitizeMeasurements(logger, measurements);
            if (severityLevel) {
                this.severityLevel = severityLevel;
            }
        } else {
            this.exceptions = exception.exceptions;
            this.properties = exception.properties;
            this.measurements = exception.measurements;
            if (exception.severityLevel) this.severityLevel = exception.severityLevel;
            if (exception.id) this.id = exception.id;
            if (exception.problemGroup) this.problemGroup = exception.problemGroup;

            // bool/int types, use isNullOrUndefined
            if (!CoreUtils.isNullOrUndefined(exception.ver)) this.ver = exception.ver;
            if (!CoreUtils.isNullOrUndefined(exception.isManual)) this.isManual = exception.isManual;
        }

    }

    public static CreateFromInterface(logger: IDiagnosticLogger, exception: IExceptionInternal): Exception {
        const exceptions: _ExceptionDetails[] = exception.exceptions
            && exception.exceptions.map((ex: IExceptionDetailsInternal) => _ExceptionDetails.CreateFromInterface(logger, ex));
        const exceptionData = new Exception(logger, {...exception, exceptions});
        return exceptionData;
    }

    public toInterface(): IExceptionInternal {
        const { exceptions, properties, measurements, severityLevel, ver, problemGroup, id, isManual } = this;

        const exceptionDetailsInterface = exceptions instanceof Array
            && exceptions.map((exception: _ExceptionDetails) => exception.toInterface())
            || undefined;

        return <IExceptionInternal>{
            ver: ver,
            exceptions: exceptionDetailsInterface,
            severityLevel,
            properties,
            measurements,
            problemGroup,
            id,
            isManual
        };
    }

    /**
    * Creates a simple exception with 1 stack frame. Useful for manual constracting of exception.
    */
    public static CreateSimpleException(message: string, typeName: string, assembly: string, fileName: string,
        details: string, line: number): Exception {

        return <Exception>{
            exceptions: [
                <ExceptionDetails>{
                    hasFullStack: true,
                    message: message,
                    stack: details,
                    typeName: typeName
                }
            ]
        };
    }
}

export class _ExceptionDetails extends ExceptionDetails implements ISerializable {

    public aiDataContract = {
        id: FieldType.Default,
        outerId: FieldType.Default,
        typeName: FieldType.Required,
        message: FieldType.Required,
        hasFullStack: FieldType.Default,
        stack: FieldType.Default,
        parsedStack: FieldType.Array
    };

    constructor(logger: IDiagnosticLogger, exception: Error | IExceptionDetailsInternal) {
        super();

        if (exception instanceof Error) {
            this.typeName = DataSanitizer.sanitizeString(logger, exception.name) || Util.NotSpecified;
            this.message = DataSanitizer.sanitizeMessage(logger, exception.message) || Util.NotSpecified;
            var stack = exception.stack;
            this.parsedStack = _ExceptionDetails.parseStack(stack);
            this.stack = DataSanitizer.sanitizeException(logger, stack);
            this.hasFullStack = Util.isArray(this.parsedStack) && this.parsedStack.length > 0;
        } else {
            this.typeName = exception.typeName;
            this.message = exception.message;
            this.stack = exception.stack;
            this.parsedStack = exception.parsedStack
            this.hasFullStack = exception.hasFullStack
        }
    }

    public toInterface(): IExceptionDetailsInternal {
        const parsedStack = this.parsedStack instanceof Array
            && this.parsedStack.map((frame: _StackFrame) => frame.toInterface());

        const exceptionDetailsInterface: IExceptionDetailsInternal = {
            id: this.id,
            outerId: this.outerId,
            typeName: this.typeName,
            message: this.message,
            hasFullStack: this.hasFullStack,
            stack: this.stack,
            parsedStack: parsedStack || undefined
        };

        return exceptionDetailsInterface;
    }

    public static CreateFromInterface(logger, exception: IExceptionDetailsInternal): _ExceptionDetails {
        const parsedStack = (exception.parsedStack instanceof Array
            && exception.parsedStack.map(frame => _StackFrame.CreateFromInterface(frame)))
            || exception.parsedStack;

        const exceptionDetails = new _ExceptionDetails(logger, {...exception, parsedStack: parsedStack});

        return exceptionDetails;
    }

    private static parseStack(stack): _StackFrame[] {
        var parsedStack: _StackFrame[] = undefined;
        if (typeof stack === "string") {
            var frames = stack.split('\n');
            parsedStack = [];
            var level = 0;

            var totalSizeInBytes = 0;
            for (var i = 0; i <= frames.length; i++) {
                var frame = frames[i];
                if (_StackFrame.regex.test(frame)) {
                    var parsedFrame = new _StackFrame(frames[i], level++);
                    totalSizeInBytes += parsedFrame.sizeInBytes;
                    parsedStack.push(parsedFrame);
                }
            }

            // DP Constraint - exception parsed stack must be < 32KB
            // remove frames from the middle to meet the threshold
            var exceptionParsedStackThreshold = 32 * 1024;
            if (totalSizeInBytes > exceptionParsedStackThreshold) {
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
}

export class _StackFrame extends StackFrame implements ISerializable {

    // regex to match stack frames from ie/chrome/ff
    // methodName=$2, fileName=$4, lineNo=$5, column=$6
    public static regex = /^([\s]+at)?(.*?)(\@|\s\(|\s)([^\(\@\n]+):([0-9]+):([0-9]+)(\)?)$/;
    public static baseSize = 58; //'{"method":"","level":,"assembly":"","fileName":"","line":}'.length
    public sizeInBytes = 0;

    public aiDataContract = {
        level: FieldType.Required,
        method: FieldType.Required,
        assembly: FieldType.Default,
        fileName: FieldType.Default,
        line: FieldType.Default,
    };

    constructor(sourceFrame: string | IExceptionStackFrameInternal, level: number) {
        super();

        if (typeof sourceFrame === "string") {
            const frame: string = sourceFrame;
            this.level = level;
            this.method = "<no_method>";
            this.assembly = Util.trim(frame);
            this.fileName = "";
            this.line = 0;
            var matches = frame.match(_StackFrame.regex);
            if (matches && matches.length >= 5) {
                this.method = Util.trim(matches[2]) || this.method;
                this.fileName = Util.trim(matches[4]);
                this.line = parseInt(matches[5]) || 0;
            }
        } else {
            this.level = sourceFrame.level;
            this.method = sourceFrame.method;
            this.assembly = sourceFrame.assembly;
            this.fileName = sourceFrame.fileName;
            this.line = sourceFrame.line;
            this.sizeInBytes = 0;
        }

        this.sizeInBytes += this.method.length;
        this.sizeInBytes += this.fileName.length;
        this.sizeInBytes += this.assembly.length;

        // todo: these might need to be removed depending on how the back-end settles on their size calculation
        this.sizeInBytes += _StackFrame.baseSize;
        this.sizeInBytes += this.level.toString().length;
        this.sizeInBytes += this.line.toString().length;
    }

    public static CreateFromInterface(frame: IExceptionStackFrameInternal) {
        return new _StackFrame(frame, null /* level is available in frame interface */);
    }

    public toInterface() {
        return {
            level: this.level,
            method: this.method,
            assembly: this.assembly,
            fileName: this.fileName,
            line: this.line
        };
    }
}
