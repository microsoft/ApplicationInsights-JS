/// <reference path="../coreSDK/JavaScriptSDK.Interfaces/Telemetry/IEnvelope.ts" />
/// <reference path="../coreSDK/JavaScriptSDK/Telemetry/Common/Data.ts" />
/// <reference path="../coreSDK/JavaScriptSDK/Telemetry/Common/Envelope.ts" />
/// <reference path="../coreSDK/JavaScriptSDK/Telemetry/RemoteDependencyData.ts" />
/// <reference path="../coreSDK/JavaScriptSDK/Telemetry/Event.ts" />
/// <reference path="../coreSDK/JavaScriptSDK/Telemetry/Exception.ts" />
/// <reference path="../coreSDK/JavaScriptSDK/Telemetry/Metric.ts" />
/// <reference path="../coreSDK/JavaScriptSDK/Telemetry/PageView.ts" />
/// <reference path="../coreSDK/JavaScriptSDK/Telemetry/PageViewPerformance.ts" />
/// <reference path="../coreSDK/JavaScriptSDK/Telemetry/Trace.ts" />

module Microsoft.ApplicationInsights.Channel {// todo barustum
    "use strict";

    export abstract class EnvelopeCreator {
        abstract Create(telemetryItem: Core.ITelemetryItem): IEnvelope;

        protected static extractMeasurements(properties: { [key: string]: any }): { [key: string]: any } {
            let customMeasurements: { [key: string]: any } = null;
            for (let key in properties) {
                if (properties.hasOwnProperty(key)) {
                    let value = properties[key];
                    if (value instanceof Number) {
                        if (!customMeasurements) {
                            customMeasurements = {};
                        }
                        customMeasurements[key] = value;
                    }
                }
            }

            return customMeasurements;
        }

        protected static createEnvelope<T>(envelopeType: string, telemetryItem: Core.ITelemetryItem, data: Telemetry.Common.Data<T>):IEnvelope {
            let envelope = new Telemetry.Common.Envelope(data, Telemetry.Event.envelopeType);
            envelope.iKey = telemetryItem.iKey;
            let iKeyNoDashes = telemetryItem.iKey.replace(/-/g, "");
            envelope.name = envelope.name.replace("{0}", iKeyNoDashes);

            // loop through the envelope systemProperties and pick out the ones that should go in tags
            for (let key in telemetryItem.sytemProperties) {
                if (telemetryItem.sytemProperties.hasOwnProperty(key)) {
                    if (/*this key exists in the whitelist of ContextTagKeys*/ true) {// todo barustum
                        envelope.tags[key] = telemetryItem.sytemProperties[key];
                    }
                }
            }

            return envelope;
        }
    }

    export class DependencyEnvelopeCreator extends EnvelopeCreator {
        static DependencyEnvelopeCreator = new DependencyEnvelopeCreator();

        Create(telemetryItem: Core.ITelemetryItem): IEnvelope {
            let customMeasurements = EnvelopeCreator.extractMeasurements(telemetryItem.customProperties);
            let id = telemetryItem.domainProperties["id"];
            let absoluteUrl = telemetryItem.domainProperties["absoluteUrl"];
            let command = telemetryItem.domainProperties["command"];
            let totalTime = telemetryItem.domainProperties["totalTime"];
            let success = telemetryItem.domainProperties["success"];
            let resultCode = telemetryItem.domainProperties["resultCode"];
            let method = telemetryItem.domainProperties["method"];
            let baseData = new Telemetry.RemoteDependencyData(id, absoluteUrl, command, totalTime, success, resultCode, method, telemetryItem.customProperties, customMeasurements);
            let data = new Telemetry.Common.Data<Telemetry.RemoteDependencyData>(Telemetry.RemoteDependencyData.dataType, baseData);
            return EnvelopeCreator.createEnvelope<Telemetry.RemoteDependencyData>(Telemetry.RemoteDependencyData.envelopeType, telemetryItem, data);
        }
    }

    export class EventEnvelopeCreator extends EnvelopeCreator {
        static EventEnvelopeCreator = new EventEnvelopeCreator();

        Create(telemetryItem: Core.ITelemetryItem): IEnvelope {
            let customMeasurements = EnvelopeCreator.extractMeasurements(telemetryItem.customProperties);
            let eventName = telemetryItem.domainProperties["name"];
            let baseData = new Telemetry.Event(eventName, telemetryItem.customProperties, customMeasurements);
            let data = new Telemetry.Common.Data<Telemetry.Event>(Telemetry.Event.dataType, baseData);
            return EnvelopeCreator.createEnvelope<Telemetry.Event>(Telemetry.Event.envelopeType, telemetryItem, data);
        }
    }

