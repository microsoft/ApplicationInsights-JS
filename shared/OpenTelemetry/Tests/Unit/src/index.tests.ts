import { OTelApiTests } from "./api/OTelApi.Tests";
import { AttributeContainerTests } from "./attribute/AttributeContainer.Tests";
import { CommonUtilsTests } from "./internal/commonUtils.Tests";
import { SpanTests } from "./trace/span.Tests";
import { IOTelLoggerTests } from "./sdk/IOTelLogger.Tests";
import { IOTelLogRecordTests } from "./sdk/IOTelLogRecord.Tests";
import { IOTelLoggerProviderTests } from "./sdk/IOTelLoggerProvider.Tests";
import { IOTelMultiLogRecordProcessorTests } from "./sdk/IOTelMultiLogRecordProcessor.Tests";

export function runTests() {
    new OTelApiTests().registerTests();
    new AttributeContainerTests().registerTests();
    new CommonUtilsTests().registerTests();
    new SpanTests().registerTests();
    new IOTelLoggerTests().registerTests();
    new IOTelLogRecordTests().registerTests();
    new IOTelLoggerProviderTests().registerTests();
    new IOTelMultiLogRecordProcessorTests().registerTests();
}
