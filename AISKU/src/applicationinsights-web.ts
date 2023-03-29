export {
    IApplicationInsights,
    Snippet,
    Initialization as ApplicationInsights,
    Telemetry
} from "./Initialization";

export { ApplicationInsightsContainer } from "./ApplicationInsightsContainer";
export { IAppInsightsDeprecated } from "./ApplicationInsightsDeprecated";

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
    BaseCore,
    CoreUtils, ICoreUtils
} from "@microsoft/applicationinsights-core-js";
export {
    Util, IUtil,
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
    ICorrelationIdHelper, IUrlHelper, IDateTimeUtils, IRequestHeaders
} from "@microsoft/applicationinsights-common";
export { Sender } from "@microsoft/applicationinsights-channel-js";
export { ApplicationInsights as ApplicationAnalytics, IAppInsightsInternal } from "@microsoft/applicationinsights-analytics-js";
export { PropertiesPlugin } from "@microsoft/applicationinsights-properties-js";
export {
    AjaxPlugin as DependenciesPlugin, IDependenciesPlugin,
    DependencyListenerFunction, DependencyInitializerFunction, IDependencyInitializerHandler, IDependencyListenerHandler
} from "@microsoft/applicationinsights-dependencies-js";
