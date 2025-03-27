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
import { W3cTraceParentTests } from "./W3cTraceParentTests";
import { DynamicConfigTests } from "./DynamicConfig.Tests";
import { StatsBeatTests } from './StatsBeat.Tests';

export function runTests() {
    new GlobalTestHooks().registerTests();
    new DynamicTests().registerTests();
    new DynamicConfigTests().registerTests();
    new ApplicationInsightsCoreTests().registerTests();
    new CookieManagerTests(false).registerTests();
    new CookieManagerTests(true).registerTests();
    new HelperFuncTests().registerTests();
    new AppInsightsCoreSizeCheck().registerTests();
    new EventHelperTests().registerTests();
    new LoggingEnumTests().registerTests();
    new UpdateConfigTests().registerTests();
    new EventsDiscardedReasonTests().registerTests();
    new W3cTraceParentTests().registerTests();
    new StatsBeatTests(false).registerTests();
    new StatsBeatTests(true).registerTests();
}