    export class ExceptionEnvelopeCreator extends EnvelopeCreator {
        static ExceptionEnvelopeCreator = new ExceptionEnvelopeCreator();
        
        Create(telemetryItem: Core.ITelemetryItem): IEnvelope {
            let customMeasurements = EnvelopeCreator.extractMeasurements(telemetryItem.customProperties);
            let exception = telemetryItem.domainProperties["exception"];
            let severityLevel = telemetryItem.domainProperties["severityLevel"];
            let baseData = new Telemetry.Exception(exception, telemetryItem.customProperties, customMeasurements, severityLevel);
            let data = new Telemetry.Common.Data<Telemetry.Exception>(Telemetry.Exception.dataType, baseData);
            return EnvelopeCreator.createEnvelope<Telemetry.Exception>(Telemetry.Exception.envelopeType, telemetryItem, data);
        }
    }

    export class MetricEnvelopeCreator extends EnvelopeCreator {
        static MetricEnvelopeCreator = new MetricEnvelopeCreator();
        
        Create(telemetryItem: Core.ITelemetryItem): IEnvelope {
            let name = telemetryItem.domainProperties["name"];
            let average = telemetryItem.domainProperties["average"];
            let sampleCount = telemetryItem.domainProperties["sampleCount"];
            let min = telemetryItem.domainProperties["min"];
            let max = telemetryItem.domainProperties["max"];
            let baseData = new Telemetry.Metric(name, average, sampleCount, min, max, telemetryItem.customProperties);
            let data = new Telemetry.Common.Data<Telemetry.Metric>(Telemetry.Metric.dataType, baseData);
            return EnvelopeCreator.createEnvelope<Telemetry.Metric>(Telemetry.Metric.envelopeType, telemetryItem, data);
        }
    }

    export class PageViewEnvelopeCreator extends EnvelopeCreator {
        static PageViewEnvelopeCreator = new PageViewEnvelopeCreator();
        
        Create(telemetryItem: Core.ITelemetryItem): IEnvelope {
            let customMeasurements = EnvelopeCreator.extractMeasurements(telemetryItem.customProperties);
            let name = telemetryItem.domainProperties["name"];
            let url = telemetryItem.domainProperties["url"];
            let duration = telemetryItem.domainProperties["duration"];
            let baseData = new Telemetry.PageView(name, url, duration, telemetryItem.customProperties, customMeasurements);
            let data = new Telemetry.Common.Data<Telemetry.PageView>(Telemetry.PageView.dataType, baseData);
            return EnvelopeCreator.createEnvelope<Telemetry.PageView>(Telemetry.PageView.envelopeType, telemetryItem, data);
        }
    }

    export class PageViewPerformanceEnvelopeCreator extends EnvelopeCreator {
        static PageViewPerformanceEnvelopeCreator = new PageViewPerformanceEnvelopeCreator();
        
        Create(telemetryItem: Core.ITelemetryItem): IEnvelope {
            let customMeasurements = EnvelopeCreator.extractMeasurements(telemetryItem.customProperties);
            let name = telemetryItem.domainProperties["name"];
            let url = telemetryItem.domainProperties["url"];
            let duration = telemetryItem.domainProperties["duration"];
            let baseData = new Telemetry.PageViewPerformance(name, url, duration, telemetryItem.customProperties, customMeasurements);
            let data = new Telemetry.Common.Data<Telemetry.PageViewPerformance>(Telemetry.PageViewPerformance.dataType, baseData);
            return EnvelopeCreator.createEnvelope<Telemetry.PageViewPerformance>(Telemetry.PageViewPerformance.envelopeType, telemetryItem, data);
        }
    }

    export class TraceEnvelopeCreator extends EnvelopeCreator {
        static TraceEnvelopeCreator = new TraceEnvelopeCreator();
        
        Create(telemetryItem: Core.ITelemetryItem): IEnvelope {
            let message = telemetryItem.domainProperties["message"];
            let severityLevel = telemetryItem.domainProperties["severityLevel"];
            let baseData = new Telemetry.Trace(message, telemetryItem.customProperties, severityLevel);
            let data = new Telemetry.Common.Data<Telemetry.Trace>(Telemetry.Trace.dataType, baseData);
            return EnvelopeCreator.createEnvelope<Telemetry.Trace>(Telemetry.Trace.envelopeType, telemetryItem, data);
        }
    }
}