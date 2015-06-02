/// <reference path="../Contracts/Generated/ExceptionData.ts" />
/// <reference path="../Contracts/Generated/StackFrame.ts" />
/// <reference path="./Common/DataSanitizer.ts"/>

module Microsoft.ApplicationInsights.Telemetry {
    "use strict";

    export class Exception extends AI.ExceptionData implements ISerializable {

        public static envelopeType = "Microsoft.ApplicationInsights.Exception";
        public static dataType = "ExceptionData";

        
        public aiDataContract = {
            ver: true,
            handledAt: true,
            exceptions: true,
            severityLevel: false,
            properties: false,
            measurements: false
        }

        /**
        * Constructs a new isntance of the ExceptionTelemetry object
        */
        constructor(exception: Error, handledAt?: string, properties?: Object, measurements?: Object) {
            super();

            this.properties = ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeProperties(properties);
            this.measurements = ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeMeasurements(measurements);
            
            this.handledAt = handledAt || "unhandled";
            this.exceptions = [new _ExceptionDetails(exception)];
        }
        

        /**
        * Creates a simple exception with 1 stack frame. Useful for manual constracting of exception.
        */
        public static CreateSimpleException(message: string, typeName: string, assembly: string, fileName: string,
            details: string, line: number, handledAt?: string): Telemetry.Exception {

            // We can't override constructors, so throwing a fake error to use existing constructor and override all fields after that.
            var exceptionTelemetry;
            try {
                throw new Error();
            } catch (e) {
                exceptionTelemetry = new Telemetry.Exception(e);
            }
            
            var stack = exceptionTelemetry.exceptions[0].parsedStack[0];
            stack.assembly = assembly;
            stack.fileName = fileName;
            stack.level = 0;
            stack.line = line;
            stack.method = "unknown";

            var exception = exceptionTelemetry.exceptions[0];
            exception.hasFullStack = true;
            exception.message = message;
            exception.parsedStack = null;
            exception.stack = details;
            exception.typeName = typeName;
            exceptionTelemetry.handledAt = handledAt || "unhandled";            

            return exceptionTelemetry;
        }
    }

    class _ExceptionDetails extends AI.ExceptionDetails implements ISerializable {
        
        public aiDataContract = {
            id: false,
            outerId: false,
            typeName: true,
            message: true,
            hasFullStack: false,
            stack: false,
            parsedStack: []
        };
        
        constructor(exception: Error) {
            super();
            this.typeName = Common.DataSanitizer.sanitizeString(exception.name);
            this.message = Common.DataSanitizer.sanitizeMessage(exception.message);
            var stack = exception["stack"];
            this.parsedStack = this.parseStack(stack);
            this.stack = Common.DataSanitizer.sanitizeException(stack);
            this.hasFullStack = Util.isArray(this.parsedStack) && this.parsedStack.length > 0;
        }

        private parseStack(stack): _StackFrame[] {
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

    class _StackFrame extends AI.StackFrame implements ISerializable {
        
        // regex to match stack frames from ie/chrome/ff
        // methodName=$2, fileName=$4, lineNo=$5, column=$6
        public static regex = /^([\s]+at)?(.*?)(\@|\s\(|\s)([^\(\@\n]+):([0-9]+):([0-9]+)(\)?)$/;
        public static baseSize = 58; //'{"method":"","level":,"assembly":"","fileName":"","line":}'.length
        public sizeInBytes = 0;

        public aiDataContract = {
            level: true,
            method: true,
            assembly: false,
            fileName: false,
            line: false
        };

        constructor(frame: string, level: number) {
            super();
            this.level = level;
            this.method = "unavailable";
            this.assembly = Util.trim(frame);
            var matches = frame.match(_StackFrame.regex);
            if (matches && matches.length >= 5) {
                this.method = Util.trim(matches[2]);
                this.fileName = Util.trim(matches[4]);
                this.line = parseInt(matches[5]) || 0;
            }

            this.sizeInBytes += this.method.length;
            this.sizeInBytes += this.fileName.length;
            this.sizeInBytes += this.assembly.length;

            // todo: these might need to be removed depending on how the back-end settles on their size calculation
            this.sizeInBytes += _StackFrame.baseSize;
            this.sizeInBytes += this.level.toString().length;
            this.sizeInBytes += this.line.toString().length;
        }
    }
}