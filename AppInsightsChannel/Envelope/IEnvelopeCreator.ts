/// <reference path="../../coreSDK/JavaScriptSDK.Interfaces/Telemetry/IEnvelope.ts" />

module Microsoft.ApplicationInsights.Channel {
    "use strict";

    export interface IEnvelopeCreator {
        Create(telemetryItem: Core.ITelemetryItem): IEnvelope;
    }
}