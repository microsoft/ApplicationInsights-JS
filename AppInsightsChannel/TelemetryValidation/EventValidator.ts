/// <reference path="./ITypeValidator.ts" />
module Microsoft.ApplicationInsights.Validator {
    "use strict";

    export class EventValidator implements ITypeValidator {
        static EventValidator = new EventValidator();
        
        Validate(event: Core.ITelemetryItem): boolean {
            return false;
        }
    }
}