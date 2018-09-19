import { Util, DataSanitizer, PageViewPerformance } from "applicationinsights-common";
import { IDiagnosticLogger, ITelemetryItem, CoreUtils } from "applicationinsights-core-js";
import { IPageViewTelemetryInternal } from "../JavaScriptSDK.Interfaces/IPageViewTelemetry";
import { IExceptionTelemetry, IAutoExceptionTelemetry } from "../JavaScriptSDK.Interfaces/IExceptionTelemetry";
import { ITraceTelemetry } from "../JavaScriptSDK.Interfaces/ITraceTelemetry";

export type supportedTelemetryItemTypes = IPageViewTelemetryInternal | PageViewPerformance | IExceptionTelemetry | IAutoExceptionTelemetry | ITraceTelemetry;

export interface ITelemetryItemCreator {
    create(logger: IDiagnosticLogger, item: supportedTelemetryItemTypes, baseType: string, envelopeName: string, customProperties?: { [key: string]: any }): ITelemetryItem
}

export class TelemetryItemCreator implements ITelemetryItemCreator {
    private static creator = new TelemetryItemCreator();

    /**
     * A wrapper for telemetry item create. Ensures valid parameters
     * @param item domain specific properties; part B
     * @param baseType telemetry item type. ie PageViewData
     * @param envelopeName name of the envelope. ie Microsoft.ApplicationInsights.<instrumentation key>.PageView
     * @param customProperties user defined custom properties; part C
     * @param systemProperties system properties that are added to the context; part A
     * @returns ITelemetryItem that is sent to channel
     */
    public static createItem(logger: IDiagnosticLogger,
        item: supportedTelemetryItemTypes,
        baseType: string,
        envelopeName: string,
        customProperties?: { [key: string]: any },
        systemProperties?: { [key: string]: any }): ITelemetryItem {
        if (CoreUtils.isNullOrUndefined(item) ||
            CoreUtils.isNullOrUndefined(baseType) ||
            CoreUtils.isNullOrUndefined(envelopeName)) {
            throw Error("pageView doesn't contain all required fields");
        };

        return TelemetryItemCreator.creator.create(logger, item, baseType, envelopeName, customProperties, systemProperties);
    }

    /**
     * Create a telemetry item that the 1DS channel understands
     * @param item domain specific properties; part B
     * @param baseType telemetry item type. ie PageViewData
     * @param envelopeName name of the envelope. ie Microsoft.ApplicationInsights.<instrumentation key>.PageView
     * @param customProperties user defined custom properties; part C
     * @param systemProperties system properties that are added to the context; part A
     * @returns ITelemetryItem that is sent to channel
     */
    create(logger: IDiagnosticLogger,
        item: supportedTelemetryItemTypes,
        baseType: string,
        envelopeName: string,
        customProperties?: { [key: string]: any },
        systemProperties?: { [key: string]: any }): ITelemetryItem {
        envelopeName = DataSanitizer.sanitizeString(logger, envelopeName) || Util.NotSpecified;

        let telemetryItem: ITelemetryItem = {
            name: envelopeName,
            timestamp: new Date(),
            instrumentationKey: "", // this will be set in TelemetryContext
            ctx: systemProperties ? systemProperties : {},
            tags: [],
            data: {
            },
            baseType: baseType,
            baseData: item
        };

        // Part C
        if (!CoreUtils.isNullOrUndefined(customProperties)) {
            for (var prop in customProperties) {
                if (customProperties.hasOwnProperty(prop)) {
                    telemetryItem.data[prop] = customProperties[prop];
                }
            }
        }

        return telemetryItem;
    }
}