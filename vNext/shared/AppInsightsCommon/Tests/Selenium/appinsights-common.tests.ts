import { ApplicationInsightsTests } from '../AppInsightsCommon.tests';

export function runTests() {
    new ApplicationInsightsTests().registerTests();
}
