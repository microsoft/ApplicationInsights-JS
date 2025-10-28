import '@microsoft/applicationinsights-shims';
import { ApplicationInsightsCoreTests } from "./ApplicationInsightsCore.Tests";
import { CookieManagerTests } from "./CookieManager.Tests";
import { GlobalTestHooks } from "./GlobalTestHooks.Test";
import { HelperFuncTests } from './HelperFunc.Tests';
import { AppInsightsCoreSizeCheck } from "./AppInsightsCoreSize.Tests";
import { EventHelperTests } from "./EventHelper.Tests";
import { LoggingEnumTests } from "./LoggingEnum.Tests";
import { DynamicTests } from "./Dynamic.Tests";
import { UpdateConfigTests } from "./UpdateConfig.Tests";
import { EventsDiscardedReasonTests } from "./EventsDiscardedReason.Tests";
import { DynamicConfigTests } from "./DynamicConfig.Tests";
import { SendPostManagerTests } from './SendPostManager.Tests';
// import { StatsBeatTests } from './StatsBeat.Tests';
import { OTelTraceApiTests } from './OpenTelemetry/traceState.Tests';
import { OpenTelemetryErrorsTests } from './OpenTelemetry/errors.Tests';
import { ThrottleMgrTest } from "./ThrottleMgr.tests";

export function runTests() {
    new GlobalTestHooks().registerTests();
    // TODO: Enable tests
    //new DynamicTests().registerTests();
    // TODO: Enable tests
    //new DynamicConfigTests().registerTests();
    // TODO: Enable tests
    //new ApplicationInsightsCoreTests().registerTests();
    new CookieManagerTests(false).registerTests();
    new CookieManagerTests(true).registerTests();
    new HelperFuncTests().registerTests();
    new AppInsightsCoreSizeCheck().registerTests();
    new EventHelperTests().registerTests();
    new LoggingEnumTests().registerTests();
    // TODO: Enable tests
    //new UpdateConfigTests().registerTests();
    new EventsDiscardedReasonTests().registerTests();
    new OTelTraceApiTests().registerTests();
    new OpenTelemetryErrorsTests().registerTests();
    // new StatsBeatTests(false).registerTests();
    // new StatsBeatTests(true).registerTests();
    new SendPostManagerTests().registerTests();
    new ThrottleMgrTest().registerTests();
}
