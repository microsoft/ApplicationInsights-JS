/// <reference path="./ITypeValidator.ts" />
module Microsoft.ApplicationInsights.Channel {
    "use strict";

    export class PageViewPerformanceValidator implements ITypeValidator {
        static PageViewPerformanceValidator = new PageViewPerformanceValidator();
        
        Validate(event: Core.ITelemetryItem): boolean {
            return false;
        }
    }
}