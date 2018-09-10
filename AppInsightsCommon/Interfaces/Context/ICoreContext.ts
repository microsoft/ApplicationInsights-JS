import { IAppInsightsCore } from "applicationinsights-core-js";
import IDiagnosticLogger from "applicationinsights-core-js/bundle/JavaScriptSDK.Interfaces/IDiagnosticLogger";

export interface ICoreContext {
    readonly core : IAppInsightsCore;
    readonly logger: IDiagnosticLogger;
}
