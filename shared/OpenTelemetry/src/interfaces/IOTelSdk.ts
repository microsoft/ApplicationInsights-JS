import { BaseTelemetryPlugin, IOTelConfig, IOTelTracerProvider } from "@microsoft/applicationinsights-core-js";
import { IOTelApi } from "./IOtelApi";

export interface IOTelSdk extends BaseTelemetryPlugin, IOTelTracerProvider {
    cfg: IOTelConfig;

    api: IOTelApi
}
