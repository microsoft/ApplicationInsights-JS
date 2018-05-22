module Microsoft.ApplicationInsights.Channel {
    "use strict";

    export interface ITypeValidator {
        Validate(event: Core.ITelemetryItem): boolean;
    }
}