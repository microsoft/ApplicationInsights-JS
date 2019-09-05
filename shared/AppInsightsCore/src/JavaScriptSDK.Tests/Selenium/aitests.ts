import { ApplicationInsightsCoreTests } from "./ApplicationInsightsCore.Tests";

export function runTests() {
    new ApplicationInsightsCoreTests().registerTests();
}