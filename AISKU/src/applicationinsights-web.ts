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
    eLoggingSeverity,
    _InternalMessageId,
    _eInternalMessageId,
    ITelemetryItem,
    ITelemetryPlugin,
    IPerfEvent,
    IPerfManager,
    IPerfManagerProvider,
    PerfEvent,
    PerfManager,
    doPerf,
    INotificationListener,
    NotificationManager,
    IPlugin,
    IDiagnosticLogger,
    BaseTelemetryPlugin,
    ITelemetryPluginChain,
    ICustomProperties,
    INotificationManager,
    IProcessTelemetryContext,
    Tags,
    BaseCore
} from "@microsoft/applicationinsights-core-js";
export {
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
    eSeverityLevel,
    Event,
    Exception,
    Metric,
    PageView,
    PageViewPerformance,
    RemoteDependencyData,
    Trace,
    DistributedTracingModes,
    IRequestHeaders
} from "@microsoft/applicationinsights-common";
export { Sender } from "@microsoft/applicationinsights-channel-js";
export { ApplicationInsights as ApplicationAnalytics, IAppInsightsInternal } from "@microsoft/applicationinsights-analytics-js";
export { PropertiesPlugin } from "@microsoft/applicationinsights-properties-js";
export { AjaxPlugin as DependenciesPlugin, IDependenciesPlugin } from "@microsoft/applicationinsights-dependencies-js";
