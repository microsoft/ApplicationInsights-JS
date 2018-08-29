/// <reference path="../CheckinTests/appInsights.tests.ts" />
/// <reference path="../CheckinTests/Context/HashCodeScoreGenerator.tests.ts" />
/// <reference path="../CheckinTests/Context/Sample.tests.ts" />
/// <reference path="../CheckinTests/Context/User.tests.ts" />
/// <reference path="../CheckinTests/Context/Session.tests.ts" />

/// <reference path="../CheckinTests/Telemetry/Event.tests.ts" />
/// <reference path="../CheckinTests/Telemetry/Exception.tests.ts" />
/// <reference path="../CheckinTests/Telemetry/Metric.tests.ts" />
/// <reference path="../CheckinTests/Telemetry/PageViewPerformance.tests.ts" />
/// <reference path="../CheckinTests/Telemetry/PageView.tests.ts" />
/// <reference path="../CheckinTests/Telemetry/Trace.tests.ts" />
/// <reference path="../CheckinTests/Telemetry/RemoteDependency.tests.ts" />
/// <reference path="../CheckinTests/Telemetry/DataSanitizer.tests.ts" />

/// <reference path="../CheckinTests/PageVisitTimeManager.tests.ts" />
/// <reference path="../CheckinTests/Logging.tests.ts" />
/// <reference path="../CheckinTests/Sender.tests.ts" />
/// <reference path="../CheckinTests/SendBuffer.tests.ts" />
/// <reference path="../CheckinTests/Serializer.tests.ts" />
/// <reference path="../CheckinTests/TelemetryContext.tests.ts" />
/// <reference path="../CheckinTests/Util.tests.ts" />
/// <reference path="../CheckinTests/Initialization.tests.ts" />
/// <reference path="../CheckinTests/ajax.tests.ts" />
/// <reference path="../CheckinTests/SplitTest.tests.ts" />
/// <reference path="../CheckinTests/CorrelationIdHelper.tests.ts" />

/* import modules */
import AppInsightsModuleTests from "../CheckinTests/AppInsightsModule.tests"

export default function registerTests() {
    /* for every module call registerTests() */
    new AppInsightsModuleTests().registerTests();
}
 
