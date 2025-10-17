// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    IBackendResponse, IDiagnosticLogger, _eInternalMessageId, eLoggingSeverity, getJSON
} from "@microsoft/applicationinsights-common";
import { dumpObj } from "@nevware21/ts-utils";
import { _throwInternal } from "../Diagnostics/DiagnosticLogger";
import { STR_EMPTY } from "../InternalConstants";

/**
 * Parses the response from the backend.
 * @param response - XMLHttpRequest or XDomainRequest response
 */
export function parseResponse(response: any, diagLog?: IDiagnosticLogger): IBackendResponse {
    try {
        if (response && response !== STR_EMPTY) {
            const result = getJSON().parse(response);

            if (result && result.itemsReceived && result.itemsReceived >= result.itemsAccepted &&
                result.itemsReceived - result.itemsAccepted === result.errors.length) {
                return result;
            }
        }
    } catch (e) {
        _throwInternal(diagLog,
            eLoggingSeverity.CRITICAL,
            _eInternalMessageId.InvalidBackendResponse,
            "Cannot parse the response. " + (e.name || dumpObj(e)),
            {
                response
            });
    }

    return null;
}
