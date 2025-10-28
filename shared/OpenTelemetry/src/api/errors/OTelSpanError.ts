import { createCustomError } from "@nevware21/ts-utils";
import { STR_EMPTY } from "../../internal/InternalConstants";
import { OpenTelemetryError, OpenTelemetryErrorConstructor, getOpenTelemetryError } from "./OTelError";

let otelSpanErrorType: OTelSpanErrorConstructor;

export interface OTelSpanError extends OpenTelemetryError {
    readonly spanName: string;
}

interface OTelSpanErrorConstructor extends OpenTelemetryErrorConstructor<OTelSpanError> {
    
    new (message?: string, spanName?: string): OTelSpanError;

    (message?: string, spanName?: string): OTelSpanError;
}

export function throwOTelSpanError(message: string, spanName: string): never {
    if (!otelSpanErrorType) {
        otelSpanErrorType = createCustomError<OTelSpanErrorConstructor>("OTelSpanError", (self, args) => {
            let len = args.length;

            self.spanName = len > 1 ? args[1] : STR_EMPTY;
        }, getOpenTelemetryError());
    }

    throw new otelSpanErrorType(message, spanName);
}
