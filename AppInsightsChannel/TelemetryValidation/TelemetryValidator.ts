/// <reference path="./EventValidator.ts" />
/// <reference path="./TraceValidator.ts" />

module Microsoft.ApplicationInsights.Validator {

    "using strict";

    export class TelemetryValidator {
        public static Validate(envelope: Core.ITelemetryItem): boolean {
            // call the appropriate Validate depending on the baseType
            switch (envelope.baseType) {
                case "EventData":
                    return EventValidator.EventValidator.Validate(envelope);
                case "MessageData":
                    return TraceValidator.TraceValidator.Validate(envelope);
            }
            return false;
        }
    }
}