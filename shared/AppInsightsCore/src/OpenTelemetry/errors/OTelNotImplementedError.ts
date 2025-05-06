import { CustomErrorConstructor, createCustomError } from "@nevware21/ts-utils";
import { OpenTelemetryError } from "./OTelError";

export interface OTelNotImplementedError extends OpenTelemetryError {
}

export interface OTelNotImplementedErrorConstructor extends CustomErrorConstructor<OTelNotImplementedError> {
    
    new (message: string): OTelNotImplementedError;

    (message: string): OTelNotImplementedError;
}


export const OTelNotImplementedError = createCustomError<OTelNotImplementedErrorConstructor>("OTelNotImplementedError", function (self, args) {
    // Nothing special to do here
});

export function throwOTelNotImplementedError(message: string): void {
    throw new OTelNotImplementedError(message);
}

