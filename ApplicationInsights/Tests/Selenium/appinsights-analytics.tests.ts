import { ApplicationInsightsTests } from '../ApplicationInsights.tests';

export function runTests() {
    new ApplicationInsightsTests().registerTests();
}