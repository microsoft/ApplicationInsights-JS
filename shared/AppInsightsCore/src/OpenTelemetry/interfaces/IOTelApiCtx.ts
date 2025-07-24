import { IAppInsightsCore } from "../../JavaScriptSDK.Interfaces/IAppInsightsCore";
import { IOTelConfig } from "./config/IOTelConfig";

/**
 * The context for the current IOTelApi instance and it's configuration
 */
export interface IOTelApiCtx {
    core: IAppInsightsCore;

    otelCfg: IOTelConfig;
}
