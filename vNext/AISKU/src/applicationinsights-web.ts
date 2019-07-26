export {
    IApplicationInsights,
    Snippet,
    Initialization as ApplicationInsights
} from "./Initialization";

export { ApplicationInsightsContainer } from "./ApplicationInsightsContainer";

// Re-exports
export {
    IConfiguration,
    AppInsightsCore,
    IAppInsightsCore,
    LoggingSeverity,
    _InternalMessageId,
    ITelemetryItem,
    ITelemetryPlugin
} from "@microsoft/applicationinsights-core-js";
export {
    Util,
    IConfig,
    IDependencyTelemetry,
    IPageViewPerformanceTelemetry,
    IPageViewTelemetry,
    IExceptionTelemetry,
    IAutoExceptionTelemetry,
    ITraceTelemetry,
    IMetricTelemetry,
    IEventTelemetry,
    IAppInsights,
    SeverityLevel,
    Event,
    Exception,
    Metric,
    PageView,
    PageViewPerformance,
    RemoteDependencyData,
    Trace,
    DistributedTracingModes
} from "@microsoft/applicationinsights-common";
export { Sender } from "@microsoft/applicationinsights-channel-js";
export { ApplicationInsights as ApplicationAnalytics } from "@microsoft/applicationinsights-analytics-js";
export { PropertiesPlugin } from "@microsoft/applicationinsights-properties-js";
export { AjaxPlugin as DependenciesPlugin, IDependenciesPlugin } from "@microsoft/applicationinsights-dependencies-js";
