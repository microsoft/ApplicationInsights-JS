import '@microsoft/applicationinsights-shims';
import { ApplicationInsightsCoreTests } from "./ApplicationInsightsCore.Tests";

export function runTests() {
    new ApplicationInsightsCoreTests().registerTests();
}