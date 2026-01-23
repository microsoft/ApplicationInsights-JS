// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { createEnumStyle } from "../../../JavaScriptSDK.Enums/EnumHelperFuncs";

/**
 * An enumeration of status codes, matching the OpenTelemetry specification.
 *
 * @since 3.4.0
 */
export const enum eOTelSpanStatusCode {
    /**
     * The default status.
     */
    UNSET = 0,
    /**
     * The operation has been validated by an Application developer or
     * Operator to have completed successfully.
     */
    OK = 1,
    /**
     * The operation contains an error.
     */
    ERROR = 2,
}
  

export const OTelSpanStatusCode = (/* @__PURE__ */createEnumStyle<typeof eOTelSpanStatusCode>({
    UNSET: eOTelSpanStatusCode.UNSET,
    OK: eOTelSpanStatusCode.OK,
    ERROR: eOTelSpanStatusCode.ERROR
}));

export type OTelSpanStatusCode = number | eOTelSpanStatusCode;
