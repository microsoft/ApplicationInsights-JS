import { PageView, IEnvelope } from "AppInsightsCommon/applicationinsights-common";
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
        

        if (env.name === PageView.envelopeType) {
            let item: ITelemetryItem = {
                name: env.name,
                timestamp: new Date(env.time),
                baseType: PageView.envelopeType,
                instrumentationKey: env.iKey
            }

            if (env.tags) {
                for (var key in env.tags) {
                    if (env.tags.hasOwnProperty(key)) {
                        item.sytemProperties[key] = env.tags[key]; // part A
                    }
                }
            }

                let data = env.data as PageView;
                if (!CoreUtils.isNullOrUndefined(data)) {
                    item.domainProperties["name"] = env.data.name;
                    item.domainProperties["url"] = env.data.url;
                    item.domainProperties["duration"] = env.data.duration;
                    item.domainProperties["id"] = env.data.id;

                    let props = data.properties;
                    if (!CoreUtils.isNullOrUndefined(props)) {
                        for (var key in props) {
                            if (props.hasOwnProperty(key)) {
                                item.customProperties[key] = props[key]; // part C
                            }
                        }
                    }
                    
                    let measurements = data.measurements;
                    if (!CoreUtils.isNullOrUndefined(measurements)) {
                        for (var key in measurements) {
                            if (measurements.hasOwnProperty(key)) {
                                item.customProperties[key] = measurements[key]; // part C
                            }
                        }
                    }
                }

            return item;
        }

        throw Error("Not implemented");
    }
}