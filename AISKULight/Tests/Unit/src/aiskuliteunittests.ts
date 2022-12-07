import { AISKULightSizeCheck } from "./AISKULightSize.Tests";
import { ApplicationInsightsConfigTests } from "./config.tests";

export function runTests() {
    new AISKULightSizeCheck().registerTests();
    new ApplicationInsightsConfigTests().registerTests();
}