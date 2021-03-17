import '@microsoft/applicationinsights-shims';
import { ApplicationInsightsCoreTests } from "./ApplicationInsightsCore.Tests";
import { CookieManagerTests } from "./CookieManager.Tests";
import { CorePerfCheckTests } from './CorePerfCheck.Tests';
import { HelperFuncTests } from './HelperFunc.Tests';

export function runTests() {
    new ApplicationInsightsCoreTests().registerTests();
    new CookieManagerTests(false).registerTests();
    new CookieManagerTests(true).registerTests();
    new CorePerfCheckTests().registerTests();
    new HelperFuncTests().registerTests();
}