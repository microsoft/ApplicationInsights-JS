import { IPageViewTelemetry } from "./IPageViewTelemetry";

export interface IAppInsights {
    trackPageView(pageView: IPageViewTelemetry);
}