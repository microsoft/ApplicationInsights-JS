import { OTelApiTests } from "./api/OTelApi.Tests";
import { AttributeContainerTests } from "./attribute/AttributeContainer.Tests";
import { CommonUtilsTests } from "./internal/commonUtils.Tests";
import { SpanTests } from "./trace/span.Tests";
import { OTelLoggerTests } from "./sdk/OTelLogger.Tests";
import { OTelLogRecordTests } from "./sdk/OTelLogRecord.Tests";
import { OTelLoggerProviderTests } from "./sdk/OTelLoggerProvider.Tests";
import { OTelMultiLogRecordProcessorTests } from "./sdk/OTelMultiLogRecordProcessor.Tests";

export function runTests() {
    new OTelApiTests().registerTests();
    new AttributeContainerTests().registerTests();
    new CommonUtilsTests().registerTests();
    new SpanTests().registerTests();
    new OTelLoggerTests().registerTests();
    new OTelLogRecordTests().registerTests();
    new OTelLoggerProviderTests().registerTests();
    new OTelMultiLogRecordProcessorTests().registerTests();
}
