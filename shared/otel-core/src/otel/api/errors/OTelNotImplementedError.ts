// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { createCustomError } from "@nevware21/ts-utils";
import { OpenTelemetryError, OpenTelemetryErrorConstructor, getOpenTelemetryError } from "./OTelError";

let otelNotImplementedErrorType: OTelNotImplementedErrorConstructor;

export interface OTelNotImplementedError extends OpenTelemetryError {
}

interface OTelNotImplementedErrorConstructor extends OpenTelemetryErrorConstructor<OTelNotImplementedError> {
    
    new (message: string): OTelNotImplementedError;

    (message: string): OTelNotImplementedError;
}


export function throwOTelNotImplementedError(message: string): void {

    if (!otelNotImplementedErrorType) {
        otelNotImplementedErrorType = createCustomError<OTelNotImplementedErrorConstructor>("OTelNotImplementedError", function (self, args) {
            // Nothing special to do here
        }, getOpenTelemetryError());
    }

    throw new otelNotImplementedErrorType(message);
}
