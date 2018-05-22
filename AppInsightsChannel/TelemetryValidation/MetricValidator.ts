/// <reference path="./ITypeValidator.ts" />
module Microsoft.ApplicationInsights.Channel {
    "use strict";

    export class MetricValidator implements ITypeValidator {
        static MetricValidator = new MetricValidator();
        
        Validate(event: Core.ITelemetryItem): boolean {
            return false;
        }
    }
}