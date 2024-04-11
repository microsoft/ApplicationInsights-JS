import { AISKULightSizeCheck } from "./AISKULightSize.Tests";
import { ApplicationInsightsDynamicConfigTests } from "./dynamicconfig.tests";
import { ApplicationInsightsConfigTests } from "./config.tests";
import { GlobalTestHooks } from "./GlobalTestHooks.Test";

export function runTests() {
    new GlobalTestHooks().registerTests();
    new AISKULightSizeCheck().registerTests();
    new ApplicationInsightsDynamicConfigTests().registerTests();
    new ApplicationInsightsConfigTests().registerTests();
}