import { CustomErrorConstructor, createCustomError } from "@nevware21/ts-utils";

export interface OpenTelemetryError extends Error {

}

export interface OpenTelemetryErrorConstructor extends CustomErrorConstructor<OpenTelemetryError> {
    
    new (message?: string): OpenTelemetryError;

    (message?: string): OpenTelemetryError;
}


export const OpenTelemetryError = createCustomError<OpenTelemetryErrorConstructor>("OpenTelemetryError", function (self, args) {
    // Nothing special to do here for the base error
});
