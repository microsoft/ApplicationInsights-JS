// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Util } from "./Util";
import { DataSanitizer } from "./Telemetry/Common/DataSanitizer";
import { ITelemetryItem, CoreUtils, IDiagnosticLogger } from "@microsoft/applicationinsights-core-js";

export class TelemetryItemCreator {

    /**
     * Create a telemetry item that the 1DS channel understands
     * @param item domain specific properties; part B
     * @param baseType telemetry item type. ie PageViewData
     * @param envelopeName name of the envelope. ie Microsoft.ApplicationInsights.<instrumentation key>.PageView
     * @param customProperties user defined custom properties; part C
     * @param systemProperties system properties that are added to the context; part A
     * @returns ITelemetryItem that is sent to channel
     */

    public static create<T>(item: T,
        baseType: string,
        envelopeName: string,
        logger: IDiagnosticLogger,
        customProperties?: { [key: string]: any },
        systemProperties?: { [key: string]: any }): ITelemetryItem {

        envelopeName = DataSanitizer.sanitizeString(logger, envelopeName) || Util.NotSpecified;

        if (CoreUtils.isNullOrUndefined(item) ||
            CoreUtils.isNullOrUndefined(baseType) ||
            CoreUtils.isNullOrUndefined(envelopeName)) {
                throw Error("Input doesn't contain all required fields");
        }

        const telemetryItem: ITelemetryItem = {
            name: envelopeName,
            time: new Date().toISOString(),
            iKey: "", // this will be set in TelemetryContext
            ext: systemProperties ? systemProperties : {}, // part A
            tags: [],
            data: {
            },
            baseType,
            baseData: item // Part B
        };

        // Part C
        if (!CoreUtils.isNullOrUndefined(customProperties)) {
            for (const prop in customProperties) {
                if (customProperties.hasOwnProperty(prop)) {
                    telemetryItem.data[prop] = customProperties[prop];
                }
            }
        }

        return telemetryItem;
    }
}
