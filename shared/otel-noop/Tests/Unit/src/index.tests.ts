import { NoopOTelLoggerTests } from "./sdk/NoopOTelLogger.Tests";
// import { NoopOTelLoggerProviderTests } from "./sdk/NoopOTelLoggerProvider.Tests";

export function runTests() {
    new NoopOTelLoggerTests().registerTests();
    // new NoopOTelLoggerProviderTests().registerTests();
}
