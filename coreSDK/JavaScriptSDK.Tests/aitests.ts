import { ApplicationInsightsCoreTests } from "./Selenium/ApplicationInsightsCore.Tests";

export function runTests() {
    new ApplicationInsightsCoreTests().registerTests();
}