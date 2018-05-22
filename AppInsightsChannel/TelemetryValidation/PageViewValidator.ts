/// <reference path="./ITypeValidator.ts" />
module Microsoft.ApplicationInsights.Channel {
    "use strict";

    export class PageViewValidator implements ITypeValidator {
        static PageViewValidator = new PageViewValidator();
        
        Validate(event: Core.ITelemetryItem): boolean {
            return false;
        }
    }
}