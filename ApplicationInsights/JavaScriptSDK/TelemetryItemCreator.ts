import { PageView, IEnvelope, Util, DataSanitizer } from "applicationinsights-common";
import { ITelemetryItem, CoreUtils } from "applicationinsights-core-js";
import { IPageViewTelemetryInternal } from "../JavaScriptSDK.Interfaces/IPageViewTelemetry";

export interface ITelemetryItemCreator {
    create(pageView: IPageViewTelemetryInternal, baseType: string, envelopeName: string, customProperties?: { [key: string]: any }): ITelemetryItem
}

export class TelemetryItemCreator implements ITelemetryItemCreator {
    private static creator = new TelemetryItemCreator();

    public static createItem(pageView: IPageViewTelemetryInternal, baseType: string, envelopeName: string, customProperties?: { [key: string]: any }, systemProperties?: { [key: string]: any }): ITelemetryItem {
        if (CoreUtils.isNullOrUndefined(pageView) ||
            CoreUtils.isNullOrUndefined(baseType) ||
            CoreUtils.isNullOrUndefined(envelopeName)) {
            throw Error("pageView doesn't contain all required fields");
        };

        return TelemetryItemCreator.creator.create(pageView, baseType, envelopeName, customProperties, systemProperties);
    }

    create(pageView: IPageViewTelemetryInternal, baseType: string, envelopeName: string, customProperties?: { [key: string]: any }, systemProperties?: { [key: string]: any }): ITelemetryItem {
        envelopeName = DataSanitizer.sanitizeString(envelopeName) || Util.NotSpecified;
        if (baseType === PageView.dataType) {
            let item: ITelemetryItem = {
                name: envelopeName,
                timestamp: new Date(),
                instrumentationKey: "", // this will be set in TelemetryContext
                ctx: systemProperties ? systemProperties : {},
                tags: [],
                data: {
                },
                baseType: baseType,
                baseData: pageView
            };

            // Part C
            if (!CoreUtils.isNullOrUndefined(customProperties)) {
                for (var prop in customProperties) {
                    if (customProperties.hasOwnProperty(prop)) {
                        item.data[prop] = customProperties[prop];
                    }
                }
            }

            return item;
        }

        throw Error("Not implemented");
    }
}