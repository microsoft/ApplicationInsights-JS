import { CustomErrorConstructor, createCustomError } from "@nevware21/ts-utils";
import { STR_EMPTY } from "../../JavaScriptSDK/InternalConstants";
import { OpenTelemetryError } from "./OTelError";

export interface OTelInvalidAttributeError extends OpenTelemetryError {
    readonly name: string;

    readonly value: any;
}

export interface OTelInvalidAttributeErrorConstructor extends CustomErrorConstructor<OTelInvalidAttributeError> {
    
    new (message?: string, name?: string, value?: any): OTelInvalidAttributeError;

    (message?: string, name?: string, value?: any): OTelInvalidAttributeError;
}


export const OTelInvalidAttributeError = createCustomError<OTelInvalidAttributeErrorConstructor>("OTelInvalidAttributeError", function (self, args) {
    let len = args.length;

    self.name = len > 1 ? args[1] : STR_EMPTY;
    self.value = len > 2 ? args[2] : STR_EMPTY;
});
