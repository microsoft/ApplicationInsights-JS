import { OTelLoggerTests } from "./sdk/OTelLogger.Tests";
import { OTelLoggerProviderTests } from "./sdk/OTelLoggerProvider.Tests";

export function runTests() {
    new OTelLoggerTests().registerTests();
    new OTelLoggerProviderTests().registerTests();
}
