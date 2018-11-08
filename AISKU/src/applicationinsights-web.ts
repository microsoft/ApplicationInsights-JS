export { 
    Initialization as ApplicationInsights,
    IApplicationInsights,
    Snippet
} from './Initialization';


export { IConfiguration, AppInsightsCore, IAppInsightsCore, LoggingSeverity, _InternalMessageId, ITelemetryItem } from "@microsoft/applicationinsights-core-js";
export { ApplicationInsights as ApplicationAnalytics } from "@microsoft/applicationinsights-analytics-js";
export { Util, IConfig, IDependencyTelemetry, PageViewPerformance, IPageViewPerformanceTelemetry, IPageViewTelemetry, IExceptionTelemetry, IAutoExceptionTelemetry, ITraceTelemetry, IMetricTelemetry, IEventTelemetry, IAppInsights } from "@microsoft/applicationinsights-common";
export { Sender } from "@microsoft/applicationinsights-channel-js";
export { PropertiesPlugin, IPropertiesPlugin } from "@microsoft/applicationinsights-properties-js";
export { AjaxPlugin as DependenciesPlugin, IDependenciesPlugin } from '@microsoft/applicationinsights-dependencies-js';
