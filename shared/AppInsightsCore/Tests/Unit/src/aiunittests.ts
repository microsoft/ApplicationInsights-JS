import '@microsoft/applicationinsights-shims';
import { ApplicationInsightsCoreTests } from "./ApplicationInsightsCore.Tests";
import { CookieManagerTests } from "./CookieManager.Tests";
import { GlobalTestHooks } from "./GlobalTestHooks.Test";
import { HelperFuncTests } from './HelperFunc.Tests';
import { AppInsightsCoreSizeCheck } from "./AppInsightsCoreSize.Tests";
import { EventHelperTests } from "./EventHelper.Tests";
import { LoggingEnumTests } from "./LoggingEnum.Tests";
import { DynamicTests } from "./Dynamic.Tests";
import { UpdateConfigTests } from "./UpdateConfig.Tests";
import { EventsDiscardedReasonTests } from "./EventsDiscardedReason.Tests";
import { W3cTraceParentTests } from "./W3cTraceParentTests";
import { DynamicConfigTests } from "./DynamicConfig.Tests";
import { SendPostManagerTests } from './SendPostManager.Tests';
// import { StatsBeatTests } from './StatsBeat.Tests';
import { OTelTraceApiTests } from './OpenTelemetry/traceState.Tests';
import { CommonUtilsTests } from './OpenTelemetry/commonUtils.Tests';
import { OpenTelemetryErrorsTests } from './OpenTelemetry/errors.Tests';
import { SpanTests } from './OpenTelemetry/span.Tests';
import { AttributeContainerTests } from './OpenTelemetry/attributeContainer.Tests';
import { W3cTraceStateTests } from './W3TraceState.Tests';
import { OTelNegativeTests } from './OpenTelemetry/otelNegative.Tests';
import { TraceUtilsTests } from './OpenTelemetry/traceUtils.Tests';

// Application Insights Common tests (merged from AppInsightsCommon)
import { ApplicationInsightsTests } from './Common/AppInsightsCommon.tests';
import { ConnectionStringParserTests } from './Common/ConnectionStringParser.tests';
import { ExceptionTests } from './Common/Exception.tests';
import { RequestHeadersTests } from './Common/RequestHeaders.tests';
import { SeverityLevelTests } from './Common/SeverityLevel.tests';
import { ThrottleMgrTest } from './Common/ThrottleMgr.tests';
import { UtilTests } from './Common/Util.tests';
import { W3CTraceStateModesTests } from './Common/W3CTraceStateModes.tests';

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
