import { OTelApiTests } from "./api/OTelApi.Tests";
import { AttributeContainerTests } from "./attribute/AttributeContainer.Tests";
import { CommonUtilsTests } from "./internal/commonUtils.Tests";
import { SpanTests } from "./trace/span.Tests";
import { OTelLogRecordTests } from "./sdk/OTelLogRecord.Tests";
import { OTelMultiLogRecordProcessorTests } from "./sdk/OTelMultiLogRecordProcessor.Tests";

// AppInsightsCommon tests
import { ApplicationInsightsTests } from "./ai/Common/AppInsightsCommon.tests";
import { ExceptionTests } from "./ai/Common/Exception.tests";
import { UtilTests } from "./ai/Common/Util.tests";
import { ConnectionStringParserTests } from "./ai/Common/ConnectionStringParser.tests";
import { SeverityLevelTests } from "./ai/Common/SeverityLevel.tests";
import { RequestHeadersTests } from "./ai/Common/RequestHeaders.tests";
import { W3CTraceStateModesTests } from "./ai/Common/W3CTraceStateModes.tests";
import { W3cTraceParentTests } from "./ai/Common/W3cTraceParentTests";

export function runTests() {
    // OTel tests
    new OTelApiTests().registerTests();
    new AttributeContainerTests().registerTests();
    new CommonUtilsTests().registerTests();
    new SpanTests().registerTests();
    new OTelLogRecordTests().registerTests();
    new OTelMultiLogRecordProcessorTests().registerTests();

    // AppInsightsCommon tests
    new ApplicationInsightsTests().registerTests();
    new ExceptionTests().registerTests();
    new UtilTests().registerTests();
    new ConnectionStringParserTests().registerTests();
    new SeverityLevelTests().registerTests();
    new RequestHeadersTests().registerTests();
    new W3CTraceStateModesTests().registerTests();
    new W3cTraceParentTests().registerTests();
}
