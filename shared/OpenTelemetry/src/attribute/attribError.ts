import { OTelInvalidAttributeError } from "@microsoft/applicationinsights-core-js";

export function throwAttributeError(message: string, key: string, value: any): never {
    throw new OTelInvalidAttributeError(message, key, value);
}

