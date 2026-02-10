import { OTelApiTests } from "./api/OTelApi.Tests";
import { AttributeContainerTests } from "./attribute/AttributeContainer.Tests";
import { HandleErrorsTests } from "./internal/handleErrors.Tests";
import { SpanTests } from "./trace/span.Tests";
// import { OTelLogRecordTests } from "./sdk/OTelLogRecord.Tests";
import { OTelMultiLogRecordProcessorTests } from "./sdk/OTelMultiLogRecordProcessor.Tests";
import { CommonUtilsTests } from "./sdk/commonUtils.Tests";
import { OpenTelemetryErrorsTests } from "./ai/errors.Tests";
import { OTelTraceApiTests } from "./trace/traceState.Tests";

// AppInsightsCommon tests
import { ApplicationInsightsTests } from "./ai/AppInsightsCommon.tests";
import { ExceptionTests } from "./ai/Exception.tests";
import { UtilTests } from "./ai/Util.tests";
import { ConnectionStringParserTests } from "./ai/ConnectionStringParser.tests";
import { SeverityLevelTests } from "./ai/SeverityLevel.tests";
import { RequestHeadersTests } from "./ai/RequestHeaders.tests";
import { W3CTraceStateModesTests } from "./trace/W3CTraceStateModes.tests";
import { ThrottleMgrTest } from "./ai/ThrottleMgr.tests";
import { W3cTraceParentTests } from "./trace/W3cTraceParentTests";
import { W3cTraceStateTests } from "./trace/W3cTraceState.Tests";

import { ApplicationInsightsCoreTests } from "./ai/ApplicationInsightsCore.Tests";
import { CookieManagerTests } from "./ai/CookieManager.Tests";
import { GlobalTestHooks } from "./ai/GlobalTestHooks.Test";
import { HelperFuncTests } from "./ai/HelperFunc.Tests";
import { OTelCoreSizeCheck } from "./sdk/OTelCoreSize.Tests";
import { EventHelperTests } from "./ai/EventHelper.Tests";
import { LoggingEnumTests } from "./ai/LoggingEnum.Tests";
import { DynamicTests } from "./config/Dynamic.Tests";
import { UpdateConfigTests } from "./ai/UpdateConfig.Tests";
import { EventsDiscardedReasonTests } from "./ai/EventsDiscardedReason.Tests";
import { DynamicConfigTests } from "./config/DynamicConfig.Tests";
import { SendPostManagerTests } from "./ai/SendPostManager.Tests";
// import { StatsBeatTests } from "./StatsBeat.Tests";
import { TraceUtilsTests } from "./trace/traceUtils.Tests";


export function runTests() {
    // OTel tests
    new OTelApiTests().registerTests();
    new AttributeContainerTests().registerTests();
    new HandleErrorsTests().registerTests();
    new SpanTests().registerTests();
    // new OTelLogRecordTests().registerTests();
    new OTelMultiLogRecordProcessorTests().registerTests();
    new CommonUtilsTests().registerTests();
    new OpenTelemetryErrorsTests().registerTests();
    new OTelTraceApiTests().registerTests();

    new GlobalTestHooks().registerTests();
    new DynamicTests().registerTests();
    new DynamicConfigTests().registerTests();
    new ApplicationInsightsCoreTests().registerTests();
    new CookieManagerTests(false).registerTests();
    new CookieManagerTests(true).registerTests();
    new HelperFuncTests().registerTests();
    new OTelCoreSizeCheck().registerTests();
    new EventHelperTests().registerTests();
    new LoggingEnumTests().registerTests();
    new UpdateConfigTests().registerTests();
    new EventsDiscardedReasonTests().registerTests();
    new W3cTraceParentTests().registerTests();
    // new OTelTraceApiTests().registerTests();
    // new CommonUtilsTests().registerTests();
    // new OpenTelemetryErrorsTests().registerTests();
    // new SpanTests().registerTests();
    // new AttributeContainerTests().registerTests();
    new W3cTraceStateTests().registerTests();
    new TraceUtilsTests().registerTests();
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
