import { ITelemetryContext } from "./ITelemetryContext";
import { SeverityLevel } from "applicationinsights-common";
import { IPageViewTelemetry } from "./IPageViewTelemetry";

export interface IAppInsights {
    trackPageView(pageView: IPageViewTelemetry);
}