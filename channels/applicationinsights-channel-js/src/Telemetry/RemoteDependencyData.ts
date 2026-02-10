// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    FieldType, IDiagnosticLogger, IRemoteDependencyData, ISerializable, dataSanitizeMeasurements, dataSanitizeProperties, dataSanitizeString,
    dataSanitizeUrl, msToTimeSpan, urlParseUrl
} from "@microsoft/otel-core-js";

export const RemoteDependencyEnvelopeType = "Microsoft.ApplicationInsights.{0}.RemoteDependency";

function AjaxHelperParseDependencyPath(logger: IDiagnosticLogger, absoluteUrl: string, method: string, commandName: string) {
    let target, name = commandName, data = commandName;

    if (absoluteUrl && absoluteUrl.length > 0) {
        const parsedUrl: HTMLAnchorElement = urlParseUrl(absoluteUrl);
        target = parsedUrl.host;
        if (!name) {
            if (parsedUrl.pathname != null) {
                let pathName: string = (parsedUrl.pathname.length === 0) ? "/" : parsedUrl.pathname;
                if (pathName.charAt(0) !== "/") {
                    pathName = "/" + pathName;
                }
                data = parsedUrl.pathname;
                name = dataSanitizeString(logger, method ? method + " " + pathName : pathName);
            } else {
                name = dataSanitizeString(logger, absoluteUrl);
            }
        }
    } else {
        target = commandName;
        name = commandName;
    }

    return {
        target,
        name,
        data
    };
}

export function createRemoteDependencyData(
    logger: IDiagnosticLogger, id: string, absoluteUrl: string, commandName: string, value: number, success: boolean,
    resultCode: number, method?: string, requestAPI: string = "Ajax", correlationContext?: string, properties?: Object,
    measurements?: Object) : IRemoteDependencyData & ISerializable {
    const dependencyFields = AjaxHelperParseDependencyPath(logger, absoluteUrl, method, commandName);

    let data: IRemoteDependencyData & ISerializable = {
        ver: 2,
        id: id,
        duration: msToTimeSpan(value),
        success: success,
        resultCode: "" + resultCode,
        type: dataSanitizeString(logger, requestAPI),
        data: dataSanitizeUrl(logger, commandName) || dependencyFields.data, // get a value from hosturl if commandName not available
        target: dataSanitizeString(logger, dependencyFields.target),
        name: dataSanitizeString(logger, dependencyFields.name),
        properties: dataSanitizeProperties(logger, properties),
        measurements: dataSanitizeMeasurements(logger, measurements),

        aiDataContract: {
            id: FieldType.Required,
            ver: FieldType.Required,
            name: FieldType.Default,
            resultCode: FieldType.Default,
            duration: FieldType.Default,
            success: FieldType.Default,
            data: FieldType.Default,
            target: FieldType.Default,
            type: FieldType.Default,
            properties: FieldType.Default,
            measurements: FieldType.Default,

            kind: FieldType.Default,
            value: FieldType.Default,
            count: FieldType.Default,
            min: FieldType.Default,
            max: FieldType.Default,
            stdDev: FieldType.Default,
            dependencyKind: FieldType.Default,
            dependencySource: FieldType.Default,
            commandName: FieldType.Default,
            dependencyTypeName: FieldType.Default
        }
    };

    if (correlationContext) {
        data.target = "" + data.target + " | " + correlationContext;
    }

    return data;
}
