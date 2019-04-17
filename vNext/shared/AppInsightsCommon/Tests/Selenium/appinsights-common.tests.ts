import { ApplicationInsightsTests } from '../AppInsightsCommon.tests';
import { ExceptionTests } from '../Exception.tests';

export function runTests() {
    new ApplicationInsightsTests().registerTests();
    new ExceptionTests().registerTests();
}
