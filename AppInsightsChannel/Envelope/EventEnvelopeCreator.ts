/// <reference path="./IEnvelopeCreator.ts" />
/// <reference path="../../coreSDK/JavaScriptSDK.Interfaces/Telemetry/IEnvelope.ts" />
/// <reference path="../../coreSDK/JavaScriptSDK/Telemetry/Event.ts" />
/// <reference path="../../coreSDK/JavaScriptSDK/Telemetry/Common/Data.ts" />
/// <reference path="../../coreSDK/JavaScriptSDK/Telemetry/Common/Envelope.ts" />

module Microsoft.ApplicationInsights.Channel {
    "use strict";
    
    export class EventEnvelopeCreator implements IEnvelopeCreator {
        static EventEnvelopeCreator = new EventEnvelopeCreator();
        
        Create(telemetryItem: Core.ITelemetryItem): IEnvelope {
            // extract any custom measurements from the customProperties object
            let customMeasurements: { [key: string]: any } = {};
            let measurementExists = false;
            for (let key in telemetryItem.customProperties) {
                if (telemetryItem.customProperties.hasOwnProperty(key)) {
                    let value = telemetryItem.customProperties[key];
                    if (value instanceof Number) {
                        customMeasurements[key] = value;
                        measurementExists = true;
                    }
                }
            }

            let baseData = new Telemetry.Event(telemetryItem.domainProperties[name], telemetryItem.customProperties, measurementExists ? customMeasurements : null);
            let data = new Telemetry.Common.Data<Telemetry.Event>(Telemetry.Event.dataType, baseData);
            let envelope = new Telemetry.Common.Envelope(data, Telemetry.Event.envelopeType);
            envelope.iKey = telemetryItem.iKey;
            let iKeyNoDashes = telemetryItem.iKey.replace(/-/g, "");
            envelope.name = envelope.name.replace("{0}", iKeyNoDashes);

            // loop through the envelope systemProperties and pick out the ones that should go in tags
            for (let key in telemetryItem.sytemProperties) {
                if (telemetryItem.sytemProperties.hasOwnProperty(key)) {
                    if (/*this key exists in the whitelist of ContextTagKeys*/ true) {
                        envelope.tags[key] = telemetryItem.sytemProperties[key];
                    }
                }
            }

            return envelope;
        }
    }
}