module Microsoft.ApplicationInsights.Validator {
    "use strict";

    export interface ITypeValidator {
        Validate(event: Core.ITelemetryItem): boolean;
    }
}