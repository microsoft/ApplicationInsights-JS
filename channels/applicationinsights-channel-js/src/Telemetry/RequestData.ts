// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    FieldType, IDiagnosticLogger, ISerializable, asString, dataSanitizeMeasurements, dataSanitizeProperties, dataSanitizeString,
    dataSanitizeUrl, msToTimeSpan
} from "@microsoft/otel-core-js";
import { IRequestData } from "../Interfaces/Contracts/IRequestData";

export const RequestEnvelopeType = "Microsoft.ApplicationInsights.{0}.Request";

/**
 * Constructs a new instance of the RequestData object
 */
export function createRequestData(logger: IDiagnosticLogger, id: string, name: string | undefined, value: number, success: boolean, responseCode: number, source?: string, url?: string, properties?: Object, measurements?: Object): IRequestData & ISerializable {
    return {
        ver: 2,
        id: id,
        name: dataSanitizeString(logger, name),
        duration: msToTimeSpan(value),
        success: success,
        responseCode: asString(responseCode || "0"),
        source: dataSanitizeString(logger, source),
        url: dataSanitizeUrl(logger, url),
        properties: dataSanitizeProperties(logger, properties),
        measurements: dataSanitizeMeasurements(logger, measurements),
        aiDataContract: {
            id: FieldType.Required,
            ver: FieldType.Required,
            name: FieldType.Default,
            responseCode: FieldType.Required,
            duration: FieldType.Required,
            success: FieldType.Required,
            source: FieldType.Default,
            url: FieldType.Default,
            properties: FieldType.Default,
            measurements: FieldType.Default
        }
    };
}
