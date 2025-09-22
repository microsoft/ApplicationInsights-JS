export { Snippet } from "./Snippet";
export { IApplicationInsights } from "./IApplicationInsights";
export { AppInsightsSku as ApplicationInsights } from "./AISku";

export { ApplicationInsightsContainer } from "./ApplicationInsightsContainer";

// OpenTelemetry trace API exports (public interfaces only)
export { IOTelTracerProvider, IOTelTracer } from "@microsoft/applicationinsights-core-js";

// Re-exports
export {
    IConfiguration,
    AppInsightsCore,
    IAppInsightsCore,
    LoggingSeverity,
    eLoggingSeverity,
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
    ILoadedPlugin,
    IOTelSpan,
    SpanKind,
    SpanOptions
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
    IRequestHeaders,
    EventPersistence
} from "@microsoft/applicationinsights-common";
export { Sender, ISenderConfig } from "@microsoft/applicationinsights-channel-js";
export { ApplicationInsights as ApplicationAnalytics, IAppInsightsInternal, IAnalyticsConfig } from "@microsoft/applicationinsights-analytics-js";
export { PropertiesPlugin } from "@microsoft/applicationinsights-properties-js";
export {
    AjaxPlugin as DependenciesPlugin, IDependenciesPlugin,
    DependencyListenerFunction, DependencyInitializerFunction, IDependencyInitializerHandler, IDependencyListenerHandler
} from "@microsoft/applicationinsights-dependencies-js";

export { CfgSyncPlugin, ICfgSyncPlugin, ICfgSyncConfig, ICfgSyncEvent, ICfgSyncMode, NonOverrideCfg, OnCompleteCallback, SendGetFunction
} from "@microsoft/applicationinsights-cfgsync-js";

