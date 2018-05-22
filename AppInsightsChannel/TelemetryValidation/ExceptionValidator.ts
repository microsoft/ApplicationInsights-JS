/// <reference path="./ITypeValidator.ts" />
module Microsoft.ApplicationInsights.Channel {
    "use strict";

    export class ExceptionValidator implements ITypeValidator {
        static ExceptionValidator = new ExceptionValidator();
        
        Validate(event: Core.ITelemetryItem): boolean {
            return false;
        }
    }
}