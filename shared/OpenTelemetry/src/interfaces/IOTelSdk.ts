
import { IOTelApi } from "./IOTelApi";
import { IOTelConfig } from "./config/IOTelConfig";
import { IOTelTracerProvider } from "./trace/IOTelTracerProvider";

export interface IOTelSdk extends IOTelTracerProvider {
    cfg: IOTelConfig;

    api: IOTelApi
}
