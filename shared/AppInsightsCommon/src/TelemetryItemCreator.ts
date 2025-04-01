// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    IDiagnosticLogger, ITelemetryItem, isNullOrUndefined, objForEachKey, throwError, toISOString
} from "@microsoft/applicationinsights-core-js";
import { strIkey, strNotSpecified } from "./Constants";
import { dataSanitizeString } from "./Telemetry/Common/DataSanitizer";

/**
 * Create a telemetry item that the 1DS channel understands
 * @param item - domain specific properties; part B
 * @param baseType - telemetry item type. ie PageViewData
 * @param envelopeName - Name of the envelope, e.g., `Microsoft.ApplicationInsights.\<instrumentation key\>.PageView`.
 * @param customProperties - user defined custom properties; part C
 * @param systemProperties - system properties that are added to the context; part A
 * @returns ITelemetryItem that is sent to channel
 */

export function createTelemetryItem<T>(item: T,
    baseType: string,
    envelopeName: string,
    logger: IDiagnosticLogger,
    customProperties?: { [key: string]: any },
    systemProperties?: { [key: string]: any }): ITelemetryItem {

    envelopeName = dataSanitizeString(logger, envelopeName) || strNotSpecified;

    if (isNullOrUndefined(item) ||
        isNullOrUndefined(baseType) ||
        isNullOrUndefined(envelopeName)) {
        throwError("Input doesn't contain all required fields");
    }
    
    let iKey = "";
    if (item[strIkey]) {
        iKey = item[strIkey];
        delete item[strIkey];
    }

    const telemetryItem: ITelemetryItem = {
        name: envelopeName,
        time: toISOString(new Date()),
        iKey: iKey, // this will be set in TelemetryContext
        ext: systemProperties ? systemProperties : {}, // part A
        tags: [],
        data: {
        },
        baseType,
        baseData: item // Part B
    };

    // Part C
    if (!isNullOrUndefined(customProperties)) {
        objForEachKey(customProperties, (prop, value) => {
            telemetryItem.data[prop] = value;
        });
    }

    return telemetryItem;
}

export class TelemetryItemCreator {
    /**
     * Create a telemetry item that the 1DS channel understands
     * @param item - domain specific properties; part B
     * @param baseType - telemetry item type. ie PageViewData
     * @param envelopeName - Name of the envelope (e.g., Microsoft.ApplicationInsights.[instrumentationKey].PageView).
     * @param customProperties - user defined custom properties; part C
     * @param systemProperties - system properties that are added to the context; part A
     * @returns ITelemetryItem that is sent to channel
     */

     public static create = createTelemetryItem;
}
