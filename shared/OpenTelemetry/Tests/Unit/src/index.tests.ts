import { OTelApiTests } from "./api/OTelApi.Tests";
import { AttributeContainerTests } from "./attribute/AttributeContainer.Tests";
import { CommonUtilsTests } from "./internal/commonUtils.Tests";
import { SpanTests } from "./trace/span.Tests";

export function runTests() {
    new OTelApiTests().registerTests();
    new AttributeContainerTests().registerTests();
    new CommonUtilsTests().registerTests();
    new SpanTests().registerTests();
}
