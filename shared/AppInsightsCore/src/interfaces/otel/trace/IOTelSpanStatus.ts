// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { eOTelSpanStatusCode } from "../../../enums/otel/OTelSpanStatus";

export interface IOTelSpanStatus {
    /**
     * The status code of this message.
     */
    code: eOTelSpanStatusCode;

    /**
     * A developer-facing error message.
     */
    message?: string;
}
