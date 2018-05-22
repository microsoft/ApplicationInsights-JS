/// <reference path="./ITypeValidator.ts" />
module Microsoft.ApplicationInsights.Channel {
    "use strict";

    export class TraceValidator implements ITypeValidator {
        static TraceValidator = new TraceValidator();
        
        Validate(event: Core.ITelemetryItem): boolean {
            return false;
        }
    }
}