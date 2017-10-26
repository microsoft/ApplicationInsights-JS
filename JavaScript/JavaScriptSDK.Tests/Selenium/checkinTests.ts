/// <reference path="../CheckinTests/appinsights.tests.ts" />
/// <reference path="../CheckinTests/context/HashCodeScoreGenerator.tests.ts" />
/// <reference path="../CheckinTests/context/sample.tests.ts" />
/// <reference path="../CheckinTests/context/user.tests.ts" />
/// <reference path="../CheckinTests/context/session.tests.ts" />

/// <reference path="../CheckinTests/telemetry/event.tests.ts" />
/// <reference path="../CheckinTests/telemetry/exception.tests.ts" />
/// <reference path="../CheckinTests/telemetry/metric.tests.ts" />
/// <reference path="../CheckinTests/telemetry/pageviewperformance.tests.ts" />
/// <reference path="../CheckinTests/telemetry/pageview.tests.ts" />
/// <reference path="../CheckinTests/telemetry/trace.tests.ts" />
/// <reference path="../CheckinTests/telemetry/RemoteDependency.tests.ts" />
/// <reference path="../CheckinTests/telemetry/DataSanitizer.tests.ts" />

/// <reference path="../CheckinTests/PageVisitTimeManager.tests.ts" />
/// <reference path="../CheckinTests/logging.tests.ts" />
/// <reference path="../CheckinTests/sender.tests.ts" />
/// <reference path="../CheckinTests/SendBuffer.tests.ts" />
/// <reference path="../CheckinTests/serializer.tests.ts" />
/// <reference path="../CheckinTests/telemetrycontext.tests.ts" />
/// <reference path="../CheckinTests/util.tests.ts" />
/// <reference path="../CheckinTests/initialization.tests.ts" />
/// <reference path="../CheckinTests/ajax.tests.ts" />
/// <reference path="../CheckinTests/SplitTest.tests.ts" />

/* import modules */
import AppInsightsModuleTests from "../CheckinTests/AppInsightsModule.Tests"

export default function registerTests() {
    /* for every module call registerTests() */
    new AppInsightsModuleTests().registerTests();
}
 
