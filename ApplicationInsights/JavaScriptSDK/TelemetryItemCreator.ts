import { PageView, IEnvelope } from "applicationinsights-common";
import { ITelemetryItem } from "applicationinsights-core-js";
import { CoreUtils } from "JavaScriptSDK/CoreUtils";

export interface ITelemetryItemCreator {
    create(env: IEnvelope) : ITelemetryItem
}

export class TelemetryItemCreator implements ITelemetryItemCreator {

    private static creator = new TelemetryItemCreator();
    public static createItem(env: IEnvelope): ITelemetryItem {
        if (CoreUtils.isNullOrUndefined(env)) {
            throw Error("Invalid envelope");
        };

        return TelemetryItemCreator.creator.create(env);
    }

    create(env: IEnvelope): ITelemetryItem {
        if (env.data.baseType === PageView.dataType) {
            let item: ITelemetryItem = {
                name: env.name,
                timestamp: new Date(env.time),
                baseType: env.data.baseType,
                instrumentationKey: env.iKey
            }

            item.sytemProperties = {};
            item.sytemProperties["ver"] = 2;
            if (env.tags) {
               for (var property in env.tags) {
                   if (env.tags.hasOwnProperty(property)) {
                   
                   item.sytemProperties[property] = env.tags[property]; // part A
                   }
               }
           }

            if (!CoreUtils.isNullOrUndefined(env.data) && !CoreUtils.isNullOrUndefined(env.data.baseData)) {
                item.domainProperties = {};
                item.domainProperties["name"] = env.data.baseData.name;
                item.domainProperties["url"] = env.data.baseData.url;
                item.domainProperties["duration"] = env.data.baseData.duration;
                item.domainProperties["id"] = env.data.baseData.id;
                item.customProperties = {};

                    let data = env.data as PageView;
                    let props = data.properties;
                    if (!CoreUtils.isNullOrUndefined(props)) {
                        for (var prop1 in props) {
                            if (props.hasOwnProperty(prop1)) {
                                item.customProperties[prop1] = props[prop1]; // part C
                            }
                        }
                    }
                    
                    let measurements = data.measurements;
                    if (!CoreUtils.isNullOrUndefined(measurements)) {
                        for (var prop2 in measurements) {
                            if (measurements.hasOwnProperty(prop2)) {
                                item.customProperties[prop2] = measurements[prop2]; // part C
                            }
                        }
                    }
                }

            return item;
        }

        throw Error("Not implemented");
    }
}