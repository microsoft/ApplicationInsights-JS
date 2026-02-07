import "@microsoft/applicationinsights-shims";
import { ApplicationInsightsCoreTests } from "./ai/ApplicationInsightsCore.Tests";
import { CookieManagerTests } from "./ai/CookieManager.Tests";
import { GlobalTestHooks } from "./ai/GlobalTestHooks.Test";
import { HelperFuncTests } from "./ai/HelperFunc.Tests";
import { AppInsightsCoreSizeCheck } from "./ai/AppInsightsCoreSize.Tests";
import { EventHelperTests } from "./ai/EventHelper.Tests";
import { LoggingEnumTests } from "./ai/LoggingEnum.Tests";
import { DynamicTests } from "./config/Dynamic.Tests";
import { UpdateConfigTests } from "./ai/UpdateConfig.Tests";
import { EventsDiscardedReasonTests } from "./ai/EventsDiscardedReason.Tests";
import { W3cTraceParentTests } from "./trace/W3cTraceParentTests";
import { DynamicConfigTests } from "./config/DynamicConfig.Tests";
import { SendPostManagerTests } from "./ai/SendPostManager.Tests";
// import { StatsBeatTests } from "./StatsBeat.Tests";
import { OTelTraceApiTests } from "./trace/traceState.Tests";
import { CommonUtilsTests } from "./OpenTelemetry/commonUtils.Tests";
import { OpenTelemetryErrorsTests } from "./OpenTelemetry/errors.Tests";
import { SpanTests } from "./trace/span.Tests";
import { AttributeContainerTests } from "./attribute/attributeContainer.Tests";
import { W3cTraceStateTests } from "./trace/W3cTraceState.Tests";
import { OTelNegativeTests } from "./OpenTelemetry/otelNegative.Tests";
import { TraceUtilsTests } from "./trace/traceUtils.Tests";

// Application Insights Common tests (merged from AppInsightsCommon)
import { ApplicationInsightsTests } from "./ai/AppInsightsCommon.tests";
import { ConnectionStringParserTests } from "./ai/ConnectionStringParser.tests";
import { ExceptionTests } from "./ai/Exception.tests";
import { RequestHeadersTests } from "./ai/RequestHeaders.tests";
import { SeverityLevelTests } from "./ai/SeverityLevel.tests";
import { ThrottleMgrTest } from "./ai/ThrottleMgr.tests";
import { UtilTests } from "./ai/Util.tests";
import { W3CTraceStateModesTests } from "./trace/W3CTraceStateModes.tests";

export function runTests() {
    new GlobalTestHooks().registerTests();
    new DynamicTests().registerTests();
    new DynamicConfigTests().registerTests();
    new ApplicationInsightsCoreTests().registerTests();
    new CookieManagerTests(false).registerTests();
    new CookieManagerTests(true).registerTests();
    new HelperFuncTests().registerTests();
    new AppInsightsCoreSizeCheck().registerTests();
    new EventHelperTests().registerTests();
    new LoggingEnumTests().registerTests();
    new UpdateConfigTests().registerTests();
    new EventsDiscardedReasonTests().registerTests();
    new W3cTraceParentTests().registerTests();
    new OTelTraceApiTests().registerTests();
    new CommonUtilsTests().registerTests();
    new OpenTelemetryErrorsTests().registerTests();
    new SpanTests().registerTests();
    new AttributeContainerTests().registerTests();
    new W3cTraceStateTests().registerTests();
    new TraceUtilsTests().registerTests();
    new OTelNegativeTests().registerTests();
    // new StatsBeatTests(false).registerTests();
    // new StatsBeatTests(true).registerTests();
    new SendPostManagerTests().registerTests();

    // Application Insights Common tests (merged from AppInsightsCommon)
    new ApplicationInsightsTests().registerTests();
    new ConnectionStringParserTests().registerTests();
    new ExceptionTests().registerTests();
    new RequestHeadersTests().registerTests();
    new SeverityLevelTests().registerTests();
    new ThrottleMgrTest().registerTests();
    new UtilTests().registerTests();
    new W3CTraceStateModesTests().registerTests();
}
