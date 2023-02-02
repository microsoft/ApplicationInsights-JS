import { AISKULightSizeCheck } from "./AISKULightSize.Tests";
import { ApplicationInsightsDynamicConfigTests } from "./dynamicconfig.tests";
import { ApplicationInsightsConfigTests } from "./config.tests";

export function runTests() {
    new AISKULightSizeCheck().registerTests();
    new ApplicationInsightsDynamicConfigTests().registerTests();
    new ApplicationInsightsConfigTests().registerTests();
}