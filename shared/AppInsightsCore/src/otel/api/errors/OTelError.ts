import { CustomErrorConstructor, createCustomError } from "@nevware21/ts-utils";

let otelErrorType: OpenTelemetryErrorConstructor;

export interface OpenTelemetryError extends Error {

}

export interface OpenTelemetryErrorConstructor<T extends Error = OpenTelemetryError> extends CustomErrorConstructor<T> {
    
    new (message?: string): T;

    (message?: string): T;
}


/*#__NO_SIDE_EFFECTS__*/
export function getOpenTelemetryError(): OpenTelemetryErrorConstructor {
    if (!otelErrorType) {
        otelErrorType = createCustomError<OpenTelemetryErrorConstructor>("OpenTelemetryError", function (self, args) {
        });
    }

    return otelErrorType;
}

export function throwOTelError(message: string): never {
    throw new (getOpenTelemetryError())(message);
}