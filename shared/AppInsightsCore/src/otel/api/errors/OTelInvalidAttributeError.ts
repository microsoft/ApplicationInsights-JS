import { createCustomError } from "@nevware21/ts-utils";
import { STR_EMPTY } from "../../../constants/InternalConstants";
import { OpenTelemetryError, OpenTelemetryErrorConstructor, getOpenTelemetryError } from "./OTelError";

let otelInvalidAttributeErrorType: OTelInvalidAttributeErrorConstructor;

export interface OTelInvalidAttributeError extends OpenTelemetryError {
    readonly attribName: string;

    readonly value: any;
}

interface OTelInvalidAttributeErrorConstructor extends OpenTelemetryErrorConstructor<OTelInvalidAttributeError> {
    
    new (message?: string, attribName?: string, value?: any): OTelInvalidAttributeError;

    (message?: string, attribName?: string, value?: any): OTelInvalidAttributeError;
}

export function throwOTelInvalidAttributeError(message: string, attribName: string, value: any): void {
    if (!otelInvalidAttributeErrorType) {
        otelInvalidAttributeErrorType = createCustomError<OTelInvalidAttributeErrorConstructor>("OTelInvalidAttributeError", function (self, args) {
            let len = args.length;

            self.attribName = len > 1 ? args[1] : STR_EMPTY;
            self.value = len > 2 ? args[2] : STR_EMPTY;
        }, getOpenTelemetryError());
    }

    throw new otelInvalidAttributeErrorType(message, attribName, value);
}
