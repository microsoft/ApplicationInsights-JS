import { ApplicationInsightsTests } from '../AppInsightsCommon.tests';
import { ExceptionTests } from '../Exception.tests';
import { UtilTests } from '../Util.tests';

export function runTests() {
    new ApplicationInsightsTests().registerTests();
    new ExceptionTests().registerTests();
    new UtilTests().registerTests();
}
