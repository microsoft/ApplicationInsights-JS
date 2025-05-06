import { CustomErrorConstructor, createCustomError } from "@nevware21/ts-utils";
import { STR_EMPTY } from "../../JavaScriptSDK/InternalConstants";
import { OpenTelemetryError } from "./OTelError";

export interface OTelSpanError extends OpenTelemetryError {
    readonly spanName: string;
}

export interface OTelSpanErrorConstructor extends CustomErrorConstructor<OTelSpanError> {
    
    new (message?: string, name?: string): OTelSpanError;

    (message?: string, name?: string): OTelSpanError;
}


export const OTelSpanError = createCustomError<OTelSpanErrorConstructor>("OTelInvalidAttributeError", function (self, args) {
    let len = args.length;

    self.spanName = len > 1 ? args[1] : STR_EMPTY;
});


export function throwOTelSpanError(message: string, spanName: string): never {
    throw new OTelSpanError(message, spanName);
}
