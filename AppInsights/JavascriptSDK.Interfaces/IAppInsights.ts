///<reference path="../node_modules/applicationinsights-common/bundle/applicationinsights-common.d.ts" />

import { ITelemetryContext } from "./ITelemetryContext";
import { SeverityLevel } from "applicationinsights-common";
import { IPageViewTelemetry } from "./IPageViewTelemetry";

export interface IAppInsights {
    trackPageView(pageView: IPageViewTelemetry);
}