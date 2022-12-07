import { AISKULightSizeCheck } from "./AISKULightSize.Tests";
import { ApplicationInsightsDynamicConfigTests } from "./dynamicconfig.tests";

export function runTests() {
    new AISKULightSizeCheck().registerTests();
    new ApplicationInsightsDynamicConfigTests().registerTests();
}