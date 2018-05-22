/// <reference path="./ITypeValidator.ts" />
module Microsoft.ApplicationInsights.Channel {
    "use strict";

    export class RemoteDepdencyValidator implements ITypeValidator {
        static RemoteDepdencyValidator = new RemoteDepdencyValidator();
        
        Validate(event: Core.ITelemetryItem): boolean {
            return false;
        }
    }
}